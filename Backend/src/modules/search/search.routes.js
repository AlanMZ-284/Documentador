/**
 * modules/search/search.routes.js — Módulo 3: Búsqueda Semántica
 *
 * POST /api/v1/search          — Búsqueda semántica en lenguaje natural
 * GET  /api/v1/search/history  — Historial de búsquedas del usuario
 * GET  /api/v1/search/suggest  — Autocompletado de consultas
 */

import { searchController } from './search.controller.js'

export async function searchRoutes(app) {
  app.addHook('preHandler', app.authenticate)

  app.post('/', {
    schema: {
      body: {
        type: 'object',
        required: ['query'],
        properties: {
          query:      { type: 'string', minLength: 3, maxLength: 500 },
          filters:    { type: 'object' },
          limit:      { type: 'integer', default: 10, minimum: 1, maximum: 50 },
          threshold:  { type: 'number', default: 0.5, minimum: 0, maximum: 1 },
        },
      },
    },
  }, searchController.search)

  app.get('/history', searchController.history)

  app.get('/suggest', {
    schema: {
      querystring: {
        type: 'object',
        properties: { q: { type: 'string' } },
      },
    },
  }, searchController.suggest)
}
