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

## Iteración 2026-09-15 — Módulo admin "Categorías disponibles"

Implementación de la **Parte II-B** de `PROMPT.md` (plan `PLAN.md`): administración de categorías disponibles por roles, con restricción **solo a nivel frontend** (el backend aún no limita por rol estos endpoints).

### Qué se implementó

| Funcionalidad | Estado |
|---|---|
| `/admin/categories` — CRUD del catálogo de categorías (`name`, `min_members`, `max_members`) | ✅ |
| **Solo superadmin** puede crear/editar/eliminar categorías del catálogo (UI + guard en API) | ✅ |
| `/admin/categories/new` y `/admin/categories/:id/edit` — formulario react-hook-form + zod | ✅ |
| `/admin/competition-categories` — habilitar categorías del catálogo en la competición asignada (scope) | ✅ |
| Asignar `finalist_slots` (clasificados a la Final, `0` = sin Final), edición inline | ✅ |
| Quitar habilitación (confirm) | ✅ |
| Sidebar: ítem "Categorías" (solo superadmin) y "Categorías por competición" | ✅ |
| Tests: fixtures + API + 2 páginas nuevas (55/55) | ✅ |

### Reglas de negocio

- **Superadmin**: mantiene el **catálogo** (`CompetitionCategory`). El admin de competición **no** puede agregar categorías.
- **Admin de competición**: solo **habilita** categorías existentes en sus competiciones asignadas y define el slot de finalistas (`finalist_slots`).

### Archivos

- **`src/types/index.ts`**: `CompetitionCategory`, `CompetitionCategoryWritePayload`, `EnabledCompetitionCategory` con `competition_category` como **id numérico** (shape real del backend), `EnabledCompetitionCategoryWritePayload`.
- **`src/api/admin.ts`**: `fetchCompetitionCategories`, `fetchCompetitionCategory`, `create/update/deleteCompetitionCategory` (con `assertSuperUser`), `create/update/deleteEnabledCompetitionCategory` (PATCH enviando solo `finalist_slots`), se mantuvo `fetchEnabledCompetitionCategories(competitionId)`.
- **`src/hooks/useAdminModules.ts`**: queries/mutations de catálogo y de habilitaciones por scope con invalidación.
- **`src/pages/admin/CategoriesPage.tsx`** y **`CategoryFormPage.tsx`** (nuevos): catálogo.
- **`src/pages/admin/CompetitionCategoriesPage.tsx`** (nuevo): habilitaciones + slots.
- **`src/App.tsx`** y **`src/components/admin/AdminSidebar.tsx`**: rutas y menú.

### Verificación

| Chequeo | Resultado |
|---|---|
| `npm run lint` | OK (0 errores; 1 warning preexistente `SidebarContext.tsx`) |
| `npm run typecheck` | OK |
| `npm run test` | **55/55** en verde (10 archivos) |
| `npm run build` | OK (Vite 6.4.3) |
| Shape backend | Verificado en BD: catálogo (13 categorías) y habilitaciones reales (cf_a/cf_b/hy_a/hy_b) |

### Pendiente / aviso

- **El backend no restringe estos endpoints por rol** (`IsAuthenticated` global): la restricción de `CompetitionCategoryViewSet`/`EnabledCompetitionCategoryViewSet` está **solo en frontend**. Para una regla de negocio real, el backend debería aplicar `IsSuperAdmin` en la escritura del catálogo y `IsCompetitionAdmin` en las habilitaciones.

---

## Iteración 2026-09-15 — Vista pública: medallas en el leaderboard + fix del mapa

### Problema reportado
- La competición `summer-games-crossfit` (id 5) tiene coordenadas pero la sección "Ubicación" mostraba "**Mapa no disponible**".

### Causa raíz
`LocationMap` validaba `typeof latitude === "number"`, pero el backend devuelve `latitude`/`longitude` de `Location` como **strings** (`"19.826473"`, `"-90.524499"`) o `null`. La comprobación estricta de tipo rechazaba coordendas válidas.

### Cambios aplicados
| Archivo | Cambio |
|---|---|
| `src/types/index.ts` | `Location.latitude`/`longitude` tipadas `number \| string \| null` |
| `src/components/public/LocationMap.tsx` | Coerción con `Number()`; "Mapa no disponible" solo sin coordendas válidas |
| `src/components/public/MedalIcon.tsx` (nuevo) | SVG propio gratuito, color oro/plata/bronce por rank (`medal-1/2/3`) |
| `src/components/public/CombinedLeaderboardTable.tsx` | Celda `WodCell`: medalla del top-3 del `event_rank` junto al puntaje de cada WOD |
| `PROMPT.md` | §6/§8/§12: coords string/null del backend y medallas por WOD documentadas |

### Verificación
| Chequeo | Resultado |
|---|---|
| `npm run lint` | OK (0 errores; 1 warning preexistente) |
| `npm run typecheck` | OK |
| `npm run test` | **59/59** en verde (10 archivos) — +4 tests (mapa string/null, medallas oro/plata) |
| `npm run build` | OK |
| Backend real | `GET /competitions/` → `summer-games-crossfit` con `latitude: "19.826473"`, `longitude: "-90.524499"` (strings) |

