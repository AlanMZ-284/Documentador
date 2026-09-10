'use client'
import { useState } from 'react'
import { Bell, Search, ChevronDown, LogOut } from 'lucide-react'
import { useAuth } from '../../lib/auth-context'

export default function Header() {
  const { user, logout } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)

  const inicial = user?.correo_corporativo?.[0]?.toUpperCase() ?? 'U'
  const nombreCorto = user?.correo_corporativo?.split('@')[0] ?? 'Usuario'

  return (
    <header
      className="fixed top-0 right-0 z-30 flex items-center gap-4 px-6"
      style={{
        left: 'var(--sidebar-width)',
        height: '60px',
        background: 'rgba(255,255,255,0.96)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(0,0,0,0.06)',
        boxShadow: '0 1px 8px rgba(0,0,0,0.04)',
      }}
    >
      {/* Search */}
      <div className="flex-1 max-w-2xl relative">
        <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl border transition-all" style={{ background: '#f7f7f9', borderColor: '#e8e8ee' }}>
          <Search size={15} className="text-gray-400 flex-shrink-0" />
          <input
            type="text"
            placeholder="Búsqueda con IA – busca por contenido, proyecto, cliente..."
            className="flex-1 bg-transparent text-sm text-gray-600 placeholder-gray-400 outline-none"
          />
        </div>
      </div>

      {/* Right section */}
      <div className="flex items-center gap-3">
        <button className="relative p-2 rounded-lg hover:bg-gray-100 transition-all">
          <Bell size={18} className="text-gray-500" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full" style={{ background: '#C4384F' }} />
        </button>

        <div className="w-px h-6 bg-gray-200" />

        {/* User + dropdown */}
        <div className="relative">
          <button
            onClick={() => setMenuOpen(o => !o)}
            className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl hover:bg-gray-50 transition-all"
          >
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm"
              style={{ background: 'linear-gradient(135deg, #6B1A2A 0%, #8B2339 100%)' }}
            >
              {inicial}
            </div>
            <div className="text-left">
              <div className="text-xs font-semibold text-gray-800 leading-none">{nombreCorto}</div>
              <div className="text-xs text-gray-400 mt-0.5">{user?.nombre_rol ?? '—'}</div>
            </div>
            <ChevronDown size={14} className="text-gray-400 ml-1" />
          </button>

          {menuOpen && (
            <div
              className="absolute right-0 mt-2 w-48 bg-white rounded-xl border border-gray-100 py-1 z-40"
              style={{ boxShadow: '0 4px 16px rgba(0,0,0,0.1)' }}
            >
              <div className="px-4 py-2.5 border-b border-gray-50">
                <p className="text-xs font-semibold text-gray-800 truncate">{user?.correo_corporativo}</p>
                <p className="text-xs text-gray-400 mt-0.5">{user?.nombre_rol}</p>
              </div>
              <button
                onClick={() => logout()}
                className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-all"
              >
                <LogOut size={15} /> Cerrar sesión
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}