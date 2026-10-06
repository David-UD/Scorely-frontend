# PLAN — Fotos de perfil de atleta y equipo (administración + panel público) (Parte II-N)

> **Documento de planificación y seguimiento.** Implementación de la spec
> **Parte II-N** de `PROMPT.md`: **subida de `profile_photo`** en la creación/edición de
> atletas y equipos (`/admin/athletes`, `/admin/teams`) y su **visualización pública**
> en el panel que se abre al **hacer click en el nombre** del leaderboard público
> (`AthletePanel`).
>
> Fecha: 2026-10-06
> Estado: **EJECUTADO ✅** — implementado y verificado (typecheck/lint/test/build OK; 200 → 217 tests). Documentado en `RESULTADOS.md`.
> Spec origen: `PROMPT.md` → `# Parte II-N — Fotos de perfil de atleta y equipo (alta/edición + panel público)`
> Anterior: Parte II-M (Rediseño CompetitionDetail) ✅ cerrada (ver PLAN.md / RESULTADOS.md).

---

## 0. Objetivo

- **Admin**: poder subir, reemplazar y quitar una foto de perfil al crear/editar atletas y
  equipos (subida `multipart/form-data`), con preview y validación, y verla como avatar en
  las tablas `AthletesPage`/`TeamsPage`.
- **Público**: al hacer click en el nombre del atleta/equipo en `CombinedLeaderboardTable`,
  `AthletePanel` muestra la **foto real + box** (con fallback a iniciales) **también sin
  sesión**; hoy `useAthleteProfile` solo consulta con login y **solo atletas** (los equipos
  quedan sin perfil/foto).
- **Todo en frontend**: la subida y el panel usan los endpoints existentes. Los cambios de
  backend que requiere la visualización pública quedan como **AVISO** (sección 8) para que
  el usuario los aplique manualmente.

---

## 1. Decisiones y hallazgos (verificados en el código)

| Tema | Hallazgo / decisión |
|---|---|
| **Subida = multipart** | DRF ya incluye `MultiPartParser` por defecto. El cliente `request()` (`src/api/client.ts:78`) **siempre** setea `Content-Type: application/json` → hay que **no forzarlo cuando `body` es `FormData`** (si no, el boundary se rompe y el backend responde 4xx). |
| **Atleta: foto ya expuesta** | `AthleteSerializer.fields = (id, first_name, last_name, birth_date, gender, profile_photo, affiliation)` → `profile_photo` **ya llega y ya se puede escribir** por multipart. |
| **Equipo: foto en el modelo pero NO en el serializer** | `Team.profile_photo` existe en el modelo (migración `participants.0004_team_profile_photo` ya aplicada), pero `TeamSerializer.fields = (id, name, affiliation)`. **AVISO backend**: añadir `profile_photo` al serializer, si no el frontend no puede ni subirla ni leerla. |
| **Lectura pública** | `AthleteViewSet`/`TeamViewSet` = `IsAuthenticated` → `/athletes/{id}/` y `/teams/{id}/` **no** son públicos; `/competitors/{id}/` sí (GET, `IsAuthenticatedOrReadOnly`). **AVISO backend**: abrir lectura. Mientras tanto, `AthletePanel` degrada a **iniciales + `—`** (comportamiento actual sin sesión). |
| **Media no servida** | `MEDIA_URL='/media/'`, `MEDIA_ROOT=BASE_DIR/'media'`, pero `config/urls.py` **no** monta `static(settings.MEDIA_URL, document_root=...)` → cualquier `/media/...` responde **404**. **AVISO backend**: sin esto la foto subida jamás carga. |
| **URL relativa** | El serializer devuelve la ruta relativa (`/media/Athletes/...`); la SPA corre en otro origen → resolver contra el origen de `API_BASE_URL` (`resolveMediaUrl`, hoy función privada en `useAthleteProfile.ts:14`). Se mueve a `src/utils/media.ts` y se comparte (admin + público). |
| **Payloads actuales** | `AthleteWritePayload`/`TeamWritePayload` (types) no llevan `profile_photo`; `createAthlete`/`updateAthlete`/`createTeam`/`updateTeam` (`src/api/admin.ts:273-313`) envían **JSON** → migran a **FormData**. |
| **Público ya existente** | `AthletePanel.tsx` + `CombinedLeaderboardTable` (`onSelectAthlete`) + `CompetitionDetail` ya abren el panel al hacer click en el nombre; `athleteIdByCompetitor` mapea solo `competitor.athlete` (**equipos ignorados**) y `useAthleteProfile` está `enabled: isAuthenticated && athleteId != null`. |
| **Diseño del campo foto** | No meter `File` en react-hook-form/zod: estado local `photoFile: File | null` + `removePhoto: boolean`, validación manual en `onChange` (tipo png/jpeg/webp, ≤ 5 MB) con banner/campo de error. Preview con `URL.createObjectURL` (revocar en cleanup). |
| **Semántica multipart** | Editar sin tocar foto → **no** enviar la clave `profile_photo`. "Quitar foto" → enviar `profile_photo: ""` (DRF `ImageField` → `None`). Sobrescribir/alta → enviar el `File`. |
| **Tests actuales** | Uno por página involucrada ya existe (ver §2). Suite base **200/200** (24 archivos). Las fixtures `makeAthlete`/`makeTeam` se extienden con `profile_photo`. |

