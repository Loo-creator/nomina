import { db, getNextId } from './_db'
import { delay, ok, error } from './helpers/responses'

function withCompany(employee) {
  const company = db.companies.find(c => c.id === employee.companyId)
  return {
    ...employee,
    fullName: [employee.firstName, employee.middleName, employee.lastName].filter(Boolean).join(' '),
    companyName: company?.name || 'Empresa desconocida',
  }
}

export async function getEmployees(companyIds = null, filters = {}) {
  await delay(250, 600)

  let list = db.employees.map(withCompany)

  if (companyIds) {
    list = list.filter(e => companyIds.includes(e.companyId))
  }
  if (filters.companyId) {
    list = list.filter(e => e.companyId === Number(filters.companyId))
  }
  if (filters.status) {
    list = list.filter(e => e.status === filters.status)
  }
  if (filters.search) {
    const q = filters.search.toLowerCase()
    list = list.filter(e =>
      e.fullName.toLowerCase().includes(q) ||
      e.curp.toLowerCase().includes(q) ||
      e.email.toLowerCase().includes(q) ||
      e.position.toLowerCase().includes(q)
    )
  }

  return ok(list)
}

export async function getEmployeeById(id) {
  await delay(150, 350)
  const employee = db.employees.find(e => e.id === Number(id))
  if (employee) return ok(withCompany(employee))
  return error('Empleado no encontrado', 'NOT_FOUND')
}

export async function createEmployee(data) {
  await delay(400, 800)

  if (db.employees.some(e => e.curp && e.curp === data.curp)) {
    return error('Ya existe un empleado con esa CURP', 'DUPLICATE_CURP')
  }

  const employee = {
    id: getNextId('employees'),
    status: 'active',
    ...data,
  }
  db.employees.push(employee)
  return ok(withCompany(employee), {}, 'Empleado creado correctamente')
}

export async function updateEmployee(id, data) {
  await delay(300, 600)

  const index = db.employees.findIndex(e => e.id === Number(id))
  if (index === -1) return error('Empleado no encontrado', 'NOT_FOUND')

  db.employees[index] = { ...db.employees[index], ...data }
  return ok(withCompany(db.employees[index]), {}, 'Empleado actualizado correctamente')
}

export async function deleteEmployee(id) {
  await delay(250, 500)

  const index = db.employees.findIndex(e => e.id === Number(id))
  if (index === -1) return error('Empleado no encontrado', 'NOT_FOUND')

  db.employees.splice(index, 1)
  return ok(null, {}, 'Empleado eliminado correctamente')
}
