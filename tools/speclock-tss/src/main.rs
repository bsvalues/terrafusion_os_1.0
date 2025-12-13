// ═══════════════════════════════════════════════════════════════════════════════
// TerraFusion SpecLock TSS - COSMIC TIER CLI
// ═══════════════════════════════════════════════════════════════════════════════
//
// Real FROST-Ed25519 threshold cryptography.
//
// Commands:
//   digest    - Compute SHA-256 of manifest (what gets signed)
//   dkg-r1    - Generate DKG Round 1 package
//   dkg-r2    - Generate DKG Round 2 packages
//   dkg-final - Finalize DKG, output KeyPackage + GroupPublicKey
//   sign-r1   - Generate signing nonces + commitment
//   sign-r2   - Generate signature share
//   aggregate - Combine k shares into final signature
//   verify    - Verify signature against group public key
//
// Usage:
//   speclock-tss digest --manifest manifest.json --out digest.json
//   speclock-tss verify --digest digest.json --signature manifest.sig --group-pub group.pub
// ═══════════════════════════════════════════════════════════════════════════════

mod types;
mod dkg;
mod sign;

use anyhow::{anyhow, Context, Result};
use clap::{Parser, Subcommand};
use sha2::{Digest, Sha256};
use std::fs;
use std::path::PathBuf;

use types::*;

#[derive(Parser)]
#[command(name = "speclock-tss")]
#[command(about = "TerraFusion SpecLock COSMIC TIER - FROST-Ed25519 Threshold Signatures")]
#[command(version = "1.0.0")]
struct Cli {
    #[command(subcommand)]
    cmd: Commands,
}

#[derive(Subcommand)]
enum Commands {
    /// Compute SHA-256 digest of manifest (what gets signed)
    Digest {
        #[arg(long)]
        manifest: PathBuf,
        #[arg(long)]
        out: PathBuf,
    },

    /// DKG Round 1: Generate commitment package
    DkgR1 {
        #[arg(long)]
        id: u16,
        #[arg(long)]
        threshold: u16,
        #[arg(long)]
        participants: u16,
        #[arg(long)]
        out_package: PathBuf,
        #[arg(long)]
        out_secret: PathBuf,
    },

    /// DKG Round 2: Generate packages for other participants
    DkgR2 {
        #[arg(long)]
        id: u16,
        #[arg(long)]
        secret: PathBuf,
        #[arg(long)]
        packages_dir: PathBuf,
        #[arg(long)]
        out_dir: PathBuf,
    },

    /// DKG Finalize: Generate KeyPackage + GroupPublicKey
    DkgFinal {
        #[arg(long)]
        id: u16,
        #[arg(long)]
        secret: PathBuf,
        #[arg(long)]
        r1_packages_dir: PathBuf,
        #[arg(long)]
        r2_packages_dir: PathBuf,
        #[arg(long)]
        out_key_package: PathBuf,
        #[arg(long)]
        out_group_pub: PathBuf,
    },

    /// Sign Round 1: Generate nonces + commitment
    SignR1 {
        #[arg(long)]
        id: u16,
        #[arg(long)]
        key_package: PathBuf,
        #[arg(long)]
        out_commitment: PathBuf,
        #[arg(long)]
        out_nonces: PathBuf,
    },

    /// Sign Round 2: Generate signature share
    SignR2 {
        #[arg(long)]
        id: u16,
        #[arg(long)]
        key_package: PathBuf,
        #[arg(long)]
        nonces: PathBuf,
        #[arg(long)]
        message: PathBuf,
        #[arg(long)]
        commitments_dir: PathBuf,
        #[arg(long)]
        out_share: PathBuf,
    },

    /// Aggregate: Combine k signature shares
    Aggregate {
        #[arg(long)]
        message: PathBuf,
        #[arg(long)]
        commitments_dir: PathBuf,
        #[arg(long)]
        shares_dir: PathBuf,
        #[arg(long)]
        public_key_package: PathBuf,
        #[arg(long)]
        out_signature: PathBuf,
        #[arg(long)]
        out_proof: PathBuf,
    },

    /// Verify: Check signature against group public key
    Verify {
        #[arg(long)]
        message: PathBuf,
        #[arg(long)]
        signature: PathBuf,
        #[arg(long)]
        group_pub: PathBuf,
    },
}

