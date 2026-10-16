'use client'

import { useEffect, useState } from 'react'
import { BadgeCheck, CheckCircle2, ExternalLink, ShieldCheck, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatDateOnly, formatTimestamp, getCredentialByCode, hashscanUrl, type CredentialWithStudent } from '@/lib/data'

const DEMO_CODE = 'REJOAR-2026-001'

type Status = 'idle' | 'loading' | 'valid' | 'invalid' | 'error'

export default function VerificarPage() {
  const [code, setCode] = useState('')
  const [status, setStatus] = useState<Status>('idle')
  const [result, setResult] = useState<CredentialWithStudent | null>(null)
  const [errorMessage, setErrorMessage] = useState('')

  async function verify(rawCode: string) {
    const normalizedCode = rawCode.trim().toUpperCase()
    if (!normalizedCode) {
      setStatus('invalid')
      setResult(null)
      return
    }

    setStatus('loading')
    try {
      const credential = await getCredentialByCode(normalizedCode)
      setResult(credential)
      setStatus(credential ? 'valid' : 'invalid')
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Ocurrió un error inesperado.')
      setStatus('error')
    }
  }

  // Si la dirección trae ?code=..., se completa y se verifica solo (enlace para compartir).
  useEffect(() => {
    const codeFromUrl = new URLSearchParams(window.location.search).get('code')
    if (codeFromUrl) {
      setCode(codeFromUrl)
      verify(codeFromUrl)
    }
  }, [])

  const isLoading = status === 'loading'

  return (
    <main className="min-h-screen bg-[#f4fbf9] text-slate-950">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6 lg:px-8">
        <a href="/" className="flex items-center gap-2.5" aria-label="REJOAR, inicio">
          <span className="flex size-9 items-center justify-center rounded-xl bg-[#164e63] text-white shadow-sm">
            <ShieldCheck aria-hidden="true" className="size-5" />
          </span>
          <span className="text-lg font-bold tracking-[-0.04em] text-[#164e63]">REJOAR</span>
        </a>
        <a href="/" className="text-sm font-medium text-[#147d61] hover:text-[#0f604b]">Volver al inicio</a>
      </header>

      <section className="mx-auto flex max-w-2xl flex-col px-6 pb-24 pt-14 lg:px-8 lg:pt-24">
        <div className="text-center">
          <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-white text-[#147d61] shadow-sm ring-1 ring-[#ccefe1]">
            <BadgeCheck aria-hidden="true" className="size-7" />
          </div>
          <p className="mt-7 text-sm font-bold uppercase tracking-[0.18em] text-[#1b9a72]">Credenciales verificables</p>
          <h1 className="mt-4 text-4xl font-semibold tracking-[-0.05em] text-[#123047] sm:text-5xl">Verificá una credencial</h1>
          <p className="mx-auto mt-5 max-w-lg text-lg leading-8 text-slate-600">Pegá el código de una credencial para comprobar si fue emitida por una institución válida.</p>
        </div>

        <div className="mt-12 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <label htmlFor="credential-code" className="text-sm font-semibold text-[#123047]">Código de credencial</label>
          <div className="mt-3 flex flex-col gap-3 sm:flex-row">
            <input
              id="credential-code"
              type="text"
              value={code}
              onChange={(event) => { setCode(event.target.value); setStatus('idle') }}
              onKeyDown={(event) => { if (event.key === 'Enter') verify(code) }}
              placeholder="Ej: REJOAR-2026-001"
              className="h-12 min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-4 text-sm text-[#123047] outline-none transition placeholder:text-slate-400 focus:border-[#58b992] focus:ring-4 focus:ring-[#dff6ec]"
            />
            <Button type="button" onClick={() => verify(code)} disabled={isLoading} className="h-12 rounded-xl bg-[#164e63] px-6 text-base font-semibold text-white hover:bg-[#0f3d50]">{isLoading ? 'Verificando...' : 'Verificar'}</Button>
          </div>
          <p className="mt-3 text-xs text-slate-500">Probá con el código de ejemplo: <button type="button" onClick={() => { setCode(DEMO_CODE); setStatus('idle') }} className="font-semibold text-[#147d61] underline underline-offset-2">REJOAR-2026-001</button></p>
        </div>

        {status === 'valid' && result && (
          <div role="status" className="mt-6 rounded-[2rem] border border-[#a9e1c9] bg-[#eaf9f1] p-6 sm:p-8">
            <div className="flex items-start gap-4">
              <CheckCircle2 aria-hidden="true" className="mt-0.5 size-6 shrink-0 text-[#16805f]" />
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-xl font-semibold text-[#123047]">Credencial auténtica</h2>
                  <span className="rounded-full bg-[#c8f0da] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-[#147d61]">Dato simulado</span>
                </div>
                <dl className="mt-6 grid gap-4 text-sm sm:grid-cols-3">
                  <div><dt className="text-slate-500">Estudiante</dt><dd className="mt-1 font-semibold text-[#123047]">{result.student.name}</dd></div>
                  <div><dt className="text-slate-500">Institución emisora</dt><dd className="mt-1 font-semibold text-[#123047]">{result.issuer}</dd></div>
                  <div><dt className="text-slate-500">Fecha de emisión</dt><dd className="mt-1 font-semibold text-[#123047]">{formatDateOnly(result.issued_at)}</dd></div>
                </dl>
                <p className="mt-5 text-sm text-slate-600">
                  {result.verified_at ? `Verificada por una organización el ${formatTimestamp(result.verified_at)}.` : 'Todavía ninguna organización la verificó.'}
                </p>
                {result.hedera_tx ? (
                  <a href={hashscanUrl(result.hedera_tx)} target="_blank" rel="noreferrer" className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[#147d61] underline underline-offset-4 hover:text-[#0f604b]">Ver registro en la blockchain <ExternalLink aria-hidden="true" className="size-4" /></a>
                ) : (
                  <p className="mt-5 text-sm text-slate-500">Registro en la blockchain: pendiente.</p>
                )}
              </div>
            </div>
          </div>
        )}

        {status === 'invalid' && (
          <div role="alert" className="mt-6 flex items-start gap-4 rounded-[2rem] border border-red-200 bg-red-50 p-6 text-red-800 sm:p-8">
            <XCircle aria-hidden="true" className="mt-0.5 size-6 shrink-0 text-red-600" />
            <div><h2 className="font-semibold">Código inválido</h2><p className="mt-1 text-sm leading-6 text-red-700">No encontramos una credencial con ese código. Revisalo e intentá nuevamente.</p></div>
          </div>
        )}

        {status === 'error' && (
          <div role="alert" className="mt-6 flex items-start gap-4 rounded-[2rem] border border-amber-200 bg-amber-50 p-6 text-amber-900 sm:p-8">
            <XCircle aria-hidden="true" className="mt-0.5 size-6 shrink-0 text-amber-600" />
            <div><h2 className="font-semibold">No pudimos consultar la base</h2><p className="mt-1 text-sm leading-6">{errorMessage}</p></div>
          </div>
        )}
      </section>
    </main>
  )
}
