import { db } from './_db'
import { delay, ok } from './helpers/responses'

export async function getDashboardStats(userId, companyIds) {
  await delay(300, 600)

  const ids = Array.isArray(companyIds) ? companyIds : db.companies.map(c => c.id)

  const userCompanies = db.companies.filter(c => ids.includes(c.id))
  const userEmployees = db.employees.filter(e => ids.includes(e.companyId))
  const userPayrolls = db.payrolls.filter(p => ids.includes(p.companyId))

  const stats = {
    totalCompanies: userCompanies.length,
    totalEmployees: userEmployees.filter(e => e.status === 'active').length,
    pendingPayrolls: userPayrolls.filter(p => p.status === 'pendiente' || p.status === 'procesando').length,
    stampedPayrolls: userPayrolls.filter(p => p.status === 'timbrada' || p.status === 'firmada').length,
  }

  const recentPayrolls = userPayrolls
    .sort((a, b) => new Date(b.createdAt || b.stampedAt || 0) - new Date(a.createdAt || a.stampedAt || 0))
    .slice(0, 5)
    .map(p => ({
      ...p,
      companyName: db.companies.find(c => c.id === p.companyId)?.name || 'Empresa desconocida',
    }))

  const pendingActions = userPayrolls.filter(p => p.status === 'pendiente' || p.status === 'procesando').length

  return ok({ stats, recentPayrolls, pendingActions })
}