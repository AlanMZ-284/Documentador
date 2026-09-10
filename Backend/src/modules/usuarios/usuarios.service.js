/**
 * modules/usuarios/usuarios.service.js
 * Capa de acceso a datos para la tabla `usuarios` (DBML).
 */

import bcrypt from 'bcryptjs'
import { query, withTransaction } from '../../plugins/db.js'
import { logger } from '../../shared/utils/logger.js'

const SELECT_USER = `
  SELECT u.id_usuario, u.id_rol, u.correo_corporativo, u.id_recurso,
         u.activo, u.fecha_creacion, u.fecha_modificacion,
         r.nombre_rol, r.permisos
  FROM usuarios u
  JOIN roles r ON r.id_rol = u.id_rol
`

export async function listUsuarios({ page = 1, pageSize = 20, q, rol, activo }) {
  const conditions = []
  const params = []
  if (q) {
    params.push(`%${q.toLowerCase()}%`)
    conditions.push(`LOWER(u.correo_corporativo) LIKE $${params.length}`)
  }
  if (rol) {
    params.push(rol)
    conditions.push(`r.nombre_rol = $${params.length}`)
  }
  if (activo !== undefined) {
    params.push(activo === 'true')
    conditions.push(`u.activo = $${params.length}`)
  }
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''
  const offset = (page - 1) * pageSize
  params.push(pageSize, offset)
  const sql = `${SELECT_USER} ${where}
    ORDER BY u.id_usuario ASC
    LIMIT $${params.length - 1} OFFSET $${params.length}`
  const { rows } = await query(sql, params)
  const countSql = `SELECT COUNT(*)::int AS total FROM usuarios u JOIN roles r ON r.id_rol = u.id_rol ${where}`
  const countParams = params.slice(0, params.length - 2)
  const { rows: countRows } = await query(countSql, countParams)
  return { data: rows, total: countRows[0].total, page, pageSize }
}

export async function getUsuarioById(id) {
  const { rows } = await query(`${SELECT_USER} WHERE u.id_usuario = $1 LIMIT 1`, [id])
  return rows[0] || null
}

export async function getUsuarioByEmail(correo) {
  const { rows } = await query(`${SELECT_USER} WHERE LOWER(u.correo_corporativo) = LOWER($1) LIMIT 1`, [correo])
  return rows[0] || null
}

export async function getUsuarioByEmailForAuth(correo) {
  const { rows } = await query(
    `SELECT u.id_usuario, u.id_rol, u.correo_corporativo, u.password_hash,
            u.activo, r.nombre_rol, r.permisos
     FROM usuarios u JOIN roles r ON r.id_rol = u.id_rol
     WHERE LOWER(u.correo_corporativo) = LOWER($1) LIMIT 1`,
    [correo]
  )
  return rows[0] || null
}

export async function createUsuario({ id_rol, correo_corporativo, password, id_recurso = null }) {
  const cost = Number(process.env.BCRYPT_COST) || 12
  const hash = await bcrypt.hash(password, cost)
  const { rows } = await query(
    `INSERT INTO usuarios (id_rol, correo_corporativo, password_hash, id_recurso, activo)
     VALUES ($1, $2, $3, $4, TRUE)
     RETURNING id_usuario, id_rol, correo_corporativo, id_recurso, activo, fecha_creacion`,
    [id_rol, correo_corporativo.toLowerCase(), hash, id_recurso]
  )
  return rows[0]
}

export async function updateUsuario(id, { id_rol, id_recurso, activo }) {
  const fields = []
  const params = []
  let i = 1
  if (id_rol !== undefined) {
    fields.push(`id_rol = $${i++}`)
    params.push(id_rol)
  }
  if (id_recurso !== undefined) {
    fields.push(`id_recurso = $${i++}`)
    params.push(id_recurso)
  }
  if (activo !== undefined) {
    fields.push(`activo = $${i++}`)
    params.push(activo)
  }
  if (!fields.length) return getUsuarioById(id)
  fields.push(`fecha_modificacion = now()`)
  params.push(id)
  const { rows } = await query(
    `UPDATE usuarios SET ${fields.join(', ')}
     WHERE id_usuario = $${i}
     RETURNING id_usuario, id_rol, correo_corporativo, id_recurso, activo, fecha_creacion, fecha_modificacion`,
    params
  )
  return rows[0] || null
}

export async function setPassword(id, newPassword) {
  const cost = Number(process.env.BCRYPT_COST) || 12
  const hash = await bcrypt.hash(newPassword, cost)
  const { rows } = await query(
    `UPDATE usuarios SET password_hash = $1, fecha_modificacion = now()
     WHERE id_usuario = $2 RETURNING id_usuario`,
    [hash, id]
  )
  return rows[0] || null
}

export async function countUsersInRoleExcept(idRol, exceptId) {
  const { rows } = await query(
    `SELECT COUNT(*)::int AS total FROM usuarios
     WHERE id_rol = $1 AND id_usuario <> $2`,
    [idRol, exceptId]
  )
  return rows[0].total
}

export async function getRoleById(idRol) {
  const { rows } = await query(
    'SELECT id_rol, nombre_rol, permisos FROM roles WHERE id_rol = $1 LIMIT 1',
    [idRol]
  )
  return rows[0] || null
}

export async function getRoleByName(nombre) {
  const { rows } = await query(
    'SELECT id_rol, nombre_rol, permisos FROM roles WHERE nombre_rol = $1 LIMIT 1',
    [nombre]
  )
  return rows[0] || null
}

export async function updateLastLogin(idUsuario) {
  // Usa la columna dedicada del DBML (fecha_ultimo_acceso), que existía
  // pero el código anterior no aprovechaba.
  await query(
    'UPDATE usuarios SET fecha_ultimo_acceso = now() WHERE id_usuario = $1',
    [idUsuario]
  )
}
