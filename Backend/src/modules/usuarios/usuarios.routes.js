/**
 * modules/usuarios/usuarios.routes.js
 * Rutas HTTP para gestión de usuarios.
 * Protegidas con requireRole: SuperAdministrador y Administrador.
 */

import {
  listUsuariosController,
  getUsuarioController,
  createUsuarioController,
  updateUsuarioController,
  resetPasswordController,
  deactivateUsuarioController,
  activateUsuarioController,
} from './usuarios.controller.js'
import {
  idParamSchema,
  listQuerySchema,
  createUsuarioSchema,
  updateUsuarioSchema,
  resetPasswordSchema,
} from './usuarios.schemas.js'

export async function usuariosRoutes(app) {
  const ADMIN_ONLY = { preHandler: [app.requireRole(['SuperAdministrador', 'Administrador'])] }
  const SUPER_ONLY = { preHandler: [app.requireRole('SuperAdministrador')] }

  // Listar y crear → Administrador o SuperAdministrador
  app.get('/api/usuarios', {
    ...ADMIN_ONLY,
    schema: { querystring: listQuerySchema },
    handler: listUsuariosController,
  })
  app.post('/api/usuarios', {
    ...ADMIN_ONLY,
    schema: { body: createUsuarioSchema },
    handler: createUsuarioController,
  })
  app.get('/api/usuarios/:id', {
    ...ADMIN_ONLY,
    schema: { params: idParamSchema },
    handler: getUsuarioController,
  })
  app.patch('/api/usuarios/:id', {
    ...ADMIN_ONLY,
    schema: { params: idParamSchema, body: updateUsuarioSchema },
    handler: updateUsuarioController,
  })
  app.post('/api/usuarios/:id/reset-password', {
    ...ADMIN_ONLY,
    schema: { params: idParamSchema, body: resetPasswordSchema },
    handler: resetPasswordController,
  })
  app.post('/api/usuarios/:id/deactivate', {
    ...ADMIN_ONLY,
    schema: { params: idParamSchema },
    handler: deactivateUsuarioController,
  })
  app.post('/api/usuarios/:id/activate', {
    ...ADMIN_ONLY,
    schema: { params: idParamSchema },
    handler: activateUsuarioController,
  })
}
