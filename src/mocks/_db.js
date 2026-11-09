export const db = {
  users: [
    { id: 1, email: 'superadmin@nomikok.com', password: '123456', name: 'Super Admin', role: 'superadmin', companies: [1, 2, 3], tenantId: null, avatar: null },
    { id: 2, email: 'admin@nomikok.com', password: '123456', name: 'Admin Demo', role: 'admin', companies: [1], tenantId: null, avatar: null },
    { id: 3, email: 'staff@nomikok.com', password: '123456', name: 'Staff Demo', role: 'staff', companies: [1], tenantId: null, avatar: null },
    { id: 9, email: 'supervisor@nomikok.com', password: '123456', name: 'Supervisor Demo', role: 'supervisor', companies: [1], tenantId: 1, avatar: null },
    { id: 4, email: 'cliente@nomikok.com', password: '123456', name: 'Cliente Demo', role: 'cliente', companies: [1], tenantId: 1, avatar: null },
    { id: 5, email: 'empleado@nomikok.com', password: '123456', name: 'Juan Pérez', role: 'empleado', companies: [1], tenantId: 1, employeeId: 1, avatar: null },
    { id: 6, email: 'laura.gomez@grupoacme.com', password: '123456', name: 'Laura Gómez', role: 'cliente', companies: [1, 2], tenantId: 1, avatar: null },
    { id: 7, email: 'diego.ramirez@grupoacme.com', password: '123456', name: 'Diego Ramírez', role: 'cliente', companies: [1], tenantId: 1, avatar: null },
    { id: 8, email: 'sofia.garza@comercializadoranorte.com', password: '123456', name: 'Sofía Garza', role: 'cliente', companies: [3], tenantId: 2, avatar: null },
  ],
  tenants: [
    { id: 1, accountCode: 'CTA-0001', name: 'Grupo Acme', legalName: 'Grupo Acme SA de CV', plan: 'enterprise', status: 'active', contactName: 'Lic. Rodrigo Fuentes', contactEmail: 'r.fuentes@grupoacme.com', contactPhone: '55-3100-4400', domain: 'grupoacme.com', monthlyFee: 18500, createdAt: '2024-01-08', notes: 'Cliente estratégico; consolida el CFDI de nómina de 2 RFC emisores.' },
    { id: 2, accountCode: 'CTA-0002', name: 'Comercializadora del Norte', legalName: 'Comercializadora del Norte SA de CV', plan: 'pro', status: 'active', contactName: 'Ing. Paola Siller', contactEmail: 'p.siller@comercializadoranorte.com', contactPhone: '81-8400-9911', domain: 'comercializadoranorte.com', monthlyFee: 7400, createdAt: '2024-02-10', notes: '' },
    { id: 3, accountCode: 'CTA-0003', name: 'Servicios Integrales del Bajío', legalName: 'Servicios Integrales del Bajío SAPI de CV', plan: 'basic', status: 'suspended', contactName: 'C.P. Marco Antonio Reyes', contactEmail: 'm.reyes@sib.mx', contactPhone: '442-210-7788', domain: 'sib.mx', monthlyFee: 2900, createdAt: '2024-05-22', notes: 'Suspendida por falta de pago; reactivar tras liquidar adeudo.' },
  ],
  companies: [
    { id: 1, tenantId: 1, name: 'Empresa Demo SA de CV', rfc: 'EMP123456789', regimen: '601', address: 'Av. Insurgentes Sur 123, Col. Roma Norte, CDMX', phone: '55-1234-5678', email: 'contacto@empresademo.com', domain: 'empresademo.com', status: 'active', createdAt: '2024-01-15' },
    { id: 2, tenantId: 1, name: 'Tech Solutions SA', rfc: 'TEC987654321', regimen: '601', address: 'Blvd. Manuel Ávila Camacho 456, Col. Lomas de Chapultepec, CDMX', phone: '55-8765-4321', email: 'info@techsolutions.com', domain: 'techsolutions.com', status: 'active', createdAt: '2024-03-20' },
    { id: 3, tenantId: 2, name: 'Comercializadora del Norte', rfc: 'CNM555666777', regimen: '603', address: 'Calle Juárez 789, Centro, Monterrey', phone: '81-2345-6789', email: 'ventas@comercializadoranorte.com', domain: 'comercializadoranorte.com', status: 'inactive', createdAt: '2024-02-10' },
  ],
  employees: [
    { id: 1, companyId: 1, firstName: 'Juan', lastName: 'Pérez', middleName: 'Carlos', curp: 'PEPJ900101HDFRRN09', rfc: 'PEPJ900101XXX', nss: '12345678901', email: 'juan.perez@empresademo.com', emailCustomized: true, phone: '55-1111-2222', address: 'Calle 1 #100, Col. Centro', birthDate: '1990-01-01', hireDate: '2023-01-15', department: 'Ventas', position: 'Ejecutivo de Ventas', contractType: 'indefinido', salary: 15000, status: 'active', bank: 'BBVA', clabe: '012345678901234567' },
    { id: 2, companyId: 1, firstName: 'María', lastName: 'González', middleName: 'Elena', curp: 'GOMM850512MDFRRN05', rfc: 'GOMM850512XXX', nss: '23456789012', email: 'maria.gonzalez@empresademo.com', emailCustomized: true, phone: '55-2222-3333', address: 'Calle 2 #200, Col. Roma', birthDate: '1985-05-12', hireDate: '2022-06-01', department: 'Administración', position: 'Contadora', contractType: 'indefinido', salary: 22000, status: 'active', bank: 'Banorte', clabe: '072345678901234567' },
    { id: 3, companyId: 1, firstName: 'Carlos', lastName: 'Rodríguez', middleName: 'Alberto', curp: 'ROCA920303HDFRRN02', rfc: 'ROCA920303XXX', nss: '34567890123', email: 'carlos.rodriguez@empresademo.com', emailCustomized: true, phone: '55-3333-4444', address: 'Calle 3 #300, Col. Condesa', birthDate: '1992-03-03', hireDate: '2023-09-10', department: 'TI', position: 'Desarrollador', contractType: 'indefinido', salary: 28000, status: 'active', bank: 'Santander', clabe: '014345678901234567' },
    { id: 4, companyId: 1, firstName: 'Ana', lastName: 'López', middleName: 'Sofía', curp: 'LOAS880808MDFRRN08', rfc: 'LOAS880808XXX', nss: '45678901234', email: 'ana.lopez@empresademo.com', emailCustomized: true, phone: '55-4444-5555', address: 'Calle 4 #400, Col. Del Valle', birthDate: '1988-08-08', hireDate: '2024-01-20', department: 'Recursos Humanos', position: 'Reclutadora', contractType: 'temporal', salary: 18000, status: 'active', bank: 'HSBC', clabe: '021345678901234567' },
    { id: 5, companyId: 2, firstName: 'Roberto', lastName: 'Martínez', middleName: 'Javier', curp: 'MARJ951212HDFRRN01', rfc: 'MARJ951212XXX', nss: '56789012345', email: 'roberto.martinez@techsolutions.com', emailCustomized: true, phone: '55-5555-6666', address: 'Calle 5 #500, Col. Polanco', birthDate: '1995-12-12', hireDate: '2023-03-01', department: 'Desarrollo', position: 'Tech Lead', contractType: 'indefinido', salary: 45000, status: 'active', bank: 'BBVA', clabe: '012567890123456789' },
  ],
  payrolls: [
    { id: 1, companyId: 1, period: '2024-01', periodLabel: 'Enero 2024', status: 'firmada', totalEmployees: 4, totalPerceptions: 83000, totalDeductions: 16600, totalNet: 66400, stampedAt: '2024-02-05T10:30:00', signedAt: '2024-02-06T09:15:00', uuid: 'A1B2C3D4-E5F6-7890-ABCD-EF1234567890', xmlUrl: '/mocks/payrolls/1.xml', pdfUrl: '/mocks/payrolls/1.pdf' },
    { id: 2, companyId: 1, period: '2024-02', periodLabel: 'Febrero 2024', status: 'timbrada', totalEmployees: 4, totalPerceptions: 83000, totalDeductions: 16600, totalNet: 66400, stampedAt: '2024-03-05T11:00:00', uuid: 'B2C3D4E5-F6A7-8901-BCDE-F23456789012', xmlUrl: '/mocks/payrolls/2.xml', pdfUrl: '/mocks/payrolls/2.pdf' },
    { id: 3, companyId: 1, period: '2024-03', periodLabel: 'Marzo 2024', status: 'pendiente', totalEmployees: 4, totalPerceptions: 85000, totalDeductions: 17000, totalNet: 68000, uuid: null },
    { id: 4, companyId: 2, period: '2024-01', periodLabel: 'Enero 2024', status: 'firmada', totalEmployees: 1, totalPerceptions: 45000, totalDeductions: 9000, totalNet: 36000, stampedAt: '2024-02-05T14:00:00', signedAt: '2024-02-06T10:00:00', uuid: 'C3D4E5F6-A7B8-9012-CDEF-345678901234', xmlUrl: '/mocks/payrolls/4.xml', pdfUrl: '/mocks/payrolls/4.pdf' },
    { id: 5, companyId: 2, period: '2024-02', periodLabel: 'Febrero 2024', status: 'procesando', totalEmployees: 1, totalPerceptions: 45000, totalDeductions: 9000, totalNet: 36000, uuid: null },
  ],
  payrollLoads: [
    { id: 1, companyId: 1, fileName: 'insumos_enero_2024.xlsx', status: 'completada', totalRecords: 4, successful: 4, failed: 0, uploadedAt: '2024-01-20T09:00:00', processedAt: '2024-01-20T09:05:00', errors: [] },
    { id: 2, companyId: 1, fileName: 'insumos_febrero_2024.xlsx', status: 'completada', totalRecords: 4, successful: 4, failed: 0, uploadedAt: '2024-02-18T10:30:00', processedAt: '2024-02-18T10:35:00', errors: [] },
    { id: 3, companyId: 1, fileName: 'insumos_marzo_2024.xlsx', status: 'procesando', totalRecords: 4, successful: 0, failed: 0, uploadedAt: '2024-03-20T08:00:00', processedAt: null, errors: [] },
    { id: 4, companyId: 2, fileName: 'insumos_enero_2024.xlsx', status: 'completada', totalRecords: 1, successful: 1, failed: 0, uploadedAt: '2024-01-19T15:00:00', processedAt: '2024-01-19T15:02:00', errors: [] },
  ],
  tenantRoles: [
    { id: 1, tenantId: 1, name: 'Gerente', description: 'Acceso total a la operación del cliente', isSystem: true, permissions: ['payroll:read', 'payroll:stamp', 'payroll:sign', 'payroll:cancel', 'payroll:download', 'loads:create', 'loads:read', 'employees:read', 'employees:write', 'reports:read', 'users:assign', 'roles:manage'], createdAt: '2024-01-08' },
    { id: 2, tenantId: 1, name: 'Supervisor', description: 'Supervisa cargas, firma y consulta de nóminas', isSystem: true, permissions: ['payroll:read', 'payroll:sign', 'payroll:download', 'loads:create', 'loads:read', 'employees:read', 'reports:read'], createdAt: '2024-01-08' },
    { id: 3, tenantId: 1, name: 'Operador', description: 'Captura y consulta operativa', isSystem: true, permissions: ['payroll:read', 'loads:create', 'loads:read', 'employees:read'], createdAt: '2024-01-08' },
    { id: 4, tenantId: 1, name: 'Auditor', description: 'Solo lectura y descargas para auditoría', isSystem: false, permissions: ['payroll:read', 'payroll:download', 'employees:read', 'reports:read'], createdAt: '2024-03-15' },
    { id: 5, tenantId: 2, name: 'Gerente', description: 'Acceso total a la operación del cliente', isSystem: true, permissions: ['payroll:read', 'payroll:stamp', 'payroll:sign', 'payroll:cancel', 'payroll:download', 'loads:create', 'loads:read', 'employees:read', 'employees:write', 'reports:read', 'users:assign', 'roles:manage'], createdAt: '2024-02-10' },
    { id: 6, tenantId: 2, name: 'Supervisor', description: 'Supervisa cargas, firma y consulta de nóminas', isSystem: true, permissions: ['payroll:read', 'payroll:sign', 'payroll:download', 'loads:create', 'loads:read', 'employees:read', 'reports:read'], createdAt: '2024-02-10' },
    { id: 7, tenantId: 2, name: 'Operador', description: 'Captura y consulta operativa', isSystem: true, permissions: ['payroll:read', 'loads:create', 'loads:read', 'employees:read'], createdAt: '2024-02-10' },
    { id: 8, tenantId: 2, name: 'Auditor', description: 'Solo lectura y descargas para auditoría', isSystem: false, permissions: ['payroll:read', 'payroll:download', 'employees:read', 'reports:read'], createdAt: '2024-04-02' },
    { id: 9, tenantId: 3, name: 'Gerente', description: 'Acceso total a la operación del cliente', isSystem: true, permissions: ['payroll:read', 'payroll:stamp', 'payroll:sign', 'payroll:cancel', 'payroll:download', 'loads:create', 'loads:read', 'employees:read', 'employees:write', 'reports:read', 'users:assign', 'roles:manage'], createdAt: '2024-05-22' },
    { id: 10, tenantId: 3, name: 'Operador', description: 'Captura y consulta operativa', isSystem: true, permissions: ['payroll:read', 'loads:create', 'loads:read', 'employees:read'], createdAt: '2024-05-22' },
  ],
  tenantRoleAssignments: [
    { id: 1, tenantId: 1, companyId: 1, userId: 4, roleId: 1, createdAt: '2024-01-12' },
    { id: 2, tenantId: 1, companyId: 1, userId: 6, roleId: 1, createdAt: '2024-01-12' },
    { id: 3, tenantId: 1, companyId: 1, userId: 7, roleId: 3, createdAt: '2024-02-03' },
    { id: 4, tenantId: 1, companyId: 2, userId: 6, roleId: 2, createdAt: '2024-03-21' },
    { id: 5, tenantId: 1, companyId: 2, userId: 4, roleId: 1, createdAt: '2024-03-21' },
    { id: 6, tenantId: 2, companyId: 3, userId: 8, roleId: 5, createdAt: '2024-02-11' },
  ],
  fiscalData: [
    { id: 1, companyId: 1, csdFile: 'CSD_EMP123456789.cer', keyFile: 'CSD_EMP123456789.key', keyPassword: '********', certificateNumber: '30001000000300023456', expiryDate: '2026-01-15', pacProvider: 'Factura.com', pacUsername: 'empresademo', pacPassword: '********', environment: 'production' },
    { id: 2, companyId: 2, csdFile: 'CSD_TEC987654321.cer', keyFile: 'CSD_TEC987654321.key', keyPassword: '********', certificateNumber: '30001000000400023456', expiryDate: '2026-03-20', pacProvider: 'SW Sapien', pacUsername: 'techsolutions', pacPassword: '********', environment: 'production' },
  ],
  curpQueries: [
    { curp: 'PEPJ900101HDFRRN09', valid: true, data: { nombre: 'Juan Carlos', apellidoPaterno: 'Pérez', apellidoMaterno: 'García', fechaNacimiento: '1990-01-01', sexo: 'H', entidad: 'DF' } },
    { curp: 'GOMM850512MDFRRN05', valid: true, data: { nombre: 'María Elena', apellidoPaterno: 'González', apellidoMaterno: 'Martínez', fechaNacimiento: '1985-05-12', sexo: 'M', entidad: 'DF' } },
    { curp: 'ROCA920303HDFRRN02', valid: true, data: { nombre: 'Carlos Alberto', apellidoPaterno: 'Rodríguez', apellidoMaterno: 'López', fechaNacimiento: '1992-03-03', sexo: 'H', entidad: 'NL' } },
  ],
  invoiceDesigns: [
    { id: 1, companyId: 1, name: 'Diseño Estándar', isDefault: true, config: { logoPosition: 'left', colors: { primary: '#E76F51' }, font: 'Inter', showQR: true }, versions: [
      { id: 1, at: '2024-08-01T10:00:00.000Z', name: 'Diseño Estándar', config: { logoPosition: 'left', colors: { primary: '#C0563F' }, font: 'Inter', showQR: false } },
      { id: 2, at: '2024-09-15T15:30:00.000Z', name: 'Diseño Estándar', config: { logoPosition: 'left', colors: { primary: '#E76F51' }, font: 'Roboto', showQR: true } },
    ] },
    { id: 2, companyId: 1, name: 'Diseño Minimalista', isDefault: false, config: { logoPosition: 'center', colors: { primary: '#2D3748' }, font: 'Roboto', showQR: true } },
  ],
  notificationEvents: [],
  invitations: [],
  metricEvents: [],
  zipPackages: [],
  auditLog: [
    { id: 1, section: 'Empresa', summary: 'Razón social: Empresa Demo SA de CV (carga inicial)', actor: 'sistema', at: '2024-01-15T09:00:00.000Z' },
    { id: 2, section: 'Notificaciones', summary: 'Aviso: resumen semanal: false → true', actor: 'admin@nomikok.com', at: '2024-06-03T18:22:00.000Z' },
  ],
  settings: {
    companyName: 'Empresa Demo SA de CV',
    rfc: 'EMP123456789',
    address: 'Av. Insurgentes Sur 123, Col. Roma Norte, CDMX',
    timezone: 'America/Mexico_City',
    currency: 'MXN',
    dateFormat: 'dd/mm/yyyy',
    language: 'es',
    notifyPayrollStamped: true,
    notifyLoadErrors: true,
    notifyWeeklySummary: false,
    notifyPaymentRun: true,
  },
}

