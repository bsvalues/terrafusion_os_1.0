# TerraFusionOS Receiving-Vessel — STAGED SCAFFOLD (transplant-ready)

> ## ⚠️ CORRECTION (Loop 45 / WO-LOOP-44R) — DO NOT CREATE A NEW REPO
> The sovereign receiving repo **already exists** as **`github.com/bsvalues/terrafusion-os`**.
> The earlier "create `TerraFusionOS`" instruction below was a **naming error** — it treated the
> Loop 42/43 destination *label* as a new repo to create. It is not. Corrected identity map:
>
> | Repo | Role |
> |---|---|
> | `bsvalues/terrafusion-os` | **sovereign receiving vessel** (already exists; runtime-empty by design) |
> | `bsvalues/terrafusion_os_1.0` | **old runtime archive / mine** (this repo) |
> | `bsvalues/TerraFusion-Platform` | reference mine |
>
> **The task is therefore RECONCILE, not CREATE.** Do NOT run `gh repo create`. This staged
> scaffold is now a **candidate** to compare against `terrafusion-os`'s existing governance root:
> where `terrafusion-os` already has an equivalent file, that staged file is **superseded/no-op**;
> only genuine gaps justify a **narrow docs/governance-only patch** into `terrafusion-os`.
> See **`../WO-LOOP-44R-RECONCILE.md`** for the procedure + file-by-file comparison checklist.
>
> **Corrected lock model:** Lock B is **SATISFIED (repo exists) — pending content verification**
> (`terrafusion-os` is not readable from this session's scope). Lock A remains **CLOSED**
> (WO-CORE-1 not released). Execution stays **BLOCKED** on Lock A regardless.

> **This directory is INERT staging inside the SOURCE repo (`terrafusion_os_1.0`).**
> It is NOT a repo. It holds the WO-LOOP-44 governance scaffold, laid out so its **contents map
> 1:1 to a receiving-vessel repo root** — now reconciled against existing `terrafusion-os`.

## Why it lives here
WO-LOOP-44 directed provisioning of `TerraFusionOS`. The session agent attempted
`create_repository` and received **HTTP 403 "Resource not accessible by integration"** —
the integration token is scoped to `bsvalues/terrafusion_os_1.0` and cannot create repos.
Repo creation is an **owner-only action**. So the scaffold is staged here, durable and
transplant-ready, until the owner provisions the empty repo.

## Lock state (corrected at Loop 45)
- **Lock A (execution release):** CLOSED. WO-CORE-1 not released.
- **Lock B (receiving repo provisioned):** **SATISFIED — repo exists as `bsvalues/terrafusion-os`**;
  content parity **pending verification** (repo not readable from this session's scope).
- Execution stays **BLOCKED** on Lock A regardless of Lock B.

## Reconciliation steps (corrected — NO repo creation)
1. **Do NOT create a repo.** Use existing `bsvalues/terrafusion-os`.
2. In a session/checkout scoped to `terrafusion-os`, compare its root against this staged scaffold
   using the file-by-file checklist in `../WO-LOOP-44R-RECONCILE.md`.
3. For each staged file: classify **duplicate** (no-op), **supersede** (terrafusion-os wins, drop staged), or **gap** (candidate patch).
4. For genuine gaps only: propose a **narrow docs/governance-only** patch into `terrafusion-os` via a Work Order. No runtime, no `backend/`/`frontend/`/`os-platform/`.
5. Run `terrafusion-os`'s own validation gates.
6. Lock B is already satisfied by the repo's existence; this step only verifies governance-content parity. Lock A stays closed until a separate explicit WO-CORE-1 release.

> ### Original (SUPERSEDED) provisioning steps — kept for record only
> ~~1. Create an empty private repo named `TerraFusionOS`...~~ — **VOID.** Repo already exists as
> `terrafusion-os`; creating `TerraFusionOS` would be a duplicate/second repo. Do not do this.

## What this scaffold is NOT
No runtime code. No `backend/` `frontend/` `os-platform/`. No package/build/CI files.
No PACS / county SQL / county data / secrets. WO-CORE-1 remains unreleased.
