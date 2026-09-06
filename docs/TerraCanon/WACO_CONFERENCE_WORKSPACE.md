# WACO 2026 TerraCanon conference workspace

This is the smallest TerraCanon product slice for the WACO conference path. It
defines one deterministic cold-open order in
`frontend/apps/os-shell/src/config/conferenceWorkspace.json`:

1. TerraFusion Shell
2. Counties HUB
3. SalesForge
4. TerraCanon

The manifest is deliberately local-only. It is a launch contract and a
curation artifact; it does not claim that the real TerraFusion backend, county
data, or SalesForge runtime have passed the separate Lane B offline acceptance.

## Validate the slice

From the repository root:

```text
node tools/canon/canon.mjs conference
node tools/canon/canon.mjs conference --json
```

The command is read-only. It validates the schema, rejects duplicate views and
external routes, and prints the deterministic module/route order. No network
request is made by this command.

The UI-side contract is covered by:

```text
cd frontend
npm test -- --run apps/os-shell/src/config/__tests__/conferenceWorkspace.test.ts
```

## What remains open

This slice does not close WO-105 or Lane B. The conference acceptance still
needs a real offline TerraFusion runtime: cold start, real Shell/Counties HUB,
real county data, SalesForge, reset, and repeat while disconnected. The Canon
manifest is supporting packaging/curation evidence only.
