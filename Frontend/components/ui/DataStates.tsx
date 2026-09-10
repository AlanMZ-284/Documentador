'use client'
/**
 * components/ui/DataStates.tsx
 * Estados visuales reutilizables: cargando, error, vacío.
 * Mantienen el estilo de la app (color #6B1A2A).
 */

import { AlertCircle, Inbox, RefreshCw } from 'lucide-react'

export function LoadingState({ label = 'Cargando…' }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3">
      <div
        className="w-8 h-8 border-2 rounded-full animate-spin"
        style={{ borderColor: 'rgba(107,26,42,0.2)', borderTopColor: '#6B1A2A' }}
      />
      <p className="text-sm text-gray-400">{label}</p>
    </div>
  )
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
      <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: 'rgba(220,38,38,0.08)' }}>
        <AlertCircle size={22} style={{ color: '#dc2626' }} />
      </div>
      <p className="text-sm font-medium text-gray-700">No se pudieron cargar los datos</p>
      <p className="text-xs text-gray-400 max-w-sm">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-1 flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white transition-all hover:opacity-90"
          style={{ background: '#6B1A2A' }}
        >
          <RefreshCw size={13} /> Reintentar
        </button>
      )}
    </div>
  )
}

export function EmptyState({ label = 'No hay registros todavía' }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
      <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: 'rgba(107,26,42,0.06)' }}>
        <Inbox size={22} style={{ color: '#6B1A2A' }} />
      </div>
      <p className="text-sm text-gray-400">{label}</p>
    </div>
  )
}