# Process — Registro de avances

> Regla del PROMPT.md: documentar avances al iniciar y finalizar cada paso.

## Resumen
Implementación de las **vistas públicas de Scorely** (spec Parte II de `PROMPT.md`) sobre el proyecto nuevo `frontend/`, replicando estilo TailAdmin (tema claro) sin tocar el clon de referencia ni el backend.

## Paso 0 — Verificación de entorno (COMPLETADO)
- Node v22.23.2, npm 10.9.8.
- Clon `free-react-tailwind-admin-dashboard/` revisado (configs eslint/tsconfig, `@theme` de TailAdmin, estructura de layout). Solo lectura.

## Paso 1 — Scaffolding del proyecto `frontend/` (COMPLETADO)
- `package.json` (React 19, Vite 6, Tailwind v4, Zustand, TanStack Query, react-hook-form+zod, react-router-dom v6, Vitest).
- `vite.config.ts` (react + tailwind + alias `@`, config vitest jsdom), `tsconfig.app/node`, `eslint.config.js`, `index.html` (es), `index.css` con tema claro (tokens TailAdmin sin dark mode), `.env`/`.env.example` (`VITE_API_URL`), favicon.
- `npm install` OK (289 paquetes).

## Paso 2 — Tipos DTOs + cliente API (COMPLETADO)
- `src/types/index.ts`: `Competition`, `Affiliation`, `Location`, `CompetitionStage`, `EventWod`, `Leaderboard`, `LeaderboardEntry`, `CategoryRef`, `TokenPair`, `AuthUser`.
- `src/api/client.ts`: wrapper `fetch` con base `VITE_API_URL`, manejo de errores tipado (`ApiError`), interceptor: ante 401 hace refresh y reintenta; si falla → logout.
- `src/api/auth.ts`: login (`POST /auth/token/`) y logout.
- `src/api/public.ts`: `getCompetitions`, `getCompetition`, `getCompetitionStages`, `getEvents`, `getLeaderboard` (normaliza DRF paginado / listas).
- `src/store/authStore.ts`: Zustand persist (tokens + usuario).

## Paso 3 — Routing + guards (COMPLETADO)
- `App.tsx` (BrowserRouter): `/`, `/competitions/:id/` (públicas, `PublicLayout`); `/login`; `/admin` protegido por `RoleGuard` dentro de `AdminLayout`; fallback 404.
- `guards/RoleGuard.tsx`: sin sesión → redirect `/login`; con `requiredRoles` valida rol.
- `layout/PublicLayout.tsx`, `layout/AdminLayout.tsx`, `components/common/ScrollToTop`.

## Paso 4 — Hooks de data fetching (COMPLETADO)
- `hooks/useCompetitions`, `useCompetition`, `useCompetitionStages`, `useEvents`, `useLeaderboard`.

## Paso 5 — Componentes comunes públicos (COMPLETADO)
- `Tabs`, `Badge`, `StatusBadge` (español + tonos), `Spinner`, `ErrorState` (con Reintentar), `EmptyState`.

## Paso 6 — Componentes públicos (COMPLETADO)
- `CompetitionCard`, `LocationMap` (embed OSM, sin API key), `WodList` (tabla), `CombinedLeaderboardTable` (leaderboard unificado Qualifier+Final, total aditivo), `LeaderboardFilters` (selector de categoría). `utils/format.ts` (fechas es-ES), `utils/cn.ts`, `utils/leaderboard.ts` (`combineLeaderboards`).

## Paso 7 — Página HomeIndex `/` (COMPLETADO)
- Pestañas **Recientes** (orden por `start_date` desc, slice 6) / **Todas**, búsqueda por nombre con debounce (query param `search`), grid responsive de tarjetas, estados carga/error/vacío.

## Paso 8 — Página CompetitionDetail (COMPLETADO)
- `/competitions/:id/`: info general, afiliación dueña/creadora, fechas, sede, mapa OSM, WODs agrupados por etapa, leaderboard con pestañas Qualifier/Final + filtro de categoría. Estados carga/error/vacío por sección.

## Paso 9 — Login + protección `/admin` (COMPLETADO)
- `LoginPage` con react-hook-form + zod, redirige al origen (`location.state.from`) o `/admin`.
- `/admin` protegido por `RoleGuard`; `AdminDashboard` placeholder.

## Paso 10 — Pruebas (COMPLETADO)
- Vitest + React Testing Library + jest-dom.
- `tests/HomeIndex.test.tsx` (5): render, pestaña Todas, vacío, error+reintentar, búsqueda.
- `tests/CompetitionDetail.test.tsx` (7): info/afiliación, mapa, WODs, leaderboard, filtro por categoría, etapas vacías, error.
- `tests/RoleGuard.test.tsx` (2): redirect a login sin sesión, render con sesión.
- Nota: los tests mockean los hooks de query (no el API) para aislamiento.

## Paso 11 — Verificación final (COMPLETADO)
- `npm run lint` → sin errores (con `free-react-tailwind-admin-dashboard` excluido de lint).
- `npm run typecheck` → sin errores.
- `npm run test` → 14/14 en verde.
- `npm run build` → OK (dist generado).
- `npm run dev` → arranca en http://localhost:5173/ (dev con Docker, ver debajo).

## Paso 12 — Docker dev (COMPLETADO)
- `Dockerfile` (node:22-alpine, `npm ci`) + `docker-compose.yml` (puerto 5173, volúmenes `./:/app` + `node_modules` anónimo, `env_file: .env`, `command: npm run dev`).
- `vite.config.ts`: `server.host: "0.0.0.0"` + `watch.usePolling` para HMR fiable en bind mounts de Windows.
- Verificado: `docker compose up -d --build` → contenedor `scorely-frontend` up, HTTP 200 en `http://localhost:5173/`.

## Paso 13 — URLs por slug (COMPLETADO)
- Backend (`leader\Scorely`): `CompetitionViewSet.get_object()` acepta `{id}` o `{slug}` (`apps/competitions/views.py`); `competition-stages`/`leaderboards` siguen usando el id del detalle.
- Backend tests: `test_competition_detail_public_by_slug` y `test_competition_detail_unknown_slug_returns_404` en `tests/test_api.py`. Suite completa: **94 passed**.
- Frontend: ruta `/competitions/:slug/` (`App.tsx`), `CompetitionDetail` lee `slug` y deriva el `id` desde el detalle (stages/leaderboards con `enabled`), `CompetitionCard` linkea `slug || id`, `useCompetitionStages` gana parámetro `enabled`.
- E2E real: `GET /api/v1/competitions/hyrox-barcelona-race/` → 200 (id=8); slug inexistente → 404.

## Paso 14 — Documentación (COMPLETADO)
- `Process.md` y `RESULTADOS.md` actualizados (slug, Docker, endpoints públicos, CORS pendiente).

## Paso 15 — Bugfix: leaderboard no cargaba (COMPLETADO)
- **Backend** (`leader\Scorely`): `LeaderboardEntrySerializer.competitor_id` apuntaba a un key inexistente (`competitor_id` vs `competitor`) → 500. Corregido con `source='competitor.id'` (`apps/rankings/serializers.py`). Verificado en vivo: `GET /api/v1/leaderboards/competition/8/qualifier/` → 200.
- **Frontend** (`src/api/public.ts`): el API devuelve `category` como string y los bloques no traen `competition_id`/`stage`. `normalizeLeaderboards` ahora mapea a `Leaderboard[]` (genera `code` slugificado de la categoría e inyecta id/stage).
- **404 = sin resultados**: `getLeaderboard` trata el 404 de una etapa sin leaderboard como lista vacía (estado vacío en la UI, no error).
- Tests nuevos: `tests/publicApi.test.ts` (mapeo, category objeto, 404→vacío, otros errores re-lanzan). Suite frontend: **18/18**.

## Paso 16 — Bugfix: índice con todas las publicaciones + admin scope + PROMPT (COMPLETADO)

