use std::io::Write;
use std::path::PathBuf;
use terra_sync_policy::ContractManifest;

fn repo_root() -> PathBuf {
    PathBuf::from(env!("CARGO_MANIFEST_DIR"))
        .parent()
        .unwrap()
        .parent()
        .unwrap()
        .parent()
        .unwrap()
        .parent()
        .unwrap()
        .to_path_buf()
}

#[test]
fn loads_benton_from_pacscontract_v1() {
    let path = repo_root().join("docs/spec-lock/locks/pacscontract/v1/manifest.yaml");
    let manifest = ContractManifest::load_from_path(&path).expect("manifest loads");

    assert_eq!(manifest.contract, "pacscontract");
    assert_eq!(manifest.version, "v1");
    assert!(manifest.defaults.read_only);
    assert!(manifest.defaults.require_mtls);
    assert_eq!(manifest.audit.retention_years, 7);
    assert!(manifest.audit.worm_required);
    assert!(
        manifest.amendments.is_empty(),
        "base pacscontract.v1 must ship with no amendments"
    );

    let benton = manifest.counties.get("benton").expect("benton present");
    assert_eq!(benton.name, "Benton");
    assert_eq!(benton.vendor, "harris-pacs");
    assert!(benton.read_only);
    assert!(benton.active_amendments.is_empty());
}

#[test]
fn rejects_wrong_contract_name() {
    let mut f = tempfile::NamedTempFile::new().unwrap();
    write!(
        f,
        "contract: other\nversion: v1\ndescription: x\ndefaults: {{read_only: true, allow_subscribe_canonical: true, require_mtls: true}}\ncounties: {{}}\nforbidden_actions: [{{action: writeback.write, reason: x}}]\naudit: {{all_actions_logged: true, retention_years: 7, worm_required: true}}\n"
    )
    .unwrap();
    let err = ContractManifest::load_from_path(f.path()).unwrap_err();
    assert!(err.to_string().contains("pacscontract"));
}

#[test]
fn rejects_worm_disabled_manifest() {
    let mut f = tempfile::NamedTempFile::new().unwrap();
    write!(
        f,
        "contract: pacscontract\nversion: v1\ndescription: x\ndefaults: {{read_only: true, allow_subscribe_canonical: true, require_mtls: true}}\ncounties: {{}}\nforbidden_actions: [{{action: writeback.write, reason: x}}]\naudit: {{all_actions_logged: true, retention_years: 7, worm_required: false}}\n"
    )
    .unwrap();
    let err = ContractManifest::load_from_path(f.path()).unwrap_err();
    assert!(
        err.to_string().contains("worm_required"),
        "error must mention worm_required, got: {}",
        err
    );
}

#[test]
fn rejects_retention_under_seven_years() {
    let mut f = tempfile::NamedTempFile::new().unwrap();
    write!(
        f,
        "contract: pacscontract\nversion: v1\ndescription: x\ndefaults: {{read_only: true, allow_subscribe_canonical: true, require_mtls: true}}\ncounties: {{}}\nforbidden_actions: [{{action: writeback.write, reason: x}}]\naudit: {{all_actions_logged: true, retention_years: 3, worm_required: true}}\n"
    )
    .unwrap();
    let err = ContractManifest::load_from_path(f.path()).unwrap_err();
    assert!(
        err.to_string().contains("retention_years"),
        "error must mention retention_years, got: {}",
        err
    );
}
