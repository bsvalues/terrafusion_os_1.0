/**
 * Harris PACS Read-Only API Client
 *
 * Typed TypeScript client for the Harris PACS integration endpoints.
 * All operations are READ-ONLY per pacscontract.v1 SpecLock.
 *
 * Backend controllers:
 *   - HarrisPACSIntegrationController  (route: /api/HarrisPACSIntegration)
 *   - ProductionPACSIntegrationController (route: /api/production/pacs)
 *
 * @see docs/spec-lock/locks/pacscontract/pacscontract.v1/SPEC_LOCK_v1.0.0.md
 */

import api from '@/services/api';
import type {
  PacsPropertyCore,
  PacsPropertyOwnership,
  PacsAssessmentHistory,
  PacsHealthStatus,
  PACSProperty,
  PACSOwner,
  PACSAssessment,
  PropertySearchQuery,
  PacsApiError,
} from '@/types/harrisPacs';

// ═══════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════

/** Maximum number of retry attempts for transient failures. */
const MAX_RETRIES = 3;

/** Base delay in milliseconds for exponential backoff. */
const BASE_DELAY_MS = 500;

/** HTTP status codes that are safe to retry. */
const RETRYABLE_STATUS_CODES = new Set([408, 429, 500, 502, 503, 504]);

// ═══════════════════════════════════════════════════════════════
// ERROR HANDLING
// ═══════════════════════════════════════════════════════════════

/**
 * Error class for PACS API failures.
 * Wraps the structured error response from the backend.
 */
export class HarrisPacsError extends Error {
  /** HTTP status code from the response. */
  public readonly status: number;
  /** Detailed error information from the backend. */
  public readonly details: string | string[];
  /** PACS-specific error code when available. */
  public readonly pacsErrorCode?: string;
  /** Timestamp of the error occurrence. */
  public readonly timestamp: string;

  constructor(apiError: PacsApiError) {
    super(apiError.error);
    this.name = 'HarrisPacsError';
    this.status = apiError.status;
    this.details = apiError.details;
    this.pacsErrorCode = apiError.pacsErrorCode;
    this.timestamp = apiError.timestamp;
  }
}

// ═══════════════════════════════════════════════════════════════
// RETRY & REQUEST HELPERS
// ═══════════════════════════════════════════════════════════════

/**
 * Sleeps for the given number of milliseconds.
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Determines whether a failed request should be retried based on the error.
 */
function isRetryable(error: unknown): boolean {
  if (typeof error === 'object' && error !== null && 'response' in error) {
    const axiosErr = error as { response?: { status?: number } };
    const status = axiosErr.response?.status;
    if (status !== undefined) {
      return RETRYABLE_STATUS_CODES.has(status);
    }
  }
  // Network errors (no response) are retryable
  if (typeof error === 'object' && error !== null && 'request' in error) {
    return true;
  }
  return false;
}

/**
 * Executes an async function with exponential-backoff retry logic.
 *
 * @param fn - The async operation to execute.
 * @param retries - Maximum number of retries (default: MAX_RETRIES).
 * @returns The result of the operation.
 * @throws The last error if all retries are exhausted.
 */
async function withRetry<T>(fn: () => Promise<T>, retries: number = MAX_RETRIES): Promise<T> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (attempt < retries && isRetryable(error)) {
        const delay = BASE_DELAY_MS * Math.pow(2, attempt);
        console.warn(
          `[harrisPacsClient] Request failed (attempt ${attempt + 1}/${retries + 1}), retrying in ${delay}ms...`,
        );
        await sleep(delay);
        continue;
      }

      break;
    }
  }

  throw lastError;
}

/**
 * Normalizes an Axios error into a typed HarrisPacsError.
 */
function toHarrisPacsError(error: unknown): HarrisPacsError {
  if (error instanceof HarrisPacsError) {
    return error;
  }

  if (typeof error === 'object' && error !== null && 'response' in error) {
    const axiosErr = error as {
      response?: { status?: number; data?: Record<string, unknown> };
      message?: string;
    };
    const status = axiosErr.response?.status ?? 0;
    const data = axiosErr.response?.data;

    return new HarrisPacsError({
      status,
      error:
        typeof data?.error === 'string' ? data.error : axiosErr.message ?? 'Unknown PACS error',
      details: Array.isArray(data?.details)
        ? (data.details as string[])
        : typeof data?.details === 'string'
          ? data.details
          : axiosErr.message ?? 'No details available',
      pacsErrorCode: typeof data?.pacsErrorCode === 'string' ? data.pacsErrorCode : undefined,
      timestamp:
        typeof data?.timestamp === 'string' ? data.timestamp : new Date().toISOString(),
    });
  }

  return new HarrisPacsError({
    status: 0,
    error: error instanceof Error ? error.message : 'Unknown PACS error',
    details: 'Network or client error',
    timestamp: new Date().toISOString(),
  });
}

// ═══════════════════════════════════════════════════════════════
// PACS API CLIENT
// ═══════════════════════════════════════════════════════════════

/**
 * Retrieves core property data by parcel ID.
 *
 * Maps to: GET /api/HarrisPACSIntegration/jurisdictions/{countyCode}/properties/{parcelId}
 *
 * @param countyCode - The county/jurisdiction code (e.g., "benton").
 * @param parcelId - The parcel ID or geo_id of the property.
 * @returns The property data.
 * @throws {HarrisPacsError} If the request fails or property is not found.
 */
