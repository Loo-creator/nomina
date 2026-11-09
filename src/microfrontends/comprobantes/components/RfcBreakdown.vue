<script setup>
import Badge from '@/shared/components/Badge.vue'

defineProps({
  rfcs: { type: Array, default: () => [] },
})
</script>

<template>
  <ul class="grid grid-cols-1 md:grid-cols-2 gap-3" aria-label="Avance por RFC emisor">
    <li v-for="entry in rfcs" :key="entry.rfc" class="rounded-xl border border-neutral-200 px-4 py-3">
      <div class="flex items-center justify-between gap-2">
        <div class="min-w-0">
          <p class="font-mono text-xs text-ink-soft">{{ entry.rfc }}</p>
          <p class="text-sm font-semibold text-ink truncate">{{ entry.companyName || 'RFC no registrado en la cuenta' }}</p>
        </div>
        <Badge v-if="!entry.companyName" variant="danger" size="sm">Sin RFC</Badge>
      </div>
      <div class="progress-track mt-3" role="progressbar" :aria-valuenow="entry.ok + entry.failed" :aria-valuemin="0" :aria-valuemax="entry.total" :aria-label="`Avance RFC ${entry.rfc}`">
        <div class="progress-fill bg-teal-500" :style="{ width: `${entry.total ? ((entry.ok + entry.failed) / entry.total) * 100 : 0}%` }" />
      </div>
      <p class="mt-2 text-[11px] text-ink-muted tabular-nums">
        <span class="text-success-700 font-semibold">{{ entry.ok }} ok</span> ·
        <span class="text-danger-600 font-semibold">{{ entry.failed }} error</span> ·
        {{ entry.pending }} pendiente(s) de {{ entry.total }}
      </p>
    </li>
  </ul>
</template>
