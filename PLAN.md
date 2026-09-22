# PLAN — Ejecución de `PROMPT.md` — Parte II-G: Equipos globales (catálogo al estilo Atletas)

> **Documento de planificación, no ejecuta cambios.** Describe, paso a paso,
> cómo implementar la **Parte II-G** sobre `Scorely-frontend/` **y** el backend
> `Scorely/`, indicando el **estado actual** y el trabajo **pendiente**.
>
> Fecha: 2026-09-21
> Estado: BORRADOR / pendiente de ejecución (Parte II-G **no documentada aún** en
> `PROMPT.md` — se escribe en el Paso 0 — ni implementada en el código)

---

## 0. Alcance del plan

`PROMPT.md` especifica varias actualizaciones del sistema. Una novedad aprobada
por el usuario (2026-09-21) es la **Parte II-G**: el **`Team` deja de pertenecer a
una competición** y pasa a ser un **catálogo global como `Athlete`**. La
competición de una inscripción queda **solo en `Competitor`** (que ya la guarda).

Estado de las partes:

| Sección | Módulo | Estado |
|---------|--------|--------|
| **Parte II** — Pantalla pública | Público | ✅ COMPLETADO |
| **Parte II-B** — Categorías disponibles | Admin | ✅ COMPLETADO |
| **Parte II-C** — Filiaciones | Admin | ✅ COMPLETADO |
| **Parte II-D** — Sedes | Admin | ✅ COMPLETADO |
| **Parte II-E** — Categorías con recuento de inscritos | Público | ✅ COMPLETADO (suite 93/93 al cierre) |
| **Parte II-F** — Competidores (inscripciones) | Admin | ✅ COMPLETADO (suite 108/108 al cierre) |
| **Parte II-G** — Equipos globales | Backend + Admin | ⏳ **PENDIENTE** (objeto de este plan) |

Este plan:
1. Documenta el **estado actual** (backend shape verificado; frontend sin cambios
   de equipos salvo el CRUD por competición de la Parte II-F).
2. Detalla **paso a paso** la migración de `Team` a catálogo global (backend y
   frontend), incluida la **eliminación de la FK `Team.competition`**.
3. Incluye verificación completa (pytest backend **120/120**, vitest frontend
   **108/108**) y la documentación en ambos repos (`PROMPT.md`, `Process.md`,
   `RESULTADOS.md`, cabeceras de estado).

### Reglas clave / decisiones del usuario (2026-09-21)
1. **`Team.competition` se elimina del todo** (no queda nullable; es un `RemoveField`
   con migración). La relación histórica equipo→competición sobrevive solo en los
   registros `Competitor` (que persisten).
2. **`TeamViewSet` espejo de `AthleteViewSet`**: `(IsAuthenticated,)`, queryset
   global, **sin** guard de competición ni `create()` con permiso. Cualquier usuario
   autenticado puede crear/editar/borrar equipos (igual que atletas hoy).
3. **Esta iteración SÍ toca el backend** (modelo, migración, views, serializers,
   admin, seed y tests pytest). El usuario lo confirmó explícitamente.
4. Se mantienen las restricciones globales: **no** tocar `free-react-tailwind-admin-dashboard/`,
   **no** ramas/push/commit salvo pedido, textos y docs en español, sin comentarios
   de código, mantener patrones TailAdmin y reutilizar los catálogos existentes.

Motivo del cambio: hoy el modelo duplica la competición en `Team.competition` y en
`Competitor.competition`; un equipo es una entidad que existe **una vez** y se
inscribe en varias competencias.

---

## 1. Estado actual (análisis verificado en el código)

### Backend — `leader\Scorely` (se modifica esta vez)
- `apps/participants/models.py:25-43` → `Team`: `name`, **`competition` (FK
  obligatoria, `CASCADE`, `related_name='teams'`)**, `affiliation` (opcional).
  Es lo que se repite con `Competitor.competition`.
- `apps/participants/serializers.py:12-15` → `TeamSerializer` = `(id, name,
  competition, affiliation)`.
- `apps/participants/views.py:24-41` → `TeamViewSet` = `(IsAuthenticated,
  IsCompetitionAdmin)`, `get_queryset()` filtra por `visible_competitions_q`,
  `create()` guard con 403. Es el **único** usuario de `IsCompetitionAdmin` y
  `visible_competitions_q` en este módulo.
