export const APP_NAME = 'TerraBuild';
export const BENTON_COUNTY_ID = 'benton';
export const DEFAULT_ASSESSMENT_YEAR = new Date().getFullYear();
export const API_BASE = '/api';
export const COST_MATRIX_VERSION = '2026.1';

export const API_METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'] as const;

export const APP_DETAILS = {
  name: APP_NAME,
  version: COST_MATRIX_VERSION,
  county: 'Benton County, WA',
  description: 'Property Valuation & Cost Analysis Engine',
};

// 12 building types verified from benton_matrix_exact_identifiers.json
// NOTE: C3, A2, S2 do NOT exist in Benton. S1=Storage, C4=Office Building, C1=Central Commercial.
export const BUILDING_TYPES = [
  { value: 'R1', label: 'Residential — Single Family' },
  { value: 'R2', label: 'Residential — Multi-Family' },
  { value: 'R3', label: 'Residential — Manufactured Home' },
  { value: 'C1', label: 'Commercial — Central Commercial' },
  { value: 'C2', label: 'Commercial — General Commercial' },
  { value: 'C4', label: 'Commercial — Office Building' },
  { value: 'I1', label: 'Industrial — Light Industrial' },
  { value: 'I2', label: 'Industrial — Heavy Industrial' },
  { value: 'A1', label: 'Agricultural' },
  { value: 'S1', label: 'Storage' },
  { value: 'OS', label: 'Open Space' },
  { value: 'PF', label: 'Public Facility' },
] as const;

// Keep legacy alias for any existing imports
export const buildingTypes = BUILDING_TYPES;

