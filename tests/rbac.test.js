import { describe, it, expect } from 'vitest'
import {
  ROLES,
  ROLE_LABELS,
  ROLE_HIERARCHY,
  ROLE_SECTION_MATRIX,
  SECTIONS_BY_ROLE,
} from '@/shared/utils/constants'
import { login } from '@/services/auth.service'

describe('roles (RBAC matrix)', () => {
  it('exposes the supervisor role in labels and hierarchy', () => {
    expect(ROLES.SUPERVISOR).toBe('supervisor')
    expect(ROLE_LABELS[ROLES.SUPERVISOR]).toBe('Supervisor')
    expect(ROLE_HIERARCHY[ROLES.SUPERVISOR]).toBe(3)
    expect(SECTIONS_BY_ROLE[ROLES.SUPERVISOR]).toBe(ROLE_SECTION_MATRIX[ROLES.SUPERVISOR])
  })

  it('grants supervisor access only to the operational matrix', () => {
    const sections = SECTIONS_BY_ROLE[ROLES.SUPERVISOR]
    expect(sections).toContain('dashboard')
    expect(sections).toContain('carga-masiva')
    expect(sections).toContain('nominas-timbradas')
    expect(sections).toContain('empleados')
    expect(sections).toContain('usuarios')
    expect(sections).toContain('notificaciones')
    expect(sections).not.toContain('roles')
    expect(sections).not.toContain('clientes')
    expect(sections).not.toContain('companias')
    expect(sections).not.toContain('configuracion')
  })

  it('logs in the supervisor demo account', async () => {
    const res = await login({ email: 'supervisor@nomikok.com', password: '123456', role: 'supervisor' })
    expect(res.ok).toBe(true)
    expect(res.data.role).toBe('supervisor')
  })

  it('equals itself: ROLE_SECTION_MATRIX backs SECTIONS_BY_ROLE', () => {
    for (const role of Object.values(ROLES)) {
      expect(ROLE_SECTION_MATRIX[role]).toBe(SECTIONS_BY_ROLE[role])
    }
  })
})
