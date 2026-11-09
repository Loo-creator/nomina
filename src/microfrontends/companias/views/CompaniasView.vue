<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { Pencil, Trash2, Plus, Building2 } from 'lucide-vue-next'
import PageHeader from '@/shared/components/PageHeader.vue'
import Table from '@/shared/components/Table.vue'
import Button from '@/shared/components/Button.vue'
import Badge from '@/shared/components/Badge.vue'
import Modal from '@/shared/components/Modal.vue'
import Input from '@/shared/components/Input.vue'
import Select from '@/shared/components/Select.vue'
import DataFilterBar from '@/shared/components/DataFilterBar.vue'
import { useFilteredData } from '@/shared/composables/useFilteredData'
import { useAuthStore } from '@/shared/stores/auth'
import { useToastStore } from '@/shared/stores/toast'
import { getCompanies, createCompany, updateCompany, deleteCompany } from '@/services/companies.service'
import { FISCAL_REGIME_OPTIONS } from '@/shared/utils/constants'
import { isValidDomain } from '@/shared/utils/email'

const authStore = useAuthStore()
const toastStore = useToastStore()

const companies = ref([])
const isLoading = ref(false)
const isSaving = ref(false)
const modalOpen = ref(false)
const confirmOpen = ref(false)
const editingId = ref(null)
const pendingDelete = ref(null)
const errors = reactive({})

const regimenOptions = FISCAL_REGIME_OPTIONS

const statusOptions = [
  { value: 'active', label: 'Activo' },
  { value: 'inactive', label: 'Suspendido' },
  { value: 'archived', label: 'Archivado' },
]

const columns = [
  { field: 'name', header: 'Compañía', sortable: true },
  { field: 'rfc', header: 'RFC', sortable: true },
  { field: 'regimen', header: 'Régimen' },
  { field: 'email', header: 'Contacto', searchable: true },
  { field: 'status', header: 'Estado' },
  { field: 'createdAt', header: 'Alta', sortable: true },
]

const canWriteCompanies = computed(() => authStore.hasPermission('companies:write'))

const rowActions = computed(() => (
  canWriteCompanies.value
    ? [
        { key: 'edit', label: 'Editar', icon: Pencil },
        { key: 'delete', label: 'Eliminar', icon: Trash2, variant: 'danger' },
      ]
    : []
))

const filters = [
  {
    key: 'search',
    label: 'Búsqueda',
    type: 'search',
    placeholder: 'Nombre, RFC...',
  },
  {
    key: 'name',
    label: 'Nombre',
    type: 'text',
    placeholder: 'Buscar nombre...',
  },
  {
    key: 'rfc',
    label: 'RFC',
    type: 'text',
    placeholder: 'Buscar RFC...',
  },
  {
    key: 'status',
    label: 'Estado',
    type: 'select',
    placeholder: 'Todos los estados',
    options: statusOptions,
  },
  {
    key: 'createdRange',
    label: 'Alta (fecha)',
    type: 'dateRange',
    placeholder: 'Rango de fechas',
    field: 'createdAt',
  },
  {
    key: 'regimen',
    label: 'Régimen',
    type: 'select',
    placeholder: 'Todos los regímenes',
    options: regimenOptions,
  },
  {
    key: 'createdAt',
    label: 'Alta desde',
    type: 'date',
    placeholder: 'Alta desde',
  },
]
const filterModel = ref({})

function clearFilters() {
  filterModel.value = {}
}
const filteredData = useFilteredData(companies, filterModel, filters, { searchFields: ['name', 'rfc', 'email'] })


const visibleFilterKeys = ['status', 'regimen']

const form = reactive({
  name: '',
  rfc: '',
  regimen: '601',
  email: '',
  domain: '',
  phone: '',
  address: '',
  status: 'active',
})

const modalTitle = computed(() => (editingId.value ? 'Editar compañía' : 'Nueva compañía'))

const companyIds = computed(() =>
  authStore.scopedCompanyIds
)

function regimenLabel(value) {
  return regimenOptions.find(o => o.value === value)?.label || value || '—'
}

async function loadCompanies() {
  isLoading.value = true
  const res = await getCompanies(companyIds.value)
  if (res.ok) companies.value = res.data
  else toastStore.error(res.message)
  isLoading.value = false
}

function resetForm() {
  Object.assign(form, {
    name: '',
    rfc: '',
    regimen: '601',
    email: '',
    domain: '',
    phone: '',
    address: '',
    status: 'active',
  })
  Object.keys(errors).forEach(k => delete errors[k])
}

function openCreate() {
  if (!canWriteCompanies.value) return
  editingId.value = null
  resetForm()
  modalOpen.value = true
}

function openEdit(row) {
  if (!canWriteCompanies.value) return
  editingId.value = row.id
  Object.assign(form, {
    name: row.name,
    rfc: row.rfc,
    regimen: row.regimen,
    email: row.email,
    domain: row.domain || '',
    phone: row.phone,
    address: row.address,
    status: row.status,
  })
  modalOpen.value = true
}

