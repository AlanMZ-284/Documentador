/**
 * plugins/db.js - PostgreSQL connection plugin with pg pool
 */

import pg from 'pg'
import fp from 'fastify-plugin'
import { logger } from '../shared/utils/logger.js'

const { Pool } = pg

let pool = null

export const dbPlugin = fp(async (app) => {
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    min: Number(process.env.DB_POOL_MIN) || 2,
    max: Number(process.env.DB_POOL_MAX) || 10,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 5_000,
  })

  app.decorate('db', pool)

  // Verify connection on startup
  try {
    const client = await pool.connect()
    await client.query('SELECT 1')
    client.release()
    logger.info('PostgreSQL connection established')
  } catch (err) {
    logger.warn({ err }, 'PostgreSQL unavailable at startup; continuing without initial connection')
  }

  pool.on('error', (err) => {
    logger.error({ err }, 'PostgreSQL pool error')
  })

  // Cerrar el pool al apagar el servidor
  app.addHook('onClose', async () => {
    await pool.end()
    logger.info('PostgreSQL pool closed')
  })
})

/**
 * Helper para ejecutar queries con logging estructurado.
 * Uso: await query('SELECT * FROM documents WHERE id = $1', [id])
 */
export async function query(sql, params = []) {
  const start = Date.now()
  try {
    const result = await pool.query(sql, params)
    const duration = Date.now() - start
    if (duration > 500) {
      logger.warn({ sql: sql.slice(0, 80), duration }, 'Slow query detected')
    }
    return result
  } catch (err) {
    logger.error({ err, sql: sql.slice(0, 80) }, 'SQL query error')
    throw err
  }
}

/**
 * Ejecutar múltiples queries dentro de una transacción.
 * Uso: await withTransaction(async (client) => { ... })
 */
export async function withTransaction(fn) {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const result = await fn(client)
    await client.query('COMMIT')
    return result
  } catch (err) {
    await client.query('ROLLBACK')
    logger.error({ err }, 'Transaction rolled back')
    throw err
  } finally {
    client.release()
  }
}

/**
 * Inserta múltiples filas en una sola query.
 * Uso: await batchInsert('roles', ['nombre_rol','permisos'], [['X',{...}]])
 */
export async function batchInsert(table, columns, rows) {
  if (!rows?.length) return { rowCount: 0, rows: [] }
  const placeholders = rows
    .map((_, r) => `(${columns.map((_, c) => `$${r * columns.length + c + 1}`).join(', ')})`)
    .join(', ')
  const flat = rows.flatMap((r) => r)
  const sql = `INSERT INTO ${table} (${columns.join(', ')}) VALUES ${placeholders} ON CONFLICT DO NOTHING RETURNING *`
  return query(sql, flat)
}
