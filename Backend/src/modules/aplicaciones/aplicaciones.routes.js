/**
 * modules/aplicaciones/aplicaciones.routes.js
 */

import {
  listAplicacionesController,
  getAplicacionController,
  createAplicacionController,
  updateAplicacionController,
  deleteAplicacionController,
} from './aplicaciones.controller.js'

const idParamSchema = { type: 'object', required: ['id'], properties: { id: { type: 'integer', minimum: 1 } } }
const listQuerySchema = {
  type: 'object',
  properties: {
    page: { type: 'integer', minimum: 1, default: 1 },
    pageSize: { type: 'integer', minimum: 1, maximum: 100, default: 50 },
    q: { type: 'string', maxLength: 200 },
    estado: { type: 'string', enum: ['activo', 'inactivo', 'mantenimiento'] },
  },
}
const createSchema = {
  type: 'object',
  required: ['nombre_app'],
  properties: {
    nombre_app: { type: 'string', minLength: 2, maxLength: 200 },
    descripcion: { type: 'string', maxLength: 1000, nullable: true },
    estado: { type: 'string', enum: ['activo', 'inactivo', 'mantenimiento'] },
  },
  additionalProperties: false,
}
const updateSchema = {
  type: 'object',
  properties: {
    nombre_app: { type: 'string', minLength: 2, maxLength: 200 },
    descripcion: { type: 'string', maxLength: 1000, nullable: true },
    estado: { type: 'string', enum: ['activo', 'inactivo', 'mantenimiento'] },
  },
  additionalProperties: false,
  minProperties: 1,
}

export async function aplicacionesRoutes(app) {
  const ADMIN = { preHandler: [app.requireRole(['SuperAdministrador', 'Administrador'])] }
  const AUTHED = { preHandler: [app.authenticate] }

  app.get('/api/aplicaciones', { ...AUTHED, schema: { querystring: listQuerySchema }, handler: listAplicacionesController })
  app.get('/api/aplicaciones/:id', { ...AUTHED, schema: { params: idParamSchema }, handler: getAplicacionController })
  app.post('/api/aplicaciones', { ...ADMIN, schema: { body: createSchema }, handler: createAplicacionController })
  app.patch('/api/aplicaciones/:id', { ...ADMIN, schema: { params: idParamSchema, body: updateSchema }, handler: updateAplicacionController })
  app.delete('/api/aplicaciones/:id', { ...ADMIN, schema: { params: idParamSchema }, handler: deleteAplicacionController })
}
