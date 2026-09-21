# PLAN — Ejecución de `PROMPT.md` (Scorely Frontend) — Vista pública: categorías con recuento de inscritos

> **Documento de planificación, no ejecuta cambios.** Describe, paso a paso,
> cómo implementar la indicación de `PROMPT.md` para la **Parte II-E** sobre
> `Scorely-frontend/`, indicando el **estado actual** de cada parte y detallando
> el trabajo **pendiente**.
>
> Fecha: 2026-09-21
> Estado: BORRADOR / pendiente de ejecución (Parte II-E sin implementar en el código;
> ya documentada en `PROMPT.md`)

---

## 0. Alcance del plan

`PROMPT.md` especifica varias actualizaciones del frontend. Estado actual:

| Sección                                    | Módulo | Estado |
|--------------------------------------------|--------|--------|
| **Parte II** — Pantalla pública            | Público (`/`, `/competitions/:slug/`, leaderboards) | ✅ **COMPLETADO** (ver `Process.md` Pasos 0–24 y `RESULTADOS.md`) |
| **Parte II-B** — Categorías disponibles    | Admin (`/admin/categories` + `/admin/competition-categories`) | ✅ **COMPLETADO** |
| **Parte II-C** — Filiaciones (`Affiliation`) | Admin (`/admin/affiliations`) | ✅ **COMPLETADO** (suite 70/70 al cierre) |
| **Parte II-D** — Sedes (`Location`)        | Admin (`/admin/sedes`) | ✅ **COMPLETADO** (suite 80/80 al cierre) |
| **Parte II-E** — Categorías con recuento de inscritos | Público (detalle de competición) | ⏳ **PENDIENTE** (objeto de este plan) |

Este plan:
1. Documenta el **estado alcanzado** de la Parte II-E (spec en `PROMPT.md` ya escrita; backend shape verificado).
2. Detalla **paso a paso** la implementación en frontend: sección "Categorías e inscritos" en
   `/competitions/:slug/` ubicada **antes de la sección Workouts**, con recuento de
   inscritos por categoría.
3. Incluye los pasos de **verificación** completos (lint/typecheck/test/build).

### Reglas clave repetidas de `PROMPT.md` / decisiones del usuario
- **Listado = categorías del leaderboard público** (mismas categorías y orden que ya
  muestra `LeaderboardFilters`), no se lista el catálogo completo.
- **Recuento = inscripciones reales (`Competitor`)** agrupadas por
  `enabled_competition_category` (decisión del usuario: **no** usar las entradas con
  resultados del leaderboard y **no** crear un endpoint `count` nuevo en backend).
- **Dependencia backend (la aplica el usuario, NO el frontend):** abrir la **lectura
  pública** de `GET /api/v1/competitors/` (hoy JWT-only). Junto con él, también abrir
  lectura pública de `enabled-competition-categories/` y `competition-categories/`
  (ver Paso 0 y Avisos §8).
- Hasta que el backend esté abierto, el frontend **degrada con elegancia** (oculta la
  sección) sin romper el resto del detalle.

---

## 1. Estado actual (análisis del repositorio, verificado en el código)

### Backend (shape verificado — `leader\Scorely\apps`, solo lectura)
- `participants/models.py:58-88` → `Competitor`: `competitor_type`
  (`INDIVIDUAL`/`TEAM`), `athlete?`, `team?`, `registration_number`, `competition`
  (FK), `enabled_competition_category` (FK a `events.EnabledCompetitionCategory`,
  `on_delete=PROTECT`). **Es la inscripción.**
- `participants/serializers.py:24-30` → `CompetitorSerializer` =
  `(id, competitor_type, athlete, team, registration_number, competition, enabled_competition_category)`.
- `participants/views.py:50-54` → `CompetitorViewSet`: **sin `permission_classes`** →
  usa el global `IsAuthenticated` (`config/settings/base.py:86-88`). `filterset_fields =
  ('competition', 'competitor_type', 'enabled_competition_category')`.
- `events/models.py:16-39` → `EnabledCompetitionCategory`: `competition`,
  `competition_category` (FK → `CompetitionCategory`), `finalist_slots`.
