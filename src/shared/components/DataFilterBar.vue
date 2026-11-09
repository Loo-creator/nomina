<script setup>
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import {
  Search,
  X,
  SlidersHorizontal,
  RotateCcw,
  Check,
  CalendarDays,
  CalendarRange,
  Building2,
  CircleDot,
  ListFilter,
} from 'lucide-vue-next'
import Button from './Button.vue'
import Select from './Select.vue'
import { useDebounce } from '@/shared/composables/useDebounce'

const props = defineProps({
  modelValue: { type: Object, default: () => ({}) },
  filters: { type: Array, default: () => [] },
  visibleFilterKeys: { type: Array, default: () => [] },
  searchable: { type: Boolean, default: true },
  searchPlaceholder: { type: String, default: 'Buscar...' },
  searchFields: { type: Array, default: () => [] },
  showFilterChips: { type: Boolean, default: true },
  resultsCount: { type: Number, default: 0 },
  totalizers: { type: Object, default: () => ({}) },
  loading: { type: Boolean, default: false },
})

const emit = defineEmits(['update:modelValue', 'filter-change', 'clear-all', 'search'])

const router = useRouter()

const drawerOpen = ref(false)
const draftModel = ref({})
const closeButtonRef = ref(null)
const debouncedSearch = useDebounce('', 300)

const COMPANY_ALIASES = ['companyId', 'companyName']

function isCompanyFilter(filter) {
  return COMPANY_ALIASES.includes(filter.key) && (filter.options?.length > 0)
}

const companyFilter = computed(() => props.filters.find(isCompanyFilter) || null)

const quickFilters = computed(() => {
  const visible = new Set(props.visibleFilterKeys || [])
  const list = props.filters.filter(
    f => f.key !== 'search' && f.type === 'select' && visible.has(f.key),
  )
  if (companyFilter.value && !list.includes(companyFilter.value)) {
    list.unshift(companyFilter.value)
  }
  return list.slice(0, 3)
})

const drawerFilters = computed(() => props.filters.filter(f => f.key !== 'search'))

const GROUP_ORDER = ['Periodo', 'Organización', 'Estado', 'Fechas', 'Otros filtros']

const GROUP_ICONS = {
  'Periodo': CalendarDays,
  'Organización': Building2,
  'Estado': CircleDot,
  'Fechas': CalendarRange,
  'Otros filtros': ListFilter,
}

const GROUP_BY_KEY = {
  periodLabel: 'Periodo',
  period: 'Periodo',
  periodPay: 'Periodo',
  year: 'Periodo',
  month: 'Periodo',
  companyName: 'Organización',
  companyId: 'Organización',
  companyRfc: 'Organización',
  department: 'Organización',
  status: 'Estado',
  firma: 'Estado',
}

function groupForFilter(filter) {
  if (filter.group) return filter.group
  if (GROUP_BY_KEY[filter.key]) return GROUP_BY_KEY[filter.key]
  if (filter.type === 'dateRange' || filter.type === 'date') return 'Fechas'
  return 'Otros filtros'
}

const groupedFilters = computed(() => {
  const groups = new Map()
  drawerFilters.value.forEach((filter) => {
    const label = groupForFilter(filter)
    if (!groups.has(label)) groups.set(label, [])
    groups.get(label).push(filter)
  })
  return [...groups.entries()]
    .sort((a, b) => {
      const ai = GROUP_ORDER.indexOf(a[0])
      const bi = GROUP_ORDER.indexOf(b[0])
      return (ai === -1 ? GROUP_ORDER.length : ai) - (bi === -1 ? GROUP_ORDER.length : bi)
    })
    .map(([label, items]) => ({ label, items }))
})

function isFilterValueActive(value) {
  if (value === '' || value === null || value === undefined || value === false) return false
  if (Array.isArray(value)) return value.length > 0
  if (typeof value === 'object') return Object.values(value).some(x => Boolean(String(x || '').trim()))
  return true
}

const activeDrawerCount = computed(() =>
  drawerFilters.value.filter(f => isFilterValueActive(props.modelValue[f.key])).length,
)

const searchInput = ref(props.modelValue?.search ?? '')

watch(() => props.modelValue?.search, (val) => {
  if ((val ?? '') !== searchInput.value) searchInput.value = val ?? ''
})

watch(searchInput, (val) => {
  debouncedSearch.value = val
})

