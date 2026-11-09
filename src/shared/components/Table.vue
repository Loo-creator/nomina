<script setup>
import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import Button from './Button.vue'
import ChevronUpIcon from '@/shared/components/icons/ChevronUpIcon.vue'
import ChevronDownIcon from '@/shared/components/icons/ChevronDownIcon.vue'
import SearchIcon from '@/shared/components/icons/SearchIcon.vue'
import XMarkIcon from '@/shared/components/icons/XMarkIcon.vue'

const { t } = useI18n({ useScope: 'global' })
const props = defineProps({
  columns: { type: Array, required: true },
  data: { type: Array, required: true },
  keyField: { type: String, default: 'id' },
  searchable: { type: Boolean, default: true },
  sortable: { type: Boolean, default: true },
  filterable: { type: Boolean, default: false },
  filters: { type: Array, default: () => [] },
  pagination: { type: Boolean, default: true },
  pageSize: { type: Number, default: 10 },
  pageSizes: { type: Array, default: () => [10, 25, 50, 100] },
  loading: { type: Boolean, default: false },
  emptyMessage: { type: String, default: 'No hay datos disponibles' },
  emptyDescription: { type: String, default: '' },
  emptyIcon: { type: String, default: '' },
  striped: { type: Boolean, default: false },
  hoverable: { type: Boolean, default: true },
  selectable: { type: Boolean, default: false },
  actions: { type: Array, default: () => [] },
  rowClass: { type: Function, default: () => '' },
  showFilterChips: { type: Boolean, default: true },
})

const emit = defineEmits([
  'sort',
  'filter',
  'page-change',
  'page-size-change',
  'row-click',
  'row-select',
  'selection-change',
  'action',
  'filter-clear',
])

const searchQuery = ref('')
const currentPage = ref(1)
const pageSizeRef = ref(props.pageSize)
const sortColumn = ref(null)
const sortDirection = ref('asc')
const selectedRows = ref([])
const selectAll = ref(false)
const filterValues = ref({})

watch(() => props.pageSize, (val) => {
  pageSizeRef.value = val
})

watch(() => props.data, () => {
  currentPage.value = 1
  selectAll.value = false
  selectedRows.value = []
})

watch(() => filterValues, () => {
  currentPage.value = 1
}, { deep: true })

const filteredData = computed(() => {
  let result = props.data

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    const searchableColumns = props.columns.filter(c => c.searchable !== false)
    result = result.filter(row =>
      searchableColumns.some(col => {
        const value = getNestedValue(row, col.field)
        return String(value).toLowerCase().includes(query)
      })
    )
  }

  if (props.filterable) {
    Object.entries(filterValues.value).forEach(([key, value]) => {
      if (value !== '' && value !== null && value !== undefined) {
        const filter = props.filters.find(f => f.key === key)
        if (filter?.filterFn) {
          result = result.filter(row => filter.filterFn(row, value))
        } else if (filter?.type === 'text' || filter?.type === 'date') {
          result = result.filter(row => String(getNestedValue(row, key)).toLowerCase().includes(String(value).toLowerCase()))
        } else {
          result = result.filter(row => String(getNestedValue(row, key)) === String(value))
        }
      }
    })
  }

  if (sortColumn.value && props.sortable) {
    result = [...result].sort((a, b) => {
      const aVal = getNestedValue(a, sortColumn.value)
      const bVal = getNestedValue(b, sortColumn.value)
      const dir = sortDirection.value === 'asc' ? 1 : -1
      if (aVal < bVal) return -1 * dir
      if (aVal > bVal) return 1 * dir
      return 0
    })
  }

  return result
})

const paginatedData = computed(() => {
  if (!props.pagination) return filteredData.value
  const start = (currentPage.value - 1) * pageSizeRef.value
  return filteredData.value.slice(start, start + pageSizeRef.value)
})

const totalPages = computed(() => Math.ceil(filteredData.value.length / pageSizeRef.value) || 1)

const visiblePages = computed(() => {
  const pages = []
  const total = totalPages.value
  const current = currentPage.value
  let start = Math.max(1, current - 2)
  let end = Math.min(total, start + 4)
  if (end - start < 4) start = Math.max(1, end - 4)
  for (let i = start; i <= end; i++) pages.push(i)
  return pages
})

const hasActiveFilters = computed(() => {
  return searchQuery.value || Object.values(filterValues.value).some(v => v !== '' && v !== null && v !== undefined)
})

