/**
 * shared/services/text-extractor.service.js — Extracción de texto de múltiples formatos
 */

import pdf from 'pdf-parse'
import mammoth from 'mammoth'
import { logger } from '../utils/logger.js'

export const textExtractorService = {
  /**
   * Extrae texto plano de un buffer según su extensión
   * @param {Buffer} buffer — Contenido del archivo
   * @param {string} extension — Extensión del archivo (pdf, docx, txt, etc.)
   * @returns {Promise<string>} Texto extraído
   */
  async extractText(buffer, extension) {
    const ext = extension.toLowerCase().replace('.', '')

    try {
      switch (ext) {
        case 'pdf':
          return await this.extractFromPdf(buffer)
        case 'docx':
          return await this.extractFromDocx(buffer)
        case 'txt':
          return buffer.toString('utf-8')
        default:
          logger.warn({ ext }, 'Extracción no soportada para esta extensión, se devuelve texto vacío')
          return ''
      }
    } catch (err) {
      logger.error({ err, ext }, 'Error extrayendo texto del documento')
      throw new Error(`Error al leer el contenido del archivo ${ext.toUpperCase()}`)
    }
  },

  /** Extrae texto de un PDF usando pdf-parse */
  async extractFromPdf(buffer) {
    const data = await pdf(buffer)
    return data.text || ''
  },

  /** Extrae texto de un Word usando mammoth (solo texto plano) */
  async extractFromDocx(buffer) {
    const result = await mammoth.extractRawText({ buffer })
    return result.value || ''
  }
}
