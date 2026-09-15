# PLAN — Módulo admin "Categorías disponibles" (Parte II-B de `PROMPT.md`)

> **No ejecuta cambios**: describe, paso a paso, cómo implementar el módulo
> de administración de **categorías disponibles** en el panel admin de
> `Scorely-frontend/`, tal como se especifica en la **Parte II-B** de `PROMPT.md`.
>
> Fecha: 2026-09-15
> Estado: **BORRADOR / pendiente de ejecución**

---

## 0. Resumen del objetivo

| Regla de negocio | Quién | Dónde |
|------------------|-------|-------|
| **CRUD del catálogo** de categorías (`CompetitionCategory`: `name`, `min_members`, `max_members`) | **Solo superadmin** (`user.is_superuser`) | `/admin/categories` |
| **Habilitar** categorías del catálogo en una competición | **Admin de competición** sobre sus competiciones asignadas | `/admin/competition-categories` |
| **Asignar `finalist_slots`** (slots que pasan a la Final; `0` = sin Final) | Admin de competición (y superadmin) | `/admin/competition-categories` |

Regla clave: el admin de competición **NO puede crear/editar/eliminar** categorías del catálogo; solo las **habilita** y define slots. La restricción de rol se implementa **en frontend** (ocultar + bloquear escritura del catálogo si no es superadmin). El backend hoy **no** restringe estos endpoints por rol (permiso global `IsAuthenticated`): **avisar al usuario** de que convendría reforzarlo en backend, sin tocarlo en esta iteración.

---

## 1. Análisis del estado actual

### Backend (verificado, `leader\Scorely`)
- `CompetitionCategoryViewSet` (`apps/events/views.py:21`) — `ModelViewSet`, `search_fields=('name',)`. Serializer: `(id, name, min_members, max_members)`. Ruta: `/api/v1/competition-categories/`.
- `EnabledCompetitionCategoryViewSet` (`apps/events/views.py:27`) — `ModelViewSet`, `filterset_fields=('competition',)`. Serializer: `(id, competition, competition_category, finalist_slots)`. Ruta: `/api/v1/enabled-competition-categories/`.
- Permisos por defecto: `IsAuthenticated` (cualquier usuario autenticado tiene acceso). No hay `IsSuperAdmin`/`IsCompetitionAdmin` sobre estos endpoints (los datos se obtienen con JWT).

### Frontend (examinado)
- **Router** (`src/App.tsx`): rutas admin bajo `<RoleGuard><AdminLayout/></RoleGuard>`. No hay `requiredRoles` en uso real; la distinción supervisor se lee de `user.is_superuser` (ver `CompetitionsPage`, `AdminSidebar`).
- **Sidebar** (`src/components/admin/AdminSidebar.tsx`): `menuItems` (Dashboard, Competiciones) y `manageItems` (Eventos, Atletas, Equipos). Pies distintos para superadmin vs admin (ya usa `is_superuser`).
- **API admin** (`src/api/admin.ts`): ya existe `fetchEnabledCompetitionCategories(competitionId)` (GET) y `fetchCatalog<T>` genérico. **Faltan** las funciones de escritura y el GET del catálogo.
- **Tipos** (`src/types/index.ts`): ya existe `EnabledCompetitionCategory` (con `competition_category` tipado como **objeto** `{id, code, name}`). **No existe** `CompetitionCategory`.
  - ⚠️ **Desalineación a verificar**: el serializer del backend devuelve `competition_category` como **id** (FK), no como objeto. Hay que comprobar el payload real y ajustar el tipo (`competition_category: number`) o cruzar con el catálogo para mostrar el nombre.
- **Hooks**: `useAdminModules.ts` (eventos/atletas/equipos) y `useEnabledCompetitionCategories.ts` (usa `api/public.ts`, no el admin). Conviene agregar hooks admin dedicados.
- **Scope**: `useAdminScopeStore` (`competitionId` persistido) + `CompetitionScopeSelect` (auto-selecciona la primera competición asignada).

---

## 2. Archivos a modificar / crear (resumen)

