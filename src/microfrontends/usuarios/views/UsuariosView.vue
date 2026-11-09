<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { Pencil, Trash2, Plus, ShieldCheck, MailPlus, Copy, RefreshCw, XCircle } from 'lucide-vue-next'
import PageHeader from '@/shared/components/PageHeader.vue'
import Table from '@/shared/components/Table.vue'
import Button from '@/shared/components/Button.vue'
import Badge from '@/shared/components/Badge.vue'
import Modal from '@/shared/components/Modal.vue'
import Input from '@/shared/components/Input.vue'
import Select from '@/shared/components/Select.vue'
import DataFilterBar from '@/shared/components/DataFilterBar.vue'
import { useFilteredData } from '@/shared/composables/useFilteredData'
import { useAuthStore } from '@/shared/stores/auth'
import { useToastStore } from '@/shared/stores/toast'
import { getCompanies } from '@/services/companies.service'
import { getUsers, createUser, updateUser, deleteUser } from '@/services/users.service'
import { getInvitations, createInvitation, resendInvitation, revokeInvitation } from '@/services/invitations.service'
import { ROLES, ROLE_LABELS, ROLE_HIERARCHY } from '@/shared/utils/constants'

const authStore = useAuthStore()
const toastStore = useToastStore()

const users = ref([])
const companies = ref([])
const companyOptions = computed(() =>
  companies.value.map(c => ({ value: String(c.id), label: c.name })),
)
const isLoading = ref(false)
const isSaving = ref(false)
const modalOpen = ref(false)
const confirmOpen = ref(false)
const editingId = ref(null)
const pendingDelete = ref(null)
const errors = reactive({})

const canInvite = computed(() => [ROLES.SUPERADMIN, ROLES.ADMIN].includes(authStore.userRole))
const invitations = ref([])
const isInvitesLoading = ref(false)
const inviteModalOpen = ref(false)
const isSendingInvite = ref(false)
const inviteErrors = reactive({})
const inviteForm = reactive({
  name: '',
  email: '',
  role: 'staff',
  companyIds: [],
  mfaRequired: false,
})
const revokeTarget = ref(null)
const revokeConfirmOpen = ref(false)

const roleOptions = computed(() => {
  const currentRole = authStore.userRole
  const hierarchy = ROLE_HIERARCHY[currentRole] || 0
  return Object.values(ROLES)
    .filter(r => (ROLE_HIERARCHY[r] || 0) < hierarchy)
    .map(r => ({ value: r, label: ROLE_LABELS[r] }))
})

const roleVariants = {
  [ROLES.SUPERADMIN]: 'danger',
  [ROLES.ADMIN]: 'primary',
  [ROLES.STAFF]: 'info',
  [ROLES.CLIENTE]: 'warning',
  [ROLES.EMPLEADO]: 'neutral',
}

const columns = [
  { field: 'name', header: 'Usuario', sortable: true },
  { field: 'email', header: 'Email', sortable: true },
  { field: 'role', header: 'Rol' },
  { field: 'companyNames', header: 'Compañías' },
]

const canWriteUsers = computed(() =>
  [ROLES.SUPERADMIN, ROLES.ADMIN].includes(authStore.userRole) || authStore.hasPermission('users:write'),
)

const rowActions = [
  { key: 'edit', label: 'Editar', icon: Pencil, hidden: () => !canWriteUsers.value },
  { key: 'delete', label: 'Eliminar', icon: Trash2, variant: 'danger', hidden: () => !canWriteUsers.value },
]

const filters = computed(() => [
  {
    key: 'search',
    label: 'Búsqueda',
    type: 'search',
    placeholder: 'Nombre, email...',
  },
  {
    key: 'name',
    label: 'Nombre',
    type: 'text',
    placeholder: 'Buscar nombre...',
  },
  {
    key: 'email',
    label: 'Email',
    type: 'text',
    placeholder: 'Buscar email...',
  },
  {
    key: 'role',
    label: 'Rol',
    type: 'select',
    placeholder: 'Todos los roles',
    options: roleOptions.value,
  },
  {
    key: 'status',
    label: 'Estatus',
    type: 'select',
    placeholder: 'Todos',
    options: [
      { value: 'activo', label: 'Activos' },
      { value: 'suspendido', label: 'Suspendidos' },
    ],
    filterFn: (row, value) => {
      const suspended = row.tenantStatus === 'suspended'
      return value === 'suspendido' ? suspended : !suspended
    },
  },
  {
    key: 'companyId',
    label: 'Compañía',
    type: 'select',
    placeholder: 'Todas las compañías',
    options: companyOptions.value,
    filterFn: (row, value) => (row.companies || []).map(String).includes(String(value)),
  },
])
const filterModel = ref({})

