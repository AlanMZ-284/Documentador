/**
 * modules/usuarios/usuarios.schemas.js
 * Validación de payloads con fast-json-stringify / AJV.
 */

export const idParamSchema = {
  type: 'object',
  required: ['id'],
  properties: {
    id: { type: 'integer', minimum: 1 },
  },
}

export const listQuerySchema = {
  type: 'object',
  properties: {
    page: { type: 'integer', minimum: 1, default: 1 },
    pageSize: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
    q: { type: 'string', maxLength: 200 },
    rol: { type: 'string', enum: ['SuperAdministrador', 'Administrador', 'Usuario'] },
    activo: { type: 'string', enum: ['true', 'false'] },
  },
}

export const createUsuarioSchema = {
  type: 'object',
  required: ['id_rol', 'correo_corporativo', 'password'],
  properties: {
    id_rol: { type: 'integer', minimum: 1 },
    correo_corporativo: { type: 'string', format: 'email', maxLength: 255 },
    password: { type: 'string', minLength: 12, maxLength: 128 },
    id_recurso: { type: 'integer', minimum: 1, nullable: true },
  },
  additionalProperties: false,
}

export const updateUsuarioSchema = {
  type: 'object',
  properties: {
    id_rol: { type: 'integer', minimum: 1 },
    id_recurso: { type: 'integer', minimum: 1, nullable: true },
    activo: { type: 'boolean' },
  },
  additionalProperties: false,
  minProperties: 1,
}

export const resetPasswordSchema = {
  type: 'object',
  required: ['newPassword'],
  properties: {
    newPassword: { type: 'string', minLength: 12, maxLength: 128 },
  },
  additionalProperties: false,
}
