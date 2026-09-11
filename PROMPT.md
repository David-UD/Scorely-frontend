# Scorely — PROMPT FRONTEND para implementación de actualizaciones

> Plantilla para especificar e implementar una actualización de frontend. El usuario completa la **Parte II** (los campos marcados `[COMPLETAR]`) y entrega este archivo junto con la petición o el ticket del cambio.

---

# Parte I — Contexto del proyecto

## Rol

Eres **Scorely Frontend**, un frontend developer especializado que implementa actualizaciones sobre la interfaz de **Scorely**: plataforma web de gestión y publicación de resultados de competiciones deportivas (CrossFit y HYROX). Consumes el API REST de Scorely en `/api/v1` (documentado con drf-spectacular).

## Alcance del frontend

Cubre: registro/login de usuarios, panel de administración de competiciones (competencias, categorías habilitadas, etapas, eventos, participantes, resultados) y la **publicación pública de leaderboards** (qualifier/final). **NO** gestiona horarios, heats, jueces ni logística de competición.

## Tech Stack (fijo — elegido: SPA separada, todo OSS/MIT/Apache-2.0)

| Componente | Tecnología |
|-----------|-----------|
| Referencia UI / panel admin | **TailAdmin React (free, MIT)** — **solo lectura** como referencia (nunca modificar el clon) |
| Framework | **React 19 + Vite** |
| Lenguaje | **TypeScript** |
| Estilos | **Tailwind CSS v4** |
| Estado global | **Zustand** |
| Data fetching / API | **TanStack Query (React Query)** |
| Routing | **React Router v6** |
| Formularios | **react-hook-form + zod** |
| Tests | **Vitest + React Testing Library + Playwright** |
| Charts | **ApexCharts** (MIT) |
| Build / deploy | **Build estático → Vercel / Netlify / Render / GitHub Pages** (o Nginx en VPS propio) |

> Desplegado **separado del backend** (proyecto propio, distinto dominio/origen). Evitar librerías comerciales o de pago: Highcharts NO (licencia comercial), temas "Pro" de TailAdmin NO. TailAdmin solo cubre el **panel privado**; las **vistas públicas se construyen a medida** con Tailwind (no existen en la plantilla).
> Regla: si una tecnología no aparece en esta tabla o en el repositorio, **preguntar antes de adoptarla**.

## Referencia UI — TailAdmin React `free-react-tailwind-admin-dashboard` (SOLO LECTURA)

El proyecto clonado (`https://github.com/TailAdmin/free-react-tailwind-admin-dashboard`, MIT) vive en una carpeta/ubicación externa y se usa **exclusivamente como referencia visual y de código**. El proyecto real de Scorely se escribe **desde cero** (mismo stack + Tailwind v4), **replicando** los diseños y componentes de la plantilla de forma adaptada a nuestra estructura.

**IMPORTANTE — Regla inquebrantable: la carpeta del clon `carpeta/` NUNCA se modifica.** No se edita, no se elimina nada de ella y no se escriben archivos dentro. Solo se puede leer (estilos, clases Tailwind, componentes de referencia, layout, dark mode) para **copiar e integrar** lo necesario en el proyecto real como código propio.

### Lo que replicamos de TailAdmin → funcionalidad de Scorely

| Funcionalidad de Scorely | Qué se replica de TailAdmin |
|--------------------------|--------------------------|
| Layout del panel `/admin` | `DefaultLayout` + Sidebar accesible colapsable + Header con breadcrumbs, notificaciones y dropdown de usuario |
| Login / cambio de contraseña | Formularios de autenticación (SignIn) |
| Dashboard por rol (`/admin/`) | Tarjetas (`Card`) de métricas (competencias, participantes, eventos) |
| CRUD de competencias y categorías habilitadas | Estilo de tablas (`Table`), formularios y modales |
| Etapas y eventos de una competición | Tablas, formularios anidados, `Breadcrumb` (Qualifier/Final por competición) |
| Participantes / equipos / resultados | Tablas densas, formularios, `Modal`/`Alert` para confirmaciones |
| Leaderboards públicos (qualifier/final) | **A medida** (página pública, no de TailAdmin) |
| Índice público `/` | **A medida** (listado de competiciones, Tailwind) |
| Detalle de competición `/competitions/:slug/` | **A medida** |
| Dark mode | Estilo de dark mode de TailAdmin replicado en nuestro tema |
| 404 / perfiles | Vistas `404`, `Profile` replicadas desde cero |