- `events/serializers.py:17-20` → `EnabledCompetitionCategorySerializer` =
  `(id, competition, competition_category, finalist_slots)`, **`competition_category` =
  id (número)**, NO incluye el nombre.
- `events/views.py:21-30` → `CompetitionCategoryViewSet` y
  `EnabledCompetitionCategoryViewSet`: **sin `permission_classes`** → JWT-only.
- `events/serializers.py:11-14` → `CompetitionCategorySerializer` =
  `(id, name, min_members, max_members)` (catálogo con nombres).
- `rankings/serializers.py:37-43` → el leaderboard público (`/leaderboards/...`) devuelve
  el bloque `category` = **`CompetitionCategory.name`** (string) por cada categoría
  habilitada, iterando sobre todas las `EnabledCompetitionCategory` de la competición
  (incluso con 0 inscritos — `competition_ranking_service.py:94-99`). **Fuente del nombre
  y del orden = el leaderboard `final/`**.
- Patrón de permisos ya usado por el usuario: `IsAuthenticatedOrReadOnly` en
  `CompetitionViewSet` (`competitions/views.py:46`) y `EventViewSet`
  (`events/views.py:34`) (registrado en `Scorely/Process.md` — "Opción A").

### Frontend (lo que ya existe)
- `src/pages/public/CompetitionDetail.tsx`: orden de secciones — header (líneas 113-128),
  grid "Información general" + "Ubicación" (130-168), **"Workouts" (170-204)**,
  "Leaderboard" (206-246). Las categorías vienen de `combinedLeaderboards` →
  `buildCombinedLeaderboards(overall)` (40-51) → `CategoryRef {code, name}`; orden = el
  del payload `/final/`.
- `src/api/public.ts`: `request(..., { auth: false })`, `unwrapList`, `buildQuery`;
  `getEnabledCompetitionCategories(competitionId)` (67-75). **NO hay** `getCompetitors`
  ni catálogo público `getCompetitionCategories`.
- `src/hooks/useEnabledCompetitionCategories.ts` (patrón: queryKey
  `["enabled-competition-categories", id]`, `enabled` condicional). Existen también
  `useCompetition`, `useLeaderboard`, `useEvents`.
- `src/types/index.ts`: `CompetitionCategory` (92-98), `EnabledCompetitionCategory`
  (100-105, `competition_category: number`), `CategoryRef`, `Leaderboard`. **NO existe**
  el tipo `Competitor`.
- `tests/`: patrón `queryResult` + `renderWithProviders` (`tests/utils.tsx`); fixtures
  `makeCompetitionCategory` (ya existe, fixtures.ts:25) y `makeLeaderboard`; `publicApi.test.ts`
  verifica `request(..., { auth: false })`; `CompetitionDetail.test.tsx` mockea los 3
  hooks públicos (useCompetition/useLeaderboard/useEvents).

---

## 2. Parte II-E — Objetivo y reglas de negocio

| Regla de negocio | Quién | Dónde |
|------------------|-------|-------|
| Mostrar las categorías habilitadas con **recuento de inscritos** en el detalle público | Público (sin login) | `/competitions/:slug/`, sección "Categorías e inscritos" **antes de Workouts** |
| Recuento = número de `Competitor` de la competición por `enabled_competition_category` | Público | `GET /competitors/?competition={id}` (dependencia backend) |
| Categorías listadas = las del leaderboard público (`category.{code,name}`, mismo orden que `LeaderboardFilters`) | Público | Leaderboard `/final/` (ya existente) |
| Graduación: si faltan los datos (401/403/vacíos) → ocultar/estado vacío, no romper la página | Público | `CompetitionDetail` + componente nuevo |

Regla clave: **no se toca el backend**. La apertura de lectura pública es del usuario;
el frontend implementa el conteo y el mapeo id→nombre.

---

## 3. Matriz de archivos (Parte II-E)

