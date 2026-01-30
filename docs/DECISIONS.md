# Decisions

## 2026-01-14
- ModuleRunner exists to route module calls through a single boundary with consistent IO contracts and audit capture.
- Registry + manifest is the contract boundary for module discovery, versioning, and invocation.
- Golden workflow is the spine test for end-to-end contract compatibility and determinism.
- Stub/steel policy: stubs for speed; steel for real module execution; controlled via `TEST_MODE`.
- Determinism requirements: fixed fixtures, stable outputs, and a canonical fingerprint line.
- Fingerprint contract: `GOLDEN_FINGERPRINT:: <repo-relative-file-path> CWD:: <repo-relative-cwd>` with forward slashes and no absolute paths.
