# PLAN — Implementación del PROMPT.md (Vistas públicas de Scorely)

> Documento de planificación. **No ejecuta cambios**: describe, paso a paso, cómo implementar la
> actualización especificada en `PROMPT.md` (Parte II), para ser ejecutada en una sesión posterior.
> Estado: **BORRADOR / pendiente de revisión**.

---

## 0. Resumen del objetivo

Poner a disposición del público (sin login) la información de las competiciones de **Scorely**:

- **`/`** — Inicio público: competiciones recientes (por `start_date` desc) con pestaña a "todas las competiciones".
- **`/competitions/:id/`** — Detalle público: información general (nombre, afiliación dueña/creadora, fechas),
  mapa (embed OpenStreetMap), status, WODs por etapa y leaderboards (qualifier/final) con filtros.
- El panel `/admin` **no cambia** en esta iteración y sigue protegido por rol (JWT).

Restricciones clave heredadas del PROMPT:
- **NO tocar el backend** (ni endpoints, ni mockear en producción).
- **NO tocar el clon de referencia** (`free-react-tailwind-admin-dashboard/`), solo lectura.
- No crear ramas, no push, no git sin pedido explícito. Documentar en `Process.md`.

---

## 1. Estado actual verificado

| Elemento | Estado |
|---|---|
| `PROMPT.md` | Presente (spec Parte II completada) |
| Clon referencia TailAdmin | `free-react-tailwind-admin-dashboard/` (MIT, React 19, Tailwind v4, Vite 6, TS 5.7, router `react-router` 7.1) |
| Proyecto `frontend/` | **NO existe aún** → hay que crearlo desde cero |
| `Process.md` / `RESULTADOS.md` | **NO existen** → crear en el Paso 1 |
| `.env` / `VITE_API_URL` | No configurado → definir al crear el proyecto |
| Repositorio git | No es repo git en el directorio raíz (no hacer operaciones git sin pedido) |

Observaciones sobre el clon (usado solo como referencia visual/código):
- Layout admin: `src/layout/AppLayout.tsx`, `AppHeader.tsx`, `AppSidebar.tsx`.
- Paleta/tema (light+dark): definida vía `@theme` en `src/index.css` (tokens `brand`, `gray`, `success`, `error`, etc.).
- Login: `src/pages/AuthPages/SignIn.tsx`; componentes: `src/components/common/*`, `src/components/ui/*`, `src/components/tables/*`.
- El proyecto Scorely usará **tema claro** (sin dark mode por ahora) y solo replicará lo que necesite.

---

## 2. Decisiones/preguntas a resolver ANTES de implementar

> Estas ambigüedades del `PROMPT.md` deben confirmarse con el usuario antes del Paso 1. Sin resolverlas, la implementación puede resultar en un trabajo inválido.

1. **[DECISIÓN PENDIENTE §12]** Los endpoints `competitions`, `competition-stages` y `events` requieren JWT en el backend (solo `leaderboards` es `AllowAny`). Opciones:
   - (a) El backend abrirá esos GET al público → implementar vistas públicas sin login (recomendado por la spec).
   - (b) Se mantiene JWT → las vistas públicas exigirían login (contradice el objetivo). **No implementar la iteración hasta decidir**.
   - Hasta entonces la spec asume acceso con JWT. **Preguntar al usuario** qué backend hay disponible para probar.
2. **Rutas por `id` vs `slug`**: el API referencia competiciones por `id` (el `slug` no es lookup del API).
   → La propuesta usa `/competitions/:id/`. Confirmar o solicitar cambio de lookup en backend (NO lo hacemos nosotros).
3. **Estados públicos de competición visibles**: la spec sugiere que el público vea solo `PUBLISHED`/`FINISHED` (no `DRAFT`/`CANCELLED`). Confirmar si el backend ya filtra o si hay que filtrar en frontend.
4. **Convenciones `[COMPLETAR]` de la Parte I**: nombres (PascalCase/kebab), exports (default vs named), manejo de carga/error estándar, responsive objetivo (móvil/tablet/desktop). **No asumir**: verificar en el código del clon y acordar.
5. **URL base del API real** para pruebas manuales (`VITE_API_URL`): pedir al usuario.
6. **Wireframe/maqueta de las páginas públicas** (la sección 4 está sin completar): ¿existe diseño o se procede con el estilo TailAdmin adaptado?

