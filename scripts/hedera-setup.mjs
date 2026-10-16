// Crea el "topic" (canal) de VitalPass en Hedera testnet y publica un primer mensaje.
// Uso: pnpm hedera:setup
// Necesita en .env.local: HEDERA_OPERATOR_ID y HEDERA_OPERATOR_KEY (de portal.hedera.com).
import { AccountId, Client, PrivateKey, TopicCreateTransaction, TopicMessageSubmitTransaction } from '@hashgraph/sdk'
import { loadEnv, setEnv } from './env-file.mjs'

loadEnv()
const id = process.env.HEDERA_OPERATOR_ID
const rawKey = process.env.HEDERA_OPERATOR_KEY?.trim().replace(/^0x/, '')
if (!id || !rawKey) {
  console.error('\n❌ Faltan HEDERA_OPERATOR_ID y/o HEDERA_OPERATOR_KEY en .env.local\n')
  process.exit(1)
}

const key =
  rawKey.length > 64
    ? PrivateKey.fromStringDer(rawKey)
    : process.env.HEDERA_KEY_TYPE?.toUpperCase() === 'ED25519'
      ? PrivateKey.fromStringED25519(rawKey)
      : PrivateKey.fromStringECDSA(rawKey)

const client = Client.forTestnet().setOperator(AccountId.fromString(id), key)

try {
  let topicId = process.env.HEDERA_TOPIC_ID
  if (!topicId) {
    console.log('Creando topic en Hedera testnet…')
    const tx = await new TopicCreateTransaction().setTopicMemo('VitalPass - aptos medicos deportivos').execute(client)
    const receipt = await tx.getReceipt(client)
    topicId = receipt.topicId.toString()
    setEnv('HEDERA_TOPIC_ID', topicId)
    console.log(`✅ Topic creado: ${topicId} (guardado en .env.local)`)
  } else {
    console.log(`Usando el topic que ya existe: ${topicId}`)
  }

  console.log('Publicando mensaje de prueba…')
  const msg = await new TopicMessageSubmitTransaction()
    .setTopicId(topicId)
    .setMessage(JSON.stringify({ app: 'VitalPass', v: 1, type: 'setup', at: new Date().toISOString() }))
    .execute(client)
  await msg.getReceipt(client)
  const txId = msg.transactionId.toString()
  const [account, time] = txId.split('@')

  console.log('\n✅ Listo. Copiá estos datos para el README:')
  console.log(`   Cuenta (operator):  ${id}   https://hashscan.io/testnet/account/${id}`)
  console.log(`   Topic:              ${topicId}   https://hashscan.io/testnet/topic/${topicId}`)
  console.log(`   Transacción:        ${txId}`)
  console.log(`                       https://hashscan.io/testnet/transaction/${account}-${time.replace('.', '-')}\n`)
} catch (error) {
  console.error('\n❌ Error con Hedera:', error?.message ?? error)
  console.error('   Si dice INVALID_SIGNATURE: copiá la clave "DER Encoded" del portal, o agregá HEDERA_KEY_TYPE=ED25519 si tu cuenta es ED25519.\n')
  process.exitCode = 1
} finally {
  client.close()
}
