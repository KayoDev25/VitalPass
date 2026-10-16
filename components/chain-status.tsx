import { CheckCircle2, CircleAlert, ExternalLink } from 'lucide-react'
import { links, type AptoRecord } from '@/lib/types'

// Muestra si el apto quedó registrado en cada blockchain, con link al explorador.
// Si NO se registró, lo dice claramente (nunca mostramos un link inventado).
export function ChainStatus({ record }: { record: AptoRecord }) {
  return (
    <ul className="grid gap-3 text-sm">
      <li className="rounded-2xl border border-slate-200 bg-white p-4">
        {record.hedera_tx ? (
          <div className="flex items-start gap-2">
            <CheckCircle2 aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-emerald-600" />
            <div className="min-w-0">
              <p className="font-semibold text-slate-900">Registrado en Hedera (HCS)</p>
              <p className="mt-1 break-all font-mono text-xs text-slate-500">{record.hedera_tx}</p>
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
                <a className="inline-flex items-center gap-1 font-semibold text-[#13704f] underline" href={links.hederaTx(record.hedera_tx)} target="_blank" rel="noreferrer">
                  Ver en HashScan <ExternalLink aria-hidden="true" className="size-3.5" />
                </a>
                {record.hedera_topic && (
                  <a className="inline-flex items-center gap-1 text-[#13704f] underline" href={links.hederaTopic(record.hedera_topic)} target="_blank" rel="noreferrer">
                    Topic {record.hedera_topic} <ExternalLink aria-hidden="true" className="size-3.5" />
                  </a>
                )}
              </div>
            </div>
          </div>
        ) : (
          <NotRegistered network="Hedera" reason={record.hedera_error} />
        )}
      </li>
      <li className="rounded-2xl border border-slate-200 bg-white p-4">
        {record.stellar_tx ? (
          <div className="flex items-start gap-2">
            <CheckCircle2 aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-emerald-600" />
            <div className="min-w-0">
              <p className="font-semibold text-slate-900">Registrado en el contrato de Stellar (Soroban)</p>
              <p className="mt-1 break-all font-mono text-xs text-slate-500">{record.stellar_tx}</p>
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
                <a className="inline-flex items-center gap-1 font-semibold text-[#13704f] underline" href={links.stellarTx(record.stellar_tx)} target="_blank" rel="noreferrer">
                  Ver en Stellar Expert <ExternalLink aria-hidden="true" className="size-3.5" />
                </a>
                {record.stellar_contract && (
                  <a className="inline-flex items-center gap-1 text-[#13704f] underline" href={links.stellarContract(record.stellar_contract)} target="_blank" rel="noreferrer">
                    Ver contrato <ExternalLink aria-hidden="true" className="size-3.5" />
                  </a>
                )}
              </div>
            </div>
          </div>
        ) : (
          <NotRegistered network="Stellar" reason={record.stellar_error} />
        )}
      </li>
    </ul>
  )
}

function NotRegistered({ network, reason }: { network: string; reason: string | null }) {
  return (
    <div className="flex items-start gap-2">
      <CircleAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-amber-600" />
      <div>
        <p className="font-semibold text-slate-900">
          No registrado en {network} <span className="ml-1 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold uppercase text-amber-800">Simulado</span>
        </p>
        {reason && <p className="mt-1 text-xs text-slate-500">{reason}</p>}
      </div>
    </div>
  )
}
