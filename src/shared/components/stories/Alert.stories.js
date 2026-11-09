import Alert from '../Alert.vue'

export default {
  title: 'UI/Alert',
  component: Alert,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['success', 'warning', 'danger', 'info'],
    },
    title: { control: 'text' },
    default: { control: 'text' },
  },
  args: {
    title: 'Aviso',
    default: 'Mensaje de ejemplo para el aviso.',
    variant: 'info',
  },
}

export const Info = {}
export const Success = { args: { variant: 'success', title: 'Listo', default: 'Nómina firmada correctamente.' } }
export const Warning = { args: { variant: 'warning', title: 'Cuenta suspendida', default: 'El reenvío está deshabilitado.' } }
export const Danger = { args: { variant: 'danger', title: 'Error', default: 'No se pudo conectar con el PAC.' } }
