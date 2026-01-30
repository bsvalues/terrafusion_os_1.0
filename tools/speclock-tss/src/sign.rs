// ═══════════════════════════════════════════════════════════════════════════════
// TerraFusion SpecLock TSS - Signing Operations
// ═══════════════════════════════════════════════════════════════════════════════
//
// FROST signing is a two-round protocol:
// 1. Each signer generates nonces and broadcasts commitments
// 2. Each signer produces a signature share using the signing package
// 3. Coordinator aggregates k shares into final signature
//
// The final signature is indistinguishable from a single-signer Ed25519 signature.
// ═══════════════════════════════════════════════════════════════════════════════

use anyhow::{anyhow, Context, Result};
use frost_ed25519 as frost;
use frost_ed25519::round1 as signing_round1;
use frost_ed25519::round2 as signing_round2;
use frost_ed25519::{Signature, SigningPackage};
use rand::rngs::OsRng;
use std::collections::BTreeMap;

use crate::types::*;

/// Generate signing nonces and commitment (Round 1)
pub fn sign_round1(
    participant_id: u16,
    key_package_bytes: &[u8],
) -> Result<(NonceCommitment, Vec<u8>)> {
    let identifier = frost::Identifier::try_from(participant_id)
        .map_err(|e| anyhow!("Invalid participant ID: {}", e))?;

    let key_package = frost::keys::KeyPackage::deserialize(key_package_bytes)
        .context("Failed to deserialize KeyPackage")?;

    let mut rng = OsRng;

    let (nonces, commitments) = frost::round1::commit(
        key_package.signing_share(),
        &mut rng,
    );

    // Serialize commitment for broadcast
    let commitment_bytes = commitments.serialize()
        .context("Failed to serialize commitment")?;

    // Serialize nonces for local storage (NEVER share these!)
    let nonces_bytes = nonces.serialize()
        .context("Failed to serialize nonces")?;

    let envelope = NonceCommitment {
        participant_id,
        commitment_bytes: hex::encode(&commitment_bytes),
    };

    Ok((envelope, nonces_bytes))
}

/// Generate signature share (Round 2)
pub fn sign_round2(
    participant_id: u16,
    key_package_bytes: &[u8],
    nonces_bytes: &[u8],
    message: &[u8],
    commitments: &[NonceCommitment],
) -> Result<SignatureShare> {
    let identifier = frost::Identifier::try_from(participant_id)
        .map_err(|e| anyhow!("Invalid participant ID: {}", e))?;

    let key_package = frost::keys::KeyPackage::deserialize(key_package_bytes)
        .context("Failed to deserialize KeyPackage")?;

    let nonces = signing_round1::SigningNonces::deserialize(nonces_bytes)
        .context("Failed to deserialize nonces")?;

    // Build commitment map
    let mut commitment_map: BTreeMap<frost::Identifier, signing_round1::SigningCommitments> = BTreeMap::new();
    for c in commitments {
        let id = frost::Identifier::try_from(c.participant_id)?;
        let bytes = hex::decode(&c.commitment_bytes)?;
        let commitment = signing_round1::SigningCommitments::deserialize(&bytes)?;
        commitment_map.insert(id, commitment);
    }

    // Create signing package
    let signing_package = SigningPackage::new(commitment_map, message)
        .context("Failed to create SigningPackage")?;

    // Generate signature share
    let signature_share = frost::round2::sign(&signing_package, &nonces, &key_package)
        .context("Failed to generate signature share")?;

    let share_bytes = signature_share.serialize()
        .context("Failed to serialize signature share")?;

    Ok(SignatureShare {
        participant_id,
        share_bytes: hex::encode(&share_bytes),
    })
}

/// Aggregate signature shares into final signature
pub fn aggregate_shares(
    message: &[u8],
    commitments: &[NonceCommitment],
    shares: &[SignatureShare],
    public_key_package_bytes: &[u8],
) -> Result<AggregatedSignature> {
    // Build commitment map
    let mut commitment_map: BTreeMap<frost::Identifier, signing_round1::SigningCommitments> = BTreeMap::new();
    for c in commitments {
        let id = frost::Identifier::try_from(c.participant_id)?;
        let bytes = hex::decode(&c.commitment_bytes)?;
        let commitment = signing_round1::SigningCommitments::deserialize(&bytes)?;
        commitment_map.insert(id, commitment);
    }

    // Create signing package
    let signing_package = SigningPackage::new(commitment_map, message)
        .context("Failed to create SigningPackage")?;

    // Build signature share map
    let mut share_map: BTreeMap<frost::Identifier, signing_round2::SignatureShare> = BTreeMap::new();
    for s in shares {
        let id = frost::Identifier::try_from(s.participant_id)?;
        let bytes = hex::decode(&s.share_bytes)?;
        let share = signing_round2::SignatureShare::deserialize(&bytes)?;
        share_map.insert(id, share);
    }

    // Deserialize public key package
    let public_key_package = frost::keys::PublicKeyPackage::deserialize(public_key_package_bytes)
        .context("Failed to deserialize PublicKeyPackage")?;

    // Aggregate
    let signature = frost::aggregate(&signing_package, &share_map, &public_key_package)
        .context("Failed to aggregate signature shares")?;

    let sig_bytes = signature.serialize();

    Ok(AggregatedSignature {
        signature_bytes: hex::encode(sig_bytes),
        scheme: "frost_ed25519".to_string(),
    })
}

