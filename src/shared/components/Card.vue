<script setup>
defineProps({
  variant: { type: String, default: 'default', validator: (v) => ['default', 'outlined', 'elevated'].includes(v) },
  padding: { type: String, default: 'lg', validator: (v) => ['none', 'sm', 'md', 'lg', 'xl'].includes(v) },
  hover: { type: Boolean, default: false },
})

const variantClasses = {
  default: 'bg-card rounded-xl shadow-soft border border-neutral-100',
  outlined: 'bg-card rounded-xl border border-neutral-200',
  elevated: 'bg-card rounded-xl shadow-card border border-neutral-100',
}

const paddingClasses = {
  none: '',
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-6',
  xl: 'p-8',
}
</script>

<template>
  <div :class="[variantClasses[variant], paddingClasses[padding], hover && 'hover:shadow-card transition-shadow duration-normal cursor-pointer']">
    <slot />
  </div>
</template>