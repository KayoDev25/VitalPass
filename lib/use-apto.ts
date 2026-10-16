'use client'

import { useCallback, useState } from 'react'
import type { AptoResponse } from '@/lib/types'

// Pide un apto al servidor por su código. Lo usan la credencial y el validador.
export function useApto() {
  const [data, setData] = useState<AptoResponse | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const load = useCallback(async (rawId: string) => {
    const id = rawId.trim().toUpperCase()
    if (!id) return
    setLoading(true)
    setError('')
    setData(null)
    try {
      const response = await fetch(`/api/apto/${encodeURIComponent(id)}`, { cache: 'no-store' })
      const body = await response.json()
      if (!response.ok) throw new Error(body.error ?? 'No se pudo consultar el apto.')
      setData(body as AptoResponse)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error inesperado.')
    } finally {
      setLoading(false)
    }
  }, [])

  return { data, error, loading, load }
}
