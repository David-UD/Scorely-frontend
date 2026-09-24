# PLAN — Rediseño: landing de competición (CompetitionDetail) (Parte II-M)

> **Documento de planificación y seguimiento.** Implementación de la spec
> **Parte II-M** de `PROMPT.md`: rediseño **visual** (solo UI/UX) de la vista
> pública del detalle de competición (`/competitions/{slug}/`). No cambia
> funcionalidad, data fetching ni modelo de datos.
>
> Fecha: 2026-09-24
> Estado: **PLANIFICADO** — no se ejecutó ningún cambio todavía.
> Spec origen: `PROMPT.md` → `# Parte II-M — Rediseño: landing de competición (CompetitionDetail)`
> Anterior: Parte II-L (Scoring) ✅ cerrada (ver PLAN.md histórico / RESULTADOS.md).

---

## 0. Objetivo

Rediseñar la landing pública `/competitions/{slug}/` (`CompetitionDetail`) para que el
usuario entienda en segundos **qué competición ve, cuándo/dónde ocurre, qué categorías
tiene, cuáles son los WODs y cómo va el leaderboard**, con jerarquía visual clara,
consistencia espacial (escala 48/24/16/12 px) y buen comportamiento en móvil (320 px+).
**Todo con los mismos hooks, tipos, API y fixtures**: solo se re-trabajan componentes de
presentación.

---

## 1. Decisiones y hallazgos (verificados en el código)

| Tema | Hallazgo / decisión |
|---|---|
| **SCSS vs Tailwind** | El repo **usa Tailwind v4** (tokens en `src/index.css` `@theme`, utilidades en los componentes, `cn()` en `src/utils/cn.ts`). **No existe SCSS** (no hay `.scss`, ni `sass` en `package.json`). 👉 **Se usa Tailwind v4** (patrón existente). Avisar al usuario: la consigna decía "React+Vite+SCSS" pero el repo no lo usa; no se añade SCSS sin su OK (regla de tecnologías de `PROMPT.md`). |
| **Datos** | `Competition` ya trae `name`, `description`, `slug`, `competition_type`, `status`, `affiliation`, `year`, `start_date`/`end_date`, `location`. Events por fase (con `is_active`, `is_ascending`, `workout` multilinea). Categorías derivadas del leaderboard vía `buildCombinedLeaderboards`. Recuentos: `useCompetitors` + `useEnabledCompetitionCategories`. |
| **Ausencia de resultado** | Se renderiza **`—`** (U+2014), nunca un valor inventado. Implica cambiar los `"-"` actuales de `CombinedLeaderboardTable` (`score()`, `total()`, `WodCell`). |
| **Barra de progreso** | Puntos **● (activo) / ○ (inactivo)** sobre el array combinado de eventos, con `is_active` (los WODs `is_active !== false` son visibles). |
| **Hero · "Finalistas"** | = suma de `finalist_slots` de `useEnabledCompetitionCategories`. "Atletas" = `useCompetitors` (length). "Categorías" = `categories.length`. "WODs" = eventos visibles (`is_active`). Fuentes ya cableadas (query cache deduplica con `CategoryInscritos`). |
| **Botones de acción** | "Ver Workouts" / "Ver Leaderboard" hacen **scroll por ancla** a `id="workouts"` / `id="leaderboard"` (`scrollIntoView` con guard `?.`). "Compartir" copia la URL actual (`navigator.clipboard`) + toast. Sin endpoint nuevo. |
| **Hero · ciudad** | `location.city` (fallback `affiliation.city`), junto a estado (badge) y tipo (badge). |
| **Anchors/ids** | Secciones del page: `<section id="info">`, `id="workouts"`, `id="leaderboard"`, `id="categorias"` (anclas para los botones). |

---

## 2. Clave técnica (estado actual verificado)

