/**
 * lib/api.ts
 * Cliente HTTP centralizado para el Documentador Frontend.
 *
 * - Lee la URL base desde NEXT_PUBLIC_API_URL
 * - Inyecta el token JWT en cada petición autenticada
 * - Lanza errores con el mensaje del backend cuando existe
 * - Si el token expira (401), limpia sesión y redirige a /login
 *
 * Los shapes de respuesta están alineados a los controllers reales del backend.
 */

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

// ── Helpers internos ────────────────────────────────────────

export function getToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('token')
}

function authHeaders(): HeadersInit {
  const token = getToken()
  return token ? { Authorization: `Bearer ${token}` } : {}
}

function clearSessionAndRedirect() {
  if (typeof window === 'undefined') return
  localStorage.removeItem('token')
  localStorage.removeItem('user')
  if (window.location.pathname !== '/login') {
    window.location.href = '/login'
  }
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (res.status === 401) {
    clearSessionAndRedirect()
    throw new Error('Sesión expirada. Inicia sesión de nuevo.')
  }
  if (!res.ok) {
    let message = `Error ${res.status}`
    try {
      const body = await res.json()
      message = body.message ?? body.error ?? message
    } catch {
      // body no es JSON
    }
    throw new Error(message)
  }
  // 204 / sin cuerpo
  if (res.status === 204) return undefined as T
  const text = await res.text()
  return (text ? JSON.parse(text) : undefined) as T
}

async function get<T>(path: string, auth = true): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(auth ? authHeaders() : {}) },
  })
  return handleResponse<T>(res)
}

async function post<T>(path: string, body: unknown, auth = true): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(auth ? authHeaders() : {}) },
    body: JSON.stringify(body),
  })
  return handleResponse<T>(res)
}

async function postFormData<T>(path: string, formData: FormData, auth = true): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: auth ? authHeaders() : {},
    body: formData,
  })
  return handleResponse<T>(res)
}

async function patch<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(body),
  })
  return handleResponse<T>(res)
}

async function del<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
  })
  return handleResponse<T>(res)
}

// ── Tipos alineados al backend ──────────────────────────────

export interface AuthUser {
  id: number
  correo_corporativo: string
  id_rol: number
  nombre_rol: string
  permisos?: Record<string, unknown>
}

export interface LoginResponse {
  token: string
  user: AuthUser
}

export interface MeResponse {
  id_usuario: number
  correo_corporativo: string
  id_rol: number
  nombre_rol: string
  activo: boolean
  fecha_ultimo_acceso: string | null
}

export interface Proyecto {
  id_proyecto: number
  nombre_proyecto: string
  descripcion: string | null
  id_recurso_lider: number | null
  lider_nombre: string | null
  fecha_inicio: string | null
  fecha_fin: string | null
  estatus: string | null
  fecha_creacion?: string
  fecha_modificacion?: string
}

export interface Paginated<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
}

export interface AuditoriaEvento {
  id_evento: number
  id_usuario: number | null
  id_entidad_afectada: string | null
  tipo_accion: string
  timestamp_exacto: string
  ip_direccion: string | null
  detalles_extra: Record<string, unknown> | null
}

export interface Plantilla {
  id_plantilla: number
  nombre_plantilla: string
  descripcion: string | null
  estructura_json: Record<string, unknown> | null
  version: number
  fecha_creacion?: string
  fecha_modificacion?: string
}

export interface Documento {
  id_documento: string
  titulo_documento: string
  estatus_aceptacion: string | null
  version_actual: number
  fecha_creacion?: string | null
  fecha_ultima_modificacion: string | null
  id_proyecto: number | null
  id_aplicacion: number | null
  id_tipo_documento: number | null
}

export interface UploadVersionResponse {
  documento: Documento
  version: string
  archivo: {
    nombre: string
    mime: string
    size: number
    key: string
  }
  extraccion: { hash: string | null; archivos: number } | null
}

export interface Usuario {
  id_usuario: number
  correo_corporativo: string
  id_rol: number
  nombre_rol: string
  activo: boolean
  fecha_ultimo_acceso: string | null
}

// ── API por módulo ───────────────────────────────────────────

