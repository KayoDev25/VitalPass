import { createClient } from '@supabase/supabase-js'

// Esta conexión SOLO se usa en el servidor (carpeta app/api).
// Usa la clave "service_role" / "secret", que puede leer y escribir todo:
// por eso NO lleva NEXT_PUBLIC_ adelante (así nunca llega al navegador).
// Los datos de salud quedan protegidos: la clave pública no tiene ningún permiso
// sobre la tabla (ver supabase/schema.sql).
const url = process.env.SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY

export const supabaseAdmin = url && key ? createClient(url, key, { auth: { persistSession: false } }) : null

export const MISSING_SUPABASE =
  'Falta conectar Supabase: revisá SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en .env.local (o en Vercel) y reiniciá "pnpm dev".'
