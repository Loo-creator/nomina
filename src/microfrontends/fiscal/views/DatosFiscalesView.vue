<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { Building2, Save, FileKey, ShieldCheck, Upload, AlertTriangle, CheckCircle, AlertCircle, Download } from 'lucide-vue-next'
import PageHeader from '@/shared/components/PageHeader.vue'
import Button from '@/shared/components/Button.vue'
import Badge from '@/shared/components/Badge.vue'
import Input from '@/shared/components/Input.vue'
import Select from '@/shared/components/Select.vue'
import Card from '@/shared/components/Card.vue'
import Alert from '@/shared/components/Alert.vue'
import { useAuthStore } from '@/shared/stores/auth'
import { useToastStore } from '@/shared/stores/toast'
import { ROLES } from '@/shared/utils/constants'
import { getCompanies } from '@/services/companies.service'
import { getFiscalDataByCompany, upsertFiscalData, testPacConnection } from '@/services/fiscal.service'

const authStore = useAuthStore()
const toastStore = useToastStore()

const isAdminOrStaff = computed(() => [ROLES.ADMIN, ROLES.STAFF, ROLES.CLIENTE].includes(authStore.userRole))

const companies = ref([])
const selectedCompany = ref('')
const isLoading = ref(false)
const isSaving = ref(false)
const isTestingPac = ref(false)
const errors = reactive({})

const environmentOptions = [
  { value: 'production', label: 'Producción' },
  { value: 'testing', label: 'Pruebas' },
]

const pacOptions = [
  { value: 'Factura.com', label: 'Factura.com' },
  { value: 'SW Sapien', label: 'SW Sapien' },
  { value: 'Finkok', label: 'Finkok' },
  { value: 'Edicom', label: 'Edicom' },
]

const form = reactive({
  csdFile: '',
  keyFile: '',
  keyPassword: '',
  certificateNumber: '',
  expiryDate: '',
  pacProvider: 'Factura.com',
  pacUsername: '',
  pacPassword: '',
  environment: 'production',
})

const companyIds = computed(() =>
  authStore.scopedCompanyIds
)

const companyOptions = computed(() =>
  companies.value.map(c => ({ value: String(c.id), label: c.name }))
)

function fileStem(name) {
  return String(name || '').replace(/\.(cer|key)$/i, '').toLowerCase().replace(/[^a-z0-9]/g, '')
}

const filePairStatus = computed(() => {
  if (!form.csdFile || !form.keyFile) return 'incomplete'
  return fileStem(form.csdFile) === fileStem(form.keyFile) ? 'match' : 'mismatch'
})

const certificateValid = computed(() => {
  if (!form.expiryDate) return null
  const daysLeft = Math.ceil((new Date(form.expiryDate) - new Date()) / (1000 * 60 * 60 * 24))
  return { valid: new Date(form.expiryDate) > new Date(), daysLeft }
})

async function loadCompanies() {
  const res = await getCompanies(companyIds.value)
  if (res.ok) {
    companies.value = res.data
    if (!selectedCompany.value && res.data.length) selectedCompany.value = String(res.data[0].id)
  }
}

async function loadFiscalData() {
  if (!selectedCompany.value) return
  isLoading.value = true
  const res = await getFiscalDataByCompany(selectedCompany.value)
  const data = res.data
  Object.assign(form, {
    csdFile: data?.csdFile || '',
    keyFile: data?.keyFile || '',
    keyPassword: '',
    certificateNumber: data?.certificateNumber || '',
    expiryDate: data?.expiryDate || '',
    pacProvider: data?.pacProvider || 'Factura.com',
    pacUsername: data?.pacUsername || '',
    pacPassword: '',
    environment: data?.environment || 'production',
  })
  isLoading.value = false
}

function onFile(kind, event) {
  const file = event.target.files?.[0]
  if (file) {
    // Validar tipo de archivo
    if (kind === 'csdFile' && file.name.endsWith('.cer')) form[kind] = file.name
    else if (kind === 'keyFile' && file.name.endsWith('.key')) form[kind] = file.name
    else toastStore.error(`El archivo debe ser .${kind === 'csdFile' ? 'cer' : 'key'}`)
  }
}

async function handleSave() {
  Object.keys(errors).forEach(k => delete errors[k])
  if (filePairStatus.value === 'mismatch') {
    errors.keyFile = 'El .cer y el .key no corresponden: se espera el mismo identificador (RFC) en ambos archivos'
    toastStore.error('Par de archivos no coincidente')
    return
  }
  if (!form.certificateNumber.trim()) errors.certificateNumber = 'El número de certificado es obligatorio'
  if (!form.expiryDate) errors.expiryDate = 'La fecha de vencimiento es obligatoria'
  if (Object.keys(errors).length) return

  isSaving.value = true
  const payload = { ...form }
  if (!payload.keyPassword) delete payload.keyPassword
  if (!payload.pacPassword) delete payload.pacPassword

  const res = await upsertFiscalData(selectedCompany.value, payload)
  if (res.ok) toastStore.success(res.message)
  else toastStore.error(res.message)
  isSaving.value = false
}

