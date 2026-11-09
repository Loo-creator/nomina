<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  ShieldCheck, Plus, Pencil, Trash2, Users, Loader2, Info,
} from 'lucide-vue-next'
import PageHeader from '@/shared/components/PageHeader.vue'
import Card from '@/shared/components/Card.vue'
import Alert from '@/shared/components/Alert.vue'
import Table from '@/shared/components/Table.vue'
import Button from '@/shared/components/Button.vue'
import Badge from '@/shared/components/Badge.vue'
import Select from '@/shared/components/Select.vue'
import Modal from '@/shared/components/Modal.vue'
import Skeleton from '@/shared/components/Skeleton.vue'
import RoleFormModal from '@/microfrontends/roles/components/RoleFormModal.vue'
import { useAuthStore } from '@/shared/stores/auth'
import { useToastStore } from '@/shared/stores/toast'
import { useTenantsStore } from '@/shared/stores/tenants'
import { useTenantAccessStore } from '@/shared/stores/tenantAccess'
import { getCompanies } from '@/services/companies.service'
import { ROLES, TENANT_PERMISSION_LABELS } from '@/shared/utils/constants'
import { formatDate } from '@/shared/utils/format'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const toastStore = useToastStore()
const tenantsStore = useTenantsStore()
const accessStore = useTenantAccessStore()

const isPlatformAdmin = computed(() =>
  [ROLES.SUPERADMIN, ROLES.ADMIN].includes(authStore.userRole),
)

const tenantOptions = computed(() =>
  tenantsStore.tenants.map(t => ({ value: t.id, label: `${t.name} (${t.accountCode})` })),
)

const selectedTenantId = ref(null)
const effectiveTenantId = computed(() =>
  isPlatformAdmin.value ? Number(selectedTenantId.value) || null : authStore.userTenantId,
)
const activeTenant = computed(() =>
  tenantsStore.tenants.find(t => t.id === effectiveTenantId.value) || tenantsStore.currentTenant,
)
const isSuspended = computed(() => activeTenant.value?.status === 'suspended')

const companies = ref([])
const companiesLoading = ref(false)
const selectedCompanyId = ref(null)

const activeTab = ref('catalogo')
const roleModalOpen = ref(false)
const editingRole = ref(null)
const deleteConfirmOpen = ref(false)
const pendingDelete = ref(null)

const roles = computed(() => accessStore.roles)
const members = computed(() => accessStore.members)

const roleOptions = computed(() =>
  roles.value.map(r => ({ value: r.id, label: r.name })),
)

const assignmentOptions = computed(() => [
  { value: '', label: 'Sin acceso' },
  ...roleOptions.value,
])

const roleColumns = [
  { field: 'name', header: 'Rol', sortable: true },
  { field: 'description', header: 'Descripción' },
  { field: 'permissions', header: 'Permisos', align: 'center' },
  { field: 'userCount', header: 'Asignaciones', sortable: true, align: 'center' },
  { field: 'createdAt', header: 'Alta', sortable: true },
]

const roleActions = [
  { key: 'edit', label: 'Editar', icon: Pencil, disabled: () => isSuspended.value },
  { key: 'delete', label: 'Eliminar', icon: Trash2, variant: 'danger', hidden: (row) => row.isSystem, disabled: () => isSuspended.value },
]

function effectivePermissionsLabel(roleId) {
  if (!roleId) return ''
  const role = roles.value.find(r => r.id === roleId)
  if (!role) return ''
  const labels = role.permissions.map(p => TENANT_PERMISSION_LABELS[p] || p)
  return `${role.permissions.length} permiso(s): ${labels.slice(0, 3).join(', ')}${labels.length > 3 ? '…' : ''}`
}

async function loadCompanies(tenantId) {
  companiesLoading.value = true
  const res = await getCompanies(null, { tenantId })
  companies.value = res.ok ? res.data : []
  companiesLoading.value = false
}

async function loadTenantContext(tenantId) {
  if (!tenantId) {
    companies.value = []
    accessStore.clear()
    return
  }
  accessStore.clear()
  selectedCompanyId.value = null
  companiesLoading.value = true
  const companiesRes = await getCompanies(null, { tenantId })
  companies.value = companiesRes.ok ? companiesRes.data : []
  companiesLoading.value = false
  const first = companies.value[0]
  if (first) {
    selectedCompanyId.value = first.id
    await accessStore.fetchCompanyAccess(tenantId, first.id)
  } else {
    await accessStore.fetchRoles(tenantId)
  }
}

