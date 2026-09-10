/**
 * modules/search/embedding.service.js — Generación de embeddings vectoriales reales
 *
 * Usa la API de OpenAI (text-embedding-3-small) para convertir texto en vectores.
 * Estos vectores permiten la búsqueda semántica en pgvector.
 */

import OpenAI from 'openai'
import { query } from '../../plugins/db.js'
import { logger } from '../../shared/utils/logger.js'

// Lazy init: instanciar al cargar el módulo tiraba TODO el servidor cuando
// OPENAI_API_KEY no estaba definida (frecuente en dev). El cliente se crea
// solo cuando se usa; sin API key, los embeddings devuelven null (degradado).
let openaiClient = null
function getOpenAI() {
  if (!process.env.OPENAI_API_KEY) return null
  if (!openaiClient) openaiClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  return openaiClient
}

const EMBEDDING_MODEL = 'text-embedding-3-small' // 1536 dimensiones

export const embeddingService = {
  /**
   * Genera embeddings para un array de textos (chunks).
   * @param {string[]} chunks — Array de fragmentos de texto
   * @returns {Promise<number[][]>} Array de vectores
   */
  async generateEmbeddings(chunks) {
    if (!chunks.length) return []
    
    try {
      const response = await openai.embeddings.create({
        model: EMBEDDING_MODEL,
        input: chunks,
      })
      
      return response.data.map(item => item.embedding)
    } catch (err) {
      logger.error({ err }, 'Error llamando a OpenAI Embeddings')
      // Fallback: devolver nulls para que el proceso continúe sin embeddings si falla la API
      return chunks.map(() => null)
    }
  },

  /**
   * Genera el embedding de una sola consulta de búsqueda.
   */
  async generateQueryEmbedding(text) {
    const openai = getOpenAI()
    if (!openai) {
      throw new Error('Búsqueda semántica no disponible: OPENAI_API_KEY no configurada.')
    }
    try {
      const response = await openai.embeddings.create({
        model: EMBEDDING_MODEL,
        input: text,
      })
      return response.data[0].embedding
    } catch (err) {
      logger.error({ err }, 'Error generando embedding de consulta')
      throw new Error('No se pudo procesar la búsqueda semántica. Intente búsqueda por texto.')
    }
  },

  /**
   * Busca los fragmentos más similares al embedding de la consulta usando pgvector.
   * @param {Object} opts
   * @param {number[]} opts.queryEmbedding — Vector de la consulta
   * @param {number} opts.limit — Cantidad de resultados
   * @param {number} opts.threshold — Umbral de similitud (0 a 1)
   */
  async similaritySearch({ queryEmbedding, limit = 10, threshold = 0.5 }) {
    try {
      // 1 - (vector <=> vector) es la similitud del coseno en pgvector
      const sql = `
        SELECT 
          document_id, 
          chunk_text, 
          1 - (embedding <=> $1::vector) AS score
        FROM document_embeddings
        WHERE 1 - (embedding <=> $1::vector) > $2
        ORDER BY score DESC 
        LIMIT $3
      `
      const { rows } = await query(sql, [JSON.stringify(queryEmbedding), threshold, limit])
      return rows
    } catch (err) {
      logger.error({ err }, 'Error en búsqueda de similitud pgvector')
      return []
    }
  },
}