| Archivo | Tipo | Cambio |
|---------|------|--------|
| `src/types/index.ts` | Modificar | Añadir tipo `Competitor` |
| `src/api/public.ts` | Modificar | `getCompetitors(competitionId)` (con recorrido de paginación) y `getCompetitionCategories()` (catálogo público) |
| `src/hooks/useCompetitors.ts` | **Crear** | Hook de inscritos (patrón `useEnabledCompetitionCategories`) |
| `src/hooks/useCompetitionCategories.ts` | **Crear** | Hook del catálogo (patrón idem) |
| `src/utils/categoryCounts.ts` | **Crear** | `buildCategoryCounts(...)` — util puro del mapeo y conteo |
| `src/components/public/CategoryInscritos.tsx` | **Crear** | Sección "Categorías e inscritos" (tarjetas/badges con recuento) |
| `src/pages/public/CompetitionDetail.tsx` | Modificar | Insertar `<CategoryInscritos />` **antes de la sección Workouts** |
| `tests/fixtures.ts` | Modificar | `makeCompetitor(overrides)` |
| `tests/publicApi.test.ts` | Modificar | Bloques `getCompetitors` y `getCompetitionCategories` (URLs + `auth:false` + paginación) |
| `tests/categoryCounts.test.ts` | **Crear** | Unit del mapeo (join por nombre, 0, sin match) |
| `tests/CategoryInscritos.test.tsx` | **Crear** | Componente (carga, datos, error→oculto, vacío) |
| `tests/CompetitionDetail.test.tsx` | Modificar | Mockear los 3 hooks nuevos (no romper existentes) + caso "sección antes de Workouts" |
| `Process.md` | Modificar | Registrar avances (nuevo Paso) |
| `RESULTADOS.md` | Modificar | Registrar resultado y avisos al terminar |

---

## 4. Pasos detallados (Parte II-E)

### Paso 0 — Avisos backend y verificación de shape (informativo, NO ejecutar backend)

**Qué hacer**: comunicar al usuario los **avisos/dependencias backend** necesarios para
que el recuento sea real (hoy son JWT-only). No se ejecuta nada del backend.

1. **`CompetitorViewSet`** (`participants/views.py:50`) — **dependencia principal
   (decisión del usuario ya tomada):** abrir la lectura pública con
   `IsAuthenticatedOrReadOnly` (mismo patrón que `CompetitionViewSet`/`EventViewSet`).
   Por defecto hoy: JWT (`DEFAULT_PERMISSION_CLASSES = IsAuthenticated`).
2. **`EnabledCompetitionCategoryViewSet`** (`events/views.py:27`) — abrir lectura pública
   (`IsAuthenticatedOrReadOnly`) para poder mapear `enabled_competition_category` (id) de
   los inscritos a la categoría de la competición.
3. **`CompetitionCategoryViewSet`** (`events/views.py:21`) — abrir lectura pública
   (`IsAuthenticatedOrReadOnly`) para resolver `competition_category` id → nombre.

> **Por qué el catálogo y no "anidar" el nombre (alternativa de `PROMPT.md` §4):**
> `EnabledCompetitionCategorySerializer` hoy expone `competition_category: number`; el
> admin lo consume como número (`CompetitionCategoriesPage.tsx:50,87,120` y payloads de
> escritura). Convertir ese campo en objeto anidado **rompería** el admin → se descarta.
> El join por nombre con el catálogo es aditivo y no rompe nada (ambos provienen del mismo
> modelo `CompetitionCategory.name`).

**Verificación**: anotar en `Process.md` el shape verificado y los 3 avisos; pedir al
usuario que aplique los permisos (o confirmar que se implementa con degradación hasta que
lo aplique). No ejecutar comandos del backend.

---

### Paso 1 — Tipos DTOs

**Archivo**: `src/types/index.ts`

**Qué hacer** (junto a `EnabledCompetitionCategory`, shape verificado en
`CompetitorSerializer`):

```ts
export type CompetitorType = "INDIVIDUAL" | "TEAM";

export interface Competitor {
  id: number;
  competitor_type: CompetitorType;
  athlete?: number | null;
  team?: number | null;
  registration_number: string;
  competition: number;
  enabled_competition_category: number;
}
```

**Verificación**: `npm run typecheck`.

---

### Paso 2 — API pública

**Archivo**: `src/api/public.ts`

