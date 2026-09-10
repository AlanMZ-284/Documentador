-- Extensión necesaria para embeddings (búsqueda semántica con IA)
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE catalogo_tipos_documento (
    id_tipo_documento SERIAL PRIMARY KEY,
    nombre_tipo VARCHAR NOT NULL,
    metodologia_asociada VARCHAR NOT NULL -- 'Cascada', 'Ágil', 'Ambas'
);

-- Áreas corporativas del SAT (ej. AGCTI, ACMII, ACDMA)
CREATE TABLE catalogo_areas_corporativas (
    id_area SERIAL PRIMARY KEY,
    acronimo VARCHAR NOT NULL,
    nombre_area VARCHAR
);

-- Plantillas MDAP (base para generar documentos)
CREATE TABLE plantillas_mdap (
    id_plantilla SERIAL PRIMARY KEY,
    id_tipo_documento INTEGER REFERENCES catalogo_tipos_documento(id_tipo_documento),
    nombre_plantilla VARCHAR,
    descripcion TEXT,            -- APROBADO 05
    estructura_json JSONB,       -- APROBADO 05: secciones para F3
    version INTEGER NOT NULL DEFAULT 1, -- APROBADO 05
    activa BOOLEAN DEFAULT true
);

-- Roles del sistema (Administrador, Legal, PMO, Consultor, Revisor, etc.)
CREATE TABLE roles (
    id_rol SERIAL PRIMARY KEY,
    nombre_rol VARCHAR NOT NULL UNIQUE, -- APROBADO 05: requerido por seed/bootstrap (ON CONFLICT)
    permisos JSONB 
);

CREATE TABLE recursos_humanos (
    id_recurso SERIAL PRIMARY KEY,
    id_area INTEGER REFERENCES catalogo_areas_corporativas(id_area),
    nombre_completo VARCHAR NOT NULL,
    perfil_tipo VARCHAR, -- Arquitecto, Desarrollador, Analista, etc.
    cedula_profesional VARCHAR,
    certificaciones_vigentes TEXT,
    correo_institucional VARCHAR UNIQUE, -- APROBADO 05
    puesto VARCHAR(100)                  -- APROBADO 05
);

CREATE TABLE usuarios (
    id_usuario SERIAL PRIMARY KEY,
    id_rol INTEGER REFERENCES roles(id_rol),
    id_recurso INTEGER UNIQUE REFERENCES recursos_humanos(id_recurso),
    correo_corporativo VARCHAR NOT NULL UNIQUE,
    password_hash VARCHAR NOT NULL,
    activo BOOLEAN DEFAULT true,
    fecha_ultimo_acceso TIMESTAMPTZ,
    fecha_creacion TIMESTAMPTZ NOT NULL DEFAULT now(),     -- APROBADO 05
    fecha_modificacion TIMESTAMPTZ NOT NULL DEFAULT now()  -- APROBADO 05
);

CREATE TABLE aplicaciones (
    id_aplicacion SERIAL PRIMARY KEY,
    acronimo VARCHAR NOT NULL,
    nombre_app VARCHAR(255), -- APROBADO 05: nombre amigable
    descripcion_funcional TEXT,
    tecnologia_lenguaje VARCHAR,
    manejador_base_datos VARCHAR,
    criticidad_remedy VARCHAR -- Alta, Media, Baja
);

-- Proyectos / Iniciativas TIC del SAT
CREATE TABLE proyectos_iniciativas (
    id_proyecto SERIAL PRIMARY KEY,
    nombre_proyecto VARCHAR NOT NULL,
    tipo_esfuerzo VARCHAR, -- DS (Desarrollo) o DBI (Business Intelligence)
    metodologia_trabajo VARCHAR -- Cascada, Ágil, Híbrido
);

-- Tickets de soporte o incidencias
CREATE TABLE tickets (
    id_ticket SERIAL PRIMARY KEY,
    id_usuario INTEGER REFERENCES usuarios(id_usuario),
    descripcion TEXT,
    estatus_actual VARCHAR
);

