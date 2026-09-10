/**
 * modules/auth/auth.routes.js
 */

import {
  loginController,
  refreshController,
  logoutController,
  meController,
} from './auth.controller.js'

const loginSchema = {
  type: 'object',
  required: ['email', 'password'],
  properties: {
    email: { type: 'string', format: 'email', maxLength: 255 },
    password: { type: 'string', minLength: 1, maxLength: 256 },
  },
  additionalProperties: false,
}

export async function authRoutes(app) {
  // /api/auth/login → rate-limit específico (configurado globalmente en plugin)
  app.post('/api/auth/login', {
    config: app.loginRateLimit.config,
    schema: { body: loginSchema },
    handler: loginController,
  })
  app.post('/api/auth/refresh', { handler: refreshController })
  app.post('/api/auth/logout', {
    preHandler: [app.authenticate],
    handler: logoutController,
  })
  app.get('/api/auth/me', {
    preHandler: [app.authenticate],
    handler: meController,
  })
}
