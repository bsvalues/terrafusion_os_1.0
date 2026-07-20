# WO-DOSSIER-X-001 — Dossier Implementation Inventory (source-side, on sovereign base)

> Dossier inventory. **Inventory + disposition only** — no code moved, no repo, no credential.
> Resolutions flagged for **WO-DOSSIER-X-002**.

**Date:** 2026-06-25 · **Source of truth:** `origin/main` @ `2ae013561` · **Contracts:** consumes `canonical.parcel`/`crosscut.audit`/`shared.envelopes` @ `v1.0.0`
**Dispositions:** `RETAIN_IN_OS · EXTRACT_EXACT · REWRITE_FOR_SUITE · SHARE_AS_CONTRACT · MINE_PATTERN · DEFER · REJECT`

## 0. Two load-bearing findings
1. **CORRECTION — Dossier is NOT the thinnest suite.** The Loop 47 "1 file" figure counted only
   `pages/dossier/` (PacketAssembly). The **real Dossier is dispersed but substantial**: a coherent
   backend domain (6 entities incl. **chain-of-custody `DossierCustodyEvent`** — legally significant) +
   `DossierController` + a scattered-but-real frontend (`components/dossier/` ×7, `services/suites/
   dossier*` ×5, hooks, `pages/suites` Dossier modules, Workbench tab) + real tests (Cx22–25, PropertyDossier,
   narrative/finalization/appeal-handoff contract tests). No theater.
2. **"Evidence" is overloaded across 4 senses** (like "Atlas" across 3) — only one is Dossier:
   - **Dossier product-evidence** (parcel/case): `DossierEvidence/Packet/Document/Note/Custody`, `ParcelEvidencePacket`, `packetComposition`, `EvidenceModule`. → **EXTRACT**.
   - **OS/Sync corpus/data-quality evidence:** `Data/Services/Workbench/{EvidencePacketService,Corpus/CorpusEvidencePacketService}`, `Core/Sync/{Workbench/IEvidencePacketService,Corpus/ICorpusEvidencePacketService}`, `DictionaryLoaderPreflightEvidence`. → **RETAIN_IN_OS/Sync**.
   - **Pilot evidence-rail:** `components/pilot/EvidenceRail`. → **RETAIN_IN_OS (Pilot)**.
   - **Canon governance-evidence:** `canon/CanonEvidenceViewer`. → **RETAIN_IN_OS (governance)**.

## 1. Backend inventory
| Source path | Capability | Disposition | Dep | Tests |
|---|---|---|---|---|
| `Core/Entities/{DossierDocument,DossierEvidence,DossierPacket,DossierPacketItem,DossierNote,DossierCustodyEvent}` | evidence/document/packet + **chain-of-custody** | **REWRITE_FOR_SUITE** → DossierDbContext (EF-coupled, mirror pattern) | canonical.parcel, crosscut.audit | Cx22–25 |
| `Core/Entities/RevalAreaEvidenceAge` (+ `Data/Configurations/RevalAreaEvidenceAgeConfiguration`) | reval evidence age | **DEFER** (reval = Forge/Dais adjacency?) | — | — |
| `API/Controllers/DossierController.cs` | Dossier HTTP surface | **EXTRACT_EXACT** (controller-cut) | canonical.parcel, crosscut.audit | AtlasDossierControllerGuards |
| `API/DTOs/ParcelDossierDetailsDto`, `Core/DTOs/ParcelDossierDto`, `API/DTOs/EvidenceSnapshotDto` | Dossier DTOs | **SHARE_AS_CONTRACT** → new `dossier.evidence` contract (GAP, see §4) | — | Cx23/25 |
| `Data/Services/Workbench/{EvidencePacketService,Corpus/CorpusEvidencePacketService}` + `Core/Sync/*IEvidence*`, `DictionaryLoaderPreflightEvidence` | **corpus/sync evidence** (data-quality) | **RETAIN_IN_OS/Sync** | — | EvidencePacketServiceTests |
| `API/Controllers/BentonLevyPacketFallback.cs` | Levy packet fallback | **RETAIN_IN_OS / DEFER** (Dais↔Dossier boundary) | — | — |

