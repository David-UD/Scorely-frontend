# Scorely — PROMPT FRONTEND para implementación de actualizaciones

> Plantilla para especificar e implementar una actualización de frontend. El usuario completa la **Parte II** (los campos marcados `[COMPLETAR]`) y entrega este archivo junto con la petición o el ticket del cambio.

---

# Parte I — Contexto del proyecto

## Rol

Eres **Scorely Frontend**, un frontend developer especializado que implementa actualizaciones sobre la interfaz de **Scorely**: plataforma web de gestión y publicación de resultados de competiciones deportivas (CrossFit y HYROX). Consumes el API REST de Scorely en `/api/v1` (documentado con drf-spectacular).

## Alcance del frontend

Cubre: registro/login de usuarios, panel de administración de competiciones (competencias, **catálogo de categorías, categorías habilitadas por competición, filiaciones y sedes**, eventos qualifier/final, participantes, resultados) y la **publicación pública de leaderboards** (qualifier/final). **NO** gestiona horarios, heats, jueces ni logística de competición.

## Tech Stack (fijo — elegido: SPA separada, todo OSS/MIT/Apache-2.0)

| Componente | Tecnología |
|-----------|-----------|
| Referencia UI / panel admin | **TailAdmin React (free, MIT)** — **solo lectura** como referencia (nunca modificar el clon) |
| Framework | **React 19 + Vite** |
| Lenguaje | **TypeScript** |
| Estilos | **Tailwind CSS v4** |
| Estado global | **Zustand** |
| Data fetching / API | **TanStack Query (React Query)** |
| Routing | **React Router v6** |
| Formularios | **react-hook-form + zod** |
| Tests | **Vitest + React Testing Library + Playwright** |
| Charts | **ApexCharts** (MIT) |
| Build / deploy | **Build estático → Vercel / Netlify / Render / GitHub Pages** (o Nginx en VPS propio) |

> Desplegado **separado del backend** (proyecto propio, distinto dominio/origen). Evitar librerías comerciales o de pago: Highcharts NO (licencia comercial), temas "Pro" de TailAdmin NO. TailAdmin solo cubre el **panel privado**; las **vistas públicas se construyen a medida** con Tailwind (no existen en la plantilla).
> Regla: si una tecnología no aparece en esta tabla o en el repositorio, **preguntar antes de adoptarla**.

## Referencia UI — TailAdmin React `free-react-tailwind-admin-dashboard` (SOLO LECTURA)

El proyecto clonado (`https://github.com/TailAdmin/free-react-tailwind-admin-dashboard`, MIT) vive en una carpeta/ubicación externa y se usa **exclusivamente como referencia visual y de código**. El proyecto real de Scorely se escribe **desde cero** (mismo stack + Tailwind v4), **replicando** los diseños y componentes de la plantilla de forma adaptada a nuestra estructura.

**IMPORTANTE — Regla inquebrantable: la carpeta del clon `carpeta/` NUNCA se modifica.** No se edita, no se elimina nada de ella y no se escriben archivos dentro. Solo se puede leer (estilos, clases Tailwind, componentes de referencia, layout, dark mode) para **copiar e integrar** lo necesario en el proyecto real como código propio.

### Lo que replicamos de TailAdmin → funcionalidad de Scorely

| Funcionalidad de Scorely | Qué se replica de TailAdmin |
|--------------------------|--------------------------|
| Layout del panel `/admin` | `DefaultLayout` + Sidebar accesible colapsable + Header con breadcrumbs, notificaciones y dropdown de usuario |
| Login / cambio de contraseña | Formularios de autenticación (SignIn) |
| Dashboard por rol (`/admin/`) | Tarjetas (`Card`) de métricas (competencias, participantes, eventos) |
| CRUD de competencias, catálogo de categorías, filiaciones y sedes | Estilo de tablas (`Table`), formularios y modales |
| Etapas y eventos de una competición | Tablas, formularios anidados, `Breadcrumb` (Qualifier/Final por competición) |
| Participantes / equipos / resultados | Tablas densas, formularios, `Modal`/`Alert` para confirmaciones |
| Leaderboards públicos (qualifier/final) | **A medida** (página pública, no de TailAdmin) |
| Índice público `/` | **A medida** (listado de competiciones, Tailwind) |
| Detalle de competición `/competitions/:slug/` | **A medida** |
| Dark mode | Estilo de dark mode de TailAdmin replicado en nuestro tema |
| 404 / perfiles | Vistas `404`, `Profile` replicadas desde cero |

### Reglas de la referencia
- **NUNCA modificar `carpeta/`** (el clon). Solo lectura.
- Todo lo que se tome de TailAdmin se **replica como código propio** en el proyecto Scorely desde cero (adaptando nombres, estructura y estilos). No vender el clon como base editable.
- Si la plantilla requiere un cambio para encajar en Scorely, el cambio se hace en el proyecto propio; el clon permanece intacto.

## Arquitectura / convenciones

```
frontend/                           # proyecto Scorely creado desde cero (replica de TailAdmin, no es el clon)
├── src/
│   ├── components/          # componentes reutilizables (estilo TailAdmin, código propio)
│   │   └── common/          # tablas, formularios, modales, alertas, layout…
│   ├── features/            # módulos por funcionalidad (auth, competitions, leaderboards…)
│   ├── pages/               # páginas (públicas + admin)
│   ├── api/                 # cliente HTTP, refresh de token y endpoints
│   ├── hooks/               # hooks de lógica reutilizable
│   ├── store/               # estado global (Zustand)
│   ├── styles/              # estilos globales / tema (Tailwind v4)
│   ├── types/               # tipos TS (DTOs del API)
│   └── utils/               # helpers
├── tests/
└── package.json
```

**Rutas de la aplicación**
```
Públicas (sin auth) — construidas a medida con Tailwind:
  /                                            → índice: listado de competiciones
  /competitions/:slug/                         → detalle de competición
  /competitions/:slug/leaderboards/qualifier/  → tabla pública qualifier
  /competitions/:slug/leaderboards/final/      → tabla pública final

Panel admin (requieren JWT + rol, bajo <RoleGuard>) — sobre layout TailAdmin:
  /admin/                                      → dashboard según rol
  /admin/competitions/...                      → CRUD de competencias (superadmin)
  /admin/categories                            → CRUD del catálogo de categorías (solo superadmin)
  /admin/affiliations                          → CRUD del catálogo de filiaciones (solo superadmin)
  /admin/sedes                                 → CRUD del catálogo de sedes (solo superadmin)
  /admin/competition-categories                → categorías habilitadas por competición (admin de competición, con CompetitionScopeSelect)
  /admin/<competition>/...                     → categorías, eventos, participantes, resultados (admin de competición)
```

**Reglas de convenciones** (verificar en el código, no asumir):
- Respetar el estilo visual de TailAdmin React (Tailwind v4, layouts de `src/components` y `src/pages`) pero como **código propio** en nuestro proyecto.
- Componentes del panel admin: replicar el estilo de TailAdmin en componentes propios antes de crear diseños nuevos.
- Convención de nombres: archivos de componentes y páginas en **PascalCase** (`TeamsPage.tsx`, `CompetitionCard.tsx`); hooks, api y utils en **camelCase** (`useAdminModules.ts`, `categoryCounts.ts`, `sortFilter.ts`); rutas en kebab-case (`/admin/competition-categories`).
- Patrón de carpetas/exports: estructura de §Arquitectura tal cual existe (`components/{common,public,admin}`, `pages/{admin,public,auth}`, `api`, `hooks`, `utils`, `types`, `store`; `features/` no se usa — los módulos viven en `pages/` + `api/` + `hooks/`); **default export** en páginas y componentes, **named exports** en hooks, api, utils, types y fixtures de tests.
- Estilos: Tailwind CSS v4 con tokens del tema TailAdmin en `src/styles/index.css` (`@theme`); **solo tema claro** (sin dark mode, decisión de la Parte II); clases utilitarias inline; helper `cn()` (`clsx` + `tailwind-merge`) en `src/utils/cn.ts`.
- Manejo de errores y estados de carga: `ApiError` (tipado del cliente `src/api/client.ts`) → banner `role="alert"` en formularios/páginas; queries → `Spinner` / `ErrorState` (con Reintentar) / `EmptyState`; borrados con `window.confirm` + banner de error si falla.
- Internacionalización (i18n): **No** — textos en español hardcodeados, sin librería i18n; fechas con `format`/`Intl` es-ES (`src/utils/format.ts`).

## API backend (SPA separada: CORS + JWT)

- Frontend en origen distinto → el backend expone los endpoints con **CORS** (configurar `CORS_ALLOWED_ORIGINS` en Django con el origen del frontend).
- Documentación generada por drf-spectacular (Swagger/OpenAPI).
- Autenticación JWT: `POST /api/v1/auth/token/` (access+refresh) y `POST /api/v1/auth/token/refresh/`.
- Flujo de tokens en el cliente: guardar tokens (p.ej. `localStorage`/memoria), cliente HTTP con **interceptor que ante HTTP 401 hace refresh y reintenta** la petición; si el refresh falla → logout/redirección a login.
- Leaderboards: **públicos**, sin token.
- Áreas de administración: requieren token y permisos (superadmin / admin de competición). El **rol vive en la respuesta de login/perfil**; `<RoleGuard>` protege las rutas `/admin/*`.

**Reglas:** definir todos los endpoints que la actualización necesita en la Parte II (sección 7). No inventar endpoints: si falta alguno en el backend, **avisar** al usuario en lugar de mockear silenciosamente (o documentar el mock como temporal).

