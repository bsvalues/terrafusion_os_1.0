# TerraFusion Sync — Product Doctrine

_Locked 2026-06-08. Distilled from the Benton County prototype (the first county converted end-to-end).
This is the source of truth for what Sync **is**, what it **is not**, and the structures every future
county conversion reuses. Pair with `TERRAFUSION_SYNC_AUTOMATION_BACKLOG.md` and the Benton seal
registry (`docs/sync/seals/benton-lane-status.md`)._

---

## 1. What TerraFusion Sync is

> **TerraFusion Sync is a human-guided county conversion workbench powered by a proof-grade ingestion
> engine.** It profiles legacy county systems, establishes a live identity spine, lands source facts,
> projects source truth, creates canonical TerraFusion read models, runs runtime seal gates,
> quarantines unsafe records, generates readback samples, and exports evidence packets proving what
> was converted, what was deferred, and what can safely be claimed.

It converts **county source chaos** into **sealed, current, identity-resolved, canonical,
readback-proven, product-safe operational truth.**

## 2. What TerraFusion Sync is NOT

- Not a table copier, not a generic ETL, not a one-off drain script, not a full clone of PACS.
- Not a vendor/SaaS implementation product run by a DevOps squad.
- Not a Treasurer accounting system, not a historical archive, not a UI-complete application (yet).
- It does not pull *everything* — it pulls the **current operational substrate** (see §7).

## 3. The two layers (hold this distinction)

```
ENGINE      (Benton mostly PROVED this)
  connect · profile · land · normalize · resolve identity ·
  project truth · project canonical · run gates · repair · readback · evidence packet

WORKBENCH   (the product still to BUILD)
  the assessor-facing 7-step surface that drives the engine:
  Connect Source · Profile DB · Build Mapping · Dry Run ·
  Review Quarantine · Commit Approved · Export Evidence Packet
```

Benton completed the **engine + a sealed current-year substrate**, not the workbench product.
That is a milestone, not a downgrade. The next job is to productize the engine into the workbench.

## 4. The operator (never lose this target)

```
ONE technical assessor, fluent in SQL Server + Excel.
NOT a DevOps engineer. NOT a SaaS implementation team.
```
Every design passes the test: *"does this fit one technical assessor with SQL and Excel?"* If a step
needs YAML, stack traces, C#, or CLI — the design is wrong. AI proposes; human approves; machine
commits; evidence proves. AI never silently commits county data.

## 5. Core definitions

**Live identity spine** — the authoritative current parcel identity (Benton: 83,326 parcels via
`source_xref` TfEntityType='parcel' active → `canonical_tf.tf_parcel`). Every canonical surface keys
to it. Never blind-join the raw parcel table (it carries historical/debris generations).

**Lane** — one source domain converted through the three-layer pipeline
(`legacy_pacs_raw` → `truth_pacs` → `canonical_tf`) under an explicit contract (see §6). Benton's
proven lanes: **owner · land · improvement · sales · geometry · assessment value · exemption ·
jurisdiction · revenue L-bills · revenue A-bills · payment net-paid attestation.**

**Seal** — a lane is SEALED when coverage = its correct denominator, duplication = 1.0000× at truth,
canonical projected, residual gap diagnosed by class/reason (not assumed), pipeline idempotent, and a
runtime evidence artifact exists. No false seals.

**Source Pack** — the reusable unit of distribution for a source-system family (Harris PACS,
ProVal/Ascend, ArcGIS, Revenue bills): known table families, source grains, active/current rules,
supplement rules, year semantics, dictionary tables, fact/link tables, bill-type rules, payment
attestation rules, identity-spine rules, conversion cautions, seal gates, readback profiles. **Benton
is the lab that produces the first packs.**

**Readback** — risk-shaped per-parcel verification that the sealed canonical actually joins and reads
back on the live spine, with explicit *safe claims* and *forbidden claims*.

**Evidence packet** — the standard, auditor-readable artifact every seal emits (see §8).

