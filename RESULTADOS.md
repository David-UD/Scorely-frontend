# RESULTADOS — Implementación de las vistas públicas de Scorely

Fecha: 2026-09-11 (iteración inicial) / 2026-09-14 (bugfixes + leaderboard unificado)
Proyecto: Scorely-frontend (raíz, creado desde cero)
Especificación: `PROMPT.md` (Parte II — Pantalla pública con información del sistema)

---

## Qué se implementó

| Funcionalidad | Estado |
|---|---|
| `/` — Inicio público (Recientes + pestaña "Todas", búsqueda) | ✅ |
| `/competitions/:slug/` — Detalle público (info, afiliación, fechas, sede, mapa OSM, WODs, leaderboards) | ✅ |
| Leaderboard público **unificado** (Qualifier + Final en una tabla, total aditivo) y filtro de categoría | ✅ |
| `/login` (react-hook-form + zod, JWT) | ✅ |
| `/admin/*` protegido por `RoleGuard` (sin sesión → `/login`) | ✅ |
| E2E/Tests: Vitest + RTL (36 tests) | ✅ |
| Idioma español, tema claro (tokens TailAdmin sin dark mode) | ✅ |
| API client con `VITE_API_URL`, interceptor de refresh en 401 | ✅ |
| Docker dev (docker-compose.yml, Dockerfile, hot reload en :5173) | ✅ |

## Estructura creada (resumen)

```
.
├── .env / .env.example           # VITE_API_URL
├── Dockerfile / docker-compose.yml / .dockerignore   # dev con hot reload
├── vite.config.ts / tsconfig* / eslint.config.js
├── src/
│   ├── api/                     # client.ts (fetch+refresh), auth.ts, public.ts
│   ├── types/index.ts           # DTOs (Competition, Stage, EventWod, Leaderboard…)
│   ├── store/authStore.ts       # Zustand persist
│   ├── hooks/                   # useCompetitions, useCompetition, useCompetitionStages, useEvents, useLeaderboard
│   ├── components/common/       # Tabs, Badge, StatusBadge, Spinner, ErrorState, EmptyState, ScrollToTop
│   ├── components/public/       # CompetitionCard, LocationMap, WodList, CombinedLeaderboardTable, LeaderboardFilters
│   ├── layout/                  # PublicLayout, AdminLayout
│   ├── guards/RoleGuard.tsx
│   ├── pages/public/            # HomeIndex, CompetitionDetail
│   ├── pages/auth/LoginPage.tsx, pages/admin/AdminDashboard.tsx, NotFound
│   ├── utils/                   # cn, format (fechas es-ES)
│   └── styles/index.css         # tema claro Tailwind v4
└── tests/                       # setup, utils, fixtures, HomeIndex/CompetitionDetail/RoleGuard
```

## Decisiones y supuestos tomados

1. **Endpoints públicos (informado):** los GET de `competitions`, `competition-stages`, `events` y leaderboards ya son públicos en el backend (`IsAuthenticatedOrReadOnly` / `AllowAny` en `apps/competitions/views.py`, `apps/events/views.py`, `apps/rankings/views.py`). El frontend los consume sin token, salvo sesión activa. Para integrar el navegador, ajustar CORS: `config/settings/base.py` permite por defecto solo `http://localhost:3000`; configurar `CORS_ALLOWED_ORIGINS` con `http://localhost:5173` (dev).
2. **Rutas por `slug` (resuelto):** el backend ahora acepta `GET /api/v1/competitions/{slug}/` además de `{id}` (override de `get_object()` en `CompetitionViewSet`, con fallback a `slug` si el valor no es numérico; slug inexistente → 404). El frontend rutea `/competitions/:slug/` (`CompetitionCard` linkea `slug || id` como fallback). `competition-stages`/`leaderboards` siguen usando el `id` numérico devuelto por el detalle (dependencia secuencial en `CompetitionDetail`).
3. **Filtros del index:** solo búsqueda por nombre (query param `search`). No se enviaron `competition_type`/`status` por no conocer los códigos exactos del backend; el endpoint los soporta si se quieren añadir.
4. **Forma del payload de leaderboard:** el backend entrega bloques `{category: string, entries[]}` (con `competitor_id`, `display_name`, `final_score`, `event_ranks`). `normalizeLeaderboards` en `src/api/public.ts` mapea a `Leaderboard[]` inyectando `competition_id`/`stage` y convirtiendo `category` a `{code, name}` (code slugificado). Un `404` de etapa (ej. no hay etapa final) se interpreta como leaderboard vacío, no como error.
5. **Roles:** `RoleGuard` valida presencia de token; el rol se lee de `user.role` en el store si el login responde con `user`. Si el backend no incluye el rol en el login/perfil, adaptar.
6. **Estados vacíos:** competición sin etapas/WODs/leaderboard muestra estados vacíos claros y no rompe la página.
7. **Mapa:** embed de OpenStreetMap con `latitude`/`longitude`. Sin coordenadas → estado "Mapa no disponible".