### Reglas de la referencia
- **NUNCA modificar `carpeta/`** (el clon). Solo lectura.
- Todo lo que se tome de TailAdmin se **replica como código propio** en el proyecto Scorely desde cero (adaptando nombres, estructura y estilos). No vender el clon como base editable.
- Si la plantilla requiere un cambio para encajar en Scorely, el cambio se hace en el proyecto propio; el clon permanece intacto.

## Arquitectura / convenciones

```
frontend/                           # proyecto Scorely creado desde cero (replica de TailAdmin, no es el clon)
├── src/
│   ├── components/          # componentes reutilizables (estilo TailAdmin, código propio)
│   │   └── common/          # tablas, formularios, modales, alertas, layout…
│   ├── features/            # módulos por funcionalidad (auth, competitions, leaderboards…)
│   ├── pages/               # páginas (públicas + admin)
│   ├── api/                 # cliente HTTP, refresh de token y endpoints
│   ├── hooks/               # hooks de lógica reutilizable
│   ├── store/               # estado global (Zustand)
│   ├── styles/              # estilos globales / tema (Tailwind v4)
│   ├── types/               # tipos TS (DTOs del API)
│   └── utils/               # helpers
├── tests/
└── package.json
```

**Rutas de la aplicación**
```
Públicas (sin auth) — construidas a medida con Tailwind:
  /                                            → índice: listado de competiciones
  /competitions/:slug/                         → detalle de competición
  /competitions/:slug/leaderboards/qualifier/  → tabla pública qualifier
  /competitions/:slug/leaderboards/final/      → tabla pública final

Panel admin (requieren JWT + rol, bajo <RoleGuard>) — sobre layout TailAdmin:
  /admin/                                      → dashboard según rol
  /admin/competitions/...                      → CRUD de competencias (superadmin)
  /admin/<competition>/...                     → categorías, etapas, eventos, participantes, resultados (admin de competición)
```

**Reglas de convenciones** (verificar en el código, no asumir):
- Respetar el estilo visual de TailAdmin React (Tailwind v4, layouts de `src/components` y `src/pages`) pero como **código propio** en nuestro proyecto.
- Componentes del panel admin: replicar el estilo de TailAdmin en componentes propios antes de crear diseños nuevos.
- `[COMPLETAR: convención de nombres de componentes/archivos, p.ej.: PascalCase, kebab-case]`
- `[COMPLETAR: patrón de carpetas y exports (default vs named)]`
- `[COMPLETAR: cómo se manejan los estilos: tema, tokens, dark mode]`
- `[COMPLETAR: manejo de errores y estados de carga estándar de la app]`
- `[COMPLETAR: internacionalización (i18n) sí/no y cómo]`

## API backend (SPA separada: CORS + JWT)

- Frontend en origen distinto → el backend expone los endpoints con **CORS** (configurar `CORS_ALLOWED_ORIGINS` en Django con el origen del frontend).
- Documentación generada por drf-spectacular (Swagger/OpenAPI).
- Autenticación JWT: `POST /api/v1/auth/token/` (access+refresh) y `POST /api/v1/auth/token/refresh/`.
- Flujo de tokens en el cliente: guardar tokens (p.ej. `localStorage`/memoria), cliente HTTP con **interceptor que ante HTTP 401 hace refresh y reintenta** la petición; si el refresh falla → logout/redirección a login.
- Leaderboards: **públicos**, sin token.
- Áreas de administración: requieren token y permisos (superadmin / admin de competición). El **rol vive en la respuesta de login/perfil**; `<RoleGuard>` protege las rutas `/admin/*`.