async function handleTenantChange(id) {
  selectedTenantId.value = id
  await loadTenantContext(Number(id))
}

watch(selectedCompanyId, (id, prev) => {
  if (id && id !== prev && effectiveTenantId.value) {
    accessStore.fetchCompanyAccess(effectiveTenantId.value, id)
  }
})

function openCreateRole() {
  editingRole.value = null
  roleModalOpen.value = true
}

function handleRoleAction({ action, row }) {
  if (action === 'edit') {
    editingRole.value = row
    roleModalOpen.value = true
  }
  if (action === 'delete') {
    pendingDelete.value = row
    deleteConfirmOpen.value = true
  }
}

function handleRoleSaved(res) {
  if (res.ok) {
    toastStore.success(res.message)
    if (effectiveTenantId.value) accessStore.refreshRolesAfterMutation(effectiveTenantId.value)
  } else {
    toastStore.error(res.message)
  }
}

async function confirmDelete() {
  const role = pendingDelete.value
  if (!role) return
  const res = await accessStore.deleteRole(role.id, effectiveTenantId.value)
  if (res.ok) toastStore.success(res.message)
  else toastStore.error(res.message)
  deleteConfirmOpen.value = false
  pendingDelete.value = null
}

async function handleMemberRoleChange(member, value) {
  const roleId = value === '' ? null : Number(value)
  const res = await accessStore.setMemberRole(effectiveTenantId.value, member.id, roleId)
  if (res.ok) toastStore.success(res.message)
  else toastStore.error(res.message)
}

onMounted(async () => {
  await tenantsStore.fetchTenants()
  const fromQuery = Number(route.query.tenant)
  if (isPlatformAdmin.value) {
    const initial = Number.isInteger(fromQuery) && tenantsStore.tenants.some(t => t.id === fromQuery)
      ? fromQuery
      : tenantsStore.tenants[0]?.id
    selectedTenantId.value = initial ?? null
    if (initial) await loadTenantContext(initial)
  } else if (authStore.userTenantId) {
    selectedTenantId.value = authStore.userTenantId
    await tenantsStore.fetchTenantDetail(authStore.userTenantId)
    await loadTenantContext(authStore.userTenantId)
  }
})

onUnmounted(() => accessStore.clear())
</script>

