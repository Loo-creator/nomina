<script setup>
defineProps({
  variant: { type: String, default: 'text', validator: (v) => ['text', 'circular', 'rectangular', 'card'].includes(v) },
  width: { type: [String, Number], default: '100%' },
  height: { type: [String, Number], default: '1rem' },
  customClass: { type: String, default: '' },
})

const variantClasses = {
  text: 'rounded',
  circular: 'rounded-full',
  rectangular: 'rounded-lg',
  card: 'rounded-xl',
}
</script>

<template>
  <div
    :class="['skeleton', variantClasses[variant], customClass]"
    :style="{ width, height }"
    aria-hidden="true"
  />
</template>