- `apps/participants/admin.py:14-18` → `TeamAdmin` usa `competition` en
  `list_display` y `autocomplete_fields`.
- `apps/users/management/commands/seed_data.py:393-417` → `create_team()` hace
  `Team.objects.get_or_create(competition=competition, name=team_name)`.
- `tests/conftest.py:188-192` → fixture `team` = `Team.objects.create(competition=..., name='LOS TD-AH')`.
- `tests/test_permissions.py:315-369` → 3 tests que prueban el **comportamiento por
  competición** de equipos (lista filtrada, 403 al crear fuera de la competición,
  201 al crear en la propia). Se reescriben.
- `tests/test_seed.py:25,42` → espera `Team.objects.count() == 4` (nombres únicos
  del seed) y misma idempotencia.
- Fuera de impacto: `events`, `rankings`, `scoring` **no** usan `Team.competition`
  (verificado por búsqueda); `CompetitorSerializer.validate` valida contra
  `Competitor.team` (id), no contra la competición del equipo.

### Frontend — `Scorely-frontend` (CRUD de equipos actual)
- `src/types/index.ts:166-177` → `Team` y `TeamWritePayload` incluyen `competition`.
- `src/api/admin.ts:287-313` → `fetchTeams(competitionId)` =
  `/teams/?competition={id}&page_size=100`; crear/actualizar/borrar equipos.
- `src/hooks/useAdminModules.ts:127-170` → `useAdminTeams(competitionId)` con
  `enabled: Boolean(competitionId)` y mutaciones que invalidan `["admin","teams",competitionId]`.
- `src/pages/admin/TeamsPage.tsx` → listado **por scope** (usa `CompetitionScopeSelect`,
  columna "Competición" resuelta con `useAdminCompetitions` y `team.competition`).
- `src/pages/admin/TeamFormPage.tsx` → gate de scope + payload con `competition`
  (alta: scope; edición: competición del registro).
- `src/pages/admin/CompetitorsPage.tsx:23` → `useAdminTeams(competitionId)` para
  resolver el nombre del equipo inscrito. `CompetitorFormPage.tsx:79` →
  `useAdminTeams(effectiveCompetitionId)` para el select de Equipo.
- Referencia a espejar: `src/pages/admin/AthletesPage.tsx` y `AthleteFormPage.tsx`
  (catálogo global, sin scope; `useAdminAthletes()` global).
- Tests: `tests/fixtures.ts:93-101` `makeTeam` con `competition: 1`;
  `CompetitorsPage.test.tsx` / `CompetitorFormPage.test.tsx` mockean `useAdminTeams`
  (ignoran args, siguen válidos tras el cambio). No hay tests de TeamsPage/TeamFormPage.
- `tests/adminApi.test.ts` no tiene bloque teams (no se toca; opcional añadir uno).

---

## 2. Parte II-G — Objetivo y reglas de negocio

| Regla de negocio | Quién | Dónde |
|------------------|-------|-------|
| `Team` deja de tener competición: es **catálogo global** de equipos | Backend | `participants.models.Team` |
| El **alta/edición/baja de equipos** es global (sin scope), como atletas | Admin (auth) | `/admin/teams` (+ `/new` y `/:id/edit`) |
| La **competición de la inscripción** vive solo en `Competitor` | Backend (`Competitor`) + frontend (`CompetitorsPage`/`CompetitorFormPage`) | sin cambios de modelo en `Competitor` |
| El select de **Equipo** en Competidores trae **todos** los equipos (global) | Admin (auth) | `CompetitorFormPage` |
| Cualquier usuario autenticado puede CRUD de equipos (espejo de atletas) | Backend | `TeamViewSet` = `(IsAuthenticated,)` |

Regla clave: **eliminar la redundancia** `Team.competition`/`Competitor.competition`;
la competición de una inscripción queda representada una sola vez.

---

## 3. Matriz de archivos (Parte II-G)

