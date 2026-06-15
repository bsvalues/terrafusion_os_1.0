# TerraFusion — Vendor License Term Sheet (Business Terms)

**Non-binding. Business terms only — not a legal agreement.** For discussion at WSACA and
follow-on conversations. Final terms subject to definitive documentation and counsel review.

**Anchor (consistent with the rest of this package):**
> Benton County runtime pilot on TerraFusion DB as system-of-record, with a proof-gated
> 39-county provenance inventory as the expansion path — a disciplined single-county proof
> that scales reproducibly, not a 39-county launch.

---

## 1. Structure

Exclusive, field-limited **license** of the TerraFusion assessor-modernization asset
package — **not** an assignment of the underlying IP. Licensor retains title; Licensee
receives broad operational rights inside a defined field.

## 2. Field-of-use

**Assessor / CAMA administration** — county property assessment administration, assessor
office workflow, and parcel operations. (Deliberately the narrowest viable field; it gives
a vendor real market exclusivity while preserving Licensor rights everywhere else.)

## 3. Territory

**Slot — to be agreed.** Default opening position: Washington State. Expandable to
nationwide-within-field as a negotiated term (e.g. tied to commitment, minimums, or buyout).

## 4. Exclusivity

**Exclusive within the field-of-use and territory**, for the term. Licensor will not grant
overlapping rights in the same field + territory to another commercial vendor.

## 5. Term

**Perpetual and irrevocable** within the field-of-use (subject to standard material-breach
and confidentiality provisions in definitive docs).

## 6. Rights granted

- Right to **use and deploy** within the field.
- Right to **modify** and create **derivative works**.
- Right to **embed** the asset into Licensee's existing product suite.
- Right to **sublicense to counties / end customers** within the field. *(Explicitly yes —
  this is what makes the offer commercially real for a vendor.)*
- Right to **commercialize** within the field.

## 7. Rights retained by Licensor

- **Underlying IP title** to the core asset package.
- All rights **outside the assessor / CAMA field-of-use**.
- **Public-benefit / stewardship applications** outside the licensed commercial scope.
- Right to pursue **differently-scoped or non-competing** implementations outside the field.

## 8. Delivery

Scope is tailorable. Options, by agreement:
- Architecture & doctrine documentation (specifications, naming conventions, roadmaps).
- Source and build artifacts for the licensed components.
- Workflow/persistence designs and interaction models.

Exact delivery set is a negotiated schedule, keyed to the maturity tiers in
[`asset-inventory.md`](asset-inventory.md).

## 9. Transition support

**Slot — 6 or 12 months** of transition/integration support, by agreement. Scope and rate
to be defined (fixed engagement or retainer).

## 10. Confidentiality

Mutual NDA prior to detailed asset disclosure and diligence. Asset inventory shareable under
NDA; deep code/diligence access staged after material interest.

## 11. Buyout / conversion option

Licensor is open to a **later conversion or buyout** of the field-limited rights, tied to
**milestones** (e.g. deployment commitments, revenue thresholds, or a defined window). This
is offered as a **negotiable later mechanism, not the opening structure** — the opening
posture is the exclusive perpetual license above.

---

## Recommended opening posture (what to say first)

> "I'm open to an exclusive, perpetual, irrevocable license in a defined field-of-use —
> assessor and CAMA administration — including sublicense, modification, derivative,
> embedding, and commercialization rights, while I retain underlying IP ownership. If there's
> strategic alignment, I'd also discuss a later conversion or buyout tied to milestones."

Clean, serious, and flexible. It gives the vendor market comfort and product freedom, keeps
your stewardship value intact, and leaves a path to a bigger deal without leading with one.

---

## Appendix — They'll ask / you answer

Answers are calibrated to the honest maturity tiers. Do not improve on them in the room.

| They ask | You answer |
|---|---|
| **Is this code, architecture, or both?** | Both. Working code for the administrative workflow persistence (TerraDais), suite-app APIs, runtime-truth surface, and County Studio; a prototype Property Workbench surface; and the differentiated architecture/doctrine on top. Package scope is tailorable. |
| **What's production-ready today?** | A Benton County runtime pilot, not a multi-county production system. The administrative workflow entities, write-lane governance, and the DB-as-system-of-record API path are implemented and tested. I'll show you exactly which components are `working` vs `prototype` vs `spec` — it's written down, not hand-waved. |
| **What third-party dependencies / obligations exist?** | The runtime treats county legacy systems (e.g. PACS) and ArcGIS REST as *upstream sources*, consumed through standard interfaces — not embedded or sublicensed. I'll provide a clean dependency statement during diligence. |
| **What exactly is exclusive?** | The field-of-use (assessor / CAMA administration), the territory, and the scope — defined precisely so there's no ambiguity. |
| **Can we modify it freely?** | Yes — modification and derivative-works rights are in the package. |
| **Can we sublicense to counties / customers?** | Yes, explicitly, within the field. |
| **What support comes with it?** | A 6- or 12-month transition window, scope and rate to be agreed. |
| **Why not just assign the IP?** | The architecture has stewardship value outside the assessor commercial field. I can still give you sale-like exclusivity *inside* your market via the field-limited license, with a milestone-tied buyout if we get there. |
| **Why should we believe the proof?** | Because the system is built to refuse fake readiness — there's a runtime-truth surface and an evidence protocol, and I'll only claim what has an artifact behind it. Anything I can't prove, I'll tell you is a target, not a fact. |

---

*This document contains no certified-valuation, multi-county-live, ROI, or patent-valuation
claims by design. If a number or capability isn't in the asset inventory, it isn't on the
table.*
