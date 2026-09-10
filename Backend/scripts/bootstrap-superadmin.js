/**
 * scripts/bootstrap-superadmin.js
 * Crea el rol "SuperAdministrador" y el usuario SuperAdmin inicial de forma IDEMPOTENTE.
 *
 * Variables de entorno requeridas:
 *   SUPERADMIN_EMAIL         — correo corporativo (UNIQUE)
 *   SUPERADMIN_PASSWORD      — password en texto plano (se hashea con bcrypt cost 12)
 *   SUPERADMIN_NOMBRE        — (opcional) nombre completo del SuperAdmin
 *   SUPERADMIN_AREA          — (opcional) área a la que se asocia
 *   DATABASE_URL             — cadena de conexión PostgreSQL
 *   BCRYPT_COST              — (opcional) costo de bcrypt, default 12
 *
 * Se ejecuta automáticamente al inicializar el contenedor Docker mediante el servicio
 * "bootstrap" definido en docker-compose.yml. También puede ejecutarse manualmente:
 *   node scripts/bootstrap-superadmin.js
 */

import 'dotenv/config'
import bcrypt from 'bcryptjs'
import pg from 'pg'
import { logger } from '../src/shared/utils/logger.js'

const { Pool } = pg
const pool = new Pool({ connectionString: process.env.DATABASE_URL })

const SUPERADMIN_PERMISSIONS = {
  all: true,
  scope: 'global',
  description: 'Acceso total al sistema. Único rol que puede asignar otros SuperAdministradores.',
  can_manage_roles: ['SuperAdministrador', 'Administrador', 'Usuario'],
  can_manage_users: true,
  can_view_audit: true,
  can_sign_documents: true,
}

const ADMIN_PERMISSIONS = {
  scope: 'organizacion',
  can_manage_users: true,
  can_manage_roles: ['Administrador', 'Usuario'],
  can_view_audit: true,
  can_sign_documents: true,
  can_delete_documents: false,
}

const USUARIO_PERMISSIONS = {
  scope: 'organizacion',
  can_manage_users: false,
  can_manage_roles: [],
  can_view_audit: false,
  can_sign_documents: false,
  can_upload_versions: true,
  can_compare_versions: true,
  can_view_documents: true,
}

async function ensureRole(client, nombre, permisos) {
  const { rows } = await client.query(
    'SELECT id_rol, permisos FROM roles WHERE nombre_rol = $1 LIMIT 1',
    [nombre]
  )
  if (rows.length > 0) {
    logger.info(`  ✓ Rol "${nombre}" ya existe (id_rol=${rows[0].id_rol})`)
    // Actualizar permisos si difieren (idempotente)
    await client.query(
      'UPDATE roles SET permisos = $1 WHERE id_rol = $2',
      [JSON.stringify(permisos), rows[0].id_rol]
    )
    return rows[0].id_rol
  }
  const { rows: created } = await client.query(
    'INSERT INTO roles (nombre_rol, permisos) VALUES ($1, $2) RETURNING id_rol',
    [nombre, JSON.stringify(permisos)]
  )
  logger.info(`  ✓ Rol "${nombre}" creado (id_rol=${created[0].id_rol})`)
  return created[0].id_rol
}

async function ensureSuperAdmin(client) {
  const email = (process.env.SUPERADMIN_EMAIL || '').toLowerCase().trim()
  const password = process.env.SUPERADMIN_PASSWORD
  if (!email || !password) {
    throw new Error('SUPERADMIN_EMAIL y SUPERADMIN_PASSWORD son obligatorios.')
  }
  if (password.length < 12) {
    throw new Error('SUPERADMIN_PASSWORD debe tener al menos 12 caracteres.')
  }

  const { rows: existing } = await client.query(
    'SELECT id_usuario, id_rol, activo FROM usuarios WHERE correo_corporativo = $1',
    [email]
  )
  if (existing.length > 0) {
    logger.info(`  ✓ SuperAdmin "${email}" ya existe (id_usuario=${existing[0].id_usuario})`)
    return existing[0].id_usuario
  }

  const idRol = await ensureRole(client, 'SuperAdministrador', SUPERADMIN_PERMISSIONS)
  const cost = Number(process.env.BCRYPT_COST) || 12
  const hash = await bcrypt.hash(password, cost)

  const { rows: created } = await client.query(
    `INSERT INTO usuarios (id_rol, correo_corporativo, password_hash, activo)
     VALUES ($1, $2, $3, TRUE)
     RETURNING id_usuario`,
    [idRol, email, hash]
  )
  logger.info(
    `  ✓ SuperAdmin "${email}" creado (id_usuario=${created[0].id_usuario}, bcrypt cost=${cost})`
  )
  return created[0].id_usuario
}

async function ensureAdminAndUsuarioRoles(client) {
  await ensureRole(client, 'Administrador', ADMIN_PERMISSIONS)
  await ensureRole(client, 'Usuario', USUARIO_PERMISSIONS)
}

async function ensureArea(client, acronimo, nombre) {
  const { rows } = await client.query(
    'SELECT id_area FROM catalogo_areas_corporativas WHERE acronimo = $1',
    [acronimo]
  )
  if (rows.length > 0) return rows[0].id_area
  const { rows: created } = await client.query(
    'INSERT INTO catalogo_areas_corporativas (acronimo, nombre_area) VALUES ($1, $2) RETURNING id_area',
    [acronimo, nombre]
  )
  logger.info(`  ✓ Área "${acronimo}" creada`)
  return created[0].id_area
}

async function bootstrap() {
  logger.info('🔐 Iniciando bootstrap del SuperAdministrador…')
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL no está definida.')
  }
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    // 1) Roles
    await ensureAdminAndUsuarioRoles(client)
    // 2) SuperAdmin
    await ensureSuperAdmin(client)
    // 3) Áreas corporativas SAT (idempotente, base mínima)
    await ensureArea(client, 'DG', 'Dirección General')
    await ensureArea(client, 'TI', 'Tecnología de la Información')
    await ensureArea(client, 'PMO', 'Oficina de Proyectos')
    await ensureArea(client, 'LEGAL', 'Dirección Jurídica')
    await ensureArea(client, 'AUD', 'Auditoría Interna')
    await ensureArea(client, 'COMP', 'Compliance')
    await client.query('COMMIT')
    logger.info('✅ Bootstrap completado correctamente.')
  } catch (err) {
    await client.query('ROLLBACK')
    logger.error({ err }, '❌ Error en bootstrap')
    throw err
  } finally {
    client.release()
    await pool.end()
  }
}

bootstrap().catch((err) => {
  logger.fatal({ err }, '❌ Bootstrap finalizado con error fatal')
  process.exit(1)
})
