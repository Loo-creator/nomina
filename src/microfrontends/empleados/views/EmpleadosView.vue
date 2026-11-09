<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { Pencil, Trash2, Plus, Users, Eye, EyeOff, Archive, ShieldCheck } from 'lucide-vue-next'
import PageHeader from '@/shared/components/PageHeader.vue'
import Table from '@/shared/components/Table.vue'
import Button from '@/shared/components/Button.vue'
import Badge from '@/shared/components/Badge.vue'
import Modal from '@/shared/components/Modal.vue'
import Input from '@/shared/components/Input.vue'
import Select from '@/shared/components/Select.vue'
import Card from '@/shared/components/Card.vue'
import Alert from '@/shared/components/Alert.vue'
import DataFilterBar from '@/shared/components/DataFilterBar.vue'
import Checkbox from '@/shared/components/Checkbox.vue'
import { useFilteredData } from '@/shared/composables/useFilteredData'
import { useAuthStore } from '@/shared/stores/auth'
import { useToastStore } from '@/shared/stores/toast'
import { getCompanies } from '@/services/companies.service'
import { getEmployees, createEmployee, updateEmployee, deleteEmployee } from '@/services/employees.service'
import { getUsers } from '@/services/users.service'
import { corporateEmail, isValidDomain } from '@/shared/utils/email'

const authStore = useAuthStore()
const toastStore = useToastStore()

const employees = ref([])
const companies = ref([])
const isLoading = ref(false)
const isSaving = ref(false)
const wizardOpen = ref(false)
const wizardStep = ref(1)
const editingId = ref(null)
const pendingArchive = ref(null)
const errors = reactive({})

const contractOptions = [
  { value: 'indefinido', label: 'Indefinido' },
  { value: 'temporal', label: 'Temporal' },
  { value: 'capacitacion', label: 'Capacitación' },
  { value: 'temporada', label: 'Temporada' },
]

const statusOptions = [
  { value: 'active', label: 'Activo' },
  { value: 'inactive', label: 'Suspendido' },
  { value: 'archived', label: 'Archivado' },
]

const columns = [
  { field: 'fullName', header: 'Empleado', sortable: true },
  { field: 'companyName', header: 'Compañía', sortable: true },
  { field: 'email', header: 'Correo' },
  { field: 'position', header: 'Puesto' },
  { field: 'department', header: 'Departamento' },
  { field: 'contractType', header: 'Contrato' },
  { field: 'status', header: 'Estado' },
]

const canWriteEmployees = computed(() => authStore.hasPermission('employees:write'))

const rowActions = computed(() => (
  [
    { key: 'view', label: 'Ver detalle', icon: Eye },
    ...(canWriteEmployees.value
      ? [
          { key: 'edit', label: 'Editar', icon: Pencil },
          { key: 'archive', label: 'Archivar', icon: Archive, variant: 'warning', hidden: (row) => row.status === 'archived' },
        ]
      : []),
  ]
))

const companyIds = computed(() =>
  authStore.scopedCompanyIds
)

const companyOptions = computed(() =>
  companies.value.map(c => ({ value: String(c.id), label: c.name, meta: c.rfc || '' }))
)

const departmentOptions = computed(() =>
  [...new Set(employees.value.map(e => e.department).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'es')).map(value => ({ value, label: value }))
)

const filters = computed(() => [
  {
    key: 'search',
    label: 'Búsqueda',
    type: 'search',
    placeholder: 'Nombre, CURP, RFC...',
  },
  {
    key: 'companyId',
    label: 'Compañía',
    type: 'select',
    placeholder: 'Todas las compañías',
    options: companyOptions.value,
  },
  {
    key: 'department',
    label: 'Departamento',
    type: 'select',
    placeholder: 'Todos los departamentos',
    options: departmentOptions.value,
  },
  {
    key: 'contractType',
    label: 'Contrato',
    type: 'select',
    placeholder: 'Todos los contratos',
    options: [
      { value: 'indefinido', label: 'Indefinido' },
      { value: 'temporal', label: 'Temporal' },
      { value: 'capacitacion', label: 'Capacitación' },
      { value: 'temporada', label: 'Temporada' },
    ],
  },
  {
    key: 'status',
    label: 'Estado',
    type: 'select',
    placeholder: 'Todos los estados',
    options: [
      { value: 'active', label: 'Activo' },
      { value: 'inactive', label: 'Suspendido' },
      { value: 'archived', label: 'Archivado' },
    ],
  },
  {
    key: 'hasUser',
    label: 'Acceso de usuario',
    type: 'select',
    placeholder: 'Cualquiera',
    options: [
      { value: 'si', label: 'Con acceso de usuario' },
      { value: 'no', label: 'Sin acceso de usuario' },
    ],
    filterFn: (row, value) => (value === 'si') === !!row.hasUser,
  },
  {
    key: 'hireRange',
    label: 'Alta (fecha)',
    type: 'dateRange',
    placeholder: 'Rango de fechas',
    field: 'hireDate',
  },
])
const filterModel = ref({})

