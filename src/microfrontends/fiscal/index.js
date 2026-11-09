
export const routes = [
  {
    path: '/fiscal',
    component: () => import('@/layouts/AppLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: 'consulta-curp',
        name: 'consulta-curp',
        component: () => import('./views/ConsultaCurpView.vue'),
      },
      {
        path: 'disenador-facturas',
        name: 'disenador-de-facturas',
        component: () => import('./views/DisenadorFacturasView.vue'),
      },
    ],
  },
  {
    path: '/mi',
    component: () => import('@/layouts/AppLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: 'perfil',
        name: 'mi-perfil',
        component: () => import('./views/MiPerfilView.vue'),
      },
    ],
  },
  {
    path: '/organizacion',
    component: () => import('@/layouts/AppLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: 'datos-fiscales',
        name: 'datos-fiscales',
        component: () => import('./views/DatosFiscalesView.vue'),
      },
    ],
  },
]