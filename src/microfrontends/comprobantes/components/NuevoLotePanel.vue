<script setup>
import { ref, computed, onUnmounted } from 'vue'
import { FileSpreadsheet, X, Upload, Loader2, Download, Inbox, RotateCcw } from 'lucide-vue-next'
import Button from '@/shared/components/Button.vue'
import Badge from '@/shared/components/Badge.vue'
import Alert from '@/shared/components/Alert.vue'
import Checkbox from '@/shared/components/Checkbox.vue'
import RfcBreakdown from '@/microfrontends/comprobantes/components/RfcBreakdown.vue'
import BatchRecordTable from '@/microfrontends/comprobantes/components/BatchRecordTable.vue'
import { useAuthStore } from '@/shared/stores/auth'
import { useToastStore } from '@/shared/stores/toast'
import { analyzeLoadFile, createBatch, getBatch, retryBatchErrors } from '@/services/batches.service'
import { formatDateTime, formatNumber } from '@/shared/utils/format'

const props = defineProps({
  tenantId: { type: Number, required: true },
  disabled: { type: Boolean, default: false },
})

const authStore = useAuthStore()
const toastStore = useToastStore()

const step = ref('upload')
const file = ref(null)
const isDragging = ref(false)
const fileInput = ref(null)
const analyzing = ref(false)
const analysis = ref(null)
const skipErrors = ref(true)
const batch = ref(null)
const isCreating = ref(false)
const isRetrying = ref(false)
const polling = ref(false)
let pollTimer = null

const maxFileBytes = 10 * 1024 * 1024
const validExtensions = ['xlsx', 'csv', 'txt']

const knownCount = computed(() => analysis.value?.rfcs.filter(r => r.known).length || 0)
const unknownCount = computed(() => analysis.value?.rfcs.filter(r => !r.known).length || 0)
const progressPercent = computed(() => {
  if (!batch.value?.totalRecords) return 0
  return Math.round((batch.value.processedCount / batch.value.totalRecords) * 100)
})
const retryableCount = computed(() => batch.value?.records.filter(r => r.status === 'error' && r.retryable).length || 0)
const batchStatusBadge = computed(() => {
  const map = {
    procesando: { variant: 'info', label: 'Procesando…' },
    completada: { variant: 'success', label: 'Completada' },
    completada_con_errores: { variant: 'warning', label: 'Con errores' },
    fallida: { variant: 'danger', label: 'Fallida' },
  }
  return map[batch.value?.status] || { variant: 'neutral', label: batch.value?.status || '—' }
})

function extensionOf(name) {
  const parts = String(name || '').split('.')
  return parts.length > 1 ? parts.pop().toLowerCase() : ''
}

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

function setFile(selected) {
  const ext = extensionOf(selected.name)
  if (!validExtensions.includes(ext)) {
    toastStore.error('Formato no permitido. Usa .xlsx, .csv o .txt')
    return
  }
  if (selected.size > maxFileBytes) {
    toastStore.error('El archivo supera el máximo de 10 MB')
    return
  }
  if (selected.size === 0) {
    toastStore.error('El archivo está vacío')
    return
  }
  file.value = selected
  analysis.value = null
}

function onFileChange(event) {
  const selected = event.target.files?.[0]
  if (selected) setFile(selected)
  event.target.value = ''
}

function onDrop(event) {
  isDragging.value = false
  if (props.disabled) return
  const selected = event.dataTransfer?.files?.[0]
  if (selected) setFile(selected)
}

function clearFile() {
  file.value = null
  analysis.value = null
}

function openPicker() {
  if (!props.disabled) fileInput.value?.click()
}

async function handleAnalyze() {
  if (!file.value) return
  analyzing.value = true
  const res = await analyzeLoadFile({ tenantId: props.tenantId, fileName: file.value.name, fileSize: file.value.size })
  if (res.ok) {
    analysis.value = res.data
    step.value = 'review'
  } else {
    toastStore.error(res.message)
  }
  analyzing.value = false
}

