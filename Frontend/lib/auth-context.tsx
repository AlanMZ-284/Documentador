'use client'
/**
 * lib/auth-context.tsx
 * Maneja el estado de sesión global del frontend.
 *
 * - Lee el token y el usuario de localStorage al montar
 * - Expone user, loading, login(), logout()
 * - Permite proteger rutas con <RequireAuth>
 */

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { authApi, getToken, AuthUser } from './api'

interface AuthState {
  user: AuthUser | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthState | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Restaura la sesión al cargar la app
    const token = getToken()
    if (!token) {
      setLoading(false)
      return
    }
    const stored = localStorage.getItem('user')
    if (stored) {
      try {
        setUser(JSON.parse(stored))
      } catch {
        localStorage.removeItem('user')
      }
    }
    setLoading(false)
  }, [])

  const login = async (email: string, password: string) => {
    const data = await authApi.login(email, password)
    localStorage.setItem('token', data.token)
    localStorage.setItem('user', JSON.stringify(data.user))
    setUser(data.user)
  }

  const logout = async () => {
    try {
      await authApi.logout()
    } catch {
      
    }
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
    window.location.href = '/login'
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>')
  return ctx
}