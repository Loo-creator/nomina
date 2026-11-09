<script setup>
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { AlertTriangle, BarChart3, Settings, XCircle, Briefcase, Layers } from 'lucide-vue-next'
import ChevronRightIcon from '@/shared/components/icons/ChevronRightIcon.vue'
import ShieldCheckIcon from '@/shared/components/icons/ShieldCheckIcon.vue'
import DashboardIcon from '@/shared/components/icons/DashboardIcon.vue'
import ReceiptIcon from '@/shared/components/icons/ReceiptIcon.vue'
import BuildingIcon from '@/shared/components/icons/BuildingIcon.vue'
import UsersIcon from '@/shared/components/icons/UsersIcon.vue'
import UserCogIcon from '@/shared/components/icons/UserCogIcon.vue'
import FileInvoiceIcon from '@/shared/components/icons/FileInvoiceIcon.vue'
import UploadIcon from '@/shared/components/icons/UploadIcon.vue'
import ListIcon from '@/shared/components/icons/ListIcon.vue'
import StampIcon from '@/shared/components/icons/StampIcon.vue'
import MailIcon from '@/shared/components/icons/MailIcon.vue'
import SearchIcon from '@/shared/components/icons/SearchIcon.vue'
import PaletteIcon from '@/shared/components/icons/PaletteIcon.vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n({ useScope: 'global' })

const props = defineProps({
  sections: { type: Array, required: true },
  currentSection: { type: String, default: '' },
  collapsed: { type: Boolean, default: false },
  userRole: { type: String, default: '' },
  userName: { type: String, default: '' },
  userEmail: { type: String, default: '' },
})

defineEmits(['toggle', 'navigate'])

const iconMap = {
  dashboard: DashboardIcon,
  receipt: ReceiptIcon,
  building: BuildingIcon,
  briefcase: Briefcase,
  layers: Layers,
  shield: ShieldCheckIcon,
  users: UsersIcon,
  'user-cog': UserCogIcon,
  'file-invoice': FileInvoiceIcon,
  upload: UploadIcon,
  list: ListIcon,
  stamp: StampIcon,
  mail: MailIcon,
  search: SearchIcon,
  palette: PaletteIcon,
  alert: AlertTriangle,
  chart: BarChart3,
  settings: Settings,
  'x-circle': XCircle,
}

const roleLabels = {
  superadmin: 'Super Admin',
  admin: 'Administrador',
  supervisor: 'Supervisor',
  staff: 'Staff',
  cliente: 'Cliente',
  empleado: 'Empleado',
}

const isActiveSection = (section) => {
  if (!section.children) {
    return section.key === props.currentSection
  }
  return section.children.some(child => child.key === props.currentSection)
}

const isChildActive = (child) => child.key === props.currentSection
</script>

<template>
  <div class="flex flex-col h-full">
    <!-- Logo / Brand -->
    <div class="flex items-center h-[72px] px-5" :class="collapsed && 'justify-center px-0'">
      <RouterLink
        to="/dashboard"
        class="flex items-center gap-3 group"
        :aria-label="t('nav.goDashboard')"
      >
        <div class="relative w-10 h-10 rounded-xl bg-brand-gradient shadow-glow flex items-center justify-center transition-transform duration-normal group-hover:scale-105">
          <span class="text-white font-display font-extrabold text-xl leading-none">N</span>
          <span class="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-teal-400 ring-2 ring-white" />
        </div>
        <div v-if="!collapsed" class="flex flex-col leading-none">
          <span class="font-display font-extrabold text-lg tracking-tight text-ink">NOMIKOK</span>
          <span class="text-[10px] font-semibold uppercase tracking-[0.18em] text-primary-500 mt-0.5">Nómina digital</span>
        </div>
      </RouterLink>
    </div>

    <!-- Navigation -->
    <nav class="flex-1 overflow-y-auto px-3 pb-4 space-y-6 scrollbar-thin" :aria-label="t('nav.mainNavigation')">
      <template v-for="section in sections" :key="section.key">
        <!-- Section with children -->
        <div v-if="section.children" class="space-y-1">
          <p
            v-if="!collapsed"
            class="px-4 pt-3 pb-2 text-[10px] font-bold text-ink-muted/70 uppercase tracking-[0.16em]"
          >
            {{ section.label }}
          </p>
          <template v-for="child in section.children" :key="child.key">
            <RouterLink
              :to="child.path"
              :class="[
                'sidebar-link',
                isChildActive(child) && 'sidebar-link-active',
                collapsed && 'justify-center px-3',
              ]"
              :title="collapsed ? child.label : ''"
              @click="$emit('navigate')"
            >
              <component
                :is="iconMap[child.icon] || DashboardIcon"
                class="sidebar-link-icon"
                aria-hidden="true"
              />
              <span v-if="!collapsed" class="truncate">{{ child.label }}</span>
            </RouterLink>
          </template>
        </div>

        <!-- Section without children -->
        <RouterLink
          v-else
          :to="section.path"
          :class="[
            'sidebar-link',
            isActiveSection(section) && 'sidebar-link-active',
            collapsed && 'justify-center px-3',
          ]"
          :title="collapsed ? section.label : ''"
          @click="$emit('navigate')"
        >
          <component
            :is="iconMap[section.icon] || DashboardIcon"
            class="sidebar-link-icon"
            aria-hidden="true"
          />
          <span v-if="!collapsed" class="truncate">{{ section.label }}</span>
        </RouterLink>
      </template>
    </nav>

    <!-- User info & toggle -->
    <div class="p-3 border-t border-neutral-100">
      <div
        v-if="!collapsed"
        class="flex items-center gap-3 p-2.5 rounded-2xl bg-surface/60 border border-teal-100 mb-2"
      >
        <div class="w-9 h-9 rounded-xl bg-card shadow-soft flex items-center justify-center text-primary-600 font-display font-bold flex-shrink-0">
          {{ userName?.charAt(0)?.toUpperCase() || 'U' }}
        </div>
        <div class="flex-1 min-w-0">
          <p class="text-sm font-semibold text-ink truncate">{{ userName }}</p>
          <p class="text-xs text-ink-muted truncate">{{ roleLabels[userRole] || userRole }}</p>
        </div>
      </div>
      <button
        @click="$emit('toggle')"
        class="w-full flex items-center justify-center gap-2 px-3 py-2.5 text-sm font-medium text-ink-muted hover:bg-card hover:text-ink hover:shadow-soft rounded-xl transition-all duration-fast"
        :aria-label="collapsed ? t('nav.expand') : t('nav.collapseMenu')"
      >
        <ChevronRightIcon
          class="w-5 h-5 transition-transform duration-normal"
          :class="{ 'rotate-180': collapsed }"
          aria-hidden="true"
        />
        <span v-if="!collapsed">{{ t('nav.collapseShort') }}</span>
      </button>
    </div>
  </div>
</template>
