/**
 * modules/ai/ai.controller.js — Controlador de Comparación y Análisis IA
 */

import { query } from '../../plugins/db.js'
import { aiService } from './ai.service.js'
import { NotFoundError, ValidationError } from '../../shared/utils/errors.js'
import { auditLog } from '../../shared/utils/audit.js'

export const aiController = {
  /**
   * POST /ai/compare
   * Analiza diferencias entre dos versiones de documentos con Claude
   */
  async compare(request, reply) {
    const { document_a_id, document_b_id, additional_context } = request.body

    if (document_a_id === document_b_id) {
      throw new ValidationError('Los documentos seleccionados deben ser diferentes.')
    }

    // Obtener ambos documentos
    const { rows } = await query(
      'SELECT id, name, doc_type, area, client, tags, summary, version_label FROM documents WHERE id = ANY($1) AND is_deleted = FALSE',
      [[document_a_id, document_b_id]]
    )
    if (rows.length < 2) throw new NotFoundError('Uno o ambos documentos')

    const docA = rows.find(d => d.id === document_a_id)
    const docB = rows.find(d => d.id === document_b_id)
    if (!docA || !docB) throw new NotFoundError('Documentos para comparación')

    // Llamar a Claude para el análisis
    const analysisResult = await aiService.analyzeComparison({
      docA, docB, additionalContext: additional_context,
    })

    // Persistir el análisis
    const { rows: [saved] } = await query(
      `INSERT INTO ai_analyses
         (document_a_id, document_b_id, analysis_type, result_json, impact_level, summary, performed_by)
       VALUES ($1, $2, 'comparison', $3, $4, $5, $6)
       RETURNING id, created_at`,
      [
        document_a_id, document_b_id,
        JSON.stringify(analysisResult),
        analysisResult.impacto_general,
        analysisResult.resumen_ejecutivo,
        request.user.sub,
      ]
    )

    await auditLog({
      userId: request.user.sub,
      action: 'AI_COMPARISON',
      entityType: 'ai_analysis',
      entityId: saved.id,
      metadata: { document_a_id, document_b_id, impact: analysisResult.impacto_general },
    })

    return reply.code(201).send({
      id: saved.id,
      created_at: saved.created_at,
      document_a: { id: docA.id, name: docA.name, version: docA.version_label },
      document_b: { id: docB.id, name: docB.name, version: docB.version_label },
      analysis: analysisResult,
    })
  },

  /**
   * GET /ai/analyses — Listar análisis con paginación
   */
  async listAnalyses(request, reply) {
    const { page = 1, limit = 20 } = request.query
    const offset = (page - 1) * limit

    const { rows } = await query(
      `SELECT
         a.id, a.impact_level, a.summary, a.created_at,
         da.name AS doc_a_name, db.name AS doc_b_name,
         u.name AS performed_by_name
       FROM ai_analyses a
       JOIN documents da ON da.id = a.document_a_id
       JOIN documents db ON db.id = a.document_b_id
       LEFT JOIN users u ON u.id = a.performed_by
       ORDER BY a.created_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    )
    const { rows: [{ count }] } = await query('SELECT COUNT(*) FROM ai_analyses')

    return {
      data: rows,
      pagination: { page, limit, total: parseInt(count), pages: Math.ceil(count / limit) },
    }
  },

  /**
   * GET /ai/analyses/:id — Detalle completo de un análisis
   */
  async getAnalysis(request, reply) {
    const { rows } = await query(
      `SELECT a.*, da.name AS doc_a_name, db.name AS doc_b_name
       FROM ai_analyses a
       JOIN documents da ON da.id = a.document_a_id
       JOIN documents db ON db.id = a.document_b_id
       WHERE a.id = $1`,
      [request.params.id]
    )
    if (!rows[0]) throw new NotFoundError('Análisis')
    return rows[0]
  },

  /**
   * POST /ai/classify/:documentId — Reclasificar documento con IA
   */
  async classifyDocument(request, reply) {
    const { documentId } = request.params
    const { rows } = await query(
      'SELECT id, name, summary FROM documents WHERE id = $1 AND is_deleted = FALSE',
      [documentId]
    )
    if (!rows[0]) throw new NotFoundError('Documento')

    const metadata = await aiService.classifyDocument({
      text: rows[0].summary || '',
      filename: rows[0].name,
    })

    await query(
      `UPDATE documents SET
         doc_type = $1, area = $2, client = $3, tags = $4,
         summary = $5, responsible = $6, updated_at = NOW()
       WHERE id = $7`,
      [metadata.tipo, metadata.area, metadata.cliente, metadata.tags,
       metadata.resumen, metadata.responsable, documentId]
    )

    return { message: 'Documento reclasificado correctamente.', metadata }
  },

  /**
   * POST /ai/related/:documentId — Sugerir documentos relacionados
   */
  async suggestRelated(request, reply) {
    const { documentId } = request.params
    const { rows: [reference] } = await query(
      'SELECT id, name, doc_type, client, tags, summary FROM documents WHERE id = $1 AND is_deleted = FALSE',
      [documentId]
    )
    if (!reference) throw new NotFoundError('Documento')

    const { rows: candidates } = await query(
      'SELECT id, name, doc_type, client, tags, summary FROM documents WHERE id != $1 AND is_deleted = FALSE AND index_status = $2 LIMIT 20',
      [documentId, 'indexado']
    )

    const relations = await aiService.suggestRelatedDocuments({ reference, candidates })

    // Enriquecer con datos de los documentos
    const enriched = relations
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
      .map(r => ({
        ...r,
        document: candidates.find(c => c.id === r.id),
      }))
      .filter(r => r.document)

    return { reference_id: documentId, related: enriched }
  },
}
