import JSZip from 'jszip'
import { jsPDF } from 'jspdf'

function escapeXml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function money(value) {
  return Number(value || 0).toFixed(2)
}

function csvEscape(value) {
  const str = String(value ?? '')
  return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str
}

function stampComprobanteXml(payroll, generatedAt) {
  const total = money(payroll.totalPerceptions)
  const deductions = money(payroll.totalDeductions)
  const stampedAt = payroll.stampedAt ? new Date(payroll.stampedAt).toISOString() : generatedAt
  const uuid = payroll.uuid || ''
  return `<?xml version="1.0" encoding="UTF-8"?>
<!-- NOMIKOK — CFDI de nómina generado para auditoría. Documento de demostración con datos simulados. -->
<cfdi:Comprobante xmlns:cfdi="http://www.sat.gob.mx/cfd/4" xmlns:nomina="http://www.sat.gob.mx/nomina12" xmlns:tfd="http://www.sat.gob.mx/TimbreFiscalDigital" Version="4.0" Folio="N-${payroll.id}" Serie="NOMI" Fecha="${stampedAt}" Sello="M0c2S3ll0D3M0" NoCertificado="30001000000300023456" Certificado="CERTIFICADO_DEMO_BASE64" SubTotal="${total}" Moneda="MXN" Total="${total}" TipoDeComprobante="N" Exportacion="01" MetodoPago="PUE" LugarExpedicion="01000">
  <cfdi:Emisor Rfc="${escapeXml(payroll.companyRfc || 'EMP123456789')}" Nombre="${escapeXml(payroll.companyName || 'Empresa')}" RegimenFiscal="601"/>
  <cfdi:Receptor Rfc="XAXX010101000" Nombre="RECIBO DE NOMINA ${escapeXml(payroll.periodLabel || '')}" DomicilioFiscalReceptor="01000" RegimenFiscalReceptor="605" UsoCFDI="CN01"/>
  <cfdi:Conceptos>
    <cfdi:Concepto ClaveProdServ="84111505" Cantidad="1" ClaveUnidad="ACT" Descripcion="Pago de nómina — ${escapeXml(payroll.periodLabel || '')}" ValorUnitario="${total}" Importe="${total}" ObjetoImp="01"/>
  </cfdi:Conceptos>
  <cfdi:Complemento>
    <nomina:Nomina Version="1.2" TipoNomina="O" FechaPago="${stampedAt.slice(0, 10)}" FechaInicialPago="${(payroll.period || '') + '-01'}" FechaFinalPago="${(payroll.period || '') + '-28'}" NumDiasPagados="30" TotalPercepciones="${total}" TotalDeducciones="${deductions}">
      <nomina:Receptor Curp="CURPDEMO000000HDFXXX00" NumSeguridadSocial="00000000000" TipoContrato="01" Sindicalizado="No" TipoJornada="01" TipoRegimen="02" NumEmpleado="1" Departamento="${escapeXml(payroll.department || 'General')}" Puesto="${escapeXml(payroll.position || 'Empleado')}" RiesgoPuesto="1" PeriodicidadPago="04" TipoSalario="02" SalarioBaseCotApor="${money((payroll.totalPerceptions || 0) / 30)}" TipoCuerpoNomina="P"/>
    </nomina:Nomina>
    <tfd:TimbreFiscalDigital Version="1.1" UUID="${escapeXml(uuid)}" FechaTimbrado="${stampedAt}" RfcProvCertif="SAT970701NN3" SelloCFD="M0c2S3ll0CFDD3M0" NoCertificadoSAT="00001000000300023456" SelloSAT="M0c2S3ll0SATD3M0"/>
  </cfdi:Complemento>
</cfdi:Comprobante>
`
}

function stampReciboPdf(payroll, generatedAt) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const margin = 18
  let y = 20

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  doc.text(String(payroll.companyName || 'Empresa').toUpperCase(), margin, y)
  y += 7
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(90)
  doc.text(`RFC: ${payroll.companyRfc || '—'}`, margin, y)
  y += 10

  doc.setTextColor(20)
  doc.setDrawColor(200)
  doc.line(margin, y, 210 - margin, y)
  y += 10

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(15)
  doc.text('RECIBO DE NÓMINA — COMPROBANTE FISCAL DIGITAL', margin, y)
  y += 8
  doc.setFontSize(11)
  doc.setFont('helvetica', 'normal')
  doc.text(`Período: ${payroll.periodLabel || '—'}`, margin, y)
  y += 7
  doc.text(`Empleados incluidos: ${payroll.totalEmployees ?? '—'}`, margin, y)
  y += 12

  doc.setFillColor(245, 247, 250)
  doc.rect(margin, y - 5, 210 - margin * 2, 34, 'F')
  doc.setFont('helvetica', 'bold')
  doc.text('Percepciones totales', margin + 4, y + 2)
  doc.text(money(payroll.totalPerceptions), 210 - margin - 4, y + 2, { align: 'right' })
  y += 9
  doc.text('Deducciones totales', margin + 4, y + 2)
  doc.text(money(payroll.totalDeductions), 210 - margin - 4, y + 2, { align: 'right' })
  y += 9
  doc.setFontSize(13)
  doc.text('NETO A PAGAR', margin + 4, y + 2)
  doc.text(`$${money(payroll.totalNet)} MXN`, 210 - margin - 4, y + 2, { align: 'right' })
  y += 18

  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(90)
  doc.text(`Fecha de timbrado: ${payroll.stampedAt ? new Date(payroll.stampedAt).toLocaleString('es-MX') : '—'}`, margin, y)
  y += 6
  if (payroll.signedAt) {
    doc.text(`Fecha de firma: ${new Date(payroll.signedAt).toLocaleString('es-MX')}`, margin, y)
    y += 6
  }
  doc.text(`UUID (timbre fiscal): ${payroll.uuid || '—'}`, margin, y, { maxWidth: 210 - margin * 2 })
  y += 14

  doc.setDrawColor(200)
  doc.line(margin, y, 210 - margin, y)
  y += 6
  doc.setFontSize(8)
  doc.text(
    'Documento generado para auditoría interna. Representación impresa del CFDI de nómina (simulada con datos de prueba). Generado por NOMIKOK el ' + new Date(generatedAt).toLocaleString('es-MX') + '.',
    margin,
    y,
    { maxWidth: 210 - margin * 2 },
  )

  return doc.output('arraybuffer')
}

