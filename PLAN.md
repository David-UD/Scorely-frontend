# PLAN — Módulo admin "Resultados": entrada masiva por evento (Parte II-K)

> **Documento de planificación y seguimiento.** Implementación de la spec
> **Parte II-K** de `PROMPT.md`: habilitar el módulo **"Resultados"** del panel
> (`/admin/scores`), con **entrada masiva de resultados por evento** (`EventCompetitor`)
> para la competición en scope. **Scoring** (`/admin/scoring`, reglas de puntos)
> permanece **"Próximamente"** en el sidebar.
>
> Fecha: 2026-09-23
> Estado: **COMPLETADO** (2026-09-23). Verificación: typecheck/lint/test (171/171)/build OK.
> Manual contra UI/backend real → pendiente del usuario.
> Spec origen: `PROMPT.md` → `# Parte II-K — Módulo admin: Resultados (entrada masiva por evento)`

---

## 0. Objetivo

En `/admin/scores`, por **competición en scope** (`CompetitionScopeSelect`) y **evento
(WOD)** de esa competición, cargar/editar los resultados (`result`) de los inscritos en
una **grilla masiva** (una fila por competidor, un input por fila) con guardado masivo.
El backend calcula `event_rank`/`score` y el leaderboard público se actualiza **solo**
(al leer, on-read). Sin cambios de backend.

## 1. Decisiones ya tomadas (usuario)

| Pregunta | Decisión |
|---|---|
| ¿Funcionalidad de "Resultados"? | **Entrada masiva por evento** (grilla competición → evento → inputs de resultado) |
| ¿Cómo elegir la competición? | **Por competición** con `CompetitionScopeSelect` (patrón Eventos/Competidores) + select de evento (WOD) |
| ¿Qué pasa con el ranking al guardar? | **Se recalcula solo**: el backend calcula `event_rank`/`score` y el leaderboard al consultar; el frontend invalida queries y refleja los datos |
| ¿Gate por rol? | **Sin gate superadmin**: lo usan admins de competición sobre sus competiciones asignadas (+ superuser ve todas), como Competidores |
| ¿Scoring? | **NO** — permanece "Próximamente" (`scoring-rules`, ítem `/admin/scoring`) |

## 2. Clave técnica (verificada en el código y en el backend)

### Backend (`leader\Scorely/apps/events`) — VERIFICADO, sin modificar

- Modelo `EventCompetitor`: `(id, competitor FK, event FK, result CharField(50),
  event_rank PositiveIntegerField null, score IntegerField null)`; constraint único
  `(competitor, event)` → `unique_competitor_per_event`; ordering `['event','event_rank']`.
- `EventCompetitorSerializer`: fields `(id, competitor, event, result, event_rank, score)`,
  con `event_rank`/`score` **read_only** (los calcula el backend).
- `EventCompetitorViewSet`: `ModelViewSet` con `filterset_fields = ('event', 'competitor')`,
  **sin `permission_classes`** → cae en el global `IsAuthenticated` (JWT requerido), y
  **no filtra por competición ni valida rol**. Endpoint: `GET /api/v1/event-competitors/`.
- El recálculo es **on-read**: `EventRankingService` + `ResultParser`
  (`apps/events/services/`) interpretan el texto (`"03:20"`, `"150"`) y construyen
  `event_rank`/`score` y el leaderboard al leerlo (`apps/rankings`).

### Frontend (patrones a reutilizar)

- `src/api/admin.ts:37` `fetchCatalog<T>(path)` desempaqueta lista/página; métodos JWT
  por defecto. Modelo a imitar: bloque de Competitors (`fetchCompetitors`/`createCompetitor`…).
- `src/hooks/useAdminModules.ts` por-scope: `useAdminEvents(competitionId)` (query `["admin","events",id]`),
  `useAdminCompetitors(competitionId)`, `useAdminEnabledCategories(competitionId)`,
  y mutaciones por scope que invalidan con `["admin",...,compId]`. Hook de leaderboard
  público: `["leaderboard", competitionId, stage]` (`src/hooks/useLeaderboard.ts`) →
  invalidar con prefijo `["leaderboard", competitionId]`.