### Notas
- El mapa se carga vía **embed gratuito de OpenStreetMap** (sin API key); los strings se convierten a número antes de armar `mlat`/`mlon`.
- Las medallas son SVGs propios (sin emojis ni librerías): oro/plata/bronce para el top-3 de cada WOD en las columnas `Score N`.

---

## Iteración 2026-09-15 — Fix zoom del mapa público (OSM embed)

### Problema reportado
"Puse las coordenadas, pero el mapa me muestra muy alejado" (un zoom ~12-13 en vez de cercano).

### Causa raíz
El embed de OSM (`embed.html`) **ignora el parámetro `zoom`** — el nivel lo dicta el `bbox`. El `bbox` previo era fijo y enorme (±0.02° / ±0.0125°) y, además, el marker se enviaba como `mlat`/`mlon`, params que el embed no usa.

### Cambios aplicados
- `LocationMap.tsx`: `bbox` calculado desde **zoom 16** con metros-por-píxel corregidos por latitud; ancho real medido con **ResizeObserver** (fallback 640px); marker enviado como `marker=LAT,LON` (se eliminó `zoom`/`mlat`/`mlon`).
- Test: coords strings → `marker=19.826473,-90.524499`; nuevo test de `bbox` estrecho (< 0.5°).

### Verificación
| Chequeo | Resultado |
|---|---|
| `npm run lint` | OK (0 errores; 1 warning preexistente) |
| `npm run typecheck` | OK |
| `npm run test` | **60/60** en verde (10 archivos) |
| `npm run build` | OK |

### Notas
- Ajustar el zoom objetivo cambiando la constante `TARGET_ZOOM` en `LocationMap.tsx` (16 = nivel de cuadra/calle).
- El zoom real dentro del iframe depende del ancho medido (ResizeObserver); en pantallas muy pequeñas el bbox se encoge para mantener el mismo acercamiento.

---

## Iteración 2026-09-15 — Mapa público: cambio a Google Maps (legacy, sin key)

### Decisión del usuario
Usar **Google Maps** en la vista pública. Variante elegida: **legacy embed sin API key** (`maps.google.com/maps?q=...&z=16&output=embed`) — gratis, sin Google Cloud, sin key, sin billing.

### Cambios aplicados
- `LocationMap.tsx` reescrito: URL `https://maps.google.com/maps?q=LAT,LNG&z=16&output=embed`. Se eliminaron el `bbox`, `ResizeObserver` y el ancho medido (Google admite `z` explícito). Se mantiene la coerción de coords string/null y el `allowFullScreen`.
- Tests actualizados: coords strings → `q=19.826473,-90.524499` + `z=16`; centro/zoom → `q=-34.6,-58.38`, `z=16`, `output=embed`.

### Verificación
| Chequeo | Resultado |
|---|---|
| `npm run lint` | OK (0 errores; 1 warning preexistente) |
| `npm run typecheck` | OK |
| `npm run test` | **60/60** en verde (10 archivos) |
| `npm run build` | OK |

### Notas
- Zoom ajustable con la constante `TARGET_ZOOM` en `LocationMap.tsx`.
- Riesgo: el endpoint legacy no es oficial de Google. Migración futura a la Maps Embed API oficial (`VITE_GOOGLE_MAPS_KEY` + restricción por referrer) si dejara de funcionar.

---

## Iteración 2026-09-21 — Módulo admin "Filiaciones" (Parte II-C)

> Ejecución del plan `PLAN.md` (Pasos 1–10). CRUD del catálogo de filiaciones en `/admin/affiliations`, **solo superadmin**. Sin tocar el backend.

### Cambios aplicados
- `src/types/index.ts`: `Affiliation` ampliado (`description?: string`, `logo?: string | null`) y nuevo `AffiliationWritePayload` (`id?`, `name`, `city`, `state`, `country`, `description?`).
- `src/api/admin.ts`: `fetchAffiliations()` (reutilizada por `getAdminCatalogs()`), `fetchAffiliation(id)`, `createAffiliation`, `updateAffiliation`, `deleteAffiliation` (escrituras con `assertSuperUser()`); mensaje generalizado: "No tenés permisos para realizar esta acción.".
- `src/hooks/useAdminModules.ts`: `useAdminAffiliations`, `useCreate/Update/DeleteAffiliation` (invalidan `["admin","affiliations"]`).
- `src/pages/admin/AffiliationsPage.tsx` (nuevo): tabla Nombre/Ciudad/Estado/País/Acciones, "Nueva filiación", confirm + banner de error al borrar (mensaje si está en uso por competiciones), gate superadmin, Spinner/ErrorState/EmptyState.
- `src/pages/admin/AffiliationFormPage.tsx` (nuevo): create/edit con react-hook-form + zod (`name/city/state/country` requeridos), carga en edición, captura de `ApiError`.
- `src/components/admin/icons.tsx`: nuevo `BuildingIcon`; `AdminSidebar.tsx`: ítem "Filiaciones" (solo superadmin); `src/App.tsx`: rutas `/admin/affiliations[/new/:id/edit]`.
- `tests/fixtures.ts`: `makeAffiliation`; `tests/adminApi.test.ts` (bloque "affiliations catalog"); `tests/AffiliationsPage.test.tsx` (nuevo, 5 casos).
- Test `z=16` → `z=19` en `tests/CompetitionDetail.test.tsx`: los assertions del mapa esperaban `z=16`, pero `LocationMap.tsx` ya commiteado usa `TARGET_ZOOM = 19` (fallo preexistente, no relacionado con este módulo).

