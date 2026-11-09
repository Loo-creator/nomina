export const ROLES = {
  SUPERADMIN: 'superadmin',
  ADMIN: 'admin',
  SUPERVISOR: 'supervisor',
  STAFF: 'staff',
  CLIENTE: 'cliente',
  EMPLEADO: 'empleado',
}

export const ROLE_LABELS = {
  [ROLES.SUPERADMIN]: 'Super Admin',
  [ROLES.ADMIN]: 'Administrador',
  [ROLES.SUPERVISOR]: 'Supervisor',
  [ROLES.STAFF]: 'Staff',
  [ROLES.CLIENTE]: 'Cliente',
  [ROLES.EMPLEADO]: 'Empleado',
}

export const ROLE_HIERARCHY = {
  [ROLES.SUPERADMIN]: 5,
  [ROLES.ADMIN]: 4,
  [ROLES.SUPERVISOR]: 3,
  [ROLES.STAFF]: 3,
  [ROLES.CLIENTE]: 2,
  [ROLES.EMPLEADO]: 1,
}

export const ROLE_SECTION_MATRIX = {
  [ROLES.SUPERADMIN]: [
    'dashboard',
    'clientes',
    'roles',
    'nominas-timbradas',
    'companias',
    'empleados',
    'usuarios',
    'consulta-curp',
    'disenador-de-facturas',
    'configuracion',
  ],
  [ROLES.ADMIN]: [
    'dashboard',
    'clientes',
    'roles',
    'carga-masiva',
    'notificaciones',
    'nominas-timbradas',
    'companias',
    'empleados',
    'usuarios',
    'consulta-curp',
    'disenador-de-facturas',
    'configuracion',
  ],
  [ROLES.SUPERVISOR]: [
    'dashboard',
    'carga-masiva',
    'notificaciones',
    'nominas-timbradas',
    'empleados',
    'usuarios',
  ],
  [ROLES.STAFF]: [
    'dashboard',
    'nominas-timbradas',
    'companias',
    'empleados',
    'usuarios',
  ],
  [ROLES.CLIENTE]: [
    'dashboard',
    'roles',
    'carga-masiva',
    'notificaciones',
    'nominas-timbradas',
    'companias',
    'empleados',
    'usuarios',
  ],
  [ROLES.EMPLEADO]: [
    'dashboard',
    'mis-nominas',
  ],
}

export const SECTIONS_BY_ROLE = ROLE_SECTION_MATRIX

export const TENANT_PERMISSIONS = [
  { value: 'payroll:read', label: 'Ver nóminas y recibos', group: 'Nómina' },
  { value: 'payroll:stamp', label: 'Timbrar nómina', group: 'Nómina' },
  { value: 'payroll:sign', label: 'Firmar nómina', group: 'Nómina' },
  { value: 'payroll:cancel', label: 'Cancelar nómina', group: 'Nómina' },
  { value: 'payroll:download', label: 'Descargar PDF/XML/ZIP', group: 'Nómina' },
  { value: 'loads:create', label: 'Cargar insumos', group: 'Cargas' },
  { value: 'loads:read', label: 'Ver cargas', group: 'Cargas' },
  { value: 'employees:read', label: 'Ver empleados', group: 'Empleados' },
  { value: 'employees:write', label: 'Crear/editar empleados', group: 'Empleados' },
  { value: 'reports:read', label: 'Reportes y auditoría', group: 'Reportes' },
  { value: 'users:assign', label: 'Asignar usuarios', group: 'Accesos' },
  { value: 'roles:manage', label: 'Administrar roles', group: 'Accesos' },
]

export const TENANT_PERMISSION_VALUES = TENANT_PERMISSIONS.map(p => p.value)

export const TENANT_PERMISSION_GROUPS = [...new Set(TENANT_PERMISSIONS.map(p => p.group))]

export const TENANT_PERMISSION_LABELS = Object.fromEntries(
  TENANT_PERMISSIONS.map(p => [p.value, p.label]),
)

export const FISCAL_REGIME_OPTIONS = [
  { value: '601', label: '601 - General de Ley Personas Morales' },
  { value: '603', label: '603 - Personas Morales con Fines no Lucrativos' },
  { value: '605', label: '605 - Sueldos y Salarios e Ingresos Asimilados' },
  { value: '606', label: '606 - Arrendamiento' },
  { value: '608', label: '608 - Demás ingresos' },
]

export const TENANT_STATUS = {
  ACTIVE: 'active',
  SUSPENDED: 'suspended',
}

export const TENANT_STATUS_LABELS = {
  [TENANT_STATUS.ACTIVE]: 'Activo',
  [TENANT_STATUS.SUSPENDED]: 'Suspendido',
}

export const TENANT_PLANS = {
  BASIC: 'basic',
  PRO: 'pro',
  ENTERPRISE: 'enterprise',
}

export const TENANT_PLAN_LABELS = {
  [TENANT_PLANS.BASIC]: 'Básico',
  [TENANT_PLANS.PRO]: 'Pro',
  [TENANT_PLANS.ENTERPRISE]: 'Enterprise',
}

export const PAYROLL_STATUS = {
  PENDING: 'pendiente',
  PROCESSING: 'procesando',
  STAMPED: 'timbrada',
  SIGNED: 'firmada',
  CANCELLED: 'cancelada',
  ERROR: 'error',
}

export const PAYROLL_STATUS_LABELS = {
  [PAYROLL_STATUS.PENDING]: 'Pendiente',
  [PAYROLL_STATUS.PROCESSING]: 'Procesando',
  [PAYROLL_STATUS.STAMPED]: 'Timbrada',
  [PAYROLL_STATUS.SIGNED]: 'Firmada',
  [PAYROLL_STATUS.CANCELLED]: 'Cancelada',
  [PAYROLL_STATUS.ERROR]: 'Error',
}

export const PAYROLL_STATUS_COLORS = {
  [PAYROLL_STATUS.PENDING]: 'warning',
  [PAYROLL_STATUS.PROCESSING]: 'info',
  [PAYROLL_STATUS.STAMPED]: 'primary',
  [PAYROLL_STATUS.SIGNED]: 'success',
  [PAYROLL_STATUS.CANCELLED]: 'danger',
  [PAYROLL_STATUS.ERROR]: 'danger',
}

export const LOAD_STATUS = {
  PENDING: 'pendiente',
  PROCESSING: 'procesando',
  COMPLETED: 'completada',
  FAILED: 'fallida',
}

export const CURP_VALIDATION_STATUS = {
  VALID: 'valida',
  INVALID: 'invalida',
  PENDING: 'pendiente',
}

export const COMPANY_TYPES = {
  MORAL: 'persona_moral',
  FISICA: 'persona_fisica',
}

export const EMPLOYEE_CONTRACT_TYPES = {
  INDEFINITE: 'indefinido',
  TEMPORARY: 'temporal',
  TRAINING: 'capacitacion',
  SEASONAL: 'temporada',
}

export const FISCAL_REGIMES = {
  GENERAL: '601',
  SIMPLIFIED: '603',
  MORAL: '605',
  NON_PROFIT: '606',
  COORDINATED: '608',
}