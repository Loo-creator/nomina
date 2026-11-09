import { db, getNextId } from './_db'
import { delay, ok, error } from './helpers/responses'
import { track } from '@/shared/utils/telemetry'
import { ROLES } from '@/shared/utils/constants'

const INVITABLE_ROLES = Object.values(ROLES).filter(r => r !== ROLES.SUPERADMIN)
const TOKEN_BYTES = 16
const INVITE_TTL_DAYS = 7

function randomToken() {
  const bytes = new Uint8Array(TOKEN_BYTES)
  if (globalThis.crypto?.getRandomValues) {
    globalThis.crypto.getRandomValues(bytes)
  } else {
    for (let i = 0; i < TOKEN_BYTES; i++) bytes[i] = Math.floor(Math.random() * 256)
  }
  return Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('')
}

function ensureSeeded() {
  if (!Array.isArray(db.invitations)) db.invitations = []
  if (db.invitations.length) return

  const now = Date.now()
  const daysFromNow = (days, hourOffset = 0) => new Date(now + days * 86_400_000 + hourOffset * 3_600_000).toISOString()

  const seeds = [
    { email: 'laura.rh@grupoacme.com', name: 'Laura Gómez RH', role: 'staff', companyIds: [1, 2], mfaRequired: true, invitedBy: 'admin@nomikok.com', status: 'pendiente', createdAt: daysFromNow(-2), expiresAt: daysFromNow(5), attempts: 1 },
    { email: 'invitar@comercializadoranorte.com', name: 'Pendiente PAC', role: 'cliente', companyIds: [3], mfaRequired: false, invitedBy: 'sofía.garza@comercializadoranorte.com', status: 'pendiente', createdAt: daysFromNow(-9), expiresAt: daysFromNow(-2), attempts: 2 },
    { email: 'integracion@techsolutions.com', name: 'Cuenta integración', role: 'staff', companyIds: [2], mfaRequired: false, invitedBy: 'superadmin@nomikok.com', status: 'aceptada', createdAt: daysFromNow(-20), expiresAt: daysFromNow(-13), attempts: 1, acceptedAt: daysFromNow(-18) },
  ]

  seeds.forEach(seed => {
    db.invitations.push({ id: getNextId('invitations'), token: randomToken(), ...seed })
  })
}

function withCompanyNames(invitation) {
  const names = (invitation.companyIds || [])
    .map(id => db.companies.find(c => c.id === id)?.name)
    .filter(Boolean)
  return { ...invitation, companyNames: names }
}

function sanitizeEmail(value) {
  return String(value ?? '').trim().toLowerCase().slice(0, 160)
}

function sanitizeName(value) {
  return String(value ?? '').replace(/[<>]/g, '').replace(/\s+/g, ' ').trim().slice(0, 120)
}

function isInvitableRole(role) {
  return INVITABLE_ROLES.includes(role)
}

export async function getInvitations() {
  await delay(200, 450)
  ensureSeeded()

  const list = db.invitations
    .map(withCompanyNames)
    .map(inv => ({
      ...inv,
      isExpired: inv.status === 'pendiente' && new Date(inv.expiresAt).getTime() <= Date.now(),
      daysLeft: Math.max(0, Math.ceil((new Date(inv.expiresAt).getTime() - Date.now()) / 86_400_000)),
    }))
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

  return ok(list)
}

export async function createInvitation({ email, name, role, companyIds, mfaRequired, invitedBy }) {
  await delay(400, 800)
  ensureSeeded()

  const cleanEmail = sanitizeEmail(email)
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/.test(cleanEmail)) {
    return error('Ingresa un correo válido', 'INVALID_EMAIL')
  }
  if (!isInvitableRole(role)) {
    return error('Rol no permitido para invitación', 'INVALID_ROLE')
  }
  const companies = Array.isArray(companyIds) ? [...new Set(companyIds.map(Number))].filter(Number.isFinite) : []
  if (db.users.some(u => u.email.toLowerCase() === cleanEmail)) {
    return error('Ya existe un usuario con ese correo', 'DUPLICATE_EMAIL')
  }
  if (db.invitations.some(i => i.email.toLowerCase() === cleanEmail && i.status === 'pendiente')) {
    return error('Ya hay una invitación pendiente para ese correo', 'DUPLICATE_INVITATION')
  }

  const invitation = {
    id: getNextId('invitations'),
    email: cleanEmail,
    name: sanitizeName(name),
    role,
    companyIds: companies,
    mfaRequired: Boolean(mfaRequired),
    invitedBy: sanitizeEmail(invitedBy) || 'desconocido',
    status: 'pendiente',
    token: randomToken(),
    attempts: 1,
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + INVITE_TTL_DAYS * 86_400_000).toISOString(),
  }
  db.invitations.push(invitation)
  track('invitacion_enviada', { role: invitation.role, companies: invitation.companyIds.length })
  return ok(withCompanyNames(invitation), {}, 'Invitación enviada por correo (simulada)')
}

