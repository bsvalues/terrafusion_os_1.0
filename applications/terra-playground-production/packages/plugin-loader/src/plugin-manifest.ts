import { z } from 'zod';

/**
 * Plugin Manifest Schema
 *
 * Defines the structure and validation rules for plugin manifest files
 * which are used to describe and load plugins in the Terrafusion platform.
 */

// Author schema
export const pluginAuthorSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email().optional(),
  url: z.string().url().optional(),
  organization: z.string().max(100).optional(),
});

export type PluginAuthor = z.infer<typeof pluginAuthorSchema>;

// Plugin license schema
export const pluginLicenseSchema = z.enum([
  'MIT',
  'Apache-2.0',
  'GPL-3.0',
  'BSD-3-Clause',
  'proprietary',
  'custom',
]);

export type PluginLicense = z.infer<typeof pluginLicenseSchema>;

// Plugin dependency schema
export const pluginDependencySchema = z.object({
  id: z.string().min(1).max(100),
  version: z.string().regex(/^(\d+\.\d+\.\d+)$/),
  optional: z.boolean().default(false),
});

export type PluginDependency = z.infer<typeof pluginDependencySchema>;

// Plugin permission schema
export const pluginPermissionSchema = z.enum([
  'fs:read',
  'fs:write',
  'network:outbound',
  'network:inbound',
  'data:read',
  'data:write',
  'ui:display',
  'user:read',
  'team:read',
  'gis:read',
  'gis:write',
]);

export type PluginPermission = z.infer<typeof pluginPermissionSchema>;

// Plugin pricing model schema
export const pluginPricingModelSchema = z.enum(['free', 'freemium', 'paid', 'subscription']);

export type PluginPricingModel = z.infer<typeof pluginPricingModelSchema>;

// Plugin payment info schema
export const pluginPaymentInfoSchema = z.object({
  model: pluginPricingModelSchema,
  price: z.number().nonnegative().optional(),
  currency: z.string().length(3).default('USD'),
  trial: z.number().int().nonnegative().optional(),
  stripeProductId: z.string().optional(),
  stripePriceId: z.string().optional(),
});

export type PluginPaymentInfo = z.infer<typeof pluginPaymentInfoSchema>;

// Main plugin manifest schema
export const pluginManifestSchema = z.object({
  id: z
    .string()
    .min(3)
    .max(100)
    .regex(/^[a-z0-9-]+$/),
  name: z.string().min(1).max(100),
  description: z.string().max(500),
  version: z.string().regex(/^(\d+\.\d+\.\d+)$/),
  author: pluginAuthorSchema,
  license: pluginLicenseSchema,
  repository: z.string().url().optional(),
  homepage: z.string().url().optional(),
  main: z.string().default('index.js'),
  typings: z.string().optional(),
  minApiVersion: z.string().regex(/^(\d+\.\d+\.\d+)$/),
  maxApiVersion: z
    .string()
    .regex(/^(\d+\.\d+\.\d+)$/)
    .optional(),
  dependencies: z.array(pluginDependencySchema).default([]),
  permissions: z.array(pluginPermissionSchema).default([]),
  tags: z.array(z.string()).default([]),
  signature: z.string().optional(),
  payment: pluginPaymentInfoSchema.optional(),
  assets: z.array(z.string()).default([]),
  configSchema: z.record(z.any()).optional(),
});

export type PluginManifest = z.infer<typeof pluginManifestSchema>;

// Export insert/update schema for API endpoints
export const pluginManifestInsertSchema = pluginManifestSchema.omit({
  signature: true,
});

export type PluginManifestInsert = z.infer<typeof pluginManifestInsertSchema>;
