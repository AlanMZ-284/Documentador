/**
 * server.js — Punto de entrada principal
 * Documentador API · Fastify
 *
 * Nota (Fase 2): el WebSocket de indexado de documentos se ha retirado
 * junto con el módulo legacy. Se re-implementará en Fase 3 si es necesario,
 * usando el campo `ia_embedding` y los módulos ai/search.
 */

import 'dotenv/config'
import Fastify from 'fastify'
import { registerPlugins } from './plugins/index.js'
import { registerRoutes } from './modules/index.js'
import { logger } from './shared/utils/logger.js'

const app = Fastify({
  logger: {
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
    transport: process.env.NODE_ENV !== 'production'
      ? { target: 'pino-pretty', options: { colorize: true, translateTime: 'SYS:HH:MM:ss', ignore: 'pid,hostname' } }
      : undefined,
  },
  trustProxy: false,
  ajv: { customOptions: { strict: false } },
})

process.on('unhandledRejection', (reason) => {
  logger.error({ reason }, 'Unhandled rejection captured')
  process.exit(1)
})

const start = async () => {
  try {
    await registerPlugins(app)
    await registerRoutes(app)

    app.get('/health', { logLevel: 'silent' }, async () => ({
      status: 'ok',
      service: 'Documentador API',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
    }))

    const port = Number(process.env.PORT) || 3001
    const host = process.env.HOST || '127.0.0.1'

    let listeningPort = port
    const maxRetries = 10

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        await app.listen({ port: listeningPort, host })
        break
      } catch (err) {
        if (err.code !== 'EADDRINUSE' || attempt === maxRetries - 1) {
          throw err
        }

        logger.warn(
          { host, port: listeningPort },
          'Port in use, trying next available port'
        )
        listeningPort += 1
      }
    }

    logger.info(
      {
        host,
        port: listeningPort,
        localUrl: `http://localhost:${listeningPort}`,
      },
      'Documentador API running on localhost'
    )
  } catch (err) {
    logger.error({ err }, 'Server startup failed')
    process.exit(1)
  }
  
}

start()
