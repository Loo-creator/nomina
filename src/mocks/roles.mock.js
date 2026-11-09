import { db, getNextId } from './_db'
import { delay, ok, error } from './helpers/responses'
import { TENANT_PERMISSION_VALUES } from '@/shared/utils/constants'

function findTenant(tenantId) {
  return db.tenants.find(t => t.id === Number(tenantId)) || null
}

function roleUserCount(roleId) {
  return db.tenantRoleAssignments.filter(a => a.roleId === roleId).length
}

function sanitizeName(value) {
  return String(value ?? '').replace(/[<>]/g, '').replace(/\s+/g, ' ').trim().slice(0, 60)
}

function sanitizeDescription(value) {
  return String(value ?? '').replace(/[<>]/g, '').replace(/\s+/g, ' ').trim().slice(0, 240)
}

function validatePermissions(permissions) {
  if (!Array.isArray(permissions)) return 'Permisos inválidos'
  const allowed = new Set(TENANT_PERMISSION_VALUES)
  if (permissions.some(p => !allowed.has(p))) return 'La selección contiene permisos no reconocidos'
  return null
}

function withCounts(role) {
  return { ...role, userCount: roleUserCount(role.id) }
}

export async function getTenantRoles(tenantId) {
  await delay(200, 450)
  const tenant = findTenant(tenantId)
  if (!tenant) return error('Cliente no encontrado', 'NOT_FOUND')

  const roles = db.tenantRoles
    .filter(r => r.tenantId === tenant.id)
    .map(withCounts)
    .sort((a, b) => Number(b.isSystem) - Number(a.isSystem) || a.name.localeCompare(b.name, 'es'))

  return ok(roles)
}

export async function createTenantRole(tenantId, data) {
  await delay(350, 700)
  const tenant = findTenant(tenantId)
  if (!tenant) return error('Cliente no encontrado', 'NOT_FOUND')

  const name = sanitizeName(data?.name)
  const description = sanitizeDescription(data?.description)
  const permissions = Array.isArray(data?.permissions) ? [...new Set(data.permissions)] : []

  if (name.length < 3) return error('El nombre del rol debe tener al menos 3 caracteres', 'INVALID_NAME')
  if (db.tenantRoles.some(r => r.tenantId === tenant.id && r.name.toLowerCase() === name.toLowerCase())) {
    return error('Ya existe un rol con ese nombre en esta cuenta', 'DUPLICATE_ROLE')
  }
  const permError = validatePermissions(permissions)
  if (permError) return error(permError, 'INVALID_PERMISSIONS')
  if (!permissions.length) return error('Selecciona al menos un permiso', 'EMPTY_PERMISSIONS')

  const role = {
    id: getNextId('tenantRoles'),
    tenantId: tenant.id,
    name,
    description,
    permissions,
    isSystem: false,
    createdAt: new Date().toISOString().slice(0, 10),
  }
  db.tenantRoles.push(role)
  return ok(withCounts(role), {}, 'Rol creado correctamente')
}

export async function updateTenantRole(roleId, data) {
  await delay(300, 600)
  const index = db.tenantRoles.findIndex(r => r.id === Number(roleId))
  if (index === -1) return error('Rol no encontrado', 'NOT_FOUND')

  const current = db.tenantRoles[index]
  const name = sanitizeName(data?.name ?? current.name)
  const description = sanitizeDescription(data?.description ?? current.description)
  const permissions = Array.isArray(data?.permissions) ? [...new Set(data.permissions)] : current.permissions

  if (current.isSystem && name.toLowerCase() !== current.name.toLowerCase()) {
    return error('Los roles base no se pueden renombrar', 'SYSTEM_ROLE')
  }
  if (name.length < 3) return error('El nombre del rol debe tener al menos 3 caracteres', 'INVALID_NAME')
  if (db.tenantRoles.some(r => r.id !== current.id && r.tenantId === current.tenantId && r.name.toLowerCase() === name.toLowerCase())) {
    return error('Ya existe un rol con ese nombre en esta cuenta', 'DUPLICATE_ROLE')
  }
  const permError = validatePermissions(permissions)
  if (permError) return error(permError, 'INVALID_PERMISSIONS')
  if (!permissions.length) return error('Selecciona al menos un permiso', 'EMPTY_PERMISSIONS')

  db.tenantRoles[index] = { ...current, name, description, permissions }
  return ok(withCounts(db.tenantRoles[index]), {}, 'Rol actualizado correctamente')
}

