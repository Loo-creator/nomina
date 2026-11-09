<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Stamp, PenLine, Download, Eye, Mail, FileCode2, Plus, Trash2, Layers } from 'lucide-vue-next'
import PageHeader from '@/shared/components/PageHeader.vue'
import Table from '@/shared/components/Table.vue'
import Badge from '@/shared/components/Badge.vue'
import Button from '@/shared/components/Button.vue'
import Input from '@/shared/components/Input.vue'
import Modal from '@/shared/components/Modal.vue'
import DataFilterBar from '@/shared/components/DataFilterBar.vue'
import ErrorState from '@/shared/components/ErrorState.vue'
import { useFilteredData } from '@/shared/composables/useFilteredData'
import { useAuthStore } from '@/shared/stores/auth'
import { useToastStore } from '@/shared/stores/toast'
import { useI18n } from 'vue-i18n'
import { getPayrolls, getEmployeePayrolls } from '@/services/payrolls.service'
import { registerZipPackage } from '@/services/zipPackages.service'
import { track } from '@/shared/utils/telemetry'
import { ROLES, PAYROLL_STATUS, PAYROLL_STATUS_LABELS, PAYROLL_STATUS_COLORS } from '@/shared/utils/constants'

const authStore = useAuthStore()
const toastStore = useToastStore()
const { t } = useI18n({ useScope: 'global' })
const router = useRouter()

const payrolls = ref([])
const isLoading = ref(false)
const loadError = ref('')
const selectedIds = ref([])
const isBuildingZip = ref(false)
const tableKey = ref(0)

const previewOpen = ref(false)
const previewRow = ref(null)

const emailOpen = ref(false)
const emailRow = ref(null)
const emailInput = ref('')
const emailRecipients = ref([])
const emailError = ref('')

const isEmployee = computed(() => authStore.userRole === ROLES.EMPLEADO)

const filters = computed(() => [
  {
    key: 'search',
    label: 'Búsqueda',
    type: 'search',
    placeholder: 'Empleado, RFC, CURP, periodo...',
  },
  {
    key: 'periodLabel',
    label: 'Periodo',
    type: 'select',
    group: 'Periodo',
    placeholder: 'Todos los periodos',
    options: [],
  },
  {
    key: 'status',
    label: 'Estado',
    type: 'select',
    group: 'Estado',
    placeholder: 'Todos los estados',
    options: [
      { value: 'timbrados', label: 'Timbrados' },
      { value: PAYROLL_STATUS.SIGNED, label: 'Firmadas' },
      { value: PAYROLL_STATUS.STAMPED, label: 'Sin firmar' },
      { value: PAYROLL_STATUS.CANCELLED, label: 'Canceladas' },
      { value: PAYROLL_STATUS.PROCESSING, label: 'En proceso' },
      { value: PAYROLL_STATUS.ERROR, label: 'Error' },
    ],
    filterFn: (row, value) => {
      if (value === 'timbrados') return [PAYROLL_STATUS.STAMPED, PAYROLL_STATUS.SIGNED].includes(row.status)
      return row.status === value
    },
  },
  {
    key: 'companyName',
    label: 'Compañía',
    type: 'select',
    group: 'Organización',
    placeholder: 'Todas las compañías',
    options: [],
  },
  {
    key: 'stampedAt',
    label: 'Fecha de emisión',
    type: 'dateRange',
    group: 'Fechas',
    placeholder: 'Rango de fechas',
    field: 'stampedAt',
  },
  {
    key: 'periodPay',
    label: 'Pago (período)',
    type: 'dateRange',
    group: 'Periodo',
    placeholder: 'Rango de fechas',
    field: 'period',
  },
  {
    key: 'firma',
    label: 'Firma',
    type: 'checkboxes',
    group: 'Estado',
    placeholder: 'Todos los estatus',
    options: [
      { value: PAYROLL_STATUS.SIGNED, label: 'Firmada' },
      { value: PAYROLL_STATUS.STAMPED, label: 'Sin firmar' },
      { value: PAYROLL_STATUS.CANCELLED, label: 'Cancelada' },
    ],
    filterFn: (row, value) => (value || []).includes(row.status),
  },
  {
    key: 'department',
    label: 'Departamento',
    type: 'select',
    group: 'Organización',
    placeholder: 'Todos los departamentos',
    options: [],
  },
])

const visibleFilterKeys = ['periodLabel', 'status', 'companyName']

