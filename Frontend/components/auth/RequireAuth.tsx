'use client'
/**
 * components/auth/RequireAuth.tsx
 * Protege rutas privadas. Si no hay token, redirige a /login.
 * Envuelve el contenido de las páginas dentro del AppShell.
 */

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getToken } from '../../lib/api'

export default function RequireAuth({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [checked, setChecked] = useState(false)

  useEffect(() => {
    const token = getToken()
    if (!token) {
      router.replace('/login')
      return
    }
    setChecked(true)
  }, [router])

  if (!checked) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#f4f4f7' }}>
        <div
          className="w-8 h-8 border-2 rounded-full animate-spin"
          style={{ borderColor: 'rgba(107,26,42,0.2)', borderTopColor: '#6B1A2A' }}
        />
      </div>
    )
  }

  return <>{children}</>
}