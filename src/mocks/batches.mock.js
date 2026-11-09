import { db, getNextId } from './_db'
import { delay, ok, error } from './helpers/responses'
import { track } from '@/shared/utils/telemetry'

const PER_RECORD_MS = 45
const MAX_FILE_BYTES = 10 * 1024 * 1024
const VALID_EXTENSIONS = ['xlsx', 'csv', 'txt']

const FIRST_NAMES = ['Juan', 'María', 'Carlos', 'Ana', 'José', 'Laura', 'Miguel', 'Sofía', 'Diego', 'Paola', 'Ricardo', 'Elena', 'Fernando', 'Daniela', 'Alejandro', 'Gabriela']
const LAST_NAMES = ['Pérez', 'González', 'Hernández', 'Martínez', 'López', 'García', 'Rodríguez', 'Sánchez', 'Ramírez', 'Torres', 'Flores', 'Rivera', 'Morales', 'Ortiz', 'Castillo', 'Vargas']
const ERROR_CODES = [
  { code: 'CLABE_MISSING', message: 'CLABE interbancaria ausente o de longitud inválida' },
  { code: 'CURP_MISMATCH', message: 'La CURP no coincide con el registro del IMSS/SAT' },
  { code: 'SALARIO_CERO', message: 'Total de percepciones igual a cero' },
]

function hashString(str) {
  let h = 1779033703 ^ str.length
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353)
    h = (h << 13) | (h >>> 7)
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

function fileExtension(name) {
  const parts = String(name || '').split('.')
  return parts.length > 1 ? parts.pop().toLowerCase() : ''
}

function findTenant(tenantId) {
  return db.tenants.find(t => t.id === Number(tenantId)) || null
}

function genUuid(rand) {
  const hex = '0123456789ABCDEF'
  const section = (n) => Array.from({ length: n }, () => hex[Math.floor(rand() * 16)]).join('')
  return `${section(8)}-${section(4)}-4${section(3)}-${['8', '9', 'A', 'B'][Math.floor(rand() * 4)]}${section(3)}-${section(12)}`
}

function nextBatchId() {
  return db.payrollBatches.reduce((max, b) => Math.max(max, b.id), 0) + 1
}

function nextRecordId() {
  return db.payrollBatches.reduce((max, b) => b.records.reduce((m, r) => Math.max(m, r.id), max), 0) + 1
}

function ensureSeeded() {
  if (!Array.isArray(db.payrollBatches)) db.payrollBatches = []
  if (db.payrollBatches.length) return

  const seededTenants = [1, 2]
  seededTenants.forEach((tenantId) => {
    const tenant = findTenant(tenantId)
    if (!tenant) return
    const plan = buildPlan(tenantId, tenantId === 1 ? 'nomina_marzo_multi_2024.xlsx' : 'payroll_marzo_2024.txt', tenantId === 1 ? 248_320 : 184_002, true)
    if (!plan) return

    if (tenantId === 1) {
      const batch = materializeBatch({
        tenantId,
        fileName: 'nomina_marzo_multi_2024.xlsx',
        fileSize: 248_320,
        skipErrors: true,
        createdBy: 'Cliente Demo',
        plan,
        startedAt: daysAgo(6, 9, 24),
        seedKey: 'seed-batch-1',
      })
      batch.records.forEach(r => { r.status = r.plannedStatus; r.processedAt = batch.startedAt; if (r.status === 'timbrado') r.uuid = r.uuid || genUuid(Math.random) })
      finalizeBatch(batch)
      batch.processedAt = new Date(new Date(batch.startedAt).getTime() + 180000).toISOString()
      db.payrollBatches.push(batch)

      const okPlan = buildPlan(1, 'nomina_febrero_multi_2024.csv', 231_004, true)
      const okBatch = materializeBatch({
        tenantId: 1,
        fileName: 'nomina_febrero_multi_2024.csv',
        fileSize: 231_004,
        skipErrors: true,
        createdBy: 'Laura Gómez',
        plan: okPlan,
        startedAt: daysAgo(34, 10, 5),
        seedKey: 'seed-batch-2',
      })
      okBatch.records.forEach(r => { r.plannedStatus = 'timbrado'; r.status = 'timbrado'; r.errorCode = null; r.errorMessage = null; r.retryable = false; r.processedAt = okBatch.startedAt; r.uuid = genUuid(Math.random) })
      finalizeBatch(okBatch)
      okBatch.processedAt = new Date(new Date(okBatch.startedAt).getTime() + 150000).toISOString()
      db.payrollBatches.push(okBatch)
    } else {
      const broken = materializeBatch({
        tenantId,
        fileName: 'payroll_marzo_2024.txt',
        fileSize: 184_002,
        skipErrors: false,
        createdBy: 'Sofía Garza',
        plan,
        startedAt: daysAgo(3, 12, 40),
        seedKey: 'seed-batch-3',
      })
      broken.records.forEach(r => { r.status = 'pendiente' })
      broken.status = 'fallida'
      broken.failureReason = 'Columnas requeridas ausentes en el TXT: CURP, RFC_EMPRESA, NETO_A_PAGAR.'
      broken.processedCount = 0
      broken.successCount = 0
      broken.errorCount = 0
      db.payrollBatches.push(broken)
    }
  })
}

