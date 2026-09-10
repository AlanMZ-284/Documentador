/**
 * modules/index.js — Registro centralizado de módulos
 *
 * Fase 2: módulos documentales completos (documentos, aplicaciones, proyectos,
 * plantillas, matriz_raci, firmas). El módulo legacy `ai` y `search` se
 * mantienen registrados como "stub" hasta F3. Los legacy `documents`,
 * `templates` ya fueron reemplazados por las nuevas versiones del DBML.
 */

import { registerAuthModule } from './auth/index.js'
import { registerUsuariosModule } from './usuarios/index.js'
import { registerAuditoriaModule } from './auditoria/index.js'
import { registerDocumentosModule } from './documentos/index.js'
import { registerAplicacionesModule } from './aplicaciones/index.js'
import { registerProyectosModule } from './proyectos/index.js'
import { registerPlantillasModule } from './plantillas/index.js'
import { registerMatrizRaciModule } from './matriz-raci/index.js'
import { registerFirmasModule } from './firmas/index.js'
import { registerComparacionesModule } from './comparaciones/index.js'
import { globalErrorHandler } from '../shared/utils/errors.js'

// Legacy pendientes (F3)
import { aiRoutes } from './ai/ai.routes.js'
import { searchRoutes } from './search/search.routes.js'

export async function registerRoutes(app) {
  app.setErrorHandler(globalErrorHandler)

  // ── Módulos migrados al DBML (Fase 1 + Fase 2) ────────────────────────────
  await registerAuthModule(app)
  await registerUsuariosModule(app)
  await registerAuditoriaModule(app)
  await registerDocumentosModule(app)
  await registerAplicacionesModule(app)
  await registerProyectosModule(app)
  await registerPlantillasModule(app)
  await registerMatrizRaciModule(app)
  await registerFirmasModule(app)
  await registerComparacionesModule(app)

  // Legacy modules pending F3
  app.log.warn('Legacy modules active: ai, search (remove in F3)')
  await app.register(aiRoutes, { prefix: '/api/v1/ai' })
  await app.register(searchRoutes, { prefix: '/api/v1/search' })

  app.log.info('Modules registered (Fase 1 + Fase 2 active)')
}
