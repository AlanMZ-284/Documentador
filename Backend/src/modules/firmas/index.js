/**
 * modules/firmas/index.js
 */

import { firmasRoutes } from './firmas.routes.js'

export async function registerFirmasModule(app) {
  await app.register(firmasRoutes)
}
