import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import * as api from '@/services/clients.service'

export const useTenantsStore = defineStore('tenants', () => {
  const tenants = ref([])
  const currentTenant = ref(null)
  const isLoading = ref(false)
  const isDetailLoading = ref(false)
  const isSaving = ref(false)
  const error = ref(null)

  const activeCount = computed(() => tenants.value.filter(t => t.status === 'active').length)
  const suspendedCount = computed(() => tenants.value.filter(t => t.status === 'suspended').length)
  const totalRfcs = computed(() => tenants.value.reduce((sum, t) => sum + (t.rfcCount || 0), 0))
  const totalEmployees = computed(() => tenants.value.reduce((sum, t) => sum + (t.employeeCount || 0), 0))

  async function fetchTenants(filters = {}) {
    isLoading.value = true
    error.value = null
    try {
      const res = await api.getTenants(filters)
      if (res.ok) tenants.value = res.data
      else error.value = res.message
      return res
    } catch {
      error.value = 'Error de conexión'
      return { ok: false, message: error.value }
    } finally {
      isLoading.value = false
    }
  }

  async function fetchTenantDetail(id) {
    isDetailLoading.value = true
    error.value = null
    try {
      const res = await api.getTenantDetail(id)
      if (res.ok) currentTenant.value = res.data
      else error.value = res.message
      return res
    } catch {
      error.value = 'Error de conexión'
      return { ok: false, message: error.value }
    } finally {
      isDetailLoading.value = false
    }
  }

  async function createTenant(payload) {
    isSaving.value = true
    try {
      const res = await api.createTenant(payload)
      if (res.ok) await fetchTenants()
      return res
    } finally {
      isSaving.value = false
    }
  }

  async function updateTenant(id, payload) {
    isSaving.value = true
    try {
      const res = await api.updateTenant(id, payload)
      if (res.ok) {
        if (currentTenant.value?.id === Number(id)) await fetchTenantDetail(id)
        else await fetchTenants()
      }
      return res
    } finally {
      isSaving.value = false
    }
  }

  async function setTenantStatus(id, status) {
    isSaving.value = true
    try {
      const res = await api.setTenantStatus(id, status)
      if (res.ok) {
        if (currentTenant.value?.id === Number(id)) await fetchTenantDetail(id)
        else await fetchTenants()
      }
      return res
    } finally {
      isSaving.value = false
    }
  }

  async function assignCompany(companyId, tenantId) {
    const res = await api.assignCompanyToTenant(companyId, tenantId)
    if (res.ok) await fetchTenantDetail(tenantId)
    return res
  }

  async function unassignCompany(companyId) {
    const tenantId = currentTenant.value?.id
    const res = await api.unassignCompany(companyId)
    if (res.ok && tenantId) await fetchTenantDetail(tenantId)
    return res
  }

  async function fetchUnassignedCompanies() {
    return api.getUnassignedCompanies()
  }

  function clearCurrent() {
    currentTenant.value = null
  }

  return {
    tenants,
    currentTenant,
    isLoading,
    isDetailLoading,
    isSaving,
    error,
    activeCount,
    suspendedCount,
    totalRfcs,
    totalEmployees,
    fetchTenants,
    fetchTenantDetail,
    createTenant,
    updateTenant,
    setTenantStatus,
    assignCompany,
    unassignCompany,
    fetchUnassignedCompanies,
    clearCurrent,
  }
})