| Archivo | Tipo | Cambio |
|---------|------|--------|
| `src/types/index.ts` | Modificar | Añadir `CompetitionCategory`; ajustar `EnabledCompetitionCategory.competition_category` al shape real |
| `src/api/admin.ts` | Modificar | `fetchCompetitionCategories`, `createCompetitionCategory`, `updateCompetitionCategory`, `deleteCompetitionCategory`, `createEnabledCompetitionCategory`, `updateEnabledCompetitionCategory`, `deleteEnabledCompetitionCategory` |
| `src/hooks/useAdminModules.ts` | Modificar | Hooks admin de categorías y habilitaciones (query + mutations con invalidación) |
| `src/pages/admin/CategoriesPage.tsx` | **Crear** | CRUD del catálogo (solo superadmin) |
| `src/pages/admin/CategoryFormPage.tsx` | **Crear** | Form create/edit de categoría (replicar patrón `EventFormPage`) |
| `src/pages/admin/CompetitionCategoriesPage.tsx` | **Crear** | Habilitaciones por competición + select de categoría + `finalist_slots` |
| `src/App.tsx` | Modificar | Registrar rutas nuevas |
| `src/components/admin/AdminSidebar.tsx` | Modificar | Ítem "Categorías" (solo superadmin) y "Categorías por competición" (admin) |
| `tests/fixtures.ts` | Modificar | Fixtures `makeCompetitionCategory`, `makeEnabledCompetitionCategory` |
| `tests/adminApi.test.ts` | Modificar | Tests de las nuevas funciones API |
| `tests/CategoriesPage.test.tsx` | **Crear** | Tests de UI |
| `tests/CompetitionCategoriesPage.test.tsx` | **Crear** | Tests de UI |
| `Process.md` | Modificar | Registrar avances |
| `RESULTADOS.md` | Modificar | Registrar resultado al terminar |

---

## 3. Plan paso a paso

### Paso 1 — Tipos DTOs

**Archivo**: `src/types/index.ts`

**Qué hacer**:
1. Añadir el tipo del catálogo (coincide con `CompetitionCategorySerializer`):
   ```typescript
   export interface CompetitionCategory {
     id: number;
     name: string;
     min_members: number;
     max_members: number;
   }

   export interface CompetitionCategoryWritePayload {
     id?: number;
     name: string;
     min_members: number;
     max_members: number;
   }
   ```
2. Revisar el shape real del payload de `GET /enabled-competition-categories/`:
   - Si `competition_category` llega como **id numérico** (esperado por FK), ajustar:
     ```typescript
     export interface EnabledCompetitionCategory {
       id: number;
       competition: number;
       competition_category: number; // id de CompetitionCategory
       finalist_slots: number;
     }
     ```
   - Si llega como objeto anidado, mantener objeto y cruzar nombre directo.
3. Añadir `EnabledCompetitionCategoryWritePayload` para las escrituras:
   ```typescript
   export interface EnabledCompetitionCategoryWritePayload {
     id?: number;
     competition: number;
     competition_category: number;
     finalist_slots: number;
   }
   ```

**Verificación**: `npm run typecheck` refleja el nuevo tipo sin romper usos existentes. El consumo actual de `EnabledCompetitionCategory` es mínimo (solo `fetchEnabledCompetitionCategories` sin consumidores de UI), por lo que el ajuste no debería romper nada.

---

### Paso 2 — Funciones API admin

**Archivo**: `src/api/admin.ts`

**Qué hacer**: añadir, siguiendo el patrón existente (`fetchCatalog`, `request`):

- **Catálogo (SÓLO superadmin en UI)**:
  ```typescript
  export async function fetchCompetitionCategories(): Promise<CompetitionCategory[]> {
    return fetchCatalog<CompetitionCategory>("/competition-categories/?page_size=100");
  }
  export async function createCompetitionCategory(payload: CompetitionCategoryWritePayload): Promise<CompetitionCategory> {
    return request<CompetitionCategory>("/competition-categories/", {
      method: "POST", body: JSON.stringify(payload),
    });
  }
  export async function updateCompetitionCategory(payload: CompetitionCategoryWritePayload): Promise<CompetitionCategory> {
    return request<CompetitionCategory>(`/competition-categories/${payload.id}/`, {
      method: "PATCH", body: JSON.stringify(payload),
    });
  }
  export async function deleteCompetitionCategory(id: number): Promise<void> {
    await request<void>(`/competition-categories/${id}/`, { method: "DELETE" });
  }
  ```
