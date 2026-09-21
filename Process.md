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