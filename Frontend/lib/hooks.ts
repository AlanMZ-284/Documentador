'use client'
/**
 * lib/hooks.ts
 * Hooks de datos que conectan cada página con el backend.
 * Cada hook expone { data, loading, error, reload }.
 */

import { useEffect, useState, useCallback } from 'react'
import {
  proyectosApi, auditoriaApi, plantillasApi, documentosApi, usuariosApi,
  Proyecto, AuditoriaEvento, Plantilla, Documento, Usuario,
} from './api'

interface AsyncState<T> {
  data: T | null
  loading: boolean
  error: string | null
  reload: () => void
}

function useAsync<T>(fn: () => Promise<T>, deps: unknown[]): AsyncState<T> {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [nonce, setNonce] = useState(0)

  const reload = useCallback(() => setNonce(n => n + 1), [])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    fn()
      .then(res => { if (!cancelled) setData(res) })
      .catch(err => { if (!cancelled) setError(err instanceof Error ? err.message : 'Error') })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, nonce])

  return { data, loading, error, reload }
}

export function useProyectos(params?: { q?: string; estatus?: string }) {
  const state = useAsync<{ data: Proyecto[]; total: number }>(
    () => proyectosApi.list({ pageSize: 100, ...params }),
    [params?.q, params?.estatus]
  )
  return { ...state, proyectos: state.data?.data ?? [], total: state.data?.total ?? 0 }
}

export function useProyecto(id: number | null) {
  const state = useAsync<Proyecto | null>(
    () => (id ? proyectosApi.get(id) : Promise.resolve(null)),
    [id]
  )
  return { ...state, proyecto: state.data }
}

export function useAuditoria(params?: { tipo_accion?: string; q?: string }) {
  const state = useAsync<{ data: AuditoriaEvento[]; total: number }>(
    () => auditoriaApi.list({ pageSize: 100, ...params }),
    [params?.tipo_accion, params?.q]
  )
  return { ...state, eventos: state.data?.data ?? [], total: state.data?.total ?? 0 }
}

export function usePlantillas(params?: { q?: string }) {
  const state = useAsync<{ data: Plantilla[]; total: number }>(
    () => plantillasApi.list({ pageSize: 100, ...params }),
    [params?.q]
  )
  return { ...state, plantillas: state.data?.data ?? [], total: state.data?.total ?? 0 }
}

export function useDocumentos(params?: { q?: string }) {
  const state = useAsync<{ data: Documento[]; total: number }>(
    () => documentosApi.list({ pageSize: 100, ...params }),
    [params?.q]
  )
  return { ...state, documentos: state.data?.data ?? [], total: state.data?.total ?? 0 }
}

export function useUsuarios() {
  const state = useAsync<{ data: Usuario[]; total: number }>(() => usuariosApi.list(), [])
  return { ...state, usuarios: state.data?.data ?? [], total: state.data?.total ?? 0 }
}