/**
 * shared/services/version-compare.service.js — Fase 2
 *
 * Compara dos mapas de archivos (v0 base vs nueva versión) y produce un
 * objeto JSON estructurado con:
 *   - created   : archivos nuevos
 *   - deleted   : archivos eliminados
 *   - modified  : archivos cuyo hash cambió (con diff de líneas si son texto)
 *   - unchanged : conteo (no se listan para no inflar la respuesta)
 *
 * El diff línea a línea usa la librería `diff` (ya en package.json) y se
 * limita a archivos de texto por debajo de MAX_DIFF_BYTES.
 */

import { diffLines } from 'diff'

/** Tope de tamaño para calcular diff de contenido (evita diffs de MBs). */
const MAX_DIFF_BYTES = 512 * 1024 // 512 KB

/**
 * Resume un diff de `diffLines` en estadísticas + hunks compactos.
 * @returns {{linesAdded:number, linesRemoved:number, hunks:Array}}
 */
function summarizeLineDiff(oldContent, newContent) {
  const parts = diffLines(oldContent, newContent)
  let linesAdded = 0
  let linesRemoved = 0
  const hunks = []

  for (const part of parts) {
    const lineCount = part.count || 0
    if (part.added) {
      linesAdded += lineCount
      hunks.push({ type: 'added', lines: lineCount, preview: previewOf(part.value) })
    } else if (part.removed) {
      linesRemoved += lineCount
      hunks.push({ type: 'removed', lines: lineCount, preview: previewOf(part.value) })
    }
  }
  return { linesAdded, linesRemoved, hunks }
}

/** Primeras 5 líneas de un bloque, truncadas, para no inflar el JSON. */
function previewOf(text) {
  return text
    .split('\n')
    .slice(0, 5)
    .map((line) => (line.length > 200 ? `${line.slice(0, 200)}…` : line))
}

/**
 * Compara dos mapas de archivos.
 *
 * @param {Object} opts
 * @param {{files: Array}} opts.baseMap   — Mapa v0 (con content si se quiere diff)
 * @param {{files: Array}} opts.targetMap — Mapa nuevo (con content si se quiere diff)
 * @param {boolean} [opts.withContentDiff=true] — Calcular diff de líneas en texto
 * @returns {Object} Resultado estructurado de la comparación
 */
export function compareFileMaps({ baseMap, targetMap, withContentDiff = true }) {
  const baseByPath = new Map(baseMap.files.map((f) => [f.path, f]))
  const targetByPath = new Map(targetMap.files.map((f) => [f.path, f]))

  const created = []
  const deleted = []
  const modified = []
  let unchangedCount = 0

  // Creados y modificados
  for (const [path, targetFile] of targetByPath) {
    const baseFile = baseByPath.get(path)
    if (!baseFile) {
      created.push(stripContent(targetFile))
      continue
    }
    if (baseFile.hash === targetFile.hash) {
      unchangedCount++
      continue
    }
    const entry = {
      ...stripContent(targetFile),
      previousHash: baseFile.hash,
      previousSize: baseFile.size,
      sizeDelta: targetFile.size - baseFile.size,
    }
    const canDiff =
      withContentDiff &&
      baseFile.isText && targetFile.isText &&
      typeof baseFile.content === 'string' &&
      typeof targetFile.content === 'string' &&
      baseFile.size <= MAX_DIFF_BYTES &&
      targetFile.size <= MAX_DIFF_BYTES

    if (canDiff) {
      entry.diff = summarizeLineDiff(baseFile.content, targetFile.content)
    }
    modified.push(entry)
  }

  // Eliminados
  for (const [path, baseFile] of baseByPath) {
    if (!targetByPath.has(path)) deleted.push(stripContent(baseFile))
  }

  return {
    summary: {
      baseFiles: baseMap.totalFiles,
      targetFiles: targetMap.totalFiles,
      created: created.length,
      deleted: deleted.length,
      modified: modified.length,
      unchanged: unchangedCount,
    },
    created,
    deleted,
    modified,
  }
}

/** Devuelve el archivo sin el campo `content` (no debe viajar en la respuesta). */
function stripContent({ content, ...rest }) {
  return rest
}
