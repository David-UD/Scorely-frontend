# PLAN — Toasts de confirmación en flujos de alta/edición/borrado (regla de `PROMPT.md`)

> **Documento de planificación y seguimiento (NO ejecutado todavía).**
> Implementa la regla añadida a `PROMPT.md` → *Reglas de convenciones*:
> **toda operación que cree, edite o elimine información debe confirmarse con un toast**
> reutilizando `src/components/common/Toast.tsx`.
>
> Fecha: 2026-10-06
> Estado: **EJECUTADO ✅** — implementado y verificado (ver `RESULTADOS.md`).
> Spec origen: `PROMPT.md` → sección *Reglas de convenciones* (bullet **Feedback de mutaciones**).
> Anterior: Parte II-N (fotos + panel) ✅ cerrada (ver `RESULTADOS.md`).

---

## 0. Objetivo

- Mostrar un **toast de éxito** cada vez que una operación **crea, edita o elimina** datos en el
  panel `/admin/*` (formularios, altas rápidas y acciones de tabla).
- Reutilizar el componente existente `Toast` **sin** duplicar su diseño.
- Mantener el manejo de **errores** como está (banner `role="alert"` / `ErrorState`); el `Toast`
  actual está estilado como **éxito**, así que **no** se usa para errores.
- No romper la UX actual (navegación, `window.confirm`, invalidación de React Query).

---

## 1. Problema clave a resolver (decisión de arquitectura)

**El patrón actual de `Toast` (estado local de la página) no alcanza para altas/ediciones**, porque
esos flujos **navegan** a la lista al terminar (`navigate("/admin/...")`). Si el toast se guarda en
el estado local del formulario, el componente se **desmonta al navegar** y el usuario **nunca lo ve**.

| Opción | Cómo | Veredicto |
|---|---|---|
| **A. Host global + store (RECOMENDADA)** | Store Zustand (`toastStore`) + `ToastHost` montado en `AdminLayout`; función imperativa `showToast(msg)` invocable desde cualquier `onSuccess` (sobrevive a la navegación). | ✅ Menos código repetido, cubre formularios y borrados, funciona tras navegar. |
| B. Flash por `navigate(..., { state: { toast } })` | Cada formulario pasa el mensaje por `location.state`; cada lista lo lee con `useLocation` y limpia. | ❌ Más boilerplate repetido en cada lista y formulario; fácil de olvidar. |
| C. Mantener estado local | Igual que `ScoresPage`/`ScoringPage`. | ❌ No sirve para flujos que navegan (la mayoría). |

**Decisión propuesta:** Opción **A**. El `Toast` (presentacional) se conserva tal cual; se agrega
un host que lo reutiliza. `ScoresPage`/`ScoringPage` (que hoy usan estado local y no navegan) pueden
**migrarse** a `showToast` para unificar (opcional, ver Paso 8).

> ⚠️ La regla de `PROMPT.md` menciona "patrón vigente: estado local". Si se aprueba la Opción A, se
> actualiza ese bullet para citar el **store + `showToast`** (Paso 11).

---

## 2. Hallazgos verificados en el código

- `src/components/common/Toast.tsx` (55 l): componente **presentacional** con props
  `{ message: string; onClose: () => void; duration?: number (4000) }`; `role="status"`, auto-cierre.
  **No** hay provider/hook/host: se instancia manualmente por página.
- Usos actuales de `Toast`: `ScoresPage.tsx` ("Resultados guardados correctamente."),
  `ScoringPage.tsx` ("Reglas guardadas correctamente.") y `CompetitionDetail.tsx` (copiar enlace,
  **público, no CRUD → fuera de alcance**).
- `src/layout/AdminLayout.tsx` (36 l): único layout de `/admin/*`; `<LayoutContent>` renderiza
  `<AdminHeader/>` + `<Outlet/>`. **Punto de montaje ideal del host global.**