## Entorno / comandos de verificación

```bash
[install]:    npm install
[dev]:        npm run dev
[build]:      npm run build
[lint]:       npm run lint
[test]:       npm run test
[typecheck]:  npm run typecheck
```

> Sugeridos con el stack elegido: `npm run dev` (dev de TailAdmin React/Vite), `npm run build` (Vite + `tsc --noEmit`), `npm run test` (Vitest), `npm run lint` (ESLint). Ajustar scripts una vez creado el proyecto.

## Restricciones del proyecto

- Frontend es proyecto **separado e independiente** del backend (SPA), creado desde cero. La URL base del API se define por variable de entorno (`VITE_API_URL` o similar), nunca hardcodeada.
- **La carpeta `carpeta/` del clon de TailAdmin NUNCA se modifica ni se toca.** Solo se usa como referencia visual (estilos, componentes, layout, dark mode) para replicar en nuestro proyecto. Todo código propio se escribe en `frontend/`.
- No tocar ni reintroducir páginas demo/páginas de TailAdmin que ya se hayan borrado.
- No crear ramas. No hacer push ni ninguna operación de git sin pedido explícito del usuario.
- **AVISAR** al usuario y NO ejecutar comandos del backend (`makemigrations`, `migrate`, `seed_data`, `createsuperuser`); si el cambio depende de un endpoint, indicarlo.
- Documentar avances en `Process.md` al iniciar y finalizar cada paso.
- No añadir comentarios al código salvo que se soliciten.
- No inventar tokens, claves, URLs ni datos sensibles; usar variables de entorno del proyecto existente.

---

# Parte II-B — Módulo admin: Categorías disponibles

## 1. Título

Administración de **categorías disponibles**: el superadmin mantiene el **catálogo** de categorías (`CompetitionCategory`); el admin de competición solo **habilita** categorías del catálogo en sus competiciones asignadas y define el **slot de finalistas** (`finalist_slots`) por categoría.

## 2. Objetivo

- **Superadmin**: CRUD completo del catálogo de categorías (`/admin/categories`) — crear, editar y eliminar categorías (`name`, `min_members`, `max_members`).
- **Admin de competición**: NO puede crear/editar/eliminar categorías del catálogo. Solo puede **habilitar** categorías existentes en las competiciones que le fueron asignadas (`/admin/competition-categories`) y asignar el `finalist_slots` (cuántos pasan a la Final; `0` = sin Final).
- Regla de roles: **quién crea categorías = superadmin; quién habilita + slots = admin de competición sobre sus competiciones.**

## 3. Alcance

**Incluye:**
- Página `/admin/categories` (solo superadmin): lista y CRUD (crear/editar/eliminar) de `CompetitionCategory`.
- Página `/admin/competition-categories` (admin de competición): con `CompetitionScopeSelect` para elegir la competición asignada; lista las categorías habilitadas de esa competición y permite habilitar/quitar categorías del catálogo y editar `finalist_slots`.
- Ocultamiento y **bloqueo por rol en frontend**: el CRUD del catálogo se muestra y permite escritura **solo si el usuario logueado es superadmin** (`user.is_superuser`); si no es superadmin, se oculta `/admin/categories` y las llamadas de escritura al catálogo se bloquean en frontend (defensa en UI).

**Excluye:**
- No se toca el backend. **AVISO al usuario:** hoy el backend expone `competition-categories/` y `enabled-competition-categories/` con permiso global `IsAuthenticated` (cualquier usuario autenticado podría escribir); la restricción de roles se hace **solo a nivel frontend** en esta iteración. Queda como observación que el backend debería bloquear la escritura del catálogo a no-superadmins.
- No tocar la carpeta clon de TailAdmin, no crear ramas ni git.

## 4. Endpoints del API utilizados

> Ambos `ModelViewSet` — read/escritura con JWT. Catálogo: `CompetitionCategorySerializer` (`id`, `name`, `min_members`, `max_members`). Habilitaciones: `EnabledCompetitionCategorySerializer` (`id`, `competition`, `competition_category` = id de `CompetitionCategory`, `finalist_slots`), `filterset_fields = ('competition',)`.

| Acción | Método | URL | Auth | Rol frontend |
|--------|--------|-----|------|-------------|
| Listar catálogo | GET | `/api/v1/competition-categories/` | JWT | superadmin + admin (para el select de categorías) |
| Crear categoría | POST | `/api/v1/competition-categories/` | JWT | **solo superadmin** |
| Editar categoría | PATCH | `/api/v1/competition-categories/{id}/` | JWT | **solo superadmin** |
| Eliminar categoría | DELETE | `/api/v1/competition-categories/{id}/` | JWT | **solo superadmin** |
| Habilitaciones por competición | GET | `/api/v1/enabled-competition-categories/?competition={id}` | JWT | admin (scope) |
| Habilitar categoría | POST | `/api/v1/enabled-competition-categories/` | JWT | admin (scope) — payload `{ competition, competition_category, finalist_slots }` |
| Editar habilitación (slots) | PATCH | `/api/v1/enabled-competition-categories/{id}/` | JWT | admin (scope) |
| Quitar habilitación | DELETE | `/api/v1/enabled-competition-categories/{id}/` | JWT | admin (scope) |

> El admin de competición para habilitar usa el **catálogo existente** (`GET /competition-categories/`, solo lectura) y crea `EnabledCompetitionCategory` — **no** crea categorías.

## 5. Datos / DTOs

- `CompetitionCategory`: `id`, `name`, `min_members`, `max_members`.
- `EnabledCompetitionCategory`: `id`, `competition` (id), `competition_category` (id de `CompetitionCategory`), `finalist_slots` (número de clasificados a Final; `0` = sin Final). Constraint único `(competition, competition_category)`.
- Para mostrar el nombre de la categoría habilitada, cruzar en frontend las habilitaciones con el catálogo (o usar el payload según el shape del backend).

## 6. Cambios en componentes / estructura

- Nuevo tipo `CompetitionCategory` en `src/types/index.ts` (y actualizar `EnabledCompetitionCategory` según el shape real del backend).
- `src/api/admin.ts`: `fetchCompetitionCategories()` (GET), `createCompetitionCategory()`, `updateCompetitionCategory()`, `deleteCompetitionCategory()`; `createEnabledCompetitionCategory()`, `updateEnabledCompetitionCategory(finalist_slots)`, `deleteEnabledCompetitionCategory()`.
- Páginas nuevas: `src/pages/admin/CategoriesPage.tsx` (CATÁLOGO — solo superadmin) y `src/pages/admin/CompetitionCategoriesPage.tsx` (habilitación por competición + `CompetitionScopeSelect` + slots).
- Formularios (modal o página): `CategoryFormPage.tsx` / modal con `name`, `min_members`, `max_members`; y habilitación con select de categoría + `finalist_slots`.
- Menú lateral (solo superadmin): ítem "Categorías" → `/admin/categories`. (Ítem "Categorías de competición" visible a admin de competición.)
- Rutas en el router admin con `<RoleGuard>` / condición por `is_superuser`.

## 7. Pruebas requeridas

| Test | Escenario | Resultado esperado |
|------|-----------|--------------------|
| Superadmin ve CRUD | Login superadmin → `/admin/categories` | Puede crear/editar/eliminar categorías |
| Admin no ve CRUD | Login admin de competición | `/admin/categories` oculto/no accesible; llamada a crear categoría → bloqueada en frontend |
| Admin habilita categoría | Admin en competición asignada | Habilitar categoría del catálogo + set `finalist_slots` persiste |
| Bloqueo escritura catálogo | No-superadmin intenta POST a catálogo | Frontend no emite la petición (guard por rol) |
| Quitar habilitación | Admin quita categoría habilitada | Desaparece de la lista y del leaderboard |

## 8. Observaciones / riesgos

- **Restricción de roles SOLO en frontend (por ahora):** el backend hoy no limita quién crea categorías (`IsAuthenticated` global). Se oculta/bloquea en UI según `is_superuser`, pero **avisar** al usuario que el backend debería restringir la escritura de `CompetitionCategoryViewSet` a superadmin para una regla de negocio real.
- El admin de competición **solo ve sus competiciones asignadas**; la página de habilitación usa el `CompetitionScopeSelect` existente (mismo patrón que eventos/equipos).
- Borrar una categoría con habilitaciones: backend usa `CASCADE` en `EnabledCompetitionCategory.competition_category` → revisar que borrar del catálogo no deje estados rotos; si se prefiere impedir el borrado, avisar para evaluación backend.

---

# Parte II-C — Módulo admin: Filiaciones (afiliaciones)

## 1. Título

Administración de **filiaciones** (`Affiliation`): el **superadmin** mantiene el catálogo de afiliaciones (boxes/gimnasios dueños de competiciones) que se usan como dueño/creador de cada competición y como dato de atletas. Página **solo superadmin**.

## 2. Objetivo

- **Superadmin**: CRUD completo del catálogo de filiaciones (`/admin/affiliations`) — crear, editar y eliminar (`name`, `city`, `state`, `country`).
- **Admin de competición**: NO accede a esta página (defensa en UI).
- La filiación se muestra como **dueño/creador** de la competición en las vistas públicas (`CompetitionDetail`, `CompetitionCard`) y es un select existente en `CompetitionFormPage`/`getAdminCatalogs`.

## 3. Alcance

