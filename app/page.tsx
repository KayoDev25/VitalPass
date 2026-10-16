import { ArrowRight, FileWarning, HeartPulse, QrCode, ScrollText, ShieldCheck, Siren, Stethoscope } from 'lucide-react'
import { SiteHeader, TestnetNotice } from '@/components/brand'

const problems = [
  { icon: FileWarning, title: 'Aptos en fotocopias', text: 'Los clubes guardan fichas en papel que nadie puede comprobar en cancha.' },
  { icon: Siren, title: 'Sin datos en una emergencia', text: 'Ante un golpe o una descompensación, nadie sabe el grupo sanguíneo ni a quién llamar.' },
  { icon: ScrollText, title: 'Responsabilidad del club', text: 'Si pasa algo, el club no puede demostrar que el apto era real y estaba vigente.' },
]

const steps = [
  { icon: Stethoscope, title: 'El médico emite el apto', text: 'Completa la ficha y firma. La huella de la ficha queda registrada en Hedera y en un contrato de Stellar.' },
  { icon: QrCode, title: 'El atleta lleva su credencial', text: 'Una tarjeta digital con QR en el celular. Sin papeles.' },
  { icon: ShieldCheck, title: 'El árbitro valida en segundos', text: 'Escanea el QR: verde si está vigente, con link a la prueba pública.' },
  { icon: HeartPulse, title: 'Emergencia en un toque', text: 'Grupo sanguíneo, alergias y contacto de emergencia al instante.' },
]

export default function Page() {
  return (
    <main className="min-h-screen bg-white text-slate-900">
      <div className="bg-[#f3f8f5]">
        <SiteHeader />
        <section className="mx-auto max-w-5xl px-5 pb-16 pt-8 sm:pt-16">
          <p className="text-xs font-bold uppercase tracking-widest text-emerald-700">Pasaporte médico deportivo verificable</p>
          <h1 className="mt-4 max-w-3xl text-4xl font-semibold leading-tight tracking-tight text-[#0f3d2e] sm:text-6xl">
            El apto médico que se verifica en la cancha, no en una fotocopia.
          </h1>
          <p className="mt-5 max-w-xl text-lg text-slate-600">
            VitalPass conecta al médico, al club y al árbitro con un registro que ninguno de ellos puede alterar por su cuenta.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <a href="/medico" className="flex h-12 items-center justify-center gap-2 rounded-full bg-[#0f3d2e] px-6 font-semibold text-white">
              Soy médico: emitir apto <ArrowRight aria-hidden="true" className="size-4" />
            </a>
            <a href="/validar" className="flex h-12 items-center justify-center gap-2 rounded-full border border-[#0f3d2e] px-6 font-semibold text-[#0f3d2e]">
              Soy árbitro: validar <ArrowRight aria-hidden="true" className="size-4" />
            </a>
          </div>
        </section>
      </div>

      <section className="mx-auto max-w-5xl px-5 py-16">
        <h2 className="text-sm font-bold uppercase tracking-widest text-emerald-700">El problema</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {problems.map(({ icon: Icon, title, text }) => (
            <article key={title} className="rounded-3xl border border-slate-200 p-6">
              <Icon aria-hidden="true" className="size-6 text-amber-600" />
              <h3 className="mt-4 text-lg font-semibold text-[#0f3d2e]">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="bg-[#f3f8f5]">
        <div className="mx-auto max-w-5xl px-5 py-16">
          <h2 className="text-sm font-bold uppercase tracking-widest text-emerald-700">Cómo funciona</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-4">
            {steps.map(({ icon: Icon, title, text }, index) => (
              <article key={title} className="rounded-3xl bg-white p-6">
                <Icon aria-hidden="true" className="size-6 text-emerald-700" />
                <p className="mt-4 text-xs font-bold text-emerald-700">0{index + 1}</p>
                <h3 className="mt-1 font-semibold text-[#0f3d2e]">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{text}</p>
              </article>
            ))}
          </div>
          <div className="mt-10 rounded-3xl bg-white p-6 text-sm leading-6 text-slate-700">
            <h3 className="font-semibold text-[#0f3d2e]">¿Y los datos de salud?</h3>
            <p className="mt-2">
              Nunca van a la blockchain. Ahí solo viaja una huella (hash SHA-256) de la ficha y del DNI: sirve para comprobar que nada se cambió, pero no permite leer los datos.
              La ficha completa queda en una base de datos privada.
            </p>
          </div>
        </div>
      </section>

      <footer className="py-8">
        <TestnetNotice />
      </footer>
    </main>
  )
}
