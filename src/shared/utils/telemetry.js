import { trackEvent } from '@/services/telemetry.service'

const POSTHOG_KEY = import.meta.env.VITE_POSTHOG_KEY || ''
const POSTHOG_HOST = import.meta.env.VITE_POSTHOG_HOST || 'https://us.i.posthog.com'

let posthogClient = null
let posthogReady = null

function getPostHog() {
  if (!POSTHOG_KEY || typeof window === 'undefined') return null
  if (!posthogReady) {
    const specifier = 'posthog-js'
    posthogReady = import(/* @vite-ignore */ specifier)
      .then(({ default: posthog }) => {
        posthog.init(POSTHOG_KEY, { api_host: POSTHOG_HOST, autocapture: false })
        posthogClient = posthog
      })
      .catch(() => {
        console.info('[telemetry] posthog-js no instalado; se usa el mock local.')
      })
  }
  return posthogClient
}

export function track(event, props = {}) {
  getPostHog()
  if (posthogClient) {
    try {
      posthogClient.capture(event, props)
      return
    } catch {
      // Si PostHog falla, cae silenciosamente a ningún lado para no romper UX
      return
    }
  }
  try {
    trackEvent(event, props).catch(() => {})
  } catch {
    // La instrumentación nunca debe romper la experiencia
  }
}
