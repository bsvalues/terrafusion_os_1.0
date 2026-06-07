# County Sovereignty Shell Posture

- Generated: 2026-06-07T18:25:28.074Z
- Verdict: J10_COUNTY_SOVEREIGNTY_SHELL_POSTURE_LOCKED
- Status: LAUNCH_POSTURE_MODEL
- Packet hash: 45411e8b9d5343c974cd7cce4a20eab75f49dcbd04cb6dc7a5103c758d0010d7

## June 10 Claim

TerraFusion launches the Washington county operating model: sovereign county workspaces, Benton runtime proof, and non-Benton onboarding/provenance posture.

## Runtime Truth

TerraFusion DB -> TerraFusion API -> TerraFusion apps

## Source Truth

PACS / Proval / Ascend / ArcGIS / public sources -> constrained ingestion / validation -> TerraFusion DB

PACS is provenance for Benton. PACS is not a Hostinger runtime dependency and not the June 10 product story.

Proof command:

```bash
node os-platform/core/pilot/j10-county-sovereignty-shell-posture.mjs
```

## Top Bar Contract

- Runtime example: Benton County | Assessment | Assessor | Runtime Pilot
- Onboarding example: Yakima County | Assessment | Assessor | Onboarding

## County Registry

| FIPS | County | Status | Source posture | Runtime gate |
| --- | --- | --- | --- | --- |
| 001 | Adams County | Onboarding | unknown | blocked_until_county_specific_db_api_proof |
| 003 | Asotin County | Onboarding | unknown | blocked_until_county_specific_db_api_proof |
| 005 | Benton County | Runtime Pilot | PACS-derived | allowed_where_terrafusion_db_api_proof_exists |
| 007 | Chelan County | Onboarding | unknown | blocked_until_county_specific_db_api_proof |
| 009 | Clallam County | Onboarding | unknown | blocked_until_county_specific_db_api_proof |
| 011 | Clark County | Provenance Inventory | ArcGIS/public | blocked_until_county_specific_db_api_proof |
| 013 | Columbia County | Onboarding | unknown | blocked_until_county_specific_db_api_proof |
| 015 | Cowlitz County | Provenance Inventory | ArcGIS/public | blocked_until_county_specific_db_api_proof |
| 017 | Douglas County | Onboarding | unknown | blocked_until_county_specific_db_api_proof |
| 019 | Ferry County | Onboarding | unknown | blocked_until_county_specific_db_api_proof |
| 021 | Franklin County | Onboarding | unknown | blocked_until_county_specific_db_api_proof |
| 023 | Garfield County | Onboarding | unknown | blocked_until_county_specific_db_api_proof |
| 025 | Grant County | Onboarding | unknown | blocked_until_county_specific_db_api_proof |
| 027 | Grays Harbor County | Onboarding | unknown | blocked_until_county_specific_db_api_proof |
| 029 | Island County | Onboarding | unknown | blocked_until_county_specific_db_api_proof |
| 031 | Jefferson County | Onboarding | unknown | blocked_until_county_specific_db_api_proof |
| 033 | King County | Provenance Inventory | ArcGIS/public | blocked_until_county_specific_db_api_proof |
| 035 | Kitsap County | Provenance Inventory | ArcGIS/public | blocked_until_county_specific_db_api_proof |
| 037 | Kittitas County | Onboarding | unknown | blocked_until_county_specific_db_api_proof |
| 039 | Klickitat County | Onboarding | unknown | blocked_until_county_specific_db_api_proof |
| 041 | Lewis County | Onboarding | unknown | blocked_until_county_specific_db_api_proof |
| 043 | Lincoln County | Onboarding | unknown | blocked_until_county_specific_db_api_proof |
| 045 | Mason County | Onboarding | unknown | blocked_until_county_specific_db_api_proof |
| 047 | Okanogan County | Onboarding | unknown | blocked_until_county_specific_db_api_proof |
| 049 | Pacific County | Onboarding | unknown | blocked_until_county_specific_db_api_proof |
| 051 | Pend Oreille County | Onboarding | unknown | blocked_until_county_specific_db_api_proof |
| 053 | Pierce County | Onboarding | unknown | blocked_until_county_specific_db_api_proof |
| 055 | San Juan County | Onboarding | unknown | blocked_until_county_specific_db_api_proof |
| 057 | Skagit County | Onboarding | unknown | blocked_until_county_specific_db_api_proof |
| 059 | Skamania County | Onboarding | unknown | blocked_until_county_specific_db_api_proof |
| 061 | Snohomish County | Provenance Inventory | ArcGIS/public | blocked_until_county_specific_db_api_proof |
| 063 | Spokane County | Provenance Inventory | ArcGIS/public | blocked_until_county_specific_db_api_proof |
| 065 | Stevens County | Onboarding | unknown | blocked_until_county_specific_db_api_proof |
| 067 | Thurston County | Provenance Inventory | ArcGIS/public | blocked_until_county_specific_db_api_proof |
| 069 | Wahkiakum County | Onboarding | unknown | blocked_until_county_specific_db_api_proof |
| 071 | Walla Walla County | Onboarding | unknown | blocked_until_county_specific_db_api_proof |
| 073 | Whatcom County | Provenance Inventory | ArcGIS/public | blocked_until_county_specific_db_api_proof |
| 075 | Whitman County | Onboarding | unknown | blocked_until_county_specific_db_api_proof |
| 077 | Yakima County | Onboarding | assessor export pending | blocked_until_county_specific_db_api_proof |

## Visible Labels

- Runtime Pilot
- Onboarding
- Provenance Inventory
- Not Runtime Enabled
- Snapshot Runtime Only

## Forbidden Claims

- All counties are live.
- All counties are certified.
- Hostinger is connected to PACS.
- TerraFusion Sync is fully productized.
- AI valuations are official.
- Unfinished modules are production-ready.

## Final Claim Sheet

TerraFusion launches the Washington county operating model. Each county is represented as a sovereign jurisdictional workspace with its own identity, role context, source posture, and readiness state. Benton County is the first runtime-proven county, backed by TerraFusion DB/API and PACS-derived source provenance. The other Washington counties are represented in onboarding/provenance mode until promoted by county-specific TerraFusion DB/API runtime proof. The runtime path is TerraFusion DB -> TerraFusion API -> TerraFusion apps.
