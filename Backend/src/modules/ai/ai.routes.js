/**
 * modules/ai/ai.routes.js — Módulo 2: Comparación y Análisis IA
 *
 * POST /api/v1/ai/compare        — Analizar diferencias entre dos documentos
 * GET  /api/v1/ai/analyses       — Listar análisis anteriores
 * GET  /api/v1/ai/analyses/:id   — Detalle de un análisis
 * POST /api/v1/ai/classify       — Clasificar documento manualmente con IA
 * POST /api/v1/ai/related/:id    — Sugerir documentos relacionados
 */

import { aiController } from './ai.controller.js'

export async function aiRoutes(app) {
  app.addHook('preHandler', app.authenticate)

  // Ejecutar análisis de comparación entre dos versiones
  app.post('/compare', {
    schema: {
      body: {
        type: 'object',
        required: ['document_a_id', 'document_b_id'],
        properties: {
          document_a_id:      { type: 'string' },
          document_b_id:      { type: 'string' },
          additional_context: { type: 'string' },
        },
      },
    },
  }, aiController.compare)

  // Listar análisis anteriores (paginados)
  app.get('/analyses', {
    schema: {
      querystring: {
        type: 'object',
        properties: {
          page:  { type: 'integer', default: 1 },
          limit: { type: 'integer', default: 20 },
        },
      },
    },
  }, aiController.listAnalyses)

  // Detalle de un análisis
  app.get('/analyses/:id', aiController.getAnalysis)

  // Reclasificar un documento con IA
  app.post('/classify/:documentId', aiController.classifyDocument)

  // Sugerir documentos relacionados
  app.post('/related/:documentId', aiController.suggestRelated)
}
