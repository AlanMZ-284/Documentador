# Documentador - API Backend

Backend en Fastify para gestion documental con PostgreSQL, MinIO y modulos de IA.

## Estado actual

- Stack: Node.js 20+, Fastify 4, PostgreSQL (pg), MinIO (S3 compatible), Redis.
- Estado funcional: modulos principales de Fase 2 activos en rutas `/api/*`.
- Modulos legacy activos temporalmente: IA y busqueda en rutas `/api/v1/*` (pendientes de migracion a nuevo esquema).
- Healthcheck: `GET /health`.

## Estructura real del proyecto

```text
src/
    server.js
    plugins/
        index.js
        db.js
    modules/
        auth/
        usuarios/
        auditoria/
        documentos/
        aplicaciones/
        proyectos/
        plantillas/
        matriz-raci/
        firmas/
        ai/         (legacy)
        search/     (legacy)
    shared/
        db/
            migrate.js
            seed.js
            migrations/
        services/
        utils/
docker-compose.yml
init-scripts/
scripts/bootstrap-superadmin.js
```

## Endpoints vigentes

### Autenticacion (`/api/auth`)

- `POST /api/auth/login`
- `POST /api/auth/refresh`
- `POST /api/auth/logout`
- `GET /api/auth/me`

### Usuarios (`/api/usuarios`)

- `GET /api/usuarios`
- `POST /api/usuarios`
- `GET /api/usuarios/:id`
- `PATCH /api/usuarios/:id`
- `POST /api/usuarios/:id/reset-password`
- `POST /api/usuarios/:id/deactivate`
- `POST /api/usuarios/:id/activate`

### Auditoria (`/api/auditoria`)

- `GET /api/auditoria`
- `GET /api/auditoria/actions`

### Documentos (`/api/documentos`)

- `GET /api/documentos`
- `POST /api/documentos`
- `GET /api/documentos/:id`
- `PATCH /api/documentos/:id`
- `DELETE /api/documentos/:id`
- `POST /api/documentos/:id/versiones`

### Matriz RACI por documento

- `GET /api/documentos/:id/raci`
- `POST /api/documentos/:id/raci`
- `PATCH /api/documentos/:id/raci/:idAsignacion`
- `DELETE /api/documentos/:id/raci/:idAsignacion`

### Firmas por documento

- `GET /api/documentos/:id/firmas`
- `POST /api/documentos/:id/firmas`
- `POST /api/documentos/:id/firmas/:idFirma/invalidate`

### Catalogos operativos

- Aplicaciones: `GET/POST/PATCH/DELETE /api/aplicaciones` + `GET /api/aplicaciones/:id`
- Proyectos: `GET/POST/PATCH/DELETE /api/proyectos` + `GET /api/proyectos/:id`
- Plantillas: `GET/POST/PATCH/DELETE /api/plantillas` + `GET /api/plantillas/:id`

### Legacy temporal (`/api/v1`)

- IA: `/api/v1/ai/*`
- Search: `/api/v1/search/*`

Nota: estos endpoints legacy siguen registrados, pero aun referencian tablas/estructura anterior en varias operaciones. Se mantienen para transicion y pueden requerir ajustes en Fase 3.

## Instalacion y arranque (flujo recomendado)

### 1. Requisitos

- Node.js 20+
- Docker + Docker Compose

### 2. Instalar dependencias y variables

```powershell
npm install
Copy-Item .env.example .env
```

Editar `.env` y validar al menos:

- `DATABASE_URL`
- `JWT_SECRET`
- `ANTHROPIC_API_KEY` (si usaras IA)
- `OPENAI_API_KEY` (si usaras embeddings OpenAI)
- `SUPERADMIN_EMAIL` y `SUPERADMIN_PASSWORD`

Importante con Docker Compose de este repo:

- PostgreSQL se publica en `localhost:5433`.
- Si corres el backend fuera de Docker, usa por defecto:

```env
DATABASE_URL=postgresql://postgres:theluis@localhost:5433/documentador
```

### 3. Levantar infraestructura

```powershell
docker compose up -d
```