**Incluye:**
- Página `/admin/affiliations` (solo superadmin): lista y CRUD (crear/editar/eliminar) de `Affiliation`.
- Menú lateral: ítem "Filiaciones" visible **solo para superadmin** (`user.is_superuser`).
- Ruta protegida en el router admin con `<RoleGuard>` + condición por `is_superuser`.
- Guard de escritura en frontend (función `assertSuperUser()` o equivalente, mismo patrón que el catálogo de categorías).

**Excluye:**
- No se toca el backend. **AVISO al usuario:** hoy el backend expone `affiliations/` como catálogo (GET, JWT). Se asume un `ModelViewSet` estándar para POST/PATCH/DELETE, pero hay que **verificar el serializer y permisos reales del backend**; si la escritura no está restringida a superadmin, queda como observación a evaluar en backend.
- No tocar la carpeta clon de TailAdmin, no crear ramas ni git.

## 4. Endpoints del API utilizados

> Catálogo existente: `GET /api/v1/affiliations/` (JWT) ya consumido por `getAdminCatalogs` → `AdminCatalogs.affiliations`. Serializer actual en frontend: `Affiliation = { id, name, city, state, country }`. **Verificar shape real del backend** (¿hay más campos? ¿`name` único?).

| Acción | Método | URL | Auth | Rol frontend |
|--------|--------|-----|------|-------------|
| Listar filiaciones | GET | `/api/v1/affiliations/` | JWT | superadmin + admin (select en competiciones) |
| Crear filiación | POST | `/api/v1/affiliations/` | JWT | **solo superadmin** |
| Editar filiación | PATCH | `/api/v1/affiliations/{id}/` | JWT | **solo superadmin** |
| Eliminar filiación | DELETE | `/api/v1/affiliations/{id}/` | JWT | **solo superadmin** |

## 5. Datos / DTOs

- `Affiliation`: `id`, `name` (obligatorio), `city`, `state`, `country`.
- `AffiliationWritePayload` (nuevo tipo), siguiendo el patrón de `CompetitionCategoryWritePayload`: `{ id?, name, city?, state?, country? }` (ajustar obligatoriedad según el serializer del backend).
- Consideración de borrado: si la filiación tiene competiciones o atletas asociados, el backend puede restringir el DELETE (`ProtectedError`) → manejar ese error en frontend con un mensaje claro.

## 6. Cambios en componentes / estructura

- `src/types/index.ts`: nuevo tipo `AffiliationWritePayload` (actualizar la shape si el serializer expone más campos).
- `src/api/admin.ts`: `fetchAffiliations()` (reutiliza el catálogo existente), `createAffiliation()`, `updateAffiliation()`, `deleteAffiliation()` — con `assertSuperUser()` como el catálogo de categorías.
- Página nueva: `src/pages/admin/AffiliationsPage.tsx` (tabla + modal/formulario estilo TailAdmin, mismo patrón que `CategoriesPage.tsx`).
- Formulario: `AffiliationFormPage.tsx` o modal con `name`, `city`, `state`, `country`.
- Menú lateral (solo superadmin): ítem "Filiaciones" → `/admin/affiliations`.
- Rutas en el router admin con `<RoleGuard>` / condición por `is_superuser`.

## 7. Pruebas requeridas

| Test | Escenario | Resultado esperado |
|------|-----------|--------------------|
| Superadmin ve CRUD | Login superadmin → `/admin/affiliations` | Puede crear/editar/eliminar filiaciones |
| Admin no ve CRUD | Login admin de competición | `/admin/affiliations` oculto/no accesible; llamadas de escritura → bloqueadas en frontend |
| Crear filiación | Superadmin crea `name`/`city`/`state`/`country` | Persiste y aparece en el listado y en el select de competiciones |
| Bloqueo escritura | No-superadmin intenta POST | Frontend no emite la petición (guard por rol) |
| Borrado en uso | Eliminar filiación con competiciones asociadas | Mensaje de error claro si el backend rechaza (`ProtectedError`) |

## 8. Observaciones / riesgos

- **Restricción de roles SOLO en frontend (por ahora):** se oculta/bloquea la escritura según `is_superuser`, pero **avisar** al usuario que el backend debe restringir la escritura de `AffiliationViewSet` a superadmin para una regla de negocio real.
- **Verificar shape del backend:** campos exactos y obligatoriedad del serializer `Affiliation` (el tipo actual en frontend solo contempla `name/city/state/country`).
- **Borrado en uso:** `Competition.affiliation` y `Athlete.affiliation` pueden referenciar la filiación; depende del backend cómo se comporta el DELETE (proteger vs CASCADE). Si es `ProtectedError`, gestionar el error 4xx en la UI.
- Eliminar una filiación en uso dejaría competiciones/atletas huérfanos si el backend lo permite → considerarlo en la lógica y/o avisar para evaluación backend.

---

# Parte II-D — Módulo admin: Sedes (locations)

## 1. Título

Administración de **sedes** (`Location`): el **superadmin** mantiene el catálogo de sedes (lugar físico de cada competición: `name`, `address`, `city`, `state`, `country`, `latitude`, `longitude`). Página **solo superadmin**, etiqueta en el menú: **"Sedes"**.

## 2. Objetivo

- **Superadmin**: CRUD completo del catálogo de sedes (`/admin/sedes`) — crear, editar y eliminar.
- **Admin de competición**: NO accede a esta página (defensa en UI).
- Cada competición referencia una sede (`Competition.location`); es el select existente en `CompetitionFormPage` vía `getAdminCatalogs().locations` y el dato que alimenta el mapa en la vista pública (`LocationMap`).

## 3. Alcance

**Incluye:**
- Página `/admin/sedes` (solo superadmin): lista y CRUD (crear/editar/eliminar) de `Location`.
- Menú lateral: ítem **"Sedes"** visible **solo para superadmin** (`user.is_superuser`).
- Ruta protegida en el router admin con `<RoleGuard>` + condición por `is_superuser`.
- Guard de escritura en frontend (`assertSuperUser()`, mismo patrón que filiaciones/categorías).

**Excluye:**
- No se toca el backend. **AVISO al usuario:** hoy el backend expone `locations/` con permiso global `IsAuthenticated` (`LocationViewSet`, model viewset estándar); cualquier usuario autenticado podría escribir. La restricción a superadmin se hace **solo a nivel frontend** en esta iteración y queda como observación que el backend debería bloquear la escritura a no-superadmins (`IsSuperAdmin`).
- No tocar la carpeta clon de TailAdmin, no crear ramas ni git.

## 4. Endpoints del API utilizados

> **Shape verificado en el backend** (`leader\Scorely/apps/competitions`): `LocationSerializer` = `(id, name, address, city, state, country, latitude, longitude)`; `LocationViewSet` = `ModelViewSet` con `search_fields=('name',)` y `filterset_fields=('city','state','country')`. `name`, `address`, `city`, `state`, `country` son obligatorios; `latitude`/`longitude` son opcionales (Decimal 9,6) y en las vistas llegan como **string o `null`**.

| Acción | Método | URL | Auth | Rol frontend |
|--------|--------|-----|------|-------------|
| Listar sedes | GET | `/api/v1/locations/` | JWT | superadmin + admin (select en competiciones) |
| Obtener sede | GET | `/api/v1/locations/{id}/` | JWT | superadmin (edición) |
| Crear sede | POST | `/api/v1/locations/` | JWT | **solo superadmin** |
| Editar sede | PATCH | `/api/v1/locations/{id}/` | JWT | **solo superadmin** |
| Eliminar sede | DELETE | `/api/v1/locations/{id}/` | JWT | **solo superadmin** |

## 5. Datos / DTOs

- `Location` (ya existe en el frontend): `id`, `name`, `address?`, `city`, `state`, `country`, `latitude?: number | string | null`, `longitude?: number | string | null`.
- `LocationWritePayload` (nuevo tipo): `{ id?, name, address?, city, state, country, latitude?, longitude? }` (ajustar según serializer: `address` obligatorio en backend; `latitude`/`longitude` numéricos opcionales, enviarlos solo si hay valor).
- Consideración de borrado: `Competition.location` usa `on_delete=PROTECT` en el backend → eliminar una sede en uso lanza `ProtectedError` (4xx) → manejar ese error en frontend con un mensaje claro.

## 6. Cambios en componentes / estructura

- `src/types/index.ts`: nuevo tipo `LocationWritePayload` (la shape de `Location` ya existe).
- `src/api/admin.ts`: `fetchLocations()` (reutiliza el catálogo y refactoriza `getAdminCatalogs()` a un solo origen), `fetchLocation(id)`, `createLocation()`, `updateLocation()`, `deleteLocation()` — con `assertSuperUser()` como filiaciones.
- `src/hooks/useAdminModules.ts`: `useAdminLocations`, `useCreateLocation`, `useUpdateLocation`, `useDeleteLocation` (invalidar `["admin","locations"]`).
- Página nueva: `src/pages/admin/LocationsPage.tsx` (tabla + acciones, solo superadmin; patrón de `AffiliationsPage.tsx`).
- Formulario: `src/pages/admin/LocationFormPage.tsx` (`name`, `address`, `city`, `state`, `country`, `latitude`, `longitude` con transformación `"" / NaN → undefined`).
- Menú lateral (solo superadmin): ítem **"Sedes"** → `/admin/sedes`, ícono nuevo `MapPinIcon` en `src/components/admin/icons.tsx`.
- Rutas en el router admin: `/admin/sedes`, `/admin/sedes/new`, `/admin/sedes/:id/edit`.

## 7. Pruebas requeridas