// Benton County residential neighborhood codes — actual PACS hood_cd values
// sourced from pacs_property_profiles.NeighborhoodCode in terrafusion-dev.db.
//
// Each entry uses the primary (group-start) 5-digit hood_cd for each analysis group.
// Sub-codes within a group (e.g. 11011, 11012...) share the same cost factors.
// Descriptions from Benton County Sales Analysis Trending spreadsheets (Reval 1–6).
//
// PACS rgn_cd does NOT map to CostForge regions — the region field below is
// the CostForge cost-matrix region derived from geographic classification:
//   Central (1.00) — Kennewick urban, most of Richland
//   East    (0.95) — Benton City, Finley, Nine Canyon, rural east
//   West    (1.05) — West Richland, Prosser, Reval 5
//
// This list changes across Reval cycles. Future: load from GET /api/costforge/neighborhoods.
export const NEIGHBORHOODS = [
  // ── Reval 1 — Kennewick NE ──────────────────────────────────────────────
  { value: '11010', label: '11010 — Island View',                    reval: 1, region: 'Central' },
  { value: '11020', label: '11020 — The Ridge',                      reval: 1, region: 'Central' },
  { value: '11030', label: '11030 — Tri-City Heights',               reval: 1, region: 'Central' },
  { value: '11040', label: '11040 — Fountain Hills / Kennewick Park', reval: 1, region: 'Central' },
  { value: '11050', label: '11050 — Park Vista',                     reval: 1, region: 'Central' },
  { value: '11060', label: '11060 — Cherry View Heights',            reval: 1, region: 'Central' },
  { value: '11070', label: '11070 — The Highlands',                  reval: 1, region: 'Central' },
  { value: '11080', label: '11080 — Hansen Park / Hidden Estates',   reval: 1, region: 'Central' },
  { value: '11090', label: '11090 — Ranchette Estates',              reval: 1, region: 'Central' },
  { value: '11100', label: '11100 — Highland Vista',                 reval: 1, region: 'Central' },
  { value: '11110', label: '11110 — Belaire',                        reval: 1, region: 'Central' },
  { value: '11120', label: '11120 — Windsong',                       reval: 1, region: 'Central' },
  { value: '11130', label: '11130 — Southcliffe',                    reval: 1, region: 'Central' },
  { value: '11140', label: '11140 — Creekstone / Panoramic Heights', reval: 1, region: 'Central' },
  { value: '11150', label: '11150 — Lincoln Meadows / Union West',   reval: 1, region: 'Central' },
  { value: '11160', label: '11160 — Cherry Blossom',                 reval: 1, region: 'Central' },
  // ── Reval 2 — Kennewick Urban / West Kennewick ──────────────────────────
  { value: '12010', label: '12010 — Hawthorne',                      reval: 2, region: 'Central' },
  { value: '12020', label: '12020 — Bridge to Bridge',               reval: 2, region: 'Central' },
  { value: '12030', label: '12030 — Vista Homes',                    reval: 2, region: 'Central' },
  { value: '12040', label: '12040 — Downtown Kennewick',             reval: 2, region: 'Central' },
  { value: '12050', label: '12050 — Zintel Canyon',                  reval: 2, region: 'Central' },
  { value: '12060', label: '12060 — Park Hills',                     reval: 2, region: 'Central' },
  { value: '12070', label: '12070 — South Gum',                      reval: 2, region: 'Central' },
  { value: '12080', label: "12080 — Ohrt's",                         reval: 2, region: 'Central' },
  { value: '12090', label: '12090 — Columbia Rancho / Elliot Lake',  reval: 2, region: 'Central' },
  { value: '12100', label: '12100 — South of 45th',                  reval: 2, region: 'Central' },
  { value: '12110', label: '12110 — Nine Canyon',                    reval: 2, region: 'East'    },
  { value: '12120', label: '12120 — Finley Road',                    reval: 2, region: 'East'    },
  { value: '12130', label: '12130 — Finley',                         reval: 2, region: 'East'    },
  { value: '12999', label: '12999 — MH on Leased Land',              reval: 2, region: 'Central' },
  // ── Reval 3 — South Richland / Kennewick West ───────────────────────────
  { value: '13010', label: '13010 — West Vineyard / West Village',   reval: 3, region: 'West'    },
  { value: '13020', label: '13020 — Crested Hills',                  reval: 3, region: 'Central' },
  { value: '13030', label: '13030 — Skyline Meadows',                reval: 3, region: 'Central' },
  { value: '13040', label: '13040 — Meadow Springs',                 reval: 3, region: 'Central' },
  { value: '13050', label: '13050 — Meadows East',                   reval: 3, region: 'Central' },
  { value: '13060', label: '13060 — Willowbrook',                    reval: 3, region: 'Central' },
  { value: '13070', label: '13070 — The Heights',                    reval: 3, region: 'Central' },
  { value: '13080', label: '13080 — Ridge at Reata West',            reval: 3, region: 'Central' },
  { value: '13090', label: '13090 — Reata Ridge',                    reval: 3, region: 'Central' },
  { value: '13100', label: '13100 — Reata',                          reval: 3, region: 'Central' },
  { value: '13110', label: '13110 — Clearwater Creek',               reval: 3, region: 'Central' },
  { value: '13120', label: '13120 — Summit View',                    reval: 3, region: 'Central' },
  { value: '13130', label: '13130 — Cottonwood Springs',             reval: 3, region: 'Central' },
  { value: '13140', label: '13140 — Bridgewater Park / Canyon Ranch', reval: 3, region: 'Central' },
  { value: '13150', label: '13150',                                  reval: 3, region: 'Central' },
  { value: '13160', label: '13160',                                  reval: 3, region: 'Central' },
  { value: '13170', label: '13170',                                  reval: 3, region: 'Central' },
  { value: '13180', label: '13180',                                  reval: 3, region: 'Central' },
  { value: '13190', label: '13190',                                  reval: 3, region: 'Central' },
  // ── Reval 4 — Benton City (East) / Prosser (West) ───────────────────────
  { value: '14010', label: '14010 — Benton City',                    reval: 4, region: 'East'    },
  { value: '14020', label: '14020 — Benton City Outlying',           reval: 4, region: 'East'    },
  { value: '14030', label: '14030 — Valley View',                    reval: 4, region: 'East'    },
  { value: '14040', label: '14040 — Old Inland Empire',              reval: 4, region: 'East'    },
  { value: '14050', label: '14050 — Yakitat',                        reval: 4, region: 'East'    },
  { value: '14060', label: '14060 — Prosser',                        reval: 4, region: 'West'    },
  { value: '14070', label: '14070 — Prosser South',                  reval: 4, region: 'West'    },
  { value: '14080', label: '14080 — Prosser North',                  reval: 4, region: 'West'    },
  { value: '14999', label: '14999 — MH on Leased Land',              reval: 4, region: 'East'    },
  // ── Reval 5 — Richland West / Rural ─────────────────────────────────────
  { value: '15010', label: '15010 — Red Mountain',                   reval: 5, region: 'West'    },
  { value: '15020', label: '15020 — Harrington Road',                reval: 5, region: 'West'    },
  { value: '15030', label: '15030 — Canal Drive',                    reval: 5, region: 'West'    },
  { value: '15040', label: '15040 — Paradise Way',                   reval: 5, region: 'West'    },
  { value: '15050', label: '15050 — Willamette Heights North',       reval: 5, region: 'West'    },
  { value: '15060', label: '15060 — Highlands',                      reval: 5, region: 'West'    },
  { value: '15070', label: '15070 — Willamette Heights East',        reval: 5, region: 'West'    },
  { value: '15080', label: '15080 — Kingview / Cherry Hill Estates', reval: 5, region: 'West'    },
  { value: '15090', label: '15090 — The Lakes',                      reval: 5, region: 'West'    },
  { value: '15100', label: '15100 — Riverside',                      reval: 5, region: 'Central' },
  { value: '15110', label: '15110 — Glenbrook',                      reval: 5, region: 'West'    },
  { value: '15120', label: '15120 — Candy Mountain',                 reval: 5, region: 'West'    },
  { value: '15130', label: '15130 — White Bluffs',                   reval: 5, region: 'West'    },
  { value: '15140', label: '15140 — Hearthstone',                    reval: 5, region: 'West'    },
  { value: '15150', label: '15150 — Horizon Heights',                reval: 5, region: 'West'    },
  { value: '15160', label: '15160 — Country Ridge',                  reval: 5, region: 'West'    },
  { value: '15170', label: '15170 — Skyline South',                  reval: 5, region: 'West'    },
  { value: '15180', label: '15180 — Tanglewood',                     reval: 5, region: 'West'    },
  { value: '15190', label: '15190 — Horn Rapids',                    reval: 5, region: 'West'    },
  { value: '15999', label: '15999 — MH on Leased Land',              reval: 5, region: 'West'    },
  // ── Reval 6 — Historic Richland ──────────────────────────────────────────
  { value: '16013', label: '16013 — Willow Pointe',                          reval: 6, region: 'Central' },
  { value: '16020', label: '16020 — University Park',                        reval: 6, region: 'Central' },
  { value: '16030', label: '16030 — Rivercrest Terrace',                     reval: 6, region: 'Central' },
  { value: '16040', label: '16040 — Carriage Hills / Richland Village',      reval: 6, region: 'Central' },
  { value: '16050', label: '16050 — Garden Park',                            reval: 6, region: 'Central' },
  { value: '16060', label: '16060 — East Historic Richland',                 reval: 6, region: 'Central' },
  { value: '16070', label: '16070 — West Historic Richland',                 reval: 6, region: 'West'    },
  { value: '16080', label: '16080 — North Historic Richland',                reval: 6, region: 'Central' },
  { value: '16090', label: '16090 — Central Historic Richland',              reval: 6, region: 'Central' },
  { value: '16100', label: '16100 — Columbia Heights',                       reval: 6, region: 'Central' },
  { value: '16110', label: '16110 — South Historic Richland',                reval: 6, region: 'Central' },
  { value: '16123', label: '16123 — Columbia Point / River Walk',            reval: 6, region: 'Central' },
  { value: '16130', label: '16130 — Hills West / Heritage Hills',            reval: 6, region: 'West'    },
  { value: '16140', label: '16140 — Tapteal West',                           reval: 6, region: 'West'    },
  { value: '16150', label: '16150 — Applewood Estates',                      reval: 6, region: 'West'    },
  { value: '16161', label: '16161 — Cherrywood Estates',                     reval: 6, region: 'West'    },
  { value: '16170', label: '16170 — Westcliffe',                             reval: 6, region: 'West'    },
  { value: '16180', label: '16180 — Badger Mountain Village',                reval: 6, region: 'West'    },
  { value: '16190', label: '16190 — Aspen Meadows / Lexington Heights',      reval: 6, region: 'West'    },
  { value: '16200', label: '16200 — Sagewood Meadows / Badger Park Estates', reval: 6, region: 'West'    },
] as const;

