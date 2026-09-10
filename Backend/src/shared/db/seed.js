/**
 * shared/db/seed.js — Seed alineado al DBML
 *
 * Inserta (de forma idempotente):
 *  - 3 roles base: SuperAdministrador, Administrador, Usuario
 *  - Catálogos SAT mínimos: áreas corporativas, tipos de documento,
 *    aplicaciones comunes, plantillas base
 *  - Un usuario administrador demo con password 'Demo1234!'
 *
 * El SuperAdministrador real se crea por scripts/bootstrap-superadmin.js.
 *
 * Uso (CLI):
 *   node src/shared/db/seed.js
 *
 * Uso (programático):
 *   import { runSeed } from './shared/db/seed.js'
 *   await runSeed()
 */

import 'dotenv/config'
import bcrypt from 'bcryptjs'
import pg from 'pg'
import { logger } from '../utils/logger.js'

// batchInsert local (usa el cliente de la transacción, no el pool global de Fastify)
async function localBatchInsert(client, table, columns, rows) {
  if (!rows?.length) return { rowCount: 0, rows: [] }
  const placeholders = rows.map((_, r) =>
    `(${columns.map((_, c) => `$${r * columns.length + c + 1}`).join(', ')})`
  ).join(', ')
  const flat = rows.flatMap((r) => r)
  const sql = `INSERT INTO ${table} (${columns.join(', ')}) VALUES ${placeholders} ON CONFLICT DO NOTHING RETURNING *`
  const { rows: result } = await client.query(sql, flat)
  return { rowCount: result.length, rows: result }
}

const { Pool } = pg
const STANDALONE_POOL = new Pool({
  connectionString: process.env.DATABASE_URL,
  min: 0,
  max: 2,
  idleTimeoutMillis: 10_000,
  connectionTimeoutMillis: 5_000,
})

const ROLES = [
  {
    nombre_rol: 'SuperAdministrador',
    permisos: {
      all: true,
      scope: 'global',
      description: 'Acceso total al sistema. Único rol que puede asignar otros SuperAdministradores.',
      can_manage_roles: ['SuperAdministrador', 'Administrador', 'Usuario'],
      can_manage_users: true,
      can_view_audit: true,
      can_sign_documents: true,
    },
  },
  {
    nombre_rol: 'Administrador',
    permisos: {
      scope: 'organizacion',
      can_manage_users: true,
      can_manage_roles: ['Administrador', 'Usuario'],
      can_view_audit: true,
      can_sign_documents: true,
      can_delete_documents: false,
    },
  },
  {
    nombre_rol: 'Usuario',
    permisos: {
      scope: 'organizacion',
      can_manage_users: false,
      can_manage_roles: [],
      can_view_audit: false,
      can_sign_documents: false,
      can_upload_versions: true,
      can_compare_versions: true,
      can_view_documents: true,
    },
  },
]

const AREAS_SAT = [
  { acronimo: 'DG', nombre_area: 'Dirección General' },
  { acronimo: 'TI', nombre_area: 'Tecnología de la Información' },
  { acronimo: 'PMO', nombre_area: 'Oficina de Proyectos' },
  { acronimo: 'LEGAL', nombre_area: 'Dirección Jurídica' },
  { acronimo: 'AUD', nombre_area: 'Auditoría Interna' },
  { acronimo: 'COMP', nombre_area: 'Compliance' },
  { acronimo: 'RH', nombre_area: 'Recursos Humanos' },
  { acronimo: 'FIN', nombre_area: 'Dirección de Finanzas' },
]

const TIPOS_DOCUMENTO = [
  { nombre_tipo: 'MOC', metodologia_asociada: 'Ambas' },
  { nombre_tipo: 'MOU', metodologia_asociada: 'Ambas' },
  { nombre_tipo: 'POT', metodologia_asociada: 'Ambas' },
  { nombre_tipo: 'ANEXO', metodologia_asociada: 'Ambas' },
  { nombre_tipo: 'INFORME', metodologia_asociada: 'Ambas' },
  { nombre_tipo: 'POLITICA', metodologia_asociada: 'Ambas' },
  { nombre_tipo: 'MANUAL', metodologia_asociada: 'Ambas' },
  { nombre_tipo: 'CONTRATO', metodologia_asociada: 'Ambas' },
]

const PLANTILLAS_BASE = [
  {
    nombre_plantilla: 'MOC Estándar v1',
    descripcion: 'Plantilla base para Modelo de Operación (MOC).',
    estructura_json: {
      secciones: [
        'Resumen Ejecutivo',
        'Alcance',
        'Responsables (RACI)',
        'Procedimiento',
        'Anexos',
      ],
    },
    version: 1,
  },
  {
    nombre_plantilla: 'MOU Estándar v1',
    descripcion: 'Plantilla base para Memorando de Entendimiento.',
    estructura_json: {
      secciones: ['Partes', 'Objeto', 'Compromisos', 'Vigencia', 'Firmas'],
    },
    version: 1,
  },
  {
    nombre_plantilla: 'POT Estándar v1',
    descripcion: 'Plantilla base para Procedimiento Operativo Técnico.',
    estructura_json: {
      secciones: ['Propósito', 'Alcance', 'Definiciones', 'Procedimiento', 'Control de cambios'],
    },
    version: 1,
  },
]

