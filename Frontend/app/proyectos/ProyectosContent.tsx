'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Briefcase, TrendingUp, Clock, CheckCircle2,
  FileText, Users, Calendar, Plus, ChevronDown,
  MoreHorizontal, ChevronRight, AlertOctagon,
  Layers, GitBranch, Archive, XCircle, Loader2,
  Search, X
} from 'lucide-react'
import {
  iniciativas, estadoIniciativaConfig, IniciativaEstado,
  MarcoTrabajo, Iniciativa
} from '../../lib/data'

// ─── helpers ────────────────────────────────────────────────────
const estadoIconMap: Record<IniciativaEstado, React.ElementType> = {
  'Inicial':       Loader2,
  'Formalizado':   CheckCircle2,
  'En Estimación': Clock,
  'En Proceso':    TrendingUp,
  'Cerrado':       Archive,
  'Cancelado':     XCircle,
}

const priorityConfig: Record<string, string> = {
  Alta:  'bg-red-50 text-red-600 border border-red-200',
  Media: 'bg-orange-50 text-orange-600 border border-orange-200',
  Baja:  'bg-gray-100 text-gray-500 border border-gray-200',
}

const marcoConfig: Record<string, { color: string; bg: string }> = {
  Cascada: { color: '#7c3aed', bg: 'rgba(124,58,237,0.08)' },
  Ágil:    { color: '#0284c7', bg: 'rgba(2,132,199,0.08)'  },
}

const estadoFiltros: (IniciativaEstado | 'Todos')[] = [
  'Todos', 'Inicial', 'Formalizado', 'En Estimación', 'En Proceso', 'Cerrado', 'Cancelado',
]

// ─── Badge de estado ─────────────────────────────────────────────
function EstadoBadge({ estado }: { estado: IniciativaEstado }) {
  const cfg  = estadoIniciativaConfig[estado]
  const Icon = estadoIconMap[estado]
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border"
      style={{ color: cfg.color, background: cfg.bg, borderColor: cfg.border }}
    >
      <Icon size={11} strokeWidth={2} />
      {cfg.label}
    </span>
  )
}

