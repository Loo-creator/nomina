import '../src/style.css'
import { setup } from '@storybook/vue3'
import { createRouter, createMemoryHistory } from 'vue-router'
import { i18n } from '../src/shared/i18n'

setup((app) => {
  app.use(i18n)
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', name: 'story-home', component: { template: '<div />' } },
      { path: '/:pathMatch(.*)*', component: { template: '<div />' } },
    ],
  })
  router.push('/')
  app.use(router)
})

if (typeof document !== 'undefined') {
  document.documentElement.setAttribute('data-theme', 'nomikok')
}

/** @type { import('@storybook/vue3-vite').Preview } */
const preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    a11y: {
      test: 'todo',
    },
    backgrounds: {
      default: 'base',
      values: [
        { name: 'base', value: '#F7FBFB' },
        { name: 'card', value: '#FFFFFF' },
        { name: 'oscuro', value: '#171A21' },
      ],
    },
  },
}

export default preview