---

## 3. Stack y dependencias a instalar (en `frontend/`)

Mirrors de lo ya usado por el clon + lo fijado en la Parte I:

| Dependencia | Versión sugerida | Nota |
|---|---|---|
| `react` / `react-dom` | ^19.x | igual que clon |
| `react-router-dom` | ^6.x (v6) o ^7 como clon | Parte I dice **v6**; clon usa 7.1 → confirmar en Paso «config». |
| `zustand` | ^5.x | estado global |
| `@tanstack/react-query` | ^5.x | data fetching |
| `react-hook-form` + `zod` + `@hookform/resolvers` | ^7.x / ^3.x | formularios (login) |
| `tailwindcss` + `@tailwindcss/vite` (o postcss) | ^4.x | Tailwind v4, tema claro |
| `typescript` | ~5.7.x | igual que clon |
| `vite` | ^6.x | igual que clon |
| `@vitejs/plugin-react`, `vite-plugin-svgr` | igual que clon | son necesarios para SVG |
| `vitest` + `@testing-library/react` + `@testing-library/jest-dom` + `jsdom` | ^3.x / ^16.x | tests unitarios |
| `@playwright/test` | ^1.x | e2e (opcional en esta iteración) |
| `eslint` + `typescript-eslint` + `eslint-plugin-react-hooks` + `eslint-plugin-react-refresh` | igual que clon | lint |
| `clsx` / `tailwind-merge` | ^2.x / ^3.x | utilidades de clases |

No se instalan: Highcharts, ls bonos de TailAdmin "Pro", ni librerías comerciales. Mapas: **OSM embed (iframe)** sin librería; no usar `@react-jvectormap`.

**Scripts a configurar en `package.json`** (plantilla):
```bash
npm run dev        # vite
npm run build      # tsc -b && vite build
npm run lint       # eslint .
npm run test       # vitest run
npm run test:watch # vitest
npm run typecheck  # tsc -b --noEmit  (o npx tsc --noEmit)
npm run preview    # vite preview
```

---

## 4. Estructura de carpetas a crear (en `frontend/`)

```
frontend/
├── .env                      # VITE_API_URL (no commitear valores reales)
├── .env.example
├── package.json / tsconfig*.json / vite.config.ts / eslint.config.js
├── index.html
├── public/
├── src/
│   ├── main.tsx / App.tsx
│   ├── index.css             # tema claro + tokens base (replicados de TailAdmin, sin dark)
│   ├── api/                  # cliente HTTP + interceptor refresh + endpoints
│   │   ├── client.ts
│   │   ├── auth.ts
│   │   └── public.ts         # competitions, stages, events, leaderboards
│   ├── types/                # DTOs (Competition, Stage, Event, Leaderboard…)
│   ├── store/                # Zustand: authStore (token, usuario, rol)
│   ├── hooks/                # queries TanStack (useCompetitions, useCompetition, …)
│   ├── components/
│   │   ├── common/           # Badge, Spinner, ErrorState, EmptyState, Tabs
│   │   ├── public/           # CompetitionCard, WodList, LocationMap, LeaderboardTable, LeaderboardFilters
│   │   └── admin/            # (reservado, no en esta iteración)
│   ├── layout/
│   │   ├── PublicLayout.tsx  # header/footer públicos (a medida)
│   │   └── AdminLayout.tsx   # replica de AppLayout (reservado para /admin)
│   ├── guards/
│   │   ├── RoleGuard.tsx     # protege /admin/* (redirige a login)
│   │   └── PublicOnly.tsx    # (opcional)
│   ├── pages/
│   │   ├── public/
│   │   │   ├── HomeIndex.tsx          # /
│   │   │   └── CompetitionDetail.tsx  # /competitions/:id/
│   │   ├── auth/
│   │   │   └── LoginPage.tsx          # /login (replicado de SignIn, tem claro)
│   │   └── admin/            # (reservado)
│   └── utils/                # formatters (fechas, puntuación), cn()
├── tests/                    # tests unitarios + e2e (opcional)
├── Process.md                # registro de avances (obligatorio por PROMPT)
└── RESULTADOS.md             # resultado y verificaciones al finalizar
```

