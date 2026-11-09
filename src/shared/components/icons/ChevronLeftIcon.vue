<script setup>
defineProps({
  class: { type: String, default: 'w-5 h-5' },
})
</script>

<template>
  <svg :class="class" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
  </svg>
</template>
