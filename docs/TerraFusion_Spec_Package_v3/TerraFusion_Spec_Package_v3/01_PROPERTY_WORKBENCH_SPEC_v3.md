# Property Workbench — Canonical Specification (v3)

## Canonical names
TerraFusion (OS), TerraForge (Valuation), TerraAtlas (GIS), TerraDais (Assessor Admin), TerraDossier (Evidence), TerraPilot (Copilot: Pilot/Muse).

Naming lint: **"Tara" is invalid**. Only Terra* ships.

---

## 1) Tier‑0 OS surface (not suite-owned)
Property Workbench is a **Tier‑0 TerraFusion OS surface**.

Canonical routes (deep-link stable):
- /property/:parcelId (Summary)
- /property/:parcelId/forge
- /property/:parcelId/atlas
- /property/:parcelId/dais
- /property/:parcelId/dossier
- /property/:parcelId/pilot

Rule: legacy parcel routes inside suites must redirect to the canonical URL (see Migration Plan).

---

## 2) Canonical tabs (locked order)
Summary → Forge → Atlas → Dais → Dossier → Pilot

| Tab | Owner | Purpose |
|---|---|---|
| Summary | OS Core | identity + statuses + activity |
| Forge | TerraForge | valuation workbench |
| Atlas | TerraAtlas | map/layers/spatial context |
| Dais | TerraDais | permits/exemptions/appeals/notices/cert/queues |
| Dossier | TerraDossier | evidence/narratives/packets |
| Pilot | TerraPilot (OS) | personal copilot with Pilot/Muse |

---

## 3) Context Ribbon (persistent header)
Always visible across tabs:
- Parcel ID, situs, owner snapshot, county
- Status badges: Appeal / Exemption / Permit / Cert / Levy impact
- Role-aware quick actions

Rule: ribbon can **display** suite statuses, but **writes** nothing except OS flags via OS services.

---

## 4) TerraTrace activity feed (single spine)
Workbench activity feed is a projection over **TerraTrace (append-only)**.
Rule: suites do not implement independent parcel timelines.

---

## 5) Work modes (how staff think)
Overview (default), Valuation, Mapping, Admin, Case.
Modes change default tab/panels/suggestions; **authorization does not change**.

---

## 6) Suite extension contract (how suites plug in)
Suites contribute:
- tabs/panels
- ribbon badges
- quick actions

All quick actions must be **tool-bound** and executed via TerraPilot’s tool router (permissions + confirmations + Trace).

---

## 7) Ownership != write permission
UI tab ownership is not enough.
Authoritative write ownership lives in `03_SUITE_BOUNDARIES_WRITE_LANES_v3.md`.

---

## 8) Spec tests (pass/fail)
- One canonical parcel route family
- No duplicate parcel screens in suites
- Every capability has one owner + one write lane
- TerraTrace is the only activity spine
- Future office tabs (Clerk/Treasury/Auditor) plug in without changing existing contracts