- **Página**: `src/pages/public/CompetitionDetail.tsx` (254 líneas) — estructura actual:
  1) back link; 2) header (título + `StatusBadge` + `Badge` tipo + fechas + descripción);
  3) `grid lg:grid-cols-2` con sección "Información general" (`<dl>`) + "Ubicación"
  (`LocationMap`, `h-72` fijo → **no** igualan alturas); 4) `CategoryInscritos`;
  5) "Workouts" (dos `WodList`, tabla por fase); 6) "Leaderboard" (`LeaderboardFilters`
  + `CombinedLeaderboardTable`). Queries: `useCompetition(slug)`, `useEvents(id, phase)`,
  `useLeaderboard(id, "final")`. Filtro por categoría en estado local.
- **WodList** (`src/components/public/WodList.tsx`, 44 l): tabla `Nº | Workouts | Workout |
  Descripción`, ya usa `whitespace-pre-wrap`, filtra `is_active`, `EmptyState`
  "Sin workouts en {phase}". **Se transforma a tarjetas en el mismo archivo** (mantener
  nombre/firma `{ phaseName, wods }` para no romper página ni tests).
- **CombinedLeaderboardTable** (`src/components/public/CombinedLeaderboardTable.tsx`,
  295 l): ya agrupa columnas (`rowSpan` 2 para Pos/Atleta/Total, `colSpan` group headers
  "Qualifier"/"Final"), medallas (`MedalIcon`), sorteo, `overflow-x-auto min-w-[520px]`,
  fila rank 1 resaltada. **Falta**: sticky header, hover en filas, podio completo (1–2–3),
  separador visual Qualifier/Final más marcado, y `—` en vez de `-`. No cambia el contrato
  de props ni los textos "Pos."/"Atleta"/"Score {n}"/"Total" (los tests de sorteo siguen usando
  `getByRole("columnheader", { name: ... })`).
- **CategoryInscritos** (`src/components/public/CategoryInscritos.tsx`, 68 l): ya **carga y pinta**
  tarjetas `<li>` con count via `buildCategoryCounts`. Falta el **carrusel móvil**: envolver el
  `<ul>` en contenedor `overflow-x-auto snap-x no-scrollbar` con `flex gap-3` y tarjetas
  `snap-start` (los tests que leen `li` siguen pasando).
- **LocationMap** (`src/components/public/LocationMap.tsx`): acepta `className`; el iframe es
  `h-72 w-full`. Para igualar alturas: pasar `className="h-full"` y que el contenedor de la
  tarjeta mapa sea `h-full` + el `dl` de info estire la columna. Contracto intacto.
- **Common reutilizables**: `StatusBadge`, `Badge` (tones), `EmptyState`, `ErrorState`,
  `Spinner`, `Tabs`, `Toast` (rol `status`). Íconos: hay SVGs inline (flechas, búsqueda);
  no hay librería de iconos en público — los nuevos usan SVGs inline (patrón `HomeIndex`).
- **Tests afectados**: `tests/CompetitionDetail.test.tsx` (380 l), `tests/WodList.test.tsx`
  (38 l), `tests/CombinedLeaderboardTable.test.tsx` (130 l, usa `getAllByText("-")`),
  `tests/CategoryInscritos.test.tsx` (162 l). Helpers: `renderWithProviders` +
  `result<T>` (patrón mock de hooks). Fixtures: `makeWod`, `makeEventResult`,
  `makeLeaderboard`, `makeEnabledCompetitionCategory`, `makeCompetitor`.
- **Verificación**: `npm run typecheck`, `npm run lint` (0 errores; 1 warning preexistente
  `SidebarContext.tsx`), `npm run test` (hoy **191/191**, 24 archivos), `npm run build`.

---

## 3. Cambios por archivo (pasos de ejecución)

### Paso 0 — Registrar inicio

- Añadir sección **"Paso 37 — Parte II-M: Rediseño landing de competición"** a `Process.md`
  (inicio, plan resumido y lista de pasos).

### Paso 1 — `src/components/public/CompetitionHero.tsx` (NUEVO)

Componente de presentación. Props:
`{ competition: Competition; stats: { athletes: number | null; categories: number; wods: number; finalists: number | null } }`.

