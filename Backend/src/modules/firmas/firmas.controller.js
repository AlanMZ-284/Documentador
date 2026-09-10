/**
 * modules/firmas/firmas.controller.js
 */

import { auditLog, AUDIT_ACTIONS } from '../../shared/utils/audit.js'
import { firmarDocumento, listFirmasByDocumento, invalidateFirma, isValidTipoFirma } from './firmas.service.js'

export async function listFirmasController(request, reply) {
  const id = request.params.id
  const rows = await listFirmasByDocumento(id)
  return reply.send({ data: rows })
}

export async function firmarController(request, reply) {
  const id = request.params.id
  const { tipo_firma, payload } = request.body
  const actor = request.user
  if (tipo_firma && !isValidTipoFirma(tipo_firma)) {
    return reply.code(400).send({ statusCode: 400, error: 'Inválido', message: 'tipo_firma debe ser aprobacion|rechazo|revision|visto_bueno' })
  }
  try {
    const result = await firmarDocumento({
      id_documento: id,
      id_usuario: actor.sub,
      ip_direccion: request.auditContext?.ip,
      payload,
      tipo_firma: tipo_firma || 'aprobacion',
    })
    const accion = (tipo_firma || 'aprobacion') === 'rechazo' ? AUDIT_ACTIONS.DOCUMENT_REJECT : AUDIT_ACTIONS.DOCUMENT_SIGN
    await auditLog({
      idUsuario: actor.sub,
      tipoAccion: accion,
      idEntidad: id,
      ip: request.auditContext?.ip,
      detalles: { tipo_firma: tipo_firma || 'aprobacion', hash_firma: result.firma.hash_firma, estatus: result.estatus_aceptacion },
    })
    return reply.code(201).send(result)
  } catch (err) {
    if (err.code === 'NOT_FOUND') {
      return reply.code(404).send({ statusCode: 404, error: 'No encontrado', message: 'Documento no encontrado.' })
    }
    if (err.code === 'INVALID_TIPO') {
      return reply.code(400).send({ statusCode: 400, error: 'Inválido', message: err.message })
    }
    throw err
  }
}

export async function invalidateFirmaController(request, reply) {
  const idFirma = Number(request.params.idFirma)
  const actor = request.user
  const ok = await invalidateFirma(idFirma, actor.sub)
  if (!ok) return reply.code(404).send({ statusCode: 404, error: 'No encontrado', message: 'Firma no encontrada.' })
  await auditLog({
    idUsuario: actor.sub,
    tipoAccion: AUDIT_ACTIONS.DOCUMENT_UPDATE,
    idEntidad: request.params.id,
    ip: request.auditContext?.ip,
    detalles: { invalidada_firma: idFirma },
  })
  return reply.send({ message: 'Firma invalidada.' })
}
