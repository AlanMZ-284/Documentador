'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft, FileText, CheckCircle2, Clock, Upload,
  Users, ChevronRight, AlertCircle, Download, Eye,
  Check, X, Plus, Layers, GitBranch, UserCheck,
  BarChart2, Lock, TrendingUp, XCircle,
  RefreshCw, Shield, Pen, Archive, Trash2,
  ShieldCheck, DollarSign, ChevronDown, ChevronUp,
  Search, Filter, Star, AlertOctagon, MoreHorizontal
} from 'lucide-react'
import {
  iniciativas, estadoIniciativaConfig, IniciativaEstado,
  FaseProyecto, Iniciativa, EntregableOperativo,
  DocumentVersionStatus
} from '../../../lib/data'

// ─── Constantes y helpers ────────────────────────────────────────
const FASES: FaseProyecto[] = ['Análisis', 'Arquitectura', 'Desarrollo', 'Pruebas', 'Liberación']

// Secciones del flujo secuencial
type SeccionFlujo = 'inicio' | 'estimacion' | 'construccion' | 'cierre'

const SECCIONES: { key: SeccionFlujo; label: string; desc: string }[] = [
  { key: 'inicio',        label: '1. Inicio',               desc: 'RES, marco de trabajo y Carta Preliminar' },
  { key: 'estimacion',    label: '2. Estimación / Actividades', desc: 'CAPA, PSE, SOLA, EUHE' },
  { key: 'construccion',  label: '3. Construcción',         desc: 'Fases, artefactos y métricas en tiempo real' },
  { key: 'cierre',        label: '4. Cierre',               desc: 'CAES o Cancelación de iniciativa' },
]

const docVersionColor: Record<DocumentVersionStatus, { bg: string; color: string; border: string }> = {
  Pendiente:    { bg: 'rgba(217,119,6,0.08)',  color: '#d97706', border: '#fde68a' },
  'En Revisión':{ bg: 'rgba(2,132,199,0.08)', color: '#0284c7', border: '#bae6fd' },
  Aprobado:     { bg: 'rgba(5,150,105,0.08)', color: '#059669', border: '#a7f3d0' },
  Rechazado:    { bg: 'rgba(220,38,38,0.08)', color: '#dc2626', border: '#fecaca' },
  Firmado:      { bg: 'rgba(124,58,237,0.08)',color: '#7c3aed', border: '#ddd6fe' },
}

const raciColor: Record<string, { bg: string; text: string }> = {
  R: { bg: 'rgba(2,132,199,0.08)',    text: '#0284c7' },
  A: { bg: 'rgba(107,26,42,0.08)',    text: '#6B1A2A' },
  C: { bg: 'rgba(217,119,6,0.08)',    text: '#d97706' },
  I: { bg: 'rgba(107,114,128,0.08)', text: '#6b7280' },
}

function StatusPill({ status }: { status: DocumentVersionStatus }) {
  const c = docVersionColor[status]
  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border"
      style={{ color: c.color, background: c.bg, borderColor: c.border }}>
      {status}
    </span>
  )
}

