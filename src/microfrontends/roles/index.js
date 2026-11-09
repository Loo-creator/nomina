
export const routes = [
  {
    path: '/roles',
    component: () => import('@/layouts/AppLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        name: 'roles-acceso',
        component: () => import('./views/RolesAccesoView.vue'),
      },
    ],
  },
]
