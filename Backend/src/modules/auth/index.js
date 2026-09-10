/**
 * modules/auth/index.js — Registro del módulo de autenticación
 */

import { authRoutes } from './auth.routes.js'

export async function registerAuthModule(app) {
  await app.register(authRoutes)
}
