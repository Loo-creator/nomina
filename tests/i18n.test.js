import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { i18n, setLocale, currentLocale } from '@/shared/i18n'
import es from '@/shared/i18n/locales/es.json'
import en from '@/shared/i18n/locales/en.json'

describe('i18n', () => {
  const original = currentLocale()

  beforeEach(() => setLocale('es'))
  afterEach(() => setLocale(original))

  it('defaults to Spanish and switches to English', () => {
    setLocale('es')
    expect(i18n.global.t('common.save')).toBe('Guardar')
    setLocale('en')
    expect(i18n.global.t('common.save')).toBe('Save')
  })

  it('falls back to Spanish for unknown locales and keeps key parity', () => {
    setLocale('fr')
    expect(currentLocale()).toBe('es')
    const flat = (obj, prefix = '') =>
      Object.entries(obj).flatMap(([k, v]) =>
        typeof v === 'object' && v !== null ? flat(v, `${prefix}${k}.`) : [`${prefix}${k}`],
      )
    expect(flat(es).sort()).toEqual(flat(en).sort())
  })
})