function clearFilters() {
  filterModel.value = {}
}
const filteredData = useFilteredData(employees, filterModel, () => filters.value, { searchFields: ['fullName', 'curp', 'rfc', 'nss', 'id', 'email', 'position', 'department', 'companyName'] })


const visibleFilterKeys = ['companyId', 'status']

const maxWizardStep = 5

const stepLabels = [
  { num: 1, label: 'Identidad', icon: 'UserIcon' },
  { num: 2, label: 'Contacto', icon: 'MailIcon' },
  { num: 3, label: 'Contrato', icon: 'FileTextIcon' },
  { num: 4, label: 'Pago', icon: 'CreditCardIcon' },
  { num: 5, label: 'Revisar', icon: 'CheckCircleIcon' },
]

const maskId = (v, max) => String(v || '').toUpperCase().replace(/[^A-Z0-9&]/g, '').slice(0, max)
const digitsOnly = (v, max) => String(v || '').replace(/\D/g, '').slice(0, max)

const form = reactive({})

const selectedCompany = computed(() =>
  companies.value.find(c => String(c.id) === String(form.companyId)) || null
)

const companyDomain = computed(() => {
  const d = selectedCompany.value?.domain
  return d && isValidDomain(d) ? d : ''
})

const autoEmail = computed(() => corporateEmail(form.rfc, companyDomain.value))

watch(
  () => [form.companyId, form.rfc, form.emailAuto],
  () => {
    if (form.emailAuto) form.email = autoEmail.value
  },
  { immediate: false },
)

let piiVisible = {}

watch(() => form.curp, v => { const m = maskId(v, 18); if (m !== v) form.curp = m })
watch(() => form.rfc, v => { const m = maskId(v, 13); if (m !== v) form.rfc = m })
watch(() => form.nss, v => { const m = digitsOnly(v, 11); if (m !== v) form.nss = m })
watch(() => form.clabe, v => { const m = digitsOnly(v, 18); if (m !== v) form.clabe = m })

function formatCurrency(value) {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(value || 0)
}

function maskValue(value, visible) {
  if (visible) return value
  if (!value) return '—'
  return '••••••••'
}

async function loadData() {
  isLoading.value = true
  const [empRes, compRes] = await Promise.all([
    getEmployees(companyIds.value),
    getCompanies(companyIds.value),
  ])
  if (empRes.ok) employees.value = empRes.data
  if (compRes.ok) companies.value = compRes.data
  loadAccess()
  isLoading.value = false
}

async function loadAccess() {
  const res = await getUsers(companyIds.value)
  if (!res.ok) return
  const userEmails = new Set(res.data.map(u => u.email.toLowerCase()))
  employees.value = employees.value.map(e => ({ ...e, hasUser: userEmails.has(String(e.email || '').toLowerCase()) }))
}

function resetForm() {
  Object.assign(form, {
    companyId: companies.value[0]?.id ? String(companies.value[0].id) : '',
    firstName: '',
    middleName: '',
    lastName: '',
    curp: '',
    rfc: '',
    nss: '',
    email: '',
    phone: '',
    birthDate: '',
    hireDate: '',
    department: '',
    position: '',
    contractType: 'indefinido',
    salary: '',
    bank: '',
    clabe: '',
    address: '',
    status: 'active',
    emailAuto: true,
    // Temporal fields
    contractEndDate: '',
  })
  Object.keys(errors).forEach(k => delete errors[k])
  wizardStep.value = 1
  piiVisible = {}
}

function openCreate() {
  if (!canWriteEmployees.value) return
  editingId.value = null
  resetForm()
  wizardOpen.value = true
}

