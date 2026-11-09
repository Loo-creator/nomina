<script setup>
import { computed } from 'vue'
import { useToastStore } from '@/shared/stores/toast'
import XMarkIcon from '@/shared/components/icons/XMarkIcon.vue'

const toastStore = useToastStore()

const toastClasses = {
  success: 'toast-success',
  warning: 'toast-warning',
  danger: 'toast-danger',
  info: 'toast-info',
}

const toastIcons = {
  success: 'check-circle',
  warning: 'exclamation-triangle',
  danger: 'exclamation-circle',
  info: 'info-circle',
}
</script>

<template>
  <div
    class="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none"
    aria-live="polite"
    aria-label="Notificaciones"
  >
    <TransitionGroup name="toast" tag="div">
      <div
        v-for="toast in toastStore.toasts"
        :key="toast.id"
        :class="['pointer-events-auto', toastClasses[toast.type]]"
        role="alert"
        :aria-live="toast.type === 'danger' ? 'assertive' : 'polite'"
      >
        <div class="flex items-start gap-3">
          <div class="flex-shrink-0 mt-0.5 text-current">
            <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
              <path
                v-if="toast.type === 'success'"
                fill-rule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clip-rule="evenodd"
              />
              <path
                v-else-if="toast.type === 'warning'"
                fill-rule="evenodd"
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                clip-rule="evenodd"
              />
              <path
                v-else-if="toast.type === 'danger'"
                fill-rule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clip-rule="evenodd"
              />
              <path
                v-else
                fill-rule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clip-rule="evenodd"
              />
            </svg>
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium text-ink">{{ toast.message }}</p>
          </div>
          <button
            @click="toastStore.remove(toast.id)"
            class="flex-shrink-0 p-1 rounded text-ink-muted hover:text-ink-soft hover:bg-neutral-100 transition-colors"
            aria-label="Cerrar notificación"
          >
            <XMarkIcon class="w-4 h-4" />
          </button>
        </div>
        <div
          v-if="!toast.persistent && toast.duration > 0"
          class="absolute bottom-0 left-0 h-0.5 bg-current/30 animate-toast-progress"
          :style="{ animationDuration: toast.duration + 'ms' }"
          aria-hidden="true"
        />
      </div>
    </TransitionGroup>
  </div>
</template>

<style scoped>
@keyframes toast-progress {
  from { width: 100%; }
  to { width: 0%; }
}

.animate-toast-progress {
  animation: toast-progress linear forwards;
}

.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}
.toast-enter-from {
  opacity: 0;
  transform: translateX(100%);
}
.toast-leave-to {
  opacity: 0;
  transform: translateX(100%);
}
</style>