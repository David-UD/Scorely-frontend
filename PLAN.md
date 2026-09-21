# PLAN — Ejecución de `PROMPT.md` (Scorely Frontend)

> **Documento de planificación, no ejecuta cambios.** Describe, paso a paso,
> cómo implementar todo lo indicado en `PROMPT.md` (Partes II-B, II-C y II)
> sobre `Scorely-frontend/`, indicando el **estado actual** de cada parte y
> detallando el trabajo **pendiente**.
>
> Fecha: 2026-09-21
> Estado: BORRADOR / pendiente de ejecución (Parte II-C sin implementar)

---

## 0. Alcance del plan

`PROMPT.md` contiene **tres** especificaciones de actualización del frontend:

| Sección                                    | Módulo | Estado |
|--------------------------------------------|--------|--------|
| **Parte II-B** — Categorías disponibles    | Admin (`/admin/categories` + `/admin/competition-categories`) | ✅ **COMPLETADO** (ver `Process.md` Paso 21 y `RESULTADOS.md` iteración 2026-09-15; commits `2161c79`) |
| **Parte II** — Pantalla pública con información del sistema | Público (`/`, `/competitions/:slug/`, leaderboards) | ✅ **COMPLETADO** (ver `Process.md` Pasos 0–24 y `RESULTADOS.md`; commits `0565eb1`…`bf7d27f`) |
| **Parte II-C** — Filiaciones (`Affiliation`) | Admin (`/admin/affiliations`) | ⏳ **PENDIENTE** (objeto de este plan) |

Este plan:
1. Documenta el **estado alcanzado** de las partes ya implementadas (para que el
   ejecutor sepa qué existe y no lo rehaga).
2. Detalla **paso a paso** la implementación de la **Parte II-C (Filiaciones)**,
   única sección de `PROMPT.md` aún sin ejecutar.
3. Incluye los pasos de **verificación** de todo el proyecto (lint/typecheck/test/build).

### Regla clave repetida de `PROMPT.md`
- **Quién crea/edita/elimina filiaciones = superadmin** (`user.is_superuser`). El
  admin de competición **NO** accede a `/admin/affiliations`. La restricción se
  implementa **en frontend** (ocultar menú + guard de escritura) porque el backend
  hoy expone `affiliations/` con permiso global (`IsAuthenticated`). **Avisar al
  usuario** de que el backend debería restringir la escritura a superadmin.

---

## 1. Estado actual (análisis del repositorio, verificado en el código)

### Parte II-B — Categorías disponibles (COMPLETADA)
- `src/types/index.ts`: `CompetitionCategory`, `CompetitionCategoryWritePayload`, `EnabledCompetitionCategory` (`competition_category` como **id numérico**), `EnabledCompetitionCategoryWritePayload`.
- `src/api/admin.ts`: CRUD del catálogo con `assertSuperUser()` + CRUD de habilitaciones (PATCH envía solo `finalist_slots`).
- `src/hooks/useAdminModules.ts`: hooks de catálogo y de habilitaciones por scope con invalidación.
- `src/pages/admin/CategoriesPage.tsx`, `CategoryFormPage.tsx`, `CompetitionCategoriesPage.tsx` (nuevos).
- `src/App.tsx` (rutas) y `src/components/admin/AdminSidebar.tsx` (ítems según rol).
- Tests: `fixtures.ts`, `adminApi.test.ts`, `CategoriesPage.test.tsx`, `CompetitionCategoriesPage.test.tsx`.

### Parte II — Pantalla pública (COMPLETADA)
- `src/pages/public/HomeIndex.tsx` (`/`: Recientes + Todas + búsqueda) y `CompetitionDetail.tsx` (`/competitions/:slug/`).
- `src/components/public/`: `CompetitionCard`, `Tabs`, `StatusBadge`, `CombinedLeaderboardTable` (celdas con puesto + puntos + time/reps, ordinales en inglés, top-3), `MedalIcon` (SVG propio oro/plata/bronce), `LeaderboardFilters`, `WodList`, `LocationMap` (Google Maps legacy sin key, coords string/null coaccionadas con `Number()`), `EmptyState`.
- `src/api/public.ts` con `{ auth: false }` (vistas públicas sin JWT → se ven todas las competiciones publicadas).
- `utils/leaderboard.ts` (`buildCombinedLeaderboards`), `utils/format.ts`, `utils/cn.ts`.
- Refactor backend reflejado: eventos por `competition`+`phase`, `finalist_slots` en `EnabledCompetitionCategory`, `event_results[]` como objetos.

