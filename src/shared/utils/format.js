export function formatCurrency(value, currency = 'MXN', locale = 'es-MX') {
  if (value === null || value === undefined || value === '') return '—'
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(value)
}

export function formatDate(value, locale = 'es-MX', options = { dateStyle: 'medium' }) {
  if (!value) return '—'
  return new Date(value).toLocaleDateString(locale, options)
}

export function formatDateTime(value, locale = 'es-MX') {
  if (!value) return '—'
  return new Date(value).toLocaleString(locale, { dateStyle: 'medium', timeStyle: 'short' })
}

export function formatNumber(value, locale = 'es-MX', options = {}) {
  if (value === null || value === undefined || value === '') return '—'
  return new Intl.NumberFormat(locale, options).format(value)
}

export function truncate(str, length = 50, suffix = '…') {
  if (!str || str.length <= length) return str
  return str.slice(0, length - suffix.length) + suffix
}

export function capitalize(str) {
  if (!str) return ''
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
}

export function slugify(str) {
  if (!str) return ''
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}