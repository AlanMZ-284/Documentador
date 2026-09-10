/**
 * shared/utils/errors.js — Clases de error personalizadas y manejador global
 */

export class AppError extends Error {
  constructor(message, statusCode = 500, code = 'INTERNAL_ERROR') {
    super(message)
    this.statusCode = statusCode
    this.code = code
    this.name = 'AppError'
  }
}

export class NotFoundError extends AppError {
  constructor(resource = 'Recurso') {
    super(`${resource} no encontrado.`, 404, 'NOT_FOUND')
  }
}

export class ValidationError extends AppError {
  constructor(message) {
    super(message, 400, 'VALIDATION_ERROR')
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'No autorizado. Inicie sesión nuevamente.') {
    super(message, 401, 'UNAUTHORIZED')
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'No tiene permisos para realizar esta acción.') {
    super(message, 403, 'FORBIDDEN')
  }
}

/**
 * Manejador global de errores para Fastify.
 * Registrar con: app.setErrorHandler(globalErrorHandler)
 */
export function globalErrorHandler(error, request, reply) {
  const statusCode = error.statusCode || 500
  const isAppError = error instanceof AppError

  if (!isAppError && statusCode >= 500) {
    request.log.error({ err: error, url: request.url }, 'Error interno no controlado')
  }

  reply.code(statusCode).send({
    statusCode,
    error: error.code || 'ERROR',
    message: isAppError || statusCode < 500
      ? error.message
      : 'Ocurrió un error interno. Contacte al administrador del sistema.',
    ...(process.env.NODE_ENV === 'development' && !isAppError && { stack: error.stack }),
  })
}
