import { db } from './_db'
import { delay, ok, error } from './helpers/responses'
import { track } from '@/shared/utils/telemetry'

function hashString(str) {
  let h = 1779033703 ^ str.length
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353)
    h = (h << 13) | (h >>> 15)
  }
  return h >>> 0
}

function mulberry32(seed) {
  let a = seed >>> 0
  return function () {
    a |= 0
    a = (a + 0x6D2B79F5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function employeeForUser(employeeId) {
  return db.employees.find(e => e.id === Number(employeeId)) || null
}

function employeePayrollView(payroll, employee) {
  const rand = mulberry32(hashString(`${payroll.period}|${employee?.id ?? 0}`))
  const base = Number(employee?.salary) || 15000
  const jitter = 0.94 + rand() * 0.12
  const myPerceptions = Math.round(base * jitter)
  const myDeductions = Math.round(myPerceptions * (0.16 + rand() * 0.09))
  const company = db.companies.find(c => c.id === payroll.companyId)
  return {
    id: payroll.id,
    period: payroll.period,
    periodLabel: payroll.periodLabel,
    status: payroll.status,
    stampedAt: payroll.stampedAt || null,
    signedAt: payroll.signedAt || null,
    uuid: payroll.uuid || null,
    companyName: company?.name || 'Empresa desconocida',
    companyRfc: company?.rfc || '',
    myPerceptions,
    myDeductions,
    myNet: myPerceptions - myDeductions,
  }
}

export async function getPayrolls(companyIds, filters = {}) {
  await delay(300, 600)

  let payrolls = db.payrolls
  if (companyIds) {
    payrolls = payrolls.filter(p => companyIds.includes(p.companyId))
  }

  if (filters.status) {
    payrolls = payrolls.filter(p => p.status === filters.status)
  }
  if (filters.period) {
    payrolls = payrolls.filter(p => p.period === filters.period)
  }
  if (filters.search) {
    const query = filters.search.toLowerCase()
    payrolls = payrolls.filter(p =>
      p.periodLabel.toLowerCase().includes(query) ||
      (db.companies.find(c => c.id === p.companyId)?.name || '').toLowerCase().includes(query)
    )
  }

  return ok(
    payrolls.map(p => {
      const company = db.companies.find(c => c.id === p.companyId)
      return {
        ...p,
        companyName: company?.name || 'Empresa desconocida',
        companyRfc: company?.rfc || '',
      }
    }),
  )
}

export async function getPayrollById(id) {
  await delay(200, 500)

  const payroll = db.payrolls.find(p => p.id === Number(id))
  if (payroll) {
    const company = db.companies.find(c => c.id === payroll.companyId)
    return ok({
      ...payroll,
      companyName: company?.name || 'Empresa desconocida',
      companyRfc: company?.rfc || '',
    })
  }
  return error('Nómina no encontrada', 'NOT_FOUND')
}

export async function createPayroll(data) {
  await delay(400, 800)

  const newPayroll = {
    id: db.payrolls.length + 1,
    ...data,
    status: 'pendiente',
    createdAt: new Date().toISOString(),
  }
  db.payrolls.push(newPayroll)

  return ok(newPayroll, {}, 'Nómina creada correctamente')
}

export async function updatePayroll(id, data) {
  await delay(300, 600)

  const index = db.payrolls.findIndex(p => p.id === Number(id))
  if (index !== -1) {
    db.payrolls[index] = { ...db.payrolls[index], ...data }
    return ok(db.payrolls[index], {}, 'Nómina actualizada correctamente')
  }
  return error('Nómina no encontrada', 'NOT_FOUND')
}

export async function deletePayroll(id) {
  await delay(200, 500)

  const index = db.payrolls.findIndex(p => p.id === Number(id))
  if (index !== -1) {
    db.payrolls.splice(index, 1)
    return ok(null, {}, 'Nómina eliminada correctamente')
  }
  return error('Nómina no encontrada', 'NOT_FOUND')
}

export async function stampPayroll(id) {
  await delay(500, 1000)

  const index = db.payrolls.findIndex(p => p.id === Number(id))
  if (index !== -1) {
    const payroll = db.payrolls[index]
    if (payroll.status === 'pendiente' || payroll.status === 'procesando') {
      payroll.status = 'timbrada'
      payroll.stampedAt = new Date().toISOString()
      payroll.uuid = generateUUID()
      return ok(payroll, {}, 'Nómina timbrada correctamente')
    }
    return error('La nómina no está en estado válido para timbrar', 'INVALID_STATE')
  }
  return error('Nómina no encontrada', 'NOT_FOUND')
}

export async function signPayroll(id) {
  await delay(500, 1000)

  const index = db.payrolls.findIndex(p => p.id === Number(id))
  if (index !== -1) {
    const payroll = db.payrolls[index]
    if (payroll.status === 'timbrada') {
      payroll.status = 'firmada'
      payroll.signedAt = new Date().toISOString()
      track('nomina_firmada', { companyId: payroll.companyId, payrollId: payroll.id })
      return ok(payroll, {}, 'Nómina firmada correctamente')
    }
    return error('La nómina debe estar timbrada para firmar', 'INVALID_STATE')
  }
  return error('Nómina no encontrada', 'NOT_FOUND')
}

export async function cancelPayroll(id, data = {}) {
  await delay(500, 1000)

  const index = db.payrolls.findIndex(p => p.id === Number(id))
  if (index !== -1) {
    const payroll = db.payrolls[index]
    if (payroll.status === 'timbrada' || payroll.status === 'firmada') {
      payroll.status = 'cancelada'
      payroll.cancelledAt = new Date().toISOString()
      payroll.cancelMotivo = data.motivo
      return ok(payroll, {}, 'Solicitud de cancelación enviada')
    }
    return error('La nómina no se puede cancelar en su estado actual', 'INVALID_STATE')
  }
  return error('Nómina no encontrada', 'NOT_FOUND')
}

function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0
    const v = c === 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}
export async function getEmployeePayrolls(employeeId) {
  await delay(250, 550)

  const employee = employeeForUser(employeeId)
  if (!employee) return error('Empleado no encontrado', 'NOT_FOUND')

  const list = db.payrolls
    .filter(p => p.companyId === employee.companyId && ['timbrada', 'firmada'].includes(p.status))
    .map(p => employeePayrollView(p, employee))
    .sort((a, b) => new Date(b.stampedAt || 0) - new Date(a.stampedAt || 0))

  return ok(list)
}

export async function getEmployeePayrollById(employeeId, payrollId) {
  await delay(200, 450)

  const employee = employeeForUser(employeeId)
  if (!employee) return error('Empleado no encontrado', 'NOT_FOUND')

  const payroll = db.payrolls.find(p => p.id === Number(payrollId))
  if (!payroll || payroll.companyId !== employee.companyId || !['timbrada', 'firmada'].includes(payroll.status)) {
    return error('Nómina no encontrada', 'NOT_FOUND')
  }

  return ok(employeePayrollView(payroll, employee))
}
