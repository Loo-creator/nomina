<script setup>
import { ref, computed } from 'vue'
import { useRouter, RouterLink } from 'vue-router'
import Select from '@/shared/components/Select.vue'
import { useThemeStore } from '@/shared/stores/theme'
import { useAuthStore } from '@/shared/stores/auth'
import MenuIcon from '@/shared/components/icons/MenuIcon.vue'
import BellIcon from '@/shared/components/icons/BellIcon.vue'
import ChevronDownIcon from '@/shared/components/icons/ChevronDownIcon.vue'
import LogoutIcon from '@/shared/components/icons/LogoutIcon.vue'
import PaletteIcon from '@/shared/components/icons/PaletteIcon.vue'
import FileInvoiceIcon from '@/shared/components/icons/FileInvoiceIcon.vue'
import CheckIcon from '@/shared/components/icons/CheckIcon.vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n({ useScope: 'global' })

const props = defineProps({
  collapsed: { type: Boolean, default: false },
  mobileSidebarOpen: { type: Boolean, default: false },
  userName: { type: String, default: '' },
  userRole: { type: String, default: '' },
  canManageTheme: { type: Boolean, default: false },
  canAccessFiscalData: { type: Boolean, default: true },
  breadcrumb: { type: Array, default: () => [] },
  companies: { type: Array, default: () => [] },
})

const emit = defineEmits(['toggle-sidebar', 'toggle-collapse', 'logout'])

const themeStore = useThemeStore()
const router = useRouter()
const authStore = useAuthStore()

const selectId = 'header-company-select'
const showUserMenu = ref(false)
const showThemeMenu = ref(false)

const currentThemeName = computed(() => themeStore.currentTheme?.name || 'Tema')

const companyOptions = computed(() =>
  props.companies.map(c => ({ value: c.id, label: c.name })),
)

function toggleThemeMenu() {
  showThemeMenu.value = !showThemeMenu.value
  showUserMenu.value = false
}

function selectTheme(id) {
  themeStore.setOrgTheme(id)
  showThemeMenu.value = false
}

function goToFiscalData() {
  showUserMenu.value = false
  const userRole = authStore.userRole
  if (userRole === 'empleado') {
    router.push('/mi/perfil')
  } else {
    router.push('/organizacion/datos-fiscales')
  }
}

function handleLogout() {
  emit('logout')
  showUserMenu.value = false
}

function toggleUserMenu() {
  showUserMenu.value = !showUserMenu.value
  showThemeMenu.value = false
}
</script>

