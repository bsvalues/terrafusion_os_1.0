# LocalOps Doctrine

> **Status:** PLANNING ONLY — doctrine for a not-yet-implemented capability.
> **Authority:** Subordinate to the TerraFusion Constitution (TF-052) and the Brain. This doc governs
> the LocalOps lane; it does not amend constitution or create a second brain.

## 1. Mission

TerraPilot **LocalOps Mode** is **Benton County server survival infrastructure**: a local,
county-boundary-safe AI operator inside the TerraFusion shell that helps a human operator keep the
county's TerraFusion deployment healthy **when external AI tools are unavailable, blocked, or
prohibited**.

It exists for the bad day: the network is restricted, the cloud is off-limits by policy, the usual
copilots are unreachable — and an operator still needs grounded help reading logs, understanding a
failing service, and finding the right runbook step. LocalOps is the floor that does not disappear.

This is **not** demo AI, **not** a chatbot, and **not** an autonomous fixer.

## 2. What LocalOps IS

- **Inside the shell.** LocalOps is a TerraPilot mode, rendered inside the TerraFusion shell. It is
  **not** a standalone application and has no separate window manager, routing, or chrome.
- **Local-first.** Its default operating posture uses local providers (e.g. an on-prem model) and
  local knowledge. The cloud is never a silent default.
- **Source-grounded.** Every substantive answer cites the artifact it is grounded in (a log line, a
  runbook step, a doc). Ungrounded generation is not acceptable for operational guidance.
- **Trace-emitting.** Every LocalOps action emits a TerraTrace event (append-only) per the trace pack.
- **Read-only diagnostic (v1).** v1 observes and explains. It reads logs, status, and config; it does
  not change them.
- **Human-approved before mutation.** Any state change is proposed, shown with intent and risk, and
  executed only after explicit human approval through an approved TerraPilot tool.

## 3. What LocalOps IS NOT — hard prohibitions

These are categorical. An implementation work order that needs any of these is **out of scope** and
requires its own human-approved constitutional discussion.

1. **No silent cloud fallback.** If local AI is unavailable or prohibited, LocalOps stays local and
   says so. It never quietly routes prompts or data to an external service.
2. **No unrestricted shell.** Command execution is confined to a controlled, reviewed command
   registry. No arbitrary shell, no "just run this for me."
3. **No autonomous production repair.** LocalOps does not self-direct changes to production. It
   diagnoses and proposes; a human decides.
4. **No property-record mutation by AI.** The AI never writes parcel/property records.
5. **No valuation mutation by AI.** The AI never writes valuation artifacts (Forge's lane).
6. **No county document indexing without approval rules.** Building a local knowledge base over county
   documents requires explicit, documented approval rules (what may be indexed, retention, access).
   No silent ingestion of county data.
7. **No PII in trace payloads.** Per the TerraPilot spec, PII is sanitized/stored-by-reference; the
   trail holds only safe projections.

## 4. Risk classes (inherited from TerraPilot)

LocalOps tools declare a `risk` exactly as TerraPilot does
(`docs/architecture/specs/terrafusion/02_TERRAPILOT_SPEC_v3.1.md` §2):

| Risk | Meaning | Default policy |
|------|---------|----------------|
| `read_only` | observe / explain (all of v1) | no confirmation required |
| `write_low` | local, reversible drafts/notes | confirmation optional |
| `write_high` | operational state changes | **confirmation + reason required** |
| `irreversible` | destructive / production / external | **confirmation + reason + supervisor** |

County policy may **tighten** these, never loosen them. **LocalOps v1 ships only `read_only` tools.**
Anything above `read_only` is a later, separately-approved work order.

## 5. County-boundary safety (Benton)

- **Data stays in the county boundary by default.** No county data leaves the boundary without an
  explicit, documented, human-approved path.
- **Sovereign County isolation** applies: anything county-scoped is filtered by `CountyId`.
- **FISMA-HIGH is a posture target, not a current accreditation** — LocalOps must not claim
  compliance it does not have, and its prohibitions are written to be safe under that posture.
- **Harris PACS is a source, not a target.** LocalOps never writes to PACS or to TerraFusion property
  records; at most it reads status/health.

## 6. Relationship to the Brain packs

| Concern | Pack | LocalOps obligation |
|---------|------|---------------------|
| AI acting through tools | [`gpt`](../../brain/packs/gpt/README.md) | LocalOps acts **only** through approved TerraPilot tools; never direct suite writes. |
| The trail | [`trace`](../../brain/packs/trace/README.md) | Emit append-only events; never treat trace as mutable state. |
| In-shell hosting | [`shell`](../../brain/packs/shell/README.md) | Render inside the shell; no standalone app, no route escape. |
| The lane itself | [`localops`](../../brain/packs/localops/README.md) | This doctrine is the long form of that pack's rules. |

## 7. Escalation triggers (stop and ask a human)

- Any proposal to add a mutation capability (v1 is read-only).
- Any cloud-fallback or external-egress path.
- Any expansion of the controlled command registry's reach.
- Any indexing of county documents.
- Any conflict between this doctrine and the constitution or a domain pack.

## 8. Definition of "done" for the doctrine

This doctrine is satisfied when every downstream LocalOps work order can point to a rule here that
governs it, and no implementation can be justified that violates §3. If an implementation needs an
exception, the exception is a constitutional decision, not an engineering choice.
