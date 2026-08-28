# WO-WAL-004 — County Identity, Isolation, Trust and Activation Boundary

| Field | Value |
| --- | --- |
| Status | `ACTIVE_EXACT_CHILD_ROUTING` |
| Program | Washington Assessor Launch V1 |
| Risk | R5 security/identity and county-data boundary |
| Terminal condition | `COUNTY_AUTHORITY_TRUST_STATE_AND_CROSS_COUNTY_DENIAL_PROVEN_NO_SILENT_DEFAULT` |

## Objective

Make county identity, data trust and activation state explicit and enforceable across the launch stack so Counties HUB is a control plane, not an authority picker.

## Required outcome

1. Define canonical county identity for all 39 counties and one authoritative mapping among county key/slug/FIPS/GUID as required by current data/runtime contracts.
2. Authenticated operational requests derive county authority from trusted identity/claims/session, not user-supplied route/body/header values alone.
3. Public data browsing may expose public county information according to product policy, but must not grant access to county-provided/connected/private data or operational privileges.
4. Represent data trust progression at least as `PUBLIC`, `COUNTY_PROVIDED`, `CONNECTED`; `OFFICIAL_TERRAFUSION_ADOPTION` is reserved and cannot be inferred by this launch.
5. Remove/fail closed on development or silent Benton fallbacks in launch runtime paths.
6. Bind uploads, Sync connections, canonical rows, TerraForge runtime and Workbench reads to county identity.
7. Enforce same-county access and non-disclosure across protected data paths; foreign-only records do not reveal existence through counts/errors/timing-sensitive shapes where existing contracts require non-disclosure.
8. Record provenance/freshness/trust separately from county operational authority.
9. Define explicit activation prerequisites for a county data mode and TerraForge capability; no UI toggle may bypass them.
10. Audit trace includes actor, county, trust state, data/source identity and correlation/trace identifier for launch-critical actions.

## Adversarial proof

Attack at least:

- route/body/header county tampering against authenticated claims;
- token from county A against county B upload/Sync/canonical/runtime paths;
- stale prior-county UI/session state after navigation or login switch;
- silent Benton fallback on missing/invalid county;
- public-mode attempt to reach county-provided/connected data;
- privilege escalation from county selection;
- cross-county TerraForge/Workbench result leakage.

Every protected case must fail closed.

## Denials

No widening of public access to private county data, no cross-county admin shortcut for ordinary assessor users, no adoption/write-back activation, no hard-coded Benton default in production paths.

## Continuation

Begin bounded identity/control-plane work after WAL-000 and coordinate contracts with WAL-001/002/003. Continue through dependent integrations without routine owner relay.
