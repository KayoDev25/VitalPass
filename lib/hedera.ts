import { AccountId, Client, PrivateKey, TopicId, TopicMessageSubmitTransaction } from '@hashgraph/sdk'

// Lee la clave privada de Hedera tal como la da portal.hedera.com.
// - "DER Encoded" (larga, empieza con 30...) -> funciona siempre.
// - "HEX Encoded" (64 caracteres) -> asumimos ECDSA, salvo que HEDERA_KEY_TYPE=ED25519.
export function parseHederaKey(raw: string) {
  const key = raw.trim().replace(/^0x/, '')
  if (key.length > 64) return PrivateKey.fromStringDer(key)
  if (process.env.HEDERA_KEY_TYPE?.toUpperCase() === 'ED25519') return PrivateKey.fromStringED25519(key)
  return PrivateKey.fromStringECDSA(key)
}

export function hederaClient() {
  const id = process.env.HEDERA_OPERATOR_ID
  const key = process.env.HEDERA_OPERATOR_KEY
  if (!id || !key) throw new Error('Faltan HEDERA_OPERATOR_ID y HEDERA_OPERATOR_KEY.')
  return Client.forTestnet().setOperator(AccountId.fromString(id), parseHederaKey(key))
}

// Publica un mensaje en el "topic" (canal) de VitalSport en Hedera Consensus Service.
// El mensaje queda ordenado, con fecha y hora de consenso, y nadie lo puede borrar ni editar.
export async function publishToHedera(message: Record<string, unknown>) {
  const topic = process.env.HEDERA_TOPIC_ID
  if (!topic) throw new Error('Falta HEDERA_TOPIC_ID (corré "pnpm hedera:setup").')

  const client = hederaClient()
  try {
    const response = await new TopicMessageSubmitTransaction()
      .setTopicId(TopicId.fromString(topic))
      .setMessage(JSON.stringify(message))
      .execute(client)
    await response.getReceipt(client) // espera la confirmación de la red
    return { transactionId: response.transactionId.toString(), topicId: topic }
  } finally {
    client.close()
  }
}