function validate() {
  Object.keys(errors).forEach(k => delete errors[k])
  if (!form.name.trim()) errors.name = 'El nombre es obligatorio'
  if (!form.rfc.trim()) errors.rfc = 'El RFC es obligatorio'
  else if (!/^[A-ZÑ&]{3,4}\d{6}[A-Z0-9]{3}$/i.test(form.rfc.trim())) errors.rfc = 'RFC con formato inválido'
  if (form.email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email)) errors.email = 'Email inválido'
  if (form.domain && !isValidDomain(form.domain)) errors.domain = 'Dominio inválido (ej. empresa.com)'
  return Object.keys(errors).length === 0
}

async function handleSave() {
  if (!validate()) return
  isSaving.value = true

  const payload = { ...form, rfc: form.rfc.toUpperCase().trim(), name: form.name.trim() }
  const res = editingId.value
    ? await updateCompany(editingId.value, payload)
    : await createCompany(payload)

  if (res.ok) {
    toastStore.success(res.message)
    modalOpen.value = false
    await loadCompanies()
  } else {
    toastStore.error(res.message)
  }
  isSaving.value = false
}

function askDelete(row) {
  if (!canWriteCompanies.value) return
  pendingDelete.value = row
  confirmOpen.value = true
}

async function confirmDelete() {
  const res = await deleteCompany(pendingDelete.value.id)
  if (res.ok) {
    toastStore.success(res.message)
    await loadCompanies()
  } else {
    toastStore.error(res.message)
  }
  confirmOpen.value = false
  pendingDelete.value = null
}

function handleAction({ action, row }) {
  if (action === 'edit') openEdit(row)
  if (action === 'delete') askDelete(row)
}

onMounted(loadCompanies)
</script>

<template>
  <div class="space-y-7">
    <PageHeader
      title="Compañías"
      description="Gestiona las compañías registradas en el sistema"
      :icon="Building2"
    >
      <template #actions>
        <Button v-if="canWriteCompanies" variant="primary" :icon="Plus" @click="openCreate">Nueva compañía</Button>
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
      empty-message="No hay compañías registradas"
      @action="handleAction"
    >
      <template #name="{ row }">
        <span class="font-semibold text-ink">{{ row.name }}</span>
      </template>
      <template #rfc="{ row }">
        <span class="font-mono text-xs text-ink-soft">{{ row.rfc }}</span>
      </template>
      <template #regimen="{ row }">
        <span class="text-sm text-ink-soft">{{ regimenLabel(row.regimen) }}</span>
      </template>
      <template #status="{ row }">
        <Badge :variant="row.status === 'active' ? 'success' : 'neutral'" dot>
          {{ row.status === 'active' ? 'Activa' : 'Inactiva' }}
        </Badge>
      </template>
      <template #empty-action>
        <Button v-if="canWriteCompanies" variant="primary" size="sm" :icon="Plus" @click="openCreate">Añadir compañía</Button>
      </template>
    </Table>

    <Modal v-model="modalOpen" :title="modalTitle" size="lg">
      <form class="grid grid-cols-1 sm:grid-cols-2 gap-4" @submit.prevent="handleSave">
        <div class="sm:col-span-2">
          <Input id="company-name" v-model="form.name" label="Razón social" required :error="errors.name" placeholder="Empresa SA de CV" />
        </div>
        <Input id="company-rfc" v-model="form.rfc" label="RFC" required :error="errors.rfc" placeholder="EMP123456789" />
        <Select id="company-regimen" v-model="form.regimen" label="Régimen fiscal" :options="regimenOptions" />
        <Input id="company-email" v-model="form.email" type="email" label="Correo de contacto" :error="errors.email" placeholder="contacto@empresa.com" />
        <Input id="company-domain" v-model="form.domain" label="Dominio corporativo" :error="errors.domain" placeholder="empresa.com" />
        <Input id="company-phone" v-model="form.phone" label="Teléfono" placeholder="55-1234-5678" />
        <div class="sm:col-span-2">
          <Input id="company-address" v-model="form.address" label="Dirección" placeholder="Calle, número, colonia, ciudad" />
        </div>
        <Select id="company-status" v-model="form.status" label="Estado" :options="statusOptions" />
      </form>

      <template #footer>
        <Button variant="secondary" @click="modalOpen = false">Cancelar</Button>
        <Button variant="primary" :loading="isSaving" @click="handleSave">Guardar</Button>
      </template>
    </Modal>

    <Modal v-model="confirmOpen" title="Eliminar compañía" size="sm">
      <p class="text-ink-soft">
        ¿Seguro que deseas eliminar <strong class="text-ink">{{ pendingDelete?.name }}</strong>? Esta acción no se puede deshacer.
      </p>
      <template #footer>
        <Button variant="secondary" @click="confirmOpen = false">Cancelar</Button>
        <Button variant="danger" @click="confirmDelete">Eliminar</Button>
      </template>
    </Modal>
  </div>
</template>