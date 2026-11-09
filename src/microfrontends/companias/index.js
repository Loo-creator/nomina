
export const routes = [
  {
    path: '/companias',
    component: () => import('@/layouts/AppLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        name: 'companias',
        component: () => import('./views/CompaniasView.vue'),
      },
    ],
  },
]
