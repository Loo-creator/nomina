import { db, getNextId } from './_db'
import { delay, ok, error } from './helpers/responses'

export async function getCompanies(companyIds = null, filters = {}) {
  await delay(200, 500)

  let list = db.companies.map(c => ({ ...c }))

  if (companyIds) {
    list = list.filter(c => companyIds.includes(c.id))
  }
  if (filters.status) {
    list = list.filter(c => c.status === filters.status)
  }
  if (filters.tenantId !== undefined) {
    const tid = filters.tenantId === null ? null : Number(filters.tenantId)
    list = list.filter(c => (c.tenantId ?? null) === tid)
  }
  if (filters.search) {
    const q = filters.search.toLowerCase()
    list = list.filter(c =>
      c.name.toLowerCase().includes(q) || c.rfc.toLowerCase().includes(q)
    )
  }

  return ok(list)
}

export async function getCompanyById(id) {
  await delay(150, 350)
  const company = db.companies.find(c => c.id === Number(id))
  if (company) return ok({ ...company })
  return error('Compañía no encontrada', 'NOT_FOUND')
}

export async function createCompany(data) {
  await delay(400, 800)

  if (db.companies.some(c => c.rfc && c.rfc === data.rfc)) {
    return error('Ya existe una compañía con ese RFC', 'DUPLICATE_RFC')
  }

  const company = {
    id: getNextId('companies'),
    status: 'active',
    createdAt: new Date().toISOString().slice(0, 10),
    ...data,
  }
  db.companies.push(company)
  return ok(company, {}, 'Compañía creada correctamente')
}

export async function updateCompany(id, data) {
  await delay(300, 600)

  const index = db.companies.findIndex(c => c.id === Number(id))
  if (index === -1) return error('Compañía no encontrada', 'NOT_FOUND')

  db.companies[index] = { ...db.companies[index], ...data }
  return ok(db.companies[index], {}, 'Compañía actualizada correctamente')
}

export async function deleteCompany(id) {
  await delay(250, 500)

  const index = db.companies.findIndex(c => c.id === Number(id))
  if (index === -1) return error('Compañía no encontrada', 'NOT_FOUND')

  db.companies.splice(index, 1)
  return ok(null, {}, 'Compañía eliminada correctamente')
}
