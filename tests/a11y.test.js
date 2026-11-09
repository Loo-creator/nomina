import { describe, it, expect, vi } from 'vitest'
import { render } from '@testing-library/vue'
import axe from 'axe-core'

vi.mock('focus-trap-vue', () => ({
  FocusTrap: {
    name: 'FocusTrap',
    template: '<div><slot /></div>',
  },
}))

import ErrorState from '@/shared/components/ErrorState.vue'
import Select from '@/shared/components/Select.vue'
import Modal from '@/shared/components/Modal.vue'
import { i18n } from '@/shared/i18n'

const axeOptions = {
  rules: {
    'color-contrast': { enabled: false },
  },
}

async function expectNoViolations(container) {
  const results = await axe.run(container, axeOptions)
  expect(results.violations).toEqual([])
}

describe('accessibility (axe-core)', () => {
  it('ErrorState has no detectable violations', async () => {
    const { container } = render(ErrorState, { global: { plugins: [i18n] }, props: { detail: 'getDashboardStats' } })
    await expectNoViolations(container)
  })

  it('Select closed has no detectable violations', async () => {
    const { container } = render(Select, {
      global: { plugins: [i18n] },
      props: {
        id: 'axe-select',
        label: 'Compañía',
        options: [{ value: 'a', label: 'Alpha' }],
      },
    })
    await expectNoViolations(container)
  })

  it('Modal open has no detectable violations', async () => {
    render(Modal, {
      global: { plugins: [i18n] },
      props: { modelValue: true, title: 'Confirmar' },
      slots: { default: '<p>Contenido del diálogo</p>', footer: '<button type="button">Aceptar</button>' },
    })
    await expectNoViolations(document.body)
  })
})