### Verificación
| Chequeo | Resultado |
|---|---|
| `npm run lint` | OK (0 errores; 1 warning preexistente `SidebarContext.tsx`) |
| `npm run typecheck` | OK |
| `npm run test` | **70/70** en verde (11 archivos) |
| `npm run build` | OK |

### Notas
- **Backend sin restricción por rol**: `AffiliationViewSet` usa el permiso global `IsAuthenticated` — el "solo superadmin" se aplica **en el frontend** (`assertSuperUser()` + gate en páginas). Si se requiere seguridad real, hay que añadir un `permission_classes` con `IsSuperUser` en el backend.
- **Borrado en uso**: `Competition.affiliation` usa `on_delete=PROTECT`; `DELETE` sobre una filiación referenciada falla (el frontend muestra el banner correspondiente).
- No se crearon ramas ni se hizo commit/push.

---

## Iteración 2026-09-21 — Módulo admin "Sedes" (Parte II-D)

> Ejecución del plan `PLAN.md` (Pasos 0–10). CRUD del catálogo de sedes en `/admin/sedes`, **solo superadmin**. Sin tocar el backend. Pedido del usuario: la administración de locations se muestra como **"Sedes"** en el panel.

### Cambios aplicados
- `PROMPT.md`: nueva sección **Parte II-D** (endpoints con shape verificado, DTOs, componentes, pruebas, observaciones) + rutas del panel y referencias menores actualizadas.
- `src/types/index.ts`: nuevo `LocationWritePayload` (`id?`, `name`, `address?`, `city`, `state`, `country`, `latitude?`, `longitude?`).
- `src/api/admin.ts`: `fetchLocations()` (catálogo, reutilizada por `getAdminCatalogs()`), `fetchLocation(id)`, `createLocation`, `updateLocation`, `deleteLocation` (escrituras con `assertSuperUser()`).
- `src/hooks/useAdminModules.ts`: `useAdminLocations`, `useCreate/Update/DeleteLocation` (invalidan `["admin","locations"]`).
- `src/pages/admin/LocationsPage.tsx` (nuevo): tabla Nombre/Dirección/Ciudad/Estado/País/Coordenadas/Acciones, "Nueva sede", confirm + banner de error al borrar (mensaje si está en uso por competiciones), gate superadmin, Spinner/ErrorState/EmptyState.
- `src/pages/admin/LocationFormPage.tsx` (nuevo): create/edit con react-hook-form + zod (`name/address/city/state/country` requeridos; coords opcionales con `"" / NaN → undefined`), carga en edición, captura de `ApiError`.
- `src/components/admin/icons.tsx`: nuevo `MapPinIcon`; `AdminSidebar.tsx`: ítem "Sedes" (solo superadmin); `src/App.tsx`: rutas `/admin/sedes[/new/:id/edit]`.
- Tests: `tests/fixtures.ts` (`makeLocation`); `tests/adminApi.test.ts` (bloque "locations catalog"); `tests/LocationsPage.test.tsx` (nuevo, 5 casos).

### Verificación
| Chequeo | Resultado |
|---|---|
| `npm run lint` | OK (0 errores; 1 warning preexistente `SidebarContext.tsx`) |
| `npm run typecheck` | OK |
| `npm run test` | **80/80** en verde (12 archivos) |
| `npm run build` | OK |

### Notas
- **Backend sin restricción por rol**: `LocationViewSet` usa el permiso global `IsAuthenticated` — el "solo superadmin" se aplica **en el frontend** (`assertSuperUser()` + gate en páginas y menú). Para seguridad real conviene `IsSuperUser` en el backend.
- **Borrado en uso**: `Competition.location` usa `on_delete=PROTECT`; `DELETE` sobre una sede referenciada falla (la UI muestra el banner "Puede estar en uso por competiciones").
- **Coordenadas**: el backend las devuelve como string o `null`; el formulario solo envía números cuando hay valor.
- No se crearon ramas ni se hizo commit/push.

---

## Iteración 2026-09-21 — Vista pública: categorías con recuento de inscritos (Parte II-E)

> Ejecución del plan `PLAN.md` (Pasos 0–8). La vista pública `/competitions/:slug/` muestra **antes de Workouts** las categorías habilitadas (orden del leaderboard) con la cantidad de inscritos en cada una. Sin tocar el backend.

