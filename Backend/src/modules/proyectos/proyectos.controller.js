/**
 * modules/proyectos/proyectos.controller.js
 */

import { auditLog, AUDIT_ACTIONS } from '../../shared/utils/audit.js'
import {
  listProyectos,
  getProyectoById,
  createProyecto,
  updateProyecto,
  deleteProyecto,
} from './proyectos.service.js'

export async function listProyectosController(request, reply) {
  const { page, pageSize, q, estatus } = request.query
  const result = await listProyectos({ page, pageSize, q, estatus })
  return reply.send(result)
}

export async function getProyectoController(request, reply) {
  const id = Number(request.params.id)
  const p = await getProyectoById(id)
  if (!p) return reply.code(404).send({ statusCode: 404, error: 'No encontrado', message: 'Proyecto no encontrado.' })
  return reply.send(p)
}

export async function createProyectoController(request, reply) {
  const data = request.body
  const actor = request.user
  const created = await createProyecto(data)
  await auditLog({
    idUsuario: actor.sub,
    tipoAccion: AUDIT_ACTIONS.SYSTEM_MAINTENANCE,
    idEntidad: created.id_proyecto,
    ip: request.auditContext?.ip,
    detalles: { tipo: 'proyecto_create', nombre_proyecto: created.nombre_proyecto },
  })
  return reply.code(201).send(created)
}

export async function updateProyectoController(request, reply) {
  const id = Number(request.params.id)
  const updates = request.body
  const actor = request.user
  const updated = await updateProyecto(id, updates)
  if (!updated) return reply.code(404).send({ statusCode: 404, error: 'No encontrado', message: 'Proyecto no encontrado.' })
  await auditLog({
    idUsuario: actor.sub,
    tipoAccion: AUDIT_ACTIONS.SYSTEM_MAINTENANCE,
    idEntidad: id,
    ip: request.auditContext?.ip,
    detalles: { tipo: 'proyecto_update', cambios: Object.keys(updates) },
  })
  return reply.send(updated)
}

export async function deleteProyectoController(request, reply) {
  const id = Number(request.params.id)
  const actor = request.user
  const existing = await getProyectoById(id)
  if (!existing) return reply.code(404).send({ statusCode: 404, error: 'No encontrado', message: 'Proyecto no encontrado.' })
  try {
    await deleteProyecto(id)
  } catch (err) {
    if (err.code === '23503') return reply.code(409).send({ statusCode: 409, error: 'Conflicto', message: 'El proyecto tiene documentos asociados.' })
    throw err
  }
  await auditLog({
    idUsuario: actor.sub,
    tipoAccion: AUDIT_ACTIONS.SYSTEM_MAINTENANCE,
    idEntidad: id,
    ip: request.auditContext?.ip,
    detalles: { tipo: 'proyecto_delete', nombre_proyecto: existing.nombre_proyecto },
  })
  return reply.send({ message: 'Proyecto eliminado.' })
}
