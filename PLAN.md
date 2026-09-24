# PLAN — Módulo admin "Scoring": reglas de puntos por posición (Parte II-L)

> **Documento de planificación y seguimiento.** Implementación de la spec
> **Parte II-L** de `PROMPT.md`: habilitar el módulo **"Scoring"** del panel
> (`/admin/scoring`), para administrar la **tabla de puntuación** (`ScoringRule`,
> posición → puntos) de la competición en scope, con **guardado masivo editable**
> (estilo `ScoresPage` de II-K). Al habilitarse, la sección **"Próximamente"** del
> sidebar queda vacía y se **oculta**.
>
> Fecha: 2026-09-24
> Estado: **PLANIFICADO** — no se ejecutó ningún cambio todavía.
> Spec origen: `PROMPT.md` → `# Parte II-L — Módulo admin: Scoring (reglas de puntos por posición)`
> Decisiones de usuario confirmadas: **grilla masiva editable** + **ocultar "Próximamente"**.

---

## 0. Objetivo

En `/admin/scoring`, por **competición en scope** (`CompetitionScopeSelect`),
ver y mantener la tabla **`position → points`** (`ScoringRule`) de esa competición:
precargada desde el backend, editable en una grilla masiva (alta/edición/baja por fila)
con botón **Guardar reglas**. No hay cálculo en el frontend: al leer, el backend
(`ScoringService.get_points`) aplica `position → points` y arma los leaderboards.
Los cambios invalidan la query del grid **y** el leaderboard público
(`["leaderboard", competitionId]`, recalculo on-read). Sin cambios de backend.

## 1. Decisiones ya tomadas (usuario)

| Pregunta | Decisión |
|---|---|
| ¿Cómo administrar la tabla posición → puntos? | **Grilla masiva editable** (estilo `ScoresPage` de II-K): filas con inputs `position`+`points`, botón "Guardar reglas" (POST nuevas / PATCH editadas / DELETE quitadas) |
| ¿Qué pasa con "Próximamente" del sidebar al habilitar Scoring? | **Ocultarla**: al mover "Scoring" a `manageItems`, la sección queda vacía y deja de renderizarse |
| ¿Gate por rol? | **Sin gate superadmin**: admins de competición sobre sus competiciones asignadas (+ superuser ve todas), como Resultados/Competidores |
| ¿Cálculo de puntos en frontend? | **NO** — solo se administra la tabla; el backend recalcula score/leaderboard on-read |
| ¿Posiciones duplicadas? | Se dejan al `unique_together (competition, position)` del backend → 4xx → banner `role="alert"` (sin reordenar/swap en esta iteración) |

## 2. Clave técnica (verificada en el código y en el backend)

### Backend (`leader\Scorely/apps/scoring`) — VERIFICADO, sin modificar

- Modelo `ScoringRule`: `(competition FK→Competition, position PositiveIntegerField,
  points PositiveIntegerField)`; `unique_together ('competition','position')`;
  ordering `['competition','position']`.
- `ScoringRuleSerializer`: fields `('id','competition','position','points')`.
- `ScoringRuleViewSet`: `ModelViewSet` con `filterset_fields = ('competition',)`,
  **sin `permission_classes`** → cae en el global `IsAuthenticated` (JWT requerido),
  y **no filtra por competición ni valida rol**. Endpoint (router en `apps/scoring/urls.py`):
  `GET /api/v1/scoring-rules/`.
- `ScoringService.get_points(competition, position)` → `points` de la regla, o `0`
  si no existe. Los leaderboards lo usan on-read (junto a `EventRankingService`/`ResultParser`).

### Frontend (patrones a reutilizar)

- `src/api/admin.ts:39` `fetchCatalog<T>(path)` desempaqueta lista/página; métodos JWT
  por defecto. Modelo a imitar: bloque **Results/EventCompetitor** (`src/api/admin.ts:351-380`).
- `src/hooks/useAdminModules.ts` por-scope: `useAdminEventCompetitors`/`useCreateEventCompetitor`
  (`src/hooks/useAdminModules.ts:400-463`) — query `["admin","scoring-rules", competitionId]`
  y mutaciones que invalidan `["admin","scoring-rules", competitionId]` **y**
  `["leaderboard", competitionId]` (mismo patrón de invalidación que II-K).
- `src/pages/admin/ScoresPage.tsx`: patrón scope + estado local de grilla editable
  (`resultsMap: Record<number, {id?, value}>`), guardado masivo secuencial sobre `resultsMap`
  (POST/PATCH/DELETE por fila), banner `role="alert"` conservando inputs, y `Toast`
  de éxito ("…guardados correctamente.").
- `src/components/admin/CompetitionScopeSelect.tsx` + `adminScopeStore` (auto-selecciona la
  primera competición). Ícono **`TrophyIcon`** ya existe en `src/components/admin/icons.tsx:36`
  (se reutiliza; "Scoring" hoy usa `PlugIcon` en `otherItems`).
