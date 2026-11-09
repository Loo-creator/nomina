import { db, getNextId } from './_db'
import { delay, ok, error } from './helpers/responses'

export async function getFiscalData(companyIds = null) {
  await delay(250, 500)

  let list = db.fiscalData.map(f => ({
    ...f,
    companyName: db.companies.find(c => c.id === f.companyId)?.name || 'Empresa desconocida',
  }))

  if (companyIds) {
    list = list.filter(f => companyIds.includes(f.companyId))
  }

  return ok(list)
}

export async function getFiscalDataByCompany(companyId) {
  await delay(200, 400)
  const fiscal = db.fiscalData.find(f => f.companyId === Number(companyId))
  if (fiscal) {
    return ok({
      ...fiscal,
      companyName: db.companies.find(c => c.id === fiscal.companyId)?.name,
    })
  }
  return ok(null, {}, 'Sin datos fiscales registrados')
}

export async function upsertFiscalData(companyId, data) {
  await delay(400, 800)

  const index = db.fiscalData.findIndex(f => f.companyId === Number(companyId))
  if (index === -1) {
    const fiscal = { id: getNextId('fiscalData'), companyId: Number(companyId), ...data }
    db.fiscalData.push(fiscal)
    return ok(fiscal, {}, 'Datos fiscales guardados correctamente')
  }

  db.fiscalData[index] = { ...db.fiscalData[index], ...data }
  return ok(db.fiscalData[index], {}, 'Datos fiscales actualizados correctamente')
}

export async function queryCurp(curp) {
  await delay(500, 1000)

  const pattern = /^[A-Z]{4}\d{6}[HM][A-Z]{5}[A-Z0-9]\d$/
  const normalized = (curp || '').toUpperCase().trim()

  if (!pattern.test(normalized)) {
    return error('La CURP no tiene un formato válido', 'INVALID_CURP')
  }

  const record = db.curpQueries.find(q => q.curp === normalized)
  if (record) return ok(record, {}, 'CURP encontrada')

  return ok(
    { curp: normalized, valid: false, data: null },
    {},
    'CURP con formato válido (sin datos precargados en el mock)'
  )
}

export async function getInvoiceDesigns(companyIds = null) {
  await delay(200, 450)

  let list = db.invoiceDesigns.map(d => ({
    ...d,
    companyName: db.companies.find(c => c.id === d.companyId)?.name || 'Empresa desconocida',
  }))

  if (companyIds) {
    list = list.filter(d => companyIds.includes(d.companyId))
  }

  return ok(list)
}

export async function updateInvoiceDesign(id, data) {
  await delay(300, 600)

  const index = db.invoiceDesigns.findIndex(d => d.id === Number(id))
  if (index === -1) return error('Diseño no encontrado', 'NOT_FOUND')

  const current = db.invoiceDesigns[index]
  const versions = Array.isArray(current.versions) ? [...current.versions] : []
  versions.push({
    id: versions.length ? Math.max(...versions.map(v => v.id)) + 1 : 1,
    at: new Date().toISOString(),
    name: current.name,
    config: JSON.parse(JSON.stringify(current.config || {})),
  })
  if (versions.length > 10) versions.shift()

  db.invoiceDesigns[index] = {
    ...current,
    ...data,
    versions,
    config: { ...current.config, ...(data.config || {}) },
  }
  return ok(db.invoiceDesigns[index], {}, 'Diseño actualizado correctamente')
}

export async function getInvoiceDesignVersions(id) {
  await delay(150, 350)
  const design = db.invoiceDesigns.find(d => d.id === Number(id))
  if (!design) return error('Diseño no encontrado', 'NOT_FOUND')
  return ok([...(design.versions || [])].sort((a, b) => new Date(b.at) - new Date(a.at)))
}

export async function restoreInvoiceDesign(id, versionId) {
  await delay(250, 500)
  const index = db.invoiceDesigns.findIndex(d => d.id === Number(id))
  if (index === -1) return error('Diseño no encontrado', 'NOT_FOUND')

  const design = db.invoiceDesigns[index]
  const version = (design.versions || []).find(v => v.id === Number(versionId))
  if (!version) return error('Versión no encontrada', 'VERSION_NOT_FOUND')

  const versions = [...design.versions, {
    id: Math.max(...design.versions.map(v => v.id)) + 1,
    at: new Date().toISOString(),
    name: design.name,
    config: JSON.parse(JSON.stringify(design.config || {})),
  }].slice(-10)

  db.invoiceDesigns[index] = {
    ...design,
    name: version.name,
    config: JSON.parse(JSON.stringify(version.config)),
    versions,
  }
  return ok(db.invoiceDesigns[index], {}, `Versión del ${new Date(version.at).toLocaleString('es-MX')} restaurada`)
}

export async function testPacConnection(data) {
  await delay(800, 1500)
  
  // Simular validación de credenciales PAC
  if (!data.pacProvider || !data.pacUsername) {
    return error('Proveedor PAC y usuario son requeridos', 'INVALID_CREDENTIALS')
  }
  
  // Simulación determinista: éxito con credenciales presentes; falla si el usuario incluye "fail"
  const success = !String(data.pacUsername).toLowerCase().includes('fail')
  if (success) {
    return ok({ connected: true, provider: data.pacProvider }, {}, 'Conexión con PAC exitosa')
  }
  return error('No se pudo conectar con el PAC. Verifica credenciales y conectividad.', 'PAC_CONNECTION_FAILED')
}