const APLICACIONES = [
  { acronimo: 'SAT-CORE', descripcion_funcional: 'Sistema principal SAT', criticidad_remedy: 'Alta' },
  { acronimo: 'CFE-LEGACY', descripcion_funcional: 'Sistema legacy CFE', criticidad_remedy: 'Media' },
  { acronimo: 'IMSS-DIGITAL', descripcion_funcional: 'Plataforma IMSS', criticidad_remedy: 'Alta' },
  { acronimo: 'SENER-DOCS', descripcion_funcional: 'Repositorio documental SENER', criticidad_remedy: 'Media' },
]

async function seedRoles(client) {
  const rows = ROLES.map((r) => [r.nombre_rol, JSON.stringify(r.permisos)])
  const res = await client.query(
    `INSERT INTO roles (nombre_rol, permisos) VALUES ($1, $2::jsonb), ($3, $4::jsonb), ($5, $6::jsonb)
     ON CONFLICT (nombre_rol) DO UPDATE SET permisos = EXCLUDED.permisos
     RETURNING id_rol, nombre_rol`,
    [
      rows[0][0], rows[0][1],
      rows[1][0], rows[1][1],
      rows[2][0], rows[2][1],
    ]
  )
  res.rows.forEach((r) => logger.info(`  OK Rol "${r.nombre_rol}" (id_rol=${r.id_rol})`))
  return res.rows
}

async function seedAreas(client) {
  const { rows } = await client.query(
    `SELECT acronimo FROM catalogo_areas_corporativas WHERE acronimo = ANY($1)`,
    [AREAS_SAT.map((a) => a.acronimo)]
  )
  const existing = new Set(rows.map((r) => r.acronimo))
  const toInsert = AREAS_SAT.filter((a) => !existing.has(a.acronimo))
  if (toInsert.length) {
    await localBatchInsert(client, 'catalogo_areas_corporativas', ['acronimo', 'nombre_area'],
      toInsert.map((a) => [a.acronimo, a.nombre_area])
    )
    logger.info(`  OK ${toInsert.length} areas corporativas inserted`)
  } else {
    logger.info('  OK Areas corporativas already exist')
  }
}

async function seedTiposDocumento(client) {
  const { rows } = await client.query(
    `SELECT nombre_tipo FROM catalogo_tipos_documento WHERE nombre_tipo = ANY($1)`,
    [TIPOS_DOCUMENTO.map((t) => t.nombre_tipo)]
  )
  const existing = new Set(rows.map((r) => r.nombre_tipo))
  const toInsert = TIPOS_DOCUMENTO.filter((t) => !existing.has(t.nombre_tipo))
  if (toInsert.length) {
    await localBatchInsert(client, 'catalogo_tipos_documento', ['nombre_tipo', 'metodologia_asociada'],
      toInsert.map((t) => [t.nombre_tipo, t.metodologia_asociada])
    )
    logger.info(`  OK ${toInsert.length} tipos de documento inserted`)
  } else {
    logger.info('  OK Tipos de documento already exist')
  }
}

async function seedAplicaciones(client) {
  const { rows } = await client.query(
    `SELECT acronimo FROM aplicaciones WHERE acronimo = ANY($1)`,
    [APLICACIONES.map((a) => a.acronimo)]
  )
  const existing = new Set(rows.map((r) => r.acronimo))
  const toInsert = APLICACIONES.filter((a) => !existing.has(a.acronimo))
  if (toInsert.length) {
    await localBatchInsert(client, 'aplicaciones', ['acronimo', 'descripcion_funcional', 'criticidad_remedy'],
      toInsert.map((a) => [a.acronimo, a.descripcion_funcional, a.criticidad_remedy])
    )
    logger.info(`  OK ${toInsert.length} aplicaciones inserted`)
  } else {
    logger.info('  OK Aplicaciones already exist')
  }
}