- **Habilitaciones (admin de competición con scope)**:
  ```typescript
  export async function createEnabledCompetitionCategory(payload: EnabledCompetitionCategoryWritePayload): Promise<EnabledCompetitionCategory> {
    return request<EnabledCompetitionCategory>("/enabled-competition-categories/", {
      method: "POST", body: JSON.stringify(payload),
    });
  }
  export async function updateEnabledCompetitionCategory(payload: EnabledCompetitionCategoryWritePayload): Promise<EnabledCompetitionCategory> {
    return request<EnabledCompetitionCategory>(`/enabled-competition-categories/${payload.id}/`, {
      method: "PATCH", body: JSON.stringify(payload),
    });
  }
  export async function deleteEnabledCompetitionCategory(id: number): Promise<void> {
    await request<void>(`/enabled-competition-categories/${id}/`, { method: "DELETE" });
  }
  ```
- `fetchEnabledCompetitionCategories` ya existe: verificar que se lee con el nuevo tipo.

**Verificación**: `npm run typecheck` y tests de API nuevos (Paso 7).

---

### Paso 3 — Hooks admin

**Archivo**: `src/hooks/useAdminModules.ts` (o `src/hooks/useAdminCategories.ts` nuevo)

**Qué hacer**: agregar hooks con el mismo patrón de `useAdminEvents`/`useDeleteEvent`:

- `useAdminCompetitionCategories()` → `useQuery(["admin","competition-categories"], fetchCompetitionCategories)`.
- `useCreateCompetitionCategory()` / `useUpdateCompetitionCategory()` / `useDeleteCompetitionCategory()` → mutations que invalidan `["admin","competition-categories"]`.
- `useAdminEnabledCategories(competitionId)` → `useQuery` con `enabled: Boolean(competitionId)`, queryKey `["admin","enabled-competition-categories", competitionId]`.
- `useCreateEnabledCategory(competitionId)` / `useUpdateEnabledCategory(competitionId)` / `useDeleteEnabledCategory(competitionId)` → mutations que invalidan `["admin","enabled-competition-categories", competitionId]`.

**Verificación**: compilar (`npm run typecheck`).

---

### Paso 4 — Página `CategoriesPage` (catálogo, solo superadmin)

**Archivo**: `src/pages/admin/CategoriesPage.tsx` (**crear**)

**Qué hacer**: replicar patrón de `CompetitionsPage`:
- `const isSuperUser = Boolean(useAuthStore((s) => s.user?.is_superuser));`
- Si **no** es superadmin: renderizar estado de "sin acceso" (p. ej. `EmptyState` "Solo el superusuario puede administrar categorías") **y** no mostrar botones de escritura. (El backend no bloquea: la defensa es UI.)
- Tabla: columnas `Nombre`, `Mín. integrantes`, `Máx. integrantes`, `Acciones` (Editar / Eliminar).
- `PageBreadcrumb pageTitle="Categorías"`.
- Botón "Nueva categoría" → `/admin/categories/new`.
- `handleDelete` con `window.confirm` + mutation `useDeleteCompetitionCategory` (patrón `CompetitionsPage`).

**Verificación**: navegar con superadmin y con admin; a admin no se le muestra ni la entrada de menú ni acciones.

---

### Paso 5 — Form `CategoryFormPage` (crear/editar categoria)

**Archivo**: `src/pages/admin/CategoryFormPage.tsx` (**crear**)

**Qué hacer**: replicar patrón de `EventFormPage` (react-hook-form + zod + `useQuery` para edición):
- Schema zod: `name` (requerido), `min_members` (número ≥ 0 via `z.coerce.number().min(0)`), `max_members` (número ≥ 0).
- Validación de negocio en UI: `max_members >= min_members` → mensaje de error (aviso; preferir validar también en backend, ver Observaciones).
- Create/edit con `useCreateCompetitionCategory` / `useUpdateCompetitionCategory`; al éxito navegar a `/admin/categories`.
- Control de acceso: si no es superadmin, redirigir/mostrar sin acceso.

**Verificación**: crear y editar una categoría (superadmin) persiste en el catálogo.

---

### Paso 6 — Página `CompetitionCategoriesPage` (habilitación + slots)

**Archivo**: `src/pages/admin/CompetitionCategoriesPage.tsx` (**crear**)

