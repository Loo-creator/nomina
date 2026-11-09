<script setup>
import { ref, computed, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { useAuthStore } from '@/shared/stores/auth'
import { ROLES, SECTIONS_BY_ROLE } from '@/shared/utils/constants'
import { getDashboardStats } from '@/services/dashboard.service'
import { getEmployeePayrolls } from '@/services/payrolls.service'
import Badge from '@/shared/components/Badge.vue'
import Skeleton from '@/shared/components/Skeleton.vue'
import ErrorState from '@/shared/components/ErrorState.vue'
import BuildingIcon from '@/shared/components/icons/BuildingIcon.vue'
import UsersIcon from '@/shared/components/icons/UsersIcon.vue'
import ReceiptIcon from '@/shared/components/icons/ReceiptIcon.vue'
import StampIcon from '@/shared/components/icons/StampIcon.vue'
import UploadIcon from '@/shared/components/icons/UploadIcon.vue'
import FileInvoiceIcon from '@/shared/components/icons/FileInvoiceIcon.vue'

const authStore = useAuthStore()

const stats = ref(null)
const isLoading = ref(true)
const loadError = ref('')
const recentPayrolls = ref([])
const employeeStats = ref(null)
const pendingActions = ref(0)

const userRole = computed(() => authStore.userRole)
const isEmployee = computed(() => authStore.userRole === ROLES.EMPLEADO)

const roleLabels = {
  [ROLES.SUPERADMIN]: 'Super Admin',
  [ROLES.ADMIN]: 'Administrador',
  [ROLES.STAFF]: 'Staff',
  [ROLES.CLIENTE]: 'Cliente',
  [ROLES.EMPLEADO]: 'Empleado',
}

const greeting = computed(() => {
  const hour = new Date().getHours()
  if (hour < 12) return 'Buenos días'
  if (hour < 19) return 'Buenas tardes'
  return 'Buenas noches'
})

const today = computed(() =>
  new Date().toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
)

const statConfig = computed(() => {
  if (isEmployee.value) {
    return [
      { key: 'totalPayrolls', label: 'Mis nóminas', icon: ReceiptIcon, chip: 'bg-primary-100 text-primary-600', bar: 'bg-primary-500' },
      { key: 'pendingSignature', label: 'Pendientes de firma', icon: StampIcon, chip: 'bg-gold-100 text-gold-600', bar: 'bg-gold-500' },
      { key: 'signedPayrolls', label: 'Firmadas', icon: StampIcon, chip: 'bg-teal-100 text-teal-600', bar: 'bg-teal-500' },
    ]
  }
  return [
  {
    key: 'totalCompanies',
    label: 'Compañías',
    icon: BuildingIcon,
    chip: 'bg-primary-100 text-primary-600',
    bar: 'bg-primary-500',
  },
  {
    key: 'totalEmployees',
    label: 'Empleados',
    icon: UsersIcon,
    chip: 'bg-teal-100 text-teal-600',
    bar: 'bg-teal-500',
  },
  {
    key: 'pendingPayrolls',
    label: 'Nóminas pendientes',
    icon: ReceiptIcon,
    chip: 'bg-gold-100 text-gold-600',
    bar: 'bg-gold-500',
  },
  {
    key: 'stampedPayrolls',
    label: 'Nóminas timbradas',
    icon: StampIcon,
    chip: 'bg-primary-100 text-primary-700',
    bar: 'bg-primary-700',
  },
]
})

const quickActions = computed(() => {
  const allowed = SECTIONS_BY_ROLE[userRole.value] || []
  return [
    { key: 'carga-masiva', label: 'Carga masiva', to: '/comprobantes/carga-masiva', icon: UploadIcon, chip: 'bg-primary-100 text-primary-600' },
    { key: 'nominas-timbradas', label: 'Nóminas timbradas', to: '/comprobantes/nominas-timbradas', icon: StampIcon, chip: 'bg-teal-100 text-teal-600' },
    { key: 'empleados', label: 'Empleados', to: '/empleados', icon: UsersIcon, chip: 'bg-gold-100 text-gold-600' },
    { key: 'mis-nominas', label: 'Mis nóminas', to: '/mis-nominas', icon: ReceiptIcon, chip: 'bg-primary-100 text-primary-600' },
    { key: 'datos-fiscales', label: 'Datos fiscales', to: '/fiscal/datos-fiscales', icon: FileInvoiceIcon, chip: 'bg-primary-100 text-primary-700' },
  ].filter(action =>
    allowed.includes(action.key) ||
    (action.key === 'datos-fiscales' && userRole.value !== ROLES.SUPERADMIN)
  )
})

async function loadDashboard() {
  isLoading.value = true
  loadError.value = ''
  try {
    if (isEmployee.value) {
      const employeeId = authStore.user?.employeeId
      if (!employeeId) {
        loadError.value = 'Tu usuario no tiene un empleado asociado'
        isLoading.value = false
        return
      }
      const response = await getEmployeePayrolls(employeeId)
      if (response.ok) {
        const list = response.data || []
        employeeStats.value = {
          totalPayrolls: list.length,
          pendingSignature: list.filter(p => p.status === 'timbrada').length,
          signedPayrolls: list.filter(p => p.status === 'firmada').length,
        }
        stats.value = employeeStats.value
        recentPayrolls.value = list.slice(0, 5)
        pendingActions.value = employeeStats.value.pendingSignature
      } else {
        loadError.value = response.message || 'No se pudieron cargar tus nóminas'
      }
      isLoading.value = false
      return
    }
    const response = await getDashboardStats(authStore.user?.id, authStore.scopedCompanyIds)
    if (response.ok) {
      stats.value = response.data.stats
      recentPayrolls.value = response.data.recentPayrolls
      pendingActions.value = response.data.pendingActions
    } else {
      loadError.value = response.message || 'No se pudieron cargar las métricas'
    }
  } catch {
    loadError.value = 'Error de conexión con el servicio de estadísticas'
  } finally {
    isLoading.value = false
  }
}

function getStatusBadge(status) {
  const statusConfig = {
    timbrada: { variant: 'primary', label: 'Timbrada' },
    firmada: { variant: 'success', label: 'Firmada' },
    pendiente: { variant: 'warning', label: 'Pendiente' },
    procesando: { variant: 'info', label: 'Procesando' },
    cancelada: { variant: 'danger', label: 'Cancelada' },
    error: { variant: 'danger', label: 'Error' },
  }
  return statusConfig[status] || { variant: 'neutral', label: status }
}

onMounted(() => {
  loadDashboard()
})
</script>

<template>
  <div class="space-y-7">
    <!-- Greeting -->
    <div class="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
      <div>
        <p class="text-sm font-medium text-ink-muted capitalize">{{ today }}</p>
        <h1 class="font-display text-2xl sm:text-3xl font-extrabold text-ink tracking-tight mt-1">
          {{ greeting }}, <span class="text-gradient">{{ authStore.user?.name }}</span>
        </h1>
        <p class="text-ink-muted mt-1">{{ roleLabels[userRole] || userRole }}</p>
      </div>
      <Badge v-if="pendingActions > 0" variant="warning" dot>{{ pendingActions }} acciones pendientes</Badge>
    </div>

    <ErrorState
      v-if="loadError"
      title="No se pudo cargar el dashboard"
      :message="loadError"
      detail="getDashboardStats(user.id, user.companies)"
      @retry="loadDashboard"
    />
    <template v-else>
    <!-- Stats Grid -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
      <template v-if="isLoading">
        <div v-for="i in 4" :key="i" class="stat-card">
          <div class="flex items-start justify-between">
            <div class="flex-1">
              <Skeleton width="6rem" height="1rem" custom-class="mb-3" />
              <Skeleton width="4rem" height="2.25rem" />
            </div>
            <Skeleton variant="rectangular" width="3rem" height="3rem" />
          </div>
        </div>
      </template>

      <template v-else>
        <div
          v-for="stat in statConfig.value"
          :key="stat.key"
          class="stat-card"
        >
          <span class="absolute inset-x-0 top-0 h-1" :class="stat.bar" />
          <div class="flex items-start justify-between">
            <div>
              <p class="text-sm font-medium text-ink-muted">{{ stat.label }}</p>
              <p class="font-display text-3xl font-extrabold text-ink mt-1.5 tabular-nums">
                {{ stats?.[stat.key] ?? 0 }}
              </p>
            </div>
            <div class="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0" :class="stat.chip">
              <component :is="stat.icon" class="w-6 h-6" aria-hidden="true" />
            </div>
          </div>
        </div>
      </template>
    </div>

    <!-- Quick Actions / Recent Payrolls -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Quick Actions -->
      <div class="card p-6">
        <h2 class="font-display text-lg font-bold text-ink mb-5">Acciones rápidas</h2>
        <div class="grid grid-cols-2 gap-3.5">
          <RouterLink
            v-for="action in quickActions"
            :key="action.to"
            :to="action.to"
            class="group flex flex-col items-center gap-3 p-5 rounded-2xl border border-neutral-100 bg-neutral-50/40 text-center transition-all duration-normal hover:border-primary-200 hover:bg-card hover:shadow-card hover:-translate-y-0.5"
          >
            <span class="w-12 h-12 rounded-2xl flex items-center justify-center transition-transform duration-normal group-hover:scale-110" :class="action.chip">
              <component :is="action.icon" class="w-6 h-6" aria-hidden="true" />
            </span>
            <span class="text-sm font-semibold text-ink-soft group-hover:text-ink">{{ action.label }}</span>
          </RouterLink>
        </div>
      </div>

      <!-- Recent Payrolls -->
      <div class="card p-6">
        <div class="flex items-center justify-between mb-5">
          <h2 class="font-display text-lg font-bold text-ink">Nóminas recientes</h2>
          <RouterLink to="/comprobantes/nominas-timbradas" class="text-sm font-semibold text-primary-600 hover:text-primary-700">Ver todas</RouterLink>
        </div>

        <div v-if="isLoading" class="space-y-3">
          <Skeleton v-for="i in 3" :key="i" variant="card" height="4rem" />
        </div>

        <div v-else-if="!recentPayrolls.length" class="empty-state py-10">
          <ReceiptIcon class="empty-state-icon" aria-hidden="true" />
          <p class="empty-state-title">No hay nóminas recientes</p>
          <p class="empty-state-description">Comienza cargando insumos para generar tu primera nómina</p>
        </div>

        <div v-else class="space-y-2.5">
          <div
            v-for="payroll in recentPayrolls.slice(0, 5)"
            :key="payroll.id"
            class="flex items-center justify-between gap-3 p-3 rounded-2xl border border-neutral-100 transition-colors hover:bg-neutral-50"
          >
            <div class="flex items-center gap-3 min-w-0">
              <div class="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center flex-shrink-0">
                <ReceiptIcon class="w-5 h-5 text-primary-600" aria-hidden="true" />
              </div>
              <div class="min-w-0">
                <p class="font-semibold text-ink truncate">{{ payroll.periodLabel }}</p>
                <p class="text-sm text-ink-muted truncate">{{ payroll.companyName }}</p>
              </div>
            </div>
            <div class="flex items-center gap-3 flex-shrink-0">
              <Badge :variant="getStatusBadge(payroll.status).variant" :label="getStatusBadge(payroll.status).label" />
              <span class="text-sm font-bold text-ink tabular-nums">${{ (payroll.totalNet ?? payroll.myNet ?? 0).toLocaleString() }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Employee view -->
    <div v-if="userRole === ROLES.EMPLEADO" class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div class="card p-6 flex items-center gap-4">
        <div class="w-12 h-12 rounded-2xl bg-teal-100 flex items-center justify-center flex-shrink-0">
          <StampIcon class="w-6 h-6 text-teal-600" aria-hidden="true" />
        </div>
        <div>
          <p class="text-sm text-ink-muted">Mi última nómina</p>
          <p class="font-semibold text-ink">{{ recentPayrolls[0]?.periodLabel || 'No disponible' }}</p>
        </div>
      </div>
      <div class="card p-6 flex items-center gap-4">
        <div class="w-12 h-12 rounded-2xl bg-primary-100 flex items-center justify-center flex-shrink-0">
          <FileInvoiceIcon class="w-6 h-6 text-primary-600" aria-hidden="true" />
        </div>
        <div>
          <p class="text-sm text-ink-muted">Mis datos fiscales</p>
          <p class="font-semibold text-ink">Completos</p>
        </div>
      </div>
      <div class="card p-6 flex items-center gap-4">
        <div class="w-12 h-12 rounded-2xl bg-gold-100 flex items-center justify-center flex-shrink-0">
          <span class="font-display font-extrabold text-gold-600">{{ pendingActions }}</span>
        </div>
        <div>
          <p class="text-sm text-ink-muted">Acciones requeridas</p>
          <p class="font-semibold text-ink">Pendientes por revisar</p>
        </div>
      </div>
    </div>
    </template>
  </div>
</template>
