/**
 * modules/comparaciones/index.js
 */

import { comparacionesRoutes } from './comparaciones.routes.js'

export async function registerComparacionesModule(app) {
  await app.register(comparacionesRoutes)
}
