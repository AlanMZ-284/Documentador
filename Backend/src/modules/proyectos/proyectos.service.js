/**
 * modules/proyectos/proyectos.service.js
 *
 * Mapea a `proyectos_iniciativas` (DBML):
 *   id_proyecto, nombre_proyecto, descripcion, id_recurso_lider, fecha_inicio, fecha_fin, estatus
 */

import { query } from '../../plugins/db.js'

const SELECT_PROY = `
  SELECT p.id_proyecto, p.nombre_proyecto, p.descripcion, p.id_recurso_lider,
         p.fecha_inicio, p.fecha_fin, p.estatus, p.fecha_creacion, p.fecha_modificacion,
         rh.nombre_completo AS lider_nombre
  FROM proyectos_iniciativas p
  LEFT JOIN recursos_humanos rh ON rh.id_recurso = p.id_recurso_lider
`

export async function listProyectos({ page = 1, pageSize = 20, q, estatus }) {
  const conds = []
  const params = []
  if (q) { params.push(`%${q.toLowerCase()}%`); conds.push(`LOWER(p.nombre_proyecto) LIKE $${params.length}`) }
  if (estatus) { params.push(estatus); conds.push(`p.estatus = $${params.length}`) }
  const where = conds.length ? `WHERE ${conds.join(' AND ')}` : ''
  const offset = (page - 1) * pageSize
  params.push(pageSize, offset)
  const { rows } = await query(`${SELECT_PROY} ${where} ORDER BY p.fecha_creacion DESC LIMIT $${params.length - 1} OFFSET $${params.length}`, params)
  const countParams = params.slice(0, params.length - 2)
  const { rows: countRows } = await query(`SELECT COUNT(*)::int AS total FROM proyectos_iniciativas p ${where}`, countParams)
  return { data: rows, total: countRows[0].total, page, pageSize }
}

export async function getProyectoById(id) {
  const { rows } = await query(`${SELECT_PROY} WHERE p.id_proyecto = $1 LIMIT 1`, [id])
  return rows[0] || null
}

export async function createProyecto({ nombre_proyecto, descripcion = null, id_recurso_lider = null, fecha_inicio = null, fecha_fin = null, estatus = 'planeacion' }) {
  const { rows } = await query(
    `INSERT INTO proyectos_iniciativas (nombre_proyecto, descripcion, id_recurso_lider, fecha_inicio, fecha_fin, estatus)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
    [nombre_proyecto, descripcion, id_recurso_lider, fecha_inicio, fecha_fin, estatus]
  )
  return rows[0]
}

export async function updateProyecto(id, updates) {
  const fields = []
  const params = []
  let i = 1
  if (updates.nombre_proyecto !== undefined) { fields.push(`nombre_proyecto = $${i++}`); params.push(updates.nombre_proyecto) }
  if (updates.descripcion !== undefined)      { fields.push(`descripcion = $${i++}`); params.push(updates.descripcion) }
  if (updates.id_recurso_lider !== undefined) { fields.push(`id_recurso_lider = $${i++}`); params.push(updates.id_recurso_lider) }
  if (updates.fecha_inicio !== undefined)     { fields.push(`fecha_inicio = $${i++}`); params.push(updates.fecha_inicio) }
  if (updates.fecha_fin !== undefined)        { fields.push(`fecha_fin = $${i++}`); params.push(updates.fecha_fin) }
  if (updates.estatus !== undefined)          { fields.push(`estatus = $${i++}`); params.push(updates.estatus) }
  if (!fields.length) return getProyectoById(id)
  fields.push(`fecha_modificacion = now()`)
  params.push(id)
  await query(`UPDATE proyectos_iniciativas SET ${fields.join(', ')} WHERE id_proyecto = $${i}`, params)
  return getProyectoById(id)
}

export async function deleteProyecto(id) {
  const { rowCount } = await query('DELETE FROM proyectos_iniciativas WHERE id_proyecto = $1', [id])
  return rowCount > 0
}
