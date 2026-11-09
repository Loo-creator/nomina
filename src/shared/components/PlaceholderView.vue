<script setup>
import Button from '@/shared/components/Button.vue'
import Alert from '@/shared/components/Alert.vue'

defineProps({
  title: { type: String, required: true },
  description: { type: String, default: '' },
  icon: { type: [String, Object], default: '' },
  actions: { type: Array, default: () => [] },
})

const upcoming = [
  'Tabla con paginación, búsqueda, orden y filtros',
  'Acciones por fila: ver, editar, eliminar, descargar, timbrar, cancelar, firmar',
  'Formularios con validación visual',
  'Empty states ilustrados',
  'Microinteracciones y transiciones fluidas',
]
</script>

<template>
  <div class="space-y-7">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div class="flex items-center gap-4">
        <div class="w-14 h-14 rounded-2xl bg-brand-gradient shadow-glow flex items-center justify-center flex-shrink-0">
          <component v-if="icon" :is="icon" class="w-7 h-7 text-white" aria-hidden="true" />
          <svg v-else class="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          </svg>
        </div>
        <div>
          <h1 class="font-display text-2xl font-extrabold text-ink tracking-tight">{{ title }}</h1>
          <p v-if="description" class="text-ink-muted mt-1">{{ description }}</p>
        </div>
      </div>
      <div class="flex gap-2">
        <slot name="actions">
          <Button
            v-for="action in actions"
            :key="action.key || action.label"
            :variant="action.variant || 'primary'"
            :icon="action.icon"
            @click="action.handler"
          >
            {{ action.label }}
          </Button>
        </slot>
      </div>
    </div>

    <Alert variant="info">
      <p class="font-semibold">Sección en construcción</p>
      <p class="mt-1">Esta funcionalidad estará disponible próximamente. El cascarón frontend está listo para conectar con la API real.</p>
    </Alert>

    <div class="card p-6 sm:p-8">
      <h3 class="font-display font-bold text-ink mb-5">Próximas funcionalidades</h3>
      <ul class="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <li
          v-for="item in upcoming"
          :key="item"
          class="flex items-start gap-3 p-3.5 rounded-2xl border border-neutral-100 bg-neutral-50/40"
        >
          <span class="mt-0.5 w-6 h-6 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
            <span class="w-2 h-2 rounded-full bg-primary-500" />
          </span>
          <span class="text-sm text-ink-soft">{{ item }}</span>
        </li>
      </ul>
    </div>
  </div>
</template>
