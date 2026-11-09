
export const routes = [
  {
    path: '/clientes',
    component: () => import('@/layouts/AppLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        name: 'clientes',
        component: () => import('./views/ClientesView.vue'),
      },
      {
        path: ':id',
        name: 'cliente-detalle',
        component: () => import('./views/ClienteDetailView.vue'),
      },
    ],
  },
]
