
export const routes = [
  {
    path: '/configuracion',
    component: () => import('@/layouts/AppLayout.vue'),
    meta: { requiresAuth: true, adminOnly: true },
    children: [
      {
        path: '',
        name: 'configuracion',
        component: () => import('./views/ConfiguracionView.vue'),
      },
    ],
  },
]
