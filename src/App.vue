<script setup>
import { RouterView } from 'vue-router'
import ToastContainer from '@/shared/components/ToastContainer.vue'
</script>

<template>
  <div class="min-h-screen bg-base">
    <RouterView />
    <ToastContainer />
  </div>
</template>