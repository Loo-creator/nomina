# Manual de uso — NOMIKOK (frontend)

Guía paso a paso para ejecutar, entender y editar el portal de nómina **NOMIKOK**.

---

## 1. Requisitos

- **Node.js 18 o superior** (incluye `npm`).
- Un navegador moderno (Chrome, Edge o Firefox).
- Opcional: `git` para control de versiones.

Verifica tu versión de Node:

```bash
node -v
npm -v
```

---

## 2. Instalación (solo la primera vez)

Desde la carpeta del proyecto:

```bash
cd /home/ljimenez/Documentos/proyectos/nomina/nomikok
npm install
```

Esto descarga todas las dependencias (Vue, Vite, Tailwind, Pinia, etc.).

---

## 3. Ejecutar el proyecto

### Modo desarrollo (recomendado)

```bash
npm run dev
```

- Abre en el navegador la URL que muestra la terminal (normalmente **http://localhost:5173**).
- Los cambios que guardes se recargan solos (hot reload).

### Compilar para producción

```bash
npm run build
```

Genera la carpeta `dist/` con los archivos optimizados.

### Previsualizar la versión compilada

```bash
npm run preview
```

---

## 4. Qué esperar al abrir

1. Verás la **pantalla de login** (panel minimalista a la izquierda, imagen/branding a la derecha).
2. Inicia sesión con cualquiera de las **credenciales demo** (botones "Acceso rápido demo"):

| Rol | Email | Contraseña |
|-----|-------|------------|
| Super Admin | `superadmin@nomikok.com` | `123456` |
| Administrador | `admin@nomikok.com` | `123456` |
| Staff | `staff@nomikok.com` | `123456` |
| Cliente | `cliente@nomikok.com` | `123456` |
| Empleado | `empleado@nomikok.com` | `123456` |

3. Al entrar verás el **dashboard** con la barra lateral y el encabezado.

### Mapa de roles y accesos

| Rol | Quién es | Acceso |
|-----|----------|--------|
| **Super Admin** | Los desarrolladores (dueños de la plataforma) | Clientes (multi-tenant), Roles y accesos (solo personas), Compañías (Organización), Empleados, Usuarios, Nóminas timbradas, Consulta CURP, Diseñador facturas, Configuración. **Sin** *Carga masiva*, *Notificaciones* ni *Datos fiscales*. |
| **Administrador** | Quienes contratan el servicio (revendedor) | Todas las secciones, incluida *Carga masiva*, *Consulta CURP*, *Diseñador facturas*, *Configuración* y *Datos fiscales*. |
| **Staff** | Administradores del revendedor (parcial: lectura + empleados/usuarios) | Como el Administrador pero **sin** *Carga masiva*, *Notificaciones*, ni *Datos fiscales*. |
| **Cliente** | Quien compra el servicio a los revendedores | Dashboard, Nómina (**Carga masiva**, Notificaciones, Nóminas timbradas), Personas (Empleados, Usuarios, Roles y accesos), Organización (Clientes, Compañías), Configuración y *Datos fiscales*. **Sin** *Consulta CURP* ni *Diseñador facturas*. |
| **Supervisor** | Supervisor operativo del revendedor | Dashboard, **Carga masiva**, Notificaciones, Nóminas timbradas, Empleados y Usuarios (solo lectura). Solo puede *solicitar* cancelaciones. **Sin** *Roles*, *Clientes*, *Compañías*, *Datos fiscales*, *Consulta CURP*, *Diseñador facturas* ni *Configuración*. |
| **Empleado** | Trabajadores de cada negocio cliente | Solo Dashboard, Mis nóminas, *Firmar* y solicitar cancelación/corrección si aplica. En Nóminas solo ve estados **Firmada** / **Sin firmar**, nunca cancela; sin firmar ofrece *Firmar* y *Previsualizar*, y ya firmada ofrece *Descargar PDF*, *Descargar XML* y *Enviar por correo* (varios destinatarios). *Mi perfil* solo permite nombre, código postal, correo de notificaciones y cambio de contraseña (sin CSD, PAC ni cambio de compañía). |

> *Datos fiscales* no está en el menú lateral: se abre desde el **menú de usuario del header** (antes de "Cerrar sesión") y **no** está disponible para Super Admin. Las restricciones se aplican tanto en el menú como en el guard del router (`blockedRoutesByRole` en `src/shared/router/index.js`).

> Todas las secciones incluyen **filtros** por estado, tipo, compañía, fechas y búsqueda por texto (RFC, nombre, clave, etc.). Los temas de color (`nomikok`, `oceano`, `uva`, `oscuro`) cambian página, tarjetas y acentos de forma notoria.

> El **menú lateral agrupa por tarea** en **todos los perfiles**: **Nómina** (Carga masiva, Notificaciones, Nóminas timbradas), **Personas** (Empleados, Usuarios, Roles y accesos), **Organización** (Clientes, Compañías, Configuración) y **Herramientas** (Consulta CURP, Diseñador facturas). Cada rol solo ve los grupos/ítems que le corresponden.

---

## 5. Secciones incluidas

| Sección | Ruta | Funcionalidad |
|---------|------|---------------|
| Dashboard | `/dashboard` | Métricas y resumen |
| Clientes | `/clientes` | Cuentas de cliente (tenants): alta / edición / suspensión, KPIs y detalle con RFC emisores |
| Roles y accesos | `/roles` | Catálogo de roles por cuenta y asignación de usuarios por empresa (RFC emisor), con permisos heredados |
| Carga masiva | `/comprobantes/carga-masiva` | Única sección de cargas: **Nuevo lote** (multi-RFC o simple) e **Historial** (todos los lotes y cargas en una tabla) |
| Compañías | `/companias` | Alta / edición / baja con modal |
| Empleados | `/empleados` | Padrón de empleados (CRUD) |
| Usuarios | `/usuarios` | Accesos, roles y compañías asignadas |
| Nóminas timbradas | `/comprobantes/nominas-timbradas` | Firmar, descargar, paquete ZIP de auditoría, cancelar |
| Cancelación | `/comprobantes/cancelacion` | Solicitar cancelación de nóminas timbradas ante el SAT |
| Consulta CURP | `/fiscal/consulta-curp` | Validación y consulta |
| Diseñador de facturas | `/fiscal/disenador-facturas` | Colores, logo, tipografía + vista previa |
| Configuración | `/configuracion` | Datos de empresa, notificaciones y preferencias (tema) — solo admin/superadmin |

> **Datos fiscales** (`/fiscal/datos-fiscales`) ya no está en el menú lateral: se accede desde el **menú de usuario en el header** (antes de "Cerrar sesión").

Todas las tablas incluyen **búsqueda, orden, filtros y paginación**. Los formularios abren en un **modal**.

---

## 6. Cómo funcionan los datos (Mock API)

El proyecto **no necesita backend**. Los datos viven en memoria en `src/mocks/_db.js` y las "llamadas a API" son funciones en `src/mocks/*.mock.js` que simulan latencia y regresan:

```js
{ ok: true, data, meta, message }   // éxito
{ ok: false, error, message }       // error
```

> Importante: al recargar la página, los datos vuelven al estado inicial (son en memoria).

---

## 7. Dónde editar cada cosa

### Estructura general

```
nomikok/
├─ src/
│  ├─ assets/imagenes/         ← Imagen del login (ver abajo)
│  ├─ layouts/AppLayout.vue    ← Sidebar + Header + contenedor
│  ├─ microfrontends/          ← Una carpeta por sección
│  │  ├─ auth/                 ← Login
│  │  ├─ dashboard/
│  │  ├─ clientes/             ← NomiQ 2.0: cuentas multi-tenant + RFC emisores
│  │  ├─ roles/                ← NomiQ 2.0: catálogo de roles + asignación por empresa
│  │  ├─ companias/
│  │  ├─ empleados/
│  │  ├─ usuarios/
│  │  ├─ comprobantes/         ← Vistas de nóminas y cargas
│  │  └─ fiscal/               ← Vistas fiscales
│  ├─ mocks/                   ← Datos simulados .mock.js + _db.js (memoria) (auth con rate limit + reset)
│  ├─ i18n/                    ← vue-i18n (es/en, cambio en vivo en Configuración)
│  ├─ services/                ← Facade de servicios (http simulado) sobre mocks; las vistas SOLO importan éstos
│  ├─ shared/
│  │  ├─ components/           ← UI kit (Button, Table, Modal, ErrorState…)
│  │  │  └─ stories/           ← Stories de Storybook
│  │  ├─ router/index.js       ← Rutas y guardias por rol
│  │  ├─ stores/               ← Pinia (auth, toast, theme, tenants, tenantAccess)
│  │  └─ utils/constants.js    ← Roles, estados, menú por rol
│  ├─ style.css                ← Sistema de diseño (Tailwind)
│  └─ main.js
├─ tests/                      ← Vitest (unitarias + axe-core)
├─ scripts/check-bundle-budget.mjs  ← Presupuesto de bundle
├─ scripts/export-design-tokens.mjs ← Export de tokens (Figma Tokens Studio)
├─ design-tokens.json           ← Tokens exportados (generado)
├─ .github/workflows/ci.yml    ← CI: tests + cobertura + build + budget + storybook
├─ .storybook/                 ← Config de Storybook
├─ tailwind.config.js          ← Colores, sombras, animaciones
└─ vite.config.js              ← Alias de imports
```

### Cambiar la imagen del login

Coloca **cualquier imagen** en `src/assets/imagenes/`. El login toma automáticamente la primera que encuentre.

```
src/assets/imagenes/mi-imagen.jpg
```

Si no hay imagen, se muestra un panel de marca por defecto.

### Cambiar colores y estilos

- **Paleta y tokens:** `tailwind.config.js` (colores `primary`, `neutral`, etc.) y las variables en `src/style.css` (`:root`).
- **Botones, inputs, tarjetas, tablas, modales:** clases definidas en `src/style.css` (sección `@layer components`).

### Temas de color

- Hay 4 temas: **NOMIKOK**, **Océano**, **Uva** y **Oscuro**. Se cambian desde el selector del header.
- **Solo admin y super admin** ven el selector (`canManageTheme` en `src/layouts/AppLayout.vue`); el tema elegido se guarda en `localStorage` (`nomikok_theme`) y **aplica a todos los roles**.
- **Definir temas:** `src/style.css` (bloques `[data-theme="..."]`) y la lista de temas en `src/shared/stores/theme.js`.
- **Lógica:** `src/shared/stores/theme.js` (aplica `data-theme` en `<html>`). Se inicializa en `src/main.js`.
- **Login:** `src/microfrontends/auth/views/LoginView.vue` también usa los tokens del tema (fondo, tarjeta, botón y acentos cambian con `data-theme`). La imagen lateral se toma de `src/assets/imagenes/`; si no hay imagen o no carga, se muestra un panel con el degradado del tema. **Agregar imágenes requiere reiniciar `npm run dev`** (Vite resuelve `import.meta.glob` al arrancar).

### Agregar o quitar secciones del menú

- **Menú por rol:** `src/shared/utils/constants.js` → `SECTIONS_BY_ROLE`.
- **Rutas:** `src/microfrontends/<seccion>/index.js` y se registran en `src/shared/router/index.js`.

### Editar datos de prueba

- **Datos (compañías, empleados, usuarios, nóminas…, tenants, roles):** `src/mocks/_db.js`.
- **Mocks (simulados):** `src/mocks/*.mock.js` (`companies`, `clients`, `employees`, `roles`, `users`, `batches`, `payrolls`, `fiscal`, `invitations`, `notifications`, `settings`, `telemetry`, `dashboard`, `auth`). Las vistas/stores consumen `src/services/*.service.js`, que pausan con latencia simulada y reexportan el mismo contrato `{ ok, data, meta, message }` (aisla el código de cambios internos del mock).

### Conectar a un backend real

Reemplaza el cuerpo de las funciones en `src/mocks/*.mock.js` (o, mejor, en `src/services/*.service.js`) por llamadas `fetch`/`axios` reales. Las vistas ya consumen `res.ok` y `res.data`, así que el contrato de respuesta debe mantenerse.

---

## 8. NomiQ 2.0 — Núcleo multi-tenant (Clientes)

Primera entrega del alcance **NomiQ 2.0**: cuentas de **Cliente (Tenant)** con múltiples **RFC emisores**. Es la base sobre la que se montarán la carga masiva por lote, los roles centralizados y el ciclo de timbrado.

**Modelo de datos (mock)**

- `tenants` en `src/mocks/_db.js`: cuenta del cliente (`accountCode` autogenerado `CTA-0001…`, nombre comercial, razón social, plan `basic|pro|enterprise`, contacto, dominio corporativo, cuota mensual, estado `active|suspended`, notas internas).
- `companies.tenantId`: cada empresa/RFC emisor pertenece a una cuenta (o queda sin asignar). Un tenant puede tener N RFC; un RFC solo una cuenta. Empleados y nóminas cuelgan de la empresa, por lo que las métricas del tenant se agregan por sus RFC.

**Rutas y acceso (RBAC)**

| Ruta | Nombre | Acceso |
|------|--------|--------|
| `/clientes` | `clientes` | Super Admin y Administrador |
| `/clientes/:id` | `cliente-detalle` | Super Admin y Administrador |

Staff, Cliente y Empleado no ven el módulo en el menú (`SECTIONS_BY_ROLE`) ni pueden entrar por URL (guard `blockedRoutesByRole` en `src/shared/router/index.js`; Empleado queda fuera por `allowedRoutes`).

**Funcionalidad**

- Listado con KPIs (clientes activos, RFC emisores, empleados totales, suspendidos), búsqueda y filtros por plan/estado.
- Alta / edición de cuenta (modal con validación estricta: nombre, razón social, plan, contacto, correo, teléfono, dominio, cuota y notas).
- Suspensión / reactivación con confirmación (bloquea timbrado y accesos; reversible).
- Detalle (`/clientes/:id`): ficha completa, notas internas, y gestión de **RFC emisores**: crear RFC nuevo (hereda el tenant), asignar empresa existente sin cuenta, o quitar un RFC de la cuenta.

**Seguridad aplicada**

- Sanitización de todas las entradas antes de validar/enviar (`src/shared/utils/sanitize.js`): elimina caracteres de control y `<>`, colapsa espacios, limita longitudes; correo a minúsculas; teléfono/dominio con lista blanca de caracteres.
- Validación estricta en cliente (RFC `^[A-ZÑ&]{3,4}\d{6}[A-Z0-9]{3}$`, correo, teléfono, dominio, montos) antes de llamar al mock.
- Duplicados rechazados en la capa mock (nombre de cliente / correo de contacto / RFC de empresa).
- Sin `v-html`: todo el contenido se renderiza con interpolación (escapado por Vue). Acciones sensibles (suspender, quitar RFC) piden confirmación explícita.
- La API mock rechaza IDs no numéricos/inexistentes y estados inválidos.

**Contrato para backend real (Django)**

Reemplaza `src/mocks/clients.mock.js` (vía `src/services/clients.service.js`) por llamadas HTTP reales manteniendo el contrato `{ ok, data, meta, message }`. Los stores Pinia (`src/shared/stores/tenants.js`) y las vistas no cambian.

---

## 9. Roles y accesos a nivel cuenta (tenant)

Segunda entrega de **NomiQ 2.0**: el catálogo de roles vive **a nivel cuenta de cliente** y cada usuario hereda los permisos del rol que se le asigna **por empresa (RFC emisor)**. Un mismo usuario puede ser *Gerente* en una empresa y *Auditor* en otra.

**Modelo de datos (mock)**

- `tenantRoles` en `src/mocks/_db.js`: roles de la cuenta (`tenantId`, nombre único por cuenta, descripción, `permissions[]`, `isSystem` para los roles base *Gerente/Supervisor/Operador*, fecha de alta).
- `tenantRoleAssignments`: asignaciones `(tenantId, companyId, userId, roleId)`; un único rol por usuario y empresa; al reasignar se reemplaza.
- Permisos del catálogo en `src/shared/utils/constants.js` (`TENANT_PERMISSIONS`): 12 permisos agrupados por **Nómina, Cargas, Empleados, Reportes y Accesos** (`payroll:read/stamp/sign/cancel/download`, `loads:create/read`, `employees:read/write`, `reports:read`, `users:assign`, `roles:manage`).
- Usuarios cliente llevan `tenantId` (`cliente@nomikok.com`, `laura.gomez@grupoacme.com`, `diego.ramirez@grupoacme.com` → cuenta 1; `sofia.garza@comercializadoranorte.com` → cuenta 2).

**Rutas y acceso (RBAC)**

| Ruta | Nombre | Acceso |
|------|--------|--------|
| `/roles` | `roles-acceso` | Super Admin, Administrador y Cliente (solo su cuenta) |

Staff no tiene acceso (menú y guard); Empleado queda fuera por `allowedRoutes`. Los Super Admin/Administrador eligen la cuenta en el selector superior (o llegan desde **Ver cuenta** en `/clientes/:id`); el rol Cliente queda fijo a su propia cuenta.

**Funcionalidad**

- **Catálogo de roles:** listado con permisos y usuarios asignados; alta/edición (nombre, descripción, permisos con selección por grupo); eliminación bloqueada para roles base y para roles con asignaciones.
- **Asignaciones por empresa:** selección de RFC emisor y, por cada usuario de la cuenta, un selector de rol (*Sin acceso* para revocar). Los permisos efectivos se muestran bajo cada usuario. Un usuario **no puede cambiar su propio acceso** (debe pedirlo otro administrador de la cuenta).
- Cuenta suspendida: vista de solo lectura; altas y cambios deshabilitados.

**Seguridad aplicada**

- Validación en mock API de coherencia `tenant ↔ empresa ↔ usuario ↔ rol`: cualquier combinación cruzada se rechaza (`CROSS_TENANT`), al igual que permisos fuera del catálogo y roles duplicados por cuenta.
- Sanitización de nombre/descripción (`tenantAccess.js` + `sanitize.js`), IDs numéricos validados, roles base protegidos contra renombrado/borrado.
- Sin `v-html`; las acciones de asignación aplican con confirmación implícita por empresa y registro en toast.
- RBAC en menú (`SECTIONS_BY_ROLE`), guard de ruta (`blockedRoutesByRole` / `allowedRoutes`) y en la UI (selector solo para plataforma; cuenta suspendida en solo lectura; fila propia deshabilitada).

**Contrato para backend real (Django)**

Reemplaza `src/mocks/roles.mock.js` (vía `src/services/roles.service.js`) manteniendo `{ ok, data, message }` y la regla de coherencia cross-tenant. El store `src/shared/stores/tenantAccess.js` y las vistas no cambian.

---

## 10. Carga masiva multi-RFC (lotes)

Tercera entrega de **NomiQ 2.0**: un mismo archivo puede incluir comprobantes de **N RFC emisores** de la cuenta y se procesa como **un solo lote** con progreso en vivo y estatus por registro.

**Flujo (`/comprobantes/carga-masiva`)**

1. **Nuevo lote → carga:** arrastra y suelta (o selecciona) `.xlsx`, `.csv` o `.txt` (máx. 10 MB). Valida extensión, tamaño y vacío en cliente; el mock revalida. Plantilla CSV descargable incluida.
2. **Análisis:** el mock detecta RFC emisores en el archivo (en demo, determinista a partir del nombre/tamaño): lista RFC reconocidos de la cuenta (p. ej. EMP123456789, TEC987654321) y marca como *no registrados* los RFC ajenos (ZZZ990000XX9) con su conteo de registros. Si la cuenta no tiene RFC activos, el lote queda bloqueado.
3. **Opciones:** *Omitir registros con error y continuar* (por defecto) u *Detener el lote al primer error*.
4. **Procesamiento:** barra de progreso global + avance por RFC + contadores (timbrados / errores / pendientes), con sondeo automático (~0.5 s). Al terminar:
   - **Completada** o **Completada con errores**: tabla filtrable (todos / timbrados / error / pendientes) con búsqueda, **reintento de errores de captura** (CLABE, CURP, salario cero; el *RFC no registrado* no es reintentable y exige alta previa) y **descarga de reporte de errores en CSV** (UTF-8 con BOM, abre en Excel).
   - **Fallida:** motivo explícito (p. ej. columnas ausentes o detención al primer error).
5. **Historial de cargas (única vista de historial):** una sola tabla con **todos** los archivos de la cuenta —lotes multi-RFC (`payrollBatches`) y cargas simples (`payrollLoads`)— con badge de tipo, origen (RFC emisores / compañía), registros, éxitos, errores, estado y antigüedad. Drill-in al detalle del lote (misma acción que al terminar el procesamiento); reintento/descarga simulada para cargas simples. La pestaña acepta `?tab=historial` para enlazar directamente.

**Duplicados eliminados (consolidación de IA)**

- `/comprobantes/cargar-insumos` y `/comprobantes/cargas` fueron eliminados como vistas; ahora **redirigen** a `/comprobantes/carga-masiva`(`?tab=historial`).
- Una única sección: **Nómina → Carga masiva** (reemplaza a "Cargar insumos" y a "Lista de cargas"; las rutas viejas redirigen). Los demás enlaces/ítems obsoletos quedaron fuera del menú y de los guards.
- Dashboard: la acción rápida "Cargar insumos" fue reemplazada por **Carga masiva** (`/comprobantes/carga-masiva`).
- No hay segunda pantalla de subida ni segunda tabla de historial: una superficie de carga, una de historial.

**Modelo de datos (mock)**

- `db.payrollBatches` (sembrado en el primer uso por `src/mocks/batches.mock.js`): lote (`tenantId`, `fileName`, `fileExt`, `status`, totales, `options.skipErrors`, `createdBy`, fechas) + `rfcs[]` (resumen por RFC) + `records[]` (empleado, CURP, período, neto, `plannedStatus`/`status`, `errorCode`, `retryable`, `uuid`).
- El avance se deriva del tiempo transcurrido desde `startedAt` (≈45 ms por registro), por lo que el progreso es consistente entre sondeos sin `setTimeout` ocultos. El resultado de cada registro es determinista (PRNG con semilla del archivo).
- Semillas demo (tenant 1: un lote completado con errores y uno sin errores; tenant 2: un lote fallido por columnas ausentes).

**Filtros por módulo (spec de configuración de filtros)**

| Módulo | Filtros |
|---|---|
| Compañías | Búsqueda (RFC/nombre/correo), Estatus (Activo/Suspendido/Archivado), Alta (rango de fechas) |
| Usuarios | Búsqueda (nombre/correo), Rol (Administradores/Staff/Cliente/...), Estatus (Activos/Suspendidos por tenant) |
| Empleados | Búsqueda (n.º/ RFC/CURP/NSS/nombre/correo), Compañía, Departamento, Estatus (Activo/Suspendido/Archivado), Acceso (Con/Sin acceso), Alta (rango de fechas) |
| Cargas / Historial | Búsqueda (ID/archivo), Tipo (Lote multi-RFC/Carga simple), Estatus (Pendiente/En proceso/Terminado/Error), fechas |
| Paquetes ZIP | Búsqueda (ID/nombre), Estatus (En proceso/Terminado/Error), fechas de captura |
| Notificaciones (historial) | Búsqueda (destinatario/asunto), Empresa, RFC emisor (solo SuperAdmin/Admin/Staff), Tipo, Estatus de correo, fechas |
| Nóminas timbradas | Búsqueda (período/RFC/UUID), Compañía, Estatus unificado (Timbrados/Firmadas/Sin firmar/Canceladas/En proceso/Error), Emisión y Pago (rangos), Año/Mes |
| Mis nóminas (perfil usuario) | Búsqueda, Período, Estatus de firma, Compañía, Año, Mes |

**RBAC**

| Acceso | Roles |
|--------|-------|
| `/comprobantes/carga-masiva` | Administrador (elige la cuenta en el selector) y Cliente (fija a su cuenta) |
| Sin acceso | Super Admin, Staff (menú y `blockedRoutesByRole`), Empleado (`allowedRoutes`) |

Cuenta suspendida → vista en solo lectura; carga y reintentos deshabilitados.

**Seguridad aplicada**

- Validación doble (cliente + mock) de extensión, tamaño y archivo vacío; la cuenta suspendida se rechaza (`TENANT_SUSPENDED`); RFC fuera de la cuenta → registros con error `RFC_NOT_FOUND` (nunca se timbran contra un RFC ajeno).
- Rechazo de coherencia `tenant ↔ empresa ↔ RFC` en asignaciones y análisis; IDs numéricos validados; reintento solo sobre errores `retryable`.
- CSV de auditoría con escape de comillas y BOM UTF-8; sin `v-html`; progreso y contadores con roles ARIA (`progressbar`, `tablist`/`tabpanel`, `aria-live`).

**Contrato para backend real (Django)**

Endpoints esperados: `POST /batches:analyze` (multipart), `POST /batches` (crea y encola), `GET /batches/:id` (sondeo de progreso), `POST /batches/:id:retry-errors`, `GET /batches?tenant=`. Mantener `{ ok, data, message }` y las mismas reglas de estado; las vistas no cambian.

---

## 11. Empleados: correo corporativo automático

Cuarta entrega de **NomiQ 2.0** (alcance empleados): el correo del empleado se **genera por defecto** con la regla **`RFC@dominio_de_la_compañía`** (p. ej. `PEPJ900101XXX@empresademo.com`) y se puede **personalizar** por persona.

- **Regla:** RFC en minúsculas, sin acentos ni `&` (se normaliza), + `@` + dominio de la compañía (`companies.domain`, p. ej. `techsolutions.com`). Si la compañía no tiene dominio, el alta fuerza correo manual con aviso visible.
- **Comportamiento en el alta/edición (wizard):** casilla *Correo corporativo automático* (activada por defecto) → el campo queda deshabilitado y muestra el correo generado en vivo (RFC + compañía). Desmarcarla permite capturar un correo libre (validado). El badge **Automático/Personalizado** siempre visible.
- **Persistencia:** `email` + `emailCustomized` (boolean) en el empleado (`src/mocks/_db.js`). Los empleados semilla están marcados como personalizados.
- **Tabla de empleados:** columna Correo con badge **Auto (RFC@dominio)** o **Personalizado**; búsqueda incluye el correo.
- **Compañías:** nuevo campo *Dominio corporativo* en alta/edición (Compañías y *Crear RFC* desde la ficha de cliente).

**Util:** `src/shared/utils/email.js` (`corporateEmail`, `isValidDomain`, `normalizeDomain`). **Contrato backend:** el backend puede ignorar `email` si `emailCustomized=false` y recalcularlo con la misma regla, o almacenarlo tal cual.

---

## 12. Ciclo operativo: notificaciones y paquete ZIP de auditoría

Cierre del ciclo operativo (alcance timbrado).

**Notificaciones enviadas (`/comprobantes/notificaciones`)**

- Histórico de correos enviados (mock `src/mocks/notifications.mock.js`): nómina **timbrada**, **XML/PDF entregado**, **acuse de firma** y **alertas/incidencias**; estatus **Entregada / Fallida / Rebotada**, destinatario, asunto, período, UUID relacionado y reintentos.
- Filtros (búsqueda, empresa, tipo, estatus) y KPIs (enviadas, entregadas, fallidas, rebotadas). **Reenviar** con un clic (queda **Entregada**; solo en cuentas activas).
- RBAC igual que Carga masiva: Administrador (elige cuenta) y Cliente (solo la suya). Cuenta suspendida → solo lectura. El icono de campana del header enlaza a esta sección (solo esos roles).

**Paquete ZIP de auditoría (Nóminas timbradas)**

- Selección múltiple con checkboxes (solo Administrador/Cliente; empleados no seleccionan).
- Botón **Descargar paquete (.zip)** → genera `paquete_auditoria_nomikok_<AAAAMMDD>.zip` con: **CFDI_<UUID>.xml** (representación simulada CFDI 4.0 + timbre fiscal), **Recibo_<UUID>.pdf** (representación impresa; jsPDF), **resumen_auditoria.csv** (totales por RFC emisor) y **MANIFIESTO.txt**.
- Registros sin UUID se omiten (se avisa). El heavy-lifter (jszip/jspdf) se carga bajo demanda (chunks asíncronos).
- Uso: entrega a auditoría/SAT por comprobante o por periodo; verifica UUID contra el SAT en entorno real.
- Generador: `src/shared/utils/auditPackage.js` (`buildAuditPackage`, `auditPackageFilename`, `downloadBlob`).

---

## 13. Roadmap UX (auditoría) — estado de implementación

Aplicación del plan de **AUDITORIA_UX_NOMIKOK.md** (Fases 1–3):

**Fase 1 — Cimientos de confianza y accesibilidad**

- **Empleado solo ve lo suyo:** vistas `Mis nóminas` y firma consumen `getEmployeePayrolls/ById` (neto propio, sin agregados de la empresa); el guard de ruta y la vista bloquean el acceso a nóminas ajenas.
- **Firma en 3 pasos endurecida:** re-autenticación real contra el mock (`verifyCredentials`) para **todos** los roles, consentimiento explícito con checkbox, acuse descargable (`buildAcusePdf`) y pantalla de éxito. El empleado ya no se salta la re-autenticación. Se eliminó la vista de firma defectuosa (`FirmarNominaView`, error de runtime) y se unificó en `FirmarNominaWizard`.
- **Usuarios:** los roles asignables ya se filtran por jerarquía (`ROLE_HIERARCHY`) — un Administrador no puede otorgar Super Admin.
- **Contraste:** temas con texto blanco sobre gradiente verificados ≥ 4.5:1 (gradiente oscuro corregido); botones/badges clave ≥ 4.5:1.
- **Dark mode:** eliminados todos los `gray-*` hardcodeados en favor de tokens semánticos (`text-ink`, `bg-card`, `text-ink-muted`…).
- **Accesibilidad verificada:** Modal con focus-trap/`useId`/restore/**Escape funciona** (estaba sin conectar); Select sin botones anidados, `role=option`, `tabindex=-1`, `aria-activedescendant`, IDs únicos por instancia; `aria-label` en controles; `role=alert`/`aria-live` en estados de error y envío de formularios. **Tests de axe-core** en CI local (`npm test`).
- **Errores persistentes:** componente `ErrorState` con reintento y detalles técnicos (`<details>`), `aria-live="assertive"`; integrado en Dashboard, Nóminas timbradas, Carga masiva y Mis nóminas.
- **Cancelación:** una sola entrada (wizard con motivo SAT + UUID + acuse; sin menú duplicado en el sidebar).
- **Pruebas automatizadas:** `npm test` → Vitest + Testing Library + axe-core (Login, Modal, Select, ErrorState, mocks de auth/payroll/tenant RBAC, build del paquete ZIP, i18n con prueba de paridad es/en). 66 pruebas.

**Fase 2 — Usabilidad, formularios y preferencias**

- **Invitación de usuario por email (mock):** alta con token de 1 solo uso, expiración a 7 días, MFA opcional (en demo cualquier código sirve), reenvío/revocación/copia de enlace en Usuarios, flujo público `/invitacion/:token` (validación, estado expirado/revocado/usado, creación real del usuario en el mock). Solo Super Admin/Administrador invitan.
- **CSD:** validación de extensión + **par .cer/.key coincidente** (mismo identificador) con badge de estatus + vigencia con badge de días y avisos (vencido/por vencer); "Probar conexión con PAC" determinista.
- **Wizard de empleado:** máscaras en vivo para CURP/RFC/NSS/CLABE (mayúsculas, solo caracteres/dígitos, longitudes máximas); PII oculta por defecto en la tabla.
- **Tema por usuario con herencia de organización:** `/mi/perfil` permite elegir tema personal (o heredar el de la organización); Configuración define el **tema de la organización** (admin); el header muestra el tema efectivo.
- **Guardado por pestaña + correo de prueba:** cada sección de Configuración guarda por su cuenta; "Enviar correo de prueba" confirma destinatario. **Auditoría de cambios**: pestaña nueva con quién cambió qué y cuándo (mock, sin datos sensibles).
- **Diseñador de facturas:** badge de contraste en vivo (**AAA/AA/AA grande/Falla** con ratio) junto al color picker; vista previa conmutable **Escritorio / Móvil (320 px)**; **historial de versiones** del diseño (guardar crea versión; restaurar en 1 clic).
- **Breadcrumbs + selector de compañía persistente** en el header (visible con varias compañías; persistido por usuario en `localStorage`); las vistas de datos filtran por la selección (`scopedCompanyIds` en el auth store).

**Fase 3 — Escalabilidad, medición y gobernanza**

- **Instrumentación mock:** eventos (`login`, `login_fallido`, `carga_creada`, `carga_reintentada`, `nomina_timbrada`, `nomina_firmada`, `paquete_descargado`, `invitacion_enviada/aceptada`, `notificacion_reenviada`) → `db.metricEvents`.
- **Métricas de uso** (Configuración → Métricas): funnel operativo carga→timbrada→firmada, tasa de completado, errores más frecuentes, logins fallidos, eventos recientes.
- **Auditoría de cambios** en Configuración (ver Fase 2).
- **i18n ES/EN (vue-i18n):** `src/shared/i18n/` con localidades `es`/`en` y cambio **en vivo** desde Configuración → Preferencias → Idioma (se persiste en `localStorage`). Chrome común (tabla, select, modal, header, sidebar, login, 404, cargas) ya pasa por `t()`; las vistas pasan gradualmente — toda cadena nueva debe agregarse a ambos `.json`. La paridad de claves es/en está garantizada por un test.
- **ST-06 — Rate limit y bloqueo de cuenta:** 5 intentos fallidos bloquean el login 15 minutos (mock en `mocks/auth.mock.js`); el mensaje indica el tiempo restante. **Recuperación real de contraseña:** enlace `/recuperar` (solicitud) → `/restablecer/:token` (nuevo password) con token de un solo uso y expiración de 15 minutos; no enumera cuentas existentes. En demo, el enlace se muestra en pantalla (en producción llegaría por correo).
- **Design tokens exportados:** `npm run export:tokens` genera `design-tokens.json` (formato compatible con **Figma Tokens Studio**) desde `src/style.css` (`:root` + `[data-theme="…"]`): colores, gradientes, sombras, tipografías por tema.
- **PostHog listo para enchufarse:** `track()` usa PostHog real automáticamente si defines `VITE_POSTHOG_KEY` (+ `VITE_POSTHOG_HOST`) y tienes `posthog-js` instalado; sin eso, cae al mock local sin tocar una línea. Sin dependencias obligatorias.
- **Storybook:** `npm run storybook` (puerto 6006) con stories de los componentes base (Button, Badge, Alert, Card, ErrorState) en `src/shared/components/stories/`. A11y addon activo; **26 pruebas de stories en Chromium** con chequeos automáticos de accesibilidad (`npm run test:storybook`).
- **CI en GitHub Actions:** `.github/workflows/ci.yml` → `npm ci`, pruebas con cobertura (umbrales ≥ 55 % statements / 60 % funciones / 60 % líneas sobre `mocks/**/*.mock.js`, `services/**`, `utils`, `ErrorState`, `Modal`, `Select`), `build`, **presupuesto de bundle** (`npm run budget`: main ≤ 320 KB, vendor ≤ 210 KB, layout ≤ 20 KB, carga-masiva ≤ 45 KB), `build-storybook` y pruebas de stories con Chromium.
- **Carga inicial reducida ~76 %:** las vistas se agrupan por ruta con `import()` dinámico — el chunk principal bajó de 330 KB a **~81 KB**.
- **Web Vitals en desarrollo:** LCP/INP/CLS/FCP/TTFB se loguean en consola en `npm run dev` (`web-vitals`). En producción se reportaría a la analítica elegida.
- **IA-07 — Menú reagrupado por tarea:** **Nómina** (Carga masiva, Notificaciones, Nóminas timbradas, Mis nóminas), **Personas** (Empleados, Usuarios, Roles y accesos), **Organización** (Clientes, Compañías, Configuración) y **Herramientas** (Consulta CURP, Diseñador facturas). Se acabaron los grupos mezclados ("Comprobantes"/"Fiscal"): la navegación refleja el modelo mental del trabajo.
- **IA-08 — "Mi perfil" visible para empleado:** el menú de usuario muestra **Mi perfil** (para empleado; para los demás **Datos fiscales**) en vez de la etiqueta incorrecta.
- **IA-09 — Página 403:** las rutas bloqueadas (por rol) ya no reenvían en silencio al dashboard; muestran `/acceso-denegado` con explicación y acciones ("Volver al dashboard" / "Cerrar sesión").
- **Login y microinteracciones (revisión UX):** validación inline en tiempo real en correo/contraseña (bordes rojos sutiles con `role="alert"`), **selector rápido de rol (dev)** con tarjetas por rol (un clic = login inmediato con la cuenta demo, ideal para probar la matriz RBAC sin fricción), botón de visibilidad con `aria-pressed`, botón de ingreso con estado de carga nativo y atenuado; modales con transición fade + scale 200 ms ease-out y backdrop blur consistente; skeletons dinámicos en tablas/tarjetas sin pantallas en blanco; cero `alert()/confirm()` nativos (grep verificado); **DataFilterBar** en dos filas: controles en una línea (altura uniforme `h-10`, selects `whitespace-nowrap` sin salto de chevron, buscador `max-w-md`) y fila inferior con chips de filtros activos + **Limpiar todo** + contador `Mostrando X–Y de Z registros` + totalizadores en pills; el badge de sección y textos de columna truncan a 1 línea con tooltip (`title`) y notas internas colapsadas en `<details>` en la ficha de clientes.
- **DS-03 — Empty states con CTA contextual:** las tablas vacías (Empleados, Usuarios, Compañías, Clientes, Nóminas timbradas, Historial de cargas) ofrecen acción directa (crear registro / ir a Carga masiva).
- **Rediseño de barra de filtros (DataFilterBar v2):** tarjeta con `overflow-visible`; fila principal en una línea (altura uniforme `h-10`, selectores `inline-flex justify-between whitespace-nowrap` sin corte del chevron, dropdowns `absolute z-50 left-0 top-full mt-1.5 min-w-[220px]`, buscador `max-w-md` con lupa centrada `left-3 pointer-events-none`); **filtro de fechas rápido siempre disponible** en la barra (selector de periodo `Hoy`/`Últimos 7 días`/`Este mes`/`Mes anterior`/`Personalizado` + Desde/Hasta) que filtra contra los mocks en memoria; panel colapsable de **Más filtros** con sección de fechas + filtros secundarios por módulo (Estatus de firma en Nóminas, Acceso de usuario y Alta-fecha en Empleados, Estatus de correo en Notificaciones), badge solo con filtros avanzados activos, botones **Aplicar** y **Limpiar filtros**; chips de filtros activos en fila inferior con `x` por filtro + "Limpiar todo" y la fila de filas (conteo/totalizadores) fue eliminada a petición de UX (menos ruido): la retroalimentación de resultados queda en la paginación de la tabla. Los componentes `Table`/`Select` incorporan introspección de estado vacía y acciones.
- **Select unificado (`variant="bar"` en DataFilterBar)** para que ningún dropdown se vea distinto: trigger `h-10` auto-anchurado, preferencia `whitespace-nowrap`, estado abierto con fondo/borde primario, lista desplegable `z-50 absolute left-0 top-full mt-1.5 min-w-[220px] shadow-lg` con filas `py-2.5` y check de selección + búsqueda interna si > 4 opciones; el selector de compañía del header comparte el mismo sistema (`appearance-none` + chevron absoluto + `rounded-xl h-10`).
- **Login con patrón absoluto de iconos**: wrapper `relative w-full flex items-center`, icono `absolute left-3.5 pointer-events-none`, inputs `w-full … py-3` con `pl-11`/`pr-11` (el área de escritura usa todo el ancho), validación inline en tiempo real y switcher de rol con tarjetas elevadas (`hover:-translate-y-0.5`, tiles de icono con tinte primario) que acceden con un clic a la cuenta demo de cada rol.
- **Sistema de densidad y jerarquía (revisión UX post-deploy):**
- **NomiQ 2.0 — DataFilterBar + RBAC unificado + Login interactivo (2026-11-07):** la barra de filtros es un único componente **DataFilterBar** (buscador con debounce, selectores en una fila desktop, "Más filtros" colapsable, chips + **Limpiar filtros**; tarifa con `h-10` uniforme, `whitespace-nowrap` anti salto de chevron, ve **Rediseño de barra de filtros**). **RBAC:** rol plataforma **`Supervisor`** (Dashboard, Carga masiva, Notificaciones, Nóminas timbradas, Empleados/Usuarios solo lectura; sin Roles/Clientes/Compañías/Datos fiscales; solo *solicita* cancelaciones) con `SECTIONS_BY_ROLE` + matriz de acción por permiso (`employees:write`, `users:write`, `payroll:request-cancel`…) gobernando menú, guards (a **403** real, no redirige en silencio) y botones de acción; login con **selector rápido de rol dev** (switcher con cuenta demo por rol). **Acceso:** datos/sim servicios en `src/mocks/*.mock.js` + `src/services/*.service.js`; el login valida inline en tiempo real (correo válido/contra​seña obligatoria), botón de entrada con estado de carga nativo (`disabled` + spinner) y errores de bloqueo visibles.
- **Sistema de densidad y jerarquía (revisión UX post-deploy):** feedback del usuario → rediseño de espaciado: barra de filtros con más aire (padding 5, buscador 2rem más ancho), fila de conteo sin banda de color (4px más alta), sidebar con items `px-4/py-3` y grupos `space-y-6`, iconos de cabecera `w-12` (antes `w-14`), descripciones de página en máximo 2 líneas, tablas con texto largo truncado a 1 línea con tooltip (`title`), fichas con notas colapsadas en `<details>` y descripciones de vista acortadas a una línea. Menú móvil sin cambios (flotante con overlay); header móvil ya oculta breadcrumbs (< md) y selector de compañía (< sm).
- **Alineación de capas (2026-11-07)**: las vistas y stores ya no importan mocks directamente; consumen **`src/services/*.service.js`** (facade de latencia/contrato `{ok,data,meta,message}`) sobre los mocks renombrados a `src/mocks/*.mock.js` (`batches.mock.js` incluye cargas simples; `roles.mock.js` es el antiguo `tenantAccess.js`; `clients.mock.js` reemplaza `tenants.js`). `payrollLoads` se fusionó en `batches.mock.js`. El componente **DataFilterBar** (antes `FiltersBar.vue`) es único para todas las tablas: buscador con debounce, filtros visibles en una fila desktop, "Más filtros" con panel avanzado (Empleados: *Acceso de usuario* con/sin acceso, *Alta desde/hasta*, Estatus), chips removibles y botón **Limpiar filtros** solo cuando hay filtros activos. Los contadores unificados usan el formato **`Mostrando X–Y de Z registros`**; el chevron del `Select` tiene `whitespace-nowrap` para no bajar a 2ª línea.
- **RBAC unificado con rol Supervisor:** matriz `ROLE_SECTION_MATRIX` (fuente única de `SECTIONS_BY_ROLE`), permisos de acción (`employees:write`, `users:write`, `payroll:cancel`, `payroll:request-cancel`…) gateando botones; el login tiene **selector rápido de rol dev** (pills de acceso demo, p. ej. `supervisor@nomikok.com`) para probar la matriz en tiempo real. El Supervisor no ve Roles/Clientes/Compañías por menú ni por ruta (guard `forbidden`, no redirige en silencio), y solo puede *solicitar* cancelaciones (etiqueta diferenciada). El Empleado también tiene acceso a `cancelar-nomina` con guard de propiedad (`getEmployeePayrollById`) para *solicitar* cancelación.
- **Pendiente por dependencias externas:** instrumentación a PostHog/Amplitude real (adapter listo: definir `VITE_POSTHOG_KEY` + `posthog-js` instalado), pruebas SUS con usuarios humanos y performance medida en dispositivos reales — todo especificado para la siguiente iteración con backend/infraestructura.

---

## 14. Problemas comunes

| Problema | Solución |
|----------|----------|
| El puerto está ocupado | Vite usará otro (5174, 5175…). Revisa la terminal. |
| "No se ven los cambios" | Recarga el navegador o detén y reinicia `npm run dev`. |
| Errores tras `npm install` | Borra `node_modules` y ejecuta `npm install` de nuevo. |
| Los datos se reinician | Es normal: el mock vive en memoria. |
| No aparece la imagen del login | Reinicia `npm run dev` (Vite detecta archivos nuevos en `src/assets/imagenes/` solo al arrancar). |

---

## 15. Resumen rápido

```bash
npm install     # 1. instalar (una vez)
npm run dev     # 2. desarrollo
npm run build   # 3. compilar producción
npm run preview # 4. previsualizar la compilación
npm test        # 5. pruebas (Vitest + axe-core)
npm run test:storybook  # 6. pruebas de stories en Chromium
npm run storybook       # 7. catálogo de componentes (localhost:6006)
npm run budget          # 8. presupuestos de bundle
npm run export:tokens   # 9. exportar design-tokens.json
```

Luego abre `http://localhost:5173` e inicia sesión con `admin@nomikok.com` / `123456`.