// ─── Stepper de secciones ────────────────────────────────────────
function SeccionStepper({
  seccionActual, seccionesHabilitadas, onSelect
}: {
  seccionActual: SeccionFlujo
  seccionesHabilitadas: SeccionFlujo[]
  onSelect: (s: SeccionFlujo) => void
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4 mb-5 animate-fade-in"
      style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
      <div className="flex items-center gap-0">
        {SECCIONES.map((sec, i) => {
          const habilitada = seccionesHabilitadas.includes(sec.key)
          const activa = sec.key === seccionActual
          const completada = seccionesHabilitadas.includes(sec.key) && SECCIONES.indexOf(SECCIONES.find(s => s.key === seccionActual)!) > i
          return (
            <div key={sec.key} className="flex items-center flex-1">
              <button
                onClick={() => habilitada && onSelect(sec.key)}
                disabled={!habilitada}
                className="flex flex-col items-center gap-1.5 px-3 py-2 rounded-xl transition-all w-full"
                style={{
                  background: activa ? 'rgba(107,26,42,0.06)' : 'transparent',
                  cursor: habilitada ? 'pointer' : 'not-allowed',
                  opacity: habilitada ? 1 : 0.4,
                }}
              >
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0"
                    style={{
                      background: activa ? '#6B1A2A' : completada ? '#059669' : '#e5e7eb',
                      color: activa || completada ? '#fff' : '#9ca3af'
                    }}>
                    {completada ? <Check size={12} /> : i + 1}
                  </div>
                  <span className="text-xs font-semibold whitespace-nowrap"
                    style={{ color: activa ? '#6B1A2A' : completada ? '#059669' : '#6b7280' }}>
                    {sec.label}
                  </span>
                  {!habilitada && <Lock size={11} className="text-gray-300" />}
                </div>
                <span className="text-[10px] text-gray-400 text-center leading-tight hidden lg:block">{sec.desc}</span>
              </button>
              {i < SECCIONES.length - 1 && (
                <div className="flex-shrink-0 w-8 h-px mx-1"
                  style={{ background: completada ? '#059669' : '#e5e7eb' }} />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Componente genérico DocRow ──────────────────────────────────
function DocRow({
  label, sigla, info, locked
}: {
  label: string
  sigla: string
  info?: { version: string; status: DocumentVersionStatus; fecha: string }
  locked: boolean
}) {
  const [uploading, setUploading] = useState(false)
  const [localInfo, setLocalInfo] = useState(info)

  const handleUpload = () => {
    if (locked) return
    setUploading(true)
    setTimeout(() => {
      setLocalInfo({ version: localInfo ? `v${(parseFloat(localInfo.version.slice(1)) + 0.1).toFixed(1)}` : 'v1.0', status: 'En Revisión', fecha: 'Hoy' })
      setUploading(false)
    }, 1200)
  }

  return (
    <div className="flex items-center justify-between py-4 border-b border-gray-50 last:border-0">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: 'rgba(107,26,42,0.08)' }}>
          <FileText size={16} style={{ color: '#6B1A2A' }} />
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-800">{label}</p>
          <p className="text-xs text-gray-400 font-mono">{sigla}</p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        {localInfo ? (
          <>
            <span className="text-xs text-gray-400 font-mono">{localInfo.version}</span>
            <StatusPill status={localInfo.status} />
            <span className="text-xs text-gray-400">{localInfo.fecha}</span>
            {!locked && (
              <button className="p-1.5 rounded-lg hover:bg-gray-100 transition-all" title="Descargar">
                <Download size={14} className="text-gray-400" />
              </button>
            )}
            {!locked && (
              <button className="p-1.5 rounded-lg hover:bg-gray-100 transition-all" title="Visualizar">
                <Eye size={14} className="text-gray-400" />
              </button>
            )}
          </>
        ) : (
          <span className="text-xs text-gray-400 italic">Sin cargar</span>
        )}
        {locked ? (
          <div className="flex items-center gap-1 text-xs text-gray-400">
            <Lock size={12} /> Bloqueado
          </div>
        ) : (
          <button
            onClick={handleUpload}
            disabled={uploading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition-all hover:opacity-90 disabled:opacity-60"
            style={{ background: 'linear-gradient(135deg, #6B1A2A 0%, #8B2339 100%)' }}
          >
            {uploading ? <RefreshCw size={12} className="animate-spin" /> : <Upload size={12} />}
            {uploading ? 'Cargando...' : localInfo ? 'Nueva versión' : 'Cargar'}
          </button>
        )}
      </div>
    </div>
  )
}

// ─── Artefacto Row en Construcción ───────────────────────────────
function ArtefactoRow({ ent, locked }: { ent: EntregableOperativo; locked: boolean }) {
  const [status, setStatus] = useState<DocumentVersionStatus>(ent.status)
  const [uploading, setUploading] = useState(false)
  const [showComment, setShowComment] = useState(false)
  const [comment, setComment] = useState('')

  const handleUpload = () => {
    if (locked) return
    setUploading(true)
    setTimeout(() => { setStatus('En Revisión'); setUploading(false) }, 1000)
  }
  const handleApprove = () => setStatus('Aprobado')
  const handleSign = () => setStatus('Firmado')
  const handleReject = () => setShowComment(true)
  const submitRejection = () => { setStatus('Rechazado'); setShowComment(false); setComment('') }

  return (
    <div className="py-4 border-b border-gray-50 last:border-0">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: 'rgba(107,26,42,0.06)' }}>
            <FileText size={14} style={{ color: '#6B1A2A' }} />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-800">{ent.nombre}</p>
            <p className="text-xs text-gray-400">Compromiso: {ent.fechaCompromiso} · {ent.version}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <StatusPill status={status} />
          {/* Cargar */}
          {!locked && status === 'Pendiente' && (
            <button onClick={handleUpload} disabled={uploading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition-all hover:opacity-90"
              style={{ background: 'linear-gradient(135deg, #6B1A2A 0%, #8B2339 100%)' }}>
              {uploading ? <RefreshCw size={11} className="animate-spin" /> : <Upload size={11} />}
              Cargar
            </button>
          )}
          {/* Visualizar / Descargar siempre visibles si hay doc */}
          {status !== 'Pendiente' && (
            <>
              <button className="p-1.5 rounded-lg hover:bg-gray-100 transition-all" title="Visualizar">
                <Eye size={13} className="text-gray-400" />
              </button>
              <button className="p-1.5 rounded-lg hover:bg-gray-100 transition-all" title="Descargar">
                <Download size={13} className="text-gray-400" />
              </button>
            </>
          )}
          {/* Aprobar / Rechazar */}
          {!locked && status === 'En Revisión' && (
            <>
              <button onClick={handleApprove}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 transition-all">
                <Check size={11} /> Aprobar
              </button>
              <button onClick={handleReject}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-red-600 hover:bg-red-700 transition-all">
                <X size={11} /> Rechazar
              </button>
            </>
          )}
          {/* Firmar */}
          {!locked && status === 'Aprobado' && (
            <button onClick={handleSign}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition-all hover:opacity-90"
              style={{ background: '#7c3aed' }}>
              <Pen size={11} /> Firmar
            </button>
          )}
          {/* Eliminar (solo si Pendiente y no locked) */}
          {!locked && status === 'Pendiente' && (
            <button className="p-1.5 rounded-lg hover:bg-red-50 transition-all" title="Eliminar">
              <Trash2 size={13} className="text-gray-300 hover:text-red-500" />
            </button>
          )}
        </div>
      </div>
      {showComment && (
        <div className="mt-3 ml-11 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-xs font-semibold text-red-700 mb-2">Motivo del rechazo</p>
          <textarea
            className="w-full text-xs border border-red-200 rounded-lg p-2 resize-none outline-none focus:border-red-400 bg-white"
            rows={2}
            placeholder="Describe el motivo del rechazo..."
            value={comment}
            onChange={e => setComment(e.target.value)}
          />
          <div className="flex gap-2 mt-2">
            <button onClick={submitRejection}
              className="px-3 py-1.5 text-xs font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700">
              Confirmar rechazo
            </button>
            <button onClick={() => setShowComment(false)}
              className="px-3 py-1.5 text-xs text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-50">
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Componente principal ────────────────────────────────────────
export default function IniciativaDetail({ id }: { id: string }) {
  const router = useRouter()

  // Estado de la iniciativa
  const [iniciativa, setIniciativa] = useState<Iniciativa>(
    () => iniciativas.find(i => i.id === id) ?? iniciativas[0]
  )
  const [showEstadoMenu, setShowEstadoMenu] = useState(false)

  // ── Flujo secuencial ──────────────────────────────────────────
  const [seccionActual, setSeccionActual] = useState<SeccionFlujo>('inicio')

  // Estados de completado para habilitar avance
  const [resCompletado, setResCompletado]                 = useState(false)
  const [marcoTrabajo, setMarcoTrabajo]                   = useState<'Ágil' | 'Cascada' | null>(null)
  const [marcoPendiente, setMarcoPendiente]               = useState(false) // true = "Elegir más tarde"; documentos usan Cascada por defecto
  const marcoEfectivo: 'Ágil' | 'Cascada' = marcoPendiente ? 'Cascada' : (marcoTrabajo ?? 'Cascada')
  const [cartaPreliminarDecidida, setCartaPreliminarDecidida] = useState(false) // completada u omitida
  const [mostrarCartaPreliminar, setMostrarCartaPreliminar]   = useState(false)
  const [cartaPreliminarRellena, setCartaPreliminarRellena]   = useState(false)

  // La sección de Inicio se considera completa cuando:
  // RES completado + marco elegido + decisión tomada sobre Carta Preliminar
  const inicioCompleto = resCompletado && (marcoTrabajo !== null || marcoPendiente) && cartaPreliminarDecidida

  // La sección de Estimación se considera completa cuando al menos un doc ha sido iniciado
  const [estimacionIniciada, setEstimacionIniciada]       = useState(false)
  const estimacionCompleta = estimacionIniciada

  const seccionesHabilitadas: SeccionFlujo[] = ['inicio',
    ...(inicioCompleto                                    ? ['estimacion' as SeccionFlujo] : []),
    ...(inicioCompleto && estimacionCompleta              ? ['construccion' as SeccionFlujo] : []),
    ...(inicioCompleto && estimacionCompleta              ? ['cierre' as SeccionFlujo] : []),
  ]

  // ── RES – datos adicionales del documento real ─────────────────
  const [resData, setResData] = useState({
    servicioNegocio: '', aplicativo: '', justificacion: '', objetivoEsperado: '',
    esRecurrente: 'No', periodicidad: '',
    afectacionLegal: '', afectacionEconomica: '', afectacionPercepcion: '',
    requiereServiciosInformacion: 'No', detalleServiciosInformacion: '',
  })
  const [esLegado, setEsLegado] = useState(false)
  const [resLegado, setResLegado] = useState({ justificacion: '', prioridad: 'Media' })
  // Fechas críticas: 4 tipos FIJOS según el documento real (no se agregan/quitan filas)
  const [fechasCriticas, setFechasCriticas] = useState([
    { tipo: 'Deseada por el solicitante', fecha: '', sustento: '' },
    { tipo: 'Operativa (que detenga algún proceso o la operación correcta a partir de esa fecha)', fecha: '', sustento: '' },
    { tipo: 'Legislación Tributaria o Fiscal (ajuste en el Marco Tributario o Fiscal)', fecha: '', sustento: '' },
    { tipo: 'Normatividad en General (no relacionada con el Marco Tributario o Fiscal)', fecha: '', sustento: '' },
  ])
  const [necesidadesNegocio, setNecesidadesNegocio] = useState([
    { id: 'RN01', funcionalidad: '', descripcion: '', mejora: false, nueva: false },
  ])
  const [dependenciasRes, setDependenciasRes] = useState([
    { tipo: 'Negocio', detalle: '', relacionRN: '' },
  ])
  const [impactosRes, setImpactosRes] = useState([
    { area: '', descripcion: '' },
  ])
  const [volumetriaRes, setVolumetriaRes] = useState([
    { tipoUsuario: 'Contribuyentes', medioAcceso: '', numUsuarios: '', accesosConcurrentes: '', picosOperacion: '' },
    { tipoUsuario: 'Empleados SAT', medioAcceso: '', numUsuarios: '', accesosConcurrentes: '', picosOperacion: '' },
    { tipoUsuario: 'Externos relacionados al SAT', medioAcceso: '', numUsuarios: '', accesosConcurrentes: '', picosOperacion: '' },
    { tipoUsuario: 'Otros (detallar)', medioAcceso: '', numUsuarios: '', accesosConcurrentes: '', picosOperacion: '' },
  ])
  const [totalTransaccionesRes, setTotalTransaccionesRes] = useState({ total: '', periodicidad: '' })
  const [anexosRes, setAnexosRes] = useState([
    { nombre: '', desc: '', version: '' },
  ])
  // Autorización del RES: 3 bloques reales del documento (6 firmantes en total)
  const [firmantesAutorizacionRES1, setFirmantesAutorizacionRES1] = useState([
    { id: 1, nombre: '', puesto: '', estado: 'Pendiente', fecha: '—', hash: '—', rol: 'Nombre del Subadministrador' },
    { id: 2, nombre: '', puesto: '', estado: 'Pendiente', fecha: '—', hash: '—', rol: 'Nombre del Administrador' },
  ])
  const [firmantesAutorizacionRES2, setFirmantesAutorizacionRES2] = useState([
    { id: 3, nombre: '', puesto: '', estado: 'Pendiente', fecha: '—', hash: '—', rol: 'Nombre del Administrador' },
    { id: 4, nombre: '', puesto: '', estado: 'Pendiente', fecha: '—', hash: '—', rol: 'Nombre del Administrador Central' },
  ])
  const [firmantesAutorizacionRES3, setFirmantesAutorizacionRES3] = useState([
    { id: 5, nombre: '', puesto: '', estado: 'Pendiente', fecha: '—', hash: '—', rol: 'Analista — Responsable de realizar el análisis y definir un alcance en conjunto con el solicitante' },
    { id: 6, nombre: '', puesto: '', estado: 'Pendiente', fecha: '—', hash: '—', rol: 'Nombre del Administrador de Soluciones de Negocio' },
    { id: 7, nombre: '', puesto: '', estado: 'Pendiente', fecha: '—', hash: '—', rol: 'Nombre del Subadministrador de Soluciones de Negocio' },
  ])
  const ejecutarFirmaAutorizacionRES = (
    bloque: 1 | 2 | 3,
    id: number
  ) => {
    const ts   = new Date().toLocaleString()
    const hash = 'SHA256-' + Math.random().toString(16).substring(2, 10) + 'r3s...'
    const updater = (prev: typeof firmantesAutorizacionRES1) =>
      prev.map(f => f.id === id ? { ...f, estado: 'Firmado', fecha: ts, hash } : f)
    if (bloque === 1) setFirmantesAutorizacionRES1(updater)
    if (bloque === 2) setFirmantesAutorizacionRES2(updater)
    if (bloque === 3) setFirmantesAutorizacionRES3(updater)
  }

  // ── RES – gestión de firmantes ────────────────────────────────
  const [firmantesRES, setFirmantesRES] = useState([
    { id: '1', nombre: 'Víctor Altamirano', email: 'v.altamirano@company.com', rol: 'Director', tipo: 'Firmante' },
    { id: '2', nombre: 'Ana López',         email: 'a.lopez@company.com',      rol: 'Gerente',  tipo: 'Revisor'  },
  ])
  const [nuevoFirmanteRES, setNuevoFirmanteRES] = useState({ nombre: '', email: '', rol: '', tipo: 'Firmante' })

  const agregarFirmanteRES = () => {
    if (!nuevoFirmanteRES.nombre.trim() || !nuevoFirmanteRES.email.trim()) return
    setFirmantesRES([...firmantesRES, { id: Date.now().toString(), ...nuevoFirmanteRES }])
    setNuevoFirmanteRES({ nombre: '', email: '', rol: '', tipo: 'Firmante' })
  }
  const eliminarFirmanteRES = (id: string) => setFirmantesRES(firmantesRES.filter(f => f.id !== id))

  // ── Construcción ──────────────────────────────────────────────
  const [fase, setFase] = useState<FaseProyecto>('Análisis')
  const [busquedaIniciativa, setBusquedaIniciativa]     = useState('')
  const [filtroCategoria, setFiltroCategoria]           = useState('Todos')

  const avancePorFase = (f: FaseProyecto) => {
    const acts = iniciativa.actividades.filter(a => a.fase === f)
    if (!acts.length) return 0
    return Math.round((acts.filter(a => a.entregableStatus === 'Firmado').length / acts.length) * 100)
  }
  const entregablesDeFase = (f: FaseProyecto) => iniciativa.entregables.filter(e => e.fase === f)
  const faseCerrada       = (f: FaseProyecto) => iniciativa.fasesCerradas.includes(f)
  const canCloseFase      = (f: FaseProyecto) => {
    const ents = entregablesDeFase(f)
    return ents.length > 0 && ents.every(e => e.status === 'Firmado')
  }
  const cerrarFase = (f: FaseProyecto) => {
    setIniciativa(prev => ({
      ...prev,
      fasesCerradas: [...prev.fasesCerradas, f],
      faseActual: FASES[FASES.indexOf(f) + 1] as FaseProyecto | undefined,
    }))
  }

  const totalActs  = iniciativa.actividades.length
  const firmadas   = iniciativa.actividades.filter(a => a.entregableStatus === 'Firmado').length
  const avanceReal = totalActs > 0 ? Math.round((firmadas / totalActs) * 100) : iniciativa.avanceTotal

  // Artefactos por marco de trabajo (mock — se vincularía con CAPA real)
  const artefactosPorFase: Record<FaseProyecto, string[]> = marcoEfectivo === 'Ágil'
    ? {
        Análisis:     ['Backlog de Producto', 'Historias de Usuario', 'Criterios de Aceptación'],
        Arquitectura: ['Arquitectura de Solución', 'Diagrama de Componentes'],
        Desarrollo:   ['Sprint Backlog', 'Código Fuente', 'Pruebas Unitarias'],
        Pruebas:      ['Plan de Pruebas de Aceptación', 'Reporte de Bugs'],
        Liberación:   ['Release Notes', 'Manual de Despliegue', 'Retrospectiva'],
      }
    : {
        Análisis:     ['Especificación de Requerimientos', 'Análisis de Impacto', 'Matriz de Trazabilidad'],
        Arquitectura: ['Documento de Arquitectura', 'Modelo de Datos', 'Diagrama de Secuencia'],
        Desarrollo:   ['Módulos Desarrollados', 'Documentación Técnica'],
        Pruebas:      ['Plan de Pruebas', 'Casos de Prueba', 'Reporte de Calidad'],
        Liberación:   ['Manual de Usuario', 'Acta de Liberación', 'Plan de Contingencia'],
      }

  // ── Cierre ────────────────────────────────────────────────────
  const [modoCierre, setModoCierre]       = useState<'ninguno' | 'caes' | 'cancelacion'>('ninguno')

  // CAES
  const inpStyle = 'w-full px-3 py-2 text-xs border border-gray-200 rounded-lg outline-none focus:border-red-900 bg-white transition-all'
  const thStyle  = 'px-3 py-2 text-xs font-semibold text-gray-500 bg-gray-50 border-b border-gray-100 text-left uppercase tracking-wider'
  const tdStyle  = 'px-2 py-2 border-b border-gray-50 text-xs'

  // ── CAES (Cascada) ──────────────────────────────────────────
  const [caesData, setCaesData] = useState({
    idRequerimiento: 'REQ-2026-0048', idEstimacion: 'EST-992', iteracionRelacionada: '1',
    nombreRequerimiento: '', proyecto: '', dueñoFase: '', fechaInicio: '2026-05-15', fechaFin: '2026-06-12',
  })
  const [productos, setProductos]           = useState([{ nombre: 'Módulo de Autenticación', desc: 'Componente de login JWT', formato: 'Next.js / TS', ruta: '/src/app/auth' }])
  const [reqRows, setReqRows]               = useState([
    { req: 'RF-01 Autenticación Multifactor', pond: '30', cump: 'Si', punt: '30', obs: 'Cumple al 100%', puntManual: false },
    { req: 'RF-02 Recuperación de Contraseña', pond: '20', cump: 'Si', punt: '20', obs: 'Validado con token', puntManual: false },
  ])
  const calcularPuntuacion = (pond: string, cump: string) => cump === 'Si' ? ((parseFloat(pond) || 0) * 5 / 100).toFixed(2) : '0'
  const [ccRows, setCcRows]                 = useState([
    { cc: 'CC-01', est: 'EST-992', fecha: '2026-06-10', horas: '16', unidades: '2' },
  ])
  // Iteración / Unidades Totales / Estado / CAES relacionada
  const [iteracionesCAES, setIteracionesCAES] = useState([
    { iter: 'Iteración 1', unidadesTotales: '', estado: 'Esfuerzo pendiente de cobro', caesRelacionada: '' },
  ])
  // Detalle Iteración: Fase / Tipo de Perfil / Cantidad / Horas / Unidades / Tipo de Unidad
  const [detalleIteracionCAES, setDetalleIteracionCAES] = useState([
    { fase: 'Diseño/Desarrollo', perfil: 'Analista', cantidad: '3', horas: '200', unidades: '723.61', tipoUnidad: 'UDA' },
  ])
  // Anexo 1: Descripción de Productos
  const [anexo1CAES, setAnexo1CAES] = useState([
    { nombre: '', fechaCompromiso: '', fechaEntrega: '', numRevisiones: '0', observaciones: '' },
  ])
  const totalHorasCC                          = ccRows.reduce((s, r) => s + (parseFloat(r.horas) || 0), 0)
  const [firmantesCierre, setFirmantesCierre] = useState([
    { id: 1, rol: 'Firma 1', placeholderPuesto: 'Persona responsable (SAT) de la aceptación del Requerimiento de Servicio', nombre: '', puesto: '', estado: 'Pendiente', fecha: '', hash: '—' },
    { id: 2, rol: 'Firma 2', placeholderPuesto: 'Persona responsable (SAT) de la aceptación del Requerimiento de Servicio', nombre: '', puesto: '', estado: 'Pendiente', fecha: '', hash: '—' },
    { id: 3, rol: 'Firma 3', placeholderPuesto: 'Ejemplo: Líder de tecnología', nombre: '', puesto: '', estado: 'Pendiente', fecha: '', hash: '—' },
    { id: 4, rol: 'Firma 4', placeholderPuesto: 'Ejemplo: Líder de proyecto (RAPE)', nombre: '', puesto: '', estado: 'Pendiente', fecha: '', hash: '—' },
  ])
  const actualizarFirmanteCierre = (id: number, campo: 'nombre' | 'puesto', valor: string) => {
    setFirmantesCierre(prev => prev.map(f => f.id === id ? { ...f, [campo]: valor } : f))
  }
  const ejecutarFirmaCierre = (id: number) => {
    const ts   = new Date().toLocaleString()
    const hash = 'SHA256-' + Math.random().toString(16).substring(2, 10) + 'e9a...'
    setFirmantesCierre(prev => prev.map(f => f.id === id ? { ...f, estado: 'Firmado', fecha: ts, hash } : f))
  }

  // ── CAES (Ágil) ──────────────────────────────────────────────
  const [caesAgilData, setCaesAgilData] = useState({
    idRequerimiento: 'REQ-2026-0048', idEstimacion: 'EST-992',
    nombreRequerimiento: '', proyecto: '', dueñoFase: '', fechaInicio: '', fechaFin: '',
  })
  const [productosCAESAgil, setProductosCAESAgil] = useState([
    { sprint: 'Sprint 1', nombre: '', desc: '', formato: '', fecha: '' },
  ])
  const [reqRowsCAESAgil, setReqRowsCAESAgil] = useState([
    { req: '', pond: '0', cump: 'Si', punt: '0', obs: '', puntManual: false },
  ])
  const [esFabricaInternaCAESAgil, setEsFabricaInternaCAESAgil] = useState<'Sí' | 'No' | ''>('')
  const [costoCAESAgil, setCostoCAESAgil] = useState([
    { sprint: 'Sprint 1', fase: 'Diseño/Desarrollo', perfil: 'Analista', cantidad: '3', horas: '200', unidades: '723.61', tipoUnidad: 'UDA' },
  ])
  const [totalesPorUnidadCAESAgil, setTotalesPorUnidadCAESAgil] = useState([
    { tipoUnidad: 'UDA', totalUnidades: '' },
  ])
  const [firmantesCierreAgil, setFirmantesCierreAgil] = useState([
    { id: 1, rol: 'Firma 1', placeholderPuesto: 'Persona responsable (SAT) de la aceptación del Requerimiento de Servicio', nombre: '', puesto: '', estado: 'Pendiente', fecha: '', hash: '—' },
    { id: 2, rol: 'Firma 2', placeholderPuesto: 'Persona responsable (SAT) de la aceptación del Requerimiento de Servicio', nombre: '', puesto: '', estado: 'Pendiente', fecha: '', hash: '—' },
    { id: 3, rol: 'Firma 3', placeholderPuesto: 'Ejemplo: Líder de tecnología', nombre: '', puesto: '', estado: 'Pendiente', fecha: '', hash: '—' },
    { id: 4, rol: 'Firma 4', placeholderPuesto: 'Ejemplo: Líder de proyecto (RAPE)', nombre: '', puesto: '', estado: 'Pendiente', fecha: '', hash: '—' },
  ])
  const actualizarFirmanteCierreAgil = (id: number, campo: 'nombre' | 'puesto', valor: string) => {
    setFirmantesCierreAgil(prev => prev.map(f => f.id === id ? { ...f, [campo]: valor } : f))
  }
  const ejecutarFirmaCierreAgil = (id: number) => {
    const ts   = new Date().toLocaleString()
    const hash = 'SHA256-' + Math.random().toString(16).substring(2, 10) + 'agc...'
    setFirmantesCierreAgil(prev => prev.map(f => f.id === id ? { ...f, estado: 'Firmado', fecha: ts, hash } : f))
  }

  // ── CAPA (Cascada) ──────────────────────────────────────────
  const [capaProductos, setCapaProductos] = useState([
    { nombre: 'Módulo de Autenticación', desc: 'Componente de login JWT y validación de sesión', formato: 'Electrónico-SharePoint', fecha: '2026-04-30' },
  ])
  const [capaRequisitos, setCapaRequisitos] = useState([
    { nombre: 'RF-01 Autenticación Multifactor', pond: '60', obs: 'Acordado con el cliente' },
    { nombre: 'RF-02 Recuperación de Contraseña', pond: '40', obs: '' },
  ])
  const [capaCostos, setCapaCostos] = useState([
    { perfil: 'Analista', cantidad: '3', esfuerzo: '241.20', subtotal: '723.61', factor: '1', unidad: 'UDA', subtotalUnidades: '723.61' },
    { perfil: 'Líder de Proyecto', cantidad: '1', esfuerzo: '93.61', subtotal: '93.61', factor: '1', unidad: 'UDA', subtotalUnidades: '93.61' },
  ])
  const [firmantesCapa, setFirmantesCapa] = useState([
    { id: 1, rol: 'Firma 1', nombre: '', puesto: '', estado: 'Pendiente', fecha: '', hash: '—' },
    { id: 2, rol: 'Firma 2', nombre: '', puesto: '', estado: 'Pendiente', fecha: '', hash: '—' },
    { id: 3, rol: 'Firma 3', nombre: '', puesto: '', estado: 'Pendiente', fecha: '', hash: '—' },
    { id: 4, rol: 'Firma 4', nombre: '', puesto: '', estado: 'Pendiente', fecha: '', hash: '—' },
  ])
  const actualizarFirmanteCapa = (id: number, campo: 'nombre' | 'puesto', valor: string) => {
    setFirmantesCapa(prev => prev.map(f => f.id === id ? { ...f, [campo]: valor } : f))
  }
  const ejecutarFirmaCapa = (id: number) => {
    const ts   = new Date().toLocaleString()
    const hash = 'SHA256-' + Math.random().toString(16).substring(2, 10) + 'b1c...'
    setFirmantesCapa(prev => prev.map(f => f.id === id ? { ...f, estado: 'Firmado', fecha: ts, hash } : f))
  }
  // Tabla de control: Iteración / Unidades totales / CAPA relacionada / Estado
  const [capaIteraciones, setCapaIteraciones] = useState([
    { iteracion: 'Iteración 1', unidadesTotales: '', capaRelacionada: '', estado: 'Esfuerzo pendiente de cobro' },
  ])

  // ── PSE (Cascada) ───────────────────────────────────────────
  const [pseEntregablesAltoNivel, setPseEntregablesAltoNivel] = useState([
    { nombre: 'Documento de Análisis', desc: 'Análisis de impacto y requerimientos', formato: 'Electrónico-SharePoint', fechaEntrega: '2026-04-15' },
  ])
  const [pseEntregablesSegundaEst, setPseEntregablesSegundaEst] = useState([
    { nombre: 'Módulo de Autenticación', desc: 'Componente de login JWT y validación de sesión', formato: 'Electrónico-SharePoint', criterios: 'Pruebas unitarias al 100% y aprobación de QA' },
  ])
  const [pseCostosAltoNivel, setPseCostosAltoNivel] = useState([
    { perfil: 'Analista', cantidad: '3', esfuerzo: '241.20', subtotal: '723.61', factor: '1', unidad: 'UDA', subtotalUnidades: '723.61' },
    { perfil: 'Líder de Proyecto', cantidad: '1', esfuerzo: '93.61', subtotal: '93.61', factor: '1', unidad: 'UDA', subtotalUnidades: '93.61' },
  ])
  const [pseCostosSegundaEst, setPseCostosSegundaEst] = useState([
    { perfil: 'Desarrollador', cantidad: '3', esfuerzo: '241.20', subtotal: '723.61', factor: '1', unidad: 'UDA', subtotalUnidades: '723.61' },
  ])
  const [esFabricaInternaPse, setEsFabricaInternaPse] = useState<'Sí' | 'No' | ''>('')
  const [pseTotalesPorUnidad, setPseTotalesPorUnidad] = useState([
    { tipoUnidad: 'UDA', totalUnidades: '' },
  ])
  const [firmantesPse, setFirmantesPse] = useState([
    { id: 1, rol: 'Firma 1', nombre: '', puesto: '', estado: 'Pendiente', fecha: '', hash: '—' },
    { id: 2, rol: 'Firma 2', nombre: '', puesto: '', estado: 'Pendiente', fecha: '', hash: '—' },
    { id: 3, rol: 'Firma 3', nombre: '', puesto: '', estado: 'Pendiente', fecha: '', hash: '—' },
    { id: 4, rol: 'Firma 4', nombre: '', puesto: '', estado: 'Pendiente', fecha: '', hash: '—' },
  ])
  const actualizarFirmantePse = (id: number, campo: 'nombre' | 'puesto', valor: string) => {
    setFirmantesPse(prev => prev.map(f => f.id === id ? { ...f, [campo]: valor } : f))
  }
  const ejecutarFirmaPse = (id: number) => {
    const ts   = new Date().toLocaleString()
    const hash = 'SHA256-' + Math.random().toString(16).substring(2, 10) + 'd4e...'
    setFirmantesPse(prev => prev.map(f => f.id === id ? { ...f, estado: 'Firmado', fecha: ts, hash } : f))
  }


  // ── Carta Preliminar / CPRE (Cascada) ───────────────────────
  const [cpreData, setCpreData] = useState({
    responsable: '', fechaElaboracion: '', nombreProyecto: '', descripcion: '',
    motivo: 'Cambios emergentes a la legislación fiscal', fechaInicio: '', fechaCompromisoLiberacion: '',
    fechaEstimadaCapa: '',
  })
  const [cpreEntregables, setCpreEntregables] = useState([
    { nombre: 'Entregable A', desc: 'Por definir según alcance acordado con RAPE' },
  ])
  const [cpreCostos, setCpreCostos] = useState([
    { perfil: 'Analista', cantidad: '3', esfuerzo: '241.20', factor: '1', subtotalUnidades: '723.61' },
    { perfil: 'Desarrollador', cantidad: '1', esfuerzo: '93.61', factor: '1', subtotalUnidades: '93.61' },
  ])
  const [firmantesCpre, setFirmantesCpre] = useState([
    { id: 1, rol: 'Firma 1 — Autorizó', placeholderPuesto: 'Administrador Central ACDMA', nombre: '', puesto: '', estado: 'Pendiente', fecha: '', hash: '—' },
    { id: 2, rol: 'Firma 2 — Autorizó', placeholderPuesto: 'Administrador de Área ACDMA que aprueba el inicio del trabajo', nombre: '', puesto: '', estado: 'Pendiente', fecha: '', hash: '—' },
    { id: 3, rol: 'Firma 3 — Autorizó', placeholderPuesto: 'Administrador del Contrato SDMA6', nombre: '', puesto: '', estado: 'Pendiente', fecha: '', hash: '—' },
    { id: 4, rol: 'Firma 4 — Revisó', placeholderPuesto: 'Director de Proyecto Proveedor Externo', nombre: '', puesto: '', estado: 'Pendiente', fecha: '', hash: '—' },
    { id: 5, rol: 'Firma 5 — Revisó', placeholderPuesto: 'Líder de Proyecto de Soluciones de Negocio', nombre: '', puesto: '', estado: 'Pendiente', fecha: '', hash: '—' },
    { id: 6, rol: 'Firma 6 — Revisó', placeholderPuesto: 'RAPE', nombre: '', puesto: '', estado: 'Pendiente', fecha: '', hash: '—' },
    { id: 7, rol: 'Firma 7 — Elaboró', placeholderPuesto: 'Líder de Proyecto del Proveedor Externo', nombre: '', puesto: '', estado: 'Pendiente', fecha: '', hash: '—' },
  ])
  const actualizarFirmanteCpre = (id: number, campo: 'nombre' | 'puesto', valor: string) => {
    setFirmantesCpre(prev => prev.map(f => f.id === id ? { ...f, [campo]: valor } : f))
  }
  const ejecutarFirmaCpre = (id: number) => {
    const ts   = new Date().toLocaleString()
    const hash = 'SHA256-' + Math.random().toString(16).substring(2, 10) + 'a7f...'
    setFirmantesCpre(prev => prev.map(f => f.id === id ? { ...f, estado: 'Firmado', fecha: ts, hash } : f))
  }

  // ── CAPA (Ágil) ──────────────────────────────────────────────
  const [capaAgilProductos, setCapaAgilProductos] = useState([
    { sprint: 'Sprint 1', nombre: '', desc: '', formato: '', fecha: '' },
  ])
  const [capaAgilRequisitos, setCapaAgilRequisitos] = useState([
    { nombre: 'RF-01 Autenticación Multifactor', pond: '60', obs: '' },
    { nombre: 'RF-02 Recuperación de Contraseña', pond: '40', obs: '' },
  ])
  const [capaAgilSprints, setCapaAgilSprints] = useState([
    { sprint: 'S1', semanas: ['', '', '', '', '', ''] },
    { sprint: 'S2', semanas: ['', '', '', '', '', ''] },
  ])
  const [capaAgilActividades, setCapaAgilActividades] = useState([
    { sprint: 'Sprint 1', actividad: '', desc: '', fecha: '' },
  ])
  const [capaAgilCostos, setCapaAgilCostos] = useState([
    { sprint: 'Sprint 1', perfil: 'Analista', cantidad: '3', esfuerzo: '241.20', subtotal: '723.61', factor: '1', unidad: 'UDA', subtotalUnidades: '723.61' },
  ])
  const [esFabricaInternaCapaAgil, setEsFabricaInternaCapaAgil] = useState<'Sí' | 'No' | ''>('')
  const [capaAgilTotalesPorUnidad, setCapaAgilTotalesPorUnidad] = useState([
    { tipoUnidad: 'UDA', totalUnidades: '' },
  ])
  const [firmantesCapaAgil, setFirmantesCapaAgil] = useState([
    { id: 1, rol: 'Firma 1', nombre: '', puesto: '', estado: 'Pendiente', fecha: '', hash: '—' },
    { id: 2, rol: 'Firma 2', nombre: '', puesto: '', estado: 'Pendiente', fecha: '', hash: '—' },
    { id: 3, rol: 'Firma 3', nombre: '', puesto: '', estado: 'Pendiente', fecha: '', hash: '—' },
    { id: 4, rol: 'Firma 4', nombre: '', puesto: '', estado: 'Pendiente', fecha: '', hash: '—' },
  ])
  const actualizarFirmanteCapaAgil = (id: number, campo: 'nombre' | 'puesto', valor: string) => {
    setFirmantesCapaAgil(prev => prev.map(f => f.id === id ? { ...f, [campo]: valor } : f))
  }
  const ejecutarFirmaCapaAgil = (id: number) => {
    const ts   = new Date().toLocaleString()
    const hash = 'SHA256-' + Math.random().toString(16).substring(2, 10) + 'cap...'
    setFirmantesCapaAgil(prev => prev.map(f => f.id === id ? { ...f, estado: 'Firmado', fecha: ts, hash } : f))
  }

  // ── PSE (Ágil) ───────────────────────────────────────────────
  const [pseAgilSprints, setPseAgilSprints] = useState([
    { sprint: 'S1', semanas: ['', '', '', '', '', ''] },
    { sprint: 'S2', semanas: ['', '', '', '', '', ''] },
  ])
  const [pseAgilActividades, setPseAgilActividades] = useState([
    { sprint: 'Sprint 1', actividad: '', desc: '', fecha: '' },
  ])
  const [pseAgilEntregables, setPseAgilEntregables] = useState([
    { sprint: 'Sprint 1', nombre: '', desc: '', formato: '', criterios: '' },
  ])
  const [pseAgilCostos, setPseAgilCostos] = useState([
    { sprint: 'Sprint 1', perfil: 'Analista', cantidad: '3', esfuerzo: '241.20', subtotal: '723.61', factor: '1', unidad: 'UDA', subtotalUnidades: '723.61' },
  ])
  const [esFabricaInternaPseAgil, setEsFabricaInternaPseAgil] = useState<'Sí' | 'No' | ''>('')
  const [pseAgilTotalesPorUnidad, setPseAgilTotalesPorUnidad] = useState([
    { tipoUnidad: 'UDA', totalUnidades: '' },
  ])
  const [firmantesPseAgil, setFirmantesPseAgil] = useState([
    { id: 1, rol: 'Firma 1', nombre: '', puesto: '', estado: 'Pendiente', fecha: '', hash: '—' },
    { id: 2, rol: 'Firma 2', nombre: '', puesto: '', estado: 'Pendiente', fecha: '', hash: '—' },
    { id: 3, rol: 'Firma 3', nombre: '', puesto: '', estado: 'Pendiente', fecha: '', hash: '—' },
    { id: 4, rol: 'Firma 4', nombre: '', puesto: '', estado: 'Pendiente', fecha: '', hash: '—' },
  ])
  const actualizarFirmantePseAgil = (id: number, campo: 'nombre' | 'puesto', valor: string) => {
    setFirmantesPseAgil(prev => prev.map(f => f.id === id ? { ...f, [campo]: valor } : f))
  }
  const ejecutarFirmaPseAgil = (id: number) => {
    const ts   = new Date().toLocaleString()
    const hash = 'SHA256-' + Math.random().toString(16).substring(2, 10) + 'pse...'
    setFirmantesPseAgil(prev => prev.map(f => f.id === id ? { ...f, estado: 'Firmado', fecha: ts, hash } : f))
  }

  // ── Carta Preliminar / CPRE (Ágil) ──────────────────────────
  const [cpreAgilData, setCpreAgilData] = useState({
    nombreProyecto: '', descripcion: '', motivo: '',
    fechaInicioSprint: '', fechaFinSprint: '', backlogPriorizado: '', historiasUsuario: '',
  })
  const [cpreAgilSprints, setCpreAgilSprints] = useState([
    { sprint: 'S1', semanas: ['', '', '', '', '', ''] },
    { sprint: 'S2', semanas: ['', '', '', '', '', ''] },
  ])
  const [cpreAgilActividades, setCpreAgilActividades] = useState([
    { actividad: '', desc: '', fecha: '' },
  ])
  const [cpreAgilCostos, setCpreAgilCostos] = useState([
    { perfil: 'Analista', cantidad: '3', esfuerzo: '241.20', factor: '1', subtotalUnidades: '723.61' },
  ])
  const [cpreAgilEntregables, setCpreAgilEntregables] = useState([
    { nombre: '', desc: '', formato: '', responsableAprobacion: '' },
  ])
  const [firmantesCpreAgil, setFirmantesCpreAgil] = useState([
    { id: 1, rol: 'Firma 1', placeholderPuesto: 'Administrador Central ACDMA', nombre: '', puesto: '', estado: 'Pendiente', fecha: '', hash: '—' },
    { id: 2, rol: 'Firma 2', placeholderPuesto: 'Administrador de Área ACDMA que está aprobando el inicio del trabajo / Director del Proyecto SDMA', nombre: '', puesto: '', estado: 'Pendiente', fecha: '', hash: '—' },
    { id: 3, rol: 'Firma 3', placeholderPuesto: 'Administrador del Contrato SDMA / Administrador Central de ACSN', nombre: '', puesto: '', estado: 'Pendiente', fecha: '', hash: '—' },
    { id: 4, rol: 'Firma 4', placeholderPuesto: 'Director de Proyecto CDS / Director de Operaciones del Consorcio', nombre: '', puesto: '', estado: 'Pendiente', fecha: '', hash: '—' },
    { id: 5, rol: 'Firma 5', placeholderPuesto: 'Administradora del Contrato SDMA', nombre: '', puesto: '', estado: 'Pendiente', fecha: '', hash: '—' },
    { id: 6, rol: 'Firma 6', placeholderPuesto: 'Contract Manager del Consorcio', nombre: '', puesto: '', estado: 'Pendiente', fecha: '', hash: '—' },
    { id: 7, rol: 'Firma 7', placeholderPuesto: 'Líder de Proyecto de Soluciones de Negocio — Administrador de Proyectos Específicos', nombre: '', puesto: '', estado: 'Pendiente', fecha: '', hash: '—' },
    { id: 8, rol: 'Firma 8', placeholderPuesto: 'RAPE — Líder de APE (Proveedor)', nombre: '', puesto: '', estado: 'Pendiente', fecha: '', hash: '—' },
    { id: 9, rol: 'Firma 9', placeholderPuesto: 'Líder de Proyecto de Soluciones de Negocio — Responsable de la Administración de Proyectos Específicos', nombre: '', puesto: '', estado: 'Pendiente', fecha: '', hash: '—' },
    { id: 10, rol: 'Firma 10', placeholderPuesto: 'RAPE — Líder Técnico', nombre: '', puesto: '', estado: 'Pendiente', fecha: '', hash: '—' },
    { id: 11, rol: 'Firma 11', placeholderPuesto: 'Administrador de Soluciones de Negocio', nombre: '', puesto: '', estado: 'Pendiente', fecha: '', hash: '—' },
    { id: 12, rol: 'Firma 12', placeholderPuesto: 'Subadministrador de Soluciones de Negocio', nombre: '', puesto: '', estado: 'Pendiente', fecha: '', hash: '—' },
  ])
  const actualizarFirmanteCpreAgil = (id: number, campo: 'nombre' | 'puesto', valor: string) => {
    setFirmantesCpreAgil(prev => prev.map(f => f.id === id ? { ...f, [campo]: valor } : f))
  }
  const ejecutarFirmaCpreAgil = (id: number) => {
    const ts   = new Date().toLocaleString()
    const hash = 'SHA256-' + Math.random().toString(16).substring(2, 10) + 'cpa...'
    setFirmantesCpreAgil(prev => prev.map(f => f.id === id ? { ...f, estado: 'Firmado', fecha: ts, hash } : f))
  }

  // ── SOLA (Solicitud de Alcance al Proyecto) ─────────────────
  // No se cuenta con el documento fuente del Marco Documental 7.0 para SOLA;
  // por ahora solo se habilita la carga del archivo correspondiente.
  const [solaArchivo, setSolaArchivo] = useState<File | null>(null)
  const [solaNotas, setSolaNotas] = useState('')

  // ── EUHE ─────────────────────────────────────────────────────
  const [euheData, setEuheData] = useState({
    idRequerimiento: '', idEstimacion: '', responsable: '', totalHoras: '',
    servicioEstimado: 'Servicio de Diseño y Desarrollo de Software',
    servicioNegocio: '', aplicativo: '',
    metodoEstimacion: 'CFP (COSMIC)', agrupacionTecnologica: 'Multiplataforma',
    tecnologia: '', factorTecnologico: '', factorCategoria: '', factorHorario: '',
    faseCicloVidaSW: '',
    madurezCmmi: '3', tipoUnidades: 'UDA', totalUnidades: '', rutaRepositorio: '',
  })
  const [euheCosmic, setEuheCosmic] = useState([
    { proceso: '', entradas: '0', lecturas: '0', salidas: '0', escrituras: '0', grupoDatos: '', tmd: '0', reuso: '0', tmdAjustado: '0' },
  ])
  const [euheSmc, setEuheSmc] = useState([
    { objeto: '', tecnologia: '', tipoObjeto: '', complejidad: 'Simple' },
  ])
  const [euheJuicioExperto, setEuheJuicioExperto] = useState([
    { servicio: '', tipoServicio: 'Análisis', esfuerzoHoras: '' },
  ])
  const [firmantesEuhe, setFirmantesEuhe] = useState([
    { id: 1, rol: 'Firma 1 — Líder de Proyecto (Proveedor)', nombre: '', puesto: '', estado: 'Pendiente', fecha: '', hash: '—' },
    { id: 2, rol: 'Firma 2 — Responsable SAT / RAPE', nombre: '', puesto: '', estado: 'Pendiente', fecha: '', hash: '—' },
  ])
  const actualizarFirmanteEuhe = (id: number, campo: 'nombre' | 'puesto', valor: string) => {
    setFirmantesEuhe(prev => prev.map(f => f.id === id ? { ...f, [campo]: valor } : f))
  }
  const ejecutarFirmaEuhe = (id: number) => {
    const ts   = new Date().toLocaleString()
    const hash = 'SHA256-' + Math.random().toString(16).substring(2, 10) + 'c2a...'
    setFirmantesEuhe(prev => prev.map(f => f.id === id ? { ...f, estado: 'Firmado', fecha: ts, hash } : f))
  }

  // Cancelación
  const [motivoCancelacion, setMotivoCancelacion]         = useState('')
  const [archivosCancelacion, setArchivosCancelacion]     = useState({ justificacion: null as File | null, ccsr: null as File | null })
  const [firmantesCancelacion, setFirmantesCancelacion]   = useState([
    { id: 1, nombre: 'Javier González',   puesto: 'Líder de Sistemas',       estado: 'Pendiente', fecha: '—', hash: '—' },
    { id: 2, nombre: 'Víctor Altamirano', puesto: 'Dueño de Fase / Cliente', estado: 'Pendiente', fecha: '—', hash: '—' },
  ])
  const ejecutarFirmaCancelacion = (id: number) => {
    const ts   = new Date().toLocaleString()
    const hash = 'HASH-CANCEL-' + Math.random().toString(16).substring(2, 10).toUpperCase() + '...'
    setFirmantesCancelacion(prev => prev.map(f => f.id === id ? { ...f, estado: 'Firmado', fecha: ts, hash } : f))
  }

  // ── Estado e ícono de marco ───────────────────────────────────
  const cambiarEstado = (nuevoEstado: IniciativaEstado) => {
    setIniciativa(prev => ({ ...prev, estado: nuevoEstado }))
    setShowEstadoMenu(false)
  }
  const transicionesValidas: Record<IniciativaEstado, IniciativaEstado[]> = {
    'Inicial':       ['Formalizado', 'Cancelado'],
    'Formalizado':   ['En Estimación', 'Cancelado'],
    'En Estimación': ['En Proceso', 'Cancelado'],
    'En Proceso':    ['Cerrado', 'Cancelado'],
    'Cerrado':       [],
    'Cancelado':     [],
  }
  const transiciones  = transicionesValidas[iniciativa.estado]
  const estadoCfg     = estadoIniciativaConfig[iniciativa.estado]
  const MarcoIcon     = iniciativa.marcoTrabajo === 'Cascada' ? Layers : GitBranch

  return (
    <div className="animate-fade-in">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-gray-400 mb-4">
        <button onClick={() => router.push('/proyectos')}
          className="hover:text-gray-600 flex items-center gap-1 transition-all">
          <ArrowLeft size={13} /> Proyectos
        </button>
        <ChevronRight size={12} />
        <span className="text-gray-600 font-medium">{iniciativa.nombre}</span>
      </div>

      {/* Header de iniciativa */}
      <div className="bg-white rounded-xl border border-gray-100 p-5 mb-5 animate-fade-in stagger-1"
        style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2 flex-wrap">
              <h1 className="text-xl font-bold text-gray-900">{iniciativa.nombre}</h1>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border"
                style={{ color: estadoCfg.color, background: estadoCfg.bg, borderColor: estadoCfg.border }}>
                {estadoCfg.label}
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold"
                style={{ background: 'rgba(107,26,42,0.08)', color: '#6B1A2A' }}>
                <MarcoIcon size={11} /> {iniciativa.marcoTrabajo}
              </span>
            </div>
            <p className="text-sm text-gray-500 mb-1">{iniciativa.cliente} · {iniciativa.area}</p>
            <p className="text-xs text-gray-400 leading-relaxed max-w-2xl">{iniciativa.descripcion}</p>
            <div className="flex items-center gap-5 mt-3 text-xs text-gray-500">
              <span className="flex items-center gap-1.5"><Users size={12} className="text-gray-300" /> {iniciativa.responsable}</span>
              <span className="flex items-center gap-1.5"><Clock size={12} className="text-gray-300" /> {iniciativa.fechaInicio} → {iniciativa.fechaFin}</span>
              <span className="flex items-center gap-1.5"><BarChart2 size={12} className="text-gray-300" /> {iniciativa.presupuesto}</span>
            </div>
          </div>

          <div className="flex flex-col items-end gap-3 ml-6">
            <div className="text-center">
              <div className="relative w-16 h-16">
                <svg viewBox="0 0 36 36" className="w-16 h-16 -rotate-90">
                  <circle cx="18" cy="18" r="15.9" fill="none" stroke="#f3f4f6" strokeWidth="3" />
                  <circle cx="18" cy="18" r="15.9" fill="none" stroke="#6B1A2A" strokeWidth="3"
                    strokeDasharray={`${avanceReal} ${100 - avanceReal}`} strokeLinecap="round" />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-gray-800">{avanceReal}%</span>
              </div>
              <p className="text-xs text-gray-400 mt-1">Avance</p>
            </div>
            {transiciones.length > 0 && (
              <div className="relative">
                <button onClick={() => setShowEstadoMenu(s => !s)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-white transition-all hover:opacity-90"
                  style={{ background: 'linear-gradient(135deg, #6B1A2A 0%, #8B2339 100%)' }}>
                  <TrendingUp size={13} /> Cambiar estado
                </button>
                {showEstadoMenu && (
                  <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-20 py-1 min-w-[180px]">
                    {transiciones.map(e => {
                      const cfg = estadoIniciativaConfig[e]
                      return (
                        <button key={e} onClick={() => cambiarEstado(e)}
                          className="w-full text-left px-4 py-2.5 text-xs font-semibold hover:bg-gray-50 transition-all flex items-center gap-2"
                          style={{ color: cfg.color }}>
                          <span className="w-2 h-2 rounded-full" style={{ background: cfg.color }} />
                          {cfg.label}
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Stepper de secciones */}
      <SeccionStepper
        seccionActual={seccionActual}
        seccionesHabilitadas={seccionesHabilitadas}
        onSelect={setSeccionActual}
      />

      {/* ══════════════════════════════════════════════════════════
          SECCIÓN 1: INICIO
          ══════════════════════════════════════════════════════════ */}
      {seccionActual === 'inicio' && (
        <div className="space-y-5 animate-fade-in">
          {/* RES */}
          <div className="bg-white rounded-xl border border-gray-100 p-5"
            style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                  <FileText size={15} style={{ color: '#6B1A2A' }} />
                  Requerimiento de Servicio (RES)
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">Documento formal de captura de la iniciativa</p>
              </div>
              {iniciativa.documentos.res && (
                <div className="flex items-center gap-2">
                  <StatusPill status={iniciativa.documentos.res.status} />
                  <span className="text-xs text-gray-400 font-mono">{iniciativa.documentos.res.version}</span>
                  <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50 transition-all">
                    <Download size={12} /> Descargar PDF
                  </button>
                  <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50 transition-all">
                    <Eye size={12} /> Visualizar
                  </button>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'Nombre de la Iniciativa',  value: iniciativa.nombre },
                { label: 'Cliente / Entidad',         value: iniciativa.cliente },
                { label: 'Responsable / Líder',       value: iniciativa.responsable },
                { label: 'Área',                      value: iniciativa.area },
                { label: 'Presupuesto Estimado',      value: iniciativa.presupuesto },
                { label: 'Prioridad',                 value: iniciativa.prioridad },
                { label: 'Fecha de Inicio',           value: iniciativa.fechaInicio },
                { label: 'Fecha de Fin Estimada',     value: iniciativa.fechaFin },
              ].map(({ label, value }) => (
                <div key={label}>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">{label}</label>
                  <input
                    className="w-full px-3 py-2.5 rounded-lg text-sm border border-gray-200 bg-white outline-none focus:border-red-900 transition-all"
                    defaultValue={value || ''}
                  />
                </div>
              ))}
              <div className="col-span-2">
                <label className="block text-xs font-semibold text-gray-500 mb-1">Descripción</label>
                <textarea
                  className="w-full px-3 py-2.5 rounded-lg text-sm border border-gray-200 bg-white outline-none focus:border-red-900 transition-all resize-none"
                  rows={3}
                  defaultValue={iniciativa.descripcion || ''}
                />
              </div>
            </div>

            {/* Servicio de Negocio y Aplicativo */}
            <div className="mt-6 bg-white border border-gray-100 rounded-xl overflow-hidden shadow-xs">
              <div className="px-5 py-3.5 bg-gray-50/50 border-b border-gray-100 font-bold text-xs text-gray-700 uppercase tracking-wider">
                <span className="flex items-center gap-2"><Layers size={15} className="text-gray-400" /> Identificación del Servicio</span>
              </div>
              <div className="p-5 grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-500 mb-1">Servicio de Negocio</label>
                  <input className={inpStyle} value={resData.servicioNegocio}
                    onChange={e => setResData({ ...resData, servicioNegocio: e.target.value })}
                    placeholder="Según catálogo vigente de Servicios de Negocio" />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-500 mb-1">Aplicativo</label>
                  <input className={inpStyle} value={resData.aplicativo}
                    onChange={e => setResData({ ...resData, aplicativo: e.target.value })}
                    placeholder="Código y nombre, según Matriz de Aplicaciones" />
                </div>
              </div>
            </div>

            {/* Justificación, objetivo y recurrencia */}
            <div className="mt-5 bg-white border border-gray-100 rounded-xl overflow-hidden shadow-xs">
              <div className="px-5 py-3.5 bg-gray-50/50 border-b border-gray-100 font-bold text-xs text-gray-700 uppercase tracking-wider">
                <span className="flex items-center gap-2"><FileText size={15} className="text-gray-400" /> Justificación y Objetivo</span>
              </div>
              <div className="p-5 space-y-4">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-500 mb-1">Justificación</label>
                  <textarea className={`${inpStyle} resize-none`} rows={2} value={resData.justificacion}
                    onChange={e => setResData({ ...resData, justificacion: e.target.value })}
                    placeholder="Situación actual o problema que se busca resolver a alto nivel..." />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-500 mb-1">Objetivo Esperado</label>
                  <textarea className={`${inpStyle} resize-none`} rows={2} value={resData.objetivoEsperado}
                    onChange={e => setResData({ ...resData, objetivoEsperado: e.target.value })}
                    placeholder="Beneficios asociados esperados (estimación cuantitativa y/o cualitativa)..." />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-500 mb-1">¿La petición es recurrente?</label>
                    <select className={inpStyle} value={resData.esRecurrente}
                      onChange={e => setResData({ ...resData, esRecurrente: e.target.value })}>
                      <option>No</option>
                      <option>Sí</option>
                    </select>
                  </div>
                  {resData.esRecurrente === 'Sí' && (
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-500 mb-1">Periodicidad</label>
                      <input className={inpStyle} value={resData.periodicidad}
                        onChange={e => setResData({ ...resData, periodicidad: e.target.value })}
                        placeholder="Ej. Mensual, trimestral, anual..." />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Afectación en caso de no implementar */}
            <div className="mt-5 bg-white border border-gray-100 rounded-xl overflow-hidden shadow-xs">
              <div className="px-5 py-3.5 bg-gray-50/50 border-b border-gray-100 font-bold text-xs text-gray-700 uppercase tracking-wider">
                <span className="flex items-center gap-2"><AlertCircle size={15} className="text-gray-400" /> Afectación en Caso de No Implementar la Iniciativa</span>
              </div>
              <div className="p-5 space-y-4">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-500 mb-1">Legal / Normativa</label>
                  <textarea className={`${inpStyle} resize-none`} rows={2} value={resData.afectacionLegal}
                    onChange={e => setResData({ ...resData, afectacionLegal: e.target.value })} />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-500 mb-1">Económica / Financiera / Recaudatoria</label>
                  <textarea className={`${inpStyle} resize-none`} rows={2} value={resData.afectacionEconomica}
                    onChange={e => setResData({ ...resData, afectacionEconomica: e.target.value })} />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-500 mb-1">Percepción / Reputación</label>
                  <textarea className={`${inpStyle} resize-none`} rows={2} value={resData.afectacionPercepcion}
                    onChange={e => setResData({ ...resData, afectacionPercepcion: e.target.value })} />
                </div>
              </div>
            </div>

            {/* Información de Aplicativos Legados (condicional) */}
            <div className="mt-5 bg-white border border-gray-100 rounded-xl overflow-hidden shadow-xs">
              <div className="px-5 py-3.5 bg-gray-50/50 border-b border-gray-100 flex items-center justify-between">
                <span className="flex items-center gap-2 font-bold text-xs text-gray-700 uppercase tracking-wider">
                  <RefreshCw size={15} className="text-gray-400" /> Información de Aplicativos Legados
                </span>
                <label className="flex items-center gap-2 text-xs font-semibold text-gray-600 cursor-pointer">
                  <input type="checkbox" checked={esLegado} onChange={e => setEsLegado(e.target.checked)} className="rounded" />
                  ¿Es mantenimiento a un aplicativo legado?
                </label>
              </div>
              {esLegado && (
                <div className="p-5 space-y-4">
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-500 mb-1">Justificación general para la operación de la aplicación legada</label>
                    <textarea className={`${inpStyle} resize-none`} rows={2} value={resLegado.justificacion}
                      onChange={e => setResLegado({ ...resLegado, justificacion: e.target.value })}
                      placeholder="Razón por la que se solicita el mantenimiento, en función de su operación..." />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-500 mb-1">Prioridad del requerimiento para la operación de la aplicación</label>
                    <select className={inpStyle} style={{ maxWidth: 200 }} value={resLegado.prioridad}
                      onChange={e => setResLegado({ ...resLegado, prioridad: e.target.value })}>
                      <option>Alta</option><option>Media</option><option>Baja</option>
                    </select>
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold text-gray-500 mb-2">Fechas Críticas (identificar el tipo y justificar con claridad)</p>
                    <table className="w-full border-collapse">
                      <thead>
                        <tr>
                          <th className={thStyle} style={{ width: '28%' }}>Tipo</th>
                          <th className={thStyle} style={{ width: '18%' }}>Fecha</th>
                          <th className={thStyle}>Sustento (justificar el tipo y la fecha; adjuntar documentación como anexo si aplica)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {fechasCriticas.map((f, i) => (
                          <tr key={i} className="hover:bg-gray-50/30">
                            <td className={`${tdStyle} font-medium text-gray-700`}>{f.tipo}</td>
                            <td className={tdStyle}><input type="date" className={inpStyle} defaultValue={f.fecha} /></td>
                            <td className={tdStyle}><input className={inpStyle} defaultValue={f.sustento} placeholder="Sustento..." /></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            {/* Necesidades de Negocio */}
            <div className="mt-5 bg-white border border-gray-100 rounded-xl overflow-hidden shadow-xs">
              <div className="px-5 py-3.5 bg-gray-50/50 border-b border-gray-100 font-bold text-xs text-gray-700 uppercase tracking-wider">
                <span className="flex items-center gap-2"><CheckCircle2 size={15} className="text-gray-400" /> Necesidades de Negocio</span>
              </div>
              <div className="p-5">
                <table className="w-full border-collapse">
                  <thead>
                    <tr>
                      <th className={thStyle}>ID (RN)</th>
                      <th className={thStyle}>Funcionalidad / Descripción</th>
                      <th className={thStyle}>Mejora</th>
                      <th className={thStyle}>Nueva Funcionalidad</th>
                      <th className={thStyle} style={{ width: 50 }} />
                    </tr>
                  </thead>
                  <tbody>
                    {necesidadesNegocio.map((n, i) => (
                      <tr key={i} className="hover:bg-gray-50/30">
                        <td className={tdStyle}><input className={inpStyle} defaultValue={n.id} /></td>
                        <td className={tdStyle}><input className={inpStyle} defaultValue={n.descripcion} placeholder="Describe la funcionalidad..." /></td>
                        <td className={`${tdStyle} text-center`}>
                          <input type="checkbox" defaultChecked={n.mejora} className="rounded" />
                        </td>
                        <td className={`${tdStyle} text-center`}>
                          <input type="checkbox" defaultChecked={n.nueva} className="rounded" />
                        </td>
                        <td className={tdStyle}>
                          <button onClick={() => setNecesidadesNegocio(necesidadesNegocio.filter((_, j) => j !== i))}
                            className="text-gray-400 hover:text-red-600 transition-all p-1">
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <button onClick={() => setNecesidadesNegocio([...necesidadesNegocio, { id: `RN0${necesidadesNegocio.length + 1}`, funcionalidad: '', descripcion: '', mejora: false, nueva: false }])}
                  className="mt-3 flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-dashed border-gray-300 text-xs font-semibold text-gray-600 hover:bg-gray-50">
                  <Plus size={13} /> Añadir Necesidad
                </button>
              </div>
            </div>

            {/* Dependencias */}
            <div className="mt-5 bg-white border border-gray-100 rounded-xl overflow-hidden shadow-xs">
              <div className="px-5 py-3.5 bg-gray-50/50 border-b border-gray-100 font-bold text-xs text-gray-700 uppercase tracking-wider">
                <span className="flex items-center gap-2"><GitBranch size={15} className="text-gray-400" /> Dependencias</span>
              </div>
              <div className="p-5">
                <table className="w-full border-collapse">
                  <thead>
                    <tr>
                      <th className={thStyle}>Tipo</th>
                      <th className={thStyle}>Detalle</th>
                      <th className={thStyle}>Relación ID RN</th>
                      <th className={thStyle} style={{ width: 50 }} />
                    </tr>
                  </thead>
                  <tbody>
                    {dependenciasRes.map((d, i) => (
                      <tr key={i} className="hover:bg-gray-50/30">
                        <td className={tdStyle}>
                          <select className={inpStyle} defaultValue={d.tipo}>
                            <option>Negocio</option><option>Tecnológicas</option><option>Aplicativas</option>
                          </select>
                        </td>
                        <td className={tdStyle}><input className={inpStyle} defaultValue={d.detalle} /></td>
                        <td className={tdStyle}><input className={inpStyle} defaultValue={d.relacionRN} placeholder="Ej. RN01" /></td>
                        <td className={tdStyle}>
                          <button onClick={() => setDependenciasRes(dependenciasRes.filter((_, j) => j !== i))}
                            className="text-gray-400 hover:text-red-600 transition-all p-1">
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <button onClick={() => setDependenciasRes([...dependenciasRes, { tipo: 'Negocio', detalle: '', relacionRN: '' }])}
                  className="mt-3 flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-dashed border-gray-300 text-xs font-semibold text-gray-600 hover:bg-gray-50">
                  <Plus size={13} /> Añadir Dependencia
                </button>
              </div>
            </div>

            {/* Impactos identificados */}
            <div className="mt-5 bg-white border border-gray-100 rounded-xl overflow-hidden shadow-xs">
              <div className="px-5 py-3.5 bg-gray-50/50 border-b border-gray-100 font-bold text-xs text-gray-700 uppercase tracking-wider">
                <span className="flex items-center gap-2"><AlertOctagon size={15} className="text-gray-400" /> Impactos Identificados</span>
              </div>
              <div className="p-5">
                <table className="w-full border-collapse">
                  <thead>
                    <tr>
                      <th className={thStyle}>Área / Aplicativo / Servicio</th>
                      <th className={thStyle}>Descripción del Impacto</th>
                      <th className={thStyle} style={{ width: 50 }} />
                    </tr>
                  </thead>
                  <tbody>
                    {impactosRes.map((im, i) => (
                      <tr key={i} className="hover:bg-gray-50/30">
                        <td className={tdStyle}><input className={inpStyle} defaultValue={im.area} /></td>
                        <td className={tdStyle}><input className={inpStyle} defaultValue={im.descripcion} /></td>
                        <td className={tdStyle}>
                          <button onClick={() => setImpactosRes(impactosRes.filter((_, j) => j !== i))}
                            className="text-gray-400 hover:text-red-600 transition-all p-1">
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <button onClick={() => setImpactosRes([...impactosRes, { area: '', descripcion: '' }])}
                  className="mt-3 flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-dashed border-gray-300 text-xs font-semibold text-gray-600 hover:bg-gray-50">
                  <Plus size={13} /> Añadir Impacto
                </button>
              </div>
            </div>

            {/* Volumetría */}
            <div className="mt-5 bg-white border border-gray-100 rounded-xl overflow-hidden shadow-xs">
              <div className="px-5 py-3.5 bg-gray-50/50 border-b border-gray-100 font-bold text-xs text-gray-700 uppercase tracking-wider">
                <span className="flex items-center gap-2"><BarChart2 size={15} className="text-gray-400" /> Volumetría</span>
              </div>
              <div className="p-5">
                <table className="w-full border-collapse">
                  <thead>
                    <tr>
                      <th className={thStyle}>Tipo de Usuario</th>
                      <th className={thStyle}>Medio de Acceso</th>
                      <th className={thStyle}>Número de Usuarios</th>
                      <th className={thStyle}>Accesos Concurrentes</th>
                      <th className={thStyle}>Picos de Operación</th>
                    </tr>
                  </thead>
                  <tbody>
                    {volumetriaRes.map((v, i) => (
                      <tr key={i} className="hover:bg-gray-50/30">
                        <td className={`${tdStyle} font-medium text-gray-700`}>{v.tipoUsuario}</td>
                        <td className={tdStyle}><input className={inpStyle} defaultValue={v.medioAcceso} /></td>
                        <td className={tdStyle}><input type="number" className={inpStyle} defaultValue={v.numUsuarios} /></td>
                        <td className={tdStyle}><input type="number" className={inpStyle} defaultValue={v.accesosConcurrentes} /></td>
                        <td className={tdStyle}><input className={inpStyle} defaultValue={v.picosOperacion} /></td>
                      </tr>
                    ))}
                    <tr className="bg-gray-50/60">
                      <td className={`${tdStyle} font-semibold text-gray-600`}>Total de transacciones y su Periodicidad</td>
                      <td className={tdStyle} colSpan={2}>
                        <input className={inpStyle} placeholder="Total de transacciones"
                          value={totalTransaccionesRes.total}
                          onChange={e => setTotalTransaccionesRes({ ...totalTransaccionesRes, total: e.target.value })} />
                      </td>
                      <td className={tdStyle} colSpan={2}>
                        <input className={inpStyle} placeholder="Periodicidad (Ej. Mensual, Anual...)"
                          value={totalTransaccionesRes.periodicidad}
                          onChange={e => setTotalTransaccionesRes({ ...totalTransaccionesRes, periodicidad: e.target.value })} />
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Servicios de Información */}
            <div className="mt-5 bg-white border border-gray-100 rounded-xl overflow-hidden shadow-xs">
              <div className="px-5 py-3.5 bg-gray-50/50 border-b border-gray-100 font-bold text-xs text-gray-700 uppercase tracking-wider">
                <span className="flex items-center gap-2"><BarChart2 size={15} className="text-gray-400" /> Servicios de Información</span>
              </div>
              <div className="p-5 space-y-4">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-500 mb-1">¿Esta solicitud requiere un componente de Servicios de Información?</label>
                  <select className={inpStyle} style={{ maxWidth: 200 }} value={resData.requiereServiciosInformacion}
                    onChange={e => setResData({ ...resData, requiereServiciosInformacion: e.target.value })}>
                    <option>No</option>
                    <option>Sí</option>
                  </select>
                </div>
                {resData.requiereServiciosInformacion === 'Sí' && (
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-500 mb-2">Selecciona los componentes necesarios</label>
                    <div className="grid grid-cols-2 gap-2">
                      {['Limpieza de datos', 'Migración de información', 'Migración de infraestructura de datos', 'Modelo de Información', 'Modificaciones a BD', 'Proceso ETL', 'Soluciones BI', 'Otros'].map(opt => (
                        <label key={opt} className="flex items-center gap-2 text-xs text-gray-600">
                          <input type="checkbox" className="rounded" /> {opt}
                        </label>
                      ))}
                    </div>
                    <textarea className={`${inpStyle} resize-none mt-3`} rows={2} value={resData.detalleServiciosInformacion}
                      onChange={e => setResData({ ...resData, detalleServiciosInformacion: e.target.value })}
                      placeholder="Detalle adicional (especialmente si seleccionaste 'Otros')..." />
                  </div>
                )}
              </div>
            </div>

            {/* Anexos */}
            <div className="mt-5 bg-white border border-gray-100 rounded-xl overflow-hidden shadow-xs">
              <div className="px-5 py-3.5 bg-gray-50/50 border-b border-gray-100 font-bold text-xs text-gray-700 uppercase tracking-wider">
                <span className="flex items-center gap-2"><FileText size={15} className="text-gray-400" /> Anexos</span>
              </div>
              <div className="p-5">
                <table className="w-full border-collapse">
                  <thead>
                    <tr>
                      <th className={thStyle}>Nombre del Documento</th>
                      <th className={thStyle}>Descripción</th>
                      <th className={thStyle}>Versión</th>
                      <th className={thStyle} style={{ width: 50 }} />
                    </tr>
                  </thead>
                  <tbody>
                    {anexosRes.map((a, i) => (
                      <tr key={i} className="hover:bg-gray-50/30">
                        <td className={tdStyle}><input className={inpStyle} defaultValue={a.nombre} /></td>
                        <td className={tdStyle}><input className={inpStyle} defaultValue={a.desc} /></td>
                        <td className={tdStyle}><input className={inpStyle} defaultValue={a.version} /></td>
                        <td className={tdStyle}>
                          <button onClick={() => setAnexosRes(anexosRes.filter((_, j) => j !== i))}
                            className="text-gray-400 hover:text-red-600 transition-all p-1">
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <button onClick={() => setAnexosRes([...anexosRes, { nombre: '', desc: '', version: '' }])}
                  className="mt-3 flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-dashed border-gray-300 text-xs font-semibold text-gray-600 hover:bg-gray-50">
                  <Plus size={13} /> Añadir Anexo
                </button>
              </div>
            </div>

            {/* Firmas de Autorización del RES */}
            <div className="mt-5 bg-white border border-gray-100 rounded-xl overflow-hidden shadow-xs">
              <div className="px-5 py-3.5 bg-gray-50/50 border-b border-gray-100 font-bold text-xs text-red-950 uppercase tracking-wider">
                <span className="flex items-center gap-2"><ShieldCheck size={15} className="text-red-900" /> Autorización del RES</span>
              </div>
              <div className="p-5 space-y-5">
                {/* Bloque 1: Subadministrador + Administrador (Solicitante) */}
                <div>
                  <p className="text-[11px] font-semibold text-gray-500 mb-2">Solicitante / Puesto / Administración Central / Administración General</p>
                  <table className="w-full border-collapse">
                    <thead>
                      <tr>
                        <th className={thStyle}>Rol</th>
                        <th className={thStyle}>Nombre</th>
                        <th className={thStyle}>Puesto</th>
                        <th className={thStyle}>Fecha de Autorización</th>
                        <th className={thStyle}>Firma</th>
                      </tr>
                    </thead>
                    <tbody>
                      {firmantesAutorizacionRES1.map(f => (
                        <tr key={f.id} className="hover:bg-gray-50/30">
                          <td className={`${tdStyle} font-medium text-gray-600`}>{f.rol}</td>
                          <td className={tdStyle}><input className={inpStyle} defaultValue={f.nombre} /></td>
                          <td className={tdStyle}><input className={inpStyle} defaultValue={f.puesto} /></td>
                          <td className={tdStyle}><input type="date" className={inpStyle} defaultValue={f.fecha !== '—' ? f.fecha : ''} /></td>
                          <td className={tdStyle}>
                            {f.estado === 'Pendiente' ? (
                              <button onClick={() => ejecutarFirmaAutorizacionRES(1, f.id)}
                                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold text-white transition-all hover:opacity-90"
                                style={{ background: 'linear-gradient(135deg, #7c3aed 0%, #9333ea 100%)' }}>
                                <Pen size={11} /> Firmar
                              </button>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
                                <CheckCircle2 size={12} /> Firmado
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Bloque 2: Administrador + Administrador Central */}
                <div>
                  <p className="text-[11px] font-semibold text-gray-500 mb-2">Solicitante / Puesto / Administración Central / Administración General</p>
                  <table className="w-full border-collapse">
                    <thead>
                      <tr>
                        <th className={thStyle}>Rol</th>
                        <th className={thStyle}>Nombre</th>
                        <th className={thStyle}>Puesto</th>
                        <th className={thStyle}>Fecha de Autorización</th>
                        <th className={thStyle}>Firma</th>
                      </tr>
                    </thead>
                    <tbody>
                      {firmantesAutorizacionRES2.map(f => (
                        <tr key={f.id} className="hover:bg-gray-50/30">
                          <td className={`${tdStyle} font-medium text-gray-600`}>{f.rol}</td>
                          <td className={tdStyle}><input className={inpStyle} defaultValue={f.nombre} /></td>
                          <td className={tdStyle}><input className={inpStyle} defaultValue={f.puesto} /></td>
                          <td className={tdStyle}><input type="date" className={inpStyle} defaultValue={f.fecha !== '—' ? f.fecha : ''} /></td>
                          <td className={tdStyle}>
                            {f.estado === 'Pendiente' ? (
                              <button onClick={() => ejecutarFirmaAutorizacionRES(2, f.id)}
                                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold text-white transition-all hover:opacity-90"
                                style={{ background: 'linear-gradient(135deg, #7c3aed 0%, #9333ea 100%)' }}>
                                <Pen size={11} /> Firmar
                              </button>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
                                <CheckCircle2 size={12} /> Firmado
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Bloque 3: Analista + Administrador/Subadministrador de Soluciones de Negocio */}
                <div>
                  <p className="text-[11px] font-semibold text-gray-500 mb-2">Analista / Puesto / Administración Central / Administración General — Responsable de realizar el análisis y definir un alcance en conjunto con el solicitante</p>
                  <table className="w-full border-collapse">
                    <thead>
                      <tr>
                        <th className={thStyle}>Rol</th>
                        <th className={thStyle}>Nombre</th>
                        <th className={thStyle}>Puesto</th>
                        <th className={thStyle}>Fecha de Autorización</th>
                        <th className={thStyle}>Firma</th>
                      </tr>
                    </thead>
                    <tbody>
                      {firmantesAutorizacionRES3.map(f => (
                        <tr key={f.id} className="hover:bg-gray-50/30">
                          <td className={`${tdStyle} font-medium text-gray-600`}>{f.rol}</td>
                          <td className={tdStyle}><input className={inpStyle} defaultValue={f.nombre} /></td>
                          <td className={tdStyle}><input className={inpStyle} defaultValue={f.puesto} /></td>
                          <td className={tdStyle}><input type="date" className={inpStyle} defaultValue={f.fecha !== '—' ? f.fecha : ''} /></td>
                          <td className={tdStyle}>
                            {f.estado === 'Pendiente' ? (
                              <button onClick={() => ejecutarFirmaAutorizacionRES(3, f.id)}
                                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold text-white transition-all hover:opacity-90"
                                style={{ background: 'linear-gradient(135deg, #7c3aed 0%, #9333ea 100%)' }}>
                                <Pen size={11} /> Firmar
                              </button>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
                                <CheckCircle2 size={12} /> Firmado
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Gestión dinámica de firmantes del RES */}
            <div className="mt-6">
              <h4 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                <UserCheck size={15} style={{ color: '#6B1A2A' }} />
                Firmantes del RES
              </h4>

              {/* Formulario para agregar firmante */}
              <div className="grid grid-cols-12 gap-3 mb-4 items-end bg-gray-50/50 p-3 rounded-xl border border-gray-100">
                <div className="col-span-4">
                  <label className="block text-[11px] font-semibold text-gray-500 mb-1">Nombre</label>
                  <input type="text" placeholder="Juan Pérez"
                    value={nuevoFirmanteRES.nombre}
                    onChange={e => setNuevoFirmanteRES({ ...nuevoFirmanteRES, nombre: e.target.value })}
                    className="w-full bg-white border border-gray-200 rounded-lg px-3 py-1.5 text-xs outline-none focus:border-red-900 transition-all"
                  />
                </div>
                <div className="col-span-4">
                  <label className="block text-[11px] font-semibold text-gray-500 mb-1">Email</label>
                  <input type="email" placeholder="juan@company.com"
                    value={nuevoFirmanteRES.email}
                    onChange={e => setNuevoFirmanteRES({ ...nuevoFirmanteRES, email: e.target.value })}
                    className="w-full bg-white border border-gray-200 rounded-lg px-3 py-1.5 text-xs outline-none focus:border-red-900 transition-all"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-[11px] font-semibold text-gray-500 mb-1">Tipo</label>
                  <select value={nuevoFirmanteRES.tipo}
                    onChange={e => setNuevoFirmanteRES({ ...nuevoFirmanteRES, tipo: e.target.value })}
                    className="w-full bg-white border border-gray-200 rounded-lg px-2 py-1.5 text-xs outline-none focus:border-red-900 transition-all">
                    <option>Firmante</option>
                    <option>Revisor</option>
                    <option>Informado</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <button onClick={agregarFirmanteRES}
                    className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition-all hover:opacity-90"
                    style={{ background: 'linear-gradient(135deg, #6B1A2A 0%, #8B2339 100%)' }}>
                    <Plus size={13} /> Agregar
                  </button>
                </div>
              </div>

              {firmantesRES.length > 0 ? (
                <div className="border border-gray-100 rounded-xl overflow-hidden">
                  <div className="grid grid-cols-12 px-4 py-2.5 bg-gray-50 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    <span className="col-span-4">Nombre</span>
                    <span className="col-span-5">Email</span>
                    <span className="col-span-2">Tipo</span>
                    <span className="col-span-1" />
                  </div>
                  {firmantesRES.map(f => (
                    <div key={f.id} className="grid grid-cols-12 px-4 py-3 border-t border-gray-50 text-xs items-center hover:bg-gray-50/30">
                      <span className="col-span-4 font-medium text-gray-800">{f.nombre}</span>
                      <span className="col-span-5 text-gray-400 font-mono">{f.email}</span>
                      <span className="col-span-2">
                        <span className="px-2 py-0.5 rounded-full text-xs font-semibold"
                          style={{
                            background: f.tipo === 'Firmante' ? 'rgba(107,26,42,0.08)' : f.tipo === 'Revisor' ? 'rgba(2,132,199,0.08)' : 'rgba(107,114,128,0.08)',
                            color:      f.tipo === 'Firmante' ? '#6B1A2A'             : f.tipo === 'Revisor' ? '#0284c7'             : '#6b7280',
                          }}>
                          {f.tipo}
                        </span>
                      </span>
                      <span className="col-span-1 text-right">
                        <button onClick={() => eliminarFirmanteRES(f.id)}
                          className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-red-600 transition-all">
                          <Trash2 size={13} />
                        </button>
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 bg-gray-50 rounded-xl border border-dashed border-gray-200 text-center text-xs text-gray-400">
                  No hay firmantes configurados.
                </div>
              )}
            </div>

            {/* Selector de Marco de Trabajo */}
            <div className="mt-6 p-4 border border-dashed border-amber-200 bg-amber-50/30 rounded-xl">
              <h4 className="text-sm font-bold text-gray-800 mb-1 flex items-center gap-2">
                <GitBranch size={14} style={{ color: '#d97706' }} />
                Marco de Trabajo <span className="text-red-500 ml-1">*</span>
              </h4>
              <p className="text-xs text-gray-500 mb-3">
                Esta elección determinará los documentos, fases y artefactos de las secciones siguientes.
                Si aún no lo defines, puedes continuar y elegirlo más tarde.
              </p>
              <div className="flex gap-3">
                {(['Ágil', 'Cascada'] as const).map(m => (
                  <button key={m}
                    onClick={() => { setMarcoTrabajo(m); setMarcoPendiente(false) }}
                    className="flex items-center gap-2 px-5 py-3 rounded-xl border-2 text-sm font-semibold transition-all"
                    style={{
                      borderColor: marcoTrabajo === m && !marcoPendiente ? '#6B1A2A' : '#e5e7eb',
                      background:  marcoTrabajo === m && !marcoPendiente ? 'rgba(107,26,42,0.06)' : '#fff',
                      color:       marcoTrabajo === m && !marcoPendiente ? '#6B1A2A' : '#6b7280',
                    }}>
                    {m === 'Ágil' ? <GitBranch size={15} /> : <Layers size={15} />} {m}
                    {marcoTrabajo === m && !marcoPendiente && <CheckCircle2 size={14} className="text-emerald-500" />}
                  </button>
                ))}
                <button
                  onClick={() => { setMarcoTrabajo('Cascada'); setMarcoPendiente(true) }}
                  className="flex items-center gap-2 px-5 py-3 rounded-xl border-2 border-dashed text-sm font-semibold transition-all"
                  style={{
                    borderColor: marcoPendiente ? '#d97706' : '#e5e7eb',
                    background:  marcoPendiente ? 'rgba(217,119,6,0.06)' : '#fff',
                    color:       marcoPendiente ? '#d97706' : '#6b7280',
                  }}>
                  <Clock size={15} /> Elegir más tarde
                  {marcoPendiente && <CheckCircle2 size={14} className="text-amber-500" />}
                </button>
              </div>
              {marcoTrabajo && !marcoPendiente && (
                <p className="mt-2 text-xs text-emerald-700 flex items-center gap-1">
                  <CheckCircle2 size={12} /> Marco <strong>{marcoTrabajo}</strong> seleccionado
                </p>
              )}
              {marcoPendiente && (
                <p className="mt-2 text-xs text-amber-700 flex items-center gap-1">
                  <AlertCircle size={12} /> Marco pendiente de definir. Mientras tanto se mostrarán los documentos en <strong>Cascada</strong> por defecto; podrás cambiarlo después.
                </p>
              )}
            </div>

            {/* Acción guardar RES */}
            <div className="mt-5 flex gap-3">
              <button
                onClick={() => setResCompletado(true)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90"
                style={{ background: 'linear-gradient(135deg, #6B1A2A 0%, #8B2339 100%)' }}>
                <Check size={14} /> Guardar y Generar PDF
              </button>
              <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50 transition-all">
                <Pen size={14} /> Enviar a firma electrónica
              </button>
            </div>

            {resCompletado && (
              <div className="mt-3 p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-2">
                <CheckCircle2 size={14} className="text-emerald-600" />
                <p className="text-xs text-emerald-700 font-semibold">RES guardado correctamente.</p>
              </div>
            )}
          </div>

          {/* Carta Preliminar / CPRE (se habilita cuando RES completado + marco elegido o pendiente) */}
          {resCompletado && (marcoTrabajo || marcoPendiente) && (
            <div className="bg-white rounded-xl border border-gray-100 p-5"
              style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                    <FileText size={15} style={{ color: '#d97706' }} />
                    Carta Preliminar (CPRE) — Marco: {marcoEfectivo}
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                      Opcional
                    </span>
                  </h3>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Avala el inicio anticipado del trabajo cuando aún no hay PSE/CAPA aceptadas (cobertura máxima 30 días naturales). Puedes llenarla ahora o continuar sin ella.
                  </p>
                </div>
              </div>

              {!cartaPreliminarDecidida && !mostrarCartaPreliminar && (
                <div className="flex gap-3">
                  <button
                    onClick={() => setMostrarCartaPreliminar(true)}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90"
                    style={{ background: 'linear-gradient(135deg, #6B1A2A 0%, #8B2339 100%)' }}>
                    <FileText size={14} /> Llenar Carta Preliminar
                  </button>
                  <button
                    onClick={() => setCartaPreliminarDecidida(true)}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50 transition-all">
                    <ChevronRight size={14} /> Omitir y continuar
                  </button>
                </div>
              )}

              {mostrarCartaPreliminar && !cartaPreliminarRellena && (
                marcoEfectivo === 'Cascada' ? (
                  <div className="space-y-5">
                    {/* Identificación */}
                    <div className="bg-white border border-amber-100 rounded-xl overflow-hidden shadow-xs">
                      <div className="px-5 py-3.5 bg-amber-50/40 border-b border-amber-100 font-bold text-xs text-amber-900 uppercase tracking-wider">
                        <span className="flex items-center gap-2"><FileText size={15} className="text-amber-700" /> Identificación del Proyecto</span>
                      </div>
                      <div className="p-5 space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-[11px] font-semibold text-gray-500 mb-1">Responsable (Project Manager Proveedor)</label>
                            <input className={inpStyle} value={cpreData.responsable}
                              onChange={e => setCpreData({ ...cpreData, responsable: e.target.value })} placeholder="Nombre completo" />
                          </div>
                          <div>
                            <label className="block text-[11px] font-semibold text-gray-500 mb-1">Fecha de Elaboración</label>
                            <input type="date" className={inpStyle} value={cpreData.fechaElaboracion}
                              onChange={e => setCpreData({ ...cpreData, fechaElaboracion: e.target.value })} />
                          </div>
                          <div className="col-span-2">
                            <label className="block text-[11px] font-semibold text-gray-500 mb-1">Nombre del Proyecto</label>
                            <input className={inpStyle} defaultValue={iniciativa.nombre}
                              onChange={e => setCpreData({ ...cpreData, nombreProyecto: e.target.value })} />
                          </div>
                          <div className="col-span-2">
                            <label className="block text-[11px] font-semibold text-gray-500 mb-1">Descripción</label>
                            <textarea className={`${inpStyle} resize-none`} rows={2} value={cpreData.descripcion}
                              onChange={e => setCpreData({ ...cpreData, descripcion: e.target.value })}
                              placeholder="Descripción del servicio que se estará brindando y de los objetivos del proyecto..." />
                          </div>
                          <div className="col-span-2">
                            <label className="block text-[11px] font-semibold text-gray-500 mb-1">Motivo del Tipo de Inicio</label>
                            <input className={inpStyle} value={cpreData.motivo}
                              onChange={e => setCpreData({ ...cpreData, motivo: e.target.value })}
                              placeholder="Ej. Cambios emergentes a la legislación fiscal" />
                          </div>
                          <div>
                            <label className="block text-[11px] font-semibold text-gray-500 mb-1">Fecha de Inicio</label>
                            <input type="date" className={inpStyle} value={cpreData.fechaInicio}
                              onChange={e => setCpreData({ ...cpreData, fechaInicio: e.target.value })} />
                          </div>
                          <div>
                            <label className="block text-[11px] font-semibold text-gray-500 mb-1">Fecha Compromiso para Liberación</label>
                            <input type="date" className={inpStyle} value={cpreData.fechaCompromisoLiberacion}
                              onChange={e => setCpreData({ ...cpreData, fechaCompromisoLiberacion: e.target.value })} />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Esfuerzo estimado */}
                    <div className="bg-white border border-gray-100 rounded-xl overflow-hidden shadow-xs">
                      <div className="px-5 py-3.5 bg-gray-50/50 border-b border-gray-100 font-bold text-xs text-gray-700 uppercase tracking-wider">
                        <span className="flex items-center gap-2"><DollarSign size={15} className="text-gray-400" /> Esfuerzo Estimado</span>
                      </div>
                      <div className="p-5">
                        <table className="w-full border-collapse">
                          <thead>
                            <tr>
                              <th className={thStyle}>Tipo de Perfil</th>
                              <th className={thStyle}>Cantidad</th>
                              <th className={thStyle}>Esfuerzo x Perfil (Hrs)</th>
                              <th className={thStyle}>Factor Equiv.</th>
                              <th className={thStyle}>Subtotal de Unidades</th>
                              <th className={thStyle} style={{ width: 50 }} />
                            </tr>
                          </thead>
                          <tbody>
                            {cpreCostos.map((c, i) => (
                              <tr key={i} className="hover:bg-gray-50/30">
                                <td className={tdStyle}><input className={inpStyle} defaultValue={c.perfil} /></td>
                                <td className={tdStyle}><input type="number" className={inpStyle} defaultValue={c.cantidad} /></td>
                                <td className={tdStyle}><input type="number" className={inpStyle} defaultValue={c.esfuerzo} /></td>
                                <td className={tdStyle}><input type="number" className={inpStyle} defaultValue={c.factor} /></td>
                                <td className={tdStyle}><input type="number" className={inpStyle} defaultValue={c.subtotalUnidades} /></td>
                                <td className={tdStyle}>
                                  <button onClick={() => setCpreCostos(cpreCostos.filter((_, j) => j !== i))}
                                    className="text-gray-400 hover:text-red-600 transition-all p-1">
                                    <Trash2 size={14} />
                                  </button>
                                </td>
                              </tr>
                            ))}
                            <tr className="bg-gray-50/60">
                              <td colSpan={4} className={`${tdStyle} text-right font-semibold text-gray-500`}>TOTAL Unidades:</td>
                              <td className={tdStyle}>
                                <div className="px-3 py-1.5 text-xs font-bold text-gray-800 bg-gray-100 rounded-lg text-center border border-gray-200">
                                  {cpreCostos.reduce((s, c) => s + (parseFloat(c.subtotalUnidades) || 0), 0).toFixed(2)} Hrs.
                                </div>
                              </td>
                              <td />
                            </tr>
                          </tbody>
                        </table>
                        <button onClick={() => setCpreCostos([...cpreCostos, { perfil: '', cantidad: '0', esfuerzo: '0', factor: '1', subtotalUnidades: '0' }])}
                          className="mt-3 flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-dashed border-gray-300 text-xs font-semibold text-gray-600 hover:bg-gray-50">
                          <Plus size={13} /> Añadir Perfil
                        </button>
                        <p className="text-[10px] text-gray-400 mt-2">
                          Este esfuerzo inicial estimado se integrará a la CAPA formal que el Proveedor entregue al SAT. Si no procediera una propuesta definitiva, se elaborará una propuesta basada en esta carta para el cobro del esfuerzo invertido.
                        </p>
                      </div>
                    </div>

                    {/* Lista de entregables */}
                    <div className="bg-white border border-gray-100 rounded-xl overflow-hidden shadow-xs">
                      <div className="px-5 py-3.5 bg-gray-50/50 border-b border-gray-100 font-bold text-xs text-gray-700 uppercase tracking-wider">
                        <span className="flex items-center gap-2"><CheckCircle2 size={15} className="text-gray-400" /> Lista de Entregables</span>
                      </div>
                      <div className="p-5">
                        <div className="space-y-2">
                          {cpreEntregables.map((e, i) => (
                            <div key={i} className="flex items-center gap-2">
                              <span className="text-xs font-semibold text-gray-400 w-16 flex-shrink-0">Entregable {String.fromCharCode(65 + i)}</span>
                              <input className={inpStyle} defaultValue={e.nombre} placeholder="Nombre del entregable" />
                              <input className={inpStyle} defaultValue={e.desc} placeholder="Descripción breve" />
                              <button onClick={() => setCpreEntregables(cpreEntregables.filter((_, j) => j !== i))}
                                className="text-gray-400 hover:text-red-600 transition-all p-1 flex-shrink-0">
                                <Trash2 size={14} />
                              </button>
                            </div>
                          ))}
                        </div>
                        <button onClick={() => setCpreEntregables([...cpreEntregables, { nombre: '', desc: '' }])}
                          className="mt-3 flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-dashed border-gray-300 text-xs font-semibold text-gray-600 hover:bg-gray-50">
                          <Plus size={13} /> Añadir Entregable
                        </button>
                        <div className="mt-4">
                          <label className="block text-[11px] font-semibold text-gray-500 mb-1">Fecha estimada de entrega de la CAPA definitiva (máx. 15 días naturales después de iniciados los trabajos)</label>
                          <input type="date" className={inpStyle} style={{ maxWidth: 220 }} value={cpreData.fechaEstimadaCapa}
                            onChange={e => setCpreData({ ...cpreData, fechaEstimadaCapa: e.target.value })} />
                        </div>
                      </div>
                    </div>

                    {/* Firmas (7 firmantes) */}
                    <div className="bg-white border border-gray-100 rounded-xl overflow-hidden shadow-xs">
                      <div className="px-5 py-3.5 bg-gray-50/50 border-b border-gray-100 font-bold text-xs text-red-950 uppercase tracking-wider">
                        <span className="flex items-center gap-2"><ShieldCheck size={15} className="text-red-900" /> Firmas de Conformidad</span>
                      </div>
                      <div className="p-5">
                        <div className="grid grid-cols-2 gap-4">
                          {firmantesCpre.map(f => (
                            <div key={f.id} className="border border-gray-100 bg-white rounded-xl p-4 flex flex-col justify-between shadow-xs">
                              <div>
                                <div className="flex justify-between items-start mb-2">
                                  <h5 className="text-xs font-bold text-gray-900">{f.rol}</h5>
                                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${f.estado === 'Firmado' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>
                                    {f.estado === 'Firmado' ? 'Firmado' : 'Pendiente'}
                                  </span>
                                </div>
                                <div className="space-y-2 mb-3">
                                  <div>
                                    <label className="block text-[10px] font-semibold text-gray-400 mb-0.5">Nombre</label>
                                    <input className={inpStyle} value={f.nombre} disabled={f.estado === 'Firmado'}
                                      onChange={e => actualizarFirmanteCpre(f.id, 'nombre', e.target.value)}
                                      placeholder="Nombre completo" />
                                  </div>
                                  <div>
                                    <label className="block text-[10px] font-semibold text-gray-400 mb-0.5">Puesto</label>
                                    <input className={inpStyle} value={f.puesto} disabled={f.estado === 'Firmado'}
                                      onChange={e => actualizarFirmanteCpre(f.id, 'puesto', e.target.value)}
                                      placeholder={f.placeholderPuesto} />
                                  </div>
                                </div>
                                <div className="space-y-1 bg-gray-50 p-2.5 rounded-lg border border-gray-100 font-mono text-[10px] text-gray-500 mb-4">
                                  <div><span className="font-sans font-semibold text-gray-400">Fecha:</span> {f.fecha || '—'}</div>
                                  <div className="truncate"><span className="font-sans font-semibold text-gray-400">Hash:</span> {f.hash}</div>
                                </div>
                              </div>
                              {f.estado === 'Pendiente' ? (
                                <button onClick={() => ejecutarFirmaCpre(f.id)}
                                  disabled={!f.nombre.trim() || !f.puesto.trim()}
                                  title={!f.nombre.trim() || !f.puesto.trim() ? 'Captura nombre y puesto primero' : ''}
                                  className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-white transition-all hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
                                  style={{ background: 'linear-gradient(135deg, #7c3aed 0%, #9333ea 100%)' }}>
                                  <Pen size={12} /> Firmar Digitalmente
                                </button>
                              ) : (
                                <div className="text-center py-2 bg-emerald-50/40 border border-dashed border-emerald-200 text-emerald-700 text-xs font-semibold rounded-lg flex items-center justify-center gap-1">
                                  <CheckCircle2 size={13} /> Firma Estampada
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Acciones CPRE */}
                    <div className="flex items-center justify-between gap-3">
                      <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50 transition-all">
                        <Download size={13} /> Generar PDF
                      </button>
                      <div className="flex gap-3">
                        <button
                          onClick={() => { setMostrarCartaPreliminar(false); setCartaPreliminarDecidida(true) }}
                          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50 transition-all">
                          Omitir
                        </button>
                        <button
                          onClick={() => { setCartaPreliminarRellena(true); setCartaPreliminarDecidida(true) }}
                          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-white transition-all hover:opacity-90"
                          style={{ background: '#d97706' }}>
                          <Check size={13} /> Guardar Carta Preliminar
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-5">
                    {/* Identificación */}
                    <div className="bg-white border border-amber-100 rounded-xl overflow-hidden shadow-xs">
                      <div className="px-5 py-3.5 bg-amber-50/40 border-b border-amber-100 font-bold text-xs text-amber-900 uppercase tracking-wider">
                        <span className="flex items-center gap-2"><FileText size={15} className="text-amber-700" /> Identificación del Proyecto</span>
                      </div>
                      <div className="p-5 space-y-4">
                        <div>
                          <label className="block text-[11px] font-semibold text-gray-500 mb-1">Nombre del Proyecto</label>
                          <input className={inpStyle} defaultValue={iniciativa.nombre}
                            onChange={e => setCpreAgilData({ ...cpreAgilData, nombreProyecto: e.target.value })} />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-gray-500 mb-1">Descripción</label>
                          <textarea className={`${inpStyle} resize-none`} rows={2} value={cpreAgilData.descripcion}
                            onChange={e => setCpreAgilData({ ...cpreAgilData, descripcion: e.target.value })}
                            placeholder="Descripción del servicio que se estará brindando bajo el marco ágil..." />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-gray-500 mb-1">Motivo del Tipo de Inicio</label>
                          <input className={inpStyle} value={cpreAgilData.motivo}
                            onChange={e => setCpreAgilData({ ...cpreAgilData, motivo: e.target.value })}
                            placeholder="Ej. Cambios emergentes a la legislación fiscal" />
                        </div>
                      </div>
                    </div>

                    {/* Información del Sprint */}
                    <div className="bg-white border border-gray-100 rounded-xl overflow-hidden shadow-xs">
                      <div className="px-5 py-3.5 bg-gray-50/50 border-b border-gray-100 font-bold text-xs text-gray-700 uppercase tracking-wider">
                        <span className="flex items-center gap-2"><GitBranch size={15} className="text-gray-400" /> Información del Sprint</span>
                      </div>
                      <div className="p-5 grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[11px] font-semibold text-gray-500 mb-1">Fecha de Inicio del Sprint</label>
                          <input type="date" className={inpStyle} value={cpreAgilData.fechaInicioSprint}
                            onChange={e => setCpreAgilData({ ...cpreAgilData, fechaInicioSprint: e.target.value })} />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-gray-500 mb-1">Fecha Fin del Sprint</label>
                          <input type="date" className={inpStyle} value={cpreAgilData.fechaFinSprint}
                            onChange={e => setCpreAgilData({ ...cpreAgilData, fechaFinSprint: e.target.value })} />
                        </div>
                        <div className="col-span-2">
                          <label className="block text-[11px] font-semibold text-gray-500 mb-1">Backlog (priorizado)</label>
                          <textarea className={`${inpStyle} resize-none`} rows={2} value={cpreAgilData.backlogPriorizado}
                            onChange={e => setCpreAgilData({ ...cpreAgilData, backlogPriorizado: e.target.value })}
                            placeholder="Lista priorizada de elementos del backlog a atender..." />
                        </div>
                        <div className="col-span-2">
                          <label className="block text-[11px] font-semibold text-gray-500 mb-1">Historias de Usuario a Ejecutar</label>
                          <textarea className={`${inpStyle} resize-none`} rows={2} value={cpreAgilData.historiasUsuario}
                            onChange={e => setCpreAgilData({ ...cpreAgilData, historiasUsuario: e.target.value })}
                            placeholder="Para Sprint 0 este campo no aplica..." />
                        </div>
                      </div>
                    </div>

                    {/* Release Plan a alto nivel */}
                    <div className="bg-white border border-gray-100 rounded-xl overflow-hidden shadow-xs">
                      <div className="px-5 py-3.5 bg-gray-50/50 border-b border-gray-100 font-bold text-xs text-gray-700 uppercase tracking-wider">
                        <span className="flex items-center gap-2"><BarChart2 size={15} className="text-gray-400" /> Release Plan a Alto Nivel</span>
                      </div>
                      <div className="p-5 overflow-x-auto">
                        <table className="w-full border-collapse">
                          <thead>
                            <tr>
                              <th className={thStyle}>Sprint</th>
                              {[1, 2, 3, 4, 5, 6].map(sem => <th key={sem} className={`${thStyle} text-center`}>Semana {sem}</th>)}
                              <th className={thStyle} style={{ width: 50 }} />
                            </tr>
                          </thead>
                          <tbody>
                            {cpreAgilSprints.map((s, i) => (
                              <tr key={i} className="hover:bg-gray-50/30">
                                <td className={tdStyle}><input className={inpStyle} defaultValue={s.sprint} /></td>
                                {s.semanas.map((sem, j) => (
                                  <td key={j} className={tdStyle}>
                                    <select className={inpStyle} defaultValue={sem}>
                                      <option value="">—</option>
                                      <option value="Ejecución">Ejecución</option>
                                      <option value="Review">Review</option>
                                      <option value="Release">Release</option>
                                    </select>
                                  </td>
                                ))}
                                <td className={tdStyle}>
                                  <button onClick={() => setCpreAgilSprints(cpreAgilSprints.filter((_, j) => j !== i))}
                                    className="text-gray-400 hover:text-red-600 transition-all p-1">
                                    <Trash2 size={14} />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        <button onClick={() => setCpreAgilSprints([...cpreAgilSprints, { sprint: `S${cpreAgilSprints.length + 1}`, semanas: ['', '', '', '', '', ''] }])}
                          className="mt-3 flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-dashed border-gray-300 text-xs font-semibold text-gray-600 hover:bg-gray-50">
                          <Plus size={13} /> Añadir Sprint
                        </button>
                      </div>
                    </div>

                    {/* Listado de actividades */}
                    <div className="bg-white border border-gray-100 rounded-xl overflow-hidden shadow-xs">
                      <div className="px-5 py-3.5 bg-gray-50/50 border-b border-gray-100 font-bold text-xs text-gray-700 uppercase tracking-wider">
                        <span className="flex items-center gap-2"><CheckCircle2 size={15} className="text-gray-400" /> Listado de Actividades a Ejecutar</span>
                      </div>
                      <div className="p-5">
                        <table className="w-full border-collapse">
                          <thead>
                            <tr>
                              <th className={thStyle}>#</th>
                              <th className={thStyle}>Actividad</th>
                              <th className={thStyle}>Descripción</th>
                              <th className={thStyle}>Fecha</th>
                              <th className={thStyle} style={{ width: 50 }} />
                            </tr>
                          </thead>
                          <tbody>
                            {cpreAgilActividades.map((a, i) => (
                              <tr key={i} className="hover:bg-gray-50/30">
                                <td className={`${tdStyle} text-center font-medium text-gray-400`}>{i + 1}</td>
                                <td className={tdStyle}><input className={inpStyle} defaultValue={a.actividad} /></td>
                                <td className={tdStyle}><input className={inpStyle} defaultValue={a.desc} /></td>
                                <td className={tdStyle}><input type="date" className={inpStyle} defaultValue={a.fecha} /></td>
                                <td className={tdStyle}>
                                  <button onClick={() => setCpreAgilActividades(cpreAgilActividades.filter((_, j) => j !== i))}
                                    className="text-gray-400 hover:text-red-600 transition-all p-1">
                                    <Trash2 size={14} />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        <button onClick={() => setCpreAgilActividades([...cpreAgilActividades, { actividad: '', desc: '', fecha: '' }])}
                          className="mt-3 flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-dashed border-gray-300 text-xs font-semibold text-gray-600 hover:bg-gray-50">
                          <Plus size={13} /> Añadir Actividad
                        </button>
                      </div>
                    </div>

                    {/* Esfuerzo estimado */}
                    <div className="bg-white border border-gray-100 rounded-xl overflow-hidden shadow-xs">
                      <div className="px-5 py-3.5 bg-gray-50/50 border-b border-gray-100 font-bold text-xs text-gray-700 uppercase tracking-wider">
                        <span className="flex items-center gap-2"><DollarSign size={15} className="text-gray-400" /> Esfuerzo Estimado</span>
                      </div>
                      <div className="p-5">
                        <table className="w-full border-collapse">
                          <thead>
                            <tr>
                              <th className={thStyle}>Tipo de Perfil</th>
                              <th className={thStyle}>Cantidad</th>
                              <th className={thStyle}>Esfuerzo x Perfil (Hrs)</th>
                              <th className={thStyle}>Factor Equiv.</th>
                              <th className={thStyle}>Subtotal de Unidades</th>
                              <th className={thStyle} style={{ width: 50 }} />
                            </tr>
                          </thead>
                          <tbody>
                            {cpreAgilCostos.map((c, i) => (
                              <tr key={i} className="hover:bg-gray-50/30">
                                <td className={tdStyle}><input className={inpStyle} defaultValue={c.perfil} /></td>
                                <td className={tdStyle}><input type="number" className={inpStyle} defaultValue={c.cantidad} /></td>
                                <td className={tdStyle}><input type="number" className={inpStyle} defaultValue={c.esfuerzo} /></td>
                                <td className={tdStyle}><input type="number" className={inpStyle} defaultValue={c.factor} /></td>
                                <td className={tdStyle}><input type="number" className={inpStyle} defaultValue={c.subtotalUnidades} /></td>
                                <td className={tdStyle}>
                                  <button onClick={() => setCpreAgilCostos(cpreAgilCostos.filter((_, j) => j !== i))}
                                    className="text-gray-400 hover:text-red-600 transition-all p-1">
                                    <Trash2 size={14} />
                                  </button>
                                </td>
                              </tr>
                            ))}
                            <tr className="bg-gray-50/60">
                              <td colSpan={4} className={`${tdStyle} text-right font-semibold text-gray-500`}>Esfuerzo Estimado Total:</td>
                              <td className={tdStyle}>
                                <div className="px-3 py-1.5 text-xs font-bold text-gray-800 bg-gray-100 rounded-lg text-center border border-gray-200">
                                  {cpreAgilCostos.reduce((s, c) => s + (parseFloat(c.subtotalUnidades) || 0), 0).toFixed(2)} Hrs.
                                </div>
                              </td>
                              <td />
                            </tr>
                          </tbody>
                        </table>
                        <button onClick={() => setCpreAgilCostos([...cpreAgilCostos, { perfil: '', cantidad: '0', esfuerzo: '0', factor: '1', subtotalUnidades: '0' }])}
                          className="mt-3 flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-dashed border-gray-300 text-xs font-semibold text-gray-600 hover:bg-gray-50">
                          <Plus size={13} /> Añadir Perfil
                        </button>
                        <p className="text-[10px] text-gray-400 mt-2">
                          Este esfuerzo se integrará a la PSE y CAPA que el Proveedor entregue al SAT. La aprobación de esta Carta Preliminar no podrá exceder 8 hrs, de lo contrario las fechas de inicio se recorrerán.
                        </p>
                      </div>
                    </div>

                    {/* Entregables */}
                    <div className="bg-white border border-gray-100 rounded-xl overflow-hidden shadow-xs">
                      <div className="px-5 py-3.5 bg-gray-50/50 border-b border-gray-100 font-bold text-xs text-gray-700 uppercase tracking-wider">
                        <span className="flex items-center gap-2"><CheckCircle2 size={15} className="text-gray-400" /> Entregables</span>
                      </div>
                      <div className="p-5">
                        <table className="w-full border-collapse">
                          <thead>
                            <tr>
                              <th className={thStyle}>#</th>
                              <th className={thStyle}>Nombre del Producto</th>
                              <th className={thStyle}>Descripción</th>
                              <th className={thStyle}>Formato/Herramienta</th>
                              <th className={thStyle}>Responsable de Aprobación</th>
                              <th className={thStyle} style={{ width: 50 }} />
                            </tr>
                          </thead>
                          <tbody>
                            {cpreAgilEntregables.map((e, i) => (
                              <tr key={i} className="hover:bg-gray-50/30">
                                <td className={`${tdStyle} text-center font-medium text-gray-400`}>{i + 1}</td>
                                <td className={tdStyle}><input className={inpStyle} defaultValue={e.nombre} /></td>
                                <td className={tdStyle}><input className={inpStyle} defaultValue={e.desc} /></td>
                                <td className={tdStyle}><input className={inpStyle} defaultValue={e.formato} /></td>
                                <td className={tdStyle}><input className={inpStyle} defaultValue={e.responsableAprobacion} /></td>
                                <td className={tdStyle}>
                                  <button onClick={() => setCpreAgilEntregables(cpreAgilEntregables.filter((_, j) => j !== i))}
                                    className="text-gray-400 hover:text-red-600 transition-all p-1">
                                    <Trash2 size={14} />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        <button onClick={() => setCpreAgilEntregables([...cpreAgilEntregables, { nombre: '', desc: '', formato: '', responsableAprobacion: '' }])}
                          className="mt-3 flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-dashed border-gray-300 text-xs font-semibold text-gray-600 hover:bg-gray-50">
                          <Plus size={13} /> Añadir Entregable
                        </button>
                        <p className="text-[10px] text-gray-400 mt-2 space-y-1">
                          Este esfuerzo se integrará a la PSE y CAPA. Una vez ejecutado más del 50% de una historia de usuario, ésta no podrá tener cambios ni ser cancelada. La documentación de cada Sprint debe ser aprobada antes de iniciar el siguiente.
                        </p>
                      </div>
                    </div>

                    {/* Firmas (12 firmantes) */}
                    <div className="bg-white border border-gray-100 rounded-xl overflow-hidden shadow-xs">
                      <div className="px-5 py-3.5 bg-gray-50/50 border-b border-gray-100 font-bold text-xs text-red-950 uppercase tracking-wider">
                        <span className="flex items-center gap-2"><ShieldCheck size={15} className="text-red-900" /> Firmas de Conformidad</span>
                      </div>
                      <div className="p-5">
                        <div className="grid grid-cols-2 gap-4">
                          {firmantesCpreAgil.map(f => (
                            <div key={f.id} className="border border-gray-100 bg-white rounded-xl p-4 flex flex-col justify-between shadow-xs">
                              <div>
                                <div className="flex justify-between items-start mb-2">
                                  <h5 className="text-xs font-bold text-gray-900">{f.rol}</h5>
                                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${f.estado === 'Firmado' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>
                                    {f.estado === 'Firmado' ? 'Firmado' : 'Pendiente'}
                                  </span>
                                </div>
                                <div className="space-y-2 mb-3">
                                  <div>
                                    <label className="block text-[10px] font-semibold text-gray-400 mb-0.5">Nombre</label>
                                    <input className={inpStyle} value={f.nombre} disabled={f.estado === 'Firmado'}
                                      onChange={e => actualizarFirmanteCpreAgil(f.id, 'nombre', e.target.value)}
                                      placeholder="Nombre completo" />
                                  </div>
                                  <div>
                                    <label className="block text-[10px] font-semibold text-gray-400 mb-0.5">Puesto</label>
                                    <input className={inpStyle} value={f.puesto} disabled={f.estado === 'Firmado'}
                                      onChange={e => actualizarFirmanteCpreAgil(f.id, 'puesto', e.target.value)}
                                      placeholder={f.placeholderPuesto} />
                                  </div>
                                </div>
                                <div className="space-y-1 bg-gray-50 p-2.5 rounded-lg border border-gray-100 font-mono text-[10px] text-gray-500 mb-4">
                                  <div><span className="font-sans font-semibold text-gray-400">Fecha:</span> {f.fecha || '—'}</div>
                                  <div className="truncate"><span className="font-sans font-semibold text-gray-400">Hash:</span> {f.hash}</div>
                                </div>
                              </div>
                              {f.estado === 'Pendiente' ? (
                                <button onClick={() => ejecutarFirmaCpreAgil(f.id)}
                                  disabled={!f.nombre.trim() || !f.puesto.trim()}
                                  title={!f.nombre.trim() || !f.puesto.trim() ? 'Captura nombre y puesto primero' : ''}
                                  className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-white transition-all hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
                                  style={{ background: 'linear-gradient(135deg, #7c3aed 0%, #9333ea 100%)' }}>
                                  <Pen size={12} /> Firmar Digitalmente
                                </button>
                              ) : (
                                <div className="text-center py-2 bg-emerald-50/40 border border-dashed border-emerald-200 text-emerald-700 text-xs font-semibold rounded-lg flex items-center justify-center gap-1">
                                  <CheckCircle2 size={13} /> Firma Estampada
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Acciones CPRE Ágil */}
                    <div className="flex items-center justify-between gap-3">
                      <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50 transition-all">
                        <Download size={13} /> Generar PDF
                      </button>
                      <div className="flex gap-3">
                        <button
                          onClick={() => { setMostrarCartaPreliminar(false); setCartaPreliminarDecidida(true) }}
                          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50 transition-all">
                          Omitir
                        </button>
                        <button
                          onClick={() => { setCartaPreliminarRellena(true); setCartaPreliminarDecidida(true) }}
                          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-white transition-all hover:opacity-90"
                          style={{ background: '#d97706' }}>
                          <Check size={13} /> Guardar Carta Preliminar
                        </button>
                      </div>
                    </div>
                  </div>
                )
              )}

              {cartaPreliminarDecidida && (
                <div className="p-3 rounded-lg flex items-center gap-2"
                  style={{ background: cartaPreliminarRellena ? 'rgba(5,150,105,0.06)' : '#f9fafb',
                           border: `1px solid ${cartaPreliminarRellena ? '#a7f3d0' : '#e5e7eb'}` }}>
                  <CheckCircle2 size={14} style={{ color: cartaPreliminarRellena ? '#059669' : '#9ca3af' }} />
                  <p className="text-xs font-semibold" style={{ color: cartaPreliminarRellena ? '#059669' : '#6b7280' }}>
                    {cartaPreliminarRellena ? 'Carta Preliminar completada.' : 'Carta Preliminar omitida.'}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* CTA para avanzar */}
          {inicioCompleto && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CheckCircle2 size={18} className="text-emerald-600" />
                <div>
                  <p className="text-sm font-bold text-emerald-800">Sección Inicio completada</p>
                  <p className="text-xs text-emerald-600">
                    Marco: {marcoEfectivo}{marcoPendiente ? ' (por definir — usando Cascada por defecto)' : ''} · Puedes avanzar a Estimación / Actividades
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSeccionActual('estimacion')}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90"
                style={{ background: 'linear-gradient(135deg, #059669 0%, #34d399 100%)' }}>
                Ir a Estimación <ChevronRight size={15} />
              </button>
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
          SECCIÓN 2: ESTIMACIÓN / ACTIVIDADES
          ══════════════════════════════════════════════════════════ */}
      {seccionActual === 'estimacion' && (
        <div className="space-y-5 animate-fade-in">
          <div className="bg-white rounded-xl border border-gray-100 p-5"
            style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            <div className="mb-5">
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <BarChart2 size={15} style={{ color: '#6B1A2A' }} />
                Estimación y Actividades
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">
                Documentos de estimación inicial · Marco: <strong>{marcoEfectivo}</strong>
              </p>
            </div>

            {/* ── CAPA ── */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'rgba(107,26,42,0.08)' }}>
                  <FileText size={13} style={{ color: '#6B1A2A' }} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-gray-900">Carta de Aceptación de la Propuesta (CAPA)</h4>
                  <p className="text-[10px] text-gray-400">Formaliza la aceptación del cliente a la propuesta presentada</p>
                </div>
              </div>

              {marcoEfectivo === 'Cascada' ? (
                <div className="space-y-5">
                  {/* Identificación */}
                  <div className="bg-white border border-gray-100 rounded-xl overflow-hidden shadow-xs">
                    <div className="px-5 py-3.5 bg-gray-50/50 border-b border-gray-100 font-bold text-xs text-gray-700 uppercase tracking-wider">
                      <span className="flex items-center gap-2"><FileText size={15} className="text-gray-400" /> Identificación del Requerimiento</span>
                    </div>
                    <div className="p-5 grid grid-cols-3 gap-4">
                      <div>
                        <label className="block text-[11px] font-semibold text-gray-500 mb-1">ID Requerimiento</label>
                        <input className={inpStyle} defaultValue="100100" />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-gray-500 mb-1">ID Estimación</label>
                        <input className={inpStyle} defaultValue="105001" />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-gray-500 mb-1">Tipo de Estimación</label>
                        <select className={inpStyle} defaultValue="Estimación alto nivel">
                          <option>Estimación alto nivel</option>
                          <option>Segunda estimación</option>
                        </select>
                      </div>
                      <div className="col-span-2">
                        <label className="block text-[11px] font-semibold text-gray-500 mb-1">Nombre de Requerimiento</label>
                        <input className={inpStyle} defaultValue={iniciativa.nombre} />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-gray-500 mb-1">Fecha de Entrega</label>
                        <input type="date" className={inpStyle} />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-gray-500 mb-1">Nombre (Responsable Proveedor)</label>
                        <input className={inpStyle} placeholder="Nombre completo" />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-gray-500 mb-1">Puesto</label>
                        <input className={inpStyle} placeholder="Puesto del responsable" />
                      </div>
                      <div className="col-span-3">
                        <label className="block text-[11px] font-semibold text-gray-500 mb-1">Proyecto</label>
                        <input className={inpStyle} defaultValue={iniciativa.nombre} />
                      </div>
                    </div>
                  </div>

                  {/* Productos de la estimación a alto nivel */}
                  <div className="bg-white border border-gray-100 rounded-xl overflow-hidden shadow-xs">
                    <div className="px-5 py-3.5 bg-gray-50/50 border-b border-gray-100 font-bold text-xs text-gray-700 uppercase tracking-wider">
                      <span className="flex items-center gap-2"><CheckCircle2 size={15} className="text-gray-400" /> Productos de la Estimación (Iteración 1)</span>
                    </div>
                    <div className="p-5">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr>
                            <th className={thStyle}>#</th>
                            <th className={thStyle}>Nombre del Producto</th>
                            <th className={thStyle}>Descripción</th>
                            <th className={thStyle}>Formato/Herramienta</th>
                            <th className={thStyle}>Fecha Compromiso</th>
                            <th className={thStyle} style={{ width: 50 }} />
                          </tr>
                        </thead>
                        <tbody>
                          {capaProductos.map((p, i) => (
                            <tr key={i} className="hover:bg-gray-50/30">
                              <td className={`${tdStyle} text-center font-medium text-gray-400`}>{i + 1}</td>
                              <td className={tdStyle}><input className={inpStyle} defaultValue={p.nombre} /></td>
                              <td className={tdStyle}><input className={inpStyle} defaultValue={p.desc} /></td>
                              <td className={tdStyle}><input className={inpStyle} defaultValue={p.formato} /></td>
                              <td className={tdStyle}><input type="date" className={inpStyle} defaultValue={p.fecha} /></td>
                              <td className={tdStyle}>
                                <button onClick={() => setCapaProductos(capaProductos.filter((_, j) => j !== i))}
                                  className="text-gray-400 hover:text-red-600 transition-all p-1">
                                  <Trash2 size={14} />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      <button onClick={() => setCapaProductos([...capaProductos, { nombre: '', desc: '', formato: '', fecha: '' }])}
                        className="mt-3 flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-dashed border-gray-300 text-xs font-semibold text-gray-600 hover:bg-gray-50">
                        <Plus size={13} /> Añadir Producto
                      </button>
                    </div>
                  </div>

                  {/* Requisitos funcionales */}
                  <div className="bg-white border border-gray-100 rounded-xl overflow-hidden shadow-xs">
                    <div className="px-5 py-3.5 bg-gray-50/50 border-b border-gray-100 font-bold text-xs text-gray-700 uppercase tracking-wider">
                      <span className="flex items-center gap-2"><Star size={15} className="text-gray-400" /> Requisitos Funcionales</span>
                    </div>
                    <div className="p-5">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr>
                            <th className={thStyle}>#</th>
                            <th className={thStyle}>Requisito Funcional</th>
                            <th className={thStyle}>Ponderación (%)</th>
                            <th className={thStyle}>Observaciones</th>
                            <th className={thStyle} style={{ width: 50 }} />
                          </tr>
                        </thead>
                        <tbody>
                          {capaRequisitos.map((r, i) => (
                            <tr key={i} className="hover:bg-gray-50/30">
                              <td className={`${tdStyle} text-center font-medium text-gray-400`}>{i + 1}</td>
                              <td className={tdStyle}><input className={inpStyle} defaultValue={r.nombre} /></td>
                              <td className={tdStyle}><input type="number" className={inpStyle} defaultValue={r.pond} /></td>
                              <td className={tdStyle}><input className={inpStyle} defaultValue={r.obs} /></td>
                              <td className={tdStyle}>
                                <button onClick={() => setCapaRequisitos(capaRequisitos.filter((_, j) => j !== i))}
                                  className="text-gray-400 hover:text-red-600 transition-all p-1">
                                  <Trash2 size={14} />
                                </button>
                              </td>
                            </tr>
                          ))}
                          <tr className="bg-gray-50/60">
                            <td colSpan={2} className={`${tdStyle} text-right font-semibold text-gray-500`}>Total (debe sumar 100%):</td>
                            <td className={tdStyle}>
                              <div className="px-3 py-1.5 text-xs font-bold text-gray-800 bg-gray-100 rounded-lg text-center border border-gray-200">
                                {capaRequisitos.reduce((s, r) => s + (parseFloat(r.pond) || 0), 0)}%
                              </div>
                            </td>
                            <td colSpan={2} />
                          </tr>
                        </tbody>
                      </table>
                      <button onClick={() => setCapaRequisitos([...capaRequisitos, { nombre: '', pond: '0', obs: '' }])}
                        className="mt-3 flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-dashed border-gray-300 text-xs font-semibold text-gray-600 hover:bg-gray-50">
                        <Plus size={13} /> Añadir Requisito
                      </button>
                      <p className="text-[10px] text-gray-400 mt-2">
                        Si el requerimiento no afecta funcionalidad, indicar: "El Requerimiento de Servicio de SDMA no requiere funcionalidad".
                      </p>
                    </div>
                  </div>

                  {/* Plan del proyecto */}
                  <div className="bg-white border border-gray-100 rounded-xl overflow-hidden shadow-xs">
                    <div className="px-5 py-3.5 bg-gray-50/50 border-b border-gray-100 font-bold text-xs text-gray-700 uppercase tracking-wider">
                      <span className="flex items-center gap-2"><BarChart2 size={15} className="text-gray-400" /> Información del Plan del Proyecto</span>
                    </div>
                    <div className="p-5 grid grid-cols-3 gap-4">
                      <div>
                        <label className="block text-[11px] font-semibold text-gray-500 mb-1">Duración del proyecto (días hábiles)</label>
                        <input type="number" className={inpStyle} placeholder="Ej. 30" />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-gray-500 mb-1">Esfuerzo asignado al Proveedor (Hrs)</label>
                        <input type="number" className={inpStyle} placeholder="Ej. 300.53" />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-gray-500 mb-1">Esfuerzo asignado al SAT (Hrs)</label>
                        <input type="number" className={inpStyle} placeholder="Ej. 100.00" />
                      </div>
                      <div className="col-span-3">
                        <label className="block text-[11px] font-semibold text-gray-500 mb-1">Anexo PDT (nombre del documento)</label>
                        <input className={inpStyle} placeholder="Ej. PDT_Iteracion1_v1.0.mpp" />
                      </div>
                    </div>
                  </div>

                  {/* Costo del requerimiento */}
                  <div className="bg-white border border-gray-100 rounded-xl overflow-hidden shadow-xs">
                    <div className="px-5 py-3.5 bg-gray-50/50 border-b border-gray-100 font-bold text-xs text-gray-700 uppercase tracking-wider">
                      <span className="flex items-center gap-2"><DollarSign size={15} className="text-gray-400" /> Costo del Requerimiento de Servicio</span>
                    </div>
                    <div className="p-5">
                      <p className="text-[10px] text-gray-400 mb-3">No se deben mezclar tipos de unidad. Las cantidades se expresan en formato de horas (ej. 723.61).</p>
                      <table className="w-full border-collapse">
                        <thead>
                          <tr>
                            <th className={thStyle}>Tipo de Perfil</th>
                            <th className={thStyle}>Cantidad</th>
                            <th className={thStyle}>Esfuerzo x Perfil (Hrs)</th>
                            <th className={thStyle}>Subtotal (Hrs)</th>
                            <th className={thStyle}>Factor Equiv.</th>
                            <th className={thStyle}>Tipo Unidad</th>
                            <th className={thStyle}>Subtotal Unidades</th>
                            <th className={thStyle} style={{ width: 50 }} />
                          </tr>
                        </thead>
                        <tbody>
                          {capaCostos.map((c, i) => (
                            <tr key={i} className="hover:bg-gray-50/30">
                              <td className={tdStyle}><input className={inpStyle} defaultValue={c.perfil} /></td>
                              <td className={tdStyle}><input type="number" className={inpStyle} defaultValue={c.cantidad} /></td>
                              <td className={tdStyle}><input type="number" className={inpStyle} defaultValue={c.esfuerzo} /></td>
                              <td className={tdStyle}><input type="number" className={inpStyle} defaultValue={c.subtotal} /></td>
                              <td className={tdStyle}><input type="number" className={inpStyle} defaultValue={c.factor} /></td>
                              <td className={tdStyle}><input className={inpStyle} defaultValue={c.unidad} /></td>
                              <td className={tdStyle}><input type="number" className={inpStyle} defaultValue={c.subtotalUnidades} /></td>
                              <td className={tdStyle}>
                                <button onClick={() => setCapaCostos(capaCostos.filter((_, j) => j !== i))}
                                  className="text-gray-400 hover:text-red-600 transition-all p-1">
                                  <Trash2 size={14} />
                                </button>
                              </td>
                            </tr>
                          ))}
                          <tr className="bg-gray-50/60">
                            <td colSpan={6} className={`${tdStyle} text-right font-semibold text-gray-500`}>Total de Unidades:</td>
                            <td className={tdStyle}>
                              <div className="px-3 py-1.5 text-xs font-bold text-gray-800 bg-gray-100 rounded-lg text-center border border-gray-200">
                                {capaCostos.reduce((s, c) => s + (parseFloat(c.subtotalUnidades) || 0), 0).toFixed(2)}
                              </div>
                            </td>
                            <td />
                          </tr>
                        </tbody>
                      </table>
                      <button onClick={() => setCapaCostos([...capaCostos, { perfil: '', cantidad: '0', esfuerzo: '0', subtotal: '0', factor: '1', unidad: 'UDA', subtotalUnidades: '0' }])}
                        className="mt-3 flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-dashed border-gray-300 text-xs font-semibold text-gray-600 hover:bg-gray-50">
                        <Plus size={13} /> Añadir Perfil
                      </button>
                    </div>
                  </div>

                  {/* Iteración / Unidades totales / CAPA relacionada / Estado */}
                  <div className="bg-white border border-gray-100 rounded-xl overflow-hidden shadow-xs">
                    <div className="px-5 py-3.5 bg-gray-50/50 border-b border-gray-100 font-bold text-xs text-gray-700 uppercase tracking-wider">
                      <span className="flex items-center gap-2"><RefreshCw size={15} className="text-gray-400" /> Control de Iteraciones</span>
                    </div>
                    <div className="p-5">
                      <p className="text-[10px] text-gray-400 mb-3">
                        No aplica para requerimientos atendidos mediante Costo fijo mensual (continuidad operativa y línea base) — en ese caso usar "--".
                      </p>
                      <table className="w-full border-collapse">
                        <thead>
                          <tr>
                            <th className={thStyle}>Iteración</th>
                            <th className={thStyle}>Unidades Totales de la Iteración</th>
                            <th className={thStyle}>CAPA Relacionada</th>
                            <th className={thStyle}>Estado</th>
                            <th className={thStyle} style={{ width: 50 }} />
                          </tr>
                        </thead>
                        <tbody>
                          {capaIteraciones.map((it, i) => (
                            <tr key={i} className="hover:bg-gray-50/30">
                              <td className={tdStyle}><input className={inpStyle} defaultValue={it.iteracion} /></td>
                              <td className={tdStyle}><input className={inpStyle} defaultValue={it.unidadesTotales} /></td>
                              <td className={tdStyle}><input className={inpStyle} defaultValue={it.capaRelacionada} placeholder="Ej. XX_XXX_CAPA_XXX_PXXX_EXXXX" /></td>
                              <td className={tdStyle}>
                                <select className={inpStyle} defaultValue={it.estado}>
                                  <option>Esfuerzo pendiente de cobro</option>
                                  <option>Esfuerzo cobrado</option>
                                </select>
                              </td>
                              <td className={tdStyle}>
                                <button onClick={() => setCapaIteraciones(capaIteraciones.filter((_, j) => j !== i))}
                                  className="text-gray-400 hover:text-red-600 transition-all p-1">
                                  <Trash2 size={14} />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      <button onClick={() => setCapaIteraciones([...capaIteraciones, { iteracion: `Iteración ${capaIteraciones.length + 1}`, unidadesTotales: '', capaRelacionada: '', estado: 'Esfuerzo pendiente de cobro' }])}
                        className="mt-3 flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-dashed border-gray-300 text-xs font-semibold text-gray-600 hover:bg-gray-50">
                        <Plus size={13} /> Añadir Iteración
                      </button>
                    </div>
                  </div>

                  {/* Firmas */}
                  <div className="bg-white border border-gray-100 rounded-xl overflow-hidden shadow-xs">
                    <div className="px-5 py-3.5 bg-gray-50/50 border-b border-gray-100 font-bold text-xs text-red-950 uppercase tracking-wider">
                      <span className="flex items-center gap-2"><ShieldCheck size={15} className="text-red-900" /> Firmas de Conformidad</span>
                    </div>
                    <div className="p-5">
                      <div className="grid grid-cols-2 gap-4">
                        {firmantesCapa.map(f => (
                          <div key={f.id} className="border border-gray-100 bg-white rounded-xl p-4 flex flex-col justify-between shadow-xs">
                            <div>
                              <div className="flex justify-between items-start mb-2">
                                <h5 className="text-xs font-bold text-gray-900">{f.rol}</h5>
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${f.estado === 'Firmado' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>
                                  {f.estado === 'Firmado' ? 'Firmado' : 'Pendiente'}
                                </span>
                              </div>
                              <div className="space-y-2 mb-3">
                                <div>
                                  <label className="block text-[10px] font-semibold text-gray-400 mb-0.5">Nombre</label>
                                  <input className={inpStyle} value={f.nombre} disabled={f.estado === 'Firmado'}
                                    onChange={e => actualizarFirmanteCapa(f.id, 'nombre', e.target.value)}
                                    placeholder="Nombre completo" />
                                </div>
                                <div>
                                  <label className="block text-[10px] font-semibold text-gray-400 mb-0.5">Puesto</label>
                                  <input className={inpStyle} value={f.puesto} disabled={f.estado === 'Firmado'}
                                    onChange={e => actualizarFirmanteCapa(f.id, 'puesto', e.target.value)}
                                    placeholder="Puesto" />
                                </div>
                              </div>
                              <div className="space-y-1 bg-gray-50 p-2.5 rounded-lg border border-gray-100 font-mono text-[10px] text-gray-500 mb-4">
                                <div><span className="font-sans font-semibold text-gray-400">Fecha:</span> {f.fecha || '—'}</div>
                                <div className="truncate"><span className="font-sans font-semibold text-gray-400">Hash:</span> {f.hash}</div>
                              </div>
                            </div>
                            {f.estado === 'Pendiente' ? (
                              <button onClick={() => ejecutarFirmaCapa(f.id)}
                                disabled={!f.nombre.trim() || !f.puesto.trim()}
                                title={!f.nombre.trim() || !f.puesto.trim() ? 'Captura nombre y puesto primero' : ''}
                                className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-white transition-all hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
                                style={{ background: 'linear-gradient(135deg, #7c3aed 0%, #9333ea 100%)' }}>
                                <Pen size={12} /> Firmar Digitalmente
                              </button>
                            ) : (
                              <div className="text-center py-2 bg-emerald-50/40 border border-dashed border-emerald-200 text-emerald-700 text-xs font-semibold rounded-lg flex items-center justify-center gap-1">
                                <CheckCircle2 size={13} /> Firma Estampada
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Acciones CAPA */}
                  <div className="flex items-center justify-between">
                    <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50 transition-all">
                      <Download size={13} /> Generar PDF
                    </button>
                    <button
                      onClick={() => setEstimacionIniciada(true)}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold text-white transition-all hover:opacity-90"
                      style={{ background: 'linear-gradient(135deg, #6B1A2A 0%, #8B2339 100%)' }}>
                      <Check size={13} /> Guardar CAPA
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-5">
                  {/* Identificación */}
                  <div className="bg-white border border-gray-100 rounded-xl overflow-hidden shadow-xs">
                    <div className="px-5 py-3.5 bg-gray-50/50 border-b border-gray-100 font-bold text-xs text-gray-700 uppercase tracking-wider">
                      <span className="flex items-center gap-2"><FileText size={15} className="text-gray-400" /> Identificación del Requerimiento</span>
                    </div>
                    <div className="p-5 grid grid-cols-3 gap-4">
                      <div>
                        <label className="block text-[11px] font-semibold text-gray-500 mb-1">ID Requerimiento</label>
                        <input className={inpStyle} defaultValue="100100" />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-gray-500 mb-1">ID Estimación</label>
                        <input className={inpStyle} defaultValue="105001" />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-gray-500 mb-1">Fecha de Entrega</label>
                        <input type="date" className={inpStyle} />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-[11px] font-semibold text-gray-500 mb-1">Nombre de Requerimiento</label>
                        <input className={inpStyle} defaultValue={iniciativa.nombre} />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-gray-500 mb-1">Puesto (Responsable Proveedor)</label>
                        <input className={inpStyle} placeholder="Puesto" />
                      </div>
                    </div>
                  </div>

                  {/* Productos por Sprint */}
                  <div className="bg-white border border-gray-100 rounded-xl overflow-hidden shadow-xs">
                    <div className="px-5 py-3.5 bg-gray-50/50 border-b border-gray-100 font-bold text-xs text-gray-700 uppercase tracking-wider">
                      <span className="flex items-center gap-2"><CheckCircle2 size={15} className="text-gray-400" /> Productos del Proyecto</span>
                    </div>
                    <div className="p-5">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr>
                            <th className={thStyle}>#</th>
                            <th className={thStyle}>Sprint</th>
                            <th className={thStyle}>Nombre del Producto</th>
                            <th className={thStyle}>Descripción</th>
                            <th className={thStyle}>Formato/Herramienta</th>
                            <th className={thStyle}>Fecha Compromiso</th>
                            <th className={thStyle} style={{ width: 50 }} />
                          </tr>
                        </thead>
                        <tbody>
                          {capaAgilProductos.map((p, i) => (
                            <tr key={i} className="hover:bg-gray-50/30">
                              <td className={`${tdStyle} text-center font-medium text-gray-400`}>{i + 1}</td>
                              <td className={tdStyle}><input className={inpStyle} defaultValue={p.sprint} /></td>
                              <td className={tdStyle}><input className={inpStyle} defaultValue={p.nombre} /></td>
                              <td className={tdStyle}><input className={inpStyle} defaultValue={p.desc} /></td>
                              <td className={tdStyle}><input className={inpStyle} defaultValue={p.formato} /></td>
                              <td className={tdStyle}><input type="date" className={inpStyle} defaultValue={p.fecha} /></td>
                              <td className={tdStyle}>
                                <button onClick={() => setCapaAgilProductos(capaAgilProductos.filter((_, j) => j !== i))}
                                  className="text-gray-400 hover:text-red-600 transition-all p-1">
                                  <Trash2 size={14} />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      <button onClick={() => setCapaAgilProductos([...capaAgilProductos, { sprint: '', nombre: '', desc: '', formato: '', fecha: '' }])}
                        className="mt-3 flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-dashed border-gray-300 text-xs font-semibold text-gray-600 hover:bg-gray-50">
                        <Plus size={13} /> Añadir Producto
                      </button>
                    </div>
                  </div>

                  {/* Requisitos Funcionales */}
                  <div className="bg-white border border-gray-100 rounded-xl overflow-hidden shadow-xs">
                    <div className="px-5 py-3.5 bg-gray-50/50 border-b border-gray-100 font-bold text-xs text-gray-700 uppercase tracking-wider">
                      <span className="flex items-center gap-2"><Star size={15} className="text-gray-400" /> Requisitos Funcionales</span>
                    </div>
                    <div className="p-5">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr>
                            <th className={thStyle}>#</th>
                            <th className={thStyle}>Requisito Funcional</th>
                            <th className={thStyle}>Ponderación (%)</th>
                            <th className={thStyle}>Observaciones</th>
                            <th className={thStyle} style={{ width: 50 }} />
                          </tr>
                        </thead>
                        <tbody>
                          {capaAgilRequisitos.map((r, i) => (
                            <tr key={i} className="hover:bg-gray-50/30">
                              <td className={`${tdStyle} text-center font-medium text-gray-400`}>{i + 1}</td>
                              <td className={tdStyle}><input className={inpStyle} defaultValue={r.nombre} /></td>
                              <td className={tdStyle}><input type="number" className={inpStyle} defaultValue={r.pond} /></td>
                              <td className={tdStyle}><input className={inpStyle} defaultValue={r.obs} /></td>
                              <td className={tdStyle}>
                                <button onClick={() => setCapaAgilRequisitos(capaAgilRequisitos.filter((_, j) => j !== i))}
                                  className="text-gray-400 hover:text-red-600 transition-all p-1">
                                  <Trash2 size={14} />
                                </button>
                              </td>
                            </tr>
                          ))}
                          <tr className="bg-gray-50/60">
                            <td colSpan={2} className={`${tdStyle} text-right font-semibold text-gray-500`}>Total (debe sumar 100%):</td>
                            <td className={tdStyle}>
                              <div className="px-3 py-1.5 text-xs font-bold text-gray-800 bg-gray-100 rounded-lg text-center border border-gray-200">
                                {capaAgilRequisitos.reduce((s, r) => s + (parseFloat(r.pond) || 0), 0)}%
                              </div>
                            </td>
                            <td colSpan={2} />
                          </tr>
                        </tbody>
                      </table>
                      <button onClick={() => setCapaAgilRequisitos([...capaAgilRequisitos, { nombre: '', pond: '0', obs: '' }])}
                        className="mt-3 flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-dashed border-gray-300 text-xs font-semibold text-gray-600 hover:bg-gray-50">
                        <Plus size={13} /> Añadir Requisito
                      </button>
                    </div>
                  </div>

                  {/* Release Plan visual */}
                  <div className="bg-white border border-gray-100 rounded-xl overflow-hidden shadow-xs">
                    <div className="px-5 py-3.5 bg-gray-50/50 border-b border-gray-100 font-bold text-xs text-gray-700 uppercase tracking-wider">
                      <span className="flex items-center gap-2"><BarChart2 size={15} className="text-gray-400" /> Release Plan del Proyecto</span>
                    </div>
                    <div className="p-5 overflow-x-auto">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr>
                            <th className={thStyle}>Sprint</th>
                            {[1, 2, 3, 4, 5, 6].map(sem => <th key={sem} className={`${thStyle} text-center`}>Semana {sem}</th>)}
                            <th className={thStyle} style={{ width: 50 }} />
                          </tr>
                        </thead>
                        <tbody>
                          {capaAgilSprints.map((s, i) => (
                            <tr key={i} className="hover:bg-gray-50/30">
                              <td className={tdStyle}><input className={inpStyle} defaultValue={s.sprint} /></td>
                              {s.semanas.map((sem, j) => (
                                <td key={j} className={tdStyle}>
                                  <select className={inpStyle} defaultValue={sem}>
                                    <option value="">—</option>
                                    <option value="Ejecución">Ejecución</option>
                                    <option value="Review">Review</option>
                                    <option value="Release">Release</option>
                                  </select>
                                </td>
                              ))}
                              <td className={tdStyle}>
                                <button onClick={() => setCapaAgilSprints(capaAgilSprints.filter((_, j) => j !== i))}
                                  className="text-gray-400 hover:text-red-600 transition-all p-1">
                                  <Trash2 size={14} />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      <button onClick={() => setCapaAgilSprints([...capaAgilSprints, { sprint: `S${capaAgilSprints.length + 1}`, semanas: ['', '', '', '', '', ''] }])}
                        className="mt-3 flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-dashed border-gray-300 text-xs font-semibold text-gray-600 hover:bg-gray-50">
                        <Plus size={13} /> Añadir Sprint
                      </button>
                    </div>
                  </div>

                  {/* Listado de actividades */}
                  <div className="bg-white border border-gray-100 rounded-xl overflow-hidden shadow-xs">
                    <div className="px-5 py-3.5 bg-gray-50/50 border-b border-gray-100 font-bold text-xs text-gray-700 uppercase tracking-wider">
                      <span className="flex items-center gap-2"><CheckCircle2 size={15} className="text-gray-400" /> Listado de Actividades</span>
                    </div>
                    <div className="p-5">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr>
                            <th className={thStyle}>Sprint</th>
                            <th className={thStyle}>Actividad</th>
                            <th className={thStyle}>Descripción</th>
                            <th className={thStyle}>Fecha</th>
                            <th className={thStyle} style={{ width: 50 }} />
                          </tr>
                        </thead>
                        <tbody>
                          {capaAgilActividades.map((a, i) => (
                            <tr key={i} className="hover:bg-gray-50/30">
                              <td className={tdStyle}><input className={inpStyle} defaultValue={a.sprint} /></td>
                              <td className={tdStyle}><input className={inpStyle} defaultValue={a.actividad} /></td>
                              <td className={tdStyle}><input className={inpStyle} defaultValue={a.desc} /></td>
                              <td className={tdStyle}><input type="date" className={inpStyle} defaultValue={a.fecha} /></td>
                              <td className={tdStyle}>
                                <button onClick={() => setCapaAgilActividades(capaAgilActividades.filter((_, j) => j !== i))}
                                  className="text-gray-400 hover:text-red-600 transition-all p-1">
                                  <Trash2 size={14} />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      <button onClick={() => setCapaAgilActividades([...capaAgilActividades, { sprint: '', actividad: '', desc: '', fecha: '' }])}
                        className="mt-3 flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-dashed border-gray-300 text-xs font-semibold text-gray-600 hover:bg-gray-50">
                        <Plus size={13} /> Añadir Actividad
                      </button>
                    </div>
                  </div>

                  {/* Costo por Sprint */}
                  <div className="bg-white border border-gray-100 rounded-xl overflow-hidden shadow-xs">
                    <div className="px-5 py-3.5 bg-gray-50/50 border-b border-gray-100 font-bold text-xs text-gray-700 uppercase tracking-wider">
                      <span className="flex items-center gap-2"><DollarSign size={15} className="text-gray-400" /> Costo del Requerimiento de Servicio</span>
                    </div>
                    <div className="p-5">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr>
                            <th className={thStyle}>Sprint</th>
                            <th className={thStyle}>Tipo de Perfil</th>
                            <th className={thStyle}>Cantidad</th>
                            <th className={thStyle}>Esfuerzo x Perfil (Hrs)</th>
                            <th className={thStyle}>Subtotal (Hrs)</th>
                            <th className={thStyle}>Factor Equiv.</th>
                            <th className={thStyle}>Tipo Unidad</th>
                            <th className={thStyle}>Subtotal Unidades</th>
                            <th className={thStyle} style={{ width: 50 }} />
                          </tr>
                        </thead>
                        <tbody>
                          {capaAgilCostos.map((c, i) => (
                            <tr key={i} className="hover:bg-gray-50/30">
                              <td className={tdStyle}><input className={inpStyle} defaultValue={c.sprint} /></td>
                              <td className={tdStyle}><input className={inpStyle} defaultValue={c.perfil} /></td>
                              <td className={tdStyle}><input type="number" className={inpStyle} defaultValue={c.cantidad} /></td>
                              <td className={tdStyle}><input type="number" className={inpStyle} defaultValue={c.esfuerzo} /></td>
                              <td className={tdStyle}><input type="number" className={inpStyle} defaultValue={c.subtotal} /></td>
                              <td className={tdStyle}><input type="number" className={inpStyle} defaultValue={c.factor} /></td>
                              <td className={tdStyle}><input className={inpStyle} defaultValue={c.unidad} /></td>
                              <td className={tdStyle}><input type="number" className={inpStyle} defaultValue={c.subtotalUnidades} /></td>
                              <td className={tdStyle}>
                                <button onClick={() => setCapaAgilCostos(capaAgilCostos.filter((_, j) => j !== i))}
                                  className="text-gray-400 hover:text-red-600 transition-all p-1">
                                  <Trash2 size={14} />
                                </button>
                              </td>
                            </tr>
                          ))}
                          <tr className="bg-gray-50/60">
                            <td colSpan={7} className={`${tdStyle} text-right font-semibold text-gray-500`}>Total de Unidades:</td>
                            <td className={tdStyle}>
                              <div className="px-3 py-1.5 text-xs font-bold text-gray-800 bg-gray-100 rounded-lg text-center border border-gray-200">
                                {capaAgilCostos.reduce((s, c) => s + (parseFloat(c.subtotalUnidades) || 0), 0).toFixed(2)}
                              </div>
                            </td>
                            <td />
                          </tr>
                        </tbody>
                      </table>
                      <button onClick={() => setCapaAgilCostos([...capaAgilCostos, { sprint: '', perfil: '', cantidad: '0', esfuerzo: '0', subtotal: '0', factor: '1', unidad: 'UDA', subtotalUnidades: '0' }])}
                        className="mt-3 flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-dashed border-gray-300 text-xs font-semibold text-gray-600 hover:bg-gray-50">
                        <Plus size={13} /> Añadir Perfil
                      </button>
                    </div>
                  </div>

                  {/* Fábrica Interna + Tipo de Unidad / Totales (no aplica para Fábricas Internas) */}
                  <div className="bg-white border border-gray-100 rounded-xl overflow-hidden shadow-xs">
                    <div className="px-5 py-3.5 bg-gray-50/50 border-b border-gray-100 font-bold text-xs text-gray-700 uppercase tracking-wider">
                      <span className="flex items-center gap-2"><DollarSign size={15} className="text-gray-400" /> Tipo de Unidad / Totales por Unidades</span>
                    </div>
                    <div className="p-5 space-y-4">
                      <div>
                        <label className="block text-[11px] font-semibold text-gray-500 mb-1">¿Este Requerimiento de Servicio es atendido por una Fábrica Interna?</label>
                        <select className={inpStyle} style={{ maxWidth: 200 }} value={esFabricaInternaCapaAgil}
                          onChange={e => setEsFabricaInternaCapaAgil(e.target.value as 'Sí' | 'No' | '')}>
                          <option value="">Seleccionar...</option>
                          <option value="No">No</option>
                          <option value="Sí">Sí</option>
                        </select>
                      </div>

                      {esFabricaInternaCapaAgil === 'Sí' && (
                        <p className="text-xs text-gray-400 italic">
                          No aplica para Fábricas Internas. La tabla de Tipo de Unidad / Totales por Unidades no se requiere en este caso.
                        </p>
                      )}

                      {esFabricaInternaCapaAgil === 'No' && (
                        <div>
                          <p className="text-[10px] text-gray-400 mb-3">
                            Indicar el tipo de unidades aplicable al Requerimiento de Servicio y el total de unidades estimadas. Para Costo fijo mensual (continuidad operativa y línea base), usar "--".
                          </p>
                          <table className="w-full border-collapse">
                            <thead>
                              <tr>
                                <th className={thStyle}>Tipo de Unidad</th>
                                <th className={thStyle}>Totales por Unidades</th>
                                <th className={thStyle} style={{ width: 50 }} />
                              </tr>
                            </thead>
                            <tbody>
                              {capaAgilTotalesPorUnidad.map((t, i) => (
                                <tr key={i} className="hover:bg-gray-50/30">
                                  <td className={tdStyle}><input className={inpStyle} defaultValue={t.tipoUnidad} /></td>
                                  <td className={tdStyle}><input className={inpStyle} defaultValue={t.totalUnidades} /></td>
                                  <td className={tdStyle}>
                                    <button onClick={() => setCapaAgilTotalesPorUnidad(capaAgilTotalesPorUnidad.filter((_, j) => j !== i))}
                                      className="text-gray-400 hover:text-red-600 transition-all p-1">
                                      <Trash2 size={14} />
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                          <button onClick={() => setCapaAgilTotalesPorUnidad([...capaAgilTotalesPorUnidad, { tipoUnidad: '', totalUnidades: '' }])}
                            className="mt-3 flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-dashed border-gray-300 text-xs font-semibold text-gray-600 hover:bg-gray-50">
                            <Plus size={13} /> Añadir Tipo de Unidad
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Firmas */}
                  <div className="bg-white border border-gray-100 rounded-xl overflow-hidden shadow-xs">
                    <div className="px-5 py-3.5 bg-gray-50/50 border-b border-gray-100 font-bold text-xs text-red-950 uppercase tracking-wider">
                      <span className="flex items-center gap-2"><ShieldCheck size={15} className="text-red-900" /> Firmas de Conformidad</span>
                    </div>
                    <div className="p-5">
                      <div className="grid grid-cols-2 gap-4">
                        {firmantesCapaAgil.map(f => (
                          <div key={f.id} className="border border-gray-100 bg-white rounded-xl p-4 flex flex-col justify-between shadow-xs">
                            <div>
                              <div className="flex justify-between items-start mb-2">
                                <h5 className="text-xs font-bold text-gray-900">{f.rol}</h5>
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${f.estado === 'Firmado' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>
                                  {f.estado === 'Firmado' ? 'Firmado' : 'Pendiente'}
                                </span>
                              </div>
                              <div className="space-y-2 mb-3">
                                <div>
                                  <label className="block text-[10px] font-semibold text-gray-400 mb-0.5">Nombre</label>
                                  <input className={inpStyle} value={f.nombre} disabled={f.estado === 'Firmado'}
                                    onChange={e => actualizarFirmanteCapaAgil(f.id, 'nombre', e.target.value)}
                                    placeholder="Nombre completo" />
                                </div>
                                <div>
                                  <label className="block text-[10px] font-semibold text-gray-400 mb-0.5">Puesto</label>
                                  <input className={inpStyle} value={f.puesto} disabled={f.estado === 'Firmado'}
                                    onChange={e => actualizarFirmanteCapaAgil(f.id, 'puesto', e.target.value)}
                                    placeholder="Puesto" />
                                </div>
                              </div>
                              <div className="space-y-1 bg-gray-50 p-2.5 rounded-lg border border-gray-100 font-mono text-[10px] text-gray-500 mb-4">
                                <div><span className="font-sans font-semibold text-gray-400">Fecha:</span> {f.fecha || '—'}</div>
                                <div className="truncate"><span className="font-sans font-semibold text-gray-400">Hash:</span> {f.hash}</div>
                              </div>
                            </div>
                            {f.estado === 'Pendiente' ? (
                              <button onClick={() => ejecutarFirmaCapaAgil(f.id)}
                                disabled={!f.nombre.trim() || !f.puesto.trim()}
                                title={!f.nombre.trim() || !f.puesto.trim() ? 'Captura nombre y puesto primero' : ''}
                                className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-white transition-all hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
                                style={{ background: 'linear-gradient(135deg, #7c3aed 0%, #9333ea 100%)' }}>
                                <Pen size={12} /> Firmar Digitalmente
                              </button>
                            ) : (
                              <div className="text-center py-2 bg-emerald-50/40 border border-dashed border-emerald-200 text-emerald-700 text-xs font-semibold rounded-lg flex items-center justify-center gap-1">
                                <CheckCircle2 size={13} /> Firma Estampada
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Acciones CAPA Ágil */}
                  <div className="flex items-center justify-between">
                    <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50 transition-all">
                      <Download size={13} /> Generar PDF
                    </button>
                    <button
                      onClick={() => setEstimacionIniciada(true)}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold text-white transition-all hover:opacity-90"
                      style={{ background: 'linear-gradient(135deg, #6B1A2A 0%, #8B2339 100%)' }}>
                      <Check size={13} /> Guardar CAPA
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* ── PSE ── */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'rgba(2,132,199,0.08)' }}>
                  <FileText size={13} style={{ color: '#0284c7' }} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-gray-900">Propuesta de Servicio (PSE)</h4>
                  <p className="text-[10px] text-gray-400">Propuesta técnica y económica detallada del servicio</p>
                </div>
              </div>

              {marcoEfectivo === 'Cascada' ? (
                <div className="space-y-5">
                  {/* Identificación y antecedentes */}
                  <div className="bg-white border border-blue-100 rounded-xl overflow-hidden shadow-xs">
                    <div className="px-5 py-3.5 bg-blue-50/40 border-b border-blue-100 font-bold text-xs text-blue-900 uppercase tracking-wider">
                      <span className="flex items-center gap-2"><FileText size={15} className="text-blue-700" /> Identificación y Antecedentes</span>
                    </div>
                    <div className="p-5 space-y-4">
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <label className="block text-[11px] font-semibold text-gray-500 mb-1">ID Requerimiento</label>
                          <input className={inpStyle} defaultValue="100100" />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-gray-500 mb-1">ID Estimación</label>
                          <input className={inpStyle} defaultValue="105001" />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-gray-500 mb-1">Tipo de Estimación</label>
                          <select className={inpStyle} defaultValue="Estimación alto nivel">
                            <option>Estimación alto nivel</option>
                            <option>Segunda estimación</option>
                          </select>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[11px] font-semibold text-gray-500 mb-1">Número de Licitación / Adjudicación</label>
                          <input className={inpStyle} placeholder="Ej. LA-006E00001-E28-2022" />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-gray-500 mb-1">Número de Contrato</label>
                          <input className={inpStyle} placeholder="Ej. CS-300-LP-N-P-FP-025/22" />
                        </div>
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-gray-500 mb-1">Alcance del Requerimiento de Servicio</label>
                        <textarea className={`${inpStyle} resize-none`} rows={3}
                          placeholder="Describe con claridad el alcance del Requerimiento de Servicio (2 a 4 párrafos)..." />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-gray-500 mb-1">Objetivos y/o Beneficios</label>
                        <textarea className={`${inpStyle} resize-none`} rows={3}
                          placeholder="Antecedentes, necesidades a resolver, beneficios esperados, a quién beneficia..." />
                      </div>
                    </div>
                  </div>

                  {/* Propuesta de solución / Plan del proyecto */}
                  <div className="bg-white border border-gray-100 rounded-xl overflow-hidden shadow-xs">
                    <div className="px-5 py-3.5 bg-gray-50/50 border-b border-gray-100 font-bold text-xs text-gray-700 uppercase tracking-wider">
                      <span className="flex items-center gap-2"><BarChart2 size={15} className="text-gray-400" /> Propuesta de Solución y Plan del Proyecto</span>
                    </div>
                    <div className="p-5 space-y-4">
                      <div>
                        <label className="block text-[11px] font-semibold text-gray-500 mb-1">Actividades / Etapas a Ejecutar</label>
                        <textarea className={`${inpStyle} resize-none`} rows={3}
                          placeholder="Detalla las actividades y/o etapas, separadas por Servicio del SDMA (Definición de Requisitos, Diseño y Desarrollo, Soporte a Pruebas)..." />
                      </div>
                      <div className="grid grid-cols-4 gap-4">
                        <div>
                          <label className="block text-[11px] font-semibold text-gray-500 mb-1">Duración Total (días hábiles)</label>
                          <input type="number" className={inpStyle} placeholder="Ej. 45" />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-gray-500 mb-1">Fase de Análisis (días)</label>
                          <input type="number" className={inpStyle} placeholder="Ej. 10" />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-gray-500 mb-1">Esfuerzo Proveedor (Hrs)</label>
                          <input type="number" className={inpStyle} placeholder="Ej. 300.53" />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-gray-500 mb-1">Esfuerzo SAT (Hrs)</label>
                          <input type="number" className={inpStyle} placeholder="Ej. 100.00" />
                        </div>
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-gray-500 mb-1">Anexo PDT (nombre del documento)</label>
                        <input className={inpStyle} placeholder="Ej. PDT_Iteracion1_v1.0.mpp — indicar si es por iteraciones o por fases" />
                      </div>
                    </div>
                  </div>

                  {/* Entregables de la estimación a alto nivel */}
                  <div className="bg-white border border-gray-100 rounded-xl overflow-hidden shadow-xs">
                    <div className="px-5 py-3.5 bg-gray-50/50 border-b border-gray-100 font-bold text-xs text-gray-700 uppercase tracking-wider">
                      <span className="flex items-center gap-2"><CheckCircle2 size={15} className="text-gray-400" /> Entregables de la Estimación a Alto Nivel</span>
                    </div>
                    <div className="p-5">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr>
                            <th className={thStyle}>#</th>
                            <th className={thStyle}>Nombre del Producto</th>
                            <th className={thStyle}>Descripción</th>
                            <th className={thStyle}>Formato (Electrónico/Impreso)</th>
                            <th className={thStyle}>Fecha de Entrega</th>
                            <th className={thStyle} style={{ width: 50 }} />
                          </tr>
                        </thead>
                        <tbody>
                          {pseEntregablesAltoNivel.map((p, i) => (
                            <tr key={i} className="hover:bg-gray-50/30">
                              <td className={`${tdStyle} text-center font-medium text-gray-400`}>{i + 1}</td>
                              <td className={tdStyle}><input className={inpStyle} defaultValue={p.nombre} /></td>
                              <td className={tdStyle}><input className={inpStyle} defaultValue={p.desc} /></td>
                              <td className={tdStyle}><input className={inpStyle} defaultValue={p.formato} /></td>
                              <td className={tdStyle}><input type="date" className={inpStyle} defaultValue={p.fechaEntrega} /></td>
                              <td className={tdStyle}>
                                <button onClick={() => setPseEntregablesAltoNivel(pseEntregablesAltoNivel.filter((_, j) => j !== i))}
                                  className="text-gray-400 hover:text-red-600 transition-all p-1">
                                  <Trash2 size={14} />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      <button onClick={() => setPseEntregablesAltoNivel([...pseEntregablesAltoNivel, { nombre: '', desc: '', formato: '', fechaEntrega: '' }])}
                        className="mt-3 flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-dashed border-gray-300 text-xs font-semibold text-gray-600 hover:bg-gray-50">
                        <Plus size={13} /> Añadir Producto
                      </button>
                      <p className="text-[10px] text-gray-400 mt-2">
                        Estos productos son una proyección y pueden ajustarse en la segunda estimación. Si existe Control de Cambios (CC) sobre esta estimación, agrega los productos adicionales abajo.
                      </p>
                    </div>
                  </div>

                  {/* Entregables de la segunda estimación */}
                  <div className="bg-white border border-gray-100 rounded-xl overflow-hidden shadow-xs">
                    <div className="px-5 py-3.5 bg-gray-50/50 border-b border-gray-100 font-bold text-xs text-gray-700 uppercase tracking-wider">
                      <span className="flex items-center gap-2"><CheckCircle2 size={15} className="text-gray-400" /> Entregables de la Segunda Estimación</span>
                    </div>
                    <div className="p-5">
                      <p className="text-[10px] text-gray-400 mb-3">Corresponde a los productos entregados a partir de la fase de Diseño hasta el cierre del requerimiento.</p>
                      <table className="w-full border-collapse">
                        <thead>
                          <tr>
                            <th className={thStyle}>#</th>
                            <th className={thStyle}>Nombre del Producto</th>
                            <th className={thStyle}>Descripción</th>
                            <th className={thStyle}>Formato (Electrónico/Impreso)</th>
                            <th className={thStyle}>Criterios de Aceptación</th>
                            <th className={thStyle} style={{ width: 50 }} />
                          </tr>
                        </thead>
                        <tbody>
                          {pseEntregablesSegundaEst.map((p, i) => (
                            <tr key={i} className="hover:bg-gray-50/30">
                              <td className={`${tdStyle} text-center font-medium text-gray-400`}>{i + 1}</td>
                              <td className={tdStyle}><input className={inpStyle} defaultValue={p.nombre} /></td>
                              <td className={tdStyle}><input className={inpStyle} defaultValue={p.desc} /></td>
                              <td className={tdStyle}><input className={inpStyle} defaultValue={p.formato} /></td>
                              <td className={tdStyle}><input className={inpStyle} defaultValue={p.criterios} /></td>
                              <td className={tdStyle}>
                                <button onClick={() => setPseEntregablesSegundaEst(pseEntregablesSegundaEst.filter((_, j) => j !== i))}
                                  className="text-gray-400 hover:text-red-600 transition-all p-1">
                                  <Trash2 size={14} />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      <button onClick={() => setPseEntregablesSegundaEst([...pseEntregablesSegundaEst, { nombre: '', desc: '', formato: '', criterios: '' }])}
                        className="mt-3 flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-dashed border-gray-300 text-xs font-semibold text-gray-600 hover:bg-gray-50">
                        <Plus size={13} /> Añadir Producto
                      </button>
                    </div>
                  </div>

                  {/* Costo - alto nivel */}
                  <div className="bg-white border border-gray-100 rounded-xl overflow-hidden shadow-xs">
                    <div className="px-5 py-3.5 bg-gray-50/50 border-b border-gray-100 font-bold text-xs text-gray-700 uppercase tracking-wider">
                      <span className="flex items-center gap-2"><DollarSign size={15} className="text-gray-400" /> Costo del Requerimiento — Estimación a Alto Nivel</span>
                    </div>
                    <div className="p-5">
                      <p className="text-[10px] text-gray-400 mb-3">No se deben mezclar tipos de unidad. Las cantidades se expresan en formato de horas (ej. 723.61).</p>
                      <table className="w-full border-collapse">
                        <thead>
                          <tr>
                            <th className={thStyle}>Tipo de Perfil</th>
                            <th className={thStyle}>Cantidad</th>
                            <th className={thStyle}>Esfuerzo x Perfil (Hrs)</th>
                            <th className={thStyle}>Subtotal (Hrs)</th>
                            <th className={thStyle}>Factor Equiv.</th>
                            <th className={thStyle}>Tipo Unidad</th>
                            <th className={thStyle}>Subtotal Unidades</th>
                            <th className={thStyle} style={{ width: 50 }} />
                          </tr>
                        </thead>
                        <tbody>
                          {pseCostosAltoNivel.map((c, i) => (
                            <tr key={i} className="hover:bg-gray-50/30">
                              <td className={tdStyle}><input className={inpStyle} defaultValue={c.perfil} /></td>
                              <td className={tdStyle}><input type="number" className={inpStyle} defaultValue={c.cantidad} /></td>
                              <td className={tdStyle}><input type="number" className={inpStyle} defaultValue={c.esfuerzo} /></td>
                              <td className={tdStyle}><input type="number" className={inpStyle} defaultValue={c.subtotal} /></td>
                              <td className={tdStyle}><input type="number" className={inpStyle} defaultValue={c.factor} /></td>
                              <td className={tdStyle}><input className={inpStyle} defaultValue={c.unidad} /></td>
                              <td className={tdStyle}><input type="number" className={inpStyle} defaultValue={c.subtotalUnidades} /></td>
                              <td className={tdStyle}>
                                <button onClick={() => setPseCostosAltoNivel(pseCostosAltoNivel.filter((_, j) => j !== i))}
                                  className="text-gray-400 hover:text-red-600 transition-all p-1">
                                  <Trash2 size={14} />
                                </button>
                              </td>
                            </tr>
                          ))}
                          <tr className="bg-gray-50/60">
                            <td colSpan={6} className={`${tdStyle} text-right font-semibold text-gray-500`}>Total de Unidades:</td>
                            <td className={tdStyle}>
                              <div className="px-3 py-1.5 text-xs font-bold text-gray-800 bg-gray-100 rounded-lg text-center border border-gray-200">
                                {pseCostosAltoNivel.reduce((s, c) => s + (parseFloat(c.subtotalUnidades) || 0), 0).toFixed(2)}
                              </div>
                            </td>
                            <td />
                          </tr>
                        </tbody>
                      </table>
                      <button onClick={() => setPseCostosAltoNivel([...pseCostosAltoNivel, { perfil: '', cantidad: '0', esfuerzo: '0', subtotal: '0', factor: '1', unidad: 'UDA', subtotalUnidades: '0' }])}
                        className="mt-3 flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-dashed border-gray-300 text-xs font-semibold text-gray-600 hover:bg-gray-50">
                        <Plus size={13} /> Añadir Perfil
                      </button>
                    </div>
                  </div>

                  {/* Costo - segunda estimación */}
                  <div className="bg-white border border-gray-100 rounded-xl overflow-hidden shadow-xs">
                    <div className="px-5 py-3.5 bg-gray-50/50 border-b border-gray-100 font-bold text-xs text-gray-700 uppercase tracking-wider">
                      <span className="flex items-center gap-2"><DollarSign size={15} className="text-gray-400" /> Costo del Requerimiento — Segunda Estimación</span>
                    </div>
                    <div className="p-5">
                      <p className="text-[10px] text-gray-400 mb-3">Corresponde a la fase de Diseño en adelante. Si es Costo fijo mensual (continuidad operativa / línea base), usar "--" en Tipo de Unidad y Subtotal de Unidades.</p>
                      <table className="w-full border-collapse">
                        <thead>
                          <tr>
                            <th className={thStyle}>Tipo de Perfil</th>
                            <th className={thStyle}>Cantidad</th>
                            <th className={thStyle}>Esfuerzo x Perfil (Hrs)</th>
                            <th className={thStyle}>Subtotal (Hrs)</th>
                            <th className={thStyle}>Factor Equiv.</th>
                            <th className={thStyle}>Tipo Unidad</th>
                            <th className={thStyle}>Subtotal Unidades</th>
                            <th className={thStyle} style={{ width: 50 }} />
                          </tr>
                        </thead>
                        <tbody>
                          {pseCostosSegundaEst.map((c, i) => (
                            <tr key={i} className="hover:bg-gray-50/30">
                              <td className={tdStyle}><input className={inpStyle} defaultValue={c.perfil} /></td>
                              <td className={tdStyle}><input type="number" className={inpStyle} defaultValue={c.cantidad} /></td>
                              <td className={tdStyle}><input type="number" className={inpStyle} defaultValue={c.esfuerzo} /></td>
                              <td className={tdStyle}><input type="number" className={inpStyle} defaultValue={c.subtotal} /></td>
                              <td className={tdStyle}><input type="number" className={inpStyle} defaultValue={c.factor} /></td>
                              <td className={tdStyle}><input className={inpStyle} defaultValue={c.unidad} /></td>
                              <td className={tdStyle}><input type="number" className={inpStyle} defaultValue={c.subtotalUnidades} /></td>
                              <td className={tdStyle}>
                                <button onClick={() => setPseCostosSegundaEst(pseCostosSegundaEst.filter((_, j) => j !== i))}
                                  className="text-gray-400 hover:text-red-600 transition-all p-1">
                                  <Trash2 size={14} />
                                </button>
                              </td>
                            </tr>
                          ))}
                          <tr className="bg-gray-50/60">
                            <td colSpan={6} className={`${tdStyle} text-right font-semibold text-gray-500`}>Esfuerzo Total Estimado:</td>
                            <td className={tdStyle}>
                              <div className="px-3 py-1.5 text-xs font-bold text-gray-800 bg-gray-100 rounded-lg text-center border border-gray-200">
                                {(pseCostosAltoNivel.reduce((s, c) => s + (parseFloat(c.subtotalUnidades) || 0), 0) +
                                  pseCostosSegundaEst.reduce((s, c) => s + (parseFloat(c.subtotalUnidades) || 0), 0)).toFixed(2)} Hrs.
                              </div>
                            </td>
                            <td />
                          </tr>
                        </tbody>
                      </table>
                      <button onClick={() => setPseCostosSegundaEst([...pseCostosSegundaEst, { perfil: '', cantidad: '0', esfuerzo: '0', subtotal: '0', factor: '1', unidad: 'UDA', subtotalUnidades: '0' }])}
                        className="mt-3 flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-dashed border-gray-300 text-xs font-semibold text-gray-600 hover:bg-gray-50">
                        <Plus size={13} /> Añadir Perfil
                      </button>
                    </div>
                  </div>

                  {/* Fábrica Interna + Tipo de Unidad / Totales (no aplica para Fábricas Internas) */}
                  <div className="bg-white border border-gray-100 rounded-xl overflow-hidden shadow-xs">
                    <div className="px-5 py-3.5 bg-gray-50/50 border-b border-gray-100 font-bold text-xs text-gray-700 uppercase tracking-wider">
                      <span className="flex items-center gap-2"><DollarSign size={15} className="text-gray-400" /> Tipo de Unidad / Totales por Unidades</span>
                    </div>
                    <div className="p-5 space-y-4">
                      <div>
                        <label className="block text-[11px] font-semibold text-gray-500 mb-1">¿Este Requerimiento de Servicio es atendido por una Fábrica Interna?</label>
                        <select className={inpStyle} style={{ maxWidth: 200 }} value={esFabricaInternaPse}
                          onChange={e => setEsFabricaInternaPse(e.target.value as 'Sí' | 'No' | '')}>
                          <option value="">Seleccionar...</option>
                          <option value="No">No</option>
                          <option value="Sí">Sí</option>
                        </select>
                      </div>

                      {esFabricaInternaPse === 'Sí' && (
                        <p className="text-xs text-gray-400 italic">
                          No aplica para Fábricas Internas. La tabla de Tipo de Unidad / Totales por Unidades no se requiere en este caso.
                        </p>
                      )}

                      {esFabricaInternaPse === 'No' && (
                        <div>
                          <p className="text-[10px] text-gray-400 mb-3">
                            Indicar a cuál estimación aplica el esfuerzo (Primera Estimación, Segunda Estimación, Control de Cambios X). Para Costo fijo mensual (continuidad operativa y línea base), usar "--".
                          </p>
                          <table className="w-full border-collapse">
                            <thead>
                              <tr>
                                <th className={thStyle}>Tipo de Unidad</th>
                                <th className={thStyle}>Totales por Unidades</th>
                                <th className={thStyle} style={{ width: 50 }} />
                              </tr>
                            </thead>
                            <tbody>
                              {pseTotalesPorUnidad.map((t, i) => (
                                <tr key={i} className="hover:bg-gray-50/30">
                                  <td className={tdStyle}><input className={inpStyle} defaultValue={t.tipoUnidad} /></td>
                                  <td className={tdStyle}><input className={inpStyle} defaultValue={t.totalUnidades} /></td>
                                  <td className={tdStyle}>
                                    <button onClick={() => setPseTotalesPorUnidad(pseTotalesPorUnidad.filter((_, j) => j !== i))}
                                      className="text-gray-400 hover:text-red-600 transition-all p-1">
                                      <Trash2 size={14} />
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                          <button onClick={() => setPseTotalesPorUnidad([...pseTotalesPorUnidad, { tipoUnidad: '', totalUnidades: '' }])}
                            className="mt-3 flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-dashed border-gray-300 text-xs font-semibold text-gray-600 hover:bg-gray-50">
                            <Plus size={13} /> Añadir Tipo de Unidad
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Términos y condiciones / Cambios en el alcance */}
                  <div className="bg-white border border-gray-100 rounded-xl overflow-hidden shadow-xs">
                    <div className="px-5 py-3.5 bg-gray-50/50 border-b border-gray-100 font-bold text-xs text-gray-700 uppercase tracking-wider">
                      <span className="flex items-center gap-2"><Shield size={15} className="text-gray-400" /> Términos, Condiciones y Cambios en el Alcance</span>
                    </div>
                    <div className="p-5 space-y-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-gray-500 mb-1">Riesgos, supuestos y restricciones</label>
                        <textarea className={`${inpStyle} resize-none`} rows={2}
                          placeholder="La propuesta está condicionada a los siguientes riesgos, supuestos y restricciones..." />
                      </div>
                      <p className="text-[10px] text-gray-400">
                        Todo cambio de alcance debe solicitarse por escrito y seguir el Proceso de Control de Cambios establecido entre el SAT y el Proveedor.
                      </p>
                    </div>
                  </div>

                  {/* Firmas */}
                  <div className="bg-white border border-gray-100 rounded-xl overflow-hidden shadow-xs">
                    <div className="px-5 py-3.5 bg-gray-50/50 border-b border-gray-100 font-bold text-xs text-red-950 uppercase tracking-wider">
                      <span className="flex items-center gap-2"><ShieldCheck size={15} className="text-red-900" /> Firmas de Conformidad</span>
                    </div>
                    <div className="p-5">
                      <div className="grid grid-cols-2 gap-4">
                        {firmantesPse.map(f => (
                          <div key={f.id} className="border border-gray-100 bg-white rounded-xl p-4 flex flex-col justify-between shadow-xs">
                            <div>
                              <div className="flex justify-between items-start mb-2">
                                <h5 className="text-xs font-bold text-gray-900">{f.rol}</h5>
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${f.estado === 'Firmado' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>
                                  {f.estado === 'Firmado' ? 'Firmado' : 'Pendiente'}
                                </span>
                              </div>
                              <div className="space-y-2 mb-3">
                                <div>
                                  <label className="block text-[10px] font-semibold text-gray-400 mb-0.5">Nombre</label>
                                  <input className={inpStyle} value={f.nombre} disabled={f.estado === 'Firmado'}
                                    onChange={e => actualizarFirmantePse(f.id, 'nombre', e.target.value)}
                                    placeholder="Nombre completo" />
                                </div>
                                <div>
                                  <label className="block text-[10px] font-semibold text-gray-400 mb-0.5">Puesto</label>
                                  <input className={inpStyle} value={f.puesto} disabled={f.estado === 'Firmado'}
                                    onChange={e => actualizarFirmantePse(f.id, 'puesto', e.target.value)}
                                    placeholder="Puesto" />
                                </div>
                              </div>
                              <div className="space-y-1 bg-gray-50 p-2.5 rounded-lg border border-gray-100 font-mono text-[10px] text-gray-500 mb-4">
                                <div><span className="font-sans font-semibold text-gray-400">Fecha:</span> {f.fecha || '—'}</div>
                                <div className="truncate"><span className="font-sans font-semibold text-gray-400">Hash:</span> {f.hash}</div>
                              </div>
                            </div>
                            {f.estado === 'Pendiente' ? (
                              <button onClick={() => ejecutarFirmaPse(f.id)}
                                disabled={!f.nombre.trim() || !f.puesto.trim()}
                                title={!f.nombre.trim() || !f.puesto.trim() ? 'Captura nombre y puesto primero' : ''}
                                className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-white transition-all hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
                                style={{ background: 'linear-gradient(135deg, #7c3aed 0%, #9333ea 100%)' }}>
                                <Pen size={12} /> Firmar Digitalmente
                              </button>
                            ) : (
                              <div className="text-center py-2 bg-emerald-50/40 border border-dashed border-emerald-200 text-emerald-700 text-xs font-semibold rounded-lg flex items-center justify-center gap-1">
                                <CheckCircle2 size={13} /> Firma Estampada
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Acciones PSE */}
                  <div className="flex items-center justify-between">
                    <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50 transition-all">
                      <Download size={13} /> Generar PDF
                    </button>
                    <button className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold text-white transition-all hover:opacity-90"
                      style={{ background: '#0284c7' }}>
                      <Check size={13} /> Guardar PSE
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-5">
                  {/* Identificación y antecedentes */}
                  <div className="bg-white border border-blue-100 rounded-xl overflow-hidden shadow-xs">
                    <div className="px-5 py-3.5 bg-blue-50/40 border-b border-blue-100 font-bold text-xs text-blue-900 uppercase tracking-wider">
                      <span className="flex items-center gap-2"><FileText size={15} className="text-blue-700" /> Identificación y Antecedentes</span>
                    </div>
                    <div className="p-5 space-y-4">
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <label className="block text-[11px] font-semibold text-gray-500 mb-1">ID Requerimiento</label>
                          <input className={inpStyle} defaultValue="100100" />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-gray-500 mb-1">ID Estimación</label>
                          <input className={inpStyle} defaultValue="105001" />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-gray-500 mb-1">Tipo de Estimación</label>
                          <select className={inpStyle} defaultValue="Estimación alto nivel">
                            <option>Estimación alto nivel</option>
                            <option>Segunda estimación</option>
                          </select>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[11px] font-semibold text-gray-500 mb-1">Número de Licitación / Adjudicación</label>
                          <input className={inpStyle} placeholder="Ej. NNNNNNNNN/2015" />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-gray-500 mb-1">Número de Contrato</label>
                          <input className={inpStyle} placeholder="Ej. XX XXX XX" />
                        </div>
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-gray-500 mb-1">Alcance del Requerimiento de Servicio</label>
                        <textarea className={`${inpStyle} resize-none`} rows={3}
                          placeholder="Describe con claridad el alcance del Requerimiento de Servicio (2 a 4 párrafos)..." />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-gray-500 mb-1">Objetivos y/o Beneficios</label>
                        <textarea className={`${inpStyle} resize-none`} rows={3}
                          placeholder="Antecedentes, necesidades a resolver, beneficios esperados, a quién beneficia..." />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-gray-500 mb-1">Fuera de Alcance</label>
                        <textarea className={`${inpStyle} resize-none`} rows={2}
                          placeholder="Aspectos que no están considerados dentro del alcance..." />
                      </div>
                    </div>
                  </div>

                  {/* Propuesta de solución */}
                  <div className="bg-white border border-gray-100 rounded-xl overflow-hidden shadow-xs">
                    <div className="px-5 py-3.5 bg-gray-50/50 border-b border-gray-100 font-bold text-xs text-gray-700 uppercase tracking-wider">
                      <span className="flex items-center gap-2"><BarChart2 size={15} className="text-gray-400" /> Propuesta de Solución</span>
                    </div>
                    <div className="p-5 space-y-4">
                      <div>
                        <label className="block text-[11px] font-semibold text-gray-500 mb-1">Actividades / Etapas a Ejecutar</label>
                        <textarea className={`${inpStyle} resize-none`} rows={3}
                          placeholder="Detalla las actividades y/o etapas, separadas por Servicio del SDMA y, si aplica, agrupadas por Tecnología..." />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-gray-500 mb-1">Duración del Proyecto (días hábiles)</label>
                        <input type="number" className={inpStyle} style={{ maxWidth: 200 }} placeholder="Ej. 45" />
                      </div>
                      <p className="text-[10px] text-gray-400">
                        No colocar fecha de inicio ni fin del proyecto. El Plan del Proyecto detallado se entregará junto con la CAPA.
                      </p>
                    </div>
                  </div>

                  {/* Release Plan visual */}
                  <div className="bg-white border border-gray-100 rounded-xl overflow-hidden shadow-xs">
                    <div className="px-5 py-3.5 bg-gray-50/50 border-b border-gray-100 font-bold text-xs text-gray-700 uppercase tracking-wider">
                      <span className="flex items-center gap-2"><BarChart2 size={15} className="text-gray-400" /> Release Plan del Proyecto</span>
                    </div>
                    <div className="p-5 overflow-x-auto">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr>
                            <th className={thStyle}>Sprint</th>
                            {[1, 2, 3, 4, 5, 6].map(sem => <th key={sem} className={`${thStyle} text-center`}>Semana {sem}</th>)}
                            <th className={thStyle} style={{ width: 50 }} />
                          </tr>
                        </thead>
                        <tbody>
                          {pseAgilSprints.map((s, i) => (
                            <tr key={i} className="hover:bg-gray-50/30">
                              <td className={tdStyle}><input className={inpStyle} defaultValue={s.sprint} /></td>
                              {s.semanas.map((sem, j) => (
                                <td key={j} className={tdStyle}>
                                  <select className={inpStyle} defaultValue={sem}>
                                    <option value="">—</option>
                                    <option value="Ejecución">Ejecución</option>
                                    <option value="Review">Review</option>
                                    <option value="Release">Release</option>
                                  </select>
                                </td>
                              ))}
                              <td className={tdStyle}>
                                <button onClick={() => setPseAgilSprints(pseAgilSprints.filter((_, j) => j !== i))}
                                  className="text-gray-400 hover:text-red-600 transition-all p-1">
                                  <Trash2 size={14} />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      <button onClick={() => setPseAgilSprints([...pseAgilSprints, { sprint: `S${pseAgilSprints.length + 1}`, semanas: ['', '', '', '', '', ''] }])}
                        className="mt-3 flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-dashed border-gray-300 text-xs font-semibold text-gray-600 hover:bg-gray-50">
                        <Plus size={13} /> Añadir Sprint
                      </button>
                    </div>
                  </div>

                  {/* Listado de actividades */}
                  <div className="bg-white border border-gray-100 rounded-xl overflow-hidden shadow-xs">
                    <div className="px-5 py-3.5 bg-gray-50/50 border-b border-gray-100 font-bold text-xs text-gray-700 uppercase tracking-wider">
                      <span className="flex items-center gap-2"><CheckCircle2 size={15} className="text-gray-400" /> Listado de Actividades</span>
                    </div>
                    <div className="p-5">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr>
                            <th className={thStyle}>Sprint</th>
                            <th className={thStyle}>Actividad</th>
                            <th className={thStyle}>Descripción</th>
                            <th className={thStyle}>Fecha</th>
                            <th className={thStyle} style={{ width: 50 }} />
                          </tr>
                        </thead>
                        <tbody>
                          {pseAgilActividades.map((a, i) => (
                            <tr key={i} className="hover:bg-gray-50/30">
                              <td className={tdStyle}><input className={inpStyle} defaultValue={a.sprint} /></td>
                              <td className={tdStyle}><input className={inpStyle} defaultValue={a.actividad} /></td>
                              <td className={tdStyle}><input className={inpStyle} defaultValue={a.desc} /></td>
                              <td className={tdStyle}><input type="date" className={inpStyle} defaultValue={a.fecha} /></td>
                              <td className={tdStyle}>
                                <button onClick={() => setPseAgilActividades(pseAgilActividades.filter((_, j) => j !== i))}
                                  className="text-gray-400 hover:text-red-600 transition-all p-1">
                                  <Trash2 size={14} />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      <button onClick={() => setPseAgilActividades([...pseAgilActividades, { sprint: '', actividad: '', desc: '', fecha: '' }])}
                        className="mt-3 flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-dashed border-gray-300 text-xs font-semibold text-gray-600 hover:bg-gray-50">
                        <Plus size={13} /> Añadir Actividad
                      </button>
                    </div>
                  </div>

                  {/* Entregables del proyecto */}
                  <div className="bg-white border border-gray-100 rounded-xl overflow-hidden shadow-xs">
                    <div className="px-5 py-3.5 bg-gray-50/50 border-b border-gray-100 font-bold text-xs text-gray-700 uppercase tracking-wider">
                      <span className="flex items-center gap-2"><CheckCircle2 size={15} className="text-gray-400" /> Entregables del Proyecto</span>
                    </div>
                    <div className="p-5">
                      <p className="text-[10px] text-gray-400 mb-3">
                        Para la estimación a alto nivel: "Los productos aquí enlistados son una proyección...". Para la segunda estimación: "Los siguientes productos serán entregados a partir de la fase de Diseño hasta su cierre".
                      </p>
                      <table className="w-full border-collapse">
                        <thead>
                          <tr>
                            <th className={thStyle}>Sprint</th>
                            <th className={thStyle}>Nombre del Producto</th>
                            <th className={thStyle}>Descripción</th>
                            <th className={thStyle}>Formato</th>
                            <th className={thStyle}>Criterios de Aceptación</th>
                            <th className={thStyle} style={{ width: 50 }} />
                          </tr>
                        </thead>
                        <tbody>
                          {pseAgilEntregables.map((p, i) => (
                            <tr key={i} className="hover:bg-gray-50/30">
                              <td className={tdStyle}><input className={inpStyle} defaultValue={p.sprint} /></td>
                              <td className={tdStyle}><input className={inpStyle} defaultValue={p.nombre} /></td>
                              <td className={tdStyle}><input className={inpStyle} defaultValue={p.desc} /></td>
                              <td className={tdStyle}><input className={inpStyle} defaultValue={p.formato} /></td>
                              <td className={tdStyle}><input className={inpStyle} defaultValue={p.criterios} placeholder='Ej. "Se seguirán los criterios definidos en el documento"' /></td>
                              <td className={tdStyle}>
                                <button onClick={() => setPseAgilEntregables(pseAgilEntregables.filter((_, j) => j !== i))}
                                  className="text-gray-400 hover:text-red-600 transition-all p-1">
                                  <Trash2 size={14} />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      <button onClick={() => setPseAgilEntregables([...pseAgilEntregables, { sprint: '', nombre: '', desc: '', formato: '', criterios: '' }])}
                        className="mt-3 flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-dashed border-gray-300 text-xs font-semibold text-gray-600 hover:bg-gray-50">
                        <Plus size={13} /> Añadir Entregable
                      </button>
                    </div>
                  </div>

                  {/* Costo por Sprint */}
                  <div className="bg-white border border-gray-100 rounded-xl overflow-hidden shadow-xs">
                    <div className="px-5 py-3.5 bg-gray-50/50 border-b border-gray-100 font-bold text-xs text-gray-700 uppercase tracking-wider">
                      <span className="flex items-center gap-2"><DollarSign size={15} className="text-gray-400" /> Costo del Requerimiento de Servicio</span>
                    </div>
                    <div className="p-5">
                      <p className="text-[10px] text-gray-400 mb-3">
                        No se deben mezclar tipos de unidad. Si es Costo fijo mensual, usar "--" en Tipo de Unidad y Subtotal de Unidades.
                      </p>
                      <table className="w-full border-collapse">
                        <thead>
                          <tr>
                            <th className={thStyle}>Sprint</th>
                            <th className={thStyle}>Tipo de Perfil</th>
                            <th className={thStyle}>Cantidad</th>
                            <th className={thStyle}>Esfuerzo x Perfil (Hrs)</th>
                            <th className={thStyle}>Subtotal (Hrs)</th>
                            <th className={thStyle}>Factor Equiv.</th>
                            <th className={thStyle}>Tipo Unidad</th>
                            <th className={thStyle}>Subtotal Unidades</th>
                            <th className={thStyle} style={{ width: 50 }} />
                          </tr>
                        </thead>
                        <tbody>
                          {pseAgilCostos.map((c, i) => (
                            <tr key={i} className="hover:bg-gray-50/30">
                              <td className={tdStyle}><input className={inpStyle} defaultValue={c.sprint} /></td>
                              <td className={tdStyle}><input className={inpStyle} defaultValue={c.perfil} /></td>
                              <td className={tdStyle}><input type="number" className={inpStyle} defaultValue={c.cantidad} /></td>
                              <td className={tdStyle}><input type="number" className={inpStyle} defaultValue={c.esfuerzo} /></td>
                              <td className={tdStyle}><input type="number" className={inpStyle} defaultValue={c.subtotal} /></td>
                              <td className={tdStyle}><input type="number" className={inpStyle} defaultValue={c.factor} /></td>
                              <td className={tdStyle}><input className={inpStyle} defaultValue={c.unidad} /></td>
                              <td className={tdStyle}><input type="number" className={inpStyle} defaultValue={c.subtotalUnidades} /></td>
                              <td className={tdStyle}>
                                <button onClick={() => setPseAgilCostos(pseAgilCostos.filter((_, j) => j !== i))}
                                  className="text-gray-400 hover:text-red-600 transition-all p-1">
                                  <Trash2 size={14} />
                                </button>
                              </td>
                            </tr>
                          ))}
                          <tr className="bg-gray-50/60">
                            <td colSpan={7} className={`${tdStyle} text-right font-semibold text-gray-500`}>Esfuerzo total estimado:</td>
                            <td className={tdStyle}>
                              <div className="px-3 py-1.5 text-xs font-bold text-gray-800 bg-gray-100 rounded-lg text-center border border-gray-200">
                                {pseAgilCostos.reduce((s, c) => s + (parseFloat(c.subtotalUnidades) || 0), 0).toFixed(2)} Hrs.
                              </div>
                            </td>
                            <td />
                          </tr>
                        </tbody>
                      </table>
                      <button onClick={() => setPseAgilCostos([...pseAgilCostos, { sprint: '', perfil: '', cantidad: '0', esfuerzo: '0', subtotal: '0', factor: '1', unidad: 'UDA', subtotalUnidades: '0' }])}
                        className="mt-3 flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-dashed border-gray-300 text-xs font-semibold text-gray-600 hover:bg-gray-50">
                        <Plus size={13} /> Añadir Perfil
                      </button>
                    </div>
                  </div>

                  {/* Fábrica Interna + Tipo de Unidad / Totales (no aplica para Fábricas Internas) */}
                  <div className="bg-white border border-gray-100 rounded-xl overflow-hidden shadow-xs">
                    <div className="px-5 py-3.5 bg-gray-50/50 border-b border-gray-100 font-bold text-xs text-gray-700 uppercase tracking-wider">
                      <span className="flex items-center gap-2"><DollarSign size={15} className="text-gray-400" /> Tipo de Unidad / Totales por Unidades</span>
                    </div>
                    <div className="p-5 space-y-4">
                      <div>
                        <label className="block text-[11px] font-semibold text-gray-500 mb-1">¿Este Requerimiento de Servicio es atendido por una Fábrica Interna?</label>
                        <select className={inpStyle} style={{ maxWidth: 200 }} value={esFabricaInternaPseAgil}
                          onChange={e => setEsFabricaInternaPseAgil(e.target.value as 'Sí' | 'No' | '')}>
                          <option value="">Seleccionar...</option>
                          <option value="No">No</option>
                          <option value="Sí">Sí</option>
                        </select>
                      </div>

                      {esFabricaInternaPseAgil === 'Sí' && (
                        <p className="text-xs text-gray-400 italic">
                          No aplica para Fábricas Internas. La tabla de Tipo de Unidad / Totales por Unidades no se requiere en este caso.
                        </p>
                      )}

                      {esFabricaInternaPseAgil === 'No' && (
                        <div>
                          <p className="text-[10px] text-gray-400 mb-3">
                            Indicar el tipo de unidades aplicable al Requerimiento de Servicio y el total de unidades estimadas. Para Costo fijo mensual (continuidad operativa y línea base), usar "--".
                          </p>
                          <table className="w-full border-collapse">
                            <thead>
                              <tr>
                                <th className={thStyle}>Tipo de Unidad</th>
                                <th className={thStyle}>Totales por Unidades</th>
                                <th className={thStyle} style={{ width: 50 }} />
                              </tr>
                            </thead>
                            <tbody>
                              {pseAgilTotalesPorUnidad.map((t, i) => (
                                <tr key={i} className="hover:bg-gray-50/30">
                                  <td className={tdStyle}><input className={inpStyle} defaultValue={t.tipoUnidad} /></td>
                                  <td className={tdStyle}><input className={inpStyle} defaultValue={t.totalUnidades} /></td>
                                  <td className={tdStyle}>
                                    <button onClick={() => setPseAgilTotalesPorUnidad(pseAgilTotalesPorUnidad.filter((_, j) => j !== i))}
                                      className="text-gray-400 hover:text-red-600 transition-all p-1">
                                      <Trash2 size={14} />
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                          <button onClick={() => setPseAgilTotalesPorUnidad([...pseAgilTotalesPorUnidad, { tipoUnidad: '', totalUnidades: '' }])}
                            className="mt-3 flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-dashed border-gray-300 text-xs font-semibold text-gray-600 hover:bg-gray-50">
                            <Plus size={13} /> Añadir Tipo de Unidad
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Términos y condiciones */}
                  <div className="bg-white border border-gray-100 rounded-xl overflow-hidden shadow-xs">
                    <div className="px-5 py-3.5 bg-gray-50/50 border-b border-gray-100 font-bold text-xs text-gray-700 uppercase tracking-wider">
                      <span className="flex items-center gap-2"><Shield size={15} className="text-gray-400" /> Términos, Condiciones y Cambios en el Alcance</span>
                    </div>
                    <div className="p-5">
                      <textarea className={`${inpStyle} resize-none`} rows={3}
                        placeholder="Riesgos, supuestos y restricciones identificados en la atención del Requerimiento de Servicio..." />
                    </div>
                  </div>

                  {/* Firmas */}
                  <div className="bg-white border border-gray-100 rounded-xl overflow-hidden shadow-xs">
                    <div className="px-5 py-3.5 bg-gray-50/50 border-b border-gray-100 font-bold text-xs text-red-950 uppercase tracking-wider">
                      <span className="flex items-center gap-2"><ShieldCheck size={15} className="text-red-900" /> Firmas de Conformidad</span>
                    </div>
                    <div className="p-5">
                      <div className="grid grid-cols-2 gap-4">
                        {firmantesPseAgil.map(f => (
                          <div key={f.id} className="border border-gray-100 bg-white rounded-xl p-4 flex flex-col justify-between shadow-xs">
                            <div>
                              <div className="flex justify-between items-start mb-2">
                                <h5 className="text-xs font-bold text-gray-900">{f.rol}</h5>
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${f.estado === 'Firmado' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>
                                  {f.estado === 'Firmado' ? 'Firmado' : 'Pendiente'}
                                </span>
                              </div>
                              <div className="space-y-2 mb-3">
                                <div>
                                  <label className="block text-[10px] font-semibold text-gray-400 mb-0.5">Nombre</label>
                                  <input className={inpStyle} value={f.nombre} disabled={f.estado === 'Firmado'}
                                    onChange={e => actualizarFirmantePseAgil(f.id, 'nombre', e.target.value)}
                                    placeholder="Nombre completo" />
                                </div>
                                <div>
                                  <label className="block text-[10px] font-semibold text-gray-400 mb-0.5">Puesto</label>
                                  <input className={inpStyle} value={f.puesto} disabled={f.estado === 'Firmado'}
                                    onChange={e => actualizarFirmantePseAgil(f.id, 'puesto', e.target.value)}
                                    placeholder="Puesto" />
                                </div>
                              </div>
                              <div className="space-y-1 bg-gray-50 p-2.5 rounded-lg border border-gray-100 font-mono text-[10px] text-gray-500 mb-4">
                                <div><span className="font-sans font-semibold text-gray-400">Fecha:</span> {f.fecha || '—'}</div>
                                <div className="truncate"><span className="font-sans font-semibold text-gray-400">Hash:</span> {f.hash}</div>
                              </div>
                            </div>
                            {f.estado === 'Pendiente' ? (
                              <button onClick={() => ejecutarFirmaPseAgil(f.id)}
                                disabled={!f.nombre.trim() || !f.puesto.trim()}
                                title={!f.nombre.trim() || !f.puesto.trim() ? 'Captura nombre y puesto primero' : ''}
                                className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-white transition-all hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
                                style={{ background: 'linear-gradient(135deg, #7c3aed 0%, #9333ea 100%)' }}>
                                <Pen size={12} /> Firmar Digitalmente
                              </button>
                            ) : (
                              <div className="text-center py-2 bg-emerald-50/40 border border-dashed border-emerald-200 text-emerald-700 text-xs font-semibold rounded-lg flex items-center justify-center gap-1">
                                <CheckCircle2 size={13} /> Firma Estampada
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Acciones PSE Ágil */}
                  <div className="flex items-center justify-between">
                    <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50 transition-all">
                      <Download size={13} /> Generar PDF
                    </button>
                    <button className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold text-white transition-all hover:opacity-90"
                      style={{ background: '#0284c7' }}>
                      <Check size={13} /> Guardar PSE
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* ── SOLA ── */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'rgba(217,119,6,0.08)' }}>
                  <FileText size={13} style={{ color: '#d97706' }} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-gray-900">Solicitud de Alcance al Proyecto (SOLA)</h4>
                  <p className="text-[10px] text-gray-400">Define y delimita el alcance acordado del proyecto</p>
                </div>
              </div>

              <div className="bg-white border border-amber-100 rounded-xl overflow-hidden shadow-xs">
                <div className="px-5 py-3.5 bg-amber-50/40 border-b border-amber-100 font-bold text-xs text-amber-900 uppercase tracking-wider">
                  <span className="flex items-center gap-2"><Upload size={15} className="text-amber-700" /> Carga del Documento SOLA</span>
                </div>
                <div className="p-5 space-y-4">
                  <p className="text-xs text-gray-500">
                    Por el momento, este documento se gestiona como un archivo adjunto. Cuando se incorpore la plantilla oficial del Marco Documental para SOLA, este apartado se convertirá en un formulario interactivo igual a los demás.
                  </p>
                  <div className="p-4 border border-dashed border-gray-200 rounded-xl bg-gray-50/30 flex flex-col items-center text-center">
                    <Upload size={22} className="text-gray-300 mb-2" />
                    <label className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-gray-200 bg-white text-xs font-semibold text-gray-600 cursor-pointer hover:bg-gray-50 transition-all">
                      <Upload size={13} /> {solaArchivo ? `✓ ${solaArchivo.name}` : 'Seleccionar Archivo (PDF, DOCX, ODT)'}
                      <input type="file" accept=".pdf,.docx,.odt" className="hidden"
                        onChange={e => setSolaArchivo(e.target.files?.[0] || null)} />
                    </label>
                    {solaArchivo && (
                      <button onClick={() => setSolaArchivo(null)}
                        className="mt-2 text-xs text-red-500 hover:text-red-700 transition-all">
                        Quitar archivo
                      </button>
                    )}
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-500 mb-1">Notas / Resumen del Alcance (opcional)</label>
                    <textarea className={`${inpStyle} resize-none`} rows={3} value={solaNotas}
                      onChange={e => setSolaNotas(e.target.value)}
                      placeholder="Resumen breve del alcance acordado, exclusiones o criterios de aceptación mientras no se use el formulario completo..." />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between mt-4">
                <span className="text-xs text-gray-400">
                  {solaArchivo ? 'Documento cargado, pendiente de revisión.' : 'Aún no se ha cargado el documento SOLA.'}
                </span>
                <button className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-white transition-all hover:opacity-90"
                  style={{ background: '#d97706' }}>
                  <Check size={13} /> Guardar SOLA
                </button>
              </div>
            </div>

            {/* ── EUHE ── */}
            <div className="mb-2">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'rgba(5,150,105,0.08)' }}>
                  <FileText size={13} style={{ color: '#059669' }} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-gray-900">Evidencia de Uso de Herramienta de Estimación (EUHE)</h4>
                  <p className="text-[10px] text-gray-400">Captura la evidencia y resultado de la herramienta de estimación utilizada (igual en Cascada y Ágil)</p>
                </div>
              </div>

              <div className="space-y-5">
                {/* Información general */}
                <div className="bg-white border border-emerald-100 rounded-xl overflow-hidden shadow-xs">
                  <div className="px-5 py-3.5 bg-emerald-50/40 border-b border-emerald-100 font-bold text-xs text-emerald-900 uppercase tracking-wider">
                    <span className="flex items-center gap-2"><FileText size={15} className="text-emerald-700" /> Información General</span>
                  </div>
                  <div className="p-5 grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-500 mb-1">ID Requerimiento</label>
                      <input className={inpStyle} placeholder="Ej. PPMC-100100" value={euheData.idRequerimiento}
                        onChange={e => setEuheData({ ...euheData, idRequerimiento: e.target.value })} />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-500 mb-1">ID Estimación</label>
                      <input className={inpStyle} placeholder="Ej. PPMC-105001" value={euheData.idEstimacion}
                        onChange={e => setEuheData({ ...euheData, idEstimacion: e.target.value })} />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-500 mb-1">Responsable</label>
                      <input className={inpStyle} value={euheData.responsable}
                        onChange={e => setEuheData({ ...euheData, responsable: e.target.value })} placeholder="Nombre completo" />
                    </div>
                  </div>
                </div>

                {/* Por tipo de servicio */}
                <div className="bg-white border border-gray-100 rounded-xl overflow-hidden shadow-xs">
                  <div className="px-5 py-3.5 bg-gray-50/50 border-b border-gray-100 font-bold text-xs text-gray-700 uppercase tracking-wider">
                    <span className="flex items-center gap-2"><BarChart2 size={15} className="text-gray-400" /> Por Tipo de Servicio</span>
                  </div>
                  <div className="p-5 grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-500 mb-1">Servicio Estimado</label>
                      <select className={inpStyle} value={euheData.servicioEstimado}
                        onChange={e => setEuheData({ ...euheData, servicioEstimado: e.target.value })}>
                        <option>Servicio de Definición de Requisitos</option>
                        <option>Servicio de Diseño y Desarrollo de Software</option>
                        <option>Servicio de Soporte a Pruebas</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-500 mb-1">Servicio de Negocio</label>
                      <input className={inpStyle} value={euheData.servicioNegocio}
                        onChange={e => setEuheData({ ...euheData, servicioNegocio: e.target.value })}
                        placeholder="Ej. Atención al contribuyente" />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-500 mb-1">Aplicativo</label>
                      <input className={inpStyle} value={euheData.aplicativo}
                        onChange={e => setEuheData({ ...euheData, aplicativo: e.target.value })}
                        placeholder="Nombre del aplicativo" />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-500 mb-1">Método de Estimación</label>
                      <select className={inpStyle} value={euheData.metodoEstimacion}
                        onChange={e => setEuheData({ ...euheData, metodoEstimacion: e.target.value })}>
                        <option>CFP (COSMIC)</option>
                        <option>SMC (Puntos de Función Simplificados)</option>
                        <option>Juicio de Experto</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-500 mb-1">Agrupación Tecnológica</label>
                      <select className={inpStyle} value={euheData.agrupacionTecnologica}
                        onChange={e => setEuheData({ ...euheData, agrupacionTecnologica: e.target.value })}>
                        <option>Legados</option>
                        <option>Multiplataforma</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-500 mb-1">Tecnología</label>
                      <input className={inpStyle} value={euheData.tecnologia}
                        onChange={e => setEuheData({ ...euheData, tecnologia: e.target.value })}
                        placeholder="Ej. Java, .NET, COBOL" />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-500 mb-1">Factor Tecnológico</label>
                      <input className={inpStyle} value={euheData.factorTecnologico}
                        onChange={e => setEuheData({ ...euheData, factorTecnologico: e.target.value })}
                        placeholder="Escribir si la herramienta no lo presenta" />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-500 mb-1">Factor de Categoría</label>
                      <input className={inpStyle} value={euheData.factorCategoria}
                        onChange={e => setEuheData({ ...euheData, factorCategoria: e.target.value })}
                        placeholder="Escribir si la herramienta no lo presenta" />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-500 mb-1">Factor de Horario</label>
                      <input className={inpStyle} value={euheData.factorHorario}
                        onChange={e => setEuheData({ ...euheData, factorHorario: e.target.value })}
                        placeholder="Escribir si la herramienta no lo presenta" />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-500 mb-1">Fase del Ciclo de Vida del SW</label>
                      <input className={inpStyle} value={euheData.faseCicloVidaSW}
                        onChange={e => setEuheData({ ...euheData, faseCicloVidaSW: e.target.value })}
                        placeholder="Ej. Captación, Especificación Funcional, Arquitectura..." />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-500 mb-1">Madurez CMMI (1-5)</label>
                      <select className={inpStyle} value={euheData.madurezCmmi}
                        onChange={e => setEuheData({ ...euheData, madurezCmmi: e.target.value })}>
                        <option value="1">1</option><option value="2">2</option><option value="3">3</option>
                        <option value="4">4</option><option value="5">5</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-500 mb-1">Tipo de Unidades de Pago</label>
                      <input className={inpStyle} value={euheData.tipoUnidades}
                        onChange={e => setEuheData({ ...euheData, tipoUnidades: e.target.value })} />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-500 mb-1">Total de Unidades de Pago</label>
                      <input type="number" className={inpStyle} value={euheData.totalUnidades}
                        onChange={e => setEuheData({ ...euheData, totalUnidades: e.target.value })} />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-500 mb-1">Total de Horas</label>
                      <input type="number" className={inpStyle} value={euheData.totalHoras}
                        onChange={e => setEuheData({ ...euheData, totalHoras: e.target.value })} />
                    </div>
                    <div className="col-span-3">
                      <label className="block text-[11px] font-semibold text-gray-500 mb-1">Ruta en Repositorio</label>
                      <input className={inpStyle} value={euheData.rutaRepositorio}
                        onChange={e => setEuheData({ ...euheData, rutaRepositorio: e.target.value })}
                        placeholder="Ej. /Estimaciones/2026/REQ-100100/herramienta.xlsx" />
                    </div>
                  </div>
                </div>

                {/* Tabla COSMIC/CFP (condicional al método) */}
                {euheData.metodoEstimacion === 'CFP (COSMIC)' && (
                  <div className="bg-white border border-gray-100 rounded-xl overflow-hidden shadow-xs">
                    <div className="px-5 py-3.5 bg-gray-50/50 border-b border-gray-100 font-bold text-xs text-gray-700 uppercase tracking-wider">
                      <span className="flex items-center gap-2"><BarChart2 size={15} className="text-gray-400" /> Datos COSMIC / CFP</span>
                    </div>
                    <div className="p-5">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr>
                            <th className={thStyle}>Proceso Funcional</th>
                            <th className={thStyle}>Entradas</th>
                            <th className={thStyle}>Lecturas</th>
                            <th className={thStyle}>Salidas</th>
                            <th className={thStyle}>Escrituras</th>
                            <th className={thStyle}>Grupo de Datos</th>
                            <th className={thStyle}>TMD</th>
                            <th className={thStyle}>% Reuso</th>
                            <th className={thStyle}>TMD Ajustados</th>
                            <th className={thStyle} style={{ width: 50 }} />
                          </tr>
                        </thead>
                        <tbody>
                          {euheCosmic.map((c, i) => (
                            <tr key={i} className="hover:bg-gray-50/30">
                              <td className={tdStyle}><input className={inpStyle} defaultValue={c.proceso} /></td>
                              <td className={tdStyle}><input type="number" className={inpStyle} defaultValue={c.entradas} /></td>
                              <td className={tdStyle}><input type="number" className={inpStyle} defaultValue={c.lecturas} /></td>
                              <td className={tdStyle}><input type="number" className={inpStyle} defaultValue={c.salidas} /></td>
                              <td className={tdStyle}><input type="number" className={inpStyle} defaultValue={c.escrituras} /></td>
                              <td className={tdStyle}><input className={inpStyle} defaultValue={c.grupoDatos} /></td>
                              <td className={tdStyle}><input type="number" className={inpStyle} defaultValue={c.tmd} /></td>
                              <td className={tdStyle}><input type="number" className={inpStyle} defaultValue={c.reuso} /></td>
                              <td className={tdStyle}><input type="number" className={inpStyle} defaultValue={c.tmdAjustado} /></td>
                              <td className={tdStyle}>
                                <button onClick={() => setEuheCosmic(euheCosmic.filter((_, j) => j !== i))}
                                  className="text-gray-400 hover:text-red-600 transition-all p-1">
                                  <Trash2 size={14} />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      <button onClick={() => setEuheCosmic([...euheCosmic, { proceso: '', entradas: '0', lecturas: '0', salidas: '0', escrituras: '0', grupoDatos: '', tmd: '0', reuso: '0', tmdAjustado: '0' }])}
                        className="mt-3 flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-dashed border-gray-300 text-xs font-semibold text-gray-600 hover:bg-gray-50">
                        <Plus size={13} /> Añadir Proceso Funcional
                      </button>
                    </div>
                  </div>
                )}

                {/* Tabla SMC (condicional al método) */}
                {euheData.metodoEstimacion === 'SMC (Puntos de Función Simplificados)' && (
                  <div className="bg-white border border-gray-100 rounded-xl overflow-hidden shadow-xs">
                    <div className="px-5 py-3.5 bg-gray-50/50 border-b border-gray-100 font-bold text-xs text-gray-700 uppercase tracking-wider">
                      <span className="flex items-center gap-2"><BarChart2 size={15} className="text-gray-400" /> Datos para el Método de Estimación SMC</span>
                    </div>
                    <div className="p-5">
                      <p className="text-[10px] text-gray-400 mb-3">Un renglón por cada descripción u objeto a construir.</p>
                      <table className="w-full border-collapse">
                        <thead>
                          <tr>
                            <th className={thStyle}>Descripción u Objeto a Construir</th>
                            <th className={thStyle}>Tecnología</th>
                            <th className={thStyle}>Tipo de Objeto</th>
                            <th className={thStyle}>Complejidad</th>
                            <th className={thStyle} style={{ width: 50 }} />
                          </tr>
                        </thead>
                        <tbody>
                          {euheSmc.map((s, i) => (
                            <tr key={i} className="hover:bg-gray-50/30">
                              <td className={tdStyle}><input className={inpStyle} defaultValue={s.objeto} placeholder="Nombre del objeto a construir" /></td>
                              <td className={tdStyle}><input className={inpStyle} defaultValue={s.tecnologia} placeholder="Java, .NET, Mainframe, PeopleSoft..." /></td>
                              <td className={tdStyle}><input className={inpStyle} defaultValue={s.tipoObjeto} placeholder="Formulario, Informe, Interfaz, Webservice..." /></td>
                              <td className={tdStyle}>
                                <select className={inpStyle} defaultValue={s.complejidad}>
                                  <option>Simple</option>
                                  <option>Mediano</option>
                                  <option>Complejo</option>
                                </select>
                              </td>
                              <td className={tdStyle}>
                                <button onClick={() => setEuheSmc(euheSmc.filter((_, j) => j !== i))}
                                  className="text-gray-400 hover:text-red-600 transition-all p-1">
                                  <Trash2 size={14} />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      <button onClick={() => setEuheSmc([...euheSmc, { objeto: '', tecnologia: '', tipoObjeto: '', complejidad: 'Simple' }])}
                        className="mt-3 flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-dashed border-gray-300 text-xs font-semibold text-gray-600 hover:bg-gray-50">
                        <Plus size={13} /> Añadir Objeto
                      </button>
                    </div>
                  </div>
                )}

                {/* Tabla Juicio de Experto (condicional al método) */}
                {euheData.metodoEstimacion === 'Juicio de Experto' && (
                  <div className="bg-white border border-gray-100 rounded-xl overflow-hidden shadow-xs">
                    <div className="px-5 py-3.5 bg-gray-50/50 border-b border-gray-100 font-bold text-xs text-gray-700 uppercase tracking-wider">
                      <span className="flex items-center gap-2"><BarChart2 size={15} className="text-gray-400" /> Datos para el Método de Estimación Juicio de Experto</span>
                    </div>
                    <div className="p-5">
                      <p className="text-[10px] text-gray-400 mb-3">Un renglón por cada servicio.</p>
                      <table className="w-full border-collapse">
                        <thead>
                          <tr>
                            <th className={thStyle}>Descripción del Servicio</th>
                            <th className={thStyle}>Tipo de Servicio</th>
                            <th className={thStyle}>Esfuerzo en Horas</th>
                            <th className={thStyle} style={{ width: 50 }} />
                          </tr>
                        </thead>
                        <tbody>
                          {euheJuicioExperto.map((j, i) => (
                            <tr key={i} className="hover:bg-gray-50/30">
                              <td className={tdStyle}><input className={inpStyle} defaultValue={j.servicio} placeholder="Servicio a desarrollar" /></td>
                              <td className={tdStyle}>
                                <select className={inpStyle} defaultValue={j.tipoServicio}>
                                  <option>Análisis</option>
                                  <option>Diseño</option>
                                  <option>Pruebas</option>
                                  <option>Liberación</option>
                                  <option>Documentación</option>
                                  <option>Capacitación</option>
                                  <option>Consultoría</option>
                                  <option>Otro</option>
                                </select>
                              </td>
                              <td className={tdStyle}><input type="number" className={inpStyle} defaultValue={j.esfuerzoHoras} /></td>
                              <td className={tdStyle}>
                                <button onClick={() => setEuheJuicioExperto(euheJuicioExperto.filter((_, k) => k !== i))}
                                  className="text-gray-400 hover:text-red-600 transition-all p-1">
                                  <Trash2 size={14} />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      <button onClick={() => setEuheJuicioExperto([...euheJuicioExperto, { servicio: '', tipoServicio: 'Análisis', esfuerzoHoras: '' }])}
                        className="mt-3 flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-dashed border-gray-300 text-xs font-semibold text-gray-600 hover:bg-gray-50">
                        <Plus size={13} /> Añadir Servicio
                      </button>
                    </div>
                  </div>
                )}

                {/* Firmas */}
                <div className="bg-white border border-gray-100 rounded-xl overflow-hidden shadow-xs">
                  <div className="px-5 py-3.5 bg-gray-50/50 border-b border-gray-100 font-bold text-xs text-red-950 uppercase tracking-wider">
                    <span className="flex items-center gap-2"><ShieldCheck size={15} className="text-red-900" /> Firmas de Conformidad</span>
                  </div>
                  <div className="p-5">
                    <div className="grid grid-cols-2 gap-4">
                      {firmantesEuhe.map(f => (
                        <div key={f.id} className="border border-gray-100 bg-white rounded-xl p-4 flex flex-col justify-between shadow-xs">
                          <div>
                            <div className="flex justify-between items-start mb-2">
                              <h5 className="text-xs font-bold text-gray-900">{f.rol}</h5>
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${f.estado === 'Firmado' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>
                                {f.estado === 'Firmado' ? 'Firmado' : 'Pendiente'}
                              </span>
                            </div>
                            <div className="space-y-2 mb-3">
                              <div>
                                <label className="block text-[10px] font-semibold text-gray-400 mb-0.5">Nombre</label>
                                <input className={inpStyle} value={f.nombre} disabled={f.estado === 'Firmado'}
                                  onChange={e => actualizarFirmanteEuhe(f.id, 'nombre', e.target.value)}
                                  placeholder="Nombre completo" />
                              </div>
                              <div>
                                <label className="block text-[10px] font-semibold text-gray-400 mb-0.5">Puesto</label>
                                <input className={inpStyle} value={f.puesto} disabled={f.estado === 'Firmado'}
                                  onChange={e => actualizarFirmanteEuhe(f.id, 'puesto', e.target.value)}
                                  placeholder="Puesto" />
                              </div>
                            </div>
                            <div className="space-y-1 bg-gray-50 p-2.5 rounded-lg border border-gray-100 font-mono text-[10px] text-gray-500 mb-4">
                              <div><span className="font-sans font-semibold text-gray-400">Fecha:</span> {f.fecha || '—'}</div>
                              <div className="truncate"><span className="font-sans font-semibold text-gray-400">Hash:</span> {f.hash}</div>
                            </div>
                          </div>
                          {f.estado === 'Pendiente' ? (
                            <button onClick={() => ejecutarFirmaEuhe(f.id)}
                              disabled={!f.nombre.trim() || !f.puesto.trim()}
                              title={!f.nombre.trim() || !f.puesto.trim() ? 'Captura nombre y puesto primero' : ''}
                              className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-white transition-all hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
                              style={{ background: 'linear-gradient(135deg, #7c3aed 0%, #9333ea 100%)' }}>
                              <Pen size={12} /> Firmar Digitalmente
                            </button>
                          ) : (
                            <div className="text-center py-2 bg-emerald-50/40 border border-dashed border-emerald-200 text-emerald-700 text-xs font-semibold rounded-lg flex items-center justify-center gap-1">
                              <CheckCircle2 size={13} /> Firma Estampada
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Acciones EUHE */}
                <div className="flex items-center justify-between">
                  <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50 transition-all">
                    <Download size={13} /> Generar PDF
                  </button>
                  <button className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold text-white transition-all hover:opacity-90"
                    style={{ background: '#059669' }}>
                    <Check size={13} /> Guardar EUHE
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* CTA avanzar a Construcción */}
          {estimacionCompleta && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CheckCircle2 size={18} className="text-emerald-600" />
                <div>
                  <p className="text-sm font-bold text-emerald-800">Sección Estimación completada</p>
                  <p className="text-xs text-emerald-600">Puedes avanzar a la fase de Construcción</p>
                </div>
              </div>
              <button
                onClick={() => setSeccionActual('construccion')}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90"
                style={{ background: 'linear-gradient(135deg, #059669 0%, #34d399 100%)' }}>
                Ir a Construcción <ChevronRight size={15} />
              </button>
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
          SECCIÓN 3: CONSTRUCCIÓN
          ══════════════════════════════════════════════════════════ */}
      {seccionActual === 'construccion' && (
        <div className="space-y-5 animate-fade-in">
          {/* Buscador de iniciativas */}
          <div className="bg-white rounded-xl border border-gray-100 p-4"
            style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Buscador de Iniciativas</p>
            <div className="flex gap-3">
              <div className="flex-1 relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  value={busquedaIniciativa}
                  onChange={e => setBusquedaIniciativa(e.target.value)}
                  placeholder="Buscar por nombre de iniciativa..."
                  className="w-full pl-9 pr-4 py-2 text-xs border border-gray-200 rounded-lg outline-none focus:border-red-900 transition-all bg-white"
                />
              </div>
              <select
                value={filtroCategoria}
                onChange={e => setFiltroCategoria(e.target.value)}
                className="px-3 py-2 text-xs border border-gray-200 rounded-lg outline-none focus:border-red-900 transition-all bg-white font-medium text-gray-600">
                <option>Todos</option>
                <option>Legal</option>
                <option>Tecnología</option>
                <option>Finanzas</option>
                <option>Operaciones</option>
              </select>
              <button className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-50 transition-all">
                <Filter size={13} /> Filtrar
              </button>
            </div>
            <p className="text-[10px] text-gray-400 mt-2">
              Iniciativa actual: <strong className="text-gray-700">{iniciativa.nombre}</strong> · Marco: {marcoEfectivo}
            </p>
          </div>

          {/* KPIs en tiempo real */}
          <div className="grid grid-cols-4 gap-4">
            {[
              { label: 'Avance Total',      value: `${avanceReal}%`,         sub: 'Entregables firmados',  color: '#6B1A2A' },
              { label: 'Fase Actual',        value: iniciativa.faseActual ?? 'Análisis', sub: 'En progreso', color: '#d97706' },
              { label: 'Firmados / Total',   value: `${firmadas}/${totalActs}`, sub: 'Entregables',          color: '#0284c7' },
              { label: 'Fases Cerradas',     value: `${iniciativa.fasesCerradas.length}/5`, sub: 'Completadas', color: '#059669' },
            ].map(k => (
              <div key={k.label} className="bg-white rounded-xl border border-gray-100 p-4"
                style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                <p className="text-xs text-gray-400 mb-1">{k.label}</p>
                <p className="text-2xl font-bold" style={{ color: k.color }}>{k.value}</p>
                <p className="text-xs text-gray-400 mt-1">{k.sub}</p>
              </div>
            ))}
          </div>

          {/* Selector de fases */}
          <div className="bg-white rounded-xl border border-gray-100 p-5"
            style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-gray-900">Fases y Artefactos</h3>
                <p className="text-xs text-gray-400 mt-0.5">Marco: {marcoEfectivo} · Artefactos condicionados por CAPA y marco de trabajo</p>
              </div>
            </div>

            {/* Botones de fase */}
            <div className="flex gap-2 mb-5 flex-wrap">
              {FASES.map(f => {
                const cerrada = faseCerrada(f)
                const esActual = f === iniciativa.faseActual
                const avance = avancePorFase(f)
                return (
                  <button key={f}
                    onClick={() => setFase(f)}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold border-2 transition-all"
                    style={{
                      borderColor: fase === f ? '#6B1A2A' : cerrada ? '#a7f3d0' : '#e5e7eb',
                      color:       fase === f ? '#6B1A2A' : cerrada ? '#059669' : '#6b7280',
                      background:  fase === f ? 'rgba(107,26,42,0.05)' : cerrada ? 'rgba(5,150,105,0.05)' : '#fff',
                    }}>
                    {cerrada
                      ? <CheckCircle2 size={13} className="text-emerald-500" />
                      : esActual
                      ? <Clock size={13} style={{ color: '#d97706' }} />
                      : <div className="w-3 h-3 rounded-full border-2" style={{ borderColor: '#d1d5db' }} />
                    }
                    {f}
                    {avance > 0 && <span className="text-xs opacity-70">({avance}%)</span>}
                  </button>
                )
              })}
            </div>

            {/* Contenido de la fase seleccionada */}
            <div className="border border-gray-100 rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold text-gray-900">Fase: {fase}</h4>
                  {faseCerrada(fase) && (
                    <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                      <CheckCircle2 size={11} /> Cerrada
                    </span>
                  )}
                  {/* Avance de la fase actual */}
                  <span className="text-xs text-gray-400">·</span>
                  <span className="text-xs font-semibold text-gray-600">{avancePorFase(fase)}% completado</span>
                </div>
                {!faseCerrada(fase) && (
                  <button
                    onClick={() => canCloseFase(fase) && cerrarFase(fase)}
                    disabled={!canCloseFase(fase)}
                    title={!canCloseFase(fase) ? 'Todos los entregables deben estar Firmados' : ''}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90"
                    style={{ background: canCloseFase(fase) ? 'linear-gradient(135deg, #059669 0%, #34d399 100%)' : '#9ca3af' }}>
                    <Lock size={12} /> Cerrar Fase
                  </button>
                )}
              </div>

              {/* Listado de artefactos del marco */}
              <div className="mb-5">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                  Artefactos requeridos · {marcoEfectivo} · {fase}
                </p>
                <div className="space-y-2">
                  {(artefactosPorFase[fase] ?? []).map(art => (
                    <div key={art}
                      className="flex items-center justify-between p-3 border border-gray-100 rounded-lg hover:bg-gray-50/50 transition-all">
                      <div className="flex items-center gap-2">
                        <FileText size={14} style={{ color: '#6B1A2A' }} />
                        <span className="text-xs font-medium text-gray-700">{art}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button className="p-1.5 rounded-lg hover:bg-gray-100 transition-all" title="Cargar">
                          <Upload size={12} className="text-gray-400" />
                        </button>
                        <button className="p-1.5 rounded-lg hover:bg-gray-100 transition-all" title="Visualizar">
                          <Eye size={12} className="text-gray-400" />
                        </button>
                        <button className="p-1.5 rounded-lg hover:bg-gray-100 transition-all" title="Descargar">
                          <Download size={12} className="text-gray-400" />
                        </button>
                        <button className="p-1.5 rounded-lg hover:bg-emerald-50 transition-all" title="Aprobar">
                          <Check size={12} className="text-emerald-500" />
                        </button>
                        <button className="p-1.5 rounded-lg hover:bg-red-50 transition-all" title="Rechazar">
                          <X size={12} className="text-red-400" />
                        </button>
                        <button className="p-1.5 rounded-lg hover:bg-red-50 transition-all" title="Eliminar">
                          <Trash2 size={12} className="text-gray-300 hover:text-red-500" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Entregables operativos existentes */}
              {!faseCerrada(fase) && entregablesDeFase(fase).length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Entregables Operativos</p>
                  {entregablesDeFase(fase).map(ent => (
                    <ArtefactoRow key={ent.id} ent={ent} locked={faseCerrada(fase)} />
                  ))}
                </div>
              )}
              {faseCerrada(fase) && entregablesDeFase(fase).length > 0 && (
                <div>
                  {entregablesDeFase(fase).map(ent => (
                    <ArtefactoRow key={ent.id} ent={ent} locked={true} />
                  ))}
                </div>
              )}

              {!canCloseFase(fase) && !faseCerrada(fase) && entregablesDeFase(fase).length > 0 && (
                <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2">
                  <AlertCircle size={14} className="text-amber-600 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-700">Para cerrar la fase, todos los entregables deben tener estado <strong>Firmado</strong>.</p>
                </div>
              )}

              {entregablesDeFase(fase).length === 0 && (artefactosPorFase[fase] ?? []).length === 0 && (
                <div className="text-center py-6">
                  <FileText size={28} className="mx-auto text-gray-200 mb-3" />
                  <p className="text-sm text-gray-400">No hay artefactos definidos para esta fase</p>
                </div>
              )}
            </div>

            {/* Progreso global por fase */}
            <div className="mt-5">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Avance por Fase</p>
              <div className="space-y-3">
                {FASES.map(f => {
                  const av      = avancePorFase(f)
                  const cerrada = faseCerrada(f)
                  return (
                    <div key={f}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-gray-700">{f}</span>
                          {cerrada && <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-600 border border-emerald-200">Cerrada</span>}
                        </div>
                        <span className="text-xs font-bold text-gray-700">{av}%</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${av}%`,
                            background: cerrada
                              ? 'linear-gradient(90deg, #059669, #34d399)'
                              : av > 0
                              ? 'linear-gradient(90deg, #6B1A2A, #C4384F)'
                              : '#e5e7eb',
                          }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
          SECCIÓN 4: CIERRE
          ══════════════════════════════════════════════════════════ */}
      {seccionActual === 'cierre' && (
        <div className="space-y-5 animate-fade-in">
          {modoCierre === 'ninguno' && (
            <div className="bg-white rounded-xl border border-gray-100 p-6"
              style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
              <h3 className="text-sm font-bold text-gray-900 mb-1">Cierre de la Iniciativa</h3>
              <p className="text-xs text-gray-400 mb-6">Selecciona el tipo de cierre para esta iniciativa</p>

              <div className="grid grid-cols-2 gap-4">
                {/* Opción A: Cierre Exitoso */}
                <div className="p-5 border-2 border-gray-100 hover:border-emerald-300 rounded-xl transition-all cursor-pointer group"
                  onClick={() => setModoCierre('caes')}>
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center mb-3">
                    <Archive size={18} className="text-emerald-600" />
                  </div>
                  <h4 className="text-sm font-bold text-gray-900 mb-1">Cierre Exitoso</h4>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    Genera la Carta de Aceptación de la Entrega del Servicio (CAES) con flujo de firmas de cierre.
                  </p>
                  <div className="mt-4 flex items-center gap-1 text-xs font-semibold text-emerald-600 group-hover:text-emerald-700 transition-all">
                    Iniciar cierre exitoso <ChevronRight size={13} />
                  </div>
                </div>

                {/* Opción B: Cancelación */}
                <div className="p-5 border-2 border-gray-100 hover:border-red-300 rounded-xl transition-all cursor-pointer group"
                  onClick={() => setModoCierre('cancelacion')}>
                  <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center mb-3">
                    <XCircle size={18} className="text-red-600" />
                  </div>
                  <h4 className="text-sm font-bold text-gray-900 mb-1">Cancelación de Iniciativa</h4>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    Cancela formalmente el proyecto con justificación, evidencia y firmas de autorización de las autoridades pertinentes.
                  </p>
                  <div className="mt-4 flex items-center gap-1 text-xs font-semibold text-red-600 group-hover:text-red-700 transition-all">
                    Iniciar cancelación <ChevronRight size={13} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── OPCIÓN A: CAES ── */}
          {modoCierre === 'caes' && (
            <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-6 animate-fade-in"
              style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
              <div className="border-b border-gray-100 pb-4 flex justify-between items-center">
                <button onClick={() => setModoCierre('ninguno')}
                  className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-800 font-semibold transition-all">
                  <ArrowLeft size={13} /> Volver a opciones de cierre
                </button>
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1.5">
                  <Clock size={12} /> Flujo de Firmas Activo · Marco: {marcoEfectivo}
                </span>
              </div>

              {marcoEfectivo === 'Cascada' ? (
              <>
              {/* SECCIÓN 1: CAES — Datos de identificación */}
              <div className="bg-white border border-gray-100 rounded-xl overflow-hidden shadow-xs">
                <div className="px-5 py-3.5 bg-gray-50/50 border-b border-gray-100 font-bold text-xs text-gray-700 uppercase tracking-wider">
                  <span className="flex items-center gap-2"><FileText size={15} className="text-gray-400" /> Carta de Aceptación de la Entrega del Servicio (CAES)</span>
                </div>
                <div className="p-5 space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-500 mb-1">ID Requerimiento</label>
                      <input className={inpStyle} value={caesData.idRequerimiento}
                        onChange={e => setCaesData({ ...caesData, idRequerimiento: e.target.value })} />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-500 mb-1">ID Estimación</label>
                      <input className={inpStyle} value={caesData.idEstimacion}
                        onChange={e => setCaesData({ ...caesData, idEstimacion: e.target.value })} />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-500 mb-1">Iteración Relacionada</label>
                      <input className={inpStyle} value={caesData.iteracionRelacionada}
                        onChange={e => setCaesData({ ...caesData, iteracionRelacionada: e.target.value })}
                        placeholder="Para cierre total del proyecto, mencionar todas las iteraciones" />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-500 mb-1">Nombre de Requerimiento</label>
                      <input className={inpStyle} defaultValue={iniciativa.nombre}
                        onChange={e => setCaesData({ ...caesData, nombreRequerimiento: e.target.value })} />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-500 mb-1">Proyecto</label>
                      <input className={inpStyle} value={caesData.proyecto}
                        onChange={e => setCaesData({ ...caesData, proyecto: e.target.value })}
                        placeholder="SDMA o proyecto que le corresponda" />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-500 mb-1">Dueño de Fase</label>
                      <input className={inpStyle} defaultValue={iniciativa.responsable}
                        onChange={e => setCaesData({ ...caesData, dueñoFase: e.target.value })}
                        placeholder="Nombre del RAPE" />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-500 mb-1">Fecha de Inicio</label>
                      <input type="date" className={inpStyle} value={caesData.fechaInicio}
                        onChange={e => setCaesData({ ...caesData, fechaInicio: e.target.value })} />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-500 mb-1">Fecha de Fin (Clausura)</label>
                      <input type="date" className={inpStyle} value={caesData.fechaFin}
                        onChange={e => setCaesData({ ...caesData, fechaFin: e.target.value })} />
                    </div>
                  </div>
                </div>
              </div>

              {/* SECCIÓN 2: Productos y Entregables */}
              <div className="bg-white border border-gray-100 rounded-xl overflow-hidden shadow-xs">
                <div className="px-5 py-3.5 bg-gray-50/50 border-b border-gray-100 font-bold text-xs text-gray-700 uppercase tracking-wider">
                  <span className="flex items-center gap-2"><CheckCircle2 size={15} className="text-gray-400" /> Productos y Entregables</span>
                </div>
                <div className="p-5">
                  <p className="text-[10px] text-gray-400 mb-3">
                    Estos entregables han sido previamente revisados y aprobados por personal a mi cargo (ver Anexo 1).
                  </p>
                  <table className="w-full border-collapse">
                    <thead>
                      <tr>
                        <th className={thStyle}>#</th>
                        <th className={thStyle}>Nombre del Producto</th>
                        <th className={thStyle}>Descripción</th>
                        <th className={thStyle}>Formato / Herramienta</th>
                        <th className={thStyle}>Ruta del Producto</th>
                        <th className={thStyle} style={{ width: 50 }} />
                      </tr>
                    </thead>
                    <tbody>
                      {productos.map((p, i) => (
                        <tr key={i} className="hover:bg-gray-50/30">
                          <td className={`${tdStyle} text-center font-medium text-gray-400`}>{i + 1}</td>
                          <td className={tdStyle}><input className={inpStyle} defaultValue={p.nombre} /></td>
                          <td className={tdStyle}><input className={inpStyle} defaultValue={p.desc} /></td>
                          <td className={tdStyle}><input className={inpStyle} defaultValue={p.formato} placeholder="Ej. Electrónico-SharePoint" /></td>
                          <td className={tdStyle}><input className={inpStyle} defaultValue={p.ruta} /></td>
                          <td className={tdStyle}>
                            <button onClick={() => setProductos(productos.filter((_, j) => j !== i))}
                              className="text-gray-400 hover:text-red-600 transition-all p-1">
                              <Trash2 size={14} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <button onClick={() => setProductos([...productos, { nombre: '', desc: '', formato: '', ruta: '' }])}
                    className="mt-3 flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-dashed border-gray-300 text-xs font-semibold text-gray-600 hover:bg-gray-50">
                    <Plus size={13} /> Añadir Producto
                  </button>
                </div>
              </div>

              {/* SECCIÓN 3: Requisitos Funcionales */}
              <div className="bg-white border border-gray-100 rounded-xl overflow-hidden shadow-xs">
                <div className="px-5 py-3.5 bg-gray-50/50 border-b border-gray-100 font-bold text-xs text-gray-700 uppercase tracking-wider">
                  <span className="flex items-center gap-2"><Star size={15} className="text-gray-400" /> Requisitos Funcionales</span>
                </div>
                <div className="p-5">
                  <p className="text-[10px] text-gray-400 mb-3">
                    Debe corresponder con lo documentado en la CAPA. Puntuación = Ponderación × 5 ÷ 100 si Cumplimiento es "Si"; de lo contrario, 0. Si el requerimiento no afecta funcionalidad, indicar: "El Requerimiento de Servicio de SDMA no requiere funcionalidad".
                  </p>
                  <table className="w-full border-collapse">
                    <thead>
                      <tr>
                        <th className={thStyle}>#</th>
                        <th className={thStyle}>Requisitos Funcionales</th>
                        <th className={thStyle}>Ponderación</th>
                        <th className={thStyle}>Cumplimiento</th>
                        <th className={thStyle}>Puntuación</th>
                        <th className={thStyle}>Observaciones</th>
                        <th className={thStyle} style={{ width: 50 }} />
                      </tr>
                    </thead>
                    <tbody>
                      {reqRows.map((r, i) => {
                        const puntuacionCalculada = calcularPuntuacion(r.pond, r.cump)
                        return (
                          <tr key={i} className="hover:bg-gray-50/30">
                            <td className={`${tdStyle} text-center font-medium text-gray-400`}>{i + 1}</td>
                            <td className={tdStyle}><input className={inpStyle} defaultValue={r.req}
                              onChange={e => setReqRows(reqRows.map((row, j) => j === i ? { ...row, req: e.target.value } : row))} /></td>
                            <td className={tdStyle}><input type="number" className={inpStyle} defaultValue={r.pond}
                              onChange={e => setReqRows(reqRows.map((row, j) => j === i ? { ...row, pond: e.target.value, punt: row.puntManual ? row.punt : calcularPuntuacion(e.target.value, row.cump) } : row))} /></td>
                            <td className={tdStyle}>
                              <select className={inpStyle} defaultValue={r.cump}
                                onChange={e => setReqRows(reqRows.map((row, j) => j === i ? { ...row, cump: e.target.value, punt: row.puntManual ? row.punt : calcularPuntuacion(row.pond, e.target.value) } : row))}>
                                <option>Si</option><option>No</option>
                              </select>
                            </td>
                            <td className={tdStyle}>
                              <input type="number" className={inpStyle}
                                value={r.puntManual ? r.punt : puntuacionCalculada}
                                onChange={e => setReqRows(reqRows.map((row, j) => j === i ? { ...row, punt: e.target.value, puntManual: true } : row))} />
                              {!r.puntManual && <span className="text-[9px] text-gray-400">Auto</span>}
                              {r.puntManual && (
                                <button onClick={() => setReqRows(reqRows.map((row, j) => j === i ? { ...row, puntManual: false, punt: calcularPuntuacion(row.pond, row.cump) } : row))}
                                  className="text-[9px] text-blue-500 hover:underline ml-1">Recalcular</button>
                              )}
                            </td>
                            <td className={tdStyle}><input className={inpStyle} defaultValue={r.obs}
                              onChange={e => setReqRows(reqRows.map((row, j) => j === i ? { ...row, obs: e.target.value } : row))} /></td>
                            <td className={tdStyle}>
                              <button onClick={() => setReqRows(reqRows.filter((_, j) => j !== i))}
                                className="text-gray-400 hover:text-red-600 transition-all p-1">
                                <Trash2 size={14} />
                              </button>
                            </td>
                          </tr>
                        )
                      })}
                      <tr className="bg-gray-50/60">
                        <td colSpan={2} className={`${tdStyle} text-right font-semibold text-gray-500`}>Total:</td>
                        <td className={tdStyle}>
                          <div className="px-3 py-1.5 text-xs font-bold text-gray-800 bg-gray-100 rounded-lg text-center border border-gray-200">
                            {reqRows.reduce((s, r) => s + (parseFloat(r.pond) || 0), 0)}%
                          </div>
                        </td>
                        <td />
                        <td className={tdStyle}>
                          <div className="px-3 py-1.5 text-xs font-bold text-gray-800 bg-gray-100 rounded-lg text-center border border-gray-200">
                            {reqRows.reduce((s, r) => s + parseFloat(r.puntManual ? r.punt : calcularPuntuacion(r.pond, r.cump)), 0).toFixed(2)}
                          </div>
                        </td>
                        <td colSpan={2} />
                      </tr>
                    </tbody>
                  </table>
                  <button onClick={() => setReqRows([...reqRows, { req: '', pond: '0', cump: 'Si', punt: '0', obs: '', puntManual: false }])}
                    className="mt-3 flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-dashed border-gray-300 text-xs font-semibold text-gray-600 hover:bg-gray-50">
                    <Plus size={13} /> Añadir Criterio
                  </button>
                </div>
              </div>

              {/* SECCIÓN 4: Controles de cambio */}
              <div className="bg-white border border-gray-100 rounded-xl overflow-hidden shadow-xs">
                <div className="px-5 py-3.5 bg-gray-50/50 border-b border-gray-100 font-bold text-xs text-gray-700 uppercase tracking-wider">
                  <span className="flex items-center gap-2"><RefreshCw size={15} className="text-gray-400" /> Controles de Cambio</span>
                </div>
                <div className="p-5">
                  <p className="text-[10px] text-gray-400 mb-3">Obligatorio solo si aplicaron Controles de Cambio al requerimiento. Para Fábricas Internas no aplica la columna de Unidades.</p>
                  <table className="w-full border-collapse">
                    <thead>
                      <tr>
                        <th className={thStyle}>#</th>
                        <th className={thStyle}>ID CC</th>
                        <th className={thStyle}>ID Estimación</th>
                        <th className={thStyle}>Fecha</th>
                        <th className={thStyle}>Horas</th>
                        <th className={thStyle}>Unidades</th>
                        <th className={thStyle} style={{ width: 50 }} />
                      </tr>
                    </thead>
                    <tbody>
                      {ccRows.map((cc, i) => (
                        <tr key={i} className="hover:bg-gray-50/30">
                          <td className={`${tdStyle} text-center text-gray-400`}>{i + 1}</td>
                          <td className={tdStyle}><input className={inpStyle} defaultValue={cc.cc} /></td>
                          <td className={tdStyle}><input className={inpStyle} defaultValue={cc.est} /></td>
                          <td className={tdStyle}><input className={inpStyle} defaultValue={cc.fecha} /></td>
                          <td className={tdStyle}><input type="number" className={inpStyle} defaultValue={cc.horas} /></td>
                          <td className={tdStyle}><input type="number" className={inpStyle} defaultValue={cc.unidades} /></td>
                          <td className={tdStyle}>
                            <button onClick={() => setCcRows(ccRows.filter((_, j) => j !== i))}
                              className="text-gray-400 hover:text-red-600 p-1 transition-all">
                              <Trash2 size={14} />
                            </button>
                          </td>
                        </tr>
                      ))}
                      <tr className="bg-gray-50/60">
                        <td colSpan={4} className={`${tdStyle} text-right font-semibold text-gray-500`}>Total:</td>
                        <td className={tdStyle}>
                          <div className="px-3 py-1.5 text-xs font-bold text-gray-800 bg-gray-100 rounded-lg text-center border border-gray-200">{totalHorasCC}</div>
                        </td>
                        <td colSpan={2} />
                      </tr>
                    </tbody>
                  </table>
                  <button onClick={() => setCcRows([...ccRows, { cc: '', est: '', fecha: '', horas: '0', unidades: '0' }])}
                    className="mt-3 flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-dashed border-gray-300 text-xs font-semibold text-gray-600 hover:bg-gray-50">
                    <Plus size={13} /> Añadir CC
                  </button>
                </div>
              </div>

              {/* SECCIÓN 5: Iteración / Unidades Totales / Estado / CAES relacionada */}
              <div className="bg-white border border-gray-100 rounded-xl overflow-hidden shadow-xs">
                <div className="px-5 py-3.5 bg-gray-50/50 border-b border-gray-100 font-bold text-xs text-gray-700 uppercase tracking-wider">
                  <span className="flex items-center gap-2"><RefreshCw size={15} className="text-gray-400" /> Control de Iteraciones</span>
                </div>
                <div className="p-5">
                  <p className="text-[10px] text-gray-400 mb-3">
                    No aplica para requerimientos atendidos mediante Costo fijo mensual (continuidad operativa y línea base) — en ese caso usar "--". Si el estado es "Pendiente", colocar "No aplica" en CAES relacionada; si es "Cobrado", indicar el nombre de la CAES con la que se cobró.
                  </p>
                  <table className="w-full border-collapse">
                    <thead>
                      <tr>
                        <th className={thStyle}>Iteración</th>
                        <th className={thStyle}>Unidades Totales de la Iteración</th>
                        <th className={thStyle}>Estado</th>
                        <th className={thStyle}>CAES Relacionada</th>
                        <th className={thStyle} style={{ width: 50 }} />
                      </tr>
                    </thead>
                    <tbody>
                      {iteracionesCAES.map((it, i) => (
                        <tr key={i} className="hover:bg-gray-50/30">
                          <td className={tdStyle}><input className={inpStyle} defaultValue={it.iter} /></td>
                          <td className={tdStyle}><input className={inpStyle} defaultValue={it.unidadesTotales} /></td>
                          <td className={tdStyle}>
                            <select className={inpStyle} defaultValue={it.estado}>
                              <option>Esfuerzo pendiente de cobro</option>
                              <option>Esfuerzo Cobrado</option>
                            </select>
                          </td>
                          <td className={tdStyle}><input className={inpStyle} defaultValue={it.caesRelacionada} placeholder="No aplica / Nombre de la CAES" /></td>
                          <td className={tdStyle}>
                            <button onClick={() => setIteracionesCAES(iteracionesCAES.filter((_, j) => j !== i))}
                              className="text-gray-400 hover:text-red-600 transition-all p-1">
                              <Trash2 size={14} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <button onClick={() => setIteracionesCAES([...iteracionesCAES, { iter: `Iteración ${iteracionesCAES.length + 1}`, unidadesTotales: '', estado: 'Esfuerzo pendiente de cobro', caesRelacionada: '' }])}
                    className="mt-3 flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-dashed border-gray-300 text-xs font-semibold text-gray-600 hover:bg-gray-50">
                    <Plus size={13} /> Añadir Iteración
                  </button>
                </div>
              </div>

              {/* SECCIÓN 6: Detalle Iteración (Costo Total del Requerimiento de Servicio) */}
              <div className="bg-white border border-gray-100 rounded-xl overflow-hidden shadow-xs">
                <div className="px-5 py-3.5 bg-gray-50/50 border-b border-gray-100 font-bold text-xs text-gray-700 uppercase tracking-wider">
                  <span className="flex items-center gap-2"><DollarSign size={15} className="text-gray-400" /> Detalle Iteración — Costo Total del Requerimiento de Servicio</span>
                </div>
                <div className="p-5">
                  <p className="text-[10px] text-gray-400 mb-3">
                    No aplica para Fábricas Internas. El costo deberá ser dividido por tipo de unidad. Esfuerzo estimado total en horas.
                  </p>
                  <table className="w-full border-collapse">
                    <thead>
                      <tr>
                        <th className={thStyle}>Fase</th>
                        <th className={thStyle}>Tipo de Perfil</th>
                        <th className={thStyle}>Cantidad</th>
                        <th className={thStyle}>Horas</th>
                        <th className={thStyle}>Unidades</th>
                        <th className={thStyle}>Tipo de Unidad</th>
                        <th className={thStyle} style={{ width: 50 }} />
                      </tr>
                    </thead>
                    <tbody>
                      {detalleIteracionCAES.map((d, i) => (
                        <tr key={i} className="hover:bg-gray-50/30">
                          <td className={tdStyle}><input className={inpStyle} defaultValue={d.fase} /></td>
                          <td className={tdStyle}><input className={inpStyle} defaultValue={d.perfil} /></td>
                          <td className={tdStyle}><input type="number" className={inpStyle} defaultValue={d.cantidad} /></td>
                          <td className={tdStyle}><input type="number" className={inpStyle} defaultValue={d.horas} /></td>
                          <td className={tdStyle}><input type="number" className={inpStyle} defaultValue={d.unidades} /></td>
                          <td className={tdStyle}><input className={inpStyle} defaultValue={d.tipoUnidad} /></td>
                          <td className={tdStyle}>
                            <button onClick={() => setDetalleIteracionCAES(detalleIteracionCAES.filter((_, j) => j !== i))}
                              className="text-gray-400 hover:text-red-600 transition-all p-1">
                              <Trash2 size={14} />
                            </button>
                          </td>
                        </tr>
                      ))}
                      <tr className="bg-gray-50/60">
                        <td colSpan={4} className={`${tdStyle} text-right font-semibold text-gray-500`}>Total de Unidades:</td>
                        <td className={tdStyle}>
                          <div className="px-3 py-1.5 text-xs font-bold text-gray-800 bg-gray-100 rounded-lg text-center border border-gray-200">
                            {detalleIteracionCAES.reduce((s, d) => s + (parseFloat(d.unidades) || 0), 0).toFixed(2)}
                          </div>
                        </td>
                        <td colSpan={2} />
                      </tr>
                    </tbody>
                  </table>
                  <button onClick={() => setDetalleIteracionCAES([...detalleIteracionCAES, { fase: '', perfil: '', cantidad: '0', horas: '0', unidades: '0', tipoUnidad: 'UDA' }])}
                    className="mt-3 flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-dashed border-gray-300 text-xs font-semibold text-gray-600 hover:bg-gray-50">
                    <Plus size={13} /> Añadir Fila
                  </button>
                </div>
              </div>

              {/* SECCIÓN 7: Firmas */}
              <div className="bg-white border border-gray-100 rounded-xl overflow-hidden shadow-xs">
                <div className="px-5 py-3.5 bg-gray-50/50 border-b border-gray-100 font-bold text-xs text-red-950 uppercase tracking-wider">
                  <span className="flex items-center gap-2"><ShieldCheck size={15} className="text-red-900" /> Firmas de Aceptación</span>
                </div>
                <div className="p-5">
                  <p className="text-[10px] text-gray-400 mb-3">
                    La CAES será aceptada y válida para efectos de medición solo si esta sección se encuentra debidamente llenada, incluyendo nombre, fecha, puesto y firma.
                  </p>
                  <div className="grid grid-cols-2 gap-4">
                    {firmantesCierre.map(f => (
                      <div key={f.id} className="border border-gray-100 bg-white rounded-xl p-4 flex flex-col justify-between shadow-xs">
                        <div>
                          <div className="flex justify-between items-start mb-2">
                            <h5 className="text-xs font-bold text-gray-900">{f.rol}</h5>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${f.estado === 'Firmado' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>
                              {f.estado === 'Firmado' ? 'Firmado' : 'Pendiente'}
                            </span>
                          </div>
                          <div className="space-y-2 mb-3">
                            <div>
                              <label className="block text-[10px] font-semibold text-gray-400 mb-0.5">Nombre</label>
                              <input className={inpStyle} value={f.nombre} disabled={f.estado === 'Firmado'}
                                onChange={e => actualizarFirmanteCierre(f.id, 'nombre', e.target.value)}
                                placeholder="Nombre completo" />
                            </div>
                            <div>
                              <label className="block text-[10px] font-semibold text-gray-400 mb-0.5">Puesto</label>
                              <input className={inpStyle} value={f.puesto} disabled={f.estado === 'Firmado'}
                                onChange={e => actualizarFirmanteCierre(f.id, 'puesto', e.target.value)}
                                placeholder={f.placeholderPuesto} />
                            </div>
                          </div>
                          <div className="space-y-1 bg-gray-50 p-2.5 rounded-lg border border-gray-100 font-mono text-[10px] text-gray-500 mb-4">
                            <div><span className="font-sans font-semibold text-gray-400">Fecha:</span> {f.fecha || '—'}</div>
                            <div className="truncate"><span className="font-sans font-semibold text-gray-400">Hash:</span> {f.hash}</div>
                          </div>
                        </div>
                        {f.estado === 'Pendiente' ? (
                          <button onClick={() => ejecutarFirmaCierre(f.id)}
                            disabled={!f.nombre.trim() || !f.puesto.trim()}
                            title={!f.nombre.trim() || !f.puesto.trim() ? 'Captura nombre y puesto primero' : ''}
                            className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-white transition-all hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
                            style={{ background: 'linear-gradient(135deg, #7c3aed 0%, #9333ea 100%)' }}>
                            <Pen size={12} /> Firmar Digitalmente
                          </button>
                        ) : (
                          <div className="text-center py-2 bg-emerald-50/40 border border-dashed border-emerald-200 text-emerald-700 text-xs font-semibold rounded-lg flex items-center justify-center gap-1">
                            <CheckCircle2 size={13} /> Firma Estampada
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* ANEXO 1: Descripción de Productos */}
              <div className="bg-white border border-gray-100 rounded-xl overflow-hidden shadow-xs">
                <div className="px-5 py-3.5 bg-gray-50/50 border-b border-gray-100 font-bold text-xs text-gray-700 uppercase tracking-wider">
                  <span className="flex items-center gap-2"><FileText size={15} className="text-gray-400" /> Anexo 1 — Descripción de Productos</span>
                </div>
                <div className="p-5">
                  <p className="text-[10px] text-gray-400 mb-3">
                    Fecha Compromiso: la comprometida en la CAPA. Fecha de Entrega: cuando el Proveedor entrega el producto al SAT con estatus "Aprobado para firma". Número de Revisiones: revisiones del SAT previas a ese estatus (o rechazos, en caso de paquetes).
                  </p>
                  <table className="w-full border-collapse">
                    <thead>
                      <tr>
                        <th className={thStyle}>#</th>
                        <th className={thStyle}>Nombre del Producto</th>
                        <th className={thStyle}>Fecha Compromiso</th>
                        <th className={thStyle}>Fecha de Entrega</th>
                        <th className={thStyle}>Número de Revisiones</th>
                        <th className={thStyle}>Observaciones</th>
                        <th className={thStyle} style={{ width: 50 }} />
                      </tr>
                    </thead>
                    <tbody>
                      {anexo1CAES.map((a, i) => (
                        <tr key={i} className="hover:bg-gray-50/30">
                          <td className={`${tdStyle} text-center font-medium text-gray-400`}>{i + 1}</td>
                          <td className={tdStyle}><input className={inpStyle} defaultValue={a.nombre} /></td>
                          <td className={tdStyle}><input type="date" className={inpStyle} defaultValue={a.fechaCompromiso} /></td>
                          <td className={tdStyle}><input type="date" className={inpStyle} defaultValue={a.fechaEntrega} /></td>
                          <td className={tdStyle}><input type="number" className={inpStyle} defaultValue={a.numRevisiones} /></td>
                          <td className={tdStyle}><input className={inpStyle} defaultValue={a.observaciones} placeholder="Tiempo justificado en minutas, correos, riesgos..." /></td>
                          <td className={tdStyle}>
                            <button onClick={() => setAnexo1CAES(anexo1CAES.filter((_, j) => j !== i))}
                              className="text-gray-400 hover:text-red-600 transition-all p-1">
                              <Trash2 size={14} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <button onClick={() => setAnexo1CAES([...anexo1CAES, { nombre: '', fechaCompromiso: '', fechaEntrega: '', numRevisiones: '0', observaciones: '' }])}
                    className="mt-3 flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-dashed border-gray-300 text-xs font-semibold text-gray-600 hover:bg-gray-50">
                    <Plus size={13} /> Añadir Producto
                  </button>
                  <p className="text-[10px] text-gray-400 mt-3 italic">
                    Anexo 2 (Plan de Trabajo): descargar de la Herramienta de Gestión de la PMOAGCTI y adjuntar por separado.
                  </p>
                </div>
              </div>

              {/* Botones CAES */}
              <div className="flex items-center justify-between">
                <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50 transition-all">
                  <Download size={13} /> Generar PDF
                </button>
                <button
                  disabled={firmantesCierre.some(f => f.estado === 'Pendiente')}
                  onClick={() => alert('Iniciativa cerrada exitosamente.')}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-gray-900 hover:bg-black transition-all disabled:opacity-40 disabled:cursor-not-allowed">
                  <CheckCircle2 size={13} /> Aplicar Cierre en Sistema
                </button>
              </div>
              </>
              ) : (
              <>
                {/* SECCIÓN 1 (Ágil): Identificación */}
                <div className="bg-white border border-gray-100 rounded-xl overflow-hidden shadow-xs">
                  <div className="px-5 py-3.5 bg-gray-50/50 border-b border-gray-100 font-bold text-xs text-gray-700 uppercase tracking-wider">
                    <span className="flex items-center gap-2"><FileText size={15} className="text-gray-400" /> Carta de Aceptación de la Entrega del Servicio — Ágil</span>
                  </div>
                  <div className="p-5 space-y-4">
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="block text-[11px] font-semibold text-gray-500 mb-1">ID Requerimiento</label>
                        <input className={inpStyle} value={caesAgilData.idRequerimiento}
                          onChange={e => setCaesAgilData({ ...caesAgilData, idRequerimiento: e.target.value })} />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-gray-500 mb-1">ID Estimación</label>
                        <input className={inpStyle} value={caesAgilData.idEstimacion}
                          onChange={e => setCaesAgilData({ ...caesAgilData, idEstimacion: e.target.value })} />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-gray-500 mb-1">Nombre de Requerimiento</label>
                        <input className={inpStyle} defaultValue={iniciativa.nombre}
                          onChange={e => setCaesAgilData({ ...caesAgilData, nombreRequerimiento: e.target.value })} />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-gray-500 mb-1">Proyecto</label>
                        <input className={inpStyle} value={caesAgilData.proyecto}
                          onChange={e => setCaesAgilData({ ...caesAgilData, proyecto: e.target.value })}
                          placeholder="SDMA o proyecto que le corresponda" />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-gray-500 mb-1">Dueño de Fase</label>
                        <input className={inpStyle} defaultValue={iniciativa.responsable}
                          onChange={e => setCaesAgilData({ ...caesAgilData, dueñoFase: e.target.value })}
                          placeholder="Nombre del RAPE" />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-gray-500 mb-1">Fecha de Inicio</label>
                        <input type="date" className={inpStyle} value={caesAgilData.fechaInicio}
                          onChange={e => setCaesAgilData({ ...caesAgilData, fechaInicio: e.target.value })} />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-gray-500 mb-1">Fecha de Fin (Clausura)</label>
                        <input type="date" className={inpStyle} value={caesAgilData.fechaFin}
                          onChange={e => setCaesAgilData({ ...caesAgilData, fechaFin: e.target.value })} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* SECCIÓN 2 (Ágil): Productos por Sprint */}
                <div className="bg-white border border-gray-100 rounded-xl overflow-hidden shadow-xs">
                  <div className="px-5 py-3.5 bg-gray-50/50 border-b border-gray-100 font-bold text-xs text-gray-700 uppercase tracking-wider">
                    <span className="flex items-center gap-2"><CheckCircle2 size={15} className="text-gray-400" /> Productos y Entregables</span>
                  </div>
                  <div className="p-5">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr>
                          <th className={thStyle}>#</th>
                          <th className={thStyle}>Sprint</th>
                          <th className={thStyle}>Nombre del Producto</th>
                          <th className={thStyle}>Descripción</th>
                          <th className={thStyle}>Formato / Herramienta</th>
                          <th className={thStyle}>Fecha de Entrega</th>
                          <th className={thStyle} style={{ width: 50 }} />
                        </tr>
                      </thead>
                      <tbody>
                        {productosCAESAgil.map((p, i) => (
                          <tr key={i} className="hover:bg-gray-50/30">
                            <td className={`${tdStyle} text-center font-medium text-gray-400`}>{i + 1}</td>
                            <td className={tdStyle}><input className={inpStyle} defaultValue={p.sprint} /></td>
                            <td className={tdStyle}><input className={inpStyle} defaultValue={p.nombre} /></td>
                            <td className={tdStyle}><input className={inpStyle} defaultValue={p.desc} /></td>
                            <td className={tdStyle}><input className={inpStyle} defaultValue={p.formato} /></td>
                            <td className={tdStyle}><input type="date" className={inpStyle} defaultValue={p.fecha} /></td>
                            <td className={tdStyle}>
                              <button onClick={() => setProductosCAESAgil(productosCAESAgil.filter((_, j) => j !== i))}
                                className="text-gray-400 hover:text-red-600 transition-all p-1">
                                <Trash2 size={14} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <button onClick={() => setProductosCAESAgil([...productosCAESAgil, { sprint: '', nombre: '', desc: '', formato: '', fecha: '' }])}
                      className="mt-3 flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-dashed border-gray-300 text-xs font-semibold text-gray-600 hover:bg-gray-50">
                      <Plus size={13} /> Añadir Producto
                    </button>
                  </div>
                </div>

                {/* SECCIÓN 3 (Ágil): Requisitos Funcionales */}
                <div className="bg-white border border-gray-100 rounded-xl overflow-hidden shadow-xs">
                  <div className="px-5 py-3.5 bg-gray-50/50 border-b border-gray-100 font-bold text-xs text-gray-700 uppercase tracking-wider">
                    <span className="flex items-center gap-2"><Star size={15} className="text-gray-400" /> Requisitos Funcionales</span>
                  </div>
                  <div className="p-5">
                    <p className="text-[10px] text-gray-400 mb-3">
                      Debe corresponder con lo documentado en la CAPA. Puntuación = Ponderación × 5 ÷ 100 si Cumplimiento es "Si"; de lo contrario, 0. Si el requerimiento no afecta funcionalidad, indicar: "El Requerimiento de Servicio de SDMA no requiere funcionalidad".
                    </p>
                    <table className="w-full border-collapse">
                      <thead>
                        <tr>
                          <th className={thStyle}>#</th>
                          <th className={thStyle}>Requisitos Funcionales</th>
                          <th className={thStyle}>Ponderación</th>
                          <th className={thStyle}>Cumplimiento</th>
                          <th className={thStyle}>Puntuación</th>
                          <th className={thStyle}>Observaciones</th>
                          <th className={thStyle} style={{ width: 50 }} />
                        </tr>
                      </thead>
                      <tbody>
                        {reqRowsCAESAgil.map((r, i) => {
                          const puntuacionCalculada = calcularPuntuacion(r.pond, r.cump)
                          return (
                            <tr key={i} className="hover:bg-gray-50/30">
                              <td className={`${tdStyle} text-center font-medium text-gray-400`}>{i + 1}</td>
                              <td className={tdStyle}><input className={inpStyle} defaultValue={r.req}
                                onChange={e => setReqRowsCAESAgil(reqRowsCAESAgil.map((row, j) => j === i ? { ...row, req: e.target.value } : row))} /></td>
                              <td className={tdStyle}><input type="number" className={inpStyle} defaultValue={r.pond}
                                onChange={e => setReqRowsCAESAgil(reqRowsCAESAgil.map((row, j) => j === i ? { ...row, pond: e.target.value, punt: row.puntManual ? row.punt : calcularPuntuacion(e.target.value, row.cump) } : row))} /></td>
                              <td className={tdStyle}>
                                <select className={inpStyle} defaultValue={r.cump}
                                  onChange={e => setReqRowsCAESAgil(reqRowsCAESAgil.map((row, j) => j === i ? { ...row, cump: e.target.value, punt: row.puntManual ? row.punt : calcularPuntuacion(row.pond, e.target.value) } : row))}>
                                  <option>Si</option><option>No</option>
                                </select>
                              </td>
                              <td className={tdStyle}>
                                <input type="number" className={inpStyle}
                                  value={r.puntManual ? r.punt : puntuacionCalculada}
                                  onChange={e => setReqRowsCAESAgil(reqRowsCAESAgil.map((row, j) => j === i ? { ...row, punt: e.target.value, puntManual: true } : row))} />
                                {!r.puntManual && <span className="text-[9px] text-gray-400">Auto</span>}
                              </td>
                              <td className={tdStyle}><input className={inpStyle} defaultValue={r.obs}
                                onChange={e => setReqRowsCAESAgil(reqRowsCAESAgil.map((row, j) => j === i ? { ...row, obs: e.target.value } : row))} /></td>
                              <td className={tdStyle}>
                                <button onClick={() => setReqRowsCAESAgil(reqRowsCAESAgil.filter((_, j) => j !== i))}
                                  className="text-gray-400 hover:text-red-600 transition-all p-1">
                                  <Trash2 size={14} />
                                </button>
                              </td>
                            </tr>
                          )
                        })}
                        <tr className="bg-gray-50/60">
                          <td colSpan={2} className={`${tdStyle} text-right font-semibold text-gray-500`}>Total:</td>
                          <td className={tdStyle}>
                            <div className="px-3 py-1.5 text-xs font-bold text-gray-800 bg-gray-100 rounded-lg text-center border border-gray-200">
                              {reqRowsCAESAgil.reduce((s, r) => s + (parseFloat(r.pond) || 0), 0)}%
                            </div>
                          </td>
                          <td colSpan={3} />
                        </tr>
                      </tbody>
                    </table>
                    <button onClick={() => setReqRowsCAESAgil([...reqRowsCAESAgil, { req: '', pond: '0', cump: 'Si', punt: '0', obs: '', puntManual: false }])}
                      className="mt-3 flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-dashed border-gray-300 text-xs font-semibold text-gray-600 hover:bg-gray-50">
                      <Plus size={13} /> Añadir Criterio
                    </button>
                  </div>
                </div>

                {/* SECCIÓN 4 (Ágil): Costo Total del Requerimiento de Servicio */}
                <div className="bg-white border border-gray-100 rounded-xl overflow-hidden shadow-xs">
                  <div className="px-5 py-3.5 bg-gray-50/50 border-b border-gray-100 font-bold text-xs text-gray-700 uppercase tracking-wider">
                    <span className="flex items-center gap-2"><DollarSign size={15} className="text-gray-400" /> Costo Total del Requerimiento de Servicio</span>
                  </div>
                  <div className="p-5">
                    <p className="text-[10px] text-gray-400 mb-3">No aplica para Fábricas Internas. El costo deberá ser dividido por tipo de unidad.</p>
                    <table className="w-full border-collapse">
                      <thead>
                        <tr>
                          <th className={thStyle}>Sprint</th>
                          <th className={thStyle}>Fase</th>
                          <th className={thStyle}>Tipo de Perfil</th>
                          <th className={thStyle}>Cantidad</th>
                          <th className={thStyle}>Horas</th>
                          <th className={thStyle}>Unidades</th>
                          <th className={thStyle}>Tipo de Unidad</th>
                          <th className={thStyle} style={{ width: 50 }} />
                        </tr>
                      </thead>
                      <tbody>
                        {costoCAESAgil.map((d, i) => (
                          <tr key={i} className="hover:bg-gray-50/30">
                            <td className={tdStyle}><input className={inpStyle} defaultValue={d.sprint} /></td>
                            <td className={tdStyle}><input className={inpStyle} defaultValue={d.fase} /></td>
                            <td className={tdStyle}><input className={inpStyle} defaultValue={d.perfil} /></td>
                            <td className={tdStyle}><input type="number" className={inpStyle} defaultValue={d.cantidad} /></td>
                            <td className={tdStyle}><input type="number" className={inpStyle} defaultValue={d.horas} /></td>
                            <td className={tdStyle}><input type="number" className={inpStyle} defaultValue={d.unidades} /></td>
                            <td className={tdStyle}><input className={inpStyle} defaultValue={d.tipoUnidad} /></td>
                            <td className={tdStyle}>
                              <button onClick={() => setCostoCAESAgil(costoCAESAgil.filter((_, j) => j !== i))}
                                className="text-gray-400 hover:text-red-600 transition-all p-1">
                                <Trash2 size={14} />
                              </button>
                            </td>
                          </tr>
                        ))}
                        <tr className="bg-gray-50/60">
                          <td colSpan={5} className={`${tdStyle} text-right font-semibold text-gray-500`}>Total de Unidades:</td>
                          <td className={tdStyle}>
                            <div className="px-3 py-1.5 text-xs font-bold text-gray-800 bg-gray-100 rounded-lg text-center border border-gray-200">
                              {costoCAESAgil.reduce((s, d) => s + (parseFloat(d.unidades) || 0), 0).toFixed(2)}
                            </div>
                          </td>
                          <td colSpan={2} />
                        </tr>
                      </tbody>
                    </table>
                    <button onClick={() => setCostoCAESAgil([...costoCAESAgil, { sprint: '', fase: '', perfil: '', cantidad: '0', horas: '0', unidades: '0', tipoUnidad: 'UDA' }])}
                      className="mt-3 flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-dashed border-gray-300 text-xs font-semibold text-gray-600 hover:bg-gray-50">
                      <Plus size={13} /> Añadir Fila
                    </button>
                  </div>
                </div>

                {/* SECCIÓN 5 (Ágil): Fábrica Interna + Tipo de Unidad / Totales */}
                <div className="bg-white border border-gray-100 rounded-xl overflow-hidden shadow-xs">
                  <div className="px-5 py-3.5 bg-gray-50/50 border-b border-gray-100 font-bold text-xs text-gray-700 uppercase tracking-wider">
                    <span className="flex items-center gap-2"><DollarSign size={15} className="text-gray-400" /> Tipo de Unidad / Totales por Unidades</span>
                  </div>
                  <div className="p-5 space-y-4">
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-500 mb-1">¿Este Requerimiento de Servicio es atendido por una Fábrica Interna?</label>
                      <select className={inpStyle} style={{ maxWidth: 200 }} value={esFabricaInternaCAESAgil}
                        onChange={e => setEsFabricaInternaCAESAgil(e.target.value as 'Sí' | 'No' | '')}>
                        <option value="">Seleccionar...</option>
                        <option value="No">No</option>
                        <option value="Sí">Sí</option>
                      </select>
                    </div>

                    {esFabricaInternaCAESAgil === 'Sí' && (
                      <p className="text-xs text-gray-400 italic">
                        No aplica para Fábricas Internas. La tabla de Tipo de Unidad / Totales por Unidades no se requiere en este caso.
                      </p>
                    )}

                    {esFabricaInternaCAESAgil === 'No' && (
                      <div>
                        <p className="text-[10px] text-gray-400 mb-3">
                          Para Costo fijo mensual (continuidad operativa y línea base), usar "--".
                        </p>
                        <table className="w-full border-collapse">
                          <thead>
                            <tr>
                              <th className={thStyle}>Tipo de Unidad</th>
                              <th className={thStyle}>Totales por Unidades</th>
                              <th className={thStyle} style={{ width: 50 }} />
                            </tr>
                          </thead>
                          <tbody>
                            {totalesPorUnidadCAESAgil.map((t, i) => (
                              <tr key={i} className="hover:bg-gray-50/30">
                                <td className={tdStyle}><input className={inpStyle} defaultValue={t.tipoUnidad} /></td>
                                <td className={tdStyle}><input className={inpStyle} defaultValue={t.totalUnidades} /></td>
                                <td className={tdStyle}>
                                  <button onClick={() => setTotalesPorUnidadCAESAgil(totalesPorUnidadCAESAgil.filter((_, j) => j !== i))}
                                    className="text-gray-400 hover:text-red-600 transition-all p-1">
                                    <Trash2 size={14} />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        <button onClick={() => setTotalesPorUnidadCAESAgil([...totalesPorUnidadCAESAgil, { tipoUnidad: '', totalUnidades: '' }])}
                          className="mt-3 flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-dashed border-gray-300 text-xs font-semibold text-gray-600 hover:bg-gray-50">
                          <Plus size={13} /> Añadir Tipo de Unidad
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* SECCIÓN 6 (Ágil): Firmas */}
                <div className="bg-white border border-gray-100 rounded-xl overflow-hidden shadow-xs">
                  <div className="px-5 py-3.5 bg-gray-50/50 border-b border-gray-100 font-bold text-xs text-red-950 uppercase tracking-wider">
                    <span className="flex items-center gap-2"><ShieldCheck size={15} className="text-red-900" /> Firmas de Aceptación</span>
                  </div>
                  <div className="p-5">
                    <p className="text-[10px] text-gray-400 mb-3">
                      La CAES será aceptada y válida para efectos de medición solo si esta sección se encuentra debidamente llenada, incluyendo nombre, fecha, puesto y firma.
                    </p>
                    <div className="grid grid-cols-2 gap-4">
                      {firmantesCierreAgil.map(f => (
                        <div key={f.id} className="border border-gray-100 bg-white rounded-xl p-4 flex flex-col justify-between shadow-xs">
                          <div>
                            <div className="flex justify-between items-start mb-2">
                              <h5 className="text-xs font-bold text-gray-900">{f.rol}</h5>
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${f.estado === 'Firmado' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>
                                {f.estado === 'Firmado' ? 'Firmado' : 'Pendiente'}
                              </span>
                            </div>
                            <div className="space-y-2 mb-3">
                              <div>
                                <label className="block text-[10px] font-semibold text-gray-400 mb-0.5">Nombre</label>
                                <input className={inpStyle} value={f.nombre} disabled={f.estado === 'Firmado'}
                                  onChange={e => actualizarFirmanteCierreAgil(f.id, 'nombre', e.target.value)}
                                  placeholder="Nombre completo" />
                              </div>
                              <div>
                                <label className="block text-[10px] font-semibold text-gray-400 mb-0.5">Puesto</label>
                                <input className={inpStyle} value={f.puesto} disabled={f.estado === 'Firmado'}
                                  onChange={e => actualizarFirmanteCierreAgil(f.id, 'puesto', e.target.value)}
                                  placeholder={f.placeholderPuesto} />
                              </div>
                            </div>
                            <div className="space-y-1 bg-gray-50 p-2.5 rounded-lg border border-gray-100 font-mono text-[10px] text-gray-500 mb-4">
                              <div><span className="font-sans font-semibold text-gray-400">Fecha:</span> {f.fecha || '—'}</div>
                              <div className="truncate"><span className="font-sans font-semibold text-gray-400">Hash:</span> {f.hash}</div>
                            </div>
                          </div>
                          {f.estado === 'Pendiente' ? (
                            <button onClick={() => ejecutarFirmaCierreAgil(f.id)}
                              disabled={!f.nombre.trim() || !f.puesto.trim()}
                              title={!f.nombre.trim() || !f.puesto.trim() ? 'Captura nombre y puesto primero' : ''}
                              className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-white transition-all hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
                              style={{ background: 'linear-gradient(135deg, #7c3aed 0%, #9333ea 100%)' }}>
                              <Pen size={12} /> Firmar Digitalmente
                            </button>
                          ) : (
                            <div className="text-center py-2 bg-emerald-50/40 border border-dashed border-emerald-200 text-emerald-700 text-xs font-semibold rounded-lg flex items-center justify-center gap-1">
                              <CheckCircle2 size={13} /> Firma Estampada
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Botones CAES Ágil */}
                <div className="flex items-center justify-between">
                  <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50 transition-all">
                    <Download size={13} /> Generar PDF
                  </button>
                  <button
                    disabled={firmantesCierreAgil.some(f => f.estado === 'Pendiente')}
                    onClick={() => alert('Iniciativa cerrada exitosamente.')}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-gray-900 hover:bg-black transition-all disabled:opacity-40 disabled:cursor-not-allowed">
                    <CheckCircle2 size={13} /> Aplicar Cierre en Sistema
                  </button>
                </div>
              </>
              )}
            </div>
          )}

          {/* ── OPCIÓN B: CANCELACIÓN ── */}
          {modoCierre === 'cancelacion' && (
            <div className="bg-white rounded-xl border border-red-100 p-5 space-y-6 animate-fade-in"
              style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
              <div className="border-b border-gray-100 pb-4 flex justify-between items-center">
                <button onClick={() => setModoCierre('ninguno')}
                  className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-800 font-semibold transition-all">
                  <ArrowLeft size={13} /> Volver a opciones de cierre
                </button>
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200 flex items-center gap-1.5">
                  <AlertOctagon size={12} /> Cancelación en Proceso
                </span>
              </div>

              {/* Justificación */}
              <div className="bg-white border border-red-100 rounded-xl overflow-hidden">
                <div className="px-5 py-3.5 bg-red-50/40 border-b border-red-100 font-bold text-xs text-red-950 uppercase tracking-wider flex items-center gap-2">
                  <AlertOctagon size={15} className="text-red-700" /> Justificación de Cancelación
                </div>
                <div className="p-5">
                  <label className="block text-xs font-semibold text-gray-500 mb-2">Motivo detallado <span className="text-red-500">*</span></label>
                  <textarea
                    value={motivoCancelacion}
                    onChange={e => setMotivoCancelacion(e.target.value)}
                    rows={4}
                    placeholder="Describe de forma detallada el motivo de la cancelación, incluyendo el contexto, impacto y cualquier gestión previa realizada..."
                    className="w-full px-3 py-2 text-xs border border-red-200 rounded-lg outline-none focus:border-red-500 bg-white resize-none transition-all"
                  />
                </div>
              </div>

              {/* Documentos obligatorios */}
              <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
                <div className="px-5 py-3.5 bg-gray-50/50 border-b border-gray-100 font-bold text-xs text-gray-700 uppercase tracking-wider flex items-center gap-2">
                  <Upload size={15} className="text-gray-400" /> Evidencia y Documentos Obligatorios
                </div>
                <div className="p-5 grid grid-cols-2 gap-4">
                  <div className="p-4 border border-dashed border-gray-200 rounded-xl bg-gray-50/30 flex flex-col justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-gray-900">Justificación Formal</h4>
                      <p className="text-[10px] text-gray-400 mt-0.5 mb-3">Documento PDF con la justificación formal y autorizada de la cancelación.</p>
                    </div>
                    <label className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-gray-200 bg-white text-xs font-semibold text-gray-600 cursor-pointer hover:bg-gray-50 transition-all text-center">
                      <Upload size={13} /> {archivosCancelacion.justificacion ? '✓ Archivo Cargado' : 'Seleccionar PDF'}
                      <input type="file" accept=".pdf" className="hidden"
                        onChange={e => setArchivosCancelacion({ ...archivosCancelacion, justificacion: e.target.files?.[0] || null })} />
                    </label>
                  </div>
                  <div className="p-4 border border-dashed border-gray-200 rounded-xl bg-gray-50/30 flex flex-col justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-gray-900">Formato CCSR</h4>
                      <p className="text-[10px] text-gray-400 mt-0.5 mb-3">Control de Riesgos y Resarcimiento de Recursos Remanentes.</p>
                    </div>
                    <label className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-gray-200 bg-white text-xs font-semibold text-gray-600 cursor-pointer hover:bg-gray-50 transition-all text-center">
                      <Upload size={13} /> {archivosCancelacion.ccsr ? '✓ Archivo Cargado' : 'Seleccionar PDF'}
                      <input type="file" accept=".pdf" className="hidden"
                        onChange={e => setArchivosCancelacion({ ...archivosCancelacion, ccsr: e.target.files?.[0] || null })} />
                    </label>
                  </div>
                </div>
              </div>

              {/* Firmas de autorización de cancelación */}
              <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
                <div className="px-5 py-3.5 bg-gray-50/50 border-b border-gray-100 font-bold text-xs text-red-950 uppercase tracking-wider flex items-center gap-2">
                  <ShieldCheck size={15} className="text-red-900" /> Firmas de Autorización de Cancelación
                </div>
                <div className="p-5">
                  <div className="grid grid-cols-2 gap-4">
                    {firmantesCancelacion.map(f => {
                      const documentosListos = archivosCancelacion.justificacion && archivosCancelacion.ccsr
                      return (
                        <div key={f.id} className="border border-gray-100 bg-white rounded-xl p-4 flex flex-col justify-between shadow-xs">
                          <div>
                            <div className="flex justify-between items-start mb-1">
                              <h5 className="text-xs font-bold text-gray-900">{f.nombre}</h5>
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${f.estado === 'Firmado' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                                {f.estado === 'Pendiente' ? 'Firma Obligatoria' : 'Cancelación Firmada'}
                              </span>
                            </div>
                            <p className="text-[11px] text-gray-400 font-medium mb-3">{f.puesto}</p>
                            <div className="space-y-1 bg-gray-50 p-2.5 rounded-lg border border-gray-100 font-mono text-[10px] text-gray-500 mb-4">
                              <div><span className="font-sans font-semibold text-gray-400">Sello:</span> {f.fecha}</div>
                              <div className="truncate"><span className="font-sans font-semibold text-gray-400">Hash:</span> {f.hash}</div>
                            </div>
                          </div>
                          {f.estado === 'Pendiente' ? (
                            <button
                              onClick={() => ejecutarFirmaCancelacion(f.id)}
                              disabled={!documentosListos || motivoCancelacion.trim() === ''}
                              title={!documentosListos ? 'Carga los documentos obligatorios primero' : motivoCancelacion.trim() === '' ? 'Ingresa la justificación primero' : ''}
                              className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-white bg-red-900 hover:bg-red-950 transition-all disabled:opacity-40 disabled:cursor-not-allowed">
                              <ShieldCheck size={13} /> Firmar Cancelación Definitiva
                            </button>
                          ) : (
                            <div className="text-center py-2 bg-emerald-50/40 border border-dashed border-emerald-200 text-emerald-700 text-xs font-semibold rounded-lg flex items-center justify-center gap-1">
                              <CheckCircle2 size={13} /> Testigo de Abandono Estampado
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>

              {/* Botón final cancelación */}
              <div className="flex justify-end pt-2">
                <button
                  disabled={firmantesCancelacion.some(f => f.estado === 'Pendiente')}
                  onClick={() => { alert('Iniciativa dada de baja formalmente con estatus: Cancelada.'); setModoCierre('ninguno') }}
                  className="px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-gray-900 hover:bg-black transition-all disabled:opacity-40 disabled:cursor-not-allowed">
                  Aplicar Baja en Sistema
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}