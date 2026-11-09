<script setup>
import { ref } from 'vue'
import { RouterLink } from 'vue-router'
import { MailQuestion, Loader2, CheckCircle2, ArrowLeft } from 'lucide-vue-next'
import Button from '@/shared/components/Button.vue'
import Input from '@/shared/components/Input.vue'
import Alert from '@/shared/components/Alert.vue'
import { requestPasswordReset } from '@/services/auth.service'
import { useI18n } from 'vue-i18n'

const { t } = useI18n({ useScope: 'global' })
const email = ref('')
const error = ref('')
const isSubmitting = ref(false)
const success = ref(false)
const demoResetUrl = ref(null)
const demoMessage = ref('')

async function handleSubmit() {
  error.value = ''
  if (!email.value.trim()) {
    error.value = t('auth.reset.emailRequired')
    return
  }
  isSubmitting.value = true
  const res = await requestPasswordReset(email.value)
  if (res.ok) {
    success.value = true
    demoResetUrl.value = res.data?.demoResetUrl || null
    demoMessage.value = res.message
  } else {
    error.value = res.message || t('auth.reset.genericError')
  }
  isSubmitting.value = false
}
</script>

<template>
  <div class="min-h-screen bg-base flex items-center justify-center p-4 sm:p-8">
    <div class="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      <div class="absolute -top-24 -left-20 w-96 h-96 rounded-full bg-primary-200 blur-3xl opacity-60" />
      <div class="absolute bottom-0 right-0 w-[28rem] h-[28rem] rounded-full bg-teal-200 blur-3xl opacity-50" />
    </div>

    <div class="relative w-full max-w-md">
      <div v-if="!success" class="card p-8 sm:p-10">
        <RouterLink to="/login" class="inline-flex items-center gap-2 text-sm text-ink-muted hover:text-ink transition-colors mb-6">
          <ArrowLeft class="w-4 h-4" aria-hidden="true" />
          {{ t('auth.backToLogin') }}
        </RouterLink>

        <div class="flex items-center gap-3 mb-6">
          <div class="w-12 h-12 rounded-2xl bg-brand-gradient flex items-center justify-center flex-shrink-0">
            <MailQuestion class="w-6 h-6 text-white" aria-hidden="true" />
          </div>
          <div>
            <h1 class="font-display text-2xl font-extrabold text-ink tracking-tight">{{ t('auth.reset.title') }}</h1>
            <p class="text-sm text-ink-muted">{{ t('auth.reset.subtitle') }}</p>
          </div>
        </div>

        <Alert v-if="error" variant="danger" class="mb-4">{{ error }}</Alert>

        <form class="space-y-4" @submit.prevent="handleSubmit">
          <Input
            id="recover-email"
            v-model="email"
            type="email"
            :label="t('auth.reset.emailLabel')"
            required
            :placeholder="t('auth.reset.emailPlaceholder')"
            autocomplete="email"
          />
          <Button variant="primary" type="submit" full-width :loading="isSubmitting">
            {{ t('auth.reset.send') }}
          </Button>
        </form>
      </div>

      <div v-else class="card p-8 sm:p-10 text-center space-y-4">
        <CheckCircle2 class="w-14 h-14 text-success-500 mx-auto" aria-hidden="true" />
        <h1 class="font-display text-2xl font-extrabold text-ink">{{ t('auth.reset.checkTitle') }}</h1>
        <p class="text-ink-muted">{{ demoMessage }}</p>
        <div v-if="demoResetUrl" class="rounded-xl border border-warning-200 bg-warning-50 px-4 py-3 text-left">
          <p class="text-[11px] uppercase tracking-wide font-bold text-warning-700">{{ t('auth.reset.demoTitle') }}</p>
          <p class="mt-1 text-sm text-warning-800">
            {{ t('auth.reset.demoBody') }}
          </p>
          <RouterLink :to="demoResetUrl" class="mt-2 inline-block text-sm font-semibold text-primary-600 hover:text-primary-700 underline">
            {{ demoResetUrl }}
          </RouterLink>
        </div>
        <RouterLink to="/login" class="btn btn-primary inline-flex">
          {{ t('auth.backToLogin') }}
        </RouterLink>
      </div>
    </div>
  </div>
</template>
