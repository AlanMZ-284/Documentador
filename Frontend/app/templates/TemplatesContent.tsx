'use client'
import { useState, useRef, useCallback } from 'react'
import {
  FileText, Plus, Trash2, Check, X,
  ChevronDown, ChevronUp, Search, Filter,
  Layers, GitBranch, Upload, Eye, Download,
  AlertCircle, CheckCircle2, RefreshCw,
  BarChart2, Users, Clock, ArrowLeft, ChevronRight,
  Sparkles, MoreHorizontal
} from 'lucide-react'

// ─── Tipos ────────────────────────────────────────────────────────
type MarcoTrabajo = 'Ágil' | 'Cascada'
type FaseProyecto = 'Análisis' | 'Arquitectura' | 'Desarrollo' | 'Pruebas' | 'Liberación'
type EstadoIniciativa = 'Inicial' | 'Formalizado' | 'En Estimación' | 'En Proceso' | 'Cerrado' | 'Cancelado'

// ─── Mock de iniciativas ──────────────────────────────────────────
interface Iniciativa {
  id: string
  nombre: string
  cliente: string
  responsable: string
  area: string
  marco: MarcoTrabajo
  estado: EstadoIniciativa
  avance: number
  fechaInicio: string
  fechaFin: string
  prioridad: 'Alta' | 'Media' | 'Baja'
}

const mockIniciativas: Iniciativa[] = [
  { id: 'INI-001', nombre: 'Modernización Plataforma Tributaria', cliente: 'SAT Regional',         responsable: 'María González',  area: 'Tecnología',  marco: 'Cascada', estado: 'En Proceso',    avance: 62, fechaInicio: '01 Mar 2026', fechaFin: '30 Sep 2026', prioridad: 'Alta'  },
  { id: 'INI-002', nombre: 'Portal de Autoservicio Ciudadano',    cliente: 'Municipio de Ecatepec', responsable: 'Carlos Ruiz',     area: 'Digital',     marco: 'Ágil',    estado: 'En Estimación', avance: 20, fechaInicio: '15 Abr 2026', fechaFin: '15 Oct 2026', prioridad: 'Alta'  },
  { id: 'INI-003', nombre: 'Auditoría de Sistemas Internos',      cliente: 'Contraloría General',   responsable: 'Ana Martínez',    area: 'Auditoría',   marco: 'Cascada', estado: 'Formalizado',   avance: 10, fechaInicio: '01 May 2026', fechaFin: '30 Nov 2026', prioridad: 'Media' },
  { id: 'INI-004', nombre: 'Sistema de Gestión Documental',       cliente: 'Secretaría de Salud',   responsable: 'Luis Ramírez',    area: 'Operaciones', marco: 'Ágil',    estado: 'En Proceso',    avance: 45, fechaInicio: '10 Feb 2026', fechaFin: '10 Ago 2026', prioridad: 'Media' },
  { id: 'INI-005', nombre: 'Migración a Infraestructura Cloud',   cliente: 'IMSS Delegación Norte', responsable: 'Javier González', area: 'Tecnología',  marco: 'Cascada', estado: 'Inicial',       avance: 0,  fechaInicio: '01 Jun 2026', fechaFin: '01 Dic 2026', prioridad: 'Baja'  },
  { id: 'INI-006', nombre: 'App Móvil de Reportes Ciudadanos',    cliente: 'Gobierno Municipal',    responsable: 'Sofía Herrera',   area: 'Digital',     marco: 'Ágil',    estado: 'En Proceso',    avance: 78, fechaInicio: '01 Ene 2026', fechaFin: '30 Jun 2026', prioridad: 'Alta'  },
]

// ─── Artefactos por marco y fase ─────────────────────────────────
type Artefacto = { nombre: string; requerido: boolean; descripcion: string }

const artefactosBase: Record<MarcoTrabajo, Record<FaseProyecto, Artefacto[]>> = {
  Ágil: {
    Análisis:     [
      { nombre: 'Backlog de Producto',              requerido: true,  descripcion: 'Lista priorizada de historias de usuario' },
      { nombre: 'Historias de Usuario',             requerido: true,  descripcion: 'Requerimientos en formato HU' },
      { nombre: 'Criterios de Aceptación',          requerido: true,  descripcion: 'Definición de hecho por historia' },
      { nombre: 'Mapa de Valor',                    requerido: false, descripcion: 'Opcional según complejidad del proyecto' },
    ],
    Arquitectura: [
      { nombre: 'Arquitectura de Solución',         requerido: true,  descripcion: 'Diagrama y descripción de la arquitectura' },
      { nombre: 'Diagrama de Componentes',          requerido: true,  descripcion: 'Componentes del sistema y sus relaciones' },
      { nombre: 'ADR (Decisiones de Arquitectura)', requerido: false, descripcion: 'Registro de decisiones importantes' },
    ],
    Desarrollo:   [
      { nombre: 'Sprint Backlog',                   requerido: true,  descripcion: 'Items comprometidos para el sprint actual' },
      { nombre: 'Código Fuente',                    requerido: true,  descripcion: 'Entregable técnico del sprint' },
      { nombre: 'Pruebas Unitarias',                requerido: true,  descripcion: 'Cobertura mínima del 80%' },
      { nombre: 'Revisión de Código',               requerido: false, descripcion: 'Pull request revisado y aprobado' },
    ],
    Pruebas:      [
      { nombre: 'Plan de Pruebas de Aceptación',    requerido: true,  descripcion: 'Casos de prueba validados con el cliente' },
      { nombre: 'Reporte de Bugs',                  requerido: true,  descripcion: 'Registro de defectos encontrados' },
      { nombre: 'Pruebas de Regresión',             requerido: false, descripcion: 'Validación de funcionalidades previas' },
    ],
    Liberación:   [
      { nombre: 'Release Notes',                    requerido: true,  descripcion: 'Descripción de la versión liberada' },
      { nombre: 'Manual de Despliegue',             requerido: true,  descripcion: 'Instrucciones de instalación y configuración' },
      { nombre: 'Retrospectiva del Sprint',         requerido: true,  descripcion: 'Lecciones aprendidas del equipo' },
    ],
  },
  Cascada: {
    Análisis:     [
      { nombre: 'Especificación de Requerimientos', requerido: true,  descripcion: 'Documento formal de requerimientos (SRS)' },
      { nombre: 'Análisis de Impacto',              requerido: true,  descripcion: 'Evaluación del impacto en sistemas existentes' },
      { nombre: 'Matriz de Trazabilidad',           requerido: true,  descripcion: 'Vinculación requerimiento-entregable' },
      { nombre: 'Estudio de Factibilidad',          requerido: false, descripcion: 'Análisis técnico, económico y operacional' },
    ],
    Arquitectura: [
      { nombre: 'Documento de Arquitectura',        requerido: true,  descripcion: 'Diseño técnico detallado del sistema' },
      { nombre: 'Modelo de Datos',                  requerido: true,  descripcion: 'Entidades, relaciones y diccionario de datos' },
      { nombre: 'Diagrama de Secuencia',            requerido: true,  descripcion: 'Flujos de interacción entre componentes' },
      { nombre: 'Plan de Integración',              requerido: false, descripcion: 'Estrategia de integración entre sistemas' },
    ],
    Desarrollo:   [
      { nombre: 'Módulos Desarrollados',            requerido: true,  descripcion: 'Entregables de código por módulo' },
      { nombre: 'Documentación Técnica',            requerido: true,  descripcion: 'Manual técnico del desarrollador' },
      { nombre: 'Reporte de Avance',                requerido: false, descripcion: 'Estado semanal del desarrollo' },
    ],
    Pruebas:      [
      { nombre: 'Plan de Pruebas',                  requerido: true,  descripcion: 'Estrategia de pruebas del sistema' },
      { nombre: 'Casos de Prueba',                  requerido: true,  descripcion: 'Escenarios detallados de prueba' },
      { nombre: 'Reporte de Calidad',               requerido: true,  descripcion: 'Resultados de pruebas y métricas de calidad' },
      { nombre: 'Informe de Pruebas UAT',           requerido: false, descripcion: 'Validación final con el usuario' },
    ],
    Liberación:   [
      { nombre: 'Manual de Usuario',                requerido: true,  descripcion: 'Guía de uso del sistema para el cliente' },
      { nombre: 'Acta de Liberación',               requerido: true,  descripcion: 'Entrega formal del sistema al cliente' },
      { nombre: 'Plan de Contingencia',             requerido: true,  descripcion: 'Plan de rollback ante fallos en producción' },
      { nombre: 'Manual de Operaciones',            requerido: false, descripcion: 'Guía operativa para el equipo de soporte' },
    ],
  },
}

