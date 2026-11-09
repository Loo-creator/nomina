<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useToastStore } from '@/shared/stores/toast'
import { getPayrollById, getEmployeePayrollById, signPayroll } from '@/services/payrolls.service'
import { verifyCredentials } from '@/services/auth.service'
import { useAuthStore } from '@/shared/stores/auth'
import { ROLES, PAYROLL_STATUS } from '@/shared/utils/constants'
import Button from '@/shared/components/Button.vue'
import Alert from '@/shared/components/Alert.vue'
import Badge from '@/shared/components/Badge.vue'
import Card from '@/shared/components/Card.vue'
import Input from '@/shared/components/Input.vue'
import Loader from '@/shared/components/Loader.vue'
import {
  Lock, CheckCircle2, AlertCircle, FileText, ChevronLeft, UserRound, FileSignature,
} from 'lucide-vue-next'
import StampIcon from '@/shared/components/icons/StampIcon.vue'
import CheckCircleIcon from '@/shared/components/icons/CheckCircleIcon.vue'

const route = useRoute()
const router = useRouter()
const toastStore = useToastStore()
const authStore = useAuthStore()

const payroll = ref(null)
const isLoading = ref(true)
const isSigning = ref(false)
const signError = ref('')
const showPreview = ref(false)
const previewUrl = ref('')

const currentStep = ref(1)
const reAuthPassword = ref('')
const reAuthError = ref('')
const isVerifying = ref(false)
const consentGiven = ref(false)
const isDownloadingAcuse = ref(false)

const statusConfig = {
  pendiente: { variant: 'warning', label: 'Pendiente' },
  procesando: { variant: 'info', label: 'Procesando' },
  timbrada: { variant: 'primary', label: 'Timbrada' },
  firmada: { variant: 'success', label: 'Firmada' },
  cancelada: { variant: 'danger', label: 'Cancelada' },
  error: { variant: 'danger', label: 'Error' },
}

const isEmployee = computed(() => authStore.userRole === ROLES.EMPLEADO)
const isSigned = computed(() => payroll.value?.status === PAYROLL_STATUS.SIGNED)
const maxStep = 3

const displayTotals = computed(() => {
  if (!payroll.value) return { perceptions: 0, deductions: 0, net: 0, employees: null }
  if (isEmployee.value) {
    return {
      perceptions: payroll.value.myPerceptions ?? 0,
      deductions: payroll.value.myDeductions ?? 0,
      net: payroll.value.myNet ?? 0,
      employees: null,
    }
  }
  return {
    perceptions: payroll.value.totalPerceptions ?? 0,
    deductions: payroll.value.totalDeductions ?? 0,
    net: payroll.value.totalNet ?? 0,
    employees: payroll.value.totalEmployees ?? null,
  }
})

const stepLabels = [
  { num: 1, label: 'Verificación' },
  { num: 2, label: 'Consentimiento' },
  { num: 3, label: 'Firma' },
]

const backTarget = computed(() =>
  isEmployee.value ? 'mis-nominas' : 'nominas-timbradas',
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

    if (response.ok && !isCompanyAllowed(response.data)) {
      toastStore.error('No tienes acceso a esta nómina')
      router.replace({ name: backTarget.value })
      return
    }
    if (response.ok) {
      payroll.value = response.data
      previewUrl.value = response.data.pdfUrl || ''
    } else {
      toastStore.error('Nómina no encontrada')
      router.replace({ name: backTarget.value })
    }
  } catch {
    toastStore.error('Error al cargar la nómina')
    router.replace({ name: backTarget.value })
  } finally {
    isLoading.value = false
  }
}

async function handleReAuth() {
  reAuthError.value = ''
  if (!reAuthPassword.value) {
    reAuthError.value = 'Ingresa tu contraseña'
    return
  }
  isVerifying.value = true
  try {
    const res = await verifyCredentials(authStore.user?.email, reAuthPassword.value)
    if (res.ok) {
      reAuthPassword.value = ''
      nextStep()
    } else {
      reAuthError.value = res.message || 'Contraseña incorrecta'
    }
  } catch {
    reAuthError.value = 'Error de conexión al verificar tu identidad'
  } finally {
    isVerifying.value = false
  }
}

