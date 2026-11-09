# NOMIKOK — Portal de gestión y emisión de nómina

Frontend en **Vue 3 + Vite + Tailwind CSS + Pinia + Vue Router**, organizado por
microfrontends y con una **API simulada (mocks + capa de servicios)** para funcionar sin backend.

Incluye el **núcleo multi-tenant NomiQ 2.0** (`/clientes`): cuentas de Cliente con
múltiples RFC emisores, suspensión/reactivación y gestión de empresas por cuenta, y
**Roles y accesos** (`/roles`): catálogo de roles por cuenta y asignación de usuarios
por empresa con permisos heredados (Super Admin, Administrador y Cliente), y la
**carga masiva** (`/comprobantes/carga-masiva`): única sección de cargas — drag & drop multi-RFC o carga simple, con análisis previo, progreso en vivo, reintento/reporte de errores y **un solo historial** (`?tab=historial`) que mezcla lotes y cargas simples
(Administrador y Cliente); **notificaciones** (`/comprobantes/notificaciones`):
histórico de correos enviados con reenvío; **empleados** con correo corporativo
automático (`RFC@dominio`) personalizable; y **paquete ZIP de auditoría** desde
nóminas timbradas (XML + PDF + resumen, selección múltiple).

Además, roles **Super Admin / Administrador / Supervisor / Staff / Cliente / Empleado** con matriz RBAC unificada y **selector rápido de rol** en el login demo.
Además, el **roadmap UX de la auditoría** (`AUDITORIA_UX_NOMIKOK.md`) está implementado:
Fase 1 (aislamiento de datos del empleado, re-autenticación en firma con acuse PDF,
ErrorState con reintento, contraste ≥4.5:1, foco/teclado/ARIA + pruebas axe-core,
cero gray-* hardcodeados, login con rate limit + recuperación real), Fase 2 (invitaciones por email con token/MFA, validación
de par CSD, tema por usuario con herencia de organización, guardado por pestaña +
auditoría de cambios, badges de contraste en el diseñador, breadcrumbs y selector
de compañía persistente) y Fase 3 (instrumentación mock + pestaña **Métricas** con
funnel operativo, historial de versiones de diseño y auditoría de cambios, **i18n
ES/EN** con cambio en vivo desde Configuración, **Storybook** con stories de los
componentes base y chequeos a11y automáticos, **CI** en GitHub Actions con tests,
cobertura, build, presupuesto de bundle y build de Storybook).
Pendiente solo lo que requiere humanos o cuentas externas (pruebas SUS con usuarios,
PostHog real); documentado en `MANUAL.md` §13.

## Inicio rápido

```bash
npm install
npm run dev
```

Abre `http://localhost:5173` e inicia sesión con las credenciales demo
(`admin@nomikok.com` / `123456`).

## Documentación

Consulta **[MANUAL.md](./MANUAL.md)** para la guía paso a paso: requisitos,
ejecución, credenciales, qué secciones incluye y **dónde editar** cada parte
(colores, rutas, menú, datos y cómo conectar un backend real).

## Scripts

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Compilar para producción (`dist/`) |
| `npm run preview` | Previsualizar la compilación |
| `npm test` | Pruebas unitarias (Vitest + Testing Library + axe-core) |
| `npm run test:coverage` | Pruebas con cobertura (umbrales en `vitest.config.js`) |
| `npm run test:storybook` | Pruebas de stories en Chromium (a11y incluido) |
| `npm run storybook` | Storybook en `localhost:6006` |
| `npm run build-storybook` | Compilar Storybook estático |
| `npm run export:tokens` | Exportar design tokens (Figma Tokens Studio) |
| `npm run budget` | Verificar presupuestos de bundle |
| `npm run export:tokens` | Exportar design-tokens.json (Figma Tokens Studio) |
| `npm run dev` | Pantalla de acceso: *selector de rol* (pills) para probar la matriz de permisos en tiempo real |
