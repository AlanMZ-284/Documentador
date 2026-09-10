'use client'
import { useState } from 'react'
import Link from 'next/link'
import { Mail, RefreshCw, Check } from 'lucide-react'
import AuthShell from '../../../components/auth/AuthShell'

export default function VerificarEmailPage() {
  const [resent, setResent] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleResend = async () => {
    setLoading(true)
    await new Promise(r => setTimeout(r, 900))
    setLoading(false)
    setResent(true)
    setTimeout(() => setResent(false), 4000)
  }

  return (
    <AuthShell title="Verifica tu correo" subtitle="Un paso más para activar tu cuenta">
      <div className="text-center">
        <div
          className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6"
          style={{ background: 'rgba(2,132,199,0.08)', border: '1px solid rgba(2,132,199,0.15)' }}
        >
          <Mail size={32} style={{ color: '#0284c7' }} strokeWidth={1.5} />
        </div>

        <p className="text-sm text-gray-600 mb-2 leading-relaxed">
          Enviamos un correo de verificación a tu dirección. Haz clic en el enlace del correo para activar tu cuenta.
        </p>
        <p className="text-xs text-gray-400 mb-8">
          El enlace expirará en 24 horas.
        </p>

        <div
          className="rounded-xl p-4 mb-6 text-left"
          style={{ background: '#f7f7f9', border: '1px solid #e8e8ee' }}
        >
          <p className="text-xs text-gray-500 font-medium mb-1">¿No recibiste el correo?</p>
          <ul className="text-xs text-gray-400 space-y-1 list-disc list-inside">
            <li>Revisa tu carpeta de spam o correo no deseado</li>
            <li>Verifica que el correo ingresado sea correcto</li>
            <li>Espera unos minutos y vuelve a intentarlo</li>
          </ul>
        </div>

        <div className="space-y-3">
          <button
            onClick={handleResend}
            disabled={loading || resent}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium border border-gray-200 hover:bg-gray-50 transition-all text-gray-600 disabled:opacity-60"
          >
            {loading
              ? <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
              : resent
              ? <><Check size={15} style={{ color: '#059669' }} /> Correo reenviado</>
              : <><RefreshCw size={15} /> Reenviar correo de verificación</>
            }
          </button>

          <Link
            href="/login"
            className="block w-full py-3 rounded-xl text-sm font-semibold text-center text-white transition-all hover:opacity-90"
            style={{ background: 'linear-gradient(135deg, #6B1A2A 0%, #8B2339 100%)' }}
          >
            Ya verifiqué mi correo
          </Link>

          <Link href="/login" className="block text-xs text-center text-gray-400 hover:text-gray-600 transition-all">
            Volver al inicio de sesión
          </Link>
        </div>
      </div>
    </AuthShell>
  )
}