- Rutas en `src/App.tsx:75` (bloque admin, tras `/admin/scores`) y sidebar en
  `src/components/admin/AdminSidebar.tsx:69-80` (`manageItems` / `otherItems`) +
  render de "Próximamente" en `AdminSidebar.tsx:179-194`.
- `tests/utils.ts` `renderWithProviders`+`queryResult` (patrón `ScoresPage.test.tsx`).

## 3. Cambios por archivo (pasos de ejecución)

### Paso 0 — Registrar inicio

- Añadir sección **"Paso 36 — Parte II-L: Módulo admin Scoring (reglas de puntos)"**
  a `Process.md` (inicio, con el plan resumido y la lista de pasos).

### Paso 1 — Tipos: `src/types/index.ts`

- Añadir (tras `EventCompetitorWritePayload`, línea ~213) **sin tocar nada existente**:
  - `export interface ScoringRule { id: number; competition: number; position: number; points: number; }`
  - `export interface ScoringRuleWritePayload { id?: number; competition: number; position: number; points: number; }`

### Paso 2 — API: `src/api/admin.ts`

- Importar `ScoringRule`, `ScoringRuleWritePayload` de `@/types` (bloque de imports líneas 3-26).
- Nuevo bloque `// ── Scoring rules (admin scope) ──` al final del archivo (patrón Results):
  - `fetchScoringRules(competitionId: number): Promise<ScoringRule[]>` →
    `fetchCatalog<ScoringRule>("/scoring-rules/?competition=${competitionId}&page_size=100")` (JWT).
  - `createScoringRule(payload: ScoringRuleWritePayload): Promise<ScoringRule>` → POST `/scoring-rules/`.
  - `updateScoringRule(id: number, position: number, points: number): Promise<ScoringRule>` →
    PATCH `/scoring-rules/${id}/` con body `{ position, points }`.
  - `deleteScoringRule(id: number): Promise<void>` → DELETE.

### Paso 3 — Hooks: `src/hooks/useAdminModules.ts`

- Imports de las 4 funciones de API (bloque líneas 2-39) + tipo `ScoringRuleWritePayload`.
- `useAdminScoringRules(competitionId: number | null)`:
  query `["admin","scoring-rules", competitionId]`,
  `queryFn: () => fetchScoringRules(competitionId as number)`,
  `enabled: Boolean(competitionId)`, `staleTime: 30_000`.
- Mutaciones con firma `(competitionId: number | null)` que invalidan
  `["admin","scoring-rules", competitionId]` **y** el leaderboard público
  `["leaderboard", competitionId]` (patrón exacto de `useCreateEventCompetitor`, líneas 409-463):
  - `useCreateScoringRule(competitionId)` → `mutationFn: createScoringRule`.
  - `useUpdateScoringRule(competitionId)` →
    `mutationFn: (args: { id: number; position: number; points: number }) => updateScoringRule(args.id, args.position, args.points)`.
  - `useDeleteScoringRule(competitionId)` → `mutationFn: deleteScoringRule`.

### Paso 4 — Página nueva: `src/pages/admin/ScoringPage.tsx`

- Estado local, patrón `ScoresPage.tsx`:
  - `rows: ScoringRow[]` donde `ScoringRow = { localId: number; id?: number; position: number; points: number; removed?: boolean }`
    (clave editorial `localId` — no hay id de "inscripción" como en Resultados; una fila es una regla existente o una nueva).
  - `saving: boolean`, `error: string | null`, `toast: string | null`.
  - Pedir `useAdminScopeStore` y `useAdminScoringRules(competitionId)` + las 3 mutaciones.
- `useEffect`: sembrar `rows` desde `useAdminScoringRules` (orden por `position` asc,
  como viene del backend) al cargar; al cambiar competición → resetear `rows`/`error`/`toast`.
- UI:
  - `PageBreadcrumb pageTitle="Scoring"`.
  - Fila superior: `CompetitionScopeSelect` + botón **"Añadir posición"** (deshabilitado sin
    `competitionId`) + botón **"Guardar reglas"** (deshabilitado sin `competitionId` o `saving`).
  - Tabla (estilo `CompetitorsPage`/`ScoresPage`): columnas **Posición (input nº) / Puntos (input nº)
    / Acciones (botón "Quitar")**. Filas ordenadas por `position` asc (con las filas `removed`
    ocultas de la vista pero pendientes de DELETE).
  - Estados: `Spinner` (carga), `ErrorState` (error de query), banner `role="alert"` para
    errores de guardado, `EmptyState` "Sin reglas de puntuación" (competición sin reglas y sin
    filas nuevas) con hint de usar "Añadir posición".