> Regla: NO escribir nada dentro de `free-react-tailwind-admin-dashboard/`. Todo el código propio vive en `frontend/`.

---

## 5. Plan paso a paso

### Paso 1 — Preparación y scaffolding
- [ ] Crear `Process.md` y registrar inicio.
- [ ] Resolver con el usuario las preguntas de la sección 2 (endpoints públicos, id vs slug, VITE_API_URL, convenciones, maqueta).
- [ ] Crear proyecto base: `npm create vite@latest frontend -- --template react-ts` (React 19 + TS), en el directorio raíz.
- [ ] Instalar dependencias del stack (sección 3) y Tailwind v4 (`@tailwindcss/vite` o postcss).
- [ ] Configurar `vite.config.ts` (plugin react, svgr, alias `@/` → `./src`, configuración vitest), `tsconfig` con paths, `eslint.config.js`.
- [ ] Crear `index.css` con **tema claro**: copiar del clon solo los tokens `@theme` de colores/typografía/breakpoints/shadow (sin `@custom-variant dark`, sin estilos dark de terceros). Añadir base: `body { @apply font-outfit bg-gray-50 text-gray-900; }`.
- [ ] Configurar scripts en `package.json`.
- [ ] Crear `.env` / `.env.example` con `VITE_API_URL` (valor solicitado al usuario).

### Paso 2 — Tipos/DTOs y cliente API
- [ ] `src/types/`: definir `Competition`, `Affiliation`, `Location`, `CompetitionStage`, `Event` (WOD), `Leaderboard`, `LeaderboardEntry`, `CategoryCode`… conforme a la sección 6 del PROMPT. No asumir campos: validar contra la respuesta real del backend/OpenAPI.
- [ ] `src/api/client.ts`: `fetch` wrapper con base URL de `import.meta.env.VITE_API_URL`, `Content-Type: application/json`, manejo de errores tipados, y opcional `Authorization: Bearer` cuando exista token.
- [ ] `src/api/auth.ts` (si aplica esta iteración): login/refresh endoints JWT (`POST /api/v1/auth/token/`, `.../refresh/`), interceptor que ante **HTTP 401** hace refresh y reintenta; si refresh falla → `authStore.clear()` + redirect a `/login`.
- [ ] `src/api/public.ts`: endpoints de lectura (ver tabla de la sección 6 de este plan).
- [ ] `src/store/authStore.ts`: Zustand — `token`, `refreshToken`, `user`, `role`, `login/logout`.

### Paso 3 — Routing y guards
- [ ] `src/App.tsx` con `BrowserRouter`, `ScrollToTop`.
- [ ] Rutas públicas (sin auth):
  - `/` → `HomeIndex`
  - `/competitions/:id/` → `CompetitionDetail`
- [ ] Rutas de auth: `/login` → `LoginPage`.
- [ ] Rutas admin (placeholder por ahora, protegidas): `/admin/*` dentro de `AdminLayout` + `RoleGuard` que redirige a `/login` sin sesión.
- [ ] `404` → página pública de "no encontrado" (estilo TailAdmin adaptado, tema claro).
- [ ] `<RoleGuard>` lee de `authStore`; sin token → `<Navigate to="/login" replace />`.

### Paso 4 — Hooks de data fetching (TanStack Query)
- [ ] `QueryClientProvider` en `main.tsx` (config global: retries, staleTime, error handling).
- [ ] Hooks `useCompetitions(params)`, `useCompetition(id)`, `useCompetitionStages(competitionId)`, `useEvents(stageId)`, `useLeaderboard(competitionId, stage)`.
- [ ] Estados estándar: `isLoading`/`isError`/`data`; exportar objetos de error tipados.

