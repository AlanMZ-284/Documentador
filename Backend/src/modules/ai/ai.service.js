/**
 * modules/ai/ai.service.js — Servicio de integración con Claude API (Anthropic)
 *
 * Centraliza todas las llamadas a la IA con:
 * - Timeout de 30 segundos por llamada
 * - Reintentos automáticos (3 intentos con backoff exponencial)
 * - Fallback graceful en caso de error persistente
 * - Prompts especializados por módulo
 */

import Anthropic from '@anthropic-ai/sdk'
import { logger } from '../../shared/utils/logger.js'

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
  timeout: Number(process.env.CLAUDE_TIMEOUT_MS) || 30_000,
  maxRetries: Number(process.env.CLAUDE_RETRY_ATTEMPTS) || 3,
})

const MODEL   = process.env.CLAUDE_MODEL      || 'claude-sonnet-4-20250514'
const TOKENS  = Number(process.env.CLAUDE_MAX_TOKENS) || 2048

// ─── Helper: llamada base con retry y logging ─────────────────────────────
async function callClaude({ system, userMessage, temperature = 0 }) {
  const start = Date.now()
  try {
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: TOKENS,
      temperature,
      system,
      messages: [{ role: 'user', content: userMessage }],
    })
    const duration = Date.now() - start
    logger.debug({ duration, tokens: response.usage }, 'Llamada a Claude completada')
    return response.content[0]?.text || ''
  } catch (err) {
    logger.error({ err, duration: Date.now() - start }, 'Error al llamar a Claude API')
    throw err
  }
}

// ─── Helper: parsear JSON de respuesta Claude ─────────────────────────────
function parseJson(raw, fallback = {}) {
  try {
    return JSON.parse(raw.replace(/```json|```/g, '').trim())
  } catch {
    logger.warn({ raw: raw.slice(0, 200) }, 'No se pudo parsear respuesta JSON de Claude')
    return fallback
  }
}