async function seedRecursosHumanosDemo(client) {
  // Recursos humanos mínimos para que la matriz RACI tenga a quién asignar
  const demo = [
    { nombre_completo: 'Líder de Proyecto Demo', correo_institucional: 'lider.demo@documentador.local', id_area: null, id_usuario_asociado: null, puesto: 'Líder PMO' },
    { nombre_completo: 'Revisor Técnico Demo', correo_institucional: 'revisor.demo@documentador.local', id_area: null, id_usuario_asociado: null, puesto: 'Ingeniero Senior' },
  ]
  const { rows } = await client.query(
    `SELECT correo_institucional FROM recursos_humanos WHERE correo_institucional = ANY($1)`,
    [demo.map((d) => d.correo_institucional)]
  )
  const existing = new Set(rows.map((r) => r.correo_institucional))
  const toInsert = demo.filter((d) => !existing.has(d.correo_institucional))
  if (toInsert.length) {
    await localBatchInsert(client, 'recursos_humanos', ['nombre_completo', 'correo_institucional', 'puesto'],
      toInsert.map((d) => [d.nombre_completo, d.correo_institucional, d.puesto])
    )
    logger.info(`  OK ${toInsert.length} recursos humanos demo inserted`)
  } else {
    logger.info('  OK Recursos humanos demo already exist')
  }
}

async function seedProyectoDemo(client) {
  const { rows } = await client.query(
    `SELECT id_proyecto FROM proyectos_iniciativas WHERE nombre_proyecto = 'Proyecto Piloto MOC' LIMIT 1`
  )
  if (rows.length) {
    logger.info('  OK Proyecto demo "Proyecto Piloto MOC" already exists')
    return
  }
  await client.query(
    `INSERT INTO proyectos_iniciativas (nombre_proyecto, tipo_esfuerzo, metodologia_trabajo)
     VALUES ('Proyecto Piloto MOC', 'DS', 'Híbrido')`
  )
  logger.info('  OK Proyecto demo "Proyecto Piloto MOC" created')
}

async function seedPlantillas(client) {
  const { rows } = await client.query(
    `SELECT nombre_plantilla, version FROM plantillas_mdap
     WHERE nombre_plantilla = ANY($1)`,
    [PLANTILLAS_BASE.map((p) => p.nombre_plantilla)]
  )
  const existing = new Set(rows.map((r) => `${r.nombre_plantilla}@${r.version}`))
  const toInsert = PLANTILLAS_BASE.filter(
    (p) => !existing.has(`${p.nombre_plantilla}@${p.version}`)
  )
  if (toInsert.length) {
    await localBatchInsert(client, 'plantillas_mdap', ['nombre_plantilla', 'descripcion', 'estructura_json', 'version'],
      toInsert.map((p) => [p.nombre_plantilla, p.descripcion, JSON.stringify(p.estructura_json), p.version])
    )
    logger.info(`  OK ${toInsert.length} plantillas inserted`)
  } else {
    logger.info('  OK Plantillas already exist')
  }
}

async function seedAdminDemo(client) {
  const demoEmail = 'admin.demo@documentador.local'
  const { rows } = await client.query(
    'SELECT id_usuario FROM usuarios WHERE correo_corporativo = $1',
    [demoEmail]
  )
  if (rows.length) {
    logger.info(`  OK Usuario demo "${demoEmail}" already exists`)
    return
  }
  const { rows: rol } = await client.query(
    `SELECT id_rol FROM roles WHERE nombre_rol = 'Administrador' LIMIT 1`
  )
  if (!rol.length) throw new Error('No se encontró el rol Administrador tras el seed de roles')
  const cost = Number(process.env.BCRYPT_COST) || 12
  const hash = await bcrypt.hash('Demo1234!', cost)
  await client.query(
    `INSERT INTO usuarios (id_rol, correo_corporativo, password_hash, activo)
     VALUES ($1, $2, $3, TRUE)`,
    [rol[0].id_rol, demoEmail, hash]
  )
  logger.info(`  OK Usuario demo created: ${demoEmail} (password: Demo1234!)`)
}

export async function runSeed() {
  logger.info('Running seed (idempotent) aligned to DBML')
  const client = await STANDALONE_POOL.connect()
  try {
    await client.query('BEGIN')
    await seedRoles(client)
    await seedAreas(client)
    await seedTiposDocumento(client)
    await seedAplicaciones(client)
    await seedPlantillas(client)
    await seedRecursosHumanosDemo(client)
    await seedProyectoDemo(client)
    await seedAdminDemo(client)
    await client.query('COMMIT')
    logger.info('Seed completed')
  } catch (err) {
    await client.query('ROLLBACK')
    logger.error({ err }, 'Seed failed, rollback executed')
    throw err
  } finally {
    client.release()
  }
}

// CLI entry point (compatible Windows)
const isMain = process.argv[1] && (
  import.meta.url === `file://${process.argv[1].replace(/\\/g, '/').replace(/^([A-Za-z]):/, '/$1')}`
  || import.meta.url === `file:///${process.argv[1].replace(/\\/g, '/')}`
)
if (isMain) {
  runSeed()
    .then(() => STANDALONE_POOL.end())
    .then(() => process.exit(0))
    .catch(async (err) => {
      console.error('[seed] Error fatal:', err.message)
      await STANDALONE_POOL.end()
      process.exit(1)
    })
}
