-- 02_alignment.sql
-- Crea config_sistema: tabla de configuración de APLICACIÓN (key-value JSONB).
-- IMPORTANTE: NO se usa para tracking de migraciones.
-- El migrador usa su propia meta-tabla schema_migrations (DDL hardcodeado en migrate.js).
--
-- ESTADO: provisional. Pendiente merge formal al DBML (ver docs/MEJORAS_PROPUESTAS.md #5).

CREATE TABLE IF NOT EXISTS config_sistema (
  clave        VARCHAR(64)  PRIMARY KEY,
  valor_json   JSONB        NOT NULL,
  updated_at   TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_by   INTEGER      REFERENCES usuarios(id_usuario)
);

CREATE INDEX IF NOT EXISTS idx_config_sistema_updated ON config_sistema(updated_at);