function clearFilters() {
  filterModel.value = {}
}
const filteredData = useFilteredData(users, filterModel, () => filters.value, { searchFields: ['name', 'email', 'role'] })


const visibleFilterKeys = ['role', 'companyId']

const companyIds = computed(() =>
  authStore.scopedCompanyIds
)

const modalTitle = computed(() => (editingId.value ? 'Editar usuario' : 'Nuevo usuario'))

const form = reactive({
  name: '',
  email: '',
  password: '',
  role: 'staff',
  companies: [],
})

async function loadData() {
  isLoading.value = true
  const [usersRes, compRes] = await Promise.all([
    getUsers(companyIds.value),
    getCompanies(companyIds.value),
  ])
  if (usersRes.ok) users.value = usersRes.data
  if (compRes.ok) companies.value = compRes.data
  isLoading.value = false
}

function resetForm() {
  Object.assign(form, {
    name: '',
    email: '',
    password: '',
    role: 'staff',
    companies: companyIds.value ? [...companyIds.value] : [],
  })
  Object.keys(errors).forEach(k => delete errors[k])
}

function openCreate() {
  editingId.value = null
  resetForm()
  modalOpen.value = true
}

function openEdit(row) {
  editingId.value = row.id
  Object.assign(form, {
    name: row.name,
    email: row.email,
    password: '',
    role: row.role,
    companies: [...(row.companies || [])],
  })
  modalOpen.value = true
}

function toggleCompany(id) {
  const index = form.companies.indexOf(id)
  if (index > -1) form.companies.splice(index, 1)
  else form.companies.push(id)
}

function validate() {
  Object.keys(errors).forEach(k => delete errors[k])
  if (!form.name.trim()) errors.name = 'El nombre es obligatorio'
  if (!form.email.trim()) errors.email = 'El email es obligatorio'
  else if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email)) errors.email = 'Email inválido'
  if (!editingId.value && !form.password) errors.password = 'La contraseña es obligatoria'
  else if (form.password && form.password.length < 6) errors.password = 'Mínimo 6 caracteres'
  return Object.keys(errors).length === 0
}

async function handleSave() {
  if (!validate()) return
  isSaving.value = true

  const payload = { ...form, email: form.email.toLowerCase().trim(), name: form.name.trim() }
  if (editingId.value && !payload.password) delete payload.password

  const res = editingId.value
    ? await updateUser(editingId.value, payload)
    : await createUser(payload)

  if (res.ok) {
    toastStore.success(res.message)
    modalOpen.value = false
    await loadData()
  } else {
    toastStore.error(res.message)
  }
  isSaving.value = false
}

function askDelete(row) {
  pendingDelete.value = row
  confirmOpen.value = true
}

async function confirmDelete() {
  const res = await deleteUser(pendingDelete.value.id)
  if (res.ok) {
    toastStore.success(res.message)
    await loadData()
  } else {
    toastStore.error(res.message)
  }
  confirmOpen.value = false
  pendingDelete.value = null
}

function handleAction({ action, row }) {
  if (action === 'edit') openEdit(row)
  if (action === 'delete') askDelete(row)
}

async function loadInvitations() {
  if (!canInvite.value) return
  isInvitesLoading.value = true
  const res = await getInvitations()
  if (res.ok) invitations.value = res.data
  else toastStore.error(res.message)
  isInvitesLoading.value = false
}

function openInvite() {
  Object.assign(inviteForm, { name: '', email: '', role: 'staff', companyIds: [], mfaRequired: false })
  Object.keys(inviteErrors).forEach(k => delete inviteErrors[k])
  inviteModalOpen.value = true
}