<template>
  <header class="sticky top-0 z-30 glass border-b border-neutral-100/70">
    <div class="flex items-center justify-between h-[72px] px-4 lg:px-8">
      <!-- Left side -->
      <div class="flex items-center gap-4">
        <button
          @click="$emit('toggle-sidebar')"
          class="lg:hidden p-2 rounded-lg text-ink-muted hover:bg-neutral-100 hover:text-ink-soft transition-colors"
          :aria-label="t('nav.openMenu')"
          aria-expanded="false"
        >
          <MenuIcon class="w-6 h-6" />
        </button>

        <button
          v-if="!mobileSidebarOpen"
          @click="$emit('toggle-collapse')"
          class="hidden lg:flex p-2 rounded-lg text-ink-muted hover:bg-neutral-100 hover:text-ink-soft transition-colors"
          :aria-label="collapsed ? t('nav.expand') : t('nav.collapseMenu')"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path v-if="collapsed" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
            <path v-else stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
          </svg>
        </button>

        <nav v-if="breadcrumb.length" class="hidden md:block" :aria-label="t('nav.breadcrumb')">
          <ol class="flex items-center gap-1.5 text-sm">
            <li v-for="(segment, index) in breadcrumb" :key="index" class="flex items-center gap-1.5">
              <span v-if="index > 0" class="text-ink-muted/60 select-none" aria-hidden="true">/</span>
              <RouterLink
                v-if="segment.to && index < breadcrumb.length - 1"
                :to="segment.to"
                class="text-ink-muted hover:text-ink transition-colors rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)]"
              >
                {{ segment.label }}
              </RouterLink>
              <span v-else class="font-semibold text-ink" :aria-current="index === breadcrumb.length - 1 ? 'page' : undefined">
                {{ segment.label }}
              </span>
            </li>
          </ol>
        </nav>
      </div>

      <!-- Right side -->
      <div class="flex items-center gap-2">
        <!-- Company selector (persistente): reutiliza el Select del sistema -->
        <div v-if="companies.length > 1" class="hidden sm:flex items-center">
          <Select
            :id="selectId"
            :model-value="authStore.selectedCompanyId ?? ''"
            :options="companyOptions"
            placeholder="Todas las compañías"
            variant="bar"
            class="w-auto min-w-[220px]"
            @update:model-value="(v) => authStore.setSelectedCompany(v === '' ? null : Number(v))"
            @change="(v) => authStore.setSelectedCompany(v === '' ? null : Number(v))"
          />
        </div>

        <!-- Theme selector (solo admin / super admin) -->
        <div v-if="canManageTheme" class="relative">
          <button
            @click="toggleThemeMenu"
            class="flex items-center gap-2 p-2 rounded-lg text-ink-muted hover:bg-neutral-100 hover:text-ink-soft transition-colors"
            :aria-label="t('nav.organizationTheme')"
            aria-haspopup="true"
            :aria-expanded="showThemeMenu"
          >
            <PaletteIcon class="w-5 h-5" />
            <span class="hidden md:block text-sm font-medium">{{ currentThemeName }}</span>
            <ChevronDownIcon class="w-3.5 h-3.5 hidden md:block" />
          </button>

          <Transition name="fade">
            <div
              v-show="showThemeMenu"
              class="absolute right-0 mt-2 w-64 bg-card rounded-xl shadow-elevated border border-neutral-100 p-2 z-50"
              role="menu"
            >
              <p class="px-3 pt-1.5 pb-2 text-[11px] font-bold uppercase tracking-wider text-ink-muted">Tema de la organización</p>
              <button
                v-for="t in themeStore.themes"
                :key="t.id"
                @click="selectTheme(t.id)"
                class="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors"
                :class="themeStore.theme === t.id ? 'bg-primary-50 text-ink' : 'text-ink-soft hover:bg-neutral-50'"
                role="menuitemradio"
                :aria-checked="themeStore.theme === t.id"
              >
                <span class="flex -space-x-1.5 flex-shrink-0">
                  <span
                    v-for="(color, i) in t.swatches"
                    :key="i"
                    class="w-4 h-4 rounded-full ring-2 ring-card"
                    :style="{ backgroundColor: color }"
                  />
                </span>
                <span class="flex-1 min-w-0">
                  <span class="block text-sm font-semibold truncate">{{ t.name }}</span>
                  <span class="block text-xs text-ink-muted truncate">{{ t.description }}</span>
                </span>
                <CheckIcon v-if="themeStore.theme === t.id" class="w-4 h-4 text-primary-600 flex-shrink-0" />
              </button>
            </div>
          </Transition>
        </div>

        <!-- Notifications -->
        <button
          v-if="['admin', 'supervisor', 'cliente'].includes(authStore.userRole)"
          class="relative p-2 rounded-lg text-ink-muted hover:bg-neutral-100 hover:text-ink-soft transition-colors"
          :aria-label="t('nav.notifications')"
          title="Notificaciones"
          @click="router.push({ name: 'notificaciones' })"
        >
          <BellIcon class="w-5 h-5" />
        </button>

        <!-- User menu -->
        <div class="relative">
          <button
            @click="toggleUserMenu"
            class="flex items-center gap-2 p-2 rounded-lg text-ink-muted hover:bg-neutral-100 hover:text-ink-soft transition-colors"
            :aria-label="t('nav.userMenu')"
            aria-expanded="showUserMenu"
            aria-haspopup="true"
          >
            <div class="w-9 h-9 rounded-xl bg-brand-gradient flex items-center justify-center text-white font-display font-bold text-sm shadow-soft">
              {{ userName?.charAt(0)?.toUpperCase() || 'U' }}
            </div>
            <span class="hidden md:block text-sm font-medium text-ink-soft">{{ userName }}</span>
            <ChevronDownIcon class="w-4 h-4 text-ink-muted hidden md:block" />
          </button>

          <Transition name="fade">
            <div
              v-show="showUserMenu"
              class="absolute right-0 mt-2 w-48 bg-card rounded-xl shadow-elevated border border-neutral-100 py-1 z-50"
              role="menu"
            >
              <div class="px-4 py-2 border-b border-neutral-100">
                <p class="text-sm font-medium text-ink">{{ userName }}</p>
                <p class="text-xs text-ink-muted">{{ userRole }}</p>
              </div>
              <button
                v-if="canAccessFiscalData"
                @click="goToFiscalData"
                class="w-full flex items-center gap-2 px-4 py-2 text-sm text-ink-soft hover:bg-neutral-50 hover:text-ink transition-colors"
                role="menuitem"
              >
                <FileInvoiceIcon class="w-4 h-4" />
                {{ authStore.userRole === 'empleado' ? 'Mi perfil' : 'Datos fiscales' }}
              </button>
              <button
                @click="handleLogout"
                class="w-full flex items-center gap-2 px-4 py-2 text-sm text-ink-soft hover:bg-neutral-50 hover:text-ink transition-colors"
                role="menuitem"
              >
                <LogoutIcon class="w-4 h-4" />
                Cerrar sesión
              </button>
            </div>
          </Transition>
        </div>
      </div>
    </div>
  </header>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>
