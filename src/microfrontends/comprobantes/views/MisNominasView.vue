<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Stamp, PenLine, Download, Eye, Mail, FileCode2, Plus, Trash2 } from 'lucide-vue-next'
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
import { getEmployeePayrolls } from '@/services/payrolls.service'
import { ROLES, PAYROLL_STATUS, PAYROLL_STATUS_LABELS, PAYROLL_STATUS_COLORS } from '@/shared/utils/constants'

const SALARY_YEARS = [2024, 2025, 2026].map(y => ({ value: String(y), label: String(y) }))
const SALARY_MONTHS = [
  { value: '01', label: 'Enero' }, { value: '02', label: 'Febrero' }, { value: '03', label: 'Marzo' },
  { value: '04', label: 'Abril' }, { value: '05', label: 'Mayo' }, { value: '06', label: 'Junio' },
  { value: '07', label: 'Julio' }, { value: '08', label: 'Agosto' }, { value: '09', label: 'Septiembre' },
  { value: '10', label: 'Octubre' }, { value: '11', label: 'Noviembre' }, { value: '12', label: 'Diciembre' },
]

const authStore = useAuthStore()
const toastStore = useToastStore()
const router = useRouter()

const payrolls = ref([])
const isLoading = ref(false)
const loadError = ref('')

const previewOpen = ref(false)
const previewRow = ref(null)

const emailOpen = ref(false)
const emailRow = ref(null)
const emailInput = ref('')
const emailRecipients = ref([])
const emailError = ref('')

const filters = [
  {
    key: 'search',
    label: 'Búsqueda',
    type: 'search',
    placeholder: 'Periodo, RFC...',
  },
  {
    key: 'periodLabel',
    label: 'Periodo',
    type: 'select',
    placeholder: 'Todos los periodos',
    options: [],
  },
  {
    key: 'status',
    label: 'Estatus de firma',
    type: 'select',
    placeholder: 'Todos los estatus',
    options: [
      { value: PAYROLL_STATUS.STAMPED, label: 'Sin firmar' },
      { value: PAYROLL_STATUS.SIGNED, label: 'Firmada' },
    ],
  },
  {
    key: 'companyName',
    label: 'Compañía',
    type: 'select',
    placeholder: 'Todas las compañías',
    options: [],
  },
  {
    key: 'year',
    label: 'Año',
    type: 'select',
    placeholder: 'Todos los años',
    options: SALARY_YEARS,
    filterFn: (row, value) => (row.period || '').startsWith(value),
  },
  {
    key: 'month',
    label: 'Mes',
    type: 'select',
    placeholder: 'Todos los meses',
    options: SALARY_MONTHS,
    filterFn: (row, value) => (row.period || '').split('-')[1] === value,
  },
]

const visibleFilterKeys = ['periodLabel', 'status']

const columns = [
  { field: 'periodLabel', header: 'Período', sortable: true },
  { field: 'status', header: 'Estado' },
  { field: 'myNet', header: 'Mi neto', align: 'right' },
  { field: 'stampedAt', header: 'Timbrada', sortable: true },
]

const rowActions = [
  { key: 'sign', label: 'Firmar', icon: PenLine, hidden: (row) => row.status === PAYROLL_STATUS.SIGNED },
  { key: 'preview', label: 'Previsualizar', icon: Eye, hidden: (row) => row.status === PAYROLL_STATUS.SIGNED },
  { key: 'download', label: 'Descargar PDF', icon: Download, hidden: (row) => row.status !== PAYROLL_STATUS.SIGNED },
  { key: 'xml', label: 'Descargar XML', icon: FileCode2, hidden: (row) => row.status !== PAYROLL_STATUS.SIGNED },
  { key: 'email', label: 'Enviar por correo', icon: Mail, hidden: (row) => row.status !== PAYROLL_STATUS.SIGNED },
]

const filterModel = ref({})

function clearFilters() {
  filterModel.value = {}
}

const searchFields = ['periodLabel', 'status', 'companyName']

const filteredPayrolls = useFilteredData(payrolls, filterModel, () => filters, { searchFields })

const totalizers = computed(() => {
  if (!filteredPayrolls.value.length) return {}
  return {
    net: filteredPayrolls.value.reduce((sum, p) => sum + (p.myNet || 0), 0),
  }
})

async function loadData() {
  isLoading.value = true
  const employeeId = authStore.user?.employeeId
  if (!employeeId) {
    payrolls.value = []
    toastStore.error('Tu usuario no tiene un empleado asociado')
    isLoading.value = false
    return
  }
  loadError.value = ''
  let res
  try {
    res = await getEmployeePayrolls(employeeId)
  } catch {
    res = null
  }
  if (res?.ok) {
    payrolls.value = res.data
    const periods = [...new Set(payrolls.value.map(p => p.periodLabel))].sort().reverse()
    const periodFilter = filters.find(f => f.key === 'periodLabel')
    if (periodFilter) periodFilter.options = periods.map(v => ({ value: v, label: v }))
    const companyFilter = filters.find(f => f.key === 'companyName')
    if (companyFilter) companyFilter.options = [...new Set(payrolls.value.map(p => p.companyName).filter(Boolean))].sort().map(v => ({ value: v, label: v }))
  } else {
    loadError.value = res?.message || 'No se pudieron cargar tus nóminas'
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
  return row.status === PAYROLL_STATUS.SIGNED ? 'Firmada' : 'Sin firmar'
}

function statusColor(row) {
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
      title="Mis nóminas"
      description="Consulta, firma y descarga tus nóminas"
      :icon="Stamp"
    />

    <ErrorState
      v-if="loadError"
      title="No se pudieron cargar tus nóminas"
      :message="loadError"
      detail="getEmployeePayrolls(employeeId)"
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

    <Table
      :columns="columns"
      :data="filteredPayrolls"
      :loading="isLoading"
      :actions="rowActions"
      :filterable="false"
      empty-message="No tienes nóminas timbradas"
      @action="handleAction"
    >
      <template #periodLabel="{ row }">
        <span class="font-semibold text-ink">{{ row.periodLabel }}</span>
      </template>
      <template #myNet="{ row }">
        <span class="font-semibold text-ink">{{ formatCurrency(row.myNet) }}</span>
      </template>
      <template #status="{ row }">
        <Badge :variant="statusColor(row)" dot>
          {{ statusLabel(row) }}
        </Badge>
      </template>
      <template #stampedAt="{ row }">
        <span class="text-sm text-ink-soft">{{ formatDate(row.stampedAt) }}</span>
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