- Estado global ya usa **Zustand** (`src/store/authStore.ts`, `src/store/adminScopeStore.ts`), con
  patrón `create<T>()(...)` y acciones por `set`. El store de toast debe seguir ese patrón (sin
  `persist`).
- **Mutaciones por página (verificado con grep):**

  **Listas con borrado (sin toast):** `CompetitionsPage` (`useDeleteCompetition`),
  `CategoriesPage` (`useDeleteCompetitionCategory`), `AffiliationsPage` (`useDeleteAffiliation`),
  `LocationsPage` (`useDeleteLocation`), `EventsPage` (`useDeleteEvent`),
  `AthletesPage` (`useDeleteAthlete`), `TeamsPage` (`useDeleteTeam`),
  `CompetitorsPage` (`useDeleteCompetitor`).

  **Con CRUD inline (sin toast):** `CompetitionCategoriesPage` (`useCreateEnabledCategory`,
  `useUpdateEnabledCategory`, `useDeleteEnabledCategory`).

  **Formularios (create/edit, navegan al guardar):** `CompetitionFormPage`, `CategoryFormPage`,
  `AffiliationFormPage`, `LocationFormPage`, `EventFormPage`, `AthleteFormPage`, `TeamFormPage`,
  `CompetitorFormPage`.

  **Altas rápidas anidadas (también deben avisar):**
  - `AthleteFormPage`/`TeamFormPage`: `useCreateCompetitor` al **inscribir** en competición.
  - `CompetitorFormPage`: `useCreateAthlete`/`useCreateTeam` (creación rápida desde el form,
    vía `InlineEntitySelect`, líneas ~290 y ~319).
  - `CompetitionCategoriesPage`: habilitar/editar slots/quitar.

  **Ya cumplen (no navegan):** `ScoresPage`, `ScoringPage`.

- **Formularios usan `mutateAsync` + `navigate`** (ej. `CompetitorFormPage.tsx:170-176`), así que
  `showToast(...)` debe llamarse **antes** de `navigate` (o justo después de `mutateAsync`); el host
  global lo mantiene visible.
- **Borrados** usan `mutate(id, { onSuccess/onError/onSettled })` (ej. `TeamsPage.tsx:53`): agregar
  `onSuccess: () => showToast(...)`.
- Tests de listas mockean la mutación como `({ mutate: vi.fn(), isPending: false })`, por lo que el
  `onSuccess` **no** se dispara solo: habrá que hacer que el mock invoque `options.onSuccess()`
  (ver Paso 9).

---

## 3. Clave técnica (piezas a crear)

1. **Store** `src/store/toastStore.ts` (named exports, patrón `authStore`):
   ```ts
   interface ToastItem { id: number; message: string }
   interface ToastState {
     toasts: ToastItem[];
     showToast: (message: string) => void;
     dismissToast: (id: number) => void;
   }
   export const useToastStore = create<ToastState>()((set) => ({ ... }));
   export const showToast = (message: string) => useToastStore.getState().showToast(message);
   ```
   - `id` incremental (módulo-scope o `Date.now()`+contador).
   - **Sin** `persist`. Mensaje vacío/`""` se ignora (defensivo).
2. **Host** `src/components/common/ToastHost.tsx`:
   - Lee `toasts` del store, renderiza **stack** (columna, `bottom-5 right-5`, `z-[100]`,
     `gap-2`) con un `<Toast key={id} message onClose={() => dismissToast(id)} />` por item.
   - Devuelve `null` si no hay toasts. No props.
3. **Montaje** en `AdminLayout` (`LayoutContent`, dentro del `div` raíz): `<ToastHost />`.
   - Opcional: también en `PublicLayout` (no requerido por la regla; se puede omitir).
4. **Helper imperativo** `showToast(mensaje)`: permite llamarlo desde `onSuccess`/callbacks sin hook.
   (Alternativa: `const { showToast } = useToastStore()` en el componente; el helper evita re-render
   y funciona dentro de opciones de `mutate`.)

