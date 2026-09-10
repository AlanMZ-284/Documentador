-- 03_documento_archivos.sql
-- Tabla hija de documentos: cada archivo subido (individual o extraído de ZIP)
-- vive aquí. F2.5 persiste hash y metadatos; el contenido_texto NO va a PG
-- (se procesa on-demand en F3 → chunks + embeddings).

CREATE TABLE IF NOT EXISTS documento_archivos (
  id_archivo              SERIAL PRIMARY KEY,
  id_documento            UUID    NOT NULL REFERENCES documentos(id_documento) ON DELETE CASCADE,

  -- Identidad y ruta en S3/MinIO
  ruta_s3_key             VARCHAR(512) NOT NULL UNIQUE,
  nombre_original         VARCHAR(255) NOT NULL,
  safe_filename           VARCHAR(255) NOT NULL,
  extension               VARCHAR(20),
  mime_type               VARCHAR(127),
  tamano_bytes            BIGINT  NOT NULL CHECK (tamano_bytes >= 0),
  hash_sha256             CHAR(64) NOT NULL,

  -- Clasificación
  categoria               VARCHAR(64),  -- 'codigo', 'config', 'documentacion', 'recurso', 'binario'
  lenguaje                VARCHAR(32),  -- 'javascript', 'python', 'json', etc.
  encoding                VARCHAR(32),  -- 'utf-8', 'iso-8859-1'

  -- Análisis de frameworks (F2.5: regex, F3: tree-sitter)
  frameworks_detectados   JSONB   NOT NULL DEFAULT '[]'::jsonb,
  simbolos_extraidos      JSONB   NOT NULL DEFAULT '[]'::jsonb,
  metadata_estructural    JSONB   NOT NULL DEFAULT '{}'::jsonb,

  -- Estado del pipeline
  estado_analisis         VARCHAR(32) NOT NULL DEFAULT 'pendiente',
  error_analisis          TEXT,

  -- Auditoría
  fecha_subida            TIMESTAMPTZ NOT NULL DEFAULT now(),
  fecha_ultimo_analisis   TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_documento_archivos_documento  ON documento_archivos(id_documento);
CREATE INDEX IF NOT EXISTS idx_documento_archivos_hash       ON documento_archivos(hash_sha256);
CREATE INDEX IF NOT EXISTS idx_documento_archivos_categoria  ON documento_archivos(categoria);
CREATE INDEX IF NOT EXISTS idx_documento_archivos_lenguaje   ON documento_archivos(lenguaje);
CREATE INDEX IF NOT EXISTS idx_documento_archivos_estado     ON documento_archivos(estado_analisis);
CREATE INDEX IF NOT EXISTS idx_documento_archivos_frameworks ON documento_archivos USING GIN (frameworks_detectados);
