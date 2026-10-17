# VitalPass — Pasaporte médico deportivo verificable

Ideathon **NEA Tech 2026** (Corrientes) · Tracks **Stellar** y **Hedera**

> El apto médico que se verifica en la cancha, no en una fotocopia.

- **Demo:** `vital-sport.vercel.app`
- **Video (≤ 5 min):** `PENDIENTE`
- **Pitch deck (PDF):** `PENDIENTE`
- **Evidencia de validación:** [`docs/validacion.md`](docs/validacion.md)

---

## 1. Problema

En las ligas formativas y amateurs, el apto médico se presenta en papel o fotocopia. En la cancha, el árbitro o el profe no tiene forma de comprobar que el apto es real, de quién es y si está vigente. Si hay una emergencia (golpe en la cabeza, descompensación), nadie tiene a mano el grupo sanguíneo, las alergias ni un contacto.

| Dato | Estado |
|---|---|
| Cantidad de atletas y clubes en el NEA | **SUPUESTO** — falta fuente |
| Porcentaje que compite con apto vencido o falso | **SUPUESTO** — falta fuente |
| Testimonios de clubes, árbitros y médicos | ver [`docs/validacion.md`](docs/validacion.md) |

## 2. Solución

1. **El médico emite el apto** (`/medico`): completa la ficha y firma. La app calcula la *huella* (hash SHA-256) de la ficha y del DNI, y la registra en Hedera y en un contrato de Stellar.
2. **El atleta lleva su credencial** (`/credencial/[código]`): una tarjeta digital con QR.
3. **El árbitro valida en segundos** (`/validar`): escanea el QR con la cámara del celular. Ve verde o rojo, con links a la prueba pública y una **consulta en vivo al contrato de Stellar**.
4. **Botón de emergencia**: muestra grupo sanguíneo, alergias y un botón para llamar al contacto o al 107.

## 3. ¿Por qué blockchain y no una base de datos común?

- Participan **varias partes que no confían entre sí**: médico, club, liga, árbitro y familia. Si el registro estuviera en la base de datos del club, el club podría modificarlo, y justamente es el club el que tiene interés en que el atleta juegue.
- Hace falta un **registro que nadie pueda editar después**, ni siquiera nosotros. Ante un accidente o un juicio, se puede demostrar qué médico firmó, qué firmó y cuándo.
- **Hedera (HCS)** guarda el historial de auditoría: cada apto emitido, en orden y con fecha y hora de consenso.
- **Stellar (contrato Soroban)** guarda el estado actual del apto de cada atleta. Sobre ese estado el contrato aplica una regla propia: si el apto está vencido, la consulta devuelve "no válido".
- **Privacidad:** los datos de salud **nunca** van a la blockchain. Ahí solo viajan huellas, la matrícula del médico, el dictamen y la fecha de vencimiento.

## 4. Evidencia en testnet