**Nombres de mensajes por entidad (propuesta, español, sin punto final opcional):**

| Dominio | Crear | Editar | Borrar |
|---|---|---|---|
| Competición | "Competición creada." | "Competición actualizada." | "Competición eliminada." |
| Categoría (catálogo) | "Categoría creada." | "Categoría actualizada." | "Categoría eliminada." |
| Categoría habilitada | "Categoría habilitada." | "Slots actualizados." | "Categoría deshabilitada." |
| Filiación | "Filiación creada." | "Filiación actualizada." | "Filiación eliminada." |
| Sede | "Sede creada." | "Sede actualizada." | "Sede eliminada." |
| Evento/WOD | "Evento creado." | "Evento actualizado." | "Evento eliminado." |
| Atleta | "Atleta creado." | "Atleta actualizado." | "Atleta eliminado." |
| Equipo | "Equipo creado." | "Equipo actualizado." | "Equipo eliminado." |
| Competidor | "Competidor creado." | "Competidor actualizado." | "Competidor eliminado." |
| Inscripción (desde form atleta/equipo) | "Inscrito en la competición." | — | — |

---

## 4. Pasos de ejecución

### Fase A — Infraestructura (base reutilizable)
- **Paso 0.** Documentar inicio en `Process.md` (nuevo paso: "Toasts de confirmación en CRUD").
- **Paso 1.** Crear `src/store/toastStore.ts` (`useToastStore`, `showToast`, `ToastItem`).
- **Paso 2.** Crear `src/components/common/ToastHost.tsx` (stack + reutiliza `Toast`).
- **Paso 3.** Montar `<ToastHost />` en `src/layout/AdminLayout.tsx`.

### Fase B — Listas: toast en borrados
- **Paso 4.** En cada lista, agregar `onSuccess: () => showToast("...")` al `mutate` de borrado:
  `CompetitionsPage`, `CategoriesPage`, `AffiliationsPage`, `LocationsPage`, `EventsPage`,
  `AthletesPage`, `TeamsPage`, `CompetitorsPage`.
  - Conservar `onError`/`onSettled` actuales (`setDeletingId`). No usar toast para el error.

### Fase C — `CompetitionCategoriesPage` (CRUD inline)
- **Paso 5.** Añadir `showToast` en:
  - habilitar categoría (`createMutation`),
  - editar `finalist_slots` (`updateMutation`),
  - quitar habilitación (`deleteMutation`).

### Fase D — Formularios (crear/editar)
- **Paso 6.** En cada form, llamar `showToast(<msg>)` tras `mutateAsync` exitoso y **antes** de
  `navigate`: `CompetitionFormPage`, `CategoryFormPage`, `AffiliationFormPage`, `LocationFormPage`,
  `EventFormPage`, `AthleteFormPage`, `TeamFormPage`, `CompetitorFormPage`.
  - Mensaje según **crear vs editar** (`isEditing`).
  - Mantener los `catch` actuales (banner de error), sin toast de error.
- **Paso 7.** Altas rápidas anidadas:
  - `AthleteFormPage`/`TeamFormPage`: toast al inscribir con `createCompetitorMutation`
    (independiente del toast de crear/editar el atleta/equipo).
  - `CompetitorFormPage`: toast en `createAthleteMutation` y `createTeamMutation`
    (creación rápida desde `InlineEntitySelect`).

### Fase C/D-bis — Migración opcional de toasts existentes
- **Paso 8. (opcional)** Migrar `ScoresPage`/`ScoringPage` de estado local a `showToast` para
  unificar; eliminar el `useState` local de toast y el `<Toast>` manual. Conservar el texto actual.
  *(Bajo riesgo; se puede omitir sin afectar la regla.)*
- `CompetitionDetail` (público, copiar enlace): **no** se toca (no es CRUD).

