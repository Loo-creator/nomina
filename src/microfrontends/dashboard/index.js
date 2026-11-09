
export const routes = [
  {
    path: '/dashboard',
    component: () => import('@/layouts/AppLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        name: 'dashboard-home',
        component: () => import('./views/DashboardView.vue'),
      },
    ],
  },
]
