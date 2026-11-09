<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { Palette, Save, QrCode, Monitor, Smartphone, History, RotateCcw } from 'lucide-vue-next'
import PageHeader from '@/shared/components/PageHeader.vue'
import Button from '@/shared/components/Button.vue'
import Select from '@/shared/components/Select.vue'
import Input from '@/shared/components/Input.vue'
import { useAuthStore } from '@/shared/stores/auth'
import Badge from '@/shared/components/Badge.vue'
import { useToastStore } from '@/shared/stores/toast'
import { getCompanies } from '@/services/companies.service'
import { getInvoiceDesigns, updateInvoiceDesign, getInvoiceDesignVersions, restoreInvoiceDesign } from '@/services/fiscal.service'

const authStore = useAuthStore()
const toastStore = useToastStore()

const companies = ref([])
const designs = ref([])
const selectedDesignId = ref('')
const isSaving = ref(false)
const versions = ref([])
const isVersionsLoading = ref(false)
const restoringVersionId = ref(null)

const form = reactive({
  name: '',
  logoPosition: 'left',
  primaryColor: '#E76F51',
  font: 'Inter',
  showQR: true,
})

const positionOptions = [
  { value: 'left', label: 'Izquierda' },
  { value: 'center', label: 'Centro' },
  { value: 'right', label: 'Derecha' },
]

const fontOptions = [
  { value: 'Inter', label: 'Inter' },
  { value: 'Roboto', label: 'Roboto' },
  { value: 'Helvetica', label: 'Helvetica' },
]

const companyIds = computed(() =>
  authStore.scopedCompanyIds
)

const designOptions = computed(() =>
  designs.value.map(d => ({ value: String(d.id), label: d.name }))
)

const selectedDesign = computed(() =>
  designs.value.find(d => String(d.id) === selectedDesignId.value)
)

function hexToRgb(hex) {
  const clean = String(hex || '').replace('#', '')
  const full = clean.length === 3 ? clean.split('').map(c => c + c).join('') : clean
  const num = Number.parseInt(full, 16)
  if (Number.isNaN(num) || full.length !== 6) return { r: 0, g: 0, b: 0 }
  return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 }
}

function luminance({ r, g, b }) {
  const channel = (c) => {
    c = c / 255
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  }
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b)
}

function contrastRatio(hexA, hexB) {
  const l1 = luminance(hexToRgb(hexA))
  const l2 = luminance(hexToRgb(hexB))
  const max = Math.max(l1, l2)
  const min = Math.min(l1, l2)
  return (max + 0.05) / (min + 0.05)
}

const previewMode = ref('desktop')

const contrast = computed(() => contrastRatio(form.primaryColor, '#FFFFFF'))
const contrastBadge = computed(() => {
  const r = contrast.value
  if (r >= 7) return { level: 'AAA', variant: 'success', hint: 'Excelente legibilidad' }
  if (r >= 4.5) return { level: 'AA', variant: 'success', hint: 'Legible en texto normal' }
  if (r >= 3) return { level: 'AA grande', variant: 'warning', hint: 'Solo texto grande (≥ 18 pt)' }
  return { level: 'Falla', variant: 'danger', hint: 'No legible sobre blanco' }
})

const previewCompany = computed(() =>
  companies.value.find(c => c.id === selectedDesign.value?.companyId)?.name || 'Empresa Demo SA de CV'
)

const logoAlign = computed(() => {
  if (form.logoPosition === 'center') return 'justify-center'
  if (form.logoPosition === 'right') return 'justify-end'
  return 'justify-start'
})

async function loadVersions() {
  if (!selectedDesign.value) {
    versions.value = []
    return
  }
  isVersionsLoading.value = true
  const res = await getInvoiceDesignVersions(selectedDesign.value.id)
  if (res.ok) versions.value = res.data
  else toastStore.error(res.message)
  isVersionsLoading.value = false
}

async function handleRestore(version) {
  if (!selectedDesign.value) return
  restoringVersionId.value = version.id
  const res = await restoreInvoiceDesign(selectedDesign.value.id, version.id)
  if (res.ok) {
    toastStore.success(res.message)
    await loadData()
    selectedDesignId.value = String(res.data.id)
    loadDesign()
    await loadVersions()
  } else {
    toastStore.error(res.message)
  }
  restoringVersionId.value = null
}

async function loadData() {
  const [compRes, designRes] = await Promise.all([
    getCompanies(companyIds.value),
    getInvoiceDesigns(companyIds.value),
  ])
  if (compRes.ok) companies.value = compRes.data
  if (designRes.ok) {
    designs.value = designRes.data
    if (designRes.data.length) selectedDesignId.value = String(designRes.data[0].id)
  }
}

