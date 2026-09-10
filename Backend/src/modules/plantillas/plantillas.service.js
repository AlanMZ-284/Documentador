/**
 * modules/plantillas/plantillas.service.js
 *
 * Mapea a `plantillas_mdap` (DBML):
 *   id_plantilla, nombre_plantilla, descripcion, estructura_json, version, fecha_creacion, fecha_modificacion
 */

import { query } from '../../plugins/db.js'

const SELECT_PLANTILLA = 'SELECT id_plantilla, nombre_plantilla, descripcion, estructura_json, version, fecha_creacion, fecha_modificacion FROM plantillas_mdap'

export async function listPlantillas({ page = 1, pageSize = 50, q }) {
  const conds = []
  const params = []
  if (q) { params.push(`%${q.toLowerCase()}%`); conds.push(`LOWER(nombre_plantilla) LIKE $${params.length}`) }
  const where = conds.length ? `WHERE ${conds.join(' AND ')}` : ''
  const offset = (page - 1) * pageSize
  params.push(pageSize, offset)
  const { rows } = await query(`${SELECT_PLANTILLA} ${where} ORDER BY nombre_plantilla LIMIT $${params.length - 1} OFFSET $${params.length}`, params)
  const countParams = params.slice(0, params.length - 2)
  const { rows: countRows } = await query(`SELECT COUNT(*)::int AS total FROM plantillas_mdap ${where}`, countParams)
  return { data: rows, total: countRows[0].total, page, pageSize }
}

export async function getPlantillaById(id) {
  const { rows } = await query(`${SELECT_PLANTILLA} WHERE id_plantilla = $1 LIMIT 1`, [id])
  return rows[0] || null
}

export async function createPlantilla({ nombre_plantilla, descripcion = null, estructura_json = {}, version = 1 }) {
  const { rows } = await query(
    `INSERT INTO plantillas_mdap (nombre_plantilla, descripcion, estructura_json, version)
     VALUES ($1, $2, $3, $4) RETURNING *`,
    [nombre_plantilla, descripcion, JSON.stringify(estructura_json), version]
  )
  return rows[0]
}

export async function updatePlantilla(id, updates) {
  const fields = []
  const params = []
  let i = 1
  if (updates.nombre_plantilla !== undefined) { fields.push(`nombre_plantilla = $${i++}`); params.push(updates.nombre_plantilla) }
  if (updates.descripcion !== undefined)      { fields.push(`descripcion = $${i++}`); params.push(updates.descripcion) }
  if (updates.estructura_json !== undefined)  { fields.push(`estructura_json = $${i++}`); params.push(JSON.stringify(updates.estructura_json)) }
  if (updates.version !== undefined)          { fields.push(`version = $${i++}`); params.push(updates.version) }
  if (!fields.length) return getPlantillaById(id)
  fields.push(`fecha_modificacion = now()`)
  params.push(id)
  await query(`UPDATE plantillas_mdap SET ${fields.join(', ')} WHERE id_plantilla = $${i}`, params)
  return getPlantillaById(id)
}

export async function deletePlantilla(id) {
  const { rowCount } = await query('DELETE FROM plantillas_mdap WHERE id_plantilla = $1', [id])
  return rowCount > 0
}
