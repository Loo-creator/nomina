<script setup>
import { ref, computed, onMounted } from 'vue'
import { Download, Loader2 } from 'lucide-vue-next'
import Table from '@/shared/components/Table.vue'
import Badge from '@/shared/components/Badge.vue'
import DataFilterBar from '@/shared/components/DataFilterBar.vue'
import { useFilteredData } from '@/shared/composables/useFilteredData'
import { useToastStore } from '@/shared/stores/toast'
import { getZipPackages } from '@/services/zipPackages.service'
import { getPayrolls } from '@/services/payrolls.service'
import { formatDateTime, formatNumber } from '@/shared/utils/format'

const props = defineProps({
  tenantId: { type: Number, required: true },
  disabled: { type: Boolean, default: false },
})

const toastStore = useToastStore()

const packages = ref([])
const isLoading = ref(false)
const filterModel = ref({})
const downloadingId = ref(null)

const columns = [
  { field: 'id', header: 'ID zip', sortable: true, align: 'center' },
  { field: 'loadId', header: 'ID de carga' },
  { field: 'fileName', header: 'Nombre de archivo', sortable: true },
  { field: 'count', header: 'Comprobantes', sortable: true, align: 'right' },
  { field: 'status', header: 'Estatus' },
  { field: 'createdAt', header: 'Creado', sortable: true },
]

const filters = [
  { key: 'search', label: 'Buscar', type: 'search', placeholder: 'ID, nombre, carga…' },
  {
    key: 'status',
    label: 'Estatus',
    type: 'select',
    placeholder: 'Todos',
    options: [
      { value: 'procesando', label: 'En proceso' },
      { value: 'terminado', label: 'Terminado' },
      { value: 'error', label: 'Error' },
    ],
  },
  { key: 'createdAt', label: 'Creado (fecha)', type: 'dateRange', placeholder: 'Rango de fechas', field: 'createdAt' },
]

const filteredRows = useFilteredData(packages, filterModel, filters, {
  searchFields: ['id', 'loadId', 'fileName', 'companyName', 'companyRfc'],
})

const statusBadge = {
  procesando: { variant: 'info', label: 'En proceso' },
  terminado: { variant: 'success', label: 'Terminado' },
  error: { variant: 'danger', label: 'Error' },
}

async function loadPackages() {
  isLoading.value = true
  const res = await getZipPackages(props.tenantId)
  if (res.ok) packages.value = res.data
  else toastStore.error(res.message)
  isLoading.value = false
}

async function downloadPackage(row) {
  downloadingId.value = row.id
  try {
    const payrollsRes = await getPayrolls(null)
    const selected = (row.payrollIds || []).map(id => payrollsRes.data.find(p => p.id === id)).filter(Boolean)
    if (!selected.length) {
      toastStore.error('Los comprobantes del paquete ya no están disponibles')
      return
    }
    const { buildAuditPackage: buildPkg, auditPackageFilename, downloadBlob: saveBlob } = await import('@/shared/utils/auditPackage')
    const blob = await buildPkg(selected, { generatedBy: 'NOMIKOK' })
    saveBlob(blob, row.fileName || auditPackageFilename())
    toastStore.success('Paquete ZIP descargado')
  } catch {
    toastStore.error('No se pudo generar el paquete')
  } finally {
    downloadingId.value = null
  }
}

function handleAction({ action, row }) {
  if (action === 'download') downloadPackage(row)
}

onMounted(loadPackages)
</script>

<template>
  <div class="space-y-4">
    <DataFilterBar
      v-model="filterModel"
      :filters="filters"
      :visible-filter-keys="['status']"
      :results-count="filteredRows.length"
      :loading="isLoading"
      @filter-change="() => {}"
      @clear-all="filterModel = {}"
    />

    <Table
      :columns="columns"
      :data="filteredRows"
      :loading="isLoading"
      :actions="[{ key: 'download', label: 'Descargar ZIP', icon: Download, disabled: () => downloadingId !== null }]"
      :filterable="false"
      empty-message="Aún no hay paquetes ZIP generados"
      empty-description="Cada descarga de auditoría desde Nóminas timbradas crea uno y queda registrado aquí para su reutilización."
      @action="handleAction"
    >
      <template #fileName="{ row }">
        <span class="font-mono text-xs text-ink-soft">{{ row.fileName }}</span>
      </template>
      <template #status="{ row }">
        <Badge :variant="statusBadge[row.status]?.variant || 'neutral'" dot>
          {{ statusBadge[row.status]?.label || row.status }}
        </Badge>
      </template>
      <template #createdAt="{ row }">
        <span class="text-sm text-ink-soft">{{ formatDateTime(row.createdAt) }}</span>
      </template>
      <template #count="{ row }">
        <span class="tabular-nums">{{ formatNumber(row.count) }}</span>
      </template>
    </Table>
    <p v-if="downloadingId" class="text-xs text-ink-muted flex items-center gap-1.5">
      <Loader2 class="w-3.5 h-3.5 animate-spin" aria-hidden="true" /> Generando paquete…
    </p>
  </div>
</template>
