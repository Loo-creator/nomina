<script setup>
defineProps({
  title: { type: String, required: true },
  description: { type: String, default: '' },
  icon: { type: [String, Object, Function], default: '' },
})
</script>

<template>
  <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
    <div class="flex items-center gap-4">
      <div class="w-12 h-12 rounded-xl bg-brand-gradient shadow-glow flex items-center justify-center flex-shrink-0">
        <component :is="icon" v-if="icon" class="w-6 h-6 text-white" aria-hidden="true" />
      </div>
      <div>
        <h1 class="font-display text-2xl font-extrabold text-ink tracking-tight">{{ title }}</h1>
        <p v-if="description" class="text-ink-muted mt-1 line-clamp-2">{{ description }}</p>
      </div>
    </div>
    <div class="flex flex-wrap gap-2">
      <slot name="actions" />
    </div>
  </div>
</template>