fn read_bytes(p: &PathBuf) -> Result<Vec<u8>> {
    fs::read(p).with_context(|| format!("Failed to read {}", p.display()))
}

fn read_text(p: &PathBuf) -> Result<String> {
    fs::read_to_string(p).with_context(|| format!("Failed to read {}", p.display()))
}

fn write_text(p: &PathBuf, s: &str) -> Result<()> {
    if let Some(parent) = p.parent() {
        fs::create_dir_all(parent)?;
    }
    fs::write(p, s).with_context(|| format!("Failed to write {}", p.display()))
}

fn write_bytes(p: &PathBuf, b: &[u8]) -> Result<()> {
    if let Some(parent) = p.parent() {
        fs::create_dir_all(parent)?;
    }
    fs::write(p, b).with_context(|| format!("Failed to write {}", p.display()))
}

fn load_json_files<T: serde::de::DeserializeOwned>(dir: &PathBuf) -> Result<Vec<T>> {
    let mut items = Vec::new();
    for entry in fs::read_dir(dir)? {
        let path = entry?.path();
        if path.extension().and_then(|s| s.to_str()) == Some("json") {
            let content = fs::read(&path)?;
            let item: T = serde_json::from_slice(&content)?;
            items.push(item);
        }
    }
    Ok(items)
}

