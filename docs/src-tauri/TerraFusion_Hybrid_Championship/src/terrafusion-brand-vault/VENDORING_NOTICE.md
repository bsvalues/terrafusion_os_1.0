# TerraFusion Brand Vault Vendored

The `terrafusion-brand-vault` directory is now vendored inside the monorepo.

Actions Taken:
- Removed embedded `.git` directory to eliminate nested repo warnings.
- Preserved original source files (branding assets, build config, scripts).
- Git history for the vault is no longer tracked independently; changes flow through main repo PRs.

Rationale:
- Simplifies repository structure and reduces Git scan overhead.
- Prevents accidental commits referencing nested repository state.
- Aligns with TerraFusion OS operating model: assets managed as part of OS, not external submodule.

If upstream synchronization is needed in the future:
1. Re-add as a submodule: `git submodule add <remote-url> docs/src-tauri/TerraFusion_Hybrid_Championship/src/terrafusion-brand-vault`
2. Or periodically pull updates manually and apply diffs.

Brand Governance:
- All modifications must comply with `OFFICIAL_TERRAFUSION_BRAND_IMPLEMENTATION_GUIDE.md` and security/audit standards.
- Do not store secrets or environment-specific values here.

Audit Reference: Vendoring performed on 2025-11-17.