// Lookup helper: PACS hood_cd → CostForge API region short code
// Region is embedded in each entry; falls back to Central if code is unrecognized.
export function neighborhoodToRegion(neighborhoodValue: string): string {
  const match = NEIGHBORHOODS.find(n => n.value === neighborhoodValue);
  return match?.region ?? 'Central';
}

// Keep REGIONS for internal reference / any legacy code that reads it
export const REGIONS = [
  { value: 'Central', label: 'Central Benton', factor: 1.00 },
  { value: 'East',    label: 'East Benton',    factor: 0.95 },
  { value: 'West',    label: 'West Benton',    factor: 1.05 },
] as const;

export const regions = REGIONS;

// Quality (Class) grades — API enum values sent to CostEstimateRequest.
// Labels show actual PACS ClassCode numeric scale (10–60) from pacs_property_profiles.
// ClassCode 30 is the baseline average (26,967 records = majority).
// Numeric codes pass through PacsCanonicalizer unchanged — these are the values
// assessors see in PACS. The 5 API buckets collapse the finer PACS scale.
export const QUALITY_GRADES = [
  { value: 'ECONOMY',  label: 'Class 10/20 — Economy',       factor: 0.75 },
  { value: 'STANDARD', label: 'Class 25/30 — Standard',      factor: 1.00 },
  { value: 'CUSTOM',   label: 'Class 35 — Above Average',    factor: 1.12 },
  { value: 'PREMIUM',  label: 'Class 40/45 — High Quality',  factor: 1.30 },
  { value: 'LUXURY',   label: 'Class 50/55/60 — Exceptional', factor: 1.55 },
] as const;

