-- 05_schema_fixes.sql
-- Propuesta A (APROBADA): columnas usadas por el código que faltaban en el esquema.
-- Origen del análisis: discrepancias entre 01_schema.sql y los services/seed.
-- Idempotente: usa ADD COLUMN IF NOT EXISTS.

-- ─────────────────────────────────────────────────────────────────────────
-- roles: el seed y el bootstrap usan ON CONFLICT (nombre_rol); requiere UNIQUE.
-- (Adenda a Propuesta A — sin esto, npm run seed falla en cualquier entorno.)
-- ─────────────────────────────────────────────────────────────────────────
CREATE UNIQUE INDEX IF NOT EXISTS uq_roles_nombre_rol ON roles(nombre_rol);

-- ─────────────────────────────────────────────────────────────────────────
-- usuarios: timestamps de auditoría leídos por usuarios.service.js.
-- (Adenda a Propuesta A — los SELECT del módulo usuarios las requieren.)
-- ─────────────────────────────────────────────────────────────────────────
ALTER TABLE usuarios
  ADD COLUMN IF NOT EXISTS fecha_creacion     TIMESTAMPTZ NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS fecha_modificacion TIMESTAMPTZ NOT NULL DEFAULT now();

-- ─────────────────────────────────────────────────────────────────────────
-- documentos: el código (documentos.service.js) usa fecha_creacion y
-- fecha_modificacion por separado, además del usuario creador.
-- fecha_ultima_modificacion (legacy del DBML) se mantiene por compatibilidad.
-- ─────────────────────────────────────────────────────────────────────────
ALTER TABLE documentos
  ADD COLUMN IF NOT EXISTS fecha_creacion      TIMESTAMPTZ NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS fecha_modificacion  TIMESTAMPTZ NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS id_usuario_creador  INTEGER REFERENCES usuarios(id_usuario);

CREATE INDEX IF NOT EXISTS idx_documentos_creador ON documentos(id_usuario_creador);
CREATE INDEX IF NOT EXISTS idx_documentos_fecha_creacion ON documentos(fecha_creacion);

-- ─────────────────────────────────────────────────────────────────────────
-- aplicaciones: nombre amigable usado en el JOIN de documentos.service.js
-- ─────────────────────────────────────────────────────────────────────────
ALTER TABLE aplicaciones
  ADD COLUMN IF NOT EXISTS nombre_app VARCHAR(255);

-- ─────────────────────────────────────────────────────────────────────────
-- recursos_humanos: campos requeridos por seed.js y útiles para la matriz RACI
-- ─────────────────────────────────────────────────────────────────────────
ALTER TABLE recursos_humanos
  ADD COLUMN IF NOT EXISTS correo_institucional VARCHAR(255),
  ADD COLUMN IF NOT EXISTS puesto               VARCHAR(100);

-- UNIQUE como índice parcial (permite NULLs múltiples, evita duplicados reales)
CREATE UNIQUE INDEX IF NOT EXISTS uq_recursos_correo_institucional
  ON recursos_humanos(correo_institucional)
  WHERE correo_institucional IS NOT NULL;

-- ─────────────────────────────────────────────────────────────────────────
-- plantillas_mdap: estructura para descomposición de plantillas (base de F3)
-- ─────────────────────────────────────────────────────────────────────────
ALTER TABLE plantillas_mdap
  ADD COLUMN IF NOT EXISTS descripcion     TEXT,
  ADD COLUMN IF NOT EXISTS estructura_json JSONB,
  ADD COLUMN IF NOT EXISTS version         INTEGER NOT NULL DEFAULT 1;
