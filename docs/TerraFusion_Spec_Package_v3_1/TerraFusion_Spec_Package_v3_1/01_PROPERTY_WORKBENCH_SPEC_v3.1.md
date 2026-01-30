# Property Workbench — Canonical Specification (v3.1)

## 0. Canonical Names + Lint
- “Tara*” is invalid; only “Terra*” ships.
- Suites: `TerraXxx` (PascalCase)
- Modules: `terra-xxx` (kebab-case)
- Tab slugs: `summary|forge|atlas|dais|dossier|pilot`

---

## 1. Positioning (Tier‑0 OS Surface)
**Property Workbench** is a Tier‑0 TerraFusion OS surface. Not owned by any suite.

### Canonical Routes
- `/property/:parcelId` → Summary
- `/property/:parcelId/forge`
- `/property/:parcelId/atlas`
- `/property/:parcelId/dais`
- `/property/:parcelId/dossier`
- `/property/:parcelId/pilot`

**Deep‑link guarantee:** all legacy parcel routes redirect to these (see Migration Plan).

---

## 2. Canonical Tabs (locked order)
Summary → Forge → Atlas → Dais → Dossier → Pilot

| Tab | Owner | Purpose |
|---|---|---|
| Summary | OS Core | parcel identity, safe projections, statuses, activity |
| Forge | TerraForge | valuation workbench (models/comps/artifacts) |
| Atlas | TerraAtlas | GIS tools (map/layers/spatial context) |
| Dais | TerraDais | workflows (permits/exempt/appeals/notices/cert/queues) |
| Dossier | TerraDossier | evidence, narratives, packets |
| Pilot | TerraPilot (OS) | copilot panel (Pilot/Muse modes) |

---

## 3. Suite Compass Widget (Bridge UI)
A persistent, minimal navigation helper that teaches the OS model.

**Placement:** left rail (desktop) / top compact bar (tablet).  
**Purpose:** show “where you are” and “what each suite does” without leaving the parcel.

### Compass Behavior
- Highlights current tab
- Shows one‑line affordance per suite (hover / tap)
- Shows role/licensing availability (disabled state + tooltip)

Example (conceptual):
- Forge — “Build value”
- Atlas — “See the county”
- Dais — “Operate value”
- Dossier — “Prove the decision”
- Pilot — “Act or draft”

---

## 4. Context Ribbon + Badge Provider API
The Context Ribbon is always visible and is populated via OS core + suite badge contributions.

### 4.1 Ribbon shows
- Parcel ID, situs, owner snapshot, county
- Status badges (Appeal/Exempt/Permit/Cert/Levy impacts)
- Role‑aware Quick Actions (tool‑bound)

### 4.2 Context Ribbon API (suite contribution)
Suites contribute badges via a `BadgeProvider` interface (see contracts doc).

Rules:
- Badges are **read‑only projections**.
- Badge providers must be deterministic and fast (cacheable).
- Badge payload must be classified (PUBLIC/CONFIDENTIAL/RESTRICTED).

---

## 5. Work Modes + Mode Override Rules
Modes align to how staff think:
- Overview (default)
- Valuation
- Mapping
- Admin
- Case

### 5.1 Mode Override Rules (new)
Tabs may **suggest** or **force** a mode only under explicit policy.

Allowed:
- Entering Dais tab suggests Admin mode.
- Opening a cert checklist screen can force Admin mode if user opted-in.

Not allowed:
- Silent mode switches immediately before executing a write tool.

**Safety rule:** any write_high/irreversible tool always re-confirms mode + intent.

---

## 6. Unified Activity Feed (TerraTrace projection)
The activity feed is a projection over TerraTrace (append‑only).  
Suites must not create independent parcel timelines.

---

## 7. Extension Contract (how suites plug in)
Workbench assembles UI from suite contributions:
- Tabs
- Badges
- Quick actions
- Panels per mode

Suites do not import Workbench internals (avoid copy/paste drift).

All actions are tool‑bound and executed through TerraPilot routing (single pipeline).

---

## 8. Success Criteria
- One canonical parcel route
- One activity spine (TerraTrace)
- Badge/Action contributions use shared interfaces
- Mode overrides are predictable and safe
- New office tabs (Clerk/Treasury/Auditor) can be added without changing existing contracts
