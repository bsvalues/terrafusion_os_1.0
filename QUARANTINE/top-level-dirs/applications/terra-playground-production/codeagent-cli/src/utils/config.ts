import fs from 'fs';
import path from 'path';
import { z } from 'zod';

// Define the configuration schema
const ConfigSchema = z.object({
  apiKey: z.string().optional(),
  model: z.string().default('gpt-4o'),
  maxTokens: z.number().default(8192),
  temperature: z.number().min(0).max(2).default(0.7),
  contextSize: z.number().default(5),
  logLevel: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  plugins: z.array(z.string()).default([]),
  toolSettings: z.record(z.any()).default({}),
  userPreferences: z
    .object({
      codeStyle: z.string().default('standard'),
      indentation: z.enum(['tabs', '2spaces', '4spaces']).default('2spaces'),
      commentStyle: z.enum(['minimal', 'moderate', 'verbose']).default('moderate'),
    })
    .default({}),
});

export type Config = z.infer<typeof ConfigSchema>;

/**
 * Resolves the configuration by merging defaults, config file, and environment variables
 * @param profile The profile name to use
 * @returns The merged configuration
 */
export function resolveConfig(profile: string = 'default'): Config {
  // Default configuration
  const defaultConfig: Config = {
    model: 'gpt-4o',
    maxTokens: 8192,
    temperature: 0.7,
    contextSize: 5,
    logLevel: 'info',
    plugins: [],
    toolSettings: {},
    userPreferences: {
      codeStyle: 'standard',
      indentation: '2spaces',
      commentStyle: 'moderate',
    },
  };

  // Configuration from the config file
  const homeDir = process.env.HOME || process.env.USERPROFILE || '.';
  const configPath = path.join(homeDir, '.codeagent', 'config.json');

  let fileConfig: Partial<Config> = {};
  try {
    if (fs.existsSync(configPath)) {
      const configFile = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      fileConfig = configFile[profile] || configFile.default || {};
    }
  } catch (error) {
    console.warn(`Warning: Could not load config file at ${configPath}`);
  }

  // Environment variables override
  const envConfig: Partial<Config> = {
    apiKey: process.env.OPENAI_API_KEY,
    model: process.env.CODEAGENT_MODEL,
    maxTokens: process.env.CODEAGENT_MAX_TOKENS
      ? parseInt(process.env.CODEAGENT_MAX_TOKENS, 10)
      : undefined,
    temperature: process.env.CODEAGENT_TEMPERATURE
      ? parseFloat(process.env.CODEAGENT_TEMPERATURE)
      : undefined,
    logLevel: process.env.CODEAGENT_LOG_LEVEL as any,
  };

  // Filter out undefined values from envConfig
  Object.keys(envConfig).forEach(key => {
    if (envConfig[key] === undefined) {
      delete envConfig[key];
    }
  });

  // Merge configurations
  const mergedConfig = {
    ...defaultConfig,
    ...fileConfig,
    ...envConfig,
  };

  // Validate the configuration
  try {
    return ConfigSchema.parse(mergedConfig);
  } catch (error) {
    console.error('Invalid configuration:', error);
    return defaultConfig;
  }
}
