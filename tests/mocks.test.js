import { describe, it, expect } from 'vitest'
import { login, verifyCredentials } from '@/services/auth.service'
import { getEmployeePayrolls, getEmployeePayrollById } from '@/services/payrolls.service'
import {
  createTenantRole,
  deleteTenantRole,
  getCompanyAccess,
  setCompanyAccess,
} from '@/services/roles.service'
import { buildAuditPackage, acuseFilename } from '@/shared/utils/auditPackage'

describe('mock auth', () => {
  it('logs in with valid demo credentials', async () => {
    const res = await login({ email: 'cliente@nomikok.com', password: '123456', role: 'cliente' })
    expect(res.ok).toBe(true)
    expect(res.data.email).toBe('cliente@nomikok.com')
    expect(res.data).not.toHaveProperty('password')
  })

  it('rejects invalid credentials', async () => {
    const res = await login({ email: 'cliente@nomikok.com', password: 'incorrecta' })
    expect(res.ok).toBe(false)
    expect(res.error).toBe('INVALID_CREDENTIALS')
  })

  it('verifies credentials for re-authentication', async () => {
    const okRes = await verifyCredentials('empleado@nomikok.com', '123456')
    expect(okRes.ok).toBe(true)
    const badRes = await verifyCredentials('empleado@nomikok.com', 'nope')
    expect(badRes.ok).toBe(false)
  })
})

describe('mock payrolls (employee isolation)', () => {
  it('returns only the employee own payroll without company aggregates', async () => {
    const res = await getEmployeePayrolls(1)
    expect(res.ok).toBe(true)
    expect(res.data.length).toBeGreaterThan(0)
    for (const row of res.data) {
      expect(row).not.toHaveProperty('totalEmployees')
      expect(row).not.toHaveProperty('totalPerceptions')
      expect(row).not.toHaveProperty('totalDeductions')
      expect(row).not.toHaveProperty('totalNet')
      expect(row.myNet).toBeGreaterThan(0)
      expect(row.companyRfc).toBeTruthy()
    }
  })

  it('returns employee payroll by id and 404s for unknown ids', async () => {
    const list = await getEmployeePayrolls(1)
    const id = list.data[0].id
    const found = await getEmployeePayrollById(1, id)
    expect(found.ok).toBe(true)
    const missing = await getEmployeePayrollById(1, 99999)
    expect(missing.ok).toBe(false)
  })
})

describe('mock tenantAccess (RBAC coherence)', () => {
  it('rejects roles with no permissions', async () => {
    const res = await createTenantRole(1, { name: 'Rol vacío', permissions: [] })
    expect(res.ok).toBe(false)
    expect(res.error).toBe('EMPTY_PERMISSIONS')
  })

  it('rejects permissions outside the catalog', async () => {
    const res = await createTenantRole(1, { name: 'Rol ilegal', permissions: ['payroll:read', 'root:all'] })
    expect(res.ok).toBe(false)
    expect(res.error).toBe('INVALID_PERMISSIONS')
  })

  it('rejects duplicate role names within the account', async () => {
    const res = await createTenantRole(1, { name: 'Gerente', permissions: ['payroll:read'] })
    expect(res.ok).toBe(false)
    expect(res.error).toBe('DUPLICATE_ROLE')
  })

  it('creates, assigns and re-reads a custom role', async () => {
    const created = await createTenantRole(1, { name: 'Auditor de prueba', permissions: ['payroll:read', 'reports:read'] })
    expect(created.ok).toBe(true)

    const assigned = await setCompanyAccess(1, 1, 7, created.data.id)
    expect(assigned.ok).toBe(true)

    const access = await getCompanyAccess(1, 1)
    const member = access.data.members.find(m => m.id === 7)
    expect(member.roleId).toBe(created.data.id)
  })

  it('blocks cross-tenant assignments', async () => {
    const access = await getCompanyAccess(1, 1)
    expect(access.ok).toBe(true)
    const res = await setCompanyAccess(1, 1, 8, 1)
    expect(res.ok).toBe(false)
    expect(res.error).toBe('CROSS_TENANT')
    const badCompany = await getCompanyAccess(1, 3)
    expect(badCompany.ok).toBe(false)
    expect(badCompany.error).toBe('CROSS_TENANT')
  })

  it('prevents deleting system roles and roles with assignments', async () => {
    const systemRole = await deleteTenantRole(1)
    expect(systemRole.ok).toBe(false)
    expect(systemRole.error).toBe('SYSTEM_ROLE')

    const created = await createTenantRole(1, { name: 'Auditor temporal', permissions: ['payroll:read'] })
    expect(created.ok).toBe(true)
    await setCompanyAccess(1, 1, 7, created.data.id)
    const inUse = await deleteTenantRole(created.data.id)
    expect(inUse.ok).toBe(false)
    expect(inUse.error).toBe('ROLE_IN_USE')
  })
})

