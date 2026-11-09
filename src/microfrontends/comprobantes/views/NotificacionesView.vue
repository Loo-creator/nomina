<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { Send, RefreshCw, CheckCircle2, XCircle, AlertTriangle, Inbox } from 'lucide-vue-next'
import PageHeader from '@/shared/components/PageHeader.vue'
import Card from '@/shared/components/Card.vue'
import Alert from '@/shared/components/Alert.vue'
import Table from '@/shared/components/Table.vue'
import Button from '@/shared/components/Button.vue'
import Badge from '@/shared/components/Badge.vue'
import DataFilterBar from '@/shared/components/DataFilterBar.vue'
import { useFilteredData } from '@/shared/composables/useFilteredData'
import { useAuthStore } from '@/shared/stores/auth'
import { useToastStore } from '@/shared/stores/toast'
import { useTenantsStore } from '@/shared/stores/tenants'
import { getNotifications, resendNotification, NOTIFICATION_TYPE_OPTIONS, NOTIFICATION_STATUS_OPTIONS } from '@/services/notifications.service'
import Select from '@/shared/components/Select.vue'
import { ROLES } from '@/shared/utils/constants'
import { formatDateTime, formatNumber } from '@/shared/utils/format'

const authStore = useAuthStore()
const toastStore = useToastStore()
const tenantsStore = useTenantsStore()

const isAccountManager = computed(() => authStore.userRole === ROLES.ADMIN)
const tenantOptions = computed(() =>
  tenantsStore.tenants.map(t => ({ value: t.id, label: `${t.name} (${t.accountCode})` })),
)
const selectedTenantId = ref(null)
const effectiveTenantId = computed(() =>
  isAccountManager.value ? Number(selectedTenantId.value) || null : authStore.userTenantId,
)
const activeTenant = computed(() =>
  tenantsStore.tenants.find(t => t.id === effectiveTenantId.value) || tenantsStore.currentTenant,
)
const isSuspended = computed(() => activeTenant.value?.status === 'suspended')

const notifications = ref([])
const isLoading = ref(false)
const resendingId = ref(null)

const companyOptions = computed(() => {
  const names = [...new Set(notifications.value.map(n => n.companyName))].filter(Boolean).sort((a, b) => a.localeCompare(b, 'es'))
  return names.map(name => ({ value: name, label: name }))
})

const filters = computed(() => [
  { key: 'search', label: 'Búsqueda', type: 'search', placeholder: 'Destinatario, asunto, periodo...' },
  { key: 'companyName', label: 'Empresa', type: 'select', placeholder: 'Todas las empresas', options: companyOptions.value },
  { key: 'type', label: 'Tipo', type: 'select', placeholder: 'Todos los tipos', options: NOTIFICATION_TYPE_OPTIONS },
  { key: 'status', label: 'Estatus de correo', type: 'select', placeholder: 'Todos los estatus', options: NOTIFICATION_STATUS_OPTIONS },
  { key: 'sentAt', label: 'Fecha de envío', type: 'dateRange', placeholder: 'Rango de fechas', field: 'sentAt' },
  {
    key: 'companyRfc',
    label: 'RFC emisor',
    type: 'select',
    placeholder: 'Todos los emisores',
    options: companyRfcOptions,
  },
])
const visibleFilterKeys = computed(() =>
  ['companyName', 'type', 'status', ...(canSeeRfc.value ? ['companyRfc'] : [])],
)

const canSeeRfc = computed(() =>
  [ROLES.SUPERADMIN, ROLES.ADMIN, ROLES.STAFF].includes(authStore.userRole),
)

const companyRfcOptions = computed(() => {
  const rfcs = [...new Set(notifications.value.map(n => n.companyRfc).filter(Boolean))].sort()
  return rfcs.map(rfc => ({ value: rfc, label: rfc }))
})
const filterModel = ref({})

function clearFilters() {
  filterModel.value = {}
}

const filteredData = useFilteredData(notifications, filterModel, () => filters.value, {
  searchFields: ['to', 'subject', 'period', 'companyName', 'companyRfc'],
})

const stats = computed(() => {
  const list = notifications.value
  return {
    total: list.length,
    entregada: list.filter(n => n.status === 'entregada').length,
    fallida: list.filter(n => n.status === 'fallida').length,
    rebotada: list.filter(n => n.status === 'rebotada').length,
  }
})

const kpiCards = computed(() => [
  { label: 'Enviadas', value: stats.value.total, icon: Inbox, chip: 'bg-primary-100 text-primary-600' },
  { label: 'Entregadas', value: stats.value.entregada, icon: CheckCircle2, chip: 'bg-teal-100 text-teal-600' },
  { label: 'Fallidas', value: stats.value.fallida, icon: XCircle, chip: 'bg-danger-100 text-danger-600' },
  { label: 'Rebotadas', value: stats.value.rebotada, icon: AlertTriangle, chip: 'bg-gold-100 text-gold-600' },
])

const columns = [
  { field: 'sentAt', header: 'Enviada', sortable: true },
  { field: 'typeLabel', header: 'Tipo' },
  { field: 'to', header: 'Destinatario' },
  { field: 'subject', header: 'Asunto' },
  { field: 'companyName', header: 'Empresa', sortable: true },
  { field: 'period', header: 'Período' },
  { field: 'status', header: 'Estatus' },
]