---

## 2. Clave técnica (estado actual verificado)

- **Cliente**: `src/api/client.ts` — `request<T>(path, options)` (línea 66). `RequestOptions` extiende `RequestInit` (body tipado por TS). `doFetch` arma `Headers` y setea `Content-Type` (línea 74). Cambios: construir `Headers` solo con lo que no sea `FormData`; `Content-Type` solo si `body` no es `FormData`.
- **API admin**: `src/api/admin.ts`
  - `fetchCatalog<T>(path)` (helper de listas, JWT).
  - `fetchAthlete(id)` (`req JWT`), `fetchTeam(id)` (JWT) — usados en admin y en `useAthleteProfile` (público).
  - `createAthlete`/`updateAthlete`/`createTeam`/`updateTeam` → FormData.
- **Formularios**:
  - `src/pages/admin/AthleteFormPage.tsx` (388 l): schema zod (`first_name`,`last_name`,`birth_date`,`gender`), bloque "Inscribir en competición (opcional)", `onSubmit` arma `AthleteWritePayload` y llama `updateMutation`/`createMutation` (+ `createCompetitor` si inscribe). Archivo donde se precarga con `reset()` al editar (efecto sobre `detailQuery.data`).
  - `src/pages/admin/TeamFormPage.tsx` (320 l): schema `name`, mismo patrón de inscripción.
- **Tablas admin**: `AthletesPage.tsx` y `TeamsPage.tsx` — columna "Atleta"/"Equipo" como `<td>` con nombre plano (línea 126-128 y 130-131); ahí se añade el avatar (img + fallback iniciales).
- **Hooks admin**: `src/hooks/useAdminModules.ts` — `useAdminAthletes`, `useAdminTeams`, `useCreateAthlete`, `useUpdateAthlete`, `useCreateTeam`, `useUpdateTeam`. `mutationFn` apunta directo a la función api → **no cambian sus firmas** (payload con `profile_photo` fluye solo).
- **Público**:
  - `src/pages/public/CompetitionDetail.tsx` (396 l): `athleteIdByCompetitor` (línea 108-114) usa `useCompetitors(id)`; `onSelectAthlete={setSelectedAthlete}` (375); `AthletePanel` (387-393) con `athleteId={athleteIdByCompetitor.get(...) ?? null}`. Tipos: `Competitor` trae `athlete?: number|null` y `team?: number|null`.
  - `src/components/public/AthletePanel.tsx` (144 l): props `{ entry, athleteId, onClose }`; usa `useAthleteProfile(athleteId)`; ya renderiza `img` (línea 96-101) o iniciales (103-105); campo "Box de origen" + Puntos + Posición.
  - `src/hooks/useAthleteProfile.ts` (42 l): `AtheleteProfile { firstName, lastName, photoUrl, box }`; resuelve `photoUrl` con `resolveMediaUrl` (privado) y `box` con `fetchAffiliation`. `enabled: isAuthenticated && athleteId != null`.
