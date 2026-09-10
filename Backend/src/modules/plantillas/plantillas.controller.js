/**
 * modules/plantillas/plantillas.controller.js
 */

import { auditLog, AUDIT_ACTIONS } from '../../shared/utils/audit.js'
import {
  listPlantillas,
  getPlantillaById,
  createPlantilla,
  updatePlantilla,
  deletePlantilla,
} from './plantillas.service.js'

export async function listPlantillasController(request, reply) {
  const { page, pageSize, q } = request.query
  const result = await listPlantillas({ page, pageSize, q })
  return reply.send(result)
}

export async function getPlantillaController(request, reply) {
  const id = Number(request.params.id)
  const p = await getPlantillaById(id)
  if (!p) return reply.code(404).send({ statusCode: 404, error: 'No encontrado', message: 'Plantilla no encontrada.' })
  return reply.send(p)
}

export async function createPlantillaController(request, reply) {
  const data = request.body
  const actor = request.user
  const created = await createPlantilla(data)
  await auditLog({
    idUsuario: actor.sub,
    tipoAccion: AUDIT_ACTIONS.SYSTEM_MAINTENANCE,
    idEntidad: created.id_plantilla,
    ip: request.auditContext?.ip,
    detalles: { tipo: 'plantilla_create', nombre_plantilla: created.nombre_plantilla, version: created.version },
  })
  return reply.code(201).send(created)
}

export async function updatePlantillaController(request, reply) {
  const id = Number(request.params.id)
  const updates = request.body
  const actor = request.user
  const updated = await updatePlantilla(id, updates)
  if (!updated) return reply.code(404).send({ statusCode: 404, error: 'No encontrado', message: 'Plantilla no encontrada.' })
  await auditLog({
    idUsuario: actor.sub,
    tipoAccion: AUDIT_ACTIONS.SYSTEM_MAINTENANCE,
    idEntidad: id,
    ip: request.auditContext?.ip,
    detalles: { tipo: 'plantilla_update', cambios: Object.keys(updates) },
  })
  return reply.send(updated)
}

export async function deletePlantillaController(request, reply) {
  const id = Number(request.params.id)
  const actor = request.user
  const existing = await getPlantillaById(id)
  if (!existing) return reply.code(404).send({ statusCode: 404, error: 'No encontrado', message: 'Plantilla no encontrada.' })
  try {
    await deletePlantilla(id)
  } catch (err) {
    if (err.code === '23503') return reply.code(409).send({ statusCode: 409, error: 'Conflicto', message: 'La plantilla está en uso por uno o más documentos.' })
    throw err
  }
  await auditLog({
    idUsuario: actor.sub,
    tipoAccion: AUDIT_ACTIONS.SYSTEM_MAINTENANCE,
    idEntidad: id,
    ip: request.auditContext?.ip,
    detalles: { tipo: 'plantilla_delete', nombre_plantilla: existing.nombre_plantilla },
  })
  return reply.send({ message: 'Plantilla eliminada.' })
}