const rowActions = [
  {
    key: 'resend',
    label: 'Reenviar',
    icon: RefreshCw,
    hidden: (row) => row.status === 'entregada',
    disabled: () => isSuspended.value || resendingId.value !== null,
  },
]

const statusConfig = {
  entregada: { variant: 'success', label: 'Entregada' },
  fallida: { variant: 'danger', label: 'Fallida' },
  rebotada: { variant: 'warning', label: 'Rebotada' },
}

const typeVariant = {
  timbrado: 'primary',
  entrega: 'secondary',
  acuse: 'success',
  alerta: 'warning',
}

function handleTenantChange(id) {
  selectedTenantId.value = id
}

async function loadNotifications() {
  const tenantId = effectiveTenantId.value
  if (!tenantId) {
    notifications.value = []
    return
  }
  isLoading.value = true
  const res = await getNotifications(tenantId)
  if (res.ok) notifications.value = res.data
  else toastStore.error(res.message)
  isLoading.value = false
}

watch(effectiveTenantId, loadNotifications)

async function handleAction({ action, row }) {
  if (action !== 'resend') return
  if (isSuspended.value) {
    toastStore.error('La cuenta está suspendida')
    return
  }
  resendingId.value = row.id
  const res = await resendNotification(row.id)
  if (res.ok) {
    toastStore.success(res.message)
    const index = notifications.value.findIndex(n => n.id === row.id)
    if (index !== -1) notifications.value[index] = res.data
  } else {
    toastStore.error(res.message)
  }
  resendingId.value = null
}

onMounted(async () => {
  if (isAccountManager.value) {
    await tenantsStore.fetchTenants()
    selectedTenantId.value = tenantsStore.tenants[0]?.id ?? null
    await loadNotifications()
  } else if (authStore.userTenantId) {
    await tenantsStore.fetchTenantDetail(authStore.userTenantId)
    selectedTenantId.value = authStore.userTenantId
    await loadNotifications()
  }
})

onUnmounted(() => tenantsStore.clearCurrent())
</script>

<template>
  <div class="space-y-6">
    <PageHeader
      title="Notificaciones"
      description="Correos de timbrado, entrega, acuses y alertas."
      :icon="Send"
    />

    <Card padding="sm">
      <div class="flex flex-col sm:flex-row sm:items-center gap-3">
        <span class="text-xs font-bold uppercase tracking-wide text-ink-muted flex-shrink-0">Cuenta de cliente</span>
        <Select
          v-if="isAccountManager"
          id="notif-tenant"
          :model-value="selectedTenantId ?? ''"
          :options="tenantOptions"
          placeholder="Selecciona una cuenta"
          class="w-full sm:max-w-md"
          @change="handleTenantChange"
        />
        <div v-else class="flex items-center gap-2 min-w-0">
          <span class="font-semibold text-ink truncate">{{ activeTenant?.name || 'Mi cuenta' }}</span>
        </div>
        <Badge v-if="activeTenant" :variant="isSuspended ? 'danger' : 'success'" dot>
          {{ isSuspended ? 'Suspendida' : 'Activa' }}
        </Badge>
      </div>
    </Card>

    <Alert v-if="!effectiveTenantId" variant="info" title="Sin cuenta vinculada">
      Tu usuario no está vinculado a una cuenta de cliente. Contacta al administrador de la plataforma.
    </Alert>

    <Alert v-else-if="isSuspended" variant="warning" title="Cuenta suspendida">
      El reenvío de notificaciones está deshabilitado mientras la cuenta esté suspendida. La consulta sigue disponible.
    </Alert>

    <template v-if="effectiveTenantId">
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card v-for="kpi in kpiCards" :key="kpi.label" padding="md">
          <div class="flex items-center gap-3">
            <div class="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" :class="kpi.chip">
              <component :is="kpi.icon" class="w-5 h-5" aria-hidden="true" />
            </div>
            <div class="min-w-0">
              <p class="text-[11px] font-semibold uppercase tracking-wide text-ink-muted">{{ kpi.label }}</p>
              <p class="text-2xl font-display font-extrabold text-ink leading-tight tabular-nums">{{ formatNumber(kpi.value) }}</p>
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
        empty-message="No hay notificaciones para los filtros actuales"
        empty-description="Cuando se timbre una nómina o se envíe un acuse, aparecerá aquí"
        @action="handleAction"
      >
        <template #sentAt="{ row }">
          <span class="text-sm text-ink-soft">{{ formatDateTime(row.sentAt) }}</span>
        </template>
        <template #typeLabel="{ row }">
          <Badge :variant="typeVariant[row.type] || 'neutral'" size="sm">{{ row.typeLabel }}</Badge>
        </template>
        <template #to="{ row }">
          <span class="block max-w-[190px] truncate text-sm text-ink" :title="row.to">{{ row.to }}</span>
        </template>
        <template #subject="{ row }">
          <span class="block max-w-[300px] truncate text-sm text-ink-soft" :title="row.subject">{{ row.subject }}</span>
        </template>
        <template #period="{ row }">
          <span class="text-sm text-ink-soft">{{ row.period }}</span>
        </template>
        <template #status="{ row }">
          <Badge :variant="statusConfig[row.status]?.variant || 'neutral'" dot>
            {{ statusConfig[row.status]?.label || row.status }}
          </Badge>
        </template>
      </Table>
    </template>
  </div>
</template>