/// Verify a signature against the group public key
pub fn verify_signature(
    message: &[u8],
    signature_hex: &str,
    group_public_key_hex: &str,
) -> Result<bool> {
    let sig_bytes = hex::decode(signature_hex)
        .context("Failed to decode signature hex")?;
    let pub_bytes = hex::decode(group_public_key_hex)
        .context("Failed to decode public key hex")?;

    let signature = Signature::deserialize(&sig_bytes)
        .context("Failed to deserialize signature")?;
    let verifying_key = frost::VerifyingKey::deserialize(&pub_bytes)
        .context("Failed to deserialize verifying key")?;

    // FROST signatures are verified the same way as standard Ed25519
    verifying_key.verify(message, &signature)
        .context("Signature verification failed")?;

    Ok(true)
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::dkg;

    #[test]
    fn test_sign_and_verify_2_of_3() {
        // First, run DKG
        let k = 2u16;
        let n = 3u16;

        let (r1_pkg_1, r1_secret_1) = dkg::dkg_round1(1, k, n).unwrap();
        let (r1_pkg_2, r1_secret_2) = dkg::dkg_round1(2, k, n).unwrap();
        let (r1_pkg_3, r1_secret_3) = dkg::dkg_round1(3, k, n).unwrap();

        let all_r1 = vec![r1_pkg_1.clone(), r1_pkg_2.clone(), r1_pkg_3.clone()];

        let r2_from_1 = dkg::dkg_round2(1, &r1_secret_1, &all_r1).unwrap();
        let r2_from_2 = dkg::dkg_round2(2, &r1_secret_2, &all_r1).unwrap();
        let r2_from_3 = dkg::dkg_round2(3, &r1_secret_3, &all_r1).unwrap();

        let all_r2: Vec<_> = [r2_from_1, r2_from_2, r2_from_3].into_iter().flatten().collect();

        let (key_pkg_1, group_key) = dkg::dkg_finalize(1, &r1_secret_1, &all_r1, &all_r2).unwrap();
        let (key_pkg_2, _) = dkg::dkg_finalize(2, &r1_secret_2, &all_r1, &all_r2).unwrap();

        // Now sign with participants 1 and 2 (k=2)
        let message = b"TerraFusion SpecLock Manifest v3.0";

        // Round 1: Generate commitments
        let kp1_bytes = hex::decode(&key_pkg_1.key_package_bytes).unwrap();
        let kp2_bytes = hex::decode(&key_pkg_2.key_package_bytes).unwrap();

        let (commit_1, nonces_1) = sign_round1(1, &kp1_bytes).unwrap();
        let (commit_2, nonces_2) = sign_round1(2, &kp2_bytes).unwrap();

        let commitments = vec![commit_1.clone(), commit_2.clone()];

        // Round 2: Generate signature shares
        let share_1 = sign_round2(1, &kp1_bytes, &nonces_1, message, &commitments).unwrap();
        let share_2 = sign_round2(2, &kp2_bytes, &nonces_2, message, &commitments).unwrap();

        let shares = vec![share_1, share_2];

        // Aggregate
        let pub_pkg_bytes = hex::decode(&key_pkg_1.public_key_package_bytes).unwrap();
        let signature = aggregate_shares(message, &commitments, &shares, &pub_pkg_bytes).unwrap();

        // Verify
        let valid = verify_signature(message, &signature.signature_bytes, &group_key.public_key_bytes).unwrap();
        assert!(valid);

        println!("✅ 2-of-3 signing and verification succeeded");
        println!("   Signature: {}", signature.signature_bytes);
    }

    #[test]
    fn test_1_of_3_fails() {
        // k=2 requires 2 signers; 1 should fail
        let k = 2u16;
        let n = 3u16;

        let (r1_pkg_1, r1_secret_1) = dkg::dkg_round1(1, k, n).unwrap();
        let (r1_pkg_2, r1_secret_2) = dkg::dkg_round1(2, k, n).unwrap();
        let (r1_pkg_3, r1_secret_3) = dkg::dkg_round1(3, k, n).unwrap();

        let all_r1 = vec![r1_pkg_1.clone(), r1_pkg_2.clone(), r1_pkg_3.clone()];

        let r2_from_1 = dkg::dkg_round2(1, &r1_secret_1, &all_r1).unwrap();
        let r2_from_2 = dkg::dkg_round2(2, &r1_secret_2, &all_r1).unwrap();
        let r2_from_3 = dkg::dkg_round2(3, &r1_secret_3, &all_r1).unwrap();

        let all_r2: Vec<_> = [r2_from_1, r2_from_2, r2_from_3].into_iter().flatten().collect();

        let (key_pkg_1, _) = dkg::dkg_finalize(1, &r1_secret_1, &all_r1, &all_r2).unwrap();

        // Try to sign with only 1 participant
        let message = b"TerraFusion SpecLock Manifest v3.0";

        let kp1_bytes = hex::decode(&key_pkg_1.key_package_bytes).unwrap();
        let (commit_1, nonces_1) = sign_round1(1, &kp1_bytes).unwrap();

        // Only one commitment - aggregation should fail
        let commitments = vec![commit_1.clone()];
        let share_1 = sign_round2(1, &kp1_bytes, &nonces_1, message, &commitments).unwrap();
        let shares = vec![share_1];

        let pub_pkg_bytes = hex::decode(&key_pkg_1.public_key_package_bytes).unwrap();
        let result = aggregate_shares(message, &commitments, &shares, &pub_pkg_bytes);

        // This should fail because we need k=2 shares
        assert!(result.is_err(), "Expected aggregation to fail with only 1 share");
        println!("✅ 1-of-3 correctly fails (k=2 required)");
    }
}
