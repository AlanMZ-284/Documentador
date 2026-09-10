/**
 * modules/matriz-raci/index.js
 */

import { matrizRaciRoutes } from './matriz-raci.routes.js'

export async function registerMatrizRaciModule(app) {
  await app.register(matrizRaciRoutes)
}