**Qué hacer** (siguiendo el patrón de `getEnabledCompetitionCategories` con `auth: false`):

```ts
export async function getCompetitors(competitionId: number | string): Promise<Competitor[]> {
  // GET /competitors/?competition={id}&page_size=100 — recorrer `next` para no
  // subcontar si hay más de 100 inscritos (PAGE_SIZE global = 20; pedimos 100).
  // Retorna la lista completa de inscritos de la competición.
}

export async function getCompetitionCategories(): Promise<CompetitionCategory[]> {
  // GET /competition-categories/?page_size=100 — catálogo público con nombres.
}
```

- **Paginación de `getCompetitors`:** llamar con `page_size=100`; si
  `data.next` existe, encadenar los `next` y acumular `results`; detenerse al agotar.
  Usar `unwrapList` para tiras de un solo bloque.
- `CompetitionCategory` es el tipo existente (`{id, name, min_members, max_members}`).

**Verificación**: `npm run typecheck`. Tests de API en Paso 7.

---

### Paso 3 — Hooks

**Archivos**: `src/hooks/useCompetitors.ts` (**crear**), `src/hooks/useCompetitionCategories.ts` (**crear**)

**Qué hacer** (replicar el patrón de `useEnabledCompetitionCategories.ts`):

- `useCompetitors(competitionId, enabled = true)` →
  `useQuery({ queryKey: ["competitors", competitionId], queryFn: () => getCompetitors(...), enabled: enabled && competitionId válido })`.
- `useCompetitionCategories(enabled = true)` →
  `useQuery({ queryKey: ["competition-categories"], queryFn: getCompetitionCategories, enabled })`.
  El catálogo es global (no depende de la competición) y cacheable.

**Verificación**: `npm run typecheck`.

---

### Paso 4 — Util puro de mapeo y conteo

**Archivo**: `src/utils/categoryCounts.ts` (**crear**)

**Qué hacer**: función pura, sin hooks, fácil de testear:

```ts
export interface CategoryCount {
  code: string;
  name: string;
  count: number;
}

export function buildCategoryCounts(args: {
  categories: CategoryRef[];                   // del leaderboard (orden = mostrar)
  enabled: EnabledCompetitionCategory[];       // por competición: {id, competition_category, ...}
  catalog: CompetitionCategory[];              // id → name
  competitors: Competitor[];                   // inscritos de la competición
}): CategoryCount[]
```

Lógica:
1. `counts = Map<enabledId, number>` sumando 1 por cada `competitor.enabled_competition_category`.
2. `nameById = Map<catalog.id → catalog.name>`.
3. `enabledIdByName = Map<name → enabledId>` usando
   `nameById.get(enabled.competition_category)` (solo de la competición).
4. Devuelve, en el **orden de `categories`**, `{ code, name, count: counts.get(enabledIdByName.get(name)) ?? 0 }`.

Caso defensivo: si un nombre del leaderboard no matchea el catálogo (no debería pasar,
mismo origen `CompetitionCategory.name`) → `count = 0`.

**Verificación**: unit en Paso 7.

---

### Paso 5 — Componente de sección

**Archivo**: `src/components/public/CategoryInscritos.tsx` (**crear**)

**Qué hacer** (estilo Tailwind claro, patrón del resto de la página):

- Props: `competitionId: number`, `categories: CategoryRef[]` (las del leaderboard).
- Usa `useEnabledCompetitionCategories(competitionId, enabled)`,
  `useCompetitionCategories(enabled)` y `useCompetitors(competitionId, enabled)`.
- Render:
  - `h2` **"Categorías e inscritos"** (igual estilo que "Workouts").
  - Tarjetas/badges: cada categoría con su recuento, p. ej. `RX Individual — 12` (o badge
    con el número). Mismo orden que `LeaderboardFilters`.
  - Carga: `Spinner label="Cargando inscritos…"`.
  - Error o no disponibles (401/403/vacío): **ocultar la sección** (o `EmptyState`
    discreto) sin romper la página.
  - Categoría sin inscritos → `0`.
- Un `useMemo` con `buildCategoryCounts` sobre los datos de los 3 hooks.

