<script setup>
import { useRouter } from 'vue-router'
import { ShieldX, ArrowLeft, LogOut } from 'lucide-vue-next'
import Button from '@/shared/components/Button.vue'
import Card from '@/shared/components/Card.vue'
import { useAuthStore } from '@/shared/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

function goDashboard() {
  router.push({ name: 'dashboard-home' })
}

function logout() {
  authStore.logout()
}
</script>

<template>
  <div class="min-h-screen bg-base flex items-center justify-center p-6">
    <Card padding="xl" class="max-w-md w-full text-center">
      <div class="w-16 h-16 rounded-2xl bg-danger-100 flex items-center justify-center mx-auto" aria-hidden="true">
        <ShieldX class="w-8 h-8 text-danger-600" />
      </div>
      <p class="mt-4 text-xs font-bold uppercase tracking-[0.2em] text-danger-600">Error 403</p>
      <h1 class="mt-1 font-display text-2xl font-extrabold text-ink">No tienes acceso a esta sección</h1>
      <p class="mt-3 text-sm text-ink-muted leading-relaxed">
        Tu rol no tiene permiso para ver esta página. Si crees que es un error, contacta al administrador de tu cuenta.
      </p>
      <div class="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
        <Button variant="primary" :icon="ArrowLeft" @click="goDashboard">Volver al dashboard</Button>
        <Button variant="ghost" :icon="LogOut" @click="logout">Cerrar sesión</Button>
      </div>
    </Card>
  </div>
</template>
