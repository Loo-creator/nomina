import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/shared/stores/auth'
import { ROLES } from '@/shared/utils/constants'

// Importar rutas de microfrontends
import { routes as authRoutes } from '@/microfrontends/auth'
import { routes as dashboardRoutes } from '@/microfrontends/dashboard'
import { routes as comprobantesRoutes } from '@/microfrontends/comprobantes'
import { routes as companiasRoutes } from '@/microfrontends/companias'
import { routes as clientesRoutes } from '@/microfrontends/clientes'
import { routes as rolesRoutes } from '@/microfrontends/roles'
import { routes as empleadosRoutes } from '@/microfrontends/empleados'
import { routes as usuariosRoutes } from '@/microfrontends/usuarios'
import { routes as fiscalRoutes } from '@/microfrontends/fiscal'
import { routes as configuracionRoutes } from '@/microfrontends/configuracion'

const routes = [
  ...authRoutes,
  {
    path: '/',
    redirect: '/dashboard',
  },
  ...dashboardRoutes,
  ...clientesRoutes,
  ...rolesRoutes,
  ...comprobantesRoutes,
  ...companiasRoutes,
  ...empleadosRoutes,
  ...usuariosRoutes,
  ...fiscalRoutes,
  ...configuracionRoutes,
  {
    path: '/acceso-denegado',
    name: 'forbidden',
    component: () => import('@/views/AccessDeniedView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: () => import('@/views/NotFoundView.vue'),
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    }
    return { top: 0 }
  },
})

router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()

  if (to.meta.public) {
    if (authStore.isAuthenticated && to.name === 'login') {
      return next({ name: 'dashboard-home' })
    }
    return next()
  }

  if (to.meta.requiresAuth) {
    if (!authStore.isAuthenticated) {
      return next({ name: 'login', query: { redirect: to.fullPath } })
    }

    const userRole = authStore.userRole

    if (to.meta.adminOnly && ![ROLES.SUPERADMIN, ROLES.ADMIN].includes(userRole)) {
      return next({ name: 'forbidden' })
    }

    const blockedRoutesByRole = {
      [ROLES.SUPERADMIN]: ['carga-masiva', 'notificaciones', 'datos-fiscales'],
      [ROLES.SUPERVISOR]: ['clientes', 'cliente-detalle', 'roles-acceso', 'companias', 'consulta-curp', 'disenador-de-facturas', 'datos-fiscales', 'firmar-nomina'],
      [ROLES.STAFF]: ['carga-masiva', 'consulta-curp', 'disenador-de-facturas', 'clientes', 'cliente-detalle', 'roles-acceso', 'notificaciones', 'datos-fiscales', 'firmar-nomina', 'cancelar-nomina'],
      [ROLES.CLIENTE]: ['consulta-curp', 'disenador-de-facturas', 'clientes', 'cliente-detalle', 'firmar-nomina', 'cancelar-nomina'],
    }
    if ((blockedRoutesByRole[userRole] || []).includes(to.name)) {
      return next({ name: 'forbidden' })
    }

    if (userRole === ROLES.EMPLEADO) {
      const allowedRoutes = ['dashboard-home', 'forbidden', 'mis-nominas', 'mi-perfil', 'firmar-nomina', 'cancelar-nomina']
      if (!allowedRoutes.includes(to.name)) {
        return next({ name: 'forbidden' })
      }
    }

    return next()
  }

  next()
})

export default router