- Layout responsive:
  - Nombre `text-title-lg`→`text-title-md` móvil (hoy `text-title-lg` 48px/60px, muy grande
    para móvil), semibold, `text-gray-900`, con `StatusBadge` (status) + `Badge` ("brand",
    `competition_type.name`) en fila de badges.
  - Subtítulo: ciudad (`location?.city ?? affiliation.city`) + `formatDateRange(start,end)` +
    año (`· {year}`) en `text-gray-500`.
  - Descripción (`max-w-3xl`, `text-sm`, `line-clamp-3` desktop, opcional).
  - **Tarjetas de métricas**: `grid grid-cols-2 gap-3 sm:grid-cols-4`; cada una
    `rounded-xl border border-gray-200 bg-white p-4 shadow-theme-xs`:
    - Valor grande (número o `—` si `null`) + label chico: **Atletas**, **Categorías**,
      **WODs**, **Finalistas**.
  - Aire con el resto: el bloque entero actúa como hero (padding, fondo opcional
    `bg-white`), se usa dentro de `CompetitionDetail` con `gap-12` (48px) de espaciado.
- Sin lógica: recibe datos calculados desde la página.

### Paso 2 — `src/components/public/LocationMap.tsx` (MINI cambio)

- El iframe debe poder rellenar la altura de su tarjeta: además del `h-72` por defecto,
  aceptar `className="h-full"` (ya lo propaga). Cambio: en el `div` contenedor de la tarjeta,
  permitir estirarlo cuando lo use el grid (`className` en el wrapper) para igualar con la
  tarjeta de información. **No romper** uso en otros lados (no hay otros usos: solo
  `CompetitionDetail`).

### Paso 3 — `src/pages/public/CompetitionDetail.tsx` (orquestación principal)

Mantener el contrato externo (ruta, hooks, filtros). Reorganizar el `return`:

1. **Back link** (igual).
2. `<section id="info">` → `<CompetitionHero ... />` con stats calculadas:
   - `athletes = useCompetitors(id).data?.length ?? null`
   - `categories = categories.length`
   - `wods = [...qualifierWods, ...finalWods].filter(w => w.is_active !== false).length`
   - `finalists = enabledQuery.data?.reduce((acc, c) => acc + c.finalist_slots, 0) ?? null`
   - Nuevos hooks en la página: `useCompetitors(id)`, `useEnabledCompetitionCategories(id)`
     (mismas keys que `CategoryInscritos` → cache compartida, **sin doble fetch**).
3. **Action bar** (botones): "Ver Workouts" → `#workouts`, "Ver Leaderboard" → `#leaderboard`,
   "Compartir" → `navigator.clipboard.writeText(window.location.href)` + `Toast` de éxito
   ("Enlace copiado."). Estilo: botones `rounded-lg border bg-white px-4 py-2 text-sm
   font-medium shadow-sm` — botón principal "brand" (`bg-brand-500 text-white`). `gap-6`.
   (Puede ser un subcomponente en el mismo archivo o `ActionBar` pequeño inline.)
4. **Info + Mapa con alturas iguales**: `grid grid-cols-1 gap-6 lg:grid-cols-2`, ambas
   columnas `h-full`; tarjeta "Información general" (`<dl>`) con **iconos** en los rows
   (Organizador / Inicio / Fin / Sede): SVGs inline `size-4 text-gray-400` a la izquierda
   del `dt` (patrón `HomeIndex`). Tarjeta "Ubicación" con `LocationMap className="h-full"`.
   Estructura de tarjeta armonizada: `rounded-xl border border-gray-200 bg-white p-6`
   (espaciado interno **16px→24px**: usar `gap-4`, `p-6`).
5. `<section id="categorias">` → `CategoryInscritos` (sin cambios de props).
6. `<section id="workouts">` → dos `<WodList phaseName="Qualifier" wods={...} />` y
   `phaseName="Final"` (ya transformados a tarjetas) + **barra de progreso** (ver Paso 5)
   y estado carga/error/vacío igual al actual.
7. `<section id="leaderboard">` → `LeaderboardFilters` + `CombinedLeaderboardTable` (igual
   props) + estados.
8. **Escala de espaciado**: contenedor raíz `flex flex-col gap-12` (secciones 48px);
   tarjetas `p-6`/`gap-4` (internos 16px); filas `gap-3` (12px). Ajustar `gap-8` (32px)
   actual → `gap-12` (48px).

