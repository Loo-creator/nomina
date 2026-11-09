import { describe, it, expect, vi } from 'vitest'
import { render, fireEvent, screen } from '@testing-library/vue'

vi.mock('focus-trap-vue', () => ({
  FocusTrap: {
    name: 'FocusTrap',
    template: '<div><slot /></div>',
  },
}))

import Modal from '@/shared/components/Modal.vue'
import { i18n } from '@/shared/i18n'

describe('Modal', () => {
  it('renders dialog semantics with an accessible title', () => {
    render(Modal, {
      global: { plugins: [i18n] },
      props: { modelValue: true, title: 'Confirmar acción' },
      slots: { default: '<p>Contenido</p>' },
    })
    const dialog = screen.getByRole('dialog')
    expect(dialog.getAttribute('aria-modal')).toBe('true')
    expect(dialog.getAttribute('aria-labelledby')).toBeTruthy()
    expect(screen.getByText('Confirmar acción')).toBeTruthy()
    expect(screen.getByText('Contenido')).toBeTruthy()
  })

  it('closes on Escape', async () => {
    const { emitted } = render(Modal, {
      global: { plugins: [i18n] },
      props: { modelValue: true, title: 'Cerrar con Escape' },
      slots: { default: '<p>Body</p>' },
    })
    await fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' })
    expect(emitted()['update:modelValue']).toBeTruthy()
    expect(emitted()['update:modelValue'][0]).toEqual([false])
  })

  it('renders slot content and footer when provided', () => {
    render(Modal, {
      global: { plugins: [i18n] },
      props: { modelValue: true, title: 'Con footer' },
      slots: {
        default: '<p>Cuerpo del diálogo</p>',
        footer: '<button type="button">Aceptar</button>',
      },
    })
    expect(screen.getByText('Cuerpo del diálogo')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Aceptar' })).toBeTruthy()
  })
})