export const authApi = {
  login: (email: string, password: string) =>
    post<LoginResponse>('/api/auth/login', { email, password }, false),
  logout: () => post<{ message: string }>('/api/auth/logout', {}),
  me: () => get<MeResponse>('/api/auth/me'),
  refresh: () => post<{ token: string }>('/api/auth/refresh', {}),
}

export const proyectosApi = {
  list: (params?: { page?: number; pageSize?: number; q?: string; estatus?: string }) => {
    const qs = new URLSearchParams()
    if (params?.page) qs.set('page', String(params.page))
    if (params?.pageSize) qs.set('pageSize', String(params.pageSize))
    if (params?.q) qs.set('q', params.q)
    if (params?.estatus) qs.set('estatus', params.estatus)
    const query = qs.toString() ? `?${qs}` : ''
    return get<Paginated<Proyecto>>(`/api/proyectos${query}`)
  },
  get: (id: number) => get<Proyecto>(`/api/proyectos/${id}`),
  create: (body: Partial<Proyecto>) => post<Proyecto>('/api/proyectos', body),
  update: (id: number, body: Partial<Proyecto>) => patch<Proyecto>(`/api/proyectos/${id}`, body),
  delete: (id: number) => del<{ message: string }>(`/api/proyectos/${id}`),
}

export const auditoriaApi = {
  list: (params?: { page?: number; pageSize?: number; tipo_accion?: string; q?: string }) => {
    const qs = new URLSearchParams()
    if (params?.page) qs.set('page', String(params.page))
    if (params?.pageSize) qs.set('pageSize', String(params.pageSize))
    if (params?.tipo_accion) qs.set('tipo_accion', params.tipo_accion)
    if (params?.q) qs.set('q', params.q)
    const query = qs.toString() ? `?${qs}` : ''
    return get<Paginated<AuditoriaEvento>>(`/api/auditoria${query}`)
  },
  actions: () => get<{ actions: string[] }>('/api/auditoria/actions'),
}

export const plantillasApi = {
  list: (params?: { page?: number; pageSize?: number; q?: string }) => {
    const qs = new URLSearchParams()
    if (params?.page) qs.set('page', String(params.page))
    if (params?.pageSize) qs.set('pageSize', String(params.pageSize))
    if (params?.q) qs.set('q', params.q)
    const query = qs.toString() ? `?${qs}` : ''
    return get<Paginated<Plantilla>>(`/api/plantillas${query}`)
  },
  get: (id: number) => get<Plantilla>(`/api/plantillas/${id}`),
}

export const documentosApi = {
  list: (params?: { page?: number; pageSize?: number; q?: string }) => {
    const qs = new URLSearchParams()
    if (params?.page) qs.set('page', String(params.page))
    if (params?.pageSize) qs.set('pageSize', String(params.pageSize))
    if (params?.q) qs.set('q', params.q)
    const query = qs.toString() ? `?${qs}` : ''
    return get<Paginated<Documento>>(`/api/documentos${query}`)
  },
  get: (id: string) => get<Documento>(`/api/documentos/${id}`),
  create: (body: { id_tipo_documento: number; titulo_documento: string }) => post<Documento>(`/api/documentos`, body),
  uploadVersion: (id: string, formData: FormData) => postFormData<UploadVersionResponse>(`/api/documentos/${id}/versiones`, formData),
}

export const usuariosApi = {
  list: () => get<Paginated<Usuario>>('/api/usuarios'),

  get: (id: string) => get<Usuario>(`/api/usuarios/${id}`),

  create: (body: Omit<Usuario, 'id' | 'activo'>) => post<Usuario>('/api/usuarios', body),

  update: (id: string, body: Partial<Omit<Usuario, 'id'>>) => patch<Usuario>(`/api/usuarios/${id}`, body),

  resetPassword: (id: string) => post<{ message: string }>(`/api/usuarios/${id}/reset-password`, {}),

  deactivate: (id: string) => post<Usuario>(`/api/usuarios/${id}/deactivate`, {}),

  activate: (id: string) => post<Usuario>(`/api/usuarios/${id}/activate`, {}),
}