## Verificaciones ejecutadas

| Chequeo | Resultado |
|---|---|
| `npm run lint` | OK (0 errores) |
| `npm run typecheck` (`tsc -b --noEmit`) | OK |
| `npm run test` | 36/36 en verde (8 archivos) |
| `npm run build` | OK (dist generado, Vite 6.4.3) |
| `npm run dev` | Arranca en `http://localhost:5173/` |

---

## Iteración 2026-09-14 — Bugfix: índice público, admin scope y PROMPT

### Problemas reportados

| # | Síntoma | Causa raíz |
|---|---------|-----------|
| A | El índice `/` solo mostraba competiciones **asignadas al usuario** tras login | Las funciones de `src/api/public.ts` usaban `request()` con `auth: true` por defecto → se adjuntaba el JWT y el backend (`IsAuthenticatedOrReadOnly`) filtraba el queryset por usuario |
| B | `/admin/events` mostraba "Sin eventos" (estado vacío) con competición asignada | `adminScopeStore.competitionId` iniciaba en `null`; `CompetitionScopeSelect` calculaba `effectiveId` pero nunca lo escribía en el store → las queries quedaban deshabilitadas (`enabled: Boolean(null)`) |
| C | `/admin/teams` mostraba "Sin equipos" (mismo motivo que B) | Idéntico a B |
| D | `PROMPT.md` no documentaba los endpoints de creación de eventos y equipos | Falta de especificación |

### Cambios aplicados

**1. `src/api/public.ts`** — Las 5 funciones de lectura pública ahora pasan `{ auth: false }` a `request()`: `getCompetitions`, `getCompetition`, `getCompetitionStages`, `getEvents`, `getLeaderboard`. Resultado: `/` y `/competitions/:slug/` muestran **todas las competiciones publicadas**, con o sin sesión.

**2. `src/components/admin/CompetitionScopeSelect.tsx`** — Nuevo `useEffect` que auto-escribe `effectiveId` (primera competición disponible) en `adminScopeStore` cuando no hay selección válida previa. Resultado: `/admin/events` y `/admin/teams` cargan los datos de la competición asignada de inmediato, sin exigir interacción con el selector.

**3. `PROMPT.md`** — Actualizado:
- Sección 7: endpoints de escritura de **eventos** (POST `{competition_stage, event_number, name, workout, description, is_ascending, is_active}`) y **equipos** (POST `{name, competition}`), PATCH/DELETE/GET, y tabla de catálogos.
- Sección 5: regla de negocio "el inicio siempre muestra todas las competiciones publicadas sin importar el login" y auto-selección del scope admin.
- Sección 12: resoluciones documentadas (públicos sin token, admin scope) y decisión pendiente de backend mantenida.

**4. `tests/publicApi.test.ts`** — Actualizado el test de `getLeaderboard` para esperar `{ auth: false }`, y añadidos tests que fijan que `getCompetitions`, `getCompetition` y `getCompetitionStages` nunca adjuntan auth. 29/29 tests.

### Verificación contra escenarios

| Escenario | Esperado |
|-----------|----------|
| `/` sin sesión | Muestra todas las competiciones publicadas |
| `/` con sesión | Muestra las **mismas** competiciones (no filtradas por usuario) |
| `/competitions/:slug/` sin sesión | Detalle completo (info, WODs, leaderboard) |
| `/admin/events` sin selección previa | Auto-selecciona la primera competición y lista sus eventos |
| `/admin/teams` sin selección previa | Auto-selecciona la primera competición y lista sus equipos |
| Cambio de competición en selector | Refresca eventos/equipos de la competición elegida |
| `/admin/*` sin sesión | Redirige a `/login` |

