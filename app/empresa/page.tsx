'use client'

import { useEffect, useRef, useState } from 'react'
import {
  BadgeCheck,
  Building2,
  CheckCircle2,
  Clock,
  ExternalLink,
  GraduationCap,
  WalletCards,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  addContribution,
  formatTimestamp,
  getApplications,
  getContributions,
  stellarExpertUrl,
  verifyCredential,
  type Application,
  type Contribution,
} from '@/lib/data'

const MAX_AMOUNT = 100000

function formatAmount(value: number) {
  return `${value.toLocaleString('es-AR')} USDC`
}

function errorText(error: unknown) {
  return error instanceof Error ? error.message : 'Ocurrió un error inesperado.'
}

export default function EmpresaPage() {
  const [applications, setApplications] = useState<Application[]>([])
  const [history, setHistory] = useState<Contribution[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [actionError, setActionError] = useState('')
  const [verifyingId, setVerifyingId] = useState('')

  const [modalOpen, setModalOpen] = useState(false)
  const [studentId, setStudentId] = useState('')
  const [amount, setAmount] = useState('')
  const [formError, setFormError] = useState('')
  const [saving, setSaving] = useState(false)
  const amountRef = useRef<HTMLInputElement>(null)

  // Un estudiante puede financiarse solo si su credencial ya fue verificada.
  const verifiedApplications = applications.filter((application) => Boolean(application.credential?.verified_at))

  async function loadAll() {
    try {
      const [loadedApplications, loadedHistory] = await Promise.all([getApplications(), getContributions()])
      setApplications(loadedApplications)
      setHistory(loadedHistory)
      setLoadError('')
    } catch (error) {
      setLoadError(errorText(error))
    } finally {
      setLoading(false)
    }
  }

  // Al abrir la página, se piden los datos a Supabase.
  useEffect(() => {
    loadAll()
  }, [])

  async function handleVerify(application: Application) {
    if (!application.credential) return
    setActionError('')
    setVerifyingId(application.id)
    try {
      await verifyCredential(application.credential.id)
      await loadAll()
    } catch (error) {
      setActionError(errorText(error))
    } finally {
      setVerifyingId('')
    }
  }

  function openModal(preselectedStudentId?: string) {
    setStudentId(preselectedStudentId ?? verifiedApplications[0]?.student.id ?? '')
    setAmount('')
    setFormError('')
    setModalOpen(true)
  }

  function closeModal() {
    setModalOpen(false)
  }

  async function handleConfirm() {
    const value = Number(amount)

    if (!studentId) {
      setFormError('Elegí un estudiante con credencial verificada.')
      return
    }
    if (!Number.isFinite(value) || value <= 0) {
      setFormError('Ingresá un monto mayor a cero.')
      return
    }
    if (value > MAX_AMOUNT) {
      setFormError(`El monto máximo de la demo es ${MAX_AMOUNT.toLocaleString('es-AR')} USDC.`)
      return
    }

    setSaving(true)
    try {
      await addContribution(studentId, value)
      await loadAll()
      closeModal()
    } catch (error) {
      setFormError(errorText(error))
    } finally {
      setSaving(false)
    }
  }

  // Cierra el modal con Escape y lleva el foco al campo de monto al abrir.
  useEffect(() => {
    if (!modalOpen) return
    amountRef.current?.focus()
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setModalOpen(false)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [modalOpen])

  return (
    <main className="min-h-screen bg-[#f4fbf9] text-slate-950">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6 lg:px-8">
        <a href="/" className="flex items-center gap-2.5" aria-label="REJOAR, inicio">
          <span className="flex size-9 items-center justify-center rounded-xl bg-[#164e63] text-white shadow-sm">
            <Building2 aria-hidden="true" className="size-5" />
          </span>
          <span className="text-lg font-bold tracking-[-0.04em] text-[#164e63]">REJOAR</span>
        </a>
        <span className="rounded-full bg-[#dff6ec] px-3 py-1.5 text-xs font-bold uppercase tracking-[0.12em] text-[#147d61]">Panel empresa u ONG</span>
      </header>

      <section className="mx-auto max-w-6xl px-6 pb-20 pt-8 lg:px-8 lg:pt-14">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#1b9a72]">Tu espacio REJOAR</p>
            <h1 className="mt-3 text-4xl font-semibold tracking-[-0.05em] text-[#123047] sm:text-5xl">Verificá y financiá becas</h1>
            <p className="mt-4 text-lg leading-8 text-slate-600">Primero comprobá que la credencial es auténtica. Después financiá la beca con trazabilidad.</p>
          </div>
          <Button type="button" onClick={() => openModal()} disabled={loading} className="h-12 shrink-0 rounded-xl bg-[#164e63] px-6 text-base font-semibold text-white hover:bg-[#0f3d50]">
            <WalletCards data-icon="inline-start" />Financiar beca
          </Button>
        </div>

        {loadError && (
          <div role="alert" className="mt-8 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm leading-6 text-amber-900">
            <p className="font-semibold">No pudimos cargar los datos</p>
            <p className="mt-1">{loadError}</p>
          </div>
        )}
        {actionError && <p role="alert" className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{actionError}</p>}
        {loading && !loadError && <p className="mt-10 text-slate-500">Cargando...</p>}

        {!loading && !loadError && (
          <>
            <section aria-labelledby="applications-title" className="mt-10 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
              <div className="flex flex-wrap items-center gap-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#1b9a72]">Postulaciones</p>
                  <h2 id="applications-title" className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-[#123047]">Estudiantes que postularon</h2>
                </div>
                <span className="rounded-full bg-[#eaf9f1] px-2 py-1 text-[10px] font-bold uppercase tracking-[0.1em] text-[#147d61]">Dato simulado</span>
              </div>

              <div className="mt-7 flex flex-col gap-4">
                {applications.length === 0 && <p className="text-sm text-slate-500">Todavía no hay postulaciones.</p>}
                {applications.map((application) => {
                  const isVerified = Boolean(application.credential?.verified_at)
                  const isVerifying = verifyingId === application.id
                  return (
                    <article key={application.id} className="rounded-2xl border border-slate-200 p-5 transition hover:border-[#9edec3]">
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div className="flex items-start gap-4">
                          <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-[#eaf9f1] text-[#147d61]"><GraduationCap aria-hidden="true" className="size-5" /></div>
                          <div>
                            <h3 className="font-semibold text-[#123047]">{application.student.name}</h3>
                            <p className="mt-1 text-sm text-slate-600">{application.student.career} · {application.student.institution}</p>
                            <p className="mt-2 text-sm text-slate-500">Postula a: <span className="font-medium text-[#123047]">{application.scholarshipName}</span></p>
                            {application.credential && <p className="mt-1 text-xs text-slate-400">Código de credencial: {application.credential.code}</p>}
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-3">
                          {isVerified ? (
                            <>
                              <span className="inline-flex items-center gap-2 rounded-full bg-[#eaf9f1] px-3 py-1.5 text-xs font-semibold text-[#16805f]"><CheckCircle2 aria-hidden="true" className="size-3.5" /> Credencial verificada</span>
                              <Button type="button" variant="outline" onClick={() => openModal(application.student.id)} className="h-10 rounded-xl border-[#a9e1c9] font-semibold text-[#147d61] hover:bg-[#eaf9f1]">Financiar</Button>
                            </>
                          ) : (
                            <>
                              <span className="inline-flex items-center gap-2 rounded-full bg-[#fff6dc] px-3 py-1.5 text-xs font-semibold text-[#8b6500]"><Clock aria-hidden="true" className="size-3.5" /> Sin verificar</span>
                              <Button type="button" onClick={() => handleVerify(application)} disabled={isVerifying || !application.credential} className="h-10 rounded-xl bg-[#147d61] font-semibold text-white hover:bg-[#0f604b]"><BadgeCheck data-icon="inline-start" />{isVerifying ? 'Verificando...' : 'Verificar'}</Button>
                            </>
                          )}
                        </div>
                      </div>
                    </article>
                  )
                })}
              </div>
              <p className="mt-5 text-xs text-slate-500">Por ahora la verificación se guarda en la base de datos. En la versión conectada también se consulta el registro en la blockchain.</p>
            </section>

            <section aria-labelledby="history-title" className="mt-6 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
              <div className="flex flex-wrap items-center gap-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#1b9a72]">Historial</p>
                  <h2 id="history-title" className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-[#123047]">Aportes realizados</h2>
                </div>
                <span className="rounded-full bg-[#eaf9f1] px-2 py-1 text-[10px] font-bold uppercase tracking-[0.1em] text-[#147d61]">Dato simulado</span>
              </div>

              <div className="mt-7 overflow-x-auto">
                <table className="w-full min-w-[560px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-xs uppercase tracking-[0.1em] text-slate-500">
                      <th scope="col" className="pb-3 font-semibold">Fecha</th>
                      <th scope="col" className="pb-3 font-semibold">Estudiante</th>
                      <th scope="col" className="pb-3 font-semibold">Monto</th>
                      <th scope="col" className="pb-3 font-semibold">Estado</th>
                      <th scope="col" className="pb-3 font-semibold">Transacción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.length === 0 && (
                      <tr><td colSpan={5} className="py-6 text-slate-500">Todavía no hay aportes.</td></tr>
                    )}
                    {history.map((item) => (
                      <tr key={item.id} className="border-b border-slate-100 last:border-0">
                        <td className="py-4 text-slate-600">{formatTimestamp(item.created_at)}</td>
                        <td className="py-4 font-medium text-[#123047]">{item.studentName}</td>
                        <td className="py-4 text-[#123047]">{formatAmount(item.amount)}</td>
                        <td className="py-4"><span className="rounded-full bg-[#eaf9f1] px-2.5 py-1 text-xs font-semibold capitalize text-[#147d61]">{item.status}</span></td>
                        <td className="py-4">
                          {item.stellar_tx ? (
                            <a href={stellarExpertUrl(item.stellar_tx)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 font-semibold text-[#147d61] underline underline-offset-4 hover:text-[#0f604b]">Ver transacción <ExternalLink aria-hidden="true" className="size-3.5" /></a>
                          ) : (
                            <span className="text-slate-400">Pendiente</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}
      </section>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4" onClick={closeModal}>
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="fund-title"
            onClick={(event) => event.stopPropagation()}
            className="w-full max-w-md rounded-[2rem] bg-white p-6 shadow-2xl sm:p-8"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 id="fund-title" className="text-2xl font-semibold tracking-[-0.04em] text-[#123047]">Financiar beca</h2>
                <span className="mt-2 inline-block rounded-full bg-[#eaf9f1] px-2 py-1 text-[10px] font-bold uppercase tracking-[0.1em] text-[#147d61]">Dato simulado</span>
              </div>
              <button type="button" onClick={closeModal} aria-label="Cerrar" className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100"><X aria-hidden="true" className="size-5" /></button>
            </div>

            {verifiedApplications.length === 0 ? (
              <p className="mt-6 rounded-2xl bg-[#fff6dc] p-4 text-sm leading-6 text-[#8b6500]">Todavía no verificaste ninguna credencial. Verificá al menos una postulación para poder financiarla.</p>
            ) : (
              <div className="mt-6 flex flex-col gap-5">
                <div>
                  <label htmlFor="fund-student" className="text-sm font-semibold text-[#123047]">Estudiante</label>
                  <select
                    id="fund-student"
                    value={studentId}
                    onChange={(event) => { setStudentId(event.target.value); setFormError('') }}
                    className="mt-2 h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-[#123047] outline-none focus:border-[#58b992] focus:ring-4 focus:ring-[#dff6ec]"
                  >
                    {verifiedApplications.map((application) => <option key={application.id} value={application.student.id}>{application.student.name}</option>)}
                  </select>
                </div>
                <div>
                  <label htmlFor="fund-amount" className="text-sm font-semibold text-[#123047]">Monto (USDC)</label>
                  <input
                    id="fund-amount"
                    ref={amountRef}
                    type="number"
                    inputMode="decimal"
                    min="0"
                    value={amount}
                    onChange={(event) => { setAmount(event.target.value); setFormError('') }}
                    onKeyDown={(event) => { if (event.key === 'Enter') handleConfirm() }}
                    placeholder="Ej: 150"
                    className="mt-2 h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-[#123047] outline-none placeholder:text-slate-400 focus:border-[#58b992] focus:ring-4 focus:ring-[#dff6ec]"
                  />
                </div>
                {formError && <p role="alert" className="text-sm text-red-700">{formError}</p>}
                <p className="text-xs leading-5 text-slate-500">El aporte se guarda como simulado: todavía no se envía ninguna transacción real.</p>
              </div>
            )}

            <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <Button type="button" variant="outline" onClick={closeModal} className="h-11 rounded-xl px-5 font-semibold">Cancelar</Button>
              {verifiedApplications.length > 0 && (
                <Button type="button" onClick={handleConfirm} disabled={saving} className="h-11 rounded-xl bg-[#164e63] px-5 font-semibold text-white hover:bg-[#0f3d50]">{saving ? 'Guardando...' : 'Confirmar aporte'}</Button>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
