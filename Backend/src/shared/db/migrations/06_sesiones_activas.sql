-- 06_sesiones_activas.sql
-- Propuesta B (APROBADA): tabla referenciada por auth.service.js
-- (registerSession / revokeSession) que existía solo en el Docker de algunos
-- entornos y no en los archivos del proyecto.
-- Sin ella, el logout no invalida tokens realmente.

CREATE TABLE IF NOT EXISTS sesiones_activas (
  id               SERIAL PRIMARY KEY,
  id_usuario       INTEGER NOT NULL REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
  token_hash       VARCHAR(512) NOT NULL UNIQUE,
  ip_direccion     VARCHAR(45),
  user_agent       TEXT,
  fecha_creacion   TIMESTAMPTZ NOT NULL DEFAULT now(),
  fecha_expiracion TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_sesiones_token      ON sesiones_activas(token_hash);
CREATE INDEX IF NOT EXISTS idx_sesiones_usuario    ON sesiones_activas(id_usuario);
CREATE INDEX IF NOT EXISTS idx_sesiones_expiracion ON sesiones_activas(fecha_expiracion);

-- Limpieza de sesiones vencidas: se puede ejecutar vía cron/worker.
-- DELETE FROM sesiones_activas WHERE fecha_expiracion < now();
