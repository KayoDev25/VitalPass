// Ayuda para leer y escribir el archivo .env.local (donde van las claves).
import { existsSync, readFileSync, writeFileSync } from 'node:fs'

export const ENV_FILE = '.env.local'

export function loadEnv() {
  if (!existsSync(ENV_FILE)) {
    console.error(`\n❌ No encontré el archivo ${ENV_FILE}. Copiá .env.example como .env.local y completalo.\n`)
    process.exit(1)
  }
  process.loadEnvFile(ENV_FILE)
}

// Agrega o reemplaza una línea CLAVE=valor en .env.local
export function setEnv(key, value) {
  const text = existsSync(ENV_FILE) ? readFileSync(ENV_FILE, 'utf8') : ''
  const lines = text.split(/\r?\n/)
  const index = lines.findIndex((line) => line.startsWith(`${key}=`))
  if (index >= 0) lines[index] = `${key}=${value}`
  else lines.push(`${key}=${value}`)
  writeFileSync(ENV_FILE, lines.join('\n').replace(/\n*$/, '\n'))
  process.env[key] = value
}
