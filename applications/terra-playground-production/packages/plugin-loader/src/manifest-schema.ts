/**
 * Plugin Manifest Schema
 *
 * Defines the structure and validation for plugin manifests.
 */

import { z } from 'zod';

/**
 * Plugin manifest schema using Zod for validation
 */
export const PluginManifestSchema = z.object({
  /**
   * Plugin unique identifier
   */
  id: z
    .string()
    .min(3)
    .max(100)
    .regex(/^[a-z0-9-]+$/),

  /**
   * Plugin name for display
   */
  name: z.string().min(1).max(50),

  /**
   * Plugin description
   */
  description: z.string().max(500),

  /**
   * Plugin version (semver)
   */
  version: z
    .string()
    .regex(
      /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/
    ),

  /**
   * Plugin author information
   */
  author: z.object({
    name: z.string(),
    email: z.string().email().optional(),
    url: z.string().url().optional(),
  }),

  /**
   * Compatible Terrafusion core version
   */
  peerVersion: z
    .string()
    .regex(
      /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/
    ),

  /**
   * Plugin homepage URL
   */
  homepage: z.string().url().optional(),

  /**
   * License information
   */
  license: z.string().optional(),

  /**
   * Plugin entry point
   */
  main: z.string(),

  /**
   * Plugin icon (base64 encoded or URL)
   */
  icon: z.string().optional(),

  /**
   * Plugin capabilities and permissions
   */
  capabilities: z.array(
    z.enum([
      'map-layer',
      'data-source',
      'property-card',
      'dashboard-widget',
      'report-template',
      'ai-agent',
      'export-format',
      'import-format',
      'settings-page',
      'workflow-step',
    ])
  ),

  /**
   * Plugin configuration schema
   */
  configSchema: z.record(z.any()).optional(),

  /**
   * Plugin is premium (requires payment)
   */
  premium: z.boolean().default(false),

  /**
   * Plugin signature for verification
   */
  signed: z.object({
    fingerprint: z.string(),
    signature: z.string(),
    publicKey: z.string().optional(),
    keyId: z.string().optional(),
    timestamp: z.string(),
  }),

  /**
   * Plugin dependencies
   */
  dependencies: z.record(z.string()).optional(),

  /**
   * Keywords for search
   */
  keywords: z.array(z.string()).optional(),

  /**
   * Categories for marketplace organization
   */
  categories: z
    .array(
      z.enum([
        'analysis',
        'visualization',
        'data-management',
        'reporting',
        'integration',
        'productivity',
        'ai',
        'utilities',
      ])
    )
    .optional(),

  /**
   * Repository information
   */
  repository: z
    .object({
      type: z.enum(['git', 'svn']),
      url: z.string().url(),
    })
    .optional(),

  /**
   * Minimum system requirements
   */
  systemRequirements: z
    .object({
      memory: z.string().optional(),
      cpu: z.string().optional(),
      storage: z.string().optional(),
      gpu: z.string().optional(),
    })
    .optional(),

  /**
   * Screenshots for marketplace display
   */
  screenshots: z
    .array(
      z.object({
        url: z.string().url(),
        caption: z.string().optional(),
      })
    )
    .optional(),

  /**
   * Plugin changelog
   */
  changelog: z.string().optional(),

  /**
   * Custom metadata
   */
  meta: z.record(z.any()).optional(),
});

/**
 * Plugin manifest type
 */
export type PluginManifest = z.infer<typeof PluginManifestSchema>;

/**
 * Validate a plugin manifest
 */
export function validateManifest(manifest: any): { valid: boolean; errors?: any } {
  try {
    PluginManifestSchema.parse(manifest);
    return { valid: true };
  } catch (error) {
    return { valid: false, errors: error };
  }
}