describe('audit package builder', () => {
  const payrolls = [
    {
      id: 1,
      companyRfc: 'EMP123456789',
      companyName: 'Empresa Demo SA de CV',
      periodLabel: 'Enero 2024',
      period: '2024-01',
      totalEmployees: 4,
      totalPerceptions: 83000,
      totalDeductions: 16600,
      totalNet: 66400,
      uuid: 'A1B2C3D4-E5F6-7890-ABCD-EF1234567890',
      status: 'firmada',
      stampedAt: '2024-02-05T10:30:00',
      signedAt: '2024-02-06T09:15:00',
      department: 'Ventas',
      position: 'Ejecutivo',
    },
  ]

  it('produces a ZIP (PK signature) with content', async () => {
    const blob = await buildAuditPackage(payrolls, { generatedBy: 'Test' })
    expect(blob.size).toBeGreaterThan(1000)
    const buffer = new Uint8Array(await blob.arrayBuffer())
    expect(buffer[0]).toBe(0x50)
    expect(buffer[1]).toBe(0x4b)
  })

  it('builds a stable acuse filename', () => {
    expect(acuseFilename(payrolls[0])).toBe('acuse_firma_A1B2C3D4-E5F6-7890-ABCD-EF1234567890.pdf')
  })
})
import {
  getTenants,
  createTenant,
  getTenantDetail,
  setTenantStatus,
} from '@/services/clients.service'
import { cancelPayroll, getPayrolls } from '@/services/payrolls.service'
import { getNotifications, resendNotification } from '@/services/notifications.service'
import { validateInvitation, createInvitation } from '@/services/invitations.service'

describe('mock tenants (multi-RFC)', () => {
  it('lists tenants with computed RFC and employee counts', async () => {
    const res = await getTenants()
    expect(res.ok).toBe(true)
    const acme = res.data.find(t => t.id === 1)
    expect(acme.rfcCount).toBe(2)
    expect(acme.employeeCount).toBeGreaterThan(0)
  })

  it('filters by search term', async () => {
    const res = await getTenants({ search: 'comercializadora' })
    expect(res.ok).toBe(true)
    expect(res.data).toHaveLength(1)
    expect(res.data[0].name).toMatch(/Comercializadora/)
  })

  it('returns detail with companies and blocks unknown tenants', async () => {
    const detail = await getTenantDetail(1)
    expect(detail.ok).toBe(true)
    expect(detail.data.companies.length).toBe(2)
    const missing = await getTenantDetail(9999)
    expect(missing.ok).toBe(false)
  })

  it('creates a tenant, generates CTA code and blocks duplicates', async () => {
    const res = await createTenant({
      name: 'Cobertura SA de CV',
      legalName: 'Cobertura SA de CV',
      plan: 'basic',
      contactName: 'Prueba',
      contactEmail: 'cobertura@test.mx',
      contactPhone: '55-0000-0000',
      domain: 'cobertura.mx',
    })
    expect(res.ok).toBe(true)
    expect(res.data.accountCode).toMatch(/^CTA-\d{4}$/)

    const dup = await createTenant({ name: 'Cobertura SA de CV', legalName: 'Cobertura SA de CV', plan: 'basic', contactName: 'X', contactEmail: 'otro@test.mx' })
    expect(dup.ok).toBe(false)
    expect(dup.error).toBe('DUPLICATE_NAME')
  })

  it('suspends and reactivates a tenant and rejects bad ids', async () => {
    const suspended = await setTenantStatus(3, 'suspended')
    expect(suspended.ok).toBe(true)
    expect(suspended.data.status).toBe('suspended')
    const reactivated = await setTenantStatus(3, 'active')
    expect(reactivated.ok).toBe(true)
    const invalid = await setTenantStatus(9999, 'active')
    expect(invalid.ok).toBe(false)
  })
})

describe('mock payrolls (admin operations)', () => {
  it('lists payrolls scoped by company ids', async () => {
    const res = await getPayrolls([1])
    expect(res.ok).toBe(true)
    expect(res.data.every(p => p.companyName)).toBe(true)
    expect(res.data.some(p => p.companyRfc)).toBe(true)
  })

  it('cancels only stamped or signed payrolls and rejects unknown ids', async () => {
    const all = await getPayrolls([1])
    const stamped = all.data.find(p => p.status === 'timbrada')
    expect(stamped).toBeTruthy()
    const res = await cancelPayroll(stamped.id, { reason: 'Error en periodo' })
    expect(res.ok).toBe(true)
    expect(res.data.status).toBe('cancelada')
    const missing = await cancelPayroll(99999, { reason: 'x' })
    expect(missing.ok).toBe(false)
  })
})

describe('mock notifications', () => {
  it('lists seeded notifications for tenant 1 and filters them', async () => {
    const res = await getNotifications(1)
    expect(res.ok).toBe(true)
    expect(res.data.length).toBeGreaterThan(5)
    const failed = res.data.filter(n => n.status === 'fallida')
    expect(failed.length).toBeGreaterThan(0)
    const filtered = await getNotifications(1, { status: 'fallida' })
    expect(filtered.data.every(n => n.status === 'fallida')).toBe(true)
  })

  it('resends a failed notification to entregada', async () => {
    const list = await getNotifications(1, { status: 'fallida' })
    const target = list.data[0]
    const res = await resendNotification(target.id)
    expect(res.ok).toBe(true)
    expect(res.data.status).toBe('entregada')
    expect(res.data.attempts).toBe(target.attempts + 1)
  })
})

describe('mock invitations', () => {
  it('validates seeded invitation tokens', async () => {
    const res = await validateInvitation('token-inexistente-de-pruebas')
    expect(res.ok).toBe(false)
    expect(res.error).toBe('INVALID_TOKEN')
  })

  it('creates and rejects duplicate invitations for the same email', async () => {
    const res = await createInvitation({
      email: 'duplicado@cobertura.mx',
      name: 'Duplicado Test',
      role: 'staff',
      companyIds: [1],
      mfaRequired: false,
      invitedBy: 'admin@nomikok.com',
    })
    expect(res.ok).toBe(true)
    const dup = await createInvitation({
      email: 'duplicado@cobertura.mx',
      name: 'Otro',
      role: 'staff',
      companyIds: [1],
      invitedBy: 'admin@nomikok.com',
    })
    expect(dup.ok).toBe(false)
    expect(dup.error).toBe('DUPLICATE_INVITATION')
  })
})
