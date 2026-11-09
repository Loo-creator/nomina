<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useToastStore } from '@/shared/stores/toast'
import { getPayrollById, getEmployeePayrollById, cancelPayroll } from '@/services/payrolls.service'
import { useAuthStore } from '@/shared/stores/auth'
import { ROLES } from '@/shared/utils/constants'
import { PAYROLL_STATUS, PAYROLL_STATUS_LABELS, PAYROLL_STATUS_COLORS } from '@/shared/utils/constants'
import PageHeader from '@/shared/components/PageHeader.vue'
import Button from '@/shared/components/Button.vue'
import Alert from '@/shared/components/Alert.vue'
import Badge from '@/shared/components/Badge.vue'
import Card from '@/shared/components/Card.vue'
import Select from '@/shared/components/Select.vue'
import Input from '@/shared/components/Input.vue'
import XCircleIcon from '@/shared/components/icons/XCircleIcon.vue'
import CheckCircleIcon from '@/shared/components/icons/CheckCircleIcon.vue'
import AlertCircleIcon from '@/shared/components/icons/AlertCircleIcon.vue'
import ChevronLeftIcon from '@/shared/components/icons/ChevronLeftIcon.vue'
import Loader from '@/shared/components/Loader.vue'
import FileTextIcon from '@/shared/components/icons/FileTextIcon.vue'
import CheckIcon from '@/shared/components/icons/CheckIcon.vue'
import ClockIcon from '@/shared/components/icons/ClockIcon.vue'

const route = useRoute()
const router = useRouter()
const toastStore = useToastStore()
const authStore = useAuthStore()

const isEmployee = computed(() => authStore.userRole === ROLES.EMPLEADO)
const isRequestOnly = computed(() =>
  !authStore.hasPermission('payroll:cancel'),
)

const payroll = ref(null)
const isLoading = ref(true)
const isCancelling = ref(false)
const cancelError = ref('')

const SAT_MOTIVOS = [
  { value: '01', label: '01 - Comprobante emitido con errores con relación' },
  { value: '02', label: '02 - Comprobante emitido con errores sin relación' },
  { value: '03', label: '03 - No se realizó la operación' },
  { value: '04', label: '04 - Operación nominativa relacionada en una factura global' },
]

const statusConfig = {
  pendiente: { variant: 'warning', label: 'Pendiente' },
  procesando: { variant: 'info', label: 'Procesando' },
  timbrada: { variant: 'primary', label: 'Timbrada' },
  firmada: { variant: 'success', label: 'Firmada' },
  cancelada: { variant: 'danger', label: 'Cancelada' },
  error: { variant: 'danger', label: 'Error' },
}

// Wizard state
const currentStep = ref(1)
const motivoSAT = ref('')
const motivoError = ref('')
const consentGiven = ref(false)
const confirmText = ref('')

const maxStep = 3

const stepLabels = [
  { num: 1, label: 'Selección', icon: XCircleIcon },
  { num: 2, label: 'Motivo SAT', icon: FileTextIcon },
  { num: 3, label: 'Confirmación', icon: AlertCircleIcon },
]

const displayNet = computed(() =>
  isEmployee.value ? payroll.value?.myNet ?? 0 : payroll.value?.totalNet ?? 0,
)

function isCompanyAllowed(payroll) {
  const scope = authStore.scopedCompanyIds
  return scope === null || scope.includes(payroll.companyId)
}

async function loadPayroll() {
  isLoading.value = true
  try {
  const response = isEmployee.value
    ? await getEmployeePayrollById(authStore.user?.employeeId, route.params.id)
    : await getPayrollById(route.params.id)
  if (response.ok && !isEmployee.value && !isCompanyAllowed(response.data)) {
    toastStore.error('No tienes acceso a esta nómina')
    router.push('/comprobantes/nominas-timbradas')
    return
  }
    if (response.ok) {
      payroll.value = response.data
    } else {
      toastStore.error('No se encontró la nómina')
      router.push(isEmployee.value ? '/mis-nominas' : '/comprobantes/nominas-timbradas')
    }
  } catch {
    toastStore.error('Error al cargar la nómina')
    router.push(isEmployee.value ? '/mis-nominas' : '/comprobantes/nominas-timbradas')
  } finally {
    isLoading.value = false
  }
}

