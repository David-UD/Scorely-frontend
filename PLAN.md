# PLAN — Inscripción opcional integrada en el alta de atleta y equipo

> **Documento de planificación y seguimiento.** Desde `/admin/athletes/new` y
> `/admin/teams/new` se puede crear el registro y, de forma **opcional**,
> inscribirlo en una competición (Individual/Equipo + categoría) en la misma
> acción. El flujo inline actual de `CompetitorFormPage` queda intacto.
>
> Fecha: 2026-09-23
> Estado: **COMPLETADO** (ver §4 seguimiento)

---

## 0. Objetivo

Permitir el **alta de atleta/equipo + inscripción opcional** en un solo paso:
en `/admin/athletes/new` y `/admin/teams/new` (solo modo creación) aparece una
**sección colapsable "Inscribir en competición"**. Si se usa, al guardar se crea
primero el registro (`POST /athletes/` o `POST /teams/`) y luego la inscripción
(`POST /competitors/` con `competitor_type` `INDIVIDUAL`/`TEAM`). Sin cambios de
backend.

## 1. Decisiones ya tomadas (usuario)

| Pregunta | Decisión |
|---|---|
| ¿Cómo unificar alta + inscripción? | **Sumar bloque inline en atleta y equipo**: se mantiene el inline de `CompetitorFormPage` y se agrega la sección colapsable opcional en los formularios de alta |
| ¿Nº de inscripción? | **Campo manual opcional** (el backend acepta vacío: `blank=True`) |
| ¿En edición? | **No** — el bloque solo aparece en creación (`/admin/athletes/new`, `/admin/teams/new`) |

## 2. Clave técnica (verificada en el código)

- `createAthlete(payload): Promise<Athlete>` devuelve el atleta creado con su
  `id`; `useCreateAthlete()` invalida `["admin","athletes"]`
  (`src/api/admin.ts:269`, `src/hooks/useAdminModules.ts`).
- `useCreateCompetitor(competitionId | null)` → `createCompetitor(payload)`,
  invalida `["admin","competitors", competitionId]`
  (`src/hooks/useAdminModules.ts:357`).
- `CompetitorWritePayload` (`src/types/index.ts:189`):
  `{ competitor_type, athlete: number | null, team: number | null,
    registration_number, competition, enabled_competition_category }`.
- Categorías de la competición electa: `useAdminEnabledCategories(competitionId)`
  (`useAdminModules.ts:300`) + nombres del catálogo `useAdminCompetitionCategories()`
  (`:253`). Competiciones: `useAdminCompetitions()` (`useAdminCompetitions.ts:14`).
- **2 llamadas no transaccionales**: si la inscripción falla tras crear el atleta,
  se informa con error claro y se **conserva el `id` del atleta** en un ref para
  que un reintento solo repita la inscripción (evita duplicar el atleta).

## 3. Cambios por archivo

### 3.1 Modificar `src/pages/admin/AthleteFormPage.tsx`

- Imports: `useRef`, `useAdminCompetitions`, `useAdminEnabledCategories`,
  `useAdminCompetitionCategories`, `useCreateCompetitor`, tipo `CompetitorWritePayload`.
- Estado local del bloque (solo creación):
  `inscribeOpen`, `competitionId`, `categoryId`, `registrationNumber`,
  `blockError`, `createdAthleteRef: useRef<Athlete | null>(null)`.
- Bloque colapsable dentro del `<form>`, tras el grid de Fecha de nacimiento/Sexo:
  - Toggle "Inscribir en competición (opcional)".
  - Abierto → selects **Competición** (catálogo global asignado al admin, por
    nombre) y **Categoría** (habilitadas de la competición electa, etiquetadas por
    catálogo; deshabilitado sin competición) + input **Nº de inscripción (opcional)**.
  - Cambiar competición resetea la categoría.