### Stellar
| Qué | Valor |
|---|---|
| Contrato (ID) | [`CDR7UT2BBRDDOJFM2ZU2S6RCQVGXEATWHGXXPNBRTSWNORJB6K5JQ3IG`](https://stellar.expert/explorer/testnet/contract/CDR7UT2BBRDDOJFM2ZU2S6RCQVGXEATWHGXXPNBRTSWNORJB6K5JQ3IG) |
| Cuenta emisora | [`GA6UR7AOXNUD6XACPGSMAU5HD4EIS3G5M6WS5PLRFMYLS77W3GWSTKSR`](https://stellar.expert/explorer/testnet/account/GA6UR7AOXNUD6XACPGSMAU5HD4EIS3G5M6WS5PLRFMYLS77W3GWSTKSR) |
| Transacción: subida del código del contrato | [`a9f81387…238d52`](https://stellar.expert/explorer/testnet/tx/a9f81387d707950aa058bda8ce7ef58cd4a9223b1e83168a4f851f86ae238d52) |
| Transacción: despliegue del contrato | [`a4601315…baf057`](https://stellar.expert/explorer/testnet/tx/a4601315f4009e854d0c509d699a284880a517d6afbb666d6a20b344c1baf057) |
| Transacción de registro de un apto (`register`) | `PENDIENTE` |

### Hedera
| Qué | Valor |
|---|---|
| Cuenta (operator) | [`0.0.10999895`](https://hashscan.io/testnet/account/0.0.10999895) |
| Topic HCS | [`0.0.11052106`](https://hashscan.io/testnet/topic/0.0.11052106) |
| Transacción (mensaje de inicialización del topic) | [`0.0.10999895@1792176018.485508778`](https://hashscan.io/testnet/transaction/0.0.10999895-1792176018-485508778) |
| Transacción de un apto emitido desde la app | `PENDIENTE` |

## 5. Herramientas usadas

- **Stellar:** contrato inteligente en **Soroban** escrito en **Rust** ([`contracts/apto-registry`](contracts/apto-registry)), **Stellar SDK** de **TypeScript** (`@stellar/stellar-sdk`) y **Stellar RPC** de testnet.
- **Hedera:** **Hedera Consensus Service (HCS)** con `@hashgraph/sdk` (`TopicCreateTransaction`, `TopicMessageSubmitTransaction`).
- **App:** Next.js 16, React 19, Tailwind CSS 4, Supabase (base de datos privada para las fichas), Vercel (publicación).
- **Compilación del contrato:** GitHub Actions ([`.github/workflows/contract.yml`](.github/workflows/contract.yml)).

## 6. Arquitectura

```
Médico ──> /api/emitir ──┬─> Hedera HCS: {hash ficha, hash DNI, matrícula, dictamen, vencimiento}
                         ├─> Contrato Stellar: register(emisor, hash DNI, hash ficha, matrícula, apto, vencimiento)
                         └─> Supabase (privado): ficha completa SIN el DNI
Árbitro ──> /validar?id= ──> /api/apto/[id] ──┬─> Supabase (datos para mostrar)
                                              └─> Contrato Stellar: get(hash DNI) en vivo -> ¿coincide la huella? ¿vigente?
```

Si una red falla durante la demo, el apto se guarda igual pero se muestra como **SIMULADO / no registrado**: nunca se muestra un link inventado. El atleta `VP-DEMO` es un ejemplo ficticio que funciona sin conexión a la base.

## 7. Instalación (local)

Requisitos: Node 22 o superior y pnpm.

```bash
git clone https://github.com/KayoDev25/VitalPass.git
cd VitalPass
pnpm install
cp .env.example .env.local      # en Windows PowerShell: Copy-Item .env.example .env.local
```

1. **Supabase:** creá un proyecto nuevo, pegá [`supabase/schema.sql`](supabase/schema.sql) en *SQL Editor* y ejecutalo. Después copiá `SUPABASE_URL` y la clave secreta en `.env.local`.
2. **Hedera:** creá una cuenta de testnet en [portal.hedera.com](https://portal.hedera.com) y completá `HEDERA_OPERATOR_ID` y `HEDERA_OPERATOR_KEY`. Después corré `pnpm hedera:setup`, que crea el topic.
3. **Stellar:** corré `pnpm stellar:setup`. Crea una cuenta de testnet con Friendbot y despliega el contrato `contracts/apto_registry.wasm`.
4. Corré `pnpm dev` y abrí http://localhost:3000.

## 8. Despliegue

En Vercel: importá el repositorio, cargá las mismas variables de `.env.local` en *Settings > Environment Variables* y desplegá.

## 9. Testing

- **Contrato:** `cargo test` dentro de `contracts/apto-registry`. Lo corre también GitHub Actions en cada cambio.
- **Prueba manual de punta a punta:** emitir un apto en `/medico`, abrir la credencial, escanear el QR, verificar en `/validar` y abrir los links de HashScan y Stellar Expert.

## 10. Qué existía antes y qué se hizo en la hackathon

- **Antes:** una plantilla propia de Next.js + Tailwind + shadcn + Supabase, tomada de un proyecto personal anterior (otra temática). Se reutilizó solo la estructura técnica.
- **Nombre:** el proyecto empezó como "VitalSport ID" y se renombró a **VitalPass**. Por eso el memo del topic de Hedera, el primer mensaje y el comentario del contrato todavía dicen "VitalSport" (lo que está en la blockchain no se puede editar).
- **Durante la hackathon (15–16/10):** todo lo de VitalPass: contrato Soroban, integración con Hedera HCS y Stellar, pantallas de emisión, credencial y validador, esquema de base de datos y documentación.

## 11. Uso de inteligencia artificial

Usamos asistentes de IA (Claude, de Anthropic) para escribir y revisar código, documentación y textos. Las decisiones de producto, la validación con usuarios y las pruebas fueron hechas por el equipo.

## 12. Limitaciones y próximos pasos

- El portal médico no tiene login en esta demo. Próximo paso: verificar la matrícula del médico contra el colegio médico y que cada médico firme con su propia cuenta.
- La ficha de emergencia se ve con el código del QR. Próximo paso: acceso por rol (árbitro, servicio médico).
- Piloto con una liga local (`PENDIENTE` según validación).

## Equipo

`PENDIENTE`