### Paso 5 — Componentes comunes públicos (a medida, Tailwind claro)
- [ ] `Tabs` (Recientes / Todas + manejo de activo).
- [ ] `Badge` / `StatusBadge` (mapeo código→`label` en español, colores por estado: PUBLISHED, FINISHED, DRAFT, CANCELLED, UPCOMING…; **solo PUBLISHED/FINISHED visibles al público** según decisión de la sección 2).
- [ ] `Spinner` (loading), `ErrorState` (mensaje + reintentar), `EmptyState` (sin WODs / sin leaderboard / sin competiciones *sin romper la página*).
- [ ] `CompetitionCard` (tarjeta: nombre, afiliación, fechas, tipo, status; enlaza a detalle). Densidad: tarjetas para listado.
- [ ] `LocationMap` (iframe OSM embed: `https://www.openstreetmap.org/export/embed.html?bbox=...&marker=lat,lon`) a partir de `Location.latitude/longitude`; si no hay coords → estado "sin mapa" (EmptyState). **Sin API key**.

### Paso 6 — Página de inicio pública (`/`)
- [ ] `HomeIndex`: header público (logo/nombre Scorely, enlace al detalle si procede), sección hero opcional.
- [ ] Tabs: **Recientes** (default; ordenadas por `start_date` desc) / **Todas** (listado completo).
- [ ] Filtros de lista (opcional): tipo de competición (`competition_type`), búsqueda por nombre, estado — usando los query params que soporta el endpoint (no inventar).
- [ ] Grid responsive de `CompetitionCard` (móvil/tablet/desktop).
- [ ] Estados: carga (spinner/skeleton), error (reintentar), vacío (sin competiciones).
- [ ] Navegación tarjeta → `/competitions/:id/`.

### Paso 7 — Detalle público de competición (`/competitions/:id/`)
- [ ] `CompetitionDetail`: carga de competición + stages + eventos + leaderboards.
- [ ] Cabecera: nombre, `StatusBadge`, fechas (`start_date`→`end_date`), tipo de competición, equipo.
- [ ] Afiliación **dueño/creador**: nombre + ciudad/estado/país (bloque destacado).
- [ ] Mapa: `LocationMap` (dato de `location`).
- [ ] **WODs** por etapa: sección agrupada por `CompetitionStage` (Qualifier/Final, según `competition_stage`), listado tipo tabla con `event_number`, `name`, `description`, `event_result_type`, `rank_direction`.
- [ ] **Leaderboards**: pestañas Qualifier / Final + `LeaderboardFilters` (categorías disponibles según payload) + `LeaderboardTable` (rank, participante, `final_score`, `event_ranks[]`).
- [ ] Estados: competición sin WODs/sin leaderboard/sin datos → `EmptyState` claro; competición `DRAFT`/`CANCELLED` → visible solo si la decisión de la sección 2 lo permite.

### Paso 8 — Login mínimo y protección de `/admin`
- [ ] `LoginPage` replicada del `SignIn` del clon (tema claro, español): `react-hook-form` + `zod`.
- [ ] Al autenticar: guardar tokens/rol en `authStore`; redirigir a `/admin` o a `location.state` original.
- [ ] Verificar que `/admin/*` sin sesión → redirección a `/login`.
- [ ] (Sin CRUD admin en esta iteración: solo rutas placeholder protegidas.)

### Paso 9 — Pruebas
- [ ] Configurar Vitest + RTL + jsdom (setup global con jest-dom).
- [ ] Tests unitarios/componentes por escenario de la sección 10 del PROMPT:
  - HomeIndex sin sesión: renderiza recientes + pestaña "todas".
  - Detalle: información, afiliación, fechas, mapa, WODs, leaderboard.
  - Filtros de leaderboard (etapa/categoría) se reflejan en la tabla.
  - RoleGuard: sin token → redirige a login.
  - Estados vacíos: competición sin WODs/leaderboard no rompe la página.
