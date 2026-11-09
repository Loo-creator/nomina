<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute, RouterLink } from 'vue-router'
import { Mail, Lock, Eye, EyeOff, LogIn, Crown, Shield, Briefcase, Building2, User, ShieldCheck, FileText, Users, Shuffle } from 'lucide-vue-next'
import { useAuthStore } from '@/shared/stores/auth'
import { useToastStore } from '@/shared/stores/toast'
import { getDemoCredentials, getRoles } from '@/services/auth.service'
import Alert from '@/shared/components/Alert.vue'
import { useI18n } from 'vue-i18n'

// Lee automáticamente la primera imagen que coloques en src/assets/imagenes
const imageModules = import.meta.glob('../../../assets/imagenes/*.{png,jpg,jpeg,webp,svg,avif,gif}', {
  eager: true,
  import: 'default',
})

const imageError = ref(false)

const professionalImage = computed(() => {
  const keys = Object.keys(imageModules).sort()
  return keys.length ? imageModules[keys[0]] : ''
})

const showImage = computed(() => !!professionalImage.value && !imageError.value)

const highlights = [
  { icon: ShieldCheck, title: 'Timbrado seguro', text: 'Cumplimiento fiscal con el SAT.' },
  { icon: FileText, title: 'Comprobantes listos', text: 'XML y PDF al instante.' },
  { icon: Users, title: 'Multi-empresa', text: 'Compañías, empleados y roles.' },
]

const { t } = useI18n({ useScope: 'global' })
const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const toastStore = useToastStore()

const email = ref('')
const password = ref('')
const selectedRole = ref('')
const rememberMe = ref(false)
const showPassword = ref(false)
const isLoading = ref(false)
const error = ref('')
const touchedEmail = ref(false)
const touchedPassword = ref(false)

const emailError = computed(() => {
  if (!touchedEmail.value && !email.value) return ''
  return /^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/.test(email.value) ? '' : t('login.emailInvalid')
})
const passwordError = computed(() => {
  if (!touchedPassword.value && !password.value) return ''
  return password.value.trim() ? '' : t('login.passwordRequired')
})

const demoCredentials = ref({})
const roles = ref([])

const redirect = computed(() => route.query.redirect || '/dashboard')
const roleOptions = computed(() => roles.value)

const roleIcons = {
  superadmin: Crown,
  admin: Shield,
  supervisor: ShieldCheck,
  staff: Briefcase,
  cliente: Building2,
  empleado: User,
}

async function loadDemoData() {
  try {
    const [credsRes, rolesRes] = await Promise.all([
      getDemoCredentials(),
      getRoles(),
    ])
    if (credsRes.ok) demoCredentials.value = credsRes.data
    if (rolesRes.ok) roles.value = rolesRes.data
  } catch {
    // Silently fail
  }
}

function fillDemoCredentials(role) {
  const creds = demoCredentials.value[role]
  if (creds) {
    email.value = creds.email
    password.value = creds.password
    selectedRole.value = role
  }
}

async function handleLogin() {
  error.value = ''
  isLoading.value = true

  const credentials = { email: email.value, password: password.value }
  if (selectedRole.value) {
    credentials.role = selectedRole.value
  }

  const response = await authStore.login(credentials)

  if (response.ok) {
    toastStore.success(`Bienvenido, ${authStore.user.name}`)
    router.push(redirect.value)
  } else {
    error.value = response.error || 'Error al iniciar sesión'
  }

  isLoading.value = false
}

function handleDemoLogin(role) {
  fillDemoCredentials(role)
  handleLogin()
}

onMounted(() => {
  loadDemoData()
  if (route.query.registered === '1') {
    toastStore.success('Cuenta creada correctamente. Inicia sesión.')
  }
  if (authStore.isAuthenticated) {
    router.push(redirect.value)
  }
})
</script>