async function handleTestPac() {
  if (!form.pacProvider || !form.pacUsername) {
    toastStore.warning('Selecciona un PAC y usuario antes de probar')
    return
  }
  isTestingPac.value = true
  try {
    const res = await testPacConnection(form)
    if (res.ok) {
      toastStore.success('Conexión con PAC exitosa')
    } else {
      toastStore.error(res.message || 'Error de conexión con PAC')
    }
  } catch {
    toastStore.error('Error al probar conexión')
  } finally {
    isTestingPac.value = false
  }
}

watch(selectedCompany, loadFiscalData)

onMounted(async () => {
  await loadCompanies()
  await loadFiscalData()
})
</script>

<template>
  <div class="space-y-7">
    <PageHeader
      title="Datos fiscales"
      description="Certificados CSD y credenciales del PAC."
      :icon="Building2"
    />

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div class="lg:col-span-2 card p-6 space-y-5">
        <Select
          id="fiscal-company"
          v-model="selectedCompany"
          label="Compañía"
          :options="companyOptions"
          placeholder="Selecciona una compañía"
        />

        <Card class="p-5 space-y-4" v-if="selectedCompany">
          <h3 class="font-semibold text-ink">Certificados CSD</h3>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <span class="label">Certificado CSD (.cer)</span>
              <label class="flex items-center gap-3 px-4 py-3 rounded-xl border border-dashed border-neutral-300 bg-neutral-50/40 cursor-pointer hover:border-primary-300 transition-colors">
                <Upload class="w-5 h-5 text-ink-muted" aria-hidden="true" />
                <span class="text-sm text-ink-soft truncate">{{ form.csdFile || 'Seleccionar archivo .cer' }}</span>
                <input type="file" accept=".cer" class="hidden" @change="onFile('csdFile', $event)" />
              </label>
            </div>
            <div>
              <span class="label">Llave privada (.key)</span>
              <label class="flex items-center gap-3 px-4 py-3 rounded-xl border border-dashed border-neutral-300 bg-neutral-50/40 cursor-pointer hover:border-primary-300 transition-colors">
                <FileKey class="w-5 h-5 text-ink-muted" aria-hidden="true" />
                <span class="text-sm text-ink-soft truncate">{{ form.keyFile || 'Seleccionar archivo .key' }}</span>
                <input type="file" accept=".key" class="hidden" @change="onFile('keyFile', $event)" />
              </label>
            </div>
            <div class="sm:col-span-2 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-neutral-200 bg-neutral-50/60 px-4 py-3">
              <span class="text-sm text-ink-soft">Par de archivos</span>
              <Badge v-if="filePairStatus === 'match'" variant="success" dot>Par .cer/.key coincidente</Badge>
              <Badge v-else-if="filePairStatus === 'mismatch'" variant="danger" dot>No coinciden (mismo RFC esperado)</Badge>
              <Badge v-else variant="neutral" dot>Selecciona ambos archivos</Badge>
            </div>
            <p v-if="errors.keyFile" class="sm:col-span-2 text-xs text-danger-600" role="alert">{{ errors.keyFile }}</p>
            <Input id="fiscal-keypass" v-model="form.keyPassword" type="password" label="Contraseña de la llave" placeholder="Dejar vacío para conservar" />
            <Input id="fiscal-certnum" v-model="form.certificateNumber" label="Número de certificado" required :error="errors.certificateNumber" placeholder="30001000000300023456" />
            <Input id="fiscal-expiry" v-model="form.expiryDate" type="date" label="Fecha de vencimiento" required :error="errors.expiryDate" />
          </div>
        </Card>

        <Card class="p-5 space-y-4" v-if="selectedCompany">
          <div class="flex items-center justify-between mb-2">
            <h3 class="font-semibold text-ink">Credenciales PAC</h3>
            <Badge :variant="form.environment === 'production' ? 'primary' : 'info'">
              {{ form.environment === 'production' ? 'Producción' : 'Pruebas' }}
            </Badge>
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select id="fiscal-env" v-model="form.environment" label="Ambiente" :options="environmentOptions" />
            <Select id="fiscal-pac" v-model="form.pacProvider" label="Proveedor PAC" :options="pacOptions" />
            <Input id="fiscal-pacuser" v-model="form.pacUsername" label="Usuario PAC" placeholder="usuario" />
            <div class="sm:col-span-2 flex items-center gap-3">
              <Input id="fiscal-pacpass" v-model="form.pacPassword" type="password" label="Contraseña PAC" placeholder="Dejar vacío para conservar" class="flex-1" />
              <Button variant="outline" :icon="ShieldCheck" :loading="isTestingPac" @click="handleTestPac" :disabled="isTestingPac || !form.pacProvider || !form.pacUsername">
                Probar conexión
              </Button>
            </div>
          </div>
        </Card>

        <div class="flex justify-end">
          <Button variant="primary" :icon="Save" :loading="isSaving" @click="handleSave">Guardar datos fiscales</Button>
        </div>
      </div>

      <div class="space-y-4">
        <Card class="p-6 space-y-4">
          <div class="flex items-center justify-between mb-2">
            <h2 class="font-display font-bold text-ink">Estado del certificado</h2>
            <Badge :variant="form.environment === 'production' ? 'primary' : 'info'">
              {{ form.environment === 'production' ? 'Producción' : 'Pruebas' }}
            </Badge>
          </div>

          <div class="p-4 rounded-2xl border border-neutral-100 bg-neutral-50/50 space-y-3">
            <div class="flex items-center justify-between">
              <span class="text-sm text-ink-muted">CSD</span>
              <Badge :variant="form.csdFile ? 'success' : 'warning'" dot>{{ form.csdFile ? 'Cargado' : 'Pendiente' }}</Badge>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-sm text-ink-muted">Llave privada</span>
              <Badge :variant="form.keyFile ? 'success' : 'warning'" dot>{{ form.keyFile ? 'Cargada' : 'Pendiente' }}</Badge>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-sm text-ink-muted">Vigencia</span>
              <div v-if="certificateValid === null" class="flex items-center gap-2">
                <Badge variant="neutral">Sin fecha</Badge>
                <span class="text-xs text-ink-muted">Configura la fecha de vencimiento</span>
              </div>
              <div v-else class="flex items-center gap-2">
                <Badge :variant="certificateValid.valid ? 'success' : 'danger'" dot>
                  {{ certificateValid.valid ? 'Vigente' : 'Vencido' }}
                </Badge>
                <span class="text-xs" :class="certificateValid.valid ? 'text-success-600' : 'text-danger-600'">
                  {{ certificateValid.valid ? certificateValid.daysLeft + ' días restantes' : 'Renueva urgentemente' }}
                </span>
              </div>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-sm text-ink-muted">Ambiente</span>
              <Badge :variant="form.environment === 'production' ? 'primary' : 'info'">
                {{ form.environment === 'production' ? 'Producción' : 'Pruebas' }}
              </Badge>
            </div>
          </div>

          <div v-if="certificateValid !== null && !certificateValid.valid" class="p-4 rounded-2xl bg-danger-50 border border-danger-200">
            <div class="flex items-start gap-3">
              <AlertCircle class="w-5 h-5 text-danger-500 flex-shrink-0 mt-0.5" aria-hidden="true" />
              <div>
                <p class="font-medium text-danger-800">Certificado vencido</p>
                <p class="text-sm text-danger-700 mt-1">El certificado CSD ha expirado. No podrás timbrar nóminas hasta renovarlo.</p>
              </div>
            </div>
          </div>
          <div v-else-if="certificateValid !== null && certificateValid.daysLeft <= 30" class="p-4 rounded-2xl bg-warning-50 border border-warning-200">
            <div class="flex items-start gap-3">
              <AlertTriangle class="w-5 h-5 text-warning-500 flex-shrink-0 mt-0.5" aria-hidden="true" />
              <div>
                <p class="font-medium text-warning-800">Certificado por vencer</p>
                <p class="text-sm text-warning-700 mt-1">Quedan {{ certificateValid.daysLeft }} días. Inicia el proceso de renovación con tu proveedor.</p>
              </div>
            </div>
          </div>
          <div v-else-if="certificateValid !== null" class="p-4 rounded-2xl bg-success-50 border border-success-200">
            <div class="flex items-start gap-3">
              <CheckCircle class="w-5 h-5 text-success-500 flex-shrink-0 mt-0.5" aria-hidden="true" />
              <p class="text-sm text-success-800">Certificado vigente ({{ certificateValid.daysLeft }} días restantes)</p>
            </div>
          </div>
        </Card>

        <Card class="p-6">
          <div class="flex items-start gap-3 p-4 rounded-2xl bg-info-50 border border-info-200">
            <ShieldCheck class="w-5 h-5 text-info-600 flex-shrink-0 mt-0.5" aria-hidden="true" />
            <p class="text-sm text-info-800">La información de certificados se guarda de forma simulada en este prototipo. En producción, usa almacenamiento seguro (KMS/HSM).</p>
          </div>
        </Card>
      </div>
    </div>
  </div>
</template>