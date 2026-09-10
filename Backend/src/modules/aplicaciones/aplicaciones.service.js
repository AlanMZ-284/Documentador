/**
 * modules/aplicaciones/aplicaciones.service.js
 *
 * Mapea a la tabla `aplicaciones` (DBML):
 *   id_aplicacion, nombre_app, descripcion, estado, fecha_creacion, fecha_modificacion
 */

import { query } from '../../plugins/db.js'

const SELECT_APP = 'SELECT id_aplicacion, nombre_app, descripcion, estado, fecha_creacion, fecha_modificacion FROM aplicaciones'

export async function listAplicaciones({ page = 1, pageSize = 50, q, estado }) {
  const conds = []
  const params = []
  if (q) { params.push(`%${q.toLowerCase()}%`); conds.push(`LOWER(nombre_app) LIKE $${params.length}`) }
  if (estado) { params.push(estado); conds.push(`estado = $${params.length}`) }
  const where = conds.length ? `WHERE ${conds.join(' AND ')}` : ''
  const offset = (page - 1) * pageSize
  params.push(pageSize, offset)
  const { rows } = await query(`${SELECT_APP} ${where} ORDER BY nombre_app LIMIT $${params.length - 1} OFFSET $${params.length}`, params)
  const countParams = params.slice(0, params.length - 2)
  const { rows: countRows } = await query(`SELECT COUNT(*)::int AS total FROM aplicaciones ${where}`, countParams)
  return { data: rows, total: countRows[0].total, page, pageSize }
}

export async function getAplicacionById(id) {
  const { rows } = await query(`${SELECT_APP} WHERE id_aplicacion = $1 LIMIT 1`, [id])
  return rows[0] || null
}

export async function createAplicacion({ nombre_app, descripcion = null, estado = 'activo' }) {
  const { rows } = await query(
    `INSERT INTO aplicaciones (nombre_app, descripcion, estado) VALUES ($1, $2, $3) RETURNING *`,
    [nombre_app, descripcion, estado]
  )
  return rows[0]
}

export async function updateAplicacion(id, updates) {
  const fields = []
  const params = []
  let i = 1
  if (updates.nombre_app !== undefined) { fields.push(`nombre_app = $${i++}`); params.push(updates.nombre_app) }
  if (updates.descripcion !== undefined) { fields.push(`descripcion = $${i++}`); params.push(updates.descripcion) }
  if (updates.estado !== undefined)      { fields.push(`estado = $${i++}`); params.push(updates.estado) }
  if (!fields.length) return getAplicacionById(id)
  fields.push(`fecha_modificacion = now()`)
  params.push(id)
  await query(`UPDATE aplicaciones SET ${fields.join(', ')} WHERE id_aplicacion = $${i}`, params)
  return getAplicacionById(id)
}

export async function deleteAplicacion(id) {
  const { rowCount } = await query('DELETE FROM aplicaciones WHERE id_aplicacion = $1', [id])
  return rowCount > 0
}