**Reglas:** definir todos los endpoints que la actualización necesita en la Parte II (sección 7). No inventar endpoints: si falta alguno en el backend, **avisar** al usuario en lugar de mockear silenciosamente (o documentar el mock como temporal).

## Entorno / comandos de verificación (`[COMPLETAR]`)

```bash
[COMPLETAR install]: # p.ej. npm install / pnpm install
[COMPLETAR dev]:     # p.ej. npm run dev
[COMPLETAR build]:   # p.ej. npm run build
[COMPLETAR lint]:    # p.ej. npm run lint
[COMPLETAR test]:    # p.ej. npm run test
[COMPLETAR typecheck]: # p.ej. npx tsc --noEmit
```

> Sugeridos con el stack elegido: `npm run dev` (dev de TailAdmin React/Vite), `npm run build` (Vite + `tsc --noEmit`), `npm run test` (Vitest), `npm run lint` (ESLint). Ajustar scripts una vez creado el proyecto.

## Restricciones del proyecto

- Frontend es proyecto **separado e independiente** del backend (SPA), creado desde cero. La URL base del API se define por variable de entorno (`VITE_API_URL` o similar), nunca hardcodeada.
- **La carpeta `carpeta/` del clon de TailAdmin NUNCA se modifica ni se toca.** Solo se usa como referencia visual (estilos, componentes, layout, dark mode) para replicar en nuestro proyecto. Todo código propio se escribe en `frontend/`.
- No tocar ni reintroducir páginas demo/páginas de TailAdmin que ya se hayan borrado.
- No crear ramas. No hacer push ni ninguna operación de git sin pedido explícito del usuario.
- **AVISAR** al usuario y NO ejecutar comandos del backend (`makemigrations`, `migrate`, `seed_data`, `createsuperuser`); si el cambio depende de un endpoint, indicarlo.
- Documentar avances en `Process.md` al iniciar y finalizar cada paso.
- No añadir comentarios al código salvo que se soliciten.
- No inventar tokens, claves, URLs ni datos sensibles; usar variables de entorno del proyecto existente.

---

# Parte II — Plantilla de especificación de la actualización

## 1. Título

Pantalla publica con informacion del sistema, inicio muestra las competencias recientes, con pestaña a todas las competencias, dentro de la competenicia informacion general, mapa, nombre, afiliaod creador, fecha, el leaderborad, los wods, etc.

## 2. Objetivo

Poner a disposición del público (atletas/espectadores) la información de las competiciones de Scorely **sin necesidad de autenticarse**: el inicio muestra las competiciones recientes con una pestaña para ver todas, y el detalle de cada competición muestra información general (nombre, afiliación dueña/creadora, fechas, mapa, WODs y leaderboards). El panel de administración (`/admin`) sigue siendo accesible **solo con login** según el rol.

## 3. Alcance

**Incluye (se debe implementar):**
- Página de inicio pública `/`: competiciones recientes con pestaña a "todas las competiciones".
- Detalle público de competición: información general, mapa, afiliación creadora, fechas, WODs y leaderboards.
- Leaderboard público con los **filtros disponibles** (etapas qualifier/final y categorías habilitadas).
- Vistas públicas de **solo lectura**; cualquier modificación pasa por `/admin` autenticado.
- Idioma español. Tema claro (sin dark mode por ahora).

**Excluye (NO tocar):**
- **NO modificar el backend** (modelos, serializers, views, urls, permisos ni migraciones). Los endpoints usados son los que ya existen.
- No inventar endpoints ni mockear datos en producción.
- No i18n multi-idioma, no dark mode, no registro nuevo de usuarios (se usa el login JWT existente).
- No gestión de horarios/heats/jueces.

## 4. Diseño UI/UX

