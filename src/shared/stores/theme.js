import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'

const LEGACY_KEY = 'nomikok_theme'
const ORG_KEY = 'nomikok_org_theme'
const USER_KEY = 'nomikok_user_theme'

export const THEMES = [
  {
    id: 'nomikok',
    name: 'NOMIKOK',
    description: 'Coral y menta',
    dark: false,
    swatches: ['#E76F51', '#2E948D', '#E5D0B9'],
  },
  {
    id: 'oceano',
    name: 'Océano',
    description: 'Azul y cian',
    dark: false,
    swatches: ['#3B82F6', '#06B6D4', '#DBEAFE'],
  },
  {
    id: 'uva',
    name: 'Uva',
    description: 'Violeta profundo',
    dark: false,
    swatches: ['#8B5CF6', '#6D28D9', '#EDE9FE'],
  },
  {
    id: 'oscuro',
    name: 'Oscuro',
    description: 'Modo nocturno',
    dark: true,
    swatches: ['#171A21', '#E76F51', '#2E948D'],
  },
]

const THEME_IDS = THEMES.map(t => t.id)

function normalizeTheme(value) {
  if (value === 'dark') return 'oscuro'
  if (value === 'light') return 'nomikok'
  if (value === 'bosque') return 'uva'
  return THEME_IDS.includes(value) ? value : null
}

export const useThemeStore = defineStore('theme', () => {
  const userTheme = ref(null)
  const orgTheme = ref('nomikok')

  const theme = computed(() => userTheme.value ?? orgTheme.value)
  const isDark = computed(() => theme.value === 'oscuro')
  const currentTheme = computed(() => THEMES.find(t => t.id === theme.value) || THEMES[0])
  const isInheriting = computed(() => userTheme.value === null)

  function initTheme() {
    const storedOrg = localStorage.getItem(ORG_KEY) ?? localStorage.getItem(LEGACY_KEY)
    orgTheme.value = normalizeTheme(storedOrg) ?? 'nomikok'
    const storedUser = localStorage.getItem(USER_KEY)
    userTheme.value = storedUser ? normalizeTheme(storedUser) : null
    applyTheme()
  }

  function setOrgTheme(value) {
    orgTheme.value = normalizeTheme(value) ?? 'nomikok'
    localStorage.setItem(ORG_KEY, orgTheme.value)
    applyTheme()
  }

  function setUserTheme(value) {
    if (value === null || value === undefined || value === '') {
      userTheme.value = null
      localStorage.removeItem(USER_KEY)
      applyTheme()
      return
    }
    userTheme.value = normalizeTheme(value) ?? 'nomikok'
    localStorage.setItem(USER_KEY, userTheme.value)
    applyTheme()
  }

  function resetToOrgTheme() {
    setUserTheme(null)
  }

  function applyTheme() {
    if (typeof document === 'undefined') return
    const root = document.documentElement
    root.setAttribute('data-theme', theme.value)
    root.classList.toggle('dark', isDark.value)
    root.style.colorScheme = isDark.value ? 'dark' : 'light'
  }

  watch(theme, applyTheme)

  return {
    themes: THEMES,
    theme,
    userTheme,
    orgTheme,
    isInheriting,
    isDark,
    currentTheme,
    initTheme,
    setOrgTheme,
    setUserTheme,
    resetToOrgTheme,
  }
})
