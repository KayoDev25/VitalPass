'use client'

import { useState } from 'react'
import { Loader2, ShieldCheck, Stethoscope } from 'lucide-react'
import { SiteHeader, TestnetNotice } from '@/components/brand'
import { ChainStatus } from '@/components/chain-status'
import type { AptoRecord } from '@/lib/types'

type Result = Pick<AptoRecord, 'id' | 'record_hash' | 'hedera_tx' | 'hedera_topic' | 'hedera_error' | 'stellar_tx' | 'stellar_contract' | 'stellar_error'>

const BLOOD_TYPES = ['0+', '0-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-']

const inputClass =
  'h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100'

function Field({ label, name, ...props }: { label: string; name: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="grid gap-1.5 text-sm font-medium text-slate-700">
      {label}
      <input name={name} className={inputClass} {...props} />
    </label>
  )
}

export default function MedicoPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<Result | null>(null)

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    setError('')
    setResult(null)
    const data = Object.fromEntries(new FormData(event.currentTarget)) as Record<string, string>
    try {
      const response = await fetch('/api/emitir', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, apto: data.apto === 'APTO' }),
      })
      const body = await response.json()
      if (!response.ok) throw new Error(body.error ?? 'No se pudo emitir el apto.')
      setResult({ ...body, record_hash: body.recordHash })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error inesperado.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-[#f3f8f5]">
      <SiteHeader />
      <section className="mx-auto max-w-2xl px-5 pb-16 pt-4">
        <div className="flex items-center gap-3">
          <span className="flex size-11 items-center justify-center rounded-2xl bg-white text-emerald-700 ring-1 ring-emerald-200">
            <Stethoscope aria-hidden="true" className="size-5" />
          </span>
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-emerald-700">Portal profesional</p>
            <h1 className="text-2xl font-semibold text-[#0f3d2e]">Emitir apto médico deportivo</h1>
          </div>
        </div>
        <p className="mt-4 rounded-xl bg-amber-50 p-3 text-sm text-amber-900">
          Usá solo datos inventados: es una demo pública. El DNI no se guarda; solo su huella (hash).
        </p>

        <form onSubmit={onSubmit} className="mt-6 grid gap-5 rounded-3xl border border-slate-200 bg-white p-5 sm:p-7">
          <fieldset className="grid gap-4 sm:grid-cols-2">
            <legend className="mb-2 text-sm font-bold text-[#0f3d2e]">Atleta</legend>
            <Field label="Nombre y apellido" name="athlete_name" required placeholder="Lucía Fernández" />
            <Field label="DNI" name="dni" required inputMode="numeric" placeholder="40123456" />
            <Field label="Club" name="club" required placeholder="Club Atlético Ejemplo" />
            <label className="grid gap-1.5 text-sm font-medium text-slate-700">
              Grupo sanguíneo
              <select name="blood_type" required className={inputClass} defaultValue="0+">
                {BLOOD_TYPES.map((type) => <option key={type}>{type}</option>)}
              </select>
            </label>
            <Field label="Alergias (medicamentos)" name="allergies" placeholder="Ninguna conocida" />
            <Field label="Presión arterial" name="blood_pressure" placeholder="110/70" />
            <Field label="Contacto de emergencia" name="emergency_name" required placeholder="Marta (madre)" />
            <Field label="Teléfono de emergencia" name="emergency_phone" required type="tel" placeholder="+54 9 379 ..." />
          </fieldset>

          <fieldset className="grid gap-4 sm:grid-cols-2">
            <legend className="mb-2 text-sm font-bold text-[#0f3d2e]">Médico y dictamen</legend>
            <Field label="Nombre del médico" name="medic_name" required placeholder="Dra. Ana Ejemplo" />
            <Field label="Matrícula profesional" name="medic_license" required placeholder="MP-0000" />
            <label className="grid gap-1.5 text-sm font-medium text-slate-700 sm:col-span-2">
              Dictamen
              <select name="apto" className={inputClass} defaultValue="APTO">
                <option value="APTO">APTO para competir</option>
                <option value="NO_APTO">NO APTO</option>
              </select>
            </label>
          </fieldset>

          <button
            type="submit"
            disabled={loading}
            className="flex h-12 items-center justify-center gap-2 rounded-xl bg-[#0f3d2e] px-5 font-semibold text-white hover:bg-[#0b2e22] disabled:opacity-60"
          >
            {loading ? <Loader2 aria-hidden="true" className="size-5 animate-spin" /> : <ShieldCheck aria-hidden="true" className="size-5" />}
            {loading ? 'Registrando en Hedera y Stellar…' : 'Firmar y certificar apto en blockchain'}
          </button>
          {error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-800">{error}</p>}
        </form>

        {result && (
          <div className="mt-6 grid gap-4 rounded-3xl border border-emerald-200 bg-emerald-50 p-5 sm:p-7" role="status">
            <div>
              <p className="text-sm text-emerald-800">Apto emitido. Código de verificación:</p>
              <p className="mt-1 font-mono text-2xl font-bold text-[#0f3d2e]">{result.id}</p>
              <p className="mt-2 break-all font-mono text-xs text-slate-500">Huella de la ficha (SHA-256): {result.record_hash}</p>
            </div>
            <ChainStatus record={result as AptoRecord} />
            <div className="flex flex-col gap-2 sm:flex-row">
              <a href={`/credencial/${result.id}`} className="flex h-11 flex-1 items-center justify-center rounded-xl bg-[#0f3d2e] font-semibold text-white">Ver credencial del atleta</a>
              <a href={`/validar?id=${result.id}`} className="flex h-11 flex-1 items-center justify-center rounded-xl border border-[#0f3d2e] font-semibold text-[#0f3d2e]">Validar en cancha</a>
            </div>
          </div>
        )}
      </section>
      <TestnetNotice />
    </main>
  )
}
