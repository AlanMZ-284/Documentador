/**
 * modules/aplicaciones/index.js
 */

import { aplicacionesRoutes } from './aplicaciones.routes.js'

export async function registerAplicacionesModule(app) {
  await app.register(aplicacionesRoutes)
}