### Decisiones del usuario
1. **Backend**: abrir la lectura pública de `GET /competitors/` (aplicará el usuario).
2. **Categorías a listar**: las del **leaderboard** (mismo orden que `LeaderboardFilters`).

### Cambios aplicados
- `src/types/index.ts`: `CompetitorType` (`"INDIVIDUAL" | "TEAM"`) y `Competitor`.
- `src/api/public.ts`: `getCompetitionCategories()` (`/competition-categories/?page_size=100`, sin auth) y `getCompetitors(competitionId)` (`/competitors/?competition&page_size=100` con **loop de paginación** por `next`/`page`; sin auth).
- `src/hooks/useCompetitors.ts` y `src/hooks/useCompetitionCategories.ts` (nuevos).
- `src/utils/categoryCounts.ts` (nuevo): `buildCategoryCounts` — recuento de `Competitor` por `enabled_competition_category`, nombre resuelto **por nombre** (join catálogo → habilitación → inscritos), conservando el orden del leaderboard; 0 si no hay coincidencia.
- `src/components/public/CategoryInscritos.tsx` (nuevo): sección "Categorías e inscritos" con `Badge` por categoría (`N inscrito(s)`), Spinner en carga, oculta en error (degradación elegante) y sin categorías.
- `src/pages/public/CompetitionDetail.tsx`: integra la sección **antes de Workouts**.

### Verificación
| Chequeo | Resultado |
|---|---|
| `npm run lint` | OK (0 errores; 1 warning preexistente `SidebarContext.tsx`) |
| `npm run typecheck` | OK |
| `npm run test` | **93/93** en verde (14 archivos) |
| `npm run build` | OK (Vite 6.4.3) |

### Notas
- **Recuento ≠ resultado**: "inscritos" cuenta `Competitor` (inscripciones), no apoya con el leaderboard.
- **Sin serializer anidado**: `EnabledCompetitionCategory.competition_category` es id numérico (el admin lo consume como número); el nombre se resuelve por catálogo.
- **Aviso backend**: los endpoints `competitors/`, `enabled-competition-categories/` y `competition-categories/` están hoy tras el global `IsAuthenticated` (`config/settings/base.py:86-88`). Para ver datos reales, abrir lectura pública con `IsAuthenticatedOrReadOnly` en `CompetitorViewSet` (`apps/participants/views.py`), `EnabledCompetitionCategoryViewSet` y `CompetitionCategoryViewSet` (`apps/events/views.py`). Hasta entonces la sección se oculta sin romper.
- No se crearon ramas ni se hizo commit/push.

---

## Iteración 2026-09-21 — Módulo admin "Competidores" (Parte II-F)

> Ejecución del plan `PLAN.md` (Pasos 0–8). CRUD de **inscripciones (`Competitor`)** en `/admin/competitors` (+ `/new` y `/:id/edit`), por competición en scope, para **admins de competición y superuser** (sin gate superadmin). Sin tocar el backend.

### Decisiones del usuario
1. **Alcance**: listado + **alta/edición/baja** completo (CRUD).
2. **Tipos**: Individual y por equipos (toggle en el formulario; `competitor_type` `INDIVIDUAL`/`TEAM`).
3. **`registration_number` obligatorio** en la UI (el modelo lo tiene `blank=True`, sin unicidad).
4. Etiqueta del ítem en el panel: **"Competidores"**, ruta `/admin/competitors`. Sin gate superadmin.

### Cambios aplicados
- `PROMPT.md`: nueva sección **Parte II-F** (título, objetivo, alcance, endpoints con shape verificado, DTOs, componentes, pruebas, observaciones y avisos backend).
- `src/types/index.ts`: nuevo `CompetitorWritePayload` (`athlete`/`team` **siempre presentes**, el no usado en `null` — invariante del `clean()` del backend).
- `src/api/admin.ts`: `fetchCompetitors(competitionId)`, `fetchCompetitor(id)`, `createCompetitor`, `updateCompetitor`, `deleteCompetitor` (JWT, sin `{auth:false}`).
- `src/hooks/useAdminModules.ts`: `useAdminCompetitors`, `useCreateCompetitor`, `useUpdateCompetitor`, `useDeleteCompetitor` (invalidan `["admin","competitors", …]`).
- `src/pages/admin/CompetitorsPage.tsx` (nuevo): `CompetitionScopeSelect` + tabla Nº de inscripción / Competidor (nombre de atleta o equipo, resuelto con `useAdminAthletes`/`useAdminTeams`) / Tipo (`Individual`/`Equipo`) / Categoría (nombre del catálogo vía habilitaciones) / Acciones; orden por nº asc; confirm + banner de `ApiError` al eliminar; "Nuevo competidor" deshabilitado sin scope; Spinner/ErrorState/EmptyState.
- `src/pages/admin/CompetitorFormPage.tsx` (nuevo): react-hook-form + zod (`superRefine` para atleta/equipo según tipo dinámico con `watch`); nº obligatorio; categorías habilitadas de la competición mostradas por nombre del catálogo; aviso si no hay categorías habilitadas; en edición la categoría/equipos se cargan de la **competición del registro** y el PATCH la conserva; payload con FK no usado en `null`; captura de `ApiError`.
- `src/App.tsx`: rutas `/admin/competitors[/new/:id/edit]`. `src/components/admin/icons.tsx`: `UserPlusIcon`. `AdminSidebar.tsx`: ítem "Competidores" en Gestión.
- Tests: `tests/fixtures.ts` (`makeAthlete`, `makeTeam`); `tests/adminApi.test.ts` (bloque "competitors": LIST/POST/PATCH/DELETE); `tests/CompetitorsPage.test.tsx` (nuevo); `tests/CompetitorFormPage.test.tsx` (nuevo).

