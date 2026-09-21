# PLAN — Ejecución de `PROMPT.md` (Scorely Frontend) — Módulo admin "Sedes"

> **Documento de planificación, no ejecuta cambios.** Describe, paso a paso,
> cómo implementar la indicación de `PROMPT.md` para el **módulo admin de
> Sedes/Locations** (`Parte II-D`) sobre `Scorely-frontend/`, indicando el
> **estado actual** de cada parte y detallando el trabajo **pendiente**.
>
> Fecha: 2026-09-21
> Estado: ✅ **COMPLETADO** — Pasos 0–10 ejecutados sobre el código y verificados
> (lint/typecheck/test/build → 80/80; ver `Process.md` Paso 26 y `RESULTADOS.md`).

---

## 0. Alcance del plan

`PROMPT.md` especifica varias actualizaciones del frontend. Estado actual:

| Sección                                    | Módulo | Estado |
|--------------------------------------------|--------|--------|
| **Parte II** — Pantalla pública            | Público (`/`, `/competitions/:slug/`, leaderboards) | ✅ **COMPLETADO** (ver `Process.md` Pasos 0–24 y `RESULTADOS.md`; commits `0565eb1`…`bf7d27f`) |
| **Parte II-B** — Categorías disponibles    | Admin (`/admin/categories` + `/admin/competition-categories`) | ✅ **COMPLETADO** | 
| **Parte II-C** — Filiaciones (`Affiliation`) | Admin (`/admin/affiliations`) | ✅ **COMPLETADO** (ver `Process.md` Paso 25 y `RESULTADOS.md` iteración 2026-09-21; suite 70/70) |
| **Parte II-D** — Sedes (`Location`)        | Admin (`/admin/sedes`) | ✅ **COMPLETADO** (ver `Process.md` Paso 26 y `RESULTADOS.md` iteración 2026-09-21; suite 80/80) |

