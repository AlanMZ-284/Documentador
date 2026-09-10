/**
 * modules/proyectos/proyectos.routes.js
 */

import {
  listProyectosController,
  getProyectoController,
  createProyectoController,
  updateProyectoController,
  deleteProyectoController,
} from './proyectos.controller.js'

const idParamSchema = { type: 'object', required: ['id'], properties: { id: { type: 'integer', minimum: 1 } } }
const listQuerySchema = {
  type: 'object',
  properties: {
    page: { type: 'integer', minimum: 1, default: 1 },
    pageSize: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
    q: { type: 'string', maxLength: 200 },
    estatus: { type: 'string', enum: ['planeacion', 'en_curso', 'pausado', 'completado', 'cancelado'] },
  },
}
const createSchema = {
  type: 'object',
  required: ['nombre_proyecto'],
  properties: {
    nombre_proyecto: { type: 'string', minLength: 3, maxLength: 300 },
    descripcion: { type: 'string', maxLength: 2000, nullable: true },
    id_recurso_lider: { type: 'integer', minimum: 1, nullable: true },
    fecha_inicio: { type: 'string', format: 'date', nullable: true },
    fecha_fin: { type: 'string', format: 'date', nullable: true },
    estatus: { type: 'string', enum: ['planeacion', 'en_curso', 'pausado', 'completado', 'cancelado'] },
  },
  additionalProperties: false,
}
const updateSchema = {
  type: 'object',
  properties: {
    nombre_proyecto: { type: 'string', minLength: 3, maxLength: 300 },
    descripcion: { type: 'string', maxLength: 2000, nullable: true },
    id_recurso_lider: { type: 'integer', minimum: 1, nullable: true },
    fecha_inicio: { type: 'string', format: 'date', nullable: true },
    fecha_fin: { type: 'string', format: 'date', nullable: true },
    estatus: { type: 'string', enum: ['planeacion', 'en_curso', 'pausado', 'completado', 'cancelado'] },
  },
  additionalProperties: false,
  minProperties: 1,
}

export async function proyectosRoutes(app) {
  const ADMIN = { preHandler: [app.requireRole(['SuperAdministrador', 'Administrador'])] }
  const AUTHED = { preHandler: [app.authenticate] }

  app.get('/api/proyectos', { ...AUTHED, schema: { querystring: listQuerySchema }, handler: listProyectosController })
  app.get('/api/proyectos/:id', { ...AUTHED, schema: { params: idParamSchema }, handler: getProyectoController })
  app.post('/api/proyectos', { ...ADMIN, schema: { body: createSchema }, handler: createProyectoController })
  app.patch('/api/proyectos/:id', { ...ADMIN, schema: { params: idParamSchema, body: updateSchema }, handler: updateProyectoController })
  app.delete('/api/proyectos/:id', { ...ADMIN, schema: { params: idParamSchema }, handler: deleteProyectoController })
}
