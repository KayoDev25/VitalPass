import {
  Address,
  BASE_FEE,
  Contract,
  Keypair,
  Networks,
  TransactionBuilder,
  nativeToScVal,
  rpc,
  scValToNative,
  xdr,
} from '@stellar/stellar-sdk'
import type { StellarCheck } from '@/lib/types'

const RPC_URL = process.env.STELLAR_RPC_URL || 'https://soroban-testnet.stellar.org'

function config() {
  const secret = process.env.STELLAR_SECRET_KEY
  const contractId = process.env.STELLAR_CONTRACT_ID
  if (!secret || !contractId) throw new Error('Faltan STELLAR_SECRET_KEY y STELLAR_CONTRACT_ID (corré "pnpm stellar:setup").')
  return { keypair: Keypair.fromSecret(secret), contractId, server: new rpc.Server(RPC_URL) }
}

const bytes32 = (hex: string) => xdr.ScVal.scvBytes(Buffer.from(hex, 'hex'))

async function waitForTransaction(server: rpc.Server, hash: string) {
  for (let i = 0; i < 30; i++) {
    const result = await server.getTransaction(hash)
    if (String(result.status) === 'SUCCESS') return result
    if (String(result.status) === 'FAILED') throw new Error(`La transacción de Stellar falló (${hash}).`)
    await new Promise((resolve) => setTimeout(resolve, 1000))
  }
  throw new Error('Stellar tardó demasiado en confirmar la transacción.')
}

// Llama a la función "register" del contrato: guarda el apto en la blockchain de Stellar.
export async function registerOnStellar(input: {
  athleteIdHash: string
  recordHash: string
  medicLicense: string
  apto: boolean
  validUntilSeconds: number
}) {
  const { keypair, contractId, server } = config()
  const account = await server.getAccount(keypair.publicKey())

  const operation = new Contract(contractId).call(
    'register',
    new Address(keypair.publicKey()).toScVal(),
    bytes32(input.athleteIdHash),
    bytes32(input.recordHash),
    nativeToScVal(input.medicLicense, { type: 'string' }),
    xdr.ScVal.scvBool(input.apto),
    nativeToScVal(BigInt(input.validUntilSeconds), { type: 'u64' }),
  )

  const built = new TransactionBuilder(account, { fee: BASE_FEE, networkPassphrase: Networks.TESTNET })
    .addOperation(operation)
    .setTimeout(60)
    .build()

  // "prepare" simula la transacción y le agrega el costo y los permisos que necesita.
  const prepared = await server.prepareTransaction(built)
  prepared.sign(keypair)

  const sent = await server.sendTransaction(prepared)
  if (sent.status === 'ERROR') throw new Error('Stellar rechazó la transacción.')
  await waitForTransaction(server, sent.hash)
  return { hash: sent.hash, contractId }
}

// Consulta (sin gastar nada) qué dice el contrato sobre un atleta.
export async function readFromStellar(athleteIdHash: string, expectedRecordHash: string): Promise<StellarCheck> {
  try {
    const { keypair, contractId, server } = config()
    const account = await server.getAccount(keypair.publicKey())
    const tx = new TransactionBuilder(account, { fee: BASE_FEE, networkPassphrase: Networks.TESTNET })
      .addOperation(new Contract(contractId).call('get', bytes32(athleteIdHash)))
      .setTimeout(30)
      .build()

    const sim = await server.simulateTransaction(tx)
    if (!rpc.Api.isSimulationSuccess(sim) || !sim.result) {
      return { status: 'unavailable', reason: 'No se pudo consultar el contrato.' }
    }
    const value = scValToNative(sim.result.retval) as null | {
      record_hash: Buffer | Uint8Array
      medic_license: string
      apto: boolean
      valid_until: bigint | number
    }
    if (!value) return { status: 'not_found' }

    const validUntil = Number(value.valid_until)
    const onChainHash = Buffer.from(value.record_hash).toString('hex')
    return {
      status: 'ok',
      recordHashMatches: onChainHash === expectedRecordHash,
      valid: value.apto && Date.now() / 1000 <= validUntil,
      validUntil,
      medicLicense: String(value.medic_license),
    }
  } catch (error) {
    return { status: 'unavailable', reason: error instanceof Error ? error.message : 'Error desconocido' }
  }
}
