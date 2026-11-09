<script setup>
defineProps({
  class: { type: String, default: 'w-5 h-5' },
})
</script>

<template>
  <svg :class="class" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
  </svg>
</template>