| Test | Escenario | Resultado esperado |
|------|-----------|--------------------|
| Superadmin ve CRUD | Login superadmin → `/admin/sedes` | Puede crear/editar/eliminar sedes |
| Admin no ve CRUD | Login admin de competición | `/admin/sedes` oculto/no accesible; llamadas de escritura → bloqueadas en frontend |
| Crear sede | Superadmin crea `name`/`address`/`city`/`state`/`country` (+ coords opcionales) | Persiste y aparece en el listado y en el select de competiciones |
| Bloqueo escritura | No-superadmin intenta POST | Frontend no emite la petición (guard por rol) |
| Borrado en uso | Eliminar sede con competiciones asociadas | Mensaje de error claro si el backend rechaza (`ProtectedError`) |

## 8. Observaciones / riesgos

- **Restricción de roles SOLO en frontend (por ahora):** se oculta/bloquea la escritura según `is_superuser`, pero **avisar** al usuario que el backend debe restringir la escritura de `LocationViewSet` a superadmin para una regla de negocio real.
- **Borrado en uso:** `Competition.location` usa `on_delete=PROTECT`; el DELETE de una sede referenciada falla con 4xx. Gestionar el error en la UI sin romper la lista.
- **Coordenadas:** llegan de `Location` como `string` o `null` en las vistas; el payload de escritura envía solo números cuando hay valor (el formulario transforma `""`/`NaN` a `undefined`).
- **Dato demo:** `seed_data.py` crea sedes españolas como texto plano; no existe un catálogo geo (ciudades/estados/países) en el backend — fuera del alcance de esta iteración.

---

# Parte II-E — Vista pública: categorías con recuento de inscritos

## 1. Título

Vista pública del detalle de competición: sección de **categorías habilitadas con recuento de inscritos**, ubicada **antes de la sección Workouts**.

## 2. Objetivo

- Mostrar en `/competitions/:slug/` (`CompetitionDetail`) las **categorías habilitadas** de la competición y, por cada una, **cuántos inscriptos (`Competitor`)** tiene, en una sección propia (título `h2` "Categorías e inscritos", o similar) entre el grid de información/mapa y la sección "Workouts".
- Enriquecer el detalle público con datos de participación de la competición, consultables **sin autenticación**.

## 3. Alcance

**Incluye:**
- Nueva sección en `CompetitionDetail` (antes de Workouts): tarjetas/badges de categoría con su recuento (p. ej. `RX Individual — 12`).
- **Categorías listadas = las mismas del leaderboard público** que ya se muestran hoy (misma fuente, `category.code`/`name`), para no depender de nombres adicionales del backend.
- Recuento = número de `Competitor` de la competición agrupados por `enabled_competition_category`, contado en frontend.
- Estados de UI: carga, error y vacío (sin categorías/leaderboard → ocultar la sección o estado vacío, sin romper la página).
- **Degradación elegante** si `competitors/` aún responde 401/403 (dependencia backend pendiente): tratar como "sin dato" y no romper el resto del detalle.

**Excluye:**
- No se toca el backend. **AVISO / dependencia backend (decisión del usuario):** abrir la **lectura pública** de `GET /api/v1/competitors/` (hoy JWT-only: `DEFAULT_PERMISSION_CLASSES = IsAuthenticated`). Aplicar `IsAuthenticatedOrReadOnly` (o lectura `AllowAny`) en `CompetitorViewSet`, sin filtrar el queryset por usuario; el usuario aplica el cambio en Django.
- El recuento publicado es de **inscripciones reales (`Competitor`)**, no las entradas con resultados del leaderboard (decisión del usuario: no usar el conteo del leaderboard como sustituto).
- No se crea backend nuevo (sin endpoint `count` propio).

## 4. Endpoints del API utilizados

| Acción | Método | URL | Auth | Notas |
|--------|--------|-----|------|-------|
| Inscritos de una competición | GET | `/api/v1/competitors/?competition={id}` | pública **pendiente** (hoy JWT) | `CompetitorSerializer` = `(id, competitor_type, athlete, team, registration_number, competition, enabled_competition_category)`. Páginado (global `PAGE_SIZE` 20) → usar `page_size=100` o recorrer `next`; agrupar por `enabled_competition_category` y contar. |

- Para asociar el recuento (clave `enabled_competition_category` = id) a las categorías **con nombre** del leaderboard se reutiliza el listado de habilitaciones existente: `GET /api/v1/enabled-competition-categories/?competition={id}` (ya cableado en `src/api/public.ts` / `useEnabledCompetitionCategories`) que devuelve `{id, competition, competition_category, finalist_slots}`.
- ⚠️ **Aviso backend:** ese endpoint y `GET /api/v1/competition-categories/` (catálogo con nombres) son hoy **JWT-only**. Junto con `competitors/` conviene abrir su lectura al público **o** (recomendado) que `EnabledCompetitionCategorySerializer` anide `competition_category` (id + name) para no necesitar abrir el catálogo.

## 5. Datos / DTOs

- `Competitor` (DTO nuevo en frontend): `{ id, competitor_type, athlete?, team?, registration_number, competition, enabled_competition_category }` (`enabled_competition_category` = id de `EnabledCompetitionCategory`).
- `EnabledCompetitionCategory` (ya existe): `{ id, competition, competition_category, finalist_slots }`.
- `CategoryRef` (ya existe, del leaderboard): `{ code, name }`.

## 6. Cambios en componentes / estructura

- `src/types/index.ts`: nuevo tipo `Competitor` (shape de §5).
- `src/api/public.ts`: `getCompetitors(competitionId)` (GET con `auth: false`, `unwrapList` + `page_size=100`).
- Hook nuevo (patrón `useEnabledCompetitionCategories`): `useCompetitors(competitionId)`.
- `CompetitionDetail.tsx`: nueva sección "Categorías e inscritos" **antes de Workouts**; helper que agrupa `Competitor[]` por `enabled_competition_category` y une el recuento a las categorías del leaderboard (mismo orden que `LeaderboardFilters`); `Spinner`/`ErrorState`/`EmptyState`.
- Tests: fixture `makeCompetitor`, bloque nuevo en `tests/publicApi.test.ts`, y casos de la sección en `CompetitionDetail` (carga, con datos, vacío, 401/403).

## 7. Pruebas requeridas

| Test | Escenario | Resultado esperado |
|------|-----------|--------------------|
| Detalle sin login | Cargar `/competitions/:slug/` sin token | Muestra las categorías con recuento de inscritos **antes de Workouts** |
| Recuento correcto | Competición con N inscritos por categoría | Cada categoría muestra su N (inscripciones reales, no entradas del leaderboard) |
| Sin categorías/leaderboard | Competición sin categorías | Sección oculta o estado vacío; la página no se rompe |
| Backend aún JWT (401/403) | `competitors/` sin abrir | La sección degrada sin romper el resto del detalle |
| Inscritos sin resultados | Categoría con inscritos pero sin leaderboard completo | Se muestra la categoría con su recuento |

## 8. Observaciones / riesgos

- **Dependencia backend (decisión del usuario):** `CompetitorViewSet` hoy usa el permiso global `IsAuthenticated` → el GET de inscritos no es público. Hay que **abrir la lectura pública** (el usuario lo aplica manualmente; el frontend no toca backend). Mientras tanto, tratar 401/403 como "sin dato".
- **Mapeo id→nombre:** el recuento llega por `enabled_competition_category` (id); las categorías del leaderboard tienen nombre/código. Se resuelve con habilitaciones + catálogo (ambos JWT hoy) o, **recomendado**, pidiendo que `EnabledCompetitionCategorySerializer` anide el nombre de la categoría.
- **Paginación:** `PAGE_SIZE` global = 20 → usar `page_size=100` o recorrer `next` para no subcontar en competiciones grandes (ej. HYROX con miles de inscritos).
- "Inscritos" (**Competitor**) ≠ "entradas con resultados del leaderboard": pueden diferir mientras no haya resultados todos los inscritos.

---

# Parte II-F — Módulo admin: Competidores (inscripciones)

## 1. Título

Módulo de administración de **competencias/inscripciones** en el panel: CRUD de `Competitor` en `/admin/competitors` (más `/admin/competitors/new` y `/admin/competitors/:id/edit`), por competición en scope.

## 2. Objetivo

- Permitir al **admin de competición** (y al superuser) **inscribir atletas o equipos** en la competición seleccionada, asignándolos a una **categoría habilitada**, con un **número de inscripción**.
- La inscripción (`Competitor`) es la **fuente** del recuento público "Categorías e inscritos" de la Parte II-E: cada alta aquí incrementa ese recuento.

## 3. Alcance

**Incluye:**
- Listado por `CompetitionScopeSelect`: tabla con Nº de inscripción, competidor (atleta o equipo), tipo (`Individual`/`Equipo`) y categoría (nombre).
- Alta/edición con **tipo dinámico** (Individual → select de atleta; Equipo → select de equipo), **`registration_number` obligatorio**, select de **categorías habilitadas** de la competición (nombre del catálogo), `competition` = scope (alta) o el del registro (edición).
- Baja con confirmación y banner de `ApiError`.
- Ítem **"Competidores"** en el sidebar (`manageItems`) y rutas bajo `/admin`.

**Excluye / decisiones:**
- **Sin gate superadmin**: lo usan los admins de competición sobre sus competiciones asignadas (`useAdminCompetitions` ya limita por asignación; superuser ve todas).
- **No se toca el backend**: las escrituras usan el **JWT** actual (`CompetitorViewSet` = `IsAuthenticatedOrReadOnly` requiere autenticación para escribir). Sin cambios de permisos.
- `registration_number` obligatorio en la UI (el modelo lo tiene `blank=True`, sin unicidad).
- No se gestionan resultados/scoring (fuera del alcance).