watch(debouncedSearch, (val) => {
  if ((props.modelValue?.search ?? '') === (val ?? '')) return
  const next = { ...props.modelValue }
  if (val) next.search = val
  else delete next.search
  emit('update:modelValue', next)
  emit('search', val)
  updateUrl(next)
})

function cloneModel(model = {}) {
  return Object.fromEntries(
    Object.entries(model || {}).map(([key, value]) => {
      if (Array.isArray(value)) return [key, [...value]]
      if (value && typeof value === 'object') return [key, { ...value }]
      return [key, value]
    }),
  )
}

function handleFilterChange(key, value) {
  const newFilters = { ...props.modelValue }
  if (value === '' || value === null || value === undefined || (Array.isArray(value) && value.length === 0)) {
    delete newFilters[key]
  } else {
    newFilters[key] = value
  }
  emit('update:modelValue', newFilters)
  emit('filter-change', { key, value })
  updateUrl(newFilters)
}

function clearFilter(key) {
  const newFilters = { ...props.modelValue }
  delete newFilters[key]
  emit('update:modelValue', newFilters)
  emit('filter-change', { key, value: undefined })
  if (drawerOpen.value) {
    const nextDraft = { ...draftModel.value }
    delete nextDraft[key]
    draftModel.value = nextDraft
  }
  updateUrl(newFilters)
}

function clearAllFilters() {
  emit('update:modelValue', {})
  emit('clear-all')
  updateUrl({})
  searchInput.value = ''
  debouncedSearch.value = ''
  draftModel.value = {}
}

function updateUrl(state = props.modelValue) {
  const params = new URLSearchParams()
  Object.entries(state ?? {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      if (Array.isArray(value)) {
        value.forEach(v => params.append(key, v))
      } else if (typeof value === 'object') {
        const sub = new URLSearchParams()
        Object.entries(value).forEach(([subKey, subValue]) => {
          if (subValue) sub.append(subKey, subValue)
        })
        if (sub.toString()) params.append(key, sub.toString())
      } else {
        params.set(key, value)
      }
    }
  })
  const newUrl = params.toString() ? `?${params.toString()}` : window.location.pathname
  if (router && typeof router.replace === 'function') {
    router.replace(newUrl)
  }
}

function getFilterLabel(key) {
  const filter = props.filters.find(f => f.key === key)
  return filter?.label || key
}

function getFilterValueDisplay(key, value) {
  const filter = props.filters.find(f => f.key === key)
  if (!filter) return value
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    const { min, max } = value
    if (min || max) return `${min || '…'} – ${max || '…'}`
    return filter.label
  }
  if (Array.isArray(value)) {
    return value.map(v => filter.options?.find(o => o.value === v)?.label || v).join(', ')
  }
  return filter.options?.find(o => o.value === value)?.label || value
}

function getActiveFilterChips() {
  const chips = []
  Object.entries(props.modelValue).forEach(([key, value]) => {
    if (key === 'search') return
    if (!isFilterValueActive(value)) return
    if (Array.isArray(value)) {
      value.forEach(v => chips.push({ key, value: v, label: getFilterValueDisplay(key, v) }))
    } else {
      chips.push({ key, value, label: getFilterValueDisplay(key, value) })
    }
  })
  return chips
}

function openDrawer() {
  draftModel.value = cloneModel(props.modelValue)
  drawerOpen.value = true
}

function closeDrawer() {
  drawerOpen.value = false
}

function applyDraft() {
  const next = cloneModel(draftModel.value)
  emit('update:modelValue', next)
  emit('filter-change', { key: '*', value: next })
  updateUrl(next)
  drawerOpen.value = false
}

function clearDraft() {
  draftModel.value = {}
}

function handleDraftChange(key, value) {
  const next = { ...draftModel.value }
  if (value === '' || value === null || value === undefined || (Array.isArray(value) && value.length === 0)) {
    delete next[key]
  } else {
    next[key] = value
  }
  draftModel.value = next
}

function toggleDraftMulti(key, value) {
  const current = Array.isArray(draftModel.value?.[key]) ? [...draftModel.value[key]] : []
  const index = current.indexOf(value)
  if (index > -1) current.splice(index, 1)
  else current.push(value)
  handleDraftChange(key, current)
}

function setDraftDate(key, part, value) {
  const current = draftModel.value?.[key] || {}
  handleDraftChange(key, { ...current, [part]: value })
}

