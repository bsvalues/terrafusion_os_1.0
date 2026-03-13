# Phase 17 Benton Go-Live Decision

## Scope
Current approved go-live scope is the Benton operational-snapshot runtime on Hostinger staging and production.

This go-live scope explicitly excludes live PACS-connected sync on Hostinger.

## Decision Rule
Phase 17 reaches GO only when Phase 9, Phase 10, Phase 11, Phase 14, Phase 15, and Phase 16 all remain GO on the active runtime.

That means the following must remain true together:
- Hostinger runtime role separation remains truthful
- public environment identity remains truthful
- deployment contract remains hardened
- Benton operator workflow remains proven
- Benton data quality remains proven
- monitoring, bounded freshness, and backup/restore remain proven

## Meaning of GO
A Phase 17 GO means the Benton operator surface, promoted snapshot contract, and recovery posture are proven for the current Hostinger runtime role.

It does not mean Hostinger is a PACS-connected sync host.