## 4. Endpoints del API utilizados

| Acción | Método | URL | Auth | Notas |
|--------|--------|-----|------|-------|
| Listar inscritos de la competición | GET | `/api/v1/competitors/?competition={id}` | JWT (lectura pública OK) | `CompetitorSerializer` = `(id, competitor_type, athlete, team, registration_number, competition, enabled_competition_category)`; usar `page_size=100` |
| Detalle | GET | `/api/v1/competitors/{id}/` | JWT | Retrieve |
| Alta | POST | `/api/v1/competitors/` | **JWT (escritura)** | Payload: `{competitor_type, athlete \| null, team \| null, registration_number, competition, enabled_competition_category}` |
| Edición | PATCH | `/api/v1/competitors/{id}/` | JWT (escritura) | Parcial; `competition` conserva el registro |
| Baja | DELETE | `/api/v1/competitors/{id}/` | JWT (escritura) | `.json` responde 4xx si está en uso (FK) |

Catálogos auxiliares ya cableados en el admin (para armar selects/nombres): `/athletes/?page_size=100`, `/teams/?competition={id}&page_size=100`, `/enabled-competition-categories/?competition={id}` y `/competition-categories/?page_size=100`.

> ⚠️ **Aviso backend (no se toca en esta Parte II-F):** `CompetitorViewSet` no filtra por competición ni valida rol → cualquier usuario autenticado puede escribir sobre cualquier competición. La seguridad real es un cambio backend. *(Nota Parte II-G: `TeamViewSet` ya no sirve como patrón de guard porque los equipos pasaron a catálogo global.)*

## 5. Datos / DTOs

- `CompetitorWritePayload` (DTO nuevo): `{ id?, competitor_type: "INDIVIDUAL"|"TEAM", athlete: number|null, team: number|null, registration_number, competition, enabled_competition_category }` — el FK no usado va `null` (invariante del `clean()` del backend).
- `Competitor` (ya existe, Parte II-E): `{ id, competitor_type, athlete?, team?, registration_number, competition, enabled_competition_category }`.
- Reutilizados: `Athlete`, `Team`, `EnabledCompetitionCategory` (`competition_category: number`), `CompetitionCategory` (catálogo de nombres).

## 6. Cambios en componentes / estructura

- `src/types/index.ts`: `CompetitorWritePayload`.
- `src/api/admin.ts`: `fetchCompetitors(competitionId)`, `fetchCompetitor(id)`, `createCompetitor`, `updateCompetitor`, `deleteCompetitor` (patrón Athletes/Teams, con JWT).
- `src/hooks/useAdminModules.ts`: `useAdminCompetitors(competitionId)`, `useCreateCompetitor`, `useUpdateCompetitor`, `useDeleteCompetitor` (invalidan `["admin","competitors", …]`).
- `src/pages/admin/CompetitorsPage.tsx` (nuevo): scope + tabla + alta/edición/baja (patrón `TeamsPage`).
- `src/pages/admin/CompetitorFormPage.tsx` (nuevo): tipo dinámico Individual/Equipo, nº obligatorio, categoría habilitada (patrón `TeamFormPage`).
- `src/App.tsx` + `AdminSidebar.tsx` + `icons.tsx`: rutas, ítem "Competidores", `UserPlusIcon`.
- Tests: fixtures `makeAthlete`/`makeTeam`, bloque en `adminApi.test.ts`, `CompetitorsPage.test.tsx` y `CompetitorFormPage.test.tsx`.

## 7. Pruebas requeridas

| Test | Escenario | Resultado esperado |
|------|-----------|--------------------|
| LIST | `/admin/competitors` con datos | Tabla con nº, competidor, tipo y categoría (nombres resueltos) |
| Alta Individual | Form completo | POST con `athlete` y `team: null`; aciertos/errores de validación |
| Alta Equipo | Toggle a Equipo | Select de equipos del scope; POST con `team` y `athlete: null` |
| Edición | `/admin/competitors/:id/edit` | Precarga y PATCH conservando `competition` |
| Baja | Confirm | Llama a `deleteCompetitor`; `ApiError` → banner |
| Sin scope | `/admin/competitors` sin competición | Botón "Nuevo competidor" deshabilitado |

## 8. Observaciones / riesgos

- **Escrituras sin guard de competición** en el backend: la exposición visual queda limitada por el scope (frontend); la seguridad real es aviso al backend. *(Nota Parte II-G: el patrón `TeamViewSet` con `IsCompetitionAdmin` dejó de existir; los equipos son ahora catálogo global.)*
- **Borrado en uso**: `enabled_competition_category` usa `on_delete=PROTECT` y el `Competitor` es FK de entradas con resultados → el DELETE puede fallar; la UI muestra el banner.
- **Unicidad del número de inscripción**: no existe constraint; si se requiere "1 número por competición", es cambio backend.
- **Relación con Parte II-E**: la inscripción es la fuente del recuento público "Categorías e inscritos".

---

# Parte II — Vista pública: pantalla pública con información del sistema

## 1. Título

Pantalla publica con informacion del sistema, inicio muestra las competencias recientes, con pestaña a todas las competencias, dentro de la competenicia informacion general, mapa, nombre, afiliaod creador, fecha, el leaderborad, los wods, etc.

## 2. Objetivo

Poner a disposición del público (atletas/espectadores) la información de las competiciones de Scorely **sin necesidad de autenticarse**: el inicio muestra las competiciones recientes con una pestaña para ver todas, y el detalle de cada competición muestra información general (nombre, afiliación dueña/creadora, fechas, mapa, WODs y leaderboards). El panel de administración (`/admin`) sigue siendo accesible **solo con login** según el rol.

## 3. Alcance

**Incluye (se debe implementar):**
- Página de inicio pública `/`: competiciones recientes con pestaña a "todas las competiciones".
- Detalle público de competición: información general, mapa, afiliación creadora, fechas, WODs y leaderboards.
- Leaderboard público con los **filtros disponibles** (etapas qualifier/final y categorías habilitadas).
- Vistas públicas de **solo lectura**; cualquier modificación pasa por `/admin` autenticado.
- Idioma español. Tema claro (sin dark mode por ahora).

**Excluye (NO tocar):**
- En el frontend **no se modifica el backend**; los cambios en Django los aplica el usuario manualmente. **Ya aplicados por el usuario (verificado en el backend):** (a) `Event` apunta **directo a `Competition`** con `phase` (`QUALIFIER`/`FINAL`) y el modelo/endpoint `CompetitionStage` fueron **eliminados**; (b) `finalist_slots` se movió a `EnabledCompetitionCategory` (por categoría, `0` = sin Final); (c) el leaderboard expone `event_results[]` como **lista de objetos** (`event_id`, `event_number`, `event_name`, `phase`, `result`, `event_rank`, `score`).
- No inventar endpoints ni mockear datos en producción.
- No i18n multi-idioma, no dark mode, no registro nuevo de usuarios (se usa el login JWT existente).
- No gestión de horarios/heats/jueces.

## 4. Diseño UI/UX

- Wireframe/maqueta: sin maqueta externa; se replica el estilo TailAdmin a medida con Tailwind (referencia visual: clon `free-react-tailwind-admin-dashboard/`, solo lectura).
- Responsive: mobile-first; breakpoints Tailwind (`sm`/`md`/`lg`); tablas con scroll horizontal en móvil.
- Densidad: tarjetas para el listado de competiciones; tablas para WODs y leaderboards.
- Estados de la interfaz: carga, error, **vacío** (competición sin WODs/leaderboard o sin datos), sin sesión.
- Interacciones: pestañas (Recientes / Todas), filtros de leaderboard, navegación tarjeta → detalle, mapa embebido.

## 5. Comportamiento esperado (reglas de negocio visibles)

- Las vistas públicas son **solo de lectura**: cualquiera las consulta sin login.
- **Se requiere autenticación para modificar** cualquier dato (panel `/admin` protegido por rol).
- La afiliación de la competición (`Competition.affiliation`) se muestra como **dueño/creador** de la misma (nombre, ciudad/estado/país).
- El leaderboard muestra los filtros disponibles: etapa (qualifier/final) y categorías.
- Usuario sin login que intenta entrar a `/admin/*` → redirigir a login.
- Inicio: competencias recientes ordenadas por fecha de inicio (desc) + pestaña "todas".
- El inicio **siempre muestra todas las competiciones publicadas**, inicie sesión o no (las vistas públicas no adjuntan el token JWT).
- `/admin/events` y `/admin/teams` cargan los datos de la competición asignada; si no hay selección previa, se auto-selecciona la primera competición disponible.
- Los cierres de las reglas de negocio están en las secciones correspondientes (II-B…II-H) y en `RESULTADOS.md`.

## 6. Datos / DTOs

- `Competition`: `id`, `name`, `description`, `competition_type` (`code`/`name`), `status` (`code`/`name`), `affiliation` (`id`, `name`, `city`, `state`, `country`), `location` (`id`, `name`, `address`, `city`, `state`, `country`, `latitude`, `longitude`), `year`, `start_date`, `end_date`, `slug`.
  - **`latitude`/`longitude` del backend pueden llegar como `string` o `null`** (ej. `"19.826473"`, `"-90.524499"`). El componente de mapa debe coaccionar con `Number()` y mostrar el estado vacío "Mapa no disponible" solo si no hay coordenadas válidas.
