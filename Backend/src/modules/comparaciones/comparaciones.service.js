/**
 * modules/comparaciones/comparaciones.service.js — Fase 2
 *
 * Orquesta el motor de comparación de versiones:
 *   1. registrarVersionBase: zip → mapa v0, persistido como JSON en MinIO
 *      bajo `comparaciones/{id}/v0.json` (no requiere cambios de esquema).
 *   2. compararContraBase: segundo zip → mapa vN → diff contra v0,
 *      resultado persistido en `comparaciones/{id}/resultado_{n}.json`.
 *
 * Nota de diseño: el contenido textual de los archivos solo vive en el JSON
 * de los mapas (necesario para diff de líneas); nunca se inserta en PostgreSQL.
 */

import { randomUUID } from 'node:crypto'
import { buildFileMap } from '../../shared/services/file-map.service.js'
import { detectFrameworks } from '../../shared/services/framework-detector.service.js'
import { compareFileMaps } from '../../shared/services/version-compare.service.js'
import { storageService } from '../../shared/services/storage.service.js'
import { NotFoundError, ValidationError } from '../../shared/utils/errors.js'

const STORAGE_PREFIX = 'comparaciones'

const baseMapKey = (comparisonId) => `${STORAGE_PREFIX}/${comparisonId}/v0.json`
const resultKey = (comparisonId, versionNumber) =>
  `${STORAGE_PREFIX}/${comparisonId}/resultado_v${versionNumber}.json`
const metaKey = (comparisonId) => `${STORAGE_PREFIX}/${comparisonId}/meta.json`

async function uploadJson(key, data) {
  await storageService.upload({
    key,
    body: Buffer.from(JSON.stringify(data)),
    contentType: 'application/json',
  })
}

async function downloadJson(key) {
  const buffer = await storageService.downloadBuffer({ key })
  return JSON.parse(buffer.toString('utf8'))
}

/**
 * Registra la versión base (v0) de un proyecto a partir de un .zip.
 * @returns {{comparisonId, zipHash, totalFiles, frameworks, languages, fileMapPreview}}
 */
export async function registrarVersionBase({ buffer, nombreArchivo, idUsuario }) {
  if (!buffer?.byteLength) throw new ValidationError('El archivo .zip está vacío.')

  const fileMap = buildFileMap({ buffer, includeContent: true })
  if (fileMap.totalFiles === 0) {
    throw new ValidationError('El .zip no contiene archivos analizables.')
  }

  const analysis = detectFrameworks(fileMap)
  const comparisonId = randomUUID()

  const meta = {
    comparisonId,
    nombreArchivoBase: nombreArchivo,
    zipHashBase: fileMap.zipHash,
    totalArchivos: fileMap.totalFiles,
    totalBytes: fileMap.totalBytes,
    frameworks: analysis.frameworks,
    lenguajes: analysis.languages,
    manifests: analysis.manifests,
    versionesComparadas: 0,
    creadoPor: idUsuario ?? null,
    fechaCreacion: new Date().toISOString(),
  }

  await uploadJson(baseMapKey(comparisonId), fileMap)
  await uploadJson(metaKey(comparisonId), meta)

  return {
    ...meta,
    // El mapa completo puede ser grande: se devuelve sin `content`
    archivos: fileMap.files.map(({ content, ...rest }) => rest),
  }
}

/**
 * Compara un nuevo .zip contra la versión base v0 de una comparación existente.
 * @returns {Object} Resultado estructurado del diff + análisis de frameworks
 */
export async function compararContraBase({ comparisonId, buffer, nombreArchivo, idUsuario }) {
  if (!buffer?.byteLength) throw new ValidationError('El archivo .zip está vacío.')

  const exists = await storageService.exists({ key: baseMapKey(comparisonId) })
  if (!exists) throw new NotFoundError('Comparación (versión base)')

  const [baseMap, meta] = await Promise.all([
    downloadJson(baseMapKey(comparisonId)),
    downloadJson(metaKey(comparisonId)),
  ])

  const targetMap = buildFileMap({ buffer, includeContent: true })
  const comparison = compareFileMaps({ baseMap, targetMap, withContentDiff: true })
  const analysis = detectFrameworks(targetMap)

  const versionNumber = (meta.versionesComparadas || 0) + 1
  const result = {
    comparisonId,
    version: versionNumber,
    nombreArchivoComparado: nombreArchivo,
    zipHashComparado: targetMap.zipHash,
    fechaComparacion: new Date().toISOString(),
    ejecutadoPor: idUsuario ?? null,
    frameworks: analysis.frameworks,
    lenguajes: analysis.languages,
    ...comparison,
  }

  meta.versionesComparadas = versionNumber
  meta.ultimaComparacion = result.fechaComparacion

  await Promise.all([
    uploadJson(resultKey(comparisonId, versionNumber), result),
    uploadJson(metaKey(comparisonId), meta),
  ])

  return result
}

/** Recupera la metadata de una comparación. */
export async function obtenerComparacion(comparisonId) {
  const exists = await storageService.exists({ key: metaKey(comparisonId) })
  if (!exists) throw new NotFoundError('Comparación')
  return downloadJson(metaKey(comparisonId))
}

/** Recupera el resultado de una comparación específica (v1, v2, ...). */
export async function obtenerResultado(comparisonId, versionNumber) {
  const exists = await storageService.exists({ key: resultKey(comparisonId, versionNumber) })
  if (!exists) throw new NotFoundError(`Resultado v${versionNumber}`)
  return downloadJson(resultKey(comparisonId, versionNumber))
}
