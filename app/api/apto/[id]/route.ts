import { NextResponse } from 'next/server'
import { MISSING_SUPABASE, supabaseAdmin } from '@/lib/supabase'
import { readFromStellar } from '@/lib/stellar'
import { DEMO_ID, DEMO_RECORD, type AptoRecord, type AptoResponse } from '@/lib/types'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Devuelve un apto por su código (lo usan la credencial y el validador).
// Además consulta EN VIVO el contrato de Stellar para confirmar que coincide.
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const id = decodeURIComponent((await params).id).trim().toUpperCase()

  if (id === DEMO_ID) {
    const body: AptoResponse = { record: DEMO_RECORD, stellar: { status: 'unavailable', reason: 'Registro de demostración.' }, demo: true }
    return NextResponse.json(body)
  }

  if (!supabaseAdmin) return NextResponse.json({ error: MISSING_SUPABASE }, { status: 500 })

  const { data, error } = await supabaseAdmin.from('aptos').select('*').eq('id', id).maybeSingle()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!data) return NextResponse.json({ error: 'No existe un apto con ese código.' }, { status: 404 })

  const record = data as AptoRecord
  const stellar = record.stellar_tx
    ? await readFromStellar(record.athlete_id_hash, record.record_hash)
    : ({ status: 'unavailable', reason: 'Este apto no se registró en Stellar.' } as const)

  const body: AptoResponse = { record, stellar, demo: false }
  return NextResponse.json(body)
}