let idCounters = {
  users: 9,
  tenants: 3,
  companies: 3,
  employees: 5,
  payrolls: 5,
  payrollLoads: 4,
  fiscalData: 2,
  curpQueries: 3,
  invoiceDesigns: 2,
  tenantRoles: 10,
  notificationEvents: 0,
  invitations: 3,
  metricEvents: 0,
  zipPackages: 0,
  auditLog: 2,
  tenantRoleAssignments: 6,
}

export function getNextId(collection) {
  return ++idCounters[collection]
}

export function resetDb() {
  // Para testing - reiniciar a estado inicial
}
const FIRST_NAMES = ['Juan','María','Carlos','Ana','Luis','Laura','Pedro','Sofía','Diego','Elena','Miguel','Carmen','José','Patricia','Fernando','Gabriela','Ricardo','Valeria','Jorge','Daniela']
const LAST_NAMES = ['Pérez','González','Rodríguez','López','Martínez','Hernández','García','Sánchez','Ramírez','Torres','Flores','Vargas','Castro','Mendoza','Ortiz','Silva','Reyes','Morales','Jiménez','Ruiz']
const DEPARTMENTS = ['Ventas','Administración','TI','Recursos Humanos','Operaciones','Finanzas','Marketing','Logística','Producción','Calidad']
const POSITIONS = ['Ejecutivo','Analista','Coordinador','Gerente','Auxiliar','Supervisor','Especialista','Técnico','Director','Asistente']

