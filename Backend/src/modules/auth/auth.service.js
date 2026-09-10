/**
 * modules/auth/auth.service.js
 * Lógica de autenticación contra la tabla `usuarios` del DBML.
 * Implementa:
 *   - Lockout por intentos fallidos (LOGIN_MAX_ATTEMPTS en ventana LOGIN_LOCKOUT_MINUTES).
 *   - Hash de contraseña con bcrypt (cost configurable).
 *   - Construcción de payload JWT con id_usuario, nombre_rol, permisos.
 */

import bcrypt from 'bcryptjs'
import { getUsuarioByEmailForAuth, updateLastLogin } from '../usuarios/usuarios.service.js'
import { countRecentFailedLogins, auditLog, AUDIT_ACTIONS } from '../../shared/utils/audit.js'
import { query } from '../../plugins/db.js'
import { logger } from '../../shared/utils/logger.js'

const MAX_ATTEMPTS = Number(process.env.LOGIN_MAX_ATTEMPTS) || 5
const LOCKOUT_MINUTES = Number(process.env.LOGIN_LOCKOUT_MINUTES) || 15

export async function isLockedOut(correo) {
  const attempts = await countRecentFailedLogins(correo, LOCKOUT_MINUTES)
  return attempts >= MAX_ATTEMPTS
}

export async function authenticate({ correo, password, ip, requestId }) {
  const lowerEmail = correo.toLowerCase().trim()
  // 1. ¿Cuenta bloqueada por intentos previos?
  const locked = await isLockedOut(lowerEmail)
  if (locked) {
    await auditLog({
      idUsuario: null,
      tipoAccion: AUDIT_ACTIONS.AUTH_LOGIN_LOCKED,
      ip,
      detalles: { correo: lowerEmail, ventana_minutos: LOCKOUT_MINUTES, max_intentos: MAX_ATTEMPTS, requestId },
    })
    return { ok: false, reason: 'LOCKED' }
  }
  // 2. Buscar usuario
  const user = await getUsuarioByEmailForAuth(lowerEmail)
  if (!user || !user.activo) {
    await auditLog({
      idUsuario: null,
      tipoAccion: AUDIT_ACTIONS.AUTH_LOGIN_FAIL,
      ip,
      detalles: { correo: lowerEmail, motivo: user ? 'inactivo' : 'no_existe', requestId },
    })
    return { ok: false, reason: 'INVALID_CREDENTIALS' }
  }
  // 3. Comparar password
  const ok = await bcrypt.compare(password, user.password_hash)
  if (!ok) {
    await auditLog({
      idUsuario: user.id_usuario,
      tipoAccion: AUDIT_ACTIONS.AUTH_LOGIN_FAIL,
      ip,
      detalles: { correo: lowerEmail, motivo: 'password_invalido', requestId },
    })
    return { ok: false, reason: 'INVALID_CREDENTIALS' }
  }
  // 4. Login exitoso
  await updateLastLogin(user.id_usuario)
  await auditLog({
    idUsuario: user.id_usuario,
    tipoAccion: AUDIT_ACTIONS.AUTH_LOGIN_SUCCESS,
    ip,
    detalles: { correo_corporativo: user.correo_corporativo, requestId },
  })
  return {
    ok: true,
    user: {
      sub: user.id_usuario,
      correo_corporativo: user.correo_corporativo,
      id_rol: user.id_rol,
      nombre_rol: user.nombre_rol,
      permisos: user.permisos,
    },
  }
}

export function buildJwtToken(app, user) {
  return app.jwt.sign({
    sub: user.sub,
    correo_corporativo: user.correo_corporativo,
    id_rol: user.id_rol,
    nombre_rol: user.nombre_rol,
  })
}

export async function registerSession({ idUsuario, ip, userAgent, token, expiresAt }) {
  try {
    await query(
      `INSERT INTO sesiones_activas (id_usuario, token_hash, ip_direccion, user_agent, fecha_expiracion)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (token_hash) DO NOTHING`,
      [idUsuario, token, ip, userAgent, expiresAt]
    )
  } catch (err) {
    logger.warn({ err }, 'No se pudo registrar la sesión activa (no crítico)')
  }
}

export async function revokeSession(token) {
  try {
    await query('DELETE FROM sesiones_activas WHERE token_hash = $1', [token])
  } catch (err) {
    logger.warn({ err }, 'No se pudo revocar la sesión (no crítico)')
  }
}
