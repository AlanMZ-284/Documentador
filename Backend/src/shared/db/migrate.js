// Backend/src/shared/db/migrate.js
// Runner de migraciones SQL file-based para el Documentador.
// Meta-tabla propia: schema_migrations (NO usa config_sistema).
// config_sistema se creará en 02_alignment.sql como tabla de aplicación.
//
// Concurrencia: este script está diseñado para single-instance.
// TODO(concurrencia): cuando exista despliegue multi-instancia, envolver
// TODO(concurrencia): runMigrations() en pg_advisory_lock(hashtext('migrate')).
// TODO(concurrencia): Hoy se mitiga con ON CONFLICT (version) DO NOTHING en
// TODO(concurrencia): el INSERT de schema_migrations, que evita duplicados
// TODO(concurrencia): si dos instancias corren el mismo .sql a la vez.

import 'dotenv/config'
import pg from 'pg'
import { createHash } from 'node:crypto'
import { readdir, readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const { Pool } = pg
const __dirname = dirname(fileURLToPath(import.meta.url))
const MIGRATIONS_DIR = join(__dirname, 'migrations')

// Pool local (NO importado de plugins/db.js). El plugin de Fastify está
// acoplado al ciclo de vida del servidor; un script de migración debe
// poder correr standalone (entrypoint Docker, CI, recovery).
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  min: 0,
  max: 2,
  idleTimeoutMillis: 10_000,
  connectionTimeoutMillis: 5_000,
})

// DDL de la meta-tabla del migrador. Esquema FIJO y conocido de antemano.
// Vive aquí (no en un .sql) porque el migrador la necesita para existir
// antes de poder ejecutar ninguna migración. Patrón estándar: Flyway,
// Liquibase, knex, golang-migrate — todos hacen lo mismo.
const CREATE_META_TABLE_SQL = `
  CREATE TABLE IF NOT EXISTS schema_migrations (
    version    TEXT        PRIMARY KEY,
    applied_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    checksum   TEXT        NOT NULL
  )
`.trim()

const sha256 = (content) =>
  createHash('sha256').update(content, 'utf8').digest('hex')

async function ensureMigrationsDir() {
  try {
    return await readdir(MIGRATIONS_DIR)
  } catch (err) {
    if (err.code === 'ENOENT') {
      throw new Error(
        `[migrate] Directorio no existe: ${MIGRATIONS_DIR}\n` +
        '        Créalo con: New-Item -ItemType Directory -Path ' +
        '"Backend/src/shared/db/migrations"'
      )
    }
    throw err
  }
}

async function loadApplied(client) {
  const { rows } = await client.query(
    'SELECT version, checksum, applied_at FROM schema_migrations ORDER BY version'
  )
  return new Map(rows.map((r) => [r.version, r]))
}

async function detectDrift(applied) {
  const drift = []
  for (const [version, meta] of applied) {
    try {
      const content = await readFile(join(MIGRATIONS_DIR, version), 'utf8')
      const current = sha256(content)
      if (current !== meta.checksum) {
        drift.push({ version, expected: meta.checksum, actual: current })
      }
    } catch (err) {
      if (err.code === 'ENOENT') {
        drift.push({ version, expected: meta.checksum, actual: '<file missing>' })
      } else {
        throw err
      }
    }
  }
  return drift
}

export async function runMigrations({ failOnChecksumDrift = false } = {}) {
  const files = (await ensureMigrationsDir())
    .filter((f) => f.endsWith('.sql'))
    .sort()

  const client = await pool.connect()
  try {
    // 1. Bootstrap de la meta-tabla (DDL fijo, hardcodeado).
    await client.query(CREATE_META_TABLE_SQL)

    // 2. Leer migraciones ya aplicadas.
    const applied = await loadApplied(client)

    // 3. Detectar drift en aplicadas (warning, no aborta por defecto).
    const drift = await detectDrift(applied)
    if (drift.length > 0) {
      console.warn('[migrate] AVISO: drift de checksum detectado:')
      for (const d of drift) {
        console.warn(
          `  - ${d.version}: esperado=${d.expected.slice(0, 12)}... ` +
          `actual=${String(d.actual).slice(0, 12)}...`
        )
      }
      if (failOnChecksumDrift) {
        throw new Error(
          '[migrate] failOnChecksumDrift=true. Abortando antes de aplicar nuevas.'
        )
      }
    }

    // 4. Detectar pendientes.
    const pending = files.filter((f) => !applied.has(f))
    if (pending.length === 0) {
      console.log(
        `[migrate] Sin pendientes. Total aplicadas: ${applied.size}. ` +
        `Drift: ${drift.length}.`
      )
      return { applied: 0, skipped: applied.size, drift: drift.length }
    }

    console.log(`[migrate] Pendientes: ${pending.length}`)
    let count = 0
    for (const file of pending) {
      const sql = await readFile(join(MIGRATIONS_DIR, file), 'utf8')
      const checksum = sha256(sql)
      console.log(
        `[migrate] Aplicando ${file} (sha256=${checksum.slice(0, 12)}...)`
      )
      await client.query('BEGIN')
      try {
        await client.query(sql)
        // ON CONFLICT DO NOTHING: defensa ante carrera accidental entre
        // dos instancias (pre-advisory_lock). Hoy single-instance.
        await client.query(
          `INSERT INTO schema_migrations (version, checksum)
           VALUES ($1, $2)
           ON CONFLICT (version) DO NOTHING`,
          [file, checksum]
        )
        await client.query('COMMIT')
        count++
        console.log(`[migrate]   OK ${file}`)
      } catch (err) {
        await client.query('ROLLBACK')
        console.error(`[migrate]   FALLO ${file}: ${err.message}`)
        throw err
      }
    }
    return { applied: count, skipped: applied.size, drift: drift.length }
  } finally {
    client.release()
  }
}

export async function getStatus() {
  await ensureMigrationsDir()
  const client = await pool.connect()
  try {
    await client.query(CREATE_META_TABLE_SQL)
    const applied = await loadApplied(client)
    const files = (await readdir(MIGRATIONS_DIR))
      .filter((f) => f.endsWith('.sql'))
      .sort()
    const pending = files.filter((f) => !applied.has(f))
    return { applied: [...applied.keys()], pending }
  } finally {
    client.release()
  }
}

// Entry point CLI: node migrate.js [up|status] (compatible Windows)
const isMain = process.argv[1] && (
  import.meta.url === `file://${process.argv[1].replace(/\\/g, '/').replace(/^([A-Za-z]):/, '/$1')}`
  || import.meta.url === `file:///${process.argv[1].replace(/\\/g, '/')}`
)
if (isMain) {
  const cmd = process.argv[2] || 'up'
  const handler = cmd === 'status' ? getStatus() : runMigrations()
  handler
    .then(async (r) => {
      if (cmd === 'status') {
        console.log('[migrate] Estado:')
        console.log('  Aplicadas :', r.applied.length, '→', r.applied.join(', ') || '(ninguna)')
        console.log('  Pendientes:', r.pending.length, '→', r.pending.join(', ') || '(ninguna)')
      } else {
        console.log('[migrate] Finalizado:', r)
      }
      await pool.end()
      process.exit(0)
    })
    .catch(async (err) => {
      console.error('[migrate] Error fatal:', err.message)
      await pool.end()
      process.exit(1)
    })
}