let companyIdCounter = db.companies.length
while (db.companies.length < 100) {
  const id = ++companyIdCounter
  const tenantId = id % 2 === 0 ? 2 : 3
  db.companies.push({
    id,
    tenantId,
    name: `Empresa ${id} SA de CV`,
    rfc: `EMP${String(id).padStart(9, '0')}`,
    regimen: '601',
    address: `Av. Principal ${id}, Col. Centro`,
    phone: `55-${String(1000 + id).slice(-4)}-${String(2000 + id).slice(-4)}`,
    email: `contacto@empresa${id}.com`,
    domain: `empresa${id}.com`,
    status: id % 7 === 0 ? 'inactive' : 'active',
    createdAt: '2024-01-15',
  })
}
idCounters.companies = companyIdCounter

let employeeIdCounter = db.employees.length
const targetEmployees = 10000
while (db.employees.length < targetEmployees) {
  const id = ++employeeIdCounter
  const company = db.companies[(id - 1) % db.companies.length]
  const fn = FIRST_NAMES[id % FIRST_NAMES.length]
  const ln = LAST_NAMES[(id * 3) % LAST_NAMES.length]
  const mn = LAST_NAMES[(id * 7) % LAST_NAMES.length]
  const salary = 12000 + (id % 40) * 1000
  db.employees.push({
    id,
    companyId: company.id,
    firstName: fn,
    lastName: ln,
    middleName: mn,
    curp: `CURP${String(id).padStart(14, '0')}`,
    rfc: `RFC${String(id).padStart(10, '0')}`,
    nss: String(10000000000 + id).slice(-11),
    email: `emp${id}@${company.domain}`,
    emailCustomized: true,
    phone: `55-${String(3000 + (id % 9000)).padStart(4, '0')}-${String(4000 + (id % 9000)).padStart(4, '0')}`,
    address: `Calle ${id % 100} #${id}, Col. Centro`,
    birthDate: '1990-01-01',
    hireDate: '2023-01-15',
    department: DEPARTMENTS[id % DEPARTMENTS.length],
    position: POSITIONS[id % POSITIONS.length],
    contractType: 'indefinido',
    salary,
    status: id % 11 === 0 ? 'inactive' : 'active',
    bank: 'BBVA',
    clabe: String(100000000000000000 + id).slice(-18),
  })
}
idCounters.employees = employeeIdCounter

