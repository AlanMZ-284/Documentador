/**
 * modules/comparaciones/comparaciones.routes.js — Fase 2
 */

import {
  crearVersionBaseController,
  compararController,
  obtenerComparacionController,
  obtenerResultadoController,
} from './comparaciones.controller.js'

const idParamSchema = {
  type: 'object',
  required: ['id'],
  properties: { id: { type: 'string', format: 'uuid' } },
}

const resultadoParamSchema = {
  type: 'object',
  required: ['id', 'version'],
  properties: {
    id: { type: 'string', format: 'uuid' },
    version: { type: 'integer', minimum: 1 },
  },
}

export async function comparacionesRoutes(app) {
  // Registrar la versión base (v0) de un proyecto
  app.post('/api/comparaciones/base', {
    preHandler: [app.authenticate],
    handler: crearVersionBaseController,
  })

  // Comparar un nuevo .zip contra la base
  app.post('/api/comparaciones/:id/comparar', {
    preHandler: [app.authenticate],
    schema: { params: idParamSchema },
    handler: compararController,
  })

  // Metadata de la comparación (frameworks, lenguajes, versiones corridas)
  app.get('/api/comparaciones/:id', {
    preHandler: [app.authenticate],
    schema: { params: idParamSchema },
    handler: obtenerComparacionController,
  })

  // Resultado de una comparación específica
  app.get('/api/comparaciones/:id/resultados/:version', {
    preHandler: [app.authenticate],
    schema: { params: resultadoParamSchema },
    handler: obtenerResultadoController,
  })
}
