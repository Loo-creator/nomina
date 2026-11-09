<script setup>
defineProps({
  modelValue: { type: Boolean, default: false },
  label: { type: String, default: '' },
  indeterminate: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
  id: { type: String, required: true },
  name: { type: String, default: '' },
})

const emit = defineEmits(['update:modelValue', 'change'])
</script>

<template>
  <label class="flex items-center gap-2.5 cursor-pointer select-none">
    <input
      :id="id"
      :name="name"
      type="checkbox"
      :checked="modelValue"
      :indeterminate="indeterminate"
      :disabled="disabled"
      :value="modelValue"
      @change="emit('update:modelValue', $event.target.checked)"
      @input="emit('change', $event.target.checked)"
      class="w-4 h-4 rounded border-neutral-300 text-primary-600 focus:ring-2 focus:ring-[var(--color-focus-ring)] focus:ring-offset-2"
      :aria-label="label"
    />
    <span v-if="label" class="text-sm text-ink-soft">{{ label }}</span>
    <slot />
  </label>
</template>