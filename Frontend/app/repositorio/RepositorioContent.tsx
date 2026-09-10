'use client'
/**
 * app/repositorio/RepositorioContent.tsx
 * Conectado a GET /api/documentos del backend.
 */
import { useState } from 'react'
import { Search, FileText, Clock, Hash, CheckCircle2, Circle } from 'lucide-react'
import { useDocumentos } from '../../lib/hooks'
import { Documento } from '../../lib/api'
import { LoadingState, ErrorState, EmptyState } from '../../components/ui/DataStates'

const estatusColor: Record<string, { color: string; bg: string }> = {
  'Aprobado':    { color: '#059669', bg: 'rgba(5,150,105,0.1)' },
  'Firmado':     { color: '#7c3aed', bg: 'rgba(124,58,237,0.1)' },
  'En revisión': { color: '#0284c7', bg: 'rgba(2,132,199,0.1)' },
  'Rechazado':   { color: '#dc2626', bg: 'rgba(220,38,38,0.1)' },
  'Pendiente':   { color: '#d97706', bg: 'rgba(217,119,6,0.1)' },
}

function fmtDate(d: string | null) {
  if (!d) return '—'
  try {
    return new Date(d).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })
  } catch { return d }
}

function DocCard({ doc }: { doc: Documento }) {
  const est = doc.estatus_aceptacion ?? 'Pendiente'
  const cfg = estatusColor[est] ?? { color: '#6b7280', bg: 'rgba(107,114,128,0.1)' }
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5 transition-all hover:border-gray-200 hover:shadow-sm cursor-pointer" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
      <div className="flex items-start justify-between mb-3">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(107,26,42,0.08)' }}>
          <FileText size={17} style={{ color: '#6B1A2A' }} strokeWidth={1.8} />
        </div>
        <span className="text-xs font-medium px-2.5 py-1 rounded-full" style={{ background: cfg.bg, color: cfg.color }}>
          {est}
        </span>
      </div>
      <h4 className="text-[13px] font-semibold text-gray-900 leading-snug mb-1 line-clamp-2">{doc.titulo_documento}</h4>
      <p className="text-xs text-gray-400 font-mono mb-3 truncate">{doc.id_documento}</p>
      <div className="space-y-1.5 pt-3 border-t border-gray-50">
        <div className="flex items-center gap-1.5 text-xs text-gray-500">
          <Hash size={11} className="text-gray-300" /> Versión {doc.version_actual}
        </div>
        <div className="flex items-center gap-1.5 text-xs text-gray-500">
          <Clock size={11} className="text-gray-300" /> {fmtDate(doc.fecha_ultima_modificacion)}
        </div>
      </div>
    </div>
  )
}

export default function RepositorioContent() {
  const [search, setSearch] = useState('')
  const { documentos, total, loading, error, reload } = useDocumentos(search ? { q: search } : undefined)

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Repositorio Documental</h1>
        <p className="text-sm text-gray-500 mt-1">{total} documentos en el repositorio</p>
      </div>

      <div className="mb-5 relative max-w-md">
        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar documento por título…"
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-gray-400 transition-all bg-white"
        />
      </div>

      {loading && <LoadingState label="Cargando documentos…" />}
      {!loading && error && <ErrorState message={error} onRetry={reload} />}
      {!loading && !error && documentos.length === 0 && <EmptyState label="No hay documentos en el repositorio" />}
      {!loading && !error && documentos.length > 0 && (
        <div className="grid grid-cols-4 gap-4">
          {documentos.map(doc => <DocCard key={doc.id_documento} doc={doc} />)}
        </div>
      )}
    </div>
  )
}