<script setup>
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  ArrowLeft, Briefcase, Pencil, Ban, CircleCheck, Building2, Plus, Link2, Unlink,
  Mail, Phone, Globe, Calendar, Users, FileText, Receipt, ShieldCheck,
} from 'lucide-vue-next'
import Card from '@/shared/components/Card.vue'
import Alert from '@/shared/components/Alert.vue'
import Table from '@/shared/components/Table.vue'
import Button from '@/shared/components/Button.vue'
import Badge from '@/shared/components/Badge.vue'
import Modal from '@/shared/components/Modal.vue'
import Input from '@/shared/components/Input.vue'
import Select from '@/shared/components/Select.vue'
import Skeleton from '@/shared/components/Skeleton.vue'
import TenantFormModal from '@/microfrontends/clientes/components/TenantFormModal.vue'
import { useToastStore } from '@/shared/stores/toast'
import { useTenantsStore } from '@/shared/stores/tenants'
import { createCompany } from '@/services/companies.service'
import { sanitizeText, sanitizeEmail, sanitizePhone, sanitizeDomain } from '@/shared/utils/sanitize'
import { isValidDomain } from '@/shared/utils/email'
import { formatDate, formatNumber, formatCurrency } from '@/shared/utils/format'
import {
  FISCAL_REGIME_OPTIONS,
  TENANT_PLAN_LABELS,
  TENANT_STATUS_LABELS,
} from '@/shared/utils/constants'

const route = useRoute()
const router = useRouter()
const toastStore = useToastStore()
const tenantsStore = useTenantsStore()

const tenantId = computed(() => Number(route.params.id))
const tenant = computed(() => tenantsStore.currentTenant)
const isLoading = computed(() => tenantsStore.isDetailLoading)
const isSuspended = computed(() => tenant.value?.status === 'suspended')

const editOpen = ref(false)
const statusConfirmOpen = ref(false)
const createOpen = ref(false)
const assignOpen = ref(false)
const unassignTarget = ref(null)
const unassignConfirmOpen = ref(false)
const isSavingRfc = ref(false)
const isAssigning = ref(false)
const unassigned = ref([])
const assignSelection = ref('')
const rfcErrors = reactive({})

const rfcForm = reactive({
  name: '',
  rfc: '',
  regimen: '601',
  email: '',
  domain: '',
  phone: '',
  address: '',
})

const rfcColumns = [
  { field: 'rfc', header: 'RFC', sortable: true },
  { field: 'name', header: 'Razón social', sortable: true },
  { field: 'regimen', header: 'Régimen' },
  { field: 'employeeCount', header: 'Empleados', sortable: true, align: 'center' },
  { field: 'status', header: 'Estado' },
  { field: 'createdAt', header: 'Alta', sortable: true },
]

const rfcActions = [
  { key: 'unassign', label: 'Quitar de esta cuenta', icon: Unlink, variant: 'danger', disabled: () => isSavingRfc.value },
]

const assignOptions = computed(() =>
  unassigned.value.map(c => ({ value: c.id, label: `${c.rfc} — ${c.name}` })),
)

function regimeLabel(value) {
  return FISCAL_REGIME_OPTIONS.find(o => o.value === value)?.label || value || '—'
}

async function loadDetail() {
  if (!Number.isInteger(tenantId.value)) {
    toastStore.error('Identificador de cliente inválido')
    router.replace({ name: 'clientes' })
    return
  }
  const res = await tenantsStore.fetchTenantDetail(tenantId.value)
  if (!res.ok) {
    toastStore.error(res.message || 'Cliente no encontrado')
    router.replace({ name: 'clientes' })
  }
}

function openEdit() {
  editOpen.value = true
}

function handleSaved(res) {
  if (res.ok) toastStore.success(res.message)
  else toastStore.error(res.message)
}

async function confirmToggleStatus() {
  if (!tenant.value) return
  const next = tenant.value.status === 'active' ? 'suspended' : 'active'
  const res = await tenantsStore.setTenantStatus(tenant.value.id, next)
  if (res.ok) toastStore.success(res.message)
  else toastStore.error(res.message)
  statusConfirmOpen.value = false
}