### Paso 4 — `src/components/public/WodList.tsx` → tarjetas de Workout (REDISEÑO)

Mismo archivo y firma `({ phaseName, wods })`. Cambiar la **tabla por tarjetas**:

- Contenedor `flex flex-col gap-4` (o `grid grid-cols-1`).
- Cada WOD visible (`is_active !== false`) → tarjeta
  `rounded-xl border border-gray-200 bg-white p-6 shadow-theme-xs` con:
  - Cabecera: **"WOD {event_number}"** (semibold) + nombre (mediano) + **badge de fase**:
    `phaseName === "Final"` → `Badge tone="success"` "Final"; sino `Badge tone="brand"` o
    neutral con "Qualifier" (el badge lo diferencia, no otra tabla).
  - **Tipo de puntuación**: `is_ascending ? "Mayor resultado gana" : "Menor tiempo gana"`
    (etiqueta `text-xs text-gray-400`, o `Badge` monocroma).
  - `workout` con `whitespace-pre-wrap` (salto de línea conservado, patrón actual
    `whitespace-pre-wrap`) — `text-sm text-gray-800`.
  - `description` (si existe) `whitespace-pre-wrap text-sm text-gray-500`.
- `EmptyState` "Sin workouts en {phase}" (texto actual, no romper test).
- Móvil: tarjetas apiladas (grid 1 col); sin tabla → **no requiere scroll horizontal**.
- Los tests de `WodList.test.tsx` siguen pasando (asserts por texto, no por `<table>`).
- Verificar import en `CompetitionDetail` (sin cambios).

### Paso 5 — Barra de progreso de eventos (en `CompetitionDetail` o componente mínimo)

- Datos: `allWods = useMemo(() => [...qualifierWods, ...finalWods], [...])`, y para cada uno
  `active = wod.is_active !== false`.
- Render (dentro de la sección Workouts, tras el `h2`, antes de las tarjetas):
  - Cabecera pequeña "Progreso" (`text-sm font-medium text-gray-600`) y fila de puntos:
    cada WOD → `<span aria-hidden>` **●** (activo) con `text-brand-500` / **○** (inactivo)
    con `text-gray-300`; dentro de un contenedor con `aria-label` como
    `"3 de 5 eventos activos"` (accesible/testeable).
  - El número total de puntos = eventos visibles+inactivos (todos los cargados), como en la
    spec (● activo, ○ inactivo).
- Opcional: si hay contenedor `gap-2` entre puntos; al hacer hover (`group-hover`) nada.

### Paso 6 — `src/components/public/CombinedLeaderboardTable.tsx` (MEJORAS)

Sin cambiar props ni nombres de columna:

1. **`—` en vez de `-`** para ausencia: `score()` → `String(value) ?? "—"` (cuidado con
   `0`/`""`), `total()` → `entry.qualified ? String(...) : "—"`, y el cierre de `WodCell`
   sin datos → `"—"` y el `enrich()` default → `"—"`. **Actualizar tests** que usan `"-"`.
2. **Sticky header**: en `<thead>` / filas de encabezado → `sticky top-0 z-10` con fondo ya
   `bg-gray-50` (agregar `shadow-sm` o `border-b`). El contenedor `overflow-x-auto` lo
   permite dentro de la vista vertical.
3. **Hover en filas**: `tbody tr: hover:bg-gray-50` (transición).
4. **Podio resaltado**: además del rank 1 actual (`bg-brand-25/60`), resaltar ranks 1–3
   (`bg-brand-25/40` rank2, `bg-brand-25/30` rank3, o bien mantener solo 1 con medalla):
   **decisión**: resaltar las 3 con `bg-brand-25/x` decreciente y el badge circular de rank
   con `bg-brand-500` (1) / `bg-gray-100` con texto (2–3).
5. **Separador Qualifier/Final más marcado**: en la fila de encabezados  
   `border-l-2 border-gray-300` (o `border-l border-gray-200` + `bg-gray-100` en el group
   header "Final") y en celdas: `border-l border-gray-100` → `border-l-2` para la primera
   col del grupo Final.
