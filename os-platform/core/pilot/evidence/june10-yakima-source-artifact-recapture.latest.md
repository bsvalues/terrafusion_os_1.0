# Yakima Source Artifact Recapture

Generated: 2026-05-26T22:06:58.692Z

## Verdict

- Decision: source_recapture_blocked_interactive_lookup_only
- Source artifact status: probe_artifact_only
- Source snapshot receipt emitted: no
- Source probe receipt emitted: yes
- Bounded correction dry-run viable: no
- DB mutation attempted: no
- Production binding allowed: no

## Endpoint Discovery

- Search page: https://yes.co.yakima.wa.us/AssessorAPI/Property_Search.html
- App script: https://yes.co.yakima.wa.us/AssessorAPI/JS/property-search-ng-app.js
- Supports parcel detail lookup: yes
- Supports parcel string search: yes
- Bulk export endpoint detected: no
- App script SHA-256: 89dcd0401eceeffe0256c983bf389362c0b1375e8834eb60b40ee79626474695

## Delta Probe Summary

| Class | Total delta | Probed | Found in current source | Not found in current source |
| --- | ---: | ---: | ---: | ---: |
| Source-only | 100 | 50 | 50 | 0 |
| Canonical-only | 3360 | 50 | 0 | 50 |

## Duplicate / Null Semantics

- Status: not_rerunnable_from_interactive_lookup_probe
- Reason: Yakima recapture found parcel detail/search APIs, but no authoritative complete source export artifact for duplicate/null semantics.

## Artifacts

- Probe artifact: os-platform/core/pilot/evidence/june10-public-source-captures/yakima/yakima-source-recapture-probe-2026-05-26T220658688Z.jsonl
- Probe artifact SHA-256: 3b3ad738bf17fbf2bc97f583bac23d9324bb005560d0dd2ab37d1b75d83e297f
- Probe receipt: os-platform/core/pilot/evidence/june10-public-source-captures/yakima/yakima-source-recapture-probe-receipt-2026-05-26T220658688Z.json
- Probe receipt SHA-256: 4f500d43ab7c37724af0bedc883f2779e7c7e36147e1ba1c65c15cbc61351788

## Required Next Action

Acquire a governed Yakima full source export/snapshot, or explicitly defer Yakima from receipt-backed June 10 production binding.

## Blockers

- Yakima public source app did not expose a governed bulk/full-source export endpoint.
- Only sample probe evidence was captured; the full 100 source-only and 3,360 canonical-only deltas are not fully classified.
- 50 probed source-only parcel identifiers are live in the current Yakima source and absent from canonical.
- 50 probed canonical-only parcel identifiers were not found in the current Yakima source.