function resetRfcForm() {
  Object.assign(rfcForm, { name: '', rfc: '', regimen: '601', email: '', domain: '', phone: '', address: '' })
  Object.keys(rfcErrors).forEach(k => delete rfcErrors[k])
}

function openCreateRfc() {
  resetRfcForm()
  createOpen.value = true
}

function sanitizeRfcForm() {
  return {
    name: sanitizeText(rfcForm.name, { maxLength: 180 }),
    rfc: sanitizeText(rfcForm.rfc, { maxLength: 13 }).toUpperCase(),
    regimen: rfcForm.regimen,
    email: sanitizeEmail(rfcForm.email),
    domain: sanitizeDomain(rfcForm.domain),
    phone: sanitizePhone(rfcForm.phone),
    address: sanitizeText(rfcForm.address, { maxLength: 220 }),
  }
}

function validateRfc(payload) {
  Object.keys(rfcErrors).forEach(k => delete rfcErrors[k])
  if (payload.name.length < 3) rfcErrors.name = 'La razón social es obligatoria'
  if (!/^[A-ZÑ&]{3,4}\d{6}[A-Z0-9]{3}$/.test(payload.rfc)) rfcErrors.rfc = 'RFC con formato inválido (12 o 13 caracteres)'
  if (!FISCAL_REGIME_OPTIONS.some(o => o.value === payload.regimen)) rfcErrors.regimen = 'Régimen inválido'
  if (payload.email && !/^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/.test(payload.email)) rfcErrors.email = 'Correo inválido'
  if (payload.domain && !isValidDomain(payload.domain)) rfcErrors.domain = 'Dominio inválido (ej. empresa.com)'
  return Object.keys(rfcErrors).length === 0
}

async function handleCreateRfc() {
  const payload = sanitizeRfcForm()
  if (!validateRfc(payload)) return

  isSavingRfc.value = true
  const res = await createCompany({ ...payload, tenantId: tenantId.value })
  if (res.ok) {
    toastStore.success(res.message || 'RFC creado correctamente')
    createOpen.value = false
    await tenantsStore.fetchTenantDetail(tenantId.value)
  } else {
    toastStore.error(res.message)
  }
  isSavingRfc.value = false
}

async function openAssign() {
  assignSelection.value = ''
  const res = await tenantsStore.fetchUnassignedCompanies()
  unassigned.value = res.ok ? res.data : []
  assignOpen.value = true
}

async function confirmAssign() {
  if (!assignSelection.value) return
  isAssigning.value = true
  const res = await tenantsStore.assignCompany(Number(assignSelection.value), tenantId.value)
  if (res.ok) toastStore.success(res.message)
  else toastStore.error(res.message)
  isAssigning.value = false
  assignOpen.value = false
}

function askUnassign(row) {
  unassignTarget.value = row
  unassignConfirmOpen.value = true
}

async function confirmUnassign() {
  const target = unassignTarget.value
  if (!target) return
  isSavingRfc.value = true
  const res = await tenantsStore.unassignCompany(target.id)
  if (res.ok) toastStore.success(res.message)
  else toastStore.error(res.message)
  isSavingRfc.value = false
  unassignConfirmOpen.value = false
  unassignTarget.value = null
}

function handleRfcAction({ action, row }) {
  if (action === 'unassign') askUnassign(row)
}

const statusConfirmCopy = computed(() => {
  if (!tenant.value) return { title: '', body: '', cta: '' }
  return tenant.value.status === 'active'
    ? {
        title: 'Suspender cliente',
        body: `Al suspender a ${tenant.value.name} se bloquearán los accesos y el timbrado de sus RFC emisores hasta su reactivación.`,
        cta: 'Suspender',
      }
    : {
        title: 'Reactivar cliente',
        body: `Al reactivar a ${tenant.value.name} se restablecerán los accesos y el timbrado de sus RFC emisores.`,
        cta: 'Reactivar',
      }
})

onMounted(loadDetail)
onUnmounted(() => tenantsStore.clearCurrent())
</script>

