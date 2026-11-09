<script setup>
import { ref, computed } from 'vue'
import { Download, AlertTriangle, CheckCircle2, Clock, ListFilter } from 'lucide-vue-next'
import Table from '@/shared/components/Table.vue'
import Button from '@/shared/components/Button.vue'
import Badge from '@/shared/components/Badge.vue'
import { useToastStore } from '@/shared/stores/toast'
import { formatCurrency } from '@/shared/utils/format'

const props = defineProps({
  records: { type: Array, default: () => [] },
  reportName: { type: String, default: 'reporte_errores.csv' },
})

const toastStore = useToastStore()
const statusFilter = ref('todos')
const search = ref('')

const summary = computed(() => {
  const all = props.records.length
  const ok = props.records.filter(r => r.status === 'timbrado').length
  const failed = props.records.filter(r => r.status === 'error').length
  const pending = props.records.filter(r => r.status === 'pendiente').length
  return { all, ok, failed, pending }
})

const filterOptions = computed(() => [
  { key: 'todos', label: `Todos (${summary.value.all})` },
  { key: 'timbrado', label: `Timbrados (${summary.value.ok})` },
  { key: 'error', label: `Con error (${summary.value.failed})` },
  { key: 'pendiente', label: `Pendientes (${summary.value.pending})` },
])

const filteredRecords = computed(() => {
  let list = props.records
  if (statusFilter.value !== 'todos') {
    list = list.filter(r => r.status === statusFilter.value)
  }
  const q = search.value.trim().toLowerCase()
  if (q) {
    list = list.filter(r =>
      [r.employee, r.rfc, r.curp, r.errorCode, r.errorMessage, r.uuid]
        .filter(Boolean)
        .some(v => String(v).toLowerCase().includes(q)),
    )
  }
  return list
})

const columns = [
  { field: 'employee', header: 'Empleado', sortable: true },
  { field: 'rfc', header: 'RFC emisor', sortable: true },
  { field: 'period', header: 'Período', sortable: true },
  { field: 'netPay', header: 'Neto', sortable: true, align: 'right' },
  { field: 'status', header: 'Estado' },
  { field: 'detail', header: 'Detalle' },
]

function csvEscape(value) {
  const str = String(value ?? '')
  return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str
}

function downloadErrorReport() {
  const rows = props.records.filter(r => r.status === 'error')
  if (!rows.length) {
    toastStore.info('No hay registros con error en este lote')
    return
  }
  const header = ['RFC_EMPRESA', 'EMPLEADO', 'CURP', 'PERIODO', 'CODIGO_ERROR', 'DESCRIPCION']
  const lines = [header.join(',')]
  rows.forEach(r => {
    lines.push([r.rfc, r.employee, r.curp, r.period, r.errorCode, r.errorMessage].map(csvEscape).join(','))
  })
  const blob = new Blob(['\uFEFF' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8;' })

  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = props.reportName
  link.click()
  URL.revokeObjectURL(url)
  toastStore.success(`Reporte descargado: ${rows.length} registro(s) con error`)
}

const statusBadge = {
  timbrado: { variant: 'success', label: 'Timbrado' },
  error: { variant: 'danger', label: 'Error' },
  pendiente: { variant: 'warning', label: 'Pendiente' },
}
</script>

<template>
  <div class="space-y-4">
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <div class="flex items-center gap-2 flex-wrap" role="group" aria-label="Filtrar por estado">
        <ListFilter class="w-4 h-4 text-ink-muted" aria-hidden="true" />
        <button
          v-for="option in filterOptions"
          :key="option.key"
          type="button"
          :aria-pressed="statusFilter === option.key"
          :class="[
            'px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)]',
            statusFilter === option.key ? 'bg-primary-600 text-white' : 'bg-neutral-100 text-ink-soft hover:bg-neutral-200',
          ]"
          @click="statusFilter = option.key"
        >
          {{ option.label }}
        </button>
      </div>
      <Button variant="outline" size="sm" :icon="Download" @click="downloadErrorReport">
        Descargar errores (CSV)
      </Button>
    </div>

    <label class="sr-only" for="records-search">Buscar en el lote</label>
    <input
      id="records-search"
      v-model="search"
      type="search"
      class="input w-full sm:max-w-sm"
      placeholder="Buscar empleado, RFC, CURP, error..."
    />

    <Table
      :columns="columns"
      :data="filteredRecords"
      :searchable="false"
      :page-size="10"
      empty-message="Sin registros para el filtro actual"
    >
      <template #netPay="{ row }">
        <span class="tabular-nums text-sm">{{ formatCurrency(row.netPay) }}</span>
      </template>
      <template #status="{ row }">
        <Badge :variant="statusBadge[row.status]?.variant || 'neutral'" dot>
          {{ statusBadge[row.status]?.label || row.status }}
        </Badge>
      </template>
      <template #detail="{ row }">
        <span v-if="row.status === 'timbrado'" class="font-mono text-[11px] text-ink-muted" :title="row.uuid">
          {{ row.uuid ? `${row.uuid.slice(0, 13)}…` : 'UUID pendiente' }}
        </span>
        <span v-else-if="row.status === 'error'" class="text-xs text-danger-600" :title="row.errorMessage">
          <span class="font-semibold">{{ row.errorCode }}</span> — {{ row.errorMessage }}
        </span>
        <span v-else class="text-xs text-ink-muted">En cola de procesamiento</span>
      </template>
    </Table>

    <p class="text-[11px] text-ink-muted flex items-center gap-2">
      <CheckCircle2 class="w-3.5 h-3.5 text-success-600" aria-hidden="true" /> Timbrado
      <AlertTriangle class="w-3.5 h-3.5 text-danger-500 ml-3" aria-hidden="true" /> Con error
      <Clock class="w-3.5 h-3.5 text-gold-600 ml-3" aria-hidden="true" /> Pendiente
    </p>
  </div>
</template>
