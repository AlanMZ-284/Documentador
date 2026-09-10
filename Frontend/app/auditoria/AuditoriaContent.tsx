'use client'
/**
 * app/auditoria/AuditoriaContent.tsx
 * Conectado a GET /api/auditoria (solo SuperAdministrador / Administrador).
 */
import { useState } from 'react'
import {
  Activity, Shield, AlertTriangle, XCircle,
  Search, FileText, User, Clock,
} from 'lucide-react'
import { useAuditoria } from '../../lib/hooks'
import { AuditoriaEvento } from '../../lib/api'
import { LoadingState, ErrorState, EmptyState } from '../../components/ui/DataStates'

// Acciones que el backend marca como advertencia/error
const WARN_ACTIONS = new Set(['AUTH_LOGIN_FAILED', 'ACCESS_DENIED', 'AUTH_LOCKED'])
const ERROR_ACTIONS = new Set(['DELETE', 'SYSTEM_ERROR'])

function statusFor(accion: string): { label: string; cls: string } {
  if (ERROR_ACTIONS.has(accion)) return { label: 'Error', cls: 'bg-red-50 text-red-700 border border-red-200' }
  if (WARN_ACTIONS.has(accion)) return { label: 'Advertencia', cls: 'bg-amber-50 text-amber-700 border border-amber-200' }
  return { label: 'Exitoso', cls: 'bg-emerald-50 text-emerald-700 border border-emerald-200' }
}

function iconFor(accion: string) {
  if (accion.includes('LOGIN') || accion.includes('AUTH')) return { Icon: User, color: '#0284c7' }
  if (accion.includes('DELETE') || accion.includes('DENIED')) return { Icon: XCircle, color: '#dc2626' }
  return { Icon: Shield, color: '#059669' }
}

function fmtDate(d: string) {
  try {
    return new Date(d).toLocaleString('es-MX', {
      day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
    })
  } catch {
    return d
  }
}

function EventRow({ ev }: { ev: AuditoriaEvento }) {
  const st = statusFor(ev.tipo_accion)
  const { Icon, color } = iconFor(ev.tipo_accion)
  return (
    <div className="flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50/50 transition-all border-b border-gray-50">
      <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${color}14` }}>
        <Icon size={16} style={{ color }} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-gray-800">{ev.tipo_accion}</div>
        <div className="text-xs text-gray-400 truncate">
          {ev.id_entidad_afectada ? `Entidad: ${ev.id_entidad_afectada}` : '–'}
        </div>
      </div>
      <div className="text-xs text-gray-500 w-32 flex-shrink-0">
        <div className="flex items-center gap-1.5">
          <User size={11} className="text-gray-300" />
          {ev.id_usuario ? `Usuario #${ev.id_usuario}` : 'Sistema'}
        </div>
      </div>
      <div className="text-xs text-gray-400 w-44 flex-shrink-0 flex items-center gap-1.5">
        <Clock size={11} className="text-gray-300" />
        {fmtDate(ev.timestamp_exacto)}
      </div>
      <div className="text-xs text-gray-400 w-28 flex-shrink-0 font-mono">{ev.ip_direccion ?? '—'}</div>
      <span className={`text-xs px-2.5 py-1 rounded-full flex-shrink-0 ${st.cls}`}>{st.label}</span>
    </div>
  )
}

export default function AuditoriaContent() {
  const [search, setSearch] = useState('')
  const { eventos, total, loading, error, reload } = useAuditoria(search ? { q: search } : undefined)

  const okCount = eventos.filter(e => statusFor(e.tipo_accion).label === 'Exitoso').length
  const warnCount = eventos.filter(e => statusFor(e.tipo_accion).label === 'Advertencia').length
  const errCount = eventos.filter(e => statusFor(e.tipo_accion).label === 'Error').length

  const metrics = [
    { label: 'Eventos Totales', value: total, icon: Activity, color: '#6B1A2A', bg: 'rgba(107,26,42,0.08)' },
    { label: 'Acciones Exitosas', value: okCount, icon: Shield, color: '#059669', bg: 'rgba(5,150,105,0.08)' },
    { label: 'Advertencias', value: warnCount, icon: AlertTriangle, color: '#d97706', bg: 'rgba(217,119,6,0.08)' },
    { label: 'Errores', value: errCount, icon: XCircle, color: '#dc2626', bg: 'rgba(220,38,38,0.08)' },
  ]

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Auditoría y Registro</h1>
        <p className="text-sm text-gray-500 mt-1">Monitoreo completo de actividades y cambios en el sistema</p>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        {metrics.map((m, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-100 p-5" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{ background: m.bg }}>
              <m.icon size={19} style={{ color: m.color }} strokeWidth={1.8} />
            </div>
            <div className="text-2xl font-bold text-gray-900">{m.value}</div>
            <div className="text-xs font-medium text-gray-500 mt-0.5">{m.label}</div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-100" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
        <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-800">Registro de eventos</h3>
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar por acción o entidad…"
              className="pl-9 pr-4 py-2 rounded-lg border border-gray-200 text-xs outline-none focus:border-gray-400 transition-all w-64"
            />
          </div>
        </div>

        {loading && <LoadingState label="Cargando registro de auditoría…" />}
        {!loading && error && <ErrorState message={error} onRetry={reload} />}
        {!loading && !error && eventos.length === 0 && <EmptyState label="Sin eventos registrados" />}
        {!loading && !error && eventos.length > 0 && (
          <div>{eventos.map(ev => <EventRow key={ev.id_evento} ev={ev} />)}</div>
        )}
      </div>
    </div>
  )
}