function handleKeydown(event) {
  if (event.key === 'Escape' && drawerOpen.value) {
    event.stopPropagation()
    closeDrawer()
  }
}

watch(drawerOpen, async (open) => {
  if (open) {
    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', handleKeydown)
    await nextTick()
    closeButtonRef.value?.focus()
  } else {
    document.body.style.overflow = ''
    document.removeEventListener('keydown', handleKeydown)
  }
})

onMounted(() => {
  const params = new URLSearchParams(window.location.search)
  const initialFilters = {}
  params.forEach((value, key) => {
    const match = key.match(/^([^.]+)\.(min|max)$/)
    if (match) {
      initialFilters[match[1]] = initialFilters[match[1]] || {}
      initialFilters[match[1]][match[2]] = value
      return
    }
    if (/^\d{4}-\d{2}-\d{2}$/.test(value) && !initialFilters[key]) {
      initialFilters[key] = value
      return
    }
    if (initialFilters[key]) {
      if (!Array.isArray(initialFilters[key])) initialFilters[key] = [initialFilters[key]]
      initialFilters[key].push(value)
    } else {
      initialFilters[key] = value
    }
  })
  if (Object.keys(initialFilters).length > 0) {
    emit('update:modelValue', initialFilters)
  }
  if (initialFilters.search) {
    searchInput.value = initialFilters.search
    debouncedSearch.value = initialFilters.search
  }
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
  if (drawerOpen.value) document.body.style.overflow = ''
})
</script>