export async function getProperty(
  countyCode: string,
  parcelId: string,
): Promise<PACSProperty> {
  try {
    const response = await withRetry(() =>
      api.get<PACSProperty>(
        `/HarrisPACSIntegration/jurisdictions/${encodeURIComponent(countyCode)}/properties/${encodeURIComponent(parcelId)}`,
      ),
    );
    return response.data;
  } catch (error) {
    throw toHarrisPacsError(error);
  }
}

/**
 * Retrieves ownership information for a property.
 *
 * Maps to: GET /api/HarrisPACSIntegration/jurisdictions/{countyCode}/properties/{parcelId}/owner
 *
 * @param countyCode - The county/jurisdiction code.
 * @param parcelId - The parcel ID or geo_id of the property.
 * @returns The ownership data.
 * @throws {HarrisPacsError} If the request fails or ownership is not found.
 */
export async function getPropertyOwnership(
  countyCode: string,
  parcelId: string,
): Promise<PACSOwner> {
  try {
    const response = await withRetry(() =>
      api.get<PACSOwner>(
        `/HarrisPACSIntegration/jurisdictions/${encodeURIComponent(countyCode)}/properties/${encodeURIComponent(parcelId)}/owner`,
      ),
    );
    return response.data;
  } catch (error) {
    throw toHarrisPacsError(error);
  }
}

/**
 * Retrieves assessment history for a property.
 *
 * Maps to: GET /api/HarrisPACSIntegration/jurisdictions/{countyCode}/properties/{parcelId}/assessments
 *
 * @param countyCode - The county/jurisdiction code.
 * @param parcelId - The parcel ID or geo_id of the property.
 * @returns Array of assessment records, ordered by year.
 * @throws {HarrisPacsError} If the request fails or property is not found.
 */
export async function getAssessmentHistory(
  countyCode: string,
  parcelId: string,
): Promise<PACSAssessment[]> {
  try {
    const response = await withRetry(() =>
      api.get<PACSAssessment[]>(
        `/HarrisPACSIntegration/jurisdictions/${encodeURIComponent(countyCode)}/properties/${encodeURIComponent(parcelId)}/assessments`,
      ),
    );
    return response.data;
  } catch (error) {
    throw toHarrisPacsError(error);
  }
}

/**
 * Checks the health of the Harris PACS integration.
 *
 * Maps to: GET /api/HarrisPACSIntegration/health
 *
 * Note: The health endpoint is AllowAnonymous on the backend, so this
 * call succeeds even without authentication.
 *
 * @param _countyCode - County code (reserved for future multi-county routing).
 * @returns The current health status.
 * @throws {HarrisPacsError} If the health check request itself fails.
 */
export async function checkHealth(_countyCode: string): Promise<PacsHealthStatus> {
  try {
    const response = await withRetry(() =>
      api.get<PacsHealthStatus>(`/HarrisPACSIntegration/health`),
    );
    return response.data;
  } catch (error) {
    throw toHarrisPacsError(error);
  }
}

/**
 * Searches properties within a jurisdiction.
 *
 * Maps to: GET /api/HarrisPACSIntegration/jurisdictions/{countyCode}/properties
 * with query parameters for pagination.
 *
 * Note: The backend currently supports page/pageSize pagination.
 * Additional filter parameters (q, propTypeCd, value ranges) are passed
 * as query parameters and may require backend support for full filtering.
 *
 * @param countyCode - The county/jurisdiction code.
 * @param query - Search query parameters.
 * @returns Array of matching properties.
 * @throws {HarrisPacsError} If the request fails.
 */
export async function searchProperties(
  countyCode: string,
  query: PropertySearchQuery,
): Promise<PACSProperty[]> {
  try {
    const params: Record<string, string | number> = {};

    if (query.page !== undefined) {
      params.page = query.page;
    }
    if (query.pageSize !== undefined) {
      params.pageSize = Math.min(query.pageSize, 1000);
    }
    if (query.q !== undefined && query.q.trim().length > 0) {
      params.q = query.q.trim();
    }
    if (query.propTypeCd !== undefined) {
      params.propTypeCd = query.propTypeCd;
    }
    if (query.minAssessedVal !== undefined) {
      params.minAssessedVal = query.minAssessedVal;
    }
    if (query.maxAssessedVal !== undefined) {
      params.maxAssessedVal = query.maxAssessedVal;
    }

    const response = await withRetry(() =>
      api.get<PACSProperty[]>(
        `/HarrisPACSIntegration/jurisdictions/${encodeURIComponent(countyCode)}/properties`,
        { params },
      ),
    );
    return response.data;
  } catch (error) {
    throw toHarrisPacsError(error);
  }
}

// ═══════════════════════════════════════════════════════════════
// CONVENIENCE EXPORTS
// ═══════════════════════════════════════════════════════════════

/**
 * Bundled Harris PACS client for convenient imports.
 *
 * Usage:
 * ```ts
 * import { harrisPacsClient } from '@/services/harrisPacsClient';
 *
 * const property = await harrisPacsClient.getProperty('benton', '12345');
 * const owner = await harrisPacsClient.getPropertyOwnership('benton', '12345');
 * const history = await harrisPacsClient.getAssessmentHistory('benton', '12345');
 * const health = await harrisPacsClient.checkHealth('benton');
 * const results = await harrisPacsClient.searchProperties('benton', { page: 1, pageSize: 50 });
 * ```
 */
export const harrisPacsClient = {
  getProperty,
  getPropertyOwnership,
  getAssessmentHistory,
  checkHealth,
  searchProperties,
} as const;

export default harrisPacsClient;
