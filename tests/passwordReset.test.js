import { describe, it, expect } from 'vitest'
import {
  login,
  requestPasswordReset,
  validateResetToken,
  resetPassword,
} from '@/services/auth.service'
import { createUser, deleteUser, getUsers } from '@/services/users.service'

describe('mock auth — rate limit + password reset', () => {
  let testEmail

  it('sets up a dedicated test user', async () => {
    const created = await createUser({
      name: 'Rate Limit Test',
      email: 'ratelimit@cobertura.test',
      password: 'secreta123',
      role: 'staff',
      companies: [1],
    })
    expect(created.ok).toBe(true)
    testEmail = 'ratelimit@cobertura.test'
  })

  it('locks the account after 5 consecutive failures', async () => {
    for (let i = 0; i < 4; i++) {
      const res = await login({ email: testEmail, password: 'wrong-password' })
      expect(res.error).toBe('INVALID_CREDENTIALS')
    }
    const fifth = await login({ email: testEmail, password: 'wrong-password' })
    expect(fifth.error).toBe('ACCOUNT_LOCKED')
    const locked = await login({ email: testEmail, password: 'secreta123' })
    expect(locked.ok).toBe(false)
    expect(locked.error).toBe('ACCOUNT_LOCKED')
  })

  it('does not reveal whether the email exists in reset requests', async () => {
    const unknown = await requestPasswordReset('no-existe-nadie@cobertura.test')
    expect(unknown.ok).toBe(true)
    expect(unknown.data.demoResetUrl).toBeNull()

    const known = await requestPasswordReset(testEmail)
    expect(known.ok).toBe(true)
    expect(known.data.demoResetUrl).toMatch(/^\/restablecer\//)
  })

  it('validates the reset token and rejects unknown tokens', async () => {
    const bad = await validateResetToken('token-inexistente')
    expect(bad.ok).toBe(false)
    expect(bad.error).toBe('INVALID_TOKEN')

    const request = await requestPasswordReset(testEmail)
    const token = request.data.demoResetUrl.replace('/restablecer/', '')
    const valid = await validateResetToken(token)
    expect(valid.ok).toBe(true)
    expect(valid.data.email).toBe(testEmail)
  })

  it('resets the password, consumes the token and unlocks the account', async () => {
    const request = await requestPasswordReset(testEmail)
    const token = request.data.demoResetUrl.replace('/restablecer/', '')

    const weak = await resetPassword(token, '123')
    expect(weak.ok).toBe(false)
    expect(weak.error).toBe('WEAK_PASSWORD')

    const updated = await resetPassword(token, 'nuevaClave456')
    expect(updated.ok).toBe(true)

    const reused = await resetPassword(token, 'otraClave789')
    expect(reused.ok).toBe(false)

    const oldLogin = await login({ email: testEmail, password: 'secreta123' })
    expect(oldLogin.ok).toBe(false)

    const newLogin = await login({ email: testEmail, password: 'nuevaClave456' })
    expect(newLogin.ok).toBe(true)
  })

  it('cleans up the test user', async () => {
    const list = await getUsers(null, { search: testEmail })
    const created = list.data.find(u => u.email === testEmail)
    if (created) await deleteUser(created.id)
  })
})