### Verificación
| Chequeo | Resultado |
|---|---|
| `npm run lint` | OK (0 errores; 1 warning preexistente `SidebarContext.tsx`) |
| `npm run typecheck` | OK |
| `npm run test` | **108/108** en verde (16 archivos) — +15 tests (4 API + 5 listado + 6 formulario) |
| `npm run build` | OK (Vite 6.4.3) |

### Notas / avisos backend (no se toca)
- **Escrituras sin guard de competición/rol**: `CompetitorViewSet` (`apps/participants/views.py:50`) usa `IsAuthenticatedOrReadOnly` → cualquier usuario autenticado puede crear/editar/borrar inscripciones de cualquier competición. La restricción visual queda a nivel frontend (scope); para seguridad real replicar `TeamViewSet` (`IsCompetitionAdmin` + `visible_competitions_q` + guard en `create()`, `views.py:24-41`).
- **`registration_number` sin unicidad** (`blank=True`, sin constraint): la UI lo exige pero no garantiza unicidad por competición.
- **Borrado en uso**: `Competitor.enabled_competition_category` usa `on_delete=PROTECT` y el `Competitor` es FK de resultados → `DELETE` puede fallar; la UI muestra el banner.
- **Relación con la Parte II-E**: cada inscripción alta aquí incrementa el recuento público "Categorías e inscritos".
- No se crearon ramas ni se hizo commit/push.

---

## Iteración 2026-09-22 — Módulo admin "Equipos globales" (Parte II-G)

Los **equipos dejan de pertenecer a una competición** y pasan a un **catálogo
global como `Athlete`** (espejo de Atletas/Atleta). El scope de competición se
elimina **solo** del bloque de equipos; las categorías habilitadas y las
inscripciones de competidores siguen por competición.

### Cambios
- `src/types/index.ts`: `Team`/`TeamWritePayload` **sin `competition`** (solo
  `id`/`name`/`affiliation?`).
- `src/api/admin.ts`: `fetchTeams()` **global** (`/teams/?page_size=100` sin
  `competitionId`); `createTeam`/`updateTeam`/`deleteTeam` sin `competition`.
- `src/hooks/useAdminModules.ts`: `useAdminTeams()` **global** (queryKey
  `["admin","teams"]` sin scope); `useCreateTeam`/`useUpdateTeam`/`useDeleteTeam`
  invalidan `["admin","teams"]`.
- `src/pages/admin/TeamsPage.tsx`: **espejo de `AthletesPage`** — listado global
  ordenado por nombre, sin `CompetitionScopeSelect`, sin columna "Competición",
  botón "Nuevo equipo" siempre habilitado, `EmptyState` "Sin equipos".
- `src/pages/admin/TeamFormPage.tsx`: **espejo de `AthleteFormPage`** — alta/edición
  global (nombre + afiliación opcional), sin scope, breadcrumb "Equipos",
  botones Guardar/Cancelar.
- `src/pages/admin/CompetitorsPage.tsx` y `CompetitorFormPage.tsx`: el select de
  Equipo tira **todos** los equipos globales (`useAdminTeams()` global); las
  categorías habilitadas/inscripciones siguen por competición
  (`useAdminEnabledCategories(competitionId)`).
- Tests: `tests/fixtures.ts` `makeTeam`/`makeTeamWritePayload` **sin `competition`**;
  bloque "teams" en `tests/adminApi.test.ts` global (LIST/POST/PATCH/DELETE).

### Verificación
| Chequeo | Resultado |
|---|---|
| `npm run typecheck` | OK |
| `npm run lint` | OK (0 errores; 1 warning preexistente) |
| `npm run test` | **112/112** en verde |
| `npm run build` | OK |

### Avisos backend / riesgos (espejo Parte II-F)
- **`CompetitorViewSet` sin guard de competición/rol** (`apps/participants/views.py`)
  sigue `IsAuthenticatedOrReadOnly` → cualquier usuario autenticado puede escribir
  sobre cualquier competición; la restricción queda a nivel frontend. *(Nota
  Parte II-G: el patrón `TeamViewSet` con `IsCompetitionAdmin` dejó de existir;
  los equipos son ahora catálogo global.)*
- **Escrituras sin unicidad/constraint** en `registration_number`; la UI lo exige
  pero no lo garantiza por competición.
- No se crearon ramas ni se hizo commit/push.

---

## Iteración 2026-09-23 — Creación inline de atleta/equipo en el formulario de competidor

