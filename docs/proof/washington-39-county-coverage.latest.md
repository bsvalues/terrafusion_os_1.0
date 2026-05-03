# Washington 39-County Coverage Proof

- Generated UTC: 2026-04-29T17:16:08.237Z
- Status: PASS_WITH_LIMITATIONS
- Source workbook: `docs/Washington Counties/WA_Sales_Acquisition_Registry_v0_5.xlsx`
- Source SHA256: `459a7d5d77ccfcd1be8c913da50afd9e3b3c496b1120a2a4003e6ce843355cc9`
- Scope: registry coverage and acquisition-path inventory only

## Assertions

| Assertion | Result |
| --- | --- |
| Expected county count | 39 |
| Registry county count | 39 |
| All expected counties present | true |
| No unexpected county rows | true |
| No duplicate county rows | true |
| All rows have official assessor URL | true |
| All rows have primary sales source | true |
| All rows have WA Current Parcels backbone | true |
| All rows have acquisition family | true |

## Status Counts

| Status | Count |
| --- | ---: |
| researched | 4 |
| adapter-ready | 33 |
| not-started | 2 |

## Acquisition Family Counts

| Acquisition Family | Count |
| --- | ---: |
| Parcel transfer history | 6 |
| Direct sales search | 24 |
| Monthly sales report | 4 |
| Monthly report / parcel history | 1 |
| Unknown | 3 |
| Parcel transfer history / open data export | 1 |

## Limitations

- 2 counties remain not-started in the registry control plane.
- 3 counties still have Unknown acquisition family posture.
- This proves registry coverage and acquisition-path inventory only; it does not prove statewide ingestion, normalization, geometry, or endpoint runtime coverage.

## County Rows

| County | Status | Priority | Acquisition Family | Primary Sales Source |
| --- | --- | --- | --- | --- |
| Adams | researched | P2 | Parcel transfer history | Parcel/property search via TaxSifter; direct sales UI not yet verified in this pass |
| Asotin | adapter-ready | P1 | Direct sales search | Sales Search + monthly sales pages |
| Benton | adapter-ready | P1 | Direct sales search | Benton County Property Search - Sales Search |
| Chelan | adapter-ready | P1 | Direct sales search | Dedicated Sales Search + Monthly Sales Reports |
| Clallam | adapter-ready | P1 | Direct sales search | Dedicated Sales Search |
| Clark | adapter-ready | P1 | Direct sales search | Property Information Center sales history + Residential Property Sales Information |
| Columbia | adapter-ready | P1 | Monthly sales report | Sales Data page + category sales reports (bare land, city homes, rural residential, etc.) |
| Cowlitz | adapter-ready | P1 | Parcel transfer history | Parcel detail conveyances + Request Sales Report |
| Douglas | adapter-ready | P1 | Monthly report / parcel history | Monthly Sales |
| Ferry | researched | P2 | Unknown | Parcel-first via TaxSifter; direct sales search not verified in this pass |
| Franklin | adapter-ready | P1 | Parcel transfer history | Assessor / REETSifter sales search and assessor map sale information |
| Garfield | adapter-ready | P1 | Direct sales search | Property Sales |
| Grant | adapter-ready | P1 | Direct sales search | Sales Search + Current Sales reports |
| Grays Harbor | adapter-ready | P1 | Direct sales search | Sale Search / Sales Search - Parcel Sales Search |
| Island | adapter-ready | P1 | Direct sales search | Island County Assessor & Treasurer Sales Search |
| Jefferson | adapter-ready | P1 | Direct sales search | Jefferson County PropertyAccess Sales Search |
| King | adapter-ready | P1 | Direct sales search | eSales Search |
| Kitsap | adapter-ready | P1 | Parcel transfer history / open data export | Parcel Details sales history + Sales Data / prior-year residential sales |
| Kittitas | adapter-ready | P1 | Direct sales search | Kittitas County Assessor TaxSifter Sales Search |
| Klickitat | adapter-ready | P2 | Monthly sales report | Klickitat County Assessor Sales Reports |
| Lewis | adapter-ready | P1 | Monthly sales report | Sales Data pages by year/market area |
| Lincoln | adapter-ready | P1 | Direct sales search | Sales Search |
| Mason | adapter-ready | P1 | Monthly sales report | Mason County Assessor Sales Data by Area & Neighborhood |
| Okanogan | adapter-ready | P2 | Direct sales search | Comparable Sales + TaxSifter parcel/property records |
| Pacific | researched | P2 | Parcel transfer history | TaxSifter parcel-detail transfer history |
| Pend Oreille | adapter-ready | P1 | Direct sales search | Sales Search |
| Pierce | adapter-ready | P1 | Direct sales search | ATIP comparable sales information |
| San Juan | adapter-ready | P1 | Direct sales search | Sales Search + Sales Data page |
| Skagit | adapter-ready | P1 | Direct sales search | Assessor Comparable Sales Search + sales data files / iMap |
| Skamania | not-started | P3 | Unknown | Research needed |
| Snohomish | adapter-ready | P1 | Direct sales search | Property Sales Search + County Sales report (Excel/PDF) |
| Spokane | adapter-ready | P1 | Direct sales search | SCOUT Sales Search |
| Stevens | adapter-ready | P1 | Direct sales search | Sales Search |
| Thurston | adapter-ready | P2 | Parcel transfer history | A+ parcel lookup neighborhood sales / property history |
| Wahkiakum | researched | P2 | Parcel transfer history | PropertyAccess detail pages; no dedicated public sales-search endpoint verified in this pass |
| Walla Walla | adapter-ready | P1 | Direct sales search | Walla Walla County PropertyAccess Sales Search |
| Whatcom | adapter-ready | P1 | Direct sales search | Sales Search + Neighborhood Market Study & Valuation Sales Data |
| Whitman | not-started | P3 | Unknown | Research needed |
| Yakima | adapter-ready | P2 | Direct sales search | Sales Searches |
