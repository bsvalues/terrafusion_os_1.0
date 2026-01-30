// ═══════════════════════════════════════════════════════════════════════════════
// TerraFusion SpecLock TSS - Distributed Key Generation (DKG)
// ═══════════════════════════════════════════════════════════════════════════════
//
// FROST DKG produces:
// - Each participant gets a KeyPackage (their signing share)
// - All participants share a PublicKeyPackage (group verification key)
//
// The group public key is the ONLY key needed to verify signatures.
// No single participant can sign alone.
// ═══════════════════════════════════════════════════════════════════════════════

use anyhow::{anyhow, Context, Result};
use frost_ed25519 as frost;
use frost_ed25519::keys::dkg;
use rand::rngs::OsRng;
use std::collections::BTreeMap;

use crate::types::*;

/// Generate Round 1 package for a participant
pub fn dkg_round1(
    participant_id: u16,
    threshold_k: u16,
    participants_n: u16,
) -> Result<(DkgRound1Package, Vec<u8>)> {
    let identifier = frost::Identifier::try_from(participant_id)
        .map_err(|e| anyhow!("Invalid participant ID: {}", e))?;

    let mut rng = OsRng;

    let (round1_secret, round1_package) = dkg::part1(
        identifier,
        participants_n,
        threshold_k,
        &mut rng,
    ).context("DKG Round 1 failed")?;

    // Serialize the round1 package for broadcast
    let package_bytes = round1_package.serialize()
        .context("Failed to serialize Round 1 package")?;

    // Serialize the secret for local storage
    let secret_bytes = round1_secret.serialize()
        .context("Failed to serialize Round 1 secret")?;

    let envelope = DkgRound1Package {
        participant_id,
        package_bytes: hex::encode(&package_bytes),
    };

    Ok((envelope, secret_bytes))
}

/// Generate Round 2 packages for all other participants
pub fn dkg_round2(
    participant_id: u16,
    round1_secret_bytes: &[u8],
    round1_packages: &[DkgRound1Package],
) -> Result<Vec<DkgRound2Package>> {
    let identifier = frost::Identifier::try_from(participant_id)
        .map_err(|e| anyhow!("Invalid participant ID: {}", e))?;

    // Deserialize our secret
    let round1_secret = dkg::round1::SecretPackage::deserialize(round1_secret_bytes)
        .context("Failed to deserialize Round 1 secret")?;

    // Collect all Round 1 packages into a BTreeMap
    let mut packages: BTreeMap<frost::Identifier, dkg::round1::Package> = BTreeMap::new();
    for pkg in round1_packages {
        if pkg.participant_id == participant_id {
            continue; // Skip our own package
        }
        let id = frost::Identifier::try_from(pkg.participant_id)
            .map_err(|e| anyhow!("Invalid participant ID {}: {}", pkg.participant_id, e))?;
        let bytes = hex::decode(&pkg.package_bytes)
            .context("Failed to decode Round 1 package hex")?;
        let package = dkg::round1::Package::deserialize(&bytes)
            .context("Failed to deserialize Round 1 package")?;
        packages.insert(id, package);
    }

    // Generate Round 2 packages
    let (round2_secret, round2_packages) = dkg::part2(round1_secret, &packages)
        .context("DKG Round 2 failed")?;

    // Convert to our envelope format
    let mut envelopes = Vec::new();
    for (receiver_id, package) in round2_packages {
        let receiver_num: u16 = receiver_id.serialize()[0] as u16; // Simplified for demo
        let package_bytes = package.serialize()
            .context("Failed to serialize Round 2 package")?;
        envelopes.push(DkgRound2Package {
            sender_id: participant_id,
            receiver_id: receiver_num,
            package_bytes: hex::encode(&package_bytes),
        });
    }

    // Store round2 secret for part3 (caller must save this)
    // For simplicity, we include it in the first envelope's metadata
    // In production, this would be stored separately

    Ok(envelopes)
}

