<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { RefreshCw, CloudOff } from 'lucide-vue-next'
import Button from '@/shared/components/Button.vue'

const { t } = useI18n({ useScope: 'global' })

const props = defineProps({
  title: { type: String, default: '' },
  message: { type: String, default: '' },
  detail: { type: String, default: '' },
  retryLabel: { type: String, default: '' },
})

const emit = defineEmits(['retry'])

const displayTitle = computed(() => props.title || t('errorState.defaultTitle'))
const displayMessage = computed(() => props.message || t('errorState.defaultMessage'))
const displayRetry = computed(() => props.retryLabel || t('errorState.retry'))
</script>

<template>
  <div class="card p-8 sm:p-10 text-center" role="alert" aria-live="assertive">
    <div class="w-14 h-14 rounded-2xl bg-danger-100 flex items-center justify-center mx-auto" aria-hidden="true">
      <CloudOff class="w-7 h-7 text-danger-600" />
    </div>
    <h2 class="mt-4 text-lg font-display font-bold text-ink">{{ displayTitle }}</h2>
    <p class="mt-1 text-sm text-ink-muted max-w-md mx-auto">{{ displayMessage }}</p>
    <details v-if="detail" class="mt-4 text-left max-w-lg mx-auto rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3">
      <summary class="text-xs font-semibold uppercase tracking-wide text-ink-muted cursor-pointer">{{ t('errorState.details') }}</summary>
      <pre class="mt-2 text-xs text-ink-soft whitespace-pre-wrap break-words">{{ detail }}</pre>
    </details>
    <div class="mt-6">
      <Button variant="primary" :icon="RefreshCw" @click="emit('retry')">{{ displayRetry }}</Button>
    </div>
  </div>
</template>
