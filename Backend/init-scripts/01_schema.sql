-- 01_schema.sql
-- Espejo fiel del archivo database/schema.dbml (fuente de verdad)
-- Este archivo se monta en /docker-entrypoint-initdb.d/ y se ejecuta en el primer arranque.
-- Cualquier cambio debe hacerse PRIMERO en database/schema.dbml y reflejarse aquí.

SET client_min_messages = WARNING;

-- =========================================================================
-- 1. CATÁLOGOS PRINCIPALES Y ÁREAS
-- =========================================================================

CREATE TABLE IF NOT EXISTS catalogo_tipos_documento (
  id_tipo_documento    SERIAL PRIMARY KEY,
  nombre_tipo          VARCHAR NOT NULL,
  metodologia_asociada VARCHAR NOT NULL DEFAULT 'Ambas'
);

CREATE TABLE IF NOT EXISTS catalogo_areas_corporativas (
  id_area     SERIAL PRIMARY KEY,
  acronimo    VARCHAR NOT NULL,
  nombre_area VARCHAR
);

CREATE TABLE IF NOT EXISTS plantillas_mdap (
  id_plantilla      SERIAL PRIMARY KEY,
  id_tipo_documento INTEGER REFERENCES catalogo_tipos_documento(id_tipo_documento),
  nombre_plantilla  VARCHAR,
  activa            BOOLEAN DEFAULT TRUE
);

-- =========================================================================
-- 2. ACCESO AL SISTEMA
-- =========================================================================

CREATE TABLE IF NOT EXISTS roles (
  id_rol     SERIAL PRIMARY KEY,
  nombre_rol VARCHAR NOT NULL,
  permisos   JSON
);

CREATE TABLE IF NOT EXISTS recursos_humanos (
  id_recurso              SERIAL PRIMARY KEY,
  id_area                 INTEGER REFERENCES catalogo_areas_corporativas(id_area),
  nombre_completo         VARCHAR NOT NULL,
  perfil_tipo             VARCHAR,
  cedula_profesional      VARCHAR,
  certificaciones_vigentes TEXT
);

CREATE TABLE IF NOT EXISTS usuarios (
  id_usuario          SERIAL PRIMARY KEY,
  id_rol              INTEGER REFERENCES roles(id_rol),
  id_recurso          INTEGER UNIQUE REFERENCES recursos_humanos(id_recurso),
  correo_corporativo  VARCHAR NOT NULL UNIQUE,
  password_hash       VARCHAR NOT NULL,
  activo              BOOLEAN NOT NULL DEFAULT TRUE,
  fecha_ultimo_acceso TIMESTAMP
);

-- =========================================================================
-- 3. ENTIDADES OPERATIVAS
-- =========================================================================

CREATE TABLE IF NOT EXISTS aplicaciones (
  id_aplicacion         SERIAL PRIMARY KEY,
  acronimo              VARCHAR NOT NULL,
  descripcion_funcional TEXT,
  tecnologia_lenguaje   VARCHAR,
  manejador_base_datos  VARCHAR,
  criticidad_remedy     VARCHAR
);

CREATE TABLE IF NOT EXISTS proyectos_iniciativas (
  id_proyecto         SERIAL PRIMARY KEY,
  nombre_proyecto     VARCHAR NOT NULL,
  tipo_esfuerzo       VARCHAR,
  metodologia_trabajo VARCHAR
);

CREATE TABLE IF NOT EXISTS tickets (
  id_ticket      SERIAL PRIMARY KEY,
  id_usuario     INTEGER REFERENCES usuarios(id_usuario),
  descripcion    TEXT,
  estatus_actual VARCHAR
);

-- =========================================================================
-- 4. NÚCLEO DOCUMENTAL Y RELACIONES
-- =========================================================================

CREATE TABLE IF NOT EXISTS documentos (
  id_documento              UUID PRIMARY KEY,
  id_tipo_documento         INTEGER REFERENCES catalogo_tipos_documento(id_tipo_documento),
  id_plantilla              INTEGER REFERENCES plantillas_mdap(id_plantilla),
  id_proyecto               INTEGER REFERENCES proyectos_iniciativas(id_proyecto),
  id_aplicacion             INTEGER REFERENCES aplicaciones(id_aplicacion),
  titulo_documento          VARCHAR NOT NULL,
  version_actual            INTEGER NOT NULL DEFAULT 1,
  fecha_ultima_modificacion TIMESTAMP NOT NULL DEFAULT now(),
  estatus_aceptacion        VARCHAR,
  conteo_rechazos           INTEGER NOT NULL DEFAULT 0,
  ruta_repositorio          VARCHAR NOT NULL,
  firma_electronica         JSON,
  ia_embedding              vector(1536)
);