### Backend — `leader\Scorely`
| Archivo | Tipo | Cambio |
|---------|------|--------|
| `apps/participants/models.py` | Modificar | `Team`: quitar FK `competition` |
| `apps/participants/serializers.py` | Modificar | `TeamSerializer.fields` sin `competition` |
| `apps/participants/views.py` | Modificar | `TeamViewSet` espejo de `AthleteViewSet`; limpiar imports |
| `apps/participants/admin.py` | Modificar | `TeamAdmin` sin `competition` |
| `apps/participants/migrations/0003_*.py` | **Crear** (`makemigrations`) | `RemoveField` de `Team.competition` (no se aplica a la BD) |
| `apps/users/management/commands/seed_data.py` | Modificar | `create_team()` global (sin `competition`) |
| `tests/conftest.py` | Modificar | fixture `team` sin `competition` |
| `tests/test_permissions.py` | Modificar | Reescribir bloque de equipos (global, no por competición) |
| `tests/test_seed.py` | Verificar | Conteos (deberían mantenerse en 4/4) |

### Frontend — `Scorely-frontend`
| Archivo | Tipo | Cambio |
|---------|------|--------|
| `PROMPT.md` | Modificar | **Paso 0:** nueva sección **Parte II-G** + ajustar avisos que referencian `TeamViewSet` (líneas ~463 y ~494) |
| `src/types/index.ts` | Modificar | `Team` y `TeamWritePayload` sin `competition` |
| `src/api/admin.ts` | Modificar | `fetchTeams()` global (`/teams/?page_size=100`) |
| `src/hooks/useAdminModules.ts` | Modificar | `useAdminTeams()` y mutaciones sin `competitionId` (invalidan `["admin","teams"]`) |
| `src/pages/admin/TeamsPage.tsx` | Modificar | Espejo de `AthletesPage`: sin scope ni columna Competición |
| `src/pages/admin/TeamFormPage.tsx` | Modificar | Espejo de `AthleteFormPage`: sin scope; payload sin `competition` |
| `src/pages/admin/CompetitorsPage.tsx` | Modificar | `useAdminTeams()` global |
| `src/pages/admin/CompetitorFormPage.tsx` | Modificar | `useAdminTeams()` global (categorías habilitadas siguen por competición) |
| `tests/fixtures.ts` | Modificar | `makeTeam` sin `competition` |
| `tests/CompetitorsPage.test.tsx` · `CompetitorFormPage.test.tsx` | Verificar | Mocks de `useAdminTeams` siguen válidos |
| `tests/adminApi.test.ts` | Opcional | Añadir `fetchTeams()` global |
| `PLAN.md` | Modificar | Cabecera de estado → COMPLETADO al terminar |
| `Process.md` | Modificar | Nuevo paso "Parte II-G — Equipos globales" |
| `RESULTADOS.md` | Modificar | Iteración 2026-09-21 (Parte II-G) + avisos |

---

## 4. Pasos detallados (Parte II-G)

### Paso 0 — Spec en `PROMPT.md` + ajuste de avisos (informativo)

1. Escribir en `Scorely-frontend/PROMPT.md` la sección **`# Parte II-G — Equipos
   globales (catálogo al estilo Atletas)`**, insertada **antes** de
   `# Parte III — Flujo de trabajo del agente`:
   - **Título / Objetivo / Alcance**: `Team` deja de tener `competition`; los
     equipos pasan a catálogo global como `Athlete`; la competición de la
     inscripción queda solo en `Competitor`. Alcance = backend (`participants`) +
     admin `/admin/teams` + formulario de Competidores.
   - **Endpoints backend** (antes/después): `GET/POST/PATCH/DELETE /api/v1/teams/`
     con `(IsAuthenticated,)`, global, sin filtro por competición.
   - **DTOs frontend**: `Team` sin `competition`; `TeamWritePayload` sin
     `competition`.
   - **Componentes/páginas**: `TeamsPage`/`TeamFormPage` sin scope (espejo de
     atletas); `CompetitorsPage`/`CompetitorFormPage` con equipos globales.
   - **Pruebas**: pytest (reescritura del bloque de permisos de equipos) y vitest
     (fixtures y mocks).
2. **Ajustar los avisos existentes** que citan a `TeamViewSet` como el patrón de
   guard de competición (`PROMPT.md` líneas ~463 y ~494 de la Parte II-F): indicar
   que en la II-G `TeamViewSet` deja de filtrar por competición (catálogo global) y
   que el aviso de `CompetitorViewSet` queda sin ese patrón de referencia.
