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

// Benton County residential neighborhood analysis groups — sourced from PACS hood_cd
// (Sales Analysis Trending spreadsheets, Reval 1–6, extracted 2026-04-10).
//
// Values are 4-digit analysis-group codes (Reval 1–5) or 6-digit codes (Reval 6).
// These match the groupings assessors use in annual trend analysis.
// The PACS database stores sub-codes (5-digit, e.g. 11010, 11020) within each group;
// for cost approach purposes the analysis-group level is the operative unit.
//
// Region mapping drives the cost matrix multiplier sent to POST /api/costforge/cost-estimate:
//   Central (1.00) — Kennewick urban, most of Richland, Reval 1/2/3/6
//   East    (0.95) — Benton City, Finley/Nine Canyon, rural east, Reval 4 east
//   West    (1.05) — West Richland, Prosser, Reval 5, Reval 4 west, outer Reval 6
//
// This list is NOT permanent — neighborhoods are reassigned across Reval cycles.
// Future: load dynamically from GET /api/costforge/neighborhoods when that route is wired.
export const NEIGHBORHOODS = [
  // ── Reval 1 — Kennewick NE ──────────────────────────────────────────────
  { value: '1101', label: '1101 — Island View',                    reval: 1, region: 'Central' },
  { value: '1102', label: '1102 — The Ridge',                      reval: 1, region: 'Central' },
  { value: '1103', label: '1103 — Tri-City Heights',               reval: 1, region: 'Central' },
  { value: '1104', label: '1104 — Fountain Hills / Kennewick Park', reval: 1, region: 'Central' },
  { value: '1105', label: '1105 — Park Vista',                     reval: 1, region: 'Central' },
  { value: '1106', label: '1106 — Cherry View Heights',            reval: 1, region: 'Central' },
  { value: '1107', label: '1107 — The Highlands',                  reval: 1, region: 'Central' },
  { value: '1108', label: '1108 — Hansen Park / Hidden Estates',   reval: 1, region: 'Central' },
  { value: '1109', label: '1109 — Ranchette Estates',              reval: 1, region: 'Central' },
  { value: '1110', label: '1110 — Highland Vista',                 reval: 1, region: 'Central' },
  { value: '1111', label: '1111 — Belaire',                        reval: 1, region: 'Central' },
  { value: '1112', label: '1112 — Windsong',                       reval: 1, region: 'Central' },
  { value: '1113', label: '1113 — Southcliffe',                    reval: 1, region: 'Central' },
  { value: '1114', label: '1114 — Creekstone / Panoramic Heights', reval: 1, region: 'Central' },
  { value: '1115', label: '1115 — Lincoln Meadows / Union West',   reval: 1, region: 'Central' },
  { value: '1116', label: '1116 — Cherry Blossom',                 reval: 1, region: 'Central' },
  // ── Reval 2 — Kennewick Urban / West Kennewick ──────────────────────────
  { value: '1201', label: '1201 — Hawthorne',                      reval: 2, region: 'Central' },
  { value: '1202', label: '1202 — Bridge to Bridge',               reval: 2, region: 'Central' },
  { value: '1203', label: '1203 — Vista Homes',                    reval: 2, region: 'Central' },
  { value: '1204', label: '1204 — Downtown Kennewick',             reval: 2, region: 'Central' },
  { value: '1205', label: '1205 — Zintel Canyon',                  reval: 2, region: 'Central' },
  { value: '1206', label: '1206 — Park Hills',                     reval: 2, region: 'Central' },
  { value: '1207', label: '1207 — South Gum',                      reval: 2, region: 'Central' },
  { value: '1208', label: "1208 — Ohrt's",                         reval: 2, region: 'Central' },
  { value: '1209', label: '1209 — Columbia Rancho / Elliot Lake',  reval: 2, region: 'Central' },
  { value: '1210', label: '1210 — South of 45th',                  reval: 2, region: 'Central' },
  { value: '1211', label: '1211 — Nine Canyon',                    reval: 2, region: 'East'    },
  { value: '1212', label: '1212 — Finley Road',                    reval: 2, region: 'East'    },
  { value: '1213', label: '1213 — Finley',                         reval: 2, region: 'East'    },
  // ── Reval 3 — South Richland / Kennewick West ───────────────────────────
  { value: '1301', label: '1301 — West Vineyard / West Village',   reval: 3, region: 'West'    },
  { value: '1302', label: '1302 — Crested Hills',                  reval: 3, region: 'Central' },
  { value: '1303', label: '1303 — Skyline Meadows',                reval: 3, region: 'Central' },
  { value: '1304', label: '1304 — Meadow Springs',                 reval: 3, region: 'Central' },
  { value: '1305', label: '1305 — Meadows East',                   reval: 3, region: 'Central' },
  { value: '1306', label: '1306 — Willowbrook',                    reval: 3, region: 'Central' },
  { value: '1307', label: '1307 — The Heights',                    reval: 3, region: 'Central' },
  { value: '1308', label: '1308 — Ridge at Reata West',            reval: 3, region: 'Central' },
  { value: '1309', label: '1309 — Reata Ridge',                    reval: 3, region: 'Central' },
  { value: '1310', label: '1310 — Reata',                          reval: 3, region: 'Central' },
  { value: '1311', label: '1311 — Clearwater Creek',               reval: 3, region: 'Central' },
  { value: '1312', label: '1312 — Summit View',                    reval: 3, region: 'Central' },
  { value: '1313', label: '1313 — Cottonwood Springs',             reval: 3, region: 'Central' },
  { value: '1314', label: '1314 — Bridgewater Park / Canyon Ranch', reval: 3, region: 'Central' },
  // ── Reval 4 — Benton City (East) / Prosser (West) ───────────────────────
  { value: '1401', label: '1401 — Benton City',                    reval: 4, region: 'East'    },
  { value: '1402', label: '1402 — Benton City Outlying',           reval: 4, region: 'East'    },
  { value: '1403', label: '1403 — Valley View',                    reval: 4, region: 'East'    },
  { value: '1404', label: '1404 — Old Inland Empire',              reval: 4, region: 'East'    },
  { value: '1405', label: '1405 — Yakitat',                        reval: 4, region: 'East'    },
  { value: '1406', label: '1406 — Prosser',                        reval: 4, region: 'West'    },
  { value: '1407', label: '1407 — Prosser South',                  reval: 4, region: 'West'    },
  { value: '1408', label: '1408 — Prosser North',                  reval: 4, region: 'West'    },
  // ── Reval 5 — Richland West / Rural ─────────────────────────────────────
  { value: '1501', label: '1501 — Red Mountain',                   reval: 5, region: 'West'    },
  { value: '1502', label: '1502 — Harrington Road',                reval: 5, region: 'West'    },
  { value: '1503', label: '1503 — Canal Drive',                    reval: 5, region: 'West'    },
  { value: '1504', label: '1504 — Paradise Way',                   reval: 5, region: 'West'    },
  { value: '1505', label: '1505 — Willamette Heights North',       reval: 5, region: 'West'    },
  { value: '1506', label: '1506 — Highlands',                      reval: 5, region: 'West'    },
  { value: '1507', label: '1507 — Willamette Heights East',        reval: 5, region: 'West'    },
  { value: '1508', label: '1508 — Kingview / Cherry Hill Estates', reval: 5, region: 'West'    },
  { value: '1509', label: '1509 — The Lakes',                      reval: 5, region: 'West'    },
  { value: '1510', label: '1510 — Riverside',                      reval: 5, region: 'Central' },
  { value: '1511', label: '1511 — Glenbrook',                      reval: 5, region: 'West'    },
  { value: '1512', label: '1512 — Candy Mountain',                 reval: 5, region: 'West'    },
  // ── Reval 6 — Historic Richland (6-digit codes) ──────────────────────────
  { value: '160001', label: '160001 — Willow Pointe',                         reval: 6, region: 'Central' },
  { value: '160002', label: '160002 — University Park',                       reval: 6, region: 'Central' },
  { value: '160003', label: '160003 — Rivercrest Terrace',                    reval: 6, region: 'Central' },
  { value: '160004', label: '160004 — Carriage Hills / Richland Village',     reval: 6, region: 'Central' },
  { value: '160005', label: '160005 — Garden Park',                           reval: 6, region: 'Central' },
  { value: '160006', label: '160006 — East Historic Richland',                reval: 6, region: 'Central' },
  { value: '160007', label: '160007 — West Historic Richland',                reval: 6, region: 'West'    },
  { value: '160008', label: '160008 — North Historic Richland',               reval: 6, region: 'Central' },
  { value: '160009', label: '160009 — Central Historic Richland',             reval: 6, region: 'Central' },
  { value: '160010', label: '160010 — Columbia Heights',                      reval: 6, region: 'Central' },
  { value: '160011', label: '160011 — South Historic Richland',               reval: 6, region: 'Central' },
  { value: '160012', label: '160012 — Columbia Point / River Walk',           reval: 6, region: 'Central' },
  { value: '160013', label: '160013 — Hills West / Heritage Hills',           reval: 6, region: 'West'    },
  { value: '160014', label: '160014 — Tapteal West',                          reval: 6, region: 'West'    },
  { value: '160015', label: '160015 — Applewood Estates',                     reval: 6, region: 'West'    },
  { value: '160016', label: '160016 — Cherrywood Estates',                    reval: 6, region: 'West'    },
  { value: '160017', label: '160017 — Westcliffe',                            reval: 6, region: 'West'    },
  { value: '160018', label: '160018 — Badger Mountain Village',               reval: 6, region: 'West'    },
  { value: '160019', label: '160019 — Aspen Meadows / Lexington Heights',     reval: 6, region: 'West'    },
  { value: '160020', label: '160020 — Sagewood Meadows / Badger Park Estates', reval: 6, region: 'West'  },
] as const;

// Lookup helper: neighborhood analysis-group code → API region short code
// Region is embedded in each neighborhood entry; falls back to Central if unknown.
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

// Quality grades — UPPERCASE enum values matching CostEstimateRequest in CostForgeController.cs
export const QUALITY_GRADES = [
  { value: 'ECONOMY',  label: 'Economy',  factor: 0.75 },
  { value: 'STANDARD', label: 'Standard', factor: 1.00 },
  { value: 'CUSTOM',   label: 'Custom',   factor: 1.12 },
  { value: 'PREMIUM',  label: 'Premium',  factor: 1.30 },
  { value: 'LUXURY',   label: 'Luxury',   factor: 1.55 },
] as const;

// Condition grades — UPPERCASE enum values matching CostEstimateRequest in CostForgeController.cs
export const CONDITION_GRADES = [
  { value: 'POOR',      label: 'Poor',      factor: 0.65 },
  { value: 'FAIR',      label: 'Fair',      factor: 0.80 },
  { value: 'GOOD',      label: 'Good',      factor: 1.00 },
  { value: 'EXCELLENT', label: 'Excellent', factor: 1.10 },
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
