import { db, getNextId } from './_db'
import { delay, ok, error } from './helpers/responses'

function tenantCounts(tenantId) {
  const companies = db.companies.filter(c => c.tenantId === tenantId)
  const companyIds = companies.map(c => c.id)
  const employeeCount = db.employees.filter(e => companyIds.includes(e.companyId)).length
  return {
    rfcCount: companies.length,
    activeRfcCount: companies.filter(c => c.status === 'active').length,
    employeeCount,
  }
}

function withCounts(tenant) {
  return { ...tenant, ...tenantCounts(tenant.id) }
}

export async function getTenants(filters = {}) {
  await delay(200, 500)

  let list = db.tenants.map(withCounts)

  if (filters.status) {
    list = list.filter(t => t.status === filters.status)
  }
  if (filters.plan) {
    list = list.filter(t => t.plan === filters.plan)
  }
  if (filters.search) {
    const q = String(filters.search).toLowerCase()
    list = list.filter(t =>
      t.name.toLowerCase().includes(q) ||
      t.legalName.toLowerCase().includes(q) ||
      t.accountCode.toLowerCase().includes(q) ||
      t.contactEmail.toLowerCase().includes(q) ||
      (t.domain || '').toLowerCase().includes(q)
    )
  }

  return ok(list)
}

export async function getTenantDetail(id) {
  await delay(200, 450)

  const tenant = db.tenants.find(t => t.id === Number(id))
  if (!tenant) return error('Cliente no encontrado', 'NOT_FOUND')

  const companies = db.companies
    .filter(c => c.tenantId === tenant.id)
    .map(c => ({
      ...c,
      employeeCount: db.employees.filter(e => e.companyId === c.id).length,
    }))

  return ok({ ...withCounts(tenant), companies })
}

export async function createTenant(data) {
  await delay(400, 800)

  const name = (data.name || '').trim()
  if (db.tenants.some(t => t.name.toLowerCase() === name.toLowerCase())) {
    return error('Ya existe un cliente con ese nombre', 'DUPLICATE_NAME')
  }
  if (data.contactEmail && db.tenants.some(t => t.contactEmail.toLowerCase() === String(data.contactEmail).toLowerCase())) {
    return error('Ya existe un cliente con ese correo de contacto', 'DUPLICATE_EMAIL')
  }

  const id = getNextId('tenants')
  const tenant = {
    status: 'active',
    createdAt: new Date().toISOString().slice(0, 10),
    notes: '',
    ...data,
    id,
    accountCode: `CTA-${String(id).padStart(4, '0')}`,
    name,
  }
  db.tenants.push(tenant)
  return ok(withCounts(tenant), {}, 'Cliente creado correctamente')
}

export async function updateTenant(id, data) {
  await delay(300, 600)

  const index = db.tenants.findIndex(t => t.id === Number(id))
  if (index === -1) return error('Cliente no encontrado', 'NOT_FOUND')

  const current = db.tenants[index]
  const name = (data.name ?? current.name).trim()
  if (db.tenants.some(t => t.id !== current.id && t.name.toLowerCase() === name.toLowerCase())) {
    return error('Ya existe un cliente con ese nombre', 'DUPLICATE_NAME')
  }
  if (data.contactEmail && db.tenants.some(t => t.id !== current.id && t.contactEmail.toLowerCase() === String(data.contactEmail).toLowerCase())) {
    return error('Ya existe un cliente con ese correo de contacto', 'DUPLICATE_EMAIL')
  }

  db.tenants[index] = { ...current, ...data, name }
  return ok(withCounts(db.tenants[index]), {}, 'Cliente actualizado correctamente')
}

export async function setTenantStatus(id, status) {
  await delay(250, 500)

  if (!['active', 'suspended'].includes(status)) {
    return error('Estado inválido', 'INVALID_STATUS')
  }
  const index = db.tenants.findIndex(t => t.id === Number(id))
  if (index === -1) return error('Cliente no encontrado', 'NOT_FOUND')

  db.tenants[index] = { ...db.tenants[index], status }
  return ok(
    withCounts(db.tenants[index]),
    {},
    status === 'suspended' ? 'Cliente suspendido correctamente' : 'Cliente reactivado correctamente',
  )
}

export async function assignCompanyToTenant(companyId, tenantId) {
  await delay(250, 500)

  const tenant = db.tenants.find(t => t.id === Number(tenantId))
  if (!tenant) return error('Cliente no encontrado', 'NOT_FOUND')

  const index = db.companies.findIndex(c => c.id === Number(companyId))
  if (index === -1) return error('Empresa no encontrada', 'NOT_FOUND')
  if (db.companies[index].tenantId && db.companies[index].tenantId !== tenant.id) {
    return error('La empresa ya está asignada a otro cliente', 'ALREADY_ASSIGNED')
  }

  db.companies[index] = { ...db.companies[index], tenantId: tenant.id }
  return ok({ ...db.companies[index] }, {}, 'Empresa asignada al cliente')
}

export async function unassignCompany(companyId) {
  await delay(250, 500)

  const index = db.companies.findIndex(c => c.id === Number(companyId))
  if (index === -1) return error('Empresa no encontrada', 'NOT_FOUND')

  db.companies[index] = { ...db.companies[index], tenantId: null }
  return ok({ ...db.companies[index] }, {}, 'Empresa desasignada del cliente')
}

export async function getUnassignedCompanies() {
  await delay(150, 350)
  const list = db.companies.filter(c => !c.tenantId).map(c => ({ ...c }))
  return ok(list)
}