- `EnabledCompetitionCategory` (categoría habilitada): `id`, `competition`, `competition_category`, `finalist_slots` (cuántos clasifican a la Final; `0` = sin Final). **`finalist_slots` ya NO vive en `Competition`** (se movió por pedido del usuario).
- `Leaderboard`: `category` + `entries[]` (`rank`, `competitor_id`, `display_name`, `final_score`, `event_ranks[]`, `event_scores[]`, `event_results[]`).
  - `event_results[]`: **objetos por WOD** (`event_id`, `event_number`, `event_name`, `phase`, `result`, `event_rank`, `score`). `result` es el tiempo (ej. `"03:20"`) o reps (ej. `"150"`); `event_rank`/`score` pueden ser `null` (fase sin dato). `event_ranks`/`event_scores` ya existen en el payload.
- Leaderboard unificado: por categoría, entradas combinadas con referencias `qualifier`/`final` y `total_score = puntos qualifier + puntos final` (modelo aditivo).
- `WODs` (Eventos oficiales): `id`, `competition`, `phase` (`QUALIFIER`/`FINAL`), `event_number`, `name`, `workout`, `description`, `is_ascending`, `is_active`. **No existe `competition_stage`** (el modelo fue eliminado; los eventos cuelgan directo de `competition` + `phase`).
- Nota: el API referencia competiciones por **`id`** (los leaderboards usan `competition_id`); el `slug` existe en el modelo pero el backend resuelve slug e id en `GET /competitions/{slug|id}/`.
- Transformaciones/mocks: **sin mocks en producción**; fixtures de test en `tests/fixtures.ts` (Vitest), p. ej. `makeCompetition`, `makeLeaderboard`, `makeEventResult`.

## 7. Endpoints del API utilizados

> Estado real del backend: **solo `leaderboards` son públicos (AllowAny)**. El resto exige JWT por defecto → decisión pendiente en Observaciones (sección 12).

| Acción | Método | URL | Auth | Notas |
|--------|--------|-----|------|-------|
| Listar competiciones / detalle | GET | `/api/v1/competitions/` y `/api/v1/competitions/{id}/` | Pública pendiente (hoy JWT) | Filtros: `competition_type`, `status`; búsqueda por nombre |
| Categorías habilitadas de una competición | GET | `/api/v1/enabled-competition-categories/?competition={id}` | Pública pendiente (hoy JWT) | Incluye `finalist_slots` por categoría |
| Eventos/WODs de una competición | GET | `/api/v1/events/?competition={id}&phase=QUALIFIER` (o `FINAL`) | Pública pendiente (hoy JWT) | Filtros: `competition`, `phase`. Campos: `event_number`, `name`, `workout`, `is_ascending`, `is_active`. Ya **no** existe `competition_stage` |
| Leaderboard qualifier | GET | `/api/v1/leaderboards/competition/{id}/qualifier/` | **Pública** | Permite ver filtros/categorías del payload |
| Leaderboard final | GET | `/api/v1/leaderboards/competition/{id}/final/` | **Pública** | Igual que qualifier |

### Endpoints de escritura — Eventos

| Acción | Método | URL | Auth | Notas |
|--------|--------|-----|------|-------|
| Crear evento | POST | `/api/v1/events/` | JWT | Payload: `{ competition: number, phase: 'QUALIFIER' | 'FINAL', event_number: number, name: string, workout: string, description?: string, is_ascending: boolean, is_active: boolean }` |
| Actualizar evento | PATCH | `/api/v1/events/{id}/` | JWT | Mismo payload (campos parciales) |
| Eliminar evento | DELETE | `/api/v1/events/{id}/` | JWT | — |
| Obtener evento | GET | `/api/v1/events/{id}/` | JWT | — |

> Un evento se asocia **directamente a la competición** por `competition` + `phase` (Qualifier/Final); **no existe** `competition_stage` (el modelo fue eliminado).

### Endpoints de escritura — Equipos

| Acción | Método | URL | Auth | Notas |
|--------|--------|-----|------|-------|
| Crear equipo | POST | `/api/v1/teams/` | JWT | Payload global (sin `competition`, Parte II-G): `{ name: string, affiliation?: number }` |
| Actualizar equipo | PATCH | `/api/v1/teams/{id}/` | JWT | `{ name?: string, affiliation?: number }` |
| Eliminar equipo | DELETE | `/api/v1/teams/{id}/` | JWT | — |
| Obtener equipo | GET | `/api/v1/teams/{id}/` | JWT | — |

> Desde la **Parte II-G** los equipos son un **catálogo global** (espejo de atletas): no pertenecen a una competición (`Team.competition` fue eliminada); la competición de una inscripción queda representada solo en `Competitor`.

### Catálogos

| Acción | Método | URL | Auth |
|--------|--------|-----|------|
| Tipos de competición | GET | `/api/v1/competition-types/` | JWT |
| Estados de competición | GET | `/api/v1/status-competitions/` | JWT |
| Filiações | GET | `/api/v1/affiliations/` | JWT |
| Sedes/locations | GET | `/api/v1/locations/` | JWT |

## 8. Cambios en componentes / estructura

- Nuevos (públicos, solo lectura):
  - `HomeIndex` (página `/`): pestañas Recientes/Todas + filtros de lista.
  - `CompetitionDetail` (página detalle): info general + mapa + WODs + leaderboards.
  - Componentes auxiliares: `CompetitionCard`, `Tabs`, `StatusBadge`, `CombinedLeaderboardTable` (leaderboard unificado Qualifier+Final), `LeaderboardFilters`, `WodList`, `LocationMap` (embed OSM gratuito), `EmptyState`.
  - `CombinedLeaderboardTable`: cabecera 2 filas (`Pos. | Atleta | Qualifier | Final | Total`, cada fase agrupa sus columnas `Score N`). Cada celda de WOD muestra **puesto + puntos + time/reps** (ej. `1st · 100 pts` y debajo `03:20`): ordinal en inglés (`1st/2nd/3rd…`), colores top-3 (1º dorado, 2º plata, 3º bronce), y `-` cuando no hay datos en esa fase.
  - **Medallas por WOD (SVG propio, sin emojis):** en cada celda de WOD del ganador del evento (top-3 del `event_rank`) se muestra un icono de medalla **oro / plata / bronce** junto al puntaje (`MedalIcon` con colores `#F6C14E`/`#D7DCE2`/`#E0A36A`). Son SVGs propios gratuitos, no emojis ni librerías externas.
- `api/`: cliente HTTP con endpoints de lectura pública y base URL por entorno (`VITE_API_URL`).
- Panel `/admin`: no cambia en esta iteración (queda protegido con `RoleGuard`).
- Pos. / Atleta / Score N qual/final / Total **ordenables** (asc/desc) en cliente desde la Parte II-H.
- Hook/stores/utils existentes: `useCompetitions`, `useCompetition`, `useEvents`, `useLeaderboards`/`useLeaderboard`, `useEnabledCompetitionCategories`, `useCompetitors`, `useCompetitionCategories`; stores `authStore` (Zustand persist) y `adminScopeStore`; `src/utils/`: `cn`, `format`, `categoryCounts`, `leaderboard`, `sortFilter`.

## 9. Cambios en documentación

- `Process.md`: registrar avances.
- `RESULTADOS.md`: registrar el resultado y las verificaciones.
- `PLAN.md`: documento de planificación (estado y pasos) — se actualiza al cerrar cada parte.

## 10. Pruebas requeridas

| Test | Escenario | Resultado esperado |
|------|-----------|--------------------|
| Inicio público sin sesión | Cargar `/` sin token | Muestra recientes + pestaña "todas" |
| Detalle competición | Ver detalle sin login | Info general, afiliación creadora, fechas, mapa, WODs y leaderboard |
| Filtros de leaderboard | Cambiar etapa/categoría | Se reflejan en la tabla (qualifier/final y categorías del payload) |
| Leaderboard celda enriquecida | Ver una celda de WOD | Muestra puesto + puntos + time/reps (ej. `1st · 100 pts` + `03:20`), con top-3 resaltado |
| No clasificado | Atleta en qualifier sin final | Muestra `-` en los WODs/scores de Final y en Total |
| Acceso admin sin sesión | Ir a `/admin/*` sin token | Redirige a login |
| Estados vacíos | Competición sin WODs/leaderboard | Estado vacío claro, sin romper la página |
| Responsive | Móvil/tablet/desktop | Layout correcto en los tres breakpoints |

(incluir: tests de componentes, e2e si aplica, y verificación manual contra el backend real)

## 11. Criterios de aceptación

Checklist verificable al terminar:

- `npm run build` sin errores
- `npm run lint` sin errores
- `npm run typecheck` sin errores
- Suite de tests en verde
- `/` consultable **sin login** muestra competiciones (recientes + todas).
- Detalle muestra información general, afiliación (dueño/creador), fechas, mapa, WODs y leaderboard.
- Filtros de leaderboard (etapa/categoría) funcionan.
- `/admin/*` protegido (redirige a login sin sesión).
- Solo español, tema claro.
- No se tocó el backend desde el frontend (los cambios `Event`→`competition`+`phase`, `finalist_slots` por categoría y `event_results[]` los aplica el usuario manualmente).

## 12. Observaciones / riesgos