async function handleProcess() {
  if (!file.value || !analysis.value?.canProcess) return
  isCreating.value = true
  const res = await createBatch({
    tenantId: props.tenantId,
    fileName: file.value.name,
    fileSize: file.value.size,
    skipErrors: skipErrors.value,
    createdBy: authStore.user?.name || 'Desconocido',
  })
  if (res.ok) {
    batch.value = res.data
    step.value = 'result'
    startPolling()
    toastStore.success(res.message)
  } else {
    toastStore.error(res.message)
  }
  isCreating.value = false
}

function startPolling() {
  stopPolling()
  polling.value = true
  pollTimer = setInterval(async () => {
    if (!batch.value) return stopPolling()
    const res = await getBatch(batch.value.id)
    if (!res.ok) {
      toastStore.error(res.message)
      stopPolling()
      return
    }
    batch.value = res.data
    if (batch.value.status !== 'procesando') stopPolling()
  }, 500)
}

function stopPolling() {
  polling.value = false
  if (pollTimer) {
    clearInterval(pollTimer)
    pollTimer = null
  }
}

async function handleRetry() {
  if (!batch.value) return
  isRetrying.value = true
  const res = await retryBatchErrors(batch.value.id)
  if (res.ok) {
    batch.value = res.data
    toastStore.success(res.message)
  } else {
    toastStore.error(res.message)
  }
  isRetrying.value = false
}

function resetWizard() {
  stopPolling()
  file.value = null
  analysis.value = null
  batch.value = null
  skipErrors.value = true
  step.value = 'upload'
}

