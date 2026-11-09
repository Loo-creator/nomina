import { describe, it, expect } from 'vitest'
import { render, fireEvent, screen } from '@testing-library/vue'
import ErrorState from '@/shared/components/ErrorState.vue'
import { i18n } from '@/shared/i18n'

describe('ErrorState', () => {
  it('renders title, message and technical details', () => {
    render(ErrorState, {
      global: { plugins: [i18n] },
      props: {
        title: 'No se pudo cargar el dashboard',
        message: 'Red caída',
        detail: 'getDashboardStats',
      },
    })
    expect(screen.getByRole('alert')).toBeTruthy()
    expect(screen.getByText('No se pudo cargar el dashboard')).toBeTruthy()
    expect(screen.getByText('Red caída')).toBeTruthy()
    expect(screen.getByText('getDashboardStats')).toBeTruthy()
  })

  it('emits retry when clicking the action', async () => {
    const { emitted } = render(ErrorState, { global: { plugins: [i18n] }, props: { detail: 'x' } })
    await fireEvent.click(screen.getByRole('button', { name: /reintentar/i }))
    expect(emitted().retry).toHaveLength(1)
  })

  it('hides technical details when not provided', () => {
    render(ErrorState, { global: { plugins: [i18n] } })
    expect(screen.queryByText('Detalles técnicos')).toBeNull()
  })
})
