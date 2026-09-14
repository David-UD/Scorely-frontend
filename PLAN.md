# PLAN — Corrección de bugs y actualización del PROMPT.md

> **No ejecuta cambios**: describe, paso a paso, cómo implementar las correcciones
> solicitadas por el usuario sobre el proyecto ya existente `Scorely-frontend/`.
>
> Fecha: 2026-09-14
> Estado: **BORRADOR / pendiente de ejecución**

---

## 0. Resumen de los problemas a resolver

| # | Problema | Archivos afectados |
|---|----------|--------------------|
| A | El índice `/` solo muestra competiciones **asignadas al usuario** después de login. Debería mostrar **todas las competiciones publicadas** sin importar el estado de autenticación. | `src/api/public.ts` (5 funciones) |
| B | `/admin/events` muestra **"Sin eventos"** (estado vacío) aun teniendo una competición asignada. Las queries nunca se ejecutan porque `competitionId` es `null` en el store. | `src/components/admin/CompetitionScopeSelect.tsx` |
| C | `/admin/teams` muestra **"Sin equipos"** (mismo motivo que B). | `src/components/admin/CompetitionScopeSelect.tsx` |
| D | `PROMPT.md` no documenta los endpoints de **creación** de eventos y equipos. | `PROMPT.md` |

---

## 1. Análisis de causa raíz

### Problema A — Índice filtra por usuario autenticado

**Causa**: Todas las funciones de `src/api/public.ts` (`getCompetitions`, `getCompetition`, `getCompetitionStages`, `getEvents`, `getLeaderboard`) llaman a `request()` con la opción `auth` en su valor por defecto (`true`, ver `src/api/client.ts:70`). Esto significa que, si el usuario tiene un JWT en `authStore`, el token se adjunta a la petición. El backend, con el permiso `IsAuthenticatedOrReadOnly`, aplica un `get_queryset()` que filtra competiciones por usuario autenticado → solo devuelve las asignadas al usuario. Para requests anónimos (sin token), el backend devuelve todas las competiciones publicadas.

**Solución**: Las páginas públicas (`/` y `/competitions/:slug/`) deben llamar a los endpoints de lectura **sin** adjuntar el token. Se modifica cada función de `public.ts` para pasar `auth: false` explícitamente a `request()`.

### Problemas B y C — Admin scope nunca se auto-selecciona

**Causa**: El `adminScopeStore` (`src/store/adminScopeStore.ts`) inicializa `competitionId: null`. El componente `CompetitionScopeSelect` (`src/components/admin/CompetitionScopeSelect.tsx`) calcula un `effectiveId` (línea 16-22) que cae en la primera competición de la lista si no hay selección válida, pero **nunca lo escribe en el store**. Solo lo usa como `value` del `<select>`. Resultado:

1. `competitionId` permanece `null` en Zustand
2. `useAdminEvents(null)` → `enabled: Boolean(null)` → `false` → query no se ejecuta
3. `useAdminTeams(null)` → `enabled: Boolean(null)` → `false` → query no se ejecuta
4. La UI muestra "Sin eventos" / "Sin equipos" (EmptyState)

**Solución**: Añadir un `useEffect` en `CompetitionScopeSelect` que, al montarse con `competitionId === null` y competiciones disponibles, escriba el `effectiveId` en el store automáticamente. Esto activa las queries de eventos y equipos de inmediato.

### Problema D — PROMPT.md incompleto sobre endpoints de creación

**Causa**: La sección 7 del `PROMPT.md` solo documenta endpoints de lectura. Faltan los endpoints de escritura (POST) para eventos y equipos, necesarios para el CRUD del panel admin.

**Solución**: Añadir a la sección 7 del `PROMPT.md` los endpoints de creación, actualización y eliminación de eventos y equipos, con sus payloads documentados.

---

## 2. Archivos a modificar (resumen)

| Archivo | Cambio | Severidad |
|---------|--------|-----------|
| `src/api/public.ts` | Añadir `auth: false` a las 5 funciones de lectura pública | Alta |
| `src/components/admin/CompetitionScopeSelect.tsx` | Auto-seleccionar primera competición en `competitionId` nulo | Alta |
| `PROMPT.md` | Documentar endpoints de creación para eventos y equipos | Media |

---

## 3. Plan paso a paso

### Paso 1 — Corregir endpoints públicos para no enviar token

**Archivo**: `src/api/public.ts`

**Qué hacer**: En cada función que realiza una petición de lectura pública, pasar `{ auth: false }` como segundo argumento de `request()`. Esto garantiza que el JWT **nunca** se adjunte en páginas públicas, independientemente de si el usuario tiene sesión activa.

Funciones a modificar:

