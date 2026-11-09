import { createApp } from 'vue'
import { createPinia } from 'pinia'
import './style.css'
import App from './App.vue'
import router from './shared/router'
import { useAuthStore } from './shared/stores/auth'
import { useToastStore } from './shared/stores/toast'
import { useThemeStore } from './shared/stores/theme'
import { registerIcons } from './shared/components/icons'
import { i18n, setLocale } from './shared/i18n'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(i18n)
app.use(router)
registerIcons(app)

const authStore = useAuthStore(pinia)
const toastStore = useToastStore(pinia)
const themeStore = useThemeStore(pinia)

authStore.initAuth()
themeStore.initTheme()
setLocale(localStorage.getItem('nomikok_locale') || 'es')

if (import.meta.env.DEV) {
  import('web-vitals')
    .then(({ onCLS, onFCP, onINP, onLCP, onTTFB }) => {
      const log = (metric) => {
        console.info(`[web-vitals] ${metric.name}: ${metric.value.toFixed(2)}${metric.rating ? ` (${metric.rating})` : ''}`)
      }
      onCLS(log)
      onFCP(log)
      onINP(log)
      onLCP(log)
      onTTFB(log)
    })
    .catch(() => {})
}

app.mount('#app')