> Conclusión: la Parte II-C es el único trabajo de `PROMPT.md` pendiente de ejecución.

### Parte II-C — Filiaciones (PENDIENTE) — lo que ya existe
- `src/types/index.ts`: existe `Affiliation` (`id`, `name`, `city`, `state`, `country`). **NO existe** `AffiliationWritePayload`.
- `src/api/admin.ts`: `getAdminCatalogs()` ya hace `GET /affiliations/` (lectura para el select de `CompetitionFormPage`). **NO existen** `fetchAffiliation(id)`, `createAffiliation`, `updateAffiliation`, `deleteAffiliation`.
- No hay `src/pages/admin/AffiliationsPage.tsx` ni `AffiliationFormPage.tsx`.
- No hay ruta `/admin/affiliations` en `src/App.tsx` ni ítem en `AdminSidebar.tsx`.
- `assertSuperUser()` ya existe en `src/api/admin.ts:42` y se reutilizará.

---

## 2. Parte II-C — Objetivo y reglas de negocio

| Regla de negocio | Quién | Dónde |
|-------------------|-------|-------|
| **CRUD del catálogo de filiaciones** (`Affiliation`: `name` obligatorio, `city`, `state`, `country`) | **Solo superadmin** | `/admin/affiliations` |
| Leer filiaciones para selects (competencias, atletas) | Superadmin + admin | `getAdminCatalogs` (ya existe, no cambia) |
| Borrado en uso | Depende del backend (`ProtectedError` vs `CASCADE`) | Manejar error 4xx en UI con mensaje claro |

Regla clave: el admin de competición **NO** accede a `/admin/affiliations`. La
defensa es **solo en frontend** (ocultar menú ruta + `assertSuperUser()` en las
escrituras de la API). El backend no restringe por rol: **avisar al usuario**.

---

## 3. Matriz de archivos (Parte II-C)

| Archivo | Tipo | Cambio |
|---------|------|--------|
| `src/types/index.ts` | Modificar | Añadir `AffiliationWritePayload`; revisar shape real de `Affiliation` (¿campos extra? ¿`name` único?) |
| `src/api/admin.ts` | Modificar | `fetchAffiliation(id)`, `fetchAffiliations()` (o reutilizar catálogo), `createAffiliation`, `updateAffiliation`, `deleteAffiliation` (todas con `assertSuperUser()` excepto las de lectura) |
| `src/hooks/useAdminModules.ts` | Modificar | `useAdminAffiliations`, `useCreateAffiliation`, `useUpdateAffiliation`, `useDeleteAffiliation` (invalidar `["admin","affiliations"]`) |
| `src/pages/admin/AffiliationsPage.tsx` | **Crear** | Tabla + acciones, solo superadmin (replicar `CategoriesPage`) |
| `src/pages/admin/AffiliationFormPage.tsx` | **Crear** | Form create/edit react-hook-form + zod (replicar `CategoryFormPage`) |
| `src/App.tsx` | Modificar | Rutas `/admin/affiliations`, `/admin/affiliations/new`, `/admin/affiliations/:id/edit` |
| `src/components/admin/AdminSidebar.tsx` | Modificar | Ítem "Filiaciones" (solo superadmin) |
| `src/components/admin/icons.tsx` | Modificar | (Opcional) ícono nuevo útil para Filiaciones si se desea uno distinto de `GroupIcon` |
| `tests/fixtures.ts` | Modificar | `makeAffiliation(overrides)` |
| `tests/adminApi.test.ts` | Modificar | Tests de CRUD de filiaciones + bloqueo no-superadmin |
| `tests/AffiliationsPage.test.tsx` | **Crear** | Tests de UI (superadmin/admin, estados) |
| `tests/AffiliationFormPage.test.tsx` | **Crear** (opcional) | Tests del formulario |
| `Process.md` | Modificar | Registrar avances |
| `RESULTADOS.md` | Modificar | Registrar resultado y avisos al terminar |

---

## 4. Pasos detallados (Parte II-C)

### Paso 1 — Verificar el shape real del backend (informativo, NO ejecutar backend)

