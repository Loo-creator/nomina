export function emailLocalFromRfc(rfc) {
  return String(rfc || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/&/g, 'Y')
    .replace(/[^A-Z0-9._-]/g, '')
    .toLowerCase()
    .slice(0, 64)
}

export function normalizeDomain(domain) {
  return String(domain || '')
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/\/.*$/, '')
}

export function isValidDomain(domain) {
  return /^(?=.{1,120}$)([a-z0-9]([a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,}$/.test(normalizeDomain(domain))
}

export function corporateEmail(rfc, domain) {
  const local = emailLocalFromRfc(rfc)
  const d = normalizeDomain(domain)
  if (!local || !isValidDomain(d)) return ''
  return `${local}@${d}`
}
