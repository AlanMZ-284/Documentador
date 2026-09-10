'use client'
import { useRef, useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts'
import {
  FileText, CheckCircle, Clock, Briefcase, Upload,
  TrendingUp, TrendingDown, MoreHorizontal, Filter,
  ChevronDown, Sparkles, Eye, Download, ChevronRight,
  Layers, GitBranch, AlertOctagon
} from 'lucide-react'
import { documentosApi } from '../../lib/api'
import { useDocumentos } from '../../lib/hooks'
import { statusConfig, iniciativas, estadoIniciativaConfig, IniciativaEstado } from '../../lib/data'

const chartData = [
  { mes: 'Ene', docs: 45 },
  { mes: 'Feb', docs: 52 },
  { mes: 'Mar', docs: 61 },
  { mes: 'Abr', docs: 48 },
  { mes: 'May', docs: 73 },
  { mes: 'Jun', docs: 65 },
]

function UploadZone({ onUpload }: { onUpload?: () => void }) {
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [uploads, setUploads] = useState<{ name: string; progress: number; status: string }[]>([])
  const [error, setError] = useState<string | null>(null)

  const updateUpload = (name: string, updates: Partial<{ progress: number; status: string }>) => {
    setUploads((prev) => prev.map((u) => (u.name === name ? { ...u, ...updates } : u)))
  }

  const handleFileUpload = async (file: File) => {
    const item = { name: file.name, progress: 0, status: 'Preparando...' }
    setUploads((prev) => [...prev, item])
    setError(null)

    try {
      updateUpload(file.name, { progress: 20, status: 'Creando documento...' })
      const documento = await documentosApi.create({ id_tipo_documento: 1, titulo_documento: file.name })

      const formData = new FormData()
      formData.append('archivo', file, file.name)

      updateUpload(file.name, { progress: 45, status: 'Subiendo versión...' })
      await documentosApi.uploadVersion(documento.id_documento, formData)

      updateUpload(file.name, { progress: 100, status: 'Carga completa ✓' })
      if (onUpload) onUpload()
    } catch (err) {
      console.error(err)
      updateUpload(file.name, { progress: 0, status: 'Error al subir' })
      setError('No se pudo cargar el documento. Verifica tu conexión o vuelve a intentar.')
    }
  }

  const handleFiles = (files: FileList | File[]) => {
    const list = Array.from(files)
    list.forEach((file) => void handleFileUpload(file))
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    handleFiles(e.dataTransfer.files)
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
      <h3 className="text-sm font-semibold text-gray-800 mb-4 flex items-center gap-2">
        <Upload size={15} className="text-gray-400" />
        Carga de Documentos
      </h3>

      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        multiple
        onChange={(e) => {
          if (e.target.files) handleFiles(e.target.files)
          e.currentTarget.value = ''
        }}
      />

      <div
        className={`upload-zone ${isDragging ? 'drag-over' : ''}`}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
        onDragEnter={(e) => { e.preventDefault(); setIsDragging(true) }}
        onDragLeave={(e) => {
          e.preventDefault()
          if (e.currentTarget.contains(e.relatedTarget as Node)) return
          setIsDragging(false)
        }}
        onDrop={handleDrop}
      >
        <div
          className="w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center"
          style={{ background: 'rgba(107,26,42,0.08)' }}
        >
          <Upload size={22} style={{ color: '#6B1A2A' }} />
        </div>
        <p className="text-sm text-gray-600 mb-1">
          Arrastra documentos aquí o{' '}
          <span
            className="font-semibold cursor-pointer"
            style={{ color: '#6B1A2A' }}
            onClick={() => fileInputRef.current?.click()}
          >
            busca archivos
          </span>
        </p>
        <p className="text-xs text-gray-400">PDF, DOC, XLS, IMG · Máx. 50MB por archivo</p>
      </div>

      {error && (
        <div className="mt-4 p-3 rounded-xl bg-red-50 text-sm text-red-700 border border-red-100">
          {error}
        </div>
      )}

      {uploads.length > 0 && (
        <div className="mt-4 space-y-3">
          {uploads.map((u, i) => (
            <div key={i}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-gray-700 truncate max-w-[160px]">{u.name}</span>
                <span className="text-xs" style={{ color: u.progress === 100 ? '#059669' : '#6B1A2A' }}>
                  {u.status}
                </span>
              </div>
              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${u.progress}%`,
                    background: u.progress === 100
                      ? 'linear-gradient(90deg, #059669, #34d399)'
                      : 'linear-gradient(90deg, #6B1A2A, #C4384F)',
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// Mini initiative status bar
function IniciativasResumen() {
  const estadoOrder: IniciativaEstado[] = ['Inicial', 'Formalizado', 'En Estimación', 'En Proceso', 'Cerrado', 'Cancelado']
  const counts = estadoOrder.map(e => ({ estado: e, count: iniciativas.filter(i => i.estado === e).length })).filter(x => x.count > 0)

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5 animate-fade-in stagger-4" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-gray-800">Estado de Iniciativas</h3>
          <p className="text-xs text-gray-400 mt-0.5">Resumen del ciclo de vida activo</p>
        </div>
        <a href="/proyectos" className="flex items-center gap-1 text-xs font-semibold hover:opacity-80 transition-all" style={{ color: '#6B1A2A' }}>
          Ver todas <ChevronRight size={12} />
        </a>
      </div>

      <div className="space-y-3">
        {counts.map(({ estado, count }) => {
          const cfg = estadoIniciativaConfig[estado]
          return (
            <div key={estado} className="flex items-center gap-3">
              <span className="w-24 text-xs font-semibold" style={{ color: cfg.color }}>{estado}</span>
              <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${(count / iniciativas.length) * 100}%`, background: cfg.color }} />
              </div>
              <span className="text-xs font-bold text-gray-600 w-4 text-right">{count}</span>
            </div>
          )
        })}
      </div>

      <div className="mt-4 pt-3 border-t border-gray-50">
        <div className="flex gap-3 flex-wrap">
          {iniciativas.slice(0, 3).map(ini => {
            const cfg = estadoIniciativaConfig[ini.estado]
            const MarcoIcon = ini.marcoTrabajo === 'Cascada' ? Layers : GitBranch
            return (
              <a key={ini.id} href={`/proyectos/${ini.id}`}
                className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all cursor-pointer flex-1 min-w-0">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-gray-800 truncate">{ini.nombre}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-xs font-semibold" style={{ color: cfg.color }}>{cfg.label}</span>
                    <span className="text-gray-300">·</span>
                    <span className="text-xs text-gray-400">{ini.avanceTotal}%</span>
                  </div>
                </div>
                <MarcoIcon size={13} className="flex-shrink-0" style={{ color: '#9ca3af' }} />
              </a>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default function DashboardContent() {
  const { documentos, total, loading, error, reload } = useDocumentos()

  const metrics = [
    {
      label: 'Total Documentos',
      value: loading ? 'Cargando...' : total.toLocaleString(),
      sub: 'Documentos en el repositorio',
      delta: '+12.5%',
      up: true,
      icon: FileText,
      color: '#6B1A2A',
      bg: 'rgba(107,26,42,0.07)',
    },
    {
      label: 'Validados',
      value: '892',
      sub: 'Conformidad 100%',
      delta: '+8.3%',
      up: true,
      icon: CheckCircle,
      color: '#059669',
      bg: 'rgba(5,150,105,0.07)',
    },
    {
      label: 'En Proceso',
      value: '234',
      sub: 'Análisis IA activo',
      delta: '-5.2%',
      up: false,
      icon: Clock,
      color: '#0284c7',
      bg: 'rgba(2,132,199,0.07)',
    },
    {
      label: 'Iniciativas Activas',
      value: String(iniciativas.filter(i => i.estado === 'En Proceso' || i.estado === 'En Estimación').length),
      sub: `${iniciativas.length} iniciativas total`,
      delta: '+3',
      up: true,
      icon: Briefcase,
      color: '#7c3aed',
      bg: 'rgba(124,58,237,0.07)',
    },
  ]

  const documentStatus = (status: string | null | undefined) => {
    if (!status) {
      return { label: 'Pendiente', className: 'pill pill-pending' }
    }
    return statusConfig[status as keyof typeof statusConfig] ?? { label: String(status), className: 'pill pill-pending' }
  }

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Dashboard de Gestión Documental</h1>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {metrics.map((m, i) => (
          <div key={i} className={`metric-card animate-fade-in stagger-${i + 1}`}>
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: m.bg }}>
                <m.icon size={19} style={{ color: m.color }} strokeWidth={1.8} />
              </div>
              <span
                className="text-xs font-semibold flex items-center gap-1"
                style={{ color: m.up ? '#059669' : '#dc2626' }}
              >
                {m.up ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                {m.delta}
              </span>
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-0.5">{m.value}</div>
            <div className="text-xs font-medium text-gray-500">{m.label}</div>
            <div className="text-xs text-gray-400 mt-1">{m.sub}</div>
          </div>
        ))}
      </div>

      {/* Chart + Upload */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {/* Chart */}
        <div
          className="col-span-2 bg-white rounded-xl p-5 border border-gray-100 animate-fade-in stagger-3"
          style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-gray-800">Documentos Procesados</h3>
              <p className="text-xs text-gray-400 mt-0.5">Últimos 6 meses</p>
            </div>
            <div className="flex items-center gap-2">
              
              <span className="text-xs text-gray-500 font-medium">Tendencia IA</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData} barSize={28}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
              <XAxis dataKey="mes" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af' }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af' }} />
              <Tooltip
                cursor={{ fill: 'rgba(107,26,42,0.04)' }}
                contentStyle={{
                  background: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '12px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                }}
              />
              <Bar dataKey="docs" fill="#6B1A2A" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Upload Zone */}
        <div className="animate-fade-in stagger-4">
          <UploadZone onUpload={reload} />
        </div>
      </div>

      {/* Initiatives summary + Recent Documents */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="col-span-1">
          <IniciativasResumen />
        </div>

        {/* Recent Documents */}
        <div
          className="col-span-2 bg-white rounded-xl border border-gray-100 animate-fade-in stagger-5"
          style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
        >
          <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-gray-800">Documentos Recientes</h3>
              <p className="text-xs text-gray-400 mt-0.5">{loading ? 'Cargando documentos…' : `${total} documentos en el repositorio`}</p>
            </div>
            <div className="flex items-center gap-2">
              <button className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-800 px-3 py-1.5 rounded-lg border border-gray-200 hover:border-gray-300 transition-all">
                <Filter size={12} />
                Todos los estados
                <ChevronDown size={11} />
              </button>
            </div>
          </div>

          {loading ? (
            <div className="p-6 text-sm text-gray-500">Cargando documentos recientes…</div>
          ) : error ? (
            <div className="p-6 text-sm text-red-600">No se pudieron cargar los documentos: {error}</div>
          ) : documentos.length === 0 ? (
            <div className="p-6 text-sm text-gray-500">No hay documentos disponibles para mostrar.</div>
          ) : (
            <div className="grid grid-cols-2 gap-0 divide-x divide-gray-50">
              {documentos.slice(0, 4).map((doc) => {
                const status = documentStatus(doc.estatus_aceptacion)
                const dateLabel = doc.fecha_creacion ? new Date(doc.fecha_creacion).toLocaleDateString('es-ES') : 'Sin fecha'
                return (
                  <div
                    key={doc.id_documento}
                    className="p-5 hover:bg-gray-50/50 transition-all cursor-pointer group"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ background: 'rgba(107,26,42,0.08)' }}
                      >
                        <FileText size={15} style={{ color: '#6B1A2A' }} strokeWidth={1.8} />
                      </div>
                      <button className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-gray-100 transition-all">
                        <MoreHorizontal size={15} className="text-gray-400" />
                      </button>
                    </div>

                    <h4 className="text-[13px] font-semibold text-gray-800 leading-snug mb-1 line-clamp-2">
                      {doc.titulo_documento}
                    </h4>
                    <p className="text-xs text-gray-400 font-mono mb-2">{doc.id_documento}</p>

                    <div className="space-y-1 mb-3">
                      <div className="flex items-center gap-1.5 text-xs text-gray-500">
                        <Briefcase size={11} className="text-gray-300" />
                        {doc.id_proyecto ? `Proyecto ${doc.id_proyecto}` : 'Proyecto no asignado'}
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-gray-500">
                        <Clock size={11} className="text-gray-300" />
                        {dateLabel}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      <span className={status.className}>{status.label}</span>
                      <span className="pill pill-tag">v{doc.version_actual}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
