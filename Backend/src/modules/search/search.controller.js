/**
 * modules/search/search.controller.js — Controlador de Búsqueda Semántica
 */

import { query } from '../../plugins/db.js'
import { aiService } from '../ai/ai.service.js'
import { embeddingService } from './embedding.service.js'
import { logger } from '../../shared/utils/logger.js'

export const searchController = {
  /**
   * POST /search
   * Flujo completo:
   * 1. IA interpreta la consulta en lenguaje natural
   * 2. Genera embedding de la consulta
   * 3. Búsqueda vectorial en pgvector
   * 4. Búsqueda full-text como complemento
   * 5. Fusión y ranking de resultados
   * 6. Registrar en search_logs para auditoría
   */
  async search(request, reply) {
    const startTime = Date.now()
    const { query: userQuery, filters = {}, limit = 10, threshold = 0.5 } = request.body
    const userId = request.user.sub

    // ── Paso 1: Interpretación IA de la consulta ─────────────────────────
    const interpretation = await aiService.interpretSearchQuery({
      query: userQuery,
      availableFilters: { doc_types: ['Contrato','Factura','Propuesta','Minuta','Política','Manual'], areas: ['Legal','PMO','Operaciones','Compliance'] },
    }).catch(err => {
      logger.warn({ err }, 'Interpretación IA falló, usando búsqueda directa')
      return { terminos_busqueda: userQuery.split(' ').filter(w => w.length > 2), filtros: {}, entidades: {} }
    })

    // ── Paso 2: Aplicar filtros de la interpretación + los del usuario ────
    const mergedFilters = { ...interpretation.filtros, ...filters }
    const searchTerms  = interpretation.terminos_busqueda?.join(' ') || userQuery

    // ── Paso 3: Búsqueda vectorial (pgvector) ────────────────────────────
    const queryEmbedding = await embeddingService.generateQueryEmbedding(searchTerms)
    const vectorResults  = await embeddingService.similaritySearch({
      queryEmbedding, limit, threshold,
    })

    // ── Paso 4: Búsqueda full-text complementaria ─────────────────────────
    const params  = [`%${searchTerms}%`]
    const clauses = [
      `d.is_deleted = FALSE`,
      `d.index_status = 'indexado'`,
      `(d.name ILIKE $1 OR d.summary ILIKE $1 OR d.client ILIKE $1 OR $1 ILIKE ANY(ARRAY(SELECT '%' || unnest(d.tags) || '%')))`,
    ]

    if (mergedFilters.doc_type) {
      params.push(mergedFilters.doc_type)
      clauses.push(`d.doc_type = $${params.length}`)
    }
    if (mergedFilters.area) {
      params.push(mergedFilters.area)
      clauses.push(`d.area = $${params.length}`)
    }
    if (interpretation.entidades?.cliente) {
      params.push(`%${interpretation.entidades.cliente}%`)
      clauses.push(`d.client ILIKE $${params.length}`)
    }

    params.push(limit)
    const { rows: textResults } = await query(
      `SELECT
         d.id, d.name, d.doc_type, d.area, d.client, d.tags, d.summary,
         d.version_label, d.size_bytes, d.created_at, d.indexed_at,
         u.name AS uploaded_by_name
       FROM documents d
       LEFT JOIN users u ON u.id = d.uploaded_by
       WHERE ${clauses.join(' AND ')}
       ORDER BY d.indexed_at DESC
       LIMIT $${params.length}`,
      params
    )

    // ── Paso 5: Fusionar y rankear resultados ────────────────────────────
    const vectorIds = new Set(vectorResults.map(r => r.document_id))
    const results   = textResults.map((doc, idx) => {
      const vectorMatch = vectorResults.find(r => r.document_id === doc.id)
      const baseScore   = vectorMatch ? vectorMatch.score : 0
      const posScore    = Math.max(0, 1 - idx * 0.08)
      const score       = vectorMatch
        ? (baseScore * 0.7 + posScore * 0.3)
        : (posScore * 0.6)

      return {
        ...doc,
        score:     parseFloat(score.toFixed(4)),
        fragmento: doc.summary
          ? doc.summary.slice(0, 200) + (doc.summary.length > 200 ? '…' : '')
          : `Documento ${doc.doc_type} del cliente ${doc.client}.`,
        matched_by: vectorMatch ? 'semantic+text' : 'text',
      }
    }).sort((a, b) => b.score - a.score)

    // ── Paso 6: Guardar en audit log ──────────────────────────────────────
    const duration = Date.now() - startTime
    await query(
      `INSERT INTO search_logs (query, interpretation, result_count, performed_by, duration_ms)
       VALUES ($1, $2, $3, $4, $5)`,
      [userQuery, JSON.stringify(interpretation), results.length, userId, duration]
    ).catch(err => logger.warn({ err }, 'Error guardando log de búsqueda'))

    return {
      query: userQuery,
      interpretation,
      results,
      meta: {
        total: results.length,
        duration_ms: duration,
        search_type: vectorResults.length > 0 ? 'semantic+text' : 'text',
      },
    }
  },

  /**
   * GET /search/history — Historial de búsquedas del usuario autenticado
   */
  async history(request, reply) {
    const { rows } = await query(
      `SELECT id, query, result_count, duration_ms, created_at
       FROM search_logs
       WHERE performed_by = $1
       ORDER BY created_at DESC
       LIMIT 50`,
      [request.user.sub]
    )
    return { history: rows }
  },

  /**
   * GET /search/suggest?q=texto — Sugerencias de autocompletado
   */
  async suggest(request, reply) {
    const { q = '' } = request.query
    if (q.length < 2) return { suggestions: [] }

    const { rows } = await query(
      `SELECT DISTINCT query, COUNT(*) AS frequency
       FROM search_logs
       WHERE query ILIKE $1
       GROUP BY query
       ORDER BY frequency DESC
       LIMIT 8`,
      [`%${q}%`]
    )

    return { suggestions: rows.map(r => r.query) }
  },
}
