/**
 * modules/auth/auth.controller.js
 */

import { authenticate, buildJwtToken, registerSession, revokeSession } from './auth.service.js'
import { auditLog, AUDIT_ACTIONS } from '../../shared/utils/audit.js'
import { getUsuarioById } from '../usuarios/usuarios.service.js'
import { getUserAgent, getOrCreateRequestId } from '../../shared/utils/request-context.js'

export async function loginController(request, reply) {
  const { email, password } = request.body
  const ip = request.auditContext?.ip
  const requestId = request.auditContext?.requestId
  const result = await authenticate({ correo: email, password, ip, requestId })
  if (!result.ok) {
    if (result.reason === 'LOCKED') {
      return reply.code(423).send({
        statusCode: 423,
        error: 'Cuenta bloqueada',
        message: `Demasiados intentos fallidos. Espere ${process.env.LOGIN_LOCKOUT_MINUTES || 15} minutos.`,
      })
    }
    return reply.code(401).send({
      statusCode: 401,
      error: 'No autorizado',
      message: 'Credenciales incorrectas.',
    })
  }
  const token = buildJwtToken(reply.server, result.user)
  const expiresAt = new Date(Date.now() + 8 * 60 * 60 * 1000) // 8h
  await registerSession({
    idUsuario: result.user.sub,
    ip,
    userAgent: getUserAgent(request),
    token,
    expiresAt,
  })
  return reply.send({
    token,
    user: {
      id: result.user.sub,
      correo_corporativo: result.user.correo_corporativo,
      id_rol: result.user.id_rol,
      nombre_rol: result.user.nombre_rol,
      permisos: result.user.permisos,
    },
  })
}

export async function refreshController(request, reply) {
  try {
    await request.jwtVerify()
  } catch {
    return reply.code(401).send({
      statusCode: 401,
      error: 'No autorizado',
      message: 'Token inválido o expirado.',
    })
  }
  const user = await getUsuarioById(request.user.sub)
  if (!user || !user.activo) {
    return reply.code(401).send({
      statusCode: 401,
      error: 'No autorizado',
      message: 'Sesión inválida.',
    })
  }
  const token = buildJwtToken(reply.server, {
    sub: user.id_usuario,
    correo_corporativo: user.correo_corporativo,
    id_rol: user.id_rol,
    nombre_rol: user.nombre_rol,
  })
  return reply.send({ token })
}

export async function logoutController(request, reply) {
  const auth = request.headers?.authorization
  const token = auth?.startsWith('Bearer ') ? auth.slice(7) : null
  if (token) await revokeSession(token)
  await auditLog({
    idUsuario: request.user.sub,
    tipoAccion: AUDIT_ACTIONS.AUTH_LOGOUT,
    ip: request.auditContext?.ip,
    detalles: { requestId: getOrCreateRequestId(request) },
  })
  return reply.send({ message: 'Sesión cerrada correctamente.' })
}

export async function meController(request, reply) {
  const user = await getUsuarioById(request.user.sub)
  if (!user) {
    return reply.code(404).send({ statusCode: 404, error: 'No encontrado', message: 'Usuario no encontrado.' })
  }
  const { password_hash, ...safe } = user
  return reply.send(safe)
}
