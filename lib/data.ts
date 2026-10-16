import { supabase, MISSING_CONFIG_MESSAGE } from '@/lib/supabase'

// ---------------------------------------------------------------
// Tipos: describen cómo es cada fila de las tablas (ver supabase/schema.sql)
// ---------------------------------------------------------------

export type Student = {
  id: string
  name: string
  career: string
  institution: string
}

export type Credential = {
  id: string
  code: string
  issuer: string
  issued_at: string // fecha, formato AAAA-MM-DD
  verified_at: string | null // null = todavía nadie la verificó
  hedera_tx: string | null // ID de la transacción en Hedera (se completa más adelante)
}

export type Scholarship = {
  id: string
  name: string
  entity: string
  deadline: string // fecha, formato AAAA-MM-DD
}

export type CredentialWithStudent = Credential & { student: Student }

export type Application = {
  id: string
  scholarshipName: string
  student: Student
  credential: Credential | null
}

export type Contribution = {
  id: string
  amount: number
  status: string
  stellar_tx: string | null // hash de la transacción en Stellar (se completa más adelante)
  created_at: string
  studentName: string
}

// Estudiante que usa la demo en /estudiante (no hay login todavía).
export const DEMO_STUDENT_ID = '00000000-0000-0000-0000-000000000001'

// ---------------------------------------------------------------
// Utilidades
// ---------------------------------------------------------------

function getDb() {
  if (!supabase) throw new Error(MISSING_CONFIG_MESSAGE)
  return supabase
}

// Cuando una tabla se une con otra, Supabase puede devolver un objeto o una lista.
// Esta función nos deja siempre con "el primero" (o null si no hay).
function first<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) return value[0] ?? null
  return value ?? null
}

// "2026-03-12" -> "12 de marzo de 2026"
export function formatDateOnly(date: string) {
  return new Date(`${date}T00:00:00`).toLocaleDateString('es-AR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

// Fecha y hora guardadas por Supabase -> "16/10/2026"
export function formatTimestamp(timestamp: string) {
  return new Date(timestamp).toLocaleDateString('es-AR')
}

// Enlaces a los exploradores públicos (testnet). Solo se usan si hay un ID guardado.
export const hashscanUrl = (transactionId: string) => `https://hashscan.io/testnet/transaction/${transactionId}`
export const stellarExpertUrl = (hash: string) => `https://stellar.expert/explorer/testnet/tx/${hash}`

// ---------------------------------------------------------------
// Lecturas
// ---------------------------------------------------------------

type CredentialRow = Credential & { students: Student | Student[] | null }

// Busca una credencial por su código (lo usa /verificar).
export async function getCredentialByCode(code: string): Promise<CredentialWithStudent | null> {
  const { data, error } = await getDb()
    .from('credentials')
    .select('id, code, issuer, issued_at, verified_at, hedera_tx, students(id, name, career, institution)')
    .eq('code', code)
    .maybeSingle()

  if (error) throw new Error(error.message)
  const row = data as unknown as CredentialRow | null
  const student = first(row?.students)
  if (!row || !student) return null

  const { students: _students, ...credential } = row
  return { ...credential, student }
}

type StudentRow = Student & { credentials: Credential | Credential[] | null }

// Estudiante de la demo con su credencial (lo usa /estudiante).
export async function getDemoStudent(): Promise<{ student: Student; credential: Credential | null } | null> {
  const { data, error } = await getDb()
    .from('students')
    .select('id, name, career, institution, credentials(id, code, issuer, issued_at, verified_at, hedera_tx)')
    .eq('id', DEMO_STUDENT_ID)
    .maybeSingle()

  if (error) throw new Error(error.message)
  const row = data as unknown as StudentRow | null
  if (!row) return null

  const { credentials, ...student } = row
  return { student, credential: first(credentials) }
}

// Becas disponibles, las que cierran antes primero.
export async function getScholarships(): Promise<Scholarship[]> {
  const { data, error } = await getDb()
    .from('scholarships')
    .select('id, name, entity, deadline')
    .order('deadline', { ascending: true })

  if (error) throw new Error(error.message)
  return (data ?? []) as unknown as Scholarship[]
}

type ApplicationRow = {
  id: string
  scholarships: { name: string } | { name: string }[] | null
  students: (Student & { credentials: Credential | Credential[] | null }) | (Student & { credentials: Credential | Credential[] | null })[] | null
}

// Postulaciones con estudiante y credencial (lo usa /empresa).
export async function getApplications(): Promise<Application[]> {
  const { data, error } = await getDb()
    .from('applications')
    .select(
      'id, scholarships(name), students(id, name, career, institution, credentials(id, code, issuer, issued_at, verified_at, hedera_tx))',
    )
    .order('created_at', { ascending: true })

  if (error) throw new Error(error.message)

  const rows = (data ?? []) as unknown as ApplicationRow[]
  const applications: Application[] = []
  for (const row of rows) {
    const studentRow = first(row.students)
    if (!studentRow) continue
    const { credentials, ...student } = studentRow
    applications.push({
      id: row.id,
      scholarshipName: first(row.scholarships)?.name ?? 'Beca',
      student,
      credential: first(credentials),
    })
  }
  return applications
}

type ContributionRow = Omit<Contribution, 'studentName'> & { students: { name: string } | { name: string }[] | null }

// Aportes realizados, el más nuevo primero (lo usa /empresa).
export async function getContributions(): Promise<Contribution[]> {
  const { data, error } = await getDb()
    .from('contributions')
    .select('id, amount, status, stellar_tx, created_at, students(name)')
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)

  const rows = (data ?? []) as unknown as ContributionRow[]
  return rows.map(({ students, ...contribution }) => ({
    ...contribution,
    amount: Number(contribution.amount),
    studentName: first(students)?.name ?? 'Estudiante',
  }))
}

// ---------------------------------------------------------------
// Escrituras
// ---------------------------------------------------------------

// La empresa marca una credencial como verificada.
export async function verifyCredential(credentialId: string): Promise<void> {
  const { data, error } = await getDb()
    .from('credentials')
    .update({ verified_at: new Date().toISOString() })
    .eq('id', credentialId)
    .select('id')

  if (error) throw new Error(error.message)
  if (!data || data.length === 0) throw new Error('No se pudo verificar la credencial.')
}

// La empresa registra un aporte. Por ahora queda como "simulado".
// Más adelante acá se hace el pago real en Stellar y se guarda el hash.
export async function addContribution(studentId: string, amount: number): Promise<void> {
  const { error } = await getDb()
    .from('contributions')
    .insert({ student_id: studentId, amount, status: 'simulado' })

  if (error) throw new Error(error.message)
}