function openEdit(row) {
  if (!canWriteEmployees.value) return
  editingId.value = row.id
  Object.assign(form, {
    companyId: String(row.companyId),
    firstName: row.firstName,
    middleName: row.middleName || '',
    lastName: row.lastName,
    curp: row.curp,
    rfc: row.rfc,
    nss: row.nss,
    email: row.email,
    emailAuto: row.emailCustomized !== true,
    phone: row.phone,
    birthDate: row.birthDate,
    hireDate: row.hireDate,
    department: row.department,
    position: row.position,
    contractType: row.contractType,
    salary: row.salary,
    bank: row.bank,
    clabe: row.clabe,
    address: row.address,
    status: row.status,
    contractEndDate: row.contractEndDate || '',
  })
  wizardStep.value = 1
  wizardOpen.value = true
}

function openView(row) {
  piiVisible[row.id] = !piiVisible[row.id]
}

function nextStep() {
  if (wizardStep.value < maxWizardStep) {
    wizardStep.value++
  }
}

function prevStep() {
  if (wizardStep.value > 1) {
    wizardStep.value--
  }
}

function validateStep(step) {
  Object.keys(errors).forEach(k => delete errors[k])
  let valid = true

  const getVal = (key) => form[key] ?? ''

  if (step === 1) {
    if (!getVal('companyId')) { errors.companyId = 'Selecciona una compañía'; valid = false }
    if (!getVal('firstName').trim()) { errors.firstName = 'El nombre es obligatorio'; valid = false }
    if (!getVal('lastName').trim()) { errors.lastName = 'El apellido es obligatorio'; valid = false }
    if (!getVal('curp').trim()) { errors.curp = 'La CURP es obligatoria'; valid = false }
    else if (!/^[A-Z]{4}\d{6}[HM][A-Z]{5}[A-Z0-9]\d$/i.test(getVal('curp').trim())) { errors.curp = 'CURP con formato inválido'; valid = false }
    if (!getVal('rfc').trim()) { errors.rfc = 'El RFC es obligatorio'; valid = false }
    else if (!/^[A-ZÑ&]{3,4}\d{6}[A-Z0-9]{3}$/i.test(getVal('rfc').trim())) { errors.rfc = 'RFC con formato inválido'; valid = false }
    if (!getVal('nss').trim()) { errors.nss = 'El NSS es obligatorio'; valid = false }
  }

  if (step === 2) {
    if (form.emailAuto) {
      if (!companyDomain.value) { errors.email = 'La compañía no tiene dominio válido; captura un correo manual o configura el dominio'; valid = false }
      else if (!autoEmail.value) { errors.email = 'No se pudo generar el correo: revisa el RFC capturado'; valid = false }
    } else {
      if (!getVal('email').trim()) { errors.email = 'El correo es obligatorio'; valid = false }
      else if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(getVal('email').trim())) { errors.email = 'Email inválido'; valid = false }
    }
    if (!getVal('birthDate')) { errors.birthDate = 'Fecha de nacimiento obligatoria'; valid = false }
    if (!getVal('phone').trim()) { errors.phone = 'Teléfono obligatorio'; valid = false }
  }

  if (step === 3) {
    if (!getVal('hireDate')) { errors.hireDate = 'Fecha de ingreso obligatoria'; valid = false }
    if (!getVal('department').trim()) { errors.department = 'Departamento obligatorio'; valid = false }
    if (!getVal('position').trim()) { errors.position = 'Puesto obligatorio'; valid = false }
    if (!getVal('contractType')) { errors.contractType = 'Tipo de contrato obligatorio'; valid = false }
    if (getVal('contractType') === 'temporal' && !getVal('contractEndDate')) { errors.contractEndDate = 'Fecha de fin obligatoria para contrato temporal'; valid = false }
  }

  if (step === 4) {
    if (getVal('salary') === '' || Number(getVal('salary')) <= 0) { errors.salary = 'Captura un salario válido'; valid = false }
    if (!getVal('bank').trim()) { errors.bank = 'Banco obligatorio'; valid = false }
    if (!getVal('clabe').trim()) { errors.clabe = 'CLABE obligatoria'; valid = false }
    else if (!/^\d{18}$/.test(getVal('clabe'))) { errors.clabe = 'CLABE debe tener 18 dígitos'; valid = false }
  }

  return valid
}

