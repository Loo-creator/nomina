<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { ChevronLeft, Eye, RotateCcw, Loader2, Download, RefreshCw, Plus } from 'lucide-vue-next'
import Table from '@/shared/components/Table.vue'
import Button from '@/shared/components/Button.vue'
import Badge from '@/shared/components/Badge.vue'
import Alert from '@/shared/components/Alert.vue'
import Skeleton from '@/shared/components/Skeleton.vue'
import RfcBreakdown from '@/microfrontends/comprobantes/components/RfcBreakdown.vue'
import BatchRecordTable from '@/microfrontends/comprobantes/components/BatchRecordTable.vue'
import { useI18n } from 'vue-i18n'
import { useToastStore } from '@/shared/stores/toast'
import { getBatches, getBatch, retryBatchErrors } from '@/services/batches.service'
import { getPayrollLoads, retryPayrollLoad } from '@/services/batches.service'
import { getCompanies } from '@/services/companies.service'
import { formatDateTime, formatNumber } from '@/shared/utils/format'
import DataFilterBar from '@/shared/components/DataFilterBar.vue'
import { useFilteredData } from '@/shared/composables/useFilteredData'

const props = defineProps({
  tenantId: { type: Number, required: true },
  disabled: { type: Boolean, default: false },
})

const { t } = useI18n({ useScope: 'global' })
const toastStore = useToastStore()
const emit = defineEmits(['go-new'])

const batches = ref([])
const isLoading = ref(false)
const selectedBatch = ref(null)
const isDetailLoading = ref(false)

const columns = [
  { field: 'typeLabel', header: t('cargas.type') },
  { field: 'fileName', header: t('cargas.uploads'), sortable: true },
  { field: 'context', header: t('cargas.origin') },
  { field: 'status', header: 'Estado' },
  { field: 'totalRecords', header: 'Registros', sortable: true, align: 'right' },
  { field: 'successCount', header: 'Éxitos', sortable: true, align: 'right' },
  { field: 'errorCount', header: 'Errores', sortable: true, align: 'right' },
  { field: 'startedAt', header: 'Subido', sortable: true },
]

const rowActions = [
  { key: 'view', label: t('cargas.viewDetail'), icon: Eye, hidden: (row) => row.type !== 'lote' },
  { key: 'retry', label: t('cargas.retry'), icon: RefreshCw, hidden: (row) => row.type !== 'simple' || row.status === 'completada' || row.status === 'procesando', disabled: () => isRetrying.value },
  { key: 'download', label: t('cargas.download'), icon: Download, hidden: (row) => row.type !== 'simple' },
]

const statusBadge = {
  procesando: { variant: 'info', label: 'Procesando…' },
  completada: { variant: 'success', label: 'Completada' },
  completada_con_errores: { variant: 'warning', label: 'Con errores' },
  fallida: { variant: 'danger', label: 'Fallida' },
}

const retryableCount = computed(() =>
  selectedBatch.value?.records.filter(r => r.status === 'error' && r.retryable).length || 0,
)

const unifiedRows = computed(() => {
  const loteRows = batches.value.map(b => ({
    id: `lote-${b.id}`,
    rawId: b.id,
    type: 'lote',
    typeLabel: t('cargas.batch'),
    fileName: b.fileName,
    context: `${b.rfcs?.length ?? 0} RFC emisor(es)`,
    totalRecords: b.totalRecords,
    successCount: b.successCount,
    errorCount: b.errorCount,
    status: b.status,
    startedAt: b.startedAt,
  }))
  const simpleRows = simpleLoads.value.map(l => ({
    id: `simple-${l.id}`,
    rawId: l.id,
    type: 'simple',
    typeLabel: t('cargas.simple'),
    fileName: l.fileName,
    context: l.companyName,
    totalRecords: l.totalRecords,
    successCount: l.successful,
    errorCount: l.failed,
    status: l.status,
    startedAt: l.uploadedAt,
  }))
  return [...loteRows, ...simpleRows].sort((a, b) => new Date(b.startedAt) - new Date(a.startedAt))
})

const isDetailOpen = computed(() => Boolean(selectedBatch.value) || isDetailLoading.value)