function daysAgo(days, hour, minute) {
  const d = new Date()
  d.setDate(d.getDate() - days)
  d.setHours(hour, minute, 0, 0)
  return d.toISOString()
}

function previousMonthPeriod() {
  const d = new Date()
  d.setDate(1)
  d.setMonth(d.getMonth() - 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

function buildPlan(tenantId, fileName, fileSize, forSeed = false) {
  const tenant = findTenant(tenantId)
  if (!tenant) return null

  const companies = db.companies.filter(c => c.tenantId === tenant.id && c.status === 'active')
  const seed = hashString(`${tenantId}|${fileName}|${fileSize}`)
  const rand = mulberry32(seed)

  const shuffled = [...companies]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }

  const known = shuffled.slice(0, Math.min(2, shuffled.length))
  const plan = known.map(company => ({
    rfc: company.rfc,
    companyId: company.id,
    companyName: company.name,
    records: 6 + Math.floor(rand() * 10),
    errorRate: 0.05,
    known: true,
  }))

  if (companies.length) {
    plan.push({
      rfc: 'ZZZ990000XX9',
      companyId: null,
      companyName: null,
      records: 4 + Math.floor(rand() * 6),
      errorRate: 1,
      known: false,
    })
  }

  return { tenant, companies, plan, seed }
}

function planSummary(tenantId, fileName, fileSize) {
  const built = buildPlan(tenantId, fileName, fileSize)
  if (!built) return null
  const { tenant, companies, plan } = built
  const totalRecords = plan.reduce((sum, p) => sum + p.records, 0)
  const unknown = plan.filter(p => !p.known)
  const issues = []
  if (!companies.length) {
    issues.push({ level: 'danger', message: 'La cuenta no tiene RFC emisores activos; no es posible procesar el lote.' })
  }
  unknown.forEach(p => {
    issues.push({ level: 'warning', message: `RFC ${p.rfc} no está dado de alta en esta cuenta: sus ${p.records} registro(s) se marcarán con error RFC_NOT_FOUND.` })
  })
  return {
    fileName,
    fileSize,
    tenantId: tenant.id,
    totalRecords,
    rfcs: plan.map(p => ({ rfc: p.rfc, companyId: p.companyId, companyName: p.companyName, records: p.records, known: p.known })),
    issues,
    canProcess: companies.length > 0,
  }
}

function materializeBatch({ tenantId, fileName, fileSize, skipErrors, createdBy, plan, startedAt, seedKey }) {
  const built = plan || buildPlan(tenantId, fileName, fileSize)
  const rand = mulberry32(hashString(seedKey || `${tenantId}|${fileName}|${fileSize}|records`))
  const period = previousMonthPeriod()
  let recordId = nextRecordId()

  const records = []
  built.plan.forEach(p => {
    for (let i = 0; i < p.records; i++) {
      const first = FIRST_NAMES[Math.floor(rand() * FIRST_NAMES.length)]
      const last = LAST_NAMES[Math.floor(rand() * LAST_NAMES.length)]
      const isError = p.known ? rand() < p.errorRate : true
      const errorDef = isError
        ? (p.known ? ERROR_CODES[Math.floor(rand() * ERROR_CODES.length)] : { code: 'RFC_NOT_FOUND', message: 'El RFC emisor no está dado de alta en esta cuenta' })
        : null
      records.push({
        id: recordId++,
        rfc: p.rfc,
        companyId: p.companyId,
        employee: `${first} ${last}`,
        curp: `CURP${Math.floor(rand() * 1e10).toString().padStart(10, '0')}`,
        period,
        netPay: 8000 + Math.floor(rand() * 37000),
        plannedStatus: isError ? 'error' : 'timbrado',
        status: 'pendiente',
        errorCode: errorDef?.code ?? null,
        errorMessage: errorDef?.message ?? null,
        retryable: Boolean(errorDef && errorDef.code !== 'RFC_NOT_FOUND'),
        uuid: null,
        processedAt: null,
      })
    }
  })

  return {
    id: nextBatchId(),
    tenantId: Number(tenantId),
    fileName,
    fileSize,
    fileExt: fileExtension(fileName),
    status: 'procesando',
    options: { skipErrors: Boolean(skipErrors) },
    createdBy: createdBy || 'Desconocido',
    startedAt: startedAt || new Date().toISOString(),
    processedAt: null,
    failureReason: null,
    totalRecords: records.length,
    processedCount: 0,
    successCount: 0,
    errorCount: 0,
    records,
  }
}

function summarize(batch) {
  const byRfc = new Map()
  batch.records.forEach(r => {
    const key = r.rfc
    if (!byRfc.has(key)) {
      byRfc.set(key, { rfc: key, companyId: r.companyId, companyName: null, total: 0, ok: 0, failed: 0, pending: 0 })
    }
    const entry = byRfc.get(key)
    entry.total += 1
    if (r.status === 'timbrado') entry.ok += 1
    else if (r.status === 'error') entry.failed += 1
    else entry.pending += 1
  })
  const rfcs = [...byRfc.values()].map(entry => {
    const company = entry.companyId ? db.companies.find(c => c.id === entry.companyId) : null
    return { ...entry, companyName: company?.name ?? null }
  })
  return { ...batch, rfcs }
}

function finalizeBatch(batch) {
  const processed = batch.records.filter(r => r.status !== 'pendiente').length
  batch.processedCount = processed
  batch.successCount = batch.records.filter(r => r.status === 'timbrado').length
  batch.errorCount = batch.records.filter(r => r.status === 'error').length
  if (processed >= batch.totalRecords) {
    batch.status = batch.errorCount > 0 ? 'completada_con_errores' : 'completada'
    batch.processedAt = new Date().toISOString()
  }
  return batch
}

export async function analyzeLoadFile({ tenantId, fileName, fileSize }) {
  await delay(600, 1100)

  const tenant = findTenant(tenantId)
  if (!tenant) return error('Cliente no encontrado', 'NOT_FOUND')
  if (tenant.status === 'suspended') return error('La cuenta está suspendida', 'TENANT_SUSPENDED')

  const ext = fileExtension(fileName)
  if (!VALID_EXTENSIONS.includes(ext)) {
    return error('Formato no permitido. Usa .xlsx, .csv o .txt', 'INVALID_FORMAT')
  }
  if (!Number.isFinite(fileSize) || fileSize <= 0) {
    return error('El archivo está vacío o es ilegible', 'EMPTY_FILE')
  }
  if (fileSize > MAX_FILE_BYTES) {
    return error('El archivo supera el máximo de 10 MB', 'FILE_TOO_LARGE')
  }

  const summary = planSummary(tenant.id, fileName, fileSize)
  if (!summary) return error('No se pudo analizar el archivo', 'ANALYSIS_FAILED')
  return ok(summary)
}

export async function createBatch({ tenantId, fileName, fileSize, skipErrors, createdBy }) {
  await delay(500, 900)
  ensureSeeded()

  const tenant = findTenant(tenantId)
  if (!tenant) return error('Cliente no encontrado', 'NOT_FOUND')
  if (tenant.status === 'suspended') return error('La cuenta está suspendida', 'TENANT_SUSPENDED')

  const ext = fileExtension(fileName)
  if (!VALID_EXTENSIONS.includes(ext)) return error('Formato no permitido. Usa .xlsx, .csv o .txt', 'INVALID_FORMAT')
  if (!Number.isFinite(fileSize) || fileSize <= 0 || fileSize > MAX_FILE_BYTES) {
    return error('Archivo inválido o demasiado grande (máx. 10 MB)', 'INVALID_FILE')
  }

  const built = buildPlan(tenant.id, fileName, fileSize)
  if (!built || !built.companies.length) {
    return error('La cuenta no tiene RFC emisores activos; el lote no se puede procesar', 'NO_ACTIVE_RFC')
  }

  const batch = materializeBatch({ tenantId: tenant.id, fileName, fileSize, skipErrors, createdBy, plan: built })
  db.payrollBatches.push(batch)
  track('carga_creada', { tenantId: tenant.id, rfcs: built.plan.length, records: batch.totalRecords, source: 'multi' })
  return ok(summarize(batch), {}, 'Lote creado; procesamiento iniciado')
}

export async function getBatches(tenantId) {
  await delay(200, 450)
  ensureSeeded()

  const tenant = findTenant(tenantId)
  if (!tenant) return error('Cliente no encontrado', 'NOT_FOUND')

  const list = db.payrollBatches
    .filter(b => b.tenantId === tenant.id)
    .map(b => {
      const { records, ...rest } = summarize(b)
      return rest
    })
    .sort((a, b) => new Date(b.startedAt) - new Date(a.startedAt))

  return ok(list)
}

export async function getBatch(batchId) {
  await delay(150, 300)
  ensureSeeded()

  const batch = db.payrollBatches.find(b => b.id === Number(batchId))
  if (!batch) return error('Lote no encontrado', 'NOT_FOUND')

  if (batch.status === 'procesando') {
    const elapsed = Date.now() - new Date(batch.startedAt).getTime()
    let processed = Math.min(batch.totalRecords, Math.floor(elapsed / PER_RECORD_MS))
    let stoppedByError = null

    if (!batch.options.skipErrors) {
      const firstErrorIndex = batch.records.findIndex(r => r.plannedStatus === 'error')
      if (firstErrorIndex !== -1 && processed > firstErrorIndex) {
        processed = firstErrorIndex + 1
        stoppedByError = { record: batch.records[firstErrorIndex], index: firstErrorIndex }
      }
    }

    batch.records.slice(0, processed).forEach(r => {
      if (r.status === 'pendiente') {
        r.status = r.plannedStatus
        r.processedAt = new Date().toISOString()
        if (r.status === 'timbrado' && !r.uuid) r.uuid = genUuid(Math.random)
      }
    })

    batch.processedCount = batch.records.filter(r => r.status !== 'pendiente').length
    batch.successCount = batch.records.filter(r => r.status === 'timbrado').length
    batch.errorCount = batch.records.filter(r => r.status === 'error').length

    if (stoppedByError) {
      batch.status = 'fallida'
      batch.failureReason = `Lote detenido en el registro ${stoppedByError.index + 1}: ${stoppedByError.record.errorMessage} (${stoppedByError.record.rfc}).`
      batch.processedAt = new Date().toISOString()
      return ok(summarize(batch))
    }

    finalizeBatch(batch)
  }

  return ok(summarize(batch))
}

export async function retryBatchErrors(batchId) {
  await delay(600, 1100)
  ensureSeeded()

  const batch = db.payrollBatches.find(b => b.id === Number(batchId))
  if (!batch) return error('Lote no encontrado', 'NOT_FOUND')

  const retryable = batch.records.filter(r => r.status === 'error' && r.retryable)
  if (!retryable.length) {
    return error('No hay errores reintentables. Los errores por RFC no registrado requieren dar de alta el RFC en la cuenta.', 'NOTHING_RETRYABLE')
  }

  track('carga_reintentada', { batchId: batch.id, retried: retryable.length })
  retryable.forEach(r => {
    r.status = 'timbrado'
    r.uuid = genUuid(Math.random)
    r.processedAt = new Date().toISOString()
    r.errorCode = null
    r.errorMessage = null
    r.retryable = false
  })

  batch.successCount = batch.records.filter(r => r.status === 'timbrado').length
  batch.errorCount = batch.records.filter(r => r.status === 'error').length
  batch.processedCount = batch.records.filter(r => r.status !== 'pendiente').length
  batch.status = batch.errorCount > 0 ? 'completada_con_errores' : 'completada'
  batch.processedAt = new Date().toISOString()

  return ok(summarize(batch), {}, `${retryable.length} registro(s) reprocesados correctamente`)
}
function withCompany(load) {
  const company = db.companies.find(c => c.id === load.companyId)
  return { ...load, companyName: company?.name || 'Empresa desconocida' }
}

export async function getPayrollLoads(companyIds = null, filters = {}) {
  await delay(250, 600)

  let list = db.payrollLoads.map(withCompany)

  if (companyIds) {
    list = list.filter(l => companyIds.includes(l.companyId))
  }
  if (filters.companyId) {
    list = list.filter(l => l.companyId === Number(filters.companyId))
  }
  if (filters.status) {
    list = list.filter(l => l.status === filters.status)
  }
  if (filters.search) {
    const q = filters.search.toLowerCase()
    list = list.filter(l => l.fileName.toLowerCase().includes(q) || l.companyName.toLowerCase().includes(q))
  }

  return ok(list.sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt)))
}

