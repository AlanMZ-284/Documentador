/**
 * modules/aplicaciones/aplicaciones.controller.js
 */

import { auditLog, AUDIT_ACTIONS } from '../../shared/utils/audit.js'
import {
  listAplicaciones,
  getAplicacionById,
  createAplicacion,
  updateAplicacion,
  deleteAplicacion,
} from './aplicaciones.service.js'

export async function listAplicacionesController(request, reply) {
  const { page, pageSize, q, estado } = request.query
  const result = await listAplicaciones({ page, pageSize, q, estado })
  return reply.send(result)
}

export async function getAplicacionController(request, reply) {
  const id = Number(request.params.id)
  const app = await getAplicacionById(id)
  if (!app) return reply.code(404).send({ statusCode: 404, error: 'No encontrado', message: 'Aplicación no encontrada.' })
  return reply.send(app)
}

export async function createAplicacionController(request, reply) {
  const data = request.body
  const actor = request.user
  try {
    const created = await createAplicacion(data)
    await auditLog({
      idUsuario: actor.sub,
      tipoAccion: AUDIT_ACTIONS.SYSTEM_MAINTENANCE,
      idEntidad: created.id_aplicacion,
      ip: request.auditContext?.ip,
      detalles: { tipo: 'aplicacion_create', nombre_app: created.nombre_app },
    })
    return reply.code(201).send(created)
  } catch (err) {
    if (err.code === '23505') return reply.code(409).send({ statusCode: 409, error: 'Conflicto', message: 'Ya existe una aplicación con ese nombre.' })
    throw err
  }
}

export async function updateAplicacionController(request, reply) {
  const id = Number(request.params.id)
  const updates = request.body
  const actor = request.user
  const updated = await updateAplicacion(id, updates)
  if (!updated) return reply.code(404).send({ statusCode: 404, error: 'No encontrado', message: 'Aplicación no encontrada.' })
  await auditLog({
    idUsuario: actor.sub,
    tipoAccion: AUDIT_ACTIONS.SYSTEM_MAINTENANCE,
    idEntidad: id,
    ip: request.auditContext?.ip,
    detalles: { tipo: 'aplicacion_update', cambios: Object.keys(updates) },
  })
  return reply.send(updated)
}

export async function deleteAplicacionController(request, reply) {
  const id = Number(request.params.id)
  const actor = request.user
  const existing = await getAplicacionById(id)
  if (!existing) return reply.code(404).send({ statusCode: 404, error: 'No encontrado', message: 'Aplicación no encontrada.' })
  try {
    await deleteAplicacion(id)
  } catch (err) {
    if (err.code === '23503') return reply.code(409).send({ statusCode: 409, error: 'Conflicto', message: 'La aplicación tiene documentos asociados.' })
    throw err
  }
  await auditLog({
    idUsuario: actor.sub,
    tipoAccion: AUDIT_ACTIONS.SYSTEM_MAINTENANCE,
    idEntidad: id,
    ip: request.auditContext?.ip,
    detalles: { tipo: 'aplicacion_delete', nombre_app: existing.nombre_app },
  })
  return reply.send({ message: 'Aplicación eliminada.' })
}
