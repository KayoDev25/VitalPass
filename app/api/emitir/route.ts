import { createHash } from 'node:crypto'
import { NextResponse } from 'next/server'
import { MISSING_SUPABASE, supabaseAdmin } from '@/lib/supabase'
import { publishToHedera } from '@/lib/hedera'
import { registerOnStellar } from '@/lib/stellar'

export const runtime = 'nodejs'
export const maxDuration = 60

const sha256 = (text: string) => createHash('sha256').update(text).digest('hex')

type Form = {
  athlete_name: string
  dni: string
  club: string
  blood_type: string
  allergies: string
  emergency_name: string
  emergency_phone: string
  blood_pressure: string
  apto: boolean
  medic_name: string
  medic_license: string
}

// El médico emite el apto:
// 1) calculamos las huellas (hashes) -> 2) Hedera -> 3) Stellar -> 4) guardamos en la base.
// Si una blockchain falla, el apto se guarda igual pero queda marcado como NO registrado
// en esa red (nunca mostramos un link falso).
export async function POST(request: Request) {
  if (!supabaseAdmin) return NextResponse.json({ error: MISSING_SUPABASE }, { status: 500 })

  const form = (await request.json()) as Form
  const required: (keyof Form)[] = ['athlete_name', 'dni', 'club', 'blood_type', 'emergency_name', 'emergency_phone', 'medic_name', 'medic_license']
  for (const field of required) {
    if (!String(form[field] ?? '').trim()) return NextResponse.json({ error: `Falta completar: ${field}` }, { status: 400 })
  }

  const issuedAt = new Date().toISOString()
  const validUntilDate = new Date()
  validUntilDate.setFullYear(validUntilDate.getFullYear() + 1)
  const validUntil = validUntilDate.toISOString().slice(0, 10)
  const validUntilSeconds = Math.floor(new Date(`${validUntil}T23:59:59-03:00`).getTime() / 1000)

  // Huella del DNI: identifica al atleta sin revelar su DNI.
  const athleteIdHash = sha256(`vitalsport:dni:${form.dni.replace(/\D/g, '')}`)
  // Huella de la ficha completa: si alguien cambia un solo dato, la huella ya no coincide.
  const ficha = { ...form, apto: Boolean(form.apto), issuedAt, validUntil }
  const recordHash = sha256(JSON.stringify(ficha, Object.keys(ficha).sort()))
  const id = `VP-${recordHash.slice(0, 8).toUpperCase()}`

  // 2) Hedera: registro de auditoría (quién firmó qué y cuándo).
  let hedera_tx: string | null = null
  let hedera_topic: string | null = null
  let hedera_error: string | null = null
  try {
    const result = await publishToHedera({
      app: 'VitalPass',
      v: 1,
      id,
      athleteIdHash,
      recordHash,
      medicLicense: form.medic_license,
      status: form.apto ? 'APTO' : 'NO_APTO',
      validUntil,
      issuedAt,
    })
    hedera_tx = result.transactionId
    hedera_topic = result.topicId
  } catch (error) {
    hedera_error = error instanceof Error ? error.message : 'Error desconocido en Hedera'
  }

  // 3) Stellar: el contrato guarda el estado que consulta el validador en cancha.
  let stellar_tx: string | null = null
  let stellar_contract: string | null = null
  let stellar_error: string | null = null
  try {
    const result = await registerOnStellar({
      athleteIdHash,
      recordHash,
      medicLicense: form.medic_license,
      apto: Boolean(form.apto),
      validUntilSeconds,
    })
    stellar_tx = result.hash
    stellar_contract = result.contractId
  } catch (error) {
    stellar_error = error instanceof Error ? error.message : 'Error desconocido en Stellar'
  }

  // 4) Base de datos (fuera de la blockchain): acá viven los datos personales y de salud.
  //    El DNI NO se guarda: solo su huella.
  const { error } = await supabaseAdmin.from('aptos').upsert({
    id,
    athlete_name: form.athlete_name.trim(),
    club: form.club.trim(),
    blood_type: form.blood_type,
    allergies: form.allergies?.trim() ?? '',
    emergency_name: form.emergency_name.trim(),
    emergency_phone: form.emergency_phone.trim(),
    blood_pressure: form.blood_pressure?.trim() ?? '',
    apto: Boolean(form.apto),
    medic_name: form.medic_name.trim(),
    medic_license: form.medic_license.trim(),
    valid_until: validUntil,
    athlete_id_hash: athleteIdHash,
    record_hash: recordHash,
    hedera_tx,
    hedera_topic,
    hedera_error,
    stellar_tx,
    stellar_contract,
    stellar_error,
  })
  if (error) return NextResponse.json({ error: `No se pudo guardar en la base: ${error.message}` }, { status: 500 })

  return NextResponse.json({ id, recordHash, athleteIdHash, hedera_tx, hedera_topic, hedera_error, stellar_tx, stellar_contract, stellar_error })
}
