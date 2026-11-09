import { describe, it, expect } from 'vitest'
import { getCompanies, createCompany, updateCompany, deleteCompany, getCompanyById } from '@/services/companies.service'
import { getEmployees, createEmployee, updateEmployee, deleteEmployee, getEmployeeById } from '@/services/employees.service'
import {
  getDashboardStats,
} from '@/services/dashboard.service'
import {
  getUsers,
  createUser,
  updateUser,
  deleteUser,
  getUserById,
} from '@/services/users.service'
import {
  getFiscalDataByCompany,
  upsertFiscalData,
  getInvoiceDesigns,
  updateInvoiceDesign,
  getInvoiceDesignVersions,
  restoreInvoiceDesign,
  queryCurp,
  testPacConnection,
} from '@/services/fiscal.service'
import { getSettings, updateSettings, getAuditLog } from '@/services/settings.service'

describe('mock companies', () => {
  it('filters by tenant and pass-through create/update/delete', async () => {
    const res = await getCompanies(null, { tenantId: 1 })
    expect(res.ok).toBe(true)
    expect(res.data.length).toBe(2)

    const created = await createCompany({ name: 'Cobertura RFC SA', rfc: 'COV010101AAA', regimen: '601', domain: 'cobertura.mx', tenantId: 1 })
    expect(created.ok).toBe(true)
    const dup = await createCompany({ name: 'Dup', rfc: 'COV010101AAA', regimen: '601' })
    expect(dup.ok).toBe(false)

    const fetched = await getCompanyById(created.data.id)
    expect(fetched.ok).toBe(true)

    const updated = await updateCompany(created.data.id, { phone: '55-0000-1111' })
    expect(updated.ok).toBe(true)
    expect(updated.data.phone).toBe('55-0000-1111')

    const removed = await deleteCompany(created.data.id)
    expect(removed.ok).toBe(true)
  })
})

describe('mock employees', () => {
  it('lists with fullName and company, blocks duplicate CURP', async () => {
    const search = await getEmployees(null, { search: 'Oscar' })
    expect(search.ok).toBe(true)
    const all = await getEmployees([1])
    expect(all.ok).toBe(true)
    expect(all.data[0].fullName).toBeTruthy()
    expect(all.data[0].companyName).toBeTruthy()

    const created = await createEmployee({
      companyId: 1, firstName: 'Cobertura', lastName: 'Prueba',
      curp: 'COBP900101HDFRNN01', rfc: 'COBP900101XXX', nss: '10000000000',
      email: 'cobertura.prueba@empresademo.com', phone: '55-0000-0000',
      birthDate: '1990-01-01', hireDate: '2024-01-01',
      department: 'Pruebas', position: 'Tester', contractType: 'indefinido',
      salary: 12000, clabe: '012345678901234567',
    })
    expect(created.ok).toBe(true)

    const dup = await createEmployee({ companyId: 1, curp: 'COBP900101HDFRNN01' })
    expect(dup.ok).toBe(false)
    expect(dup.error).toBe('DUPLICATE_CURP')

    const byId = await getEmployeeById(created.data.id)
    expect(byId.ok).toBe(true)
    expect(byId.data.email).toBe('cobertura.prueba@empresademo.com')

    const updated = await updateEmployee(created.data.id, { status: 'archived' })
    expect(updated.ok).toBe(true)
    expect(updated.data.status).toBe('archived')

    const removed = await deleteEmployee(created.data.id)
    expect(removed.ok).toBe(true)

    const afterDelete = await getEmployeeById(created.data.id)
    expect(afterDelete.ok).toBe(false)
  })
})

describe('mock dashboard', () => {
  it('works with null companyIds (all companies) and with a subset', async () => {
    const all = await getDashboardStats(1, null)
    expect(all.ok).toBe(true)
    expect(all.data.stats.totalCompanies).toBeGreaterThanOrEqual(3)

    const scoped = await getDashboardStats(5, [1])
    expect(scoped.ok).toBe(true)
    expect(scoped.data.stats.totalCompanies).toBe(1)
    expect(scoped.data.recentPayrolls.every(p => p.companyName)).toBe(true)
  })
})

