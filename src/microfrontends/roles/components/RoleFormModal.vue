<script setup>
import { ref, reactive, computed, watch } from 'vue'
import Modal from '@/shared/components/Modal.vue'
import Input from '@/shared/components/Input.vue'
import Button from '@/shared/components/Button.vue'
import { useTenantAccessStore } from '@/shared/stores/tenantAccess'
import { sanitizeText } from '@/shared/utils/sanitize'
import { TENANT_PERMISSIONS, TENANT_PERMISSION_GROUPS } from '@/shared/utils/constants'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  role: { type: Object, default: null },
  tenantId: { type: Number, required: true },
})

const emit = defineEmits(['update:modelValue', 'saved'])

const accessStore = useTenantAccessStore()
const isSaving = computed(() => accessStore.isSaving)
const editingId = computed(() => props.role?.id ?? null)
const isSystem = computed(() => Boolean(props.role?.isSystem))
const modalTitle = computed(() => (editingId.value ? 'Editar rol' : 'Nuevo rol'))

const open = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
})

const form = reactive({
  name: '',
  description: '',
  permissions: [],
})
const errors = reactive({})

const groupedPermissions = computed(() =>
  TENANT_PERMISSION_GROUPS.map(group => ({
    group,
    items: TENANT_PERMISSIONS.filter(p => p.group === group),
  })),
)

const selectedCount = computed(() => form.permissions.length)
const allCount = TENANT_PERMISSIONS.length

watch(
  () => [props.modelValue, props.role],
  ([isOpen, role]) => {
    if (!isOpen) return
    Object.assign(form, {
      name: role?.name ?? '',
      description: role?.description ?? '',
      permissions: role?.permissions ? [...role.permissions] : [],
    })
    Object.keys(errors).forEach(k => delete errors[k])
  },
  { immediate: true },
)

function groupValues(items) {
  return items.map(p => p.value)
}

function isGroupChecked(items) {
  return groupValues(items).every(v => form.permissions.includes(v))
}

function toggleGroup(items) {
  const values = groupValues(items)
  if (isGroupChecked(items)) {
    form.permissions = form.permissions.filter(p => !values.includes(p))
  } else {
    form.permissions = [...new Set([...form.permissions, ...values])]
  }
}

function togglePermission(value) {
  form.permissions = form.permissions.includes(value)
    ? form.permissions.filter(p => p !== value)
    : [...form.permissions, value]
}

function validate(payload) {
  Object.keys(errors).forEach(k => delete errors[k])
  if (!isSystem.value && payload.name.length < 3) errors.name = 'El nombre debe tener al menos 3 caracteres'
  if (!payload.permissions.length) errors.permissions = 'Selecciona al menos un permiso'
  return Object.keys(errors).length === 0
}

async function handleSave() {
  const payload = {
    name: sanitizeText(form.name, { maxLength: 60 }),
    description: sanitizeText(form.description, { maxLength: 240 }),
    permissions: [...new Set(form.permissions)],
  }
  if (!validate(payload)) return

  const res = editingId.value
    ? await accessStore.updateRole(editingId.value, props.tenantId, payload)
    : await accessStore.createRole(props.tenantId, payload)

  emit('saved', res)
  if (res.ok) emit('update:modelValue', false)
}

function close() {
  emit('update:modelValue', false)
}
</script>

<template>
  <Modal v-model="open" :title="modalTitle" size="lg">
    <form class="space-y-5" @submit.prevent="handleSave">
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div class="sm:col-span-2">
          <Input
            id="role-name"
            v-model="form.name"
            label="Nombre del rol"
            required
            :error="errors.name"
            :disabled="isSystem"
            :hint="isSystem ? 'Los roles base no se pueden renombrar' : ''"
            placeholder="Ej. Supervisor de nómina"
          />
        </div>
        <div class="sm:col-span-2">
          <Input
            id="role-description"
            v-model="form.description"
            label="Descripción"
            placeholder="Qué puede hacer quien tenga este rol"
          />
        </div>
      </div>

      <fieldset>
        <div class="flex items-center justify-between gap-4 mb-2">
          <legend class="label !mb-0">Permisos <span class="text-ink-muted font-normal">({{ selectedCount }} de {{ allCount }})</span></legend>
          <p v-if="errors.permissions" class="text-xs text-danger-600" role="alert">{{ errors.permissions }}</p>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-80 overflow-y-auto pr-1">
          <div v-for="{ group, items } in groupedPermissions" :key="group" class="rounded-xl border border-neutral-200 p-3">
            <div class="flex items-center justify-between gap-2 mb-2">
              <p class="text-xs font-bold uppercase tracking-wide text-ink-muted">{{ group }}</p>
              <button
                type="button"
                class="text-[11px] font-semibold text-primary-600 hover:text-primary-700 rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)]"
                @click="toggleGroup(items)"
              >
                {{ isGroupChecked(items) ? 'Quitar todos' : 'Todos' }}
              </button>
            </div>
            <ul class="space-y-1.5">
              <li v-for="permission in items" :key="permission.value">
                <label class="flex items-start gap-2 text-sm text-ink cursor-pointer rounded-lg px-1.5 py-1 hover:bg-neutral-50">
                  <input
                    type="checkbox"
                    class="mt-0.5 w-4 h-4 rounded border-neutral-300 text-primary-600 focus:ring-2 focus:ring-[var(--color-focus-ring)]"
                    :checked="form.permissions.includes(permission.value)"
                    @change="togglePermission(permission.value)"
                  />
                  <span>{{ permission.label }}</span>
                </label>
              </li>
            </ul>
          </div>
        </div>
      </fieldset>
    </form>

    <template #footer>
      <Button variant="secondary" @click="close">Cancelar</Button>
      <Button variant="primary" :loading="isSaving" @click="handleSave">Guardar</Button>
    </template>
  </Modal>
</template>
