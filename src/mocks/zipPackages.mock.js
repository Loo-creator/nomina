import { db, getNextId } from './_db'
import { delay, ok, error } from './helpers/responses'

function now() {
  return new Date().toISOString()
}

function ensureSeeded() {
  if (!Array.isArray(db.zipPackages)) db.zipPackages = []
  if (db.zipPackages.length) return
  const daysAgo = (days, hour, minute = 0) => {
    const d = new Date()
    d.setDate(d.getDate() - days)
    d.setHours(hour, minute, 0, 0)
    return d.toISOString()
  }
  db.zipPackages.push(
    {
      id: getNextId('zipPackages'),
      tenantId: 1,
      payrollIds: [1, 4],
      count: 2,
      fileName: 'paquete_auditoria_nomikok_20260113.zip',
      status: 'terminado',
      createdAt: daysAgo(28, 15, 30),
      companyId: 1,
      loadId: null,
    },
    {
      id: getNextId('zipPackages'),
      tenantId: 1,
      payrollIds: [2],
      count: 1,
      fileName: 'paquete_auditoria_nomikok_20260213.zip',
      status: 'terminado',
      createdAt: daysAgo(18, 11, 20),
      companyId: 1,
      loadId: null,
    },
    {
      id: getNextId('zipPackages'),
      tenantId: 2,
      payrollIds: [2],
      count: 1,
      fileName: 'paquete_auditoria_nomikok_20260304.zip',
      status: 'error',
      createdAt: daysAgo(7, 9, 45),
      companyId: 3,
      loadId: null,
    },
  )
}

function withContext(pkg) {
  const company = db.companies.find(c => c.id === pkg.companyId)
  return {
    ...pkg,
    companyName: company?.name || 'Empresa desconocida',
    companyRfc: company?.rfc || '',
  }
}

export async function getZipPackages(tenantId) {
  await delay(200, 450)
  ensureSeeded()

  const tenant = db.tenants.find(t => t.id === Number(tenantId))
  if (!tenant) return error('Cliente no encontrado', 'NOT_FOUND')

  const list = db.zipPackages
    .filter(pkg => pkg.tenantId === tenant.id)
    .map(withContext)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

  return ok(list)
}

export async function registerZipPackage({ tenantId, payrolls, fileName, status = 'terminado' }) {
  await delay(100, 300)
  ensureSeeded()

  if (!Array.isArray(payrolls) || !payrolls.length) {
    return error('Selecciona al menos un comprobante', 'EMPTY_PACKAGE')
  }

  const tenant = db.tenants.find(t => t.id === Number(tenantId)) || null
  const companyId = payrolls[0]?.companyId || null
  const pkg = {
    id: getNextId('zipPackages'),
    tenantId: tenant ? tenant.id : null,
    payrollIds: payrolls.map(p => p.id),
    count: payrolls.length,
    fileName,
    status,
    createdAt: now(),
    companyId,
    loadId: null,
  }
  db.zipPackages.push(pkg)
  return ok(withContext(pkg), {}, 'Paquete ZIP registrado')
}
