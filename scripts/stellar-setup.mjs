// Prepara todo lo de Stellar testnet:
//   1) Si no hay cuenta, crea una nueva y la carga con XLM de prueba (Friendbot).
//      La clave secreta se guarda SOLA en .env.local: no hace falta copiarla a mano.
//   2) Sube el contrato compilado (contracts/apto_registry.wasm) y lo despliega.
// Uso: pnpm stellar:setup
import { createHash, randomBytes } from 'node:crypto'
import { existsSync, readFileSync } from 'node:fs'
import { Address, BASE_FEE, Keypair, Networks, Operation, TransactionBuilder, rpc } from '@stellar/stellar-sdk'
import { ENV_FILE, setEnv } from './env-file.mjs'

if (existsSync(ENV_FILE)) process.loadEnvFile(ENV_FILE)
const RPC_URL = process.env.STELLAR_RPC_URL || 'https://soroban-testnet.stellar.org'
const WASM = 'contracts/apto_registry.wasm'
const server = new rpc.Server(RPC_URL)

async function submit(keypair, operation, label) {
  const account = await server.getAccount(keypair.publicKey())
  const built = new TransactionBuilder(account, { fee: BASE_FEE, networkPassphrase: Networks.TESTNET })
    .addOperation(operation)
    .setTimeout(60)
    .build()
  const prepared = await server.prepareTransaction(built)
  prepared.sign(keypair)
  const sent = await server.sendTransaction(prepared)
  if (sent.status === 'ERROR') throw new Error(`${label}: Stellar rechazó la transacción`)
  for (let i = 0; i < 30; i++) {
    const result = await server.getTransaction(sent.hash)
    if (String(result.status) === 'SUCCESS') {
      console.log(`✅ ${label}: https://stellar.expert/explorer/testnet/tx/${sent.hash}`)
      return result
    }
    if (String(result.status) === 'FAILED') throw new Error(`${label}: la transacción falló (${sent.hash})`)
    await new Promise((r) => setTimeout(r, 1000))
  }
  throw new Error(`${label}: Stellar tardó demasiado`)
}

try {
  // 1) Cuenta
  let secret = process.env.STELLAR_SECRET_KEY
  if (!secret) {
    const keypair = Keypair.random()
    console.log('Creando cuenta nueva en Stellar testnet…')
    const response = await fetch(`https://friendbot.stellar.org?addr=${keypair.publicKey()}`)
    if (!response.ok) throw new Error(`Friendbot respondió ${response.status}. Probá de nuevo en un minuto.`)
    secret = keypair.secret()
    setEnv('STELLAR_SECRET_KEY', secret)
    setEnv('STELLAR_PUBLIC_KEY', keypair.publicKey())
    console.log('✅ Cuenta creada y cargada con XLM de prueba (clave guardada en .env.local)')
  }
  const keypair = Keypair.fromSecret(secret)
  console.log(`   Cuenta: ${keypair.publicKey()}   https://stellar.expert/explorer/testnet/account/${keypair.publicKey()}`)

  // 2) Contrato
  if (process.env.STELLAR_CONTRACT_ID) {
    console.log(`\nYa hay un contrato en .env.local: ${process.env.STELLAR_CONTRACT_ID}`)
    console.log('Si querés desplegar uno nuevo, borrá la línea STELLAR_CONTRACT_ID de .env.local y corré de nuevo.\n')
    process.exit(0)
  }
  if (!existsSync(WASM)) throw new Error(`No encuentro ${WASM}. Hacé "git pull" para traer el contrato compilado por GitHub.`)
  const wasm = readFileSync(WASM)

  console.log('\nSubiendo el código del contrato…')
  await submit(keypair, Operation.uploadContractWasm({ wasm }), 'Subida del código')

  console.log('Creando el contrato…')
  const wasmHash = createHash('sha256').update(wasm).digest()
  const result = await submit(
    keypair,
    Operation.createCustomContract({ address: new Address(keypair.publicKey()), wasmHash, salt: randomBytes(32) }),
    'Despliegue del contrato',
  )
  const contractId = Address.fromScVal(result.returnValue).toString()
  setEnv('STELLAR_CONTRACT_ID', contractId)

  console.log('\n✅ Listo. Copiá estos datos para el README:')
  console.log(`   Contrato: ${contractId}`)
  console.log(`             https://stellar.expert/explorer/testnet/contract/${contractId}\n`)
} catch (error) {
  console.error('\n❌ Error con Stellar:', error?.message ?? error, '\n')
  process.exitCode = 1
}
