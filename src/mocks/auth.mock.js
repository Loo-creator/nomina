import { db } from './_db'
import { delay, ok, error } from './helpers/responses'

const loginAttempts = new Map()
const passwordResetTokens = new Map()

const MAX_LOGIN_ATTEMPTS = 5
const LOCKOUT_MINUTES = 15
const ATTEMPT_WINDOW_MINUTES = 15
const RESET_TOKEN_TTL_MINUTES = 15

function lockoutKey(email) {
  return String(email || '').trim().toLowerCase()
}

function pruneAttempts(now) {
  for (const [key, entry] of loginAttempts) {
    if (entry.lockedUntil && now >= entry.lockedUntil) {
      loginAttempts.delete(key)
    } else if (!entry.lockedUntil && now - entry.firstFailAt > ATTEMPT_WINDOW_MINUTES * 60_000) {
      loginAttempts.delete(key)
    }
  }
}

function lockoutMessage(minutes) {
  return `Demasiados intentos fallidos. Tu cuenta se desbloqueará en ${minutes} minuto(s).`
}

function getLockoutStatus(email) {
  const now = Date.now()
  pruneAttempts(now)
  const entry = loginAttempts.get(lockoutKey(email))
  if (entry?.lockedUntil && now < entry.lockedUntil) {
    return { locked: true, remainingMinutes: Math.ceil((entry.lockedUntil - now) / 60_000) }
  }
  return { locked: false, remainingMinutes: 0 }
}

function registerFailure(email) {
  const now = Date.now()
  pruneAttempts(now)
  const key = lockoutKey(email)
  const entry = loginAttempts.get(key) || { fails: 0, firstFailAt: now, lockedUntil: null }
  entry.fails += 1
  if (entry.fails >= MAX_LOGIN_ATTEMPTS) {
    entry.lockedUntil = now + LOCKOUT_MINUTES * 60_000
  }
  loginAttempts.set(key, entry)
  return entry
}

function clearFailures(email) {
  loginAttempts.delete(lockoutKey(email))
}

function randomToken() {
  const bytes = new Uint8Array(16)
  if (globalThis.crypto?.getRandomValues) {
    globalThis.crypto.getRandomValues(bytes)
  } else {
    for (let i = 0; i < bytes.length; i++) bytes[i] = Math.floor(Math.random() * 256)
  }
  return Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('')
}

function pruneResetTokens() {
  const now = Date.now()
  for (const [token, entry] of passwordResetTokens) {
    if (entry.used || now > entry.expiresAt) passwordResetTokens.delete(token)
  }
}

const ROLES = {
  SUPERADMIN: 'superadmin',
  ADMIN: 'admin',
  STAFF: 'staff',
  CLIENTE: 'cliente',
  EMPLEADO: 'empleado',
}

const DEMO_CREDENTIALS = {
  [ROLES.SUPERADMIN]: { email: 'superadmin@nomikok.com', password: '123456' },
  [ROLES.ADMIN]: { email: 'admin@nomikok.com', password: '123456' },
  [ROLES.SUPERVISOR]: { email: 'supervisor@nomikok.com', password: '123456' },
  [ROLES.STAFF]: { email: 'staff@nomikok.com', password: '123456' },
  [ROLES.CLIENTE]: { email: 'cliente@nomikok.com', password: '123456' },
  [ROLES.EMPLEADO]: { email: 'empleado@nomikok.com', password: '123456' },
}

export async function login(credentials) {
  await delay()

  const { email, password, role } = credentials

  const lockout = getLockoutStatus(email)
  if (lockout.locked) {
    return error(lockoutMessage(lockout.remainingMinutes), 'ACCOUNT_LOCKED')
  }

  if (role && DEMO_CREDENTIALS[role]) {
    const demo = DEMO_CREDENTIALS[role]
    if (email === demo.email && password === demo.password) {
      const user = db.users.find(u => u.email === email)
      if (user) {
        const { password: _, ...userWithoutPassword } = user
        clearFailures(email)
        return ok(userWithoutPassword, {}, 'Bienvenido a NOMIKOK')
      }
    }
  }

  const user = db.users.find(u => u.email === email && u.password === password)
  if (user) {
    const { password: _, ...userWithoutPassword } = user
    clearFailures(email)
    return ok(userWithoutPassword, {}, 'Bienvenido a NOMIKOK')
  }

  const entry = registerFailure(email)
  if (entry.lockedUntil) {
    return error(lockoutMessage(LOCKOUT_MINUTES), 'ACCOUNT_LOCKED')
  }
  return error('Credenciales inválidas', 'INVALID_CREDENTIALS')
}