const columns = computed(() => {
  if (isEmployee.value) {
    return [
      { field: 'periodLabel', header: 'Período', sortable: true },
      { field: 'status', header: 'Estado' },
      { field: 'myNet', header: 'Mi neto', align: 'right' },
      { field: 'stampedAt', header: 'Timbrada', sortable: true },
    ]
  }
  return [
    { field: 'periodLabel', header: 'Período', sortable: true },
    { field: 'companyName', header: 'Compañía', sortable: true },
    { field: 'totalEmployees', header: 'Empleados', align: 'right' },
    { field: 'totalNet', header: 'Neto', align: 'right' },
    { field: 'status', header: 'Estado' },
    { field: 'stampedAt', header: 'Timbrada', sortable: true },
  ]
})

const canSign = computed(() => authStore.hasPermission('payroll:sign'))
const canCancel = computed(() =>
  authStore.hasPermission('payroll:cancel') || authStore.hasPermission('payroll:request-cancel'),
)

const adminActions = computed(() => [
  {
    key: 'sign',
    label: 'Firmar',
    icon: PenLine,
    hidden: () => !canSign.value,
    disabled: (row) => row.status !== PAYROLL_STATUS.STAMPED,
  },
  { key: 'download', label: 'Descargar', icon: Download, hidden: (row) => row.status !== PAYROLL_STATUS.SIGNED },
  {
    key: 'cancel',
    label: authStore.hasPermission('payroll:cancel') ? 'Cancelar' : 'Solicitar cancelación',
    icon: Trash2,
    variant: 'danger',
    disabled: (row) => row.status !== PAYROLL_STATUS.STAMPED && row.status !== PAYROLL_STATUS.SIGNED,
    hidden: () => !canCancel.value,
  },
])

const employeeActions = [
  { key: 'sign', label: 'Firmar', icon: PenLine, hidden: (row) => row.status === PAYROLL_STATUS.SIGNED },
  { key: 'preview', label: 'Previsualizar', icon: Eye, hidden: (row) => row.status === PAYROLL_STATUS.SIGNED },
  { key: 'download', label: 'Descargar PDF', icon: Download, hidden: (row) => row.status !== PAYROLL_STATUS.SIGNED },
  { key: 'xml', label: 'Descargar XML', icon: FileCode2, hidden: (row) => row.status !== PAYROLL_STATUS.SIGNED },
  { key: 'email', label: 'Enviar por correo', icon: Mail, hidden: (row) => row.status !== PAYROLL_STATUS.SIGNED },
]

const rowActions = computed(() => (isEmployee.value ? employeeActions : adminActions.value))

const companyIds = computed(() =>
  authStore.scopedCompanyIds
)

const filterModel = ref({})

function clearFilters() {
  filterModel.value = {}
}

const searchFields = ['periodLabel', 'companyName', 'companyRfc', 'uuid', 'status', 'department', 'period']

const filteredPayrolls = useFilteredData(payrolls, filterModel, () => filters.value, { searchFields })

const selectedPayrolls = computed(() =>
  payrolls.value.filter(p => selectedIds.value.includes(p.id)),
)

function handleSelectionChange(ids) {
  selectedIds.value = ids
}

function clearSelection() {
  selectedIds.value = []
  tableKey.value += 1
}

async function downloadAuditPackage() {
  const withUuid = selectedPayrolls.value.filter(p => p.uuid)
  const skipped = selectedPayrolls.value.length - withUuid.length
  if (!withUuid.length) {
    toastStore.error('Ningún comprobante seleccionado tiene UUID de timbrado')
    return
  }
  if (skipped > 0) {
    toastStore.info(`${skipped} comprobante(s) sin UUID se omitirán del paquete`)
  }
  isBuildingZip.value = true
  try {
    const { buildAuditPackage, auditPackageFilename, downloadBlob } = await import('@/shared/utils/auditPackage')
    const blob = await buildAuditPackage(withUuid, { generatedBy: authStore.user?.name || 'Desconocido' })
    downloadBlob(blob, auditPackageFilename())
    registerZipPackage({ tenantId: authStore.userTenantId ?? null, payrolls: withUuid, fileName: auditPackageFilename() }).catch(() => {})
    track('paquete_descargado', { count: withUuid.length })
    toastStore.success(`Paquete de auditoría con ${withUuid.length} comprobante(s) descargado`)
  } catch (err) {
    toastStore.error('No se pudo generar el paquete de auditoría')
  } finally {
    isBuildingZip.value = false
  }
}

const totalizers = computed(() => {
  if (!filteredPayrolls.value.length) return {}
  const filtered = filteredPayrolls.value
  return {
    perceptions: filtered.reduce((sum, p) => sum + (p.totalPerceptions ?? p.myPerceptions ?? 0), 0),
    deductions: filtered.reduce((sum, p) => sum + (p.totalDeductions ?? p.myDeductions ?? 0), 0),
    net: filtered.reduce((sum, p) => sum + (p.totalNet ?? p.myNet ?? 0), 0),
  }
})

