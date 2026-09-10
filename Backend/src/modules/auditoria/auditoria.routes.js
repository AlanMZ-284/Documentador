/**
 * modules/auditoria/auditoria.routes.js
 */

import { listAuditController, getAuditActionsController } from './auditoria.controller.js'

const listQuerySchema = {
  type: 'object',
  properties: {
    page: { type: 'integer', minimum: 1, default: 1 },
    pageSize: { type: 'integer', minimum: 1, maximum: 200, default: 50 },
    id_usuario: { type: 'integer', minimum: 1 },
    tipo_accion: { type: 'string', maxLength: 64 },
    desde: { type: 'string', format: 'date-time' },
    hasta: { type: 'string', format: 'date-time' },
    ip: { type: 'string', maxLength: 45 },
    q: { type: 'string', maxLength: 200 },
  },
}

export async function auditoriaRoutes(app) {
  const ADMIN = { preHandler: [app.requireRole(['SuperAdministrador', 'Administrador'])] }
  app.get('/api/auditoria', { ...ADMIN, schema: { querystring: listQuerySchema }, handler: listAuditController })
  app.get('/api/auditoria/actions', { ...ADMIN, handler: getAuditActionsController })
}