**Verificación**: componente en aislamiento (mock de hooks) en Paso 7.

---

### Paso 6 — Integración en `CompetitionDetail`

**Archivo**: `src/pages/public/CompetitionDetail.tsx`

**Qué hacer**:
- Importar y renderizar `<CategoryInscritos />` **antes de la sección "Workouts"** (entre
  el grid de líneas 130-168 y la sección de líneas 170-204).
- Pasar `competitionId={id}` y `categories={categories}` (ya derivadas en 48-51, del
  leaderboard).
- Solo renderizar si `id` existe y `categories.length > 0` (si la competición no tiene
  leaderboard/categorías, no mostrar la sección).
- No tocar el resto del flujo (Workouts/Leaderboard intactos).

**Verificación**: `npm run typecheck`; navegación manual (Paso 8) y tests (Paso 7).

---

### Paso 7 — Pruebas

**Archivos**: `tests/fixtures.ts`, `tests/publicApi.test.ts`, `tests/categoryCounts.test.ts` (nuevo),
`tests/CategoryInscritos.test.tsx` (nuevo), `tests/CompetitionDetail.test.tsx`

**Qué hacer**:

- **Fixtures**: `makeCompetitor(overrides)` →
  `{ id: 1, competitor_type: "INDIVIDUAL", athlete: 10, team: null, registration_number: "001", competition: 1, enabled_competition_category: 3 }`.
  Reutilizar `makeCompetitionCategory` y `makeEnabledCompetitionCategory` si hiciera falta.
- **`publicApi.test.ts`**: bloques `getCompetitors` y `getCompetitionCategories`:
  - URLs y `auth: false` → `/competitors/?competition=8&page_size=100` y
    `/competition-categories/?page_size=100`.
  - Paginación: respuesta con `next` → la función acumula y devuelve todos los inscritos.
  - Catálogo: unwrap de `{results: [...]}` → `CompetitionCategory[]`.
- **`categoryCounts.test.ts`** (unit del util): join por nombre correcto; `0` cuando la
  categoría no matchea; orden preservado (el de `categories`); múltiples inscritos por
  categoría.
- **`CategoryInscritos.test.tsx`**: mockear los 3 hooks (patrón de `AffiliationsPage.test.tsx`
  con `queryResult`):
  - Carga: `Spinner`.
  - Con datos: `RX Individual — 12` y `Scaled — 5` en orden.
  - Error (simular rechazo/`isError`): sección oculta o estado vacío.
  - Vacío (sin categorías): no renderiza el `h2`.
- **`CompetitionDetail.test.tsx`**: añadir mocks de los 3 hooks nuevos al `vi.mock` actual
  (default: sin datos → sección oculta) para **no romper los 13 tests existentes**; agregar
  1 caso: "muestra las categorías con recuento antes de Workouts" (orden de headings:
  "Categorías e inscritos" aparece antes que "Workouts" en el DOM).

**Verificación**: `npm run test` en verde.

---

### Paso 8 — Verificación final y cierre de la Parte II-E

Ejecutar en orden:

1. `npm run lint` → sin errores (1 warning preexistente `SidebarContext.tsx` OK).
2. `npm run typecheck` → sin errores.
3. `npm run test` → todos en verde (80/80 actual; suma los nuevos).
4. `npm run build` → OK (dist generado).
5. Actualizar `Process.md` (nuevo Paso) y `RESULTADOS.md` (nueva iteración) + avisos backend;
   actualizar la cabecera de estado de este `PLAN.md`.

**Escenarios manuales** (cuando el backend esté abierto):

| Escenario | Esperado |
|-----------|----------|
| Público abre `/competitions/:slug/` sin login | Ve la sección "Categorías e inscritos" **antes de Workouts** con el recuento real por categoría |
| Competición con 0 inscritos en una categoría | Muestra `0` en esa categoría (la categoría aparece por el leaderboard) |
| Competición sin categorías/leaderboard | No se muestra la sección; la página no se rompe |
| Backend aún JWT (401/403) | La sección se oculta/degrada, el resto del detalle funciona igual |
| Competición grande (más de 100 inscritos) | El recuento es exacto (se recorre la paginación) |
| Orden de categorías | El mismo que el filtro de categorías del leaderboard |

