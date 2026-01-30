# Suite Boundaries + Write Lanes (v3.1)

## 1. Missions (locked)
- TerraForge: build value (valuation artifacts)
- TerraAtlas: see the county (GIS artifacts)
- TerraDais: operate value (assessor workflows)
- TerraDossier: prove the decision (evidence + narratives + packets)
- OS Core: identity, routing, flags, trace, settings
- TerraPilot: tool routing (writes only through owning lane services)

---

## 2. Write-Lane Matrix (authoritative)

| Domain Fact / Artifact | Write Owner | Notes |
|---|---|---|
| Parcel identity projections (PIN, situs, owner snapshot view) | OS Core (projection) | source-of-truth may live in CAMA lane |
| Parcel characteristics (CAMA attributes) | Forge (or dedicated CAMA service) | single writer |
| Valuation artifacts (model outputs, comps, breakdowns) | Forge | Dais/Dossier consume read-only |
| GIS artifacts (boundaries, notes, layer prefs, bookmarks) | Atlas | no admin workflow writes |
| Permits + status | Dais | includes lifecycle + inspections |
| Exemptions + decisions | Dais | senior/disabled, renewals, docs |
| Appeals + deadlines | Dais | BOE workflow state |
| Notices (draft, queue, delivery status) | Dais | published notice is artifact |
| Roll certification checklist + sign-offs | Dais | policy-gated, high-risk |
| Evidence docs, narratives, packets | Dossier | includes Muse drafts if saved |
| Unified activity trail | TerraTrace (OS core) | append-only |
| TerraPilot profile/preferences | OS core store | county-scoped |

Rule: cross-lane writes occur only via owning services + TerraTrace.

---

## 3. Does-NOT-own Guardrails
- Dais does not own valuation modeling or write valuation artifacts.
- Atlas does not own admin workflow state.
- Forge does not own admin workflow state.
- Dossier does not initiate workflows; it records/assembles outcomes.
- Pilot does not bypass write lanes; it routes tool calls.

---

## 4. Reserved Future Office Lanes
- TerraClerk
- TerraTreasury
- TerraAudit
- TerraRecorder (optional)

---

## 5. Success Criteria
- Ownership decision is deterministic in <5 seconds.
- No duplicated writers.