### Fase E — Tests
- **Paso 9.**
  - Nuevo `tests/toastStore.test.ts`: `showToast` agrega item, ignora vacío, `dismissToast` quita.
  - Nuevo `tests/ToastHost.test.tsx`: renderiza los mensajes del store, `onClose` los quita,
    `null` cuando no hay.
  - Actualizar tests de páginas para afirmar el toast tras la mutación:
    - **Listas:** cambiar el mock `useDeleteX: () => ({ mutate: vi.fn((id, opts) => opts?.onSuccess?.()), ... })`
      o espiar para invocar `onSuccess`; luego `expect(useToastStore.getState().toasts)` contiene el mensaje.
    - **Formularios con test existente** (`AthleteFormPage`, `TeamFormPage`, `CompetitorFormPage`):
      el mock de `mutateAsync` resuelve y se afirma el toast (store) antes de/navegar.
    - Añadir cobertura mínima a formularios sin test (`CategoryFormPage`, `CompetitionFormPage`,
      `LocationFormPage`, `AffiliationFormPage`, `EventFormPage`) o, como mínimo, a `ToastHost`+store.
  - `beforeEach`: reset `useToastStore.setState({ toasts: [] })` para aislar.
  - Alternativa a montar el host en cada test: importar y renderizar `<ToastHost />` junto a la página;
    se evalúa en ejecución (la vía **store** evita acoplar los tests al layout).
- **Paso 10.** Verificación final: `npm run typecheck`, `npm run lint`, `npm run test`,
  `npm run build` (los 4 en verde; sin errores nuevos de ESLint).

### Fase F — Documentación
- **Paso 11.**
  - `Process.md`: registrar el paso y su cierre.
  - `RESULTADOS.md`: resumen de la iteración + tests antes/después.
  - `PROMPT.md`: ajustar el bullet *Feedback de mutaciones* para citar el patrón definitivo
    (`toastStore` + `showToast` + `ToastHost` en `AdminLayout`) en lugar de "estado local".
  - Actualizar este `PLAN.md`: marcar seguimiento y verificación.

---

## 5. Archivos afectados (resumen)

**Nuevos**
- `src/store/toastStore.ts`
- `src/components/common/ToastHost.tsx`
- `tests/toastStore.test.ts`
- `tests/ToastHost.test.tsx`

**Modificados (infra)**
- `src/layout/AdminLayout.tsx` (montar `<ToastHost />`)

**Modificados (listas / borrado)**
- `CompetitionsPage.tsx`, `CategoriesPage.tsx`, `AffiliationsPage.tsx`, `LocationsPage.tsx`,
  `EventsPage.tsx`, `AthletesPage.tsx`, `TeamsPage.tsx`, `CompetitorsPage.tsx`,
  `CompetitionCategoriesPage.tsx`

**Modificados (formularios / alta-edición + altas rápidas)**
- `CompetitionFormPage.tsx`, `CategoryFormPage.tsx`, `AffiliationFormPage.tsx`,
  `LocationFormPage.tsx`, `EventFormPage.tsx`, `AthleteFormPage.tsx`, `TeamFormPage.tsx`,
  `CompetitorFormPage.tsx`

**Modificados (opcional)**
- `ScoresPage.tsx`, `ScoringPage.tsx` (migración a `showToast`)

**Tests modificados**
- `AthletesPage.test.tsx`, `TeamsPage.test.tsx`, `CompetitorsPage.test.tsx`,
  `CompetitionsPage.test.tsx`, `CategoriesPage.test.tsx`, `AffiliationsPage.test.tsx`,
  `LocationsPage.test.tsx`, `CompetitionCategoriesPage.test.tsx`,
  `AthleteFormPage.test.tsx`, `TeamFormPage.test.tsx`, `CompetitorFormPage.test.tsx`
  (+ nuevos de formularios sin test, si se decide).

**Documentación**
- `PROMPT.md`, `Process.md`, `RESULTADOS.md`, `PLAN.md`

---

## 6. Verificación (criterios de aceptación)