const filterModel = ref({})
function clearFilters() {
  filterModel.value = {}
}
const filters = [
  { key: 'search', label: 'Búsqueda', type: 'search', placeholder: 'Archivo, empresa...' },
  {
    key: 'type',
    label: 'Tipo',
    type: 'select',
    placeholder: 'Todos los tipos',
    options: [
      { value: 'lote', label: 'Lote multi-RFC' },
      { value: 'simple', label: 'Carga simple' },
    ],
  },
  {
    key: 'status',
    label: 'Estado',
    type: 'select',
    placeholder: 'Todos los estados',
    options: [
      { value: 'completada', label: 'Completada' },
      { value: 'completada_con_errores', label: 'Con errores' },
      { value: 'procesando', label: 'Procesando' },
      { value: 'fallida', label: 'Fallida' },
    ],
  },
  { key: 'startedAt', label: 'Fecha', type: 'dateRange', placeholder: 'Rango de fechas', field: 'startedAt' },
]
const filteredRows = useFilteredData(unifiedRows, filterModel, filters, { searchFields: ['fileName', 'context'] })

const simpleLoads = ref([])

async function loadBatches() {
  isLoading.value = true

  const [batchRes, companyRes] = await Promise.all([
    getBatches(props.tenantId),
    getCompanies(null, { tenantId: props.tenantId }),
  ])

  if (batchRes.ok) batches.value = batchRes.data
  else toastStore.error(batchRes.message)

  if (companyRes.ok) {
    const companyIds = companyRes.data.map(c => c.id)
    const loadsRes = await getPayrollLoads(companyIds)
    if (loadsRes.ok) simpleLoads.value = loadsRes.data
    else toastStore.error(loadsRes.message)
  } else {
    toastStore.error(companyRes.message)
  }

  isLoading.value = false
}


async function openBatch(row) {
  isDetailLoading.value = true
  selectedBatch.value = null
  const res = await getBatch(row.id)
  if (res.ok) selectedBatch.value = res.data
  else toastStore.error(res.message)
  isDetailLoading.value = false
}

function closeDetail() {
  selectedBatch.value = null
}

const isRetrying = ref(false)
const isRetryingSimple = ref(false)

async function handleRetrySimple(row) {
  isRetryingSimple.value = true
  const res = await retryPayrollLoad(row.rawId)
  if (res.ok) {
    toastStore.success(res.message)
    await loadBatches()
  } else {
    toastStore.error(res.message)
  }
  isRetryingSimple.value = false
}

async function handleRetry() {
  if (!selectedBatch.value) return
  isRetrying.value = true
  const res = await retryBatchErrors(selectedBatch.value.id)
  if (res.ok) {
    selectedBatch.value = res.data
    toastStore.success(res.message)
    await loadBatches()
  } else {
    toastStore.error(res.message)
  }
  isRetrying.value = false
}

function handleAction({ action, row }) {
  if (action === 'view') openBatch({ id: row.rawId })
  if (action === 'retry') handleRetrySimple(row)
  if (action === 'download') toastStore.info(`Descarga simulada de ${row.fileName}`)
}

watch(() => props.tenantId, () => {
  selectedBatch.value = null
  loadBatches()
})

onMounted(loadBatches)
</script>

