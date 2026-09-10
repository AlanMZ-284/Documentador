'use client'
import { useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line
} from 'recharts'
import { BarChart2, Download, Filter, ChevronDown, Calendar, TrendingUp } from 'lucide-react'

const barData = [
  { mes: 'Ene', docs: 118 },
  { mes: 'Feb', docs: 134 },
  { mes: 'Mar', docs: 155 },
  { mes: 'Abr', docs: 138 },
  { mes: 'May', docs: 172 },
  { mes: 'Jun', docs: 192 },
]

const pieData = [
  { name: 'Legal', value: 325, color: '#6B1A2A' },
  { name: 'Tecnología', value: 245, color: '#D4A843' },
  { name: 'Consultoría', value: 189, color: '#8B2339' },
  { name: 'Auditoría', value: 156, color: '#C4384F' },
  { name: 'Otros', value: 332, color: '#d1c5b0' },
]

const lineData = [
  { mes: 'Ene', dias: 4.2 },
  { mes: 'Feb', dias: 3.8 },
  { mes: 'Mar', dias: 3.5 },
  { mes: 'Abr', dias: 4.1 },
  { mes: 'May', dias: 2.9 },
  { mes: 'Jun', dias: 2.4 },
]

const kpis = [
  { label: 'Tasa de Validación', value: '94.8%', sub: '+2.3% vs mes anterior', color: '#059669' },
  { label: 'Tiempo Promedio', value: '2.4 días', sub: '-1.8 días vs anterior', color: '#0284c7' },
  { label: 'Documentos/Día', value: '8.7', sub: 'Promedio último mes', color: '#6B1A2A' },
  { label: 'Clientes Activos', value: '38', sub: '15 entidades gov.', color: '#7c3aed' },
]

export default function ReportesContent() {
  const [period, setPeriod] = useState('Últimos 6 meses')

  return (
    <div className="animate-fade-in">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Reportes y Analíticas</h1>
          <p className="text-sm text-gray-500 mt-1">Visualiza métricas y estadísticas de gestión documental</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-100 p-4 mb-5 animate-fade-in stagger-1" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-gray-800 mb-3">Filtros de Reporte</h3>
            <div className="flex items-center gap-3">
              {[
                { icon: Calendar, label: period, opts: ['Últimos 6 meses', 'Último trimestre', 'Último año'] },
                { icon: Filter, label: 'Todas las áreas', opts: ['Todas las áreas', 'Legal', 'Tecnología', 'Auditoría'] },
                { icon: Filter, label: 'Todos los clientes', opts: ['Todos los clientes', 'SAT', 'Ministerio de Hacienda'] },
              ].map(({ icon: Icon, label }, i) => (
                <button key={i} className="flex items-center gap-2 px-3 py-2 text-xs text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-all">
                  <Icon size={13} className="text-gray-400" />
                  {label}
                  <ChevronDown size={11} className="text-gray-400" />
                </button>
              ))}
            </div>
          </div>
          <button
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90"
            style={{ background: 'linear-gradient(135deg, #6B1A2A 0%, #8B2339 100%)' }}
          >
            <Download size={14} />
            Exportar PDF
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-4 mb-5">
        {kpis.map((k, i) => (
          <div key={i} className={`metric-card animate-fade-in stagger-${i + 1}`}>
            <div className="text-2xl font-bold mb-1" style={{ color: k.color }}>{k.value}</div>
            <div className="text-xs font-semibold text-gray-700 mb-1">{k.label}</div>
            <div className="text-xs text-gray-400">{k.sub}</div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-2 gap-5 mb-5">
        {/* Bar chart */}
        <div className="bg-white rounded-xl border border-gray-100 p-5 animate-fade-in stagger-3" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <div className="flex items-center gap-2 mb-1">
            <BarChart2 size={15} className="text-gray-400" />
            <h3 className="text-sm font-semibold text-gray-800">Documentos por Mes</h3>
          </div>
          <p className="text-xs text-gray-400 mb-4">Validados vs Pendientes</p>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={barData} barSize={32}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
              <XAxis dataKey="mes" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af' }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af' }} />
              <Tooltip
                cursor={{ fill: 'rgba(107,26,42,0.04)' }}
                contentStyle={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '12px' }}
              />
              <Bar dataKey="docs" fill="#D4A843" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Pie chart */}
        <div className="bg-white rounded-xl border border-gray-100 p-5 animate-fade-in stagger-4" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-4 h-4 rounded-full flex items-center justify-center" style={{ background: 'rgba(107,26,42,0.1)' }}>
              <div className="w-2 h-2 rounded-full" style={{ background: '#6B1A2A' }} />
            </div>
            <h3 className="text-sm font-semibold text-gray-800">Distribución por Categoría</h3>
          </div>
          <p className="text-xs text-gray-400 mb-4">Total: 1,247 documentos</p>
          <div className="flex items-center gap-4">
            <ResponsiveContainer width="55%" height={200}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={3} dataKey="value">
                  {pieData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="flex-1 space-y-2.5">
              {pieData.map((item) => (
                <div key={item.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: item.color }} />
                    <span className="text-xs font-medium text-gray-700">{item.name}</span>
                  </div>
                  <span className="text-xs text-gray-400">{item.value} docs</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Line chart */}
      <div className="bg-white rounded-xl border border-gray-100 p-5 animate-fade-in stagger-5" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
        <div className="flex items-center gap-2 mb-1">
          <TrendingUp size={15} className="text-gray-400" />
          <h3 className="text-sm font-semibold text-gray-800">Tiempo de Procesamiento</h3>
        </div>
        <p className="text-xs text-gray-400 mb-4">Promedio en días por documento</p>
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={lineData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
            <XAxis dataKey="mes" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af' }} />
            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af' }} />
            <Tooltip
              contentStyle={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '12px' }}
            />
            <Line
              type="monotone"
              dataKey="dias"
              stroke="#6B1A2A"
              strokeWidth={2.5}
              dot={{ fill: '#6B1A2A', r: 4, strokeWidth: 0 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
