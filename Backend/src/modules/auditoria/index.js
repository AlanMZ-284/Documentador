/**
 * modules/auditoria/index.js
 */

import { auditoriaRoutes } from './auditoria.routes.js'

export async function registerAuditoriaModule(app) {
  await app.register(auditoriaRoutes)
}
