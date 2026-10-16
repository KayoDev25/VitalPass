// Forma de un apto guardado en la base (tabla "aptos" en supabase/schema.sql).
export type AptoRecord = {
  id: string // código corto que va en el QR, ej: VS-1A2B3C4D
  athlete_name: string
  club: string
  blood_type: string
  allergies: string
  emergency_name: string
  emergency_phone: string
  blood_pressure: string
  apto: boolean
  medic_name: string
  medic_license: string
  valid_until: string // AAAA-MM-DD
  athlete_id_hash: string // SHA-256 del DNI (el DNI NO se guarda)
  record_hash: string // SHA-256 de la ficha completa
  hedera_tx: string | null
  hedera_topic: string | null
  hedera_error: string | null
  stellar_tx: string | null
  stellar_contract: string | null
  stellar_error: string | null
  created_at: string
}

// Lo que el contrato de Stellar responde cuando lo consultamos en vivo.
export type StellarCheck =
  | { status: 'ok'; recordHashMatches: boolean; valid: boolean; validUntil: number; medicLicense: string }
  | { status: 'not_found' }
  | { status: 'unavailable'; reason: string }

export type AptoResponse = { record: AptoRecord; stellar: StellarCheck; demo: boolean }

// Enlaces a los exploradores públicos de testnet.
export const links = {
  hederaTx: (txId: string) => {
    // "0.0.123@1700000000.123456789" -> "0.0.123-1700000000-123456789" (formato que usa HashScan)
    const [account, time] = txId.split('@')
    const mirrorId = time ? `${account}-${time.replace('.', '-')}` : txId
    return `https://hashscan.io/testnet/transaction/${mirrorId}`
  },
  hederaTopic: (topicId: string) => `https://hashscan.io/testnet/topic/${topicId}`,
  stellarTx: (hash: string) => `https://stellar.expert/explorer/testnet/tx/${hash}`,
  stellarContract: (id: string) => `https://stellar.expert/explorer/testnet/contract/${id}`,
}

// Atleta de ejemplo para que la demo funcione aunque falle internet o la base.
// Es 100% inventado y se muestra marcado como DATO SIMULADO.
export const DEMO_ID = 'VS-DEMO'
export const DEMO_RECORD: AptoRecord = {
  id: DEMO_ID,
  athlete_name: 'Lucía Fernández (ficticia)',
  club: 'Club Atlético Ejemplo',
  blood_type: '0+',
  allergies: 'Penicilina',
  emergency_name: 'Marta Fernández (madre)',
  emergency_phone: '+5493790000000',
  blood_pressure: '110/70',
  apto: true,
  medic_name: 'Dra. Ana Ejemplo',
  medic_license: 'MP-0000',
  valid_until: '2027-10-16',
  athlete_id_hash: '0'.repeat(64),
  record_hash: '0'.repeat(64),
  hedera_tx: null,
  hedera_topic: null,
  hedera_error: 'Registro de demostración: no se envió a la blockchain.',
  stellar_tx: null,
  stellar_contract: null,
  stellar_error: 'Registro de demostración: no se envió a la blockchain.',
  created_at: '2026-10-16T12:00:00.000Z',
}

// "2027-10-16" -> "16 de octubre de 2027"
export function formatDate(date: string) {
  return new Date(`${date}T12:00:00`).toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' })
}

export function isExpired(validUntil: string) {
  return new Date(`${validUntil}T23:59:59-03:00`).getTime() < Date.now()
}
