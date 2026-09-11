'use client'

import { Zap, Shield, Sparkles, Clock } from 'lucide-react'
import Link from 'next/link'

const features: { icon: any; text: string }[] = [
  { icon: Zap, text: 'Automatiza la gestión documental con inteligencia' },
  { icon: Shield, text: 'Protege accesos y firmas digitales' },
  { icon: Sparkles, text: 'Flujo claro y experiencia agradable' },
  { icon: Clock, text: 'Operación rápida y siempre disponible' },
]

const stats = [
  { value: '230+', label: 'Documentos activos' },
  { value: '12', label: 'Proyectos en curso' },
  { value: '99%', label: 'Cumplimiento de revisión' },
]

export default function AuthShell({
  children,
  title,
  subtitle,
}: {
  children: React.ReactNode
  title: string
  subtitle: string
}) {
  return (
    <div className="flex min-h-screen w-full">
      {/* Left Panel - Brand */}
      <div
        className="hidden lg:flex flex-col justify-between w-[460px] flex-shrink-0 p-10 relative overflow-hidden"
        style={{ background: 'linear-gradient(160deg, #2D0710 0%, #4A0F1C 50%, #6B1A2A 100%)' }}
      >
        {/* Background decoration */}
        <div
          className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #D4A843 0%, transparent 70%)', transform: 'translate(30%, -30%)' }}
        />
        <div
          className="absolute bottom-0 left-0 w-80 h-80 rounded-full opacity-5"
          style={{ background: 'radial-gradient(circle, #fff 0%, transparent 70%)', transform: 'translate(-40%, 40%)' }}
        />

        {/* Logo */}
        <div className="relative z-10">
  <Link href="/" className="flex items-center gap-3">

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
      <div className="text-white font-bold text-xl tracking-tight">
        SIGSSAT
      </div>
      <div className="text-white/50 text-xs font-medium">
        Gestión Inteligente
      </div>
    </div>

  </Link>
</div>

        {/* Center content */}
        <div className="relative z-10">
          <h2 className="text-3xl font-bold text-white leading-tight mb-4">
            Gestión documental impulsada por IA
          </h2>
          <p className="text-white/60 text-sm leading-relaxed mb-8">
            Plataforma inteligente para organizar, validar y gestionar documentos.
          </p>
          <div className="space-y-4">
            {features.map(({ icon: Icon, text }, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(212,168,67,0.15)' }}>
                  <Icon size={15} style={{ color: '#D4A843' }} />
                </div>
                <span className="text-white/70 text-sm">{text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom stats */}
        <div className="relative z-10 grid grid-cols-3 gap-4 pt-8 border-t border-white/10">
          {stats.map(({ value, label }) => (
            <div key={label}>
              <div className="text-lg font-bold text-white">{value}</div>
              <div className="text-xs text-white/40">{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-8">
        <div className="w-full max-w-md auth-card">
          <div className="flex items-center justify-between mb-8 gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 tracking-tight">{title}</h1>
              <p className="text-sm text-gray-500 mt-2">{subtitle}</p>
            </div>
            <div className="hidden md:flex items-center justify-center w-12 h-12 rounded-2xl" style={{ background: 'linear-gradient(135deg, #D4A843 0%, #E8C26A 100%)' }}>
              <Zap size={20} className="text-white" strokeWidth={2.5} />
            </div>
          </div>

          <div className="space-y-6">
            {children}
          </div>

          <div className="mt-8 rounded-3xl border border-gray-100 bg-gray-50/80 p-5">
            <div className="text-xs font-semibold uppercase tracking-[0.24em] text-gray-500 mb-3">¿Qué obtienes?</div>
            <div className="space-y-3">
              {features.map(({ icon: Icon, text }, index) => (
                <div key={index} className="flex items-start gap-3">
                  <div className="mt-1 flex h-9 w-9 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
                    <Icon size={16} />
                  </div>
                  <p className="text-sm text-gray-600 leading-6">{text}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
            {stats.map(({ value, label }) => (
              <div key={label} className="rounded-3xl bg-white p-4 text-center border border-gray-100 shadow-sm">
                <div className="text-lg font-semibold text-gray-900">{value}</div>
                <div className="mt-1 text-xs text-gray-500">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
