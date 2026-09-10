-- 07_fases_proyecto.sql
-- Propuesta C (APROBADA): trae a migración formal las tablas que existían
-- en esquema_crm.sql (archivo del proyecto) pero no en 01_schema.sql:
--   fases_proyecto, actividades_proyecto, entregables_documentos
-- y agrega la columna id_fase a matriz_raci (RACI por fase).

CREATE TABLE IF NOT EXISTS fases_proyecto (
  id_fase         SERIAL PRIMARY KEY,
  id_proyecto     INTEGER NOT NULL REFERENCES proyectos_iniciativas(id_proyecto),
  nombre_fase     VARCHAR NOT NULL,
  estatus_fase    VARCHAR NOT NULL DEFAULT 'Pendiente', -- Pendiente, En curso, Cerrada, Cancelada
  orden_ejecucion INTEGER,
  fecha_inicio    DATE,
  fecha_fin       DATE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS actividades_proyecto (
  id_actividad        SERIAL PRIMARY KEY,
  id_fase             INTEGER NOT NULL REFERENCES fases_proyecto(id_fase),
  nombre_actividad    VARCHAR NOT NULL,
  estatus_actividad   VARCHAR NOT NULL DEFAULT 'Pendiente', -- Pendiente, En revisión, Autorizada, Rechazada
  fecha_limite        DATE,
  entregable_esperado VARCHAR,
  orden               INTEGER,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabla puente: documento(s) que materializan el entregable de una actividad
CREATE TABLE IF NOT EXISTS entregables_documentos (
  id_entregable_doc SERIAL PRIMARY KEY,
  id_actividad      INTEGER NOT NULL REFERENCES actividades_proyecto(id_actividad),
  id_documento      UUID    NOT NULL REFERENCES documentos(id_documento),
  es_obligatorio    BOOLEAN NOT NULL DEFAULT TRUE,
  fecha_asignacion  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RACI por fase (NULL = asignación específica de documento)
ALTER TABLE matriz_raci
  ADD COLUMN IF NOT EXISTS id_fase INTEGER REFERENCES fases_proyecto(id_fase);

CREATE INDEX IF NOT EXISTS idx_fases_proyecto         ON fases_proyecto(id_proyecto);
CREATE INDEX IF NOT EXISTS idx_actividades_fase       ON actividades_proyecto(id_fase);
CREATE INDEX IF NOT EXISTS idx_entregables_actividad  ON entregables_documentos(id_actividad);
CREATE INDEX IF NOT EXISTS idx_entregables_documento  ON entregables_documentos(id_documento);
CREATE INDEX IF NOT EXISTS idx_matriz_raci_fase       ON matriz_raci(id_fase);