1. `getCompetitions` (línea 39): `request(..., { auth: false })`
2. `getCompetition` (línea 46): `request(..., { auth: false })`
3. `getCompetitionStages` (línea 52): `request(..., { auth: false })`
4. `getEvents` (línea 93): `request(..., { auth: false })`
5. `getLeaderboard` (línea 151): `request(..., { auth: false })`

**Código antes** (ejemplo de `getCompetitions`):
```typescript
const data = await request<Competition[] | Page<Competition>>(
  `/competitions/${query}`,
);
```

**Código después**:
```typescript
const data = await request<Competition[] | Page<Competition>>(
  `/competitions/${query}`,
  { auth: false },
);
```

**Verificación**:
- El índice `/` debe mostrar todas las competiciones publicadas tanto con sesión como sin ella.
- El detalle `/competitions/:slug/` debe cargar la información sin token.
- Los leaderboards (ya `AllowAny` en backend) siguen funcionando igual.

**Riesgo**: Si el backend **no** devuelve competiciones a usuarios anónimos (permiso distinto al documentado), el índice mostrará vacío. En ese caso, el usuario debe ajustar los permisos del backend (no mockear en frontend).

---

### Paso 2 — Auto-seleccionar competición en admin scope

**Archivo**: `src/components/admin/CompetitionScopeSelect.tsx`

**Qué hacer**: Añadir un `useEffect` que, cuando `competitionId` en el store sea `null` (o no exista en la lista de competiciones) y haya competiciones disponibles, escriba el `effectiveId` (primera competición) en el store.

**Código a añadir** (después del `useMemo` existente):
```typescript
useEffect(() => {
  if (effectiveId && effectiveId !== competitionId) {
    setCompetitionId(effectiveId);
  }
}, [effectiveId, competitionId, setCompetitionId]);
```

**Importación necesaria**: Añadir `useEffect` al import de `react` (línea 1).

**Por qué funciona**:
1. Al montar, `competitionsQuery` carga la lista de competiciones.
2. `effectiveId` se calcula con la primera competición.
3. El `useEffect` detecta que `competitionId === null` y escribe el `effectiveId` en el store.
4. Las queries `useAdminEvents(competitionId)` y `useAdminTeams(competitionId)` ahora tienen `enabled: true`.
5. Los datos se cargan y la UI muestra eventos/equipos en lugar de EmptyState.

**Verificación**:
- Al entrar a `/admin/events` sin selección previa, se auto-selecciona la primera competición y se muestran sus eventos.
- Al entrar a `/admin/teams` sin selección previa, se auto-selecciona la primera competición y se muestran sus equipos.
- Cambiar de competición en el selector actualiza los datos correctamente.
- Si el usuario ya tenía una competición seleccionada (persistida en localStorage), se mantiene esa selección.

**Nota**: El `useEffect` no sobreescribe una selección válida del usuario. Solo actúa cuando `effectiveId !== competitionId` (incluye el caso de `null`).

---

### Paso 3 — Actualizar PROMPT.md con endpoints de creación

**Archivo**: `PROMPT.md`

**Qué hacer**: Añadir a la **sección 7** (Endpoints del API utilizados) los endpoints de escritura para eventos y equipos, con sus métodos, URLs y payloads.

**Endpoints a documentar**:

#### Eventos

| Acción | Método | URL | Auth | Payload |
|--------|--------|-----|------|---------|
| Crear evento | POST | `/api/v1/events/` | JWT | `{ competition_stage: number, event_number: number, name: string, workout: string, description?: string, is_ascending: boolean, is_active: boolean }` |
| Actualizar evento | PATCH | `/api/v1/events/{id}/` | JWT | Mismo payload (campos parciales) |
| Eliminar evento | DELETE | `/api/v1/events/{id}/` | JWT | — |
| Obtener evento | GET | `/api/v1/events/{id}/` | JWT | — |

**Nota sobre `competition_stage`**: El evento se asocia a una **etapa** (stage), no directamente a una competición. Para crear un evento, primero se debe obtener la etapa de la competición (`GET /api/v1/competition-stages/?competition={id}`) y luego usar su `id` como `competition_stage` en el payload.

#### Equipos

| Acción | Método | URL | Auth | Payload |
|--------|--------|-----|------|---------|
| Crear equipo | POST | `/api/v1/teams/` | JWT | `{ name: string, competition: number }` |
| Actualizar equipo | PATCH | `/api/v1/teams/{id}/` | JWT | `{ name?: string }` |
| Eliminar equipo | DELETE | `/api/v1/teams/{id}/` | JWT | — |
| Obtener equipo | GET | `/api/v1/teams/{id}/` | JWT | — |

**Nota sobre `competition`**: El equipo se asocia directamente a una **competición** por su `id`.

#### Catálogos

| Acción | Método | URL | Auth |
|--------|--------|-----|------|
| Tipos de competición | GET | `/api/v1/competition-types/` | JWT |
| Estados de competición | GET | `/api/v1/status-competitions/` | JWT |
| Filiações | GET | `/api/v1/affiliations/` | JWT |
| Sedes/Locations | GET | `/api/v1/locations/` | JWT |

