<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Eye, Pencil, Ban, CircleCheck, Plus, Briefcase, Building2, Users, PauseCircle } from 'lucide-vue-next'
import PageHeader from '@/shared/components/PageHeader.vue'
import Card from '@/shared/components/Card.vue'
import Table from '@/shared/components/Table.vue'
import Button from '@/shared/components/Button.vue'
import Badge from '@/shared/components/Badge.vue'
import Modal from '@/shared/components/Modal.vue'
import DataFilterBar from '@/shared/components/DataFilterBar.vue'
import TenantFormModal from '@/microfrontends/clientes/components/TenantFormModal.vue'
import { useFilteredData } from '@/shared/composables/useFilteredData'
import { useToastStore } from '@/shared/stores/toast'
import { useTenantsStore } from '@/shared/stores/tenants'
import { formatDate, formatNumber } from '@/shared/utils/format'
import { TENANT_PLAN_LABELS, TENANT_STATUS_LABELS } from '@/shared/utils/constants'

const router = useRouter()
const toastStore = useToastStore()
const tenantsStore = useTenantsStore()

const tenants = computed(() => tenantsStore.tenants)
const isLoading = computed(() => tenantsStore.isLoading)
const isSaving = computed(() => tenantsStore.isSaving)

const modalOpen = ref(false)
const editingTenant = ref(null)
const statusConfirmOpen = ref(false)
const pendingStatusChange = ref(null)

const planOptions = Object.entries(TENANT_PLAN_LABELS).map(([value, label]) => ({ value, label }))
const statusOptions = Object.entries(TENANT_STATUS_LABELS).map(([value, label]) => ({ value, label }))

const columns = [
  { field: 'name', header: 'Cliente', sortable: true },
  { field: 'contactName', header: 'Contacto' },
  { field: 'plan', header: 'Plan', sortable: true },
  { field: 'rfcCount', header: 'RFCs', sortable: true, align: 'center' },
  { field: 'employeeCount', header: 'Empleados', sortable: true, align: 'center' },
  { field: 'status', header: 'Estado' },
  { field: 'createdAt', header: 'Alta', sortable: true },
]

const rowActions = [
  { key: 'view', label: 'Ver detalle', icon: Eye },
  { key: 'edit', label: 'Editar', icon: Pencil },
  { key: 'suspend', label: 'Suspender', icon: Ban, variant: 'danger', hidden: (row) => row.status !== 'active' },
  { key: 'activate', label: 'Reactivar', icon: CircleCheck, hidden: (row) => row.status !== 'suspended' },
]

const filters = [
  { key: 'search', label: 'Búsqueda', type: 'search', placeholder: 'Cliente, RFC, correo...' },
  { key: 'plan', label: 'Plan', type: 'select', placeholder: 'Todos los planes', options: planOptions },
  { key: 'status', label: 'Estado', type: 'select', placeholder: 'Todos los estados', options: statusOptions },
]
const visibleFilterKeys = ['plan', 'status']
const filterModel = ref({})

function clearFilters() {
  filterModel.value = {}
}

const filteredData = useFilteredData(tenants, filterModel, filters, {
  searchFields: ['name', 'legalName', 'accountCode', 'contactEmail', 'contactName', 'domain'],
})

const kpis = computed(() => [
  { label: 'Clientes activos', value: formatNumber(tenantsStore.activeCount), icon: Briefcase, chip: 'bg-primary-100 text-primary-600' },
  { label: 'RFCs emisores', value: formatNumber(tenantsStore.totalRfcs), icon: Building2, chip: 'bg-teal-100 text-teal-600' },
  { label: 'Empleados totales', value: formatNumber(tenantsStore.totalEmployees), icon: Users, chip: 'bg-gold-100 text-gold-600' },
  { label: 'Suspendidos', value: formatNumber(tenantsStore.suspendedCount), icon: PauseCircle, chip: 'bg-danger-100 text-danger-600' },
])

function planLabel(value) {
  return TENANT_PLAN_LABELS[value] || value || '—'
}

function openCreate() {
  editingTenant.value = null
  modalOpen.value = true
}

function openEdit(row) {
  editingTenant.value = row
  modalOpen.value = true
}

function handleSaved(res) {
  if (res.ok) {
    toastStore.success(res.message)
    tenantsStore.fetchTenants()
  } else {
    toastStore.error(res.message)
  }
}