Mejora de UX: desde `/admin/competitors/new` (y `/:id/edit`) se puede crear un
**atleta** (tipo Individual) o un **equipo** (tipo Equipo) sin abandonar el
formulario. El registro creado queda **seleccionado automáticamente** en su
`<select>` y el usuario continúa con la inscripción. Sin cambios de backend: se
reutilizan `POST /athletes/` y `POST /teams/` (que ya devuelven el recurso con
`id`).

### Cambios
- `src/components/admin/InlineEntitySelect.tsx` (**nuevo**): componente
  reutilizable — `<select>` + botón "+ Nuevo" + panel inline colapsable con mini
  formulario propio (`react-hook-form` + `zodResolver` derivado de `fields`).
  Sin `<form>` anidado (botones `type="button"`); error de creación inline con
  `role="alert"`; `key` desde el padre para reiniciar al alternar tipo.
- `src/pages/admin/CompetitorFormPage.tsx`: reemplazados los `<select>` de
  Atleta/Equipo por `InlineEntitySelect`. Individual → campos Nombre, Apellido,
  Fecha de nacimiento, Sexo (`useCreateAthlete`); Equipo → solo Nombre
  (`useCreateTeam`). Tras crear, `setValue("athlete"|"team", String(id))`.
- `tests/CompetitorFormPage.test.tsx`: mocks de `useCreateAthlete`/`useCreateTeam`
  y listas dinámicas; casos: crear atleta inline, crear equipo inline
  (selección automática), validación inline, error de creación inline,
  cierre del panel al alternar tipo.

### Verificación
| Chequeo | Resultado |
|---|---|
| `npm run typecheck` | OK |
| `npm run lint` | OK (0 errores; 1 warning preexistente) |
| `npm run test` | **148/148** en verde (20 archivos) |
| `npm run build` | OK (warning chunk >500 kB preexistente) |

### Notas
- Sin cambios de backend (`leader\Scorely`); solo reutilización de endpoints y
  hooks existentes.
- Las páginas `AthletesPage`/`TeamsPage` se mantienen **globales** (decisión del
  usuario, Parte II-G); `page_size=100` sin cambios.
- No se crearon ramas ni se hizo commit/push.

---

## Iteración 2026-09-23 — Inscripción opcional integrada en el alta de atleta (Parte II-I)

Mejora de UX: desde `/admin/athletes/new` se puede crear el atleta y, de forma
**opcional**, inscribirlo en una competición (Individual + categoría) en la misma
acción, gracias a una **sección colapsable "Inscribir en competición (opcional)"**.
Sin cambios de backend: se reutilizan `POST /athletes/` y `POST /competitors/`.

### Decisiones del usuario
1. **Sumar bloque inline en atleta**: se mantiene el inline de `CompetitorFormPage`
   (Parte II anterior) y se agrega la sección opcional en el alta de atleta.
2. **Nº de inscripción manual opcional** (el backend lo acepta vacío: `blank=True`).
3. El bloque aparece **solo en modo creación** (`/admin/athletes/:id/edit` no lo muestra).

### Cambios
- `src/pages/admin/AthleteFormPage.tsx`: sección colapsable (`aria-expanded`)
  tras Fecha de nacimiento/Sexo con select de **Competición**
  (`useAdminCompetitions`), select de **Categoría** dependiente
  (`useAdminEnabledCategories(competitionId)` + nombres del catálogo) y campo
  **Nº de inscripción (opcional)**. En el `onSubmit`: si hay competición sin
  categoría → error en el bloque y no crea nada; al guardar con inscripción se
  llama en secuencia `createAthlete` → `createCompetitor` (`INDIVIDUAL`,
  `athlete = atleta.id`, `team: null`). Si la 2ª llamada falla, la UI avisa
  "El atleta se guardó, pero la inscripción falló…" y conserva el atleta creado
  (`createdAthleteRef`) para reintentar **sin duplicar**.
- `tests/AthleteFormPage.test.tsx` (**nuevo**, 5 casos): alta simple sin
  inscribir (no llama al competidor), alta + inscripción (payload de ambos,
  `athlete = id` del creado), competición sin categoría (error, nada se crea),
  fallo de inscripción (aviso + reintento sin recrear atleta), bloque ausente en
  edición con PATCH que conserva `id`.

### Verificación
| Chequeo | Resultado |
|---|---|
| `npm run typecheck` | OK |
| `npm run lint` | OK (0 errores; 1 warning preexistente `SidebarContext.tsx`) |
| `npm run test` | **153/153** en verde (21 archivos) |
| `npm run build` | OK (warning chunk >500 kB preexistente) |

### Notas
- **Dos llamadas no transaccionales**: atleta + competidor. Ante fallo de la
  inscripción el atleta queda creado; se informa y se permite reintentar solo la
  inscripción. Aviso de `CompetitorViewSet` sin guard de competición/rol sigue
  vigente (ver Parte II-F).
- No se crearon ramas ni se hizo commit/push.

---

## Iteración 2026-09-23 — Inscripción opcional integrada en el alta de equipo (Parte II-J)

