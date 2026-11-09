import LoginView from './views/LoginView.vue'
import InvitationAcceptView from './views/InvitationAcceptView.vue'
import ForgotPasswordView from './views/ForgotPasswordView.vue'
import ResetPasswordView from './views/ResetPasswordView.vue'

export const routes = [
  {
    path: '/login',
    name: 'login',
    component: LoginView,
    meta: { public: true, layout: 'auth' },
  },
  {
    path: '/recuperar',
    name: 'recuperar-password',
    component: ForgotPasswordView,
    meta: { public: true, layout: 'auth' },
  },
  {
    path: '/restablecer/:token',
    name: 'restablecer-password',
    component: ResetPasswordView,
    meta: { public: true, layout: 'auth' },
  },
  {
    path: '/invitacion/:token',
    name: 'invitacion-aceptar',
    component: InvitationAcceptView,
    meta: { public: true, layout: 'auth' },
  },
]
