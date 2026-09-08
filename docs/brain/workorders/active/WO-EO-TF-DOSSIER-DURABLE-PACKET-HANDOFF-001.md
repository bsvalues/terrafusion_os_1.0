Work Order: WO-EO-TF-DOSSIER-DURABLE-PACKET-HANDOFF-001
Owner EO: EO-TF-DOSSIER-DURABLE-PACKET-HANDOFF-001
Status: IMPLEMENTING; protected suite staged, focused backend/process18/18 and UI40/40 passed. Integrated OS/browser acceptance and protected delivery pending.
Base: ed442c84b916cb7a667cc162236dc9dae0b1b39b; branch codex/eo-dossier-os-001.
Coordinator owns review, protected lifecycle, shared registration and environment release.

## Protected adoption identity

Suite PR8 protected main commit: 8f58a6b989641a6fde063afa3dda68bd18062c63. Exact Git commit and all four source/spec blobs verified; no local candidate identity substituted.
Portable aggregate SHA-256: d4f29a599c96499f567c065274127b5c6943955b6366bd5959166ac5abf55c01.
Exact suite EO/spec artifact: operations/work-orders/EO-TF-DOSSIER-DURABLE-PACKET-HANDOFF-001.md, 10579 bytes, fc3b630e41cb26c86f946cb0ca9b14e4b00084ae9844f632b6120627d2c15723.
All three transitive modules retain suite paths in .terrafusion/runtime/dossier/packet-workflow; generated manifest is 928 bytes, SHA-256 25f1a91faef5ad1867c058fc57795016ba20fdd090fb596c43255fa637bd159c.
Bounded Stage-DossierPacketWorkflowModule.ps1 uses the existing bootstrap/owned-slot seam. Actual local staging, candidate-tamper refusal and post-publish rollback to identical prior bytes passed. No application runtime enabled by staging.
New exchange transport remains API-owned DTO/private process JSON; no duplicate Abstractions class, frozen corpus or shared manifest change is required by current classification. Shared freeze remains coordinator-held. Below is the identical approved suite specification, not an OS rule implementation.

<!-- prettier-ignore-start -->

# Dossier packet workflow exchange specification 1.0.0

Authority: owner's EO-TF-DOSSIER-DURABLE-PACKET-HANDOFF-001; coordinator contract-authority.md and reservations.md (2026-09-07). This is the approved new capability specification, not protected-source or contract-mirror evidence. Carry verbatim into reserved OS WO-EO-TF-DOSSIER-DURABLE-PACKET-HANDOFF-001.md after checkout readiness. Frozen exchanges unchanged.

## Requests

All objects have closed fields. JSON strings are preserved except canonical evidence ordering. IDs below are nonempty UUID strings; countyId comparisons are exact canonical lower-case UUIDs. Hashes/revisions are lower-case 64-hex SHA-256 supplied by OS. TaxYear integer 1900..2200. Actor/trace/command identifiers nonblank strings, maximum 200 characters; parcelId nonblank maximum 50. Timestamps are valid UTC RFC3339 instants supplied by OS. No suite I/O/ID/time/hash allocation.

Common required keys: `schemaVersion` (literal `1.0.0`), `contractId`, `operation`, `commandId`, `countyId`, `taxYear`, `parcelId`, `actorId`, `effectiveAt`, `expectedRevision`, `traceId`, `hostAssertions`, `packet`, `template`, `currentDocuments`, `narrative`, `evidence`, `provenance`.

- `hostAssertions`: actorAuthorized, countyExists, parcelExists, piiApproved (all boolean true).
- `packet`: packetId, countyId, taxYear, parcelId, packetType, name, status (`draft|complete|sealed`), revision. packetType/name nonblank, max50/200 respectively.
- `template`: packetType, name, requiredDocumentTypes. Exactly the existing createPacket template semantics, nonempty requirement list for finalization.
- `currentDocuments`: existing createPacket document snapshots: documentId, countyId, parcelId, documentType, status (`active|sealed|archived`), uploadedAt; additionally taxYear, revision, contentHash for exact scoped evidence identity. Unique documentIds; maximum1000 records.
- `narrative`: content (string, max16000 characters), revision, contentHash. Empty content is a typed readiness blocker, not an input-shape failure.
- `evidence`: array(max1000) of { evidenceId, documentId? , revision, contentHash, countyId, taxYear, parcelId }; unique evidenceIds. A documentId must resolve to a nonarchived supplied document of identical scope/contentHash. Empty evidence is a typed readiness blocker.
- `provenance`: suiteCommit (40 lower-case hex), artifactSha256 (64 lower-case hex), contractVersion (`1.0.0`), traceId (matches request traceId). This attests only supplied provenance; OS independently verifies protected identity at staging/invocation and never accepts browser-provided provenance.

Packet revision hashes the OS canonical source serialization of packet scope/type/name, template, selected/current document metadata including state/revision/hash, narrative and evidence; excludes packet workflow status, operational timestamps and finalization/handoff/link receipt IDs so committing a seal does not invalidate itself. Reads/commands recapture sources within one transaction. Source modifications, including same-count swaps, change revision. Suite also compares full canonical snapshot to persisted finalization so reusing a claimed revision cannot hide changed source references.