Problemas reportados por el usuario:
1. El índice `/` solo mostraba las competiciones **asignadas al usuario** después de login (debía mostrar todas las publicadas, con o sin sesión).
2. `/admin/events` y `/admin/teams` mostraban estados vacíos (no se veían los eventos/equipos de la competición asignada).
3. El `PROMPT.md` no documentaba los endpoints de **creación** de eventos y equipos.

### Causas raíz
- **Índice filtrado**: las funciones de `src/api/public.ts` usaban `request()` con `auth: true` por defecto → el JWT se adjuntaba y el backend (`IsAuthenticatedOrReadOnly` + `get_queryset()`) filtraba competiciones por usuario asignado.
- **Admin vacío**: `adminScopeStore.competitionId` iniciaba en `null`; `CompetitionScopeSelect` calculaba `effectiveId` (primera competición) solo para mostrar el `<select>`, pero **nunca lo escribía** en el store → las queries `useAdminEvents`/`useAdminTeams` quedaban deshabilitadas (`enabled: Boolean(null)`).

### Cambios aplicados
- `src/api/public.ts`: las 5 funciones de lectura pública (`getCompetitions`, `getCompetition`, `getCompetitionStages`, `getEvents`, `getLeaderboard`) ahora pasan `{ auth: false }` a `request()`. Las vistas públicas ya no adjuntan el JWT.
- `src/components/admin/CompetitionScopeSelect.tsx`: `useEffect` que auto-escribe `effectiveId` (primera competición) en `adminScopeStore` cuando no hay selección válida. Con esto `/admin/events` y `/admin/teams` cargan los datos de la competición asignada de inmediato.
- `PROMPT.md`: sección 7 ampliada con endpoints de escritura de eventos y equipos (POST/PATCH/DELETE/GET) y catálogos; secciones 5 y 12 actualizadas (regla de "todas las publicadas sin importar login" y auto-selección del scope admin).

### Verificación
- `npm run lint` → OK
- `npm run typecheck` → OK
- `npm run test` → OK
- `npm run build` → OK
- Cobertura manual: `/` (sin/con sesión) → todas las competiciones publicadas; `/admin/events` y `/admin/teams` → datos de la competición asignada.

## Paso 17 — Bugfix: admin muestra solo competiciones asignadas (COMPLETADO)

Problema reportado por el usuario:
1. `/admin/competitions` estaba mostrando **todas** las competiciones (en vez de solo las asignadas al usuario).
2. El select de eventos y equipos (`CompetitionScopeSelect`) también mostraba todas (en vez de las asignadas).

### Causa raíz
`fetchAdminCompetitions()` (`src/api/admin.ts`) delegaba en `getCompetitions()` de `public.ts`, que tras el Paso 16 pasa `{ auth: false }`. Al no adjuntar el JWT, el backend (`IsAuthenticatedOrReadOnly` + `get_queryset()`) no filtraba por usuario y devolvía todas las publicadas. El hook `useAdminCompetitions` lo usan `CompetitionsPage` y `CompetitionScopeSelect`, por eso ambos mostraban todo.

### Cambios aplicados
- `src/api/admin.ts`: `fetchAdminCompetitions()` ahora usa `fetchCatalog<Competition>("/competitions/?page_size=100")`, que llama a `request(path)` con `auth` por defecto (`true`) → se adjunta el JWT y el backend devuelve **solo las competiciones asignadas** (o todas para superusuario). Eliminado el import de `getCompetitions` de `./public`.
- `tests/adminApi.test.ts` (nuevo): fija que `fetchAdminCompetitions` llama a `request("/competitions/?page_size=100")` **sin** `{ auth: false }` y que desempaqueta resultados paginados.

### Verificación
- `npm run lint` → OK
- `npm run typecheck` → OK
- `npm run test` → **31/31** en verde (7 archivos)
- `npm run build` → OK
- Cobertura manual: con sesión, `/admin/competitions`, eventos y equipos muestran solo las competiciones asignadas al usuario; `/` público sigue mostrando todas las publicadas.

## Paso 18 — Leaderboard unificado Qualifier + Final (COMPLETADO)

Requerimiento del usuario: en `/competitions/:slug/`, una sola tabla de leaderboard por categoría con modelo aditivo (`Total = qualifier + final`). Decisiones: los no clasificados muestran `-` en la fase final (sin puntos); si una fase aún no tiene datos, muestra `-`. Cabecera pedida:
```
Pos. │ Atleta │ Qualifier (Score 1..N) │ Final (Score 1..N) │ Total
```

- `src/types/index.ts`: DTOs `CombinedLeaderboardEntry` (`qualifier`/`final: LeaderboardEntry | null`, `total_score`) y `CombinedLeaderboard`.
- `src/utils/leaderboard.ts` (nuevo): `combineLeaderboards(qualifier, final)` — join por categoría/`competitor_id`, `total_score` aditivo, orden: finalistas primero (total desc) → no clasificados (qualifier desc), rank recalculado, unión de categorías.
- `src/components/public/CombinedLeaderboardTable.tsx` (nuevo): reemplaza a `LeaderboardTable` (eliminado). Cabecera 2 filas (Pos./Atleta/Total rowSpan=2; `Qualifier`/`Final` colSpan por WODs con `Score N` por columna). Celdas `-` para fase sin datos por atleta y para etapas sin WODs.
- `src/pages/public/CompetitionDetail.tsx`: eliminadas pestañas `Tabs`/`STAGE_TABS`/`stageTab` del leaderboard; usa `qualifierQuery`+`finalQuery` juntos → `combineLeaderboards(...)`; pasa `qualifierWods`/`finalWods` (vía `pickStageFor` + `eventsByStage`); filtro de categoría sobre las categorías unidas; loading/error combinados de ambos queries.
- Tests: `tests/leaderboardCombine.test.ts` (nuevo, 5) y `tests/CompetitionDetail.test.tsx` adaptado (2 etapas, total 500, `-` en no clasificado, filtro de categoría).

Verificación: `npm run lint` → OK (0 errores, 1 warning preexistente `SidebarContext.tsx`); `npm run typecheck` → OK; `npm run test` → **36/36** (8 archivos); `npm run build` → OK.

## Paso 19 — Refactor backend (Event→competition+phase, CompetitionStage eliminado) y sincronización de docs (COMPLETADO)

> Cambios de backend aplicados por el usuario en `leader\Scorely`, verificados contra el backend real.

### Backend (verificado)
- **`Event`** ahora cuelga de `competition` + `phase` (`QUALIFIER`/`FINAL`); el modelo `CompetitionStage` fue **eliminado** (migración `events/0006` reescrita con backfill de `competition_id`/`phase`; duplicado buggy `0006_..._.py` borrado). Constraint único: `(competition, phase, event_number)` → `unique_event_number_per_phase`.
- **`finalist_slots`** se movió de `Competition` a `EnabledCompetitionCategory` (por categoría; migraciones `events/0007` + `competitions/0005`). Backfill verificado: cf_a 2/2/2, cf_b 2, hy_a/hy_b 0.
- **`event_results[]`** del leaderboard ahora es lista de **objetos** `{event_id, event_number, event_name, phase, result, event_rank, score}`.
- Backend: `makemigrations --check --dry-run` limpio; `migrate` OK; **120/120** tests (`pytest -q` en `Scorely\.venv`).

### Frontend/docs (cambios aplicados)
- `PROMPT.md`: sección 3 (Excluye), 6 (DTOs: `EnabledCompetitionCategory.finalist_slots`, `event_results[]` objetos, `WODs` con `competition`+`phase` sin `competition_stage`), 7 (endpoints: `enabled-competition-categories/?competition={id}`, `events/?competition&phase`, payload de eventos con `competition`+`phase`; eliminadas filas de `competition-stages`), 11 y 12 (criterio de aceptación y observaciones alineados).
- `PLAN.md`: payloads y flujo de creación de eventos actualizados a `competition`+`phase`; nota sobre el refactor añadida.
- `RESULTADOS.md`: iteración 2026-09-15 documentada (ver abajo).

