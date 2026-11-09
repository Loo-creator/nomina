import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const cssPath = fileURLToPath(new URL('../src/style.css', import.meta.url))
const outPath = fileURLToPath(new URL('../design-tokens.json', import.meta.url))
const css = readFileSync(cssPath, 'utf8')

function extractBlock(source, selector) {
  const start = source.indexOf(selector)
  if (start === -1) return ''
  const open = source.indexOf('{', start)
  if (open === -1) return ''
  let depth = 0
  for (let i = open; i < source.length; i++) {
    if (source[i] === '{') depth += 1
    else if (source[i] === '}') {
      depth -= 1
      if (depth === 0) return source.slice(open + 1, i)
    }
  }
  return ''
}

function parseDeclarations(block) {
  const declarations = {}
  const regex = /--([a-zA-Z0-9-]+)\s*:\s*([^;]+);/g
  let match
  while ((match = regex.exec(block)) !== null) {
    declarations[match[1]] = match[2].trim()
  }
  return declarations
}

function toHex({ r, g, b }) {
  const h = (n) => Number(n).toString(16).padStart(2, '0')
  return `#${h(r)}${h(g)}${h(b)}`.toUpperCase()
}

function parseValue(name, raw) {
  const rgbMatch = raw.match(/^(\d{1,3})\s+(\d{1,3})\s+(\d{1,3})$/)
  if (rgbMatch) {
    return { value: toHex({ r: rgbMatch[1], g: rgbMatch[2], b: rgbMatch[3] }), type: 'color' }
  }
  const hexMatch = raw.match(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/)
  if (hexMatch) return { value: raw.toUpperCase(), type: 'color' }
  if (name.includes('shadow') || name.includes('gradient') || raw.includes('gradient')) {
    return { value: raw, type: 'other' }
  }
  const pxMatch = raw.match(/^(\d+(?:\.\d+)?)(px|rem|em)$/)
  if (pxMatch) return { value: raw, type: 'dimension' }
  return { value: raw, type: 'other' }
}

function groupTokens(declarations) {
  const groups = { color: {}, dimension: {}, other: {} }
  for (const [name, raw] of Object.entries(declarations)) {
    const { value, type } = parseValue(name, raw)
    const group = groups[type] || groups.other
    group[name.replace(/-/g, '.')] = { value, type }
  }
  return groups
}

const rootBlock = extractBlock(css, ':root')
const themes = ['nomikok', 'oceano', 'uva', 'oscuro']
const result = {
  base: groupTokens(parseDeclarations(rootBlock)),
}
for (const theme of themes) {
  const block = extractBlock(css, `[data-theme="${theme}"]`)
  if (block) result[theme] = groupTokens(parseDeclarations(block))
}

writeFileSync(outPath, JSON.stringify(result, null, 2) + '\n')
console.log(`Design tokens escritos en ${outPath}`)
for (const key of Object.keys(result)) {
  const groups = result[key]
  const count = Object.values(groups).reduce((sum, g) => sum + Object.keys(g).length, 0)
  console.log(`  ${key}: ${count} tokens`)
}
