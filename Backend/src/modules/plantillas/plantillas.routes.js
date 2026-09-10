/**
 * modules/plantillas/plantillas.routes.js
 */

import {
  listPlantillasController,
  getPlantillaController,
  createPlantillaController,
  updatePlantillaController,
  deletePlantillaController,
} from './plantillas.controller.js'

const idParamSchema = { type: 'object', required: ['id'], properties: { id: { type: 'integer', minimum: 1 } } }
const listQuerySchema = {
  type: 'object',
  properties: {
    page: { type: 'integer', minimum: 1, default: 1 },
    pageSize: { type: 'integer', minimum: 1, maximum: 100, default: 50 },
    q: { type: 'string', maxLength: 200 },
  },
}
const createSchema = {
  type: 'object',
  required: ['nombre_plantilla'],
  properties: {
    nombre_plantilla: { type: 'string', minLength: 3, maxLength: 300 },
    descripcion: { type: 'string', maxLength: 2000, nullable: true },
    estructura_json: { type: 'object' },
    version: { type: 'integer', minimum: 1, default: 1 },
  },
  additionalProperties: false,
}
const updateSchema = {
  type: 'object',
  properties: {
    nombre_plantilla: { type: 'string', minLength: 3, maxLength: 300 },
    descripcion: { type: 'string', maxLength: 2000, nullable: true },
    estructura_json: { type: 'object' },
    version: { type: 'integer', minimum: 1 },
  },
  additionalProperties: false,
  minProperties: 1,
}

export async function plantillasRoutes(app) {
  const ADMIN = { preHandler: [app.requireRole(['SuperAdministrador', 'Administrador'])] }
  const AUTHED = { preHandler: [app.authenticate] }

  app.get('/api/plantillas', { ...AUTHED, schema: { querystring: listQuerySchema }, handler: listPlantillasController })
  app.get('/api/plantillas/:id', { ...AUTHED, schema: { params: idParamSchema }, handler: getPlantillaController })
  app.post('/api/plantillas', { ...ADMIN, schema: { body: createSchema }, handler: createPlantillaController })
  app.patch('/api/plantillas/:id', { ...ADMIN, schema: { params: idParamSchema, body: updateSchema }, handler: updatePlantillaController })
  app.delete('/api/plantillas/:id', { ...ADMIN, schema: { params: idParamSchema }, handler: deletePlantillaController })
}
