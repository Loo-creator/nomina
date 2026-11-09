import { db, getNextId } from './_db'
import { delay, ok, error } from './helpers/responses'

function sanitize(user) {
  const { password, ...rest } = user
  const tenant = user.tenantId ? db.tenants.find(t => t.id === user.tenantId) : null
  return {
    ...rest,
    tenantStatus: tenant?.status || null,
    companyNames: (user.companies || [])
      .map(id => db.companies.find(c => c.id === id)?.name)
      .filter(Boolean),
  }
}

export async function getUsers(companyIds = null, filters = {}) {
  await delay(250, 600)

  let list = db.users.map(sanitize)

  if (companyIds) {
    list = list.filter(u => (u.companies || []).some(id => companyIds.includes(id)))
  }
  if (filters.role) {
    list = list.filter(u => u.role === filters.role)
  }
  if (filters.search) {
    const q = filters.search.toLowerCase()
    list = list.filter(u =>
      u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
    )
  }

  return ok(list)
}

export async function getUserById(id) {
  await delay(150, 350)
  const user = db.users.find(u => u.id === Number(id))
  if (user) return ok(sanitize(user))
  return error('Usuario no encontrado', 'NOT_FOUND')
}

export async function createUser(data) {
  await delay(400, 800)

  if (db.users.some(u => u.email === data.email)) {
    return error('Ya existe un usuario con ese email', 'DUPLICATE_EMAIL')
  }

  const user = {
    id: getNextId('users'),
    password: data.password || '123456',
    avatar: null,
    companies: data.companies || [],
    ...data,
  }
  db.users.push(user)
  return ok(sanitize(user), {}, 'Usuario creado correctamente')
}

export async function updateUser(id, data) {
  await delay(300, 600)

  const index = db.users.findIndex(u => u.id === Number(id))
  if (index === -1) return error('Usuario no encontrado', 'NOT_FOUND')

  const { password, ...rest } = data
  db.users[index] = { ...db.users[index], ...rest }
  if (password) db.users[index].password = password

  return ok(sanitize(db.users[index]), {}, 'Usuario actualizado correctamente')
}

export async function deleteUser(id) {
  await delay(250, 500)

  const index = db.users.findIndex(u => u.id === Number(id))
  if (index === -1) return error('Usuario no encontrado', 'NOT_FOUND')

  db.users.splice(index, 1)
  return ok(null, {}, 'Usuario eliminado correctamente')
}
