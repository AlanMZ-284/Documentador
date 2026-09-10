-- 04_manifests_metadata.sql
-- Metadata agregada por proyecto y manifests parseados de dependencias.

-- Metadata agregada (frameworks consolidados, lenguajes, totales)
CREATE TABLE IF NOT EXISTS proyectos_metadata (
  id_proyecto_metadata    SERIAL PRIMARY KEY,
  id_proyecto             INTEGER NOT NULL UNIQUE REFERENCES proyectos_iniciativas(id_proyecto) ON DELETE CASCADE,

  -- Frameworks y lenguajes (deduplicados de documento_archivos)
  frameworks              JSONB NOT NULL DEFAULT '[]'::jsonb,
  lenguajes               JSONB NOT NULL DEFAULT '[]'::jsonb,

  -- Totales
  total_archivos          INTEGER NOT NULL DEFAULT 0,
  total_lineas_codigo     BIGINT  NOT NULL DEFAULT 0,
  tamano_total_bytes      BIGINT  NOT NULL DEFAULT 0,

  -- Configuración detectada
  tiene_tests             BOOLEAN NOT NULL DEFAULT FALSE,
  tiene_ci                BOOLEAN NOT NULL DEFAULT FALSE,
  tiene_docker            BOOLEAN NOT NULL DEFAULT FALSE,
  tiene_linter            BOOLEAN NOT NULL DEFAULT FALSE,

  -- Manifests encontrados
  manifests_encontrados   JSONB NOT NULL DEFAULT '[]'::jsonb,

  -- Estado
  fecha_calculo           TIMESTAMPTZ NOT NULL DEFAULT now(),
  version_calculo         INTEGER NOT NULL DEFAULT 1
);

CREATE INDEX IF NOT EXISTS idx_proyectos_metadata_proyecto   ON proyectos_metadata(id_proyecto);
CREATE INDEX IF NOT EXISTS idx_proyectos_metadata_frameworks ON proyectos_metadata USING GIN (frameworks);
CREATE INDEX IF NOT EXISTS idx_proyectos_metadata_lenguajes  ON proyectos_metadata USING GIN (lenguajes);

-- Manifests parseados (dependencias externas por proyecto)
CREATE TABLE IF NOT EXISTS manifest_dependencias (
  id_dependencia          SERIAL PRIMARY KEY,
  id_proyecto             INTEGER NOT NULL REFERENCES proyectos_iniciativas(id_proyecto) ON DELETE CASCADE,

  tipo_manifest           VARCHAR(32) NOT NULL,  -- 'package.json', 'composer.json', etc.
  nombre_paquete          VARCHAR(255) NOT NULL,
  version_requerida       VARCHAR(127),
  version_instalada       VARCHAR(127),
  es_dev_dependency       BOOLEAN NOT NULL DEFAULT FALSE,

  raw_data                JSONB,
  fecha_extraccion        TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE(id_proyecto, tipo_manifest, nombre_paquete)
);

CREATE INDEX IF NOT EXISTS idx_manifest_dependencias_proyecto ON manifest_dependencias(id_proyecto);
CREATE INDEX IF NOT EXISTS idx_manifest_dependencias_tipo     ON manifest_dependencias(tipo_manifest);
CREATE INDEX IF NOT EXISTS idx_manifest_dependencias_nombre   ON manifest_dependencias(nombre_paquete);
