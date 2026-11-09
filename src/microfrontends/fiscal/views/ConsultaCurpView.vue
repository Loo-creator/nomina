<script setup>
import { ref, computed } from 'vue'
import { Search, UserCheck, AlertTriangle, IdCard } from 'lucide-vue-next'
import PageHeader from '@/shared/components/PageHeader.vue'
import Button from '@/shared/components/Button.vue'
import Badge from '@/shared/components/Badge.vue'
import { useToastStore } from '@/shared/stores/toast'
import { queryCurp } from '@/services/fiscal.service'

const toastStore = useToastStore()

const curp = ref('')
const result = ref(null)
const isLoading = ref(false)
const searched = ref(false)

const isValidFormat = computed(() =>
  /^[A-Z]{4}\d{6}[HM][A-Z]{5}[A-Z0-9]\d$/.test(curp.value.toUpperCase().trim())
)

const person = computed(() => result.value?.data || null)

async function handleSearch() {
  if (!curp.value.trim()) {
    toastStore.warning('Ingresa una CURP para consultar')
    return
  }
  isLoading.value = true
  searched.value = true
  const res = await queryCurp(curp.value)
  if (res.ok) {
    result.value = res.data
    if (!res.data.valid) toastStore.info(res.message)
  } else {
    result.value = null
    toastStore.error(res.message)
  }
  isLoading.value = false
}

function clearSearch() {
  curp.value = ''
  result.value = null
  searched.value = false
}
</script>

<template>
  <div class="space-y-7">
    <PageHeader
      title="Consulta CURP"
      description="Valida el formato y consulta los datos asociados a una CURP"
      :icon="IdCard"
    />

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div class="lg:col-span-2 card p-6 space-y-5">
        <div>
          <label for="curp" class="label">CURP</label>
          <div class="flex gap-3">
            <div class="relative flex-1">
              <IdCard class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-ink-muted" aria-hidden="true" />
              <input
                id="curp"
                v-model="curp"
                maxlength="18"
                placeholder="PEPJ900101HDFRRN09"
                class="input pl-10 font-mono uppercase tracking-wider"
                @keydown.enter="handleSearch"
              />
            </div>
            <Button variant="primary" :icon="Search" :loading="isLoading" @click="handleSearch">Consultar</Button>
          </div>
          <p class="mt-2 text-xs" :class="curp && !isValidFormat ? 'text-danger-600' : 'text-ink-muted'">
            {{ curp && !isValidFormat ? 'Formato de CURP inválido (18 caracteres)' : 'Ingresa los 18 caracteres de la CURP' }}
          </p>
        </div>

        <div v-if="searched" class="pt-2">
          <div v-if="person" class="rounded-2xl border border-neutral-100 overflow-hidden">
            <div class="px-5 py-4 bg-success-50 border-b border-success-200 flex items-center gap-3">
              <UserCheck class="w-5 h-5 text-success-600" aria-hidden="true" />
              <p class="font-semibold text-success-800">CURP válida y localizada</p>
              <Badge variant="success" class="ml-auto">{{ curp.toUpperCase() }}</Badge>
            </div>
            <dl class="grid grid-cols-2 sm:grid-cols-3 gap-px bg-neutral-100">
              <div class="bg-card p-4"><dt class="text-xs text-ink-muted">Nombre</dt><dd class="font-medium text-ink mt-0.5">{{ person.nombre }}</dd></div>
              <div class="bg-card p-4"><dt class="text-xs text-ink-muted">Apellido paterno</dt><dd class="font-medium text-ink mt-0.5">{{ person.apellidoPaterno }}</dd></div>
              <div class="bg-card p-4"><dt class="text-xs text-ink-muted">Apellido materno</dt><dd class="font-medium text-ink mt-0.5">{{ person.apellidoMaterno }}</dd></div>
              <div class="bg-card p-4"><dt class="text-xs text-ink-muted">Fecha de nacimiento</dt><dd class="font-medium text-ink mt-0.5">{{ person.fechaNacimiento }}</dd></div>
              <div class="bg-card p-4"><dt class="text-xs text-ink-muted">Sexo</dt><dd class="font-medium text-ink mt-0.5">{{ person.sexo === 'H' ? 'Hombre' : 'Mujer' }}</dd></div>
              <div class="bg-card p-4"><dt class="text-xs text-ink-muted">Entidad</dt><dd class="font-medium text-ink mt-0.5">{{ person.entidad }}</dd></div>
            </dl>
          </div>

          <div v-else-if="result" class="rounded-2xl border border-warning-200 bg-warning-50 p-5 flex items-start gap-3">
            <AlertTriangle class="w-5 h-5 text-warning-600 flex-shrink-0 mt-0.5" aria-hidden="true" />
            <div>
              <p class="font-semibold text-warning-800">Sin datos precargados</p>
              <p class="text-sm text-warning-700 mt-1">La CURP tiene formato válido pero no hay datos asociados en el mock. Intenta con una CURP de ejemplo.</p>
            </div>
          </div>
        </div>

        <div v-else class="rounded-2xl border border-dashed border-neutral-200 p-8 text-center">
          <IdCard class="w-12 h-12 text-neutral-300 mx-auto mb-3" aria-hidden="true" />
          <p class="text-ink-muted">Ingresa una CURP para ver los resultados</p>
        </div>
      </div>

      <div class="card p-6 space-y-4 h-fit">
        <h2 class="font-display font-bold text-ink">CURP de ejemplo</h2>
        <p class="text-sm text-ink-muted">Usa estas CURP para probar la consulta:</p>
        <div class="space-y-2">
          <button
            v-for="sample in ['PEPJ900101HDFRRN09', 'GOMM850512MDFRRN05', 'ROCA920303HDFRRN02']"
            :key="sample"
            class="w-full text-left px-3.5 py-2.5 rounded-xl border border-neutral-200 bg-card font-mono text-xs text-ink-soft hover:border-primary-300 hover:text-primary-700 transition-colors"
            @click="curp = sample"
          >
            {{ sample }}
          </button>
        </div>
        <Button variant="ghost" full-width @click="clearSearch">Limpiar</Button>
      </div>
    </div>
  </div>
</template>