// ─────────────────────────────────────────────────────────────────────────────
export const aiService = {

  /**
   * Módulo 1 — Clasificar documento y extraer metadata
   * Entrada: texto extraído del documento + nombre del archivo
   * Salida: { tipo, area, cliente, tags, resumen, responsable }
   */
  async classifyDocument({ text, filename }) {
    const system = `Eres un sistema de clasificación documental para dependencias gubernamentales mexicanas (CFE, IMSS, SAT, Secretarías).
Analiza el contenido o nombre del documento y extrae su metadata.
Tipos válidos: Contrato, Factura, Propuesta, Minuta, Política, Manual, Presentación, Otro.
Áreas válidas: Legal, PMO, Operaciones, Consultoría, Compliance, RRHH, Dirección, TI.
Responde SOLO en JSON con el formato exacto sin markdown:
{"tipo":"string","area":"string","cliente":"string","tags":["string"],"resumen":"string","responsable":"string"}`

    const raw = await callClaude({
      system,
      userMessage: `Nombre del archivo: "${filename}"\nContenido (primeros 2000 caracteres):\n${text.slice(0, 2000)}`,
    })

    const result = parseJson(raw, {
      tipo: 'Otro', area: 'PMO', cliente: 'Por definir',
      tags: ['documento', 'corporativo'],
      resumen: 'Documento corporativo pendiente de clasificación.',
      responsable: 'Por asignar',
    })

    return result
  },

  /**
   * Módulo 2 — Análisis de cambios entre versiones (diff IA)
   * Entrada: metadata de documento A (V0) y documento B (V-Final)
   * Salida: JSON estructurado con cambios, impacto y resumen ejecutivo
   */
  async analyzeComparison({ docA, docB, additionalContext = '' }) {
    const system = `Eres un analista técnico senior especializado en documentación para dependencias gubernamentales mexicanas.
Tu rol es analizar cambios entre versiones de documentos y generar reportes formales de impacto.
Responde SOLO en JSON sin markdown con el formato exacto:
{
  "resumen_ejecutivo": "string (tono formal/burocrático, voz pasiva, máximo 3 párrafos)",
  "cambios": [{"archivo":"string","tipo":"MODIFICACIÓN|ADICIÓN|ELIMINACIÓN","impacto":"ALTO|MEDIO|BAJO","descripcion":"string"}],
  "metadata": {"modulo":"string","area":"string","responsable":"string","riesgo":"ALTO|MEDIO|BAJO"},
  "secciones_a_actualizar": ["string"],
  "impacto_general": "ALTO|MEDIO|BAJO",
  "tono": "formal-gubernamental"
}`

    const userMessage = `
Analiza el cambio entre las siguientes versiones de un documento corporativo:

VERSIÓN BASE (V0):
- Nombre: ${docA.name}
- Tipo: ${docA.doc_type || 'No especificado'}
- Área: ${docA.area || 'No especificada'}
- Cliente: ${docA.client || 'No especificado'}
- Tags: ${(docA.tags || []).join(', ')}
- Resumen: ${docA.summary || 'Sin resumen disponible'}

VERSIÓN FINAL (V-Final):
- Nombre: ${docB.name}
- Tipo: ${docB.doc_type || 'No especificado'}
- Área: ${docB.area || 'No especificada'}
- Cliente: ${docB.client || 'No especificado'}
- Tags: ${(docB.tags || []).join(', ')}
- Resumen: ${docB.summary || 'Sin resumen disponible'}

${additionalContext ? `Contexto adicional: ${additionalContext}` : ''}

Genera el análisis de impacto técnico en tono formal para dependencia gubernamental.`

    const raw = await callClaude({ system, userMessage })
    return parseJson(raw, {
      resumen_ejecutivo: 'Se realizaron modificaciones entre las versiones analizadas.',
      cambios: [],
      metadata: { modulo: docA.area, area: docA.area, responsable: 'PMO', riesgo: 'MEDIO' },
      secciones_a_actualizar: ['Sección de alcance', 'Entregables'],
      impacto_general: 'MEDIO',
      tono: 'formal-gubernamental',
    })
  },

  /**
   * Módulo 3 — Interpretar consulta de búsqueda en lenguaje natural
   * Entrada: texto de la consulta del usuario
   * Salida: intención, entidades, términos de búsqueda, filtros sugeridos
   */
  async interpretSearchQuery({ query: userQuery, availableFilters = {} }) {
    const system = `Eres un motor de interpretación semántica para búsqueda documental empresarial y gubernamental.
Analiza consultas en lenguaje natural (español e inglés) y extrae la intención de búsqueda.
Responde SOLO en JSON sin markdown:
{
  "intencion": "string",
  "entidades": {"cliente":"string|null","area":"string|null","tipo_doc":"string|null","fecha_desde":"string|null","fecha_hasta":"string|null"},
  "terminos_busqueda": ["string"],
  "filtros": {"doc_type":"string|null","area":"string|null"},
  "idioma": "es|en"
}`

    const raw = await callClaude({
      system,
      userMessage: `Consulta del usuario: "${userQuery}"\nFiltros disponibles en el sistema: ${JSON.stringify(availableFilters)}`,
    })

    return parseJson(raw, {
      intencion: userQuery,
      entidades: {},
      terminos_busqueda: userQuery.split(' ').filter(w => w.length > 3).slice(0, 5),
      filtros: {},
      idioma: 'es',
    })
  },

  /**
   * Módulo 5 — Generar contenido para sección de template
   * Entrada: tipo de documento, cliente, área, sección solicitada, contexto del análisis
   * Salida: { titulo, contenido, campos_faltantes }
   */
  async generateTemplateSection({ docType, client, area, section, analysisContext = '' }) {
    const system = `Eres un redactor técnico especializado en documentación formal para organismos gubernamentales mexicanos (CFE, IMSS, SAT, SENER, Secretarías).
REGLAS DE ESTILO OBLIGATORIAS:
- Usar voz pasiva e impersonal ("Se realizaron modificaciones a...", "Se procede a formalizar...")
- Lenguaje formal, sin contracciones, sin coloquialismos
- Incluir referencias a normativas cuando aplique
- Formato: párrafos estructurados, máximo 3 párrafos por sección
- Tono: burocrático-técnico (requerimiento crítico del cliente)
Responde SOLO en JSON sin markdown:
{
  "titulo": "string",
  "contenido": "string (párrafos separados por \\n\\n)",
  "metadata": {"cliente":"string","area":"string","responsable":"string","fecha":"string","version":"string"},
  "campos_faltantes": ["string"]
}`

    const userMessage = `
Genera la sección "${section}" para un documento tipo "${docType}".
Cliente/Dependencia: ${client}
Área responsable: ${area}
Fecha de elaboración: ${new Date().toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' })}
${analysisContext ? `Contexto del análisis previo:\n${analysisContext}` : ''}`

    const raw = await callClaude({ system, userMessage, temperature: 0.3 })
    return parseJson(raw, {
      titulo: `${docType} — ${section}`,
      contenido: `Con fundamento en los acuerdos establecidos entre las partes y en cumplimiento de los lineamientos normativos aplicables, se procede a formalizar el presente instrumento jurídico-administrativo.\n\nLos entregables y compromisos derivados del presente acuerdo quedan sujetos a la validación por parte de las instancias competentes.`,
      metadata: { cliente: client, area, responsable: 'Por asignar', fecha: new Date().toLocaleDateString('es-MX'), version: 'Borrador V0' },
      campos_faltantes: ['Nombre del responsable', 'Número de contrato', 'Vigencia'],
    })
  },

  /**
   * Módulo 1 — Sugerir relaciones entre documentos
   * Entrada: documento de referencia + lista de candidatos
   * Salida: lista ordenada por relevancia con justificación
   */
  async suggestRelatedDocuments({ reference, candidates }) {
    const system = `Eres un sistema de análisis de relaciones documentales.
Analiza el documento de referencia y determina cuáles de los candidatos están relacionados.
Responde SOLO en JSON sin markdown:
{"relaciones":[{"id":"string","score":0.0,"razon":"string"}]}`

    const userMessage = `
Documento de referencia:
- Nombre: ${reference.name}
- Tipo: ${reference.doc_type}
- Cliente: ${reference.client}
- Tags: ${(reference.tags || []).join(', ')}
- Resumen: ${reference.summary || ''}

Candidatos a evaluar:
${candidates.map(c => `- ID:${c.id} | ${c.name} | ${c.doc_type} | ${c.client} | Tags: ${(c.tags || []).join(', ')}`).join('\n')}`

    const raw = await callClaude({ system, userMessage })
    const result = parseJson(raw, { relaciones: [] })
    return result.relaciones || []
  },
}
