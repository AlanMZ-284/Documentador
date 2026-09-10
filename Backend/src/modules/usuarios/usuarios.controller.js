/**
 * modules/usuarios/usuarios.controller.js
 * Controladores HTTP del módulo de gestión de usuarios.
 */

import { auditLog, AUDIT_ACTIONS } from '../../shared/utils/audit.js'
import {
  listUsuarios,
  getUsuarioById,
  createUsuario,
  updateUsuario,
  setPassword,
  countUsersInRoleExcept,
  getRoleById,
  getRoleByName,
} from './usuarios.service.js'

function publicUser(u) {
  if (!u) return null
  // Eliminar campos sensibles antes de devolver al cliente
  const { password_hash, ...safe } = u
  return safe
}

export async function listUsuariosController(request, reply) {
  const { page, pageSize, q, rol, activo } = request.query
  const result = await listUsuarios({ page, pageSize, q, rol, activo })
  return reply.send({ ...result, data: result.data.map(publicUser) })
}

export async function getUsuarioController(request, reply) {
  const id = Number(request.params.id)
  const user = await getUsuarioById(id)
  if (!user) return reply.code(404).send({ statusCode: 404, error: 'No encontrado', message: 'Usuario no encontrado.' })
  return reply.send(publicUser(user))
}

export async function createUsuarioController(request, reply) {
  const { id_rol, correo_corporativo, password, id_recurso } = request.body
  const actor = request.user
  const rol = await getRoleById(id_rol)
  if (!rol) {
    return reply.code(400).send({ statusCode: 400, error: 'Rol inválido', message: 'El id_rol no existe.' })
  }
  // Solo SuperAdministrador puede crear otros SuperAdministradores
  if (rol.nombre_rol === 'SuperAdministrador' && actor.nombre_rol !== 'SuperAdministrador') {
    return reply.code(403).send({
      statusCode: 403, error: 'Acceso denegado',
      message: 'Solo un SuperAdministrador puede crear otro SuperAdministrador.',
    })
  }
  try {
    const created = await createUsuario({ id_rol, correo_corporativo, password, id_recurso })
    await auditLog({
      idUsuario: actor.sub,
      tipoAccion: AUDIT_ACTIONS.USER_CREATE,
      idEntidad: created.id_usuario,
      ip: request.auditContext?.ip,
      detalles: { correo_corporativo, id_rol, nombre_rol: rol.nombre_rol },
    })
    return reply.code(201).send(publicUser(created))
  } catch (err) {
    if (err.code === '23505') {
      return reply.code(409).send({
        statusCode: 409, error: 'Conflicto',
        message: 'Ya existe un usuario con ese correo corporativo.',
      })
    }
    if (err.code === '23503') {
      return reply.code(400).send({
        statusCode: 400, error: 'FK inválida',
        message: 'id_rol o id_recurso no existe.',
      })
    }
    throw err
  }
}

export async function updateUsuarioController(request, reply) {
  const id = Number(request.params.id)
  const updates = request.body
  const actor = request.user
  const current = await getUsuarioById(id)
  if (!current) {
    return reply.code(404).send({ statusCode: 404, error: 'No encontrado', message: 'Usuario no encontrado.' })
  }
  // No se puede degradar al último SuperAdministrador
  if (updates.id_rol && current.nombre_rol === 'SuperAdministrador') {
    const targetRol = await getRoleById(updates.id_rol)
    if (targetRol?.nombre_rol !== 'SuperAdministrador') {
      const remaining = await countUsersInRoleExcept(current.id_rol, id)
      if (remaining === 0) {
        return reply.code(409).send({
          statusCode: 409, error: 'Conflicto',
          message: 'No se puede degradar al único SuperAdministrador del sistema.',
        })
      }
    }
  }
  // Solo SuperAdministrador puede crear/asignar SuperAdministradores
  if (updates.id_rol) {
    const targetRol = await getRoleById(updates.id_rol)
    if (targetRol?.nombre_rol === 'SuperAdministrador' && actor.nombre_rol !== 'SuperAdministrador') {
      return reply.code(403).send({
        statusCode: 403, error: 'Acceso denegado',
        message: 'Solo un SuperAdministrador puede asignar el rol SuperAdministrador.',
      })
    }
  }
  const updated = await updateUsuario(id, updates)
  await auditLog({
    idUsuario: actor.sub,
    tipoAccion: updates.id_rol ? AUDIT_ACTIONS.USER_ROLE_CHANGE : AUDIT_ACTIONS.USER_UPDATE,
    idEntidad: id,
    ip: request.auditContext?.ip,
    detalles: updates,
  })
  return reply.send(publicUser(updated))
}

export async function resetPasswordController(request, reply) {
  const id = Number(request.params.id)
  const { newPassword } = request.body
  const actor = request.user
  const updated = await setPassword(id, newPassword)
  if (!updated) {
    return reply.code(404).send({ statusCode: 404, error: 'No encontrado', message: 'Usuario no encontrado.' })
  }
  await auditLog({
    idUsuario: actor.sub,
    tipoAccion: AUDIT_ACTIONS.USER_PASSWORD_RESET,
    idEntidad: id,
    ip: request.auditContext?.ip,
  })
  return reply.send({ message: 'Contraseña actualizada correctamente.' })
}

export async function deactivateUsuarioController(request, reply) {
  const id = Number(request.params.id)
  const actor = request.user
  const current = await getUsuarioById(id)
  if (!current) {
    return reply.code(404).send({ statusCode: 404, error: 'No encontrado', message: 'Usuario no encontrado.' })
  }
  if (current.nombre_rol === 'SuperAdministrador') {
    const remaining = await countUsersInRoleExcept(current.id_rol, id)
    if (remaining === 0) {
      return reply.code(409).send({
        statusCode: 409, error: 'Conflicto',
        message: 'No se puede desactivar al único SuperAdministrador del sistema.',
      })
    }
  }
  const updated = await updateUsuario(id, { activo: false })
  await auditLog({
    idUsuario: actor.sub,
    tipoAccion: AUDIT_ACTIONS.USER_DEACTIVATE,
    idEntidad: id,
    ip: request.auditContext?.ip,
  })
  return reply.send(publicUser(updated))
}

export async function activateUsuarioController(request, reply) {
  const id = Number(request.params.id)
  const actor = request.user
  const updated = await updateUsuario(id, { activo: true })
  if (!updated) {
    return reply.code(404).send({ statusCode: 404, error: 'No encontrado', message: 'Usuario no encontrado.' })
  }
  await auditLog({
    idUsuario: actor.sub,
    tipoAccion: AUDIT_ACTIONS.USER_ACTIVATE,
    idEntidad: id,
    ip: request.auditContext?.ip,
  })
  return reply.send(publicUser(updated))
}
