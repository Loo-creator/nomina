<script setup>
defineProps({
  class: { type: String, default: 'w-5 h-5' },
})
</script>

<template>
  <svg :class="class" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L3 12l5.714-2.143L13 3z" />
  </svg>
</template>