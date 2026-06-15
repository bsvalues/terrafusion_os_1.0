# TerraFusion — Assessor Modernization Asset

### Exclusive field-of-use license opportunity for CAMA / assessment vendors

---

**What this is.** A **transition-safe assessor-modernization asset** — built first to reduce
the risk of taking a county off a legacy system, and second to modernize it. Underneath that
risk-reduction posture sit a provenance/continuity layer, an administrative
workflow-persistence model (TerraDais), a unified parcel **Property Workbench**, a bounded
suite architecture, and an optional AI assist layer — plus the operating doctrine that makes
a county conversion survivable. It is licensable for commercial deployment within a defined
field-of-use. It is **not** a generic platform pitch and **not** a finished drop-in
replacement system.

**The honest anchor claim:**
> Benton County runtime pilot on TerraFusion DB as system-of-record, with a proof-gated
> 39-county provenance inventory as the expansion path — a disciplined single-county proof
> that scales reproducibly, not a 39-county launch.

---

## The problem it solves (lead with this)

County assessment modernization fails on three predictable risks. This asset is built to
reduce each:

1. **Migration risk.** Counties distrust rip-and-replace. TerraFusion's model treats the
   legacy system (e.g. PACS) as a *provenanced source*, not a thing to be destroyed —
   ingest → validate → reconcile → prove → serve. Every record carries lineage; nothing
   enters the system of record without it. That is a transition-safe posture you can put in
   front of a skeptical county.
2. **Workflow fragmentation.** Parcel work today is scattered across disconnected modules.
   The Property Workbench routes parcel-level work — investigation, ratio/comp review,
   correction routing, evidence, appeal prep — into one surface with context that survives
   across steps.
3. **Operational discontinuity.** Assessor administration (exemptions, appeals,
   certification steps, notices, queues) is modeled as durable, governed workflow with
   single-owner write lanes — not ad-hoc screens.

---

## What's included (the asset package)

- **Suite architecture** — OS-shell / workbench / suite / app separation with bounded
  domains and single-owner **write-lane governance** (lowers integration ambiguity and
  product-sprawl risk).
- **TerraDais administrative persistence** — `Exemption`, `Appeal`, `CertificationStep`,
  `Notice`, `QueueItem` as first-class, county-isolated, auditable workflow entities.
- **Property Workbench** — parcel-level unified work surface with cross-step context
  survival.
- **Provenance / continuity layer** — `source_xref` lineage and the five-schema model
  (`raw_pacs → truth_pacs → canonical_tf → product`) with a quarantine lane for anything
  unproven.
- **AI assist layer (optional)** — drafts notices, explains model inputs, summarizes comps
  rationale. Human-in-the-loop augmentation, not autonomous determination.
- **Documentation & doctrine** — specifications, naming conventions, the operating
  discipline that makes county conversions defensible.

Maturity of each item is stated honestly in the accompanying asset inventory (code vs
prototype vs spec), available for diligence review under NDA. Nothing here is offered as
more finished than it is.

---

## The three vendor stories (lead with #1)

1. **Reduces migration & modernization risk** *(strongest).* A transition-safe,
   continuity-first, provenance-backed posture that gives a vendor a safer county-facing
   story. Best evidence: the continuity layer, write-lane governance, stewardship-compatible
   rollout.
2. **Accelerates your roadmap.** You already know you need clean parcel-workbench routing
   and assessor workflow persistence; this is solved and demonstrable. Best evidence:
   TerraDais persistence, Workbench routing, records/evidence separation.
3. **Strengthens your stack.** License and embed it into an existing product line. Best
   evidence: bounded suite architecture, optional (not mandatory) AI assist.

---

## Demo / walkthrough narrative (grounded in the real Benton UAT path)

Walk it as a county continuity story, not a feature tour:

1. **The county problem** — fragmented parcel workflows, fear of migration, brittle
   institutional memory.
2. **County Studio loads the Benton study** from TerraFusion DB — real runtime, no mock
   fallback.
3. **Drill into a failing segment** — queue and context scoped to the problem set; segment
   inspector shows metadata and next actions.
4. **Build a parcel cohort** — paste parcel IDs; they normalize, dedupe, and persist through
   a governed payload.
5. **Scenario preview / compare** — see the delta and affected set *without implying an
   official mutation*.
6. **Approval posture** — state is durable and reloadable; nothing "applied" without backend
   evidence.
7. **Route downstream to Dais / Dossier** — a durable receipt exists before handoff.
8. **Property Workbench** — open it from County Studio; the parcel/segment context survives.
9. **Defense packet** — export a defensible evidence packet with source/context detail.
10. **Boundary, stated out loud** — "This is the Benton runtime pilot plus a 39-county
    provenance inventory. Not a 39-county launch." Saying the boundary yourself builds more
    trust than any claim.

---

## Rights structure (headline)

- **Exclusive, perpetual, irrevocable** license within a defined **field-of-use: assessor /
  CAMA administration**.
- Includes **sublicense, modify, create-derivative, embed, and commercialize** rights.
- **You retain underlying IP title** and all rights outside the assessor field (including
  public-benefit / stewardship applications).
- Open to a **milestone-tied buyout/conversion** as a later option — not the opening ask.

Illustrative business terms available on request.

---

## Why it matters commercially (one line)

It gives a vendor real operational rights and product freedom in their market — faster
modernization, safer county conversions, less roadmap time — without requiring full
assignment of the core IP, and without inheriting a migration story counties won't trust.
