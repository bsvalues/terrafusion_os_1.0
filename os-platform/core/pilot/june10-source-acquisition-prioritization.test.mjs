import assert from "node:assert/strict";
import test from "node:test";

import { buildSourceAcquisitionPrioritization } from "./june10-source-acquisition-prioritization.mjs";

const baseCrosswalk = {
  rows: [
    {
      county: "Benton",
      registryStatus: "adapter-ready",
      priority: "P1",
      classification: "public_source_seed",
      acquisitionFamily: "Direct sales search"
    },
    {
      county: "Spokane",
      registryStatus: "adapter-ready",
      priority: "P1",
      classification: "public_source_seed",
      acquisitionFamily: "Direct sales search"
    },
    {
      county: "Kitsap",
      registryStatus: "adapter-ready",
      priority: "P1",
      classification: "public_source_seed",
      acquisitionFamily: "Parcel transfer history / open data export",
      officialAssessorBaseUrl: "https://www.kitsapgov.com",
      primarySalesSource: "Parcel Details sales history",
      fallbackSource: "weekly downloadable assessor TXT data",
      gisMapSurface: "Parcel Search Map",
      payloadFiles: ["kitsap.xlsx"],
      localDataFiles: [],
      evidenceFiles: []
    },
    {
      county: "Yakima",
      registryStatus: "adapter-ready",
      priority: "P2",
      classification: "public_source_seed",
      acquisitionFamily: "Direct sales search",
      officialAssessorBaseUrl: "https://www.yakimacounty.us",
      primarySalesSource: "Sales Searches",
      fallbackSource: "Other Searches",
      gisMapSurface: "Parcel Search",
      payloadFiles: [],
      localDataFiles: ["yakima.json"],
      evidenceFiles: []
    },
    {
      county: "Adams",
      registryStatus: "researched",
      priority: "P2",
      classification: "provenance_inventory_only",
      acquisitionFamily: "Parcel transfer history",
      officialAssessorBaseUrl: "https://co.adams.wa.us",
      primarySalesSource: "TaxSifter parcel search",
      fallbackSource: "MapSifter",
      gisMapSurface: "MapSifter",
      payloadFiles: [],
      localDataFiles: [],
      evidenceFiles: []
    },
    {
      county: "Pierce",
      registryStatus: "adapter-ready",
      priority: "P1",
      classification: "public_source_seed",
      acquisitionFamily: "Direct sales search",
      officialAssessorBaseUrl: "https://www.co.pierce.wa.us",
      primarySalesSource: "ATIP comparable sales information",
      fallbackSource: "PublicGIS/Open Data",
      gisMapSurface: "PublicGIS / Open Data",
      payloadFiles: ["pierce.zip"],
      localDataFiles: [],
      evidenceFiles: []
    },
    {
      county: "Whatcom",
      registryStatus: "adapter-ready",
      priority: "P1",
      classification: "public_source_seed",
      acquisitionFamily: "Direct sales search",
      officialAssessorBaseUrl: "https://www.co.whatcom.wa.us",
      primarySalesSource: "Sales Search",
      fallbackSource: "Property Data Downloads",
      gisMapSurface: "Interactive Tax Parcel Viewer",
      payloadFiles: [],
      localDataFiles: ["whatcom.json"],
      evidenceFiles: []
    },
    {
      county: "Klickitat",
      registryStatus: "adapter-ready",
      priority: "P2",
      classification: "public_source_seed",
      acquisitionFamily: "Monthly sales report",
      officialAssessorBaseUrl: "https://www.klickitatcounty.org",
      primarySalesSource: "Sales Reports",
      fallbackSource: "GIS",
      gisMapSurface: "Interactive Mapping Service",
      payloadFiles: ["klickitat.xlsx"],
      localDataFiles: [],
      evidenceFiles: []
    },
    {
      county: "Douglas",
      registryStatus: "adapter-ready",
      priority: "P1",
      classification: "provenance_inventory_only",
      acquisitionFamily: "Monthly report / parcel history",
      officialAssessorBaseUrl: "https://www.douglascountywa.gov",
      primarySalesSource: "Monthly Sales",
      fallbackSource: "Web Mapping",
      gisMapSurface: "Web Mapping",
      payloadFiles: [],
      localDataFiles: [],
      evidenceFiles: []
    }
  ]
};

const canonicalReconciliation = {
  counties: [
    { countyName: "Benton County", fips: "53005", parcelRows: 85000 },
    { countyName: "Spokane County", fips: "53063", parcelRows: 214004 },
    { countyName: "Kitsap County", fips: "53035", parcelRows: 116900 },
    { countyName: "Yakima County", fips: "53077", parcelRows: 102238 },
    { countyName: "Adams County", fips: "53001", parcelRows: 13324 },
    { countyName: "Pierce County", fips: "53053", parcelRows: 328832 },
    { countyName: "Whatcom County", fips: "53073", parcelRows: 116368 },
    { countyName: "Klickitat County", fips: "53039", parcelRows: 21305 },
    { countyName: "Douglas County", fips: "53017", parcelRows: 29778 }
  ]
};

const receiptReconciliation = {
  productionBindingAllowed: false,
  summary: {
    receiptsMissing: 6
  },
  missingFips: ["53001", "53017", "53035", "53039", "53053", "53073", "53077"],
  verifiedReceipts: [{ fips: "53063", countySlug: "spokane", status: "receipt_backed_full_identity" }]
};

test("prioritization excludes Benton and already-verified counties from remaining ranking", () => {
  const report = buildSourceAcquisitionPrioritization({
    crosswalk: baseCrosswalk,
    canonicalReconciliation,
    receiptReconciliation,
    yakimaRecapture: { recaptureDecision: "source_recapture_blocked_interactive_lookup_only" }
  });

  assert.equal(report.rankedCounties.some((row) => row.county === "Benton"), false);
  assert.equal(report.rankedCounties.some((row) => row.county === "Spokane"), false);
  assert.equal(report.doctrine.productionBindingAllowed, false);
  assert.equal(report.doctrine.databaseMutationAttempted, false);
});

test("prioritization prefers bulk/download evidence and keeps Yakima penalized", () => {
  const report = buildSourceAcquisitionPrioritization({
    crosswalk: baseCrosswalk,
    canonicalReconciliation,
    receiptReconciliation,
    yakimaRecapture: { recaptureDecision: "source_recapture_blocked_interactive_lookup_only" }
  });

  assert.deepEqual(
    report.nextWave.map((row) => row.county),
    ["Kitsap", "Pierce", "Whatcom", "Klickitat", "Douglas"]
  );

  const yakima = report.rankedCounties.find((row) => row.county === "Yakima");
  assert.equal(yakima.recommendedNextAction, "defer_until_governed_bulk_snapshot_exists");
  assert.match(yakima.expectedBlocker, /interactive lookup\/search only/);
});

test("prioritization reports receipt gaps and keeps runtime claims blocked", () => {
  const report = buildSourceAcquisitionPrioritization({
    crosswalk: baseCrosswalk,
    canonicalReconciliation,
    receiptReconciliation,
    yakimaRecapture: { recaptureDecision: "source_recapture_blocked_interactive_lookup_only" }
  });

  assert.match(report.blockers.join("\n"), /6 WA_INITIAL_SEED receipt gaps remain/);
  assert.equal(report.doctrine.runtimeClaimAllowed, false);
});