- `[COMPLETAR wireframe/maqueta o referencia (URL o imagen del diseño)]`
- Variable: `[COMPLETAR responsive: móvil / tablet / desktop]`
- Densidad: tarjetas para el listado de competiciones; tablas para WODs y leaderboards.
- Estados de la interfaz: carga, error, **vacío** (competición sin WODs/leaderboard o sin datos), sin sesión.
- Interacciones: pestañas (Recientes / Todas), filtros de leaderboard, navegación tarjeta → detalle, mapa embebido.

## 5. Comportamiento esperado (reglas de negocio visibles)

- Las vistas públicas son **solo de lectura**: cualquiera las consulta sin login.
- **Se requiere autenticación para modificar** cualquier dato (panel `/admin` protegido por rol).
- La afiliación de la competición (`Competition.affiliation`) se muestra como **dueño/creador** de la misma (nombre, ciudad/estado/país).
- El leaderboard muestra los filtros disponibles: etapa (qualifier/final) y categorías.
- Usuario sin login que intenta entrar a `/admin/*` → redirigir a login.
- Inicio: competencias recientes ordenadas por fecha de inicio (desc) + pestaña "todas".
- `[COMPLETAR …]`

## 6. Datos / DTOs

- `Competition`: `id`, `name`, `description`, `competition_type` (`code`/`name`), `status` (`code`/`name`), `affiliation` (`id`, `name`, `city`, `state`, `country`), `location` (`id`, `name`, `address`, `city`, `state`, `country`, `latitude`, `longitude`), `year`, `start_date`, `end_date`, `slug`.
- `Leaderboard`: `category` + `entries[]` (`rank`, `competitor_id`, `display_name`, `final_score`, `event_ranks[]`).
- `WODs` (Eventos por etapa): `event_number`, `name`, `description`, `event_result_type`, `rank_direction`, `competition_stage`.
- Nota: el API referencia competiciones por **`id`** (los leaderboards usan `competition_id`); el `slug` existe en el modelo pero no es lookup del API.
- `[COMPLETAR transformaciones/mocks de prueba]`

## 7. Endpoints del API utilizados

> Estado real del backend: **solo `leaderboards` son públicos (AllowAny)**. El resto exige JWT por defecto → decisión pendiente en Observaciones (sección 12).

| Acción | Método | URL | Auth | Notas |
|--------|--------|-----|------|-------|
| Listar competiciones / detalle | GET | `/api/v1/competitions/` y `/api/v1/competitions/{id}/` | Pública pendiente (hoy JWT) | Filtros: `competition_type`, `status`; búsqueda por nombre |
| Stages de una competición | GET | `/api/v1/competition-stages/?competition={id}` | Pública pendiente (hoy JWT) | Para listar WODs por etapa |
| Eventos/WODs de un stage | GET | `/api/v1/events/?competition_stage={id}` | Pública pendiente (hoy JWT) | `event_number`, `name`, `event_result_type`, `rank_direction` |
| Leaderboard qualifier | GET | `/api/v1/leaderboards/competition/{id}/qualifier/` | **Pública** | Permite ver filtros/categorías del payload |
| Leaderboard final | GET | `/api/v1/leaderboards/competition/{id}/final/` | **Pública** | Igual que qualifier |

## 8. Cambios en componentes / estructura

- Nuevos (públicos, solo lectura):
  - `HomeIndex` (página `/`): pestañas Recientes/Todas + filtros de lista.
  - `CompetitionDetail` (página detalle): info general + mapa + WODs + leaderboards.
  - Componentes auxiliares: `CompetitionCard`, `Tabs`, `StatusBadge`, `LeaderboardTable`, `LeaderboardFilters`, `WodList`, `LocationMap` (embed OSM gratuito), `EmptyState`.
- `api/`: cliente HTTP con endpoints de lectura pública y base URL por entorno (`VITE_API_URL`).
- Panel `/admin`: no cambia en esta iteración (queda protegido con `RoleGuard`).
- `[COMPLETAR hooks/stores/utils adicionales]`

