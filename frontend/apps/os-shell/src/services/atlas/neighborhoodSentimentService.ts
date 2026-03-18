/**
 * Neighborhood Sentiment Service (BIV-142)
 * ===================================================================
 * Fetches community sentiment scores and trend data for neighborhoods.
 * Sentiment covers safety, schools, amenities — NOT property values.
 *
 * @see /api/atlas/sentiment — backend endpoint
 */

import { getToken } from '@/auth/authStorage';
import { getViteEnv } from '@/env/getViteEnv';

const API_BASE_URL = getViteEnv().VITE_API_URL || '';
const SENTIMENT_API = `${API_BASE_URL}/api/atlas/sentiment`;

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/** Community sentiment score for a neighborhood */
export interface SentimentScore {
  /** Overall composite sentiment (0-100) */
  overall: number;
  /** Perceived safety rating (0-100) */
  safety: number;
  /** School quality perception (0-100) */
  schools: number;
  /** Amenity access score (0-100) */
  amenities: number;
  /** Trending direction: positive, stable, or declining */
  trending: 'up' | 'stable' | 'down';
}

/** A single data point in a sentiment trend series */
export interface SentimentTrend {
  /** ISO date string for this data point */
  date: string;
  /** Overall sentiment score at this point in time */
  overall: number;
  /** Safety score at this point in time */
  safety: number;
  /** Schools score at this point in time */
  schools: number;
  /** Amenities score at this point in time */
  amenities: number;
}

// ============================================================================
// HELPERS
// ============================================================================

function authHeaders(): Record<string, string> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

async function sentimentGet<T>(path: string): Promise<T> {
  const response = await fetch(`${SENTIMENT_API}${path}`, { headers: authHeaders() });
  if (!response.ok) throw new Error(`Sentiment API error: ${response.statusText}`);
  return response.json();
}

// ============================================================================
// SERVICE
// ============================================================================

export const neighborhoodSentimentService = {
  /**
   * Get the current sentiment score for a neighborhood.
   */
  getSentiment: async (neighborhoodCode: string): Promise<SentimentScore> => {
    return sentimentGet<SentimentScore>(
      `/${encodeURIComponent(neighborhoodCode)}`,
    );
  },

  /**
   * Get sentiment trend data over a number of months.
   * Returns one data point per month going back `months` months.
   */
  getSentimentTrend: async (
    neighborhoodCode: string,
    months: number,
  ): Promise<SentimentTrend[]> => {
    return sentimentGet<SentimentTrend[]>(
      `/${encodeURIComponent(neighborhoodCode)}/trend?months=${months}`,
    );
  },
};

export default neighborhoodSentimentService;