- **Tipos/DTOs**: `src/types/index.ts` — `Athlete.profile_photo?: string|null` (línea 154, **ya existe**); `Team` (166-170) **sin** `profile_photo`; `AthleteWritePayload` (158-164) y `TeamWritePayload` (172-175) sin `profile_photo`.
- **Fixtures (tests)**: `tests/fixtures.ts` — `makeAthlete` (108-119, `profile_photo: null`), `makeTeam` (121-128, sin `profile_photo`).
- **Verificación**: `npm run typecheck`, `npm run lint` (0 errores; 1 warning preexistente `SidebarContext.tsx`), `npm run test` (**200/200**, 24 archivos), `npm run build`.

---

## 3. Cambios por archivo (pasos de ejecución)

### Paso 0 — Registrar inicio

- Añadir sección **"Paso 38 — Parte II-N: Fotos de perfil de atleta y equipo"** a `Process.md`
  (inicio, plan resumido y lista de pasos).

### Paso 1 — `src/utils/media.ts` (NUEVO)

Mover `resolveMediaUrl()` desde `useAthleteProfile.ts` a util compartido (convención: named export, carpeta `utils`, patrón `utils/leaderboard.ts`):

- `mathced`… no: exactamente el cuerpo actual (detectar `http(s)://`; si no, anteponer el origen de `API_BASE_URL` sin el sufijo `/api/v\d*`).
- Export `resolveMediaUrl(url: string | null | undefined): string | null`.
- `useAthleteProfile.ts` pasa a importarla desde `@/utils/media` (eliminar la copia privada).

### Paso 2 — `src/types/index.ts`

- `Team`: añadir `profile_photo?: string | null`.
- `AthleteWritePayload`: añadir `profile_photo?: File | null`.
- `TeamWritePayload`: añadir `profile_photo?: File | null`.
- Revisar si hay tipos derivados en otros archivos (no se esperan).

### Paso 3 — `src/api/client.ts` (soporte FormData)

En `doFetch` (línea 72-79):

- Si `init.body instanceof FormData` → **no** llamar `headers.set("Content-Type","application/json")` ni setearlo (el navegador añade `multipart/form-data; boundary=...`).
- El resto del flujo (Bearer si `auth && token`, refresh 401, `ApiError`) **sin cambios**.

### Paso 4 — `src/api/admin.ts` (multipart + variantes públicas)

- Helper privado `formDataFromPayload(payload, photo: File | null | undefined, removePhoto: boolean): FormData` (o inline en cada función): agrega cada campo de texto y, según estado de la foto:
  - archivo → `fd.append("profile_photo", file)`
  - "quitar foto" → `fd.append("profile_photo", "")`
  - sin cambios → **no** incluir la clave.
- `createAthlete(payload)`: `POST "/athletes/"` con `body: FormData` (no JSON).
- `updateAthlete(payload)`: `PATCH` con `FormData`; conservar `payload.id`.
- `createTeam(payload)` / `updateTeam(payload)`: ídem `POST/PATCH "/teams/"`.
- Nuevas funciones **públicas** para el panel sin sesión (no cambiar las existentes, que usan los admin):
  - `fetchAthletePublic(id)`: `request<Athlete>("/athletes/{id}/", { auth: false })`.
  - `fetchTeamPublic(id)`: `request<Team>("/teams/{id}/", { auth: false })`.
- `fetchAffiliation` se reutiliza para el box; si se decide leerlo público, añadir `fetchAffiliationPublic(id)` con `auth: false` (opcional, mismo patrón).

### Paso 5 — `src/pages/admin/AthleteFormPage.tsx` (campo de foto)