3. Anotar en `Process.md` el shape verificado y las decisiones del usuario.

**Verificación**: revisar que `PROMPT.md` quede coherente (II-A…II-G + Partes III).

---

### Paso 1 — Backend: modelo `Team`

**Archivo**: `apps/participants/models.py`

- Eliminar del modelo `Team` el bloque completo de la FK `competition`
  (`models.ForeignKey('competitions.Competition', on_delete=models.CASCADE,
  related_name='teams')`). El modelo deja de conocer competiciones.
- No tocar `TeamMember` ni `Competitor` (ya guardan `team`/`athlete` y
  `competition` respectivamente).

**Verificación**: `python manage.py check` en backend.

---

### Paso 2 — Backend: serializer

**Archivo**: `apps/participants/serializers.py`

- `TeamSerializer.Meta.fields` → `('id', 'name', 'affiliation')`.

**Verificación**: `python manage.py check`.

---

### Paso 3 — Backend: views

**Archivo**: `apps/participants/views.py`

- `TeamViewSet` → espejo de `AthleteViewSet`:
  `permission_classes = (IsAuthenticated,)`, `queryset = Team.objects.all()`,
  `search_fields = ('name',)`, `filterset_fields = ('affiliation',)`.
- Eliminar `get_queryset()` (filtro `visible_competitions_q`) y `create()`
  (guard contra competiciones no visibles).
- Limpiar imports que quedan sin uso: `PermissionDenied`, `IsCompetitionAdmin`,
  `visible_competitions_q` (verificar con linter que no se usan en otra parte del
  módulo).

**Verificación**: `python manage.py check`.

---

### Paso 4 — Backend: Django admin

**Archivo**: `apps/participants/admin.py`

- `TeamAdmin`: quitar `competition` de `list_display` y `autocomplete_fields`.
  Queda `list_display = ('name', 'affiliation')` y `autocomplete_fields = ('affiliation',)`.

**Verificación**: `python manage.py check`.

---

### Paso 5 — Backend: migración

- Generar la migración:
  `python manage.py makemigrations participants`
  → crea `apps/participants/migrations/0003_remove_team_competition*.py`
  (`RemoveField`).
- **No aplicar** a la BD: convención del repo (las migraciones de BD las ejecuta el
  usuario; los tests usan `--nomigrations`, ver `Process.md` backend).
- Verificar que no queda nada pendiente:
  `python manage.py makemigrations --check --dry-run participants`.

**Verificación**: comando `--check` sale sin "changes".

---

### Paso 6 — Backend: seed

**Archivo**: `apps/users/management/commands/seed_data.py` (`create_team()`)

- Reemplazar `Team.objects.get_or_create(competition=competition,
  name=team_name)` por creación **global** (el nombre es único en el seed):
  - `team, created_t = Team.objects.get_or_create(name=team_name)`.
  - Alternativa robusta si un re-run dejara duplicados previos:
    `team = Team.objects.filter(name=team_name).first()` y `Team.objects.create(name=team_name)`
    si no existe.
- Mantener `TeamMember.objects.get_or_create(team=team, athlete=athlete)` (roster
  global sin cambios).
- A partir de aquí los equipos se comparten entre competiciones (se espera que
  `test_seed` mantenga `Team.objects.count() == 4`).

**Verificación**: `python -m pytest tests --settings=config.settings.development -k seed`.

---

### Paso 7 — Backend: fixtures y tests

**Archivos**: `tests/conftest.py`, `tests/test_permissions.py`, `tests/test_seed.py`

- `conftest.py` fixture `team` → `Team.objects.create(name='LOS TD-AH')` (sin
  `competition`).
- `tests/test_permissions.py` (bloque 315-369) — reescribir con el modelo global:
  - `test_admin_sees_only_teams_of_assigned_competition` →
    `test_authenticated_user_sees_all_teams`: un usuario autenticado ve **todos**
    los equipos (incluido el que antes era "Forbidden Team").
  - `test_admin_cannot_create_team_outside_own_competition` → **eliminar** (ya no
    tiene sentido: no existe "fuera de la competición").
  - `test_admin_can_create_team_in_own_competition` →
    `test_authenticated_user_can_create_team`: `POST /api/v1/teams/` con
    `{'name': 'My Team'}` (sin `competition`) → **201** (espejo de
    `test_admin_can_create_athlete`).
  - Verificar que no quede ningún `'competition'` en los requests de equipos ni
    referencias a `_other_competition` solo para equipos.