-- Fases del proyecto (ej. Análisis, Arquitectura, Desarrollo, Pruebas, Liberación, Cierre)
CREATE TABLE fases_proyecto (
    id_fase SERIAL PRIMARY KEY,
    id_proyecto INTEGER NOT NULL REFERENCES proyectos_iniciativas(id_proyecto) ON DELETE CASCADE,
    nombre_fase VARCHAR NOT NULL,
    estatus_fase VARCHAR NOT NULL, -- Pendiente, En curso, Cerrada, Cancelada
    orden_ejecucion INTEGER,
    fecha_inicio DATE,
    fecha_fin DATE,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Actividades dentro de cada fase (con entregable esperado)
CREATE TABLE actividades_proyecto (
    id_actividad SERIAL PRIMARY KEY,
    id_fase INTEGER NOT NULL REFERENCES fases_proyecto(id_fase) ON DELETE CASCADE,
    nombre_actividad VARCHAR NOT NULL,
    estatus_actividad VARCHAR NOT NULL, -- Pendiente, En revisión, Autorizada, Rechazada
    fecha_limite DATE,
    entregable_esperado VARCHAR, -- Descripción del entregable asociado a esta actividad
    orden INTEGER,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE documentos (
    id_documento UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_tipo_documento INTEGER REFERENCES catalogo_tipos_documento(id_tipo_documento),
    id_plantilla INTEGER REFERENCES plantillas_mdap(id_plantilla),
    id_proyecto INTEGER NULL REFERENCES proyectos_iniciativas(id_proyecto), 
    id_aplicacion INTEGER REFERENCES aplicaciones(id_aplicacion),
    titulo_documento VARCHAR NOT NULL,
    version_actual INTEGER DEFAULT 1,
    fecha_ultima_modificacion TIMESTAMPTZ DEFAULT now(),
    estatus_aceptacion VARCHAR, -- En revisión, Aprobado, Rechazado, Firmado
    conteo_rechazos INTEGER DEFAULT 0,
    ruta_repositorio VARCHAR NOT NULL, -- URL a SATCloud, SharePoint, GitLab, etc.
    firma_electronica JSONB,
    ia_embedding VECTOR(1536), -- FIX: dimensión requerida por el índice ivfflat (alineado a Docker) -- Representación vectorial para búsqueda semántica
    fecha_creacion TIMESTAMPTZ NOT NULL DEFAULT now(),         -- APROBADO 05
    fecha_modificacion TIMESTAMPTZ NOT NULL DEFAULT now(),     -- APROBADO 05
    id_usuario_creador INTEGER REFERENCES usuarios(id_usuario) -- APROBADO 05
);

-- Tabla puente: Asocia un documento con la actividad que lo genera (entregable)
-- Una actividad puede tener varios documentos (versiones o múltiples entregables)
CREATE TABLE entregables_documentos (
    id_entregable_doc SERIAL PRIMARY KEY,
    id_actividad INTEGER NOT NULL REFERENCES actividades_proyecto(id_actividad) ON DELETE CASCADE,
    id_documento UUID NOT NULL REFERENCES documentos(id_documento) ON DELETE CASCADE,
    es_obligatorio BOOLEAN DEFAULT true,
    fecha_asignacion TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE historico_versiones (
    id_version SERIAL PRIMARY KEY,
    id_documento UUID REFERENCES documentos(id_documento) ON DELETE CASCADE,
    numero_version INTEGER NOT NULL,
    ruta_repositorio VARCHAR NOT NULL,
    fecha_modificacion TIMESTAMPTZ DEFAULT now()
);

-- Matriz RACI: asigna roles (Responsable, Autoriza, Consultado, Informado) a recursos humanos
-- por documento o por fase (si id_fase no es NULL, aplica a toda la fase)
CREATE TABLE matriz_raci (
    id_asignacion SERIAL PRIMARY KEY,
    id_documento UUID REFERENCES documentos(id_documento) ON DELETE CASCADE,
    id_fase INTEGER NULL REFERENCES fases_proyecto(id_fase) ON DELETE CASCADE, -- NULL si es específico de documento
    id_recurso INTEGER REFERENCES recursos_humanos(id_recurso),
    rol_asignado VARCHAR -- Responsable, Autoriza, Consultado, Informado
);

-- Registro de todos los eventos del sistema (login, creación, modificación, firma, etc.)
CREATE TABLE audit_log (
    id_evento SERIAL PRIMARY KEY,
    id_usuario INTEGER REFERENCES usuarios(id_usuario),
    id_entidad_afectada VARCHAR, -- UUID o ID de la entidad modificada
    tipo_accion VARCHAR, -- INSERT, UPDATE, DELETE, VIEW, SIGN, REJECT
    timestamp_exacto TIMESTAMPTZ DEFAULT now(),
    ip_direccion VARCHAR(45),
    detalles_extra JSONB
);

-- Historial específico de tickets (seguimiento de estatus)
CREATE TABLE ticket_historial (
    id_historial SERIAL PRIMARY KEY,
    id_ticket INTEGER REFERENCES tickets(id_ticket) ON DELETE CASCADE,
    estatus_anterior VARCHAR,
    estatus_nuevo VARCHAR,
    entidad_responsable VARCHAR, -- SAT o Proveedor
    fecha_cambio TIMESTAMPTZ DEFAULT now()
);

-- APROBADO 06: sesiones activas (logout real / invalidación de tokens)
CREATE TABLE sesiones_activas (
    id SERIAL PRIMARY KEY,
    id_usuario INTEGER NOT NULL REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
    token_hash VARCHAR(512) NOT NULL UNIQUE,
    ip_direccion VARCHAR(45),
    user_agent TEXT,
    fecha_creacion TIMESTAMPTZ NOT NULL DEFAULT now(),
    fecha_expiracion TIMESTAMPTZ NOT NULL
);

-- Migración 02 (ya en Docker): configuración key-value de la aplicación
CREATE TABLE config_sistema (
    clave VARCHAR(64) PRIMARY KEY,
    valor_json JSONB NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by INTEGER REFERENCES usuarios(id_usuario)
);

-- Migración 03 (ya en Docker): archivos por documento (motor F2)
CREATE TABLE documento_archivos (
    id_archivo SERIAL PRIMARY KEY,
    id_documento UUID NOT NULL REFERENCES documentos(id_documento) ON DELETE CASCADE,
    ruta_s3_key VARCHAR(512) NOT NULL UNIQUE,
    nombre_original VARCHAR(255) NOT NULL,
    safe_filename VARCHAR(255) NOT NULL,
    extension VARCHAR(20),
    mime_type VARCHAR(127),
    tamano_bytes BIGINT NOT NULL CHECK (tamano_bytes >= 0),
    hash_sha256 CHAR(64) NOT NULL,
    categoria VARCHAR(64),
    lenguaje VARCHAR(32),
    encoding VARCHAR(32),
    frameworks_detectados JSONB NOT NULL DEFAULT '[]'::jsonb,
    simbolos_extraidos JSONB NOT NULL DEFAULT '[]'::jsonb,
    metadata_estructural JSONB NOT NULL DEFAULT '{}'::jsonb,
    estado_analisis VARCHAR(32) NOT NULL DEFAULT 'pendiente',
    error_analisis TEXT,
    fecha_subida TIMESTAMPTZ NOT NULL DEFAULT now(),
    fecha_ultimo_analisis TIMESTAMPTZ
);

-- Migración 04 (ya en Docker): metadata agregada por proyecto
CREATE TABLE proyectos_metadata (
    id_proyecto_metadata SERIAL PRIMARY KEY,
    id_proyecto INTEGER NOT NULL UNIQUE REFERENCES proyectos_iniciativas(id_proyecto) ON DELETE CASCADE,
    frameworks JSONB NOT NULL DEFAULT '[]'::jsonb,
    lenguajes JSONB NOT NULL DEFAULT '[]'::jsonb,
    total_archivos INTEGER NOT NULL DEFAULT 0,
    total_lineas_codigo BIGINT NOT NULL DEFAULT 0,
    tamano_total_bytes BIGINT NOT NULL DEFAULT 0,
    tiene_tests BOOLEAN NOT NULL DEFAULT FALSE,
    tiene_ci BOOLEAN NOT NULL DEFAULT FALSE,
    tiene_docker BOOLEAN NOT NULL DEFAULT FALSE,
    tiene_linter BOOLEAN NOT NULL DEFAULT FALSE,
    manifests_encontrados JSONB NOT NULL DEFAULT '[]'::jsonb,
    fecha_calculo TIMESTAMPTZ NOT NULL DEFAULT now(),
    version_calculo INTEGER NOT NULL DEFAULT 1
);

-- Migración 04 (ya en Docker): dependencias por manifest
CREATE TABLE manifest_dependencias (
    id_dependencia SERIAL PRIMARY KEY,
    id_proyecto INTEGER NOT NULL REFERENCES proyectos_iniciativas(id_proyecto) ON DELETE CASCADE,
    tipo_manifest VARCHAR(32) NOT NULL,
    nombre_paquete VARCHAR(255) NOT NULL,
    version_requerida VARCHAR(127),
    version_instalada VARCHAR(127),
    es_dev_dependency BOOLEAN NOT NULL DEFAULT FALSE,
    raw_data JSONB,
    fecha_extraccion TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(id_proyecto, tipo_manifest, nombre_paquete)
);

CREATE INDEX idx_documentos_proyecto ON documentos(id_proyecto);
CREATE INDEX idx_documentos_tipo ON documentos(id_tipo_documento);
CREATE INDEX idx_actividades_fase ON actividades_proyecto(id_fase);
CREATE INDEX idx_fases_proyecto ON fases_proyecto(id_proyecto);
CREATE INDEX idx_entregables_actividad ON entregables_documentos(id_actividad);
CREATE INDEX idx_matriz_raci_documento ON matriz_raci(id_documento);
CREATE INDEX idx_audit_log_usuario ON audit_log(id_usuario);
CREATE INDEX idx_audit_log_fecha ON audit_log(timestamp_exacto);

-- Índice para búsqueda semántica con pgvector (IVFFlat o HNSW)
-- Requiere que la extensión vector esté instalada
CREATE INDEX idx_documentos_embedding ON documentos USING ivfflat (ia_embedding vector_cosine_ops);

-- Índices de tablas aprobadas (05, 06) y de Docker (02-04)
CREATE UNIQUE INDEX uq_roles_nombre_rol ON roles(nombre_rol); -- redundante con UNIQUE inline, se deja por claridad en migraciones
CREATE INDEX idx_sesiones_token ON sesiones_activas(token_hash);
CREATE INDEX idx_sesiones_usuario ON sesiones_activas(id_usuario);
CREATE INDEX idx_sesiones_expiracion ON sesiones_activas(fecha_expiracion);
CREATE INDEX idx_documentos_creador ON documentos(id_usuario_creador);
CREATE INDEX idx_documento_archivos_documento ON documento_archivos(id_documento);
CREATE INDEX idx_documento_archivos_hash ON documento_archivos(hash_sha256);
CREATE INDEX idx_proyectos_metadata_proyecto ON proyectos_metadata(id_proyecto);
CREATE INDEX idx_manifest_dependencias_proyecto ON manifest_dependencias(id_proyecto);