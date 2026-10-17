# VitalPass — Pasaporte médico deportivo verificable

Ideathon **NEA Tech 2026** (Corrientes) · Tracks **Stellar** y **Hedera**

> El apto médico que se verifica en la cancha, no en una fotocopia.

- **Demo:** https://vital-sport.vercel.app
- **Video (≤ 5 min):** en preparación
- **Pitch deck (PDF):** se entrega por separado en la plataforma de cada track
- **Evidencia de validación:** [`docs/validacion.md`](docs/validacion.md)

---

## 1. Problema

En las ligas formativas y amateurs, el apto médico se presenta en papel o fotocopia. En la cancha, el árbitro o el profe no tiene forma de comprobar que el apto es real, de quién es y si está vigente. Si hay una emergencia (golpe en la cabeza, descompensación), nadie tiene a mano el grupo sanguíneo, las alergias ni un contacto. Y cada vez que un jugador cambia de club, repite todos los trámites.

### Evidencia

**1. Los certificados falsos existen, a escala (caso Liga Mendocina de Fútbol).**
Una cardióloga denunció que usaban su firma y su sello en estudios que nunca hizo, y un peritaje caligráfico lo confirmó. Hay más de 900 documentos bajo sospecha, alrededor de 800 jugadores potencialmente afectados y al menos 112 planillas con firmas falsificadas. En allanamientos se encontraron certificados falsificados listos para usar ([Los Andes, 2/10/2025](https://www.losandes.com.ar/deportes/escandalo-la-liga-mendocina-peritajes-confirmaron-firmas-falsas-certificados-medicos-n5965005)). La empresa que emitía los aptos no estaba habilitada por el Ministerio de Salud provincial; prestó el servicio desde 2022 hasta mediados de 2025 e incluía a jugadores menores de edad ([Diario UNO, 18/2/2026](https://www.diariouno.com.ar/politica/certificados-truchos-la-liga-mendocina-la-empresa-que-los-aptos-fisicos-no-estaba-habilitada-n1527619)).

**2. El apto es obligatorio y su gestión se repite (entrevista propia).**
Un entrenador de rugby del Club San Patricio (Corrientes) nos confirmó que, sin los estudios que exige la Unión Argentina de Rugby (UAR), el jugador no puede ser habilitado en la planilla, y que **cada vez que un jugador cambia de club tiene que hacer todos los trámites de nuevo**. Detalle en [`docs/validacion.md`](docs/validacion.md).

**3. La evaluación previa casi nunca está documentada (registro de muerte súbita deportiva).**
El Registro Argentino de Muerte Súbita Asociada al Deporte (RAMSAD) relevó, en un análisis preliminar, 27 episodios entre noviembre de 2025 y junio de 2026: 20 fallecidos, todos durante o poco después del esfuerzo. El grupo más numeroso fueron los deportistas amateurs recreativos, y fútbol y running concentraron cerca del 62 % de los casos. **Solo en el 29,6 % de los casos estaba documentada una evaluación cardiovascular previa** ([Infobae, 24/8/2026](https://www.infobae.com/salud/ciencia/2026/08/24/que-dice-el-registro-argentino-que-asocia-la-muerte-subita-deportiva-con-el-esfuerzo-fisico/)). VitalPass no reemplaza al médico, pero hace que esa evaluación quede registrada y se pueda verificar.

**4. En cancha, se asume que los datos son verídicos.**
Hoy la comprobación del apto es parcial: se revisa si hay tiempo o después de una tragedia; en general se asume que lo cargado es cierto. En una emergencia, los datos de salud a veces están a mano y a veces no. A los clubes y ligas sí les preocupa la responsabilidad legal. **VitalPass apunta a que no haya que asumir nada.**

**5. El mercado es grande y mayormente no federado (ENAFYD 2023, UNSAM–UNaM).**
Según la [Encuesta Nacional sobre Actividad Física y Deportes 2023](https://edicionesfhycs.unam.edu.ar/wp-content/uploads/2025/05/ENAFYD-2023-VF-con-ISBN.pdf) (5.458 casos, margen de error del 4 %):
- En el NEA, el **45,7 %** de los encuestados hace actividad física o deporte de forma regular, y el fútbol tiene ahí la práctica más alta del país.
- A nivel nacional, el **37,7 %** de quienes practican participa de competencias organizadas, y el **44,2 %** practica en clubes.
- Solo el **15,3 %** de quienes practican regularmente está federado.

**Nuestra lectura:** la mayoría compite fuera de una federación con un control centralizado como el de la UAR. Ahí es donde el apto en papel queda más expuesto. Esta es una conclusión del equipo a partir de los datos, no algo que la encuesta afirme.

### Cómo VitalPass responde a lo que falló en Mendoza

| Lo que falló | Cómo está diseñado VitalPass |
|---|---|
| Se usó la firma de una médica sin que ella lo supiera | Cada médico firma con su propia cuenta (próximo paso: en la demo firma la cuenta de la app) |
| Los aptos los emitía una empresa no habilitada | Solo emiten médicos con matrícula verificada en REFEPS |
| Se descubrió años después, por una denuncia | Cada emisión queda registrada al instante en Hedera, auditable por cualquiera |

Falsificar un certificado médico es delito en Argentina (Código Penal, arts. 295 y 296). Con VitalPass, cada firma queda atada a una matrícula para siempre, lo que vuelve rastreable cualquier falsificación.

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
| Transacción de registro de un apto emitido desde la app (`VP-FA6C9122`, llamada a `register`) | [`5b66a666…6d34`](https://stellar.expert/explorer/testnet/tx/5b66a666bbc5aa980413fd2e5713657deb6c38267a3e560c2c535501c10b6d34) |

### Hedera
| Qué | Valor |
|---|---|
| Cuenta (operator) | [`0.0.10999895`](https://hashscan.io/testnet/account/0.0.10999895) |
| Topic HCS | [`0.0.11052106`](https://hashscan.io/testnet/topic/0.0.11052106) |
| Transacción (mensaje de inicialización del topic) | [`0.0.10999895@1792176018.485508778`](https://hashscan.io/testnet/transaction/0.0.10999895-1792176018-485508778) |
| Transacción de un apto emitido desde la app (`VP-FA6C9122`) | [`0.0.10999895@1792184052.221661275`](https://hashscan.io/testnet/transaction/0.0.10999895-1792184052-221661275) |

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

- El portal médico no tiene login en esta demo. Próximo paso: verificar la matrícula de cada médico en REFEPS y que cada uno firme con su propia cuenta.
- La ficha de emergencia se ve con el código del QR. Próximo paso: acceso por rol (árbitro, servicio médico).
- Piloto con una liga o unión local. Primer candidato a explorar: rugby, donde ya existe un control centralizado (UAR) y el dolor es repetir trámites al cambiar de club. Club o liga: a confirmar.

## Modelo de negocio (hipótesis a validar)

- **Usuarios:** atletas, médicos, árbitros y profes.
- **Quién paga:**
  - **Clubes o deportistas:** una tarifa fija por cada certificado (emisión nueva, renovación, etc.).
  - **Médicos:** una suscripción para usar la plataforma de emisión.
- **Quién puede emitir:** solo médicos con la **matrícula verificada en la Red Federal de Registros de Profesionales de la Salud (REFEPS)**. La suscripción da acceso a la herramienta; la habilitación para firmar aptos depende únicamente de la matrícula, no del pago.
- **A futuro:** el cobro se puede hacer en USDC directamente en el contrato de Stellar, de modo que el pago y el registro ocurran en la misma transacción.

## Equipo — Grupo 14

| Integrante | Rol |
|---|---|
| Tobías Roncati | Programación, diseño y pitch |
| Leia Orgoñ | Programación y diseño |
| Joaquín Ramírez | Validación y pitch |
| Luciano Bellon | Negocio y validación |
| Virginia Gonzalez | Negocio, Economia y Video |
