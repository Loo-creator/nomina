import { Download } from 'lucide-vue-next'
import Button from '../Button.vue'

export default {
  title: 'UI/Button',
  component: Button,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'ghost', 'danger', 'outline'],
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
    },
    loading: { control: 'boolean' },
    disabled: { control: 'boolean' },
    fullWidth: { control: 'boolean' },
    default: { control: 'text' },
  },
  args: {
    default: 'Guardar cambios',
    variant: 'primary',
    size: 'md',
    loading: false,
    disabled: false,
    fullWidth: false,
  },
}

export const Primary = {}
export const Secondary = { args: { variant: 'secondary' } }
export const Ghost = { args: { variant: 'ghost' } }
export const Danger = { args: { variant: 'danger', default: 'Eliminar' } }
export const Outline = { args: { variant: 'outline' } }
export const Loading = { args: { loading: true, default: 'Guardando…' } }
export const Disabled = { args: { disabled: true } }
export const Small = { args: { size: 'sm' } }
export const Large = { args: { size: 'lg' } }
export const WithIcon = {
  args: { default: 'Descargar paquete', icon: Download },
}
