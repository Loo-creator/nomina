import ErrorState from '../ErrorState.vue'

export default {
  title: 'UI/ErrorState',
  component: ErrorState,
  tags: ['autodocs'],
  argTypes: {
    title: { control: 'text' },
    message: { control: 'text' },
    detail: { control: 'text' },
    retryLabel: { control: 'text' },
  },
  args: {
    title: 'No se pudo cargar el dashboard',
    message: 'Ocurrió un error al obtener los datos. Intenta de nuevo.',
    detail: 'getDashboardStats(user.id, user.companies)',
    retryLabel: 'Reintentar',
  },
}

export const Default = {}
export const WithoutDetails = { args: { detail: '' } }