<template>
  <div class="space-y-6">
    <button
      type="button"
      class="inline-flex items-center gap-2 text-sm font-medium text-ink-muted hover:text-ink transition-colors rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)]"
      @click="router.push({ name: 'clientes' })"
    >
      <ArrowLeft class="w-4 h-4" aria-hidden="true" />
      Volver a clientes
    </button>

    <div v-if="isLoading" class="space-y-4" aria-busy="true" aria-label="Cargando cliente">
      <Skeleton height="180px" />
      <Skeleton height="320px" />
    </div>

    <template v-else-if="tenant">
      <Alert v-if="isSuspended" variant="warning" title="Cuenta suspendida">
        Esta cuenta no puede timbrar ni emitir CFDI de nómina. Reactívala para restablecer la operación de sus RFC emisores.
      </Alert>

      <Card padding="lg">
        <div class="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
          <div class="flex items-start gap-4 min-w-0">
            <div class="w-16 h-16 rounded-2xl bg-brand-gradient shadow-glow flex items-center justify-center flex-shrink-0">
              <Briefcase class="w-8 h-8 text-white" aria-hidden="true" />
            </div>
            <div class="min-w-0">
              <div class="flex flex-wrap items-center gap-2">
                <h1 class="font-display text-2xl font-extrabold text-ink tracking-tight break-words">{{ tenant.name }}</h1>
                <Badge :variant="tenant.status === 'active' ? 'success' : 'danger'" dot>
                  {{ TENANT_STATUS_LABELS[tenant.status] || tenant.status }}
                </Badge>
                <Badge variant="secondary">{{ TENANT_PLAN_LABELS[tenant.plan] || tenant.plan }}</Badge>
              </div>
              <p class="text-ink-soft mt-1 break-words">{{ tenant.legalName }}</p>
              <p class="text-xs font-mono text-ink-muted mt-1">{{ tenant.accountCode }}</p>
            </div>
          </div>
          <div class="flex flex-wrap gap-2">
            <Button variant="outline" :icon="ShieldCheck" @click="router.push({ name: 'roles-acceso', query: { tenant: tenant.id } })">Roles y accesos</Button>
            <Button variant="secondary" :icon="Pencil" @click="openEdit">Editar</Button>
            <Button
              :variant="tenant.status === 'active' ? 'danger' : 'primary'"
              :icon="tenant.status === 'active' ? Ban : CircleCheck"
              @click="statusConfirmOpen = true"
            >
              {{ tenant.status === 'active' ? 'Suspender' : 'Reactivar' }}
            </Button>
          </div>
        </div>

        <dl class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mt-6 pt-6 border-t border-neutral-100">
          <div class="flex items-start gap-3 min-w-0">
            <Mail class="w-4 h-4 mt-0.5 text-ink-muted flex-shrink-0" aria-hidden="true" />
            <div class="min-w-0">
              <dt class="text-[11px] font-semibold uppercase tracking-wide text-ink-muted">Contacto</dt>
              <dd class="text-sm text-ink truncate">{{ tenant.contactName || '—' }}</dd>
              <dd><a :href="`mailto:${tenant.contactEmail}`" class="text-xs text-primary-600 hover:underline break-all">{{ tenant.contactEmail }}</a></dd>
            </div>
          </div>
          <div class="flex items-start gap-3 min-w-0">
            <Phone class="w-4 h-4 mt-0.5 text-ink-muted flex-shrink-0" aria-hidden="true" />
            <div class="min-w-0">
              <dt class="text-[11px] font-semibold uppercase tracking-wide text-ink-muted">Teléfono</dt>
              <dd><a :href="`tel:${tenant.contactPhone}`" class="text-sm text-ink hover:underline">{{ tenant.contactPhone || '—' }}</a></dd>
            </div>
          </div>
          <div class="flex items-start gap-3 min-w-0">
            <Globe class="w-4 h-4 mt-0.5 text-ink-muted flex-shrink-0" aria-hidden="true" />
            <div class="min-w-0">
              <dt class="text-[11px] font-semibold uppercase tracking-wide text-ink-muted">Dominio</dt>
              <dd class="text-sm text-ink break-all">{{ tenant.domain || '—' }}</dd>
            </div>
          </div>
          <div class="flex items-start gap-3 min-w-0">
            <Receipt class="w-4 h-4 mt-0.5 text-ink-muted flex-shrink-0" aria-hidden="true" />
            <div class="min-w-0">
              <dt class="text-[11px] font-semibold uppercase tracking-wide text-ink-muted">Cuota mensual</dt>
              <dd class="text-sm text-ink">{{ tenant.monthlyFee != null ? formatCurrency(tenant.monthlyFee) : '—' }}</dd>
            </div>
          </div>
          <div class="flex items-start gap-3 min-w-0">
            <Calendar class="w-4 h-4 mt-0.5 text-ink-muted flex-shrink-0" aria-hidden="true" />
            <div class="min-w-0">
              <dt class="text-[11px] font-semibold uppercase tracking-wide text-ink-muted">Alta</dt>
              <dd class="text-sm text-ink">{{ formatDate(tenant.createdAt) }}</dd>
            </div>
          </div>
          <div class="flex items-start gap-3 min-w-0">
            <Building2 class="w-4 h-4 mt-0.5 text-ink-muted flex-shrink-0" aria-hidden="true" />
            <div class="min-w-0">
              <dt class="text-[11px] font-semibold uppercase tracking-wide text-ink-muted">RFC emisores</dt>
              <dd class="text-sm text-ink">{{ tenant.rfcCount }} ({{ tenant.activeRfcCount }} activos)</dd>
            </div>
          </div>
          <div class="flex items-start gap-3 min-w-0">
            <Users class="w-4 h-4 mt-0.5 text-ink-muted flex-shrink-0" aria-hidden="true" />
            <div class="min-w-0">
              <dt class="text-[11px] font-semibold uppercase tracking-wide text-ink-muted">Empleados</dt>
              <dd class="text-sm text-ink">{{ formatNumber(tenant.employeeCount) }}</dd>
            </div>
          </div>
          <details class="xl:col-span-4 rounded-xl border border-neutral-200 bg-neutral-50/60">
            <summary class="px-4 py-3 cursor-pointer text-xs font-semibold uppercase tracking-wide text-ink-muted list-none flex items-center gap-2">
              <FileText class="w-4 h-4" aria-hidden="true" />
              Notas internas
            </summary>
            <div class="px-4 pb-4 max-h-40 overflow-y-auto">
              <p class="text-sm text-ink whitespace-pre-line break-words">{{ tenant.notes || 'Sin notas.' }}</p>
            </div>
          </details>
        </dl>
      </Card>

      <section aria-labelledby="rfc-section-title">
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
          <div class="flex items-center gap-3">
            <h2 id="rfc-section-title" class="font-display text-lg font-bold text-ink">RFC emisores</h2>
            <Badge variant="neutral">{{ tenant.companies?.length || 0 }}</Badge>
          </div>
          <div class="flex flex-wrap gap-2">
            <Button variant="outline" :icon="Link2" :disabled="isSuspended" @click="openAssign">Asignar existente</Button>
            <Button variant="primary" :icon="Plus" :disabled="isSuspended" @click="openCreateRfc">Crear RFC</Button>
          </div>
        </div>

        <Table
          :columns="rfcColumns"
          :data="tenant.companies || []"
          :actions="rfcActions"
          :filterable="false"
          :pagination="false"
          empty-message="Esta cuenta aún no tiene RFC emisores"
          empty-description="Crea un RFC nuevo o asigna una empresa existente sin cuenta"
          @action="handleRfcAction"
        >
          <template #rfc="{ row }">
            <span class="font-mono text-xs text-ink-soft">{{ row.rfc }}</span>
          </template>
          <template #name="{ row }">
            <span class="font-semibold text-ink">{{ row.name }}</span>
          </template>
          <template #regimen="{ row }">
            <span class="text-xs text-ink-soft">{{ regimeLabel(row.regimen) }}</span>
          </template>
          <template #status="{ row }">
            <Badge :variant="row.status === 'active' ? 'success' : 'neutral'" dot>
              {{ row.status === 'active' ? 'Activa' : 'Inactiva' }}
            </Badge>
          </template>
          <template #createdAt="{ row }">
            <span class="text-sm text-ink-soft">{{ formatDate(row.createdAt) }}</span>
          </template>
        </Table>
      </section>
    </template>

    <TenantFormModal v-model="editOpen" :tenant="tenant" @saved="handleSaved" />

    <Modal v-model="statusConfirmOpen" :title="statusConfirmCopy.title" size="sm">
      <p class="text-ink-soft">{{ statusConfirmCopy.body }}</p>
      <template #footer>
        <Button variant="secondary" @click="statusConfirmOpen = false">Cancelar</Button>
        <Button
          :variant="tenant?.status === 'active' ? 'danger' : 'primary'"
          :loading="tenantsStore.isSaving"
          @click="confirmToggleStatus"
        >
          {{ statusConfirmCopy.cta }}
        </Button>
      </template>
    </Modal>

    <Modal v-model="createOpen" title="Crear RFC emisor" size="lg">
      <form class="grid grid-cols-1 sm:grid-cols-2 gap-4" @submit.prevent="handleCreateRfc">
        <div class="sm:col-span-2">
          <Input id="rfc-name" v-model="rfcForm.name" label="Razón social" required :error="rfcErrors.name" placeholder="Acme Logística SA de CV" />
        </div>
        <Input id="rfc-rfc" v-model="rfcForm.rfc" label="RFC" required :error="rfcErrors.rfc" placeholder="ACM010101AAA" />
        <Select id="rfc-regimen" v-model="rfcForm.regimen" label="Régimen fiscal" :options="FISCAL_REGIME_OPTIONS" :error="rfcErrors.regimen" />
        <Input id="rfc-email" v-model="rfcForm.email" type="email" label="Correo de contacto" :error="rfcErrors.email" placeholder="contacto@empresa.com" />
        <Input id="rfc-domain" v-model="rfcForm.domain" label="Dominio corporativo" :error="rfcErrors.domain" placeholder="empresa.com" />
        <Input id="rfc-phone" v-model="rfcForm.phone" label="Teléfono" placeholder="55-1234-5678" />
        <div class="sm:col-span-2">
          <Input id="rfc-address" v-model="rfcForm.address" label="Dirección fiscal" placeholder="Calle, número, colonia, ciudad" />
        </div>
      </form>
      <template #footer>
        <Button variant="secondary" @click="createOpen = false">Cancelar</Button>
        <Button variant="primary" :loading="isSavingRfc" @click="handleCreateRfc">Crear RFC</Button>
      </template>
    </Modal>

    <Modal v-model="assignOpen" title="Asignar empresa existente" size="sm">
      <div class="space-y-3">
        <p class="text-sm text-ink-soft">Selecciona una empresa que aún no pertenece a ninguna cuenta de cliente.</p>
        <Select
          v-if="assignOptions.length"
          id="assign-company"
          v-model="assignSelection"
          label="Empresa sin asignar"
          :options="assignOptions"
          placeholder="Selecciona una empresa"
          searchable
        />
        <Alert v-else variant="info" title="Sin empresas disponibles">
          Todas las empresas registradas ya pertenecen a una cuenta. Crea un RFC nuevo en su lugar.
        </Alert>
      </div>
      <template #footer>
        <Button variant="secondary" @click="assignOpen = false">Cancelar</Button>
        <Button variant="primary" :loading="isAssigning" :disabled="!assignSelection" @click="confirmAssign">Asignar</Button>
      </template>
    </Modal>

    <Modal v-model="unassignConfirmOpen" title="Quitar RFC de la cuenta" size="sm">
      <p class="text-ink-soft">
        ¿Seguro que deseas desasignar <strong class="text-ink">{{ unassignTarget?.name }}</strong> ({{ unassignTarget?.rfc }})?
        La empresa quedará sin cuenta y no timbrará hasta que se le asigne una.
      </p>
      <template #footer>
        <Button variant="secondary" @click="unassignConfirmOpen = false">Cancelar</Button>
        <Button variant="danger" :loading="isSavingRfc" @click="confirmUnassign">Quitar</Button>
      </template>
    </Modal>
  </div>
</template>
