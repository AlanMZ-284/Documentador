'use client'
import { useState } from 'react'
import Link from 'next/link'
import { Mail, ArrowRight, ArrowLeft, Check } from 'lucide-react'
import AuthShell from '../../../components/auth/AuthShell'

export default function RecuperarPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return
    setLoading(true)
    await new Promise(r => setTimeout(r, 1000))
    setLoading(false)
    setSent(true)
  }

  if (sent) {
    return (
      <AuthShell title="Correo enviado" subtitle="Revisa tu bandeja de entrada">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6" style={{ background: 'rgba(2,132,199,0.1)' }}>
            <Check size={28} style={{ color: '#0284c7' }} strokeWidth={2.5} />
          </div>
          <p className="text-sm text-gray-600 mb-2 leading-relaxed">
            Enviamos un enlace de recuperación a:
          </p>
          <p className="text-sm font-semibold text-gray-900 mb-6">{email}</p>
          <p className="text-xs text-gray-400 mb-8">El enlace expira en 30 minutos. Si no ves el correo, revisa tu carpeta de spam.</p>
          <div className="space-y-3">
            <button
              onClick={() => setSent(false)}
              className="w-full py-3 rounded-xl text-sm font-medium border border-gray-200 hover:bg-gray-50 transition-all text-gray-600"
            >
              Reenviar correo
            </button>
            <Link
              href="/login"
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90"
              style={{ background: 'linear-gradient(135deg, #6B1A2A 0%, #8B2339 100%)' }}
            >
              Volver al inicio de sesión
            </Link>
          </div>
        </div>
      </AuthShell>
    )
  }

  return (
    <AuthShell
      title="Recuperar contraseña"
      subtitle="Te enviaremos un enlace para restablecer tu contraseña"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1.5">Correo electrónico</label>
          <div className="relative">
            <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="admin@empresa.com"
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-gray-400 transition-all bg-white"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || !email}
          className="w-full flex items-center justify-center gap-2.5 py-3 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 disabled:opacity-60"
          style={{ background: 'linear-gradient(135deg, #6B1A2A 0%, #8B2339 100%)' }}
        >
          {loading
            ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            : <><ArrowRight size={15} />Enviar enlace de recuperación</>
          }
        </button>

        <Link href="/login" className="flex items-center justify-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 transition-all mt-2">
          <ArrowLeft size={13} />
          Volver al inicio de sesión
        </Link>
      </form>
    </AuthShell>
  )
}