async function loadData() {
  isLoading.value = true
  if (isEmployee.value) {
    const employeeId = authStore.user?.employeeId
    if (!employeeId) {
      payrolls.value = []
      toastStore.error('Tu usuario no tiene un empleado asociado')
      isLoading.value = false
      return
    }
    let empRes
    try {
      empRes = await getEmployeePayrolls(employeeId)
    } catch {
      empRes = null
    }
    if (empRes?.ok) {
      payrolls.value = empRes.data
      const periods = [...new Set(payrolls.value.map(p => p.periodLabel))].sort().reverse()
      const periodFilter = filters.value.find(f => f.key === 'periodLabel')
      if (periodFilter) periodFilter.options = periods.map(v => ({ value: v, label: v }))
    } else {
      loadError.value = empRes?.message || 'No se pudieron cargar tus nóminas'
    }
    isLoading.value = false
    return
  }
  loadError.value = ''
  let res
  try {
    res = await getPayrolls(companyIds.value)
  } catch {
    res = null
  }
  if (res?.ok) {
    payrolls.value = res.data.filter(p =>
      [PAYROLL_STATUS.STAMPED, PAYROLL_STATUS.SIGNED, PAYROLL_STATUS.CANCELLED].includes(p.status)
    )
    const periods = [...new Set(payrolls.value.map(p => p.periodLabel))].sort().reverse()
    const companies = [...new Set(payrolls.value.map(p => p.companyName))].sort()
    const departments = [...new Set(payrolls.value.map(p => p.department).filter(Boolean))].sort()
    
    const periodFilter = filters.value.find(f => f.key === 'periodLabel')
    if (periodFilter) periodFilter.options = periods.map(v => ({ value: v, label: v }))
    
    const companyFilter = filters.value.find(f => f.key === 'companyName')
    if (companyFilter) companyFilter.options = companies.map(v => ({ value: v, label: v }))
    
    const deptFilter = filters.value.find(f => f.key === 'department')
    if (deptFilter) deptFilter.options = departments.map(v => ({ value: v, label: v }))
  } else {
    loadError.value = res?.message || 'No se pudieron cargar las nóminas'
  }
  isLoading.value = false
}

function formatCurrency(value) {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(value || 0)
}

function formatDate(value) {
  if (!value) return '—'
  return new Date(value).toLocaleDateString('es-MX', { dateStyle: 'medium' })
}

function statusLabel(row) {
  if (!isEmployee.value) return PAYROLL_STATUS_LABELS[row.status] || row.status
  return row.status === PAYROLL_STATUS.SIGNED ? 'Firmada' : 'Sin firmar'
}

function statusColor(row) {
  if (!isEmployee.value) return PAYROLL_STATUS_COLORS[row.status] || 'neutral'
  return row.status === PAYROLL_STATUS.SIGNED ? 'success' : 'warning'
}

function handleAction({ action, row }) {
  if (action === 'sign') router.push({ name: 'firmar-nomina', params: { id: row.id } })
  if (action === 'preview') {
    previewRow.value = row
    previewOpen.value = true
  }
  if (action === 'download') toastStore.success(`Generando PDF de ${row.periodLabel}`)
  if (action === 'xml') toastStore.success(`Generando XML de ${row.periodLabel}`)
  if (action === 'email') {
    emailRow.value = row
    emailRecipients.value = [authStore.user?.email].filter(Boolean)
    emailInput.value = ''
    emailError.value = ''
    emailOpen.value = true
  }
  if (action === 'cancel') {
    router.push({ name: 'cancelar-nomina', params: { id: row.id } })
  }
}

function addRecipient() {
  const value = emailInput.value.trim()
  emailError.value = ''
  if (!value) return
  const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
  if (!valid) {
    emailError.value = 'Ingresa un correo válido'
    return
  }
  if (emailRecipients.value.includes(value)) {
    emailError.value = 'Ese correo ya está en la lista'
    return
  }
  emailRecipients.value.push(value)
  emailInput.value = ''
}

function removeRecipient(email) {
  emailRecipients.value = emailRecipients.value.filter(e => e !== email)
}

function sendEmail() {
  if (!emailRecipients.value.length) {
    emailError.value = 'Agrega al menos un correo'
    return
  }
  toastStore.success(`Nómina ${emailRow.value?.periodLabel} enviada a ${emailRecipients.value.length} destinatario(s)`)
  emailOpen.value = false
}

onMounted(loadData)
</script>

