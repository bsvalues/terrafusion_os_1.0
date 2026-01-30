# TerraPilot — Canonical Specification (v3)

## 1) One copilot, two modes
TerraPilot is a single **OS feature** with two modes:
- **Pilot Mode** (operator): do / route / act / execute
- **Muse Mode** (creator): draft / explain / summarize / synthesize

Muse is a mode, not a separate product.

---

## 2) Where it lives
- Global header (always available)
- Property Workbench tab: /property/:parcelId/pilot
- Dockable side panel on any suite screen

---

## 3) PilotProfile (per-user avatar)
County-scoped, persistent across all suites.
Minimum fields:
- pilotProfileId, userId, countyId
- avatar: name, icon, color, tone
- role + specializations
- mode prefs: default mode, suggestion level
- pinned actions (tool IDs)
- playbooks (macros) tagged by mode
- optional memory (opt-in; county policy controlled)

---

## 4) Tool router = safety core
All "actions" run through a single execution pipeline:
- tool registry
- permission gate (RBAC claims)
- mode lock
- risk classification
- confirmation + reason codes for high-impact tools
- TerraTrace emission (invoke + result)

Tool metadata (minimum):
- mode: pilot | muse | both
- risk: read_only | write_low | write_high | irreversible
- suiteOwner: forge | atlas | dais | dossier | os
- requiredPermissions: RBAC claims
- writesTo: declared write lane(s) (must match Suite Boundaries)

Execution rule: tool runs only if claims + licensing + mode + confirmation pass, and Trace is emitted.

---

## 5) Human-in-the-loop policy (required)
write_high/irreversible tools MUST:
- require confirmation
- require reason code
- optionally require second approver (county config)
- emit trace events: tool_invoked + tool_succeeded/failed

Muse drafts cannot be "sent" without an explicit publish tool.

---

## 6) MVP tool set (recommended)
Pilot Mode:
- route_to_parcel
- show_my_queue
- assign_task (Dais)
- check_status (appeal/exempt/permit/cert)
- run_valuation_model (Forge)
- assemble_packet (Dossier)

Muse Mode:
- draft_notice (Dais)
- explain_value_change (Forge)
- summarize_dossier (Dossier)
- draft_appeal_response (Dais+Dossier)
- commissioner_memo (Dossier output)

---

## 7) Spec tests
- One copilot concept; Muse is a mode
- Tools are mode-locked + risk-classified
- High-risk tools require confirmation + reason codes
- Every tool emits TerraTrace events
- Tool writes always respect write lanes
