# June 10 Source Acquisition Prioritization

Generated: 2026-05-26T22:26:22.119Z

## Verdict

- Scope: WA_INITIAL_SEED counties without verified receipt posture
- Requested label: 37-county source acquisition prioritization
- Actual remaining unverified counties: 35
- DB mutation attempted: no
- Production binding allowed: no
- Runtime claim allowed: no

## Next 5-County Acquisition Wave

| Rank | County | FIPS | Score | Acquisition family | Canonical rows | Expected blocker |
| ---: | --- | --- | ---: | --- | ---: | --- |
| 1 | Kitsap | 53035 | 19 | Parcel transfer history / open data export | 116900 | Existing payload files must be hashed, parsed, mapped to source-native parcel IDs, and converted into governed receipts. |
| 2 | Pierce | 53053 | 17 | Direct sales search | 328832 | Existing payload files must be hashed, parsed, mapped to source-native parcel IDs, and converted into governed receipts. |
| 3 | Klickitat | 53039 | 14 | Monthly sales report | 21305 | Existing payload files must be hashed, parsed, mapped to source-native parcel IDs, and converted into governed receipts. |
| 4 | Okanogan | 53047 | 14 | Direct sales search | 49386 | Existing payload files must be hashed, parsed, mapped to source-native parcel IDs, and converted into governed receipts. |
| 5 | San Juan | 53055 | 9 | Direct sales search | 17399 | Existing local county-intelligence files are not receipt-grade; recapture source or prove raw artifact lineage. |

## Full Ranking

| Rank | County | FIPS | Score | Bulk/query signal | Payload files | Local data files | Expected blocker |
| ---: | --- | --- | ---: | --- | ---: | ---: | --- |
| 1 | Kitsap | 53035 | 19 | yes | 2 | 0 | Existing payload files must be hashed, parsed, mapped to source-native parcel IDs, and converted into governed receipts. |
| 2 | Pierce | 53053 | 17 | yes | 3 | 0 | Existing payload files must be hashed, parsed, mapped to source-native parcel IDs, and converted into governed receipts. |
| 3 | Klickitat | 53039 | 14 | no | 2 | 0 | Existing payload files must be hashed, parsed, mapped to source-native parcel IDs, and converted into governed receipts. |
| 4 | Okanogan | 53047 | 14 | no | 1 | 0 | Existing payload files must be hashed, parsed, mapped to source-native parcel IDs, and converted into governed receipts. |
| 5 | San Juan | 53055 | 9 | no | 0 | 8 | Existing local county-intelligence files are not receipt-grade; recapture source or prove raw artifact lineage. |
| 6 | Chelan | 53007 | 8 | no | 0 | 2 | Existing local county-intelligence files are not receipt-grade; recapture source or prove raw artifact lineage. |
| 7 | Douglas | 53017 | 8 | no | 0 | 0 | Source artifact missing; first task is governed source capture and parcel ID semantics proof. |
| 8 | Grant | 53025 | 8 | no | 0 | 8 | Existing local county-intelligence files are not receipt-grade; recapture source or prove raw artifact lineage. |
| 9 | Island | 53029 | 8 | no | 0 | 8 | Existing local county-intelligence files are not receipt-grade; recapture source or prove raw artifact lineage. |
| 10 | Stevens | 53065 | 8 | no | 0 | 8 | Existing local county-intelligence files are not receipt-grade; recapture source or prove raw artifact lineage. |
| 11 | Clark | 53011 | 7 | no | 0 | 8 | Existing local county-intelligence files are not receipt-grade; recapture source or prove raw artifact lineage. |
| 12 | Lewis | 53041 | 7 | no | 0 | 0 | Source artifact missing; first task is governed source capture and parcel ID semantics proof. |
| 13 | Mason | 53045 | 7 | no | 0 | 0 | Source artifact missing; first task is governed source capture and parcel ID semantics proof. |
| 14 | Skagit | 53057 | 7 | no | 0 | 0 | Source artifact missing; first task is governed source capture and parcel ID semantics proof. |
| 15 | Whatcom | 53073 | 7 | no | 0 | 8 | Existing local county-intelligence files are not receipt-grade; recapture source or prove raw artifact lineage. |
| 16 | Asotin | 53003 | 6 | no | 0 | 0 | Source artifact missing; first task is governed source capture and parcel ID semantics proof. |
| 17 | Columbia | 53013 | 6 | no | 0 | 0 | Source artifact missing; first task is governed source capture and parcel ID semantics proof. |
| 18 | Ferry | 53019 | 6 | no | 0 | 0 | Source artifact missing; first task is governed source capture and parcel ID semantics proof. |
| 19 | Garfield | 53023 | 6 | no | 0 | 0 | Source artifact missing; first task is governed source capture and parcel ID semantics proof. |
| 20 | Grays Harbor | 53027 | 6 | no | 0 | 0 | Source artifact missing; first task is governed source capture and parcel ID semantics proof. |
| 21 | Kittitas | 53037 | 6 | no | 0 | 0 | Source artifact missing; first task is governed source capture and parcel ID semantics proof. |
| 22 | Lincoln | 53043 | 6 | no | 0 | 0 | Source artifact missing; first task is governed source capture and parcel ID semantics proof. |
| 23 | Pend Oreille | 53051 | 6 | no | 0 | 0 | Source artifact missing; first task is governed source capture and parcel ID semantics proof. |
| 24 | Snohomish | 53061 | 6 | no | 0 | 8 | Existing local county-intelligence files are not receipt-grade; recapture source or prove raw artifact lineage. |
| 25 | Clallam | 53009 | 5 | no | 0 | 0 | Source artifact missing; first task is governed source capture and parcel ID semantics proof. |
| 26 | Jefferson | 53031 | 5 | no | 0 | 0 | Source artifact missing; first task is governed source capture and parcel ID semantics proof. |
| 27 | Walla Walla | 53071 | 5 | no | 0 | 0 | Source artifact missing; first task is governed source capture and parcel ID semantics proof. |
| 28 | Franklin | 53021 | 4 | no | 0 | 0 | Source artifact missing; first task is governed source capture and parcel ID semantics proof. |
| 29 | Skamania | 53059 | 4 | no | 0 | 0 | Source artifact missing; first task is governed source capture and parcel ID semantics proof. |
| 30 | Thurston | 53067 | 4 | no | 0 | 0 | Source artifact missing; first task is governed source capture and parcel ID semantics proof. |
| 31 | Adams | 53001 | 2 | no | 0 | 0 | Registry is researched only; source access method and adapter contract must be verified first. |
| 32 | Wahkiakum | 53069 | 2 | no | 0 | 0 | Registry is researched only; source access method and adapter contract must be verified first. |
| 33 | Pacific | 53049 | 1 | no | 0 | 0 | Registry is researched only; source access method and adapter contract must be verified first. |
| 34 | Whitman | 53075 | -1 | no | 0 | 0 | Registry is researched only; source access method and adapter contract must be verified first. |
| 35 | Yakima | 53077 | -3 | no | 0 | 10 | Known blocker: public source is interactive lookup/search only; no governed bulk/full source snapshot found. |

## Ranking Rules

- Prefer verified public bulk/query/download sources over interactive-only search pages.
- Prefer counties with payload files or public open-data/download evidence already present.
- Prefer adapter-ready/P1 counties.
- Prefer smaller or moderate row counts for fast receipt closure.
- Penalize demo/sample evidence until recaptured from governed source artifacts.
- Penalize known probe-only blocked counties.

## Blockers

- 35 WA_INITIAL_SEED receipt gaps remain.
