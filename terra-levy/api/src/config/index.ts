/**
 * TerraLevy API Configuration
 * Centralized configuration management with validation
 */

import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const configSchema = z.object({
  // Server
  port: z.coerce.number().default(8080),
  nodeEnv: z.enum(['development', 'staging', 'production']).default('development'),
  logLevel: z.enum(['debug', 'info', 'warn', 'error']).default('info'),

  // CORS
  corsOrigin: z.string().default('http://localhost:3000'),

  // Microservices
  coreServicesUrl: z.string().default('http://localhost:5000'),
  collectionEngineUrl: z.string().default('http://localhost:5001'),
  analyticsPlatformUrl: z.string().default('http://localhost:5002'),
  citizenPortalUrl: z.string().default('http://localhost:5003'),

  // Database
  databaseUrl: z.string().optional(),
  redisUrl: z.string().optional(),

  // Security (FISMA-HIGH)
  jwtSecret: z.string().min(32).default('development-secret-key-change-in-production-32chars'),
  jwtExpiresIn: z.string().default('1h'),
  encryptionKey: z.string().optional(),

  // AI Services
  aiServiceUrl: z.string().default('http://localhost:8001'),
  quantumServiceUrl: z.string().default('http://localhost:8002'),

  // Rate Limiting
  rateLimitWindowMs: z.coerce.number().default(900000), // 15 minutes
  rateLimitMaxRequests: z.coerce.number().default(100),

  // Audit (FISMA-HIGH)
  auditLogEnabled: z.coerce.boolean().default(true),
  auditLogLevel: z.enum(['basic', 'detailed', 'forensic']).default('detailed'),
});

const parseConfig = () => {
  const raw = {
    port: process.env.PORT,
    nodeEnv: process.env.NODE_ENV,
    logLevel: process.env.LOG_LEVEL,
    corsOrigin: process.env.CORS_ORIGIN,
    coreServicesUrl: process.env.CORE_SERVICES_URL,
    collectionEngineUrl: process.env.COLLECTION_ENGINE_URL,
    analyticsPlatformUrl: process.env.ANALYTICS_PLATFORM_URL,
    citizenPortalUrl: process.env.CITIZEN_PORTAL_URL,
    databaseUrl: process.env.DATABASE_URL,
    redisUrl: process.env.REDIS_URL,
    jwtSecret: process.env.JWT_SECRET,
    jwtExpiresIn: process.env.JWT_EXPIRES_IN,
    encryptionKey: process.env.ENCRYPTION_KEY,
    aiServiceUrl: process.env.AI_SERVICE_URL,
    quantumServiceUrl: process.env.QUANTUM_SERVICE_URL,
    rateLimitWindowMs: process.env.RATE_LIMIT_WINDOW_MS,
    rateLimitMaxRequests: process.env.RATE_LIMIT_MAX_REQUESTS,
    auditLogEnabled: process.env.AUDIT_LOG_ENABLED,
    auditLogLevel: process.env.AUDIT_LOG_LEVEL,
  };

  return configSchema.parse(raw);
};

export const config = parseConfig();
export type Config = z.infer<typeof configSchema>;
