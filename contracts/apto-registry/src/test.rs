#![cfg(test)]
use super::*;
use soroban_sdk::testutils::{Address as _, Ledger};

fn setup() -> (Env, AptoRegistryClient<'static>, Address) {
    let env = Env::default();
    env.mock_all_auths();
    env.ledger().with_mut(|l| l.timestamp = 1_000);
    let contract_id = env.register(AptoRegistry, ());
    let client = AptoRegistryClient::new(&env, &contract_id);
    let issuer = Address::generate(&env);
    (env, client, issuer)
}

#[test]
fn apto_vigente_es_valido() {
    let (env, client, issuer) = setup();
    let athlete = BytesN::from_array(&env, &[1; 32]);
    let record = BytesN::from_array(&env, &[2; 32]);
    let license = String::from_str(&env, "MP-0000");

    client.register(&issuer, &athlete, &record, &license, &true, &5_000);

    assert!(client.is_valid(&athlete));
    let saved = client.get(&athlete).unwrap();
    assert_eq!(saved.record_hash, record);
    assert_eq!(saved.issuer, issuer);
    assert_eq!(saved.issued_at, 1_000);
}

#[test]
fn apto_vencido_no_es_valido() {
    let (env, client, issuer) = setup();
    let athlete = BytesN::from_array(&env, &[1; 32]);
    let record = BytesN::from_array(&env, &[2; 32]);
    let license = String::from_str(&env, "MP-0000");

    client.register(&issuer, &athlete, &record, &license, &true, &5_000);
    env.ledger().with_mut(|l| l.timestamp = 6_000);

    assert!(!client.is_valid(&athlete));
}

#[test]
fn no_apto_no_es_valido() {
    let (env, client, issuer) = setup();
    let athlete = BytesN::from_array(&env, &[3; 32]);
    let record = BytesN::from_array(&env, &[4; 32]);
    let license = String::from_str(&env, "MP-0000");

    client.register(&issuer, &athlete, &record, &license, &false, &5_000);

    assert!(!client.is_valid(&athlete));
}

#[test]
fn atleta_sin_registro_no_es_valido() {
    let (env, client, _issuer) = setup();
    let athlete = BytesN::from_array(&env, &[9; 32]);
    assert!(!client.is_valid(&athlete));
    assert!(client.get(&athlete).is_none());
}
