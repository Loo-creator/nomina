import { db, getNextId } from './_db'
import { delay, ok, error } from './helpers/responses'
import { track } from '@/shared/utils/telemetry'

const TYPE_LABELS = {
  timbrado: 'Nómina timbrada',
  entrega: 'XML/PDF entregado',
  acuse: 'Acuse de firma',
  alerta: 'Alerta / incidencia',
}

const NOTIFICATION_TYPES = new Set(Object.keys(TYPE_LABELS))
const NOTIFICATION_STATUS = new Set(['entregada', 'fallida', 'rebotada'])

function companyOf(companyId) {
  return db.companies.find(c => c.id === companyId) || null
}

function withCompany(n) {
  const company = companyOf(n.companyId)
  return {
    ...n,
    typeLabel: TYPE_LABELS[n.type] || n.type,
    companyName: company?.name || 'Empresa desconocida',
    companyRfc: company?.rfc || '',
  }
}

function ensureSeeded() {
  if (!Array.isArray(db.notificationEvents)) db.notificationEvents = []
  if (db.notificationEvents.length) return

  const daysAgo = (days, hour, minute) => {
    const d = new Date()
    d.setDate(d.getDate() - days)
    d.setHours(hour, minute, 0, 0)
    return d.toISOString()
  }

  const seeds = [
    { tenantId: 1, companyId: 1, type: 'timbrado', status: 'entregada', to: 'juan.perez@empresademo.com', subject: 'Nómina Enero 2024 timbrada (CFDI)', period: 'Enero 2024', uuid: 'A1B2C3D4-E5F6-7890-ABCD-EF1234567890', sentAt: daysAgo(28, 10, 40), attempts: 1 },
    { tenantId: 1, companyId: 1, type: 'entrega', status: 'entregada', to: 'maria.gonzalez@empresademo.com', subject: 'Recibo de nómina Enero 2024 (XML + PDF)', period: 'Enero 2024', uuid: 'A1B2C3D4-E5F6-7890-ABCD-EF1234567890', sentAt: daysAgo(28, 11, 5), attempts: 1 },
    { tenantId: 1, companyId: 1, type: 'acuse', status: 'entregada', to: 'carlos.rodriguez@empresademo.com', subject: 'Acuse de firma — nómina Enero 2024', period: 'Enero 2024', uuid: 'A1B2C3D4-E5F6-7890-ABCD-EF1234567890', sentAt: daysAgo(27, 9, 20), attempts: 1 },
    { tenantId: 1, companyId: 1, type: 'timbrado', status: 'entregada', to: 'ana.lopez@empresademo.com', subject: 'Nómina Febrero 2024 timbrada (CFDI)', period: 'Febrero 2024', uuid: 'B2C3D4E5-F6A7-8901-BCDE-F23456789012', sentAt: daysAgo(18, 11, 15), attempts: 1 },
    { tenantId: 1, companyId: 1, type: 'entrega', status: 'rebotada', to: 'juanperez@empresademo.com', subject: 'Recibo de nómina Febrero 2024 (XML + PDF)', period: 'Febrero 2024', uuid: 'B2C3D4E5-F6A7-8901-BCDE-F23456789012', sentAt: daysAgo(18, 11, 30), attempts: 2 },
    { tenantId: 1, companyId: 1, type: 'timbrado', status: 'fallida', to: 'ana.lopez@empresademo.com', subject: 'Nómina Marzo 2024 timbrada (CFDI)', period: 'Marzo 2024', uuid: null, sentAt: daysAgo(9, 8, 10), attempts: 3 },
    { tenantId: 1, companyId: 1, type: 'alerta', status: 'entregada', to: 'contacto@empresademo.com', subject: 'Incidencia: 1 registro con error RFC_NOT_FOUND', period: 'Marzo 2024', uuid: null, sentAt: daysAgo(6, 9, 5), attempts: 1 },
    { tenantId: 1, companyId: 2, type: 'timbrado', status: 'entregada', to: 'roberto.martinez@techsolutions.com', subject: 'Nómina Enero 2024 timbrada (CFDI)', period: 'Enero 2024', uuid: 'C3D4E5F6-A7B8-9012-CDEF-345678901234', sentAt: daysAgo(29, 14, 20), attempts: 1 },
    { tenantId: 1, companyId: 2, type: 'entrega', status: 'fallida', to: 'rmartinez@techsolutions.com', subject: 'Recibo de nómina Enero 2024 (XML + PDF)', period: 'Enero 2024', uuid: 'C3D4E5F6-A7B8-9012-CDEF-345678901234', sentAt: daysAgo(29, 14, 55), attempts: 2 },
    { tenantId: 2, companyId: 3, type: 'timbrado', status: 'entregada', to: 'ventas@comercializadoranorte.com', subject: 'Nómina Enero 2024 timbrada (CFDI)', period: 'Enero 2024', uuid: null, sentAt: daysAgo(30, 13, 30), attempts: 1 },
    { tenantId: 2, companyId: 3, type: 'alerta', status: 'rebotada', to: 'nomina@comercializadoranorte.com', subject: 'Alerta: certificado CSD próximo a vencer', period: '—', uuid: null, sentAt: daysAgo(12, 16, 45), attempts: 2 },
    { tenantId: 1, companyId: 1, type: 'acuse', status: 'entregada', to: 'maria.gonzalez@empresademo.com', subject: 'Acuse de firma — nómina Febrero 2024', period: 'Febrero 2024', uuid: 'B2C3D4E5-F6A7-8901-BCDE-F23456789012', sentAt: daysAgo(17, 10, 5), attempts: 1 },
  ]

  seeds.forEach(seed => {
    db.notificationEvents.push({
      id: getNextId('notificationEvents'),
      ...seed,
    })
  })
}