export async function resendInvitation(invitationId) {
  await delay(350, 700)
  ensureSeeded()

  const index = db.invitations.findIndex(i => i.id === Number(invitationId))
  if (index === -1) return error('Invitación no encontrada', 'NOT_FOUND')
  if (db.invitations[index].status === 'aceptada') {
    return error('La invitación ya fue aceptada', 'ALREADY_ACCEPTED')
  }

  const current = db.invitations[index]
  db.invitations[index] = {
    ...current,
    status: 'pendiente',
    token: randomToken(),
    attempts: (current.attempts || 1) + 1,
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + INVITE_TTL_DAYS * 86_400_000).toISOString(),
  }
  return ok(withCompanyNames(db.invitations[index]), {}, 'Invitación reenviada (simulada)')
}

export async function revokeInvitation(invitationId) {
  await delay(250, 500)
  ensureSeeded()

  const index = db.invitations.findIndex(i => i.id === Number(invitationId))
  if (index === -1) return error('Invitación no encontrada', 'NOT_FOUND')

  const current = db.invitations[index]
  if (current.status === 'aceptada') return error('La invitación ya fue aceptada', 'ALREADY_ACCEPTED')

  db.invitations[index] = { ...current, status: 'revocada' }
  return ok(withCompanyNames(db.invitations[index]), {}, 'Invitación revocada')
}

export async function validateInvitation(token) {
  await delay(200, 400)
  ensureSeeded()

  const invitation = db.invitations.find(i => i.token === String(token))
  if (!invitation) return error('Invitación inválida o inexistente', 'INVALID_TOKEN')
  if (invitation.status === 'revocada') return error('Esta invitación fue revocada', 'REVOKED')
  if (invitation.status === 'aceptada') return error('Esta invitación ya fue utilizada', 'ALREADY_ACCEPTED')
  if (new Date(invitation.expiresAt).getTime() <= Date.now()) {
    return error('Esta invitación expiró. Solicita una nueva.', 'EXPIRED')
  }

  return ok({
    email: invitation.email,
    name: invitation.name,
    role: invitation.role,
    companyNames: withCompanyNames(invitation).companyNames,
    mfaRequired: Boolean(invitation.mfaRequired),
    expiresAt: invitation.expiresAt,
  })
}

export async function acceptInvitation(token, { name, password, mfaCode } = {}) {
  await delay(400, 800)
  ensureSeeded()

  const check = await validateInvitation(token)
  if (!check.ok) return check

  const cleanName = sanitizeName(name)
  if (cleanName.length < 2) return error('Ingresa tu nombre', 'INVALID_NAME')
  if (!password || String(password).length < 6) {
    return error('La contraseña debe tener al menos 6 caracteres', 'WEAK_PASSWORD')
  }

  const invitation = db.invitations.find(i => i.token === String(token))
  if (invitation.mfaRequired && !String(mfaCode || '').trim()) {
    return error('Ingresa el código MFA que enviamos a tu correo', 'MFA_REQUIRED')
  }
  if (db.users.some(u => u.email.toLowerCase() === invitation.email.toLowerCase())) {
    return error('Ya existe un usuario con ese correo', 'DUPLICATE_EMAIL')
  }

  const user = {
    id: getNextId('users'),
    email: invitation.email,
    password: String(password),
    name: cleanName,
    role: invitation.role,
    companies: [...invitation.companyIds],
    tenantId: null,
    avatar: null,
  }
  db.users.push(user)
  invitation.status = 'aceptada'
  invitation.acceptedAt = new Date().toISOString()
  track('invitacion_aceptada', { role: invitation.role })

  return ok({ id: user.id, email: user.email, name: user.name, role: user.role }, {}, 'Cuenta creada. Ya puedes iniciar sesión.')
}
