/**
 * shared/services/zip-extractor.service.js
 *
 * Extrae el contenido textual de archivos PDF, DOCX, XLSX, PPTX, TXT.
 * Genera un SHA-256 del binario para integridad/referencias en auditoría.
 *
 * Salida:
 *   {
 *     hash: string,           // SHA-256 del archivo original
 *     size: number,
 *     text: string,           // Texto extraído concatenado
 *     metadata: { pages?, sheets?, slides? }
 *   }
 *
 * Si el tipo no es soportado, devuelve { hash, size, text: '', metadata: {} }
 */

import crypto from 'node:crypto'
import AdmZip from 'adm-zip'
import { logger } from '../utils/logger.js'

// Lazy-loaded para no penalizar el arranque si no se usan
let pdfParse = null
let mammoth = null
let XLSX = null

async function ensurePdf()  { if (!pdfParse)  pdfParse  = (await import('pdf-parse')).default }
async function ensureDocx() { if (!mammoth)   mammoth   = (await import('mammoth')).default }
async function ensureXlsx() { if (!XLSX)      XLSX      = (await import('xlsx')) }

const TEXT_EXT = new Set(['txt', 'md', 'csv', 'log', 'json', 'xml', 'yml', 'yaml'])

function sha256(buffer) {
  return crypto.createHash('sha256').update(buffer).digest('hex')
}

function detectExt(name = '') {
  const m = String(name).toLowerCase().match(/\.([a-z0-9]+)$/)
  return m ? m[1] : ''
}

async function extractPdf(buffer) {
  await ensurePdf()
  const result = await pdfParse(buffer)
  return { text: result.text || '', metadata: { pages: result.numpages || 0 } }
}

async function extractDocx(buffer) {
  await ensureDocx()
  const { value } = await mammoth.extractRawText({ buffer })
  return { text: value || '', metadata: {} }
}

async function extractXlsx(buffer) {
  await ensureXlsx()
  const wb = XLSX.read(buffer, { type: 'buffer' })
  let text = ''
  for (const sheetName of wb.SheetNames) {
    const csv = XLSX.utils.sheet_to_csv(wb.Sheets[sheetName])
    text += `## Hoja: ${sheetName}\n${csv}\n\n`
  }
  return { text, metadata: { sheets: wb.SheetNames.length } }
}

async function extractPptx(buffer) {
  // PPTX es un zip con XMLs en ppt/slides/slide*.xml
  const zip = new AdmZip(buffer)
  const slideEntries = zip
    .getEntries()
    .filter((e) => /^ppt\/slides\/slide\d+\.xml$/.test(e.entryName))
    .sort((a, b) => a.entryName.localeCompare(b.entryName, undefined, { numeric: true }))
  let text = ''
  slideEntries.forEach((e, i) => {
    const xml = e.getData().toString('utf8')
    const words = xml
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
    text += `## Diapositiva ${i + 1}\n${words}\n\n`
  })
  return { text, metadata: { slides: slideEntries.length } }
}

async function extractText(buffer, ext) {
  return { text: buffer.toString('utf8'), metadata: {} }
}

/**
 * Extrae texto y metadatos de un Buffer.
 * @param {Object} opts
 * @param {Buffer} opts.buffer
 * @param {string} [opts.filename] — para detectar extensión
 * @returns {Promise<{hash:string, size:number, ext:string, text:string, metadata:object}>}
 */
export async function extractFromBuffer({ buffer, filename }) {
  const ext = detectExt(filename)
  const hash = sha256(buffer)
  const base = { hash, size: buffer.byteLength, ext }
  let text = ''
  let metadata = {}
  try {
    if (ext === 'pdf') ({ text, metadata } = await extractPdf(buffer))
    else if (ext === 'docx') ({ text, metadata } = await extractDocx(buffer))
    else if (ext === 'xlsx') ({ text, metadata } = await extractXlsx(buffer))
    else if (ext === 'pptx') ({ text, metadata } = await extractPptx(buffer))
    else if (TEXT_EXT.has(ext)) ({ text, metadata } = await extractText(buffer, ext))
    else logger.debug({ ext }, 'Tipo de archivo no soportado para extracción, se omite')
  } catch (err) {
    logger.warn({ err, ext, filename }, 'Fallo extrayendo texto, se devuelve vacío')
    text = ''
    metadata = { error: err.message }
  }
  return { ...base, text: text.trim(), metadata }
}

/**
 * Procesa un .zip que contiene múltiples documentos.
 * Devuelve un listado de extracciones (uno por archivo soportado dentro del zip).
 *
 * @param {Object} opts
 * @param {Buffer} opts.buffer — contenido del zip
 * @returns {Promise<{zipHash:string, files:Array}>}
 */
export async function extractFromZip({ buffer }) {
  const zipHash = sha256(buffer)
  const zip = new AdmZip(buffer)
  const entries = zip.getEntries().filter((e) => !e.isDirectory)
  const files = []
  for (const e of entries) {
    const name = e.entryName.split('/').pop()
    if (!name || name.startsWith('.') || name === '__MACOSX') continue
    const inner = e.getData()
    const extracted = await extractFromBuffer({ buffer: inner, filename: name })
    files.push({ name, path: e.entryName, ...extracted })
  }
  return { zipHash, files }
}

export const __test__ = { sha256, detectExt }
