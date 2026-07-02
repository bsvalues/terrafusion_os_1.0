# WO-TERRAPILOT-P3-P6 - Tool Maturity Evidence

**Program:** P5 - TerraPilot Tool Maturity
**Date:** 2026-07-02
**Mode:** Governance/evidence. No runtime change, no backend integration, no tool promotion.
**Sources:** `tools/registry/terrapilot.tools.json`, `os-platform/core/pilot/handlers.ts`,
`os-platform/core/pilot/handlers.real.ts`, and current P5 program canon.

## WO-TERRAPILOT-P3 - Maturity Metadata Enforcement Review

Current state:

- `tools/registry/tool-maturity.json` does not exist.
- `tools/registry/TOOL_PROMOTION_POLICY.md` does not exist.
- `os-platform/core/pilot/tool-promotion.test.mjs` does not exist.
- `os-platform/core/pilot/TOOL_MATURITY.md` does not exist.

Conclusion:

TerraPilot has a manifest and handler registry, but it does not yet have a dedicated
machine-readable maturity metadata file or focused promotion enforcement test. This PR does not add
runtime enforcement because the current work order is governance/evidence only. The safe next
implementation slice is a separate metadata-enforcement WO that adds exact maturity fields and tests
without promoting tools.

## WO-TERRAPILOT-P4 - Stub-to-Live Promotion Candidate Queue

Candidate selection criteria:

- `read_only` risk preferred.
- Existing real handler registration preferred.
- Existing backend/API target preferred.
- No write lane, schema migration, deployment, secret, PACS, county SQL, county data, or live DB access.
- No LLM/Muse dependency for the first promotion if a non-Muse read-only candidate exists.

Candidate queue:

| Candidate | Current evidence | Promotion blockers |
|-----------|------------------|--------------------|
| `summarize_levy_rate_components` | Manifest-declared read-only tool with real handler registration. | Needs live backend probe, auth boundary, trace evidence, and operator approval. |
| `compare_assessed_value_history` | Manifest-declared read-only tool with real handler registration. | Needs backing endpoint proof, auth boundary, trace evidence, and operator approval. |
| `summarize_parcel_casefile` | Manifest-declared read-only tool with real handler registration. | Needs Dossier backing-service proof, auth boundary, trace evidence, and operator approval. |
| `calculate_pilt_payment` | Manifest-declared read-only tool with real handler registration. | Needs PILT backing-service proof, auth boundary, trace evidence, and operator approval. |
| `explain_model_results` | Manifest-declared read-only Muse tool with real handler registration. | Requires live backend proof and may require LLM/key decision if narration depends on Muse. |

No candidate is promoted by this evidence packet.

## WO-TERRAPILOT-P5 - Handler / Manifest / Maturity Parity Evidence

Read-only count script:

```powershell
node -e "const fs=require('fs'); const m=JSON.parse(fs.readFileSync('tools/registry/terrapilot.tools.json','utf8')); const ids=new Set(m.tools.map(t=>t.toolId)); const regs=f=>[...fs.readFileSync(f,'utf8').matchAll(/registerHandler\\(\\s*['\\\"]([^'\\\"]+)['\\\"]/g)].map(x=>x[1]); const stub=new Set(regs('os-platform/core/pilot/handlers.ts')); const real=new Set(regs('os-platform/core/pilot/handlers.real.ts')); const union=new Set([...stub,...real]); console.log({manifest:ids.size, stub:stub.size, real:real.size, union:union.size, missing:[...ids].filter(id=>!union.has(id))});"
```

Observed results:

| Metric | Count |
|--------|-------|
| Manifest-declared tools | 117 |
| Stub handler registrations | 80 |
| Real handler registrations | 54 |
| Union handled tools | 117 |
| Missing handlers | 0 |
| Stub-only tools | 63 |

Manifest risk distribution:

| Risk | Count |
|------|-------|
| `read_only` | 74 |
| `write_low` | 31 |
| `write_high` | 11 |
| `irreversible` | 1 |

Mode distribution:

| Mode | Count |
|------|-------|
| `pilot` | 90 |
| `muse` | 27 |

Conclusion:

Handler parity is complete at the manifest/handler level. The maturity gap is not missing handlers;
it is the lack of explicit maturity metadata, live-probe evidence, and operator-approved promotion
records.

## WO-TERRAPILOT-P6 - Tooling Operator Packet

Operator rules for future P5 work:

1. Treat manifest validation as registration proof only.
2. Treat handler parity as runnable/stub proof only unless live evidence exists.
3. Do not mark a tool `backend-integrated` without backing service evidence and validation output.
4. Do not mark a tool `promoted` without operator approval, date, owner, rollback path, and UI
   disclosure update.
5. Prefer read-only, non-Muse, low-blast-radius candidates for the first promotion.
6. Stop before any work requiring runtime behavior, deployment, secrets, PACS, county SQL, county
   data, live DB, or schema migration authority.

## Stop Walls Respected

| Wall | Status |
|------|--------|
| Runtime behavior | Not crossed |
| Backend integration | Not implemented |
| Deployment | Not touched |
| Secrets/credentials | Not touched |
| PACS/county SQL/county data/live DB | Not touched |
| Schema migration/data mutation | Not touched |
| Tool promotion | Not performed |