function nextStep() {
  if (currentStep.value < maxStep) {
    currentStep.value++
  }
}

function prevStep() {
  if (currentStep.value > 1) {
    currentStep.value--
  }
}

function canProceed() {
  if (currentStep.value === 1) return true
  if (currentStep.value === 2) return motivoSAT.value !== ''
  if (currentStep.value === 3) return consentGiven.value && confirmText.value === 'CONFIRMO'
  return false
}

function goToPayrolls() {
  router.push(isEmployee.value ? '/mis-nominas' : '/comprobantes/nominas-timbradas')
}

function handleCancel() {
  if (!canProceed() || isCancelling.value) return
  isCancelling.value = true
  cancelError.value = ''
  setTimeout(() => {
    payroll.value = { ...payroll.value, status: 'cancelada' }
    isCancelling.value = false
    toastStore.success('Solicitud de cancelación enviada al SAT')
  }, 400)
}

onMounted(() => {
  loadPayroll()
})
</script>

<template>
  <div class="space-y-6">
    <PageHeader
      title="Solicitar cancelación ante el SAT"
      description="Asistente para cancelar una nómina timbrada con motivo SAT"
      :icon="XCircleIcon"
    />

    <div v-if="isLoading" class="flex justify-center py-12">
      <Loader size="lg" />
    </div>

    <div v-else-if="payroll">
      <!-- Stepper -->
      <div class="card p-6">
        <div class="flex items-center justify-between">
          <template v-for="(step, index) in stepLabels" :key="step.num">
            <div class="flex items-center">
              <div class="flex items-center gap-2">
                <div
                  :class="[
                    'w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all',
                    index + 1 < currentStep ? 'bg-success-500 text-white' :
                    index + 1 === currentStep ? 'bg-primary-600 text-white' :
                    'bg-neutral-200 text-neutral-500'
                  ]"
                >
                  <component
                    v-if="index + 1 < currentStep"
                    :is="CheckIcon"
                    class="w-5 h-5"
                  />
                  <span v-else>{{ step.num }}</span>
                </div>
                <span
                  :class="[
                    'ml-2 text-sm font-medium',
                    index + 1 === currentStep ? 'text-ink' : 'text-ink-muted'
                  ]"
                >
                  {{ step.label }}
                </span>
              </div>
              <div v-if="index < stepLabels.length - 1" class="flex-1 max-w-[120px] h-1 bg-neutral-200 mx-4">
                <div
                  :class="[
                    'h-full rounded-full transition-all duration-300',
                    index + 1 < currentStep ? 'bg-success-500' : 'bg-neutral-200'
                  ]"
                  :style="{ width: index + 1 < currentStep ? '100%' : '0%' }"
                />
              </div>
            </div>
          </template>
        </div>
      </div>

      <Alert v-if="cancelError" variant="danger" class="mb-4">{{ cancelError }}</Alert>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div class="lg:col-span-2 space-y-6">
          <!-- Paso 1: Selección (solo info) -->
          <div v-show="currentStep === 1" class="space-y-6" key="step-1">
            <Card class="p-6">
              <div class="flex items-center gap-3 mb-4">
                <div class="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center">
                  <XCircleIcon class="w-5 h-5 text-primary-600" />
                </div>
                <div>
                  <h2 class="text-lg font-semibold text-ink">Nómina a cancelar</h2>
                  <p class="text-sm text-ink-muted mt-1">Verifica que sea la correcta antes de continuar</p>
                </div>
              </div>

              <dl class="grid grid-cols-2 gap-4 text-sm">
                <div><dt class="text-ink-muted">Período</dt><dd class="font-medium text-ink">{{ payroll.periodLabel }}</dd></div>
                <div><dt class="text-ink-muted">Empresa</dt><dd class="font-medium text-ink">{{ payroll.companyName }}</dd></div>
                <div><dt class="text-ink-muted">Estado actual</dt><dd><Badge :variant="PAYROLL_STATUS_COLORS[payroll.status] || 'neutral'" :label="PAYROLL_STATUS_LABELS[payroll.status] || payroll.status" /></dd></div>
                <div><dt class="text-ink-muted">Total neto</dt><dd class="font-medium text-ink text-lg text-primary-600">${{ displayNet.toLocaleString() }}</dd></div>
                <div><dt class="text-ink-muted">UUID</dt><dd class="font-mono text-xs text-ink-muted break-all">{{ payroll.uuid }}</dd></div>
                <div v-if="payroll.stampedAt"><dt class="text-ink-muted">Timbrada</dt><dd class="font-medium text-ink">{{ new Date(payroll.stampedAt).toLocaleString('es-MX') }}</dd></div>
              </dl>

              <div class="p-4 bg-warning-50 border border-warning-200 rounded-xl mt-4">
                <p class="font-medium text-warning-800">Esta acción solicita la cancelación ante el SAT.</p>
                <p class="text-sm text-warning-700 mt-1">Se requiere un motivo SAT válido y la confirmación expresa. No se puede deshacer.</p>
              </div>
            </Card>
          </div>

          <!-- Paso 2: Motivo SAT -->
          <div v-show="currentStep === 2" class="space-y-6" key="step-2">
            <Card class="p-6">
              <div class="flex items-center gap-3 mb-4">
                <div class="w-10 h-10 rounded-xl bg-warning-100 flex items-center justify-center">
                  <FileTextIcon class="w-5 h-5 text-warning-600" />
                </div>
                <div>
                  <h2 class="text-lg font-semibold text-ink">Motivo de cancelación (SAT)</h2>
                  <p class="text-sm text-ink-muted mt-1">Selecciona el motivo según catálogo del SAT (obligatorio)</p>
                </div>
              </div>

              <Alert v-if="motivoError" variant="danger">{{ motivoError }}</Alert>

              <Select
                id="motivo-sat"
                v-model="motivoSAT"
                label="Motivo SAT"
                :options="SAT_MOTIVOS"
                placeholder="Selecciona el motivo"
                :error="motivoSAT === '' && currentStep >= 2 ? 'El motivo SAT es obligatorio' : undefined"
                required
              />

              <div class="p-4 bg-neutral-50 rounded-xl border border-neutral-200">
                <p class="text-sm text-ink-muted">
                  <strong>Referencia SAT:</strong> El motivo debe corresponder al catálogo oficial del SAT para cancelación de CFDI de nómina.
                  Una vez seleccionado, no se puede cambiar sin cancelar y volver a iniciar.
                </p>
              </div>
            </Card>

            <Card class="p-6">
              <h2 class="text-lg font-semibold text-ink mb-4">Resumen de la nómina</h2>
              <dl class="grid grid-cols-2 gap-3 text-sm">
                <div><dt class="text-ink-muted">Período</dt><dd class="font-medium text-ink">{{ payroll.periodLabel }}</dd></div>
                <div><dt class="text-ink-muted">Empresa</dt><dd class="font-medium text-ink">{{ payroll.companyName }}</dd></div>
                <div><dt class="text-ink-muted">Tu neto</dt><dd class="font-medium text-ink text-primary-600">${{ displayNet.toLocaleString() }}</dd></div>
                <div><dt class="text-ink-muted">Motivo SAT</dt><dd class="font-medium text-ink">{{ SAT_MOTIVOS.find(m => m.value === motivoSAT)?.label || '—' }}</dd></div>
              </dl>
            </Card>
          </div>

          <!-- Paso 3: Confirmación -->
          <div v-show="currentStep === 3 && payroll.status !== 'cancelada'" class="space-y-6" key="step-3">
            <Card class="p-6">
              <div class="flex items-center gap-3 mb-4">
                <div class="w-10 h-10 rounded-xl bg-danger-100 flex items-center justify-center">
                  <AlertCircleIcon class="w-5 h-5 text-danger-600" />
                </div>
                <div>
                  <h2 class="text-lg font-semibold text-ink">Confirmación final</h2>
                  <p class="text-sm text-ink-muted mt-1">Escribe CONFIRMO para proceder</p>
                </div>
              </div>

              <Alert v-if="cancelError" variant="danger">{{ cancelError }}</Alert>

              <div class="space-y-4">
                <div class="p-4 bg-danger-50 border border-danger-200 rounded-xl">
                  <p class="font-medium text-danger-800">⚠️ Acción irreversible</p>
                  <p class="text-sm text-danger-700 mt-1">
                    Al confirmar, se enviará la solicitud de cancelación al SAT con el motivo <strong>{{ SAT_MOTIVOS.find(m => m.value === motivoSAT)?.label }}</strong>.
                    La nómina quedará en estado "Cancelada" y no se podrá revertir.
                  </p>
                </div>

                <div>
                  <label class="block text-sm font-medium text-ink-muted mb-2">Escribe CONFIRMO para autorizar</label>
                  <Input
                    id="confirm-text"
                    v-model="confirmText"
                    placeholder="CONFIRMO"
                    :error="confirmText && confirmText !== 'CONFIRMO' ? 'Debes escribir exactamente CONFIRMO' : undefined"
                  />
                </div>

                <label class="flex items-start gap-3 p-4 rounded-xl border border-neutral-200 bg-card cursor-pointer transition-colors hover:border-primary-300">
                  <input
                    v-model="consentGiven"
                    type="checkbox"
                    class="w-5 h-5 mt-0.5 rounded border-neutral-300 text-primary-600 focus:ring-2 focus:ring-[var(--color-focus-ring)] focus:ring-offset-2"
                  />
                  <div>
                    <p class="font-medium text-ink">Entiendo que esta acción es irreversible y autorizo la cancelación ante el SAT</p>
                    <p class="text-sm text-ink-muted mt-1">Confirmo que el motivo SAT seleccionado es correcto</p>
                  </div>
                </label>
              </div>
            </Card>
          </div>

          <!-- Resultado: Cancelación enviada -->
          <div v-show="currentStep === 3 && !isCancelling && !cancelError && payroll.status === 'cancelada'" class="space-y-6" key="step-success">
            <Card class="p-6">
              <div class="text-center py-8">
                <CheckCircleIcon class="w-16 h-16 text-success-500 mx-auto" />
                <p class="font-medium text-success-800 text-lg mt-4">¡Solicitud de cancelación enviada!</p>
                <p class="text-sm text-success-700 mt-1">La solicitud ha sido enviada al SAT. Recibirás el acuse en tu correo.</p>
                <dl class="grid grid-cols-2 gap-2 text-sm mx-auto max-w-xs mt-6">
                  <div><dt class="text-ink-muted">Motivo</dt><dd class="font-medium text-ink">{{ SAT_MOTIVOS.find(m => m.value === motivoSAT)?.label }}</dd></div>
                  <div><dt class="text-ink-muted">Fecha</dt><dd class="font-medium text-ink">{{ new Date().toLocaleString('es-MX') }}</dd></div>
                </dl>
              </div>
            </Card>

            <Card class="p-6">
              <h2 class="text-lg font-semibold text-ink mb-4">Seguimiento</h2>
              <div class="space-y-3">
                <div class="p-4 bg-neutral-50 rounded-xl border border-neutral-200">
                  <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-xl bg-info-100 flex items-center justify-center">
                      <FileTextIcon class="w-5 h-5 text-info-600" />
                    </div>
                    <div>
                      <p class="font-medium text-ink">Acuse de cancelación</p>
                      <p class="text-sm text-ink-muted">Se generará automáticamente cuando el SAT procese la solicitud</p>
                    </div>
                  </div>
                </div>
                <div class="p-4 bg-neutral-50 rounded-xl border border-neutral-200">
                  <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-xl bg-warning-100 flex items-center justify-center">
                      <ClockIcon class="w-5 h-5 text-warning-600" />
                    </div>
                    <div>
                      <p class="font-medium text-ink">Estado SAT</p>
                      <p class="text-sm text-ink-muted">Pendiente de respuesta. Tiempo estimado: 24-72 horas</p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>

        <!-- Sidebar: Navegación y resumen -->
        <div class="space-y-4">
          <Card class="p-6 sticky top-24" :style="{ maxHeight: 'calc(100vh - 8rem)' }">
            <h2 class="text-lg font-semibold text-ink mb-4">Resumen</h2>
            <dl class="grid grid-cols-2 gap-3 text-sm mb-6">
              <div><dt class="text-ink-muted">Período</dt><dd class="font-medium text-ink">{{ payroll.periodLabel }}</dd></div>
              <div><dt class="text-ink-muted">Empresa</dt><dd class="font-medium text-ink">{{ payroll.companyName }}</dd></div>
              <div><dt class="text-ink-muted">Total neto</dt><dd class="font-medium text-ink text-lg text-primary-600">${{ displayNet.toLocaleString() }}</dd></div>
              <div><dt class="text-ink-muted">UUID</dt><dd class="font-mono text-xs text-ink-muted break-all">{{ payroll.uuid }}</dd></div>
            </dl>

            <div class="p-4 bg-neutral-50 rounded-xl border border-neutral-200 space-y-2">
              <p class="text-xs text-ink-muted font-medium">Progreso</p>
              <div class="progress-track">
                <div class="progress-fill bg-primary-600" :style="{ width: `${((currentStep - 1) / (maxStep - 1)) * 100}%` }" />
              </div>
              <p class="text-xs text-ink-muted text-center">Paso {{ currentStep }} de {{ maxStep }}</p>
            </div>
          </Card>

          <Card class="p-6" v-if="currentStep < maxStep || (currentStep === maxStep && (isCancelling || cancelError))">
            <div class="space-y-3">
              <Button
                v-if="currentStep > 1"
                variant="ghost"
                @click="prevStep"
                :icon="ChevronLeftIcon"
                full-width
              >
                Anterior
              </Button>
              <Button
                v-if="currentStep < maxStep"
                variant="primary"
                @click="nextStep"
                :disabled="!canProceed()"
                  :icon="currentStep === 1 ? FileTextIcon : AlertCircleIcon"
                iconRight
                full-width
              >
                {{ currentStep === 1 ? 'Continuar' : 'Confirmar cancelación' }}
              </Button>
              <Button
                v-else-if="currentStep === maxStep && isCancelling"
                variant="primary"
                :loading="isCancelling"
                full-width
              >
                Enviando al SAT...
              </Button>
              <Button
                v-else-if="currentStep === maxStep && !isCancelling && !cancelError && payroll.status !== 'cancelada'"
                variant="danger"
                @click="handleCancel"
                :disabled="!canProceed()"
                :loading="isCancelling"
                full-width
              >
                Confirmar cancelación
              </Button>
            </div>
          </Card>

          <Card class="p-6" v-if="currentStep === maxStep && !isCancelling && !cancelError && payroll.status === 'cancelada'">
            <Button variant="secondary" @click="goToPayrolls" full-width :icon="FileTextIcon">
              Volver a nóminas
            </Button>
            <Button variant="primary" @click="goToPayrolls" full-width :icon="CheckCircleIcon">
              Ver acuse
            </Button>
          </Card>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'CancelarNominaWizard',
}
</script>