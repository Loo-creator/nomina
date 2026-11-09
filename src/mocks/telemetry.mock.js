import { db, getNextId } from './_db'
import { delay, ok, error } from './helpers/responses'

function daysAgo(days, hour, minute = 0) {
  const d = new Date()
  d.setDate(d.getDate() - days)
  d.setHours(hour, minute, 0, 0)
  return d.toISOString()
}

function ensureSeeded() {
  if (!Array.isArray(db.metricEvents)) db.metricEvents = []
  if (db.metricEvents.length) return

  const seeds = []
  for (let i = 30; i >= 0; i--) {
    const base = 3 + Math.round(((i * 37) % 11) / 3)
    for (let j = 0; j < base; j++) seeds.push({ event: 'login', at: daysAgo(i, 8 + j, (j * 13) % 60), props: {} })
    if (i % 3 === 0) seeds.push({ event: 'carga_creada', at: daysAgo(i, 9, (i * 7) % 60), props: { rfcs: 1 + (i % 3), records: 12 + (i % 20) } })
    if (i % 4 === 0) seeds.push({ event: 'nomina_timbrada', at: daysAgo(i, 10, (i * 11) % 60), props: {} })
    if (i % 5 === 0) seeds.push({ event: 'nomina_firmada', at: daysAgo(i, 11, (i * 17) % 60), props: {} })
    if (i % 9 === 0) seeds.push({ event: 'paquete_descargado', at: daysAgo(i, 13, (i * 19) % 60), props: {} })
    if (i % 6 === 0) seeds.push({ event: 'login_fallido', at: daysAgo(i, 7 + (i % 10), (i * 29) % 60), props: { reason: 'INVALID_CREDENTIALS' } })
  }
  seeds.push(
    { event: 'carga_creada', at: daysAgo(2, 9, 30), props: { rfcs: 2, records: 34, errorCode: 'CURP_MISMATCH' } },
    { event: 'carga_reintentada', at: daysAgo(2, 9, 45), props: {} },
    { event: 'paquete_descargado', at: daysAgo(1, 12, 15), props: {} },
    { event: 'invitacion_aceptada', at: daysAgo(1, 16, 40), props: {} },
    { event: 'notificacion_reenviada', at: daysAgo(1, 17, 5), props: {} },
    { event: 'nomina_firmada', at: daysAgo(1, 11, 20), props: {} },
  )

  seeds.forEach(seed => {
    db.metricEvents.push({
      id: getNextId('metricEvents'),
      ...seed,
      props: seed.props || {},
    })
  })
}

export async function trackEvent(event, props = {}) {
  await delay(30, 80)
  ensureSeeded()

  if (!event || typeof event !== 'string') return error('Evento inválido', 'INVALID_EVENT')

  const cleanEvent = String(event).slice(0, 64)
  const cleanProps = {}
  Object.entries(props || {}).slice(0, 12).forEach(([key, value]) => {
    const k = String(key).replace(/[^a-zA-Z0-9_]/g, '').slice(0, 32)
    if (!k) return
    if (value === null || value === undefined) return
    cleanProps[k] = typeof value === 'object' ? JSON.stringify(value).slice(0, 120) : String(value).slice(0, 120)
  })

  const entry = {
    id: getNextId('metricEvents'),
    event: cleanEvent,
    props: cleanProps,
    at: new Date().toISOString(),
  }
  db.metricEvents.push(entry)
  return ok(entry)
}

export async function getMetrics() {
  await delay(250, 500)
  ensureSeeded()

  const since = Date.now() - 30 * 86_400_000
  const recent = db.metricEvents.filter(e => new Date(e.at).getTime() >= since)

  const counts = recent.reduce((acc, e) => {
    acc[e.event] = (acc[e.event] || 0) + 1
    return acc
  }, {})

  const funnel = {
    cargas: counts.carga_creada || 0,
    timbradas: counts.nomina_timbrada || 0,
    firmadas: counts.nomina_firmada || 0,
    paquetes: counts.paquete_descargado || 0,
    invitacionesAceptadas: counts.invitacion_aceptada || 0,
    logins: counts.login || 0,
    loginsFallidos: counts.login_fallido || 0,
    reintentos: counts.carga_reintentada || 0,
    notificacionesReenviadas: counts.notificacion_reenviada || 0,
  }

  const funnelStages = [
    { key: 'cargas', label: 'Cargas creadas', value: funnel.cargas },
    { key: 'timbradas', label: 'Nóminas timbradas', value: funnel.timbradas },
    { key: 'firmadas', label: 'Nóminas firmadas', value: funnel.firmadas },
    { key: 'paquetes', label: 'Paquetes ZIP descargados', value: funnel.paquetes },
  ]
  const maxStage = Math.max(...funnelStages.map(s => s.value), 1)
  funnelStages.forEach(stage => {
    stage.percent = Math.round((stage.value / maxStage) * 100)
  })

  const completionRate = funnel.cargas > 0 ? Math.round((funnel.firmadas / funnel.cargas) * 100) : 0
  const failedLogins = funnel.loginsFallidos

  const errorFrequency = {}
  recent.forEach(e => {
    if (e.props?.errorCode) errorFrequency[e.props.errorCode] = (errorFrequency[e.props.errorCode] || 0) + 1
  })
  const topErrors = Object.entries(errorFrequency)
    .map(([code, count]) => ({ code, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)

  const recentEvents = [...recent]
    .sort((a, b) => new Date(b.at) - new Date(a.at))
    .slice(0, 12)
    .map(e => ({ id: e.id, event: e.event, at: e.at, props: e.props }))

  return ok({ funnel, funnelStages, completionRate, failedLogins, topErrors, recentEvents, totalEvents: recent.length })
}

export const FUNNEL_EVENT_LABELS = {
  login: 'Login',
  login_fallido: 'Login fallido',
  carga_creada: 'Carga de lote creada',
  carga_reintentada: 'Reintento de carga',
  nomina_timbrada: 'Nómina timbrada',
  nomina_firmada: 'Nómina firmada',
  paquete_descargado: 'Paquete ZIP descargado',
  invitacion_enviada: 'Invitación enviada',
  invitacion_aceptada: 'Invitación aceptada',
  notificacion_reenviada: 'Notificación reenviada',
}