- Lógica de filas:
  - **Alta**: "Añadir posición" agrega una fila nueva `{ localId: next, id?: undefined,
    position: mayor position actual + 1, points: 0 }` → al guardar → POST.
  - **Edición**: cambiar `position`/`points` de una fila con `id` → al guardar → PATCH
    (se puede comparar contra el valor original para solo enviar lo modificado, o enviar
    siempre; decisión de implementación: enviar siempre el par actual de la fila con `id`).
  - **Baja**: botón "Quitar" en una fila → marca `removed` (oculta la fila); si la fila tenía
    `id` → al guardar → DELETE. Una fila nueva `removed` simplemente se descarta (sin llamada).
- Guardado masivo (`handleSave`), secuencial sobre `rows`:
  1. Fila `removed` con `id` → `deleteScoringRule(id)`.
  2. Fila sin `removed`: con `id` y `position`/`points` válidos → `updateScoringRule(id, position, points)`.
  3. Fila sin `id` y con valores válidos → `createScoringRule({ competition: competitionId, position, points })`.
  4. Validación mínima de alta/edición: `position >= 1` y `points >= 0` enteros; si no, cortar antes de llamar
     (banner). En el primer error: cortar, `setError(err instanceof ApiError ? err.message :
     "No se pudieron guardar las reglas. Intenta de nuevo.")`, conservar `rows` para reintentar.
     En éxito: limpiar error, `setToast("Reglas guardadas correctamente.")` y vaciar filas nuevas
     (`id` se asigna al invalidar/refetch de la query).
- La valoración de `position`/`points` desde inputs string → `Number()` con parseo seguro
  (`Number(e.target.value) || 0`), validando en guardado.

### Paso 5 — Rutas y sidebar

- `src/App.tsx`: import `ScoringPage` + `<Route path="/admin/scoring" element={<ScoringPage />} />`
  (tras `/admin/scores`, línea 75 — el `*` guard de línea 76 cae después).
- `src/components/admin/AdminSidebar.tsx`:
  - Mover **"Scoring"** de `otherItems` (línea 78-80, hoy `enabled: false`, `PlugIcon`) a
    `manageItems` (tras "Resultados", línea 75) con `enabled: true`, `path: "/admin/scoring"`,
    ícono **`TrophyIcon`** (ya importado, línea 14).
  - `otherItems` queda vacío → **ocultar la sección "Próximamente"**: eliminar el bloque
    `<div>` con el `h2` "Próximamente" (líneas 179-194) y el `otherItems.map(renderItem)`.
  - Verificar que no queden imports sin usar (`PlugIcon` deja de usarse → quitarlo del import líneas 4-17).

### Paso 6 — Fixtures y tests de API

- `tests/fixtures.ts`: importar `ScoringRule`; `makeScoringRule(overrides)` →
  `{ id: 1, competition: 1, position: 1, points: 100 }`.
- `tests/adminApi.test.ts` (nuevo bloque `describe("scoring rules", …)`, import de las 4 funciones;
  patrón del bloque `event-competitors`, líneas 489-561):
  - `fetchScoringRules(5)` → `request("/scoring-rules/?competition=5&page_size=100")` **sin**
    `{auth:false}` y desempaqueta `results`.
  - `createScoringRule({competition:5, position:1, points:100})` → POST "/scoring-rules/" body JSON.
  - `updateScoringRule(9, 2, 90)` → PATCH "/scoring-rules/9/" body `{ position: 2, points: 90 }`.
  - `deleteScoringRule(9)` → DELETE "/scoring-rules/9/".

### Paso 7 — Tests de página: `tests/ScoringPage.test.tsx` (nuevo)

- Mocks: `CompetitionScopeSelect` (→ `null`), `@/hooks/useAdminModules` (hook de query con
  `queryResult` + las 3 mutaciones con `mutateAsync` spy, patrón `ScoresPage.test.tsx`),
  `useAdminScopeStore.setState({ competitionId: 1 })`.
- Casos:
  1. `Spinner` mientras carga ("Cargando reglas…").
  2. LIST: con scope, grilla con filas `position → points` precargadas, ordenadas por `position`.
  3. Añadir fila nueva y guardar → `createScoringRule` con `{ competition: 1, position: N+1, points }`.
  4. Editar una fila existente → `updateScoringRule(id, position, points)`.
  5. Quitar una fila existente → `deleteScoringRule(id)`; quitar una fila nueva → sin llamada.
  6. Sin reglas: `EmptyState` "Sin reglas de puntuación" (con "Añadir posición" disponible).
  7. Posición duplicada / error al guardar → banner `role="alert"` con el `ApiError`, rows conservadas.
  8. Sin scope (`competitionId: null`) → "Añadir posición" y "Guardar reglas" deshabilitados.
  9. Regresión: guardado exitoso → toast `role="status"` ("Reglas guardadas correctamente.").

