# TerraFusionOS Receiving-Vessel — STAGED SCAFFOLD (transplant-ready)

> **This directory is INERT staging inside the SOURCE repo (`terrafusion_os_1.0`).**
> It is NOT the TerraFusionOS repo. It contains the WO-LOOP-44 governance scaffold,
> laid out so its **contents map 1:1 to the future `TerraFusionOS` repo root**.

## Why it lives here
WO-LOOP-44 directed provisioning of `TerraFusionOS`. The session agent attempted
`create_repository` and received **HTTP 403 "Resource not accessible by integration"** —
the integration token is scoped to `bsvalues/terrafusion_os_1.0` and cannot create repos.
Repo creation is an **owner-only action**. So the scaffold is staged here, durable and
transplant-ready, until the owner provisions the empty repo.

## Lock state (unchanged by this staging)
- **Lock A (execution release):** CLOSED. WO-CORE-1 not released.
- **Lock B (TerraFusionOS provisioned):** NOT satisfied — repo does not exist yet.
- This staging does **not** satisfy Lock B. Lock B flips only when the real repo exists.

## Owner provisioning steps (manual — owner-only)
1. Create an **empty private** repo named `TerraFusionOS` (github.com → New, or `gh repo create bsvalues/TerraFusionOS --private`). Do NOT add a template, package, or build tooling. A bare README/`main` is fine.
2. Copy the **contents** of this directory (everything below `_STAGING-README.md`) into the repo root:
   `README.md`, `AGENTS.md`, `canon/`, `operations/`, `docs/`, `tools/`, `security/`, `brain/`.
3. Commit on `main` (e.g. "chore: WO-LOOP-44 receiving-vessel governance scaffold").
4. (Optional) run `bash tools/validators/validate-receiving-vessel.sh` from the repo root.
5. Configure branch protection per `docs/decisions/BRANCH_PROTECTION_TODO.md`.
6. Then — and only then — Lock B is satisfied. Lock A remains closed until a separate explicit WO-CORE-1 release.

## What this scaffold is NOT
No runtime code. No `backend/` `frontend/` `os-platform/`. No package/build/CI files.
No PACS / county SQL / county data / secrets. WO-CORE-1 remains unreleased.