<template>
  <div class="filters-bar">
    <div class="bg-card border border-neutral-100 rounded-3xl shadow-level-2 overflow-visible">
      <div class="h-1 rounded-t-3xl bg-brand-gradient" aria-hidden="true" />

      <div class="flex flex-col gap-3 px-4 pt-4 sm:px-5 sm:pt-5 lg:flex-row lg:items-start lg:justify-between xl:items-center">
        <div class="flex min-w-0 flex-1 flex-col gap-3 xl:flex-row xl:items-center">
          <div v-if="searchable" class="relative min-w-0 flex-1 xl:max-w-md xl:min-w-[220px]">
            <label for="global-search" class="sr-only">{{ searchPlaceholder }}</label>
            <Search class="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted w-5 h-5 pointer-events-none" aria-hidden="true" />
            <input
              id="global-search"
              type="search"
              v-model="searchInput"
              :placeholder="searchPlaceholder"
              class="input h-10 pl-10 w-full rounded-xl"
              :aria-label="searchPlaceholder"
              @keydown.escape="searchInput = ''"
            />
            <button
              v-if="searchInput"
              @click="searchInput = ''"
              class="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-ink-muted hover:bg-neutral-100 hover:text-ink transition-colors"
              aria-label="Limpiar búsqueda"
            >
              <X class="w-4 h-4" />
            </button>
          </div>

          <div v-if="quickFilters.length" class="hidden w-full flex-wrap items-center gap-2 md:flex xl:w-auto">
            <div
              v-for="filter in quickFilters"
              :key="filter.key"
              class="w-[calc(50%-0.25rem)] shrink-0 lg:w-[calc(33.333%-0.375rem)] xl:w-40"
            >
              <Select
                :id="`quick-${filter.key}`"
                :model-value="props.modelValue[filter.key]"
                :options="filter.options"
                :placeholder="filter.placeholder || filter.label"
                variant="bar"
                full-width
                :searchable="(filter.options?.length ?? 0) > 4"
                class="w-full"
                :aria-label="filter.label"
                @change="handleFilterChange(filter.key, $event)"
              />
            </div>
          </div>
        </div>

        <div class="flex items-center justify-end gap-2 shrink-0">
          <button
            data-toggle-filters
            @click="openDrawer"
            class="btn-secondary h-10 flex w-full items-center justify-center gap-2 whitespace-nowrap shadow-soft sm:w-auto"
            :aria-expanded="drawerOpen"
            aria-controls="advanced-filters-panel"
            :aria-label="drawerOpen ? 'Ocultar filtros avanzados' : 'Ver más filtros'"
          >
            <SlidersHorizontal class="w-4 h-4" aria-hidden="true" />
            <span class="px-3 py-1">Más filtros</span>
            <span v-if="activeDrawerCount" class="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-primary-100 text-primary-700">
              {{ activeDrawerCount }}
            </span>
          </button>
        </div>
      </div>

      <div class="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 border-t border-neutral-100 px-4 py-3 sm:px-5">
        <template v-if="showFilterChips && getActiveFilterChips().length > 0">
          <div class="flex min-w-0 flex-wrap items-center gap-1.5">
            <template v-for="chip in getActiveFilterChips()" :key="`${chip.key}-${chip.value}`">
              <span class="filter-chip">
                <span class="text-xs font-medium">{{ chip.label }}</span>
                <button
                  @click="clearFilter(chip.key, chip.value)"
                  class="filter-chip-remove"
                  :aria-label="`Quitar ${getFilterLabel(chip.key)}: ${chip.label}`"
                >
                  <X class="w-3 h-3" />
                </button>
              </span>
            </template>
            <button
              @click="clearAllFilters"
              class="px-3 py-1 text-xs font-semibold text-primary-600 hover:text-primary-700 hover:bg-primary-50 rounded-full transition-colors whitespace-nowrap"
              :disabled="loading"
            >
              Limpiar todo
            </button>
          </div>
        </template>

        <div class="flex items-center gap-3 sm:ml-auto">
          <div class="flex items-center gap-2 text-sm text-ink-muted min-w-0" aria-live="polite" aria-atomic="true">
            <span v-if="resultsCount > 0">
              <span class="font-medium text-ink">Mostrando {{ (props.modelValue.page ? (props.modelValue.page - 1) * (props.modelValue.pageSize || 10) + 1 : 1) }}–{{ Math.min(props.modelValue.page ? props.modelValue.page * (props.modelValue.pageSize || 10) : resultsCount, resultsCount) }} de {{ resultsCount }} registros</span>
            </span>
            <span v-else class="text-ink-muted">Sin resultados</span>
          </div>
        </div>
      </div>
    </div>

    <Teleport to="body">
      <Transition name="drawer">
        <div v-if="drawerOpen" class="fixed inset-0 z-modal">
          <div
            class="absolute inset-0 bg-[var(--shadow-backdrop)] backdrop-blur-sm"
            @click="closeDrawer"
            aria-hidden="true"
          />

          <div
            class="drawer-panel absolute inset-x-0 bottom-0 flex max-h-[88vh] w-full flex-col overflow-hidden rounded-t-3xl bg-card shadow-level-4 sm:inset-y-0 sm:left-auto sm:right-0 sm:h-full sm:max-h-none sm:w-[28rem] sm:max-w-[92vw] sm:rounded-none sm:rounded-l-3xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="filters-drawer-title"
          >
            <div class="flex shrink-0 items-start justify-between gap-3 border-b border-neutral-100 px-5 py-4">
              <div>
                <h2 id="filters-drawer-title" class="text-lg font-semibold text-ink">Filtros</h2>
                <p class="mt-0.5 text-sm text-ink-muted">Combina criterios y confirma para aplicar los cambios.</p>
              </div>
              <button
                ref="closeButtonRef"
                type="button"
                @click="closeDrawer"
                class="p-2 rounded-xl text-ink-muted hover:bg-neutral-100 hover:text-ink transition-colors"
                aria-label="Cerrar filtros"
              >
                <X class="h-5 w-5" />
              </button>
            </div>

            <form id="advanced-filters-panel" class="flex-1 space-y-6 overflow-y-auto px-5 py-5" @submit.prevent="applyDraft">
              <section v-for="group in groupedFilters" :key="group.label">
                <div class="mb-3 flex items-center gap-2">
                  <component :is="GROUP_ICONS[group.label] || ListFilter" class="h-3.5 w-3.5 text-ink-muted" aria-hidden="true" />
                  <span class="text-[11px] font-bold uppercase tracking-wider text-ink-muted">{{ group.label }}</span>
                  <span class="h-px flex-1 bg-neutral-100" />
                </div>

                <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div
                    v-for="filter in group.items"
                    :key="filter.key"
                    :class="filter.type === 'dateRange' ? 'sm:col-span-2' : ''"
                  >
                    <label v-if="filter.type !== 'dateRange' && filter.type !== 'checkboxes'" :for="`adv-${filter.key}`" class="label">
                      {{ filter.label }}
                    </label>
                    <span v-else class="label">{{ filter.label }}</span>

                    <div v-if="filter.type === 'dateRange'" class="grid grid-cols-2 gap-2">
                      <label class="block">
                        <span class="mb-1 block text-[11px] font-medium text-ink-muted">Desde</span>
                        <input
                          :id="`adv-${filter.key}-min`"
                          type="date"
                          :value="draftModel[filter.key]?.min ?? ''"
                          @input="setDraftDate(filter.key, 'min', $event.target.value)"
                          class="input h-10 w-full px-3 text-sm"
                          :aria-label="`${filter.label} (desde)`"
                        />
                      </label>
                      <label class="block">
                        <span class="mb-1 block text-[11px] font-medium text-ink-muted">Hasta</span>
                        <input
                          :id="`adv-${filter.key}-max`"
                          type="date"
                          :value="draftModel[filter.key]?.max ?? ''"
                          @input="setDraftDate(filter.key, 'max', $event.target.value)"
                          class="input h-10 w-full px-3 text-sm"
                          :aria-label="`${filter.label} (hasta)`"
                        />
                      </label>
                    </div>

                    <div v-else-if="filter.type === 'checkboxes'" class="flex flex-wrap gap-2">
                      <button
                        v-for="option in filter.options"
                        :key="option.value"
                        type="button"
                        :aria-pressed="(draftModel[filter.key] || []).includes(option.value)"
                        @click="toggleDraftMulti(filter.key, option.value)"
                        :class="[
                          'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors',
                          (draftModel[filter.key] || []).includes(option.value)
                            ? 'border-primary-300 bg-primary-50 text-primary-700'
                            : 'border-neutral-200 bg-card text-ink-soft hover:bg-neutral-50',
                        ]"
                      >
                        <Check v-if="(draftModel[filter.key] || []).includes(option.value)" class="h-3.5 w-3.5" aria-hidden="true" />
                        {{ option.label }}
                      </button>
                    </div>

                    <Select
                      v-else-if="filter.type === 'select'"
                      :id="`adv-${filter.key}`"
                      :options="filter.options"
                      :placeholder="filter.placeholder || filter.label"
                      :model-value="draftModel[filter.key]"
                      :searchable="(filter.options?.length ?? 0) > 4"
                      class="w-full"
                      :aria-label="filter.label"
                      @change="handleDraftChange(filter.key, $event)"
                    />

                    <input
                      v-else-if="filter.type === 'date'"
                      :id="`adv-${filter.key}`"
                      type="date"
                      :value="draftModel[filter.key] ?? ''"
                      @input="handleDraftChange(filter.key, $event.target.value)"
                      class="input h-10 w-full px-3 text-sm"
                      :aria-label="filter.label"
                    />

                    <input
                      v-else
                      :id="`adv-${filter.key}`"
                      type="text"
                      :value="draftModel[filter.key] ?? ''"
                      @input="handleDraftChange(filter.key, $event.target.value)"
                      :placeholder="filter.placeholder || filter.label"
                      class="input h-10 w-full px-3 text-sm"
                      :aria-label="filter.label"
                    />
                  </div>
                </div>
              </section>
            </form>

            <div class="shrink-0 border-t border-neutral-100 bg-card px-5 py-4">
              <div class="flex items-center gap-3">
                <Button
                  v-if="activeDrawerCount > 0"
                  variant="ghost"
                  size="md"
                  :icon="RotateCcw"
                  :disabled="loading"
                  class="flex-1 sm:flex-none"
                  @click="clearDraft"
                >
                  Limpiar filtros
                </Button>
                <Button variant="primary" size="md" class="flex-1" @click="applyDraft">
                  Aplicar filtros
                </Button>
              </div>
              <p class="mt-2 text-center text-xs text-ink-muted sm:hidden">Los cambios se aplican al confirmar</p>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
.drawer-enter-active,
.drawer-leave-active {
  transition: opacity 0.25s ease;
}

.drawer-enter-from,
.drawer-leave-to {
  opacity: 0;
}

.drawer-enter-active .drawer-panel,
.drawer-leave-active .drawer-panel {
  transition: transform 0.32s cubic-bezier(0.16, 1, 0.3, 1);
}

.drawer-enter-from .drawer-panel,
.drawer-leave-to .drawer-panel {
  transform: translateY(100%);
}

@media (min-width: 640px) {
  .drawer-enter-from .drawer-panel,
  .drawer-leave-to .drawer-panel {
    transform: translateX(100%);
  }
}
</style>