export async function getNotifications(tenantId, filters = {}) {
  await delay(200, 450)
  ensureSeeded()

  const tenant = db.tenants.find(t => t.id === Number(tenantId))
  if (!tenant) return error('Cliente no encontrado', 'NOT_FOUND')

  let list = db.notificationEvents
    .filter(n => n.tenantId === tenant.id)
    .map(withCompany)

  if (filters.companyId) list = list.filter(n => n.companyId === Number(filters.companyId))
  if (filters.type && NOTIFICATION_TYPES.has(filters.type)) list = list.filter(n => n.type === filters.type)
  if (filters.status && NOTIFICATION_STATUS.has(filters.status)) list = list.filter(n => n.status === filters.status)
  if (filters.search) {
    const q = String(filters.search).toLowerCase()
    list = list.filter(n =>
      (n.to || '').toLowerCase().includes(q) ||
      (n.subject || '').toLowerCase().includes(q) ||
      (n.period || '').toLowerCase().includes(q) ||
      (n.companyName || '').toLowerCase().includes(q)
    )
  }

  return ok(list.sort((a, b) => new Date(b.sentAt) - new Date(a.sentAt)))
}

export async function resendNotification(notificationId) {
  await delay(400, 900)
  ensureSeeded()

  const index = db.notificationEvents.findIndex(n => n.id === Number(notificationId))
  if (index === -1) return error('Notificación no encontrada', 'NOT_FOUND')

  const current = db.notificationEvents[index]
  const tenant = db.tenants.find(t => t.id === current.tenantId)
  if (tenant?.status === 'suspended') {
    return error('La cuenta está suspendida; no se pueden reenviar notificaciones', 'TENANT_SUSPENDED')
  }

  track('notificacion_reenviada', { tenantId: current.tenantId, companyId: current.companyId, type: current.type })
  db.notificationEvents[index] = {
    ...current,
    status: 'entregada',
    attempts: (current.attempts || 1) + 1,
    sentAt: new Date().toISOString(),
  }
  return ok(withCompany(db.notificationEvents[index]), {}, 'Notificación reenviada correctamente')
}

export const NOTIFICATION_TYPE_OPTIONS = Object.entries(TYPE_LABELS).map(([value, label]) => ({ value, label }))
export const NOTIFICATION_STATUS_OPTIONS = [
  { value: 'entregada', label: 'Entregada' },
  { value: 'fallida', label: 'Fallida' },
  { value: 'rebotada', label: 'Rebotada' },
]
