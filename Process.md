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
- `CompetitionCard`, `LocationMap` (embed OSM, sin API key), `WodList` (tabla), `LeaderboardTable` (pos/atletas/eventos/puntuación), `LeaderboardFilters` (selector de categoría). `utils/format.ts` (fechas es-ES), `utils/cn.ts`.

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