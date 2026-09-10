'use client'
import { useState } from 'react'
import Link from 'next/link'
import { Eye, EyeOff, Mail, Lock, User, Building2, ArrowRight, Check } from 'lucide-react'
import AuthShell from '../../../components/auth/AuthShell'
import { usuariosService } from '../../../lib/usuariosService'

const roles = ['Administrador', 'Editor', 'Revisor', 'Analista', 'Invitado']
const [error, setError] = useState('')

export default function RegistroPage() {
  const [show, setShow] = useState(false)
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [form, setForm] = useState({
    name: '', email: '', org: '', role: 'Analista', password: '', terms: false,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      setLoading(true)
      
      // Añadimos "as any" al cerrar el objeto para que TypeScript te deje mandar el password sin chistar
      await usuariosService.crear({
        nombre: form.name,
        email: form.email,
        puesto: form.org || 'Personal Técnico',
        rol: 'USER', 
        password: form.password
      } as any)

      setSent(true)
    } catch (err: any) {
      console.error("Error al registrar usuario:", err)
      // Si la API regresa un mensaje de error específico (ej. correo duplicado), lo mostramos
      setError(err.response?.data?.message || 'Error de comunicación: Verifica que el backend esté encendido.')
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <AuthShell title="Solicitud enviada" subtitle="Revisa tu correo electrónico">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6" style={{ background: 'rgba(5,150,105,0.1)' }}>
            <Check size={28} style={{ color: '#059669' }} strokeWidth={2.5} />
          </div>
          <p className="text-sm text-gray-600 mb-6 leading-relaxed">
            Tu solicitud de acceso fue enviada correctamente. Recibirás un correo a <strong>{form.email}</strong> para verificar tu cuenta y completar el registro.
          </p>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90"
            style={{ background: 'linear-gradient(135deg, #6B1A2A 0%, #8B2339 100%)' }}
          >
            Ir al inicio de sesión
            <ArrowRight size={15} />
          </Link>
        </div>
      </AuthShell>
    )
  }

  return (
    <AuthShell title="Solicitar acceso" subtitle="Crea tu cuenta en la plataforma ">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Nombre completo</label>
            <div className="relative">
              <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="María González" className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-gray-400 transition-all bg-white" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Organización</label>
            <div className="relative">
              <Building2 size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type="text" value={form.org} onChange={e => setForm({ ...form, org: e.target.value })} placeholder="..." className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-gray-400 transition-all bg-white" />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1.5">Correo electrónico institucional</label>
          <div className="relative">
            <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="usuario@entidad.gob.mx" className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-gray-400 transition-all bg-white" />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1.5">Rol solicitado</label>
          <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-700 outline-none focus:border-gray-400 transition-all bg-white appearance-none">
            {roles.map(r => <option key={r}>{r}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1.5">Contraseña</label>
          <div className="relative">
            <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type={show ? 'text' : 'password'} value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="Mínimo 8 caracteres" className="w-full pl-9 pr-10 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-gray-400 transition-all bg-white" />
            <button type="button" onClick={() => setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
              {show ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>
          {form.password && (
            <div className="flex gap-1 mt-2">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="flex-1 h-1 rounded-full transition-all" style={{ background: form.password.length >= i * 2 ? (i <= 2 ? '#f97316' : '#059669') : '#e5e7eb' }} />
              ))}
            </div>
          )}
        </div>

        <div className="flex items-start gap-2.5">
          <input type="checkbox" id="terms" checked={form.terms} onChange={e => setForm({ ...form, terms: e.target.checked })} className="w-4 h-4 mt-0.5 rounded border-gray-300 flex-shrink-0" style={{ accentColor: '#6B1A2A' }} />
          <label htmlFor="terms" className="text-xs text-gray-500 leading-relaxed">
            Acepto los <span className="font-semibold cursor-pointer" style={{ color: '#6B1A2A' }}>términos de servicio</span> y la <span className="font-semibold cursor-pointer" style={{ color: '#6B1A2A' }}>política de privacidad</span>
          </label>
        </div>

        {error && (
  <div className="px-3 py-2.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-600">
    {error}
  </div>
)}

        <button
          type="submit"
          disabled={loading || !form.terms}
          className="w-full flex items-center justify-center gap-2.5 py-3 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 disabled:opacity-60"
          style={{ background: 'linear-gradient(135deg, #6B1A2A 0%, #8B2339 100%)' }}
        >
          {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><ArrowRight size={15} />Solicitar acceso</>}
        </button>

        <p className="text-center text-xs text-gray-500">
          ¿Ya tienes cuenta?{' '}
          <Link href="/login" className="font-semibold hover:opacity-80 transition-all" style={{ color: '#6B1A2A' }}>Iniciar sesión</Link>
        </p>
      </form>
    </AuthShell>
  )
}