export async function buildAuditPackage(payrolls, { generatedBy } = {}) {
  if (!Array.isArray(payrolls) || payrolls.length === 0) {
    throw new Error('Selecciona al menos un comprobante')
  }

  const generatedAt = new Date().toISOString()
  const stamp = generatedAt.slice(0, 10).replace(/-/g, '')
  const folderName = `paquete_auditoria_${stamp}`
  const zip = new JSZip()
  const folder = zip.folder(folderName)

  const summaryRows = [
    ['RFC_EMISOR', 'EMPRESA', 'PERIODO', 'EMPLEADOS', 'PERCEPCIONES', 'DEDUCCIONES', 'NETO', 'UUID', 'ESTATUS', 'FECHA_TIMBRADO', 'FECHA_FIRMA'],
  ]

  payrolls.forEach((payroll) => {
    const safeId = String(payroll.id).padStart(4, '0')
    const uuid = payroll.uuid || `SIN-UUID-${safeId}`
    folder.file(`CFDI_${uuid}.xml`, stampComprobanteXml(payroll, generatedAt))
    folder.file(`Recibo_${uuid}.pdf`, stampReciboPdf(payroll, generatedAt))
    summaryRows.push([
      payroll.companyRfc || '',
      payroll.companyName || '',
      payroll.periodLabel || '',
      payroll.totalEmployees ?? '',
      money(payroll.totalPerceptions),
      money(payroll.totalDeductions),
      money(payroll.totalNet),
      uuid,
      payroll.status || '',
      payroll.stampedAt || '',
      payroll.signedAt || '',
    ])
  })

  folder.file('resumen_auditoria.csv', '\uFEFF' + summaryRows.map(row => row.map(csvEscape).join(',')).join('\r\n'))
  folder.file('MANIFIESTO.txt', [
    'NOMIKOK — Paquete de auditoría de nóminas (CFDI de nómina)',
    `Generado: ${generatedAt}`,
    `Generado por: ${generatedBy || 'Desconocido'}`,
    `Comprobantes incluidos: ${payrolls.length}`,
    '',
    'Contenido por comprobante:',
    '  CFDI_<UUID>.xml      Comprobante fiscal (representación del CFDI 4.0, simulado)',
    '  Recibo_<UUID>.pdf    Representación impresa del recibo de nómina',
    'resumen_auditoria.csv  Totales por periodo/RFC emisor',
    '',
    'NOTA: paquete generado con datos de demostración. Para auditoría real, validar',
    'los UUID contra el SAT y contra el sello del PAC.',
  ].join('\n'))

  return zip.generateAsync({ type: 'blob', compression: 'DEFLATE', compressionOptions: { level: 6 } })
}

export function auditPackageFilename() {
  const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, '')
  return `paquete_auditoria_nomikok_${stamp}.zip`
}

export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

export function buildAcusePdf(payroll, signerName) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const margin = 20
  let y = 24

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(17)
  doc.text('ACUSE DE FIRMA DE NÓMINA', margin, y)
  y += 10
  doc.setDrawColor(180)
  doc.line(margin, y, 210 - margin, y)
  y += 12

  doc.setFontSize(11)
  doc.setFont('helvetica', 'normal')
  const lines = [
    ['Empresa', payroll.companyName || '—'],
    ['RFC emisor', payroll.companyRfc || '—'],
    ['Período', payroll.periodLabel || '—'],
    ['UUID (timbre fiscal)', payroll.uuid || '—'],
    ['Fecha de timbrado', payroll.stampedAt ? new Date(payroll.stampedAt).toLocaleString('es-MX') : '—'],
    ['Fecha de firma', payroll.signedAt ? new Date(payroll.signedAt).toLocaleString('es-MX') : new Date().toLocaleString('es-MX')],
    ['Firmado por', signerName || '—'],
  ]
  lines.forEach(([label, value]) => {
    doc.setFont('helvetica', 'bold')
    doc.text(`${label}:`, margin, y)
    doc.setFont('helvetica', 'normal')
    doc.text(String(value), margin + 52, y, { maxWidth: 210 - margin - 52 })
    y += 9
  })
  y += 6
  doc.setFontSize(9)
  doc.setTextColor(90)
  doc.text(
    'Este acuse acredita la aceptación y firma digital del comprobante fiscal digital de nómina. ' +
    'Documento generado con datos de demostración por NOMIKOK. Conservar para efectos de auditoría.',
    margin,
    y,
    { maxWidth: 210 - margin * 2 },
  )
  return doc.output('arraybuffer')
}

export function acuseFilename(payroll) {
  const id = payroll.uuid || `nomina-${payroll.id}`
  return `acuse_firma_${id}.pdf`
}
