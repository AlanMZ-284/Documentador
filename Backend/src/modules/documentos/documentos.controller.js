/**
 * modules/documentos/documentos.controller.js
 */

import { auditLog, AUDIT_ACTIONS } from '../../shared/utils/audit.js'
import { storageService } from '../../shared/services/storage.service.js'
import { extractFromBuffer, extractFromZip } from '../../shared/services/zip-extractor.service.js'
import {
  listDocumentos,
  getDocumentoById,
  getTipoDocumentoById,
  createDocumento,
  updateDocumento,
  deleteDocumento,
  setRutaRepositorio,
  bumpVersion,
  getFirmasByDocumento,
  getRaciByDocumento,
} from './documentos.service.js'

const ALLOWED_MIME = new Map([
  ['application/pdf', 'pdf'],
  ['application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'docx'],
  ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'xlsx'],
  ['application/vnd.openxmlformats-officedocument.presentationml.presentation', 'pptx'],
  ['text/plain', 'txt'],
  ['application/zip', 'zip'],
])

const MAX_BYTES = (Number(process.env.MAX_FILE_SIZE_MB) || 50) * 1024 * 1024

function safeFileName(name) {
  return String(name).replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 200)
}

export async function listDocumentosController(request, reply) {
  const { page, pageSize, q, id_tipo_documento, id_proyecto, id_aplicacion, estatus_aceptacion } = request.query
  const result = await listDocumentos({ page, pageSize, q, id_tipo_documento, id_proyecto, id_aplicacion, estatus_aceptacion })
  return reply.send(result)
}

export async function getDocumentoController(request, reply) {
  const id = request.params.id
  const doc = await getDocumentoById(id)
  if (!doc) return reply.code(404).send({ statusCode: 404, error: 'No encontrado', message: 'Documento no encontrado.' })
  const [firmas, raci] = await Promise.all([
    getFirmasByDocumento(id),
    getRaciByDocumento(id),
  ])
  let downloadUrl = null
  if (doc.ruta_repositorio) {
    try { downloadUrl = await storageService.getSignedUrl({ key: doc.ruta_repositorio, expiresIn: 3600 }) }
    catch { downloadUrl = null }
  }
  return reply.send({ ...doc, firmas, raci, downloadUrl })
}

export async function createDocumentoController(request, reply) {
  const data = request.body
  const actor = request.user
  const tipo = await getTipoDocumentoById(data.id_tipo_documento)
  if (!tipo) {
    return reply.code(400).send({ statusCode: 400, error: 'Tipo inválido', message: 'id_tipo_documento no existe.' })
  }
  const created = await createDocumento({ ...data, id_usuario_creador: actor.sub })
  const full = await getDocumentoById(created.id_documento)
  await auditLog({
    idUsuario: actor.sub,
    tipoAccion: AUDIT_ACTIONS.DOCUMENT_CREATE,
    idEntidad: created.id_documento,
    ip: request.auditContext?.ip,
    detalles: { titulo_documento: data.titulo_documento, id_tipo_documento: data.id_tipo_documento },
  })
  return reply.code(201).send(full)
}

export async function updateDocumentoController(request, reply) {
  const id = request.params.id
  const updates = request.body
  const actor = request.user
  const existing = await getDocumentoById(id)
  if (!existing) {
    return reply.code(404).send({ statusCode: 404, error: 'No encontrado', message: 'Documento no encontrado.' })
  }
  const updated = await updateDocumento(id, updates)
  await auditLog({
    idUsuario: actor.sub,
    tipoAccion: AUDIT_ACTIONS.DOCUMENT_UPDATE,
    idEntidad: id,
    ip: request.auditContext?.ip,
    detalles: { cambios: Object.keys(updates) },
  })
  return reply.send(updated)
}

export async function deleteDocumentoController(request, reply) {
  const id = request.params.id
  const actor = request.user
  const existing = await getDocumentoById(id)
  if (!existing) {
    return reply.code(404).send({ statusCode: 404, error: 'No encontrado', message: 'Documento no encontrado.' })
  }
  if (existing.ruta_repositorio) {
    try { await storageService.delete({ key: existing.ruta_repositorio }) }
    catch (err) { /* no crítico */ }
  }
  await deleteDocumento(id)
  await auditLog({
    idUsuario: actor.sub,
    tipoAccion: AUDIT_ACTIONS.DOCUMENT_DELETE,
    idEntidad: id,
    ip: request.auditContext?.ip,
    detalles: { titulo_documento: existing.titulo_documento },
  })
  return reply.send({ message: 'Documento eliminado.' })
}

/**
 * POST /api/documentos/:id/versiones
 * Multipart: campo 'archivo' (file), o 'archivo' es un .zip que contiene varios archivos.
 */
export async function uploadVersionController(request, reply) {
  const id = request.params.id
  const actor = request.user
  const doc = await getDocumentoById(id)
  if (!doc) {
    return reply.code(404).send({ statusCode: 404, error: 'No encontrado', message: 'Documento no encontrado.' })
  }
  if (!request.isMultipart()) {
    return reply.code(400).send({ statusCode: 400, error: 'Bad Request', message: 'Se requiere multipart/form-data con campo "archivo".' })
  }
  const file = await request.file()
  if (!file) {
    return reply.code(400).send({ statusCode: 400, error: 'Bad Request', message: 'No se envió ningún archivo.' })
  }
  if (file.file?.truncated || (file.bytesRead || 0) > MAX_BYTES) {
    return reply.code(413).send({ statusCode: 413, error: 'Payload Too Large', message: `El archivo excede el límite de ${MAX_BYTES / 1024 / 1024}MB.` })
  }
  const ext = ALLOWED_MIME.get(file.mimetype) || (file.filename?.split('.').pop() || '').toLowerCase()
  if (!ALLOWED_MIME.has(file.mimetype)) {
    return reply.code(415).send({ statusCode: 415, error: 'Tipo no soportado', message: `MIME ${file.mimetype} no permitido.` })
  }
  const buffer = await file.toBuffer()
  const newKey = `documentos/${id}/${Date.now()}_${safeFileName(file.filename)}`
  await storageService.upload({ key: newKey, body: buffer, contentType: file.mimetype })

  // Extracción (no bloquea la respuesta si falla)
  let extraction = null
  try {
    if (ext === 'zip') extraction = await extractFromZip({ buffer })
    else extraction = await extractFromBuffer({ buffer, filename: file.filename })
  } catch (err) { extraction = null }

  await setRutaRepositorio(id, newKey)
  const newVersion = await bumpVersion(id)
  const updated = await getDocumentoById(id)
  await auditLog({
    idUsuario: actor.sub,
    tipoAccion: AUDIT_ACTIONS.DOCUMENT_VERSION_UPLOAD,
    idEntidad: id,
    ip: request.auditContext?.ip,
    detalles: {
      version: newVersion,
      archivo: file.filename,
      mime: file.mimetype,
      size: buffer.byteLength,
      hash_sha256: extraction?.hash || extraction?.zipHash || null,
      archivos_extraidos: ext === 'zip' ? extraction?.files?.length || 0 : 1,
    },
  })
  return reply.send({
    documento: updated,
    version: newVersion,
    archivo: { nombre: file.filename, mime: file.mimetype, size: buffer.byteLength, key: newKey },
    extraccion: extraction
      ? { hash: extraction.hash || extraction.zipHash, archivos: ext === 'zip' ? extraction.files?.length || 0 : 1 }
      : null,
  })
}
