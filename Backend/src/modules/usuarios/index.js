/**
 * modules/usuarios/index.js — Registro del módulo de usuarios
 */

import { usuariosRoutes } from './usuarios.routes.js'

export async function registerUsuariosModule(app) {
  await app.register(usuariosRoutes)
}