- `tests/test_seed.py`: revisar los asserts de conteo (deberían quedar en 4 equipos
  y 12 integrantes con el nuevo seed global) y la idempotencia.

**Verificación**: `python -m pytest tests --settings=config.settings.development`
→ **120/120**.

---

### Paso 8 — Frontend: tipos

**Archivo**: `src/types/index.ts`

- `Team`: quitar `competition`.
- `TeamWritePayload`: quitar `competition`.

**Verificación**: `npm run typecheck`.

---

### Paso 9 — Frontend: API admin

**Archivo**: `src/api/admin.ts`

- `fetchTeams()` → sin parámetro:
  `fetchCatalog<Team>("/teams/?page_size=100")` (espejo de `fetchAthletes`).
- Actualizar el resto de la sección Teams si hace referencia al parámetro (crear/
  actualizar/borrar no cambian el payload salvo el tipo).

**Verificación**: `npm run typecheck`.

---

### Paso 10 — Frontend: hooks

**Archivo**: `src/hooks/useAdminModules.ts`

- `useAdminTeams()` → sin parámetro, `queryKey: ["admin","teams"]`,
  `queryFn: fetchTeams`, `staleTime: 30_000`, sin `enabled`.
- `useCreateTeam()`, `useUpdateTeam()`, `useDeleteTeam()` → sin `competitionId`;
  invalidan `["admin","teams"]`.

**Verificación**: `npm run typecheck`.

---

### Paso 11 — Frontend: listado de equipos

**Archivo**: `src/pages/admin/TeamsPage.tsx` (espejo de `AthletesPage.tsx`)

- Quitar `CompetitionScopeSelect`, `useAdminScopeStore`, `useAdminCompetitions` y
  el map `competitionNames`.
- `teamsQuery = useAdminTeams()`; `deleteMutation = useDeleteTeam()`.
- Encabezado: párrafo "Equipos registrados en la plataforma." y botón
  "Nuevo equipo" **siempre habilitado** → `/admin/teams/new`.
- Tabla: **Equipo | Acciones** (Editar / Eliminar con `confirm`; sin columna
  Competición).