6. Mantener: sorteo (flechas ↕/▲/▼, `aria-sort`), medallas (`MedalIcon`), `min-w-[520px]`
   + `overflow-x-auto` (scroll horizontal móvil), `aria-sort`, EmptyState.

### Paso 7 — `src/components/public/CategoryInscritos.tsx` (carrusel móvil)

- Envolver el `<ul ...>` actual en un div:
  `overflow-x-auto no-scrollbar snap-x snap-mandatory scroll-smooth` (+ `-mx-4 px-4`
  opcional para permitir scroll a borde).
- El `<ul>` pasa a `flex w-max gap-3` (en móvil) y `sm:grid sm:grid-cols-2 lg:grid-cols-4
  sm:w-auto` (desktop mantiene la grilla). Tarjetas `li` con `snap-start shrink-0 w-full
  sm:w-auto`.
- Mantener `li` para los tests de orden; mantener Badge con "N inscrito(s)".
- Desktop: sin carrusel (grilla estática). Móvil ≤640px: carrusel horizontal.

### Paso 8 — Tests (actualizar + nuevos)

- **`tests/CombinedLeaderboardTable.test.tsx`**:
  - Cambiar `getAllByText("-")` → `getAllByText("—")`.
  - Añadir: header sticky (`container.querySelector("thead th")` con clase `sticky`), hover
    (`tbody tr` con clase de hover), podio ranks 1–3 resaltados (aserciones por clase/`data`).
- **`tests/WodList.test.tsx`**: añadir caso de **badge de fase "Final"** (Badge texto "Final"
  presente) y **"Menor tiempo gana"/"Mayor resultado gana"** según `is_ascending` + caso de
  **card en vez de tabla** (assert h/div con "WOD 1", no `role="table"`).
- **`tests/CategoryInscritos.test.tsx`**: añadir caso contenedor de carrusel en móvil
  (clase `overflow-x-auto` en el wrapper) — los casos actuales sin cambios.
- **`tests/CompetitionDetail.test.tsx`**:
  - Ajustar asserts de `"-"` → `"—"` (test "renders unified leaderboard…").
  - Actualizar título de "renders WODs in a table per phase" → "…per phase as cards".
  - Nuevos casos: hero muestra Atletas/Categorías/WODs/Finalistas (con números); botones de
    acción presentes; "Compartir" copia URL (mock `navigator.clipboard`) y muestra Toast;
    barra de progreso (aria-label "3 de 5 eventos activos" con `makeWod({is_active:false})`);
    secciones con `id` "workouts"/"leaderboard"; stats null → "—" (sin datos).
- Suite esperada: **191 actuales ± cambios ≈ 195–200** (neto de renombres y añadidos).

### Paso 9 — Verificación

1. `npm run typecheck` → sin errores.
2. `npm run lint` → 0 errores (1 warning preexistente `SidebarContext.tsx`).
3. `npm run test` → suite completa en verde (≈195–200).
4. `npm run build` → OK (warning chunk >500 kB preexistente).

### Paso 10 — Verificación manual + documentación

- Manual (usuario): abrir `/competitions/{slug}/` en desktop (320 px con DevTools):
  hero con métricas, badges y ciudad; info/mapa a la misma altura; categorías en carrusel
  en móvil; WODs en tarjetas con badge de fase, puntuación y `pre-wrap`; leaderboard con
  header sticky, hover, podio, separador Qualifier/Final y `—` en ausencias; barra de
  progreso ●/○; botones Ver Workouts/Ver Leaderboard (scroll) y Compartir (clipboard+toast).
- La página es Solo lectura → verificar en móvil real opcional.
- `Process.md`: cerrar Paso 37. `RESULTADOS.md`: iteración Parte II-M con verificación.
- `PLAN.md`: marcar pasos ✅.

---

## 4. Seguimiento

