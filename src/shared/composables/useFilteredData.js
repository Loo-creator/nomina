import { computed } from 'vue'

function getNested(obj, path) {
  return path.split('.').reduce((o, k) => (o ?? {})[k], obj)
}

function isEmpty(v) {
  return v === undefined || v === null || v === '' || v === false ||
    (Array.isArray(v) && v.length === 0) ||
    (typeof v === 'object' && !Array.isArray(v) && v.min === undefined && v.max === undefined) ||
    (typeof v === 'object' && !Array.isArray(v) && (v.min === '' || v.min === undefined) && (v.max === '' || v.max === undefined))
}

/**
 * Filtra un arreglo de datos usando un modelo de filtros y definiciones.
 * - search: busca en `searchFields` (o en todos los campos string si no se definen)
 * - select/text/date: comparación exacta (o includes para text)
 * - range: min/max numérico
 */
export function useFilteredData(data, filterModel, filters, options = {}) {
  return computed(() => {
    let result = (data && 'value' in data ? data.value : data) ?? []
    const model = (filterModel && 'value' in filterModel ? filterModel.value : filterModel) ?? {}
    const defs = (typeof filters === 'function' ? filters() : filters) ?? []

    for (const [key, value] of Object.entries(model)) {
      if (isEmpty(value)) continue

      if (key === 'search') {
        const q = String(value).toLowerCase().trim()
        if (!q) continue
        const fields = options.searchFields?.length
          ? options.searchFields
          : null
        result = result.filter(row => {
          const candidates = fields
            ? fields.map(f => getNested(row, f))
            : Object.values(row)
          return candidates.some(v =>
            v !== null && v !== undefined && String(v).toLowerCase().includes(q)
          )
        })
        continue
      }

      const def = defs.find(f => f.key === key)
      if (!def) continue

      if (def.type === 'dateRange') {
        const min = value?.min || null
        const max = value?.max || null
        result = result.filter(row => {
          if (def.filterFn) return def.filterFn(row, value)
          const cell = String(getNested(row, def.field || key) || '')
          if (min && cell && cell < min) return false
          if (max && cell && cell > max) return false
          return true
        })
        continue
      }

      if (def.type === 'range') {
        const min = value.min !== '' && value.min !== undefined ? Number(value.min) : null
        const max = value.max !== '' && value.max !== undefined ? Number(value.max) : null
        result = result.filter(row => {
          const val = Number(getNested(row, def.field || key))
          if (Number.isNaN(val)) return true
          if (min !== null && val < min) return false
          if (max !== null && val > max) return false
          return true
        })
        continue
      }

      result = result.filter(row => {
        const cell = getNested(row, def.field || key)
        if (def.filterFn) return def.filterFn(row, value)
        if (def.type === 'text') {
          return String(cell ?? '').toLowerCase().includes(String(value).toLowerCase())
        }
        if (Array.isArray(value)) {
          return value.map(String).includes(String(cell))
        }
        return String(cell) === String(value)
      })
    }

    return result
  })
}

export function computeTotalizers(rows, keys = {}) {
  const out = {}
  for (const [label, field] of Object.entries(keys)) {
    out[label] = rows.reduce((sum, r) => sum + (Number(getNested(r, field)) || 0), 0)
  }
  return out
}