- `onSubmit`:
  1. Validación previa: si hay competición sin categoría → `blockError`
     "Seleccioná una categoría para inscribir" y **no** se crea nada.
  2. Crear/actualizar atleta. Si el atleta ya se creó en un intento fallido
     (`createdAthleteRef`), **no** se vuelve a crear.
  3. Si hay competición + categoría → `useCreateCompetitor(...).mutateAsync`
     con `INDIVIDUAL`, `athlete: atleta.id`, `team: null`,
     `registration_number` (trim), `competition`, `enabled_competition_category`.
  4. Éxito → `navigate("/admin/athletes")`. Si la inscripción falla →
     `setError("El atleta se guardó, pero la inscripción falló. …")`, sin navegar,
     conservando los valores del bloque.

### 3.2 Modificar `src/pages/admin/TeamFormPage.tsx`

- Espejo de §3.1 con `Team`/`createdTeamRef`, `useCreateTeam` y payload de
  competidor `TEAM` (`athlete: null`, `team: equipo.id`). Texto de fallo:
  "El equipo se guardó, pero la inscripción falló. …". Éxito →
  `navigate("/admin/teams")`.

### 3.3 Crear tests

- `tests/AthleteFormPage.test.tsx` (nuevo): mocks de `@/api/admin`
  (`fetchAthlete`), `@/hooks/useAdminModules` (`useCreateAthlete`,
  `useUpdateAthlete`, `useAdminEnabledCategories`,
  `useAdminCompetitionCategories`, `useCreateCompetitor`),
  `@/hooks/useAdminCompetitions` (`useAdminCompetitions`).
- Casos atleta:
  (a) alta simple sin el bloque → solo crea atleta, **no** llama al competidor;
  (b) alta con inscripción → atleta y luego competidor con payload correcto
      (athlete = id del atleta creado, team null, nº trim, competition, categoría);
  (c) competición sin categoría → error en el bloque y **ninguna** mutación;
  (d) fallo de inscripción → atleta creado + mensaje "El atleta se guardó, pero la
      inscripción falló…", en un reintento **no** se vuelve a crear el atleta;
  (e) bloque **ausente** en `/admin/athletes/:id/edit`.
- `tests/TeamFormPage.test.tsx` (nuevo): espejo de atleta con `makeTeam`,
  `fetchTeam` y payload `TEAM` (`athlete: null`, `team = id` del equipo creado).

## 4. Seguimiento

| Paso | Estado |
|---|---|
| 0. Escribir este PLAN.md | ✅ |
| 1. Bloque inline en `AthleteFormPage.tsx` | ✅ |
| 2. Bloque inline en `TeamFormPage.tsx` | ✅ |
| 3. Tests en `AthleteFormPage.test.tsx` / `TeamFormPage.test.tsx` | ✅ |
| 4. Verificación (typecheck, lint, test, build) | ✅ |
| 5. Documentación en `Process.md` / `RESULTADOS.md` | ✅ |

## 5. Verificación de cierre

1. `npm run typecheck` → sin errores. ✅
2. `npm run lint` → 0 errores (1 warning preexistente `SidebarContext.tsx`). ✅
3. `npm run test` → suite completa en verde (**158/158**, 22 archivos). ✅
4. `npm run build` → OK. ✅

## 6. Fuera de alcance

- Backend `leader\Scorely`: sin cambios.
- `CompetitorFormPage` / `InlineEntitySelect`: sin cambios (se mantiene el flujo inline).
- Rollback automático si falla la inscripción: no (2 llamadas no transaccionales);
  se informa al usuario y se evita duplicar el registro en reintentos.

## 7. Restricciones que se mantienen

- **NO** tocar el clon `free-react-tailwind-admin-dashboard/` (solo lectura).
- **NO** crear ramas, **NO** push, **NO** commit sin pedido explícito.
- Sin cambios de backend; sin comentarios en código salvo que se soliciten.
- Textos en español; tema claro; sin i18n.