<template>
  <div>
    <div v-if="isDetailOpen">
      <button
        type="button"
        class="inline-flex items-center gap-2 text-sm font-medium text-ink-muted hover:text-ink transition-colors rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)]"
        @click="closeDetail"
      >
        <ChevronLeft class="w-4 h-4" aria-hidden="true" />
        Volver al historial
      </button>

      <div v-if="isDetailLoading" class="space-y-3 mt-4" aria-busy="true" aria-label="Cargando lote">
        <Skeleton height="64px" />
        <Skeleton height="160px" />
        <Skeleton height="280px" />
      </div>

      <div v-else-if="selectedBatch" class="space-y-5 mt-4">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div class="min-w-0">
            <p class="font-semibold text-ink break-all">{{ selectedBatch.fileName }}</p>
            <p class="text-xs text-ink-muted">Iniciado por {{ selectedBatch.createdBy }} · {{ formatDateTime(selectedBatch.startedAt) }}</p>
          </div>
          <Badge :variant="statusBadge[selectedBatch.status]?.variant || 'neutral'" dot>
            {{ statusBadge[selectedBatch.status]?.label || selectedBatch.status }}
          </Badge>
        </div>

        <div class="grid grid-cols-3 gap-3 text-center">
          <div class="rounded-xl bg-teal-50 border border-teal-100 px-3 py-2">
            <p class="text-xl font-display font-extrabold text-teal-700 tabular-nums">{{ selectedBatch.successCount }}</p>
            <p class="text-[10px] uppercase tracking-wide font-semibold text-teal-800">Timbrados</p>
          </div>
          <div class="rounded-xl bg-danger-50 border border-danger-100 px-3 py-2">
            <p class="text-xl font-display font-extrabold text-danger-600 tabular-nums">{{ selectedBatch.errorCount }}</p>
            <p class="text-[10px] uppercase tracking-wide font-semibold text-danger-700">Errores</p>
          </div>
          <div class="rounded-xl bg-neutral-50 border border-neutral-100 px-3 py-2">
            <p class="text-xl font-display font-extrabold text-ink tabular-nums">{{ selectedBatch.totalRecords - selectedBatch.processedCount }}</p>
            <p class="text-[10px] uppercase tracking-wide font-semibold text-ink-muted">Pendientes</p>
          </div>
        </div>

        <RfcBreakdown :rfcs="selectedBatch.rfcs" />

        <Alert v-if="selectedBatch.status === 'fallida'" variant="danger" title="Lote detenido">
          {{ selectedBatch.failureReason }}
        </Alert>

        <div class="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            :icon="RotateCcw"
            :loading="isRetrying"
            :disabled="disabled || retryableCount === 0"
            :title="disabled ? 'La cuenta está suspendida' : retryableCount === 0 ? 'No hay errores de captura reintentables' : ''"
            @click="handleRetry"
          >
            Reintentar errores ({{ retryableCount }})
          </Button>
          <span v-if="disabled" class="text-xs text-ink-muted inline-flex items-center gap-1">
            <Loader2 class="w-3 h-3" aria-hidden="true" /> Cuenta suspendida: acciones deshabilitadas
          </span>
        </div>

        <BatchRecordTable :records="selectedBatch.records" :report-name="`reporte_errores_lote_${selectedBatch.id}.csv`" />
      </div>
    </div>

    <DataFilterBar
      v-model="filterModel"
      :filters="filters"
      :visible-filter-keys="['type', 'status']"
      :results-count="filteredRows.length"
      :loading="isLoading"
      @filter-change="() => {}"
      @clear-all="clearFilters"
    />

    <Table
      :columns="columns"
      :data="filteredRows"
      :loading="isLoading"
      :actions="rowActions"
      :filterable="false"
      :empty-message="t('cargas.emptyTitle')"
      :empty-description="t('cargas.emptyDesc')"
      @action="handleAction"
    >
      <template #typeLabel="{ row }">
        <Badge :variant="row.type === 'lote' ? 'primary' : 'secondary'" size="sm">{{ row.typeLabel }}</Badge>
      </template>
      <template #context="{ row }">
        <span class="text-sm text-ink-soft">{{ row.context || '—' }}</span>
      </template>
      <template #fileName="{ row }">
        <span class="font-medium text-ink break-all">{{ row.fileName }}</span>
      </template>
      <template #status="{ row }">
        <Badge :variant="statusBadge[row.status]?.variant || 'neutral'" dot>
          {{ statusBadge[row.status]?.label || row.status }}
        </Badge>
      </template>
      <template #successCount="{ row }">
        <span class="tabular-nums text-success-700">{{ formatNumber(row.successCount) }}</span>
      </template>
      <template #errorCount="{ row }">
        <span class="tabular-nums" :class="row.errorCount > 0 ? 'text-danger-600 font-semibold' : 'text-ink-muted'">{{ formatNumber(row.errorCount) }}</span>
      </template>
      <template #startedAt="{ row }">
        <span class="text-sm text-ink-soft">{{ formatDateTime(row.startedAt) }}</span>
      </template>
      <template #empty-action>
        <Button variant="primary" size="sm" :icon="Plus" @click="emit('go-new')">
          {{ t('nav.cargaMasiva') }}
        </Button>
      </template>
    </Table>
  </div>
</template>