**Qué hacer**:
1. Confirmar el serializer de `Affiliation` en `leader\Scorely` (`apps/competitions` o donde viva el modelo): campos exactos, obligatoriedad de `name`, ¿`city`/`state`/`country` opcionales?, ¿`name` único?
2. Confirmar que `/api/v1/affiliations/{id}/` existe (GET individual) por el `ModelViewSet` estándar.
3. Confirmar el comportamiento del **DELETE en uso** (¿`ProtectedError` → se rechaza el DELETE, o `CASCADE`?): condiciona el manejo de errores en la UI (Paso 8).
4. **AVISAR al usuario** (sin tocar backend) si la escritura no está restringida a superadmin: conviene `IsSuperAdmin` en `AffiliationViewSet`.

**Verificación**: anotar en `Process.md` el shape verificado (endpoint real `/api/v1/affiliations/`). No ejecutar comandos del backend.

---

### Paso 2 — Tipos DTOs

**Archivo**: `src/types/index.ts`

**Qué hacer** (replicar patrón `CompetitionCategory`/`CompetitionCategoryWritePayload`):

```ts
export interface AffiliationWritePayload {
  id?: number;
  name: string;
  city?: string;
  state?: string;
  country?: string;
}
```

- Ajustar la obligatoriedad (`city`/`state`/`country`) según lo verificado en el Paso 1.
- Si el serializer expone más campos, actualizar también `Affiliation`.

**Verificación**: `npm run typecheck` no rompe usos existentes (`Affiliation` se usa en `getAdminCatalogs`, `CompetitionSummary`, `Athlete`, `Team`).

---

### Paso 3 — Funciones API admin

**Archivo**: `src/api/admin.ts`

**Qué hacer** (mismo patrón que el catálogo de categorías):

```ts
export async function fetchAffiliations(): Promise<Affiliation[]> {
  return fetchCatalog<Affiliation>("/affiliations/?page_size=100");
}

export async function fetchAffiliation(id: number): Promise<Affiliation> {
  return request<Affiliation>(`/affiliations/${id}/`);
}

export async function createAffiliation(
  payload: AffiliationWritePayload,
): Promise<Affiliation> {
  assertSuperUser();
  return request<Affiliation>("/affiliations/", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateAffiliation(
  payload: AffiliationWritePayload,
): Promise<Affiliation> {
  assertSuperUser();
  return request<Affiliation>(`/affiliations/${payload.id}/`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function deleteAffiliation(id: number): Promise<void> {
  assertSuperUser();
  await request<void>(`/affiliations/${id}/`, { method: "DELETE" });
}
```

- `fetchAffiliations()` representa **también** el catálogo ya usado por `getAdminCatalogs` (se puede reutilizar para eliminarla de `getAdminCatalogs` o mantener ambas; recomendar **reutilizar** `fetchAffiliations()` dentro de `getAdminCatalogs` si se quiere un solo origen).
- `assertSuperUser()` ya existe; las tres funciones de escritura lo usan (defensa en UI ante no-superadmin).

**Verificación**: `npm run typecheck`. Tests de API en el Paso 9.

---

### Paso 4 — Hooks admin

**Archivo**: `src/hooks/useAdminModules.ts`

**Qué hacer** (replicar hooks del catálogo de categorías, invalidando `["admin","affiliations"]`):

- `useAdminAffiliations()` → `useQuery({ queryKey: ["admin","affiliations"], queryFn: fetchAffiliations, staleTime: 30_000 })`.
- `useCreateAffiliation()` / `useUpdateAffiliation()` / `useDeleteAffiliation()` → mutations que en `onSuccess` invalidan `["admin","affiliations"]`.

**Verificación**: `npm run typecheck`.

---

### Paso 5 — Página `AffiliationsPage` (catálogo, solo superadmin)

**Archivo**: `src/pages/admin/AffiliationsPage.tsx` (**crear**)

**Qué hacer** (replicar `CategoriesPage.tsx` 1:1 adaptando campos):
- `const isSuperUser = Boolean(useAuthStore((s) => s.user?.is_superuser));`
- Si `!isSuperUser`: breadcrumb + aviso "Solo el superusuario puede administrar las filiaciones." (sin acciones).
- Estados: `Spinner` (carga), `ErrorState` (error), `EmptyState` "Sin filiaciones" (vacío).
- Tabla: columnas `Nombre`, `Ciudad`, `Estado/Provincia`, `País`, `Acciones` (Editar / Eliminar).
- Botón "Nueva filiación" → `/admin/affiliations/new`.
- `handleDelete(id, name)`: `window.confirm` + `useDeleteAffiliation`; **capturar `ApiError`** para mostrar mensaje claro si el backend rechaza por estar en uso (Paso 8).

