import { db, getNextId } from './_db'
import { delay, ok, error } from './helpers/responses'

const TRACKED_KEYS = [
  ['companyName', 'Razón social'],
  ['rfc', 'RFC'],
  ['address', 'Dirección fiscal'],
  ['timezone', 'Zona horaria'],
  ['currency', 'Moneda'],
  ['dateFormat', 'Formato de fecha'],
  ['language', 'Idioma'],
  ['notifyPayrollStamped', 'Aviso: nómina timbrada'],
  ['notifyLoadErrors', 'Aviso: errores de carga'],
  ['notifyWeeklySummary', 'Aviso: resumen semanal'],
  ['notifyPaymentRun', 'Aviso: dispersión de pagos'],
]

function summarizeChanges(before, after) {
  const changes = TRACKED_KEYS
    .filter(([key]) => key in after && String(before[key] ?? '') !== String(after[key] ?? ''))
    .map(([key, label]) => `${label}: ${String(before[key] ?? '—')} → ${String(after[key] ?? '—')}`)
  return changes.length ? changes.join('; ') : 'Sin cambios detectados'
}

export async function getSettings() {
  await delay(200, 450)
  if (!Array.isArray(db.auditLog)) db.auditLog = []
  return ok({ ...db.settings })
}

export async function updateSettings(data, { section = 'Preferencias', actor = 'desconocido' } = {}) {
  await delay(400, 800)
  if (!Array.isArray(db.auditLog)) db.auditLog = []

  const before = { ...db.settings }
  db.settings = { ...db.settings, ...data }

  db.auditLog.push({
    id: getNextId('auditLog'),
    section,
    summary: summarizeChanges(before, db.settings),
    actor,
    at: new Date().toISOString(),
  })

  return ok({ ...db.settings }, {}, 'Configuración guardada correctamente')
}

export async function getAuditLog() {
  await delay(200, 450)
  if (!Array.isArray(db.auditLog)) db.auditLog = []
  return ok(
    [...db.auditLog].sort((a, b) => new Date(b.at) - new Date(a.at)),
  )
}
