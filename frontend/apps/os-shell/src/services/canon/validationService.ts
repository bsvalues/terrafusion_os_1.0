/**
 * BIV-149: Client-side validation service for sync data.
 * canon-sync = synchronization, connectors, orchestration. No appraisal math.
 */

import type { ValidationResult, ValidationSeverity } from '../../types/sync';

// --- Helpers ---

function result(
  field: string,
  rule: string,
  severity: ValidationSeverity,
  message: string,
): ValidationResult {
  return { field, rule, severity, message };
}

// --- Parcel ID Validation ---

/**
 * Validates a parcel identifier string.
 * Checks format, length, and character constraints.
 */
export function validateParcelId(id: unknown): ValidationResult[] {
  const results: ValidationResult[] = [];

  if (id === null || id === undefined || id === '') {
    results.push(result('parcelId', 'required', 'error', 'Parcel ID is required.'));
    return results;
  }

  if (typeof id !== 'string') {
    results.push(result('parcelId', 'type', 'error', 'Parcel ID must be a string.'));
    return results;
  }

  const trimmed = id.trim();

  if (trimmed !== id) {
    results.push(
      result('parcelId', 'whitespace', 'warning', 'Parcel ID has leading or trailing whitespace.'),
    );
  }

  if (trimmed.length < 5) {
    results.push(
      result('parcelId', 'minLength', 'error', 'Parcel ID must be at least 5 characters.'),
    );
  }

  if (trimmed.length > 30) {
    results.push(
      result('parcelId', 'maxLength', 'error', 'Parcel ID must not exceed 30 characters.'),
    );
  }

  // Only alphanumeric, hyphens, and dots allowed
  if (!/^[A-Za-z0-9.\-]+$/.test(trimmed)) {
    results.push(
      result(
        'parcelId',
        'format',
        'error',
        'Parcel ID may only contain letters, digits, hyphens, and dots.',
      ),
    );
  }

  return results;
}

// --- Sale Record Validation ---

export interface SaleRecordInput {
  parcelId?: unknown;
  saleDate?: unknown;
  salePrice?: unknown;
  buyerName?: unknown;
  sellerName?: unknown;
  instrumentNumber?: unknown;
  saleType?: unknown;
}

/**
 * Validates a sale record for sync import.
 * Checks required fields, types, and business rules.
 */
export function validateSaleRecord(record: SaleRecordInput): ValidationResult[] {
  const results: ValidationResult[] = [];

  // Parcel ID
  results.push(...validateParcelId(record.parcelId));

  // Sale date
  if (!record.saleDate) {
    results.push(result('saleDate', 'required', 'error', 'Sale date is required.'));
  } else {
    const d = new Date(record.saleDate as string);
    if (isNaN(d.getTime())) {
      results.push(result('saleDate', 'format', 'error', 'Sale date is not a valid date.'));
    } else if (d > new Date()) {
      results.push(result('saleDate', 'futureDate', 'warning', 'Sale date is in the future.'));
    }
  }

  // Sale price
  if (record.salePrice === null || record.salePrice === undefined) {
    results.push(result('salePrice', 'required', 'error', 'Sale price is required.'));
  } else {
    const price = Number(record.salePrice);
    if (isNaN(price)) {
      results.push(result('salePrice', 'type', 'error', 'Sale price must be a number.'));
    } else if (price < 0) {
      results.push(result('salePrice', 'range', 'error', 'Sale price cannot be negative.'));
    } else if (price === 0) {
      results.push(
        result('salePrice', 'zeroValue', 'warning', 'Sale price is zero; may indicate a non-arms-length transaction.'),
      );
    }
  }

  // Buyer name
  if (!record.buyerName || (typeof record.buyerName === 'string' && !record.buyerName.trim())) {
    results.push(result('buyerName', 'required', 'warning', 'Buyer name is missing.'));
  }

  // Seller name
  if (!record.sellerName || (typeof record.sellerName === 'string' && !record.sellerName.trim())) {
    results.push(result('sellerName', 'required', 'warning', 'Seller name is missing.'));
  }

  // Instrument number (optional but validated if present)
  if (record.instrumentNumber !== undefined && record.instrumentNumber !== null) {
    const inst = String(record.instrumentNumber).trim();
    if (inst.length > 0 && inst.length < 3) {
      results.push(
        result('instrumentNumber', 'minLength', 'warning', 'Instrument number seems too short.'),
      );
    }
  }

  return results;
}

// --- Property Data Validation ---

export interface PropertyDataInput {
  parcelId?: unknown;
  ownerName?: unknown;
  situsAddress?: unknown;
  legalDescription?: unknown;
  countyCode?: unknown;
  propertyClass?: unknown;
  acreage?: unknown;
  latitude?: unknown;
  longitude?: unknown;
}

/**
 * Validates property data for sync import.
 * Checks required fields, coordinate bounds, and data quality.
 */
export function validatePropertyData(data: PropertyDataInput): ValidationResult[] {
  const results: ValidationResult[] = [];

  // Parcel ID
  results.push(...validateParcelId(data.parcelId));

  // Owner name
  if (!data.ownerName || (typeof data.ownerName === 'string' && !data.ownerName.trim())) {
    results.push(result('ownerName', 'required', 'error', 'Owner name is required.'));
  }

  // Situs address
  if (!data.situsAddress || (typeof data.situsAddress === 'string' && !data.situsAddress.trim())) {
    results.push(result('situsAddress', 'required', 'warning', 'Situs address is missing.'));
  }

  // County code
  if (!data.countyCode) {
    results.push(result('countyCode', 'required', 'error', 'County code is required.'));
  } else if (typeof data.countyCode === 'string' && !/^[A-Z]{2}\d{3}$/.test(data.countyCode)) {
    results.push(
      result('countyCode', 'format', 'warning', 'County code does not match expected format (e.g. WA005).'),
    );
  }

  // Property class
  if (!data.propertyClass) {
    results.push(result('propertyClass', 'required', 'warning', 'Property class is missing.'));
  }

  // Acreage
  if (data.acreage !== undefined && data.acreage !== null) {
    const acres = Number(data.acreage);
    if (isNaN(acres)) {
      results.push(result('acreage', 'type', 'error', 'Acreage must be a number.'));
    } else if (acres < 0) {
      results.push(result('acreage', 'range', 'error', 'Acreage cannot be negative.'));
    } else if (acres > 100000) {
      results.push(
        result('acreage', 'range', 'warning', 'Acreage exceeds 100,000; verify value.'),
      );
    }
  }

  // Coordinates
  if (data.latitude !== undefined && data.latitude !== null) {
    const lat = Number(data.latitude);
    if (isNaN(lat) || lat < -90 || lat > 90) {
      results.push(result('latitude', 'range', 'error', 'Latitude must be between -90 and 90.'));
    }
  }

  if (data.longitude !== undefined && data.longitude !== null) {
    const lng = Number(data.longitude);
    if (isNaN(lng) || lng < -180 || lng > 180) {
      results.push(
        result('longitude', 'range', 'error', 'Longitude must be between -180 and 180.'),
      );
    }
  }

  return results;
}