<template>
  <div class="space-y-6">
    <PageHeader
      title="Roles y accesos"
      description="Roles de la cuenta y acceso por empresa."
      :icon="ShieldCheck"
    >
      <template v-if="activeTab === 'catalogo'" #actions>
        <Button variant="primary" :icon="Plus" :disabled="!effectiveTenantId || isSuspended" @click="openCreateRole">
          Nuevo rol
        </Button>
      </template>
    </PageHeader>

    <Card padding="sm">
      <div class="flex flex-col sm:flex-row sm:items-center gap-3">
        <span class="text-xs font-bold uppercase tracking-wide text-ink-muted flex-shrink-0">Cuenta de cliente</span>
        <Select
          v-if="isPlatformAdmin"
          id="roles-tenant"
          :model-value="selectedTenantId ?? ''"
          :options="tenantOptions"
          placeholder="Selecciona una cuenta"
          class="w-full sm:max-w-md"
          @change="handleTenantChange"
        />
        <div v-else class="flex items-center gap-2 min-w-0">
          <span class="font-semibold text-ink truncate">{{ activeTenant?.name || 'Mi cuenta' }}</span>
          <Badge v-if="activeTenant" :variant="isSuspended ? 'danger' : 'success'" dot>
            {{ isSuspended ? 'Suspendida' : 'Activa' }}
          </Badge>
        </div>
        <div v-if="isPlatformAdmin && activeTenant" class="flex items-center gap-2">
          <Badge :variant="isSuspended ? 'danger' : 'success'" dot>
            {{ isSuspended ? 'Suspendida' : 'Activa' }}
          </Badge>
          <Button variant="ghost" size="sm" @click="router.push({ name: 'cliente-detalle', params: { id: activeTenant.id } })">
            Ver cuenta
          </Button>
        </div>
      </div>
    </Card>

    <Alert v-if="!effectiveTenantId" variant="info" title="Sin cuenta vinculada">
      Tu usuario no está vinculado a una cuenta de cliente. Contacta al administrador de la plataforma.
    </Alert>

    <Alert v-else-if="isSuspended" variant="warning" title="Cuenta suspendida">
      La cuenta está suspendida: los cambios de roles y accesos están deshabilitados hasta su reactivación.
    </Alert>

    <template v-if="effectiveTenantId">
      <div role="tablist" aria-label="Secciones de roles y accesos" class="flex items-center gap-1 border-b border-neutral-200">
        <button
          role="tab"
          id="tab-catalogo"
          aria-selected="activeTab === 'catalogo'"
          aria-controls="panel-catalogo"
          :class="['px-4 py-2.5 text-sm font-semibold border-b-2 -mb-px transition-colors rounded-t-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)]', activeTab === 'catalogo' ? 'border-primary-500 text-primary-600' : 'border-transparent text-ink-muted hover:text-ink']"
          @click="activeTab = 'catalogo'"
        >
          Catálogo de roles
        </button>
        <button
          role="tab"
          id="tab-asignaciones"
          aria-selected="activeTab === 'asignaciones'"
          aria-controls="panel-asignaciones"
          :class="['px-4 py-2.5 text-sm font-semibold border-b-2 -mb-px transition-colors rounded-t-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)]', activeTab === 'asignaciones' ? 'border-primary-500 text-primary-600' : 'border-transparent text-ink-muted hover:text-ink']"
          @click="activeTab = 'asignaciones'"
        >
          Asignaciones por empresa
        </button>
      </div>

      <div v-show="activeTab === 'catalogo'" role="tabpanel" id="panel-catalogo" aria-labelledby="tab-catalogo">
        <Table
          :columns="roleColumns"
          :data="roles"
          :loading="accessStore.isRolesLoading"
          :actions="roleActions"
          :filterable="false"
          empty-message="Esta cuenta aún no tiene roles"
          empty-description="Crea el primer rol personalizado para asignarlo a empresas"
          @action="handleRoleAction"
        >
          <template #name="{ row }">
            <div class="flex items-center gap-2">
              <span class="font-semibold text-ink">{{ row.name }}</span>
              <Badge v-if="row.isSystem" variant="neutral" size="sm">Base</Badge>
            </div>
          </template>
          <template #description="{ row }">
            <span class="text-sm text-ink-soft">{{ row.description || '—' }}</span>
          </template>
          <template #permissions="{ row }">
            <Badge variant="secondary" :title="row.permissions.map(p => TENANT_PERMISSION_LABELS[p] || p).join(', ')">
              {{ row.permissions.length }}
            </Badge>
          </template>
          <template #createdAt="{ row }">
            <span class="text-sm text-ink-soft">{{ formatDate(row.createdAt) }}</span>
          </template>
        </Table>
        <p class="mt-3 text-xs text-ink-muted flex items-start gap-1.5">
          <Info class="w-3.5 h-3.5 mt-0.5 flex-shrink-0" aria-hidden="true" />
          Los roles <strong>Base</strong> se crean con la cuenta y no se pueden renombrar ni eliminar. Las asignaciones y los permisos sí se pueden editar.
        </p>
      </div>

      <div v-show="activeTab === 'asignaciones'" role="tabpanel" id="panel-asignaciones" aria-labelledby="tab-asignaciones">
        <div v-if="companiesLoading" class="space-y-3" aria-busy="true" aria-label="Cargando empresas">
          <Skeleton height="72px" />
          <Skeleton height="240px" />
        </div>

        <Alert v-else-if="!companies.length" variant="info" title="Sin RFC emisores">
          Esta cuenta no tiene empresas (RFC emisores). Da de alta o asigna una empresa desde la ficha del cliente para poder asignar accesos.
        </Alert>

        <div v-else class="grid grid-cols-1 lg:grid-cols-[340px,1fr] gap-5 items-start">
          <Card padding="md" aria-label="Empresas de la cuenta">
            <div class="flex items-center justify-between gap-2 mb-3">
              <h2 class="font-display text-sm font-bold text-ink uppercase tracking-wide">Empresas (RFC emisores)</h2>
              <Badge variant="neutral">{{ companies.length }}</Badge>
            </div>
            <ul class="space-y-2">
              <li v-for="company in companies" :key="company.id">
                <button
                  type="button"
                  :aria-pressed="selectedCompanyId === company.id"
                  :class="[
                    'w-full text-left rounded-xl border px-3 py-2.5 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)]',
                    selectedCompanyId === company.id
                      ? 'border-primary-400 bg-primary-50 ring-1 ring-primary-400'
                      : 'border-neutral-200 hover:border-primary-300 hover:bg-neutral-50',
                  ]"
                  @click="selectedCompanyId = company.id"
                >
                  <span class="flex items-center justify-between gap-2">
                    <span class="font-mono text-xs text-ink-soft">{{ company.rfc }}</span>
                    <Badge :variant="company.status === 'active' ? 'success' : 'neutral'" size="sm" dot>
                      {{ company.status === 'active' ? 'Activa' : 'Inactiva' }}
                    </Badge>
                  </span>
                  <span class="block text-sm font-semibold text-ink mt-1 truncate">{{ company.name }}</span>
                </button>
              </li>
            </ul>
          </Card>

          <Card padding="md" aria-label="Usuarios y rol asignado">
            <div class="flex items-center justify-between gap-2 mb-1">
              <h2 class="font-display text-sm font-bold text-ink uppercase tracking-wide">Usuarios de la cuenta</h2>
              <div class="flex items-center gap-2 text-xs text-ink-muted">
                <Users class="w-4 h-4" aria-hidden="true" />
                {{ members.length }} usuario(s) · {{ accessStore.assignedMembers }} con acceso
              </div>
            </div>
            <p class="text-xs text-ink-muted mb-4">El rol asignado define los permisos heredados en la empresa seleccionada. Los cambios aplican de inmediato.</p>

            <div v-if="accessStore.isAccessLoading" class="space-y-3" aria-busy="true">
              <Skeleton v-for="n in 3" :key="n" height="56px" />
            </div>

            <Alert v-else-if="!members.length" variant="info" title="Sin usuarios en la cuenta">
              No hay usuarios vinculados a esta cuenta de cliente todavía.
            </Alert>

            <ul v-else class="divide-y divide-neutral-100">
              <li v-for="member in members" :key="member.id" class="py-3 flex flex-col sm:flex-row sm:items-center gap-3">
                <div class="flex items-center gap-3 min-w-0 flex-1">
                  <div class="w-10 h-10 rounded-xl bg-card shadow-soft flex items-center justify-center text-primary-600 font-display font-bold flex-shrink-0 select-none" aria-hidden="true">
                    {{ member.name?.charAt(0)?.toUpperCase() || 'U' }}
                  </div>
                  <div class="min-w-0">
                    <p class="text-sm font-semibold text-ink truncate">
                      {{ member.name }}
                      <span v-if="member.id === authStore.user?.id" class="ml-1 text-[10px] font-bold uppercase text-primary-600">(tú)</span>
                    </p>
                    <p class="text-xs text-ink-muted truncate">{{ member.email }}</p>
                    <p v-if="member.roleId" class="text-[11px] text-teal-700 mt-0.5">{{ effectivePermissionsLabel(member.roleId) }}</p>
                  </div>
                </div>
                <div class="flex items-center gap-2 flex-shrink-0">
                  <Loader2 v-if="accessStore.updatingMemberId === member.id" class="w-4 h-4 animate-spin text-primary-500" aria-hidden="true" />
                  <Select
                    :id="`member-role-${member.id}`"
                    :model-value="member.roleId ?? ''"
                    :options="assignmentOptions"
                    :disabled="isSuspended || member.id === authStore.user?.id"
                    :aria-label="`Rol de ${member.name} en la empresa seleccionada`"
                    class="w-44"
                    @change="(val) => handleMemberRoleChange(member, val)"
                  />
                </div>
              </li>
            </ul>
            <p v-if="members.some(m => m.id === authStore.user?.id)" class="mt-3 text-[11px] text-ink-muted">
              No puedes cambiar tu propio acceso; pídeselo a otro administrador de la cuenta.
            </p>
          </Card>
        </div>
      </div>
    </template>

    <RoleFormModal
      v-model="roleModalOpen"
      :role="editingRole"
      :tenant-id="effectiveTenantId || 0"
      @saved="handleRoleSaved"
    />

    <Modal v-model="deleteConfirmOpen" title="Eliminar rol" size="sm">
      <p class="text-ink-soft">
        ¿Seguro que deseas eliminar el rol <strong class="text-ink">{{ pendingDelete?.name }}</strong>?
        Esta acción no se puede deshacer.
      </p>
      <template #footer>
        <Button variant="secondary" @click="deleteConfirmOpen = false">Cancelar</Button>
        <Button variant="danger" :loading="accessStore.isSaving" @click="confirmDelete">Eliminar</Button>
      </template>
    </Modal>
  </div>
</template>