Finalization contractId=`dossier.packet-finalization`; operation=`evaluate|finalize|revise`. Optional `finalization` is the persisted seal described below; `finalizationId` required for finalize, absent otherwise; `revisionReason` required for revise (nonblank max2000), absent otherwise. Revise reopens only an existing sealed packet and returns draft; it does not rewrite old finalization. A draft with an old seal is not handoff eligible.

Handoff contractId=`dossier.appeal-handoff`; operation=`prepare`. Additional required `handoffId`; optional `finalization` to allow typed NONFINALIZED refusal when missing. No finalizationId/revisionReason request fields.

## Decisions

Every result: schemaVersion, contractId, commandId, countyId, taxYear, parcelId, packetId, traceId, decision (`accepted|rejected`), status (`draft|complete|sealed|stale|prepared|failed`), violations ([{code,message}]). Only accepted finalization results may contain `snapshot`; only accepted handoff contains `handoff`; accepted evaluate/revise may contain `readiness` with completenessPercent/satisfiedCount/totalRequired/items. Rejected results never carry an authoritative snapshot/handoff. Malformed identity fields are omitted from rejection instead of echoed with wrong types.

Validation ordering: malformed/unknown/version input -> INVALID_INPUT; host assertions -> HOST_ASSERTION_FAILED; source/template identity -> IDENTITY_MISMATCH; expectedRevision mismatch -> STALE_REVISION; incomplete canonical template -> INCOMPLETE_PACKET; blank narrative -> MISSING_NARRATIVE; no evidence -> MISSING_EVIDENCE. Invalid/missing evidence links -> INVALID_EVIDENCE. Missing seal/draft current packet -> NONFINALIZED; differing persisted seal scope -> IDENTITY_MISMATCH; differing exact revision or snapshot sources -> STALE_FINALIZATION. Complete inputs only seal. Evaluate reports completeness/readiness and existing valid seal. Revise requires sealed packet and reason, expectedRevision current; returns draft, retaining prior record outside suite.

`snapshot` (persisted immutable finalization): schemaVersion=`1.0.0`, contractId=`dossier.packet-finalization`, finalizationId, countyId, taxYear, parcelId, packetId, packetType, name, packetRevision, status=`sealed`, finalizedAt, finalizedBy, narrative, evidence, items (exact accepted existing createPacket selection), template, currentDocuments, provenance. `template` retains all request template fields with requiredDocumentTypes in supplied order. `currentDocuments` retains every supplied document (including unselected/archived records) with all request document fields, sorted by ordinal documentId. Both are detached canonical objects, independent of input property order. Freshness compares these complete source snapshots as well as narrative/evidence/items, not merely selection IDs or the claimed packet revision. UTC timestamps admit zero to seven fractional digits; ordering compares whole seconds and the fraction padded to seven digits without millisecond truncation. Equivalent fractional widths compare equal. Finalization compares supplied prior snapshot if present; exact finalization retry with same id must match its stored source and metadata; changed commands are not idempotent. OS requestId/hash lookup owns exact retry receipt retrieval before allocating new IDs/time.

`handoff` (sole Dais envelope, same fields as initial approved report): schemaVersion=`1.0.0`, contractId=`dossier.appeal-handoff`, handoffId, countyId, taxYear, parcelId, packetId, packetType, packetRevision, finalizationId, finalizedAt, finalizedBy, narrative, evidence, preparedAt, preparedBy, provenance. Evidence order ascending evidenceId using ordinal comparison, no locale-dependent order. Nested data is detached from caller objects. Envelope uses persisted seal narrative/evidence and current request's verified provenance. Source scope/revision and full canonical content must match. No appeal write fields in requests/results.

## Integration

Suite exports `decideDossierPacketFinalization(request)` and `decideDossierAppealHandoff(request)`. Shared pure validation/snapshot helper exports may live in packet-finalization module; handoff imports it. Existing createPacket judgment imported from unchanged mutation-decision module. OS stage all required modules by exact protected commit/hash and use existing constrained Node process pattern. Do not duplicate semantic rules in OS.

Dais reads durable handoff via proposed Dossier-owned GetPreparedHandoffAsync(countyId,taxYear,parcelId,handoffId,expectedPacketRevision), then links existing scoped appeal using LinkAppealAsync(countyId,taxYear,parcelId,handoffId,expectedPacketRevision,appealId,requestId). Durable content hash wraps serialized envelope; no self-hashing field. Exact protected Dossier identity binds final adoption; proposed/synthetic provenance is never proof of protection.

## TDD examples

Synthetic only: complete one-required-document packet with matching evidence/narrative seals exact revision; missing requirements/narrative/evidence do not seal; wrong scope and unknown cross-suite fields reject; swapped evidence ID/hash with same count and same supplied revision invalidates old seal; revised draft refuses handoff; canonical order and fixed host IDs/time/provenance produce identical serialized envelope. Immutable input and output isolation tested. Persistence/browser proof remains required after suite/OS protection.

<!-- prettier-ignore-end -->