Este plan:
1. Documenta el **estado alcanzado** de las partes ya implementadas (para no rehacerlas).
2. **Paso 0:** especifica escribir la **Parte II-D en `PROMPT.md`** (hoy el archivo
   NO la contiene — pedido previo del usuario: "actualiza @PROMPT.md agrega la
   administración de location").
3. Detalla **paso a paso** la implementación de la Parte II-D (módulo admin de
   sedes), replicando el patrón ya probado de Filiaciones (Parte II-C).
4. Incluye los pasos de **verificación** completos (lint/typecheck/test/build).

### Regla clave repetida de `PROMPT.md` / decisiones del usuario
- **Quién crea/edita/elimina sedes = superadmin** (`user.is_superuser`). El admin
  de competición **NO** accede a `/admin/sedes`. La restricción se implementa
  **en frontend** (ocultar menú + guard de escritura) porque el backend hoy
  expone `locations/` con permiso global (`IsAuthenticated`). **Avisar al
  usuario** de que el backend debería restringir la escritura a superadmin.
- Decisiones tomadas por el usuario (2026-09-21):
  - Ruta del módulo: **`/admin/sedes`** (etiqueta en menú: **"Sedes"**).
  - Alcance: **solo CRUD** (igual a Filiaciones). **NO** incluir en esta
    iteración el "control" de ciudad/estado/país (sugerencias de valores).

---

## 1. Estado actual (análisis del repositorio, verificado en el código)

### Backend `Location` (shape verificado — `leader\Scorely`, solo lectura)
- `apps/competitions/models.py:30-43`: `name` (CharField 200, requerido),
  `address` (CharField 300, requerido), `city`/`state`/`country` (CharField 100,
  requeridos), `latitude`/`longitude` (Decimal 9,6, **null/blank**).
- `apps/competitions/serializers.py:19-22`: `LocationSerializer` expone
  `(id, name, address, city, state, country, latitude, longitude)`.
- `apps/competitions/views.py:32-36`: `LocationViewSet` = `ModelViewSet` con
  `search_fields=('name',)` y `filterset_fields=('city','state','country')`, sin
  `permission_classes` propios → permiso global `IsAuthenticated`
  (cualquier usuario autenticado puede escribir).
- `apps/competitions/models.py:62`: `Competition.location` es FK con
  `on_delete=PROTECT` → **borrar una sede en uso → `ProtectedError` (4xx)**.
- Seed demo (`seed_data.py`): crea sedes españolas (Madrid, Sevilla, …) como strings.

### Frontend (lo que ya existe)
- `src/types/index.ts:32-41`: tipo `Location` (`id`, `name`, `address?`, `city`,
  `state`, `country`, `latitude?: number | string | null`,
  `longitude?: number | string | null`). **NO existe** `LocationWritePayload`.
- `src/api/admin.ts:49-57`: `getAdminCatalogs()` ya hace `GET /locations/` vía
  `fetchCatalog<Location>` para el select "Sede" de `CompetitionFormPage`
  (`AdminCatalogs.locations`). **NO existen** `fetchLocation(s)`,
  `createLocation`, `updateLocation`, `deleteLocation`.
- `assertSuperUser()` ya existe en `src/api/admin.ts:43` → se reutiliza.
- No hay `src/pages/admin/LocationsPage.tsx` ni `LocationFormPage.tsx`.
- No hay ruta `/admin/sedes` en `src/App.tsx` ni ítem "Sedes" en
  `AdminSidebar.tsx`. No hay ícono de ubicación en `icons.tsx`.
- No hay fixtures ni tests de sedes.
- Patrón a replicar (Parte II-C implementada): `AffiliationsPage.tsx` +
  `AffiliationFormPage.tsx` + hooks de filiaciones
  (`useAdminModules.ts:162-200` con invalidación `["admin","affiliations"]`).

---

## 2. Parte II-D — Objetivo y reglas de negocio

| Regla de negocio | Quién | Dónde |
|-------------------|-------|-------|
| **CRUD del catálogo de sedes** (`Location`: `name`, `address`, `city`, `state`, `country`, `latitude`, `longitude`) | **Solo superadmin** | `/admin/sedes` |
| Leer sedes para selects (competencias → "Sede") | Superadmin + admin | `getAdminCatalogs` (ya existe, no cambia) |
| Borrado en uso | Backend: `PROTECT` en `Competition.location` → `ProtectedError` 4xx | Manejar error en UI con mensaje claro |

Regla clave: el admin de competición **NO** accede a `/admin/sedes`. La defensa es
**solo en frontend** (ocultar menú + `assertSuperUser()` en las escrituras de la
API). El backend no restringe por rol: **avisar al usuario**.

---

## 3. Matriz de archivos (Parte II-D)

| Archivo | Tipo | Cambio |
|---------|------|--------|
| `PROMPT.md` | Modificar | **Paso 0:** añadir la sección `Parte II-D — Módulo admin: Sedes (locations)` + rutas/refs menores |
| `src/types/index.ts` | Modificar | Añadir `LocationWritePayload` (la shape de `Location` ya existe y es correcta) |
| `src/api/admin.ts` | Modificar | `fetchLocations()`, `fetchLocation(id)`, `createLocation`, `updateLocation`, `deleteLocation` (escrituras con `assertSuperUser()`); reutilizar `fetchLocations()` dentro de `getAdminCatalogs()` |
| `src/hooks/useAdminModules.ts` | Modificar | `useAdminLocations`, `useCreateLocation`, `useUpdateLocation`, `useDeleteLocation` (invalidar `["admin","locations"]`) |
| `src/pages/admin/LocationsPage.tsx` | **Crear** | Tabla + acciones, solo superadmin (replicar `AffiliationsPage`) |
| `src/pages/admin/LocationFormPage.tsx` | **Crear** | Form create/edit react-hook-form + zod (replicar `AffiliationFormPage`) |
| `src/App.tsx` | Modificar | Rutas `/admin/sedes`, `/admin/sedes/new`, `/admin/sedes/:id/edit` |
| `src/components/admin/AdminSidebar.tsx` | Modificar | Ítem "Sedes" (solo superadmin) → `/admin/sedes` |
| `src/components/admin/icons.tsx` | Modificar | Ícono nuevo `MapPinIcon` (patrón `StrokeIcon`) |
| `tests/fixtures.ts` | Modificar | `makeLocation(overrides)` |
| `tests/adminApi.test.ts` | Modificar | Bloque "locations catalog": CRUD + bloqueo no-superadmin |
| `tests/LocationsPage.test.tsx` | **Crear** | Tests de UI (superadmin/admin, estados, borrado con error) |
| `tests/LocationFormPage.test.tsx` | **Crear** (opcional) | Tests del formulario (validación, submit) |
| `Process.md` | Modificar | Registrar avances |
| `RESULTADOS.md` | Modificar | Registrar resultado y avisos al terminar |

---

## 4. Pasos detallados (Parte II-D)

### Paso 0 — Documentar la Parte II-D en `PROMPT.md` (documentación, NO implementación)

**Qué hacer**: escribir la nueva sección `# Parte II-D — Módulo admin: Sedes (locations)`
insertada **después de la Parte II-C** (tras la línea 283, antes de
`# Parte II — Plantilla de especificación`), con la misma estructura de la II-C:

1. **1. Título**: Administración de **sedes** (`Location`), **solo superadmin**.
2. **2. Objetivo**: CRUD completo en `/admin/sedes` (name, address, city, state,
   country, latitude/longitude); admin de competición NO accede; la sede alimenta
   el select de `CompetitionFormPage` y el mapa público (`LocationMap`).
3. **3. Alcance** (Incluye/Excluye): páginas, menú, ruta protegida, guard
   `assertSuperUser()`; **Excluye**: backend, con el **aviso** ya definido
   (`LocationViewSet` = `IsAuthenticated` global).
4. **4. Endpoints del API** (shape verificado):
   | Acción | Método | URL | Auth | Rol frontend |
   |--------|--------|-----|------|-------------|
   | Listar sedes | GET | `/api/v1/locations/` | JWT | superadmin + admin (select) |
   | Obtener sede | GET | `/api/v1/locations/{id}/` | JWT | superadmin (edición) |
   | Crear sede | POST | `/api/v1/locations/` | JWT | **solo superadmin** |
   | Editar sede | PATCH | `/api/v1/locations/{id}/` | JWT | **solo superadmin** |
   | Eliminar sede | DELETE | `/api/v1/locations/{id}/` | JWT | **solo superadmin** |
5. **5. Datos / DTOs**: `Location` (existing shape) + `LocationWritePayload`
   `{ id?, name, address?, city, state, country, latitude?, longitude? }`
   (ojo: `address` es obligatorio en el backend; `latitude`/`longitude`
   opcionales y llegan como string o null).
6. **6. Cambios en componentes/estructura**: lista de la matriz del plan.
7. **7. Pruebas requeridas** (tabla escenarios).
8. **8. Observaciones / riesgos**: role-restriction solo frontend (aviso),
   `PROTECT` de `Competition.location` → mensaje de error claro, coords string/null.

Ajustes menores de coherencia en `PROMPT.md`:
- Bloque **"Rutas de la aplicación"** (`/admin`): añadir ` /admin/sedes → CRUD del
  catálogo de sedes (solo superadmin)`.
- Línea 15 (Alcance del frontend) y línea 49 (tabla "Lo que replicamos"): mencionar
  sedes (y filiaciones) junto al catálogo de categorías.
- Tabla "Catálogos" (línea 384) ya lista `Sedes/locations | GET` → verificar que
  quede apuntando a la nueva sección II-D (opcional).

**Verificación**: `PROMPT.md` contiene la Parte II-D completa y coherente; nada más cambia.

---

### Paso 1 — Verificar el shape del backend (informativo, NO ejecutar backend)

**Qué hacer**:
1. Confirmar el serializer de `Location` en `leader\Scorely` (ya verificado:
   `id, name, address, city, state, country, latitude, longitude`); obligatoriedad
   de `address` y opcionalidad de `latitude`/`longitude`.
2. Confirmar que `/api/v1/locations/{id}/` existe (GET individual) por el
   `ModelViewSet` estándar.
3. Confirmar el **DELETE en uso**: `Competition.location` es `PROTECT` →
   `ProtectedError` 4xx → condiciona el manejo de errores en la UI (Paso 8).
4. **AVISAR al usuario** (sin tocar backend) si la escritura no está restringida a
   superadmin: conviene `IsSuperAdmin` en `LocationViewSet`.

**Verificación**: anotar en `Process.md` el shape verificado. No ejecutar comandos del backend.

---

### Paso 2 — Tipos DTOs

**Archivo**: `src/types/index.ts`

**Qué hacer** (replicar patrón `AffiliationWritePayload`, junto al tipo `Location` ya existente):

```ts
export interface LocationWritePayload {
  id?: number;
  name: string;
  address?: string;
  city: string;
  state: string;
  country: string;
  latitude?: number;
  longitude?: number;
}
```

- `address`: en el backend es obligatorio; en el payload puede ir `required` o
  `optional` con aviso (decidir en el Paso 1; lo seguro: enviarlo siempre desde el form).
- `latitude`/`longitude`: números opcionales (Decimal nullable). El form los manda
  **solo si hay valor** (ver Paso 6).

**Verificación**: `npm run typecheck` no rompe usos existentes (`Location` se usa en
`getAdminCatalogs`, `Competition.location`, `LocationMap`).

---

### Paso 3 — Funciones API admin

**Archivo**: `src/api/admin.ts`

**Qué hacer** (mismo patrón que filiaciones):

```ts
export async function fetchLocations(): Promise<Location[]> {
  return fetchCatalog<Location>("/locations/?page_size=100");
}

export async function fetchLocation(id: number): Promise<Location> {
  return request<Location>(`/locations/${id}/`);
}

export async function createLocation(
  payload: LocationWritePayload,
): Promise<Location> {
  assertSuperUser();
  return request<Location>("/locations/", { method: "POST", body: JSON.stringify(payload) });
}

export async function updateLocation(
  payload: LocationWritePayload,
): Promise<Location> {
  assertSuperUser();
  return request<Location>(`/locations/${payload.id}/`, { method: "PATCH", body: JSON.stringify(payload) });
}

export async function deleteLocation(id: number): Promise<void> {
  assertSuperUser();
  await request<void>(`/locations/${id}/`, { method: "DELETE" });
}
```

- **Refactor**: hacer que `getAdminCatalogs()` use `fetchLocations()` en lugar del
  `fetchCatalog("/locations/")` inline (un solo origen del catálogo, igual que se
  hizo con `fetchAffiliations()`). El select de `CompetitionFormPage` sigue sin cambios.
- `assertSuperUser()` ya existe; las tres funciones de escritura lo usan.

**Verificación**: `npm run typecheck`. Tests de API en el Paso 9.

---

### Paso 4 — Hooks admin

**Archivo**: `src/hooks/useAdminModules.ts`

**Qué hacer** (replicar el bloque de filiaciones `useAdminModules.ts:162-200`,
con `queryKey ["admin","locations"]`):

- `useAdminLocations()` → `useQuery({ queryKey: ["admin","locations"], queryFn: fetchLocations, staleTime: 30_000 })`.
- `useCreateLocation()` / `useUpdateLocation()` / `useDeleteLocation()` → mutations
  que en `onSuccess` invalidan `["admin","locations"]`.
- Añadir `fetchLocations` a los imports existentes del archivo.

**Verificación**: `npm run typecheck`.

---

### Paso 5 — Página `LocationsPage` (catálogo, solo superadmin)

**Archivo**: `src/pages/admin/LocationsPage.tsx` (**crear**)

**Qué hacer** (replicar `AffiliationsPage.tsx` adaptando campos):
- `const isSuperUser = Boolean(useAuthStore((s) => s.user?.is_superuser));`
  Si `!isSuperUser`: breadcrumb + aviso "Solo el superusuario puede administrar las sedes." (sin acciones).
- Estados: `Spinner` ("Cargando sedes…"), `ErrorState`, `EmptyState` ("Sin sedes").
- Tabla: columnas `Nombre`, `Dirección`, `Ciudad`, `Estado/Provincia`, `País`,
  `Coordenadas` (lat, lng o `—`), `Acciones` (Editar / Eliminar).
- Botón "Nueva sede" → `/admin/sedes/new`.
- `handleDelete(id, name)`: `window.confirm` + `useDeleteLocation`; capturar
  `ApiError` y mostrar mensaje claro si el backend rechaza por estar en uso
  ("Esta sede está en uso por competiciones y no se puede eliminar.").

**Verificación**: navegación manual con superadmin (ve todo) y con admin de competición (solo aviso).

---

### Paso 6 — Form `LocationFormPage` (crear/editar)

**Archivo**: `src/pages/admin/LocationFormPage.tsx` (**crear**)

**Qué hacer** (replicar `AffiliationFormPage.tsx`):
- Schema zod: `name` (`z.string().min(1)`), `address` (requerido si el backend lo
  exige), `city`, `state`, `country` (`min(1)`); `latitude`/`longitude` opcionales numéricos:
  ```ts
  const optionalNumber = z.preprocess(
    (v) => (v === "" || v === null || Number.isNaN(v) ? undefined : Number(v)),
    z.number().optional(),
  );
  ```
  (con `valueAsNumber: true`, el input vacío da `NaN` → se convierte a `undefined`).
- Create/edit con `useCreateLocation` / `useUpdateLocation`; edición usa
  `fetchLocation(Number(id))` en `useQuery` con `enabled: isEditing` + `reset` en `useEffect`.
- Payload: `{ id?, name, address, city, state, country }` + `latitude`/`longitude`
  **solo si están definidos** (no enviar `null`).
- Control de acceso: `!isSuperUser` → aviso de sin acceso (patrón `AffiliationFormPage`).
- Capturar `ApiError` en `submit` → mostrar en `role="alert"`.

**Verificación**: crear y editar una sede como superadmin persiste (backend real);
sin coords se guarda `null`.

---

### Paso 7 — Routing + Sidebar + ícono

**Archivo**: `src/App.tsx`

**Qué hacer** (junto a las rutas de filiaciones):

```tsx
<Route path="/admin/sedes" element={<LocationsPage />} />
<Route path="/admin/sedes/new" element={<LocationFormPage />} />
<Route path="/admin/sedes/:id/edit" element={<LocationFormPage />} />
```

**Archivo**: `src/components/admin/AdminSidebar.tsx`

**Qué hacer**:
- Añadir ítem **"Sedes"** (`path: "/admin/sedes"`) al bloque `menuItems`
  **condicionado a `isSuperUser`** (mismo spread condicional que "Categorías"/"Filiaciones").
- Ícono: nuevo `MapPinIcon` en `src/components/admin/icons.tsx` (patrón `StrokeIcon`).

**Verificación**: superadmin ve "Sedes"; admin de competición no. Acceso directo a
`/admin/sedes` como no-superadmin → aviso de sin acceso (Paso 5).

---

### Paso 8 — Bloqueo por rol + manejo de borrado en uso

**Qué hacer**:
- **Guard por rol**: cubierto por `assertSuperUser()` (Paso 3) + ocultamiento en UI
  (Pasos 5–7). Verificar que no-superadmin **no** emite POST/PATCH/DELETE.
- **Borrado en uso**: `Competition.location` = `PROTECT` → `ProtectedError` 4xx.
  En `LocationsPage.handleDelete` capturar `ApiError` y mostrar el mensaje
  ("Esta sede está en uso por competiciones y no se puede eliminar.") sin romper la lista.
- **Registrar AVISO** en `Process.md`/`RESULTADOS.md`: backend no limita por rol la
  escritura de `LocationViewSet`; para una regla de negocio real conviene `IsSuperAdmin` (decisión backend, no implementar).

**Verificación**: como admin de competición no es posible crear/editar/eliminar
desde la UI ni se emiten peticiones de escritura.

---

### Paso 9 — Pruebas

**Archivos**: `tests/fixtures.ts`, `tests/adminApi.test.ts`, `tests/LocationsPage.test.tsx`,
(opcional) `tests/LocationFormPage.test.tsx`

**Qué hacer**:
- **Fixtures**: `makeLocation(overrides)` (replicar `makeAffiliation`) →
  `{ id: 1, name: "Paraná Raquet", address: "Av. Alem 123", city: "Paraná", state: "Entre Ríos", country: "Argentina", latitude: "-31.7333", longitude: "-60.5297" }`.
- **`adminApi.test.ts`** (replicar el bloque "affiliations catalog"):
  - Bloquea escrituras cuando `is_superuser: false` (`rejects.toThrow("No tenés permisos")`, `request` no llamado).
  - POST/PATCH/DELETE correctos con `is_superuser: true` (URLs y métodos: `/locations/`,
    `/locations/{id}/`).
  - `fetchLocations` (URL `/locations/?page_size=100`) y `fetchLocation(id)`.
- **`LocationsPage.test.tsx`** (replicar `AffiliationsPage.test.tsx`):
  - Superadmin: tabla con nombre/ciudad/país/coords + botón "Nueva sede".
  - No-superadmin: aviso, sin acciones.
  - Estados carga/vacío.
  - Borrado rechazado por backend → mensaje de error visible (stub de `confirm` + `onError`).
- **`LocationFormPage.test.tsx`** (opcional): validación de campos obligatorios,
  submit create/edit con/without coords.

**Verificación**: `npm run test` en verde.

---

### Paso 10 — Verificación final y cierre de la Parte II-D

Ejecutar en orden:

1. `npm run lint` → sin errores (1 warning preexistente `SidebarContext.tsx` OK).
2. `npm run typecheck` → sin errores.
3. `npm run test` → todos en verde (actualmente 70/70 en 11 archivos; suma los nuevos).
4. `npm run build` → OK (dist generado).
5. Actualizar `Process.md` (nuevo Paso 26) y `RESULTADOS.md` (nueva iteración)
   + avisos al usuario de backend; actualizar la cabecera de estado de este `PLAN.md`.

**Escenarios manuales** (con backend real disponible):

| Escenario | Esperado |
|-----------|----------|
| Superadmin → `/admin/sedes` | CRUD completo (crear/editar/eliminar) |
| Superadmin crea sede con coords | Aparece en el listado y en el select de competiciones; mapa público usa las coords |
| Admin de competición → `/admin/sedes` | Sin acceso (oculto en menú, aviso en pantalla) |
| No-superadmin intenta POST/PATCH/DELETE | El frontend no emite la petición (guard por rol) |
| Editar competición y elegir nueva sede | El select de `CompetitionFormPage` muestra las sedes existentes (incl. creadas) |
| Eliminar sede con competiciones asociadas | Mensaje de error claro si el backend rechaza (`ProtectedError` 4xx) |

---

## 5. Endpoints de la Parte II-D (resumen)

| Acción | Método | URL | Auth | Rol frontend |
|--------|--------|-----|------|-------------|
| Listar sedes | GET | `/api/v1/locations/?page_size=100` | JWT | superadmin + admin (select) |
| Obtener sede | GET | `/api/v1/locations/{id}/` | JWT | superadmin (edición) |
| Crear sede | POST | `/api/v1/locations/` | JWT | **solo superadmin** (`assertSuperUser`) |
| Editar sede | PATCH | `/api/v1/locations/{id}/` | JWT | **solo superadmin** |
| Eliminar sede | DELETE | `/api/v1/locations/{id}/` | JWT | **solo superadmin** |

> El GET del catálogo ya lo consume `getAdminCatalogs` (select "Sede" de
> `CompetitionFormPage`). No se puede borrar una sede usada por competiciones
> (`Competition.location` = `PROTECT` → `ProtectedError` 4xx) → manejar en la UI (Paso 8).

---

## 6. Orden de ejecución recomendado (Parte II-D)

1. **Paso 0** (documentar Parte II-D en `PROMPT.md`) → desbloquea el resto.
2. **Paso 1** (verificar backend, informativo) → decisiones de shape y borrado.
3. **Paso 2** (tipos) → base para todo lo demás.
4. **Paso 3 + 4** (API + hooks), dependen de Paso 2; independientes entre sí.
5. **Paso 5 + 6** (listado + form del catálogo).
6. **Paso 7** (rutas + sidebar + ícono) y **Paso 8** (guard + borrado en uso).
7. **Paso 9** (tests) — cubre API y páginas.
8. **Paso 10** (verificación final + documentación).

---

## 7. Restricciones que se mantienen (de `PROMPT.md` Parte III)

- **NO** tocar el backend (ni permisos ni endpoints) en esta iteración; el refuerzo
  por rol queda **avisado** al usuario.
- **NO** tocar `free-react-tailwind-admin-dashboard/` (solo lectura).
- **NO** crear ramas, no push, no commit sin pedido explícito.
- **NO** mockear datos en producción.
- No añadir comentarios al código salvo que se soliciten.
- Documentar avances en `Process.md` al iniciar y finalizar cada paso.
- Mantener el estilo TailAdmin (tema claro), tablas/formularios iguales a
  `AffiliationsPage`/`AffiliationFormPage`.
- No tomar tecnologías nuevas sin preguntar (regla de la Parte I).

---

## 8. Avisos al usuario (backend — no se toca en frontend)

1. **Restricción de roles solo en frontend:** el backend expone `locations/` con
   permiso global `IsAuthenticated`; cualquier usuario autenticado podría escribir.
   Para una regla de negocio real conviene `IsSuperAdmin` en la escritura de
   `LocationViewSet`. **(Decisión backend, no implementar aquí.)**
2. **Shape del serializer `Location` ya verificado:** 8 campos
   (`id, name, address, city, state, country, latitude, longitude`); `name`,
   `address`, `city`, `state`, `country` obligatorios; `latitude`/`longitude`
   opcionales (llegan como string o `null` en las vistas).
3. **Borrado en uso:** `Competition.location` usa `on_delete=PROTECT` → el DELETE de
   una sede referenciada falla (4xx); el frontend muestra un mensaje claro, pero el
   comportamiento definitivo depende del backend.
4. **Dato demo:** `seed_data.py` crea sedes españolas como texto plano; no hay
   catálogo geo de ciudades/estados/países (si más adelante se quiere "control" de
   esos valores, evaluar un maestro en backend — **fuera del alcance de este plan**).