- **Públicos sin token (RESUELTO en frontend):** las páginas públicas llaman a los endpoints de lectura con `auth: false` (`src/api/public.ts`). Si el backend filtra competiciones por usuario autenticado (`get_queryset()`), el JWT **nunca** se adjunta en `/` ni en el detalle → se ven **todas las competiciones publicadas** sin importar el login.
- **Admin scope (RESUELTO en frontend):** `CompetitionScopeSelect` auto-selecciona la primera competición si no hay selección previa (`useEffect` → `adminScopeStore.setCompetitionId`). Con ello `/admin/events` y `/admin/teams` cargan los datos de la competición asignada en vez de mostrar estados vacíos.
- **DECISIÓN PENDIENTE (aplazada — se resuelve en otro momento):** el backend solo expone `leaderboards` con `AllowAny`; `competitions`, `enabled-competition-categories` y `events` requieren JWT por defecto. Para que `/` y el detalle sean consultables sin login hace falta o bien (a) abrir esos GET al público (cambio backend), o (b) exigir login también en las páginas públicas. **No implementar esta iteración; pendiente de decisión posterior.** Hasta entonces la spec asume acceso con JWT.
- Mapa (DECISIÓN: **Google Maps legacy embed, sin API key**): se usa `https://maps.google.com/maps?q=LAT,LNG&z=16&output=embed` con `latitude`/`longitude` de `Location`. Sin Google Cloud, sin key, sin billing. **Coordenadas coaccionadas a número**: el backend puede devolverlas como strings o `null`; si no hay coordendas válidas → "Mapa no disponible".
  - **`q=LAT,LNG`** centra el mapa y coloca el marker en las coords; **`z=16`** fija el zoom (nivel de cuadra/calle, ajustable en la constante `TARGET_ZOOM` de `LocationMap.tsx`); **`output=embed`** genera el iframe.
  - Riesgo: es un endpoint **no oficial de Google** (sin soporte ni SLA); si dejara de funcionar, migrar a la **Maps Embed API oficial** (`google.com/maps/embed/v1/place?key=...&q=...`, gratis e ilimitada pero requiere API key restringida por referrer en `VITE_GOOGLE_MAPS_KEY`).
- El API referencia competiciones por `id` (no por `slug`), aunque el modelo tenga `slug`: usar rutas por id o plantear cambio a lookup por slug en el backend.
- Estados vacíos: definir qué se muestra cuando una competición no tiene WODs, leaderboard o está en `DRAFT`/`CANCELLED` (público probablemente solo `PUBLISHED`/`FINISHED`).
- **Cambio de fases/etapas → competition + phase (RESUELTO en backend, usuario):** el modelo `CompetitionStage` fue eliminado; `Event` cuelga directo de `Competition` con `phase` (`QUALIFIER`/`FINAL`). `EnabledCompetitionCategory.finalist_slots` define cuántos pasan a la Final por categoría. Los endpoints `/api/v1/competition-stages/` y los filtros `competition_stage*` **ya no existen**; usar `/api/v1/events/?competition={id}&phase=...`.
- **`event_results[]` ya en el payload (RESUELTO en backend, usuario):** el serializer del leaderboard devuelve por WOD un objeto `{event_id, event_number, event_name, phase, result, event_rank, score}`. El frontend lo consume directo; si un campo no llega, se renderiza `-`.
- **Ordinales en inglés y top-3 (decisión de UI):** puesto por WOD como `1st/2nd/3rd…` (inglés) con los 3 primeros resaltados (dorado/plata/bronce).

---

# Parte II-G — Equipos globales (catálogo al estilo Atletas)

## 1. Título

Los **equipos dejan de pertenecer a una competición**: pasan a ser un **catálogo
global como `Athlete`**. La competición de una inscripción queda representada
**solo en `Competitor`** (que ya la guarda). Elimina la redundancia actual
`Team.competition` + `Competitor.competition`.

## 2. Objetivo

`Team` es una entidad que existe **una vez** y se inscribe en varias competiciones.
Hoy el modelo la duplica (`Team.competition` obligatoria). La Parte II-G:

1. **Elimina la FK `Team.competition`** en el backend (`participants`).
2. Convierte **`TeamViewSet` en espejo de `AthleteViewSet`** (global, sin guard de
   competición, permisos `(IsAuthenticated,)`).
3. Refleja el cambio en el admin: **`/admin/teams` deja de estar por scope** y el
   select de **Equipo** en Competidores trae **todos** los equipos.

## 3. Alcance

**Se implementa (esta iteración SÍ toca el backend, aprobado por el usuario):**

Backend (`leader\Scorely`):
- `participants.models.Team`: quitar `competition` (FK obligatoria,
  `CASCADE`, `related_name='teams'`).
- `participants.serializers.TeamSerializer`: fields = `(id, name, affiliation)`.
- `participants.views.TeamViewSet`: `(IsAuthenticated,)`, queryset global,
  `search_fields = ('name',)`, `filterset_fields = ('affiliation',)`; eliminar
  `get_queryset()` (filtro por `visible_competitions_q`) y el `create()` con guard.
  Limpiar imports sin uso (`PermissionDenied`, `IsCompetitionAdmin`,
  `visible_competitions_q`).
- `participants.admin.TeamAdmin`: sin `competition`.
- Migración `participants/0003_remove_team_competition*` (**se genera, no se
  aplica**: la BD la migra el usuario; los tests usan `--nomigrations`).
- `users.management.commands.seed_data.create_team()`: equipos **globales**
  (sin `competition`).
- Tests: `conftest.team` sin competición; bloque de equipos en
  `test_permissions.py` reescrito al modelo global (espejo de atletas).

Frontend (`Scorely-frontend`):
- `src/types/index.ts`: `Team` y `TeamWritePayload` **sin `competition`**.
- `src/api/admin.ts`: `fetchTeams()` global (`/teams/?page_size=100`).
- `src/hooks/useAdminModules.ts`: `useAdminTeams()` y mutaciones sin
  `competitionId` (invalidan `["admin","teams"]`).
- `src/pages/admin/TeamsPage.tsx` y `TeamFormPage.tsx`: **espejo de
  `AthletesPage`/`AthleteFormPage`** (sin `CompetitionScopeSelect`, sin columna
  "Competición", sin gate de scope; botón "Nuevo equipo" siempre habilitado).
- `src/pages/admin/CompetitorsPage.tsx` y `CompetitorFormPage.tsx`: equipos
  globales (`useAdminTeams()`); las **categorías habilitadas siguen por
  competición** (`useAdminEnabledCategories`).

**No se toca** (salvo verificación): `Competitor` (ya guarda `competition`),
`events`, `rankings`, `scoring` (no usan `Team.competition`).

## 4. Endpoints (antes → después)

| Acción | Método | URL | Auth | Antes | Después |
|--------|--------|-----|------|-------|---------|
| Listar equipos | GET | `/api/v1/teams/` | JWT | `/teams/?competition={id}` (filtrado por rol/competición) | Global: `/teams/?page_size=100` |
| Detalle | GET | `/api/v1/teams/{id}/` | JWT | Modelo con `competition` | Modelo sin `competition` |
| Alta | POST | `/api/v1/teams/` | **JWT (cualquier autenticado)** | Requería `competition` + `IsCompetitionAdmin` | Payload `{ name }` (afiliación opcional) |
| Edición | PATCH | `/api/v1/teams/{id}/` | JWT | Con `competition` | Sin `competition` |
| Baja | DELETE | `/api/v1/teams/{id}/` | JWT | — | — |

## 5. Datos / DTOs

- `Team` (frontend): `{ id, name, affiliation?: number | null }` (sin `competition`).
- `TeamWritePayload` (frontend): `{ id?, name }`.
- `Competitor`/`CompetitorWritePayload` **no cambian** (ya llevan `competition`,
  `team`).

## 6. Cambios en componentes / estructura

Ver §2. La UI sigue siendo idioma español, tema claro, patrones TailAdmin.

## 7. Pruebas requeridas

| Test | Escenario | Resultado esperado |
|------|-----------|--------------------|
| Backend API | `GET /teams/` autenticado | Ve **todos** los equipos (global) |
| Backend API | `POST /teams/` `{name}` autenticado | **201** sin `competition` |
| Backend modelo | `Team.objects.create(name=...)` | OK sin competición |
| Frontend `TeamsPage` | `/admin/teams` | Lista global, sin selector ni columna Competición |
| Frontend `CompetitorFormPage` | Alta Equipo | El select de Equipo trae **todos** los equipos |
| Frontend admin API | `fetchTeams()` | `request("/teams/?page_size=100")` (JWT, sin `{auth:false}`) |

## 8. Observaciones / riesgos

- **Destructivo**: se elimina la FK `Team.competition`; la relación histórica
  equipo→competición que no pasa por `Competitor` se pierde (aceptado).
- **Permisos**: con el espejo de atletas, cualquier usuario autenticado puede
  crear/editar/borrar equipos globales (igual que atletas hoy).
- **Roster `TeamMember`**: el endpoint `/team-members/` existe en backend, pero no
  hay UI de admin para gestionar integrantes (follow-up sugerido, fuera de alcance).
- **Competidor sigue sin guard por competición** (`CompetitorViewSet`):
  el aviso de la Parte II-F sigue vigente; `TeamViewSet` ya no sirve como patrón
  de referencia de guard.

---

# Parte II-H — Filtros de búsqueda y ordenamiento (admin + leaderboard)

## 1. Título

Filtros de **búsqueda por nombre** y **ordenamiento asc/desc** en las tablas del panel admin (**Competiciones, Filiaciones, Sedes, Atletas y Equipos**) y **ordenamiento** (sin búsqueda) en el **leaderboard público** (`CombinedLeaderboardTable`).