fn main() -> Result<()> {
    let cli = Cli::parse();

    match cli.cmd {
        Commands::Digest { manifest, out } => {
            let bytes = read_bytes(&manifest)?;
            let hash = Sha256::digest(&bytes);
            let digest = ManifestDigest {
                algorithm: "sha256".to_string(),
                digest_hex: hex::encode(hash),
                manifest_path: manifest.to_string_lossy().to_string(),
            };
            write_text(&out, &serde_json::to_string_pretty(&digest)?)?;
            println!("✅ Digest written to {}", out.display());
            Ok(())
        }

        Commands::DkgR1 { id, threshold, participants, out_package, out_secret } => {
            let (package, secret_bytes) = dkg::dkg_round1(id, threshold, participants)?;
            write_text(&out_package, &serde_json::to_string_pretty(&package)?)?;
            write_bytes(&out_secret, &secret_bytes)?;
            println!("✅ DKG Round 1 complete for participant {}", id);
            println!("   Package: {}", out_package.display());
            println!("   Secret:  {} (KEEP PRIVATE)", out_secret.display());
            Ok(())
        }

        Commands::DkgR2 { id, secret, packages_dir, out_dir } => {
            let secret_bytes = read_bytes(&secret)?;
            let packages: Vec<DkgRound1Package> = load_json_files(&packages_dir)?;
            let round2_packages = dkg::dkg_round2(id, &secret_bytes, &packages)?;

            fs::create_dir_all(&out_dir)?;
            for pkg in &round2_packages {
                let path = out_dir.join(format!("r2_{}_to_{}.json", pkg.sender_id, pkg.receiver_id));
                write_text(&path, &serde_json::to_string_pretty(&pkg)?)?;
            }
            println!("✅ DKG Round 2 complete for participant {}", id);
            println!("   Packages: {}", out_dir.display());
            Ok(())
        }

        Commands::DkgFinal { id, secret, r1_packages_dir, r2_packages_dir, out_key_package, out_group_pub } => {
            let secret_bytes = read_bytes(&secret)?;
            let r1_packages: Vec<DkgRound1Package> = load_json_files(&r1_packages_dir)?;
            let r2_packages: Vec<DkgRound2Package> = load_json_files(&r2_packages_dir)?;

            let (key_package, group_key) = dkg::dkg_finalize(id, &secret_bytes, &r1_packages, &r2_packages)?;

            write_text(&out_key_package, &serde_json::to_string_pretty(&key_package)?)?;
            write_text(&out_group_pub, &serde_json::to_string_pretty(&group_key)?)?;

            println!("✅ DKG Finalized for participant {}", id);
            println!("   KeyPackage: {} (KEEP PRIVATE)", out_key_package.display());
            println!("   GroupPub:   {}", out_group_pub.display());
            println!("   Group Key:  {}", group_key.public_key_bytes);
            Ok(())
        }

        Commands::SignR1 { id, key_package, out_commitment, out_nonces } => {
            let kp: KeyPackageEnvelope = serde_json::from_slice(&read_bytes(&key_package)?)?;
            let kp_bytes = hex::decode(&kp.key_package_bytes)?;

            let (commitment, nonces_bytes) = sign::sign_round1(id, &kp_bytes)?;

            write_text(&out_commitment, &serde_json::to_string_pretty(&commitment)?)?;
            write_bytes(&out_nonces, &nonces_bytes)?;

            println!("✅ Sign Round 1 complete for participant {}", id);
            println!("   Commitment: {}", out_commitment.display());
            println!("   Nonces:     {} (KEEP PRIVATE)", out_nonces.display());
            Ok(())
        }

        Commands::SignR2 { id, key_package, nonces, message, commitments_dir, out_share } => {
            let kp: KeyPackageEnvelope = serde_json::from_slice(&read_bytes(&key_package)?)?;
            let kp_bytes = hex::decode(&kp.key_package_bytes)?;
            let nonces_bytes = read_bytes(&nonces)?;
            let msg_bytes = read_bytes(&message)?;
            let commitments: Vec<NonceCommitment> = load_json_files(&commitments_dir)?;

            let share = sign::sign_round2(id, &kp_bytes, &nonces_bytes, &msg_bytes, &commitments)?;

            write_text(&out_share, &serde_json::to_string_pretty(&share)?)?;

            println!("✅ Sign Round 2 complete for participant {}", id);
            println!("   Share: {}", out_share.display());
            Ok(())
        }

        Commands::Aggregate { message, commitments_dir, shares_dir, public_key_package, out_signature, out_proof } => {
            let msg_bytes = read_bytes(&message)?;
            let commitments: Vec<NonceCommitment> = load_json_files(&commitments_dir)?;
            let shares: Vec<SignatureShare> = load_json_files(&shares_dir)?;

            // Load public key package
            let kp: KeyPackageEnvelope = serde_json::from_slice(&read_bytes(&public_key_package)?)?;
            let pub_pkg_bytes = hex::decode(&kp.public_key_package_bytes)?;

            let signature = sign::aggregate_shares(&msg_bytes, &commitments, &shares, &pub_pkg_bytes)?;

            // Write raw signature (hex)
            write_text(&out_signature, &format!("{}\n", signature.signature_bytes))?;

            // Build proof
            let group_pub_bytes = hex::decode(&kp.public_key_package_bytes)?;
            let group_pub_pkg = frost_ed25519::keys::PublicKeyPackage::deserialize(&group_pub_bytes)?;
            let group_pub_hex = hex::encode(group_pub_pkg.verifying_key().serialize());

            let msg_hash = hex::encode(Sha256::digest(&msg_bytes));

            let proof = CosmicProof {
                scheme: "frost_ed25519".to_string(),
                threshold_k: shares.len() as u16,
                participants_n: commitments.len() as u16,
                participants_signed: shares.iter().map(|s| s.participant_id).collect(),
                group_public_key_hex: group_pub_hex,
                digest_hex: msg_hash,
                signature_hex: signature.signature_bytes.clone(),
                timestamp: chrono::Utc::now().to_rfc3339(),
                verification_status: "signed".to_string(),
            };

            write_text(&out_proof, &serde_json::to_string_pretty(&proof)?)?;

            println!("✅ Aggregation complete");
            println!("   Signature: {}", out_signature.display());
            println!("   Proof:     {}", out_proof.display());
            println!("   Signers:   {:?}", proof.participants_signed);
            Ok(())
        }

        Commands::Verify { message, signature, group_pub } => {
            let msg_bytes = read_bytes(&message)?;
            let sig_hex = read_text(&signature)?.trim().to_string();
            let group_key: GroupPublicKey = serde_json::from_slice(&read_bytes(&group_pub)?)?;

            sign::verify_signature(&msg_bytes, &sig_hex, &group_key.public_key_bytes)?;

            println!("✅ Signature VERIFIED");
            println!("   Scheme:    {}", group_key.scheme);
            println!("   Threshold: {}-of-{}", group_key.threshold_k, group_key.participants_n);
            println!("   Group Key: {}", group_key.public_key_bytes);
            Ok(())
        }
    }
}