- `src/pages/admin/CompetitorsPage.tsx`: patrón scope + tabla + resolución de nombres
  (atleta/equipo/categoría por Map). `EventsPage.tsx`: patrón de select/estados y `phaseLabel`.
- `src/components/admin/CompetitionScopeSelect.tsx` + `adminScopeStore` (auto-selecciona
  la primera competición). Ícono **`ChartIcon`** ya existe en `src/components/admin/icons.tsx`.
- Rutas en `src/App.tsx` (bloque admin) y sidebar en `src/components/admin/AdminSidebar.tsx`
  (hoy: "Resultados" con `enabled: false` en `otherItems`, línea 78).
- 2 llamadas no transaccionales por fila (POST/PATCH/DELETE); ante error → banner
  `role="alert"` conservando los inputs (patrón habitual del proyecto).

## 3. Cambios por archivo (pasos de ejecución)

### Paso 0 — Registrar inicio

- Añadir sección "Paso 34 — Parte II-K: Resultados (entrada masiva)" a `Process.md` (inicio).

### Paso 1 — Tipos: `src/types/index.ts`

- Nuevo `EventCompetitor`:
  `{ id: number; competitor: number; event: number; result: string; event_rank: number | null; score: number | null }`.
- Nuevo `EventCompetitorWritePayload`: `{ id?: number; competitor: number; event: number; result: string }`.

### Paso 2 — API: `src/api/admin.ts`

- Importar `EventCompetitor`, `EventCompetitorWritePayload` de `@/types`.
- Nuevo bloque `// ── Results / EventCompetitor (admin scope) ──` (patrón Competitors):
  - `fetchEventCompetitors(eventId: number): Promise<EventCompetitor[]>` →
    `fetchCatalog<EventCompetitor>("/event-competitors/?event=${eventId}&page_size=100")` (JWT, sin `{auth:false}`).
  - `createEventCompetitor(payload: EventCompetitorWritePayload): Promise<EventCompetitor>` → POST.
  - `updateEventCompetitorResult(id: number, result: string): Promise<EventCompetitor>` →
    PATCH `/event-competitors/${id}/` con body `{ result }`.
  - `deleteEventCompetitor(id: number): Promise<void>` → DELETE.

### Paso 3 — Hooks: `src/hooks/useAdminModules.ts`

- Imports de las 4 funciones de API + tipos `EventCompetitorWritePayload`.
- `useAdminEventCompetitors(eventId: number | null)`:
  query `["admin","event-competitors", eventId]`, `queryFn: () => fetchEventCompetitors(eventId as number)`,
  `enabled: Boolean(eventId)`, `staleTime: 30_000`.
- Mutaciones con firma `(eventId: number | null, competitionId: number | null)` que invalidan
  `["admin","event-competitors", eventId]` **y** el leaderboard público `["leaderboard", competitionId]`:
  - `useCreateEventCompetitor(eventId, competitionId)`
  - `useUpdateEventCompetitor(eventId, competitionId)` → `mutationFn: (args: { id: number; result: string }) => updateEventCompetitorResult(args.id, args.result)`
  - `useDeleteEventCompetitor(eventId, competitionId)`

### Paso 4 — Página nueva: `src/pages/admin/ScoresPage.tsx`

- Estado:
  - `eventId` (select de evento), `resultsMap: Record<number, { id?: number; value: string }>` (clave = competitor id),
    `saving: boolean`, `error: string | null`.
  - Pedir `useAdminScopeStore` y los hooks: `useAdminEvents(competitionId)`, `useAdminCompetitors(competitionId)`,
    `useAdminAthletes()`, `useAdminTeams()`, `useAdminEnabledCategories(competitionId)`,
    `useAdminCompetitionCategories()`, `useAdminEventCompetitors(eventId)` y las 3 mutaciones.
- `useEffect`: al cargar `useAdminEventCompetitors`, sembrar `resultsMap` con los registros existentes
  (`{ id: ec.id, value: ec.result }` por `competitor`). Al cambiar competición → resetear `eventId` y `resultsMap`.