**Verificación**: navegación manual con superadmin (ve todo) y con admin de competición (ve solo el aviso).

---

### Paso 6 — Form `AffiliationFormPage` (crear/editar)

**Archivo**: `src/pages/admin/AffiliationFormPage.tsx` (**crear**)

**Qué hacer** (replicar `CategoryFormPage.tsx`):
- Schema zod: `name` (`z.string().min(1)`); `city`, `state`, `country` **strings opcionales** (`z.string().optional()` previamente a `""` según backend).
- Create/edit con `useCreateAffiliation` / `useUpdateAffiliation`; edición usa `fetchAffiliation(Number(id))` en `useQuery` con `enabled: isEditing` y `reset` en `useEffect`.
- Control de acceso: si `!isSuperUser`, mostrar aviso de sin acceso (patrón `CategoryFormPage`).
- Capturar `ApiError` en `submit` y mostrarlo en un `role="alert"`.

**Verificación**: crear y editar una filiación como superadmin persiste (backend real).

---

### Paso 7 — Routing + Sidebar

**Archivo**: `src/App.tsx`

**Qué hacer** (junto a las rutas de categorías):

```tsx
<Route path="/admin/affiliations" element={<AffiliationsPage />} />
<Route path="/admin/affiliations/new" element={<AffiliationFormPage />} />
<Route path="/admin/affiliations/:id/edit" element={<AffiliationFormPage />} />
```

**Archivo**: `src/components/admin/AdminSidebar.tsx`

**Qué hacer**:
- Añadir ítem **"Filiaciones"** (`path: "/admin/affiliations"`) al bloque `menuItems` **condicionado a `isSuperUser`** (mismo spread condicional que "Categorías"). Ícono: reutilizar `GroupIcon` o añadir uno a `icons.tsx` siguiendo el patrón `StrokeIcon`.

**Verificación**: superadmin ve "Filiaciones"; admin de competición no. Acceso directo a `/admin/affiliations` como no-superadmin → aviso de sin acceso (Paso 5).

---

### Paso 8 — Bloqueo por rol + manejo de borrado en uso

**Qué hacer**:
- **Guard por rol**: ya cubierto por `assertSuperUser()` (Paso 3) + ocultamiento en UI (Pasos 5–7). Verificar que no-superadmin **no** emite POST/PATCH/DELETE desde el frontend.
- **Borrado en uso** (si el backend usa `ProtectedError` → HTTP 4xx): en `AffiliationsPage.handleDelete` capturar `ApiError` y mostrar un mensaje; por ejemplo: *"Esta filiación está en uso por competiciones o atletas y no se puede eliminar."* (no romper la lista).
- **Registrar AVISO** en `Process.md`/`RESULTADOS.md`: backend no limita por rol la escritura de `AffiliationViewSet`; para una regla de negocio real conviene `IsSuperAdmin` (decisión backend, no implementar).

**Verificación**: como admin de competición no es posible crear/editar/eliminar desde la UI ni se emiten peticiones de escritura.

---

### Paso 9 — Pruebas

**Archivos**: `tests/fixtures.ts`, `tests/adminApi.test.ts`, `tests/AffiliationsPage.test.tsx`, (opcional) `tests/AffiliationFormPage.test.tsx`

**Qué hacer**:
- Fixtures: `makeAffiliation(overrides)` siguiendo `makeCompetitionCategory`.
- `adminApi.test.ts` (replicar patrón del bloque "competition category catalog"):
  - Bloquea escrituras cuando `is_superuser: false` (`rejects.toThrow("No tenés permisos")`, `request` no llamado).
  - POST/PATCH/DELETE correctos con `is_superuser: true` (URLs y métodos).
  - `fetchAffiliations`/`fetchAffiliation` con URLs correctas.
- `AffiliationsPage.test.tsx`:
  - Superadmin: tabla + botón "Nueva filiación" + editar/eliminar.
  - No-superadmin: aviso de sin acceso, sin acciones.
  - Estados carga/error/vacío (patrón `CategoriesPage.test.tsx`).
  - (Opcional) borrado rechazado por backend → mensaje de error visible.
- `AffiliationFormPage.test.tsx` (opcional): validación de `name` requerido, submit create/edit.

**Verificación**: `npm run test` en verde.

---

### Paso 10 — Verificación final y cierre de la Parte II-C

