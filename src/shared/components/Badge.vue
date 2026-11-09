<script setup>
defineProps({
  variant: {
    type: String,
    default: 'neutral',
    validator: (v) => ['primary', 'secondary', 'success', 'warning', 'danger', 'info', 'neutral'].includes(v),
  },
  size: { type: String, default: 'md', validator: (v) => ['sm', 'md', 'lg'].includes(v) },
  dot: { type: Boolean, default: false },
  removable: { type: Boolean, default: false },
  label: { type: String, default: '' },
})

const emit = defineEmits(['remove'])

const variantClasses = {
  primary: 'badge-primary',
  secondary: 'badge bg-neutral-100 text-ink-soft',
  success: 'badge-success',
  warning: 'badge-warning',
  danger: 'badge-danger',
  info: 'badge-info',
  neutral: 'badge-neutral',
}

const sizeClasses = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-0.5 text-xs',
  lg: 'px-3 py-1 text-sm',
}
</script>

<template>
  <span :class="[variantClasses[variant], sizeClasses[size], removable && 'pr-1']" class="inline-flex items-center gap-1.5">
    <span v-if="dot" class="w-1.5 h-1.5 rounded-full bg-current" aria-hidden="true" />
    <slot>{{ label }}</slot>
    <button
      v-if="removable"
      @click="emit('remove')"
      class="ml-1 p-0.5 rounded hover:bg-black/10 transition-colors"
      aria-label="Eliminar"
    >
      <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
      </svg>
    </button>
  </span>
</template>