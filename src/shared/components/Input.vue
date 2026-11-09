<script setup>
import { computed } from 'vue'

const props = defineProps({
  modelValue: { type: [String, Number], default: '' },
  label: { type: String, default: '' },
  type: { type: String, default: 'text' },
  placeholder: { type: String, default: '' },
  error: { type: String, default: '' },
  hint: { type: String, default: '' },
  disabled: { type: Boolean, default: false },
  required: { type: Boolean, default: false },
  id: { type: String, required: true },
  name: { type: String, default: '' },
  autocomplete: { type: String, default: 'off' },
  icon: { type: String, default: '' },
  iconRight: { type: String, default: '' },
  rows: { type: Number, default: 3 },
})

const emit = defineEmits(['update:modelValue', 'blur', 'focus'])

const inputClasses = computed(() => [
  'input',
  props.error && 'border-danger-500 focus:border-danger-500 focus:ring-danger-100',
  props.disabled && 'bg-neutral-50',
  props.icon && 'pl-10',
  props.iconRight && 'pr-10',
])

const isTextarea = computed(() => props.type === 'textarea')
</script>

<template>
  <div class="w-full">
    <label v-if="props.label" :for="props.id" class="label">
      {{ props.label }}
      <span v-if="props.required" class="text-danger-500 ml-1" aria-hidden="true">*</span>
    </label>

    <div class="relative">
      <span v-if="props.icon" class="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted pointer-events-none" aria-hidden="true">
        <component :is="props.icon" class="w-5 h-5" />
      </span>

      <input
        v-if="!isTextarea"
        :id="props.id"
        :name="props.name"
        :type="props.type"
        :placeholder="props.placeholder"
        :value="props.modelValue"
        :disabled="props.disabled"
        :required="props.required"
        :autocomplete="props.autocomplete"
        :inputmode="props.inputmode"
        :maxlength="props.maxlength"
        :aria-invalid="!!props.error"
        :aria-describedby="props.error ? `${props.id}-error` : props.hint ? `${props.id}-hint` : undefined"
        :class="inputClasses"
        @input="emit('update:modelValue', $event.target.value)"
        @blur="emit('blur', $event)"
        @focus="emit('focus', $event)"
      />

      <textarea
        v-else
        :id="props.id"
        :name="props.name"
        :placeholder="props.placeholder"
        :value="props.modelValue"
        :disabled="props.disabled"
        :required="props.required"
        :rows="props.rows"
        :aria-invalid="!!props.error"
        :aria-describedby="props.error ? `${props.id}-error` : props.hint ? `${props.id}-hint` : undefined"
        :class="inputClasses"
        @input="emit('update:modelValue', $event.target.value)"
        @blur="emit('blur', $event)"
        @focus="emit('focus', $event)"
      />

      <span v-if="props.iconRight" class="absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted pointer-events-none" aria-hidden="true">
        <component :is="props.iconRight" class="w-5 h-5" />
      </span>
    </div>

    <p v-if="props.error" :id="`${props.id}-error`" class="mt-1.5 text-sm text-danger-600" role="alert">{{ props.error }}</p>
    <p v-else-if="props.hint" :id="`${props.id}-hint`" class="mt-1.5 text-sm text-ink-muted">{{ props.hint }}</p>
  </div>
</template>