### Verificación
- `npm run lint` → OK
- `npm run typecheck` → OK
- `npm run test` → **36/36**
- `npm run build` → OK

## Paso 21 — Módulo admin "Categorías disponibles" (COMPLETADO)

> Implementación de la **Parte II-B** de `PROMPT.md` según el plan `PLAN.md` (sin tocar el backend).

### Reglas de negocio implementadas
- **Superadmin**: CRUD del catálogo de categorías (`CompetitionCategory`: `name`, `min_members`, `max_members`) en `/admin/categories`.
- **Admin de competición**: NO crea/edita/elimina categorías; solo **habilita** categorías del catálogo en sus competiciones asignadas y asigna `finalist_slots` (clasificados a la Final; `0` = sin Final) en `/admin/competition-categories`.
- Restricción de roles en **frontend**: `CategoriesPage`/`CategoryFormPage` bloquean si no es superadmin y `src/api/admin.ts` lanza error en las escrituras del catálogo si `user.is_superuser` es falso (`assertSuperUser`).

### Cambios aplicados
- **`src/types/index.ts`**: `CompetitionCategory` + `CompetitionCategoryWritePayload`; `EnabledCompetitionCategory` ahora con `competition_category` como **id numérico** (shape real del backend), + `EnabledCompetitionCategoryWritePayload`.
- **`src/api/admin.ts`**: `fetchCompetitionCategories`, `fetchCompetitionCategory`, `create/update/deleteCompetitionCategory` (guard superadmin), `create/update/deleteEnabledCompetitionCategory` (PATCH solo `finalist_slots`). Se mantiene `fetchEnabledCompetitionCategories(competitionId)`.
- **`src/hooks/useAdminModules.ts`**: hooks `useAdminCompetitionCategories`, `useCreate/Update/DeleteCompetitionCategory`, `useAdminEnabledCategories(competitionId)`, `useCreate/Update/DeleteEnabledCategory(competitionId)` con invalidación de queries por scope.
- **`src/pages/admin/CategoriesPage.tsx`** (nuevo): tabla del catálogo, acceso solo superadmin, crear/editar/eliminar.
- **`src/pages/admin/CategoryFormPage.tsx`** (nuevo): form react-hook-form + zod (`max_members >= min_members`), create/edit.
- **`src/pages/admin/CompetitionCategoriesPage.tsx`** (nuevo): `CompetitionScopeSelect`, formulario para habilitar del catálogo + slots, tabla con edición inline de slots y quitar.
- **`src/App.tsx`**: rutas `/admin/categories`, `/admin/categories/new`, `/admin/categories/:id/edit`, `/admin/competition-categories`.
- **`src/components/admin/AdminSidebar.tsx`**: ítem "Categorías" (solo superadmin) y "Categorías por competición".

### Tests
- `tests/fixtures.ts`: `makeCompetitionCategory`, `makeEnabledCompetitionCategory`.
- `tests/adminApi.test.ts`: 9 → 10 casos (bloqueo no-superadmin, CRUD catálogo, habilitaciones, PATCH solo `finalist_slots`).
- `tests/CategoriesPage.test.tsx` (nuevo, 4): loading, tabla, sin acceso para admin, vacío.
- `tests/CompetitionCategoriesPage.test.tsx` (nuevo, 4): habilitadas con nombre/slots, select solo categorías no habilitadas, vacío, botón deshabilitado sin competición.

### Verificación
- `npm run lint` → OK (0 errores; 1 warning preexistente `SidebarContext.tsx`)
- `npm run typecheck` → OK
- `npm run test` → **55/55** (10 archivos)
- `npm run build` → OK
- Shape backend verificado en BD: catálogo y habilitaciones reales de competiciones (cf_a/cf_b/hy_a/hy_b).

## Paso 24 — Mapa público: cambio a Google Maps (legacy, sin key) (COMPLETADO)

> Pedido del usuario: "usar mejor google maps". Variante elegida: **legacy sin API key** (`maps.google.com/maps?q=...&z=16&output=embed`).

### Decisión
Google Maps **legacy embed sin key** (gratis, sin proyecto GCP, sin billing). El zoom con Google sí se controla con el parámetro `z` explícito (a diferencia del `embed.html` de OSM que lo ignora), lo que simplificó mucho el componente.

### Cambios aplicados
- **`src/components/public/LocationMap.tsx`**:
  - `buildEmbedUrl` → `https://maps.google.com/maps?q={lat},{lng}&z=16&output=embed`.
  - Eliminados el cálculo de `bbox`/metros-por-píxel, `ResizeObserver` y el `Ref`/estado de ancho (ya no hacen falta: Google centra por `q` y fija zoom por `z`).
  - Se conserva la coerción de coords string/null (`toNumber`) y los estados vacíos "Sin ubicación" / "Mapa no disponible".
  - Añadido `allowFullScreen` al iframe.

### Tests (`tests/CompetitionDetail.test.tsx`)
- Coords strings → `src` contiene `q=19.826473,-90.524499` y `z=16`.
- Centro/zoom: `src` contiene `q=-34.6,-58.38`, `z=16` y `output=embed`.
- Se eliminó el test de `bbox` estrecho (no aplica a Google).

### Verificación
- `npm run lint` → OK (0 errores; 1 warning preexistente `SidebarContext.tsx`)
- `npm run typecheck` → OK
- `npm run test` → **60/60**
- `npm run build` → OK

## Paso 23 — Fix zoom del mapa público (OSM embed) (COMPLETADO)

> Reporte de usuario: "puse las coordenadas, pero el mapa me muestra muy alejado".

### Causa raíz
El `embed.html` de OpenStreetMap **ignora el parámetro `zoom`**; el nivel de zoom lo determina el `bbox`. El `bbox` anterior era fijo y enorme (±0.02° lon / ±0.0125° lat ≈ varios km) → el mapa forzaba un zoom ~12-13 ("muy alejado"). Además el marker se enviaba con `mlat`/`mlon`, param que el embed no usa (el correcto es `marker=LAT,LON`).

### Cambios aplicados
- **`src/components/public/LocationMap.tsx`**:
  - `buildEmbedUrl` ahora computa el `bbox` desde un **zoom objetivo 16** con metros-por-píxel corregidos por latitud (`metersPerPx = 2π·R·cos(lat) / 256 / 2^zoom`; span en grados = halfPx·m/px ÷ (111320·cos(lat)) para lon y ÷ 110540 para lat).
  - Ancho real del contenedor medido con **`ResizeObserver`** (fallback 640px si no está disponible, p.ej. jest/jsdom); el alto del iframe es fijo (`h-72` = 288px).
  - Marker como `marker=LAT,LON`; eliminados `zoom` y `mlat`/`mlon`.

### Tests
- `tests/CompetitionDetail.test.tsx`: coords strings → el `src` contiene `marker=19.826473,-90.524499` (antes `mlat=...`).
- Nuevo: `bbox` estrecho centrado en las coords (span < 0.5°) garantizando zoom cercano.

### Verificación
- `npm run lint` → OK (0 errores; 1 warning preexistente `SidebarContext.tsx`)
- `npm run typecheck` → OK
- `npm run test` → **60/60**
- `npm run build` → OK

## Paso 22 — Vista pública: medallas en leaderboard + fix mapa (COMPLETADO)

> Encargo del usuario: "actualiza PROMPT.md en la vista pública en la tabla de Leaderboard, agrega las medallas, verifica el mapa".

### Bug de mapa (causa raíz)
`LocationMap` exigía `typeof latitude === "number"`, pero el backend (DRF) serializa `latitude`/`longitude` como **strings** cuando están cargadas (ej. `"19.826473"`, `"-90.524499"` en `summer-games-crossfit`) y como `null` cuando no. Resultado: competiciones con coordenadas mostraban "Mapa no disponible".

