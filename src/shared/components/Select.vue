<script setup>
import { useI18n } from 'vue-i18n'
import { ref, computed, onMounted, onUnmounted, nextTick, watch, useId } from 'vue'
import ChevronDownIcon from '@/shared/components/icons/ChevronDownIcon.vue'
import CheckIcon from '@/shared/components/icons/CheckIcon.vue'
import XMarkIcon from '@/shared/components/icons/XMarkIcon.vue'
const { t } = useI18n({ useScope: 'global' })

const props = defineProps({
  modelValue: { type: [String, Number, Boolean], default: '' },
  options: { type: Array, default: () => [] },
  placeholder: { type: String, default: '' },
  label: { type: String, default: '' },
  error: { type: String, default: '' },
  hint: { type: String, default: '' },
  disabled: { type: Boolean, default: false },
  required: { type: Boolean, default: false },
  id: { type: String, required: true },
  name: { type: String, default: '' },
  searchable: { type: Boolean, default: false },
  clearable: { type: Boolean, default: false },
  variant: { type: String, default: 'default', validator: (v) => ['default', 'bar'].includes(v) },
  fullWidth: { type: Boolean, default: false },
})

const emit = defineEmits(['update:modelValue', 'change', 'blur', 'focus'])

const isOpen = ref(false)
const searchQuery = ref('')
const highlightedIndex = ref(-1)
const triggerRef = ref(null)
const listboxRef = ref(null)
const listboxId = useId()
const optionId = (index) => `${listboxId}-option-${index}`

const effectivePlaceholder = computed(() => props.placeholder || t('select.placeholder'))

const selectedOption = computed(() =>
  props.options.find(opt => opt.value === props.modelValue)
)

const filteredOptions = computed(() => {
  if (!props.searchable || !searchQuery.value) return props.options
  const query = searchQuery.value.toLowerCase()
  return props.options.filter(opt =>
    opt.label.toLowerCase().includes(query) ||
    String(opt.value).toLowerCase().includes(query)
  )
})

function selectOption(option) {
  emit('update:modelValue', option.value)
  emit('change', option.value)
  close()
}

function clearSelection(e) {
  e?.stopPropagation()
  emit('update:modelValue', '')
  emit('change', '')
  close()
  nextTick(() => triggerRef.value?.focus())
}

function close() {
  isOpen.value = false
  searchQuery.value = ''
  highlightedIndex.value = -1
}

function open() {
  if (props.disabled) return
  isOpen.value = true
  highlightedIndex.value = filteredOptions.value.findIndex(o => o.value === props.modelValue)
  nextTick(() => {
    scrollToHighlighted()
  })
}

function toggle() {
  if (isOpen.value) close()
  else open()
}

function handleKeydown(e) {
  const options = filteredOptions.value
  if (!isOpen.value) {
    if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(e.key)) {
      e.preventDefault()
      open()
    }
    return
  }

  switch (e.key) {
    case 'ArrowDown':
      e.preventDefault()
      highlightedIndex.value = Math.min(highlightedIndex.value + 1, options.length - 1)
      scrollToHighlighted()
      break
    case 'ArrowUp':
      e.preventDefault()
      highlightedIndex.value = Math.max(highlightedIndex.value - 1, -1)
      scrollToHighlighted()
      break
    case 'Enter':
      if (highlightedIndex.value >= 0 && options[highlightedIndex.value]) {
        e.preventDefault()
        selectOption(options[highlightedIndex.value])
      }
      break
    case 'Escape':
      close()
      triggerRef.value?.focus()
      break
    case 'Tab':
      close()
      break
    case 'Home':
      e.preventDefault()
      highlightedIndex.value = 0
      scrollToHighlighted()
      break
    case 'End':
      e.preventDefault()
      highlightedIndex.value = options.length - 1
      scrollToHighlighted()
      break
  }
}

function scrollToHighlighted() {
  if (listboxRef.value && highlightedIndex.value >= 0) {
    const option = listboxRef.value.querySelector(`[data-index="${highlightedIndex.value}"]`)
    if (typeof option?.scrollIntoView === 'function') option.scrollIntoView({ block: 'nearest' })
  }
}

function handleClickOutside(e) {
  if (triggerRef.value && !triggerRef.value.contains(e.target)) {
    if (listboxRef.value && !listboxRef.value.contains(e.target)) {
      close()
    }
  }
}

function handleTriggerClick(e) {
  if (props.disabled) return
  e.stopPropagation()
  toggle()
}

