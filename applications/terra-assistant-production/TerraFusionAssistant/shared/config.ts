/**
 * Terrafusion Shared Configuration
 * 
 * This file contains configuration values shared across
 * the Terrafusion application ecosystem.
 */

export const API_VERSION = 'v1';

export const DEFAULT_PORT = 4000;

export const STREAMLIT_PORT = 5000;

export const BRIDGE_PORT = 8000;

export const ENVIRONMENT = process.env.NODE_ENV || 'development';

export const isDevelopment = ENVIRONMENT === 'development';
export const isProduction = ENVIRONMENT === 'production';
export const isTest = ENVIRONMENT === 'test';

export const API_ENDPOINTS = {
  LEVY: `/api/${API_VERSION}/levy`,
  PROPERTIES: `/api/${API_VERSION}/properties`,
  PLUGINS: `/api/${API_VERSION}/plugins`,
  USERS: `/api/${API_VERSION}/users`,
  ANALYSIS: `/api/${API_VERSION}/analysis`,
  WORKFLOW_PATTERNS: `/api/${API_VERSION}/workflow-patterns`,
  SYNC: `/api/${API_VERSION}/sync`
};

export const DEFAULT_HEADERS = {
  'Content-Type': 'application/json'
};

export const CACHE_TTL = {
  SHORT: 60, // 1 minute
  MEDIUM: 300, // 5 minutes
  LONG: 3600, // 1 hour
  VERY_LONG: 86400 // 24 hours
};