/**
 * modules/matriz-raci/matriz-raci.routes.js
 */

import {
  listRaciController,
  createAsignacionController,
  updateAsignacionController,
  deleteAsignacionController,
} from './matriz-raci.controller.js'

const docIdParamSchema = { type: 'object', required: ['id'], properties: { id: { type: 'string', format: 'uuid' } } }
const asgIdParamSchema = {
  type: 'object',
  required: ['id', 'idAsignacion'],
  properties: { id: { type: 'string', format: 'uuid' }, idAsignacion: { type: 'integer', minimum: 1 } },
}
const createSchema = {
  type: 'object',
  required: ['id_recurso', 'rol_raci'],
  properties: {
    id_recurso: { type: 'integer', minimum: 1 },
    rol_raci: { type: 'string', enum: ['R', 'A', 'C', 'I'] },
    comentarios: { type: 'string', maxLength: 1000, nullable: true },
  },
  additionalProperties: false,
}
const updateSchema = {
  type: 'object',
  properties: {
    rol_raci: { type: 'string', enum: ['R', 'A', 'C', 'I'] },
    comentarios: { type: 'string', maxLength: 1000, nullable: true },
  },
  additionalProperties: false,
  minProperties: 1,
}

export async function matrizRaciRoutes(app) {
  const ADMIN = { preHandler: [app.requireRole(['SuperAdministrador', 'Administrador'])] }
  const AUTHED = { preHandler: [app.authenticate] }

  app.get('/api/documentos/:id/raci', { ...AUTHED, schema: { params: docIdParamSchema }, handler: listRaciController })
  app.post('/api/documentos/:id/raci', { ...ADMIN, schema: { params: docIdParamSchema, body: createSchema }, handler: createAsignacionController })
  app.patch('/api/documentos/:id/raci/:idAsignacion', { ...ADMIN, schema: { params: asgIdParamSchema, body: updateSchema }, handler: updateAsignacionController })
  app.delete('/api/documentos/:id/raci/:idAsignacion', { ...ADMIN, schema: { params: asgIdParamSchema }, handler: deleteAsignacionController })
}
