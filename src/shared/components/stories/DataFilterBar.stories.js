import DataFilterBar from '../DataFilterBar.vue'

export default {
  title: 'UI/DataFilterBar',
  component: DataFilterBar,
  tags: ['autodocs'],
  argTypes: {
    resultsCount: { control: 'number' },
    searchable: { control: 'boolean' },
  },
  args: {
    resultsCount: 42,
    searchable: true,
    searchPlaceholder: 'Buscar por nombre, RFC o folio...',
    filters: [
      {
        key: 'companyId',
        label: 'Compañía',
        type: 'select',
        group: 'Organización',
        placeholder: 'Todas las compañías',
        options: [
          { value: '1', label: 'Empresa Demo SA de CV', meta: 'EMP123456789' },
          { value: '2', label: 'Tech Solutions SA', meta: 'TEC987654321' },
          { value: '3', label: 'Comercializadora del Norte', meta: 'CNM555666777' },
        ],
      },
      {
        key: 'status',
        label: 'Estado',
        type: 'select',
        group: 'Estado',
        placeholder: 'Todos los estados',
        options: [
          { value: 'timbrada', label: 'Timbrada' },
          { value: 'firmada', label: 'Firmada' },
          { value: 'cancelada', label: 'Cancelada' },
        ],
      },
      {
        key: 'period',
        label: 'Periodo',
        type: 'select',
        group: 'Periodo',
        placeholder: 'Todos los periodos',
        options: [
          { value: '2024-01', label: 'Enero 2024' },
          { value: '2024-02', label: 'Febrero 2024' },
          { value: '2024-03', label: 'Marzo 2024' },
        ],
      },
      { key: 'stampedAt', label: 'Fecha de emisión', type: 'dateRange', group: 'Fechas', placeholder: 'Rango de fechas', field: 'stampedAt' },
    ],
    visibleFilterKeys: ['companyId', 'status'],
    modelValue: {},
  },
}

export const Full = {}
export const WithAdvancedFilters = {
  args: {
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
      {
        key: 'firma',
        label: 'Estatus de firma',
        type: 'select',
        placeholder: 'Todos',
        options: [
          { value: 'firmada', label: 'Firmada' },
          { value: 'timbrada', label: 'Sin firmar' },
        ],
      },
    ],
    visibleFilterKeys: ['companyId', 'status'],
  },
}
export const WithActiveChip = {
  args: {
    modelValue: { status: 'timbrada', period: { min: '2024-01-01', max: '2024-03-31' } },
  },
}
