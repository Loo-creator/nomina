import Select from '../Select.vue'

export default {
  title: 'UI/Select',
  component: Select,
  tags: ['autodocs'],
  argTypes: {
    modelValue: { control: 'text' },
    placeholder: { control: 'text' },
    label: { control: 'text' },
    variant: {
      control: 'select',
      options: ['default', 'bar'],
    },
    searchable: { control: 'boolean' },
    clearable: { control: 'boolean' },
  },
  args: {
    id: 'story-select',
    label: 'Compañía',
    placeholder: 'Todas las compañías',
    options: [
      { value: '1', label: 'Empresa Demo SA de CV', meta: 'EMP123456789' },
      { value: '2', label: 'Tech Solutions SA', meta: 'TEC987654321' },
      { value: '3', label: 'Comercializadora del Norte', meta: 'CNM555666777' },
    ],
  },
}

export const Default = {}
export const Bar = { args: { variant: 'bar' } }
export const Searchable = {
  args: {
    searchable: true,
    options: [
      { value: '1', label: 'Empresa Demo SA de CV', meta: 'EMP123456789' },
      { value: '2', label: 'Tech Solutions SA', meta: 'TEC987654321' },
      { value: '3', label: 'Comercializadora del Norte', meta: 'CNM555666777' },
      { value: '4', label: 'Servicios del Bajío', meta: 'SIB240501AAA' },
      { value: '5', label: 'Grupo Acme', meta: 'GAC240502BBB' },
    ],
  },
}
export const WithValue = { args: { modelValue: '1' } }
export const Clearable = { args: { modelValue: '2', clearable: true } }
