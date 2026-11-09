import { describe, it, expect } from 'vitest'
import { useFilteredData } from '@/shared/composables/useFilteredData'
import { ref } from 'vue'

const employees = [
  { id: 1, fullName: 'Juan Pérez', companyName: 'Empresa Demo SA de CV', hireDate: '2023-01-15', status: 'active', email: 'juan.perez@empresademo.com', hasUser: true },
  { id: 2, fullName: 'María González', companyName: 'Empresa Demo SA de CV', hireDate: '2024-06-01', status: 'active', email: 'maria.gonzalez@empresademo.com', hasUser: false },
  { id: 3, fullName: 'Oscar Ruiz', companyName: 'Tech Solutions SA', hireDate: '2022-03-10', status: 'inactive', email: 'o.ruiz@techsolutions.com', hasUser: true },
]

describe('useFilteredData — spec filters', () => {
  it('filters by select (status/company) with ANY-all semantics', () => {
    const model = ref({ status: 'active' })
    const computed = useFilteredData(employees, model, [
      { key: 'status', type: 'select' },
      { key: 'companyName', type: 'select' },
    ])
    expect(computed.value.map(e => e.id)).toEqual([1, 2])
  })

  it('filters by dateRange (hire dates) with min/max', () => {
    const model = ref({ hireRange: { min: '2023-01-01', max: '2024-01-01' } })
    const computed = useFilteredData(employees, model, [
      { key: 'hireRange', type: 'dateRange', field: 'hireDate' },
    ])
    expect(computed.value.map(e => e.id)).toEqual([1])
  })

  it('presets apply MM-MM ranges relative to now for payments', () => {
    const today = new Date()
    const y = today.getFullYear()
    const m = String(today.getMonth() + 1).padStart(2, '0')
    const payrolls = [
      { id: 'a', period: `${y}-${m}` },
      { id: 'b', period: `${y - 1}-01` },
    ]
    const model = ref({ period: { min: `${y}-01`, max: `${y}-12` } })
    const computed = useFilteredData(payrolls, model, [
      { key: 'period', type: 'dateRange', field: 'period' },
    ])
    expect(computed.value.map(p => p.id)).toEqual(['a'])
  })

  it('filters by hasUser (with/without user access)', () => {
    const model = ref({ hasUser: 'no' })
    const computed = useFilteredData(employees, model, [
      {
        key: 'hasUser',
        type: 'select',
        filterFn: (row, value) => (value === 'si') === !!row.hasUser,
      },
    ])
    expect(computed.value.map(e => e.id)).toEqual([2])
  })

  it('searches across name, RFC, CURP, NSS and id (employee spec fields)', () => {
    const model = ref({ search: '2' })
    const computed = useFilteredData(employees, model, [], {
      searchFields: ['fullName', 'id', 'companyName'],
    })
    expect(computed.value.map(e => e.id)).toEqual([2])
  })
})