// Condition grades — API enum values sent to CostEstimateRequest.
// Labels show actual PACS ConditionCode numeric scale (1–6) from pacs_property_profiles.
// Condition 3 is the baseline average (49,741 records = majority).
// The 4 API buckets collapse the 6-point PACS scale.
export const CONDITION_GRADES = [
  { value: 'POOR',      label: 'Cond 5/6 — Poor',         factor: 0.65 },
  { value: 'FAIR',      label: 'Cond 4 — Fair',           factor: 0.80 },
  { value: 'GOOD',      label: 'Cond 3 — Good (Avg)',     factor: 1.00 },
  { value: 'EXCELLENT', label: 'Cond 1/2 — Excellent',    factor: 1.10 },
] as const;

// Complexity grades — matching CostEstimateRequest in CostForgeController.cs
export const COMPLEXITY_GRADES = [
  { value: 'SIMPLE',         label: 'Simple',         factor: 0.90 },
  { value: 'STANDARD',       label: 'Standard',       factor: 1.00 },
  { value: 'COMPLEX',        label: 'Complex',        factor: 1.10 },
  { value: 'HIGHLY_COMPLEX', label: 'Highly Complex', factor: 1.20 },
] as const;

// Keep legacy alias (string-only, for any existing code expecting plain strings)
export const complexityLevels = COMPLEXITY_GRADES;

export const TEST_USERS = [
  { id: 1, username: 'admin', name: 'Admin User', role: 'admin' },
  { id: 2, username: 'assessor', name: 'County Assessor', role: 'assessor' },
  { id: 3, username: 'viewer', name: 'Read Only', role: 'viewer' },
];

export const EXPIRATION_OPTIONS = [
  { value: '1h', label: '1 Hour' },
  { value: '24h', label: '24 Hours' },
  { value: '7d', label: '7 Days' },
  { value: '30d', label: '30 Days' },
  { value: 'never', label: 'Never' },
];

export const QUICK_ACTIONS = [
  { label: 'New Calculation', href: '/calculator', icon: 'calculator' },
  { label: 'Import Data', href: '/data-import', icon: 'upload' },
  { label: 'View Reports', href: '/reports', icon: 'file-text' },
  { label: 'AI Analysis', href: '/ai-tools', icon: 'brain' },
];