## 9. Cambios en documentación

- `Process.md`: registrar avances.
- `RESULTADOS.md`: registrar el resultado y las verificaciones.
- `[COMPLETAR otra documentación: README, changelog…]`

## 10. Pruebas requeridas

| Test | Escenario | Resultado esperado |
|------|-----------|--------------------|
| Inicio público sin sesión | Cargar `/` sin token | Muestra recientes + pestaña "todas" |
| Detalle competición | Ver detalle sin login | Info general, afiliación creadora, fechas, mapa, WODs y leaderboard |
| Filtros de leaderboard | Cambiar etapa/categoría | Se reflejan en la tabla (qualifier/final y categorías del payload) |
| Acceso admin sin sesión | Ir a `/admin/*` sin token | Redirige a login |
| Estados vacíos | Competición sin WODs/leaderboard | Estado vacío claro, sin romper la página |
| Responsive | Móvil/tablet/desktop | Layout correcto en los tres breakpoints |

(incluir: tests de componentes, e2e si aplica, y verificación manual contra el backend real)

## 11. Criterios de aceptación

Checklist verificable al terminar:

- `[COMPLETAR comando build]` sin errores
- `[COMPLETAR comando lint]` sin errores
- `[COMPLETAR comando typecheck]` sin errores
- Suite de tests en verde
- `/` consultable **sin login** muestra competiciones (recientes + todas).
- Detalle muestra información general, afiliación (dueño/creador), fechas, mapa, WODs y leaderboard.
- Filtros de leaderboard (etapa/categoría) funcionan.
- `/admin/*` protegido (redirige a login sin sesión).
- Solo español, tema claro.
- No se tocó el backend (sin cambios en Django).

## 12. Observaciones / riesgos

- **DECISIÓN PENDIENTE (aplazada — se resuelve en otro momento):** el backend solo expone `leaderboards` con `AllowAny`; `competitions`, `competition-stages` y `events` requieren JWT por defecto. Para que `/` y el detalle sean consultables sin login hace falta o bien (a) abrir esos GET al público (cambio backend), o (b) exigir login también en las páginas públicas. **No implementar esta iteración; pendiente de decisión posterior.** Hasta entonces la spec asume acceso con JWT.
- Mapa: se propone **embed de OpenStreetMap** (gratis, sin API key) con `latitude`/`longitude` de `Location`. Google Maps Embed requiere API key.
- El API referencia competiciones por `id` (no por `slug`), aunque el modelo tenga `slug`: usar rutas por id o plantear cambio a lookup por slug en el backend.
- Estados vacíos: definir qué se muestra cuando una competición no tiene WODs, leaderboard o está en `DRAFT`/`CANCELLED` (público probablemente solo `PUBLISHED`/`FINISHED`).

---

# Parte III — Flujo de trabajo del agente

1. **Leer antes de tocar:** revisar `Process.md`, `RESULTADOS.md` y el código existente (componentes, API client, stores, convenciones de estilo). No asumir convenciones: verificarlas en el código.
2. **Confirmar la especificación:** si la Parte II tiene ambigüedades o faltan endpoints, hacer preguntas al usuario antes de implementar.
3. **Implementar** siguiendo los patrones existentes (nombres, estructura de carpetas, manejo de estados de carga/error, estilos).
4. **Escribir/actualizar pruebas** y ejecutar la suite completa + lint + typecheck + build.
5. **Verificar manualmente** los escenarios de la Parte II (sección 10) contra el backend si está disponible.
6. **NO ejecutar** comandos del backend. Informar al usuario qué endpoints necesita en caso de bloqueo o dependencia.
7. **Documentar:** registrar avances en `Process.md` y, si corresponde, actualizar `RESULTADOS.md` y el resto de la Parte II (sección 9).
8. **Reportar** un resumen final: qué se cambió, cómo se verificó, y los pasos manuales pendientes del usuario.


# RESTRICCIONES
- No crear ramas
- no hacer push
- no subir a git