// Generate payrolls for every company so employee portals are populated
let payrollIdCounter = db.payrolls.length
const payrollPeriods = [
  { period: '2024-01', label: 'Enero 2024', status: 'firmada' },
  { period: '2024-02', label: 'Febrero 2024', status: 'timbrada' },
  { period: '2024-03', label: 'Marzo 2024', status: 'timbrada' },
]
for (const company of db.companies) {
  const empCount = db.employees.filter(e => e.companyId === company.id).length || 1
  for (const p of payrollPeriods) {
    const id = ++payrollIdCounter
    db.payrolls.push({
      id,
      companyId: company.id,
      period: p.period,
      periodLabel: p.label,
      status: p.status,
      totalEmployees: empCount,
      totalPerceptions: empCount * 15000,
      totalDeductions: empCount * 3000,
      totalNet: empCount * 12000,
      stampedAt: '2024-02-05T10:30:00',
      signedAt: p.status === 'firmada' ? '2024-02-06T09:15:00' : null,
      uuid: `UUID-${company.id}-${p.period}`,
      xmlUrl: `/mocks/payrolls/${id}.xml`,
      pdfUrl: `/mocks/payrolls/${id}.pdf`,
    })
  }
}
idCounters.payrolls = payrollIdCounter

// Generate fiscal profiles for every company
let fiscalIdCounter = db.fiscalData.length
for (const company of db.companies) {
  if (!db.fiscalData.some(f => f.companyId === company.id)) {
    const id = ++fiscalIdCounter
    db.fiscalData.push({
      id,
      companyId: company.id,
      csdFile: `CSD_${company.rfc}.cer`,
      keyFile: `CSD_${company.rfc}.key`,
      keyPassword: '********',
      certificateNumber: `30001000000${company.id}`,
      expiryDate: '2026-01-15',
      pacProvider: 'Factura.com',
      pacUsername: `empresa${company.id}`,
      pacPassword: '********',
      environment: 'production',
    })
  }
}
idCounters.fiscalData = fiscalIdCounter

// Generate invoice design for every company
let designIdCounter = db.invoiceDesigns.length
for (const company of db.companies) {
  if (!db.invoiceDesigns.some(d => d.companyId === company.id)) {
    const id = ++designIdCounter
    db.invoiceDesigns.push({
      id,
      companyId: company.id,
      name: 'Diseño Estándar',
      isDefault: true,
      config: { logoPosition: 'left', colors: { primary: '#E76F51' }, font: 'Inter', showQR: true },
      versions: [],
    })
  }
}
idCounters.invoiceDesigns = designIdCounter
