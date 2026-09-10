/**
 * modules/documentos/documentos.service.js
 *
 * Mapea a la tabla `documentos` (DBML):
 *   id_documento          UUID PK
 *   id_tipo_documento     INTEGER
 *   id_plantilla          INTEGER NULL
 *   id_proyecto           INTEGER NULL
 *   id_aplicacion         INTEGER NULL
 *   titulo_documento      VARCHAR(500)
 *   version_actual        VARCHAR  (default 'v1.0')
 *   estatus_aceptacion    VARCHAR  (default 'pendiente')
 *   conteo_rechazos       INTEGER  (default 0)
 *   ruta_repositorio      VARCHAR  (ruta en S3)
 *   firma_electronica     JSONB
 *   ia_embedding          vector(1536)
 *   fecha_creacion, fecha_modificacion
 *   id_usuario_creador    INTEGER
 */

import { query, withTransaction } from '../../plugins/db.js'

const SELECT_DOC = `
  SELECT d.id_documento, d.id_tipo_documento, d.id_plantilla, d.id_proyecto, d.id_aplicacion,
         d.titulo_documento, d.version_actual, d.estatus_aceptacion, d.conteo_rechazos,
         d.ruta_repositorio, d.firma_electronica, d.fecha_creacion, d.fecha_modificacion,
         d.id_usuario_creador,
         t.nombre_tipo,
         p.nombre_plantilla,
         pr.nombre_proyecto,
         a.nombre_app
  FROM documentos d
  LEFT JOIN catalogo_tipos_documento t ON t.id_tipo_documento = d.id_tipo_documento
  LEFT JOIN plantillas_mdap p         ON p.id_plantilla = d.id_plantilla
  LEFT JOIN proyectos_iniciativas pr  ON pr.id_proyecto = d.id_proyecto
  LEFT JOIN aplicaciones a            ON a.id_aplicacion = d.id_aplicacion
`

export async function listDocumentos({ page = 1, pageSize = 20, q, id_tipo_documento, id_proyecto, id_aplicacion, estatus_aceptacion }) {
  const conds = []
  const params = []
  if (q) {
    params.push(`%${q.toLowerCase()}%`)
    conds.push(`LOWER(d.titulo_documento) LIKE $${params.length}`)
  }
  if (id_tipo_documento) { params.push(id_tipo_documento); conds.push(`d.id_tipo_documento = $${params.length}`) }
  if (id_proyecto)       { params.push(id_proyecto);       conds.push(`d.id_proyecto = $${params.length}`) }
  if (id_aplicacion)     { params.push(id_aplicacion);     conds.push(`d.id_aplicacion = $${params.length}`) }
  if (estatus_aceptacion) { params.push(estatus_aceptacion); conds.push(`d.estatus_aceptacion = $${params.length}`) }
  const where = conds.length ? `WHERE ${conds.join(' AND ')}` : ''
  const offset = (page - 1) * pageSize
  params.push(pageSize, offset)
  const { rows } = await query(`${SELECT_DOC} ${where} ORDER BY d.fecha_creacion DESC LIMIT $${params.length - 1} OFFSET $${params.length}`, params)
  const countParams = params.slice(0, params.length - 2)
  const { rows: countRows } = await query(`SELECT COUNT(*)::int AS total FROM documentos d ${where}`, countParams)
  return { data: rows, total: countRows[0].total, page, pageSize }
}

export async function getDocumentoById(id) {
  const { rows } = await query(`${SELECT_DOC} WHERE d.id_documento = $1 LIMIT 1`, [id])
  return rows[0] || null
}

export async function getTipoDocumentoById(id) {
  const { rows } = await query(
    'SELECT id_tipo_documento, nombre_tipo FROM catalogo_tipos_documento WHERE id_tipo_documento = $1',
    [id]
  )
  return rows[0] || null
}

export async function createDocumento({ id_usuario_creador, ...data }) {
  const { rows } = await query(
    `INSERT INTO documentos
       (id_tipo_documento, id_plantilla, id_proyecto, id_aplicacion,
        titulo_documento, version_actual, estatus_aceptacion, id_usuario_creador, firma_electronica)
     VALUES ($1, $2, $3, $4, $5, 'v1.0', 'pendiente', $6, $7)
     RETURNING id_documento`,
    [
      data.id_tipo_documento,
      data.id_plantilla || null,
      data.id_proyecto || null,
      data.id_aplicacion || null,
      data.titulo_documento,
      id_usuario_creador,
      data.firma_electronica ? JSON.stringify(data.firma_electronica) : null,
    ]
  )
  return rows[0]
}

export async function updateDocumento(id, updates) {
  const fields = []
  const params = []
  let i = 1
  if (updates.titulo_documento !== undefined) { fields.push(`titulo_documento = $${i++}`); params.push(updates.titulo_documento) }
  if (updates.id_tipo_documento !== undefined) { fields.push(`id_tipo_documento = $${i++}`); params.push(updates.id_tipo_documento) }
  if (updates.id_plantilla !== undefined)      { fields.push(`id_plantilla = $${i++}`); params.push(updates.id_plantilla) }
  if (updates.id_proyecto !== undefined)       { fields.push(`id_proyecto = $${i++}`); params.push(updates.id_proyecto) }
  if (updates.id_aplicacion !== undefined)     { fields.push(`id_aplicacion = $${i++}`); params.push(updates.id_aplicacion) }
  if (updates.firma_electronica !== undefined) {
    fields.push(`firma_electronica = $${i++}`)
    params.push(updates.firma_electronica ? JSON.stringify(updates.firma_electronica) : null)
  }
  if (!fields.length) return getDocumentoById(id)
  fields.push(`fecha_modificacion = now()`)
  params.push(id)
  await query(`UPDATE documentos SET ${fields.join(', ')} WHERE id_documento = $${i}`, params)
  return getDocumentoById(id)
}

export async function deleteDocumento(id) {
  const { rowCount } = await query('DELETE FROM documentos WHERE id_documento = $1', [id])
  return rowCount > 0
}

export async function setRutaRepositorio(id, key) {
  await query(
    'UPDATE documentos SET ruta_repositorio = $1, fecha_modificacion = now() WHERE id_documento = $2',
    [key, id]
  )
}

export async function bumpVersion(id) {
  const { rows } = await query(
    `UPDATE documentos
     SET version_actual = 'v' || ((regexp_match(version_actual, 'v(\\d+)\\.(\\d+)'))[1]::int + 1)::text || '.0',
         fecha_modificacion = now()
     WHERE id_documento = $1
     RETURNING version_actual`,
    [id]
  )
  return rows[0]?.version_actual
}

export async function getFirmasByDocumento(id) {
  const { rows } = await query(
    `SELECT f.id_firma, f.tipo_firma, f.hash_firma, f.fecha_firma, f.ip_direccion, f.valida,
            u.correo_corporativo, u.id_usuario
     FROM firmas_documentos f
     JOIN usuarios u ON u.id_usuario = f.id_usuario
     WHERE f.id_documento = $1
     ORDER BY f.fecha_firma DESC`,
    [id]
  )
  return rows
}

export async function getRaciByDocumento(id) {
  const { rows } = await query(
    `SELECT r.id_asignacion, r.rol_raci, r.comentarios, r.fecha_asignacion,
            rh.nombre_completo, rh.id_recurso
     FROM matriz_raci r
     JOIN recursos_humanos rh ON rh.id_recurso = r.id_recurso
     WHERE r.id_documento = $1
     ORDER BY r.fecha_asignacion ASC`,
    [id]
  )
  return rows
}