### Cambios aplicados
- **`src/types/index.ts`**: `Location.latitude`/`longitude` ahora `number | string | null` (shape real del backend).
- **`src/components/public/LocationMap.tsx`**: coacciona coordendas con `Number()` (helper `toNumber`, rechaza `""`/no-finitos). Muestra "Mapa no disponible" solo si no hay coordendas válidas.
- **`src/components/public/MedalIcon.tsx`** (nuevo): SVG propio gratuito (sin emojis ni librerías) con colores oro `#F6C14E`, plata `#D7DCE2`, bronce `#E0A36A`; `data-testid="medal-{rank}"`.
- **`src/components/public/CombinedLeaderboardTable.tsx`**: nueva celda `WodCell` — muestra el icono de medalla (top-3 del `event_rank` del WOD) junto al puntaje en cada celda de WOD.

### PRÓMPT (PROMPT.md)
- **§6 DTOs**: nota de que `latitude`/`longitude` llegan como string/null y el mapa debe coaccionar con `Number()`.
- **§8 Componentes**: `CombinedLeaderboardTable` ahora documenta las **medallas por WOD** (SVG propio oro/plata/bronce para el top-3 del `event_rank`).
- **§12 Observaciones**: nota del embed OSM con coords coaccionadas.

### Tests (nuevos en `tests/CompetitionDetail.test.tsx`)
- Mapa con coords como **strings** → el iframe se renderiza y el `src` contiene `mlat=19.826473`.
- Mapa con coords `null` → "Mapa no disponible".
- Leaderboard: medalla de oro para el ganador de cada WOD (`medal-1`) y de plata para el 2º (`medal-2`).

### Verificación
- `npm run lint` → OK (0 errores; 1 warning preexistente `SidebarContext.tsx`)
- `npm run typecheck` → OK
- `npm run test` → **59/59**
- `npm run build` → OK

## Paso 20 — Refactor del código fuente del frontend al nuevo modelo (COMPLETADO)

> Eliminadas todas las referencias a `competition-stages`/`competition_stage`/`CompetitionStage` del código fuente del frontend (antes el usuario reportaba HTTP 404 en la tabla de eventos pública, al editar eventos/competiciones y en el leaderboard porque el frontend seguía llamando al endpoint `/competition-stages/` ya eliminado).

### Causa raíz (corregida)
El frontend consumía el modelo viejo: `getCompetitionStages` → `/competition-stages/` (404), eventos filtrados por `competition_stage__competition` y `competition_stage` (404), formularios con select de etapas, y combinaba leaderboards qualifier+final. El backend (Paso 19) ya no expone `CompetitionStage`.

### Cambios aplicados
- **`src/types/index.ts`**: eliminado `CompetitionStage`; nuevos `EventPhase` (`QUALIFIER`/`FINAL`), `EventWod`/`EventWritePayload` con `competition`+`phase`, `EventResult`, `EnabledCompetitionCategory` (`finalist_slots`), `CombinedLeaderboardEntry` con `event_results[]` + `qualified`.
- **`src/api/public.ts`**: eliminados `getCompetitionStages`/`normalizeStages`; `getEvents(competitionId, phase?)` → `/events/?competition&page_size&phase`; nuevo `getEnabledCompetitionCategories` → `/enabled-competition-categories/?competition`.
- **`src/api/admin.ts`**: eliminados `fetchStages`/`fetchStage`; `fetchEvents` → `/events/?competition`; nuevo `fetchEnabledCompetitionCategories`.
- **Hooks**: eliminado `useCompetitionStages.ts` y `useAdminStages`; `useEvents(competitionId, phase)`; nuevo `useEnabledCompetitionCategories`.
- **`CompetitionDetail.tsx`**: eventos por fase, leaderboard **overall** (`/final/`), `WodList` por fase (`Qualifier`/`Final`).
- **`utils/leaderboard.ts`**: `combineLeaderboards` → `buildCombinedLeaderboards(overall)` basado en `event_results[]` con `phase`; `qualified` = tiene resultado FINAL; total aditivo desde `final_score`.
- **`CombinedLeaderboardTable.tsx`**: puntajes por WOD desde `event_results` (por `event_id`), detalle `#rang · resultado`, `-` para no finalistas.
- **`WodList.tsx`**: prop `stageName` → `phaseName`.
- **Admin**: `EventsPage` (columna `Fase`, orden fase+número) y `EventFormPage` (select `Fase` `QUALIFIER`/`FINAL`, payload `{competition, phase, ...}`).
- **Tests**: fixtures/sin `makeStage`; `publicApi.test` (getEvents/getEnabledCompetitionCategories), `leaderboardCombine.test` (buildCombinedLeaderboards), `CompetitionDetail.test` (overall + por fase), `WodList.test` (phaseName).

### Verificación
- Endpoints reales: `GET /api/v1/events/?competition=8&page_size=50` → **200** (1 evento); `GET /api/v1/leaderboards/competition/8/final/` → **200** (entradas con `event_results[]` incluyendo `phase`/`result`/`event_rank`/`score`). Ya no se llama a `/competition-stages/`.
- `npm run lint` → OK (0 errores)
- `npm run typecheck` → OK
- `npm run test` → **39/39**
- `npm run build` → OK

## Paso 25 — Módulo admin "Filiaciones" / Parte II-C (COMPLETADO)

> Implementación de la **Parte II-C** de `PROMPT.md` según `PLAN.md` (sin tocar el backend).

### Reglas de negocio implementadas
- **Superadmin**: CRUD del catálogo de filiaciones (`Affiliation`: `name`, `city`, `state`, `country` obligatorios; `description`/`logo` opcionales —solo `description` en el frontend, el logo se deja para el file‑upload futuro) en `/admin/affiliations` (nuevo `/admin/affiliations/new`, `/admin/affiliations/:id/edit`).
- Restricción de roles en **frontend**: `AffiliationsPage`/`AffiliationFormPage` bloquean si no es superadmin y `src/api/admin.ts` lanza error en las escrituras si `user.is_superuser` es falso (`assertSuperUser`).
- **Borrado en uso**: `Competition.affiliation` usa `on_delete=PROTECT` → `DELETE` de una filiación referenciada devuelve error; la UI muestra un banner claro ("Puede estar en uso por competiciones").

### Cambios aplicados
- **`src/types/index.ts`**: `Affiliation` ampliado (`description?: string`, `logo?: string | null`) y nuevo `AffiliationWritePayload` (`id?`, `name`, `city`, `state`, `country`, `description?`).
- **`src/api/admin.ts`**: `fetchAffiliations()` (`/affiliations/?page_size=100`, reutilizada en `getAdminCatalogs()`), `fetchAffiliation(id)`, `createAffiliation`, `updateAffiliation`, `deleteAffiliation` (las 3 de escritura con `assertSuperUser()`); mensaje de `assertSuperUser` generalizado a "No tenés permisos para realizar esta acción.".
- **`src/hooks/useAdminModules.ts`**: `useAdminAffiliations`, `useCreateAffiliation`, `useUpdateAffiliation`, `useDeleteAffiliation` (invalidan `["admin","affiliations"]`); retirado el import de `fetchAffiliation` (se usa directo desde el formulario).
- **`src/pages/admin/AffiliationsPage.tsx`** (nuevo): tabla Nombre/Ciudad/Estado/País/Acciones, botón "Nueva filiación", confirm en borrado + manejo de `ApiError` con banner, gate superadmin, estados Spinner/ErrorState/EmptyState.
- **`src/pages/admin/AffiliationFormPage.tsx`** (nuevo): react-hook-form + zod (`name/city/state/country` requeridos, `description` opcional), create/edit (carga con `fetchAffiliation(Number(id))`), captura de `ApiError`, gate superadmin.
- **`src/components/admin/icons.tsx`**: nuevo `BuildingIcon` (patrón `StrokeIcon`).
- **`src/components/admin/AdminSidebar.tsx`**: ítem "Filiaciones" (`GroupIcon`→`BuildingIcon`) sumado al spread condicional `...(isSuperUser ? [...] : [])`.
- **`src/App.tsx`**: rutas `/admin/affiliations`, `/admin/affiliations/new`, `/admin/affiliations/:id/edit`.

