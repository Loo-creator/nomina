
export const routes = [
  {
    path: '/empleados',
    component: () => import('@/layouts/AppLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        name: 'empleados',
        component: () => import('./views/EmpleadosView.vue'),
      },
    ],
  },
]
