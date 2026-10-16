import { HeartPulse } from 'lucide-react'

export function SiteHeader() {
  return (
    <header className="mx-auto flex w-full max-w-5xl items-center justify-between px-5 py-5">
      <a href="/" className="flex items-center gap-2" aria-label="VitalPass, inicio">
        <span className="flex size-9 items-center justify-center rounded-xl bg-[#0f3d2e] text-white">
          <HeartPulse aria-hidden="true" className="size-5" />
        </span>
        <span className="text-lg font-bold tracking-tight text-[#0f3d2e]">VitalPass</span>
      </a>
      <nav aria-label="Principal" className="flex gap-4 text-sm font-medium text-[#13704f]">
        <a href="/medico" className="hover:underline">Médico</a>
        <a href="/validar" className="hover:underline">Validar</a>
      </nav>
    </header>
  )
}

export function TestnetNotice() {
  return (
    <p className="mx-auto max-w-5xl px-5 pb-10 text-center text-xs text-slate-500">
      Prototipo de hackathon. Usa las redes de prueba (testnet) de Hedera y Stellar. Todos los atletas son ficticios.
    </p>
  )
}
