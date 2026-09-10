'use client'
import { useState } from 'react'
import {
  User, Shield, Bell, Database,
  Settings, Key, Palette, Globe,
  ChevronRight, Sparkles, Check
} from 'lucide-react'

const settingCards = [
  { icon: User, color: '#6B1A2A', bg: 'rgba(107,26,42,0.08)', title: 'Perfil de Usuario', desc: 'Gestiona tu información personal y preferencias de cuenta', href: '/configuracion/perfil' },
  { icon: Shield, color: '#059669', bg: 'rgba(5,150,105,0.08)', title: 'Seguridad', desc: 'Configuración de autenticación, contraseñas y permisos', href: '/configuracion/seguridad' },
  { icon: Bell, color: '#0284c7', bg: 'rgba(2,132,199,0.08)', title: 'Notificaciones', desc: 'Personaliza las alertas y notificaciones del sistema', href: '/configuracion/notificaciones' },
  { icon: Database, color: '#7c3aed', bg: 'rgba(124,58,237,0.08)', title: 'Almacenamiento', desc: 'Administra el espacio y las políticas de retención', href: '/configuracion/almacenamiento' },
  { icon: Settings, color: '#d97706', bg: 'rgba(217,119,6,0.08)', title: 'Integraciones', desc: 'Conecta con sistemas externos y APIs', href: '/configuracion/integraciones' },
  { icon: Key, color: '#dc2626', bg: 'rgba(220,38,38,0.08)', title: 'API y Webhooks', desc: 'Gestiona claves de API y configuración de webhooks', href: '/configuracion/api' },
  { icon: Palette, color: '#ec4899', bg: 'rgba(236,72,153,0.08)', title: 'Apariencia', desc: 'Personaliza colores, logos y estilo visual', href: '/configuracion/apariencia' },
  { icon: Globe, color: '#06b6d4', bg: 'rgba(6,182,212,0.08)', title: 'Idioma y Región', desc: 'Configura idioma, zona horaria y formatos', href: '/configuracion/idioma' },
]

const aiSettings = [
  { label: 'Clasificación Automática de Documentos', desc: 'La IA clasifica documentos por tipo y categoría', defaultOn: true },
  { label: 'Detección de Prioridad Automática', desc: 'Detecta urgencia basándose en contenido y fecha', defaultOn: true },
  { label: 'Sugerencias de Carpetas', desc: 'Propone carpetas inteligentes para nuevos documentos', defaultOn: true },
  { label: 'Extracción de Entidades', desc: 'Identifica clientes, fechas, montos y firmantes', defaultOn: false },
  { label: 'Análisis de Sentimiento', desc: 'Detecta tono y urgencia en documentos de texto', defaultOn: false },
  { label: 'Resumen Automático', desc: 'Genera resúmenes ejecutivos de documentos cargados', defaultOn: true },
]

function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!on)}
      className="relative inline-flex h-6 w-11 items-center rounded-full transition-all flex-shrink-0"
      style={{ background: on ? '#6B1A2A' : '#d1d5db' }}
    >
      <span
        className="inline-block h-4 w-4 transform rounded-full bg-white transition-transform"
        style={{ transform: on ? 'translateX(22px)' : 'translateX(2px)', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }}
      />
    </button>
  )
}

export default function ConfiguracionContent() {
  const [aiStates, setAiStates] = useState(aiSettings.map(s => s.defaultOn))
  const [saved, setSaved] = useState(false)

  const handleSave = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="animate-fade-in">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Configuración</h1>
          <p className="text-sm text-gray-500 mt-1">Administra las preferencias y configuraciones del sistema</p>
        </div>
      </div>

      {/* Settings Cards Grid */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {settingCards.map((card, i) => (
          <div
            key={i}
            className={`bg-white rounded-xl border border-gray-100 p-5 cursor-pointer transition-all hover:border-gray-200 group animate-fade-in stagger-${Math.min(i + 1, 6)}`}
            style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
          >
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center mb-4"
              style={{ background: card.bg }}
            >
              <card.icon size={20} style={{ color: card.color }} strokeWidth={1.8} />
            </div>
            <h4 className="text-sm font-semibold text-gray-900 mb-2">{card.title}</h4>
            <p className="text-xs text-gray-400 leading-relaxed mb-4">{card.desc}</p>
            <span className="text-xs font-semibold flex items-center gap-1 transition-all group-hover:gap-2" style={{ color: '#6B1A2A' }}>
              Configurar <ChevronRight size={12} />
            </span>
          </div>
        ))}
      </div>

      {/* AI Configuration */}
      <div className="bg-white rounded-xl border border-gray-100 animate-fade-in stagger-5" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
        <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(212,168,67,0.12)' }}>
              <Sparkles size={15} style={{ color: '#D4A843' }} />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-800">Configuración de IA</h3>
              <p className="text-xs text-gray-400">Controla las funciones de inteligencia artificial</p>
            </div>
          </div>
          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90"
            style={{ background: saved ? '#059669' : 'linear-gradient(135deg, #6B1A2A 0%, #8B2339 100%)' }}
          >
            {saved ? <><Check size={14} /> Guardado</> : 'Guardar cambios'}
          </button>
        </div>

        <div className="divide-y divide-gray-50">
          {aiSettings.map((setting, i) => (
            <div key={i} className="px-5 py-4 flex items-center justify-between hover:bg-gray-50/40 transition-all">
              <div className="flex-1 pr-8">
                <div className="text-sm font-medium text-gray-800">{setting.label}</div>
                <div className="text-xs text-gray-400 mt-0.5">{setting.desc}</div>
              </div>
              <Toggle
                on={aiStates[i]}
                onChange={(v) => {
                  const next = [...aiStates]
                  next[i] = v
                  setAiStates(next)
                }}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
