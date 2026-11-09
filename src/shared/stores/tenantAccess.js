import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import * as api from '@/services/roles.service'

export const useTenantAccessStore = defineStore('tenantAccess', () => {
  const roles = ref([])
  const members = ref([])
  const company = ref(null)
  const selectedCompanyId = ref(null)
  const isRolesLoading = ref(false)
  const isAccessLoading = ref(false)
  const isSaving = ref(false)
  const updatingMemberId = ref(null)
  const error = ref(null)

  const systemRoles = computed(() => roles.value.filter(r => r.isSystem))
  const customRoles = computed(() => roles.value.filter(r => !r.isSystem))
  const assignedMembers = computed(() => members.value.filter(m => m.roleId).length)

  async function fetchRoles(tenantId) {
    isRolesLoading.value = true
    error.value = null
    try {
      const res = await api.getTenantRoles(tenantId)
      if (res.ok) roles.value = res.data
      else error.value = res.message
      return res
    } catch {
      error.value = 'Error de conexión'
      return { ok: false, message: error.value }
    } finally {
      isRolesLoading.value = false
    }
  }

  async function fetchCompanyAccess(tenantId, companyId) {
    isAccessLoading.value = true
    error.value = null
    selectedCompanyId.value = Number(companyId)
    try {
      const res = await api.getCompanyAccess(tenantId, companyId)
      if (res.ok) {
        company.value = res.data.company
        members.value = res.data.members
        roles.value = res.data.roles
      } else {
        error.value = res.message
      }
      return res
    } catch {
      error.value = 'Error de conexión'
      return { ok: false, message: error.value }
    } finally {
      isAccessLoading.value = false
    }
  }

  async function createRole(tenantId, payload) {
    isSaving.value = true
    try {
      const res = await api.createTenantRole(tenantId, payload)
      if (res.ok) await fetchRoles(tenantId)
      return res
    } finally {
      isSaving.value = false
    }
  }

  async function updateRole(roleId, tenantId, payload) {
    isSaving.value = true
    try {
      const res = await api.updateTenantRole(roleId, payload)
      if (res.ok) await refreshRolesAfterMutation(tenantId)
      return res
    } finally {
      isSaving.value = false
    }
  }

  async function deleteRole(roleId, tenantId) {
    isSaving.value = true
    try {
      const res = await api.deleteTenantRole(roleId)
      if (res.ok) await refreshRolesAfterMutation(tenantId)
      return res
    } finally {
      isSaving.value = false
    }
  }

  async function refreshRolesAfterMutation(tenantId) {
    if (selectedCompanyId.value) {
      await fetchCompanyAccess(tenantId, selectedCompanyId.value)
    } else {
      await fetchRoles(tenantId)
    }
  }

  async function setMemberRole(tenantId, memberId, roleId) {
    if (!selectedCompanyId.value) return { ok: false, message: 'Selecciona una empresa' }
    updatingMemberId.value = memberId
    try {
      const res = await api.setCompanyAccess(tenantId, selectedCompanyId.value, memberId, roleId || null)
      if (res.ok) await fetchCompanyAccess(tenantId, selectedCompanyId.value)
      return res
    } finally {
      updatingMemberId.value = null
    }
  }

  function clear() {
    roles.value = []
    members.value = []
    company.value = null
    selectedCompanyId.value = null
    error.value = null
  }

  return {
    roles,
    members,
    company,
    selectedCompanyId,
    isRolesLoading,
    isAccessLoading,
    isSaving,
    updatingMemberId,
    error,
    systemRoles,
    customRoles,
    assignedMembers,
    fetchRoles,
    fetchCompanyAccess,
    createRole,
    updateRole,
    deleteRole,
    setMemberRole,
    refreshRolesAfterMutation,
    clear,
  }
})