- Estados: `Spinner`, `ErrorState` ("No se pudieron cargar los equipos"),
  `EmptyState` ("Sin equipos" / "Creá el primer equipo para después inscribirlo en
  una competición.").

**Verificación**: `npm run typecheck`.

---

### Paso 12 — Frontend: formulario de equipos

**Archivo**: `src/pages/admin/TeamFormPage.tsx` (espejo de `AthleteFormPage.tsx`)

- Quitar `CompetitionScopeSelect`, `useAdminScopeStore`, el gate "Seleccioná una
  competición…" y la rama `scopeCompetitionId`.
- `useCreateTeam()` / `useUpdateTeam()` sin parámetro; payload
  `TeamWritePayload = { id?, name }` (sin `competition`) tanto en alta como en
  edición.
- El retrieve `fetchTeam` y el `reset` por nombre se mantienen.
- Se mantiene solo el campo `name` (mismo comportamiento que hoy; el `affiliation`
  del serializer queda opcional y fuera del formulario, como hasta ahora).

**Verificación**: `npm run typecheck`.

---

### Paso 13 — Frontend: Competidores

**Archivos**: `src/pages/admin/CompetitorsPage.tsx`, `src/pages/admin/CompetitorFormPage.tsx`

- `CompetitorsPage.tsx`: `useAdminTeams()` → global (el map de nombres de equipo ya
  cubre a todos). El resto (columnas, orden, delete) no cambia.
- `CompetitorFormPage.tsx`: `useAdminTeams()` → global, sin `effectiveCompetitionId`
  (los equipos ya no dependen de la competición). **Se mantiene**
  `useAdminEnabledCategories(effectiveCompetitionId)` porque las **categorías
  habilitadas sí siguen siendo por competición**. El payload `CompetitorWritePayload`
  (FK `team` + `competition` del scope/registro) no cambia.

**Verificación**: `npm run typecheck`.

---

### Paso 14 — Frontend: tests

**Archivos**: `tests/fixtures.ts`, `tests/CompetitorsPage.test.tsx`,
`tests/CompetitorFormPage.test.tsx` (y opcional `tests/adminApi.test.ts`)

- `makeTeam`: quitar `competition: 1` (queda `{ id, name, affiliation: null }`).
- `CompetitorsPage.test.tsx` / `CompetitorFormPage.test.tsx`: los mocks de
  `useAdminTeams` ya devuelven el valor configurado sin importar argumentos → **sin
  cambios de lógica**; verificar que ningún caso dependa de que las opciones de
  equipos estén filtradas.
- Opcional `adminApi.test.ts`: añadir `fetchTeams()` → `request("/teams/?page_size=100")`
  (sin `{auth:false}`), espejo de `fetchAthletes`.

**Verificación**: `npm run test` → **108/108**.

---

### Paso 15 — Verificación final y cierre

Ejecutar en orden:

1. **Backend** (`leader\Scorely`):
   - `python manage.py check`
   - `python manage.py makemigrations --check --dry-run participants` (sin cambios)
   - `python -m pytest tests --settings=config.settings.development` → **120/120**
2. **Frontend** (`Scorely-frontend`):
   - `npm run lint` → sin errores (1 warning preexistente `SidebarContext.tsx` OK)
   - `npm run typecheck` → sin errores
   - `npm run test` → **108/108**
   - `npm run build` → OK
3. **Actualizar docs**:
   - `Process.md` (frontend): nuevo paso "Parte II-G — Equipos globales"
   - `RESULTADOS.md` (frontend): iteración 2026-09-21 (Parte II-G) + checkbox
   - `PLAN.md` y `Process.md`/`RESULTADOS.md` del backend (`leader\Scorely`) según
     su convención
   - Cabecera de este `PLAN.md` → **COMPLETADO**

**Escenarios manuales** (con backend):

| Escenario | Esperado |
|-----------|----------|
| Abrir `/admin/teams` | Lista **todos** los equipos, sin selector de competición |
| "Nuevo equipo" | Formulario sin competición; guarda `{ name }` |
| Ingresar un equipo en Competidores | El select de Equipo muestra equipos **globales** |
| Alta/edición de una inscripción de equipo | `Competitor` conserva su `competition` (del scope o del registro) |
| Usuarios no admin | Pueden crear equipos (espejo de atletas); sin romper el panel |

---

## 5. Avisos al usuario

1. **Cambio destructivo**: se elimina la FK `Team.competition`. Las filas históricas
   pierden la asociación directa equipo→competición; la que existía vía
   `Competitor` (inscripción) **se conserva**.
2. **Permisos**: con el espejo de atletas, **cualquier usuario autenticado** puede
   crear/editar/borrar equipos globales (lo mismo aplica hoy a atletas). Si se
   quisiera solo admins, habría que mantener `IsCompetitionAdmin` para escrituras
   (decisión distinta a la tomada).
3. **Roster de equipos (`TeamMember`)**: `TeamMemberViewSet` (/team-members/) existe
   en backend pero no hay UI de admin para gestionar integrantes. Alas global teams
   esto queda como follow-up sugerido (fuera de este plan).
4. **Relación con la Parte II-F**: el aviso de `CompetitorViewSet` (sin guard por
   competición) **sigue vigente**; solo cambia que `TeamViewSet` ya no sirve como
   patrón de referencia (se documenta en `PROMPT.md` Paso 0).
5. **Migración**: se genera el archivo pero **no se aplica** (la aplica el usuario
   en su entorno; los tests usan `--nomigrations`).

---

## 6. Restricciones que se mantienen

- **NO** tocar `free-react-tailwind-admin-dashboard/` (solo lectura).
- **NO** crear ramas, no push, no commit sin pedido explícito.
- No añadir comentarios de código salvo que se soliciten.
- Documentar avances en `Process.md` al iniciar y finalizar cada paso.
- Mantener el estilo TailAdmin y los patrones ya establecidos (`AthletesPage`/
  `AthleteFormPage`, `useAdminModules`, `CompetitionScopeSelect` donde corresponda).
- No tomar tecnologías nuevas sin preguntar.
- Textos de UI y documentos en español.