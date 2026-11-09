<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter, RouterLink } from 'vue-router'
import { KeyRound, Loader2, ShieldCheck, ArrowLeft, AlertCircle } from 'lucide-vue-next'
import Button from '@/shared/components/Button.vue'
import Input from '@/shared/components/Input.vue'
import Alert from '@/shared/components/Alert.vue'
import { validateResetToken, resetPassword } from '@/services/auth.service'
import { useI18n } from 'vue-i18n'

const { t } = useI18n({ useScope: 'global' })
const route = useRoute()
const router = useRouter()
const token = String(route.params.token || '')

const isLoading = ref(true)
const tokenInfo = ref(null)
const loadError = ref('')
const password = ref('')
const confirm = ref('')
const formError = ref('')
const isSubmitting = ref(false)
const done = ref(false)

async function load() {
  isLoading.value = true
  const res = await validateResetToken(token)
  if (res.ok) tokenInfo.value = res.data
  else loadError.value = res.message
  isLoading.value = false
}

async function handleSubmit() {
  formError.value = ''
  if (password.value.length < 6) {
    formError.value = t('auth.reset.passwordMin')
    return
  }
  if (password.value !== confirm.value) {
    formError.value = t('auth.reset.passwordMismatch')
    return
  }
  isSubmitting.value = true
  const res = await resetPassword(token, password.value)
  if (res.ok) {
    done.value = true
  } else {
    formError.value = res.message || t('auth.reset.updateError')
  }
  isSubmitting.value = false
}

onMounted(load)
</script>

<template>
  <div class="min-h-screen bg-base flex items-center justify-center p-4 sm:p-8">
    <div class="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      <div class="absolute -top-24 -left-20 w-96 h-96 rounded-full bg-primary-200 blur-3xl opacity-60" />
      <div class="absolute bottom-0 right-0 w-[28rem] h-[28rem] rounded-full bg-teal-200 blur-3xl opacity-50" />
    </div>

    <div class="relative w-full max-w-md">
      <div v-if="isLoading" class="card p-8 sm:p-10 flex flex-col items-center gap-3 text-ink-muted" aria-busy="true">
        <Loader2 class="w-8 h-8 animate-spin text-primary-500" aria-hidden="true" />
        <p>{{ t('auth.reset.validating') }}</p>
      </div>

      <div v-else-if="loadError" class="card p-8 sm:p-10 text-center space-y-4">
        <AlertCircle class="w-14 h-14 text-danger-500 mx-auto" aria-hidden="true" />
        <h1 class="font-display text-2xl font-extrabold text-ink">{{ t('auth.reset.invalidLink') }}</h1>
        <p class="text-ink-muted">{{ loadError }}</p>
        <RouterLink to="/recuperar" class="btn btn-primary inline-flex">{{ t('auth.reset.newLink') }}</RouterLink>
      </div>

      <div v-else-if="done" class="card p-8 sm:p-10 text-center space-y-4">
        <ShieldCheck class="w-14 h-14 text-success-500 mx-auto" aria-hidden="true" />
        <h1 class="font-display text-2xl font-extrabold text-ink">{{ t('auth.reset.doneTitle') }}</h1>
        <p class="text-ink-muted">{{ t('auth.reset.doneBody') }}</p>
        <RouterLink to="/login" class="btn btn-primary inline-flex">{{ t('auth.signIn') }}</RouterLink>
      </div>

      <form v-else-if="tokenInfo" class="card p-8 sm:p-10" @submit.prevent="handleSubmit">
        <div class="flex items-center gap-3 mb-6">
          <div class="w-12 h-12 rounded-2xl bg-brand-gradient flex items-center justify-center flex-shrink-0">
            <KeyRound class="w-6 h-6 text-white" aria-hidden="true" />
          </div>
          <div class="min-w-0">
            <h1 class="font-display text-2xl font-extrabold text-ink tracking-tight">{{ t('auth.reset.newPasswordTitle') }}</h1>
            <p class="text-sm text-ink-muted truncate">{{ t('auth.reset.forAccount', { email: tokenInfo.email }) }}</p>
          </div>
        </div>

        <Alert v-if="formError" variant="danger" class="mb-4">{{ formError }}</Alert>

        <div class="space-y-4">
          <Input id="reset-password" v-model="password" type="password" :label="t('auth.reset.newPasswordTitle')" required placeholder="Mínimo 6 caracteres" autocomplete="new-password" />
          <Input id="reset-confirm" v-model="confirm" type="password" :label="t('common.confirm')" required placeholder="Repite la contraseña" autocomplete="new-password" />
        </div>

        <Button variant="primary" type="submit" full-width class="mt-6" :loading="isSubmitting">
          {{ t('auth.reset.save') }}
        </Button>
        <p class="mt-4 text-center">
          <RouterLink to="/login" class="text-sm text-ink-muted hover:text-ink inline-flex items-center gap-1">
            <ArrowLeft class="w-4 h-4" aria-hidden="true" /> {{ t('auth.backToLogin') }}
          </RouterLink>
        </p>
      </form>
    </div>
  </div>
</template>