function toggleInviteCompany(id) {
  const index = inviteForm.companyIds.indexOf(id)
  if (index > -1) inviteForm.companyIds.splice(index, 1)
  else inviteForm.companyIds.push(id)
}

async function handleInviteSave() {
  Object.keys(inviteErrors).forEach(k => delete inviteErrors[k])
  if (!inviteForm.email.trim()) inviteErrors.email = 'El correo es obligatorio'
  else if (!/^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/.test(inviteForm.email.trim())) inviteErrors.email = 'Correo inválido'
  if (!roleOptions.value.some(o => o.value === inviteForm.role)) inviteErrors.role = 'Rol no permitido'
  if (Object.keys(inviteErrors).length) return

  isSendingInvite.value = true
  const res = await createInvitation({
    email: inviteForm.email,
    name: inviteForm.name,
    role: inviteForm.role,
    companyIds: [...inviteForm.companyIds],
    mfaRequired: inviteForm.mfaRequired,
    invitedBy: authStore.user?.email,
  })
  if (res.ok) {
    toastStore.success(res.message)
    inviteModalOpen.value = false
    await loadInvitations()
  } else {
    toastStore.error(res.message)
  }
  isSendingInvite.value = false
}

async function copyInviteLink(invitation) {
  const url = `${window.location.origin}/invitacion/${invitation.token}`
  try {
    await navigator.clipboard.writeText(url)
    toastStore.success('Enlace de invitación copiado al portapapeles')
  } catch {
    toastStore.info(url)
  }
}

async function handleResendInvite(invitation) {
  const res = await resendInvitation(invitation.id)
  if (res.ok) {
    toastStore.success(res.message)
    await loadInvitations()
  } else {
    toastStore.error(res.message)
  }
}

function askRevoke(invitation) {
  revokeTarget.value = invitation
  revokeConfirmOpen.value = true
}

async function confirmRevoke() {
  const res = await revokeInvitation(revokeTarget.value.id)
  if (res.ok) {
    toastStore.success(res.message)
    await loadInvitations()
  } else {
    toastStore.error(res.message)
  }
  revokeConfirmOpen.value = false
  revokeTarget.value = null
}

function inviteStatusBadge(invitation) {
  if (invitation.status === 'aceptada') return { variant: 'success', label: 'Aceptada' }
  if (invitation.status === 'revocada') return { variant: 'neutral', label: 'Revocada' }
  if (invitation.isExpired) return { variant: 'danger', label: 'Expirada' }
  if (invitation.daysLeft <= 2) return { variant: 'warning', label: `Expira en ${invitation.daysLeft}d` }
  return { variant: 'info', label: `Pendiente · ${invitation.daysLeft}d` }
}

onMounted(async () => {
  await loadData()
  await loadInvitations()
})
</script>

