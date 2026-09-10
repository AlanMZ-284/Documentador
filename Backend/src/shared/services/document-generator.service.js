/**
 * shared/services/document-generator.service.js
 * Generación de documentos Word (.docx) y PDF a partir de contenido IA
 */

import PizZip from 'pizzip'
import Docxtemplater from 'docxtemplater'
import puppeteer from 'puppeteer'
import { logger } from '../utils/logger.js'

export const documentGenerator = {
  /**
   * Genera buffers de Word y PDF a partir de los datos del documento.
   * @param {Object} documentData — { doc_type, client, area, fecha, sections, metadata }
   * @returns {Promise<{ wordBuffer: Buffer|null, pdfBuffer: Buffer|null }>}
   */
  async generate(documentData) {
    // Ejecutamos en paralelo para eficiencia
    const [wordResult, pdfResult] = await Promise.allSettled([
      this.generateWord(documentData),
      this.generatePdf(documentData),
    ])

    if (wordResult.status === 'rejected') logger.error({ err: wordResult.reason }, 'Error en generación Word')
    if (pdfResult.status === 'rejected') logger.error({ err: pdfResult.reason }, 'Error en generación PDF')

    return {
      wordBuffer: wordResult.status === 'fulfilled' ? wordResult.value : null,
      pdfBuffer:  pdfResult.status  === 'fulfilled' ? pdfResult.value  : null,
    }
  },

  /** Genera Word usando un motor de plantillas lógico */
  async generateWord(data) {
    try {
      // En un entorno real cargaríamos un .docx base. 
      // Aquí generamos un contenido estructurado que docxtemplater puede procesar.
      // Para efectos del MVP, simulamos la estructura que el cliente espera descargar.
      const content = `
        DOCUMENTO: ${data.doc_type}
        CLIENTE: ${data.client}
        AREA: ${data.area}
        FECHA: ${data.fecha}
        
        ${data.sections.map(s => `${s.section}\n${s.content?.contenido || ''}`).join('\n\n')}
      `
      // Nota: Para usar .docx real se requiere un archivo de plantilla físico.
      return Buffer.from(content, 'utf-8') 
    } catch (err) {
      throw err
    }
  },

  /** Genera PDF real usando Puppeteer (Navegador Headless) */
  async generatePdf(data) {
    let browser
    try {
      browser = await puppeteer.launch({ 
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox'] 
      })
      const page = await browser.newPage()
      
      const htmlContent = this.buildHtmlContent(data)
      await page.setContent(htmlContent, { waitUntil: 'networkidle0' })
      
      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: { top: '2cm', right: '2cm', bottom: '2cm', left: '2cm' }
      })

      return pdfBuffer
    } catch (err) {
      throw err
    } finally {
      if (browser) await browser.close()
    }
  },

  /** Construye el HTML con estilos corporativos para el PDF */
  buildHtmlContent(data) {
    const sectionsHtml = data.sections.map(({ section, content }) => `
      <div class="section">
        <h2>${section}</h2>
        <p>${(content?.contenido || '').replace(/\n/g, '<br>')}</p>
      </div>
    `).join('')

    return `
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; padding: 40px; }
            .header { border-bottom: 2px solid #003366; margin-bottom: 30px; padding-bottom: 10px; }
            h1 { color: #003366; text-transform: uppercase; }
            h2 { color: #005599; border-bottom: 1px solid #eee; }
            .meta { background: #f9f9f9; padding: 15px; border-left: 5px solid #003366; margin-bottom: 30px; }
            .section { margin-bottom: 25px; text-align: justify; }
            .footer { position: fixed; bottom: 0; width: 100%; text-align: center; font-size: 10px; color: #999; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>${data.doc_type}</h1>
            <p>${data.client} - ${data.area}</p>
          </div>
          <div class="meta">
            <strong>Fecha:</strong> ${data.fecha}<br>
            <strong>Responsable:</strong> ${data.metadata?.responsable || 'N/A'}
          </div>
          ${sectionsHtml}
          <div class="footer">Smart Knowledge CRM - Generado con IA</div>
        </body>
      </html>
    `
  }
}
