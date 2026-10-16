-- ============================================================
-- VitalSport ID - tabla de aptos médicos
-- Pegar completo en Supabase > SQL Editor > New query > Run
-- Usar un proyecto de Supabase NUEVO (no el de REJOAR).
-- ============================================================

create table if not exists aptos (
  id               text primary key,          -- código corto del QR, ej: VS-1A2B3C4D
  athlete_name     text not null,
  club             text not null,
  blood_type       text not null,
  allergies        text not null default '',
  emergency_name   text not null,
  emergency_phone  text not null,
  blood_pressure   text not null default '',
  apto             boolean not null,
  medic_name       text not null,
  medic_license    text not null,
  valid_until      date not null,
  athlete_id_hash  text not null,              -- huella del DNI (el DNI NO se guarda)
  record_hash      text not null,              -- huella de la ficha completa
  hedera_tx        text,                       -- ID de transacción en Hedera (null = no se registró)
  hedera_topic     text,
  hedera_error     text,
  stellar_tx       text,                       -- hash de transacción en Stellar (null = no se registró)
  stellar_contract text,
  stellar_error    text,
  created_at       timestamptz not null default now()
);

-- PERMISOS: son datos de salud, así que la clave pública (anon) NO puede leer ni escribir nada.
-- Solo el servidor de la app (con la clave secreta / service_role) accede a la tabla.
alter table aptos enable row level security;
revoke all on aptos from anon, authenticated;
