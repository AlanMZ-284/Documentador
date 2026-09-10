-- 00_extensions.sql
-- Extensiones requeridas por el esquema Documentador
-- Se ejecuta automáticamente la primera vez que se inicializa el volumen de datos.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";