// ─── Modal minimalista: solo datos de identificación ─────────────
// Captura los datos mínimos para crear el registro y navegar al
// flujo completo de IniciativaDetail donde se llena RES, marco,
// Carta Preliminar, Estimación, Construcción y Cierre.
function NuevaIniciativaModal({
  onClose,
  onCreate,
}: {
  onClose: () => void
  onCreate: (nombre: string, cliente: string, responsable: string) => void
}) {
  const [nombre,      setNombre]      = useState('')
  const [cliente,     setCliente]     = useState('')
  const [responsable, setResponsable] = useState('')
  const [errors,      setErrors]      = useState<Record<string, string>>({})

  const validate = () => {
    const e: Record<string, string> = {}
    if (!nombre.trim())      e.nombre      = 'El nombre es obligatorio'
    if (!cliente.trim())     e.cliente     = 'El cliente es obligatorio'
    if (!responsable.trim()) e.responsable = 'El responsable es obligatorio'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleCreate = () => {
    if (!validate()) return
    onCreate(nombre.trim(), cliente.trim(), responsable.trim())
  }

  const inp = (field: string) =>
    `w-full px-3 py-2.5 text-sm border rounded-xl outline-none transition-all focus:ring-2 focus:ring-[#6B1A2A]/20 focus:border-[#6B1A2A] bg-white ${
      errors[field] ? 'border-red-300 bg-red-50' : 'border-gray-200'
    }`

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.4)' }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 border border-gray-100 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-base font-bold text-gray-900">Nueva Iniciativa</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Datos de identificación · El flujo completo se abrirá a continuación
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 transition-all"
          >
            <X size={17} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          {/* Aviso orientador */}
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl flex items-start gap-2.5">
            <FileText size={14} className="text-blue-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-blue-700 leading-relaxed">
              Ingresa los datos básicos para registrar la iniciativa. Después podrás
              completar el <strong>RES, marco de trabajo, Carta Preliminar,
              Estimación, Construcción y Cierre</strong> en el flujo completo.
            </p>
          </div>

          {/* Nombre */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">
              Nombre de la iniciativa <span className="text-red-500">*</span>
            </label>
            <input
              className={inp('nombre')}
              placeholder="Ej. Modernización Sistema de Pagos"
              value={nombre}
              onChange={e => { setNombre(e.target.value); setErrors(ev => ({ ...ev, nombre: '' })) }}
            />
            {errors.nombre && (
              <p className="text-xs text-red-500 mt-1">{errors.nombre}</p>
            )}
          </div>

          {/* Cliente */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">
              Cliente / Entidad solicitante <span className="text-red-500">*</span>
            </label>
            <input
              className={inp('cliente')}
              placeholder="Ej. SAT — Administración Central"
              value={cliente}
              onChange={e => { setCliente(e.target.value); setErrors(ev => ({ ...ev, cliente: '' })) }}
            />
            {errors.cliente && (
              <p className="text-xs text-red-500 mt-1">{errors.cliente}</p>
            )}
          </div>

          {/* Responsable */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">
              Responsable / Líder <span className="text-red-500">*</span>
            </label>
            <input
              className={inp('responsable')}
              placeholder="Nombre del líder de proyecto"
              value={responsable}
              onChange={e => { setResponsable(e.target.value); setErrors(ev => ({ ...ev, responsable: '' })) }}
            />
            {errors.responsable && (
              <p className="text-xs text-red-500 mt-1">{errors.responsable}</p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between bg-gray-50 rounded-b-2xl">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 border border-gray-200 rounded-xl hover:bg-white transition-all"
          >
            Cancelar
          </button>
          <button
            onClick={handleCreate}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90"
            style={{ background: 'linear-gradient(135deg, #6B1A2A 0%, #8B2339 100%)' }}
          >
            Crear e iniciar flujo <ChevronRight size={15} />
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Componente principal ────────────────────────────────────────
export default function ProyectosContent() {
  const router         = useRouter()
  const [filter,       setFilter]       = useState<IniciativaEstado | 'Todos'>('Todos')
  const [busqueda,     setBusqueda]     = useState('')
  const [showModal,    setShowModal]    = useState(false)
  const [showFilter,   setShowFilter]   = useState(false)
  const [data,         setData]         = useState<Iniciativa[]>(iniciativas)

  // Aplicar filtros
  const filtered = data.filter(p => {
    const matchEstado   = filter === 'Todos' || p.estado === filter
    const matchBusqueda = !busqueda.trim() ||
      p.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      p.cliente.toLowerCase().includes(busqueda.toLowerCase()) ||
      p.responsable?.toLowerCase().includes(busqueda.toLowerCase())
    return matchEstado && matchBusqueda
  })

  // Métricas calculadas desde los datos reales
  const metricsData = [
    { label: 'Total Iniciativas', value: data.length,                                         icon: Briefcase,    color: '#6B1A2A', bg: 'rgba(107,26,42,0.08)'  },
    { label: 'En Proceso',        value: data.filter(d => d.estado === 'En Proceso').length,   icon: TrendingUp,   color: '#059669', bg: 'rgba(5,150,105,0.08)' },
    { label: 'En Estimación',     value: data.filter(d => d.estado === 'En Estimación').length,icon: Clock,        color: '#d97706', bg: 'rgba(217,119,6,0.08)' },
    { label: 'Inicial / Formal',  value: data.filter(d => d.estado === 'Inicial' || d.estado === 'Formalizado').length, icon: CheckCircle2, color: '#0284c7', bg: 'rgba(2,132,199,0.08)' },
  ]

  // Crear iniciativa: solo datos mínimos, luego navegar a IniciativaDetail
  const handleCrear = (nombre: string, cliente: string, responsable: string) => {
    const nueva: Iniciativa = {
      id:             `INIC-2026-00${data.length + 1}`,
      nombre,
      cliente,
      responsable,
      descripcion:    '',
      estado:         'Inicial',
      marcoTrabajo:   'Cascada',   // placeholder hasta que se defina en el RES
      prioridad:      'Alta',
      avanceTotal:    0,
      presupuesto:    'Por definir',
      fechaInicio:    '',
      fechaFin:       '',
      area:           '',
      miembros:       1,
      autorizadoresRES: [],
      entregables:    [],
      actividades:    [],
      documentos:     {},
      fasesCerradas:  [],
    }
    setData(d => [nueva, ...d])
    setShowModal(false)
    // Navegar al flujo completo de IniciativaDetail
    router.push(`/proyectos/${nueva.id}`)
  }

  return (
    <div className="animate-fade-in">
      {/* Modal nueva iniciativa */}
      {showModal && (
        <NuevaIniciativaModal
          onClose={() => setShowModal(false)}
          onCreate={handleCrear}
        />
      )}

      {/* ── Header ── */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            Iniciativas y Proyectos
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Gestión integral del ciclo de vida de iniciativas
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90"
          style={{ background: 'linear-gradient(135deg, #6B1A2A 0%, #8B2339 100%)' }}
        >
          <Plus size={15} /> Nueva Iniciativa
        </button>
      </div>

      {/* ── Métricas ── */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {metricsData.map((m, i) => (
          <div
            key={i}
            className={`metric-card animate-fade-in stagger-${i + 1}`}
          >
            <div className="flex items-center justify-between mb-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: m.bg }}
              >
                <m.icon size={19} style={{ color: m.color }} strokeWidth={1.8} />
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-0.5">{m.value}</div>
            <div className="text-xs font-medium text-gray-500">{m.label}</div>
          </div>
        ))}
      </div>

      {/* ── Flujo de estados (visual) ── */}
      <div
        className="mb-5 bg-white rounded-xl border border-gray-100 px-5 py-4 animate-fade-in stagger-2"
        style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
      >
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
          Flujo de Estados
        </p>
        <div className="flex items-center gap-2 flex-wrap">
          {(
            ['Inicial', 'Formalizado', 'En Estimación', 'En Proceso', 'Cerrado'] as IniciativaEstado[]
          ).map((estado, idx) => {
            const cfg = estadoIniciativaConfig[estado]
            return (
              <div key={estado} className="flex items-center gap-2">
                <span
                  className="px-3 py-1.5 rounded-full text-xs font-semibold border"
                  style={{ color: cfg.color, background: cfg.bg, borderColor: cfg.border }}
                >
                  {cfg.label}
                </span>
                {idx < 4 && <ChevronRight size={13} className="text-gray-300" />}
              </div>
            )
          })}
          <div className="ml-2 flex items-center gap-1.5 text-xs text-gray-400">
            <AlertOctagon size={13} className="text-red-400" />
            <span style={{ color: estadoIniciativaConfig['Cancelado'].color }}>
              Cancelado
            </span>
            <span className="text-gray-300">(en cualquier punto)</span>
          </div>
        </div>
      </div>

      {/* ── Listado ── */}
      <div
        className="bg-white rounded-xl border border-gray-100 animate-fade-in stagger-3"
        style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
      >
        {/* Toolbar del listado */}
        <div className="px-5 py-4 border-b border-gray-50 flex items-center gap-3">
          {/* Buscador inline */}
          <div className="flex-1 relative">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              placeholder="Buscar por nombre, cliente o responsable..."
              className="w-full pl-9 pr-4 py-2 text-xs border border-gray-200 rounded-lg outline-none focus:border-red-900 bg-white transition-all"
            />
          </div>

          {/* Filtro de estado */}
          <div className="relative">
            <button
              onClick={() => setShowFilter(s => !s)}
              className="flex items-center gap-2 px-3 py-2 text-xs text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-all font-medium"
            >
              {filter === 'Todos' ? 'Todos los estados' : filter}
              <ChevronDown size={12} />
            </button>
            {showFilter && (
              <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-10 py-1 min-w-[190px]">
                {estadoFiltros.map(e => (
                  <button
                    key={e}
                    onClick={() => { setFilter(e); setShowFilter(false) }}
                    className="w-full text-left px-4 py-2.5 text-xs hover:bg-gray-50 transition-all flex items-center gap-2"
                    style={{
                      color:
                        e !== 'Todos'
                          ? estadoIniciativaConfig[e as IniciativaEstado].color
                          : '#374151',
                      fontWeight: filter === e ? 700 : 500,
                    }}
                  >
                    {e !== 'Todos' && (
                      <span
                        className="w-2 h-2 rounded-full inline-block flex-shrink-0"
                        style={{
                          background: estadoIniciativaConfig[e as IniciativaEstado].color,
                        }}
                      />
                    )}
                    {e === 'Todos' ? 'Todos los estados' : e}
                  </button>
                ))}
              </div>
            )}
          </div>

          <p className="text-xs text-gray-400 whitespace-nowrap">
            {filtered.length} resultado{filtered.length !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Filas de iniciativas */}
        <div className="divide-y divide-gray-50">
          {filtered.map((p, i) => {
            const marco = marcoConfig[p.marcoTrabajo] ?? marcoConfig['Cascada']
            return (
              <div
                key={p.id}
                className={`px-5 py-5 hover:bg-gray-50/60 transition-all cursor-pointer group animate-fade-in stagger-${Math.min(i + 1, 6)}`}
                onClick={() => router.push(`/proyectos/${p.id}`)}
              >
                {/* Fila superior: nombre + badges + presupuesto + acciones */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2.5 mb-1 flex-wrap">
                      {/* ID de la iniciativa */}
                      <span className="text-[10px] font-mono text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
                        {p.id}
                      </span>
                      <h4 className="text-sm font-semibold text-gray-900 truncate">
                        {p.nombre}
                      </h4>
                      <EstadoBadge estado={p.estado} />
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${priorityConfig[p.prioridad]}`}
                      >
                        {p.prioridad}
                      </span>
                      {p.marcoTrabajo && (
                        <span
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold"
                          style={{ color: marco.color, background: marco.bg }}
                        >
                          {p.marcoTrabajo === 'Cascada'
                            ? <Layers size={10} />
                            : <GitBranch size={10} />}
                          {p.marcoTrabajo}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500">{p.cliente}</p>
                  </div>

                  <div className="flex items-center gap-3 ml-4 flex-shrink-0">
                    <div className="text-right">
                      <div className="text-sm font-bold text-gray-900">
                        {p.presupuesto}
                      </div>
                      <div className="text-[10px] text-gray-400">Presupuesto</div>
                    </div>
                    <button
                      className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-gray-100 transition-all"
                      onClick={e => e.stopPropagation()}
                      title="Más opciones"
                    >
                      <MoreHorizontal size={15} className="text-gray-400" />
                    </button>
                  </div>
                </div>

                {/* Barra de avance */}
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-xs text-gray-400 w-14 flex-shrink-0">Avance</span>
                  <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${p.avanceTotal}%`,
                        background:
                          p.avanceTotal >= 80
                            ? 'linear-gradient(90deg, #059669, #34d399)'
                            : p.avanceTotal >= 50
                            ? 'linear-gradient(90deg, #6B1A2A, #C4384F)'
                            : 'linear-gradient(90deg, #d97706, #fbbf24)',
                      }}
                    />
                  </div>
                  <span className="text-xs font-semibold text-gray-600 w-8 text-right">
                    {p.avanceTotal}%
                  </span>
                </div>

                {/* Fase actual (si existe) */}
                {p.faseActual && (
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xs text-gray-400">Fase actual:</span>
                    <span
                      className="text-xs font-semibold px-2 py-0.5 rounded-full"
                      style={{ background: 'rgba(107,26,42,0.08)', color: '#6B1A2A' }}
                    >
                      {p.faseActual}
                    </span>
                  </div>
                )}

                {/* Meta-datos: entregables, miembros, fecha, CTA */}
                <div className="flex items-center gap-5 text-xs text-gray-400">
                  <span className="flex items-center gap-1.5">
                    <FileText size={12} className="text-gray-300" />
                    {p.entregables.length} entregables
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Users size={12} className="text-gray-300" />
                    {p.miembros} miembros
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Calendar size={12} className="text-gray-300" />
                    Vence: {p.fechaFin || 'Por definir'}
                  </span>
                  <span className="ml-auto flex items-center gap-1 text-xs font-medium text-gray-400 group-hover:text-gray-700 transition-all opacity-0 group-hover:opacity-100">
                    Ver detalle y flujo completo <ChevronRight size={12} />
                  </span>
                </div>
              </div>
            )
          })}

          {/* Estado vacío */}
          {filtered.length === 0 && (
            <div className="px-5 py-14 text-center">
              <Search size={30} className="mx-auto text-gray-200 mb-3" />
              <p className="text-sm font-semibold text-gray-400 mb-1">
                Sin resultados
              </p>
              <p className="text-xs text-gray-300">
                {busqueda
                  ? 'Ninguna iniciativa coincide con tu búsqueda.'
                  : 'No hay iniciativas con el estado seleccionado.'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}