export async function createPayrollLoad(data) {
  await delay(500, 1000)

  const load = {
    id: getNextId('payrollLoads'),
    status: 'procesando',
    totalRecords: data.totalRecords || 0,
    successful: 0,
    failed: 0,
    uploadedAt: new Date().toISOString(),
    processedAt: null,
    errors: [],
    ...data,
  }
  db.payrollLoads.push(load)
  track('carga_creada', { companyId: load.companyId, records: load.totalRecords, source: 'simple' })

  setTimeout(() => {
    const stored = db.payrollLoads.find(l => l.id === load.id)
    if (stored) {
      stored.status = 'completada'
      stored.successful = stored.totalRecords
      stored.processedAt = new Date().toISOString()
    }
  }, 4000)

  return ok(withCompany(load), {}, 'Archivo cargado, procesando insumos...')
}

export async function retryPayrollLoad(id) {
  await delay(400, 800)

  const load = db.payrollLoads.find(l => l.id === Number(id))
  if (!load) return error('Carga no encontrada', 'NOT_FOUND')

  load.status = 'procesando'
  load.processedAt = null
  setTimeout(() => {
    load.status = 'completada'
    load.successful = load.totalRecords
    load.processedAt = new Date().toISOString()
  }, 3000)

  return ok(withCompany(load), {}, 'Reintentando procesamiento...')
}
