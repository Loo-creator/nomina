import { describe, it, expect } from 'vitest'
import { render, fireEvent, screen } from '@testing-library/vue'
import Select from '@/shared/components/Select.vue'
import { i18n } from '@/shared/i18n'

const options = [
  { value: 'a', label: 'Alpha' },
  { value: 'b', label: 'Beta' },
  { value: 'c', label: 'Gamma' },
]

describe('Select', () => {
  it('opens the listbox and selects an option', async () => {
    const { emitted } = render(Select, { global: { plugins: [i18n] }, props: { id: 'test-select', options, placeholder: 'Elige' } })

    const trigger = screen.getByRole('button', { name: /elige/i })
    expect(trigger.getAttribute('aria-expanded')).toBe('false')

    await fireEvent.click(trigger)
    expect(trigger.getAttribute('aria-expanded')).toBe('true')

    const option = screen.getByRole('option', { name: 'Beta' })
    await fireEvent.click(option)
    expect(emitted()['update:modelValue']).toEqual([['b']])
    expect(trigger.getAttribute('aria-expanded')).toBe('false')
  })

  it('supports keyboard navigation with aria-activedescendant', async () => {
    const { emitted } = render(Select, { global: { plugins: [i18n] }, props: { id: 'kb-select', options, placeholder: 'Elige' } })

    const trigger = screen.getByRole('button', { name: /elige/i })
    await fireEvent.keyDown(trigger, { key: 'ArrowDown' })
    const expanded = trigger.getAttribute('aria-expanded')
    expect(expanded).toBe('true')
    await fireEvent.keyDown(trigger, { key: 'ArrowDown' })
    const activeDesc = trigger.getAttribute('aria-activedescendant')
    expect(activeDesc).toBeTruthy()
    await fireEvent.keyDown(trigger, { key: 'Enter' })
    expect(emitted()['update:modelValue']).toEqual([['a']])
  })

  it('closes with Escape', async () => {
    render(Select, { global: { plugins: [i18n] }, props: { id: 'esc-select', options, placeholder: 'Elige' } })
    const trigger = screen.getByRole('button', { name: /elige/i })
    await fireEvent.click(trigger)
    await fireEvent.keyDown(trigger, { key: 'Escape' })
    expect(trigger.getAttribute('aria-expanded')).toBe('false')
  })

  it('does not render a nested button inside the trigger', async () => {
    render(Select, { global: { plugins: [i18n] }, props: { id: 'nest-select', options, placeholder: 'Elige', clearable: true, modelValue: 'a' } })
    const trigger = screen.getByRole('button', { name: /alpha/i })
    expect(trigger.querySelector('button')).toBeNull()
  })
})