- Estado local: `photoFile: File | null`, `removePhoto: boolean`, `photoError: string | null`.
- Validación en `onChange` del input `type="file"` `accept="image/png,image/jpeg,image/webp"`: tipo permitido y ≤ 5 MB (mensaje en `photoError`/campo con `role="alert"`), **no emitir petición** si inválido.
- Preview: `URL.createObjectURL(photoFile)` en un `useMemo`/`useState`; si no hay archivo nuevo pero existe `detailQuery.data.profile_photo`, mostrar esa URL (resuelta con `resolveMediaUrl`); si `removePhoto`, mostrar placeholder.
- Botón "Quitar foto" (solo edición y/o cuando hay foto) que setea `removePhoto=true` y limpia el input; botón para re-seleccionar.
- `onSubmit`: construir payload `{ ...campos, profile_photo: photoFile }`; si `removePhoto` → `profile_photo: ""` (en FormData) para limpiar; conservar el resto del flujo (inscripción opcional, navegación, banner de error).
- Cleanup: `revokeObjectURL` del preview al desmontar.
- Bloque visual ubicado antes de "Inscribir en competición" (o tras sexo), estilo TailAdmin (uso de `inputClassName`/`labelClassName` existentes).

### Paso 6 — `src/pages/admin/TeamFormPage.tsx` (campo de foto)

- Mismo patrón que Paso 5 pero con `name` y `detailQuery.data.profile_photo` (una vez que el backend exponga el campo en `Team`; mientras, el preview de edición no tendrá foto previa → solo upload inicial).

### Paso 7 — `src/pages/admin/AthletesPage.tsx` y `TeamsPage.tsx` (avatar en tabla)

- En la columna Nombre (líneas 126-128 y 130-131): `<div className="flex items-center gap-3">` con:
  - si `profile_photo` → `<img src={resolveMediaUrl(...)} alt={name} className="size-8 rounded-full object-cover" />`
  - si no → span con **iniciales** (mini helper `initials(name)` — ya existe en `AthletePanel`, mover a `src/utils/` o reutilizar localmente, sin duplicar lógica).
- Mantener orden/búsqueda igual (el sorteo sigue por nombre).

### Paso 8 — `src/hooks/useAthleteProfile.ts` (público + equipos)

- Generalizar a **participante**: aceptar `participantId: number | null` + `participantType: "athlete" | "team"` (o dos hooks; se prefiere unificar con un tipo `ParticipantKind`).
- `enabled: participantId != null` (**sin** condición de auth) para consultar también anónimo.
- queryFn: según tipo → `fetchAthletePublic` o `fetchTeamPublic`; `photoUrl = resolveMediaUrl(profile_photo)`; `box` vía `fetchAffiliation` (auth: falsa o JWT decidida en Paso 4; mientras el endpoint no sea público, degradar a `null`).
- Mantener la shape `AthleteProfile` (renombrar a `ParticipantProfile` internamente si se unifica; los tests actuales del panel mockean el hook → ajustar mock si cambia el nombre/firma).
- Invalidar `["athlete-profile", ...]` cuando corresponda (no crítico; `staleTime` corto).

### Paso 9 — `src/pages/public/CompetitionDetail.tsx` (mapeo de equipos)

- Añadir `teamIdByCompetitor` (espejo de `athleteIdByCompetitor`, línea 108-114): `if (competitor.team != null) map.set(competitor.id, competitor.team)`.
- Al renderizar `AthletePanel`, pasar también el tipo: `participantType={athleteId ? "athlete" : "team"}` y `participantId` (athlete si existe, si no team de la entry); si ninguno → `null`/omiso (comportamiento actual).
- La selección (`onSelectAthlete`) **no cambia**: la entry ya trae `competitor_id`.

### Paso 10 — `src/components/public/AthletePanel.tsx` (tipo de participante)

- Props: añadir `participantType?: "athlete" | "team"` (default `"athlete"` para no romper usos/tests) o recibir `participantId` en vez de `athleteId` (renombrado).
- `useAthleteProfile(participantId, participantType)`.
- Sin cambios de maquetado: `img`/iniciales/Box de origen/Puntos/Posición igual.

### Paso 11 — Tests (actualizar + nuevos)

- `tests/fixtures.ts`:
  - `makeTeam`: añadir `profile_photo: null`.
  - (opcional) helper `makeFile()` para `File` fake en formularios.
