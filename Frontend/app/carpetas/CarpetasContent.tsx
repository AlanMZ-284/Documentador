'use client'
import {
  Sparkles, AlertCircle, Calendar, CheckCircle2,
  Users, FolderOpen, FileText, Globe, Plus, Zap, Clock
} from 'lucide-react'

const aiRules = [
  {
    icon: Sparkles,
    color: '#3b82f6',
    bg: 'rgba(59,130,246,0.08)',
    title: 'Clasificación Automática',
    description: 'Documentos clasificados por tipo, área y prioridad',
  },
  {
    icon: AlertCircle,
    color: '#10b981',
    bg: 'rgba(16,185,129,0.08)',
    title: 'Detección de Urgencias',
    description: 'Identifica documentos que requieren atención inmediata',
  },
  {
    icon: Calendar,
    color: '#8b5cf6',
    bg: 'rgba(139,92,246,0.08)',
    title: 'Seguimiento de Plazos',
    description: 'Monitorea fechas límite y vencimientos',
  },
]

const smartFolders = [
  {
    icon: AlertCircle,
    iconBg: '#ef4444',
    count: 12,
    label: 'Documentos Urgentes',
    description: 'Documentos que requieren atención inmediata',
    rule: 'Alta prioridad detectada por IA',
    ruleColor: '#ef4444',
  },
  {
    icon: Calendar,
    iconBg: '#f97316',
    count: 8,
    label: 'Contratos Próximos a Vencer',
    description: 'Vencen en los próximos 30 días',
    rule: 'Fecha de vencimiento < 30 días',
    ruleColor: '#f97316',
  },
  {
    icon: Clock,
    iconBg: '#eab308',
    count: 34,
    label: 'Documentos Sin Revisar',
    description: 'Requieren validación',
    rule: 'Estado: pendiente de revisión',
    ruleColor: '#eab308',
  },
  {
    icon: CheckCircle2,
    iconBg: '#22c55e',
    count: 45,
    label: 'Completados Esta Semana',
    description: 'Procesados en los últimos 7 días',
    rule: 'Completados después del 20/05/2026',
    ruleColor: '#22c55e',
  },
  {
    icon: Users,
    iconBg: '#3b82f6',
    count: 67,
    label: 'Asignados a Mi Equipo',
    description: 'Documentos del equipo de trabajo',
    rule: 'Responsable pertenece al departamento',
    ruleColor: '#3b82f6',
  },
  {
    icon: FolderOpen,
    iconBg: '#6B1A2A',
    count: 156,
    label: 'Documentos Legales',
    description: 'Contratos, acuerdos y documentación legal',
    rule: 'Clasificación: Legal',
    ruleColor: '#6B1A2A',
  },
  {
    icon: FileText,
    iconBg: '#8b5cf6',
    count: 89,
    label: 'Informes Técnicos',
    description: 'Documentación técnica y reportes',
    rule: 'Tipo: Informe Técnico',
    ruleColor: '#8b5cf6',
  },
  {
    icon: Globe,
    iconBg: '#06b6d4',
    count: 124,
    label: 'Proyectos Gubernamentales',
    description: 'Documentos de entidades públicas',
    rule: 'Cliente: entidad gubernamental',
    ruleColor: '#06b6d4',
  },
]

export default function CarpetasContent() {
  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Carpetas Inteligentes</h1>
            
          </div>
          <p className="text-sm text-gray-500">Carpetas organizadas automáticamente según las reglas establecidas</p>
        </div>
        <button
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90"
          style={{ background: 'linear-gradient(135deg, #6B1A2A 0%, #8B2339 100%)' }}
        >
          <Plus size={16} />
          Crear Carpeta Inteligente
        </button>
      </div>

      {/* AI Rules */}
      <div
        className="bg-white rounded-xl border border-gray-100 p-5 mb-6 animate-fade-in stagger-1"
        style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
              
              Reglas Automáticas Activas
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">Documentos organizados por IA</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          {aiRules.map((rule, i) => (
            <div
              key={i}
              className="rounded-xl p-4 border transition-all hover:shadow-sm cursor-pointer"
              style={{ background: rule.bg, borderColor: `${rule.color}25` }}
            >
              <div className="flex items-center gap-2.5 mb-2">
                <rule.icon size={15} style={{ color: rule.color }} />
                <span className="text-xs font-semibold" style={{ color: rule.color }}>
                  {rule.title}
                </span>
              </div>
              <p className="text-xs text-gray-600 leading-relaxed">{rule.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Smart Folders Grid */}
      <div className="grid grid-cols-4 gap-4">
        {smartFolders.map((folder, i) => (
          <div
            key={i}
            className={`folder-card animate-fade-in stagger-${Math.min(i + 1, 6)}`}
          >
            <div className="flex items-center justify-between mb-4">
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center"
                style={{ background: folder.iconBg }}
              >
                <folder.icon size={20} className="text-white" strokeWidth={2} />
              </div>
              <span className="text-2xl font-bold text-gray-900">{folder.count}</span>
            </div>

            <h4 className="text-[13px] font-semibold text-gray-800 mb-1 leading-snug">
              {folder.label}
            </h4>
            <p className="text-xs text-gray-400 mb-3 leading-relaxed">{folder.description}</p>

            <div
              className="flex items-center gap-1.5 text-xs font-medium"
              style={{ color: folder.ruleColor }}
            >
              <Sparkles size={10} />
              <span className="truncate">{folder.rule}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