- UI:
  - `PageBreadcrumb pageTitle="Resultados"`.
  - Fila superior: `CompetitionScopeSelect` + `<select>` de evento (label solo cuando `expanded`/siempre:
    `WOD #{event_number} — {name} ({phaseLabel(phase)})`, ordenado por fase + número, del `useAdminEvents`)
    + botón **"Guardar resultados"** (deshabilitado sin `competitionId`, sin `eventId`, o `saving`).
  - Tabla (estilo `CompetitorsPage`): columnas **Nº / Competidor / Tipo / Categoría / Resultado (input)**.
    Nombres y categoría resueltos con los mismos Maps que `CompetitorsPage` (atleta→`first_name last_name`,
    equipo→`name`, categoría vía habilitaciones→catálogo).
  - Estados: `Spinner` (carga de grilla), `ErrorState` (error de query), `EmptyState` ("Sin eventos" si
    no hay WODs, "Sin competidores" si no hay inscritos), banner `role="alert"` para errores de guardado.
- Guardado masivo (`handleSave`), secuencial sobre `resultsMap`:
  1. Fila sin `id` y con `value` no vacío → `createEventCompetitor({ competitor, event: eventId, result: value.trim() })`.
  2. Fila con `id` y `value` no vacío → `updateEventCompetitorResult(id, value.trim())`.
  3. Fila con `id` y `value` vacío → `deleteEventCompetitor(id)`.
  4. En el primer error: cortar, `setError(err instanceof ApiError ? err.message : "No se pudieron guardar los resultados…")`,
     conservar el estado para reintentar (no perder inputs). En éxito: limpiar error e invalidar (ya lo hacen las mutaciones).

### Paso 5 — Rutas y sidebar

- `src/App.tsx`: import `ScoresPage` + `<Route path="/admin/scores" element={<ScoresPage />} />` (bloque admin).
- `src/components/admin/AdminSidebar.tsx`: mover "Resultados" de `otherItems` a `manageItems` con
  `enabled: true`, `path: "/admin/scores"`, ícono `ChartIcon`. `otherItems` queda solo con **"Scoring"**
  (sigue `enabled: false` bajo "Próximamente"). El header "Próximamente" se conserva (aún hay 1 ítem).

### Paso 6 — Fixtures y tests de API

- `tests/fixtures.ts`: `makeEventCompetitor(overrides)` →
  `{ id: 1, competitor: 1, event: 1, result: "06:12", event_rank: null, score: null }`.
- `tests/adminApi.test.ts` (nuevo bloque `"event-competitors"`, import de las 4 funciones):
  - `fetchEventCompetitors(5)` → `request("/event-competitors/?event=5&page_size=100")` **sin** `{auth:false}` y desempaqueta `results`.
  - `createEventCompetitor({competitor:1,event:5,result:"150"})` → POST "/event-competitors/" body JSON.
  - `updateEventCompetitorResult(9, "03:20")` → PATCH "/event-competitors/9/" body `{ result: "03:20" }`.
  - `deleteEventCompetitor(9)` → DELETE "/event-competitors/9/".

### Paso 7 — Tests de página: `tests/ScoresPage.test.tsx` (nuevo)

- Mocks: `CompetitionScopeSelect` (→ `null`), `@/hooks/useAdminModules` (hooks de query con
  `queryResult` + las 3 mutaciones con `mutate`/`mutateAsync` spy, patrón `CompetitorsPage.test.tsx`),
  `useAdminScopeStore.setState({ competitionId: 1 })`.
- Casos:
  1. `Spinner` mientras carga la grilla ("Cargando resultados…").
  2. Con scope + evento: grilla con Nº, competidor (atleta/equipo), tipo, categoría y **inputs precargados**
     de los `EventCompetitor` existentes (`makeEventCompetitor`).
  3. Guardar: cambiar un input de fila sin `id` → `createEventCompetitor` con payload correcto.
  4. Guardar: fila con `id` → `updateEventCompetitorResult(id, valor)`.
  5. Vaciar un resultado existente → `deleteEventCompetitor(id)`.
  6. Error en una mutación → banner `role="alert"` e inputs conservados.
  7. Sin evento seleccionado → botón "Guardar resultados" deshabilitado; EmptyState si no hay WODs.
  8. Sin scope (`competitionId: null`) → select de evento deshabilitado.