function nextStep() {
  if (currentStep.value < maxStep) currentStep.value++
}

function prevStep() {
  if (currentStep.value > 1) currentStep.value--
}

function canProceed() {
  if (currentStep.value === 1) return false
  if (currentStep.value === 2) return consentGiven.value
  return true
}

async function handleSign() {
  if (!payroll.value) return

  isSigning.value = true
  signError.value = ''

  try {
    const response = await signPayroll(payroll.value.id)
    if (response.ok) {
      toastStore.success('Nómina firmada correctamente')
      payroll.value = { ...payroll.value, ...response.data }
      currentStep.value = 3
    } else {
      signError.value = response.message || 'Error al firmar la nómina'
      currentStep.value = 2
    }
  } catch {
    signError.value = 'Error de conexión al firmar'
    currentStep.value = 2
  } finally {
    isSigning.value = false
  }
}

async function downloadAcuse() {
  if (!payroll.value) return
  isDownloadingAcuse.value = true
  try {
    const { buildAcusePdf, acuseFilename, downloadBlob } = await import('@/shared/utils/auditPackage')
    const buffer = buildAcusePdf(
      { ...payroll.value, signedAt: payroll.value.signedAt || new Date().toISOString() },
      authStore.user?.name,
    )
    downloadBlob(new Blob([buffer], { type: 'application/pdf' }), acuseFilename(payroll.value))
    toastStore.success('Acuse de firma descargado')
  } catch {
    toastStore.error('No se pudo generar el acuse de firma')
  } finally {
    isDownloadingAcuse.value = false
  }
}

function togglePreview() {
  showPreview.value = !showPreview.value
}

function goToPayrolls() {
  router.push(isEmployee.value ? '/mis-nominas' : '/comprobantes/nominas-timbradas')
}

onMounted(() => {
  loadPayroll()
})
</script>

