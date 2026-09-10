/**
 * modules/auditoria/auditoria.controller.js
 * Consulta de la tabla `audit_log` (DBML).
 * Acceso restringido a SuperAdministrador y Administrador.
 */

import { query } from '../../plugins/db.js'

const ALLOWED_FILTER_KEYS = new Set(['page', 'pageSize', 'id_usuario', 'tipo_accion', 'desde', 'hasta', 'ip', 'q'])

export async function listAuditController(request, reply) {
  const { page = 1, pageSize = 50, id_usuario, tipo_accion, desde, hasta, ip, q } = request.query
  const conds = []
  const params = []
  if (id_usuario) { params.push(Number(id_usuario)); conds.push(`id_usuario = $${params.length}`) }
  if (tipo_accion) { params.push(tipo_accion); conds.push(`tipo_accion = $${params.length}`) }
  if (desde) { params.push(desde); conds.push(`timestamp_exacto >= $${params.length}`) }
  if (hasta) { params.push(hasta); conds.push(`timestamp_exacto <= $${params.length}`) }
  if (ip) { params.push(ip); conds.push(`ip_direccion = $${params.length}`) }
  if (q) { params.push(`%${q}%`); conds.push(`(id_entidad_afectada ILIKE $${params.length} OR detalles_extra::text ILIKE $${params.length})`) }
  const where = conds.length ? `WHERE ${conds.join(' AND ')}` : ''
  const offset = (page - 1) * pageSize
  params.push(pageSize, offset)
  const { rows } = await query(
    `SELECT id_evento, id_usuario, id_entidad_afectada, tipo_accion, timestamp_exacto, ip_direccion, detalles_extra
     FROM audit_log ${where}
     ORDER BY timestamp_exacto DESC
     LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params
  )
  const countParams = params.slice(0, params.length - 2)
  const { rows: countRows } = await query(
    `SELECT COUNT(*)::int AS total FROM audit_log ${where}`,
    countParams
  )
  return reply.send({ data: rows, total: countRows[0].total, page, pageSize })
}

export async function getAuditActionsController(request, reply) {
  // Devuelve el catálogo cerrado de acciones
  const { AUDIT_ACTIONS } = await import('../../shared/utils/audit.js')
  return reply.send({ actions: Object.values(AUDIT_ACTIONS) })
}
