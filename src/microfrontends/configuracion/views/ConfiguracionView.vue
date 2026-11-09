<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { Settings, Building2, Bell, Palette, Save, Check, Globe, Mail, AlertTriangle, CalendarClock, History, RefreshCw, Send, BarChart3 } from 'lucide-vue-next'
import PageHeader from '@/shared/components/PageHeader.vue'
import Button from '@/shared/components/Button.vue'
import Input from '@/shared/components/Input.vue'
import Select from '@/shared/components/Select.vue'
import Skeleton from '@/shared/components/Skeleton.vue'
import Badge from '@/shared/components/Badge.vue'
import { useToastStore } from '@/shared/stores/toast'
import { useThemeStore } from '@/shared/stores/theme'
import { getSettings, updateSettings, getAuditLog } from '@/services/settings.service'
import { getMetrics, FUNNEL_EVENT_LABELS } from '@/services/telemetry.service'
import { useAuthStore } from '@/shared/stores/auth'
import { setLocale } from '@/shared/i18n'

const toastStore = useToastStore()
const themeStore = useThemeStore()
const authStore = useAuthStore()

const isLoading = ref(true)
const isSaving = ref(false)
const activeTab = ref('empresa')
const auditLog = ref([])
const isAuditLoading = ref(false)
const savingSection = ref('')
const metrics = ref(null)
const isMetricsLoading = ref(false)

const tabs = [
  { key: 'empresa', label: 'Empresa', icon: Building2 },
  { key: 'notificaciones', label: 'Notificaciones', icon: Bell },
  { key: 'preferencias', label: 'Preferencias', icon: Palette },
  { key: 'auditoria', label: 'Auditoría', icon: History },
  { key: 'metricas', label: 'Métricas', icon: BarChart3 },
]

const timezoneOptions = [
  { value: 'America/Mexico_City', label: 'Ciudad de México (GMT-6)' },
  { value: 'America/Tijuana', label: 'Tijuana (GMT-8)' },
  { value: 'America/Monterrey', label: 'Monterrey (GMT-6)' },
  { value: 'America/Cancun', label: 'Cancún (GMT-5)' },
]

const currencyOptions = [
  { value: 'MXN', label: 'Peso mexicano (MXN)' },
  { value: 'USD', label: 'Dólar (USD)' },
]

const languageOptions = [
  { value: 'es', label: 'Español' },
  { value: 'en', label: 'English' },
]

const dateFormatOptions = [
  { value: 'dd/mm/yyyy', label: 'DD/MM/AAAA' },
  { value: 'mm/dd/yyyy', label: 'MM/DD/AAAA' },
  { value: 'yyyy-mm-dd', label: 'AAAA-MM-DD' },
]

const notificationItems = [
  { key: 'notifyPayrollStamped', label: 'Nómina timbrada', description: 'Recibe un correo cuando una nómina se timbre correctamente', icon: Mail },
  { key: 'notifyLoadErrors', label: 'Errores de carga', description: 'Avisar cuando una carga de insumos presente errores', icon: AlertTriangle },
  { key: 'notifyWeeklySummary', label: 'Resumen semanal', description: 'Un resumen semanal con las métricas de nómina', icon: CalendarClock },
  { key: 'notifyPaymentRun', label: 'Dispersión de pagos', description: 'Notificar cuando se ejecute la dispersión de pagos', icon: Bell },
]

const form = reactive({
  companyName: '',
  rfc: '',
  address: '',
  timezone: 'America/Mexico_City',
  currency: 'MXN',
  dateFormat: 'dd/mm/yyyy',
  language: 'es',
  notifyPayrollStamped: true,
  notifyLoadErrors: true,
  notifyWeeklySummary: false,
  notifyPaymentRun: true,
})

const themes = computed(() => themeStore.themes)

function toggleNotification(key) {
  form[key] = !form[key]
}

async function loadSettings() {
  isLoading.value = true
  const res = await getSettings()
  if (res.ok) Object.assign(form, res.data)
  else toastStore.error(res.message)
  isLoading.value = false
}

const sectionSaveMessages = {
  empresa: 'Datos de la empresa guardados',
  notificaciones: 'Notificaciones guardadas',
  preferencias: 'Preferencias guardadas',
}

async function handleSave(section) {
  isSaving.value = true
  savingSection.value = section
  const res = await updateSettings({ ...form }, { section: tabs.find(t => t.key === section)?.label || section, actor: authStore.user?.email || 'desconocido' })
  if (res.ok) {
    toastStore.success(sectionSaveMessages[section] || res.message)
    await loadAuditLog()
  } else {
    toastStore.error(res.message)
  }
  isSaving.value = false
  savingSection.value = ''
}