### Tests
- `tests/fixtures.ts`: `makeAffiliation(overrides)`.
- `tests/adminApi.test.ts`: 15 casos (nuevo bloque "affiliations catalog": bloqueo no-superadmin, LIST, POST, PATCH, DELETE).
- `tests/AffiliationsPage.test.tsx` (nuevo, 5): loading, tabla superadmin, sin acceso para admin, vacío, **error al borrar filiación en uso** (stub de `confirm` + `onError`).
- Fix de tests preexistentes: `tests/CompetitionDetail.test.tsx` esperaba `z=16` en el mapa, pero `LocationMap.tsx` (ya commiteado) usa `TARGET_ZOOM = 19` → assertions alineadas a `z=19`.

### Verificación
- `npm run lint` → OK (0 errores; 1 warning preexistente `SidebarContext.tsx`)
- `npm run typecheck` → OK
- `npm run test` → **70/70** (11 archivos)
- `npm run build` → OK

## Paso 26 — Módulo admin "Sedes" / Parte II-D (COMPLETADO)

> Implementación de la **Parte II-D** de `PROMPT.md` según `PLAN.md` (sin tocar el backend). Pedido del usuario: "administración de location, se mostrará como 'Sedes', solo habilitado para superuser".

### Reglas de negocio implementadas
- **Superadmin**: CRUD del catálogo de sedes (`Location`: `name`, `address`, `city`, `state`, `country` obligatorios; `latitude`/`longitude` opcionales) en `/admin/sedes` (más `/admin/sedes/new` y `/admin/sedes/:id/edit`).
- Restricción de roles en **frontend**: `LocationsPage`/`LocationFormPage` bloquean si no es superadmin y `src/api/admin.ts` lanza error en las escrituras si `user.is_superuser` es falso (`assertSuperUser`).
- **Borrado en uso**: `Competition.location` usa `on_delete=PROTECT` → `DELETE` de una sede referenciada devuelve 4xx; la UI muestra un banner claro ("Puede estar en uso por competiciones").
- Decisiones del usuario: ruta `/admin/sedes` (etiqueta "Sedes") y **solo CRUD** (sin "control" de ciudad/estado/país).

### Cambios aplicados
- **`PROMPT.md`**: nueva sección **Parte II-D** (Título, Objetivo, Alcance con aviso backend, Endpoints shape verificado, DTOs, componentes, pruebas, observaciones); rutas del panel y referencias menores (Alcance §, tabla de réplica) actualizadas.
- **`src/types/index.ts`**: nuevo `LocationWritePayload` (`id?`, `name`, `address?`, `city`, `state`, `country`, `latitude?`, `longitude?`).
- **`src/api/admin.ts`**: `fetchLocations()` (`/locations/?page_size=100`), `fetchLocation(id)`, `createLocation`, `updateLocation`, `deleteLocation` (escrituras con `assertSuperUser()`); `getAdminCatalogs()` refactoreado a un único origen de catálogo (`fetchLocations()`).
- **`src/hooks/useAdminModules.ts`**: `useAdminLocations`, `useCreateLocation`, `useUpdateLocation`, `useDeleteLocation` (invalidan `["admin","locations"]`).
- **`src/pages/admin/LocationsPage.tsx`** (nuevo): tabla Nombre/Dirección/Ciudad/Estado/País/Coordenadas/Acciones, botón "Nueva sede", confirm + banner de error al borrar, gate superadmin, Spinner/ErrorState/EmptyState.
- **`src/pages/admin/LocationFormPage.tsx`** (nuevo): create/edit con react-hook-form + zod (`name/address/city/state/country` requeridos; `latitude`/`longitude` opcionales vía `z.preprocess` `""|NaN → undefined` y `valueAsNumber`), carga en edición, captura de `ApiError`.
- **`src/components/admin/icons.tsx`**: nuevo `MapPinIcon`; `AdminSidebar.tsx`: ítem "Sedes" (solo superadmin); `src/App.tsx`: rutas `/admin/sedes[/new/:id/edit]`.
- **Tests**: `tests/fixtures.ts` (`makeLocation`), `tests/adminApi.test.ts` (bloque "locations catalog": bloqueo no-superadmin, LIST, POST, PATCH, DELETE), `tests/LocationsPage.test.tsx` (nuevo, 5 casos).

### Verificación
- `npm run lint` → OK (0 errores; 1 warning preexistente `SidebarContext.tsx`)
- `npm run typecheck` → OK
- `npm run test` → **80/80** (12 archivos)
- `npm run build` → OK

## Paso 27 — Parte II-E: vista pública "categorías e inscritos" (COMPLETADO)

> Implementación de la **Parte II-E** de `PROMPT.md` según `PLAN.md` (sin tocar el backend). Sección nueva en `/competitions/:slug/` **antes de Workouts** que muestra las categorías habilitadas (en el orden del leaderboard overall / `LeaderboardFilters`) con el **recuento de inscritos** (`Competitor` agrupados por `enabled_competition_category`).

### Requerimiento
- Mostrar las categorías habilitadas de la competición junto con la cantidad de inscritos en cada una.
- Decisiones del usuario (preguntas 2026-09-21):
  1. **Backend**: abrir la lectura pública de `GET /competitors/` con `IsAuthenticatedOrReadOnly` (patrón igual a `CompetitionViewSet`/`EventViewSet`) — cambio que aplica el usuario; este paso solo avisa y documenta.
  2. **Categorías a listar**: las del **leaderboard** (mismo orden que `LeaderboardFilters`), no el catálogo completo.
- Recuento: cuenta `Competitor` por `enabled_competition_category`, resolviendo el nombre de la categoría **por nombre** (join catálogo `CompetitionCategory` → `EnabledCompetitionCategory` → `Competitor`). No se usa serializer anidado porque `EnabledCompetitionCategory.competition_category` es un **id numérico** que el admin consume como tal.

### Cambios aplicados
- **`src/types/index.ts`**: `CompetitorType` (`"INDIVIDUAL" | "TEAM"`) y `Competitor` (`athlete`/`team` opcionales null).
- **`src/api/public.ts`**:
  - `getCompetitionCategories()` → `/competition-categories/?page_size=100` (`auth: false`, desempaqueta lista/página).
  - `getCompetitors(competitionId)` → `/competitors/?competition={id}&page_size=100` con **loop de paginación** (lee `next` y su `page`, corta si no avanza); `auth: false`.
- **Hooks** (nuevos): `src/hooks/useCompetitors.ts` (`["competitors", id]`, `enabled` por id válido) y `src/hooks/useCompetitionCategories.ts` (`["competition-categories"]`, catálogo cacheado).
- **`src/utils/categoryCounts.ts`** (nuevo): `buildCategoryCounts({categories, enabled, catalog, competitors})` → `CategoryCount[] {code,name,count}` conservando el orden de `categories`; 0 si no hay coincidencia.
- **`src/components/public/CategoryInscritos.tsx`** (nuevo): sección `h2` "Categorías e inscritos" (aria-label igual); `Badge tone="brand"` con `N inscrito(s)` por categoría; Spinner mientras carga; **si falla la carga se oculta** (degradación elegante); nada si `categories` está vacío.
- **`src/pages/public/CompetitionDetail.tsx`**: integra `<CategoryInscritos>` justo **antes** de la sección Workouts, cuando hay `id` y categorías disponibles.

