# June 10 38-County Acquisition Source Lock

Generated: 2026-05-22T16:09:39.578Z

## Summary

- Requested Wave A counties: 10
- Counties locked: 10
- Source locked: 2
- Source candidates locked: 8
- Source decision required: 0
- Missing counties: 0
- Benton excluded: true
- Runtime claim allowed: false

## Source Locks

| County | Status | Family | Source URLs | Next action | Receipt target |
|---|---|---|---|---|---|
Clark | source_candidate_locked | Direct sales search | <https://clark.wa.gov> | capture_source_snapshot | `evidence/june10-38-county-seed/clark/source-snapshot-receipt.json`
Cowlitz | source_locked | Parcel transfer history | <https://cowlitzinfo.net/cowlitzpropertyapp/cowlitzpropertyapp/zoner/index><br><https://gis.cowlitzwa.gov/ccportal/apps/webappviewer/index.html?id=848eadafa8ba4566a6a6370a4294c5e2><br><https://gis.cowlitzwa.gov/ccportal/apps/webappviewer/index.html?id=3b7b5f787ccc46e9bd8c144d998991ae><br><https://www.co.cowlitz.wa.us> | capture_source_snapshot | `evidence/june10-38-county-seed/cowlitz/source-snapshot-receipt.json`
Grant | source_candidate_locked | Direct sales search | <https://www.grantcountywa.gov> | capture_source_snapshot | `evidence/june10-38-county-seed/grant/source-snapshot-receipt.json`
King | source_candidate_locked | Direct sales search | <https://kingcounty.gov> | capture_source_snapshot | `evidence/june10-38-county-seed/king/source-snapshot-receipt.json`
Kitsap | source_candidate_locked | Parcel transfer history / open data export | <https://www.kitsapgov.com> | capture_source_snapshot | `evidence/june10-38-county-seed/kitsap/source-snapshot-receipt.json`
Pierce | source_candidate_locked | Direct sales search | <https://www.co.pierce.wa.us> | capture_source_snapshot | `evidence/june10-38-county-seed/pierce/source-snapshot-receipt.json`
Snohomish | source_candidate_locked | Direct sales search | <https://snohomishcountywa.gov> | capture_source_snapshot | `evidence/june10-38-county-seed/snohomish/source-snapshot-receipt.json`
Spokane | source_candidate_locked | Direct sales search | <https://www.spokanecounty.org> | capture_source_snapshot | `evidence/june10-38-county-seed/spokane/source-snapshot-receipt.json`
Whatcom | source_candidate_locked | Direct sales search | <https://www.co.whatcom.wa.us> | capture_source_snapshot | `evidence/june10-38-county-seed/whatcom/source-snapshot-receipt.json`
Yakima | source_locked | Direct sales search | <https://property.spatialest.com/wa/yakima#/><br><https://www.yakimacounty.us> | capture_source_snapshot | `evidence/june10-38-county-seed/yakima/source-snapshot-receipt.json`

## Claim Rules

Allowed:
- source lock ready for snapshot capture
- acquisition work in progress

Forbidden:
- runtime-ready
- full county data loaded
- official county-certified valuation
- CostForge official calibration
- statewide production data ready

## Rules

- This source lock is not a receipt.
- This source lock does not certify runtime readiness.
- Each county still needs raw artifact capture, SHA-256 hash, normalized TerraFusion artifact, DB load proof, API proof, and UI smoke before runtime promotion.
- Benton remains on the certification track; this pack advances parallel acquisition only.
