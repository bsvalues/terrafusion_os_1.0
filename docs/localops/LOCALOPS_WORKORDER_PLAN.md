# LocalOps Work-Order Plan — TF-LOCALOPS-001

Chain map: each work order, its real repo anchors (grounded in the 2026-06-09 recon), and its proof. Execute strictly in order via `pnpm brain next`; one WO per slice; land path-limited; stop. Full scope/limits live in each WO file under `docs/brain/workorders/active/`.

| WO | Slice | Risk | New code lane / anchors | Proof bar |
|----|-------|------|------------------------|-----------|
| 000 | Planning envelope (this doc set) | R1 | `docs/localops/**` only | brain check + review-diff PROCEED |
| 001 | AI profile config contract | R2 | NEW `os-platform/core/pilot/localops/{aiProfile,redact}.mjs` + `.env.template` block | profile invariant tests (localops cannot re-enable external); redaction test |
| 002 | Local provider abstraction | R3 | NEW `…/localops/providers/{provider,localHttpProvider,disabledProvider,policyGate}.mjs`; endpoint from `AI_BASE_URL`/`AI_MODEL` env | "localops + cloud provider → refusal" and "endpoint down → error, no fallback" tests |
| 003 | TerraTrace event adapter | R2 | NEW `…/localops/trace/{localOpsTraceAdapter,noopTraceSink}.mjs`; reuse `packages/os-core/src/services/trace/TerraTraceService.ts` shape; **`os-platform/core/trace/TraceStore.ts` FROZEN — forbidden pattern enforces adapter-only** | 7 `localops.*` event types; fail-closed under AI_REQUIRE_TRACE; redaction applied |
| 004 | Local KB / RAG interface | R2 | NEW `…/localops/kb/{localKb,sources}.mjs`; markdown retrieval over `docs/localops/**` + architecture docs; **no dependency on external RAG API (`VITE_RAG_API_URL`)** | hit-with-sources, honest miss, heading extraction tests; emits `localops.rag.retrieved` |
| 005 | Read-only diagnostics | R2 | NEW `…/localops/diagnostics/diagnostics.mjs`; reuse `os-platform/core/pilot/local-agent/status.ts` patterns | no mutating verbs (test-enforced); shell request → refusal; secret never in config summary |
| 006 | TerraPilot in-shell UI | **R4 — architect sign-off AT DISPATCH** | extend `frontend/apps/os-shell/src/components/pilot/` (TerraPilotPanel siblings); launch via `orchestration/moduleActivation.ts` + `config/moduleComponents.tsx`; **never hand-edit `generatedModules.ts`** | Ask/Explain/Diagnose/Runbook/Sources/Trace sections; profile+external-call status visible; token-police CLEAN; ui-honesty-pass; type-check; browser screenshot in-shell with dock visible |
| 007 | Benton runbooks | R1 | `docs/localops/{BENTON_SERVER_RUNBOOK,BENTON_AI_PROFILE,LOCALOPS_ACCEPTANCE_TEST}.md` | operator-runnable numbered steps; doubles as WO-004 KB corpus |
| 008 | Runtime proof harness | R2 | `docs/localops/LOCALOPS_RUNTIME_PROOF.md` | every checkbox backed by command + output; refusal payloads shown; go/no-go verdict |

## Dependency notes
- 001 is the root: 002 (policy gate), 003 (AI_REQUIRE_TRACE), 004 (AI_REQUIRE_SOURCES), 005 (redacted config) all consume the profile contract.
- 003's events are emitted by 002/004/005; build 003 before wiring those emissions or stub via the no-op sink.
- 006 renders what 002/004/005 expose; nothing in 006 may bypass the policy gate.
- 007's documents are 004's primary corpus — writing them completes the local answer path.
- 008 is the chain's done-definition; it runs everything and writes the final report.

## Environment realities to design against (from recon + June-10 gates)
- `service-registry.json` discovery exists but the moduleId↔key naming contract is undefined (D-017) — LocalOps UI must NOT depend on AppFrame native-app resolution; it extends the existing TerraPilot panel components directly.
- Unit.Tests compile can be broken by fleet WIP at any time — every WO's proof allows "tests written + run blocked, documented" only when the break is provably not ours, with a re-run obligation.
- The dev API auto-respawns (dev-os watcher) and holds DLL locks (D-001) — backend-touching slices plan builds accordingly (none in this chain after 001; the chain is os-platform + frontend + docs).