**Formato de la tabla en el PROMPT.md**: mantener el mismo formato de tabla existente (columnas: Acción, Método, URL, Auth, Notas).

---

### Paso 4 — Actualizar Process.md con los cambios

**Archivo**: `Process.md`

**Qué hacer**: Añadir un nuevo paso (Paso 16) documentando:
- Los 3 problemas detectados (índice filtrado por auth, admin scope sin auto-selección, PROMPT.md incompleto)
- Las soluciones aplicadas
- Los archivos modificados
- Los resultados de verificación (lint, typecheck, tests, build)

---

### Paso 5 — Verificación final

Ejecutar en orden:
1. `npm run lint` → sin errores
2. `npm run typecheck` → sin errores
3. `npm run test` → todos los tests en verde
4. `npm run build` → OK (dist generado)

**Escenarios manuales a verificar** (si el backend está disponible):

| Escenario | Esperado |
|-----------|----------|
| `/` sin sesión | Muestra todas las competiciones publicadas |
| `/` con sesión | Muestra las **mismas** competiciones (no filtradas por usuario) |
| `/competitions/:slug/` sin sesión | Detalle completo (info, WODs, leaderboard) |
| `/admin/events` sin selección previa | Auto-selecciona primera competición y muestra sus eventos |
| `/admin/teams` sin selección previa | Auto-selecciona primera competición y muestra sus equipos |
| `/admin/events` cambiando selector | Actualiza la lista de eventos de la competición elegida |
| `/admin/teams` cambiando selector | Actualiza la lista de equipos de la competición elegida |
| `/admin/*` sin sesión | Redirige a `/login` |

---

## 4. Análisis de endpoints para creación de eventos y equipos

### Creación de eventos

**Endpoint**: `POST /api/v1/events/`

**Payload requerido**:
```json
{
  "competition_stage": 1,       // ID de la etapa (obligatorio)
  "event_number": 1,            // Número del evento dentro de la etapa (obligatorio, >= 1)
  "name": "Fran",               // Nombre del WOD (obligatorio)
  "workout": "21-15-9...",      // Descripción del workout (obligatorio)
  "description": "Opcional...",  // Descripción adicional (opcional)
  "is_ascending": false,         // Si las repeticiones suben (obligatorio)
  "is_active": true              // Si el evento está activo (obligatorio)
}
```

**Campos del formulario** (`EventFormPage.tsx`):
- `competition_stage`: select de etapas (cargadas de `GET /competition-stages/?competition={id}`)
- `event_number`: input numérico (mínimo 1)
- `name`: input texto
- `workout`: textarea
- `description`: textarea (opcional)
- `is_ascending`: checkbox
- `is_active`: checkbox

**Flujo de creación**:
1. Usuario selecciona competición en `CompetitionScopeSelect`
2. Se cargan las etapas de esa competición (`fetchStages(competitionId)`)
3. Usuario completa el formulario y selecciona una etapa
4. Se envía `POST /events/` con el payload
5. Se invalida la query `["admin", "events", competitionId]` para refrescar la lista

### Creación de equipos

**Endpoint**: `POST /api/v1/teams/`

**Payload requerido**:
```json
{
  "name": "Team Alpha",    // Nombre del equipo (obligatorio)
  "competition": 1          // ID de la competición (obligatorio)
}
```

**Campos del formulario** (`TeamFormPage.tsx`):
- `name`: input texto (obligatorio)
- `competition`: se toma automáticamente de `adminScopeStore.competitionId`

**Flujo de creación**:
1. Usuario selecciona competición en `CompetitionScopeSelect`
2. Usuario completa el nombre del equipo
3. Se envía `POST /teams/` con `{ name, competition: scopeCompetitionId }`
4. Se invalida la query `["admin", "teams", competitionId]` para refrescar la lista

---

## 5. Orden de ejecución recomendado

1. **Paso 1** (`src/api/public.ts`) — Corrige el problema más visible (índice filtrado)
2. **Paso 2** (`CompetitionScopeSelect.tsx`) — Corrige los admin vacíos
3. **Paso 3** (`PROMPT.md`) — Documenta endpoints de creación
4. **Paso 4** (`Process.md`) — Registra avances
5. **Paso 5** — Verificación final

Los pasos 1 y 2 son independientes (se pueden hacer en paralelo). El paso 3 es documentación pura. El paso 4 depende de los anteriores. El paso 5 es el cierre.

---

## 6. Restricciones que se mantienen

- NO tocar el backend (ni endpoints, permisos ni migraciones).
- NO tocar `free-react-tailwind-admin-dashboard/`.
- NO crear ramas ni hacer push/commit.
- NO mockear datos en producción.
- Documentar avances en `Process.md`.
