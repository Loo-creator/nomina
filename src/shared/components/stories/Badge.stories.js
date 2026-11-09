import Badge from '../Badge.vue'

export default {
  title: 'UI/Badge',
  component: Badge,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'success', 'warning', 'danger', 'info', 'neutral', 'secondary'],
    },
    dot: { control: 'boolean' },
    default: { control: 'text' },
  },
  args: {
    default: 'Timbrada',
    variant: 'primary',
    dot: true,
  },
}

export const Primary = {}
export const Success = { args: { variant: 'success', default: 'Firmada' } }
export const Warning = { args: { variant: 'warning', default: 'Pendiente' } }
export const Danger = { args: { variant: 'danger', default: 'Error' } }
export const Info = { args: { variant: 'info', default: 'En proceso' } }
export const Neutral = { args: { variant: 'neutral', default: 'Sin estado' } }