const activeFilterCount = computed(() => {
  let count = searchQuery.value ? 1 : 0
  Object.values(filterValues.value).forEach(v => {
    if (v !== '' && v !== null && v !== undefined) count++
  })
  return count
})

function getNestedValue(obj, path) {
  return path.split('.').reduce((o, k) => (o || {})[k], obj)
}

function handleSort(column) {
  if (!column.sortable || !props.sortable) return
  if (sortColumn.value === column.field) {
    sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortColumn.value = column.field
    sortDirection.value = 'asc'
  }
  emit('sort', { column: column.field, direction: sortDirection.value })
}

function handleSearch() {
  currentPage.value = 1
  emit('filter', { search: searchQuery.value, filters: filterValues.value })
}

function handleFilterChange(key, value) {
  filterValues.value = { ...filterValues.value, [key]: value }
  currentPage.value = 1
  handleSearch()
}

function clearSearch() {
  searchQuery.value = ''
  handleSearch()
}

function clearFilter(key) {
  filterValues.value = { ...filterValues.value, [key]: '' }
  currentPage.value = 1
  handleSearch()
}

function clearAllFilters() {
  searchQuery.value = ''
  Object.keys(filterValues.value).forEach(k => filterValues.value[k] = '')
  currentPage.value = 1
  handleSearch()
  emit('filter-clear')
}

function handlePageChange(page) {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page
    emit('page-change', page)
  }
}

function handlePageSizeChange(size) {
  pageSizeRef.value = size
  currentPage.value = 1
  emit('page-size-change', size)
}

function toggleSelectAll() {
  selectAll.value = !selectAll.value
  if (selectAll.value) {
    selectedRows.value = paginatedData.value.map(row => row[props.keyField])
  } else {
    selectedRows.value = []
  }
  emit('selection-change', selectedRows.value)
}

function toggleRowSelect(row) {
  const key = row[props.keyField]
  const index = selectedRows.value.indexOf(key)
  if (index > -1) {
    selectedRows.value.splice(index, 1)
  } else {
    selectedRows.value.push(key)
  }
  selectAll.value = selectedRows.value.length === paginatedData.value.length && paginatedData.value.length > 0
  emit('row-select', row)
  emit('selection-change', selectedRows.value)
}

function isRowSelected(row) {
  return selectedRows.value.includes(row[props.keyField])
}

function handleAction(action, row, event) {
  event.stopPropagation()
  emit('action', { action: action.key, row })
}

function handleRowClick(row) {
  emit('row-click', row)
}

function getFilterLabel(key) {
  const filter = props.filters.find(f => f.key === key)
  return filter?.label || key
}

function getFilterValueDisplay(key, value) {
  const filter = props.filters.find(f => f.key === key)
  if (!filter) return value
  const opt = filter.options?.find(o => o.value === value)
  return opt?.label || value
}
</script>

