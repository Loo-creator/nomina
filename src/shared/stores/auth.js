import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { login as apiLogin, getCurrentUser } from '@/services/auth.service'
import { ROLES } from '@/shared/utils/constants'
import { track } from '@/shared/utils/telemetry'

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null)
  const isAuthenticated = ref(false)
  const isLoading = ref(false)
  const error = ref(null)

  const userRole = computed(() => user.value?.role || null)
  const userCompanies = computed(() => user.value?.companies || [])
  const userTenantId = computed(() => user.value?.tenantId ?? null)

  const COMPANY_KEY_PREFIX = 'nomikok_company_'
  const companyStorageKey = () => `${COMPANY_KEY_PREFIX}${user.value?.id ?? 'anon'}`

  const selectedCompanyId = ref(null)

  const canSelectCompany = computed(() => {
    if (userRole.value === ROLES.SUPERADMIN || userRole.value === ROLES.ADMIN) return true
    return userCompanies.value.length > 1
  })

  const scopedCompanyIds = computed(() => {
    if (selectedCompanyId.value !== null) {
      if (userRole.value === ROLES.SUPERADMIN || userRole.value === ROLES.ADMIN) {
        return [selectedCompanyId.value]
      }
      if (userCompanies.value.includes(selectedCompanyId.value)) {
        return [selectedCompanyId.value]
      }
    }
    return (userRole.value === ROLES.SUPERADMIN || userRole.value === ROLES.ADMIN) ? null : userCompanies.value
  })

  function loadCompanyPreference() {
    try {
      const stored = localStorage.getItem(companyStorageKey())
      const num = stored ? Number(stored) : null
      selectedCompanyId.value = Number.isFinite(num) ? num : null
    } catch {
      selectedCompanyId.value = null
    }
  }

  function setSelectedCompany(id) {
    if (id === null || id === '' || id === undefined) {
      selectedCompanyId.value = null
      try { localStorage.removeItem(companyStorageKey()) } catch {}
      return
    }
    const num = Number(id)
    if (!Number.isFinite(num)) return
    if (userRole.value !== ROLES.SUPERADMIN && userRole.value !== ROLES.ADMIN && !userCompanies.value.includes(num)) return
    selectedCompanyId.value = num
    try { localStorage.setItem(companyStorageKey(), String(num)) } catch {}
  }
  const canAccessAllCompanies = computed(() =>
    userRole.value === ROLES.SUPERADMIN || userRole.value === ROLES.ADMIN
  )

  const canManageRolesCatalog = computed(() =>
    hasPermission('roles:manage') || hasPermission('*')
  )

  const permissions = computed(() => {
    const role = userRole.value
    if (!role) return []

    const basePermissions = {
      [ROLES.SUPERADMIN]: ['*'],
      [ROLES.ADMIN]: [
        'companies:read', 'companies:write',
        'users:read', 'users:write', 'users:assign',
        'employees:read', 'employees:write',
        'payroll:read', 'payroll:write', 'payroll:stamp', 'payroll:sign', 'payroll:cancel', 'payroll:download',
        'loads:create', 'loads:read',
        'fiscal:read', 'fiscal:write',
        'reports:read', 'roles:manage',
      ],
      [ROLES.SUPERVISOR]: ['payroll:read', 'payroll:download', 'payroll:request-cancel', 'loads:read', 'loads:create', 'employees:read', 'reports:read', 'users:read'],
      [ROLES.STAFF]: ['companies:read', 'employees:read', 'employees:write', 'payroll:read', 'users:read'],
      [ROLES.CLIENTE]: ['companies:read', 'employees:read', 'payroll:read', 'fiscal:read'],
      [ROLES.EMPLEADO]: ['payroll:read:own', 'fiscal:read:own'],
    }

    return basePermissions[role] || []
  })

  const hasPermission = (permission) => {
    if (permissions.value.includes('*')) return true
    return permissions.value.includes(permission)
  }

  const hasAnyPermission = (permissionList) => {
    return permissionList.some(p => hasPermission(p))
  }

  async function login(credentials) {
    isLoading.value = true
    error.value = null

    try {
      const response = await apiLogin(credentials)
      if (response.ok) {
        user.value = response.data
        isAuthenticated.value = true
        localStorage.setItem('nomikok_user', JSON.stringify(response.data))
        loadCompanyPreference()
        track('login', { role: response.data?.role })
        return { ok: true }
      } else {
        track('login_fallido', { reason: response.error || 'INVALID_CREDENTIALS' })
        error.value = response.message || 'Credenciales inválidas'
        return { ok: false, error: error.value }
      }
    } catch (err) {
      error.value = 'Error de conexión'
      return { ok: false, error: error.value }
    } finally {
      isLoading.value = false
    }
  }

  function logout() {
    user.value = null
    isAuthenticated.value = false
    localStorage.removeItem('nomikok_user')
    router.push('/login')
  }

  function initAuth() {
    const stored = localStorage.getItem('nomikok_user')
    if (stored) {
      try {
        user.value = JSON.parse(stored)
        isAuthenticated.value = true
        loadCompanyPreference()
      } catch {
        localStorage.removeItem('nomikok_user')
      }
    }
  }

  async function refreshUser() {
    if (!isAuthenticated.value) return
    try {
      const response = await getCurrentUser(user.value.id)
      if (response.ok) {
        user.value = response.data
        localStorage.setItem('nomikok_user', JSON.stringify(response.data))
      }
    } catch {
      // Silently fail
    }
  }

  return {
    user,
    isAuthenticated,
    isLoading,
    error,
    userRole,
    userCompanies,
    userTenantId,
    canAccessAllCompanies,
    selectedCompanyId,
    scopedCompanyIds,
    canSelectCompany,
    setSelectedCompany,
    permissions,
    hasPermission,
    hasAnyPermission,
    canManageRolesCatalog,
    login,
    logout,
    initAuth,
    refreshUser,
  }
})

import router from '@/shared/router'