async function loadMetrics() {
  isMetricsLoading.value = true
  const res = await getMetrics()
  if (res.ok) metrics.value = res.data
  else toastStore.error(res.message)
  isMetricsLoading.value = false
}

watch(activeTab, (tab) => {
  if (tab === 'metricas' && !metrics.value) loadMetrics()
})

async function loadAuditLog() {
  isAuditLoading.value = true
  const res = await getAuditLog()
  if (res.ok) auditLog.value = res.data
  isAuditLoading.value = false
}

function handleSendTest() {
  toastStore.success(`Correo de prueba enviado a ${authStore.user?.email}`)
}

watch(() => form.language, (value) => {
  if (value) setLocale(value)
})

onMounted(async () => { await loadSettings(); await loadAuditLog() })
</script>

<template>
  <div class="space-y-7">
    <PageHeader
      title="Configuración"
      description="Datos de empresa, notificaciones y preferencias."
      :icon="Settings"
    >
    </PageHeader>

    <!-- Tabs -->
    <div class="flex flex-wrap gap-2.5">
      <button
        v-for="tab in tabs"
        :key="tab.key"
        type="button"
        class="tab-pill"
        :class="activeTab === tab.key
          ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-glow'
          : 'bg-card text-ink-soft border border-neutral-100 hover:border-primary-200 hover:text-ink'"
        @click="activeTab = tab.key"
      >
        <component :is="tab.icon" class="w-4 h-4" />
        {{ tab.label }}
      </button>
    </div>

    <div v-if="isLoading" class="card p-6 space-y-4">
      <Skeleton v-for="i in 5" :key="i" width="100%" height="3rem" />
    </div>

    <template v-else>
      <!-- Empresa -->
      <div v-if="activeTab === 'empresa'" class="card p-6">
        <div class="flex items-center gap-3 mb-6">
          <span class="icon-tile w-10 h-10 bg-gradient-to-br from-primary-400 to-primary-600"><Building2 class="w-5 h-5" /></span>
          <div>
            <h2 class="font-display text-lg font-bold text-ink">Datos de la empresa</h2>
            <p class="text-sm text-ink-muted">Información general para la emisión de comprobantes</p>
          </div>
        </div>
        <form class="grid grid-cols-1 sm:grid-cols-2 gap-5" @submit.prevent="handleSave('empresa')">
          <div class="sm:col-span-2">
            <Input id="config-name" v-model="form.companyName" label="Razón social" />
          </div>
          <Input id="config-rfc" v-model="form.rfc" label="RFC" />
          <Select id="config-currency" v-model="form.currency" label="Moneda" :options="currencyOptions" />
          <Select id="config-timezone" v-model="form.timezone" label="Zona horaria" :options="timezoneOptions" />
          <Select id="config-dateformat" v-model="form.dateFormat" label="Formato de fecha" :options="dateFormatOptions" />
          <div class="sm:col-span-2">
            <Input id="config-address" v-model="form.address" label="Dirección fiscal" />
          </div>
          <div class="sm:col-span-2 flex justify-end">
            <Button variant="primary" :icon="Save" :loading="isSaving && savingSection === 'empresa'" @click="handleSave('empresa')">
              Guardar empresa
            </Button>
          </div>
        </form>
      </div>

      <!-- Notificaciones -->
      <div v-else-if="activeTab === 'notificaciones'" class="card p-6">
        <div class="flex items-center gap-3 mb-6">
          <span class="icon-tile w-10 h-10 bg-gradient-to-br from-gold-400 to-gold-600"><Bell class="w-5 h-5" /></span>
          <div>
            <h2 class="font-display text-lg font-bold text-ink">Notificaciones</h2>
            <p class="text-sm text-ink-muted">Elige qué avisos quieres recibir</p>
          </div>
        </div>
        <div class="divide-y divide-neutral-100">
          <div
            v-for="item in notificationItems"
            :key="item.key"
            class="flex items-center gap-4 py-4 first:pt-0 last:pb-0"
          >
            <span class="w-10 h-10 rounded-xl bg-neutral-50 flex items-center justify-center flex-shrink-0">
              <component :is="item.icon" class="w-5 h-5 text-ink-muted" />
            </span>
            <div class="flex-1 min-w-0">
              <p class="font-semibold text-ink">{{ item.label }}</p>
              <p class="text-sm text-ink-muted">{{ item.description }}</p>
            </div>
            <button
              type="button"
              role="switch"
              :aria-checked="form[item.key]"
              :aria-label="item.label"
              class="relative inline-flex h-6 w-11 flex-shrink-0 rounded-full transition-colors duration-normal"
              :class="form[item.key] ? 'bg-gradient-to-r from-primary-500 to-primary-600' : 'bg-neutral-200'"
              @click="toggleNotification(item.key)"
            >
              <span
                class="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-soft transition-transform duration-normal"
                :class="form[item.key] && 'translate-x-5'"
              />
            </button>
          </div>
        </div>
        <div class="flex flex-wrap justify-end gap-2 mt-6 pt-6 border-t border-neutral-100">
          <Button variant="secondary" :icon="Send" @click="handleSendTest">Enviar correo de prueba</Button>
          <Button variant="primary" :icon="Save" :loading="isSaving && savingSection === 'notificaciones'" @click="handleSave('notificaciones')">
            Guardar notificaciones
          </Button>
        </div>
      </div>

      <!-- Preferencias -->
      <div v-else-if="activeTab === 'preferencias'" class="space-y-6">
        <div class="card p-6">
          <div class="flex items-center gap-3 mb-6">
            <span class="icon-tile w-10 h-10 bg-gradient-to-br from-primary-400 to-primary-600"><Palette class="w-5 h-5" /></span>
            <div>
              <h2 class="font-display text-lg font-bold text-ink">Tema de color</h2>
              <p class="text-sm text-ink-muted">Tema predeterminado para todos los usuarios; cada quien puede personalizar el suyo en <em>Mi perfil</em></p>
            </div>
          </div>
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <button
              v-for="theme in themes"
              :key="theme.id"
              type="button"
              class="relative rounded-2xl border-2 p-4 text-left transition-all duration-normal hover:-translate-y-1"
              :class="themeStore.theme === theme.id
                ? 'border-primary-500 shadow-glow'
                : 'border-neutral-100 hover:border-primary-200'"
              @click="themeStore.setOrgTheme(theme.id)"
            >
              <span
                v-if="themeStore.theme === theme.id"
                class="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary-500 flex items-center justify-center"
              >
                <Check class="w-3.5 h-3.5 text-white" />
              </span>
              <div class="flex gap-1.5 mb-3">
                <span
                  v-for="(color, i) in theme.swatches"
                  :key="i"
                  class="w-7 h-7 rounded-lg ring-1 ring-black/5"
                  :style="{ backgroundColor: color }"
                />
              </div>
              <p class="font-semibold text-ink text-sm">{{ theme.name }}</p>
              <p class="text-xs text-ink-muted">{{ theme.description }}</p>
            </button>
          </div>
        </div>

        <div class="card p-6">
          <div class="flex items-center gap-3 mb-6">
            <span class="icon-tile w-10 h-10 bg-gradient-to-br from-teal-400 to-teal-600"><Globe class="w-5 h-5" /></span>
            <div>
              <h2 class="font-display text-lg font-bold text-ink">Región e idioma</h2>
              <p class="text-sm text-ink-muted">Ajusta el idioma y el formato de los datos</p>
            </div>
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <Select id="config-language" v-model="form.language" label="Idioma" :options="languageOptions" />
            <Select id="config-region-date" v-model="form.dateFormat" label="Formato de fecha" :options="dateFormatOptions" />
          </div>
        </div>
        <div class="flex justify-end">
          <Button variant="primary" :icon="Save" :loading="isSaving && savingSection === 'preferencias'" @click="handleSave('preferencias')">
            Guardar preferencias
          </Button>
        </div>
      </div>

      <!-- Auditoría -->
      <div v-else-if="activeTab === 'auditoria'" class="card p-6">
        <div class="flex flex-wrap items-center justify-between gap-3 mb-5">
          <div class="flex items-center gap-3">
            <span class="icon-tile w-10 h-10 bg-gradient-to-br from-neutral-400 to-neutral-600"><History class="w-5 h-5 text-white" /></span>
            <div>
              <h2 class="font-display text-lg font-bold text-ink">Auditoría de cambios</h2>
              <p class="text-sm text-ink-muted">Quién cambió qué y cuándo (últimos {{ auditLog.length }} registros)</p>
            </div>
          </div>
          <Button variant="ghost" :icon="RefreshCw" :loading="isAuditLoading" @click="loadAuditLog">Actualizar</Button>
        </div>
        <div v-if="isAuditLoading" class="py-8 text-center text-ink-muted">Cargando registro…</div>
        <div v-else-if="!auditLog.length" class="py-10 text-center text-ink-muted">Aún no hay cambios registrados.</div>
        <div v-else class="overflow-x-auto">
          <table class="table">
            <thead>
              <tr><th>Fecha</th><th>Sección</th><th>Cambio</th><th>Usuario</th></tr>
            </thead>
            <tbody>
              <tr v-for="entry in auditLog" :key="entry.id">
                <td class="whitespace-nowrap text-sm text-ink-soft">{{ new Date(entry.at).toLocaleString('es-MX', { dateStyle: 'medium', timeStyle: 'short' }) }}</td>
                <td class="text-sm"><Badge variant="neutral">{{ entry.section }}</Badge></td>
                <td class="text-sm text-ink-soft">{{ entry.summary }}</td>
                <td class="text-sm font-mono text-ink-muted">{{ entry.actor }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Métricas -->
      <div v-else class="space-y-6">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div class="flex items-center gap-3">
            <span class="icon-tile w-10 h-10 bg-gradient-to-br from-teal-400 to-teal-600"><BarChart3 class="w-5 h-5 text-white" /></span>
            <div>
              <h2 class="font-display text-lg font-bold text-ink">Métricas de uso (últimos 30 días)</h2>
              <p class="text-sm text-ink-muted">Instrumentación mock: eventos emitidos por la propia app</p>
            </div>
          </div>
          <Button variant="ghost" :icon="RefreshCw" :loading="isMetricsLoading" @click="loadMetrics">Actualizar</Button>
        </div>

        <div v-if="isMetricsLoading || !metrics" class="card p-6 text-center text-ink-muted py-10">Cargando métricas…</div>
        <template v-else>
          <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div v-for="item in [
              { label: 'Cargas creadas', value: metrics.funnel.cargas },
              { label: 'Nóminas timbradas', value: metrics.funnel.timbradas },
              { label: 'Nóminas firmadas', value: metrics.funnel.firmadas },
              { label: 'Completado carga→firma', value: metrics.completionRate + '%' },
            ]" :key="item.label" class="card p-5">
              <p class="text-[11px] uppercase tracking-wide text-ink-muted font-semibold">{{ item.label }}</p>
              <p class="mt-1.5 text-3xl font-display font-extrabold text-ink tabular-nums">{{ item.value }}</p>
            </div>
          </div>

          <div class="card p-6">
            <h3 class="font-semibold text-ink mb-4">Funnel operativo</h3>
            <ul class="space-y-3" aria-label="Funnel de carga a firma">
              <li v-for="stage in metrics.funnelStages" :key="stage.key" class="flex items-center gap-3">
                <span class="w-48 text-sm text-ink-soft truncate">{{ stage.label }}</span>
                <div class="flex-1 h-6 rounded-lg bg-neutral-100 overflow-hidden">
                  <div class="h-full bg-gradient-to-r from-primary-500 to-teal-500 transition-all duration-slow" :style="{ width: `${stage.percent}%` }" role="progressbar" :aria-valuenow="stage.value" :aria-valuemin="0" aria-label="stage.label" />
                </div>
                <span class="w-12 text-right text-sm font-semibold text-ink tabular-nums">{{ stage.value }}</span>
              </li>
            </ul>
          </div>

          <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div class="card p-6">
              <h3 class="font-semibold text-ink mb-3">Errores más frecuentes</h3>
              <p v-if="!metrics.topErrors.length" class="text-sm text-ink-muted">Sin errores registrados en el periodo.</p>
              <ul v-else class="divide-y divide-neutral-100">
                <li v-for="error in metrics.topErrors" :key="error.code" class="flex items-center justify-between gap-3 py-2">
                  <code class="text-xs bg-neutral-100 rounded px-2 py-1 text-ink-soft">{{ error.code }}</code>
                  <span class="text-sm font-semibold text-ink tabular-nums">{{ error.count }}×</span>
                </li>
              </ul>
              <p class="mt-4 text-xs text-ink-muted">Logins fallidos (30 días): <strong>{{ metrics.failedLogins }}</strong></p>
            </div>
            <div class="card p-6 overflow-x-auto">
              <h3 class="font-semibold text-ink mb-3">Actividad reciente</h3>
              <table class="table">
                <thead><tr><th>Fecha</th><th>Evento</th><th>Detalle</th></tr></thead>
                <tbody>
                  <tr v-for="event in metrics.recentEvents" :key="event.id">
                    <td class="whitespace-nowrap text-xs text-ink-soft">{{ new Date(event.at).toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' }) }}</td>
                    <td class="text-xs"><Badge variant="neutral" size="sm">{{ FUNNEL_EVENT_LABELS[event.event] || event.event }}</Badge></td>
                    <td class="text-xs text-ink-muted">{{ Object.entries(event.props || {}).slice(0, 2).map(([k, v]) => `${k}=${v}`).join(' · ') || '—' }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </template>
      </div>
    </template>
  </div>
</template>
