import { readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('../dist/assets', import.meta.url))

const budgets = [
  { pattern: /^index-.*\.js$/, maxBytes: 320 * 1024, label: 'main chunk (index-*.js)' },
  { pattern: /^vendor-.*\.js$/, maxBytes: 210 * 1024, label: 'vendor chunk (vendor-*.js) — incluye vue-i18n' },
  { pattern: /^AppLayout-.*\.js$/, maxBytes: 20 * 1024, label: 'layout chunk (AppLayout-*.js)' },
  { pattern: /^CargaMasivaView-.*\.js$/, maxBytes: 45 * 1024, label: 'carga masiva chunk' },
]

let files = []
try {
  files = readdirSync(root).filter(f => f.endsWith('.js'))
} catch {
  console.error(`No se encontró ${root}. Ejecuta primero: npm run build`)
  process.exit(1)
}

const results = []
for (const { pattern, maxBytes, label } of budgets) {
  const match = files.find(f => pattern.test(f))
  if (!match) {
    results.push({ label, ok: false, detail: 'no encontrado tras el build' })
    continue
  }
  const size = statSync(join(root, match)).size
  const ok = size <= maxBytes
  results.push({ label, ok, detail: `${(size / 1024).toFixed(1)} KB / ${(maxBytes / 1024).toFixed(0)} KB` })
}

let failed = 0
for (const { label, ok, detail } of results) {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}: ${detail}`)
  if (!ok) failed += 1
}

if (failed > 0) {
  console.error(`\n${failed} presupuesto(s) de bundle excedido(s). Justifica o reduce el chunk.`)
  process.exit(1)
}
console.log('\nPresupuestos de bundle OK.')
