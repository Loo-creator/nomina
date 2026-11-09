import { describe, it, expect, vi } from 'vitest'
import { render, fireEvent, screen } from '@testing-library/vue'
import { createRouter, createMemoryHistory } from 'vue-router'
import { createPinia } from 'pinia'
import { i18n } from '@/shared/i18n'
import DataFilterBar from '@/shared/components/DataFilterBar.vue'

function makeRouter() {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', name: 'home', component: { template: '<div />' } },
    ],
  })
}

function renderBar(props = {}) {
  const router = makeRouter()
  const utils = render(DataFilterBar, {
    props: {
      modelValue: {},
      resultsCount: 12,
      searchable: true,
      filters: [
        {
          key: 'companyId',
          label: 'Compañía',
          type: 'select',
          placeholder: 'Todas las compañías',
          options: [
            { value: '1', label: 'Empresa Demo SA de CV', meta: 'EMP123456789' },
            { value: '2', label: 'Tech Solutions SA', meta: 'TEC987654321' },
          ],
        },
        {
          key: 'status',
          label: 'Estado',
          type: 'select',
          placeholder: 'Todos los estados',
          options: [
            { value: 'timbrada', label: 'Timbrada' },
            { value: 'firmada', label: 'Firmada' },
          ],
        },
        { key: 'stampedAt', label: 'Fecha de emisión', type: 'dateRange', placeholder: 'Rango de fechas', field: 'stampedAt' },
      ],
      visibleFilterKeys: ['companyId'],
      ...props,
    },
    global: { plugins: [i18n, createPinia(), router] },
  })
  return { ...utils, router }
}

describe('DataFilterBar (rediseño)', () => {
  it('barra superior minimalista: buscador + selector compañía + Más filtros', async () => {
    await renderBar()
    const search = document.querySelector('#global-search')
    expect(search).toBeTruthy()
    // quick company selector in the main bar (always hand's)
    expect(screen.getByRole('button', { name: /Todas las compañías/i })).toBeTruthy()
    expect(screen.getByRole('button', { name: /Más filtros/i })).toBeTruthy()
  })

  it('abre el panel avanzado con fecha inicio/fin y footer Aplicar/Limpiar', async () => {
    document.body.innerHTML = ''
    await renderBar({ modelValue: { status: 'timbrada' } })
    await fireEvent.click(screen.getByRole('button', { name: /Más filtros/i }))
    expect(screen.getByRole('button', { name: /aplicar filtros/i })).toBeTruthy()
    expect(screen.getByRole('button', { name: /limpiar filtros/i })).toBeTruthy()
    expect(document.querySelector('input[type="date"]')).toBeTruthy()
  })

  it('muestra chips con filtro aplicado y limpiar todo', async () => {
    document.body.innerHTML = ''
    renderBar({ modelValue: { status: 'timbrada' } })
    const chipButtons = screen.getAllByRole('button', { name: /quitar/i })
    expect(chipButtons.length).toBeGreaterThan(0)
    expect(screen.getByText(/Mostrando/).textContent).toContain('registros')
  })
})