---

## Iteración 2026-09-14 — Bugfix: `/admin` solo competiciones asignadas

### Problemas reportados
1. `/admin/competitions` mostraba **todas** las competiciones (debía mostrar solo las asignadas al usuario).
2. El select de eventos y equipos (`CompetitionScopeSelect`) también mostraba todas.

### Causa raíz
`fetchAdminCompetitions()` delegaba en `getCompetitions()` de `public.ts`, que tras el fix anterior pasa `{ auth: false }`. Al no adjuntar el JWT, el backend no filtraba por usuario asignado.

### Cambios aplicados
- **`src/api/admin.ts`**: `fetchAdminCompetitions()` ahora usa `fetchCatalog<Competition>("/competitions/?page_size=100")` → `request()` con `auth: true` (JWT adjunto). El backend devuelve solo las competiciones asignadas (todas para superusuario). Se eliminó el import de `getCompetitions` de `./public`.
- **`tests/adminApi.test.ts`** (nuevo): fija que `fetchAdminCompetitions` no pasa `{ auth: false }` y que desempaqueta la página. Suite: **31/31**.

### Verificación contra escenarios

| Escenario | Esperado |
|-----------|----------|
| `/admin/competitions` (admin de competición) | Solo competiciones asignadas |
| `/admin/competitions` (superusuario) | Todas las competiciones |
| Select de eventos/equipos | Solo competiciones asignadas al usuario |
| `/` público | Sigue mostrando todas las publicadas (sin token) |

---

## Iteración 2026-09-14 — Leaderboard unificado Qualifier + Final

### Requerimiento
En la vista pública `/competitions/:slug/`, unificar las tablas del leaderboard de Qualifier y de Final en **una sola tabla por categoría**, con puntuación aditiva: `Total = puntos qualifier + puntos final` (ej.: 4 WODs de qualifier = 400 pts, WOD final = 100 pts → Total 500). Junto a cada WOD van sus puntajes.

Decisiones del usuario:
1. Los **no clasificados** (están en qualifier pero no en final) muestran `-` en la fase final (no hay puntos).
2. Si los WODs de clasificación o la final **aún no tienen datos**, se muestra `-` (no hay puntos).

### Diseño de la cabecera (pedido por el usuario)
```
Pos. │ Atleta │ Qualifier (colSpan) │ Final (colSpan) │ Total
     │        │ Score 1 │ Score 2 … │ Score 1 │ Score 2 … │
```
- `Pos.`, `Atleta` y `Total` ocupan 2 filas (rowSpan).
- `Qualifier` y `Final` agrupan cada uno sus columnas `Score N` (colSpan = cantidad de WODs de la etapa).
- Sin columna "Puntos" por fase: cada WOD lleva su puntaje y el `Total` es la suma aditiva.
- Si una fase no tiene WODs publicados, el grupo muestra una columna `Score` única con `-`.

### Cambios aplicados
- **`src/types/index.ts`**: nuevos DTOs `CombinedLeaderboardEntry` (con referencias `qualifier`/`final` a `LeaderboardEntry | null` y `total_score`) y `CombinedLeaderboard`.
- **`src/utils/leaderboard.ts`** (nuevo): helper `combineLeaderboards(qualifier, final)` — une por categoría y por `competitor_id`, calcula `total_score`, ordena **finalistas primero** (por total desc) y después los no clasificados (por puntos de qualifier desc), recalcula `rank` 1-based y une las categorías de ambas fases (atorman: si una categoría solo existe en una fase, se conserva).
- **`src/components/public/CombinedLeaderboardTable.tsx`** (nuevo): reemplaza a `LeaderboardTable` (eliminado). Cabecera agrupada de 2 filas descrita arriba; por fila muestra los puntajes de cada WOD y el Total. `-` cuando el atleta no tiene datos en la fase (no clasificado o fase sin publicar) o cuando no hay WODs para esa etapa.
- **`src/pages/public/CompetitionDetail.tsx`**: se quitaron las pestañas Qualifier/Final (`Tabs`/`STAGE_TABS`/`stageTab`) y la carga por etapa activa; ahora usa `qualifierQuery` + `finalQuery` juntos, `combineLeaderboards(...)`, pasa a `CombinedLeaderboardTable` los WODs de ambas etapas (`qualifierWods`/`finalWods` desde `eventsByStage`) y conserva el filtro por categoría sobre las categorías unidas.
- **`tests/CompetitionDetail.test.tsx`**: adaptado al leaderboard unificado (2 etapas, total aditivo 500, `-` en no clasificado, filtro por categoría).
- **`tests/leaderboardCombine.test.ts`** (nuevo): 5 tests del helper (join por competidor, total aditivo, orden finalistas→no clasificados, unión de categorías, atletas solo de final, lista vacía).

