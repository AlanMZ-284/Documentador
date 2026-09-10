/**
 * modules/matriz-raci/matriz-raci.service.js
 *
 * Mapea a `matriz_raci` (DBML):
 *   id_asignacion, id_documento (UUID), id_recurso, rol_raci, comentarios, fecha_asignacion
 * ROLES válidos: R (Responsable), A (Aprobador), C (Consultado), I (Informado)
 */

import { query } from '../../plugins/db.js'

const ROLES_RACI = new Set(['R', 'A', 'C', 'I'])

const SELECT_RACI = `
  SELECT r.id_asignacion, r.id_documento, r.id_recurso, r.rol_raci, r.comentarios, r.fecha_asignacion,
         rh.nombre_completo, rh.correo_institucional, rh.id_area,
         a.acronimo AS area
  FROM matriz_raci r
  JOIN recursos_humanos rh ON rh.id_recurso = r.id_recurso
  LEFT JOIN catalogo_areas_corporativas a ON a.id_area = rh.id_area
`

export function isValidRolRaci(rol) {
  return ROLES_RACI.has(rol)
}

export async function listRaciByDocumento(idDocumento) {
  const { rows } = await query(`${SELECT_RACI} WHERE r.id_documento = $1 ORDER BY r.rol_raci, r.fecha_asignacion`, [idDocumento])
  return rows
}

export async function listRaciByRecurso(idRecurso) {
  const { rows } = await query(`${SELECT_RACI} WHERE r.id_recurso = $1 ORDER BY r.fecha_asignacion DESC`, [idRecurso])
  return rows
}

export async function getAsignacion(idAsignacion) {
  const { rows } = await query(`${SELECT_RACI} WHERE r.id_asignacion = $1 LIMIT 1`, [idAsignacion])
  return rows[0] || null
}

export async function createAsignacion({ id_documento, id_recurso, rol_raci, comentarios = null }) {
  if (!isValidRolRaci(rol_raci)) {
    const err = new Error(`rol_raci debe ser uno de: ${[...ROLES_RACI].join(', ')}`)
    err.code = 'INVALID_ROL'
    throw err
  }
  // Validar que el documento existe
  const { rows: doc } = await query('SELECT id_documento FROM documentos WHERE id_documento = $1 LIMIT 1', [id_documento])
  if (!doc.length) {
    const err = new Error('id_documento no existe')
    err.code = 'INVALID_DOCUMENTO'
    throw err
  }
  // Validar recurso
  const { rows: rec } = await query('SELECT id_recurso FROM recursos_humanos WHERE id_recurso = $1 LIMIT 1', [id_recurso])
  if (!rec.length) {
    const err = new Error('id_recurso no existe')
    err.code = 'INVALID_RECURSO'
    throw err
  }
  const { rows } = await query(
    `INSERT INTO matriz_raci (id_documento, id_recurso, rol_raci, comentarios)
     VALUES ($1, $2, $3, $4) RETURNING *`,
    [id_documento, id_recurso, rol_raci, comentarios]
  )
  return rows[0]
}

export async function updateAsignacion(idAsignacion, updates) {
  const fields = []
  const params = []
  let i = 1
  if (updates.rol_raci !== undefined) {
    if (!isValidRolRaci(updates.rol_raci)) {
      const err = new Error(`rol_raci debe ser uno de: ${[...ROLES_RACI].join(', ')}`)
      err.code = 'INVALID_ROL'
      throw err
    }
    fields.push(`rol_raci = $${i++}`)
    params.push(updates.rol_raci)
  }
  if (updates.comentarios !== undefined) { fields.push(`comentarios = $${i++}`); params.push(updates.comentarios) }
  if (!fields.length) return getAsignacion(idAsignacion)
  params.push(idAsignacion)
  await query(`UPDATE matriz_raci SET ${fields.join(', ')} WHERE id_asignacion = $${i}`, params)
  return getAsignacion(idAsignacion)
}

export async function deleteAsignacion(idAsignacion) {
  const { rowCount } = await query('DELETE FROM matriz_raci WHERE id_asignacion = $1', [idAsignacion])
  return rowCount > 0
}