### Tests (+13, 80 → **93**)
- `tests/fixtures.ts`: `makeCompetitor`.
- `tests/publicApi.test.ts`: bloques `getCompetitionCategories` (URL + unwrap) y `getCompetitors` (URL `auth:false` **sin** `auth`, y “walks the pagination” que recorre `next`).
- `tests/categoryCounts.test.ts` (nuevo, 4): join por nombre catálogo→habilitación→inscritos, orden de las categorías del leaderboard, categoría sin coincidencia → 0, habilitación sin inscritos → 0.
- `tests/CategoryInscritos.test.tsx` (nuevo, 5): heading + badge por categoría con recuento (singular/plural), orden de las chips, spinner en carga, **oculto en error**, oculto sin categorías.
- `tests/CompetitionDetail.test.tsx`: mock de los 3 hooks nuevos (defaults vacíos) + test de integración que verifica heading, `2 inscritos` y que "Categorías e inscritos" aparece antes que "Workouts".

### Verificación
- `npm run lint` → OK (0 errores; 1 warning preexistente `SidebarContext.tsx`)
- `npm run typecheck` → OK
- `npm run test` → **93/93** (14 archivos)
- `npm run build` → OK (Vite 6.4.3; warning de chunk >500 kB preexistente)

### Aviso al usuario (backend)
Para que la sección muestre datos reales, abrir la lectura pública en `leader\Scorely` con `permission_classes = [IsAuthenticatedOrReadOnly]` (import de `rest_framework.permissions`) en los 3 viewsets que hoy caen en el global `IsAuthenticated` (`config/settings/base.py:86-88`):
- `CompetitorViewSet` (`apps/participants/views.py`) → habilita `GET /competitors/` público.
- `EnabledCompetitionCategoryViewSet` (`apps/events/views.py`) → `GET /enabled-competition-categories/` público.
- `CompetitionCategoryViewSet` (`apps/events/views.py`) → `GET /competition-categories/` público.
Hasta entonces el frontend degrada (oculta la sección) sin romper la página.

---

## Paso 29 — Parte II-F — Admin "Competidores" (inscripciones) (COMPLETADO)

> Ejecución del plan `PLAN.md` (Pasos 0–8). CRUD de `Competitor` en `/admin/competitors` (+ `/new` y `/:id/edit`), por competición en scope. Sin tocar el backend.

### Requerimiento
- Listar, crear, editar y borrar **inscripciones** (atleta `INDIVIDUAL` o equipo `TEAM`) de la competición en scope, con `registration_number` obligatorio y categoría habilitada de esa competición.
- Decisiones del usuario (2026-09-21): alcance **CRUD completo**; tipos **Individual y por equipos**; **`registration_number` obligatorio**; ítem **"Competidores"**; **sin gate superadmin** (admins de competición + superuser, scope ya filtra).

### Cambios aplicados
- **`PROMPT.md`**: nueva sección **Parte II-F** (spec + avisos backend).
- **`src/types/index.ts`**: `CompetitorWritePayload` (FK no usado en `null` — invariante `clean()`).
- **`src/api/admin.ts`**: `fetchCompetitors(competitionId)` (`?competition={id}&page_size=100`), `fetchCompetitor(id)`, `createCompetitor`, `updateCompetitor` (PATCH), `deleteCompetitor` — JWT por defecto.
- **`src/hooks/useAdminModules.ts`**: `useAdminCompetitors`, `useCreateCompetitor`, `useUpdateCompetitor`, `useDeleteCompetitor` (invalidate `["admin","competitors", …]`, `staleTime: 30_000`).
- **`src/pages/admin/CompetitorsPage.tsx`** (nuevo): scope + tabla Nº / Competidor (atleta o equipo resuelto) / Tipo / Categoría (catálogo vía habilitaciones) / Acciones; orden por nº asc; confirm + banner `ApiError`; botón derivada de scope.
- **`src/pages/admin/CompetitorFormPage.tsx`** (nuevo): tipo dinámico (toggle), zod + `superRefine`, categorías habilitadas por nombre del catálogo, aviso si no hay; en edición carga categorías/equipos de la **competición del registro** y el PATCH la conserva; payload con FK no usado en `null`.
- **`src/App.tsx`**: rutas `/admin/competitors[/new/:id/edit]`. **`src/components/admin/icons.tsx`**: `UserPlusIcon`. **`AdminSidebar.tsx`**: ítem "Competidores".
- **Tests**: `makeAthlete`/`makeTeam` en `fixtures.ts`; bloque "competitors" en `adminApi.test.ts`; `CompetitorsPage.test.tsx` y `CompetitorFormPage.test.tsx` (nuevos).

### Tests (+15, 93 → **108**)
- `tests/adminApi.test.ts` (+4): LIST `?competition=8&page_size=100` sin `{auth:false}`, GET detalle, POST con FK de tipo en `null`, PATCH/DELETE por id.
- `tests/CompetitorsPage.test.tsx` (+5): spinner; tabla con atleta/equipo/categoría por nombre; vacío; eliminar con confirm; error de borrado → banner; botón nuevo deshabilitado sin scope.
- `tests/CompetitorFormPage.test.tsx` (+6): alta Individual (POST con `athlete` y `team:null`); toggle a Equipo (POST con `team` y `athlete:null`); edición precarga y PATCH conserva competición; error al guardar → banner; sin categorías habilitadas bloquea; nulos si falta scope.
- Aprendizaje: con react-hook-form + `zodResolver` el submit es async en jsdom → usar `fireEvent.submit(form)` + `waitFor`/`findBy*` (el `fireEvent.click` sobre el botón no disparaba `handleSubmit`).

### Verificación
- `npm run lint` → OK (0 errores; 1 warning preexistente `SidebarContext.tsx`)
- `npm run typecheck` → OK
- `npm run test` → **108/108** (16 archivos)
- `npm run build` → OK (Vite 6.4.3)

### Aviso al usuario (backend)
1. **Escrituras sin guard de competición/rol**: `CompetitorViewSet` (`apps/participants/views.py:50`) usa `IsAuthenticatedOrReadOnly` → cualquier usuario autenticado puede crear/editar/borrar inscripciones de cualquier competición. Recomendación: replicar `TeamViewSet` (`IsCompetitionAdmin` + `visible_competitions_q` + guard en `create()`, `views.py:24-41`). La restricción visual queda a nivel frontend (scope).
2. **`registration_number` sin unicidad** (`blank=True`): la UI lo exige; si se quiere único por competición es `UniqueConstraint` en backend.
3. **Borrado en uso**: FK `enabled_competition_category` `PROTECT` + `Competitor` en resultados → `DELETE` puede fallar; la UI muestra el banner.
4. Relación con **Parte II-E**: cada inscripción incrementa el recuento público "Categorías e inscritos".

---

## Paso 30 — Parte II-G — Equipos globales (cierre documental) (COMPLETADO)

> Cierre de la iteración 2026-09-22 (código ya implementado y verificado en backend y frontend). Se documenta en `Process.md` el estado final: alcance, cambios y avisos, más el test pendiente de `TeamsPage` que se cubrió en el Paso 31 (II-H).

### Alcance
- `Team.competition` (FK) **eliminada** → catálogo global de equipos (estilo Atletas), sin selección por competición.
- Backend `leader\Scorely`: `TeamSerializer.fields = (id, name, affiliation)`; `TeamViewSet` espejo de `AthleteViewSet` con `(IsAuthenticated,)`; `TeamAdmin` sin `competition`; migración `participants/0003_remove_team_competition`; `seed_data.create_team()` global.
- Frontend: `Team`/`TeamWritePayload` sin `competition`; `fetchTeams()` global `/teams/?page_size=100`; `useAdminTeams()` sin scope; `TeamsPage` sin `CompetitionScopeSelect` ni columna Competición; `TeamFormPage` solo `name`; select de equipos en `CompetitorFormPage` trae todos los equipos; categorías habilitadas siguen por competición.
- **`tests/TeamsPage.test.tsx`** (8): lista global sin columna Competición ni `CompetitionScopeSelect`, vacío, eliminar con confirm, error de borrado (`role="alert"`), filtro por nombre (case/accentos), sin coincidencias, orden asc/desc por header "Equipo".

