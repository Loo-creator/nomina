<script setup>
import { ref, reactive, computed, watch } from 'vue'
import Modal from '@/shared/components/Modal.vue'
import Input from '@/shared/components/Input.vue'
import Select from '@/shared/components/Select.vue'
import Button from '@/shared/components/Button.vue'
import { useTenantsStore } from '@/shared/stores/tenants'
import { sanitizeText, sanitizeEmail, sanitizePhone, sanitizeDomain } from '@/shared/utils/sanitize'
import { TENANT_PLAN_LABELS } from '@/shared/utils/constants'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  tenant: { type: Object, default: null },
})

const emit = defineEmits(['update:modelValue', 'saved'])

const open = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
})

const tenantsStore = useTenantsStore()
const isSaving = computed(() => tenantsStore.isSaving)
const editingId = computed(() => props.tenant?.id ?? null)
const modalTitle = computed(() => (editingId.value ? 'Editar cliente' : 'Nuevo cliente'))

const planOptions = Object.entries(TENANT_PLAN_LABELS).map(([value, label]) => ({ value, label }))

const form = reactive({
  name: '',
  legalName: '',
  plan: 'basic',
  contactName: '',
  contactEmail: '',
  contactPhone: '',
  domain: '',
  monthlyFee: '',
  notes: '',
})
const errors = reactive({})

function resetForm() {
  Object.assign(form, {
    name: '',
    legalName: '',
    plan: 'basic',
    contactName: '',
    contactEmail: '',
    contactPhone: '',
    domain: '',
    monthlyFee: '',
    notes: '',
  })
  Object.keys(errors).forEach(k => delete errors[k])
}

watch(
  () => [props.modelValue, props.tenant],
  ([open, tenant]) => {
    if (!open) return
    if (tenant) {
      Object.assign(form, {
        name: tenant.name || '',
        legalName: tenant.legalName || '',
        plan: tenant.plan || 'basic',
        contactName: tenant.contactName || '',
        contactEmail: tenant.contactEmail || '',
        contactPhone: tenant.contactPhone || '',
        domain: tenant.domain || '',
        monthlyFee: tenant.monthlyFee ?? '',
        notes: tenant.notes || '',
      })
      Object.keys(errors).forEach(k => delete errors[k])
    } else {
      resetForm()
    }
  },
  { immediate: true },
)

function sanitizeForm() {
  return {
    name: sanitizeText(form.name, { maxLength: 120 }),
    legalName: sanitizeText(form.legalName, { maxLength: 180 }),
    plan: form.plan,
    contactName: sanitizeText(form.contactName, { maxLength: 120 }),
    contactEmail: sanitizeEmail(form.contactEmail),
    contactPhone: sanitizePhone(form.contactPhone),
    domain: sanitizeDomain(form.domain),
    monthlyFee: form.monthlyFee === '' || form.monthlyFee === null ? null : Number(form.monthlyFee),
    notes: sanitizeText(form.notes, { maxLength: 500, allowNewlines: true }),
  }
}

function validate(payload) {
  Object.keys(errors).forEach(k => delete errors[k])
  if (payload.name.length < 3) errors.name = 'El nombre del cliente es obligatorio (mín. 3 caracteres)'
  if (!payload.legalName) errors.legalName = 'La razón social es obligatoria'
  if (!planOptions.some(o => o.value === payload.plan)) errors.plan = 'Plan inválido'
  if (!payload.contactName) errors.contactName = 'El contacto es obligatorio'
  if (!payload.contactEmail) errors.contactEmail = 'El correo de contacto es obligatorio'
  else if (!/^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/.test(payload.contactEmail)) errors.contactEmail = 'Correo inválido'
  if (payload.contactPhone && !/^[+\d][\d\s().-]{6,24}$/.test(payload.contactPhone)) errors.contactPhone = 'Teléfono inválido'
  if (payload.domain && !/^(?=.{1,120}$)([a-z0-9]([a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,}$/i.test(payload.domain)) errors.domain = 'Dominio inválido (ej. empresa.com)'
  if (payload.monthlyFee !== null && (!Number.isFinite(payload.monthlyFee) || payload.monthlyFee < 0 || payload.monthlyFee > 10000000)) errors.monthlyFee = 'Monto inválido'
  return Object.keys(errors).length === 0
}

async function handleSave() {
  const payload = sanitizeForm()
  if (!validate(payload)) return

  const res = editingId.value
    ? await tenantsStore.updateTenant(editingId.value, payload)
    : await tenantsStore.createTenant(payload)

  emit('saved', res)
  if (res.ok) emit('update:modelValue', false)
}

function close() {
  emit('update:modelValue', false)
}
</script>

<template>
  <Modal v-model="open" :title="modalTitle" size="lg">
    <form class="grid grid-cols-1 sm:grid-cols-2 gap-4" @submit.prevent="handleSave">
      <div class="sm:col-span-2">
        <Input id="tenant-name" v-model="form.name" label="Nombre comercial de la cuenta" required :error="errors.name" placeholder="Grupo Acme" />
      </div>
      <div class="sm:col-span-2">
        <Input id="tenant-legal-name" v-model="form.legalName" label="Razón social / nombre legal" required :error="errors.legalName" placeholder="Grupo Acme SA de CV" />
      </div>
      <Select id="tenant-plan" v-model="form.plan" label="Plan" :options="planOptions" :error="errors.plan" />
      <Input id="tenant-fee" v-model="form.monthlyFee" type="number" min="0" step="0.01" label="Cuota mensual (MXN)" :error="errors.monthlyFee" placeholder="0.00" />
      <Input id="tenant-contact-name" v-model="form.contactName" label="Contacto principal" required :error="errors.contactName" placeholder="Lic. Rodrigo Fuentes" />
      <Input id="tenant-contact-email" v-model="form.contactEmail" type="email" label="Correo de contacto" required :error="errors.contactEmail" placeholder="contacto@empresa.com" />
      <Input id="tenant-contact-phone" v-model="form.contactPhone" label="Teléfono" :error="errors.contactPhone" placeholder="55-1234-5678" />
      <Input id="tenant-domain" v-model="form.domain" label="Dominio corporativo" :error="errors.domain" placeholder="empresa.com" />
      <div class="sm:col-span-2">
        <Input id="tenant-notes" v-model="form.notes" type="textarea" :rows="3" label="Notas internas" hint="Uso interno; no visible para el cliente. Máx. 500 caracteres." placeholder="Acuerdos, adeudos, contexto del cliente..." />
      </div>
    </form>

    <template #footer>
      <Button variant="secondary" @click="close">Cancelar</Button>
      <Button variant="primary" :loading="isSaving" @click="handleSave">Guardar</Button>
    </template>
  </Modal>
</template>