---

## 5. Endpoints de la Parte II-E (resumen)

| Acción | Método | URL | Auth | Rol frontend |
|--------|--------|-----|------|-------------|
| Leaderboard unificado (categorías listadas) | GET | `/api/v1/leaderboards/competition/{id}/final/` | **Pública** (ya) | público |
| Habilitaciones de la competición (mapeo id) | GET | `/api/v1/enabled-competition-categories/?competition={id}` | pública **pendiente** (hoy JWT) | público |
| Catálogo de categorías (id → nombre) | GET | `/api/v1/competition-categories/` | pública **pendiente** (hoy JWT) | público |
| Inscritos de la competición (recuento) | GET | `/api/v1/competitors/?competition={id}` | pública **pendiente** (hoy JWT) | público |

> El leaderboard `/final/` ya es público y es el que provee la lista y el orden de
> categorías (cada categoría, incluso sin resultados, aparece). Los otros 3 endpoints
> exigen JWT hoy → **avisos al usuario (Paso 0 / §8)** para abrir su lectura pública.

---

## 6. Orden de ejecución recomendado (Parte II-E)

1. **Paso 0** (avisos backend + shape) → desbloquea la decisión de mapeo (catálogo) y la
   degradación mientras el backend no esté abierto.
2. **Paso 1** (tipos `Competitor`) → base para API.
3. **Paso 2 + 3** (API pública + hooks); dependen de Paso 1; independientes entre sí.
4. **Paso 4** (util de conteo, puro) → independiente, testear desde ya.
5. **Paso 5 + 6** (componente + integración en `CompetitionDetail` antes de Workouts).
6. **Paso 7** (pruebas) — cubre API, util, componente y página.
7. **Paso 8** (verificación final + documentación).

---

## 7. Restricciones que se mantienen (de `PROMPT.md` Parte III)

- **NO** tocar el backend (ni permisos ni endpoints); la apertura de lectura queda
  **avisada** al usuario.
- **NO** tocar `free-react-tailwind-admin-dashboard/` (solo lectura).
- **NO** crear ramas, no push, no commit sin pedido explícito.
- **NO** mockear datos en producción; sin backend abierto la sección degrada (ocultar),
  no inventar recuentos.
- No añadir comentarios al código salvo que se soliciten.
- Documentar avances en `Process.md` al iniciar y finalizar cada paso.
- Mantener el estilo TailAdmin (tema claro) y los patrones del detalle público actual.
- No tomar tecnologías nuevas sin preguntar (regla de la Parte I).

---

## 8. Avisos al usuario (backend — no se toca en frontend)

1. **Abrir lectura pública de `CompetitorViewSet`** (`participants/views.py:50`): hoy usa
   el global `IsAuthenticated`; aplicar `IsAuthenticatedOrReadOnly` (sin filtrar por
   usuario). Es la fuente del recuento de inscritos (decisión del usuario). Sin esto, la
   sección se oculta (degradación).
2. **Abrir lectura pública de `EnabledCompetitionCategoryViewSet`**
   (`events/views.py:27`) y **`CompetitionCategoryViewSet`** (`events/views.py:21`) para el
   mapeo `enabled_competition_category` (id) → nombre de categoría.
3. **No usar "anidar" el nombre** en `EnabledCompetitionCategorySerializer` (alternativa
   descartada): hoy `competition_category: number` lo consume el admin
   (`CompetitionCategoriesPage.tsx`) y los payloads de escritura como número; nestearlo
   rompería el admin.
4. **Recuento = inscripciones (`Competitor`), no resultados**: puede ser mayor que las
   entradas con puntos del leaderboard mientras haya inscritos sin resultados.
5. **Paginación**: `PAGE_SIZE` global = 20; `getCompetitors` pide `page_size=100` y
   recorre `next` para no subcontar en competiciones grandes (ej. HYROX).
6. **Seed demo**: `seed_data.py` crea categorías/sedes de demo; el recuento mostrará lo
   que efectivamente haya registrado (posible `0` en seeds sin `Competitor`).