### Verificación
- `npm run test` → **112/112** en verde (16 archivos) al cierre de II-G; con II-H la suite quedaría en 143 (ver Paso 31).
- `npm run typecheck` → OK · `npm run lint` → 0 errores (1 warning preexistente `SidebarContext.tsx`).

### Avisos backend (sin tocar backend)
1. **Escritura de catálogos sin `IsSuperAdmin`**: `AffiliationViewSet`, `LocationViewSet`, `CompetitionCategoryViewSet` permiten escritura a cualquier autenticado (el "solo superadmin" es solo frontend). Existe `apps/users/permissions.py:19` (`IsSuperAdmin`) para aplicarlo si se quiere regla real.
2. **`CompetitorViewSet` sin guard de competición/rol** (II-F/II-G): `TeamViewSet` ya no es patrón de inscripción (es catálogo global); la seguridad real de inscripciones sigue pendiente en backend.

---

## Paso 31 — Parte II-H — Filtros de búsqueda y ordenamiento (cierre) (COMPLETADO)

> Ejecución del `PLAN.md` (Pasos 4–10, 12): filtro por nombre y orden ascendente/descendente de la columna Nombre en las **5 tablas admin**, y todos los headers del **leaderboard público** ordenables. Implementación 100 % en cliente (sin `?search=`/`?ordering=`); el backend no se toca.

### Requerimiento
- **Admin**: `Competitions`, `Affiliations`, `Sedes (Locations)`, `Atletas` y `Equipos` con input de búsqueda (por nombre; en atletas `first_name + last_name`) y header de la columna Nombre/Atleta/Equipo ordenable (asc por defecto, alternar asc/desc). Search case-insensitive y sin acentos; con filtro activo y sin resultados → `EmptyState` "Sin coincidencias".
- **Leaderboard público** (`CombinedLeaderboardTable`): todos los headers ordenables (`Pos.`, `Atleta`, `Score N` qualifier/final, `Total`); sin búsqueda; estado de orden interno con default `null` = orden original del backend; celdas sin dato (`-`) siempre al final en ambos sentidos; el orden es **solo visual** (no recalcula `rank`/`total_score`/medallas); se aplica después del filtro de categoría existente.

### Cambios aplicados
- **`PROMPT.md`**: nueva sección **Parte II-H** (spec: alcance, §7 pruebas, avisos 100 % cliente). Además se cerraron `[COMPLETAR]` de la Parte I (convenciones + comandos `npm run …`) y de la Parte II pública (wireframe/responsive/mocks/hooks/docs/§11) y se restauró el encabezado `# Parte II — Vista pública…`.
- **`src/utils/sortFilter.ts`** (nuevo): `normalizeText` (NFD sin diacríticos), `filterByName`, `sortByName` (localeCompare "es"), `SortDir`.
- **Páginas admin** (Competitions, Affiliations, Locations, Athletes, Teams): `search`/`sortDir` en estado, `useMemo` antes de cualquier early-return (regla hooks), input `type="search"` con `aria-label`, `<th>` con `onClick`/`aria-sort`/indicador ▲▼, `EmptyState` "Sin coincidencias". Se reemplazó el orden inline que ya traían `TeamsPage`/`AthletesPage`.
- **`src/components/public/CombinedLeaderboardTable.tsx`**: estado `{key, dir} | null`; `sortedEntries` derivado (numérico para Pos./Total, `localeCompare("es")` para Atleta, score de cada WOD por id); celdas `-` al final; `rowSpan` de Pos./Atleta/Total conservado.
- **Tests**: `sortFilter.test.ts` (6), `AthletesPage.test.tsx` (5), `CombinedLeaderboardTable.test.tsx` (5), casos añadidos a `CompetitionsPage.test.tsx` (+3), `AffiliationsPage.test.tsx` (+2), `LocationsPage.test.tsx` (+2); `TeamsPage.test.tsx` (8) incluye búsqueda/orden.

### Tests (112 → **143**)
- 20 archivos · **143/143** en verde.

### Verificación
- `npm run lint` → 0 errores (1 warning preexistente `SidebarContext.tsx`).
- `npm run typecheck` → OK.
- `npm run test` → **143/143** (20 archivos).
- `npm run build` → OK (warning de chunk >500 kB preexistente).

### Verificación backend (Paso 14 del PLAN; solo comandos de prueba, sin migrate/seed)
- `python manage.py check` → *System check identified no issues (0 silenced)*.
- `python manage.py makemigrations --check --dry-run` → *No changes detected*.
- `python -m pytest tests` → **119 passed** (pytest.ini: `DJANGO_SETTINGS_MODULE=config.settings.development`, `--nomigrations`).
- **Lectura pública (II-E) confirmada en vivo** (GET sin token): `competitors/?competition=8` → 200 (2), `enabled-competition-categories/?competition=8` → 200, `competition-categories/?page_size=100` → 200, `leaderboards/competition/8/qualifier/` → 200. `teams/?page_size=100` → 401 sin token (esperado: catálogo de solo autenticados).

### Avisos (II-H es 100 % cliente)
1. Los listados usan `page_size=100`; si un catálogo supera 100 registros, búsqueda/orden solo alcanzan lo cargado (los viewsets ya declaran `search_fields`; no se usan).
2. El orden del leaderboard es solo visual: NO recalcula `rank`/`total_score`; no-finalistas (`-`) al final.
3. Verificación manual contra backend real (+ escenarios del `PLAN.md` Pasos 13/15) → **pendiente del usuario**.

---

## Paso 32 — Creación inline de atleta/equipo en el formulario de competidor (cierre) (COMPLETADO)

> Ejecución del `PLAN.md` (mejora de UX, 2026-09-23): desde
> `CompetitorFormPage` se crean **atleta** (Individual) y **equipo** (Equipo)
> sin salir del formulario; el registro creado queda seleccionado en su
> `<select>` automáticamente. Sin cambios de backend (se reutilizan
> `POST /athletes/` y `POST /teams/`, que ya responden el recurso con `id`).

### Requerimiento (decisiones del usuario)
- Creación inline para **atleta y equipo** (botón "+ Nuevo" solo cuando el tipo
  sea el correspondiente; disponible en creación y edición).
- `AthletesPage`/`TeamsPage` se mantienen **globales** (Parte II-G); no scope.
- `page_size=100` sin cambios; sin búsqueda server-side en los selects.
- Mini-form atleta = Nombre, Apellido, Fecha de nacimiento, Sexo (igual a
  `AthleteFormPage`); mini-form equipo = solo Nombre.

### Cambios aplicados
- **`src/components/admin/InlineEntitySelect.tsx`** (nuevo): `<select>` +
  "+ Nuevo" + panel inline colapsable con mini `useForm`/`zodResolver` derivado
  de `fields: InlineFieldConfig[]`. Sin `<form>` anidado (botones
  `type="button"`) para no interceptar el submit del formulario padre; errores
  de validación y de creación inline con `role="alert"`; los `fields` con
  `type: "select"` inician con la primera opción por defecto; `selectId` para
  asociar el `<label>` del form padre; `value` controlado desde el padre
  (`watch`) para que la selección persista cuando aparece la opción nueva.
  `key={competitorType}` en cada instancia para reiniciar el panel al alternar
  Individual/Equipo.
- **`src/pages/admin/CompetitorFormPage.tsx`**: se reemplazan los `<select>` de
  Atleta/Equipo (líneas 245-282) por dos instancias condicionales de
  `InlineEntitySelect`. `useCreateAthlete()`/`useCreateTeam()` ya existían
  (invalidan `["admin","athletes"]`/`["admin","teams"]`, por lo que los selects
  se refrescan tras crear). `onCreate` → `mutateAsync({...})`; `onSelectCreated`
  → `setValue("athlete"|"team", String(id))`. Atletas ordenados por
  `first_name + last_name` (es), equipos por `name` (es), como antes.
