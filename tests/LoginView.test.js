import { describe, it, expect } from 'vitest'
import { render, fireEvent, screen, waitFor } from '@testing-library/vue'
import { createPinia } from 'pinia'
import { createRouter, createMemoryHistory } from 'vue-router'
import LoginView from '@/microfrontends/auth/views/LoginView.vue'
import { i18n } from '@/shared/i18n'

function makeRouter() {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/login', name: 'login', component: LoginView },
      { path: '/dashboard', name: 'dashboard-home', component: { template: '<div>Dashboard</div>' } },
    ],
  })
}

describe('LoginView', () => {
  it('renders email and password fields', () => {
    const router = makeRouter()
    router.push('/login')
    render(LoginView, { global: { plugins: [i18n, createPinia(), router] } })
    expect(screen.getByLabelText('Email')).toBeTruthy()
    expect(screen.getByLabelText('Contraseña')).toBeTruthy()
    expect(screen.getByRole('button', { name: /iniciar sesión/i })).toBeTruthy()
  })

  it('signs in with demo credentials and navigates to dashboard', async () => {
    const router = makeRouter()
    await router.push('/login')
    render(LoginView, { global: { plugins: [i18n, createPinia(), router] } })

    await fireEvent.update(screen.getByLabelText('Email'), 'cliente@nomikok.com')
    await fireEvent.update(screen.getByLabelText('Contraseña'), '123456')
    await fireEvent.click(screen.getByRole('button', { name: /iniciar sesión/i }))

    await waitFor(() => expect(router.currentRoute.value.path).toBe('/dashboard'), { timeout: 4000 })
  })

  it('shows an error alert on invalid credentials', async () => {
    const router = makeRouter()
    await router.push('/login')
    render(LoginView, { global: { plugins: [i18n, createPinia(), router] } })

    await fireEvent.update(screen.getByLabelText('Email'), 'cliente@nomikok.com')
    await fireEvent.update(screen.getByLabelText('Contraseña'), 'incorrecta')
    await fireEvent.click(screen.getByRole('button', { name: /iniciar sesión/i }))

    expect(await screen.findByRole('alert')).toBeTruthy()
    expect(router.currentRoute.value.path).toBe('/login')
  })
})