function loadDesign() {
  const d = selectedDesign.value
  if (!d) return
  Object.assign(form, {
    name: d.name,
    logoPosition: d.config?.logoPosition || 'left',
    primaryColor: d.config?.colors?.primary || '#E76F51',
    font: d.config?.font || 'Inter',
    showQR: d.config?.showQR ?? true,
  })
}

async function handleSave() {
  if (!selectedDesign.value) return
  isSaving.value = true
  const res = await updateInvoiceDesign(selectedDesign.value.id, {
    name: form.name,
    config: {
      logoPosition: form.logoPosition,
      colors: { primary: form.primaryColor },
      font: form.font,
      showQR: form.showQR,
    },
  })
  if (res.ok) {
    toastStore.success(res.message)
    await loadData()
    selectedDesignId.value = String(res.data.id)
    await loadVersions()
  } else {
    toastStore.error(res.message)
  }
  isSaving.value = false
}

watch(selectedDesignId, () => { loadDesign(); loadVersions() })

onMounted(async () => {
  await loadData()
  loadDesign()
  await loadVersions()
})
</script>

<template>
  <div class="space-y-7">
    <PageHeader
      title="Diseñador de facturas"
      description="Personaliza la apariencia de tus comprobantes fiscales"
      :icon="Palette"
    />

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div class="card p-6 space-y-5">
        <Select id="design" v-model="selectedDesignId" label="Diseño" :options="designOptions" placeholder="Selecciona un diseño" />
        <Input id="design-name" v-model="form.name" label="Nombre del diseño" />
        <Select id="design-logo" v-model="form.logoPosition" label="Posición del logo" :options="positionOptions" />
        <Select id="design-font" v-model="form.font" label="Tipografía" :options="fontOptions" />

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
          <div>
            <span class="label">Color principal</span>
            <div class="flex items-center gap-3">
              <input v-model="form.primaryColor" type="color" class="w-12 h-11 rounded-xl border border-neutral-200 cursor-pointer bg-card p-1" aria-label="Color principal" />
              <span class="font-mono text-sm text-ink-soft">{{ form.primaryColor }}</span>
            </div>
            <div class="flex items-center gap-2 mt-2" aria-live="polite">
              <Badge :variant="contrastBadge.variant" size="sm">Contraste {{ contrastBadge.level }} · {{ contrast.toFixed(2) }}:1</Badge>
              <span class="text-xs text-ink-muted">{{ contrastBadge.hint }} (texto blanco sobre el color)</span>
            </div>
          </div>
          <label class="flex items-center gap-2.5 px-3.5 py-3 rounded-xl border border-neutral-200 bg-card cursor-pointer">
            <input v-model="form.showQR" type="checkbox" class="w-4 h-4 rounded border-neutral-300 text-primary-600 focus:ring-primary-500" />
            <span class="text-sm text-ink-soft">Mostrar código QR</span>
          </label>
        </div>

        <div class="flex justify-end">
          <Button variant="primary" :icon="Save" :loading="isSaving" :disabled="!selectedDesign" @click="handleSave">Guardar diseño</Button>
        </div>

        <div class="border-t border-neutral-100 pt-5">
          <div class="flex items-center justify-between gap-2 mb-3">
            <h3 class="font-semibold text-ink flex items-center gap-2">
              <History class="w-4 h-4 text-ink-muted" aria-hidden="true" /> Historial de versiones
            </h3>
            <span class="text-xs text-ink-muted">{{ versions.length }} guardada(s)</span>
          </div>
          <div v-if="isVersionsLoading" class="text-sm text-ink-muted py-3">Cargando versiones…</div>
          <p v-else-if="!versions.length" class="text-sm text-ink-muted py-3">Aún no hay versiones previas. Cada guardado crea una.</p>
          <ul v-else class="space-y-2">
            <li v-for="version in versions" :key="version.id" class="flex flex-wrap items-center gap-3 rounded-xl border border-neutral-200 px-3 py-2">
              <span class="w-4 h-4 rounded-full ring-1 ring-black/10 flex-shrink-0" :style="{ backgroundColor: version.config?.colors?.primary || '#ccc' }" :title="`Color ${version.config?.colors?.primary}`" aria-hidden="true" />
              <div class="min-w-0 flex-1">
                <p class="text-sm font-medium text-ink">{{ new Date(version.at).toLocaleString('es-MX', { dateStyle: 'medium', timeStyle: 'short' }) }}</p>
                <p class="text-xs text-ink-muted">{{ version.config?.font || 'Inter' }} · QR {{ version.config?.showQR ? 'sí' : 'no' }} · logo {{ version.config?.logoPosition }}</p>
              </div>
              <button
                type="button"
                class="inline-flex items-center gap-1.5 text-xs font-semibold text-primary-600 hover:text-primary-700 rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)]"
                :disabled="restoringVersionId === version.id"
                @click="handleRestore(version)"
              >
                <RotateCcw class="w-3.5 h-3.5" aria-hidden="true" />
                {{ restoringVersionId === version.id ? 'Restaurando…' : 'Restaurar' }}
              </button>
            </li>
          </ul>
        </div>
      </div>

      <div class="space-y-4">
        <div class="flex items-center justify-between gap-3">
          <h2 class="font-display font-bold text-ink">Vista previa</h2>
          <div class="flex items-center gap-1 rounded-xl border border-neutral-200 p-1" role="group" aria-label="Tamaño de vista previa">
            <button
              type="button"
              :aria-pressed="previewMode === 'desktop'"
              :class="['inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors', previewMode === 'desktop' ? 'bg-primary-600 text-white' : 'text-ink-muted hover:text-ink']"
              @click="previewMode = 'desktop'"
            >
              <Monitor class="w-4 h-4" aria-hidden="true" /> Escritorio
            </button>
            <button
              type="button"
              :aria-pressed="previewMode === 'mobile'"
              :class="['inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors', previewMode === 'mobile' ? 'bg-primary-600 text-white' : 'text-ink-muted hover:text-ink']"
              @click="previewMode = 'mobile'"
            >
              <Smartphone class="w-4 h-4" aria-hidden="true" /> Móvil 320 px
            </button>
          </div>
        </div>
        <div class="card p-6 bg-card transition-all duration-normal" :class="previewMode === 'mobile' ? 'max-w-[320px] mx-auto' : ''" :style="{ fontFamily: form.font }">
          <div class="flex items-start" :class="logoAlign">
            <div class="flex items-center gap-3">
              <div class="w-12 h-12 rounded-xl flex items-center justify-center text-white font-extrabold" :style="{ backgroundColor: form.primaryColor }">N</div>
              <div>
                <p class="font-bold text-ink text-sm">NOMIKOK</p>
                <p class="text-xs text-ink-muted">Comprobante de nómina</p>
              </div>
            </div>
          </div>

          <div class="mt-6 pb-4 border-b-2" :style="{ borderColor: form.primaryColor }">
            <p class="font-bold text-ink">{{ previewCompany }}</p>
            <p class="text-xs text-ink-muted">RFC: EMP123456789 · Régimen 601</p>
          </div>

          <div class="mt-4 grid grid-cols-2 gap-4 text-xs">
            <div>
              <p class="text-ink-muted">Empleado</p>
              <p class="font-medium text-ink">Juan Carlos Pérez García</p>
            </div>
            <div>
              <p class="text-ink-muted">Período</p>
              <p class="font-medium text-ink">Marzo 2024</p>
            </div>
          </div>

          <table class="w-full mt-4 text-xs">
            <thead>
              <tr class="text-white" :style="{ backgroundColor: form.primaryColor }">
                <th class="text-left px-3 py-2 rounded-l-lg">Concepto</th>
                <th class="text-right px-3 py-2">Importe</th>
                <th class="text-right px-3 py-2 rounded-r-lg">Total</th>
              </tr>
            </thead>
            <tbody class="text-ink-soft">
              <tr class="border-b border-neutral-100">
                <td class="px-3 py-2">Sueldo base</td>
                <td class="px-3 py-2 text-right">$15,000.00</td>
                <td class="px-3 py-2 text-right">$15,000.00</td>
              </tr>
              <tr class="border-b border-neutral-100">
                <td class="px-3 py-2">ISR</td>
                <td class="px-3 py-2 text-right">-$1,200.00</td>
                <td class="px-3 py-2 text-right">$13,800.00</td>
              </tr>
            </tbody>
          </table>

          <div class="mt-4 flex items-center justify-between">
            <div class="text-xs text-ink-muted">
              <p>Total neto</p>
              <p class="text-lg font-bold" :style="{ color: form.primaryColor }">$13,800.00</p>
            </div>
            <div v-if="form.showQR" class="w-16 h-16 rounded-lg border border-neutral-200 flex items-center justify-center">
              <QrCode class="w-10 h-10 text-ink-muted" aria-hidden="true" />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
