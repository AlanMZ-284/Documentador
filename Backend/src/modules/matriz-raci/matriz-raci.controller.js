/**
 * modules/matriz-raci/matriz-raci.controller.js
 */

import { auditLog, AUDIT_ACTIONS } from '../../shared/utils/audit.js'
import {
  listRaciByDocumento,
  createAsignacion,
  updateAsignacion,
  deleteAsignacion,
} from './matriz-raci.service.js'

export async function listRaciController(request, reply) {
  const idDocumento = request.params.id
  const rows = await listRaciByDocumento(idDocumento)
  return reply.send({ data: rows })
}

export async function createAsignacionController(request, reply) {
  const idDocumento = request.params.id
  const data = request.body
  const actor = request.user
  try {
    const created = await createAsignacion({ id_documento: idDocumento, ...data })
    await auditLog({
      idUsuario: actor.sub,
      tipoAccion: AUDIT_ACTIONS.RACI_ASSIGN,
      idEntidad: idDocumento,
      ip: request.auditContext?.ip,
      detalles: { id_recurso: data.id_recurso, rol_raci: data.rol_raci, id_asignacion: created.id_asignacion },
    })
    return reply.code(201).send(created)
  } catch (err) {
    if (err.code === 'INVALID_ROL' || err.code === 'INVALID_DOCUMENTO' || err.code === 'INVALID_RECURSO') {
      return reply.code(400).send({ statusCode: 400, error: 'Inválido', message: err.message })
    }
    if (err.code === '23503') {
      return reply.code(400).send({ statusCode: 400, error: 'FK inválida', message: 'id_documento o id_recurso no existe.' })
    }
    throw err
  }
}

export async function updateAsignacionController(request, reply) {
  const idAsignacion = Number(request.params.idAsignacion)
  const updates = request.body
  const actor = request.user
  try {
    const updated = await updateAsignacion(idAsignacion, updates)
    if (!updated) return reply.code(404).send({ statusCode: 404, error: 'No encontrado', message: 'Asignación no encontrada.' })
    await auditLog({
      idUsuario: actor.sub,
      tipoAccion: AUDIT_ACTIONS.RACI_UPDATE,
      idEntidad: updated.id_documento,
      ip: request.auditContext?.ip,
      detalles: { id_asignacion: idAsignacion, cambios: Object.keys(updates) },
    })
    return reply.send(updated)
  } catch (err) {
    if (err.code === 'INVALID_ROL') {
      return reply.code(400).send({ statusCode: 400, error: 'Inválido', message: err.message })
    }
    throw err
  }
}

export async function deleteAsignacionController(request, reply) {
  const idAsignacion = Number(request.params.idAsignacion)
  const actor = request.user
  const ok = await deleteAsignacion(idAsignacion)
  if (!ok) return reply.code(404).send({ statusCode: 404, error: 'No encontrado', message: 'Asignación no encontrada.' })
  await auditLog({
    idUsuario: actor.sub,
    tipoAccion: AUDIT_ACTIONS.RACI_REMOVE,
    idEntidad: request.params.id,
    ip: request.auditContext?.ip,
    detalles: { id_asignacion: idAsignacion },
  })
  return reply.send({ message: 'Asignación RACI eliminada.' })
}