## 2. Frontend inventory (dispersed)
| Path | Disposition | Notes |
|---|---|---|
| `pages/dossier/PacketAssembly.tsx` · `components/dossier/{PacketProvenance,PacketFinalizationPanel,PacketAppealHandoffPanel,DossierEvidenceDraftPanel,PacketNarrativeEditor,ParcelEvidencePacket}` | **EXTRACT to Dossier** | the real Dossier UI (7+ components) |
| `services/{dossierService, suites/dossierService, suites/dossierNarrative, suites/dossierPacketFinalization, suites/dossierAppealHandoff, suites/packetComposition, badges/dossierBadgeProvider}` · `hooks/useDossierDetails` · `contracts/dossierDetails.ts` | **EXTRACT to Dossier** | services/hooks/contract |
| `pages/suites/DossierSuiteHome` + `pages/suites/modules/{DefensePacketsModule,DocumentsModule,EvidenceModule}` | **EXTRACT to Dossier** | suite home + modules |
| `pages/workbench/tabs/PropertyDossier.tsx` | **RETAIN_IN_OS** (Workbench Tier-0 host) | renders Dossier via contract |
| `components/workbench/EvidenceSnapshotPanel` + `hooks/useEvidenceSnapshot` | **DEFER** (Dossier vs Workbench) | parcel-evidence snapshot rendered in Workbench |
| `components/pilot/EvidenceRail` · `canon/CanonEvidenceViewer` | **RETAIN_IN_OS** (Pilot / governance) | not Dossier |

## 3. Ownership line
```text
Dossier owns:  parcel/case evidence + documents + packets + narratives + chain-of-custody
               (DossierEvidence/Document/Packet/Note/CustodyEvent) — persisted in DossierDbContext;
               PRODUCES a dossier.evidence contract.
OS/Sync owns:  corpus/data-quality/sync evidence (EvidencePacketService, DictionaryLoaderPreflight).
Not Dossier:   Pilot evidence-rail, canon governance-evidence, Workbench Dossier tab host.
```

## 4. Contracts + a contract GAP
- **Consumes:** `canonical.parcel@1.0.0` (parcel refs), `crosscut.audit@1.0.0` (custody events → audit), `shared.envelopes`.
- **GAP → new contract needed:** **`dossier.evidence`** (`ParcelDossierDto`, `ParcelDossierDetailsDto`,
  `EvidenceSnapshotDto`, packet/custody DTOs) is **not frozen** in the Abstractions seam. → new
  WO-SR-002 increment (freeze `dossier.evidence@1.0.0`) before Dossier cutover. *(Second gap after `levy.projection`.)*
- **Feeders (out-of-session):** none flagged in placement map (Dossier is monorepo-native).

## 5. Cross-suite boundaries (flag for X-002)
- **Dais ↔ Dossier:** `DefensePacket` appears in both (Dais `pages/dais/DefensePacket` + Dossier
  `DefensePacketsModule` + `dossierAppealHandoff`); `BentonLevyPacketFallback`. → defense/appeal packets
  are **Dossier product-evidence consumed in the Dais appeals workflow** — Dossier owns, Dais consumes via contract.
- **Atlas ↔ Dossier:** `AtlasDossierControllerGuardsTests` — confirm no shared ownership.
- **`EvidenceSnapshotPanel` ownership** — Dossier evidence vs Workbench surface.
- **`RevalAreaEvidenceAge`** — reval-cycle evidence: Dossier vs Forge/Dais adjacency.

## 6. Flagged for WO-DOSSIER-X-002
1. Freeze `dossier.evidence` contract (+ align with `canonical.parcel`).
2. DossierDbContext carve (per-entity: which are Dossier-authored vs shared).
3. Dais↔Dossier packet boundary (Dossier owns, Dais consumes).
4. EvidenceSnapshotPanel + RevalAreaEvidenceAge ownership.
5. Confirm corpus/sync evidence stays OS/Sync (not dragged into Dossier).

## 7. Proven vs unverifiable
- **Proven:** real backend evidence domain (6 entities + chain-of-custody), DossierController, dispersed-but-real frontend, tests (Cx22–25 + contract tests).
- **Corrected:** NOT thinnest — moderately built, just scattered outside `pages/dossier/`.
- **Unverifiable in-session:** build/test greenness (no `dotnet`).

## 8. Status
**WO-DOSSIER-X-001 COMPLETE.** Corrected the "thinnest" mischaracterization; disentangled the 4-way
"evidence" overload (Dossier product-evidence vs OS/Sync corpus vs Pilot rail vs canon). Crux: a **missing
`dossier.evidence` contract** + the Dais↔Dossier packet boundary. Next: **WO-DOSSIER-X-002** (freeze
`dossier.evidence`, DossierDbContext carve, boundary resolution). Extraction gated on the Dossier repo.
No code moved.