## 6. The Lane Contract (every lane fills this in)

```
Lane name
Source table family
Source grain
Operational year
Active / current rule          (e.g. active supplement = MAX(sup_num))
Truth table
Canonical table
Identity resolution rule       (prop_id → live parcel spine via source_xref)
Dictionary dependencies
Expected source denominator
Expected canonical denominator
Allowed unresolved count       (with reason)
Quarantine rule
Readback claim                 (what this lane lets County Studio say)
Out-of-scope claim             (what it must NOT claim)
Evidence artifact
Seal registry row
```
Future Sync does not re-discover what a lane is every time — it instantiates this contract.

## 7. The first finish line: current operational substrate

Sync's first meaningful finish line is **not "everything"** — it is the minimum layer that makes a
county *operationally readable*:

```
parcel identity · owner · land · improvement · sales · geometry ·
assessment value · exemptions · tax area · districts ·
levy tax bills · special-assessment bills · due/paid/balance · net-paid attestation
```

It answers: *What is this parcel? Who owns it? What exists on it? Where is it? What is it worth? What
exemptions apply? What jurisdictions govern it? What current bills exist? What does the source say is
due, paid, and balanced?* — current-year, not historical; bill-explanation, not Treasurer accounting.

## 8. Evidence packet shape (standard, every seal)

```
executive claim · scope · sealed lanes · runtime proof table ·
doctrine record · boundary register · evidence index ·
readback set · out-of-scope list · handoff statement
```

## 9. The learned laws (Benton doctrine → permanent Sync law)

Every painful Benton discovery is now a standing rule:

1. **Never assume `sup_num=0` is current.** Prove the active supplement per domain (MAX(sup_num) over
   the relevant grain/year).
2. **Never blind-join the raw parcel table.** Resolve through active `source_xref` → live parcel spine.
3. **Rows landed ≠ truth sealed.**
4. **Truth sealed ≠ canonical readable.** (Identity can drift — F1.)
5. **Canonical readable ≠ UI complete.**
6. **Current-year operational substrate is the first finish line.** History is a separate mission.
7. **Revenue bill explanation is not Treasurer accounting.**
8. **Payment net-paid can be attested without exposing the receipt ledger** (`bill.amount_paid` ≡
   `SUM(coll_transaction.base_amount_pd)`, proven).
9. **A zero row can be valid** if source truth has zero rows — render "none", don't error or fabricate.
10. **Every lane needs a readback claim AND an out-of-scope claim.**
11. **Doctrine is data, not a one-line WHERE** — year-aware, source-aware, evidence-backed, operator-signed
    (`tf_doctrine_*`). Distinguish columns that look related but aren't (DOR vs county ratio study).
12. **Valuation universes are separate** (real-residential / real-commercial / ag-current-use /
    mobile-home / personal-property / conversion-legacy) — different dictionaries, gates, quarantine.
13. **Proof standard:** never promote a plausible story to a proven root cause — trace
    variable → definition → commit. Breadth of impact is not evidence.

## 10. Out of scope (for the substrate finish line)

receipt-level payment history · tender detail · void/refund workflow · penalty-interest paid
breakdown · delinquency certification · fund/distribution accounting · prior-year/history completeness ·
full Treasurer accounting · a mature assessor-facing UI · multi-county generalization beyond the
reference pack. Each is a future, separately-authorized mission.

## 11. Benton's role going forward

**Benton is the reference county pack, not just a completed county.** It gives Sync known PACS source
families, active-supplement doctrine, identity-spine doctrine, revenue bill split, evidence templates,
seal gates, and readback profiles — so the next Harris PACS county is *Apply pack → profile diffs →
confirm/override doctrine → run gates → seal*, turning three weeks into days.

---

*Why Benton took three weeks: the doctrine, gates, source pack, identity rules, and evidence machinery
were being invented while doing the work. The cure is this doctrine + the automation backlog —
converting the pain into reusable machinery so the next county is boring.*
