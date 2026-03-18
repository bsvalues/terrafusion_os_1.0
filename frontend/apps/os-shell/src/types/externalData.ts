/**
 * BIV-082: External Data Type Definitions
 *
 * Types for third-party / external data sources ingested by the OS.
 */

// ---------------------------------------------------------------------------
// Weather & Climate
// ---------------------------------------------------------------------------

export interface WeatherData {
  stationId: string;
  recordedAt: string;
  temperatureF: number;
  humidity: number;
  windSpeedMph: number;
  precipitationIn: number;
  condition: string;
  source: string;
}

export interface ClimateData {
  region: string;
  year: number;
  avgHighF: number;
  avgLowF: number;
  annualPrecipitationIn: number;
  growingSeasonDays: number;
  heatingDegreeDays: number;
  coolingDegreeDays: number;
  hardinessZone: string;
  source: string;
}

// ---------------------------------------------------------------------------
// Demographics
// ---------------------------------------------------------------------------

export interface DemographicData {
  geographyId: string;
  geographyName: string;
  year: number;
  population: number;
  medianAge: number;
  medianHouseholdIncome: number;
  perCapitaIncome: number;
  povertyRate: number;
  homeownershipRate: number;
  medianHomeValue: number;
  vacancyRate: number;
  source: string;
}

export interface CensusRecord {
  geoid: string;
  state: string;
  county: string;
  tract: string;
  blockGroup?: string;
  year: number;
  totalPopulation: number;
  totalHousingUnits: number;
  occupiedHousingUnits: number;
  vacantHousingUnits: number;
  medianRent: number;
  medianHomeValue: number;
  medianHouseholdIncome: number;
  source: 'ACS' | 'DECENNIAL' | 'PEP';
  vintage: string;
}

// ---------------------------------------------------------------------------
// Hazard / Overlay
// ---------------------------------------------------------------------------

export interface FloodZoneData {
  parcelId: string;
  femaZone: string;
  panelNumber: string;
  effectiveDate: string;
  baseFloodElevation?: number;
  floodway: boolean;
  communityNumber: string;
  source: string;
}

// ---------------------------------------------------------------------------
// School Districts
// ---------------------------------------------------------------------------

export interface SchoolDistrictData {
  districtId: string;
  districtName: string;
  state: string;
  county: string;
  gradeRange: string;
  totalEnrollment: number;
  studentTeacherRatio: number;
  levyRate?: number;
  bondRate?: number;
  source: string;
}