watch(isOpen, (val) => {
  if (val) {
    document.addEventListener('click', handleClickOutside)
  } else {
    document.removeEventListener('click', handleClickOutside)
  }
})

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<template>
  <div class="w-full select-wrapper">
    <label v-if="label" :for="id" class="label">
      {{ label }}
      <span v-if="required" class="text-danger-500 ml-1" aria-hidden="true">*</span>
    </label>

    <div :class="['relative', props.fullWidth ? 'block w-full' : 'inline-block']">
      <button
        ref="triggerRef"
        type="button"
        @click="handleTriggerClick"
        @keydown="handleKeydown"
        :id="id"
        :disabled="props.disabled"
        :aria-expanded="isOpen"
        aria-haspopup="listbox"
        :aria-controls="listboxId"
        :aria-invalid="!!error"
        :aria-activedescendant="highlightedIndex >= 0 ? optionId(highlightedIndex) : undefined"
        :class="[
          'h-10 flex items-center justify-between gap-3 whitespace-nowrap rounded-xl border border-neutral-200 bg-card pl-3.5 pr-4 shadow-soft text-sm text-ink focus:border-primary-400 focus:ring-4 focus:ring-[var(--color-focus-ring)] focus:outline-none disabled:bg-neutral-50 disabled:cursor-not-allowed',
          props.variant === 'bar' && !props.fullWidth ? 'w-auto' : 'w-full',
          {
            'border-danger-500 focus:border-danger-500 focus:ring-danger-100': error,
            'border-primary-400 bg-primary-50/60': isOpen,
            'pr-14': clearable && modelValue !== '' && modelValue !== null && modelValue !== undefined,
          },
        ]"
      >
        <span v-if="modelValue !== '' && modelValue !== null && modelValue !== undefined" class="flex min-w-0 flex-1 items-center gap-2">
          <span class="min-w-0 flex-1 truncate text-left">{{ selectedOption?.label || modelValue }}</span>
        </span>
        <span v-else class="min-w-0 flex-1 truncate text-left text-ink-muted">{{ effectivePlaceholder }}</span>
        <ChevronDownIcon :class="['h-5 w-5 shrink-0 self-center transition-transform', isOpen && 'rotate-180']" aria-hidden="true" />
      </button>
      <button
        v-if="clearable && !props.disabled && modelValue !== '' && modelValue !== null && modelValue !== undefined"
        type="button"
        @click="clearSelection"
        class="absolute right-9 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-ink-muted hover:bg-neutral-100 hover:text-ink transition-colors focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)] focus-visible:ring-offset-2"
        :aria-label="t('select.clearSelection')"
      >
        <XMarkIcon class="w-4 h-4" aria-hidden="true" />
      </button>

      <Transition name="slideDown">
        <div
          v-show="isOpen"
          ref="listboxRef"
          :id="listboxId"
          class="absolute z-50 left-0 top-full mt-2 w-full min-w-[220px] max-w-[min(320px,90vw)] max-h-60 bg-white dark:bg-card rounded-xl shadow-xl border border-neutral-200 overflow-auto"
          role="listbox"
          :aria-label="label"
          aria-multiselectable="false"
        >
          <input
            v-if="searchable"
            type="search"
            v-model="searchQuery"
            :placeholder="t('common.search')"
            class="input p-2 sticky top-0 bg-card z-10"
            @click.stop
            @keydown.stop
            :aria-label="t('select.searchOptions')"
            :aria-controls="listboxId"
          />
          <div v-if="filteredOptions.length === 0" class="px-3 py-4 text-center text-ink-muted text-sm" role="option" aria-disabled="true" :id="optionId(0)">
            {{ t('select.noMatch') }}
          </div>
          <div v-else>
            <div
              v-for="(option, index) in filteredOptions"
              :key="option.value"
              :id="optionId(index)"
              :data-index="index"
              tabindex="-1"
              @click="!option.disabled && selectOption(option)"
              @mouseenter="highlightedIndex = index"
              @keydown.enter.prevent="!option.disabled && selectOption(option)"
              :class="[
                'w-full flex items-center gap-2 px-3.5 py-2.5 text-left text-sm transition-colors cursor-pointer',
                index === highlightedIndex ? 'bg-primary-50 text-primary-700' : 'text-ink-soft hover:bg-neutral-50',
                option.disabled && 'opacity-50 cursor-not-allowed',
              ]"
              role="option"
              :aria-selected="option.value === modelValue"
              :aria-disabled="!!option.disabled"
            >
              <span class="flex-1 min-w-0">
                <span class="block truncate" :class="option.value === modelValue && 'font-semibold'">{{ option.label }}</span>
                <span v-if="option.meta" class="block text-xs font-mono text-ink-muted truncate">{{ option.meta }}</span>
              </span>
              <CheckIcon v-if="option.value === modelValue" class="w-4 h-4 flex-shrink-0 text-primary-600" aria-hidden="true" />
            </div>
          </div>
        </div>
      </Transition>
    </div>

    <p v-if="error" :id="`${id}-error`" class="mt-1.5 text-sm text-danger-600" role="alert">{{ error }}</p>
    <p v-else-if="hint" :id="`${id}-hint`" class="mt-1.5 text-sm text-ink-muted">{{ hint }}</p>
  </div>
</template>

<style scoped>
.slideDown-enter-active,
.slideDown-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}
.slideDown-enter-from,
.slideDown-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>