/**
 * shared/utils/request-context.js
 * Helpers para extraer IP, User-Agent y requestId de la petición,
 * normalizados a la columna `ip_direccion` (VARCHAR(45) — IPv6 safe).
 */

import crypto from 'node:crypto'

const IPV4_MAX = '255.255.255.255'

/**
 * Trunca la IP a 45 caracteres para evitar errores de inserción en `ip_direccion`.
 */
function truncateIp(ip) {
  if (!ip) return null
  return String(ip).slice(0, 45)
}

/**
 * Extrae la IP real del cliente respetando cabeceras de proxy.
 * Orden de preferencia: X-Forwarded-For > X-Real-IP > req.ip.
 */
export function getClientIp(req) {
  const forwarded = req.headers?.['x-forwarded-for']
  if (forwarded) {
    const first = String(forwarded).split(',')[0]?.trim()
    if (first) return truncateIp(first)
  }
  const real = req.headers?.['x-real-ip']
  if (real) return truncateIp(real)
  return truncateIp(req.ip || null)
}

/**
 * Extrae el User-Agent truncado a 512 caracteres para no saturar la tabla.
 */
export function getUserAgent(req) {
  const ua = req.headers?.['user-agent']
  if (!ua) return null
  return String(ua).slice(0, 512)
}

/**
 * Genera o devuelve el ID único de la petición (header X-Request-Id).
 * Se usa para correlacionar logs, auditoría y errores.
 */
export function getOrCreateRequestId(req) {
  if (req.id) return req.id
  const headerId = req.headers?.['x-request-id']
  const id = headerId
    ? String(headerId).slice(0, 64)
    : crypto.randomUUID()
  req.id = id
  return id
}

/**
 * Helper que combina los tres: devuelve un objeto listo para
 * anexar al log de auditoría o al log estructurado.
 */
export function buildRequestContext(req) {
  return {
    requestId: getOrCreateRequestId(req),
    ip: getClientIp(req),
    userAgent: getUserAgent(req),
  }
}

export const __test__ = { truncateIp, IPV4_MAX }