function downloadTemplate() {
  const rows = [
    'RFC_EMPRESA,CURP,NOMBRE,PERIODO,TOTAL_PERCEPCIONES,TOTAL_DEDUCCIONES,NETO_A_PAGAR',
    'EMP123456789,PEPJ900101HDFRRN09,Juan Pérez,2024-04,20000,4000,16000',
    'TEC987654321,GOMM850512MDFRRN05,María González,2024-04,32000,8000,24000',
  ]
  const blob = new Blob(['\uFEFF' + rows.join('\r\n')], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = 'plantilla_carga_masiva.csv'
  link.click()
  URL.revokeObjectURL(url)
  toastStore.info('Plantilla descargada')
}

onUnmounted(stopPolling)
</script>

<template>
  <div>
    <!-- Paso 1: carga del archivo -->
    <div v-if="step === 'upload'" class="space-y-4">
      <div
        role="button"
        tabindex="0"
        :aria-disabled="disabled"
        :aria-label="disabled ? 'Cuenta suspendida: carga deshabilitada' : 'Arrastra un archivo o presiona para seleccionarlo'"
        :class="[
          'rounded-2xl border-2 border-dashed px-6 py-10 text-center transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)]',
          disabled ? 'border-neutral-200 bg-neutral-50 cursor-not-allowed opacity-70' : isDragging ? 'border-primary-400 bg-primary-50' : 'border-neutral-300 hover:border-primary-400 hover:bg-primary-50/40 cursor-pointer',
        ]"
        @click="openPicker"
        @keydown.enter.prevent="openPicker"
        @keydown.space.prevent="openPicker"
        @dragover.prevent="isDragging = true"
        @dragleave.prevent="isDragging = false"
        @drop.prevent="onDrop"
      >
        <Upload class="w-10 h-10 mx-auto text-primary-500" aria-hidden="true" />
        <p class="mt-3 font-semibold text-ink">Arrastra tu archivo aquí o haz clic para seleccionarlo</p>
        <p class="mt-1 text-xs text-ink-muted">Formatos: .xlsx, .csv, .txt · Máx. 10 MB · N RFC emisores por lote</p>
        <input ref="fileInput" type="file" class="sr-only" accept=".xlsx,.csv,.txt" @change="onFileChange" />
      </div>

      <div v-if="file" class="flex items-center gap-3 rounded-xl border border-neutral-200 px-4 py-3">
        <FileSpreadsheet class="w-8 h-8 text-teal-600 flex-shrink-0" aria-hidden="true" />
        <div class="min-w-0 flex-1">
          <p class="text-sm font-semibold text-ink truncate">{{ file.name }}</p>
          <p class="text-xs text-ink-muted">{{ formatSize(file.size) }}</p>
        </div>
        <Button variant="ghost" size="sm" :icon="X" aria-label="Quitar archivo" @click="clearFile" />
      </div>

      <div class="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          class="inline-flex items-center gap-2 text-sm font-medium text-primary-600 hover:text-primary-700 rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)]"
          @click="downloadTemplate"
        >
          <Download class="w-4 h-4" aria-hidden="true" />
          Descargar plantilla (CSV)
        </button>
        <Button variant="primary" :icon="FileSpreadsheet" :loading="analyzing" :disabled="!file || disabled" @click="handleAnalyze">
          Analizar archivo
        </Button>
      </div>
    </div>

    <!-- Paso 2: análisis y confirmación -->
    <div v-else-if="step === 'review' && analysis" class="space-y-5">
      <div class="grid grid-cols-3 gap-3">
        <div class="rounded-xl bg-neutral-50 border border-neutral-100 px-4 py-3 text-center">
          <p class="text-2xl font-display font-extrabold text-ink tabular-nums">{{ formatNumber(analysis.totalRecords) }}</p>
          <p class="text-[11px] uppercase tracking-wide text-ink-muted font-semibold">Registros</p>
        </div>
        <div class="rounded-xl bg-teal-50 border border-teal-100 px-4 py-3 text-center">
          <p class="text-2xl font-display font-extrabold text-teal-700 tabular-nums">{{ knownCount }}</p>
          <p class="text-[11px] uppercase tracking-wide text-teal-800 font-semibold">RFC reconocidos</p>
        </div>
        <div class="rounded-xl bg-danger-50 border border-danger-100 px-4 py-3 text-center">
          <p class="text-2xl font-display font-extrabold text-danger-600 tabular-nums">{{ unknownCount }}</p>
          <p class="text-[11px] uppercase tracking-wide text-danger-700 font-semibold">Sin registro</p>
        </div>
      </div>

      <div class="overflow-x-auto rounded-xl border border-neutral-200">
        <table class="table">
          <thead>
            <tr>
              <th>RFC emisor</th>
              <th>Empresa</th>
              <th class="text-right">Registros</th>
              <th>Estatus</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="entry in analysis.rfcs" :key="entry.rfc">
              <td><span class="font-mono text-xs text-ink-soft">{{ entry.rfc }}</span></td>
              <td><span class="text-sm text-ink">{{ entry.companyName || '—' }}</span></td>
              <td class="text-right tabular-nums">{{ entry.records }}</td>
              <td>
                <Badge v-if="entry.known" variant="success" size="sm" dot>Reconocido</Badge>
                <Badge v-else variant="danger" size="sm" dot>No registrado</Badge>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <Alert
        v-for="(issue, index) in analysis.issues"
        :key="index"
        :variant="issue.level === 'danger' ? 'danger' : 'warning'"
        :title="issue.level === 'danger' ? 'Bloqueante' : 'Aviso'"
      >
        {{ issue.message }}
      </Alert>

      <div>
        <Checkbox
          id="skip-errors"
          v-model="skipErrors"
          label="Omitir los registros con error y continuar el lote"
        />
        <p class="mt-1 ml-6 text-xs text-ink-muted">Si se desmarca, el lote se detendrá al primer error y los registros posteriores no se procesarán.</p>
      </div>
      <Alert v-if="!skipErrors" variant="warning" title="Detención al primer error">
        El lote se detendrá en cuanto un registro falle (incluido un RFC no registrado).
      </Alert>

      <div class="flex flex-wrap items-center justify-between gap-3">
        <Button variant="secondary" @click="step = 'upload'">Atrás</Button>
        <Button variant="primary" :icon="Inbox" :loading="isCreating" :disabled="!analysis.canProcess" @click="handleProcess">
          Procesar lote
        </Button>
      </div>
    </div>

    <!-- Paso 3: procesamiento y resultado -->
    <div v-else-if="step === 'result' && batch" class="space-y-5" aria-live="polite">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div class="min-w-0">
          <p class="font-semibold text-ink truncate">{{ batch.fileName }}</p>
          <p class="text-xs text-ink-muted">Iniciado por {{ batch.createdBy }} · {{ formatDateTime(batch.startedAt) }}</p>
        </div>
        <Badge :variant="batchStatusBadge.variant" dot>{{ batchStatusBadge.label }}</Badge>
      </div>

      <div>
        <div class="flex items-center justify-between mb-1.5">
          <span class="text-xs font-semibold uppercase tracking-wide text-ink-muted">Progreso del lote</span>
          <span class="text-xs font-semibold tabular-nums text-ink-soft">{{ batch.processedCount }}/{{ batch.totalRecords }} · {{ progressPercent }}%</span>
        </div>
        <div class="progress-track" role="progressbar" :aria-valuenow="progressPercent" :aria-valuemin="0" :aria-valuemax="100" aria-label="Progreso del lote">
          <div class="progress-fill bg-primary-500" :style="{ width: `${progressPercent}%` }" />
        </div>
      </div>

      <div class="grid grid-cols-3 gap-3 text-center">
        <div class="rounded-xl bg-teal-50 border border-teal-100 px-3 py-2">
          <p class="text-xl font-display font-extrabold text-teal-700 tabular-nums">{{ batch.successCount }}</p>
          <p class="text-[10px] uppercase tracking-wide font-semibold text-teal-800">Timbrados</p>
        </div>
        <div class="rounded-xl bg-danger-50 border border-danger-100 px-3 py-2">
          <p class="text-xl font-display font-extrabold text-danger-600 tabular-nums">{{ batch.errorCount }}</p>
          <p class="text-[10px] uppercase tracking-wide font-semibold text-danger-700">Errores</p>
        </div>
        <div class="rounded-xl bg-neutral-50 border border-neutral-100 px-3 py-2">
          <p class="text-xl font-display font-extrabold text-ink tabular-nums">{{ batch.totalRecords - batch.processedCount }}</p>
          <p class="text-[10px] uppercase tracking-wide font-semibold text-ink-muted">Pendientes</p>
        </div>
      </div>

      <RfcBreakdown :rfcs="batch.rfcs" />

      <div v-if="batch.status === 'procesando'" class="flex items-center gap-2 text-sm text-ink-soft">
        <Loader2 class="w-4 h-4 animate-spin text-primary-500" aria-hidden="true" />
        Procesando registros… esta vista se actualiza sola.
      </div>

      <Alert v-if="batch.status === 'fallida'" variant="danger" title="Lote detenido">
        {{ batch.failureReason }}
      </Alert>
      <Alert v-else-if="batch.status === 'completada'" variant="success" title="Lote completado">
        Todos los registros se timbraron correctamente.
      </Alert>
      <Alert v-else-if="batch.status === 'completada_con_errores'" variant="warning" title="Lote completado con errores">
        {{ batch.errorCount }} registro(s) no se timbraron. Revisa el detalle y reintenta los errores de captura; un RFC no registrado requiere alta previa.
      </Alert>

      <div v-if="batch.status !== 'procesando'" class="flex flex-wrap gap-2">
        <Button
          variant="outline"
          :icon="RotateCcw"
          :loading="isRetrying"
          :disabled="retryableCount === 0"
          :title="retryableCount === 0 ? 'No hay errores de captura reintentables' : `Reintentar ${retryableCount} registro(s)`"
          @click="handleRetry"
        >
          Reintentar errores ({{ retryableCount }})
        </Button>
        <Button variant="secondary" @click="resetWizard">Cargar otro archivo</Button>
      </div>

      <BatchRecordTable v-if="batch.status !== 'procesando'" :records="batch.records" :report-name="`reporte_errores_lote_${batch.id}.csv`" />
    </div>
  </div>
</template>
