/**
 * Global Test Setup for TerraFusion OS 1.0
 * 
 * This file runs ONCE before ALL tests begin.
 * Use it to:
 * - Start test databases
 * - Initialize test services
 * - Set up test environment variables
 * - Create global test fixtures
 * 
 * @author TerraFusion Systems Engineering Team
 */

import { MongoMemoryServer } from 'mongodb-memory-server';
import { GenericContainer, StartedTestContainer } from 'testcontainers';

// Global test containers
let mongoServer: MongoMemoryServer;
let redisContainer: StartedTestContainer;
let postgresContainer: StartedTestContainer;

/**
 * Global setup function
 */
export default async function globalSetup(): Promise<void> {
  console.log('🚀 Starting TerraFusion OS 1.0 Test Environment...\n');

  try {
    // Set test environment variables
    process.env.NODE_ENV = 'test';
    process.env.LOG_LEVEL = 'error'; // Reduce log noise during tests
    process.env.ENABLE_QUANTUM = 'true';
    process.env.ENABLE_AI = 'true';
    process.env.ENABLE_BLOCKCHAIN = 'false'; // Disable for speed in tests

    // Start MongoDB in-memory server
    console.log('📦 Starting MongoDB test server...');
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    process.env.MONGODB_URI = mongoUri;
    console.log(`✅ MongoDB started: ${mongoUri}`);

    // Start Redis test container
    console.log('📦 Starting Redis test container...');
    redisContainer = await new GenericContainer('redis:7-alpine')
      .withExposedPorts(6379)
      .start();
    const redisHost = redisContainer.getHost();
    const redisPort = redisContainer.getMappedPort(6379);
    process.env.REDIS_HOST = redisHost;
    process.env.REDIS_PORT = String(redisPort);
    console.log(`✅ Redis started: ${redisHost}:${redisPort}`);

    // Start PostgreSQL test container
    console.log('📦 Starting PostgreSQL test container...');
    postgresContainer = await new GenericContainer('postgres:15-alpine')
      .withEnvironment({
        POSTGRES_USER: 'test',
        POSTGRES_PASSWORD: 'test',
        POSTGRES_DB: 'terrafusion_test',
      })
      .withExposedPorts(5432)
      .start();
    const pgHost = postgresContainer.getHost();
    const pgPort = postgresContainer.getMappedPort(5432);
    process.env.DATABASE_URL = `postgresql://test:test@${pgHost}:${pgPort}/terrafusion_test`;
    console.log(`✅ PostgreSQL started: ${pgHost}:${pgPort}`);

    // Store container references globally for teardown
    (global as any).__MONGO_SERVER__ = mongoServer;
    (global as any).__REDIS_CONTAINER__ = redisContainer;
    (global as any).__POSTGRES_CONTAINER__ = postgresContainer;

    console.log('\n✅ Test environment ready!\n');
  } catch (error) {
    console.error('❌ Failed to start test environment:', error);
    throw error;
  }
}
