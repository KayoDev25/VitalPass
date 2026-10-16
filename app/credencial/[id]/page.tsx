'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { QRCodeSVG } from 'qrcode.react'
import { BadgeCheck, Loader2 } from 'lucide-react'
import { SiteHeader, TestnetNotice } from '@/components/brand'
import { ChainStatus } from '@/components/chain-status'
import { useApto } from '@/lib/use-apto'
import { formatDate, isExpired } from '@/lib/types'

export default function CredencialPage() {
  const params = useParams<{ id: string }>()
  const { data, error, loading, load } = useApto()
  const [origin, setOrigin] = useState('')

  useEffect(() => {
    setOrigin(window.location.origin)
    if (params?.id) load(params.id)
  }, [params?.id, load])

  const record = data?.record
  const enabled = record && record.apto && !isExpired(record.valid_until)
  // El QR es un link al validador: cualquier celular lo abre con la cámara, sin app.
  const qrValue = record ? `${origin}/validar?id=${record.id}` : ''
  const initials = record?.athlete_name.split(' ').map((word) => word[0]).slice(0, 2).join('').toUpperCase()

  return (
    <main className="min-h-screen bg-[#f3f8f5]">
      <SiteHeader />
      <section className="mx-auto max-w-md px-5 pb-16 pt-4">
        {loading && <p className="flex items-center gap-2 text-slate-600"><Loader2 className="size-4 animate-spin" aria-hidden="true" /> Cargando credencial…</p>}
        {error && <p role="alert" className="rounded-xl bg-red-50 p-4 text-sm text-red-800">{error}</p>}

        {record && (
          <>
            <article className="overflow-hidden rounded-[2rem] bg-[#0f3d2e] text-white shadow-xl">
              <div className="flex items-center justify-between px-6 pt-6">
                <span className="text-sm font-semibold tracking-wide text-emerald-200">VitalSport ID</span>
                {data?.demo && <span className="rounded bg-amber-300 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-950">Dato simulado</span>}
              </div>
              <div className="flex items-center gap-4 px-6 py-5">
                <div className="flex size-16 items-center justify-center rounded-2xl bg-emerald-200 text-2xl font-bold text-[#0f3d2e]">{initials}</div>
                <div className="min-w-0">
                  <h1 className="truncate text-xl font-semibold">{record.athlete_name}</h1>
                  <p className="text-sm text-emerald-100">{record.club}</p>
                </div>
              </div>
              <div className={`mx-6 rounded-2xl px-4 py-3 text-center text-lg font-bold ${enabled ? 'bg-emerald-400 text-[#0f3d2e]' : 'bg-red-500 text-white'}`}>
                {enabled ? 'APTO HABILITADO' : record.apto ? 'APTO VENCIDO' : 'NO APTO'}
              </div>
              <p className="px-6 pt-2 text-center text-xs text-emerald-100">Vigente hasta el {formatDate(record.valid_until)}</p>
              <div className="m-6 flex flex-col items-center gap-2 rounded-2xl bg-white p-5 text-[#0f3d2e]">
                {qrValue && <QRCodeSVG value={qrValue} size={180} level="M" />}
                <p className="font-mono text-sm font-bold">{record.id}</p>
                <p className="text-center text-xs text-slate-500">El árbitro escanea este código con la cámara del celular.</p>
              </div>
            </article>

            <div className="mt-6 grid gap-3">
              <h2 className="flex items-center gap-2 text-sm font-bold text-[#0f3d2e]"><BadgeCheck aria-hidden="true" className="size-4" /> Verificación en blockchain</h2>
              <ChainStatus record={record} />
            </div>
          </>
        )}
      </section>
      <TestnetNotice />
    </main>
  )
}
