/**
 * modules/documentos/documentos.schemas.js
 */

export const idParamSchema = {
  type: 'object',
  required: ['id'],
  properties: { id: { type: 'string', format: 'uuid' } },
}

export const listQuerySchema = {
  type: 'object',
  properties: {
    page: { type: 'integer', minimum: 1, default: 1 },
    pageSize: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
    q: { type: 'string', maxLength: 200 },
    id_tipo_documento: { type: 'integer', minimum: 1 },
    id_proyecto: { type: 'integer', minimum: 1 },
    id_aplicacion: { type: 'integer', minimum: 1 },
    estatus_aceptacion: { type: 'string', maxLength: 64 },
  },
}

export const createDocumentoSchema = {
  type: 'object',
  required: ['id_tipo_documento', 'titulo_documento'],
  properties: {
    id_tipo_documento: { type: 'integer', minimum: 1 },
    id_plantilla: { type: 'integer', minimum: 1, nullable: true },
    id_proyecto: { type: 'integer', minimum: 1, nullable: true },
    id_aplicacion: { type: 'integer', minimum: 1, nullable: true },
    titulo_documento: { type: 'string', minLength: 3, maxLength: 500 },
    firma_electronica: { type: 'object', nullable: true },
  },
  additionalProperties: false,
}

export const updateDocumentoSchema = {
  type: 'object',
  properties: {
    titulo_documento: { type: 'string', minLength: 3, maxLength: 500 },
    id_tipo_documento: { type: 'integer', minimum: 1 },
    id_plantilla: { type: 'integer', minimum: 1, nullable: true },
    id_proyecto: { type: 'integer', minimum: 1, nullable: true },
    id_aplicacion: { type: 'integer', minimum: 1, nullable: true },
    firma_electronica: { type: 'object', nullable: true },
  },
  additionalProperties: false,
  minProperties: 1,
}

export const uploadVersionMultipart = {
  // No se valida con AJV por ser multipart; los campos se leen de request.body
}
