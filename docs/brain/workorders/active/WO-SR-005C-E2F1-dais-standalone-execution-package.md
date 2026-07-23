# WO-SR-005C-E2F1 - Dais Standalone E2+F1 Execution Package (Sovereign-Side Routing Handoff)

| Field | Value |
| --- | --- |
| Status | COMPLETE (sovereign-side package emitted + locally validated) |
| Program | Five-Suite Federated Repository Buildout |
| Risk | R1 sovereign-side routing/evidence (docs-only; no sovereign source, no contract artifact) |
| Dependency | `WO-SR-005C-E3` = `PASS_NO_DIRECT_EXTRACTION` (merged #1355, `6bfff78d`); `dais.appeal-workflow@1.0.0` frozen (PR #1350) |
| Authority | Owner five-suite bounded-extraction authorization (2026-07-23) + "Proceed with Dais now … E2 → F1" directive + `OWNER-TF-STANDING-OPERATOR-AUTHORITY` for `docs/brain/workorders/**` |
| Result | Turnkey E2+F1 package authored and validated locally (F1 tests 10/10; E2 verifier 3 positive / 6 negative PARITY OK; verifier tests 3/3; 9/9 fixture hashes match the freeze pins) |

## Why this is a sovereign-side package, not a terrafusion-dais commit

The owner's directive is to execute WO-SR-005C-E2 then WO-SR-005C-F1 **in** `bsvalues/terrafusion-dais`.
This session's tooling is hard-scoped and **provably cannot reach that repo** (re-verified at package time):

- GitHub MCP: `list_branches bsvalues/terrafusion-dais` → `Access denied: repository "bsvalues/terrafusion-dais" is not configured for this session. Allowed repositories: bsvalues/terrafusion_os_1.0`.
- Git proxy: push/fetch of the suite remote returns `could not read Password` (no credential bound for that origin).
- No `add_repo` / `list_repos` capability is present in this session (ToolSearch finds no such tool).

The established suite pattern (Atlas `WO-SR-005B-F1`) is: **suite code lands in the suite repo; the
sovereign repo carries the evidence.** So the honest maximum this scoped session can produce is the
complete, already-validated execution package plus routing — which a dais-capable context (or this
session, once `terrafusion-dais` is added to its allowed-repos scope) runs mechanically. Nothing here
writes the suite repo, adopts a runtime, or transfers contract ownership.

## Objective

Deliver, in one sovereign-side evidence artifact, everything needed to execute the Dais E2 (hash-pinned
synthetic contract parity) and F1 (build-fresh provider-neutral read-only appeal-workflow projection)
slices in `bsvalues/terrafusion-dais`, strictly within the E3 allowlist:

- Full source of every allowlisted F1/E2 file (module, product tests, verifier, verifier tests, manifest, `CONTRACT_DEPENDENCY.md`).
- Fixture materialization by hash-pinned copy from the sovereign frozen blobs (no retyping), gated on the 9 pinned SHA-256s.
- The exact allowlist, the no-touch list, and the required 3-positive / 6-negative parity gate.
- Suite-repo WO card + evidence templates for `WO-SR-005C-E2` and `WO-SR-005C-F1`.

## Authorized Files (this sovereign WO)

- `docs/brain/workorders/active/WO-SR-005C-E2F1-dais-standalone-execution-package.md`
- `docs/brain/workorders/evidence/WO-SR-005C-E2F1-DAIS-STANDALONE-EXECUTION-PACKAGE.md`
- `docs/brain/workorders/registry/work-order-registry.seed.json`

## Explicitly Blocked

- Any write to `bsvalues/terrafusion-dais` or any external repo from this session.
- Any modification to the frozen `dais.appeal-workflow@1.0.0` DTO, schema, or fixtures.
- Any sovereign source, provider, PACS, persistence, county/SQL, credential, runtime, package,
  lockfile, workflow, deployment, or cutover change.
- Marking the suite-repo work done, or claiming runtime adoption / WO-SR-006 cutover.

## Validation (this WO, run locally in the authoring sandbox against the exact embedded sources)

- `node --test test/project-dais-appeal-workflow.test.mjs` → 10/10 pass.
- `node scripts/verify-dais-appeal-workflow.mjs` → 10 artifacts (schema pin + 9 fixtures), 3 positive / 6 negative, PARITY OK.
- `node --test scripts/verify-dais-appeal-workflow.test.mjs` → 3/3 pass.
- All 9 fixture SHA-256 equal the `contracts.freeze.json` pins.
- `git diff --check`; `node --test docs/brain/workorders/tools/wo-query.test.mjs` (12/12).

## Result

`PACKAGE_READY_FOR_DAIS_CAPABLE_EXECUTION`. The E2 and F1 slices are authored, wired to the exact E3
allowlist, and locally proven green. Execution in `bsvalues/terrafusion-dais` is a separate act by a
dais-capable context; this session cannot perform it under its current repo scope.

<!-- brain-machine-policy: brain review-diff reads the json block below -->
```json
{
  "id": "WO-SR-005C-E2F1",
  "task": "Emit and locally validate a turnkey E2+F1 execution package for bsvalues/terrafusion-dais; route via sovereign evidence because the session cannot write the suite repo",
  "risk": "R1",
  "suite": "Dais",
  "allowed_files": [
    "docs/brain/workorders/active/WO-SR-005C-E2F1-dais-standalone-execution-package.md",
    "docs/brain/workorders/evidence/WO-SR-005C-E2F1-DAIS-STANDALONE-EXECUTION-PACKAGE.md",
    "docs/brain/workorders/registry/work-order-registry.seed.json"
  ],
  "forbidden_patterns": [
    ".governance/**",
    "backend/**",
    "frontend/**",
    "os-platform/**",
    "tools/**",
    "packages/**",
    ".github/workflows/**",
    "deployment/**",
    "package.json",
    "**/pnpm-lock.yaml"
  ],
  "required_proof": [
    "git diff --check",
    "node --test docs/brain/workorders/tools/wo-query.test.mjs"
  ]
}
```