<template>
  <div class="table-container">
    <!-- Search & Filters Bar -->
    <div v-if="searchable || filterable" class="p-4 border-b border-neutral-100 bg-neutral-50/50 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
      <div v-if="searchable" class="relative w-full sm:w-72 flex-1">
        <SearchIcon class="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted w-5 h-5" aria-hidden="true" />
        <input
          type="search"
          v-model="searchQuery"
          @input="handleSearch"
          :placeholder="t('common.search')"
          class="input pl-10"
          :aria-label="t('table.ariaSearch')"
          @keydown.escape="clearSearch"
        />
        <button
          v-if="searchQuery"
          @click="clearSearch"
          class="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-neutral-200 transition-colors"
          :aria-label="t('common.clear')"
        >
          <XMarkIcon class="w-4 h-4 text-ink-muted" />
        </button>
      </div>

      <div v-if="filterable && filters.length" class="flex flex-wrap gap-3 w-full sm:w-auto">
        <select
          v-for="filter in filters.filter(f => !f.type || f.type === 'select')"
          :key="filter.key"
          v-model="filterValues[filter.key]"
          @change="handleFilterChange(filter.key, $event.target.value)"
          class="input py-2 text-sm min-w-[150px]"
          :aria-label="filter.label"
        >
          <option value="">{{ filter.placeholder || 'Todos' }}</option>
          <option v-for="opt in filter.options" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
        </select>

        <input
          v-for="filter in filters.filter(f => f.type === 'text' || f.type === 'date')"
          :key="filter.key"
          :type="filter.type === 'date' ? 'date' : 'search'"
          :value="filterValues[filter.key] ?? ''"
          @input="handleFilterChange(filter.key, $event.target.value)"
          :placeholder="filter.placeholder || filter.label"
          class="input py-2 text-sm min-w-[150px] w-auto"
          :aria-label="filter.label"
        />
      </div>
    </div>

    <!-- Active Filter Chips -->
    <div
      v-if="showFilterChips && hasActiveFilters"
      class="filter-chips"
      role="status"
      aria-live="polite"
    >
      <span v-if="searchQuery" class="filter-chip">
        <span>Búsqueda: "{{ searchQuery }}"</span>
        <button @click="clearSearch" class="filter-chip-remove" aria-label="Quitar búsqueda">
          <XMarkIcon class="w-3.5 h-3.5" />
        </button>
      </span>
      <span
        v-for="(value, key) in filterValues"
        :key="key"
        v-if="value !== '' && value !== null && value !== undefined"
        class="filter-chip"
      >
        <span>{{ getFilterLabel(key) }}: {{ getFilterValueDisplay(key, value) }}</span>
        <button @click="clearFilter(key)" class="filter-chip-remove" :aria-label="`Quitar filtro ${getFilterLabel(key)}`">
          <XMarkIcon class="w-3.5 h-3.5" />
        </button>
      </span>
      <button
        v-if="activeFilterCount > 1"
        @click="clearAllFilters"
        class="ml-auto px-3 py-1.5 text-xs font-medium text-primary-600 hover:text-primary-700"
      >
        {{ t('common.clearAll') }}
      </button>
    </div>

    <!-- Table -->
    <div class="overflow-x-auto">
      <table class="table" role="grid">
        <thead>
          <tr>
            <th v-if="selectable" class="w-12" scope="col">
              <input
                type="checkbox"
                :checked="selectAll"
                :indeterminate="selectedRows.length > 0 && selectedRows.length < paginatedData.length"
                @change="toggleSelectAll"
                class="w-4 h-4 rounded border-neutral-300 text-primary-600 focus:ring-2 focus:ring-[var(--color-focus-ring)]"
                aria-label="Seleccionar todas las filas"
              />
            </th>
            <th
              v-for="column in columns"
              :key="column.field"
              :scope="column.sortable ? 'col' : 'col'"
              :class="[
                column.align || 'left',
                column.width && `w-${column.width}`,
                column.sortable && props.sortable && 'cursor-pointer select-none',
              ]"
              @click="column.sortable && props.sortable && handleSort(column)"
              @keydown.enter="column.sortable && props.sortable && handleSort(column)"
              @keydown.space.prevent="column.sortable && props.sortable && handleSort(column)"
            >
              <div class="flex items-center gap-1">
                <span>{{ column.header }}</span>
                <span v-if="column.sortable && props.sortable && sortColumn === column.field" class="flex flex-col">
                  <ChevronUpIcon :class="sortDirection === 'asc' ? 'w-4 h-4 text-primary-600' : 'w-4 h-4 text-neutral-400'" />
                  <ChevronDownIcon :class="sortDirection === 'desc' ? 'w-4 h-4 text-primary-600' : 'w-4 h-4 text-neutral-400'" />
                </span>
              </div>
            </th>
            <th v-if="actions.length" class="w-48 text-center" scope="col">
              <span class="text-[11px] font-bold text-ink-muted uppercase tracking-wider">{{ t('common.actions') }}</span>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="loading" class="animate-pulse">
            <td :colspan="columns.length + (selectable ? 1 : 0) + (actions.length ? 1 : 0)" class="text-center py-8">
              <div class="flex justify-center gap-2">
                <span class="loader" />
                <span class="loader" style="animation-delay: 0.1s" />
                <span class="loader" style="animation-delay: 0.2s" />
              </div>
            </td>
          </tr>

          <tr v-else-if="!filteredData.length" :class="rowClass({})">
            <td :colspan="columns.length + (selectable ? 1 : 0) + (actions.length ? 1 : 0)" class="text-center py-12">
              <div class="empty-state">
                <component v-if="emptyIcon" :is="emptyIcon" class="empty-state-icon" />
                <p class="empty-state-title">{{ emptyMessage }}</p>
                <p v-if="emptyDescription" class="empty-state-description">{{ emptyDescription }}</p>
                <slot name="empty-action" />
              </div>
            </td>
          </tr>

          <template v-else>
            <tr
              v-for="row in paginatedData"
              :key="row[keyField]"
              :class="[
                rowClass(row),
                hoverable && 'hover:bg-neutral-50/50',
                selectable && 'cursor-pointer',
                striped && 'even:bg-neutral-50/50',
              ]"
              @click="selectable ? toggleRowSelect(row) : handleRowClick(row)"
              @keydown.enter="selectable ? toggleRowSelect(row) : handleRowClick(row)"
              @keydown.space.prevent="selectable ? toggleRowSelect(row) : null"
              tabindex="0"
            >
              <td v-if="selectable" class="px-4">
                <input
                  type="checkbox"
                  :checked="isRowSelected(row)"
                  @change.stop="toggleRowSelect(row)"
                  @click.stop
                  class="w-4 h-4 rounded border-neutral-300 text-primary-600 focus:ring-2 focus:ring-[var(--color-focus-ring)]"
                  :aria-label="`Seleccionar fila ${row[keyField]}`"
                />
              </td>
              <td v-for="column in columns" :key="column.field" :class="column.align || 'left'">
                <slot :name="column.field" :row="row" :value="getNestedValue(row, column.field)">
                  <span v-if="column.render">{{ column.render(row, getNestedValue(row, column.field)) }}</span>
                  <span v-else-if="column.type === 'badge'">{{ getNestedValue(row, column.field) }}</span>
                  <span v-else>{{ getNestedValue(row, column.field) }}</span>
                </slot>
              </td>
              <td v-if="actions.length" class="text-center">
                <div class="flex items-center justify-center gap-1">
                  <button
                    v-for="action in actions"
                    v-show="!(action.hidden?.(row) ?? false)"
                    :key="action.key"
                    @click="handleAction(action, row, $event)"
                    :class="[
                      'p-1.5 rounded-lg transition-colors',
                      action.variant === 'danger' ? 'text-danger-600 hover:bg-danger-50' : 'text-ink-muted hover:bg-neutral-100',
                      action.disabled && 'opacity-50 cursor-not-allowed',
                    ]"
                    :disabled="action.disabled?.(row) ?? false"
                    :aria-label="action.label"
                    :title="action.label"
                  >
                    <component :is="action.icon" class="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>
          </template>
        </tbody>
      </table>
    </div>

    <!-- Pagination -->
    <div v-if="pagination && !loading" class="px-4 py-3 border-t border-neutral-100 flex flex-col sm:flex-row items-center justify-between gap-3">
      <div class="flex items-center gap-2 text-sm text-ink-muted">
        <span v-if="filteredData.length > 0" class="font-medium text-ink">
          Mostrando {{ (currentPage - 1) * pageSizeRef + 1 }}–{{ Math.min(currentPage * pageSizeRef, filteredData.length) }} de {{ filteredData.length }} registros
        </span>
        <span v-else class="text-ink-muted">{{ t('common.noResults') }}</span>
      </div>

      <div class="flex items-center gap-2">
        <select
          v-model="pageSizeRef"
          @change="handlePageSizeChange(Number($event.target.value))"
          class="input py-1.5 text-sm w-auto"
          :aria-label="t('table.pageSize')"
        >
          <option v-for="size in pageSizes" :key="size" :value="size">{{ size }} {{ t('common.perPage') }}</option>
        </select>

        <nav class="flex items-center gap-1" :aria-label="t('table.pagination')">
          <Button
            variant="ghost"
            size="sm"
            icon="ChevronLeftIcon"
            :disabled="currentPage === 1"
            @click="handlePageChange(currentPage - 1)"
            aria-label="Página anterior"
          />
          <button
            v-for="page in visiblePages"
            :key="page"
            @click="handlePageChange(page)"
            :class="[
              'w-8 h-8 rounded-lg text-sm font-medium transition-colors',
              page === currentPage ? 'bg-primary-600 text-white' : 'text-ink-muted hover:bg-neutral-100',
            ]"
            :aria-current="page === currentPage ? 'page' : undefined"
            :aria-label="`Página ${page}`"
          >
            {{ page }}
          </button>
          <Button
            variant="ghost"
            size="sm"
            icon="ChevronRightIcon"
            :disabled="currentPage === totalPages"
            @click="handlePageChange(currentPage + 1)"
            aria-label="Página siguiente"
          />
        </nav>
      </div>
    </div>
  </div>
</template>