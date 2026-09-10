/**
 * modules/documentos/index.js
 */

import { documentosRoutes } from './documentos.routes.js'

export async function registerDocumentosModule(app) {
  await app.register(documentosRoutes)
}
