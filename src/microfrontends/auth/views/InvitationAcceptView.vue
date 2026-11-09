<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter, RouterLink } from 'vue-router'
import { MailCheck, ShieldCheck, Loader2, CheckCircle2, AlertCircle } from 'lucide-vue-next'
import Button from '@/shared/components/Button.vue'
import Input from '@/shared/components/Input.vue'
import Alert from '@/shared/components/Alert.vue'
import { validateInvitation, acceptInvitation } from '@/services/invitations.service'
import { ROLE_LABELS } from '@/shared/utils/constants'

const route = useRoute()
const router = useRouter()

const token = String(route.params.token || '')
const isLoading = ref(true)
const isSubmitting = ref(false)
const invitation = ref(null)
const loadError = ref('')
const formError = ref('')
const accepted = ref(false)

const form = ref({
  name: '',
  password: '',
  confirm: '',
  mfaCode: '',
})

async function load() {
  isLoading.value = true
  const res = await validateInvitation(token)
  if (res.ok) invitation.value = res.data
  else loadError.value = res.message
  isLoading.value = false
}

async function handleSubmit() {
  formError.value = ''
  if (form.value.name.trim().length < 2) {
    formError.value = 'Ingresa tu nombre completo'
    return
  }
  if (form.value.password.length < 6) {
    formError.value = 'La contraseña debe tener al menos 6 caracteres'
    return
  }
  if (form.value.password !== form.value.confirm) {
    formError.value = 'Las contraseñas no coinciden'
    return
  }
  if (invitation.value?.mfaRequired && !form.value.mfaCode.trim()) {
    formError.value = 'Ingresa el código MFA que enviamos a tu correo'
    return
  }

  isSubmitting.value = true
  const res = await acceptInvitation(token, {
    name: form.value.name,
    password: form.value.password,
    mfaCode: form.value.mfaCode,
  })
  if (res.ok) {
    accepted.value = true
  } else {
    formError.value = res.message
  }
  isSubmitting.value = false
}

function goToLogin() {
  router.push({ path: '/login', query: { registered: '1' } })
}

onMounted(load)
</script>

<template>
  <div class="min-h-screen bg-base flex items-center justify-center p-4 sm:p-8">
    <div class="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      <div class="absolute -top-24 -left-20 w-96 h-96 rounded-full bg-primary-200 blur-3xl opacity-60" />
      <div class="absolute bottom-0 right-0 w-[28rem] h-[28rem] rounded-full bg-teal-200 blur-3xl opacity-50" />
    </div>

    <div class="relative w-full max-w-lg">
      <div class="card p-8 sm:p-10">
        <div v-if="isLoading" class="flex flex-col items-center py-8 gap-3 text-ink-muted" aria-busy="true">
          <Loader2 class="w-8 h-8 animate-spin text-primary-500" aria-hidden="true" />
          <p>Validando invitación…</p>
        </div>

        <div v-else-if="loadError" class="text-center py-6 space-y-4">
          <AlertCircle class="w-14 h-14 text-danger-500 mx-auto" aria-hidden="true" />
          <h1 class="font-display text-2xl font-extrabold text-ink">Invitación no válida</h1>
          <p class="text-ink-muted">{{ loadError }}</p>
          <RouterLink to="/login" class="btn btn-primary inline-flex">Ir a iniciar sesión</RouterLink>
        </div>

        <div v-else-if="accepted" class="text-center py-6 space-y-4">
          <CheckCircle2 class="w-16 h-16 text-success-500 mx-auto" aria-hidden="true" />
          <h1 class="font-display text-2xl font-extrabold text-ink">¡Cuenta creada!</h1>
          <p class="text-ink-muted">Tu invitación fue aceptada. Ya puedes iniciar sesión con tu correo y la contraseña que elegiste.</p>
          <Button variant="primary" @click="goToLogin">Ir a iniciar sesión</Button>
        </div>

        <template v-else-if="invitation">
          <div class="flex items-center gap-3 mb-6">
            <div class="w-12 h-12 rounded-2xl bg-brand-gradient flex items-center justify-center flex-shrink-0">
              <MailCheck class="w-6 h-6 text-white" aria-hidden="true" />
            </div>
            <div class="min-w-0">
              <h1 class="font-display text-2xl font-extrabold text-ink tracking-tight">Acepta tu invitación</h1>
              <p class="text-sm text-ink-muted truncate">{{ invitation.email }}</p>
            </div>
          </div>

          <dl class="grid grid-cols-2 gap-3 text-sm rounded-xl border border-neutral-200 bg-neutral-50 p-4 mb-5">
            <div>
              <dt class="text-ink-muted">Rol asignado</dt>
              <dd class="font-semibold text-ink">{{ ROLE_LABELS[invitation.role] || invitation.role }}</dd>
            </div>
            <div>
              <dt class="text-ink-muted">Expira</dt>
              <dd class="font-semibold text-ink">{{ new Date(invitation.expiresAt).toLocaleDateString('es-MX', { dateStyle: 'medium' }) }}</dd>
            </div>
            <div class="col-span-2">
              <dt class="text-ink-muted">Empresas</dt>
              <dd class="font-semibold text-ink">{{ invitation.companyNames.length ? invitation.companyNames.join(', ') : 'Sin empresas asignadas' }}</dd>
            </div>
          </dl>

          <Alert v-if="formError" variant="danger" class="mb-4">{{ formError }}</Alert>

          <form class="space-y-4" @submit.prevent="handleSubmit">
            <Input id="invite-name" v-model="form.name" label="Nombre completo" required placeholder="Juan Pérez" />
            <Input id="invite-password" v-model="form.password" type="password" label="Contraseña" required placeholder="Mínimo 6 caracteres" autocomplete="new-password" />
            <Input id="invite-confirm" v-model="form.confirm" type="password" label="Confirmar contraseña" required placeholder="Repite la contraseña" autocomplete="new-password" />
            <div v-if="invitation.mfaRequired">
              <Input
                id="invite-mfa"
                v-model="form.mfaCode"
                label="Código MFA"
                placeholder="123456"
                inputmode="numeric"
                autocomplete="one-time-code"
              />
              <p class="mt-1.5 text-xs text-ink-muted flex items-start gap-1.5">
                <ShieldCheck class="w-4 h-4 flex-shrink-0 text-teal-600" aria-hidden="true" />
                Esta invitación requiere verificación en dos pasos. Ingresa el código de tu app autenticadora (en este demo, cualquier código sirve).
              </p>
            </div>
            <Button variant="primary" type="submit" full-width :loading="isSubmitting">Crear mi cuenta</Button>
          </form>
        </template>
      </div>
    </div>
  </div>
</template>
