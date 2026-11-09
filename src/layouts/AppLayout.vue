<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/shared/stores/auth'
import { useToastStore } from '@/shared/stores/toast'
import { ROLES, SECTIONS_BY_ROLE } from '@/shared/utils/constants'
import SidebarNav from '@/shared/components/SidebarNav.vue'
import Header from '@/shared/components/Header.vue'
import { getCompanies } from '@/services/companies.service'
import { RouterView } from 'vue-router'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const toastStore = useToastStore()

const collapsed = ref(false)
const mobileSidebarOpen = ref(false)
const isDesktop = ref(typeof window !== 'undefined' ? window.innerWidth >= 1024 : true)

function handleResize() {
  isDesktop.value = window.innerWidth >= 1024
}

const userRole = computed(() => authStore.userRole)
const headerCompanies = ref([])

async function loadHeaderCompanies() {
  const ids = authStore.canAccessAllCompanies ? null : authStore.userCompanies
  const res = await getCompanies(ids)
  if (res.ok) headerCompanies.value = res.data
}
const userName = computed(() => authStore.user?.name || 'Usuario')
const userEmail = computed(() => authStore.user?.email || '')
const canManageTheme = computed(() => [ROLES.SUPERADMIN, ROLES.ADMIN].includes(userRole.value))
const canAccessFiscalData = computed(() =>
  ![ROLES.SUPERADMIN, ROLES.STAFF, ROLES.SUPERVISOR].includes(userRole.value)
)

const SECTION_LABELS = {
  dashboard: 'Dashboard',
  clientes: 'Clientes',
  roles: 'Roles y accesos',
  'carga-masiva': 'Carga masiva',
  notificaciones: 'Notificaciones',
  'nominas-timbradas': 'Nóminas timbradas',
  companias: 'Compañías',
  empleados: 'Empleados',
  usuarios: 'Usuarios',
  'consulta-curp': 'Consulta CURP',
  'disenador-de-facturas': 'Diseñador facturas',
  'mis-nominas': 'Mis nóminas',
  'datos-fiscales': 'Datos fiscales',
  'mi-perfil': 'Mi perfil',
  configuracion: 'Configuración',
  'cancelar-nomina': 'Cancelar nómina',
  'firmar-nomina': 'Firmar nómina',
}

const breadcrumb = computed(() => {
  const segments = [{ label: 'Inicio', to: '/dashboard' }]
  const section = currentSection.value
  const path = route.path
  if (section && section !== 'dashboard') {
    segments.push({ label: SECTION_LABELS[section] || section })
  }
  if (/^\/clientes\/\d+/.test(path)) segments.push({ label: 'Detalle' })
  if (/^\/comprobantes\/firmar\/\d+/.test(path)) segments.push({ label: 'Firmar' })
  if (/^\/comprobantes\/cancelar\/\d+/.test(path)) segments.push({ label: 'Cancelar' })
  return segments
})

const currentSection = computed(() => {
  const path = route.path
  if (path.startsWith('/comprobantes/carga-masiva')) return 'carga-masiva'
  if (path.startsWith('/comprobantes/notificaciones')) return 'notificaciones'
  if (path.startsWith('/comprobantes/nominas-timbradas')) return 'nominas-timbradas'
  if (path.startsWith('/comprobantes/cancelar')) return 'cancelar-nomina'
  if (path.startsWith('/comprobantes/firmar')) return 'firmar-nomina'
  if (path.startsWith('/mis-nominas')) return 'mis-nominas'
  if (path.startsWith('/clientes')) return 'clientes'
  if (path.startsWith('/roles')) return 'roles'
  if (path.startsWith('/companias')) return 'companias'
  if (path.startsWith('/empleados')) return 'empleados'
  if (path.startsWith('/usuarios')) return 'usuarios'
  if (path.startsWith('/configuracion')) return 'configuracion'
  if (path.startsWith('/fiscal/consulta-curp')) return 'consulta-curp'
  if (path.startsWith('/fiscal/disenador-facturas')) return 'disenador-de-facturas'
  if (path.startsWith('/fiscal/datos-fiscales')) return 'datos-fiscales'
  if (path.startsWith('/mi/perfil')) return 'mi-perfil'
  return 'dashboard'
})

