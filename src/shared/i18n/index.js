import { createI18n } from 'vue-i18n'
import es from './locales/es.json'
import en from './locales/en.json'

const STORAGE_KEY = 'nomikok_locale'
const SUPPORTED = ['es', 'en']

function initialLocale() {
  if (typeof localStorage === 'undefined') return 'es'
  const stored = localStorage.getItem(STORAGE_KEY)
  return SUPPORTED.includes(stored) ? stored : 'es'
}

export const i18n = createI18n({
  legacy: false,
  locale: initialLocale(),
  fallbackLocale: 'es',
  messages: { es, en },
})

export function setLocale(locale) {
  const next = SUPPORTED.includes(locale) ? locale : 'es'
  i18n.global.locale.value = next
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, next)
  }
  if (typeof document !== 'undefined') {
    document.documentElement.lang = next
  }
}

export function currentLocale() {
  return i18n.global.locale.value
}
