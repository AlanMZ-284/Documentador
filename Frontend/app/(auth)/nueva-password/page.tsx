'use client'
import { useState } from 'react'
import Link from 'next/link'
import { Eye, EyeOff, Lock, ArrowRight, Check } from 'lucide-react'
import AuthShell from '../../../components/auth/AuthShell'

export default function NuevaPasswordPage() {
  const [show, setShow] = useState(false)
  const [showC, setShowC] = useState(false)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [form, setForm] = useState({ password: '', confirm: '' })
  const [error, setError] = useState('')

  const strength = form.password.length === 0 ? 0 : form.password.length < 4 ? 1 : form.password.length < 8 ? 2 : form.password.match(/[A-Z]/) && form.password.match(/[0-9]/) ? 4 : 3

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (form.password !== form.confirm) { setError('Las contraseñas no coinciden.'); return }
    if (form.password.length < 8) { setError('La contraseña debe tener al menos 8 caracteres.'); return }
    setLoading(true)
    await new Promise(r => setTimeout(r, 1200))
    setLoading(false)
    setDone(true)
  }

  if (done) {
    return (
      <AuthShell title="Contraseña actualizada" subtitle="Tu contraseña fue restablecida exitosamente">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6" style={{ background: 'rgba(5,150,105,0.1)' }}>
            <Check size={28} style={{ color: '#059669' }} strokeWidth={2.5} />
          </div>
          <p className="text-sm text-gray-600 mb-8 leading-relaxed">
            Tu contraseña fue actualizada correctamente. Ahora puedes iniciar sesión con tu nueva contraseña.
          </p>
          <Link
            href="/login"
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90"
            style={{ background: 'linear-gradient(135deg, #6B1A2A 0%, #8B2339 100%)' }}
          >
            Iniciar sesión
            <ArrowRight size={15} />
          </Link>
        </div>
      </AuthShell>
    )
  }

  return (
    <AuthShell title="Nueva contraseña" subtitle="Crea una contraseña segura para tu cuenta">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1.5">Nueva contraseña</label>
          <div className="relative">
            <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type={show ? 'text' : 'password'}
              value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
              placeholder="Mínimo 8 caracteres"
              className="w-full pl-10 pr-10 py-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-gray-400 transition-all bg-white"
            />
            <button type="button" onClick={() => setShow(!show)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400">
              {show ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
          {form.password && (
            <div className="mt-2">
              <div className="flex gap-1 mb-1">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="flex-1 h-1.5 rounded-full transition-all" style={{
                    background: strength >= i
                      ? strength <= 1 ? '#ef4444' : strength <= 2 ? '#f97316' : strength <= 3 ? '#eab308' : '#059669'
                      : '#e5e7eb'
                  }} />
                ))}
              </div>
              <p className="text-xs" style={{ color: strength <= 1 ? '#ef4444' : strength <= 2 ? '#f97316' : strength <= 3 ? '#eab308' : '#059669' }}>
                {['', 'Muy débil', 'Débil', 'Moderada', 'Fuerte'][strength]}
              </p>
            </div>
          )}
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1.5">Confirmar contraseña</label>
          <div className="relative">
            <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type={showC ? 'text' : 'password'}
              value={form.confirm}
              onChange={e => setForm({ ...form, confirm: e.target.value })}
              placeholder="Repite tu contraseña"
              className="w-full pl-10 pr-10 py-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-gray-400 transition-all bg-white"
            />
            <button type="button" onClick={() => setShowC(!showC)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400">
              {showC ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
          {form.confirm && form.password !== form.confirm && (
            <p className="text-xs text-red-500 mt-1">Las contraseñas no coinciden</p>
          )}
        </div>

        {error && (
          <div className="px-3 py-2.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-600">{error}</div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2.5 py-3 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 disabled:opacity-60"
          style={{ background: 'linear-gradient(135deg, #6B1A2A 0%, #8B2339 100%)' }}
        >
          {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><ArrowRight size={15} />Establecer nueva contraseña</>}
        </button>

        <Link href="/login" className="flex items-center justify-center text-xs text-gray-500 hover:text-gray-700 transition-all">
          Cancelar y volver al inicio de sesión
        </Link>
      </form>
    </AuthShell>
  )
}
