'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, FolderOpen, FolderClosed, FileText,
  Briefcase, BarChart2, Shield, Settings, Upload,
  Zap, ChevronRight
} from 'lucide-react'
import clsx from 'clsx'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/repositorio', label: 'Repositorio Documental', icon: FolderOpen },
  { href: '/carpetas', label: 'Carpetas Inteligentes', icon: FolderClosed },
  { href: '/templates', label: 'Gestión de Construcción', icon: FileText },
  { href: '/proyectos', label: 'Proyectos', icon: Briefcase },
  { href: '/reportes', label: 'Reportes', icon: BarChart2 },
  { href: '/auditoria', label: 'Auditoría', icon: Shield },
  { href: '/configuracion', label: 'Configuración', icon: Settings },
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <aside
      className="fixed left-0 top-0 h-screen flex flex-col z-40"
      style={{
        width: 'var(--sidebar-width)',
        background: 'linear-gradient(180deg, #2D0710 0%, #4A0F1C 40%, #5c1525 100%)',
        boxShadow: '2px 0 20px rgba(0,0,0,0.25)',
      }}
    >
      {/* Logo */}
<div className="px-5 py-5 border-b border-white/10">
  <Link href="/" className="flex items-center gap-3">
    {/* Contenedor del Icono de 4 Esferas */}
    <div className="w-10 h-10 flex items-center justify-center">
      <div className="grid grid-cols-2 gap-1.5 p-1">
        <div 
          className="w-3.5 h-3.5 rounded-full shadow-sm" 
          style={{ background: 'linear-gradient(135deg, #D4A843 0%, #E8C26A 100%)' }}
        />
        <div 
          className="w-3.5 h-3.5 rounded-full shadow-sm" 
          style={{ background: 'linear-gradient(135deg, #D4A843 0%, #E8C26A 100%)' }}
        />
        <div 
          className="w-3.5 h-3.5 rounded-full shadow-sm" 
          style={{ background: 'linear-gradient(135deg, #D4A843 0%, #E8C26A 100%)' }}
        />
        <div 
          className="w-3.5 h-3.5 rounded-full shadow-sm" 
          style={{ background: 'linear-gradient(135deg, #D4A843 0%, #E8C26A 100%)' }}
        />
      </div>
    </div>
    
    <div>
      <div className="text-white font-bold text-xl tracking-tight">SIGSSAT</div>
      <div className="text-white/50 text-xs font-medium">Gestión Inteligente</div>
    </div>
  </Link>
</div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link key={href} href={href}>
              <div
                className={clsx(
                  'nav-item group relative',
                  isActive && 'active'
                )}
              >
                <Icon size={17} strokeWidth={isActive ? 2.2 : 1.8} />
                <span className="flex-1 text-[13px]">{label}</span>
                {isActive && (
                  <ChevronRight size={13} className="opacity-50" />
                )}
              </div>
            </Link>
          )
        })}
      </nav>

      {/* Bulk Upload Button */}
      <div className="px-3 pb-5">
        <div className="border-t border-white/10 pt-4 mb-3">
          <div className="flex items-center gap-2 px-2 mb-3">
            
            
          </div>
        </div>
        <button
          className="w-full flex items-center justify-center gap-2.5 py-3 px-4 rounded-xl font-semibold text-sm transition-all hover:brightness-110 active:scale-95"
          style={{ background: 'linear-gradient(135deg, #D4A843 0%, #c49530 100%)', color: '#2D0710' }}
        >
          <Upload size={16} strokeWidth={2.5} />
          Carga Masiva
        </button>
      </div>
    </aside>
  )
}