export async function deleteTenantRole(roleId) {
  await delay(250, 500)
  const index = db.tenantRoles.findIndex(r => r.id === Number(roleId))
  if (index === -1) return error('Rol no encontrado', 'NOT_FOUND')

  const current = db.tenantRoles[index]
  if (current.isSystem) return error('Los roles base no se pueden eliminar', 'SYSTEM_ROLE')
  const inUse = roleUserCount(current.id)
  if (inUse > 0) return error(`No se puede eliminar: ${inUse} asignación(es) usan este rol`, 'ROLE_IN_USE')

  db.tenantRoles.splice(index, 1)
  return ok(null, {}, 'Rol eliminado correctamente')
}

export async function getCompanyAccess(tenantId, companyId) {
  await delay(200, 450)
  const tenant = findTenant(tenantId)
  if (!tenant) return error('Cliente no encontrado', 'NOT_FOUND')

  const company = db.companies.find(c => c.id === Number(companyId))
  if (!company) return error('Empresa no encontrada', 'NOT_FOUND')
  if (company.tenantId !== tenant.id) return error('La empresa no pertenece a esta cuenta', 'CROSS_TENANT')

  const roles = db.tenantRoles
    .filter(r => r.tenantId === tenant.id)
    .map(withCounts)
    .sort((a, b) => a.name.localeCompare(b.name, 'es'))

  const members = db.users
    .filter(u => u.tenantId === tenant.id && u.role !== 'empleado')
    .map(u => {
      const assignment = db.tenantRoleAssignments.find(
        a => a.tenantId === tenant.id && a.companyId === company.id && a.userId === u.id,
      )
      return {
        id: u.id,
        name: u.name,
        email: u.email,
        platformRole: u.role,
        assignmentId: assignment?.id ?? null,
        roleId: assignment?.roleId ?? null,
      }
    })
    .sort((a, b) => a.name.localeCompare(b.name, 'es'))

  return ok({ company: { ...company }, roles, members })
}

export async function setCompanyAccess(tenantId, companyId, userId, roleId) {
  await delay(250, 550)
  const tenant = findTenant(tenantId)
  if (!tenant) return error('Cliente no encontrado', 'NOT_FOUND')

  const company = db.companies.find(c => c.id === Number(companyId))
  if (!company || company.tenantId !== tenant.id) {
    return error('La empresa no pertenece a esta cuenta', 'CROSS_TENANT')
  }

  const user = db.users.find(u => u.id === Number(userId))
  if (!user) return error('Usuario no encontrado', 'NOT_FOUND')
  if (user.tenantId !== tenant.id) return error('El usuario no pertenece a esta cuenta', 'CROSS_TENANT')

  const index = db.tenantRoleAssignments.findIndex(
    a => a.tenantId === tenant.id && a.companyId === company.id && a.userId === user.id,
  )

  if (roleId === null || roleId === undefined || roleId === '') {
    if (index !== -1) db.tenantRoleAssignments.splice(index, 1)
    return ok(null, {}, 'Acceso revocado')
  }

  const role = db.tenantRoles.find(r => r.id === Number(roleId))
  if (!role) return error('Rol no encontrado', 'NOT_FOUND')
  if (role.tenantId !== tenant.id) return error('El rol no pertenece a esta cuenta', 'CROSS_TENANT')

  if (index !== -1) {
    db.tenantRoleAssignments[index] = { ...db.tenantRoleAssignments[index], roleId: role.id }
    return ok({ ...db.tenantRoleAssignments[index] }, {}, 'Rol actualizado')
  }

  const assignment = {
    id: getNextId('tenantRoleAssignments'),
    tenantId: tenant.id,
    companyId: company.id,
    userId: user.id,
    roleId: role.id,
    createdAt: new Date().toISOString().slice(0, 10),
  }
  db.tenantRoleAssignments.push(assignment)
  return ok({ ...assignment }, {}, 'Usuario asignado')
}
