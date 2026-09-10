/**
 * plugins/index.js — Registro de plugins globales de Fastify
 *
 * Cambios en Fase 1:
 *  - Token JWT ahora carga id_usuario, correo_corporativo y nombre_rol.
 *  - requireRole valida por nombre_rol (string), no por role.
 *  - Nuevo decorador `auditContext` para inyectar ip, userAgent y requestId.
 *  - Rate limit específico para el endpoint de login.
 */

import cors from '@fastify/cors'
import jwt from '@fastify/jwt'
import multipart from '@fastify/multipart'
import rateLimit from '@fastify/rate-limit'
import { dbPlugin } from './db.js'
import { buildRequestContext } from '../shared/utils/request-context.js'

const MAX_FILE_BYTES = (Number(process.env.MAX_FILE_SIZE_MB) || 50) * 1024 * 1024

export async function registerPlugins(app) {
  // CORS
  const rawCorsOrigin = process.env.CORS_ORIGIN ?? ''
  const allowedOrigins = rawCorsOrigin
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean)

  const isLocalOrigin = (origin) =>
    /^https?:\/\/(?:localhost|127\.0\.0\.1)(?::\d+)?$/.test(origin)

  const corsOrigin = (origin, cb) => {
    if (!origin) {
      return cb(null, true)
    }

    if (process.env.NODE_ENV !== 'production' && isLocalOrigin(origin)) {
      return cb(null, true)
    }

    if (allowedOrigins.includes(origin)) {
      return cb(null, true)
    }

    cb(new Error('Not allowed'), false)
  }

  await app.register(cors, {
    origin: corsOrigin,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  })

  // JWT
  await app.register(jwt, {
    secret: process.env.JWT_SECRET || 'dev_secret_cambia_en_produccion',
    sign: { expiresIn: process.env.JWT_EXPIRES_IN || '8h' },
  })

  // Multipart — para upload de archivos
  await app.register(multipart, {
    limits: {
      fileSize: MAX_FILE_BYTES,
      files: 20,
      fieldSize: 1024 * 1024,
    },
  })

  // Rate limiting global
  await app.register(rateLimit, {
    max: Number(process.env.RATE_LIMIT_MAX) || 100,
    timeWindow: Number(process.env.RATE_LIMIT_WINDOW_MS) || 60_000,
    errorResponseBuilder: () => ({
      statusCode: 429,
      error: 'Too Many Requests',
      message: 'Límite de solicitudes alcanzado. Intente de nuevo en un momento.',
    }),
  })

  // Plugin de base de datos (pg pool)
  await app.register(dbPlugin)

  // Contexto de auditoría disponible en cada request
  app.decorateRequest('auditContext', null)
  app.addHook('onRequest', async (request) => {
    request.auditContext = buildRequestContext(request)
  })

  // Autenticación — decodifica y enriquece con datos del usuario
  app.decorate('authenticate', async (request, reply) => {
    try {
      await request.jwtVerify()
    } catch (err) {
      reply.code(401).send({
        statusCode: 401,
        error: 'No autorizado',
        message: 'Token inválido o expirado. Inicie sesión nuevamente.',
      })
    }
  })

  // requireRole acepta un string o un array de nombres de rol
  app.decorate('requireRole', (roles) => async (request, reply) => {
    await app.authenticate(request, reply)
    if (reply.sent) return
    const allowed = Array.isArray(roles) ? roles : [roles]
    const userRole = request.user?.nombre_rol
    if (!userRole || !allowed.includes(userRole)) {
      reply.code(403).send({
        statusCode: 403,
        error: 'Acceso denegado',
        message: `Se requiere uno de los roles: ${allowed.join(', ')}.`,
      })
    }
  })

  // Helper para que las rutas declaren su rate limit de login (anti brute force)
  app.decorate('loginRateLimit', {
    config: {
      rateLimit: {
        max: Number(process.env.LOGIN_RATE_LIMIT_MAX) || 10,
        timeWindow: Number(process.env.LOGIN_RATE_LIMIT_WINDOW_MS) || 60_000,
        errorResponseBuilder: () => ({
          statusCode: 429,
          error: 'Too Many Requests',
          message: 'Demasiados intentos de inicio de sesión. Espere un momento.',
        }),
      },
    },
  })
}