- `tests/adminApi.test.ts`: casos para `createAthlete`/`updateAthlete`/`createTeam`/`updateTeam`:
  - con `FormData` (el `body` de fetch es `instanceof FormData` y **no** incluye `Content-Type: application/json` en headers);
  - `profile_photo` presente como `File`; ausente en edición sin cambio; `""` cuando "quitar foto";
  - nuevas `fetchAthletePublic`/`fetchTeamPublic` llaman con `auth: false` (sin header Authorization).
- `tests/AthleteFormPage.test.tsx`: seleccionar archivo → preview; archivo inválido (>5 MB / tipo) → error, sin submit; "Quitar foto" → payload de limpieza; submit incluye `profile_photo`.
- `tests/TeamFormPage.test.tsx`: ídem para equipo.
- `tests/AthletesPage.test.tsx` / `tests/TeamsPage.test.tsx`: avatar con foto (img con `alt`) y fallback iniciales sin foto.
- `tests/AthletePanel.test.tsx`: ajustar mock del hook a la nueva firma; caso **equipo** (tipo team, foto + box); caso **sin sesión/fallback** (photo null → iniciales, sin `img`).
- `tests/CompetitionDetail.test.tsx`: caso "click en nombre de un equipo abre el panel con tipo team" (mock de `useCompetitors` con `makeCompetitor({ competitor_type: "TEAM", team: 20, athlete: null })`).
- Suite esperada: **200 actuales ± cambios ≈ 205–212** (renombres + añadidos).

### Paso 12 — Verificación

1. `npm run typecheck` → sin errores.
2. `npm run lint` → 0 errores (1 warning preexistente `SidebarContext.tsx`).
3. `npm run test` → suite completa en verde (≈205–212).
4. `npm run build` → OK (warning chunk >500 kB preexistente).

### Paso 13 — Verificación manual + documentación

- Manual (usuario): crear/editar atleta y equipo con foto (subida multipart, preview, quitar);
  tablas admin con avatar; en `/competitions/{slug}/` hacer click en nombre de un **atleta** y de un
  **equipo** → panel muestra foto + box (con backend abierto) o iniciales (degradación).
- `Process.md`: cerrar Paso 38. `RESULTADOS.md`: iteración Parte II-N con verificación.
- `PLAN.md`: marcar pasos ✅.
- **Avisar al usuario los 3 cambios backend pendientes** (sección 8) para que la foto sea
  subible en equipos (serializer), visible en público (lectura AllowAny) y cargable (`/media/`).

---

## 4. Seguimiento

| Paso | Estado |
|---|---|
| 0. Registrar inicio en `Process.md` (Paso 38) | ✅ hecho |
| 1. `src/utils/media.ts` (`resolveMediaUrl` compartido) | ✅ hecho |
| 2. `src/types/index.ts` (`Team.profile_photo`, WritePayload con `File`) | ✅ hecho |
| 3. `src/api/client.ts` (no forzar Content-Type con FormData) | ✅ hecho |
| 4. `src/api/admin.ts` (multipart + `fetchAthletePublic`/`fetchTeamPublic`) | ✅ hecho |
| 5. `AthleteFormPage.tsx` (campo foto + preview + quitar + validación) | ✅ hecho |
| 6. `TeamFormPage.tsx` (ídem) | ✅ hecho |
| 7. `AthletesPage.tsx` / `TeamsPage.tsx` (avatar en tabla) | ✅ hecho |
| 8. `useAthleteProfile.ts` (público, equipo, `auth: false`) | ✅ hecho |
| 9. `CompetitionDetail.tsx` (mapeo team → panel tipo team) | ✅ hecho |
| 10. `AthletePanel.tsx` (participante atleta/equipo) | ✅ hecho |
| 11. Tests (fixtures, adminApi, forms, pages, panel, detail) | ✅ hecho (200 → 217) |
| 12. Verificación (typecheck, lint, test, build) | ✅ hecho |
| 13. Documentar en `Process.md`/`RESULTADOS.md` + avisos backend | ✅ hecho (backend en `RESULTADOS.md`) |