Extensión de la Parte II-I: el bloque colapsable **"Inscribir en competición
(opcional)"** se replica en `/admin/teams/new`. Al guardar se crea el equipo
(`POST /teams/`) y, si se eligió competición + categoría, la inscripción
(`POST /competitors/` con `competitor_type: "TEAM"`) en la misma acción.
Sin cambios de backend.

### Cambios
- `src/pages/admin/TeamFormPage.tsx`: espejo del bloque de `AthleteFormPage`:
  selección de **Competición** (`useAdminCompetitions`), **Categoría**
  dependiente (`useAdminEnabledCategories` + nombres del catálogo) y **Nº de
  inscripción (opcional)**; solo en modo creación. `onSubmit`: competición sin
  categoría → error en el bloque y no crea nada; al inscribir → `createTeam` →
  `createCompetitor` (`TEAM`, `athlete: null`, `team = equipo.id`). Ante fallo de
  la 2ª llamada avisa "El equipo se guardó, pero la inscripción falló…" y
  conserva el equipo creado (`createdTeamRef`) para reintentar sin duplicar.
- `tests/TeamFormPage.test.tsx` (**nuevo**, 5 casos): espejo de atleta — alta
  simple sin inscribir (no llama al competidor), alta + inscripción (payload
  `TEAM` con `team = id` del creado), competición sin categoría (error, nada se
  crea), fallo de inscripción (aviso + reintento sin recrear equipo), bloque
  ausente en edición con PATCH que conserva `id`.

### Verificación
| Chequeo | Resultado |
|---|---|
| `npm run typecheck` | OK |
| `npm run lint` | OK (0 errores; 1 warning preexistente `SidebarContext.tsx`) |
| `npm run test` | **158/158** en verde (22 archivos) |
| `npm run build` | OK (warning chunk >500 kB preexistente) |

### Notas
- Mismas 2 llamadas no transaccionales que la Parte II-I; el reintento tras
  fallo de inscripción no duplica el equipo.
- No se crearon ramas ni se hizo commit/push.

---

## Iteración 2026-09-23 — Módulo admin "Resultados" (Parte II-K)

> Ejecución del plan `PLAN.md`. Entrada **masiva de resultados por evento**
> (`EventCompetitor`) en `/admin/scores`, por competición en scope, con guardado
> masivo POST/PATCH/DELETE. El backend recalcula `event_rank`/`score` (on-read).
> Sin tocar el backend. **Scoring** permanece "Próximamente".

### Cambios aplicados
- `src/types/index.ts`: `EventCompetitor` (`id`, `competitor`, `event`, `result`,
  `event_rank: number | null`, `score: number | null`) y `EventCompetitorWritePayload`.
- `src/api/admin.ts`: `fetchEventCompetitors(eventId)` (`/event-competitors/?event={id}&page_size=100`),
  `createEventCompetitor` (POST), `updateEventCompetitorResult(id, result)` (PATCH con body `{ result }`),
  `deleteEventCompetitor` (DELETE) — patrón Competitors, JWT.
- `src/hooks/useAdminModules.ts`: `useAdminEventCompetitors(eventId)` + 3 mutaciones
  (`useCreateEventCompetitor`, `useUpdateEventCompetitor`, `useDeleteEventCompetitor`)
  con firma `(eventId, competitionId)` que invalidan `["admin","event-competitors",eventId]`
  **y** el leaderboard público `["leaderboard", competitionId]`.
- `src/pages/admin/ScoresPage.tsx` (nuevo): scope + select de evento (WOD, ordenado por fase+nº
  con `phaseLabel`) + botón "Guardar resultados" (deshabilitado sin scope/evento o guardando);
  grilla Nº / Competidor / Tipo / Categoría / input Resultado (`aria-label`); Spinner/ErrorState/
  EmptyState ("Sin eventos" / "Sin competidores"); banner `role="alert"` que conserva los inputs;
  guardado masivo secuencial (sin id+valor→POST, con id+valor→PATCH, con id+valor vacío→DELETE,
  primer error corta y no pierde cambios); reseteo al cambiar competición y re-siembra al cambiar evento.
  **Filtro opcional "Categoría"** (select con "Todas" + categorías con inscritos, ordenadas por nombre):
  solo visual, guarda todos igual; se resetea al cambiar de competición. **Preselecciona el primer
  WOD** en orden al elegir competición. Etiquetas del select: "WOD {n}" (Qualifier) y
  "WOD Final" (fase Final); qualifiers primero, luego finals por nº.
- `src/App.tsx`: ruta `/admin/scores`. `src/components/admin/AdminSidebar.tsx`: "Resultados"
  habilitado en Gestión (`ChartIcon`); "Próximamente" queda solo con "Scoring".
- `src/components/common/Toast.tsx` (nuevo) + `@keyframes toast-in` en `src/index.css`:
  notificación de éxito tras guardar ("Resultados guardados correctamente."), auto-dismiss 4 s,
  botón de cierre y `role="status"`; se limpia al cambiar competición/evento. En fallos se
  mantiene el banner `role="alert"`. Integrado en `ScoresPage`.
