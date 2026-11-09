
export const routes = [
  {
    path: '/usuarios',
    component: () => import('@/layouts/AppLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        name: 'usuarios',
        component: () => import('./views/UsuariosView.vue'),
      },
    ],
  },
]
