<script setup>
defineProps({
  variant: {
    type: String,
    default: 'primary',
    validator: (v) => ['primary', 'secondary', 'ghost', 'danger', 'outline'].includes(v),
  },
  size: {
    type: String,
    default: 'md',
    validator: (v) => ['sm', 'md', 'lg'].includes(v),
  },
  disabled: { type: Boolean, default: false },
  loading: { type: Boolean, default: false },
  type: { type: String, default: 'button' },
  fullWidth: { type: Boolean, default: false },
  icon: { type: [String, Object, Function], default: '' },
  iconRight: { type: Boolean, default: false },
})

const variantClasses = {
  primary: 'btn-primary',
  secondary: 'btn-secondary',
  ghost: 'btn-ghost',
  danger: 'btn-danger',
  outline: 'btn-outline',
}

const sizeClasses = {
  sm: 'px-3 py-1.5 text-sm gap-1.5',
  md: 'px-4 py-2.5 text-sm gap-2',
  lg: 'px-6 py-3 text-base gap-2',
}

const spinnerSizes = {
  sm: 'w-4 h-4 border-1.5',
  md: 'w-5 h-5 border-2',
  lg: 'w-6 h-6 border-2',
}
</script>

<template>
  <button
    :type="type"
    :class="[
      'btn',
      variantClasses[variant],
      sizeClasses[size],
      fullWidth && 'w-full',
      disabled && 'opacity-50 cursor-not-allowed',
      loading && 'cursor-wait',
    ]"
    :disabled="disabled || loading"
    :aria-busy="loading"
    :aria-disabled="disabled || loading"
  >
    <span v-if="loading" class="flex items-center justify-center" aria-hidden="true">
      <svg :class="spinnerSizes[size]" class="loader" viewBox="0 0 24 24" fill="none">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
      </svg>
    </span>
    <span v-else-if="icon && !iconRight" class="flex items-center" aria-hidden="true">
      <component :is="icon" class="w-5 h-5" />
    </span>
    <slot />
    <span v-if="icon && iconRight" class="flex items-center" aria-hidden="true">
      <component :is="icon" class="w-5 h-5" />
    </span>
  </button>
</template>