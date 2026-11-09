import { describe, it, expect, beforeEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useAuthStore } from '@/shared/stores/auth'
import { ROLES } from '@/shared/utils/constants'
import router from '@/shared/router'

let pinia
let auth

function actAs(userLike) {
  auth.user = userLike
  auth.isAuthenticated = true
}

beforeEach(() => {
  pinia = createPinia()
  setActivePinia(pinia)
  auth = useAuthStore(pinia)
})

describe('router guards (real app router)', () => {
  it('employee is forbidden from upload and users routes', async () => {
    actAs({ id: 5, email: 'empleado@nomikok.com', name: 'Juan', role: ROLES.EMPLEADO, companies: [1], tenantId: 1, employeeId: 1 })
    await router.push({ name: 'carga-masiva' }).catch(() => {})
    expect(router.currentRoute.value.name).toBe('forbidden')
    await router.push('/usuarios').catch(() => {})
    expect(router.currentRoute.value.name).toBe('forbidden')
    await router.push({ name: 'mis-nominas' }).catch(() => {})
    expect(router.currentRoute.value.name).toBe('mis-nominas')
  })

  it('supervisor is forbidden from roles and clients, allowed to upload', async () => {
    actAs({ id: 9, email: 'supervisor@nomikok.com', name: 'Sup.', role: ROLES.SUPERVISOR, companies: [1] })
    await router.push({ name: 'roles-acceso' }).catch(() => {})
    expect(router.currentRoute.value.name).toBe('forbidden')
    await router.push({ name: 'clientes' }).catch(() => {})
    expect(router.currentRoute.value.name).toBe('forbidden')
    await router.push({ name: 'carga-masiva' }).catch(() => {})
    expect(router.currentRoute.value.name).toBe('carga-masiva')
    await router.push({ name: 'nominas-timbradas' }).catch(() => {})
    expect(router.currentRoute.value.name).toBe('nominas-timbradas')
  })

  it('superadmin cannot upload to mass processing but reaches clients', async () => {
    actAs({ id: 1, email: 'superadmin@nomikok.com', name: 'SA', role: ROLES.SUPERADMIN, companies: [1, 2, 3] })
    await router.push({ name: 'carga-masiva' }).catch(() => {})
    expect(router.currentRoute.value.name).toBe('forbidden')
    await router.push({ name: 'clientes' }).catch(() => {})
    expect(router.currentRoute.value.name).toBe('clientes')
  })

  it('unauthenticated users are redirected to login', async () => {
    auth.user = null
    auth.isAuthenticated = false
    await router.push('/dashboard').catch(() => {})
    expect(router.currentRoute.value.name).toBe('login')
  })
})
