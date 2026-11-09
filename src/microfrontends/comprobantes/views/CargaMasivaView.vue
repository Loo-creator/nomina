<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { Layers } from 'lucide-vue-next'
import PageHeader from '@/shared/components/PageHeader.vue'
import Card from '@/shared/components/Card.vue'
import Alert from '@/shared/components/Alert.vue'
import Select from '@/shared/components/Select.vue'
import Badge from '@/shared/components/Badge.vue'
import NuevoLotePanel from '@/microfrontends/comprobantes/components/NuevoLotePanel.vue'
import HistorialCargas from '@/microfrontends/comprobantes/components/HistorialCargas.vue'
import ZipsView from '@/microfrontends/comprobantes/components/ZipsView.vue'
import { useAuthStore } from '@/shared/stores/auth'
import { useTenantsStore } from '@/shared/stores/tenants'
import { ROLES } from '@/shared/utils/constants'
import { useI18n } from 'vue-i18n'

const { t } = useI18n({ useScope: 'global' })
const authStore = useAuthStore()
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

const route = useRoute()
const activeTab = ref(route.query.tab === 'historial' ? 'historial' : 'nuevo')

watch(activeTab, (tab) => {
  if (tab === 'historial') {
    window.history.replaceState({}, '', '?tab=historial')
  } else {
    window.history.replaceState({}, '', '?')
  }
})

function handleTenantChange(id) {
  selectedTenantId.value = id
}

onMounted(async () => {
  if (isAccountManager.value) {
    await tenantsStore.fetchTenants()
    selectedTenantId.value = tenantsStore.tenants[0]?.id ?? null
  } else if (authStore.userTenantId) {
    await tenantsStore.fetchTenantDetail(authStore.userTenantId)
    selectedTenantId.value = authStore.userTenantId
  }
})

onUnmounted(() => tenantsStore.clearCurrent())
</script>

<template>
  <div class="space-y-6">
    <PageHeader
      title="Carga masiva multi-RFC"
      description="Sube comprobantes de nómina y da seguimiento."
      :icon="Layers"
    />

    <Alert v-if="!effectiveTenantId" variant="info" title="Sin cuenta vinculada">
      Tu usuario no está vinculado a una cuenta de cliente. Contacta al administrador de la plataforma.
    </Alert>

    <Alert v-else-if="isSuspended" variant="warning" title="Cuenta suspendida">
      La cuenta está suspendida: la carga y el reprocesamiento de lotes están deshabilitados. Puedes consultar el historial en solo lectura.
    </Alert>

    <template v-if="effectiveTenantId">
      <div role="tablist" aria-label="Secciones de carga masiva" class="flex items-center gap-1 border-b border-neutral-200">
        <button
          role="tab"
          id="tab-nuevo-lote"
          aria-selected="activeTab === 'nuevo'"
          aria-controls="panel-nuevo-lote"
          :class="['px-4 py-2.5 text-sm font-semibold border-b-2 -mb-px transition-colors rounded-t-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)]', activeTab === 'nuevo' ? 'border-primary-500 text-primary-600' : 'border-transparent text-ink-muted hover:text-ink']"
          @click="activeTab = 'nuevo'"
        >
          Nuevo lote
        </button>
        <button
          role="tab"
          id="tab-historial"
          aria-selected="activeTab === 'historial'"
          aria-controls="panel-historial"
          :class="['px-4 py-2.5 text-sm font-semibold border-b-2 -mb-px transition-colors rounded-t-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)]', activeTab === 'historial' ? 'border-primary-500 text-primary-600' : 'border-transparent text-ink-muted hover:text-ink']"
          @click="activeTab = 'historial'"
        >
          {{ t('cargas.history') }}
        </button>
        <button
          role="tab"
          id="tab-zips"
          aria-selected="activeTab === 'zips'"
          aria-controls="panel-zips"
          :class="['px-4 py-2.5 text-sm font-semibold border-b-2 -mb-px transition-colors rounded-t-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)]', activeTab === 'zips' ? 'border-primary-500 text-primary-600' : 'border-transparent text-ink-muted hover:text-ink']"
          @click="activeTab = 'zips'"
        >
          Paquetes ZIP
        </button>
      </div>

      <div v-show="activeTab === 'nuevo'" role="tabpanel" id="panel-nuevo-lote" aria-labelledby="tab-nuevo-lote">
        <NuevoLotePanel :key="effectiveTenantId" :tenant-id="effectiveTenantId" :disabled="isSuspended" />
      </div>

      <div v-show="activeTab === 'historial'" role="tabpanel" id="panel-historial" aria-labelledby="tab-historial">
        <HistorialCargas :key="effectiveTenantId" :tenant-id="effectiveTenantId" :disabled="isSuspended" @go-new="activeTab = 'nuevo'" />
      </div>

      <div v-show="activeTab === 'zips'" role="tabpanel" id="panel-zips" aria-labelledby="tab-zips">
        <ZipsView :key="effectiveTenantId" :tenant-id="effectiveTenantId" :disabled="isSuspended" />
      </div>
    </template>
  </div>
</template>
