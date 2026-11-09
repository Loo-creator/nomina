export const routes = [
  {
    path: '/comprobantes',
    component: () => import('@/layouts/AppLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: 'notificaciones',
        name: 'notificaciones',
        component: () => import('./views/NotificacionesView.vue'),
      },
      {
        path: 'carga-masiva',
        name: 'carga-masiva',
        component: () => import('./views/CargaMasivaView.vue'),
      },
      {
        path: 'cargar-insumos',
        redirect: '/comprobantes/carga-masiva',
      },
      {
        path: 'cargas',
        redirect: { path: '/comprobantes/carga-masiva', query: { tab: 'historial' } },
      },
      {
        path: 'nominas-timbradas',
        name: 'nominas-timbradas',
        component: () => import('./views/NominasTimbradasView.vue'),
      },
      {
        path: 'cancelar/:id',
        name: 'cancelar-nomina',
        component: () => import('./views/CancelarNominaWizard.vue'),
        props: true,
      },
      {
        path: 'firmar/:id',
        name: 'firmar-nomina',
        component: () => import('./views/FirmarNominaWizard.vue'),
        props: true,
      },
    ],
  },
  {
    path: '/mis-nominas',
    component: () => import('@/layouts/AppLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        name: 'mis-nominas',
        component: () => import('./views/MisNominasView.vue'),
      },
    ],
  },
]