**Qué hacer**: replicar patrón de `EventsPage` (usa `CompetitionScopeSelect` + `useAdminScopeStore`):
- `CompetitionScopeSelect` arriba (auto-selecciona competición asignada).
- **Lista de habilitaciones** de la competición seleccionada (hook `useAdminEnabledCategories(competitionId)`): tabla con `Categoría` (nombre cruzado desde el catálogo), `Slots final` (`finalist_slots`), `Acciones` (Editar / Quitar).
- **Formulario/panel para habilitar**:
  - Select de categoría: cargado desde `useAdminCompetitionCategories()` (GET catálogo, lectura).
  - Input `finalist_slots` (número, ≥ 0).
  - Botón "Habilitar" → `useCreateEnabledCategory(competitionId)` con `{ competition: competitionId, competition_category, finalist_slots }`.
- **Editar slots**: edición inline (modal o fila editable) vía `useUpdateEnabledCategory` (`PATCH { competition_category, finalist_slots }` o solo `finalist_slots` según backend).
- **Quitar**: `window.confirm` + `useDeleteEnabledCategory`.
- No mostrar acciones de catálogo aquí (admin de competición no crea categorías).

**Flujo de habilitación**: scope → ver categorías habilitadas → añadir del catálogo + slots → invalidación de la query del scope.

**Verificación**: con admin asignado, habilitar una categoría y asignar slots; aparece en el leaderboard público (Paso 9).

---

### Paso 7 — Routing + Sidebar

**Archivo**: `src/App.tsx`

**Qué hacer**: registrar rutas:
```tsx
<Route path="/admin/categories" element={<CategoriesPage />} />
<Route path="/admin/categories/new" element={<CategoryFormPage />} />
<Route path="/admin/categories/:id/edit" element={<CategoryFormPage />} />
<Route path="/admin/competition-categories" element={<CompetitionCategoriesPage />} />
```

**Archivo**: `src/components/admin/AdminSidebar.tsx`

**Qué hacer**:
- `menuItems`: añadir ítem **Categorías** (`path: "/admin/categories"`) mostrado **solo si `isSuperUser`** (condicional en el array).
- `manageItems`: añadir ítem **Categorías por competición** (`path: "/admin/competition-categories"`), visible para todos los admin.
- Elegir íconos existentes de `icons.tsx` (p. ej. reutilizar `ListIcon`/`GroupIcon`; si se quiere uno específico, añadirlo con el patrón de `icons.tsx`).

**Verificación**: el superadmin ve ambos ítems; el admin de competición solo ve "Categorías por competición". Acceso directo a `/admin/categories` como no-superadmin → pantalla de sin acceso (Paso 4).

---

### Paso 8 — Bloqueo por rol en frontend (defensa)

**Qué hacer** (reforzar la regla de negocio):
- Guard en las páginas del catálogo (`CategoriesPage`, `CategoryFormPage`): si `!is_superuser`, no renderizar acciones/forms de escritura (y opcionalmente redirigir a `/admin`).
- En `src/api/admin.ts`: para las funciones de escritura del catálogo (`create/update/deleteCompetitionCategory`), comprobar `useAuthStore.getState().user?.is_superuser` y lanzar error/bloquear si no aplica (defensa ante llamadas accidentales; **no** convierto esto en regla de autorización real — el backend debe decidir).
- **Registrar como AVISO en `RESULTADOS.md`/`Process.md`**: el backend no restringe `CompetitionCategoryViewSet`/`EnabledCompetitionCategoryViewSet` por rol; para una regla de negocio real conviene `IsSuperAdmin` en escritura del catálogo y `IsCompetitionAdmin` en habilitaciones (decisión backend, no implementar aquí).

**Verificación**: como admin de competición, crear categoría desde la UI no es posible y ninguna petición POST/PATCH/DELETE al catálogo se emite desde el frontend.

---

### Paso 9 — Pruebas

**Archivos**: `tests/fixtures.ts`, `tests/adminApi.test.ts`, `tests/CategoriesPage.test.tsx`, `tests/CompetitionCategoriesPage.test.tsx`