| Paso | Estado |
|---|---|
| 0. Registrar inicio en `Process.md` (Paso 37) | ✅ hecho |
| 1. `CompetitionHero.tsx` (hero + métricas) | ✅ hecho |
| 2. `LocationMap` `h-full` (igualar alturas) | ✅ hecho |
| 3. `CompetitionDetail.tsx` (orquestación, stats, action bar, ids, gap-12) | ✅ hecho |
| 4. `WodList.tsx` → tarjetas con badge fase y puntuación | ✅ hecho |
| 5. Barra de progreso (●/○ por `is_active`) | ✅ hecho |
| 6. `CombinedLeaderboardTable` (sticky, hover, podio, separador, `—`) | ✅ hecho |
| 7. `CategoryInscritos` (carrusel móvil) | ✅ hecho |
| 8. Tests (4 archivos afectados + casos nuevos) | ✅ hecho |
| 9. Verificación (typecheck, lint, test, build) | ✅ hecho (200/200; build OK) |
| 10. Documentar en `Process.md`/`RESULTADOS.md` | ✅ hecho |

---

## 5. Verificación de cierre (checklist)

- [x] `npm run typecheck` → sin errores.
- [x] `npm run lint` → 0 errores (1 warning preexistente `SidebarContext.tsx`).
- [x] `npm run test` → suite completa en verde (**200/200**, 24 archivos; base 191 → 200).
- [x] `npm run build` → OK.
- [x] Hero: nombre, badges (estado/tipo), ciudad, fechas y 4 tarjetas de métricas (con `—`
      cuando no hay dato).
- [x] Info General + Mapa: **misma altura exacta**, mapa `h-full`, iconos en rows, `p-6`.
- [x] Mapa sin coords → `EmptyState` "Mapa no disponible" (comportamiento actual).
- [x] Categorías: tarjetas con nombre + "N inscrito(s)"; carrusel horizontal ≤640px.
- [x] Workouts: tarjeta por WOD con "WOD N", nombre, badge `Final`/`Qualifier`, puntuación
      ("Menor tiempo gana"/"Mayor resultado gana"), `workout` con `pre-wrap`.
- [x] Progreso: puntos ●/○ según `is_active`, con `aria-label` "N de M eventos activos".
- [x] Leaderboard: header sticky (2 filas), hover filas, podio 1–3, separador Qualifier/Final
      (`border-l-2`), `—` para ausencias, scroll horizontal móvil; sorteo sin cambios.
- [x] Acciones: Ver Workouts/Ver Leaderboard (ancla), Compartir (clipboard + toast).
- [x] Espaciado: secciones `gap-12` (48px) / tarjetas `p-6` (24px) / interno `gap-4` (16px) /
      filas `gap-3` (12px); responsive 320px+.

---

## 6. Fuera de alcance

- **Backend**: sin tocar. No se agregan endpoints para "Compartir" (usa clipboard+URL).
- **Modelo de datos / hooks / API / fixtures**: sin cambios (contracciones sin cambiar
  contratos). No se modifica `buildCombinedLeaderboards`.
- **`WodList` no cambia de nombre** (evita ripple de imports/tests); se reforma en place.
- **No se usa SCSS**: Tailwind v4 (el repo no trae SCSS). Si el usuario exige SCSS, es una
  adición de dependencia → requiere su OK previo.
- **Otros públicos**: solo `/competitions/{slug}/`. `HomeIndex`, `CompetitionCard` y `Tabs`
  no se tocan.
- Sin cambio de textos de sección usados en tests: "Workouts", "Leaderboard",
  "Categorías e inscritos", "Sin eventos", "Sin workouts en {phase}", etc.

---

## 7. Restricciones que se mantienen

- **NO** tocar el clon `free-react-tailwind-admin-dashboard/` (solo lectura).
- **NO** crear ramas, **NO** push, **NO** commit sin pedido explícito.
- **NO** ejecutar comandos del backend.
- Sin comentarios en código salvo que se soliciten.
- Textos en español; tema claro; sin i18n; sin `any`; accesibilidad (roles, `aria-label`,
  `aria-sort`) mantenida.
- Sin emojis salvo ●/○ (espec) y medallas ya existentes (`MedalIcon`).
- Fixtures solo en `tests/`; sin mock de datos en producción.