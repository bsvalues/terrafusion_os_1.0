/**
 * TerraFusion OS SDK - Government AI Application Development Kit
 *
 * Championship-level SDK for building government AI applications on the
 * TerraFusion operating system platform with county data isolation,
 * FISMA-HIGH compliance, and AI swarm coordination.
 */

// Core SDK exports
export * from './ai';
export * from './auth';
export * from './core';
export * from './county';
export * from './government';
export * from './types';
export * from './utils';

// Client factory
export { TerraFusionClient } from './client';

// React hooks (optional)
export * from './react';

// Constants
export const TERRAFUSION_SDK_VERSION = '1.0.0';
export const TERRAFUSION_MOTTO = 'Government. Transcended.';

/**
 * Initialize TerraFusion SDK with configuration
 *
 * @example
 * ```typescript
 * import { initTerraFusion } from '@terrafusion/sdk';
 *
 * const client = initTerraFusion({
 *   apiUrl: 'https://api.terrafusionmarket.com',
 *   countyId: 'benton',
 *   environment: 'production',
 *   fismaMode: true
 * });
 * ```
 */
export { initTerraFusion } from './core/init';