const NAV = [
  { key: 'dashboard', label: 'Dashboard', icon: 'dashboard', path: '/dashboard' },
  {
    key: 'nomina',
    label: 'Nómina',
    children: [
      { key: 'carga-masiva', label: 'Carga masiva', icon: 'layers', path: '/comprobantes/carga-masiva' },
      { key: 'notificaciones', label: 'Notificaciones', icon: 'mail', path: '/comprobantes/notificaciones' },
      { key: 'nominas-timbradas', label: 'Nóminas timbradas', icon: 'stamp', path: '/comprobantes/nominas-timbradas' },
      { key: 'mis-nominas', label: 'Mis nóminas', icon: 'stamp', path: '/mis-nominas' },
    ],
  },
  {
    key: 'personas',
    label: 'Personas',
    children: [
      { key: 'empleados', label: 'Empleados', icon: 'users', path: '/empleados' },
      { key: 'usuarios', label: 'Usuarios', icon: 'user-cog', path: '/usuarios' },
      { key: 'roles', label: 'Roles y accesos', icon: 'shield', path: '/roles' },
    ],
  },
  {
    key: 'organizacion',
    label: 'Organización',
    children: [
      { key: 'clientes', label: 'Clientes', icon: 'briefcase', path: '/clientes' },
      { key: 'companias', label: 'Compañías', icon: 'building', path: '/companias' },
      { key: 'configuracion', label: 'Configuración', icon: 'settings', path: '/configuracion' },
    ],
  },
  {
    key: 'herramientas',
    label: 'Herramientas',
    children: [
      { key: 'consulta-curp', label: 'Consulta CURP', icon: 'search', path: '/fiscal/consulta-curp' },
      { key: 'disenador-de-facturas', label: 'Diseñador facturas', icon: 'palette', path: '/fiscal/disenador-facturas' },
    ],
  },
]

const sections = computed(() => {
  const allowed = new Set(SECTIONS_BY_ROLE[userRole.value] || [])
  return NAV
    .map(item => {
      if (item.children) {
        const children = item.children.filter(child => allowed.has(child.key))
        return children.length ? { ...item, children } : null
      }
      return allowed.has(item.key) ? item : null
    })
    .filter(Boolean)
})

function toggleCollapse() {
  collapsed.value = !collapsed.value
}

function closeMobileSidebar() {
  mobileSidebarOpen.value = false
}

function handleLogout() {
  authStore.logout()
  toastStore.success('Sesión cerrada correctamente')
}

onMounted(() => {
  window.addEventListener('resize', handleResize)
  loadHeaderCompanies()
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
})

const roleLabels = {
  [ROLES.SUPERADMIN]: 'Super Admin',
  [ROLES.ADMIN]: 'Administrador',
  [ROLES.SUPERVISOR]: 'Supervisor',
  [ROLES.STAFF]: 'Staff',
  [ROLES.CLIENTE]: 'Cliente',
  [ROLES.EMPLEADO]: 'Empleado',
}
</script>

<template>
  <div class="min-h-screen bg-base flex">
    <!-- Mobile sidebar overlay -->
    <div
      v-if="mobileSidebarOpen"
      class="fixed inset-0 bg-black/50 z-40 lg:hidden"
      @click="mobileSidebarOpen = false"
      aria-hidden="true"
    />

    <!-- Sidebar -->
    <aside
      :class="[
        'fixed lg:sticky lg:top-0 inset-y-0 left-0 z-50 h-screen flex-shrink-0 bg-card/85 backdrop-blur-xl border-r border-neutral-100/80 shadow-[1px_0_0_rgba(16,24,40,0.04)] transform transition-all duration-normal',
        mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
        collapsed ? 'w-20' : 'w-64',
      ]"
      :aria-hidden="!mobileSidebarOpen && !isDesktop ? 'true' : 'false'"
    >
      <SidebarNav
        :sections="sections"
        :current-section="currentSection"
        :collapsed="collapsed"
        :user-role="userRole"
        :user-name="userName"
        :user-email="userEmail"
        @toggle="toggleCollapse"
        @navigate="closeMobileSidebar"
      />
    </aside>

    <!-- Main content -->
    <div class="flex-1 flex flex-col min-w-0">
      <Header
        :collapsed="collapsed"
        :mobile-sidebar-open="mobileSidebarOpen"
        @toggle-sidebar="mobileSidebarOpen = !mobileSidebarOpen"
        @toggle-collapse="toggleCollapse"
        @logout="handleLogout"
        :user-name="userName"
        :user-role="roleLabels[userRole] || userRole"
        :can-manage-theme="canManageTheme"
        :can-access-fiscal-data="canAccessFiscalData"
        :breadcrumb="breadcrumb"
        :companies="headerCompanies"
      />

      <main class="flex-1 p-4 sm:p-6 lg:p-8 overflow-auto">
        <RouterView v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" @route-changed="closeMobileSidebar" />
          </transition>
        </RouterView>
      </main>
    </div>
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>