async function handleSave() {
  if (!validateStep(wizardStep.value)) return

  if (wizardStep.value < maxWizardStep) {
    nextStep()
    return
  }

  // Final validation
  if (!validateStep(maxWizardStep)) return

  isSaving.value = true

  const payload = {
    ...form,
    email: form.emailAuto ? autoEmail.value : form.email.trim(),
    emailCustomized: !form.emailAuto,
    companyId: Number(form.companyId),
    salary: Number(form.salary),
    curp: form.curp.toUpperCase().trim(),
    rfc: form.rfc.toUpperCase().trim(),
  }
  const res = editingId.value
    ? await updateEmployee(editingId.value, payload)
    : await createEmployee(payload)

  if (res.ok) {
    toastStore.success(res.message)
    wizardOpen.value = false
    await loadData()
  } else {
    toastStore.error(res.message)
  }
  isSaving.value = false
}

function askArchive(row) {
  if (!canWriteEmployees.value) return
  pendingArchive.value = row
}

async function confirmArchive() {
  // Soft delete - marcar como archivado
  const res = await updateEmployee(pendingArchive.value.id, { status: 'archived' })
  if (res.ok) {
    toastStore.success('Empleado archivado correctamente')
    await loadData()
  } else {
    toastStore.error(res.message)
  }
  pendingArchive.value = null
}

function handleAction({ action, row }) {
  if (action === 'view') openView(row)
  if (action === 'edit') openEdit(row)
  if (action === 'archive') askArchive(row)
}

onMounted(loadData)
</script>