const FASES: FaseProyecto[] = ['Análisis', 'Arquitectura', 'Desarrollo', 'Pruebas', 'Liberación']

// ─── Librería de templates creados ───────────────────────────────
// Persiste templates creados con "Crear Template" para reutilizarlos
// en cualquier iniciativa y fase desde el panel de detalle.
interface TemplateGuardado {
  id: string
  nombre: string
  fase: FaseProyecto
  campos: number        // cantidad de campos detectados
  creadoEn: string      // fecha legible
  usadoEn: string[]     // IDs de iniciativas donde se aplicó
}

// Biblioteca compartida de templates (en producción vendría de un store/API)
// Se inicializa con algunos templates de ejemplo ya creados
const templatesBibliotecaInicial: TemplateGuardado[] = [
  { id: 'TPL-001', nombre: 'Carta de Aceptación CAPA v2',    fase: 'Análisis',     campos: 8,  creadoEn: '02 Jun 2026', usadoEn: ['INI-001'] },
  { id: 'TPL-002', nombre: 'Propuesta de Servicio PSE',       fase: 'Análisis',     campos: 6,  creadoEn: '05 Jun 2026', usadoEn: [] },
  { id: 'TPL-003', nombre: 'Acta de Revisión de Sprint',      fase: 'Desarrollo',   campos: 10, creadoEn: '08 Jun 2026', usadoEn: ['INI-004'] },
  { id: 'TPL-004', nombre: 'Plan de Pruebas Estándar',        fase: 'Pruebas',      campos: 12, creadoEn: '10 Jun 2026', usadoEn: [] },
  { id: 'TPL-005', nombre: 'Reporte de Calidad QA',           fase: 'Pruebas',      campos: 9,  creadoEn: '11 Jun 2026', usadoEn: ['INI-001', 'INI-002'] },
  { id: 'TPL-006', nombre: 'Manual de Despliegue Cloud',      fase: 'Liberación',   campos: 7,  creadoEn: '12 Jun 2026', usadoEn: [] },
  { id: 'TPL-007', nombre: 'ADR de Decisiones Técnicas',      fase: 'Arquitectura', campos: 5,  creadoEn: '13 Jun 2026', usadoEn: [] },
  { id: 'TPL-008', nombre: 'Solicitud de Alcance SOLA',       fase: 'Análisis',     campos: 11, creadoEn: '14 Jun 2026', usadoEn: ['INI-003'] },
]

const estadoColor: Record<EstadoIniciativa, { bg: string; text: string; border: string }> = {
  'Inicial':       { bg: 'rgba(107,114,128,0.08)', text: '#6b7280', border: '#e5e7eb' },
  'Formalizado':   { bg: 'rgba(2,132,199,0.08)',   text: '#0284c7', border: '#bae6fd' },
  'En Estimación': { bg: 'rgba(217,119,6,0.08)',   text: '#d97706', border: '#fde68a' },
  'En Proceso':    { bg: 'rgba(107,26,42,0.08)',   text: '#6B1A2A', border: '#fecaca' },
  'Cerrado':       { bg: 'rgba(5,150,105,0.08)',   text: '#059669', border: '#a7f3d0' },
  'Cancelado':     { bg: 'rgba(220,38,38,0.08)',   text: '#dc2626', border: '#fecaca' },
}

const prioridadColor: Record<string, { bg: string; text: string }> = {
  Alta:  { bg: 'rgba(220,38,38,0.08)',  text: '#dc2626' },
  Media: { bg: 'rgba(217,119,6,0.08)', text: '#d97706' },
  Baja:  { bg: 'rgba(107,114,128,0.08)', text: '#6b7280' },
}

// ─── Campo de formulario generado por IA ─────────────────────────
interface CampoFormulario {
  id: string
  tipo: 'text' | 'textarea' | 'date' | 'number' | 'select' | 'signature'
  label: string
  placeholder?: string
  opciones?: string[]
  requerido: boolean
}