> Nota: durante la ejecución se añadieron `src/utils/initials.ts` y
> `src/components/common/Avatar.tsx` (helper de iniciales compartido y avatar con fallback), y
> `fetchAffiliationPublic` para que el panel público resuelva el box sin JWT.

---

## 5. Verificación de cierre (checklist)

- [x] `npm run typecheck` → sin errores.
- [x] `npm run lint` → 0 errores (1 warning preexistente `SidebarContext.tsx`).
- [x] `npm run test` → 217/217 en verde (25 archivos).
- [x] `npm run build` → OK.
- [x] Alta/edición de atleta con foto → `POST/PATCH /athletes/` como `multipart/form-data`.
- [x] Alta/edición de equipo con foto → `POST/PATCH /teams/` como `multipart/form-data`.
- [x] Editar sin tocar foto → no se envía `profile_photo` (la foto se conserva).
- [x] "Quitar foto" → se envía `profile_photo: ""` (el backend limpia).
- [x] Validación: >5 MB o tipo no soportado → mensaje de error, no se emite petición.
- [x] `request()` con `FormData` → sin `Content-Type` manual (boundary del navegador).
- [x] Avatares en `/admin/athletes` y `/admin/teams` (foto o iniciales).
- [x] Panel público sin sesión: click en nombre → `auth: false`, muestra foto/box o iniciales.
- [x] Click en nombre de un **equipo** → panel con foto del equipo.
- [x] Sin regresiones en la suite ni en los públicos existentes.
- [x] Avisos backend comunicados al usuario (serializer `Team`, lectura pública, `/media/`).

---

## 6. Fuera de alcance

- **Backend**: sin tocar desde el frontend. Los 3 avisos (sección 8) los aplica el usuario.
- **Cropper/compresión de imagen** en cliente (se sube el archivo tal cual).
- **Galería/listado público de atletas** ni página de perfil propia: la foto pública solo se ve
  en `AthletePanel` (click en el nombre del leaderboard) y como avatar en el admin.
- **`TeamMember`/roster** y foto en `Competitor` (no se tocan).
- **`aufiliation` en `AthleteWritePayload`**: no se añade en esta iteración (aviso dentro de la
  spec como follow-up opcional).
- **Hombre de sala de unión**: no se generaliza el panel a otros públicos más allá del leaderboard.

---

## 7. Restricciones que se mantienen

- **NO** tocar el clon `free-react-tailwind-admin-dashboard/` (solo lectura).
- **NO** crear ramas, **NO** push, **NO** commit sin pedido explícito.
- **NO** ejecutar comandos del backend.
- Sin comentarios en código salvo que se soliciten.
- Textos en español; tema claro; sin i18n; sin `any`; accesibilidad (roles, `aria-label`,
  `aria-sort`, `alt` en imágenes) mantenida.
- Sin emojis excepto los ya existentes (iniciales = texto, no emoji).
- Fixtures solo en `tests/`; sin mock de datos en producción.

---

## 8. AVISOS BACKEND (los aplica el usuario, no el agente)

1. **`TeamSerializer` sin foto**: en `leader\Scorely/apps/participants/serializers.py`,
   `TeamSerializer.Meta.fields` = `('id', 'name', 'affiliation')` → falta `'profile_photo'`
   (el modelo ya lo tiene, migración `0004` aplicada). Sin este cambio no se puede subir/leer
   la foto del equipo.
2. **Lectura pública del perfil**: `AthleteViewSet`/`TeamViewSet` usan `IsAuthenticated` →
   `/athletes/{id}/`, `/teams/{id}/` y `/affiliations/{id}/` no están disponibles para el panel
   sin sesión. Abrir la lectura (`AllowAny`/`IsAuthenticatedOrReadOnly`) para que la foto + box
   se vean en público. Mientras tanto el panel degrada a iniciales + `—`.
3. **Media no servida**: `config/urls.py` no monta
   `+ static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)` en modo dev → toda URL
   `/media/...` responde **404** (en prod depende del storage/CDN). Sin este cambio la foto se
   sube pero no carga.