### Paso 8 — Verificación

1. `npm run typecheck` → sin errores.
2. `npm run lint` → 0 errores (1 warning preexistente `SidebarContext.tsx`).
3. `npm run test` → suite completa en verde (actual: 173/173; esperada: 173 + ≈13 nuevos ≈ 186).
4. `npm run build` → OK (warning de chunk >500 kB preexistente).

### Paso 9 — Verificación manual + documentación

- Manual contra backend (usuario): login como admin con competición asignada → `/admin/scoring` →
  añadir/editar/quitar reglas → Guardar → verificar `GET /scoring-rules/?competition={id}` con token
  y que el leaderboard público `/competitions/:slug/` refleje los nuevos puntos (recalculo on-read
  vía `ScoringService`). Verificar que el sidebar **no muestra** "Próximamente".
- `Process.md`: registrar cierre del Paso 36. `RESULTADOS.md`: iteración Parte II-L con verificación.
- `PROMPT.md`: sin cambios (la spec II-L ya está completa con las decisiones confirmadas).

## 4. Seguimiento

| Paso | Estado |
|---|---|
| 0. Registrar inicio en `Process.md` (Paso 36) | ✅ hecho |
| 1. Tipos `ScoringRule` / `ScoringRuleWritePayload` | ✅ hecho |
| 2. API `fetch/create/update/delete` en `src/api/admin.ts` | ✅ hecho |
| 3. Hooks de reglas (query + 3 mutaciones con invalidation) | ✅ hecho |
| 4. Página `ScoringPage.tsx` (scope + grilla editable + guardado masivo + **"Regla general"**) | ✅ hecho |
| 5. Ruta `/admin/scoring` + sidebar (Scoring en `manageItems`, ocultar "Próximamente") | ✅ hecho |
| 6. Fixture `makeScoringRule` + bloque API en `adminApi.test.ts` | ✅ hecho |
| 7. `ScoringPage.test.tsx` (12 casos, incluye regla general) | ✅ hecho |
| 8. Verificación (typecheck, lint, test, build) | ✅ hecho (189/189; build OK) |
| 9. Verificación manual + `Process.md`/`RESULTADOS.md` | ✅ hecho (documentación; manual → usuario) |

**Nota (9)**: verificación manual de la interacción UI ↔ backend real → sigue **pendiente del usuario**
(como indica la spec, sin backend corriendo).

## 5. Verificación de cierre (checklist)

- [x] `npm run typecheck` → sin errores.
- [x] `npm run lint` → 0 errores (1 warning preexistente `SidebarContext.tsx`).
- [x] `npm run test` → suite completa en verde (**189/189**, 24 archivos).
- [x] `npm run build` → OK.
- [x] `/admin/scoring` habilitado en `manageItems` (ícono `TrophyIcon`); sidebar **sin** sección "Próximamente".
- [x] Guardado masivo POST/PATCH/DELETE correcto, banner `role="alert"` conservando filas y toast de éxito.
- [x] "Regla general": genera la grilla por progresión aritmética (base, descenso, hasta N) con piso de puntos en 0.
- [x] Sin reglas → `EmptyState` + "Añadir posición"; posiciones duplicadas → 4xx → banner.

## 6. Fuera de alcance

- **Backend**: sin tocar. Avisos vigentes (de la spec II-L): `ScoringRuleViewSet` usa el global
  `IsAuthenticated` y no filtra por competición/rol → restricción solo en UI (scope). Para seguridad
  real el usuario debería aplicar `IsCompetitionAdmin` + `visible_competitions_q` y el filtro backend.
- **Sin reglas = 0 puntos**: `ScoringService.get_points` devuelve `0` si no existe la regla → el
  leaderboard puede quedar sin puntos hasta cargar las reglas (el `EmptyState`/UI lo puede avisar).
- **Reordenar/swap de posiciones**: fuera de la iteración (el `unique_together` falla con 4xx y se
  muestra banner); el usuario elimina la posición conflictiva o ajusta manualmente.
- **Grilla sobre `page_size=100`**: las tablas de puntuación suelen ser cortas (top N); igual que el resto del admin.
- No se toca el cálculo/leaderboard: solo se administra la tabla y se invalida el recalculo on-read.

## 7. Restricciones que se mantienen

- **NO** tocar el clon `free-react-tailwind-admin-dashboard/` (solo lectura).
- **NO** crear ramas, **NO** push, **NO** commit sin pedido explícito.
- **NO** ejecutar comandos del backend (`makemigrations`, `migrate`, `seed_data`, `createsuperuser`).
- Sin comentarios en código salvo que se soliciten.
- Textos en español; tema claro; sin i18n; sin nuevos íconos/emojis (reusar `TrophyIcon`).
- Sin mock de datos en producción; fixtures solo en `tests/`.