// ─── Modal: Asignar template existente a una fase ────────────────
function ModalAsignarTemplate({
  iniciativa, faseActual, biblioteca, onAsignar, onClose,
}: {
  iniciativa: Iniciativa
  faseActual: FaseProyecto
  biblioteca: TemplateGuardado[]
  onAsignar: (tpl: TemplateGuardado, fase: FaseProyecto) => void
  onClose: () => void
}) {
  const [busqueda,     setBusqueda]     = useState('')
  const [filtroFase,   setFiltroFase]   = useState<FaseProyecto | 'Todas'>(faseActual)
  const [faseDestino,  setFaseDestino]  = useState<FaseProyecto>(faseActual)
  const [seleccionado, setSeleccionado] = useState<TemplateGuardado | null>(null)
  const [confirmado,   setConfirmado]   = useState(false)

  const filtrados = biblioteca.filter(t => {
    const matchBusqueda = t.nombre.toLowerCase().includes(busqueda.toLowerCase())
    const matchFase     = filtroFase === 'Todas' || t.fase === filtroFase
    return matchBusqueda && matchFase
  })

  const handleConfirmar = () => {
    if (!seleccionado) return
    onAsignar(seleccionado, faseDestino)
    setConfirmado(true)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.4)' }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full border border-gray-100 flex flex-col"
        style={{ maxWidth: '680px', maxHeight: '88vh' }}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(107,26,42,0.08)' }}>
              <FileText size={15} style={{ color: '#6B1A2A' }} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900">Aplicar template existente</h3>
              <p className="text-[10px] text-gray-400">
                Iniciativa: <strong>{iniciativa.nombre}</strong>
              </p>
            </div>
          </div>
          <button onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 transition-all">
            <X size={16} />
          </button>
        </div>

        {confirmado ? (
          <div className="flex-1 flex flex-col items-center justify-center py-12 px-6 text-center">
            <div className="w-16 h-16 rounded-2xl bg-emerald-50 flex items-center justify-center mb-4">
              <CheckCircle2 size={32} className="text-emerald-500" />
            </div>
            <p className="text-base font-bold text-gray-900 mb-1">Template aplicado</p>
            <p className="text-xs text-gray-500 mb-1">
              <strong>{seleccionado?.nombre}</strong> fue asignado a la fase{' '}
              <strong>{faseDestino}</strong>.
            </p>
            <p className="text-[10px] text-gray-400 mb-6">
              El formulario estará disponible como artefacto en esa fase de la iniciativa.
            </p>
            <button onClick={onClose}
              className="px-5 py-2.5 rounded-xl text-xs font-semibold text-white hover:opacity-90 transition-all"
              style={{ background: 'linear-gradient(135deg, #6B1A2A 0%, #8B2339 100%)' }}>
              Cerrar
            </button>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
              {/* Buscador + filtro fase */}
              <div className="flex gap-3">
                <div className="flex-1 relative">
                  <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input value={busqueda} onChange={e => setBusqueda(e.target.value)}
                    placeholder="Buscar template por nombre..."
                    className="w-full pl-9 pr-4 py-2 text-xs border border-gray-200 rounded-lg outline-none focus:border-red-900 bg-white transition-all" />
                </div>
                <select value={filtroFase} onChange={e => setFiltroFase(e.target.value as any)}
                  className="px-3 py-2 text-xs border border-gray-200 rounded-lg outline-none focus:border-red-900 bg-white font-medium text-gray-700">
                  <option value="Todas">Todas las fases</option>
                  {FASES.map(f => <option key={f} value={f}>{f}</option>)}
                </select>
              </div>

              <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-xl">
                <AlertCircle size={13} className="text-blue-600 flex-shrink-0" />
                <p className="text-xs text-blue-700">
                  Selecciona un template de la biblioteca y elige en qué fase de{' '}
                  <strong>{iniciativa.nombre}</strong> deseas aplicarlo.
                </p>
              </div>

              {/* Lista de templates */}
              <div className="space-y-2">
                {filtrados.length === 0 && (
                  <div className="text-center py-8 text-xs text-gray-400">
                    No hay templates que coincidan con tu búsqueda.
                  </div>
                )}
                {filtrados.map(tpl => {
                  const yaUsado = tpl.usadoEn.includes(iniciativa.id)
                  const activo  = seleccionado?.id === tpl.id
                  return (
                    <button key={tpl.id}
                      onClick={() => { setSeleccionado(tpl); setFaseDestino(tpl.fase) }}
                      className="w-full text-left px-4 py-3.5 rounded-xl border-2 transition-all flex items-center justify-between gap-4"
                      style={{
                        borderColor: activo ? '#6B1A2A' : '#e5e7eb',
                        background:  activo ? 'rgba(107,26,42,0.04)' : '#fff',
                      }}>
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                          style={{ background: activo ? 'rgba(107,26,42,0.1)' : '#f9fafb' }}>
                          <FileText size={15} style={{ color: activo ? '#6B1A2A' : '#9ca3af' }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                            <p className="text-xs font-bold text-gray-900 truncate">{tpl.nombre}</p>
                            {yaUsado && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 flex-shrink-0">
                                Ya aplicado
              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 text-[10px] text-gray-400">
                            <span className="flex items-center gap-1"><Layers size={9} /> {tpl.fase}</span>
                            <span>{tpl.campos} campos</span>
                            <span>{tpl.creadoEn}</span>
                            {tpl.usadoEn.length > 0 && (
                              <span>Usado en {tpl.usadoEn.length} iniciativa{tpl.usadoEn.length > 1 ? 's' : ''}</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0"
                        style={{ borderColor: activo ? '#6B1A2A' : '#d1d5db', background: activo ? '#6B1A2A' : 'transparent' }}>
                        {activo && <Check size={10} className="text-white" />}
                      </div>
                    </button>
                  )
                })}
              </div>

              {/* Selector de fase destino */}
              {seleccionado && (
                <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl space-y-2">
                  <p className="text-xs font-semibold text-gray-600">
                    ¿En qué fase de <strong>{iniciativa.nombre}</strong> quieres aplicar este template?
                  </p>
                  <div className="flex gap-2 flex-wrap">
                    {FASES.map(f => (
                      <button key={f} onClick={() => setFaseDestino(f)}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold border-2 transition-all"
                        style={{
                          borderColor: faseDestino === f ? '#6B1A2A' : '#e5e7eb',
                          background:  faseDestino === f ? 'rgba(107,26,42,0.06)' : '#fff',
                          color:       faseDestino === f ? '#6B1A2A' : '#6b7280',
                        }}>
                        {f}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between flex-shrink-0 bg-gray-50 rounded-b-2xl">
              <button onClick={onClose}
                className="px-4 py-2 text-xs font-semibold border border-gray-200 text-gray-600 rounded-xl hover:bg-white transition-all">
                Cancelar
              </button>
              <button onClick={handleConfirmar} disabled={!seleccionado}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold text-white transition-all hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ background: 'linear-gradient(135deg, #6B1A2A 0%, #8B2339 100%)' }}>
                <Check size={13} /> Aplicar template a {faseDestino}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// ─── Sub-componente: Artefacto editable ──────────────────────────
function ArtefactoItem({ art, onDelete, onToggleRequerido }: {
  art: Artefacto; onDelete: () => void; onToggleRequerido: () => void
}) {
  return (
    <div className="flex items-center justify-between py-3 px-4 border border-gray-100 rounded-lg hover:bg-gray-50/50 transition-all group">
      <div className="flex items-center gap-3">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: 'rgba(107,26,42,0.06)' }}>
          <FileText size={13} style={{ color: '#6B1A2A' }} />
        </div>
        <div>
          <p className="text-xs font-semibold text-gray-800">{art.nombre}</p>
          <p className="text-[10px] text-gray-400">{art.descripcion}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button onClick={onToggleRequerido}
          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold transition-all border ${
            art.requerido
              ? 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100'
              : 'bg-gray-100 text-gray-500 border-gray-200 hover:bg-gray-200'
          }`}>
          {art.requerido ? 'Requerido' : 'Opcional'}
        </button>
        <button onClick={onDelete}
          className="p-1 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100">
          <Trash2 size={12} />
        </button>
      </div>
    </div>
  )
}

// ─── Modal: Crear Template desde PDF ─────────────────────────────
function ModalCrearTemplate({ onClose, fasesDisponibles }: {
  onClose: () => void
  fasesDisponibles?: FaseProyecto[]
}) {
  const [paso, setPaso]                         = useState<'upload' | 'procesando' | 'preview' | 'guardado'>('upload')
  const [archivo, setArchivo]                   = useState<File | null>(null)
  const [progreso, setProgreso]                 = useState(0)
  const [nombreTemplate, setNombreTemplate]     = useState('')
  const [faseDestino, setFaseDestino]           = useState<FaseProyecto | ''>('')
  const [camposGenerados, setCamposGenerados]   = useState<CampoFormulario[]>([])
  const [campoEditando, setCampoEditando]       = useState<string | null>(null)
  const fileRef                                 = useRef<HTMLInputElement>(null)

  // Simula el procesamiento IA del PDF
  const procesarPDF = useCallback((file: File) => {
    setArchivo(file)
    setNombreTemplate(file.name.replace('.pdf', '').replace(/_/g, ' '))
    setPaso('procesando')
    setProgreso(0)

    const pasos = [
      { p: 15, msg: '' }, { p: 35, msg: '' }, { p: 55, msg: '' },
      { p: 75, msg: '' }, { p: 90, msg: '' }, { p: 100, msg: '' },
    ]
    let i = 0
    const iv = setInterval(() => {
      if (i < pasos.length) { setProgreso(pasos[i].p); i++ }
      else {
        clearInterval(iv)
        // Campos mock generados por IA a partir del PDF
        setCamposGenerados([
          { id: 'c1', tipo: 'text',      label: 'Nombre del Solicitante',    placeholder: 'Ingrese el nombre completo',    requerido: true  },
          { id: 'c2', tipo: 'text',      label: 'Área / Departamento',       placeholder: 'Ej. Tecnología',                requerido: true  },
          { id: 'c3', tipo: 'date',      label: 'Fecha de Solicitud',        placeholder: '',                              requerido: true  },
          { id: 'c4', tipo: 'textarea',  label: 'Descripción del Servicio',  placeholder: 'Describe el servicio solicitado...', requerido: true },
          { id: 'c5', tipo: 'number',    label: 'Monto Estimado (MXN)',      placeholder: '0.00',                          requerido: false },
          { id: 'c6', tipo: 'select',    label: 'Prioridad',                 opciones: ['Alta', 'Media', 'Baja'],          requerido: true  },
          { id: 'c7', tipo: 'textarea',  label: 'Observaciones',             placeholder: 'Notas adicionales...',          requerido: false },
          { id: 'c8', tipo: 'signature', label: 'Firma del Responsable',     placeholder: '',                              requerido: true  },
        ])
        setPaso('preview')
      }
    }, 300)
  }, [])

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const f = e.dataTransfer.files[0]
    if (f && f.type === 'application/pdf') procesarPDF(f)
  }

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (f) procesarPDF(f)
  }

  const handleGuardar = () => {
    if (!nombreTemplate.trim() || !faseDestino) return
    setPaso('guardado')
  }

  const toggleRequerido = (id: string) =>
    setCamposGenerados(prev => prev.map(c => c.id === id ? { ...c, requerido: !c.requerido } : c))

  const eliminarCampo = (id: string) =>
    setCamposGenerados(prev => prev.filter(c => c.id !== id))

  const agregarCampo = () => {
    const nuevo: CampoFormulario = {
      id: `c${Date.now()}`, tipo: 'text', label: 'Nuevo Campo', placeholder: '', requerido: false
    }
    setCamposGenerados(prev => [...prev, nuevo])
    setCampoEditando(nuevo.id)
  }

  const tipoIcono: Record<CampoFormulario['tipo'], string> = {
    text: 'T', textarea: '¶', date: '📅', number: '#', select: '▾', signature: '✍'
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.4)' }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full border border-gray-100"
        style={{ maxWidth: paso === 'preview' ? '780px' : '520px', maxHeight: '90vh', overflowY: 'auto' }}>

        {/* Header del modal */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(107,26,42,0.08)' }}>
              <Sparkles size={15} style={{ color: '#6B1A2A' }} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900">Crear Template desde PDF</h3>
              <p className="text-[10px] text-gray-400">La IA analiza el documento y genera el formulario automáticamente</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 transition-all">
            <X size={16} />
          </button>
        </div>

        {/* Indicador de pasos */}
        <div className="flex items-center gap-0 px-6 py-3 border-b border-gray-50 bg-gray-50/30">
          {[
            { key: 'upload',     label: '1. Subir PDF'  },
            { key: 'procesando', label: '2. Analizando' },
            { key: 'preview',    label: '3. Vista previa' },
            { key: 'guardado',   label: '4. Listo'      },
          ].map((s, i) => {
            const pasos = ['upload', 'procesando', 'preview', 'guardado']
            const idx = pasos.indexOf(paso)
            const sIdx = pasos.indexOf(s.key)
            const done = sIdx < idx
            const active = s.key === paso
            return (
              <div key={s.key} className="flex items-center flex-1">
                <div className="flex items-center gap-1.5">
                  <div className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0"
                    style={{
                      background: active ? '#6B1A2A' : done ? '#059669' : '#e5e7eb',
                      color: (active || done) ? '#fff' : '#9ca3af'
                    }}>
                    {done ? <Check size={10} /> : i + 1}
                  </div>
                  <span className="text-[10px] font-semibold whitespace-nowrap hidden sm:block"
                    style={{ color: active ? '#6B1A2A' : done ? '#059669' : '#9ca3af' }}>
                    {s.label}
                  </span>
                </div>
                {i < 3 && <div className="flex-1 h-px mx-2" style={{ background: done ? '#a7f3d0' : '#e5e7eb' }} />}
              </div>
            )
          })}
        </div>

        <div className="p-6">
          {/* PASO 1: Upload */}
          {paso === 'upload' && (
            <div>
              <div
                onDrop={handleDrop}
                onDragOver={e => e.preventDefault()}
                onClick={() => fileRef.current?.click()}
                className="border-2 border-dashed border-gray-200 rounded-2xl p-10 text-center cursor-pointer hover:border-red-300 hover:bg-red-50/20 transition-all group">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 transition-all group-hover:scale-105"
                  style={{ background: 'rgba(107,26,42,0.06)' }}>
                  <Upload size={24} style={{ color: '#6B1A2A' }} />
                </div>
                <p className="text-sm font-semibold text-gray-700 mb-1">Arrastra tu PDF aquí</p>
                <p className="text-xs text-gray-400 mb-4">o haz clic para seleccionar el archivo</p>
                <span className="px-4 py-2 rounded-xl text-xs font-semibold text-white inline-flex items-center gap-1.5 transition-all"
                  style={{ background: 'linear-gradient(135deg, #6B1A2A 0%, #8B2339 100%)' }}>
                  <Upload size={12} /> Seleccionar PDF
                </span>
                <p className="text-[10px] text-gray-300 mt-4">Formatos aceptados: PDF · Tamaño máximo: 25 MB</p>
              </div>
              <input ref={fileRef} type="file" accept=".pdf" className="hidden" onChange={handleFile} />
            </div>
          )}

          {/* PASO 2: Procesando */}
          {paso === 'procesando' && (
            <div className="text-center py-8">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5"
                style={{ background: 'rgba(107,26,42,0.06)' }}>
                <RefreshCw size={26} style={{ color: '#6B1A2A' }} className="animate-spin" />
              </div>
              <p className="text-sm font-bold text-gray-900 mb-1">Analizando documento con IA</p>
              <p className="text-xs text-gray-400 mb-6">{archivo?.name}</p>

              <div className="w-full bg-gray-100 rounded-full h-2 mb-2 overflow-hidden">
                <div className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${progreso}%`, background: 'linear-gradient(90deg, #6B1A2A, #C4384F)' }} />
              </div>
              <p className="text-xs text-gray-500 font-semibold">{progreso}%</p>

              <div className="mt-6 space-y-2 text-left">
                {[
                  { done: progreso >= 35, label: 'Extrayendo texto y estructura del PDF' },
                  { done: progreso >= 55, label: 'Identificando secciones y campos' },
                  { done: progreso >= 75, label: 'Clasificando tipos de campo' },
                  { done: progreso >= 90, label: 'Generando formulario interactivo' },
                  { done: progreso >= 100, label: 'Preparando vista previa' },
                ].map((s, i) => (
                  <div key={i} className="flex items-center gap-2.5 px-3 py-2 rounded-lg"
                    style={{ background: s.done ? 'rgba(5,150,105,0.05)' : '#f9fafb' }}>
                    <div className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 ${s.done ? 'bg-emerald-500' : 'bg-gray-200'}`}>
                      {s.done && <Check size={9} className="text-white" />}
                    </div>
                    <span className={`text-xs ${s.done ? 'text-emerald-700 font-semibold' : 'text-gray-400'}`}>{s.label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* PASO 3: Vista previa del formulario generado */}
          {paso === 'preview' && (
            <div>
              {/* Configuración del template */}
              <div className="grid grid-cols-2 gap-4 mb-5">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Nombre del template *</label>
                  <input
                    value={nombreTemplate}
                    onChange={e => setNombreTemplate(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg outline-none focus:border-red-900 bg-white transition-all"
                    placeholder="Nombre del formulario"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Asignar a fase *</label>
                  <select
                    value={faseDestino}
                    onChange={e => setFaseDestino(e.target.value as FaseProyecto)}
                    className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg outline-none focus:border-red-900 bg-white transition-all">
                    <option value="">Seleccionar fase...</option>
                    {(fasesDisponibles ?? FASES).map(f => (
                      <option key={f} value={f}>{f}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Info IA */}
              <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-xl mb-4">
                <CheckCircle2 size={13} className="text-emerald-600 flex-shrink-0" />
                <p className="text-xs text-emerald-700">
                  La IA detectó <strong>{camposGenerados.length} campos</strong> en el documento.
                  Puedes editar, eliminar o agregar campos antes de guardar.
                </p>
              </div>

              {/* Layout de dos columnas: formulario a la izquierda, preview a la derecha */}
              <div className="grid grid-cols-2 gap-5">
                {/* Columna izquierda: campos editables */}
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Campos detectados</p>
                  <div className="space-y-1.5 max-h-[340px] overflow-y-auto pr-1">
                    {camposGenerados.map(campo => (
                      <div key={campo.id}
                        className="flex items-center justify-between px-3 py-2.5 border border-gray-100 rounded-lg hover:bg-gray-50/50 group transition-all">
                        <div className="flex items-center gap-2.5">
                          <span className="w-6 h-6 rounded-md bg-gray-100 text-gray-500 text-[10px] font-bold flex items-center justify-center flex-shrink-0">
                            {tipoIcono[campo.tipo]}
                          </span>
                          <div>
                            <p className="text-xs font-semibold text-gray-800">{campo.label}</p>
                            <p className="text-[10px] text-gray-400 capitalize">{campo.tipo}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button onClick={() => toggleRequerido(campo.id)}
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold border transition-all ${
                              campo.requerido
                                ? 'bg-red-50 text-red-700 border-red-200'
                                : 'bg-gray-100 text-gray-500 border-gray-200'
                            }`}>
                            {campo.requerido ? 'Req.' : 'Opc.'}
                          </button>
                          <button onClick={() => eliminarCampo(campo.id)}
                            className="p-0.5 text-gray-300 hover:text-red-500 transition-all opacity-0 group-hover:opacity-100">
                            <Trash2 size={11} />
                          </button>
                        </div>
                      </div>
                    ))}
                    <button onClick={agregarCampo}
                      className="w-full mt-1 flex items-center justify-center gap-1.5 py-2 rounded-xl border-2 border-dashed border-gray-200 text-xs font-semibold text-gray-400 hover:border-red-200 hover:text-red-600 hover:bg-red-50/20 transition-all">
                      <Plus size={12} /> Agregar campo
                    </button>
                  </div>
                </div>

                {/* Columna derecha: vista previa del formulario renderizado */}
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Vista previa del formulario</p>
                  <div className="border border-gray-200 rounded-xl p-4 bg-gray-50/30 max-h-[340px] overflow-y-auto space-y-3">
                    <div className="pb-2 mb-1 border-b border-gray-100">
                      <p className="text-xs font-bold text-gray-900">{nombreTemplate || 'Sin nombre'}</p>
                      {faseDestino && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full mt-1 inline-block"
                          style={{ background: 'rgba(107,26,42,0.08)', color: '#6B1A2A' }}>
                          {faseDestino}
                        </span>
                      )}
                    </div>
                    {camposGenerados.map(campo => (
                      <div key={campo.id}>
                        <label className="block text-[10px] font-semibold text-gray-500 mb-0.5">
                          {campo.label} {campo.requerido && <span className="text-red-400">*</span>}
                        </label>
                        {campo.tipo === 'textarea' && (
                          <div className="w-full px-2.5 py-1.5 text-[10px] border border-gray-200 rounded-lg bg-white text-gray-300 h-10" />
                        )}
                        {campo.tipo === 'select' && (
                          <div className="w-full px-2.5 py-1.5 text-[10px] border border-gray-200 rounded-lg bg-white text-gray-300">
                            Seleccionar...
                          </div>
                        )}
                        {campo.tipo === 'signature' && (
                          <div className="w-full h-10 border border-dashed border-gray-300 rounded-lg bg-white flex items-center justify-center text-[10px] text-gray-300">
                            Área de firma
                          </div>
                        )}
                        {(campo.tipo === 'text' || campo.tipo === 'date' || campo.tipo === 'number') && (
                          <div className="w-full px-2.5 py-1.5 text-[10px] border border-gray-200 rounded-lg bg-white text-gray-300">
                            {campo.placeholder || campo.label}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Acciones */}
              <div className="flex items-center justify-between mt-5 pt-4 border-t border-gray-100">
                <button onClick={() => setPaso('upload')}
                  className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-800 font-semibold transition-all">
                  <ArrowLeft size={13} /> Volver
                </button>
                <div className="flex gap-2">
                  <button onClick={onClose}
                    className="px-4 py-2 rounded-xl text-xs font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50 transition-all">
                    Cancelar
                  </button>
                  <button
                    onClick={handleGuardar}
                    disabled={!nombreTemplate.trim() || !faseDestino}
                    className="flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-semibold text-white transition-all hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{ background: 'linear-gradient(135deg, #6B1A2A 0%, #8B2339 100%)' }}>
                    <Upload size={13} /> Subir a la plataforma
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* PASO 4: Guardado */}
          {paso === 'guardado' && (
            <div className="text-center py-10">
              <div className="w-16 h-16 rounded-2xl bg-emerald-50 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 size={32} className="text-emerald-500" />
              </div>
              <p className="text-base font-bold text-gray-900 mb-1">Template publicado</p>
              <p className="text-xs text-gray-500 mb-2">
                <strong>{nombreTemplate}</strong> está disponible en la fase <strong>{faseDestino}</strong>.
              </p>
              <p className="text-[10px] text-gray-400 mb-6">
                Todas las iniciativas con este marco podrán usar el template al ingresar a la fase correspondiente.
              </p>
              <div className="flex gap-2 justify-center">
                <button onClick={onClose}
                  className="px-5 py-2.5 rounded-xl text-xs font-semibold text-white transition-all hover:opacity-90"
                  style={{ background: 'linear-gradient(135deg, #6B1A2A 0%, #8B2339 100%)' }}>
                  Cerrar
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Vista detalle de iniciativa ──────────────────────────────────
function DetalleIniciativa({ iniciativa, onClose }: {
  iniciativa: Iniciativa
  onClose: () => void
}) {
  const [artefactos, setArtefactos] = useState<Record<FaseProyecto, Artefacto[]>>(
    () => JSON.parse(JSON.stringify(artefactosBase[iniciativa.marco]))
  )
  const [expandedFases, setExpandedFases] = useState<FaseProyecto[]>(['Análisis'])
  const [showNuevoModal, setShowNuevoModal] = useState(false)
  const [faseParaNuevo, setFaseParaNuevo]   = useState<FaseProyecto>('Análisis')
  const [savedMsg, setSavedMsg]             = useState(false)
  const [showCrearTemplate, setShowCrearTemplate] = useState(false)

  // ── Biblioteca de templates y modal de asignación ──────────────
  const [biblioteca, setBiblioteca]         = useState<TemplateGuardado[]>(templatesBibliotecaInicial)
  const [showAsignar, setShowAsignar]        = useState(false)
  const [faseParaAsignar, setFaseParaAsignar] = useState<FaseProyecto>('Análisis')

  const ec = estadoColor[iniciativa.estado]
  const pc = prioridadColor[iniciativa.prioridad]

  const toggleFase = (f: FaseProyecto) =>
    setExpandedFases(prev => prev.includes(f) ? prev.filter(x => x !== f) : [...prev, f])

  const handleDelete = (fase: FaseProyecto, idx: number) =>
    setArtefactos(prev => { const n = { ...prev }; n[fase] = n[fase].filter((_, i) => i !== idx); return { ...n } })

  const handleToggle = (fase: FaseProyecto, idx: number) =>
    setArtefactos(prev => {
      const n = JSON.parse(JSON.stringify(prev))
      n[fase][idx].requerido = !n[fase][idx].requerido
      return n
    })

  const handleAdd = (fase: FaseProyecto, art: Artefacto) =>
    setArtefactos(prev => { const n = { ...prev }; n[fase] = [...n[fase], art]; return { ...n } })

  // Al asignar un template desde la biblioteca, lo convierte en artefacto
  // de la fase elegida y marca el template como usado en esta iniciativa
  const handleAsignarTemplate = (tpl: TemplateGuardado, fase: FaseProyecto) => {
    const nuevoArtefacto: Artefacto = {
      nombre:     tpl.nombre,
      requerido:  true,
      descripcion: `Template · ${tpl.campos} campos · Creado ${tpl.creadoEn}`,
    }
    setArtefactos(prev => { const n = { ...prev }; n[fase] = [...n[fase], nuevoArtefacto]; return { ...n } })
    // Marcar el template como usado en esta iniciativa
    setBiblioteca(prev => prev.map(t =>
      t.id === tpl.id && !t.usadoEn.includes(iniciativa.id)
        ? { ...t, usadoEn: [...t.usadoEn, iniciativa.id] }
        : t
    ))
    // Expandir la fase donde se asignó
    setExpandedFases(prev => prev.includes(fase) ? prev : [...prev, fase])
  }

  const handleGuardar = () => {
    setSavedMsg(true)
    setTimeout(() => setSavedMsg(false), 2500)
  }

  const totalArts = FASES.reduce((s, f) => s + artefactos[f].length, 0)
  const totalReq  = FASES.reduce((s, f) => s + artefactos[f].filter(a => a.requerido).length, 0)

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Cabecera del detalle */}
      <div className="bg-white rounded-xl border border-gray-100 p-5"
        style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
        <div className="flex items-start justify-between mb-4">
          <button onClick={onClose}
            className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-800 font-semibold transition-all">
            <ArrowLeft size={13} /> Volver al buscador
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={() => { setFaseParaAsignar('Análisis'); setShowAsignar(true) }}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold border border-gray-200 text-gray-700 hover:bg-gray-50 transition-all">
              <FileText size={13} /> Aplicar template existente
            </button>
            <button
              onClick={() => setShowCrearTemplate(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-white transition-all hover:opacity-90"
              style={{ background: 'linear-gradient(135deg, #6B1A2A 0%, #8B2339 100%)' }}>
              <Sparkles size={13} /> Crear Template
            </button>
          </div>
        </div>

        <div className="flex items-start gap-5">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2 flex-wrap">
              <h2 className="text-lg font-bold text-gray-900">{iniciativa.nombre}</h2>
              <span className="text-[10px] font-mono text-gray-400 bg-gray-100 px-2 py-0.5 rounded-md">{iniciativa.id}</span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border"
                style={{ color: ec.text, background: ec.bg, borderColor: ec.border }}>
                {iniciativa.estado}
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold"
                style={{ background: 'rgba(107,26,42,0.08)', color: '#6B1A2A' }}>
                {iniciativa.marco === 'Ágil' ? <GitBranch size={10} /> : <Layers size={10} />} {iniciativa.marco}
              </span>
            </div>
            <div className="flex items-center gap-4 text-xs text-gray-400 flex-wrap">
              <span className="flex items-center gap-1.5"><Users size={11} /> {iniciativa.responsable}</span>
              <span className="flex items-center gap-1.5"><BarChart2 size={11} /> {iniciativa.area}</span>
              <span className="flex items-center gap-1.5"><Clock size={11} /> {iniciativa.fechaInicio} → {iniciativa.fechaFin}</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold"
                style={{ background: pc.bg, color: pc.text }}>
                Prioridad {iniciativa.prioridad}
              </span>
            </div>
          </div>
          {/* Avance circular */}
          <div className="text-center flex-shrink-0">
            <div className="relative w-14 h-14">
              <svg viewBox="0 0 36 36" className="w-14 h-14 -rotate-90">
                <circle cx="18" cy="18" r="15.9" fill="none" stroke="#f3f4f6" strokeWidth="3" />
                <circle cx="18" cy="18" r="15.9" fill="none" stroke="#6B1A2A" strokeWidth="3"
                  strokeDasharray={`${iniciativa.avance} ${100 - iniciativa.avance}`} strokeLinecap="round" />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-gray-800">
                {iniciativa.avance}%
              </span>
            </div>
            <p className="text-[10px] text-gray-400 mt-1">Avance</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-gray-50">
          {[
            { label: 'Total artefactos', value: totalArts,              color: '#6B1A2A' },
            { label: 'Requeridos',        value: totalReq,               color: '#dc2626' },
            { label: 'Opcionales',        value: totalArts - totalReq,   color: '#6b7280' },
          ].map(s => (
            <div key={s.label} className="p-3 bg-gray-50 rounded-xl border border-gray-100 text-center">
              <p className="text-lg font-bold" style={{ color: s.color }}>{s.value}</p>
              <p className="text-[10px] text-gray-400">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Banner de nota */}
      <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2">
        <AlertCircle size={13} className="text-amber-600 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-amber-700">
          Estás editando los artefactos de <strong>{iniciativa.nombre}</strong> de forma individual.
          Los cambios aquí solo aplican a esta iniciativa, sin afectar la configuración global del marco <strong>{iniciativa.marco}</strong>.
        </p>
      </div>

      {/* Fases editables */}
      <div className="space-y-3">
        {FASES.map(fase => {
          const arts       = artefactos[fase]
          const isExpanded = expandedFases.includes(fase)
          const reqCount   = arts.filter(a => a.requerido).length

          return (
            <div key={fase} className="bg-white rounded-xl border border-gray-100 overflow-hidden"
              style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
              <button
                onClick={() => toggleFase(fase)}
                className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50/50 transition-all">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ background: 'rgba(107,26,42,0.06)' }}>
                    <Layers size={14} style={{ color: '#6B1A2A' }} />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-bold text-gray-900">{fase}</p>
                    <p className="text-[10px] text-gray-400">
                      {arts.length} artefactos · {reqCount} requeridos · {arts.length - reqCount} opcionales
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-20 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full"
                      style={{
                        width: arts.length > 0 ? `${(reqCount / arts.length) * 100}%` : '0%',
                        background: 'linear-gradient(90deg, #6B1A2A, #C4384F)',
                      }} />
                  </div>
                  <span className="text-xs text-gray-500 font-semibold">
                    {arts.length > 0 ? Math.round((reqCount / arts.length) * 100) : 0}%
                  </span>
                  {isExpanded ? <ChevronUp size={14} className="text-gray-400" /> : <ChevronDown size={14} className="text-gray-400" />}
                </div>
              </button>

              {isExpanded && (
                <div className="border-t border-gray-100 px-5 py-4 space-y-2">
                  {arts.length === 0 && (
                    <p className="text-xs text-gray-400 text-center py-4">Sin artefactos en esta fase.</p>
                  )}
                  {arts.map((art, idx) => (
                    <ArtefactoItem
                      key={`${fase}-${idx}`}
                      art={art}
                      onDelete={() => handleDelete(fase, idx)}
                      onToggleRequerido={() => handleToggle(fase, idx)}
                    />
                  ))}
                  <button
                    onClick={() => { setFaseParaNuevo(fase); setShowNuevoModal(true) }}
                    className="w-full mt-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 border-dashed border-gray-200 text-xs font-semibold text-gray-400 hover:border-red-200 hover:text-red-700 hover:bg-red-50/20 transition-all">
                    <Plus size={12} /> Agregar artefacto a {fase}
                  </button>
                  <button
                    onClick={() => { setFaseParaAsignar(fase); setShowAsignar(true) }}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 border-dashed border-blue-100 text-xs font-semibold text-blue-400 hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50/30 transition-all">
                    <FileText size={12} /> Aplicar template de biblioteca a {fase}
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Barra inferior de guardado */}
      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
        <p className="text-xs text-gray-500">
          Los cambios aplican únicamente a <strong>{iniciativa.nombre}</strong>.
        </p>
        <div className="flex items-center gap-2">
          {savedMsg && (
            <span className="flex items-center gap-1.5 text-xs text-emerald-600 font-semibold">
              <CheckCircle2 size={13} /> Guardado
            </span>
          )}
          <button
            onClick={() => setArtefactos(JSON.parse(JSON.stringify(artefactosBase[iniciativa.marco])))}
            className="px-4 py-2 rounded-xl text-xs font-semibold border border-gray-200 text-gray-600 hover:bg-gray-100 transition-all">
            Restablecer
          </button>
          <button
            onClick={handleGuardar}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-white transition-all hover:opacity-90"
            style={{ background: 'linear-gradient(135deg, #6B1A2A 0%, #8B2339 100%)' }}>
            <Check size={13} /> Guardar cambios
          </button>
        </div>
      </div>

      {/* Modal agregar artefacto manual */}
      {showNuevoModal && (
        <ModalNuevoArtefacto
          fase={faseParaNuevo}
          onAdd={art => { handleAdd(faseParaNuevo, art); setShowNuevoModal(false) }}
          onClose={() => setShowNuevoModal(false)}
        />
      )}

      {/* Modal crear template */}
      {showCrearTemplate && (
        <ModalCrearTemplate
          onClose={() => setShowCrearTemplate(false)}
          fasesDisponibles={FASES}
        />
      )}

      {/* Modal aplicar template de biblioteca */}
      {showAsignar && (
        <ModalAsignarTemplate
          iniciativa={iniciativa}
          faseActual={faseParaAsignar}
          biblioteca={biblioteca}
          onAsignar={handleAsignarTemplate}
          onClose={() => setShowAsignar(false)}
        />
      )}
    </div>
  )
}

// ─── Modal: Agregar artefacto manual ─────────────────────────────
function ModalNuevoArtefacto({ fase, onAdd, onClose }: {
  fase: FaseProyecto
  onAdd: (art: Artefacto) => void
  onClose: () => void
}) {
  const [nombre, setNombre]           = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [requerido, setRequerido]     = useState(true)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.35)' }}>
      <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-sm font-bold text-gray-900">Agregar artefacto a <span style={{ color: '#6B1A2A' }}>{fase}</span></h4>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 transition-all">
            <X size={16} />
          </button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Nombre *</label>
            <input value={nombre} onChange={e => setNombre(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg outline-none focus:border-red-900 transition-all"
              placeholder="Ej. Especificación de Requerimientos" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Descripción</label>
            <input value={descripcion} onChange={e => setDescripcion(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg outline-none focus:border-red-900 transition-all"
              placeholder="Breve descripción" />
          </div>
          <button onClick={() => setRequerido(r => !r)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
              requerido ? 'bg-red-50 text-red-700 border-red-200' : 'bg-gray-50 text-gray-600 border-gray-200'
            }`}>
            {requerido ? '★ Requerido' : '○ Opcional'}
          </button>
        </div>
        <div className="flex gap-2 mt-5">
          <button
            onClick={() => { if (nombre.trim()) onAdd({ nombre, descripcion, requerido }) }}
            disabled={!nombre.trim()}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold text-white transition-all hover:opacity-90 disabled:opacity-40"
            style={{ background: 'linear-gradient(135deg, #6B1A2A 0%, #8B2339 100%)' }}>
            <Check size={13} /> Agregar
          </button>
          <button onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-xs font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50 transition-all">
            Cancelar
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Componente principal ─────────────────────────────────────────
export default function TemplatesContent() {
  // Buscador
  const [busqueda, setBusqueda]           = useState('')
  const [filtroMarco, setFiltroMarco]     = useState<MarcoTrabajo | 'Todos'>('Todos')
  const [filtroEstado, setFiltroEstado]   = useState<EstadoIniciativa | 'Todos'>('Todos')
  const [filtroArea, setFiltroArea]       = useState('Todos')
  const [filtroPrioridad, setFiltroPrioridad] = useState('Todos')

  // Selección
  const [iniciativaSeleccionada, setIniciativaSeleccionada] = useState<Iniciativa | null>(null)

  // Modal global de crear template (desde el header)
  const [showCrearTemplate, setShowCrearTemplate] = useState(false)

  // Biblioteca de templates compartida (en producción: store/API)
  const [biblioteca, setBibliotecaGlobal]    = useState<TemplateGuardado[]>(templatesBibliotecaInicial)
  const [showAsignarGlobal, setShowAsignarGlobal] = useState(false)

  const areas = ['Todos', ...Array.from(new Set(mockIniciativas.map(i => i.area)))]

  const filtradas = mockIniciativas.filter(i => {
    const matchBusqueda  = i.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
                           i.cliente.toLowerCase().includes(busqueda.toLowerCase()) ||
                           i.id.toLowerCase().includes(busqueda.toLowerCase())
    const matchMarco     = filtroMarco === 'Todos'     || i.marco     === filtroMarco
    const matchEstado    = filtroEstado === 'Todos'    || i.estado    === filtroEstado
    const matchArea      = filtroArea === 'Todos'      || i.area      === filtroArea
    const matchPrioridad = filtroPrioridad === 'Todos' || i.prioridad === filtroPrioridad
    return matchBusqueda && matchMarco && matchEstado && matchArea && matchPrioridad
  })

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Gestión de Construcción</h1>
          <p className="text-sm text-gray-500 mt-1">
            Busca una iniciativa y configura sus fases y artefactos de forma individual
          </p>
        </div>
        {/* Botón crear template (esquina superior derecha, siempre visible) */}
        <button
          onClick={() => setShowCrearTemplate(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90"
          style={{ background: 'linear-gradient(135deg, #6B1A2A 0%, #8B2339 100%)' }}>
          <Sparkles size={15} /> Crear Template
        </button>
      </div>

      {/* Si hay iniciativa seleccionada, mostramos el detalle */}
      {iniciativaSeleccionada ? (
        <DetalleIniciativa
          iniciativa={iniciativaSeleccionada}
          onClose={() => setIniciativaSeleccionada(null)}
        />
      ) : (
        /* ── PANEL DE BÚSQUEDA ── */
        <div className="space-y-5">
          {/* Buscador + filtros */}
          <div className="bg-white rounded-xl border border-gray-100 p-5"
            style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Buscar iniciativa</p>

            {/* Barra de búsqueda */}
            <div className="relative mb-4">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={busqueda}
                onChange={e => setBusqueda(e.target.value)}
                placeholder="Buscar por nombre, cliente o ID de iniciativa..."
                className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl outline-none focus:border-red-900 bg-white transition-all"
              />
            </div>

            {/* Filtros */}
            <div className="grid grid-cols-4 gap-3">
              <div>
                <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Marco</label>
                <select value={filtroMarco} onChange={e => setFiltroMarco(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg outline-none focus:border-red-900 bg-white transition-all font-medium text-gray-700">
                  <option value="Todos">Todos</option>
                  <option value="Ágil">Ágil</option>
                  <option value="Cascada">Cascada</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Estado</label>
                <select value={filtroEstado} onChange={e => setFiltroEstado(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg outline-none focus:border-red-900 bg-white transition-all font-medium text-gray-700">
                  <option value="Todos">Todos</option>
                  {(['Inicial', 'Formalizado', 'En Estimación', 'En Proceso', 'Cerrado', 'Cancelado'] as EstadoIniciativa[]).map(e => (
                    <option key={e} value={e}>{e}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Área</label>
                <select value={filtroArea} onChange={e => setFiltroArea(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg outline-none focus:border-red-900 bg-white transition-all font-medium text-gray-700">
                  {areas.map(a => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Prioridad</label>
                <select value={filtroPrioridad} onChange={e => setFiltroPrioridad(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg outline-none focus:border-red-900 bg-white transition-all font-medium text-gray-700">
                  <option value="Todos">Todas</option>
                  <option value="Alta">Alta</option>
                  <option value="Media">Media</option>
                  <option value="Baja">Baja</option>
                </select>
              </div>
            </div>

            <p className="text-[10px] text-gray-400 mt-3">
              {filtradas.length} {filtradas.length === 1 ? 'iniciativa encontrada' : 'iniciativas encontradas'}
            </p>
          </div>

          {/* Resultados */}
          {filtradas.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-100 p-12 text-center"
              style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
              <Search size={32} className="mx-auto text-gray-200 mb-3" />
              <p className="text-sm font-semibold text-gray-500 mb-1">Sin resultados</p>
              <p className="text-xs text-gray-400">Ajusta los filtros o el término de búsqueda.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filtradas.map(ini => {
                const ec = estadoColor[ini.estado]
                const pc = prioridadColor[ini.prioridad]
                return (
                  <div key={ini.id}
                    className="bg-white rounded-xl border border-gray-100 p-5 hover:border-red-100 hover:shadow-sm transition-all cursor-pointer group"
                    style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
                    onClick={() => setIniciativaSeleccionada(ini)}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-start gap-4 flex-1">
                        {/* Avatar / ícono */}
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                          style={{ background: 'rgba(107,26,42,0.06)' }}>
                          {ini.marco === 'Ágil'
                            ? <GitBranch size={18} style={{ color: '#6B1A2A' }} />
                            : <Layers size={18} style={{ color: '#6B1A2A' }} />}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className="text-[10px] font-mono text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">{ini.id}</span>
                            <h3 className="text-sm font-bold text-gray-900 truncate">{ini.nombre}</h3>
                          </div>
                          <p className="text-xs text-gray-500 mb-2">{ini.cliente} · {ini.area}</p>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border"
                              style={{ color: ec.text, background: ec.bg, borderColor: ec.border }}>
                              {ini.estado}
                            </span>
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold"
                              style={{ background: 'rgba(107,26,42,0.06)', color: '#6B1A2A' }}>
                              {ini.marco === 'Ágil' ? <GitBranch size={9} /> : <Layers size={9} />} {ini.marco}
                            </span>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold"
                              style={{ background: pc.bg, color: pc.text }}>
                              {ini.prioridad}
                            </span>
                            <span className="text-[10px] text-gray-400 flex items-center gap-1">
                              <Clock size={9} /> {ini.fechaInicio} → {ini.fechaFin}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Avance + flecha */}
                      <div className="flex items-center gap-4 ml-4 flex-shrink-0">
                        <div className="text-right">
                          <p className="text-xs text-gray-400 mb-1">Avance</p>
                          <div className="w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full rounded-full"
                              style={{
                                width: `${ini.avance}%`,
                                background: ini.avance >= 75
                                  ? 'linear-gradient(90deg, #059669, #34d399)'
                                  : 'linear-gradient(90deg, #6B1A2A, #C4384F)',
                              }} />
                          </div>
                          <p className="text-xs font-bold text-gray-700 mt-0.5">{ini.avance}%</p>
                        </div>
                        <ChevronRight size={16} className="text-gray-300 group-hover:text-red-400 transition-all" />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Modal global crear template */}
      {showCrearTemplate && (
        <ModalCrearTemplate
          onClose={() => setShowCrearTemplate(false)}
          fasesDisponibles={FASES}
        />
      )}
    </div>
  )
}