CREATE TABLE IF NOT EXISTS historico_versiones (
  id_version         SERIAL PRIMARY KEY,
  id_documento       UUID    REFERENCES documentos(id_documento),
  numero_version     INTEGER NOT NULL,
  ruta_repositorio   VARCHAR NOT NULL,
  fecha_modificacion TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS matriz_raci (
  id_asignacion SERIAL PRIMARY KEY,
  id_documento  UUID    REFERENCES documentos(id_documento),
  id_recurso    INTEGER REFERENCES recursos_humanos(id_recurso),
  rol_asignado  VARCHAR
);

-- =========================================================================
-- 5. HISTORIAL Y AUDITORÍA
-- =========================================================================

CREATE TABLE IF NOT EXISTS audit_log (
  id_evento           SERIAL PRIMARY KEY,
  id_usuario          INTEGER REFERENCES usuarios(id_usuario),
  id_entidad_afectada VARCHAR,
  tipo_accion         VARCHAR,
  timestamp_exacto    TIMESTAMP NOT NULL DEFAULT now(),
  ip_direccion        VARCHAR(45),
  detalles_extra      JSONB
);

CREATE TABLE IF NOT EXISTS ticket_historial (
  id_historial         SERIAL PRIMARY KEY,
  id_ticket            INTEGER REFERENCES tickets(id_ticket),
  estatus_anterior     VARCHAR,
  estatus_nuevo        VARCHAR,
  entidad_responsable  VARCHAR,
  fecha_cambio         TIMESTAMP NOT NULL DEFAULT now()
);

-- =========================================================================
-- 6. ÍNDICES
-- =========================================================================

CREATE INDEX IF NOT EXISTS idx_usuarios_correo           ON usuarios(correo_corporativo);
CREATE INDEX IF NOT EXISTS idx_usuarios_rol              ON usuarios(id_rol);
CREATE INDEX IF NOT EXISTS idx_usuarios_activo           ON usuarios(activo);
CREATE INDEX IF NOT EXISTS idx_recursos_area             ON recursos_humanos(id_area);

CREATE INDEX IF NOT EXISTS idx_documentos_tipo           ON documentos(id_tipo_documento);
CREATE INDEX IF NOT EXISTS idx_documentos_plantilla      ON documentos(id_plantilla);
CREATE INDEX IF NOT EXISTS idx_documentos_proyecto       ON documentos(id_proyecto);
CREATE INDEX IF NOT EXISTS idx_documentos_aplicacion     ON documentos(id_aplicacion);
CREATE INDEX IF NOT EXISTS idx_documentos_estatus        ON documentos(estatus_aceptacion);
CREATE INDEX IF NOT EXISTS idx_documentos_embedding      ON documentos USING hnsw (ia_embedding vector_cosine_ops);

CREATE INDEX IF NOT EXISTS idx_historico_versiones_doc   ON historico_versiones(id_documento);
CREATE INDEX IF NOT EXISTS idx_matriz_raci_documento     ON matriz_raci(id_documento);
CREATE INDEX IF NOT EXISTS idx_matriz_raci_recurso       ON matriz_raci(id_recurso);

CREATE INDEX IF NOT EXISTS idx_audit_log_usuario         ON audit_log(id_usuario);
CREATE INDEX IF NOT EXISTS idx_audit_log_tipo            ON audit_log(tipo_accion);
CREATE INDEX IF NOT EXISTS idx_audit_log_fecha           ON audit_log(timestamp_exacto);
CREATE INDEX IF NOT EXISTS idx_audit_log_entidad         ON audit_log(id_entidad_afectada);
CREATE INDEX IF NOT EXISTS idx_audit_log_detalles        ON audit_log USING GIN (detalles_extra);

CREATE INDEX IF NOT EXISTS idx_tickets_usuario           ON tickets(id_usuario);
CREATE INDEX IF NOT EXISTS idx_ticket_historial_ticket   ON ticket_historial(id_ticket);