- [ ] (Opcional) E2E con Playwright: flujo `/` → detalle → filtro leaderboard.
- [ ] Verificación manual contra el backend real (si el usuario lo provee y una vez resuelta la decisión de acceso JWT/público de la sección 2). Si el backend no está disponible → documentar el mock **temporal** para dev y marcarlo claramente (no mockear en producción).

### Paso 10 — Verificación final (criterios de aceptación del PROMPT, §11)
- [ ] `npm run build` sin errores.
- [ ] `npm run lint` sin errores.
- [ ] `npm run typecheck` sin errores.
- [ ] Suite de tests en verde (`npm run test`).
- [ ] `/` consultable sin login: muestra recientes + todas.
- [ ] Detalle muestra info general, afiliación dueño/creador, fechas, mapa, WODs y leaderboard.
- [ ] Filtros de leaderboard (etapa/categoría) funcionan.
- [ ] `/admin/*` protegido (redirige a login sin sesión).
- [ ] Solo español, tema claro.
- [ ] Confirmar que **no se tocó el backend** ni `free-react-tailwind-admin-dashboard/`.

### Paso 11 — Documentación y cierre
- [ ] Actualizar `Process.md` con avances al iniciar/finalizar cada paso.
- [ ] Escribir `RESULTADOS.md`: resumen de lo implementado, verificaciones ejecutadas, pasos manuales pendientes del usuario (p.ej. decidir el tema de endpoints públicos, proveer `VITE_API_URL`, pruebas contra backend real).
- [ ] Reportar resumen final al usuario (qué se cambió, cómo se verificó, pasos manuales restantes).
- [ ] NO hacer git operations (no ramas, no push, no commit) salvo pedido explícito.

---

## 6. Endpoints del API a consumir (solo lectura)

| Acción | Método | URL | Auth |
|---|---|---|---|
| Listar competiciones | GET | `/api/v1/competitions/` | Pública (pendiente decisión) |
| Detalle competición | GET | `/api/v1/competitions/{id}/` | Pública (pendiente decisión) |
| Stages de una competición | GET | `/api/v1/competition-stages/?competition={id}` | Pública (pendiente decisión) |
| Eventos/WODs de un stage | GET | `/api/v1/events/?competition_stage={id}` | Pública (pendiente decisión) |
| Leaderboard qualifier | GET | `/api/v1/leaderboards/competition/{id}/qualifier/` | **Pública (AllowAny)** |
| Leaderboard final | GET | `/api/v1/leaderboards/competition/{id}/final/` | **Pública (AllowAny)** |

> Si alguno de los endpoints "pendiente" no se abre al público, **avisar al usuario** (no mockear silenciosamente en producción). Los filtros/búsqueda deben usar únicamente los query params que el backend soporta (`competition_type`, `status`, `search` por nombre, según §7 del PROMPT).

---

## 7. Riesgos / puntos de atención

1. **Decisión pendiente de acceso público** (§12 PROMPT): bloquea la validación real de `/` y el detalle sin login. Mitigación: implementar contra el contrato documentado y verificar con JWT hasta que el usuario resuelva.
2. **`VITE_API_URL`**: sin un valor real no hay verificación manual; pedirlo antes del Paso 1.
3. **Rutas por `id`**: si el backend cambia a lookup por `slug` se ajustan rutas. Notificarlo al usuario (cambio backend — no lo hacemos).
4. **Mapa**: OSM embed requiere lat/lon válidos; coordinar comportamiento sin coordenadas (EmptyState).
5. **Dependencias**: evitar librerías fuera del stack definido (regla Parte I). Preguntar antes de añadir.
6. **Clon TailAdmin**: verificar que ninguna herramienta/paso toque `free-react-tailwind-admin-dashboard/`.

---

## 8. Éxito / definición de "done"

Se considera completado cuando:
- Todos los checks del Paso 10 estén verdes.
- Las páginas públicas funcionen contra el backend real (o con mock temporal documentado si el backend no está accesible).
- `Process.md` y `RESULTADOS.md` estén actualizados.
- No se haya modificado ni el backend ni el clon de referencia.
- Las decisiones de la sección 2 queden registradas en `RESULTADOS.md` (incl. la pendiente de endpoints públicos).