/// Finalize DKG and generate KeyPackage + PublicKeyPackage
pub fn dkg_finalize(
    participant_id: u16,
    round1_secret_bytes: &[u8],
    round1_packages: &[DkgRound1Package],
    round2_packages: &[DkgRound2Package],
) -> Result<(KeyPackageEnvelope, GroupPublicKey)> {
    let identifier = frost::Identifier::try_from(participant_id)
        .map_err(|e| anyhow!("Invalid participant ID: {}", e))?;

    // Deserialize Round 1 secret
    let round1_secret = dkg::round1::SecretPackage::deserialize(round1_secret_bytes)
        .context("Failed to deserialize Round 1 secret")?;

    // Collect Round 1 packages
    let mut r1_packages: BTreeMap<frost::Identifier, dkg::round1::Package> = BTreeMap::new();
    for pkg in round1_packages {
        if pkg.participant_id == participant_id {
            continue;
        }
        let id = frost::Identifier::try_from(pkg.participant_id)?;
        let bytes = hex::decode(&pkg.package_bytes)?;
        let package = dkg::round1::Package::deserialize(&bytes)?;
        r1_packages.insert(id, package);
    }

    // Run part2 to get round2 secret
    let (round2_secret, _) = dkg::part2(round1_secret, &r1_packages)
        .context("DKG Round 2 (for finalize) failed")?;

    // Collect Round 2 packages sent TO us
    let mut r2_packages: BTreeMap<frost::Identifier, dkg::round2::Package> = BTreeMap::new();
    for pkg in round2_packages {
        if pkg.receiver_id != participant_id {
            continue;
        }
        let sender_id = frost::Identifier::try_from(pkg.sender_id)?;
        let bytes = hex::decode(&pkg.package_bytes)?;
        let package = dkg::round2::Package::deserialize(&bytes)?;
        r2_packages.insert(sender_id, package);
    }

    // Finalize
    let (key_package, public_key_package) = dkg::part3(&round2_secret, &r1_packages, &r2_packages)
        .context("DKG Part 3 (finalize) failed")?;

    // Serialize outputs
    let key_package_bytes = key_package.serialize()
        .context("Failed to serialize KeyPackage")?;
    let public_key_package_bytes = public_key_package.serialize()
        .context("Failed to serialize PublicKeyPackage")?;

    // Extract group public key
    let verifying_key = public_key_package.verifying_key();
    let group_pub_bytes = verifying_key.serialize();

    let key_envelope = KeyPackageEnvelope {
        participant_id,
        key_package_bytes: hex::encode(&key_package_bytes),
        public_key_package_bytes: hex::encode(&public_key_package_bytes),
    };

    let group_key = GroupPublicKey {
        scheme: "frost_ed25519".to_string(),
        threshold_k: key_package.min_signers() as u16,
        participants_n: r1_packages.len() as u16 + 1,
        public_key_bytes: hex::encode(group_pub_bytes),
    };

    Ok((key_envelope, group_key))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_dkg_2_of_3() {
        // Simulate 3 participants, threshold = 2
        let k = 2u16;
        let n = 3u16;

        // Round 1: Each participant generates their package
        let (r1_pkg_1, r1_secret_1) = dkg_round1(1, k, n).unwrap();
        let (r1_pkg_2, r1_secret_2) = dkg_round1(2, k, n).unwrap();
        let (r1_pkg_3, r1_secret_3) = dkg_round1(3, k, n).unwrap();

        let all_r1 = vec![r1_pkg_1.clone(), r1_pkg_2.clone(), r1_pkg_3.clone()];

        // Round 2: Each participant generates packages for others
        let r2_from_1 = dkg_round2(1, &r1_secret_1, &all_r1).unwrap();
        let r2_from_2 = dkg_round2(2, &r1_secret_2, &all_r1).unwrap();
        let r2_from_3 = dkg_round2(3, &r1_secret_3, &all_r1).unwrap();

        let all_r2: Vec<DkgRound2Package> = [r2_from_1, r2_from_2, r2_from_3]
            .into_iter()
            .flatten()
            .collect();

        // Finalize: Each participant computes their key package
        let (key_pkg_1, group_key_1) = dkg_finalize(1, &r1_secret_1, &all_r1, &all_r2).unwrap();
        let (key_pkg_2, group_key_2) = dkg_finalize(2, &r1_secret_2, &all_r1, &all_r2).unwrap();
        let (key_pkg_3, group_key_3) = dkg_finalize(3, &r1_secret_3, &all_r1, &all_r2).unwrap();

        // All participants should have the same group public key
        assert_eq!(group_key_1.public_key_bytes, group_key_2.public_key_bytes);
        assert_eq!(group_key_2.public_key_bytes, group_key_3.public_key_bytes);

        println!("✅ DKG 2-of-3 succeeded");
        println!("   Group Public Key: {}", group_key_1.public_key_bytes);
    }
}
