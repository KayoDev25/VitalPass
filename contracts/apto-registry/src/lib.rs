#![no_std]
//! VitalSport ID - Registro de aptos médicos deportivos (contrato Soroban / Stellar).
//!
//! Qué guarda: SOLO huellas (hashes) y datos no sensibles.
//! - athlete_id: hash SHA-256 del DNI del atleta (no se puede "dar vuelta" para leer el DNI).
//! - record_hash: hash SHA-256 de la ficha médica completa (que vive fuera de la blockchain).
//! - medic_license: matrícula del médico que firmó.
//! - apto: true = APTO, false = NO APTO.
//! - valid_until: hasta cuándo vale (segundos Unix).
//!
//! Quién puede escribir: el emisor (issuer) tiene que firmar la transacción.
//! Así el registro queda atado a la cuenta del médico o institución que lo emitió.

use soroban_sdk::{contract, contractimpl, contracttype, Address, BytesN, Env, String};

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Apto {
    pub issuer: Address,
    pub record_hash: BytesN<32>,
    pub medic_license: String,
    pub apto: bool,
    pub valid_until: u64,
    pub issued_at: u64,
}

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    Apto(BytesN<32>),
}

#[contract]
pub struct AptoRegistry;

#[contractimpl]
impl AptoRegistry {
    /// Registra (o renueva) el apto de un atleta. Devuelve el momento de emisión.
    pub fn register(
        env: Env,
        issuer: Address,
        athlete_id: BytesN<32>,
        record_hash: BytesN<32>,
        medic_license: String,
        apto: bool,
        valid_until: u64,
    ) -> u64 {
        issuer.require_auth();

        let issued_at = env.ledger().timestamp();
        let record = Apto {
            issuer,
            record_hash,
            medic_license,
            apto,
            valid_until,
            issued_at,
        };
        env.storage()
            .persistent()
            .set(&DataKey::Apto(athlete_id), &record);
        issued_at
    }

    /// Devuelve el último apto registrado para ese atleta (o nada).
    pub fn get(env: Env, athlete_id: BytesN<32>) -> Option<Apto> {
        env.storage().persistent().get(&DataKey::Apto(athlete_id))
    }

    /// true solo si existe, el dictamen es APTO y no está vencido.
    pub fn is_valid(env: Env, athlete_id: BytesN<32>) -> bool {
        match Self::get(env.clone(), athlete_id) {
            Some(record) => record.apto && env.ledger().timestamp() <= record.valid_until,
            None => false,
        }
    }
}

#[cfg(test)]
mod test;