export async function verifyCredentials(email, password) {
  await delay(150, 400)
  if (!email || !password) return error('Ingresa tu correo y contraseña', 'INVALID_INPUT')
  const user = db.users.find(u => u.email === email && u.password === password)
  if (!user) return error('Contraseña incorrecta', 'INVALID_CREDENTIALS')
  return ok({ id: user.id, email: user.email }, {}, 'Identidad verificada')
}

export async function requestPasswordReset(email) {
  await delay(250, 600)

  const cleanEmail = String(email || '').trim().toLowerCase()
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/.test(cleanEmail)) {
    return error('Ingresa un correo válido', 'INVALID_EMAIL')
  }

  pruneResetTokens()
  const user = db.users.find(u => u.email.toLowerCase() === cleanEmail)
  const genericMessage = 'Si el correo existe en el sistema, enviamos instrucciones para restablecer la contraseña.'

  if (!user) {
    return ok({ demoResetUrl: null }, {}, genericMessage)
  }

  const token = randomToken()
  passwordResetTokens.set(token, {
    email: user.email.toLowerCase(),
    expiresAt: Date.now() + RESET_TOKEN_TTL_MINUTES * 60_000,
    used: false,
  })

  return ok(
    { demoResetUrl: `/restablecer/${token}` },
    {},
    genericMessage,
  )
}

export async function validateResetToken(token) {
  await delay(150, 400)

  pruneResetTokens()
  const entry = passwordResetTokens.get(String(token || ''))
  if (!entry) return error('El enlace de restablecimiento es inválido o expiró.', 'INVALID_TOKEN')
  if (entry.used) return error('El enlace de restablecimiento ya fue utilizado.', 'TOKEN_USED')
  if (Date.now() > entry.expiresAt) {
    passwordResetTokens.delete(String(token))
    return error('El enlace de restablecimiento expiró. Solicita uno nuevo.', 'EXPIRED')
  }

  return ok({ email: entry.email, expiresAt: new Date(entry.expiresAt).toISOString() })
}

export async function resetPassword(token, newPassword) {
  await delay(300, 700)

  const cleanToken = String(token || '')
  const check = await validateResetToken(cleanToken)
  if (!check.ok) return check

  if (!newPassword || String(newPassword).length < 6) {
    return error('La contraseña debe tener al menos 6 caracteres', 'WEAK_PASSWORD')
  }

  const entry = passwordResetTokens.get(cleanToken)
  const user = db.users.find(u => u.email.toLowerCase() === entry.email)
  if (!user) return error('Usuario no encontrado', 'NOT_FOUND')

  user.password = String(newPassword)
  entry.used = true
  clearFailures(user.email)

  return ok({ email: user.email }, {}, 'Contraseña actualizada correctamente. Ya puedes iniciar sesión.')
}

export async function logout() {
  await delay(100, 300)
  return ok(null, {}, 'Sesión cerrada correctamente')
}

export async function getCurrentUser(userId) {
  await delay(100, 300)
  const user = db.users.find(u => u.id === userId)
  if (user) {
    const { password: _, ...userWithoutPassword } = user
    return ok(userWithoutPassword)
  }
  return error('Usuario no encontrado', 'NOT_FOUND')
}

export async function getDemoCredentials() {
  await delay(50, 150)
  return ok(DEMO_CREDENTIALS)
}

export async function getRoles() {
  await delay(50, 150)
  return ok(Object.values(ROLES).map(r => ({ value: r, label: r.charAt(0).toUpperCase() + r.slice(1) })))
}