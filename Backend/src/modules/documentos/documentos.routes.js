/**
 * modules/documentos/documentos.routes.js
 *
 * Fix (limpieza F1/F2): el patrón anterior `preHandler: [app => app.authenticate]`
 * NO ejecutaba el guard — Fastify recibía una función que retornaba el handler
 * sin invocarlo, dejando las rutas efectivamente sin protección.
 * Ahora los guards se resuelven dentro del plugin, con `app` en scope.
 */

import {
  listDocumentosController,
  getDocumentoController,
  createDocumentoController,
  updateDocumentoController,
  deleteDocumentoController,
  uploadVersionController,
} from './documentos.controller.js'
import {
  idParamSchema,
  listQuerySchema,
  createDocumentoSchema,
  updateDocumentoSchema,
} from './documentos.schemas.js'

export async function documentosRoutes(app) {
  const authed = { preHandler: [app.authenticate] }
  const admin = { preHandler: [app.requireRole(['SuperAdministrador', 'Administrador'])] }
  const superAdmin = { preHandler: [app.requireRole('SuperAdministrador')] }

  // Lectura para cualquier usuario autenticado
  app.get('/api/documentos', { ...authed, schema: { querystring: listQuerySchema }, handler: listDocumentosController })
  app.get('/api/documentos/:id', { ...authed, schema: { params: idParamSchema }, handler: getDocumentoController })

  // Crear documento: cualquier usuario autenticado
  app.post('/api/documentos', { ...authed, schema: { body: createDocumentoSchema }, handler: createDocumentoController })
  app.patch('/api/documentos/:id', { ...admin, schema: { params: idParamSchema, body: updateDocumentoSchema }, handler: updateDocumentoController })

  // Subir nueva versión: cualquier usuario autenticado
  app.post('/api/documentos/:id/versiones', { ...authed, handler: uploadVersionController })

  // Eliminar: solo SuperAdministrador
  app.delete('/api/documentos/:id', { ...superAdmin, schema: { params: idParamSchema }, handler: deleteDocumentoController })
}