<template>
  <div class="space-y-7">
    <PageHeader
      title="Usuarios"
      description="Administra los accesos y roles del sistema"
      :icon="ShieldCheck"
    >
      <template #actions>
        <Button v-if="canInvite" variant="outline" :icon="MailPlus" @click="openInvite">Invitar usuario</Button>
        <Button v-if="canWriteUsers" variant="primary" :icon="Plus" @click="openCreate">Nuevo usuario</Button>
      </template>
    </PageHeader>

    <DataFilterBar
      v-model="filterModel"
      :filters="filters"
      :visible-filter-keys="visibleFilterKeys"
      :results-count="filteredData.length"
      :loading="isLoading"
      @filter-change="() => {}"
      @clear-all="clearFilters"
    />

    <Table
      :columns="columns"
      :data="filteredData"
      :loading="isLoading"
      :actions="rowActions"
      :filterable="false"
      empty-message="No hay usuarios registrados"
      @action="handleAction"
    >
      <template #name="{ row }">
        <div class="flex items-center gap-3">
          <span class="w-9 h-9 rounded-full bg-brand-gradient text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
            {{ row.name.split(' ').map(n => n[0]).slice(0, 2).join('') }}
          </span>
          <span class="font-semibold text-ink">{{ row.name }}</span>
        </div>
      </template>
      <template #role="{ row }">
        <Badge :variant="roleVariants[row.role] || 'neutral'">{{ ROLE_LABELS[row.role] || row.role }}</Badge>
      </template>
      <template #companyNames="{ row }">
        <div class="flex flex-wrap gap-1">
          <Badge v-for="name in row.companyNames" :key="name" variant="secondary" size="sm">{{ name }}</Badge>
          <span v-if="!row.companyNames?.length" class="text-xs text-ink-muted">Sin asignar</span>
        </div>
      </template>
      <template #empty-action>
        <Button v-if="canWriteUsers" variant="primary" size="sm" :icon="Plus" @click="openCreate">Añadir usuario</Button>
      </template>
    </Table>


    <section v-if="canInvite" aria-labelledby="invitaciones-title" class="card p-6">
      <div class="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <h2 id="invitaciones-title" class="font-display text-lg font-bold text-ink flex items-center gap-2">
            <MailPlus class="w-5 h-5 text-primary-500" aria-hidden="true" /> Invitaciones
          </h2>
          <p class="text-sm text-ink-muted">Enlaces de acceso enviados por correo; expiran a los 7 días</p>
        </div>
        <Button variant="secondary" size="sm" :icon="Plus" @click="openInvite">Nueva invitación</Button>
      </div>
      <div v-if="isInvitesLoading" class="py-6 text-center text-ink-muted">Cargando invitaciones…</div>
      <div v-else-if="!invitations.length" class="py-6 text-center text-ink-muted">No hay invitaciones registradas.</div>
      <div v-else class="overflow-x-auto">
        <table class="table">
          <thead>
            <tr><th>Invitado</th><th>Rol</th><th>Empresas</th><th>Enviada</th><th>Estado</th><th class="text-right">Acciones</th></tr>
          </thead>
          <tbody>
            <tr v-for="invitation in invitations" :key="invitation.id">
              <td>
                <div class="flex flex-col">
                  <span class="font-medium text-ink">{{ invitation.name || 'Invitado sin nombre' }}</span>
                  <span class="text-xs text-ink-muted">{{ invitation.email }}</span>
                </div>
              </td>
              <td><Badge variant="secondary" size="sm">{{ ROLE_LABELS[invitation.role] || invitation.role }}</Badge></td>
              <td>
                <span class="text-sm text-ink-soft">{{ invitation.companyNames?.length ? invitation.companyNames.length + ' empresa(s)' : 'Sin asignar' }}</span>
              </td>
              <td><span class="text-sm text-ink-soft">{{ new Date(invitation.createdAt).toLocaleDateString('es-MX', { dateStyle: 'medium' }) }}</span></td>
              <td><Badge :variant="inviteStatusBadge(invitation).variant" size="sm" dot>{{ inviteStatusBadge(invitation).label }}</Badge></td>
              <td>
                <div class="flex items-center justify-end gap-1">
                  <button type="button" class="p-1.5 rounded-lg text-ink-muted hover:bg-neutral-100" :title="'Copiar enlace'" :aria-label="`Copiar enlace de invitación para ${invitation.email}`" @click="copyInviteLink(invitation)">
                    <Copy class="w-4 h-4" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    class="p-1.5 rounded-lg text-ink-muted hover:bg-neutral-100 disabled:opacity-40 disabled:cursor-not-allowed"
                    :disabled="invitation.status === 'aceptada'"
                    :title="'Reenviar'"
                    :aria-label="`Reenviar invitación a ${invitation.email}`"
                    @click="handleResendInvite(invitation)"
                  >
                    <RefreshCw class="w-4 h-4" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    class="p-1.5 rounded-lg text-danger-600 hover:bg-danger-50 disabled:opacity-40 disabled:cursor-not-allowed"
                    :disabled="invitation.status === 'aceptada' || invitation.status === 'revocada'"
                    :title="'Revocar'"
                    :aria-label="`Revocar invitación de ${invitation.email}`"
                    @click="askRevoke(invitation)"
                  >
                    <XCircle class="w-4 h-4" aria-hidden="true" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <Modal v-model="inviteModalOpen" title="Invitar usuario" size="lg">
      <form class="grid grid-cols-1 sm:grid-cols-2 gap-4" @submit.prevent="handleInviteSave">
        <div class="sm:col-span-2">
          <Input id="invite-name" v-model="inviteForm.name" label="Nombre (opcional)" placeholder="Nombre del invitado" />
        </div>
        <div class="sm:col-span-2">
          <Input id="invite-email" v-model="inviteForm.email" type="email" label="Correo de invitación" required :error="inviteErrors.email" placeholder="persona@empresa.com" />
        </div>
        <Select id="invite-role" v-model="inviteForm.role" label="Rol a asignar" :options="roleOptions.value" :error="inviteErrors.role" />
        <label class="flex items-center gap-2.5 px-4 py-3 rounded-xl border border-neutral-200 bg-card cursor-pointer self-end">
          <input v-model="inviteForm.mfaRequired" type="checkbox" class="w-4 h-4 rounded border-neutral-300 text-primary-600 focus:ring-primary-500" />
          <span class="text-sm text-ink-soft">Requerir MFA al aceptar</span>
        </label>
        <div class="sm:col-span-2">
          <span class="label">Compañías asignadas</span>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <label
              v-for="company in companies"
              :key="company.id"
              class="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border border-neutral-200 bg-card cursor-pointer transition-colors hover:border-primary-300"
            >
              <input
                type="checkbox"
                :checked="inviteForm.companyIds.includes(company.id)"
                @change="toggleInviteCompany(company.id)"
                class="w-4 h-4 rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
              />
              <span class="text-sm text-ink-soft">{{ company.name }}</span>
            </label>
          </div>
        </div>
      </form>
      <template #footer>
        <Button variant="secondary" @click="inviteModalOpen = false">Cancelar</Button>
        <Button variant="primary" :icon="MailPlus" :loading="isSendingInvite" @click="handleInviteSave">Enviar invitación</Button>
      </template>
    </Modal>

    <Modal v-model="revokeConfirmOpen" title="Revocar invitación" size="sm">
      <p class="text-ink-soft">
        ¿Seguro que deseas revocar la invitación de <strong class="text-ink">{{ revokeTarget?.email }}</strong>?
        El enlace dejará de funcionar de inmediato.
      </p>
      <template #footer>
        <Button variant="secondary" @click="revokeConfirmOpen = false">Cancelar</Button>
        <Button variant="danger" @click="confirmRevoke">Revocar</Button>
      </template>
    </Modal>

    <Modal v-model="modalOpen" :title="modalTitle" size="lg">
      <form class="grid grid-cols-1 sm:grid-cols-2 gap-4" @submit.prevent="handleSave">
        <div class="sm:col-span-2">
          <Input id="user-name" v-model="form.name" label="Nombre completo" required :error="errors.name" />
        </div>
        <Input id="user-email" v-model="form.email" type="email" label="Email" required :error="errors.email" placeholder="usuario@nomikok.com" />
        <Input id="user-password" v-model="form.password" type="password" :label="editingId ? 'Nueva contraseña (opcional)' : 'Contraseña'" :required="!editingId" :error="errors.password" placeholder="Mínimo 6 caracteres" />
        <Select id="user-role" v-model="form.role" label="Rol" :options="roleOptions.value" />

        <div class="sm:col-span-2">
          <span class="label">Compañías asignadas</span>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <label
              v-for="company in companies"
              :key="company.id"
              class="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border border-neutral-200 bg-card cursor-pointer transition-colors hover:border-primary-300"
            >
              <input
                type="checkbox"
                :checked="form.companies.includes(company.id)"
                @change="toggleCompany(company.id)"
                class="w-4 h-4 rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
              />
              <span class="text-sm text-ink-soft">{{ company.name }}</span>
            </label>
          </div>
        </div>
      </form>

      <template #footer>
        <Button variant="secondary" @click="modalOpen = false">Cancelar</Button>
        <Button variant="primary" :loading="isSaving" @click="handleSave">Guardar</Button>
      </template>
    </Modal>

    <Modal v-model="confirmOpen" title="Eliminar usuario" size="sm">
      <p class="text-ink-soft">
        ¿Seguro que deseas eliminar a <strong class="text-ink">{{ pendingDelete?.name }}</strong>? Esta acción no se puede deshacer.
      </p>
      <template #footer>
        <Button variant="secondary" @click="confirmOpen = false">Cancelar</Button>
        <Button variant="danger" @click="confirmDelete">Eliminar</Button>
      </template>
    </Modal>
  </div>
</template>