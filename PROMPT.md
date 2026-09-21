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
- `[COMPLETAR: convención de nombres de componentes/archivos, p.ej.: PascalCase, kebab-case]`
- `[COMPLETAR: patrón de carpetas y exports (default vs named)]`
- `[COMPLETAR: cómo se manejan los estilos: tema, tokens, dark mode]`
- `[COMPLETAR: manejo de errores y estados de carga estándar de la app]`
- `[COMPLETAR: internacionalización (i18n) sí/no y cómo]`

## API backend (SPA separada: CORS + JWT)

- Frontend en origen distinto → el backend expone los endpoints con **CORS** (configurar `CORS_ALLOWED_ORIGINS` en Django con el origen del frontend).
- Documentación generada por drf-spectacular (Swagger/OpenAPI).
- Autenticación JWT: `POST /api/v1/auth/token/` (access+refresh) y `POST /api/v1/auth/token/refresh/`.
- Flujo de tokens en el cliente: guardar tokens (p.ej. `localStorage`/memoria), cliente HTTP con **interceptor que ante HTTP 401 hace refresh y reintenta** la petición; si el refresh falla → logout/redirección a login.
- Leaderboards: **públicos**, sin token.
- Áreas de administración: requieren token y permisos (superadmin / admin de competición). El **rol vive en la respuesta de login/perfil**; `<RoleGuard>` protege las rutas `/admin/*`.

**Reglas:** definir todos los endpoints que la actualización necesita en la Parte II (sección 7). No inventar endpoints: si falta alguno en el backend, **avisar** al usuario en lugar de mockear silenciosamente (o documentar el mock como temporal).

## Entorno / comandos de verificación (`[COMPLETAR]`)

```bash
[COMPLETAR install]: # p.ej. npm install / pnpm install
[COMPLETAR dev]:     # p.ej. npm run dev
[COMPLETAR build]:   # p.ej. npm run build
[COMPLETAR lint]:    # p.ej. npm run lint
[COMPLETAR test]:    # p.ej. npm run test
[COMPLETAR typecheck]: # p.ej. npx tsc --noEmit
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

# Parte II — Plantilla de especificación de la actualización

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

- `[COMPLETAR wireframe/maqueta o referencia (URL o imagen del diseño)]`
- Variable: `[COMPLETAR responsive: móvil / tablet / desktop]`
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
- `[COMPLETAR …]`

## 6. Datos / DTOs

- `Competition`: `id`, `name`, `description`, `competition_type` (`code`/`name`), `status` (`code`/`name`), `affiliation` (`id`, `name`, `city`, `state`, `country`), `location` (`id`, `name`, `address`, `city`, `state`, `country`, `latitude`, `longitude`), `year`, `start_date`, `end_date`, `slug`.
  - **`latitude`/`longitude` del backend pueden llegar como `string` o `null`** (ej. `"19.826473"`, `"-90.524499"`). El componente de mapa debe coaccionar con `Number()` y mostrar el estado vacío "Mapa no disponible" solo si no hay coordenadas válidas.
- `EnabledCompetitionCategory` (categoría habilitada): `id`, `competition`, `competition_category`, `finalist_slots` (cuántos clasifican a la Final; `0` = sin Final). **`finalist_slots` ya NO vive en `Competition`** (se movió por pedido del usuario).
- `Leaderboard`: `category` + `entries[]` (`rank`, `competitor_id`, `display_name`, `final_score`, `event_ranks[]`, `event_scores[]`, `event_results[]`).
  - `event_results[]`: **objetos por WOD** (`event_id`, `event_number`, `event_name`, `phase`, `result`, `event_rank`, `score`). `result` es el tiempo (ej. `"03:20"`) o reps (ej. `"150"`); `event_rank`/`score` pueden ser `null` (fase sin dato). `event_ranks`/`event_scores` ya existen en el payload.
- Leaderboard unificado: por categoría, entradas combinadas con referencias `qualifier`/`final` y `total_score = puntos qualifier + puntos final` (modelo aditivo).
- `WODs` (Eventos oficiales): `id`, `competition`, `phase` (`QUALIFIER`/`FINAL`), `event_number`, `name`, `workout`, `description`, `is_ascending`, `is_active`. **No existe `competition_stage`** (el modelo fue eliminado; los eventos cuelgan directo de `competition` + `phase`).
- Nota: el API referencia competiciones por **`id`** (los leaderboards usan `competition_id`); el `slug` existe en el modelo pero no es lookup del API.
- `[COMPLETAR transformaciones/mocks de prueba]`

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
| Crear equipo | POST | `/api/v1/teams/` | JWT | Payload: `{ name: string, competition: number }` |
| Actualizar equipo | PATCH | `/api/v1/teams/{id}/` | JWT | `{ name?: string }` |
| Eliminar equipo | DELETE | `/api/v1/teams/{id}/` | JWT | — |
| Obtener equipo | GET | `/api/v1/teams/{id}/` | JWT | — |

> Un equipo se asocia directamente a una **competición** por su `id` (`competition`).

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
- `[COMPLETAR hooks/stores/utils adicionales]`

## 9. Cambios en documentación

- `Process.md`: registrar avances.
- `RESULTADOS.md`: registrar el resultado y las verificaciones.
- `[COMPLETAR otra documentación: README, changelog…]`

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

- `[COMPLETAR comando build]` sin errores
- `[COMPLETAR comando lint]` sin errores
- `[COMPLETAR comando typecheck]` sin errores
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