Servicios principales:

- PostgreSQL: `localhost:5433`
- MinIO API: `localhost:9000`
- MinIO Console: `localhost:9001`
- Redis: `localhost:6379`

Opcional para herramientas:

```powershell
docker compose --profile tools up -d pgadmin
```

### 4. Migrar y sembrar datos

```powershell
npm run migrate
npm run seed
```

### 5. Iniciar API

```powershell
npm run dev
```

 La API inicia en `http://localhost:3001` y se queda en ese puerto; si ya esta ocupado, el arranque falla para evitar que las pruebas apunten al servicio equivocado.

## Scripts npm

- `npm run dev`: inicia servidor en modo desarrollo con watch.
- `npm start`: inicia servidor en modo normal.
- `npm run migrate`: ejecuta migraciones SQL.
- `npm run seed`: inserta catalogos y datos base idempotentes.

## Usuarios iniciales

- SuperAdministrador: se crea por `scripts/bootstrap-superadmin.js` usando variables `SUPERADMIN_EMAIL` y `SUPERADMIN_PASSWORD`.
- Administrador demo (seed):
    - Email: `admin.demo@documentador.local`
    - Password: `Demo1234!`

## Notas importantes

- No hay WebSocket de indexado activo en esta fase (fue retirado temporalmente).
- Los modulos principales ya usan rutas en espanol y esquema DBML nuevo.
- IA/Search permanecen como compatibilidad temporal y su migracion completa esta pendiente.

## Motor de comparacion de versiones (Fase 2)

Flujo: se sube un `.zip` como version base (v0), despues se suben nuevas versiones
y el sistema detecta archivos creados, eliminados y modificados (con diff de lineas
en archivos de texto), ademas de identificar frameworks y lenguajes del proyecto.

### Endpoints (`/api/comparaciones`)

- `POST /api/comparaciones/base` — multipart con campo `archivo` (.zip). Registra la v0 y devuelve `comparisonId`, mapa de archivos, frameworks y lenguajes detectados.
- `POST /api/comparaciones/:id/comparar` — multipart con campo `archivo` (.zip). Compara contra la v0 y devuelve el JSON de cambios.
- `GET /api/comparaciones/:id` — metadata de la comparacion.
- `GET /api/comparaciones/:id/resultados/:version` — resultado de una comparacion previa.

Formatos soportados: js, ts, tsx, jsx, html, css, scss, php, py, java, cs, cpp, c, h, hpp, xml, json, yaml, yml, sql, md, txt, pdf, docx, xlsx, pptx.

Frameworks detectables: Next.js, React, Angular, Vue, Nuxt, Svelte, NestJS, Fastify, Express, Laravel, Symfony, Django, Flask, FastAPI, Spring/Spring Boot, .NET, Go, Flutter, entre otros (via package.json, composer.json, requirements.txt, pom.xml y archivos huella).

## Flujo de trabajo con Docker

```bash
# Primer arranque
docker compose up -d
npm run migrate
npm run seed

# Reinicio normal (los datos persisten, NO usar -v)
docker compose down
docker compose up -d

# Reset total (borra datos)
docker compose down -v
docker compose up -d
npm run migrate
npm run seed
```

- PostgreSQL: puerto `5433` en el host (evita conflicto con Postgres local en Windows).
- API: puerto `3001`.
- MinIO: `9000` (API) y `9001` (consola).
- Variables de entorno: copiar `.env.example` a `.env` y ajustar.

## Migraciones

Las migraciones viven en `src/shared/db/migrations/` y se aplican en orden con `npm run migrate`:

- `02_alignment.sql` — tabla `config_sistema`.
- `03_documento_archivos.sql` — archivos por documento (hash, metadatos).
- `04_manifests_metadata.sql` — metadata agregada y dependencias por proyecto.
- `05_schema_fixes.sql` — columnas faltantes detectadas en auditoria (aprobada).
- `06_sesiones_activas.sql` — sesiones para logout real (aprobada).
- `07_fases_proyecto.sql` — fases, actividades y entregables (aprobada).
