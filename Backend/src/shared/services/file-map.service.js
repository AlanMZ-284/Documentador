/**
 * shared/services/file-map.service.js — Fase 2 (Motor de comparación)
 *
 * Genera el mapa completo de archivos de un .zip:
 * por cada archivo: ruta, nombre, extensión, tamaño, hash SHA-256,
 * categoría y bandera de si es texto (para diff de contenido).
 *
 * El mapa resultante es el "estado" de una versión (v0, v1, ...).
 */

import crypto from 'node:crypto'
import AdmZip from 'adm-zip'

/** Extensiones soportadas oficialmente por el Documentador (requerimiento F2). */
export const SUPPORTED_EXTENSIONS = new Set([
  'js', 'ts', 'tsx', 'jsx', 'html', 'css', 'scss', 'php', 'py', 'java',
  'cs', 'cpp', 'c', 'h', 'hpp', 'xml', 'json', 'yaml', 'yml', 'sql',
  'md', 'txt', 'pdf', 'docx', 'xlsx', 'pptx',
])

/** Extensiones cuyo contenido es texto plano (aptas para diff línea a línea). */
const TEXT_EXTENSIONS = new Set([
  'js', 'ts', 'tsx', 'jsx', 'html', 'css', 'scss', 'php', 'py', 'java',
  'cs', 'cpp', 'c', 'h', 'hpp', 'xml', 'json', 'yaml', 'yml', 'sql',
  'md', 'txt', 'csv', 'env', 'gitignore', 'editorconfig', 'toml', 'ini',
  'sh', 'bat', 'ps1', 'vue', 'svelte', 'rb', 'go', 'rs', 'kt',
])

const CATEGORY_BY_EXTENSION = {
  codigo: ['js', 'ts', 'tsx', 'jsx', 'php', 'py', 'java', 'cs', 'cpp', 'c', 'h', 'hpp', 'vue', 'svelte', 'rb', 'go', 'rs', 'kt', 'sql'],
  estilos: ['css', 'scss', 'sass', 'less'],
  markup: ['html', 'xml'],
  config: ['json', 'yaml', 'yml', 'toml', 'ini', 'env', 'editorconfig'],
  documentacion: ['md', 'txt', 'pdf', 'docx', 'xlsx', 'pptx'],
  recurso: ['png', 'jpg', 'jpeg', 'gif', 'svg', 'ico', 'webp', 'woff', 'woff2', 'ttf', 'eot', 'mp4', 'mp3'],
}

/** Directorios que se excluyen del análisis (ruido, no aportan al diff). */
const IGNORED_DIRECTORIES = new Set([
  'node_modules', '.git', '__MACOSX', 'dist', 'build', '.next', '.nuxt',
  'vendor', '__pycache__', '.idea', '.vscode', 'coverage', '.cache',
])

function sha256(buffer) {
  return crypto.createHash('sha256').update(buffer).digest('hex')
}

function getExtension(filename = '') {
  const match = String(filename).toLowerCase().match(/\.([a-z0-9]+)$/)
  return match ? match[1] : ''
}

function getCategory(extension) {
  for (const [category, extensions] of Object.entries(CATEGORY_BY_EXTENSION)) {
    if (extensions.includes(extension)) return category
  }
  return 'otro'
}

/** ¿La ruta cae dentro de un directorio ignorado? */
function isIgnoredPath(entryPath) {
  return entryPath
    .split('/')
    .some((segment) => IGNORED_DIRECTORIES.has(segment))
}

/**
 * Construye el mapa de archivos de un .zip.
 *
 * @param {Object} opts
 * @param {Buffer} opts.buffer — Contenido binario del .zip
 * @param {boolean} [opts.includeContent=false] — Incluir contenido de archivos
 *   de texto en memoria (necesario para diff línea a línea).
 * @returns {{
 *   zipHash: string,
 *   totalFiles: number,
 *   totalBytes: number,
 *   files: Array<{
 *     path: string, name: string, extension: string, category: string,
 *     size: number, hash: string, isText: boolean, isSupported: boolean,
 *     content?: string
 *   }>
 * }}
 */
export function buildFileMap({ buffer, includeContent = false }) {
  const zip = new AdmZip(buffer)
  const entries = zip.getEntries().filter((e) => !e.isDirectory)
  const files = []
  let totalBytes = 0

  for (const entry of entries) {
    const path = entry.entryName
    const name = path.split('/').pop()
    if (!name || name.startsWith('._') || isIgnoredPath(path)) continue

    const data = entry.getData()
    const extension = getExtension(name)
    const isText = TEXT_EXTENSIONS.has(extension)
    totalBytes += data.byteLength

    const fileInfo = {
      path,
      name,
      extension,
      category: getCategory(extension),
      size: data.byteLength,
      hash: sha256(data),
      isText,
      isSupported: SUPPORTED_EXTENSIONS.has(extension),
    }
    if (includeContent && isText) {
      fileInfo.content = data.toString('utf8')
    }
    files.push(fileInfo)
  }

  files.sort((a, b) => a.path.localeCompare(b.path))

  return {
    zipHash: sha256(buffer),
    totalFiles: files.length,
    totalBytes,
    files,
  }
}

export const __test__ = { sha256, getExtension, getCategory, isIgnoredPath }
