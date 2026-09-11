# RESULTADOS — Implementación de las vistas públicas de Scorely

Fecha: 2026-09-11
Proyecto: Scorely-frontend (raíz, creado desde cero)
Especificación: `PROMPT.md` (Parte II — Pantalla pública con información del sistema)

---

## Qué se implementó

| Funcionalidad | Estado |
|---|---|
| `/` — Inicio público (Recientes + pestaña "Todas", búsqueda) | ✅ |
| `/competitions/:slug/` — Detalle público (info, afiliación, fechas, sede, mapa OSM, WODs, leaderboards) | ✅ |
| Leaderboard público con pestañas Qualifier/Final y filtro de categoría | ✅ |
| `/login` (react-hook-form + zod, JWT) | ✅ |
| `/admin/*` protegido por `RoleGuard` (sin sesión → `/login`) | ✅ |
| E2E/Tests: Vitest + RTL (14 tests) | ✅ |
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
│   ├── components/public/       # CompetitionCard, LocationMap, WodList, LeaderboardTable, LeaderboardFilters
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
| `npm run test` | 14/14 en verde (3 archivos) |
| `npm run build` | OK (dist generado, Vite 6.4.3) |
| `npm run dev` | Arranca en `http://localhost:5173/` |

## Criterios de aceptación (PROMPT §11)

- [x] build sin errores
- [x] lint sin errores
- [x] typecheck sin errores
- [x] suite de tests en verde (frontend 14/14; backend 94/94)
- [x] `/` renderiza recientes + pestaña "todas" (con backend disponible/público)
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
3. Verificar contra el backend real la forma exacta de los payloads (paginación, campos de leaderboard/etapas/eventos) y ajustar `types/` y `normalizeLeaderboards` si difiere.
4. Confirmar códigos exactos de `status`, `competition_type` y `competition_stage` (qualifier/final) para el `StatusBadge` y el mapeo de etapas.
5. (Opcional) Playwright e2e: no instalado en esta iteración (requiere descargar navegadores).
6. (Siguiente iteración) CRUD completo del panel `/admin` sobre el layout TailAdmin.