/**
 * modules/firmas/firmas.routes.js
 */

import {
  listFirmasController,
  firmarController,
  invalidateFirmaController,
} from './firmas.controller.js'

const docIdParamSchema = { type: 'object', required: ['id'], properties: { id: { type: 'string', format: 'uuid' } } }
const firmaIdParamSchema = {
  type: 'object',
  required: ['id', 'idFirma'],
  properties: { id: { type: 'string', format: 'uuid' }, idFirma: { type: 'integer', minimum: 1 } },
}
const firmarSchema = {
  type: 'object',
  properties: {
    tipo_firma: { type: 'string', enum: ['aprobacion', 'rechazo', 'revision', 'visto_bueno'], default: 'aprobacion' },
    payload: { type: 'string', maxLength: 1000, nullable: true },
  },
  additionalProperties: false,
}

export async function firmasRoutes(app) {
  const ADMIN = { preHandler: [app.requireRole(['SuperAdministrador', 'Administrador'])] }
  const AUTHED = { preHandler: [app.authenticate] }

  app.get('/api/documentos/:id/firmas', { ...AUTHED, schema: { params: docIdParamSchema }, handler: listFirmasController })
  app.post('/api/documentos/:id/firmas', { ...AUTHED, schema: { params: docIdParamSchema, body: firmarSchema }, handler: firmarController })
  app.post('/api/documentos/:id/firmas/:idFirma/invalidate', { ...ADMIN, schema: { params: firmaIdParamSchema }, handler: invalidateFirmaController })
}
