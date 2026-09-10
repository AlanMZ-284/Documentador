'use client'
import { useState } from 'react'
import Link from 'next/link'
import { Eye, EyeOff, Mail, Lock, ArrowRight } from 'lucide-react'
import AuthShell from '../../../components/auth/AuthShell'
import { useAuth } from '../../../lib/auth-context'

export default function LoginPage() {
  const { login } = useAuth()
  const [show, setShow] = useState(false)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ email: '', password: '', remember: false })
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!form.email || !form.password) {
      setError('Por favor completa todos los campos.')
      return
    }

    try {
      setLoading(true)

      await login(form.email, form.password)
      
      window.location.href = '/proyectos'
    } catch (err: any) {
      console.error("Error capturado en Login UI:", err)
      
      if (err.response?.data?.message) {
        setError(err.response.data.message)
      } else if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('Error de conexión: El servidor Fastify no responde en el puerto 3001.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell
      title="Iniciar sesión"
      subtitle="Accede a tu plataforma de gestión documental"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-gray-200" />
        </div>

        {/* Correo */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1.5">
            Correo electrónico
          </label>
          <div className="relative">
            <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="email"
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              placeholder="admin@empresa.com"
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-800 placeholder-gray-400 outline-none focus:border-gray-400 transition-all bg-white"
            />
          </div>
        </div>

        {/* Password */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-semibold text-gray-700">Contraseña</label>
          </div>
          <div className="relative">
            <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type={show ? 'text' : 'password'}
              value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
              placeholder="••••••••"
              className="w-full pl-10 pr-10 py-3 rounded-xl border border-gray-200 text-sm text-gray-800 placeholder-gray-400 outline-none focus:border-gray-400 transition-all bg-white"
            />
            <button
              type="button"
              onClick={() => setShow(!show)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {show ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
          <div className="mt-2 text-right">
            <Link
              href="/recuperar-password"
              className="text-xs font-medium hover:opacity-80 transition-all"
              style={{ color: '#6B1A2A' }}
            >
              ¿Olvidaste tu contraseña?
            </Link>
          </div>
        </div>

        {/* Remember */}
        <div className="flex items-center gap-2.5">
          <input
            type="checkbox"
            id="remember"
            checked={form.remember}
            onChange={e => setForm({ ...form, remember: e.target.checked })}
            className="w-4 h-4 rounded border-gray-300"
            style={{ accentColor: '#6B1A2A' }}
          />
          <label htmlFor="remember" className="text-xs text-gray-600">
            Mantener sesión iniciada
          </label>
        </div>

        {error && (
          <div className="px-3 py-2.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-600">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2.5 py-3 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 disabled:opacity-70"
          style={{ background: 'linear-gradient(135deg, #6B1A2A 0%, #8B2339 100%)' }}
        >
          {loading ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              Iniciar sesión
              <ArrowRight size={15} />
            </>
          )}
        </button>

        <p className="text-center text-xs text-gray-500">
          ¿No tienes cuenta? 
          <Link href="/registro" className="font-semibold hover:opacity-80 transition-all" style={{ color: '#6B1A2A' }}>
            Solicitar acceso
          </Link>
        </p>
      </form>
    </AuthShell>
  )
}