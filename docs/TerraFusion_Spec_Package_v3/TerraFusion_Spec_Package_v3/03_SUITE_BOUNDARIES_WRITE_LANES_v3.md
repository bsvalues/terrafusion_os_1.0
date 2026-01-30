# Suite Boundaries + Write Lanes (v3)

This is the anti-drift contract: **every fact/artifact has exactly one writer**.

## Suite missions (locked)
- TerraForge: build value (models, comps, calibration, valuation artifacts)
- TerraAtlas: see the county (map, layers, spatial artifacts)
- TerraDais: operate value (permits, exemptions, appeals, notices, cert, queues)
- TerraDossier: prove the decision (evidence, narratives, packets)
- OS Core: identity, routing, flags, trace, settings
- TerraPilot: routes tools; does not directly write business data

---

## Write-lane matrix (authoritative)
| Domain fact / artifact | Write owner | Read consumers |
|---|---|---|
| Parcel identity (PIN, situs, legal, owner snapshot*) | OS Core (projection) | All |
| Parcel characteristics (CAMA) | Forge (or CAMA svc) | All |
| Valuation artifacts (models, outputs, comp sets, cost/income) | Forge | Dais, Dossier, Pilot, OS |
| GIS artifacts (boundaries, bookmarks, spatial notes*) | Atlas | Forge, Dais, Dossier |
| Permit workflows + status | Dais | All |
| Exemption workflows + decisions | Dais | Treasurer/Auditor (future), Dossier |
| Appeal workflows + deadlines | Dais | Dossier |
| Notices (drafts, print queue, delivery status) | Dais | Dossier |
| Roll certification checklist + sign-offs | Dais | Auditor/Treasury (future) |
| Evidence docs, narratives, packets | Dossier | All |
| Activity trail (audit spine) | OS Core (Trace) | All |
| PilotProfile (avatar + prefs) | OS Core | Pilot |

\* Can be mirrored read-only in OS Summary; write ownership stays with the lane.

---

## Guardrails ("does NOT own")
- Dais does not own valuation modeling UI/artifacts.
- Atlas does not own admin workflows or valuation decisions.
- Forge does not own workflow state transitions (permit/exempt/appeal statuses).
- Dossier does not initiate workflows; it packages outcomes.
- Pilot does not bypass lane ownership; it routes tool calls.

---

## Future office lanes (reserved)
- TerraClerk, TerraTreasury, TerraAudit (and optional TerraRecorder)

They integrate as new Workbench tabs + tools without renaming/rewiring Assessor lanes.