describe('mock users', () => {
  it('creates, updates and deletes a user and rejects duplicate emails', async () => {
    const created = await createUser({ name: 'Usuario Cobertura', email: 'cobertura@nomikok.test', role: 'staff', companies: [1] })
    expect(created.ok).toBe(true)
    expect(created.data).not.toHaveProperty('password')

    const dup = await createUser({ name: 'Dup', email: 'cobertura@nomikok.test', role: 'staff' })
    expect(dup.ok).toBe(false)
    expect(dup.error).toBe('DUPLICATE_EMAIL')

    const updated = await updateUser(created.data.id, { role: 'cliente' })
    expect(updated.ok).toBe(true)

    const fetched = await getUserById(created.data.id)
    expect(fetched.ok).toBe(true)
    expect(fetched.data.companyNames).toContain('Empresa Demo SA de CV')

    const removed = await deleteUser(created.data.id)
    expect(removed.ok).toBe(true)

    const list = await getUsers([1], { role: 'cliente' })
    expect(list.ok).toBe(true)
    expect(list.data.some(u => u.email === 'cliente@nomikok.com')).toBe(true)
  })
})

describe('mock fiscal + invoice design versioning', () => {
  it('reads and upserts fiscal data', async () => {
    const before = await getFiscalDataByCompany(1)
    expect(before.ok).toBe(true)

    const saved = await upsertFiscalData(1, { pacProvider: 'Finkok', pacUsername: 'demo' })
    expect(saved.ok).toBe(true)
    const after = await getFiscalDataByCompany(1)
    expect(after.data.pacProvider).toBe('Finkok')
  })

  it('validates CURP and connects to PAC deterministically', async () => {
    const bad = await queryCurp('no-es-curp')
    expect(bad.ok).toBe(false)
    const good = await queryCurp('PEPJ900101HDFRRN09')
    expect(good.ok).toBe(true)

    const okPac = await testPacConnection({ pacProvider: 'Finkok', pacUsername: 'usuario' })
    expect(okPac.ok).toBe(true)
    const failPac = await testPacConnection({ pacProvider: 'Finkok', pacUsername: 'fail-user' })
    expect(failPac.ok).toBe(false)
  })

  it('saves invoice design versions and restores them', async () => {
    const designs = await getInvoiceDesigns(null)
    expect(designs.ok).toBe(true)
    const design = designs.data.find(d => d.id === 1)
    expect(design).toBeTruthy()

    const versionsBefore = await getInvoiceDesignVersions(1)
    expect(versionsBefore.ok).toBe(true)
    const countBefore = versionsBefore.data.length

    const updated = await updateInvoiceDesign(1, { name: 'Diseño Cobertura', config: { colors: { primary: '#123456' } } })
    expect(updated.ok).toBe(true)

    const versionsAfter = await getInvoiceDesignVersions(1)
    expect(versionsAfter.data.length).toBe(countBefore + 1)

    const restore = await restoreInvoiceDesign(1, versionsBefore.data[0].id)
    expect(restore.ok).toBe(true)
    expect(restore.data.config.colors.primary).toBe(versionsBefore.data[0].config.colors.primary)
  })
})

describe('mock settings + audit log', () => {
  it('returns settings and logs changes with sections', async () => {
    const res = await getSettings()
    expect(res.ok).toBe(true)

    const target = { currency: res.data.currency === 'MXN' ? 'USD' : 'MXN' }
    const updated = await updateSettings(target, { section: 'Empresa', actor: 'cobertura@test.mx' })
    expect(updated.ok).toBe(true)
    expect(updated.data.currency).toBe(target.currency)

    const log = await getAuditLog()
    expect(log.ok).toBe(true)
    expect(log.data[0].actor).toBe('cobertura@test.mx')
    expect(log.data[0].summary).toMatch(/Moneda/)

    await updateSettings({ currency: res.data.currency }, { section: 'Empresa', actor: 'cobertura@test.mx' })
  })
})

import { getPayrollLoads, createPayrollLoad, retryPayrollLoad } from '@/services/batches.service'

describe('mock payrollLoads (single-company path)', () => {
  it('lists loads scoped by company ids', async () => {
    const res = await getPayrollLoads([1])
    expect(res.ok).toBe(true)
    expect(res.data.every(l => l.companyId === 1)).toBe(true)
    expect(res.data[0].companyName).toBeTruthy()
  })

  it('creates a load and retries it', async () => {
    const created = await createPayrollLoad({ companyId: 1, fileName: 'cobertura_test.xlsx', totalRecords: 7 })
    expect(created.ok).toBe(true)
    expect(created.data.status).toBe('procesando')

    const retried = await retryPayrollLoad(created.data.id)
    expect(retried.ok).toBe(true)
    expect(retried.data.status).toBe('procesando')

    const missing = await retryPayrollLoad(999999)
    expect(missing.ok).toBe(false)
  })
})
