/**
 * shared/utils/audit.js — Registro de auditoría centralizado
 *
 * Mapea a la tabla `audit_log` del esquema definitivo (DBML):
 *   id_evento           SERIAL PRIMARY KEY
 *   id_usuario          INTEGER REFERENCES usuarios(id_usuario)
 *   id_entidad_afectada VARCHAR
 *   tipo_accion         VARCHAR
 *   timestamp_exacto    TIMESTAMP DEFAULT now()
 *   ip_direccion        VARCHAR(45)
 *   detalles_extra      JSONB
 *
 * Catálogo cerrado de `tipo_accion` (extensible, sin romper histórico):
 *   AUTH_LOGIN_SUCCESS, AUTH_LOGIN_FAIL, AUTH_LOGIN_LOCKED, AUTH_LOGOUT,
 *   USER_CREATE, USER_UPDATE, USER_ROLE_CHANGE, USER_ACTIVATE,
 *   USER_DEACTIVATE, USER_PASSWORD_RESET, USER_PASSWORD_CHANGE,
 *   DOCUMENT_CREATE, DOCUMENT_VERSION_UPLOAD, DOCUMENT_UPDATE,
 *   DOCUMENT_DELETE, DOCUMENT_REJECT, DOCUMENT_SIGN,
 *   RACI_ASSIGN, RACI_UPDATE, RACI_REMOVE,
 *   SEARCH, AI_COMPARISON, REPORT_GENERATE,
 *   SYSTEM_ERROR, SYSTEM_MAINTENANCE
 */

import { query } from '../../plugins/db.js'
import { logger } from './logger.js'

export const AUDIT_ACTIONS = Object.freeze({
  AUTH_LOGIN_SUCCESS: 'AUTH_LOGIN_SUCCESS',
  AUTH_LOGIN_FAIL: 'AUTH_LOGIN_FAIL',
  AUTH_LOGIN_LOCKED: 'AUTH_LOGIN_LOCKED',
  AUTH_LOGOUT: 'AUTH_LOGOUT',
  USER_CREATE: 'USER_CREATE',
  USER_UPDATE: 'USER_UPDATE',
  USER_ROLE_CHANGE: 'USER_ROLE_CHANGE',
  USER_ACTIVATE: 'USER_ACTIVATE',
  USER_DEACTIVATE: 'USER_DEACTIVATE',
  USER_PASSWORD_RESET: 'USER_PASSWORD_RESET',
  USER_PASSWORD_CHANGE: 'USER_PASSWORD_CHANGE',
  DOCUMENT_CREATE: 'DOCUMENT_CREATE',
  DOCUMENT_VERSION_UPLOAD: 'DOCUMENT_VERSION_UPLOAD',
  DOCUMENT_UPDATE: 'DOCUMENT_UPDATE',
  DOCUMENT_DELETE: 'DOCUMENT_DELETE',
  DOCUMENT_REJECT: 'DOCUMENT_REJECT',
  DOCUMENT_SIGN: 'DOCUMENT_SIGN',
  RACI_ASSIGN: 'RACI_ASSIGN',
  RACI_UPDATE: 'RACI_UPDATE',
  RACI_REMOVE: 'RACI_REMOVE',
  SEARCH: 'SEARCH',
  AI_COMPARISON: 'AI_COMPARISON',
  COMPARISON_BASE_CREATE: 'COMPARISON_BASE_CREATE',
  COMPARISON_RUN: 'COMPARISON_RUN',
  REPORT_GENERATE: 'REPORT_GENERATE',
  SYSTEM_ERROR: 'SYSTEM_ERROR',
  SYSTEM_MAINTENANCE: 'SYSTEM_MAINTENANCE',
})

/**
 * Registrar una acción en el log de auditoría.
 * Es tolerante a fallos: si el insert falla, solo loguea el warning,
 * nunca interrumpe el flujo principal.
 *
 * @param {Object} opts
 * @param {number|string} [opts.idUsuario]      — id_usuario (INTEGER del esquema) que ejecuta la acción. Null para eventos anónimos (login fallido).
 * @param {string}        opts.tipoAccion      — código de acción del catálogo AUDIT_ACTIONS
 * @param {string}        [opts.idEntidad]     — UUID/ID de la entidad afectada (como string)
 * @param {string}        [opts.ip]            — IP del cliente (VARCHAR(45))
 * @param {Object}        [opts.detalles]      — datos adicionales (JSONB)
 */
export async function auditLog({
  idUsuario = null,
  tipoAccion,
  idEntidad = null,
  ip = null,
  detalles = null,
}) {
  if (!tipoAccion) {
    logger.warn('auditLog llamado sin tipoAccion, se omite el registro')
    return
  }
  try {
    await query(
      `INSERT INTO audit_log
         (id_usuario, id_entidad_afectada, tipo_accion, ip_direccion, detalles_extra)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        idUsuario,
        idEntidad ? String(idEntidad) : null,
        tipoAccion,
        ip,
        detalles ? JSON.stringify(detalles) : null,
      ]
    )
  } catch (err) {
    logger.warn(
      { err, tipoAccion, idUsuario },
      'No se pudo registrar en auditoría (el flujo principal continúa)'
    )
  }
}

/**
 * Cuenta intentos fallidos recientes para un correo (en la ventana dada en minutos).
 * Se usa para implementar el lockout por fuerza bruta.
 */
export async function countRecentFailedLogins(correo, windowMinutes) {
  try {
    const { rows } = await query(
      `SELECT COUNT(*)::int AS total
       FROM audit_log
       WHERE tipo_accion = 'AUTH_LOGIN_FAIL'
         AND detalles_extra->>'correo' = $1
         AND timestamp_exacto > now() - ($2::text || ' minutes')::interval`,
      [correo, String(windowMinutes)]
    )
    return rows[0]?.total ?? 0
  } catch (err) {
    logger.warn({ err, correo }, 'No se pudo contar intentos fallidos')
    return 0
  }
}