<template>
  <div class="space-y-6">
    <div v-if="isLoading" class="flex justify-center py-12" aria-busy="true" aria-label="Cargando nómina">
      <Loader size="lg" />
    </div>

    <div v-else-if="payroll">
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div class="flex items-center gap-3">
          <div class="w-12 h-12 rounded-xl bg-primary-100 flex items-center justify-center">
            <StampIcon class="w-6 h-6 text-primary-600" aria-hidden="true" />
          </div>
          <div>
            <h1 class="text-2xl font-bold text-ink">{{ isEmployee ? 'Firmar mi nómina' : 'Firmar nómina' }}</h1>
            <p class="text-ink-muted mt-1">{{ payroll.periodLabel }} - {{ payroll.companyName }}</p>
          </div>
        </div>
        <Badge :variant="statusConfig[payroll.status]?.variant || 'neutral'" :label="statusConfig[payroll.status]?.label || payroll.status" dot />
      </div>

      <ol class="card p-6 flex items-center justify-between" aria-label="Progreso de firma">
        <template v-for="(step, index) in stepLabels" :key="step.num">
          <li class="flex items-center">
            <div class="flex items-center gap-2">
              <div
                :class="[
                  'w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all',
                  index + 1 < currentStep ? 'bg-success-500 text-on-success' :
                  index + 1 === currentStep ? 'bg-primary-600 text-white' :
                  'bg-neutral-200 text-neutral-500'
                ]"
                :aria-current="index + 1 === currentStep ? 'step' : undefined"
              >
                <CheckCircleIcon v-if="index + 1 < currentStep" class="w-5 h-5" aria-hidden="true" />
                <span v-else>{{ step.num }}</span>
              </div>
              <span
                class="ml-2 text-sm font-medium hidden sm:inline"
                :class="index + 1 === currentStep ? 'text-ink' : 'text-ink-muted'"
              >
                {{ step.label }}
              </span>
            </div>
            <div v-if="index < stepLabels.length - 1" class="flex-1 max-w-[120px] h-1 bg-neutral-200 mx-3 sm:mx-4" aria-hidden="true">
              <div
                class="h-full rounded-full bg-success-500 transition-all duration-300"
                :style="{ width: index + 1 < currentStep ? '100%' : '0%' }"
              />
            </div>
          </li>
        </template>
      </ol>

      <Alert v-if="signError" variant="danger">{{ signError }}</Alert>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div class="lg:col-span-2 space-y-6" aria-live="polite">
          <!-- Paso 1: Verificación de identidad -->
          <div v-show="currentStep === 1" class="space-y-6">
            <Card class="p-6">
              <div class="flex items-center gap-3 mb-4">
                <div class="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center">
                  <Lock class="w-5 h-5 text-primary-600" aria-hidden="true" />
                </div>
                <div>
                  <h2 class="text-lg font-semibold text-ink">Verificación de identidad</h2>
                  <p class="text-sm text-ink-muted mt-1">Para firmar, confirma tu contraseña</p>
                </div>
              </div>

              <Alert v-if="reAuthError" variant="danger">{{ reAuthError }}</Alert>

              <form @submit.prevent="handleReAuth">
                <Input
                  id="reauth-password"
                  v-model="reAuthPassword"
                  type="password"
                  label="Contraseña"
                  placeholder="••••••••"
                  autocomplete="current-password"
                  :error="reAuthError"
                />
                <div class="flex justify-end mt-4">
                  <Button variant="primary" type="submit" :icon="UserRound" :loading="isVerifying">
                    Verificar
                  </Button>
                </div>
              </form>
            </Card>
          </div>

          <!-- Paso 2: Consentimiento -->
          <div v-show="currentStep === 2" class="space-y-6">
            <Card class="p-6">
              <div class="flex items-center gap-3 mb-4">
                <div class="w-10 h-10 rounded-xl bg-warning-100 flex items-center justify-center">
                  <FileText class="w-5 h-5 text-warning-600" aria-hidden="true" />
                </div>
                <div>
                  <h2 class="text-lg font-semibold text-ink">Consentimiento informado</h2>
                  <p class="text-sm text-ink-muted mt-1">Lee y acepta antes de firmar</p>
                </div>
              </div>

              <div class="p-4 bg-neutral-50 rounded-xl border border-neutral-200 space-y-3">
                <p class="text-sm text-ink-soft">
                  <strong>Estás a punto de firmar la nómina: </strong>
                  <strong class="text-ink">{{ payroll.periodLabel }}</strong> de
                  <strong class="text-ink">{{ payroll.companyName }}</strong>.
                </p>
                <dl class="grid grid-cols-2 gap-2 text-sm">
                  <div><dt class="text-ink-muted">Neto:</dt><dd class="font-medium text-ink">${{ displayTotals.net.toLocaleString() }}</dd></div>
                  <div><dt class="text-ink-muted">Período:</dt><dd class="font-medium text-ink">{{ payroll.periodLabel }}</dd></div>
                  <div><dt class="text-ink-muted">Empresa:</dt><dd class="font-medium text-ink">{{ payroll.companyName }}</dd></div>
                  <div v-if="!isEmployee"><dt class="text-ink-muted">Empleados:</dt><dd class="font-medium text-ink">{{ displayTotals.employees ?? '—' }}</dd></div>
                </dl>
                <p class="text-sm text-warning-700 bg-warning-50 p-3 rounded-lg border border-warning-200">
                  <strong>Esta acción es irreversible.</strong> Al firmar, se aplicará tu firma digital al comprobante fiscal y se generará un acuse legal con validez para efectos de auditoría.
                </p>
              </div>

              <label class="flex items-start gap-3 p-4 rounded-xl border border-neutral-200 bg-card cursor-pointer transition-colors hover:border-primary-300 mt-4">
                <input
                  v-model="consentGiven"
                  type="checkbox"
                  class="w-5 h-5 mt-0.5 rounded border-neutral-300 text-primary-600 focus:ring-2 focus:ring-[var(--color-focus-ring)] focus:ring-offset-2"
                />
                <span>
                  <span class="block font-medium text-ink">Entiendo y acepto firmar digitalmente esta nómina</span>
                  <span class="block text-sm text-ink-muted mt-1">Confirmo que los datos son correctos y autorizo la firma digital</span>
                </span>
              </label>
            </Card>

            <Card class="p-6">
              <h2 class="text-lg font-semibold text-ink mb-4">Vista previa del PDF</h2>
              <div class="border border-neutral-200 rounded-xl overflow-hidden aspect-[4/3] bg-neutral-50 relative">
                <iframe
                  v-if="showPreview && previewUrl"
                  :src="previewUrl"
                  class="w-full h-full border-0"
                  title="Vista previa de la nómina"
                />
                <div v-else class="flex flex-col items-center justify-center h-full text-ink-muted p-8 text-center">
                  <StampIcon class="w-14 h-14 text-neutral-300 mb-4" aria-hidden="true" />
                  <p class="font-medium text-ink-soft">Vista previa del PDF</p>
                  <p class="text-sm mt-1">El comprobante fiscal digital se mostrará aquí</p>
                  <Button v-if="previewUrl" variant="outline" class="mt-4" @click="togglePreview">
                    {{ showPreview ? 'Ocultar' : 'Mostrar' }} vista previa
                  </Button>
                </div>
              </div>
            </Card>
          </div>

          <!-- Paso 3: Firma completada -->
          <div v-show="currentStep === 3" class="space-y-6">
            <Card class="p-6">
              <div class="text-center py-8">
                <div v-if="isSigning" class="space-y-4">
                  <Loader size="xl" class="mx-auto" />
                  <p class="text-ink-soft">Aplicando firma digital...</p>
                </div>
                <div v-else-if="signError" class="space-y-4">
                  <AlertCircle class="w-16 h-16 text-danger-500 mx-auto" aria-hidden="true" />
                  <p class="font-medium text-danger-700">Error al firmar</p>
                  <p class="text-sm text-danger-600">{{ signError }}</p>
                  <Button variant="primary" @click="currentStep = 2">
                    Reintentar
                  </Button>
                </div>
                <div v-else class="space-y-4">
                  <CheckCircle2 class="w-16 h-16 text-success-500 mx-auto" aria-hidden="true" />
                  <p class="font-medium text-success-800 text-lg">Nómina firmada correctamente</p>
                  <p class="text-sm text-success-700">El comprobante ha sido firmado digitalmente. Tu acuse está disponible para descarga.</p>
                  <dl class="grid grid-cols-1 gap-2 text-sm max-w-xs mx-auto text-left">
                    <div><dt class="text-ink-muted">Firmado el:</dt><dd class="font-medium text-ink">{{ payroll.signedAt ? new Date(payroll.signedAt).toLocaleString('es-MX') : 'Ahora' }}</dd></div>
                    <div><dt class="text-ink-muted">UUID:</dt><dd class="font-mono text-xs text-ink break-all">{{ payroll.uuid }}</dd></div>
                  </dl>
                  <div class="flex flex-wrap gap-3 justify-center mt-6">
                    <Button variant="secondary" @click="goToPayrolls">
                      {{ isEmployee ? 'Ver mis nóminas' : 'Volver a timbradas' }}
                    </Button>
                    <Button variant="primary" :icon="FileSignature" :loading="isDownloadingAcuse" @click="downloadAcuse">
                      Descargar acuse
                    </Button>
                  </div>
                </div>
              </div>
            </Card>

            <Card class="p-6" v-if="isSigned && !isSigning && !signError">
              <h2 class="text-lg font-semibold text-ink mb-4">Detalles de la nómina</h2>
              <dl class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div><dt class="text-ink-muted">Período</dt><dd class="font-medium text-ink">{{ payroll.periodLabel }}</dd></div>
                <div><dt class="text-ink-muted">Empresa</dt><dd class="font-medium text-ink">{{ payroll.companyName }}</dd></div>
                <div><dt class="text-ink-muted">{{ isEmployee ? 'Mis percepciones' : 'Total percepciones' }}</dt><dd class="font-medium text-ink">${{ displayTotals.perceptions.toLocaleString() }}</dd></div>
                <div><dt class="text-ink-muted">{{ isEmployee ? 'Mis deducciones' : 'Total deducciones' }}</dt><dd class="font-medium text-ink">${{ displayTotals.deductions.toLocaleString() }}</dd></div>
                <div><dt class="text-ink-muted">{{ isEmployee ? 'Mi neto' : 'Total neto' }}</dt><dd class="font-medium text-ink text-lg">${{ displayTotals.net.toLocaleString() }}</dd></div>
                <div v-if="!isEmployee"><dt class="text-ink-muted">Empleados</dt><dd class="font-medium text-ink">{{ displayTotals.employees ?? '—' }}</dd></div>
                <div v-if="payroll.stampedAt"><dt class="text-ink-muted">Timbrada</dt><dd class="font-medium text-ink">{{ new Date(payroll.stampedAt).toLocaleString('es-MX') }}</dd></div>
                <div><dt class="text-ink-muted">Firmada</dt><dd class="font-medium text-ink">{{ payroll.signedAt ? new Date(payroll.signedAt).toLocaleString('es-MX') : '—' }}</dd></div>
                <div class="sm:col-span-2"><dt class="text-ink-muted">UUID</dt><dd class="font-mono text-xs text-ink-muted break-all">{{ payroll.uuid }}</dd></div>
              </dl>
            </Card>
          </div>
        </div>

        <!-- Sidebar: resumen -->
        <div class="space-y-4">
          <Card class="p-6 sticky top-24" :style="{ maxHeight: 'calc(100vh - 8rem)' }">
            <h2 class="text-lg font-semibold text-ink mb-4">Resumen</h2>
            <dl class="grid grid-cols-2 gap-3 text-sm mb-6">
              <div><dt class="text-ink-muted">Período</dt><dd class="font-medium text-ink">{{ payroll.periodLabel }}</dd></div>
              <div><dt class="text-ink-muted">Empresa</dt><dd class="font-medium text-ink">{{ payroll.companyName }}</dd></div>
              <div><dt class="text-ink-muted">Estado</dt><dd><Badge :variant="statusConfig[payroll.status]?.variant || 'neutral'" :label="statusConfig[payroll.status]?.label || payroll.status" /></dd></div>
              <div><dt class="text-ink-muted">{{ isEmployee ? 'Mi neto' : 'Neto total' }}</dt><dd class="font-medium text-primary-600 text-lg">${{ displayTotals.net.toLocaleString() }}</dd></div>
            </dl>

            <div class="p-4 bg-neutral-50 rounded-xl border border-neutral-200 space-y-2">
              <p class="text-xs text-ink-muted font-medium">Progreso</p>
              <div class="progress-track" role="progressbar" :aria-valuenow="currentStep" :aria-valuemin="1" :aria-valuemax="maxStep" aria-label="Paso actual de la firma">
                <div class="progress-fill bg-primary-600" :style="{ width: `${((currentStep - 1) / (maxStep - 1)) * 100}%` }" />
              </div>
              <p class="text-xs text-ink-muted text-center tabular-nums">Paso {{ currentStep }} de {{ maxStep }}</p>
            </div>
          </Card>

          <Card class="p-6" v-if="currentStep < maxStep">
            <div class="space-y-3">
              <Button
                v-if="currentStep > 1"
                variant="ghost"
                @click="prevStep"
                :icon="ChevronLeft"
                full-width
              >
                Anterior
              </Button>
              <Button
                v-if="currentStep === 2"
                variant="primary"
                @click="handleSign"
                :disabled="!canProceed() || isSigning"
                :loading="isSigning"
                :icon="FileSignature"
                iconRight
                full-width
              >
                Firmar ahora
              </Button>
            </div>
          </Card>

          <Card class="p-6" v-if="currentStep === maxStep && !isSigning && !signError">
            <Button variant="secondary" @click="goToPayrolls" full-width>
              {{ isEmployee ? 'Volver a mis nóminas' : 'Volver a timbradas' }}
            </Button>
          </Card>
        </div>
      </div>
    </div>
  </div>
</template>