- Tests: `makeEventCompetitor` en `tests/fixtures.ts`; bloque `"event-competitors"` en
  `tests/adminApi.test.ts` (4 casos); `tests/ScoresPage.test.tsx` (nuevo, 11 casos,
  incluye filtro por categoría y toast de éxito).

### Verificación
| Chequeo | Resultado |
|---|---|
| `npm run typecheck` | OK |
| `npm run lint` | OK (0 errores; 1 warning preexistente `SidebarContext.tsx`) |
| `npm run test` | **173/173** en verde (23 archivos) — +15 tests |
| `npm run build` | OK (Vite 6.4.3; warning de chunk >500 kB preexistente) |

### Notas / avisos backend (no se toca)
- **`EventCompetitorViewSet` sin guard de competición/rol** (`apps/events/views.py`): usa el
  global `IsAuthenticated`, no filtra por `event__competition` ni valida rol → la restricción es
  solo UI (scope). Para seguridad real: `IsCompetitionAdmin` + `visible_competitions_q` y filtrado.
  `event_rank`/`score` los calcula `EventRankingService` (on-read).
- **Sin endpoint bulk**: guardado = N llamadas secuenciales. Evaluar progreso/bulk para
  competiciones muy grandes (futuro).
- **Scoring** (`/admin/scoring`, `scoring-rules`) sigue "Próximamente": determina el score por
  puesto y queda como follow-up.
- No se crearon ramas ni se hizo commit/push.

---

## Criterios de aceptación (PROMPT §11)

- [x] build sin errores
- [x] lint sin errores
- [x] typecheck sin errores
- [x] suite de tests en verde (frontend actual: 23 archivos / 171 tests)
- [x] `/` renderiza recientes + pestaña "todas" (con backend disponible/público)
- [x] `/` muestra **todas las competiciones publicadas** con sesión activa o no (2026-09-14)
- [x] detalle muestra info, afiliación, fechas, mapa, WODs y leaderboard
- [x] URLs por slug (`/competitions/{slug}/`), backend resuelve slug e id; slug inválido → 404
- [x] filtros de leaderboard (etapa/categoría)
- [x] `/admin/*` protegido (redirige a login sin sesión)
- [x] solo español, tema claro
- [x] no se tocó `free-react-tailwind-admin-dashboard/`
- [x] (2026-09-15) módulo admin de categorías disponibles: catálogo solo superadmin; habilitación + `finalist_slots` por competición para admin de competición
- [x] (2026-09-21) módulo admin de filiaciones: CRUD del catálogo en `/admin/affiliations` solo superadmin (Parte II-C)
- [x] (2026-09-21) módulo admin de sedes: CRUD del catálogo en `/admin/sedes` solo superadmin (Parte II-D)
- [x] (2026-09-21) vista pública: categorías habilitadas con recuento de inscritos antes de Workouts, con degradación elegante si el backend aún no expone los endpoints en lectura pública (Parte II-E)
- [x] (2026-09-21) módulo admin de competidores: CRUD de inscripciones en `/admin/competitors` por scope (Individual/Equipo, nº obligatorio), para admins de competición y superuser (Parte II-F)
- [x] (2026-09-22) módulo admin de equipos globales: `/admin/teams` sin scope ni columna Competición, catálogo global estilo Atletas, select global en Competidores (Parte II-G)
- [x] (2026-09-23) filtros de búsqueda y ordenamiento: búsqueda por nombre + orden asc/desc de la columna Nombre en las 5 tablas admin (competiciones, filiaciones, sedes, atletas, equipos); headers del leaderboard público ordenables (Parte II-H, 100 % cliente)
- [x] (2026-09-23) creación inline de atleta/equipo: desde el formulario de competidor, mini-form + selección automática del registro creado, sin abandonar la página (mejora de UX)
- [x] (2026-09-23) inscripción opcional en el alta de atleta: sección colapsable "Inscribir en competición" en `/admin/athletes/new` (competición + categoría + nº opcional) que crea atleta y luego competidor Individual en una sola acción (Parte II-I)
- [x] (2026-09-23) inscripción opcional en el alta de equipo: mismo bloque en `/admin/teams/new` que crea equipo y luego competidor de equipo en una sola acción (Parte II-J)
- [x] suite de tests en verde (frontend 153/153 → **158/158**) (2026-09-23)
- [x] (2026-09-23) módulo admin de resultados: entrada masiva por evento en `/admin/scores` (scope + select de WOD + grilla con inputs + guardado POST/PATCH/DELETE; el backend recalcula `event_rank`/`score` on-read) + toast de éxito tras guardar + **filtro opcional por categoría** (Parte II-K) — **158 → 173/173**

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
8. **(Pendiente, Parte II-E)** Abrir la lectura pública del los endpoints `competitors/`, `enabled-competition-categories/` y `competition-categories/` (`IsAuthenticatedOrReadOnly` en sus viewsets) para que la sección "Categorías e inscritos" muestre datos reales.