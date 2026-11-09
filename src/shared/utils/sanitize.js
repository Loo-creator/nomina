const CONTROL_CHARS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g
const TAG_CHARS = /[<>]/g

export function sanitizeText(value, { maxLength = 200, allowNewlines = false } = {}) {
  if (value === null || value === undefined) return ''
  let v = String(value).replace(CONTROL_CHARS, '').replace(TAG_CHARS, '')
  if (allowNewlines) {
    v = v
      .split('\n')
      .map(line => line.replace(/\s+/g, ' ').trim())
      .join('\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim()
  } else {
    v = v.replace(/\s+/g, ' ').trim()
  }
  return v.slice(0, maxLength)
}

export function sanitizeEmail(value) {
  return sanitizeText(value, { maxLength: 160 }).toLowerCase()
}

export function sanitizePhone(value) {
  return sanitizeText(value, { maxLength: 25 }).replace(/[^\d+()\-\s.]/g, '')
}

export function sanitizeDomain(value) {
  return sanitizeText(value, { maxLength: 120 }).toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '')
}
