<script setup>
import { useI18n } from 'vue-i18n'
import { ref, watch, onMounted, onUnmounted, useId } from 'vue'
import { FocusTrap } from 'focus-trap-vue'
import XMarkIcon from '@/shared/components/icons/XMarkIcon.vue'
import Button from '@/shared/components/Button.vue'
const { t } = useI18n({ useScope: 'global' })

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  title: { type: String, default: '' },
  size: { type: String, default: 'md', validator: (v) => ['sm', 'md', 'lg', 'xl', 'full'].includes(v) },
  closeOnOverlayClick: { type: Boolean, default: true },
  showCloseButton: { type: Boolean, default: true },
  hideFooter: { type: Boolean, default: false },
})

const emit = defineEmits(['update:modelValue', 'close'])

const modalId = useId()
const titleId = useId()
const previouslyFocused = ref(null)

const sizeClasses = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
  full: 'max-w-[90vw]',
}

watch(() => props.modelValue, (val) => {
  if (val) {
    previouslyFocused.value = document.activeElement
    document.body.style.overflow = 'hidden'
  } else {
    document.body.style.overflow = ''
    // Only restore focus if element is still in DOM
    if (previouslyFocused.value && 
        typeof previouslyFocused.value.focus === 'function' &&
        document.body.contains(previouslyFocused.value)) {
      previouslyFocused.value.focus()
    }
  }
}, { immediate: true })

function close() {
  emit('update:modelValue', false)
  emit('close')
}

function handleKeydown(e) {
  if (e.key === 'Escape') {
    close()
  }
}

function handleOverlayClick() {
  if (props.closeOnOverlayClick) {
    close()
  }
}

onMounted(() => {
  if (props.modelValue) {
    previouslyFocused.value = document.activeElement
    document.body.style.overflow = 'hidden'
  }
})

onUnmounted(() => {
  document.body.style.overflow = ''
  previouslyFocused.value = null
})
</script>

<template>
  <FocusTrap
    v-if="modelValue"
    @escape="close"
    :paused="false"
    :focus-trap-options="{ fallbackFocus: '#' + modalId, clickDeactivates: props.closeOnOverlayClick, onDeactivate: close }"
  >
    <Transition name="fade" appear>
      <div
        :id="modalId"
        class="modal-overlay"
        @click="handleOverlayClick"
        @keydown="handleKeydown"
        role="dialog"
        aria-modal="true"
        :aria-labelledby="title ? titleId : undefined"
      >
        <div :class="['modal-content', sizeClasses[size]]" @click.stop>
          <div v-if="title || showCloseButton" class="modal-header">
            <h2 v-if="title" :id="titleId" class="text-lg font-semibold text-ink">{{ title }}</h2>
            <button
              v-if="showCloseButton"
              @click="close"
              class="p-1.5 rounded-lg text-ink-muted hover:bg-neutral-100 hover:text-ink transition-colors focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)] focus-visible:ring-offset-2"
              :aria-label="t('modal.close')"
            >
              <XMarkIcon class="w-5 h-5" />
            </button>
            <!-- Fallback focusable element for focus-trap when no other tabbable elements exist -->
            <button
              v-else
              @click="close"
              class="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:right-4 focus:z-50 focus:p-2 focus:bg-white focus:rounded-lg focus:shadow-lg focus:ring-2 focus:ring-[var(--color-focus-ring)]"
              :aria-label="t('modal.close')"
            >
              <XMarkIcon class="w-5 h-5" />
            </button>
          </div>

          <div class="modal-body">
            <slot />
          </div>

          <div v-if="!hideFooter" class="modal-footer">
            <slot name="footer" />
          </div>
        </div>
      </div>
    </Transition>
  </FocusTrap>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease-out;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
.fade-enter-active .modal-content,
.fade-leave-active .modal-content {
  transition: transform 0.2s ease-out, opacity 0.2s ease-out;
}
.fade-enter-from .modal-content,
.fade-leave-to .modal-content {
  opacity: 0;
  transform: translateY(8px) scale(0.99);
}
</style>