## 2. Objetivo

- **Admin (5 tablas)**: poder **buscar por nombre** y **ordenar por la columna Nombre** (asc/desc al clickear el header) en:
  - `/admin/competitions` → `CompetitionsPage`
  - `/admin/affiliations` → `AffiliationsPage`
  - `/admin/sedes` → `LocationsPage`
  - `/admin/athletes` → `AthletesPage`
  - `/admin/teams` → `TeamsPage`
- **Leaderboard público**: en `CombinedLeaderboardTable` (detalle de competición), **todas las columnas son ordenables** al clickear su header — `Pos.`, `Atleta`, cada columna `Score N` de Qualifier/Final y `Total` — asc/desc. **Sin búsqueda de texto.**
- **Todo en cliente**: filtrar/ordenar el array ya cargado (los listados admin usan `page_size=100`). **Sin cambios de backend** (no se envían `search`/`ordering` como query params).

## 3. Alcance

**Incluye:**
- Input de búsqueda (placeholder p. ej. "Buscar por nombre…") sobre la tabla en las 5 páginas admin; filtra **case-insensitive** y sin acentos (normalizar con `String.prototype.normalize("NFD")` + quitar diacríticos, o `localeCompare` con `sensitivity: "base"`), sobre:
  - `Competition.name`
  - `Affiliation.name`
  - `Location.name`
  - `Athlete`: `first_name` + `last_name` (concatenados)
  - `Team.name`
- Ordenamiento **solo de la columna nombre** en esas 5 tablas: clic en el header alterna **asc → desc**; indicador visual (flecha ▲/▼ o caret, estilo TailAdmin); orden alfabético `localeCompare("es")`.
- **Default**: orden por nombre asc en las 5 tablas admin (donde hoy no hay otro orden activo; `TeamsPage` ya ordena por nombre — se conserva y pasa a ser controlado por el estado de orden).
- Búsqueda vacía → lista completa; sin resultados → `EmptyState` de "sin coincidencias" (o el `EmptyState` existente adaptado), sin romper la página.
- **Leaderboard**: estado de orden por columna (`columnKey` + `direction`) aplicado **después** del filtro de categoría existente (`LeaderboardFilters`); default = orden por defecto actual (`rank`/posición, sin reordenar). Tipos de orden por columna:
  - `Pos.` → numérico (`rank` / posición en la tabla combinada).
  - `Atleta` → alfabético (`display_name`, `localeCompare("es")`).
  - `Score N` / `Total` → numérico; las celdas `-` (sin datos) van **siempre al final** en ambos sentidos.
- Cada clic en un header alterna asc/desc; clic en una columna distinta la toma como activa (una sola columna ordena a la vez).

**Excluye:**
- **No** se agrega búsqueda ni orden en `HomeIndex` público ni en `CompetitorsPage`/`CategoriesPage`/`CompetitionCategoriesPage`/`EventsPage` (fuera de este pedido).
- **No** se toca el backend: no se usan los `search_fields`/`ordering` de DRF; todo es filtrado/orden en el cliente sobre los datos ya cargados.
- **No** se modifica la lógica de calificación/total del leaderboard (el orden es solo de presentación; `total_score` y `rank` no se recalculan).
- No tocar la carpeta clon de TailAdmin, no crear ramas ni git.

## 4. Endpoints del API utilizados

| Acción | Método | URL | Auth | Notas |
|--------|--------|-----|------|-------|
| Listados admin (ya existentes) | GET | `/competitions/`, `/affiliations/`, `/locations/`, `/athletes/`, `/teams/` (todos con `page_size=100`) | JWT | Sin cambios: la búsqueda/orden es **en cliente** sobre la respuesta |
| Leaderboards (ya existentes) | GET | `/api/v1/leaderboards/competition/{id}/qualifier/` y `/final/` | **Pública** | Sin cambios: el orden se aplica en cliente sobre `CombinedLeaderboard` |

> Ningún endpoint nuevo ni parámetro nuevo de query.

## 5. Datos / DTOs

- Sin nuevos DTOs. Trabajamos con los tipos existentes: `Competition`, `Affiliation`, `Location`, `Athlete`, `Team`, `CombinedLeaderboard` / `CombinedLeaderboardEntry`.
- Estado local (useState o util puro) de las páginas admin: `search: string` y `sortDir: "asc" | "desc"`.
- Estado local del leaderboard: `sort: { columnKey: string; direction: "asc" | "desc" } | null` (`null` = orden por defecto).

## 6. Cambios en componentes / estructura

- **Helper compartido** (nuevo): `src/utils/sortFilter.ts` (o similar, patrón `utils/leaderboard.ts`):
  - `normalizeText(value: string): string` — lowercase + sin acentos.
  - `filterByName<T>(items, query, getName: (item: T) => string): T[]`.
  - `sortByName<T>(items, dir, getName): T[]` — `localeCompare("es")`.
  - Reutilizado por las 5 páginas admin (sin duplicar lógica).
- **Input de búsqueda** en cada una de las 5 páginas admin (sobre la tabla, estilo TailAdmin, junto al botón de alta o arriba de la tabla): `value`/`onChange` en estado local; filtrado antes del render (y después del orden existente de la página).
- **Header ordenable**: las 5 tablas admin — solo el `<th>` de Nombre recibe `onClick` + indicador de dirección + `aria-sort`.
- **`CombinedLeaderboardTable.tsx`**: todos los `<th>` ordenables (Pos., Atleta, Score N Qualifier, Score N Final, Total); `onSort(columnKey)` alterna dirección; las filas se reordenan en cliente respetando el filtro de categoría vigente; celdas `-` al final.
- `CompetitionDetail.tsx`: sin cambios de datos; solo fluye el estado de orden dentro de `CombinedLeaderboardTable` (estado puede vivir dentro del propio componente).
- Tests (ver §7).

## 7. Pruebas requeridas

| Test | Escenario | Resultado esperado |
|------|-----------|--------------------|
| Búsqueda admin | Escribir en el input de `/admin/competitions` | Solo quedan filas cuyo nombre coincide (case-insensitive/sin acentos) |
| Búsqueda vacía/sin coincidencias | Query vacío / query sin match | Lista completa / `EmptyState` de sin coincidencias |
| Búsqueda atletas | Buscar por apellido en `/admin/athletes` | Filtra sobre `first_name + last_name` |
| Orden admin | Clic en header "Nombre" | Alterna asc ↔ desc con `localeCompare("es")`; indicador visible |
| Orden default | Render inicial de las 5 tablas | Nombre asc |
| Orden leaderboard numérico | Clic en "Pos." y en "Total" | Filas reordenadas numéricamente asc/desc |
| Orden leaderboard alfabético | Clic en "Atleta" | Orden alfabético es |
| Leaderboard `-` al final | Ordenar Score N con celdas sin datos | Las filas `-` quedan al final en ambos sentidos |
| Filtro categoría + orden | Cambiar categoría y luego ordenar | El orden se aplica dentro de la categoría filtrada |
| Sin regresiones | Suite completa | Todo en verde |

## 8. Observaciones / riesgos

- **Cliente sobre `page_size=100`**: si un listado supera 100 registros, la búsqueda/orden solo alcanza lo cargado. Si en el futuro hace falta, migrar a `?search=`/`?ordering=` del backend (los viewsets ya declaran `search_fields` en su mayoría) — **fuera de esta iteración**.
- **Acentos y mayúsculas**: normalizar antes de comparar para que "felipe" encuentre "Felipe" y "sede" encuentre "Sedé" si aplicara; cubrirlo con tests.
- **Perfomance**: listados ≤ 100 filas → filtrar/ordenar en cada render es despreciable; no hace falta `useMemo` obligatorio, pero se puede usar si conviene.
- **Leaderboard**: el orden es **solo visual**; no altera `rank`, `total_score` ni la clasificación oficial. Reordenar no debe romper las medallas por WOD ni el resaltado top-3 (la celda conserva sus datos; solo cambia el orden de las filas).
- **Accesibilidad**: headers ordenables con `aria-sort` y cursor pointer; el input de búsqueda con `<label>` o `aria-label`.
- **Consistencia visual**: replicar el estilo de input/header de TailAdmin (código propio), no引入 librerías nuevas de tablas.

---

# Parte III — Flujo de trabajo del agente

1. **Leer antes de tocar:** revisar `Process.md`, `RESULTADOS.md` y el código existente (componentes, API client, stores, convenciones de estilo). No asumir convenciones: verificarlas en el código.
2. **Confirmar la especificación:** si la Parte II tiene ambigüedades o faltan endpoints, hacer preguntas al usuario antes de implementar.
3. **Implementar** siguiendo los patrones existentes (nombres, estructura de carpetas, manejo de estados de carga/error, estilos).
4. **Escribir/actualizar pruebas** y ejecutar la suite completa + lint + typecheck + build.
5. **Verificar manualmente** los escenarios de la Parte II (sección 10) contra el backend si está disponible.
6. **NO ejecutar** comandos del backend. Informar al usuario qué endpoints necesita en caso de bloqueo o dependencia.
7. **Documentar:** registrar avances en `Process.md` y, si corresponde, actualizar `RESULTADOS.md` y el resto de la Parte II (sección 9).
8. **Reportar** un resumen final: qué se cambió, cómo se verificó, y los pasos manuales pendientes del usuario.


# RESTRICCIONES
- No crear ramas
- no hacer push
- no subir a git