**Qué hacer**:
- Fixtures: `makeCompetitionCategory(overrides)`, `makeEnabledCompetitionCategory(overrides)`.
- `adminApi.test.ts`: mockear `request` y verificar URLs/métodos de todas las funciones nuevas (patrón del test existente de `fetchAdminCompetitions`).
- `CategoriesPage.test.tsx`:
  - Superadmin: renderiza tabla, botón "Nueva categoría", editar/eliminar.
  - No-superadmin: muestra sin acceso y no muestra acciones.
  - Estados carga/error/vacío (replicar patrón `CompetitionsPage`).
- `CompetitionCategoriesPage.test.tsx`:
  - Con competición seleccionada: lista habilitaciones con nombre de categoría y slots.
  - Habilitar categoría del catálogo + `finalist_slots`.
  - Quitar habilitación (confirm) y editar slots.
  - Sin competición seleccionada: mensaje para seleccionar scope.

**Verificación**: `npm run test` en verde.

---

### Paso 10 — Verificación final y cierre

Ejecutar en orden:
1. `npm run lint` → sin errores
2. `npm run typecheck` → sin errores
3. `npm run test` → todos los tests en verde
4. `npm run build` → OK (dist generado)

**Escenarios manuales** (con backend real disponible):

| Escenario | Esperado |
|-----------|----------|
| Superadmin → `/admin/categories` | CRUD completo del catálogo |
| Admin de competición → `/admin/categories` | Sin acceso / sin acciones de escritura |
| Admin de competición → `/admin/competition-categories` | Auto-selecciona su competición; habilita del catálogo + `finalist_slots` |
| Cambiar competición en scope | Actualiza habilitaciones de la competición elegida |
| Tras habilitar categoría | La categoría aparece en leaderboard/competition detail público (si hay datos) |
| `/admin/*` sin sesión | Redirige a `/login` |

---

## 4. Análisis de endpoints (detalle)

### Catálogo — `/api/v1/competition-categories/`

| Acción | Método | URL | Payload |
|--------|--------|-----|---------|
| Listar | GET | `/api/v1/competition-categories/?page_size=100` | — |
| Crear | POST | `/api/v1/competition-categories/` | `{ name, min_members, max_members }` |
| Editar | PATCH | `/api/v1/competition-categories/{id}/` | `{ name?, min_members?, max_members? }` |
| Eliminar | DELETE | `/api/v1/competition-categories/{id}/` | — |

### Habilitaciones — `/api/v1/enabled-competition-categories/`

| Acción | Método | URL | Payload |
|--------|--------|-----|---------|
| Listar por competición | GET | `/api/v1/enabled-competition-categories/?competition={id}` | — |
| Habilitar | POST | `/api/v1/enabled-competition-categories/` | `{ competition, competition_category, finalist_slots }` |
| Editar slots | PATCH | `/api/v1/enabled-competition-categories/{id}/` | `{ finalist_slots }` (PATCH parcial; pasar solo el campo a editar) |
| Quitar | DELETE | `/api/v1/enabled-competition-categories/{id}/` | — |

> Constraint único `(competition, competition_category)`: al habilitar una categoría ya habilitada el backend devolverá 400 → mostrar mensaje amigable (capturar `ApiError`).

---

## 5. Orden de ejecución recomendado

1. **Paso 1** (tipos) → base para todo lo demás.
2. **Paso 2 + 3** (API + hooks) — independientes entre sí, dependen de Paso 1.
3. **Paso 4 + 5** (catálogo: listado + form).
4. **Paso 6** (habilitaciones por competición).
5. **Paso 7** (rutas + sidebar) y **Paso 8** (bloqueo por rol).
6. **Paso 9** (tests) — cubre páginas y API.
7. **Paso 10** (verificación final + documentación).

Los pasos 4–6 requieren tipos/hooks/API listos (1–3). El paso 7 es integración; el 8 aplica sobre 4–5.

---

## 6. Restricciones que se mantienen

- **NO** tocar el backend (ni permisos ni endpoints) en esta iteración; el refuerzo por rol queda **avisado** al usuario.
- **NO** tocar `free-react-tailwind-admin-dashboard/`.
- **NO** crear ramas ni hacer push/commit.
- **NO** mockear datos en producción.
- Documentar avances en `Process.md` al iniciar y finalizar cada paso.
- Mantener el estilo TailAdmin (tema claro, tablas/formularios iguales a `EventsPage`/`CompetitionsPage`).