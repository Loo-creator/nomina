<script setup>
import { useRouter } from 'vue-router'
import Button from '@/shared/components/Button.vue'
import HomeIcon from '@/shared/components/icons/HomeIcon.vue'
import { useI18n } from 'vue-i18n'
const { t } = useI18n({ useScope: 'global' })

const router = useRouter()

function goHome() {
  router.push('/dashboard')
}
</script>

<template>
  <div class="min-h-screen bg-base flex items-center justify-center p-4">
    <div class="text-center max-w-md">
      <div class="w-24 h-24 mx-auto mb-6 bg-neutral-100 rounded-2xl flex items-center justify-center">
        <svg class="w-12 h-12 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <h1 class="text-3xl font-bold text-ink mb-2">{{ t('notFound.title') }}</h1>
      <p class="text-ink-muted mb-6">{{ t('notFound.message') }}</p>
      <Button variant="primary" icon="HomeIcon" @click="goHome">
        {{ t('notFound.back') }}
      </Button>
    </div>
  </div>
</template>