- **`tests/CompetitorFormPage.test.tsx`**: se amplía a **11 casos** — mocks de
  `useCreateAthlete`/`useCreateTeam` y listas dinámicas (arrays reconstruidos en
  cada `mockImplementation` para simular el refetch tras invalidar): crear
  atleta inline (payload + selección automática + opción nueva visible), crear
  equipo inline, validación inline (campos obligatorios, no llama a mutate),
  error de creación inline que mantiene el panel abierto, y cierre del panel al
  alternar tipo. Los 6 casos previos siguen en verde.

### Tests (143 → **148**)
- 20 archivos · **148/148** en verde.

### Verificación
- `npm run typecheck` → OK.
- `npm run lint` → 0 errores (1 warning preexistente `SidebarContext.tsx`).
- `npm run test` → **148/148** (20 archivos).
- `npm run build` → OK (warning de chunk >500 kB preexistente).

### Notas
- Backend **sin tocar** (`leader\Scorely`); avisos de seguridad §5 del `PLAN.md`
  (catálogos sin `IsSuperAdmin`, `CompetitorViewSet` sin guard, sin unicidad en
  `registration_number`) siguen pendientes (fuera de alcance).
- La selección automática depende de que la opción creada aparezca en el
  catálogo; en producción la invalidation de React Query lo garantiza; en los
  tests se simula devolviendo la lista actualizada tras la creación.
- Verificación manual (contrar con la UI) → **pendiente del usuario**.

## Paso 33 — Inscripción opcional integrada en el alta de atleta (cierre) (COMPLETADO)

> Ejecución del `PLAN.md` (2026-09-23): en `/admin/athletes/new` (solo modo
> creación) aparece una sección colapsable **"Inscribir en competición
> (opcional)"**. Si se usa, al guardar se crea el atleta (`POST /athletes/`) y
> luego la inscripción Individual (`POST /competitors/`) en la misma acción.
> Sin cambios de backend; el flujo inline de `CompetitorFormPage` queda intacto.

### Decisiones del usuario
- **Sumar bloque inline en atleta** (mantener el inline de `CompetitorFormPage`
  y agregar la sección opcional en el alta de atleta).
- **Nº de inscripción manual opcional** (el backend acepta vacío, `blank=True`).
- El bloque **solo en creación** (en `/admin/athletes/:id/edit` no tiene sentido).

### Cambios aplicados
- **`src/pages/admin/AthleteFormPage.tsx`**:
  - Hooks agregados: `useAdminCompetitions` (competiciones asignadas al admin),
    `useAdminEnabledCategories(competitionId)` (categorías habilitadas de la
    competición electa, etiquetadas por nombre del catálogo vía
    `useAdminCompetitionCategories`), `useCreateCompetitor(competitionId)`.
  - Estado local: `inscribeOpen`, `selectedCompetition`, `selectedCategory`,
    `registrationNumber`, `blockError` y `createdAthleteRef` (conserva el atleta
    creado ante un fallo posterior de inscripción → un reintento **no** duplica
    el atleta).
  - Sección colapsable (`aria-expanded`) tras Fecha de nacimiento/Sexo:
    selección de competición → categoría (deshabilitada hasta elegir
    competición, resetea la categoría al cambiar de competición) → nº opcional.
  - `onSubmit`: validación previa (competición sin categoría → error en el
    bloque y **no** crea nada); crear atleta; si hay competición+categoría →
    `createCompetitorMutation` con `INDIVIDUAL`, `athlete: atleta.id`,
    `team: null`, `registration_number` (trim), `competition`,
    `enabled_competition_category`; éxito → `/admin/athletes`; fallo de
    inscripción → "El atleta se guardó, pero la inscripción falló…", sin navegar
    y conservando los valores.
  - `saving` incluye también `createCompetitorMutation.isPending`.
- **`tests/AthleteFormPage.test.tsx`** (**nuevo, 5 casos**): mocks de
  `useAdminCompetitions`, `useAdminEnabledCategories`,
  `useAdminCompetitionCategories`, `useCreateCompetitor`, `fetchAthlete`:
  (a) alta simple sin tocar el bloque → solo crea atleta, no llama al competidor;
  (b) alta con inscripción → payload de atleta y luego competidor con
  `athlete = id` del creado, `team: null`, nº trim, competición y categoría;
  (c) competición sin categoría → error en el bloque y ninguna mutación;
  (d) fallo de inscripción → atleta creado + mensaje de aviso, reintento retoma
  la inscripción sin recrear el atleta; (e) bloque ausente en edición y PATCH
  conservando `id`.

### Tests (148 → **153**)
- 21 archivos · **153/153** en verde.

### Verificación
- `npm run typecheck` → OK.
- `npm run lint` → 0 errores (1 warning preexistente `SidebarContext.tsx`).
- `npm run test` → **153/153** (21 archivos).
- `npm run build` → OK (warning de chunk >500 kB preexistente).

### Notas
- **2 llamadas no transaccionales**: atleta + competidor. Si la inscripción
  falla tras crear el atleta, la UI informa y permite reintentar solo la
  inscripción (`createdAthleteRef`), evitando duplicar atletas.
- Backend **sin tocar** (`leader\Scorely`). `CompetitorViewSet` sigue sin guard
  de competición/rol (mismo aviso de la Parte II-F, fuera de alcance).
- Verificación manual (contrar con la UI) → **pendiente del usuario**.

## Paso 34 — Inscripción opcional integrada en el alta de equipo (cierre) (COMPLETADO)

> Extensión del Paso 33 (`PLAN.md` 2026-09-23): el bloque colapsable
> **"Inscribir en competición (opcional)"** se replica en `/admin/teams/new`
> (solo modo creación). Al guardar se crea el equipo (`POST /teams/`) y, si se
> eligió competición + categoría, la inscripción (`POST /competitors/` con
> `competitor_type: "TEAM"`). Sin cambios de backend.

### Cambios aplicados
- **`src/pages/admin/TeamFormPage.tsx`**: espejo del bloque de `AthleteFormPage`
  (Paso 33): sección colapsable (`aria-expanded`) tras "Nombre del equipo" con
  select de **Competición** (`useAdminCompetitions`), select de **Categoría**
  dependiente (`useAdminEnabledCategories` + nombres del catálogo) y campo
  **Nº de inscripción (opcional)**; `createdTeamRef` evita duplicar el equipo si
  la inscripción falla y se reintenta; payload de competidor `TEAM`
  (`athlete: null`, `team: equipo.id`); `saving` incluye
  `createCompetitorMutation.isPending`.
- **`tests/TeamFormPage.test.tsx`** (**nuevo, 5 casos**): espejo de
  `AthleteFormPage.test.tsx` — alta simple sin inscribir, alta + inscripción
  (payload `TEAM` con `team = id` del equipo creado), competición sin categoría
  (error, nada se crea), fallo de inscripción (aviso + reintento sin recrear el
  equipo), bloque ausente en edición (PATCH conservando `id`).

### Tests (153 → **158**)
- 22 archivos · **158/158** en verde.

### Verificación
- `npm run typecheck` → OK.
- `npm run lint` → 0 errores (1 warning preexistente `SidebarContext.tsx`).
- `npm run test` → **158/158** (22 archivos).
- `npm run build` → OK (warning de chunk >500 kB preexistente).

### Notas
- Mismas 2 llamadas no transaccionales del Paso 33; el reintento tras fallo de
  inscripción no duplica el equipo (`createdTeamRef`).
- Backend **sin tocar** (`leader\Scorely`).
- Verificación manual (contrar con la UI) → **pendiente del usuario**.