### Verificación
- `npm run lint` → OK (0 errores; 1 warning preexistente de fast-refresh en `SidebarContext.tsx`)
- `npm run typecheck` → OK
- `npm run test` → **36/36** en verde (8 archivos)
- `npm run build` → OK (dist generado, Vite 6.4.3)

### Notas
- La columna `Total` hereda el orden: primero finalistas por total desc, luego no clasificados por cualifier desc.
- Si ninguna fase tiene leaderboard, se muestra el estado vacío "Leaderboard sin resultados".

---

## Iteración 2026-09-15 — Sincronización con refactor del backend (Event→competition+phase)

El usuario refactoreó el backend (`leader\Scorely`) y pidió reflejarlo en la documentación del frontend.

### Cambios de backend verificados
1. **`CompetitionStage` eliminado**: `Event` ahora cuelga de `competition` + `phase` (`QUALIFIER`/`FINAL`). Migración `events/0006` reescrita con backfill (`competition_id`, `phase`) y aplicada; el `0006_..._.py` duplicado buggy fue borrado. Constraint único `(competition, phase, event_number)`.
2. **`finalist_slots` movido a `EnabledCompetitionCategory`** (por categoría): migraciones `events/0007` (AddField + backfill) y `competitions/0005` (remove del campo global). Verificado en BD: cf_a 2/2/2, cf_b 2, hy_a/hy_b 0.
3. **`event_results[]` como objetos**: cada entrada es `{event_id, event_number, event_name, phase, result, event_rank, score}` (antes listas planas).
4. Verificación backend: `makemigrations --check --dry-run` limpio, `migrate` OK, **120/120** tests.

### Cambios aplicados en el frontend
- **`PROMPT.md`**: DTOs nuevos (`EnabledCompetitionCategory.finalist_slots`, `event_results[]` objetos, WODs sin `competition_stage`), endpoints (`enabled-competition-categories/?competition={id}`, `events/?competition&phase`, payload de escritura con `competition`+`phase`), criterios de aceptación y observaciones alineados.
- **`PLAN.md`** y **`Process.md`** (nuevo Paso 19): payloads/flujos de eventos actualizados a `competition`+`phase`; eliminadas las referencias viejas a `competition_stage`.

### Refactor del código fuente al nuevo modelo (completado en esta iteración)

Eliminadas todas las referencias a `competition-stages`/`competition_stage`/`CompetitionStage` del código fuente:

