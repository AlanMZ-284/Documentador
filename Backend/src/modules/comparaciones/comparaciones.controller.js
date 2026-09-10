/**
 * modules/comparaciones/comparaciones.controller.js — Fase 2
 *
 * Endpoints del motor de comparación de versiones:
 *   POST /api/comparaciones/base            → registra v0 (multipart: archivo .zip)
 *   POST /api/comparaciones/:id/comparar    → compara nuevo .zip contra v0
 *   GET  /api/comparaciones/:id             → metadata de la comparación
 *   GET  /api/comparaciones/:id/resultados/:version → resultado de un diff
 */

import { auditLog, AUDIT_ACTIONS } from '../../shared/utils/audit.js'
import { ValidationError } from '../../shared/utils/errors.js'
import {
  registrarVersionBase,
  compararContraBase,
  obtenerComparacion,
  obtenerResultado,
} from './comparaciones.service.js'

const MAX_BYTES = (Number(process.env.MAX_FILE_SIZE_MB) || 50) * 1024 * 1024
const ZIP_MIME_TYPES = new Set([
  'application/zip',
  'application/x-zip-compressed',
  'application/octet-stream', // algunos navegadores envían zips así
])

/** Lee y valida el archivo .zip del multipart. Lanza ValidationError si no cumple. */
async function readZipFromRequest(request) {
  if (!request.isMultipart()) {
    throw new ValidationError('Se requiere multipart/form-data con campo "archivo".')
  }
  const file = await request.file()
  if (!file) throw new ValidationError('No se envió ningún archivo.')

  const extension = (file.filename?.split('.').pop() || '').toLowerCase()
  if (extension !== 'zip' || !ZIP_MIME_TYPES.has(file.mimetype)) {
    throw new ValidationError(`Solo se aceptan archivos .zip (recibido: ${file.mimetype}).`)
  }
  const buffer = await file.toBuffer()
  if (file.file?.truncated || buffer.byteLength > MAX_BYTES) {
    const error = new ValidationError(`El archivo excede el límite de ${MAX_BYTES / 1024 / 1024}MB.`)
    error.statusCode = 413
    throw error
  }
  return { buffer, filename: file.filename }
}

export async function crearVersionBaseController(request, reply) {
  const { buffer, filename } = await readZipFromRequest(request)
  const result = await registrarVersionBase({
    buffer,
    nombreArchivo: filename,
    idUsuario: request.user.sub,
  })
  await auditLog({
    idUsuario: request.user.sub,
    tipoAccion: AUDIT_ACTIONS.COMPARISON_BASE_CREATE,
    idEntidad: result.comparisonId,
    ip: request.auditContext?.ip,
    detalles: {
      archivo: filename,
      zip_hash: result.zipHashBase,
      total_archivos: result.totalArchivos,
      frameworks: result.frameworks.map((f) => f.name),
    },
  })
  return reply.code(201).send(result)
}

export async function compararController(request, reply) {
  const comparisonId = request.params.id
  const { buffer, filename } = await readZipFromRequest(request)
  const result = await compararContraBase({
    comparisonId,
    buffer,
    nombreArchivo: filename,
    idUsuario: request.user.sub,
  })
  await auditLog({
    idUsuario: request.user.sub,
    tipoAccion: AUDIT_ACTIONS.COMPARISON_RUN,
    idEntidad: comparisonId,
    ip: request.auditContext?.ip,
    detalles: {
      archivo: filename,
      version: result.version,
      creados: result.summary.created,
      eliminados: result.summary.deleted,
      modificados: result.summary.modified,
    },
  })
  return reply.send(result)
}

export async function obtenerComparacionController(request, reply) {
  const meta = await obtenerComparacion(request.params.id)
  return reply.send(meta)
}

export async function obtenerResultadoController(request, reply) {
  const result = await obtenerResultado(request.params.id, request.params.version)
  return reply.send(result)
}
