use std::process::Command;

fn main() {
    // Embed git commit hash at build time for FISMA audit provenance.
    // The hash field in AuditEvent will be "git:<sha>" — deterministic per
    // source commit, auditable by checking out that commit and rebuilding.
    let git_hash = Command::new("git")
        .args(["rev-parse", "--short=12", "HEAD"])
        .output()
        .ok()
        .and_then(|o| String::from_utf8(o.stdout).ok())
        .map(|s| s.trim().to_string())
        .filter(|s| !s.is_empty())
        .unwrap_or_else(|| "unknown".to_string());

    println!("cargo:rustc-env=KERNEL_GIT_HASH={}", git_hash);
    // Re-run if HEAD changes (new commit)
    println!("cargo:rerun-if-changed=.git/HEAD");
    println!("cargo:rerun-if-changed=.git/refs");
}