- **`src/types/index.ts`**: eliminado `CompetitionStage`; nuevos tipos `EventPhase` (`QUALIFIER`/`FINAL`), `EventWod` con `competition`+`phase` (sin `competition_stage`), `EventWritePayload` con `competition`+`phase`, `EventResult` (`event_id`, `event_number`, `event_name`, `phase`, `result`, `event_rank`, `score`), `EnabledCompetitionCategory` con `finalist_slots`, `CombinedLeaderboardEntry` con `event_results[]` + `qualified` (antes referencias `qualifier`/`final`).
- **`src/api/public.ts`**: eliminados `getCompetitionStages`/`RawStage`/`toStage`/`normalizeStages`; `getEvents(competitionId, phase?)` → `/events/?competition={id}&page_size=100&phase=...`; nuevo `getEnabledCompetitionCategories` → `/enabled-competition-categories/?competition={id}`.
- **`src/api/admin.ts`**: eliminados `fetchStages`/`fetchStage`; `fetchEvents` → `/events/?competition={id}&page_size=100`; nuevo `fetchEnabledCompetitionCategories`.
- **Hooks**: eliminado `useCompetitionStages.ts` y `useAdminStages` de `useAdminModules.ts`; `useEvents` ahora filtra por `(competitionId, phase)`; nuevo `useEnabledCompetitionCategories.ts`.
- **`src/pages/public/CompetitionDetail.tsx`**: sin stages; carga eventos por fase (`useEvents(id, "QUALIFIER")` / `useEvents(id, "FINAL")`) y el leaderboard **overall** (`/final/`); `WodList` por fase (`Qualifier`/`Final`); categorías desde el payload del leaderboard.
- **`src/utils/leaderboard.ts`**: `combineLeaderboards(qualifier, final)` reemplazado por `buildCombinedLeaderboards(overall)` — mapea las entradas del overall (que ya incluyen todas las fases con `phase` en `event_results[]`), modelo aditivo (`total_score` = `final_score`), `qualified` = tiene algún resultado FINAL no nulo.
- **`src/components/public/CombinedLeaderboardTable.tsx`**: lee los puntajes por WOD desde `event_results` (por `event_id`), muestra `#rang · resultado` como detalle, y `-` en Final/Total para no finalistas.
- **`src/components/public/WodList.tsx`**: prop `stageName` → `phaseName`.
- **Admin**: `EventsPage` muestra la columna `Fase` (desde `event.phase`) ordenado por fase+número; `EventFormPage` reemplaza el select de etapa por uno de `Fase` (`QUALIFIER`/`FINAL`) y envía `{competition, phase, ...}`.

### Verificación
`npm run lint` (0 errores) / `typecheck` / `build` → OK; `npm run test` → **39/39**. Endpoints reales verificados en vivo: `GET /api/v1/events/?competition=8&page_size=50` → 200 (1 evento), `GET /api/v1/leaderboards/competition/8/final/` → 200 (1 categoría, entradas con `event_results[]` incluyendo `phase`/`result`/`event_rank`/`score`). Ya no se invoca `/competition-stages/` (inexistente).

---

## Criterios de aceptación (PROMPT §11)

- [x] build sin errores
- [x] lint sin errores
- [x] typecheck sin errores
- [x] suite de tests en verde (frontend 39/39)
- [x] `/` renderiza recientes + pestaña "todas" (con backend disponible/público)
- [x] `/` muestra **todas las competiciones publicadas** con sesión activa o no (2026-09-14)
- [x] detalle muestra info, afiliación, fechas, mapa, WODs y leaderboard
- [x] URLs por slug (`/competitions/{slug}/`), backend resuelve slug e id; slug inválido → 404
- [x] filtros de leaderboard (etapa/categoría)
- [x] `/admin/*` protegido (redirige a login sin sesión)
- [x] solo español, tema claro
- [x] no se tocó `free-react-tailwind-admin-dashboard/`

## No se tocó

- Clon de referencia `free-react-tailwind-admin-dashboard/` (solo lectura, y excluido del lint).
- No se crearon ramas ni se hizo push/commit (sin operaciones git).

## Pasos manuales pendientes del usuario

1. Configurar `VITE_API_URL` real en `.env` (actual: `http://localhost:8000/api/v1`).
2. CORS: incluir `http://localhost:5173` en `CORS_ALLOWED_ORIGINS` del backend para probar desde el navegador.
3. Verificar contra el backend real la forma exacta de los payloads (paginación, campos de leaderboard/eventos) y ajustar `types/` y `normalizeLeaderboards` si difiere.
4. Confirmar códigos exactos de `status` y `competition_type` para el `StatusBadge`.
5. (Opcional) Playwright e2e: no instalado en esta iteración (requiere descargar navegadores).
6. (Siguiente iteración) CRUD completo del panel `/admin` sobre el layout TailAdmin.
7. **(Hecho, 2026-09-15)** Refactor del frontend al nuevo modelo: eliminadas `competition-stages`/`competition_stage`/`CompetitionStage` del código fuente; consumir `events?competition&phase`, `enabled-competition-categories` (con `finalist_slots`) y `event_results[]` como objetos.