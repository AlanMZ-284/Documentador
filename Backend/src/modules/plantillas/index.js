/**
 * modules/plantillas/index.js
 */

import { plantillasRoutes } from './plantillas.routes.js'

export async function registerPlantillasModule(app) {
  await app.register(plantillasRoutes)
}
