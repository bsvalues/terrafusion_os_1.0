# Suite Repo Creation — RESULT: BLOCKED_MISSING_EXECUTION_CREDENTIAL

> All in-scope preparation is complete. Repo creation is **authorized operator work**; it is blocked
> **only** by a GitHub credential limitation — **not** an owner decision, owner-only implementation, or
> new scope. **No strategic decision remains. No owner engineering remains.**

**Date:** 2026-06-25 · **Attempted:** `POST /user/repos` (create `terrafusion-forge`) → `403 Resource not accessible by integration`

```text
RESULT: BLOCKED_MISSING_EXECUTION_CREDENTIAL
```

## Required capabilities (NOT a single fixed permission name)
The exact permission string depends on credential type; describe **capabilities**, then map:
```text
REQUIRED CAPABILITIES
- create private repositories in bsvalues
- initialize repository contents
- configure repository settings
- configure merge policy
- configure branch protection or rulesets
- create branches and pull requests
```
**Capability → credential mapping:**
| Credential type | Grant that satisfies the capabilities |
|---|---|
| **GitHub App** | `Administration: Read and write` (repo create/settings/protection) + `Contents: Read and write` (init) + `Pull requests: Read and write` — installed on org `bsvalues` |
| **Fine-grained PAT** | Resource owner `bsvalues`; **Repository permissions**: Administration RW, Contents RW, Pull requests RW; (org-level "create repo" allowed by org policy) |
| **Classic PAT** | scope `repo` (+ `admin:org` only if org restricts repo creation) |
| **Org connector** | a connector authorized to create repos in `bsvalues` and manage new-repo settings |

The current session integration token is scoped to **`bsvalues/terrafusion_os_1.0` only** → `403` on
repo creation, `access-denied` on any other repo. It lacks the create-repository capability under **any** mapping above.

## Exact repositories to create (5, private)
`bsvalues/terrafusion-forge` · `bsvalues/terrafusion-atlas` · `bsvalues/terrafusion-dais` ·
`bsvalues/terrafusion-dossier` · `bsvalues/terrafusion-gpt`

## Prepared creation manifest
`SUITE-REPO-CREATION-MANIFEST.json` (machine-executable): exact org, names, descriptions, private
visibility, default branch `main`, squash-only merge + delete-branch-on-merge, branch protection
(PR+1 review, no force-push, no deletion, enforce-admins, required checks
`suite-ci`/`contract-compat`/`governance-gate`), initial topics, initial files, owning suite,
shared-contract dependency, feeder provenance, rollback.

## Recommended least-privilege grant (one bounded platform action)
Either:
1. **Grant** a credential satisfying the **Required Capabilities** above (pick the row for your credential
   type), and add the 5 repos to this session's scope; **or**
2. **Execute** `SUITE-REPO-CREATION-MANIFEST.json` once via any authorized GitHub operator credential/connector.

## Confirmation
- **No strategic decision remains** — topology, base identity, suite names, boundaries, contracts,
  extraction policy, gates, WOs, bootstrap, and branch-protection are all prepared and ratified.
- The only human action is the **one bounded platform action** above.

## Post-creation automation (no owner relay)
On repos existing / scope granted, the operator will automatically: verify identity + settings →
apply bootstrap content (§6 of `SUITE-PROGRAM-AND-TOPOLOGY.md`) → open first bounded PRs → execute the
suite-repository program (WO-SR-004/005/006 → WO-FORGE-X-001…) → continue without owner relay.