Ejecutar en orden:

1. `npm run lint` → sin errores
2. `npm run typecheck` → sin errores
3. `npm run test` → todos en verde
4. `npm run build` → OK (dist generado)
5. Actualizar `Process.md` y `RESULTADOS.md` (avance del Paso 1 al 10 + avisos al usuario de backend).

**Escenarios manuales** (con backend real disponible):

| Escenario | Esperado |
|-----------|----------|
| Superadmin → `/admin/affiliations` | CRUD completo (crear/editar/eliminar) |
| Superadmin crea `name`/`city`/`state`/`country` | Aparece en el listado y en el select de competiciones |
| Admin de competición → `/admin/affiliations` | Sin acceso (oculto en menú, aviso en pantalla) |
| No-superadmin intenta POST/PATCH/DELETE | El frontend no emite la petición (guard por rol) |
| Eliminar filiación con competiciones/atletas asociados | Mensaje de error claro si el backend rechaza (4xx) |

---

## 5. Endpoints de la Parte II-C (resumen)

| Acción | Método | URL | Auth | Rol frontend |
|--------|--------|-----|------|-------------|
| Listar filiaciones | GET | `/api/v1/affiliations/?page_size=100` | JWT | superadmin + admin (select) |
| Obtener filiación | GET | `/api/v1/affiliations/{id}/` | JWT | superadmin (edición) |
| Crear filiación | POST | `/api/v1/affiliations/` | JWT | **solo superadmin** (`assertSuperUser`) |
| Editar filiación | PATCH | `/api/v1/affiliations/{id}/` | JWT | **solo superadmin** |
| Eliminar filiación | DELETE | `/api/v1/affiliations/{id}/` | JWT | **solo superadmin** |

> El GET de catálogo ya lo consume `getAdminCatalogs` (select de `CompetitionFormPage`, `Athlete`, `Team`). No se puede borrar una filiación usada por competiciones/atletas si el backend lo protege (`ProtectedError` → 4xx) → manejar en la UI (Paso 8).

---

## 6. Orden de ejecución recomendado (Parte II-C)

1. **Paso 1** (verificar backend, informativo) — desbloquea decisiones de shape y borrado.
2. **Paso 2** (tipos) → base para todo lo demás.
3. **Paso 3 + 4** (API + hooks), dependen de Paso 2; independientes entre sí.
4. **Paso 5 + 6** (listado + form del catálogo).
5. **Paso 7** (rutas + sidebar) y **Paso 8** (guard + borrado en uso).
6. **Paso 9** (tests) — cubre API y páginas.
7. **Paso 10** (verificación final + documentación).

---

## 7. Restricciones que se mantienen (de `PROMPT.md` Parte III)

- **NO** tocar el backend (ni permisos ni endpoints) en esta iteración; el refuerzo por rol queda **avisado** al usuario.
- **NO** tocar `free-react-tailwind-admin-dashboard/` (solo lectura).
- **NO** crear ramas, no push, no commit sin pedido explícito.
- **NO** mockear datos en producción.
- No añadir comentarios al código salvo que se soliciten.
- Documentar avances en `Process.md` al iniciar y finalizar cada paso.
- Mantener el estilo TailAdmin (tema claro), tablas/formularios iguales a `CategoriesPage`/`CategoryFormPage`.
- No tomar tecnologías nuevas sin preguntar (regla de la Parte I).

---

## 8. Avisos al usuario (backend — no se toca en frontend)

1. **Restricción de roles solo en frontend:** el backend expone `affiliations/` con permiso global `IsAuthenticated`; cualquier usuario autenticado podría escribir. Para una regla de negocio real conviene `IsSuperAdmin` en la escritura de `AffiliationViewSet`. **(Decisión backend, no implementar aquí.)**
2. **Verificar shape del serializer `Affiliation`**: campos exactos y obligatoriedad (el tipo frontend actual solo contempla `name/city/state/country`).
3. **Borrado en uso**: confirmar si el backend protege el DELETE (`ProtectedError`) o aplica `CASCADE`; el frontend manejará el error 4xx con un mensaje claro, pero el comportamiento definitivo depende del backend.
4. Endpoints públicos pendientes (de la Parte II): el backend solo tiene `leaderboards` con `AllowAny`; `competitions`, `enabled-competition-categories` y `events` requieren JWT. **Decisión aplazada** en `PROMPT.md` §12 para otra iteración.