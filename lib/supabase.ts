import { createClient } from '@supabase/supabase-js'

// Estas dos variables salen del archivo .env.local (en tu computadora)
// o de las "Environment Variables" de Vercel (cuando la página está publicada).
// Empiezan con NEXT_PUBLIC_ porque la página las necesita en el navegador.
// La clave "anon" es pública a propósito: lo que puede hacer lo limitan
// los permisos que definimos en supabase/schema.sql.
const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export const supabase = url && key ? createClient(url, key) : null

export const MISSING_CONFIG_MESSAGE =
  'Falta conectar Supabase. Revisá que exista el archivo .env.local con NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY, y reiniciá "pnpm dev".'