<template>
  <div class="space-y-7">
    <PageHeader
      title="Nóminas timbradas"
      :description="isEmployee
        ? 'Consulta, firma y descarga tus nóminas'
        : 'Nóminas timbradas por el PAC, listas para firmar o descargar'"
      :icon="Stamp"
    />

    <ErrorState
      v-if="loadError"
      title="No se pudieron cargar las nóminas"
      :message="loadError"
      detail="getPayrolls(companyIds) / getEmployeePayrolls(employeeId)"
      @retry="loadData"
    />
    <template v-else>
    <DataFilterBar
      v-model="filterModel"
      :filters="filters"
      :visible-filter-keys="visibleFilterKeys"
      :results-count="filteredPayrolls.length"
      :totalizers="totalizers"
      :loading="isLoading"
      @filter-change="() => {}"
      @clear-all="clearFilters"
    />

    <div v-if="!isEmployee && selectedIds.length" class="flex flex-wrap items-center gap-3 rounded-xl border border-primary-200 bg-primary-50 px-4 py-2.5">
      <p class="text-sm font-semibold text-primary-800 tabular-nums">{{ selectedIds.length }} comprobante(s) seleccionado(s)</p>
      <div class="flex gap-2 ml-auto">
        <Button variant="ghost" size="sm" @click="clearSelection">Limpiar selección</Button>
        <Button variant="primary" size="sm" :icon="Download" :loading="isBuildingZip" @click="downloadAuditPackage">
          Descargar paquete (.zip)
        </Button>
      </div>
    </div>

    <Table
      :key="tableKey"
      :columns="columns"
      :data="filteredPayrolls"
      :loading="isLoading"
      :actions="rowActions"
      :filterable="false"
      :selectable="!isEmployee"
      empty-message="No hay nóminas timbradas"
      @action="handleAction"
      @selection-change="handleSelectionChange"
    >
      <template #periodLabel="{ row }">
        <span class="font-semibold text-ink">{{ row.periodLabel }}</span>
      </template>
      <template #myNet="{ row }">
        <span class="font-semibold text-ink">{{ formatCurrency(row.myNet) }}</span>
      </template>
      <template #totalNet="{ row }">
        <span class="font-semibold text-ink">{{ formatCurrency(row.totalNet) }}</span>
      </template>
      <template #status="{ row }">
        <Badge :variant="statusColor(row)" dot>
          {{ statusLabel(row) }}
        </Badge>
      </template>
      <template #stampedAt="{ row }">
        <span class="text-sm text-ink-soft">{{ formatDate(row.stampedAt) }}</span>
      </template>
      <template #empty-action>
        <Button v-if="!isEmployee" variant="primary" size="sm" :icon="Layers" @click="router.push('/comprobantes/carga-masiva')">
          {{ t('nav.cargaMasiva') }}
        </Button>
      </template>
    </Table>
    </template>

    <Modal v-model="previewOpen" title="Vista previa" size="lg">
      <div class="space-y-3">
        <p class="text-sm text-ink-muted">{{ previewRow?.periodLabel }} · {{ previewRow?.companyName }}</p>
        <div class="border border-neutral-200 rounded-xl overflow-hidden aspect-[4/3] bg-neutral-50 flex items-center justify-center">
          <iframe
            v-if="previewRow?.pdfUrl"
            :src="previewRow.pdfUrl"
            class="w-full h-full border-0"
            title="Vista previa de la nómina"
          />
          <div v-else class="text-center text-ink-muted p-8">
            <Stamp class="w-14 h-14 mx-auto mb-3 text-neutral-300" />
            <p class="font-medium text-ink-soft">Vista previa del PDF</p>
            <p class="text-sm mt-1">El comprobante se mostrará aquí.</p>
          </div>
        </div>
      </div>
      <template #footer>
        <Button variant="secondary" @click="previewOpen = false">Cerrar</Button>
      </template>
    </Modal>

    <Modal v-model="emailOpen" title="Enviar nómina por correo" size="md">
      <div class="space-y-4">
        <p class="text-sm text-ink-muted">
          Enviando <strong class="text-ink">{{ emailRow?.periodLabel }}</strong>. Puedes agregar varios destinatarios.
        </p>
        <div class="flex items-end gap-2">
          <div class="flex-1">
            <Input
              id="email-recipient"
              v-model="emailInput"
              type="email"
              label="Correo electrónico"
              placeholder="correo@dominio.com"
              :error="emailError"
              @keydown.enter.prevent="addRecipient"
            />
          </div>
          <Button variant="secondary" :icon="Plus" @click="addRecipient">Agregar</Button>
        </div>
        <div v-if="emailRecipients.length" class="flex flex-wrap gap-2">
          <span
            v-for="email in emailRecipients"
            :key="email"
            class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary-100 text-primary-700 text-sm font-medium"
          >
            {{ email }}
            <button type="button" @click="removeRecipient(email)" aria-label="Quitar correo">
              <Trash2 class="w-3.5 h-3.5" />
            </button>
          </span>
        </div>
      </div>
      <template #footer>
        <Button variant="secondary" @click="emailOpen = false">Cancelar</Button>
        <Button variant="primary" :icon="Mail" @click="sendEmail">Enviar</Button>
      </template>
    </Modal>
  </div>
</template>