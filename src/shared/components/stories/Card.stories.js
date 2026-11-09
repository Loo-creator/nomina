import Card from '../Card.vue'

export default {
  title: 'UI/Card',
  component: Card,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'outlined', 'elevated'],
    },
    padding: {
      control: 'select',
      options: ['none', 'sm', 'md', 'lg', 'xl'],
    },
    hover: { control: 'boolean' },
  },
  args: {
    variant: 'default',
    padding: 'lg',
    hover: false,
  },
  render: (args) => ({
    components: { Card },
    setup() {
      return { args }
    },
    template: `
      <Card v-bind="args" class="max-w-md">
        <h3 class="font-display font-bold text-ink">Resumen de nómina</h3>
        <p class="mt-2 text-sm text-ink-muted">4 empleados · Período marzo 2024 · $66,400 neto</p>
      </Card>
    `,
  }),
}

export const Default = {}
export const Outlined = { args: { variant: 'outlined' } }
export const Elevated = { args: { variant: 'elevated' } }
export const Hoverable = { args: { hover: true } }