| # | Escenario | Resultado esperado |
|---|---|---|
| 1 | Crear cualquiera de las entidades desde un formulario | Al volver a la lista se ve el **toast** "… creado/actualizado." |
| 2 | Editar cualquiera de las entidades | Al volver a la lista se ve el **toast** "… actualizado." |
| 3 | Eliminar desde una lista (tras `window.confirm`) | Se ve el **toast** "… eliminado." |
| 4 | Habilitar/editar slots/quitar categoría de competición | Toast correspondiente |
| 5 | Inscribir desde `AthleteFormPage`/`TeamFormPage` | Toast "Inscrito en la competición." |
| 6 | Creación rápida de atleta/equipo en `CompetitorFormPage` | Toast "Atleta/Equipo creado." |
| 7 | Error de mutación | **No** aparece toast de éxito; sigue el banner `role="alert"`/`ErrorState` |
| 8 | El toast navega junto con el usuario (form → lista) | Sigue visible tras `navigate` y auto-cierra a los 4 s |
| 9 | `typecheck` / `lint` / `test` / `build` | Todo en verde (lint sin errores nuevos) |

---

## 7. Riesgos / observaciones

- **No usar `Toast` para errores:** su estilo es de éxito (`success-*`). Errores → banner/`ErrorState`.
- **Doble toast al inscribir** desde `AthleteFormPage`/`TeamFormPage`: si se crea entidad **e**
  inscripción a la vez, podrían mostrarse 2 toasts. Decidir: priorizar el de inscripción o un único
  mensaje compuesto (p. ej. "Atleta creado e inscrito."). Definir en ejecución.
- **Stacking:** `Varios toasts` se apilan en columna; hay que garantizar el contenedor con `z-[100]`
  y que no tape acciones (mismo sitio que el actual `bottom-5 right-5`).
- **Tests de listas:** los mocks actuales de mutación no disparan `onSuccess`; hay que ajustarlos
  (riesgo de tests que "pasan" sin verificar realmente el toast → afirmar contra el store).
- **Migración de `ScoresPage`/`ScoringPage`** puede alterar sus tests (líneas ~274 y ~224): hacerlo
  solo en el paso opcional.
- **`CompetitionDetail` (público)** queda fuera (no es alta/edición/borrado).
- No tocar la carpeta clon de TailAdmin, no crear ramas ni git, no tocar backend.

---

## 8. Definición de "hecho"

- Store + host implementados y montados en `AdminLayout`.
- **Todas** las altas, ediciones y borrados del panel `/admin/*` muestran toast de éxito
  (incluidas altas rápidas e inscripciones).
- Errores sin cambios (banner/`ErrorState`).
- Tests nuevos + actualizados en verde; `typecheck`/`lint`/`build` OK.
- `PROMPT.md`, `Process.md`, `RESULTADOS.md` y este `PLAN.md` actualizados.

---

## 9. Resultado de la ejecución (2026-10-06)

- **Fases A–E completadas.** `showToast`/`ToastHost` montados en `AdminLayout`; toasts en las 8 listas
  con borrado, `CompetitionCategoriesPage` (habilitar/slots/quitar) y los 8 formularios
  (crear/editar + altas rápidas e inscripciones).
- **Paso 8 (migración de `ScoresPage`/`ScoringPage`) omitido** — siguen con su `Toast` local; no afecta
  la regla (ya cumplen, no navegan) y evita romper sus tests.
- **Doble toast al inscribir:** resuelto con mensaje compuesto ("Atleta/Equipo creado e inscrito en la
  competición.") en vez de dos toasts.
- **Verificación:** `npm run typecheck` OK · `npm run lint` OK (0 errores; 1 warning preexistente en
  `SidebarContext.tsx`) · `npm run test` **242/242 en 28 archivos** · `npm run build` OK.
- Ver `RESULTADOS.md` → sección "Toasts de confirmación en CRUD" para el detalle.