function askToggleStatus(row) {
  pendingStatusChange.value = row
  statusConfirmOpen.value = true
}

async function confirmToggleStatus() {
  const row = pendingStatusChange.value
  if (!row) return
  const next = row.status === 'active' ? 'suspended' : 'active'
  const res = await tenantsStore.setTenantStatus(row.id, next)
  if (res.ok) toastStore.success(res.message)
  else toastStore.error(res.message)
  statusConfirmOpen.value = false
  pendingStatusChange.value = null
}

function handleAction({ action, row }) {
  if (action === 'view') router.push({ name: 'cliente-detalle', params: { id: row.id } })
  if (action === 'edit') openEdit(row)
  if (action === 'suspend' || action === 'activate') askToggleStatus(row)
}

const statusConfirmCopy = computed(() => {
  const row = pendingStatusChange.value
  if (!row) return { title: '', body: '', cta: '' }
  return row.status === 'active'
    ? {
        title: 'Suspender cliente',
        body: `Al suspender a ${row.name} se bloquearán los accesos y el timbrado de sus RFC emisores hasta su reactivación.`,
        cta: 'Suspender',
      }
    : {
        title: 'Reactivar cliente',
        body: `Al reactivar a ${row.name} se restablecerán los accesos y el timbrado de sus RFC emisores.`,
        cta: 'Reactivar',
      }
})

onMounted(() => tenantsStore.fetchTenants())
</script>

<template>
  <div class="space-y-7">
    <PageHeader
      title="Clientes"
      description="Cuentas de cliente (tenants) y sus RFC emisores"
      :icon="Briefcase"
    >
      <template #actions>
        <Button variant="primary" :icon="Plus" @click="openCreate">Nuevo cliente</Button>
      </template>
    </PageHeader>

    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <Card v-for="kpi in kpis" :key="kpi.label" padding="md">
        <div class="flex items-center gap-3">
          <div class="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" :class="kpi.chip">
            <component :is="kpi.icon" class="w-5 h-5" aria-hidden="true" />
          </div>
          <div class="min-w-0">
            <p class="text-xs font-semibold text-ink-muted uppercase tracking-wide truncate">{{ kpi.label }}</p>
            <p class="text-2xl font-display font-extrabold text-ink leading-tight">{{ kpi.value }}</p>
          </div>
        </div>
      </Card>
    </div>

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
      empty-message="No hay clientes registrados"
      empty-description="Da de alta la primera cuenta de cliente para administrar sus RFC emisores"
      @action="handleAction"
      @row-click="(row) => router.push({ name: 'cliente-detalle', params: { id: row.id } })"
    >
      <template #name="{ row }">
        <div class="flex flex-col">
          <span class="font-semibold text-ink">{{ row.name }}</span>
          <span class="text-[11px] font-mono text-ink-muted">{{ row.accountCode }}</span>
        </div>
      </template>
      <template #contactName="{ row }">
        <div class="flex flex-col">
          <span class="text-sm text-ink">{{ row.contactName || '—' }}</span>
          <span class="text-xs text-ink-muted">{{ row.contactEmail }}</span>
        </div>
      </template>
      <template #plan="{ row }">
        <Badge variant="secondary">{{ planLabel(row.plan) }}</Badge>
      </template>
      <template #status="{ row }">
        <Badge :variant="row.status === 'active' ? 'success' : 'danger'" dot>
          {{ TENANT_STATUS_LABELS[row.status] || row.status }}
        </Badge>
      </template>
      <template #createdAt="{ row }">
        <span class="text-sm text-ink-soft">{{ formatDate(row.createdAt) }}</span>
      </template>
      <template #empty-action>
        <Button variant="primary" size="sm" :icon="Plus" @click="openCreate">Crear cliente</Button>
      </template>
    </Table>

    <TenantFormModal v-model="modalOpen" :tenant="editingTenant" @saved="handleSaved" />

    <Modal v-model="statusConfirmOpen" :title="statusConfirmCopy.title" size="sm">
      <p class="text-ink-soft">{{ statusConfirmCopy.body }}</p>
      <template #footer>
        <Button variant="secondary" @click="statusConfirmOpen = false">Cancelar</Button>
        <Button :variant="pendingStatusChange?.status === 'active' ? 'danger' : 'primary'" :loading="isSaving" @click="confirmToggleStatus">
          {{ statusConfirmCopy.cta }}
        </Button>
      </template>
    </Modal>
  </div>
</template>
