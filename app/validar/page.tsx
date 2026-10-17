'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { CheckCircle2, CircleAlert, Loader2, Phone, Siren, XCircle } from 'lucide-react'
import { SiteHeader, TestnetNotice } from '@/components/brand'
import { ChainStatus } from '@/components/chain-status'
import { useApto } from '@/lib/use-apto'
import { DEMO_ID, formatDate, isExpired, type StellarCheck } from '@/lib/types'

function StellarLiveCheck({ check }: { check: StellarCheck }) {
  if (check.status === 'ok') {
    const good = check.valid && check.recordHashMatches
    return (
      <p className={`flex items-start gap-2 rounded-xl p-3 text-sm ${good ? 'bg-emerald-50 text-emerald-900' : 'bg-red-50 text-red-900'}`}>
        {good ? <CheckCircle2 aria-hidden="true" className="mt-0.5 size-4 shrink-0" /> : <XCircle aria-hidden="true" className="mt-0.5 size-4 shrink-0" />}
        {good
          ? 'Consultado en vivo en el contrato de Stellar: vigente y la huella de la ficha coincide.'
          : !check.recordHashMatches
            ? 'El contrato de Stellar tiene una ficha distinta para este atleta (puede haber un apto más nuevo o datos alterados).'
            : 'El contrato de Stellar indica que este apto NO está vigente.'}
      </p>
    )
  }
  return (
    <p className="flex items-start gap-2 rounded-xl bg-slate-100 p-3 text-sm text-slate-700">
      <CircleAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
      {check.status === 'not_found' ? 'El contrato de Stellar no tiene registro para este atleta.' : `Sin consulta en vivo a Stellar: ${check.reason}`}
    </p>
  )
}

function Validator() {
  const searchParams = useSearchParams()
  const [code, setCode] = useState('')
  const [showEmergency, setShowEmergency] = useState(false)
  const { data, error, loading, load } = useApto()

  useEffect(() => {
    const id = searchParams.get('id')
    if (id) {
      setCode(id)
      load(id)
    }
  }, [searchParams, load])

  const record = data?.record
  const valid = record && record.apto && !isExpired(record.valid_until) && (data.stellar.status !== 'ok' || (data.stellar.valid && data.stellar.recordHashMatches))

  return (
    <section className="mx-auto max-w-md px-5 pb-16 pt-4">
      <h1 className="text-2xl font-semibold text-[#0f3d2e]">Validador en cancha</h1>
      <p className="mt-1 text-sm text-slate-600">Escaneá el QR del atleta con la cámara o escribí su código.</p>

      <form
        className="mt-5 flex gap-2"
        onSubmit={(event) => {
          event.preventDefault()
          setShowEmergency(false)
          load(code)
        }}
      >
        <input
          aria-label="Código del atleta"
          value={code}
          onChange={(event) => setCode(event.target.value)}
          placeholder="VP-1A2B3C4D"
          className="h-12 min-w-0 flex-1 rounded-xl border border-slate-300 bg-white px-3 font-mono uppercase text-slate-900 placeholder:text-slate-400 outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
        />
        <button type="submit" className="h-12 rounded-xl bg-[#0f3d2e] px-5 font-semibold text-white">Validar</button>
      </form>
      <p className="mt-2 text-xs text-slate-500">
        ¿Sin conexión a la base? Probá el atleta de ejemplo{' '}
        <button type="button" className="font-semibold text-[#13704f] underline" onClick={() => { setCode(DEMO_ID); load(DEMO_ID) }}>{DEMO_ID}</button>.
      </p>

      {loading && <p className="mt-6 flex items-center gap-2 text-slate-600"><Loader2 aria-hidden="true" className="size-4 animate-spin" /> Consultando…</p>}
      {error && <p role="alert" className="mt-6 rounded-xl bg-red-50 p-4 text-sm text-red-800">{error}</p>}

      {record && (
        <div className="mt-6 grid gap-4">
          <div role="status" className={`rounded-3xl p-6 text-center ${valid ? 'bg-emerald-500 text-white' : 'bg-red-600 text-white'}`}>
            {valid ? <CheckCircle2 aria-hidden="true" className="mx-auto size-14" /> : <XCircle aria-hidden="true" className="mx-auto size-14" />}
            <p className="mt-2 text-3xl font-black">{valid ? 'APTO VIGENTE' : 'NO HABILITADO'}</p>
            <p className="mt-1 text-sm opacity-90">{record.athlete_name} · {record.club}</p>
            <p className="mt-3 text-sm">Hasta el {formatDate(record.valid_until)}</p>
            <p className="text-sm">{record.medic_name} · Mat. {record.medic_license}</p>
            {data.demo && <p className="mx-auto mt-3 w-fit rounded bg-amber-300 px-2 py-0.5 text-xs font-bold uppercase text-amber-950">Dato simulado</p>}
          </div>

          <button
            type="button"
            onClick={() => setShowEmergency((value) => !value)}
            className="flex h-14 items-center justify-center gap-2 rounded-2xl bg-red-600 text-lg font-bold text-white shadow-lg shadow-red-600/30"
          >
            <Siren aria-hidden="true" className="size-6" /> Emergencia médica
          </button>

          {showEmergency && (
            <div className="grid gap-3 rounded-3xl border-2 border-red-600 bg-white p-5">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-red-50 p-3">
                  <p className="text-xs font-semibold uppercase text-red-700">Grupo sanguíneo</p>
                  <p className="text-3xl font-black text-red-700">{record.blood_type}</p>
                </div>
                <div className="rounded-xl bg-red-50 p-3">
                  <p className="text-xs font-semibold uppercase text-red-700">Alergias</p>
                  <p className="font-bold text-red-900">{record.allergies || 'Ninguna conocida'}</p>
                </div>
              </div>
              <a href={`tel:${record.emergency_phone.replace(/[^\d+]/g, '')}`} className="flex h-12 items-center justify-center gap-2 rounded-xl bg-[#0f3d2e] font-semibold text-white">
                <Phone aria-hidden="true" className="size-5" /> Llamar a {record.emergency_name}
              </a>
              <a href="tel:107" className="text-center text-sm font-semibold text-red-700 underline">Llamar al 107 (emergencias)</a>
            </div>
          )}

          <StellarLiveCheck check={data.stellar} />
          <ChainStatus record={record} />
        </div>
      )}
    </section>
  )
}

export default function ValidarPage() {
  return (
    <main className="min-h-screen bg-[#f3f8f5]">
      <SiteHeader />
      <Suspense fallback={null}>
        <Validator />
      </Suspense>
      <TestnetNotice />
    </main>
  )
}