### Paso 8 — Verificación

1. `npm run typecheck` → sin errores.
2. `npm run lint` → 0 errores (1 warning preexistente `SidebarContext.tsx`).
3. `npm run test` → suite completa en verde (esperada: 158 + ≈12 nuevos).
4. `npm run build` → OK (warning de chunk >500 kB preexistente).

### Paso 9 — Verificación manual + documentación

- Manual contra backend (usuario): login como admin con competición asignada → `/admin/scores` →
  elegir evento → cargar resultados → Guardar → verificar `GET /event-competitors/?event={id}` con token
  y que el leaderboard público `/competitions/:slug/` refleje rank/score (recalculo on-read).
- `Process.md`: registrar cierre del Paso 34. `RESULTADOS.md`: iteración Parte II-K con verificación.

## 4. Seguimiento

| Paso | Estado |
|---|---|
| 0. Registrar inicio en `Process.md` | ✅ completado |
| 1. Tipos `EventCompetitor` / `EventCompetitorWritePayload` | ✅ completado |
| 2. API `fetch/create/update/delete` en `src/api/admin.ts` | ✅ completado |
| 3. Hooks de resultados (query + 3 mutaciones con invalidation) | ✅ completado |
| 4. Página `ScoresPage.tsx` (scope + evento + grilla + guardado masivo) | ✅ completado |
| 5. Ruta `/admin/scores` + sidebar "Resultados" habilitado | ✅ completado |
| 6. Fixture `makeEventCompetitor` + bloque API en `adminApi.test.ts` | ✅ completado |
| 7. `ScoresPage.test.tsx` | ✅ completado |
| 8. Verificación (typecheck, lint, test, build) | ✅ completado |
| 9. Verificación manual + `Process.md`/`RESULTADOS.md` | ✅ documentado (manual pendiente del usuario) |

## 5. Verificación de cierre (checklist)

- [x] `npm run typecheck` → sin errores.
- [x] `npm run lint` → 0 errores (1 warning preexistente `SidebarContext.tsx`).
- [x] `npm run test` → suite completa en verde (171/171, 23 archivos).
- [x] `npm run build` → OK.
- [x] `/admin/scores` habilitado en el sidebar, único ítem "Próximamente" = "Scoring".
- [x] Guardado masivo POST/PATCH/DELETE correcto y banner de error que conserva inputs.

## 6. Fuera de alcance

- **Backend**: sin tocar. Avisos vigentes (de la spec II-K): `EventCompetitorViewSet` usa el global
  `IsAuthenticated` y no filtra por competición/rol → restricción solo en UI (scope). Para seguridad real
  el usuario debería aplicar `IsCompetitionAdmin` + `visible_competitions_q` y filtrar por `event__competition`.
- **Scoring** (`/admin/scoring`, `scoring-rules`): permanece "Próximamente"; determina el `score` de cada
  puesto y queda como follow-up.
- **Endpoint bulk**: no existe; el guardado es N llamadas secuenciales. En competiciones muy grandes
  evaluar paginación/progreso o proponer endpoint bulk al backend (futuro).
- No se crea CRUD de inscripciones/categorías aquí (ya existen en /admin/competitors y /admin/competition-categories).

## 7. Restricciones que se mantienen

- **NO** tocar el clon `free-react-tailwind-admin-dashboard/` (solo lectura).
- **NO** crear ramas, **NO** push, **NO** commit sin pedido explícito.
- **NO** ejecutar comandos del backend (`makemigrations`, `migrate`, `seed_data`, `createsuperuser`).
- Sin comentarios en código salvo que se soliciten.
- Textos en español; tema claro; sin i18n.
- Sin mock de datos en producción; fixtures solo en `tests/`.