<template>
  <div class="space-y-7">
    <PageHeader
      title="Empleados"
      description="Administra el padrón de empleados de tus compañías"
      :icon="Users"
    >
      <template #actions>
        <Button v-if="canWriteEmployees" variant="primary" :icon="Plus" @click="openCreate">Nuevo empleado</Button>
      </template>
    </PageHeader>

    <DataFilterBar
      v-model="filterModel"
      :filters="filters"
      :visible-filter-keys="visibleFilterKeys"
      :results-count="filteredData.length"
      :loading="isLoading"
      @filter-change="() => {}"
      @clear-all="clearFilters"
    />

    <Table
      :columns="columns"
      :data="filteredData"
      :loading="isLoading"
      :actions="rowActions"
      :filterable="false"
      empty-message="No hay empleados registrados"
      @action="handleAction"
    >
      <template #fullName="{ row }">
        <div>
          <p class="font-semibold text-ink">{{ row.fullName }}</p>
          <p v-if="piiVisible[row.id]" class="text-xs text-ink-muted font-mono">{{ row.curp }}</p>
          <p v-else class="text-xs text-ink-muted">CURP oculta · <button type="button" class="text-primary-600 hover:underline text-xs" @click.stop="openView(row)">Mostrar</button></p>
        </div>
      </template>
      <template #email="{ row }">
        <div class="flex flex-col gap-0.5">
          <span class="text-sm text-ink break-all">{{ row.email }}</span>
          <Badge :variant="row.emailCustomized ? 'neutral' : 'info'" size="sm" class="w-fit">
            {{ row.emailCustomized ? 'Personalizado' : 'Auto (RFC@dominio)' }}
          </Badge>
        </div>
      </template>
      <template #contractType="{ row }">
        <Badge :variant="row.contractType === 'indefinido' ? 'success' : 'info'" size="sm">
          {{ row.contractType }}
        </Badge>
      </template>
      <template #status="{ row }">
        <Badge :variant="row.status === 'active' ? 'success' : row.status === 'archived' ? 'neutral' : 'warning'" dot>
          {{ row.status === 'active' ? 'Activo' : row.status === 'archived' ? 'Archivado' : 'Inactivo' }}
        </Badge>
      </template>
      <template #empty-action>
        <Button v-if="canWriteEmployees" variant="primary" size="sm" :icon="Plus" @click="openCreate">Añadir empleado</Button>
      </template>
    </Table>

    <!-- Wizard Modal -->
    <Modal v-model="wizardOpen" :title="editingId ? 'Editar empleado' : 'Nuevo empleado'" size="xl" hideFooter>
      <div class="space-y-6">
        <!-- Stepper -->
        <div class="card p-6">
          <div class="flex items-center justify-between">
            <template v-for="(step, index) in stepLabels" :key="step.num">
              <div class="flex items-center">
                <div class="flex items-center gap-2">
                  <div
                    :class="[
                      'w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all',
                      index + 1 < wizardStep ? 'bg-success-500 text-white' :
                      index + 1 === wizardStep ? 'bg-primary-600 text-white' :
                      'bg-neutral-200 text-neutral-500'
                    ]"
                  >
                    <component
                      v-if="index + 1 < wizardStep"
                      :is="CheckCircleIcon"
                      class="w-5 h-5"
                    />
                    <span v-else>{{ step.num }}</span>
                  </div>
                </div>
                <div v-if="index < stepLabels.length - 1" class="flex-1 max-w-[100px] h-1 bg-neutral-200 mx-4">
                  <div
                    :class="[
                      'h-full rounded-full transition-all duration-300',
                      index + 1 < wizardStep ? 'bg-success-500' : 'bg-neutral-200'
                    ]"
                    :style="{ width: index + 1 < wizardStep ? '100%' : '0%' }"
                  />
                </div>
              </div>
            </template>
          </div>
        </div>

        <Alert v-if="Object.keys(errors).length" variant="danger" class="mb-4">
          Por favor corrige los errores en el paso actual antes de continuar.
        </Alert>

        <!-- Paso 1: Identidad -->
        <div v-show="wizardStep === 1" key="step-1" class="space-y-6">
          <Card class="p-6">
            <h2 class="text-lg font-semibold text-ink mb-4 flex items-center gap-2">
              <UserIcon class="w-5 h-5 text-primary-600" /> Identidad fiscal
            </h2>
            <p class="text-sm text-ink-muted mb-4">Datos obligatorios para cumplimiento fiscal (CURP, RFC, NSS)</p>

            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <Select id="emp-company" v-model="form.companyId" label="Compañía *" :options="companyOptions" :error="errors.companyId" required />
              <Input id="emp-first" v-model="form.firstName" label="Nombre(s) *" required :error="errors.firstName" placeholder="Juan" />
              <Input id="emp-middle" v-model="form.middleName" label="Segundo apellido" placeholder="Carlos" />
              <Input id="emp-last" v-model="form.lastName" label="Apellido(s) *" required :error="errors.lastName" placeholder="Pérez" />
              <Input id="emp-curp" v-model="form.curp" label="CURP *" required :error="errors.curp" placeholder="PEPJ900101HDFRRN09" inputmode="text" :maxlength="18" help="18 caracteres: 4 letras, 6 dígitos, H/M, 5 letras, 1 dígito, 1 dígito" />
              <Input id="emp-rfc" v-model="form.rfc" label="RFC *" required :error="errors.rfc" placeholder="PEPJ900101XXX" inputmode="text" :maxlength="13" help="13 caracteres: 4 letras, 6 dígitos, 3 homoclave" />
              <Input id="emp-nss" v-model="form.nss" label="NSS *" required :error="errors.nss" placeholder="12345678901" inputmode="numeric" :maxlength="11" help="11 dígitos numéricos" />
            </div>
          </Card>
        </div>

        <!-- Paso 2: Contacto -->
        <div v-show="wizardStep === 2" key="step-2" class="space-y-6">
          <Card class="p-6">
            <h2 class="text-lg font-semibold text-ink mb-4 flex items-center gap-2">
              <MailIcon class="w-5 h-5 text-primary-600" /> Datos de contacto
            </h2>

            <div class="flex flex-wrap items-center justify-between gap-3 mb-4 rounded-xl border border-teal-100 bg-teal-50/50 px-4 py-3">
              <Checkbox
                id="emp-email-auto"
                v-model="form.emailAuto"
                :disabled="!companyDomain"
                label="Correo corporativo automático (RFC@dominio de la compañía)"
              />
              <Badge :variant="form.emailAuto ? 'info' : 'neutral'" size="sm">
                {{ form.emailAuto ? 'Automático' : 'Personalizado' }}
              </Badge>
            </div>
            <p v-if="!companyDomain" class="text-xs text-warning-700 -mt-2 mb-4" role="alert">
              La compañía seleccionada no tiene un dominio válido (p. ej. empresademo.com); captura un correo manual o configura el dominio en la compañía.
            </p>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div class="sm:col-span-2">
                <Input
                  id="emp-email"
                  v-model="form.email"
                  type="email"
                  label="Correo electrónico *"
                  required
                  :disabled="form.emailAuto"
                  :error="errors.email"
                  :hint="form.emailAuto ? 'Se genera desde el RFC del empleado y el dominio de la compañía (ej. rfc@empresademo.com). Desmarca la casilla para personalizarlo.' : 'Correo personalizado; deja desmarcada la casilla de correo automático.'"
                  placeholder="rfc@empresademo.com"
                />
              </div>
              <Input id="emp-phone" v-model="form.phone" label="Teléfono *" required :error="errors.phone" placeholder="55-1234-5678" />
              <Input id="emp-birth" v-model="form.birthDate" type="date" label="Fecha de nacimiento *" required :error="errors.birthDate" />
            </div>
          </Card>
        </div>

        <!-- Paso 3: Contrato -->
        <div v-show="wizardStep === 3" key="step-3" class="space-y-6">
          <Card class="p-6">
            <h2 class="text-lg font-semibold text-ink mb-4 flex items-center gap-2">
              <FileTextIcon class="w-5 h-5 text-primary-600" /> Contrato y puesto
            </h2>

            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <Input id="emp-hire" v-model="form.hireDate" type="date" label="Fecha de ingreso *" required :error="errors.hireDate" />
              <Input id="emp-department" v-model="form.department" label="Departamento *" required :error="errors.department" placeholder="Ventas" />
              <Input id="emp-position" v-model="form.position" label="Puesto *" required :error="errors.position" placeholder="Ejecutivo de Ventas" />
              <Select id="emp-contract" v-model="form.contractType" label="Tipo de contrato *" :options="contractOptions" :error="errors.contractType" required />
              <Input id="emp-contract-end" v-model="form.contractEndDate" type="date" label="Fecha fin (si temporal)" :error="errors.contractEndDate" v-show="form.contractType === 'temporal'" />
            </div>
          </Card>
        </div>

        <!-- Paso 4: Pago -->
        <div v-show="wizardStep === 4" key="step-4" class="space-y-6">
          <Card class="p-6">
            <h2 class="text-lg font-semibold text-ink mb-4 flex items-center gap-2">
              <CreditCardIcon class="w-5 h-5 text-primary-600" /> Datos de pago
            </h2>
            <p class="text-sm text-ink-muted mb-4">Información bancaria para nómina (se muestra oculta por defecto)</p>

            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <Input id="emp-salary" v-model="form.salary" type="number" label="Salario mensual *" required :error="errors.salary" placeholder="15000" help="En MXN, sin centavos" />
              <Input id="emp-bank" v-model="form.bank" label="Banco *" required :error="errors.bank" placeholder="BBVA" />
              <Input id="emp-clabe" v-model="form.clabe" label="CLABE *" required :error="errors.clabe" inputmode="numeric" :maxlength="18" placeholder="012345678901234567" help="18 dígitos numéricos" />
              <Select id="emp-status" v-model="form.status" label="Estado" :options="statusOptions" />
            </div>
          </Card>
        </div>

        <!-- Paso 5: Revisar -->
        <div v-show="wizardStep === 5" key="step-5" class="space-y-6">
          <Card class="p-6">
            <h2 class="text-lg font-semibold text-ink mb-4 flex items-center gap-2">
              <CheckCircleIcon class="w-5 h-5 text-primary-600" /> Revisar y confirmar
            </h2>
            <p class="text-sm text-ink-muted mb-4">Verifica que todos los datos sean correctos antes de guardar</p>

            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <h3 class="font-semibold text-ink mb-3">Identidad</h3>
                <dl class="space-y-2 text-sm">
                  <div class="flex justify-between"><dt class="text-ink-muted">Nombre completo</dt><dd class="font-medium text-ink">{{ [form.firstName, form.middleName, form.lastName].filter(Boolean).join(' ') }}</dd></div>
                  <div class="flex justify-between"><dt class="text-ink-muted">CURP</dt><dd class="font-mono text-ink">{{ form.curp }}</dd></div>
                  <div class="flex justify-between"><dt class="text-ink-muted">RFC</dt><dd class="font-mono text-ink">{{ form.rfc }}</dd></div>
                  <div class="flex justify-between gap-4"><dt class="text-ink-muted">NSS</dt><dd class="font-mono text-ink">{{ form.nss }}</dd></div>
                  <div class="flex justify-between gap-4"><dt class="text-ink-muted">Correo</dt><dd class="text-right"><span class="font-medium text-ink break-all">{{ form.email }}</span><br><Badge :variant="form.emailAuto ? 'info' : 'neutral'" size="sm">{{ form.emailAuto ? 'Auto (RFC@dominio)' : 'Personalizado' }}</Badge></dd></div>
                </dl>
              </div>
              <div>
                <h3 class="font-semibold text-ink mb-3">Contrato y pago</h3>
                <dl class="space-y-2 text-sm">
                  <div class="flex justify-between"><dt class="text-ink-muted">Puesto</dt><dd class="font-medium text-ink">{{ form.position }}</dd></div>
                  <div class="flex justify-between"><dt class="text-ink-muted">Departamento</dt><dd class="font-medium text-ink">{{ form.department }}</dd></div>
                  <div class="flex justify-between"><dt class="text-ink-muted">Contrato</dt><dd class="font-medium text-ink">{{ form.contractType }}{{ form.contractType === 'temporal' && form.contractEndDate ? ' (hasta ' + form.contractEndDate + ')' : '' }}</dd></div>
                  <div class="flex justify-between"><dt class="text-ink-muted">Salario</dt><dd class="font-medium text-ink">${{ Number(form.salary).toLocaleString() }} MXN</dd></div>
                  <div class="flex justify-between"><dt class="text-ink-muted">Banco / CLABE</dt><dd class="font-mono text-ink">{{ form.bank }} / {{ form.clabe }}</dd></div>
                </dl>
              </div>
            </div>

            <Alert variant="warning" class="mt-4">
              <p class="font-medium">Al guardar, se creará/actualizará el empleado en el sistema.</p>
              <p class="text-sm mt-1">Los datos fiscales (CURP, RFC, NSS) son sensibles y se mostrarán ocultos por defecto.</p>
            </Alert>
          </Card>
        </div>

        <!-- Navegación del wizard -->
        <div class="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-t border-neutral-100 p-4 lg:static lg:bg-transparent lg:border-0 lg:p-0 flex gap-3 justify-end">
          <Button v-if="wizardStep > 1" variant="ghost" @click="prevStep" :icon="ChevronLeftIcon">
            Anterior
          </Button>
          <Button v-if="wizardStep < maxWizardStep" variant="primary" @click="nextStep" :disabled="!validateStep(wizardStep)" :icon="ChevronRightIcon" iconRight>
            Siguiente
          </Button>
          <Button v-if="wizardStep === maxWizardStep" variant="primary" @click="handleSave" :loading="isSaving" :icon="ShieldCheck" iconRight>
            Guardar empleado
          </Button>
          <Button v-if="wizardStep === maxWizardStep" variant="secondary" @click="wizardOpen = false">
            Cancelar
          </Button>
        </div>
      </div>
    </Modal>

    <!-- Archive Confirmation -->
    <Modal v-model="pendingArchive" title="Archivar empleado" size="sm">
      <p class="text-ink-soft">
        ¿Seguro que deseas archivar a <strong class="text-ink">{{ pendingArchive?.fullName }}</strong>?
      </p>
      <p class="text-sm text-ink-muted mt-2">El empleado pasará a estado "Archivado" y se ocultará de las listas por defecto. Se conservará todo su historial.</p>
      <template #footer>
        <Button variant="secondary" @click="pendingArchive = null">Cancelar</Button>
        <Button variant="warning" @click="confirmArchive" :icon="Archive">Archivar</Button>
      </template>
    </Modal>
  </div>
</template>

<script>
import UserIcon from '@/shared/components/icons/UserIcon.vue'
import MailIcon from '@/shared/components/icons/MailIcon.vue'
import FileTextIcon from '@/shared/components/icons/FileTextIcon.vue'
import CreditCardIcon from '@/shared/components/icons/CreditCardIcon.vue'
import CheckCircleIcon from '@/shared/components/icons/CheckCircleIcon.vue'
import ChevronLeftIcon from '@/shared/components/icons/ChevronLeftIcon.vue'
import ChevronRightIcon from '@/shared/components/icons/ChevronRightIcon.vue'
import ShieldCheckIcon from '@/shared/components/icons/ShieldCheckIcon.vue'
import ArchiveIcon from '@/shared/components/icons/ArchiveIcon.vue'

export default {
  components: {
    UserIcon,
    MailIcon,
    FileTextIcon,
    CreditCardIcon,
    CheckCircleIcon,
    ChevronLeftIcon,
    ChevronRightIcon,
    ShieldCheckIcon,
    ArchiveIcon,
  }
}
</script>