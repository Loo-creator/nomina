import { describe, it, expect } from 'vitest'
import { formatCurrency, formatDate, formatNumber, truncate, slugify, capitalize } from '@/shared/utils/format'
import { corporateEmail, emailLocalFromRfc, isValidDomain, normalizeDomain } from '@/shared/utils/email'
import { sanitizeText, sanitizeEmail, sanitizePhone, sanitizeDomain } from '@/shared/utils/sanitize'

describe('format utils', () => {
  it('formats currency in MXN with no decimals', () => {
    expect(formatCurrency(66400)).toMatch(/66,400/)
    expect(formatCurrency(null)).toBe('—')
  })

  it('formats dates, numbers, slugs, capitals and truncation', () => {
    expect(formatDate('2024-01-15')).toMatch(/2024|ene/i)
    expect(formatNumber(123456)).toMatch(/123,456/)
    expect(slugify('Compañía del Ñandú & Co.')).toBe('compania-del-nandu-co')
    expect(capitalize('hOLA')).toBe('Hola')
    expect(truncate('abcdefghij', 6)).toBe('abcde…')
  })
})

describe('email utils (corporate rule)', () => {
  it('builds RFC-based corporate emails', () => {
    expect(corporateEmail('PEPJ900101XXX', 'empresademo.com')).toBe('pepj900101xxx@empresademo.com')
  })

  it('normalizes Ñ and strips accents/ampersands', () => {
    expect(emailLocalFromRfc('PEPJ900101AÑ&')).toBe('pepj900101any')
    expect(emailLocalFromRfc('GÓM850101ABC')).toBe('gom850101abc')
  })

  it('normalizes and validates domains', () => {
    expect(normalizeDomain(' https://www.EmpresaDemo.com/ ')).toBe('www.empresademo.com')
    expect(isValidDomain('empresademo.com')).toBe(true)
    expect(isValidDomain('no es dominio')).toBe(false)
    expect(isValidDomain('')).toBe(false)
  })
})

describe('sanitize utils', () => {
  it('strips control chars and angle brackets and enforces length', () => {
    expect(sanitizeText('  hola\u0000<script>  ')).toBe('holascript')
    expect(sanitizeText('a'.repeat(500), { maxLength: 10 })).toBe('aaaaaaaaaa')
  })

  it('allowNewlines keeps single newlines and collapses blank runs', () => {
    expect(sanitizeText('uno\n\n\n\ndos', { allowNewlines: true })).toBe('uno\n\ndos')
    expect(sanitizeText('línea1\n   línea2 ', { allowNewlines: true })).toBe('línea1\nlínea2')
  })

  it('sanitizes emails, phones and domains', () => {
    expect(sanitizeEmail('  Foo@Bar.COM ')).toBe('foo@bar.com')
    expect(sanitizePhone('+52 (55) 1234-5678 ext.9')).toBe('+52 (55) 1234-5678 .9')
    expect(sanitizeDomain('https://sub.Empresa.com/path')).toBe('sub.empresa.com')
  })
})
