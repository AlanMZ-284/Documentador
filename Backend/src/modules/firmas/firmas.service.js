/**
 * modules/firmas/firmas.service.js
 *
 * Mapea a `firmas_documentos` (DBML):
 *   id_firma, id_documento, id_usuario, tipo_firma, hash_firma, fecha_firma, ip_direccion, valida
 *
 * Al firmar:
 *   - Inserta fila en `firmas_documentos`
 *   - Si el documento tenía estatus 'pendiente' y todos los aprobadores
 *     (rol_raci='A' en matriz_raci) han firmado → pasa a 'aceptado'.
 *
 * Al rechazar:
 *   - Inserta fila con tipo_firma='rechazo' y valida=FALSE
 *   - Incrementa documentos.conteo_rechazos
 *   - Cambia estatus_aceptacion a 'rechazado'
 */

import crypto from 'node:crypto'
import { query, withTransaction } from '../../plugins/db.js'
import { logger } from '../../shared/utils/logger.js'

const TIPO_FIRMA = new Set(['aprobacion', 'rechazo', 'revision', 'visto_bueno'])

function sha256(buf) {
  return crypto.createHash('sha256').update(buf).digest('hex')
}

export function isValidTipoFirma(t) {
  return TIPO_FIRMA.has(t)
}

export async function listFirmasByDocumento(idDocumento) {
  const { rows } = await query(
    `SELECT f.id_firma, f.id_documento, f.id_usuario, f.tipo_firma, f.hash_firma, f.fecha_firma, f.ip_direccion, f.valida,
            u.correo_corporativo
     FROM firmas_documentos f
     JOIN usuarios u ON u.id_usuario = f.id_usuario
     WHERE f.id_documento = $1
     ORDER BY f.fecha_firma DESC`,
    [idDocumento]
  )
  return rows
}

export async function firmarDocumento({ id_documento, id_usuario, ip_direccion, payload = 'manual', tipo_firma = 'aprobacion' }) {
  if (!isValidTipoFirma(tipo_firma)) {
    const err = new Error(`tipo_firma inválido: ${tipo_firma}`)
    err.code = 'INVALID_TIPO'
    throw err
  }
  const hash = sha256(Buffer.from(`${id_documento}|${id_usuario}|${Date.now()}|${payload}`))
  return withTransaction(async (client) => {
    const { rows: doc } = await client.query(
      'SELECT id_documento, estatus_aceptacion FROM documentos WHERE id_documento = $1 FOR UPDATE',
      [id_documento]
    )
    if (!doc.length) {
      const err = new Error('Documento no encontrado')
      err.code = 'NOT_FOUND'
      throw err
    }
    const { rows: firma } = await client.query(
      `INSERT INTO firmas_documentos (id_documento, id_usuario, tipo_firma, hash_firma, ip_direccion, valida)
       VALUES ($1, $2, $3, $4, $5, TRUE)
       RETURNING *`,
      [id_documento, id_usuario, tipo_firma, hash, ip_direccion]
    )
    let newStatus = doc[0].estatus_aceptacion
    if (tipo_firma === 'aprobacion' || tipo_firma === 'visto_bueno') {
      // Verificar si ya todos los aprobadores (rol_raci='A') firmaron
      const { rows: pendientes } = await client.query(
        `SELECT rh.id_usuario_asociado
         FROM matriz_raci r
         JOIN recursos_humanos rh ON rh.id_recurso = r.id_recurso
         WHERE r.id_documento = $1 AND r.rol_raci = 'A' AND rh.id_usuario_asociado IS NOT NULL`,
        [id_documento]
      )
      const requiredUserIds = pendientes.map((p) => p.id_usuario_asociado)
      if (requiredUserIds.length > 0) {
        const { rows: firmas } = await client.query(
          `SELECT DISTINCT id_usuario FROM firmas_documentos
           WHERE id_documento = $1 AND tipo_firma IN ('aprobacion','visto_bueno') AND valida = TRUE`,
          [id_documento]
        )
        const signed = new Set(firmas.map((f) => f.id_usuario))
        const allSigned = requiredUserIds.every((uid) => signed.has(uid))
        if (allSigned) newStatus = 'aceptado'
      } else {
        newStatus = 'aceptado'
      }
      if (newStatus !== doc[0].estatus_aceptacion) {
        await client.query(
          'UPDATE documentos SET estatus_aceptacion = $1, fecha_modificacion = now() WHERE id_documento = $2',
          [newStatus, id_documento]
        )
      }
    } else if (tipo_firma === 'rechazo') {
      await client.query(
        `UPDATE documentos SET estatus_aceptacion = 'rechazado', conteo_rechazos = conteo_rechazos + 1,
                                  fecha_modificacion = now()
         WHERE id_documento = $1`,
        [id_documento]
      )
      newStatus = 'rechazado'
    }
    return { firma: firma[0], estatus_aceptacion: newStatus }
  })
}

export async function invalidateFirma(idFirma, idUsuarioRevocador) {
  const { rowCount } = await query(
    'UPDATE firmas_documentos SET valida = FALSE WHERE id_firma = $1',
    [idFirma]
  )
  return rowCount > 0
}
