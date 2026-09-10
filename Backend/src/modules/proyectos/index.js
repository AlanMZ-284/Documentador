/**
 * modules/proyectos/index.js
 */

import { proyectosRoutes } from './proyectos.routes.js'

export async function registerProyectosModule(app) {
  await app.register(proyectosRoutes)
}