<template>
  <div class="relative min-h-screen bg-base flex items-center justify-center p-4 sm:p-8">
    <!-- Ambient background -->
    <div class="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      <div class="absolute -top-24 -left-20 w-96 h-96 rounded-full bg-primary-200 blur-3xl opacity-60" />
      <div class="absolute bottom-0 right-0 w-[28rem] h-[28rem] rounded-full bg-teal-200 blur-3xl opacity-50" />
    </div>

    <!-- Login card -->
    <div class="relative z-10 w-full max-w-5xl rounded-[2rem] glass border border-neutral-100 shadow-elevated overflow-hidden">
      <div class="absolute inset-x-0 top-0 h-1.5 bg-brand-gradient" aria-hidden="true" />
      <div class="grid md:grid-cols-2">
        <!-- Form -->
        <div class="p-8 sm:p-12">
          <div class="flex items-center gap-3 mb-10">
            <div class="w-12 h-12 rounded-2xl bg-brand-gradient flex items-center justify-center shadow-glow">
              <span class="font-display font-extrabold text-white text-xl leading-none">N</span>
            </div>
            <span class="font-display font-extrabold text-xl tracking-tight text-ink">NOMIKOK</span>
          </div>

          <h1 class="font-display text-3xl font-extrabold text-ink tracking-tight">{{ t('login.title') }}</h1>
          <p class="mt-2 text-base text-ink-muted">{{ t('login.subtitle') }}</p>

          <Alert v-if="error" variant="danger" dismissible class="mt-6" @dismiss="error = ''">{{ error }}</Alert>

          <form class="mt-8 space-y-5" @submit.prevent="handleLogin">
            <div>
              <label for="email" class="block text-xs font-semibold uppercase tracking-wider text-ink-muted mb-1.5">{{ t('login.email') }}</label>
              <div
                :class="[
                  'relative w-full flex items-center rounded-xl border bg-card shadow-soft transition-all duration-200 ease-out focus-within:border-primary-400 focus-within:ring-4 focus-within:ring-primary-100',
                  emailError ? 'border-danger-400' : 'border-neutral-200',
                ]"
              >
                <Mail :class="['absolute left-3.5 w-5 h-5 flex-shrink-0 pointer-events-none', emailError ? 'text-danger-500' : 'text-ink-muted']" aria-hidden="true" />
                <input
                  id="email"
                  v-model="email"
                  type="email"
                  autocomplete="email"
                  required
                  :disabled="isLoading"
                  :aria-invalid="!!emailError"
                  :aria-describedby="emailError ? 'email-error' : undefined"
                  @blur="touchedEmail = true"
                  placeholder="username@gmail.com"
                  class="w-full rounded-xl border-0 bg-transparent px-4 py-3 pl-11 text-ink placeholder-ink-muted/60 focus:outline-none disabled:bg-neutral-50 disabled:cursor-not-allowed"
                />
              </div>
              <p v-if="emailError" id="email-error" role="alert" class="mt-1.5 text-xs font-medium text-danger-600">{{ emailError }}</p>
            </div>

            <div>
              <label for="password" class="block text-xs font-semibold uppercase tracking-wider text-ink-muted mb-1.5">{{ t('login.password') }}</label>
              <div
                :class="[
                  'relative w-full flex items-center rounded-xl border bg-card shadow-soft transition-all duration-200 ease-out focus-within:border-primary-400 focus-within:ring-4 focus-within:ring-primary-100',
                  passwordError ? 'border-danger-400' : 'border-neutral-200',
                ]"
              >
                <Lock :class="['absolute left-3.5 w-5 h-5 flex-shrink-0 pointer-events-none', passwordError ? 'text-danger-500' : 'text-ink-muted']" aria-hidden="true" />
                <input
                  id="password"
                  v-model="password"
                  :type="showPassword ? 'text' : 'password'"
                  autocomplete="current-password"
                  required
                  :disabled="isLoading"
                  :aria-invalid="!!passwordError"
                  :aria-describedby="passwordError ? 'password-error' : undefined"
                  @blur="touchedPassword = true"
                  placeholder="Password"
                  class="w-full rounded-xl border-0 bg-transparent px-4 py-3 pl-11 pr-11 text-ink placeholder-ink-muted/60 focus:outline-none disabled:bg-neutral-50 disabled:cursor-not-allowed"
                />
                <button
                  type="button"
                  @click="showPassword = !showPassword"
                  class="absolute right-3.5 text-ink-muted hover:text-ink-soft transition-colors cursor-pointer p-1"
                  :aria-label="showPassword ? t('login.hidePassword') : t('login.showPassword')"
                  :aria-pressed="showPassword"
                >
                  <EyeOff v-if="showPassword" class="w-6 h-6" aria-hidden="true" />
                  <Eye v-else class="w-6 h-6" aria-hidden="true" />
                </button>
              </div>
              <p v-if="passwordError" id="password-error" role="alert" class="mt-1.5 text-xs font-medium text-danger-600">{{ passwordError }}</p>
            </div>

            <div class="flex items-center justify-between">
              <label class="flex items-center gap-2 cursor-pointer select-none">
                <input v-model="rememberMe" type="checkbox" class="w-4 h-4 rounded border-neutral-300 text-primary-600 focus:ring-primary-400" />
                <span class="text-sm text-ink-muted">{{ t('login.rememberMe') }}</span>
              </label>
              <RouterLink to="/recuperar" class="text-sm font-semibold text-primary-600 hover:text-primary-700">{{ t('login.forgotPassword') }}</RouterLink>
            </div>

            <button
              type="submit"
              :disabled="isLoading"
              class="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-brand-gradient py-4 text-white font-semibold text-base shadow-glow transition-all hover:-translate-y-0.5 hover:brightness-105 active:translate-y-0 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <svg v-if="isLoading" class="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <LogIn v-else class="w-5 h-5" aria-hidden="true" />
              {{ t('login.submit') }}
            </button>
          </form>

          <div class="mt-8 pt-6 border-t border-neutral-100">
            <div class="grid grid-cols-2 sm:grid-cols-3 gap-2.5" role="group" :aria-label="t('login.switcherTitle')">
              <button
                v-for="role in roleOptions"
                :key="role.value"
                type="button"
                :disabled="isLoading"
                @click="handleDemoLogin(role.value)"
                class="group flex items-center gap-3 rounded-2xl border border-neutral-200 bg-card px-3.5 py-3 text-left transition-all duration-200 ease-out hover:border-primary-300 hover:bg-primary-50/60 hover:shadow-card hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)] disabled:opacity-50"
              >
                <span class="w-9 h-9 rounded-xl bg-primary-100 text-primary-600 flex items-center justify-center flex-shrink-0 transition-transform duration-200 group-hover:scale-105">
                  <component :is="roleIcons[role.value] || User" class="w-5 h-5" aria-hidden="true" />
                </span>
                <span class="min-w-0">
                  <span class="block text-sm font-semibold text-ink truncate">{{ role.label }}</span>
                  <span class="block text-[11px] text-ink-muted leading-tight truncate">{{ t('login.audience.' + role.value) }}</span>
                  <span class="block text-[11px] font-mono text-ink-muted/80 truncate">{{ demoCredentials[role.value]?.email }}</span>
                </span>
              </button>
            </div>
          </div>
        </div>

        <!-- Visual -->
        <div class="relative hidden md:block p-8">
          <div v-if="showImage" class="relative h-full min-h-[38rem] rounded-2xl overflow-hidden shadow-elevated">
            <img :src="professionalImage" alt="NOMIKOK" class="w-full h-full object-cover" @error="imageError = true" />
            <div class="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            <p class="absolute bottom-6 left-6 right-6 text-white text-base font-medium">Gestiona y emite tu nómina de forma clara y segura.</p>
          </div>

          <div v-else class="relative h-full min-h-[38rem] rounded-2xl overflow-hidden bg-brand-gradient shadow-elevated">
            <div class="absolute -top-16 -right-12 w-56 h-56 rounded-full bg-white/10 blur-2xl" aria-hidden="true" />
            <div class="absolute -bottom-20 -left-12 w-64 h-64 rounded-full bg-black/10 blur-3xl" aria-hidden="true" />

            <div class="relative h-full flex flex-col justify-between p-10 text-white">
              <div>
                <p class="text-xs font-semibold uppercase tracking-[0.2em] text-white/70">Nómina digital</p>
                <h2 class="font-display text-3xl font-extrabold leading-tight tracking-tight mt-3">
                  La plataforma de nómina para equipos exigentes.
                </h2>
              </div>

              <ul class="space-y-5">
                <li v-for="item in highlights" :key="item.title" class="flex items-start gap-3">
                  <span class="w-10 h-10 rounded-xl bg-white/15 backdrop-blur flex items-center justify-center flex-shrink-0 ring-1 ring-white/25">
                    <component :is="item.icon" class="w-5 h-5" aria-hidden="true" />
                  </span>
                  <div>
                    <p class="font-semibold text-base">{{ item.title }}</p>
                    <p class="text-sm text-white/75">{{ item.text }}</p>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
