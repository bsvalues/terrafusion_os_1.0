/**
 * Terrafusion OS - Global Test Setup
 * Government. Transcended.
 */

import { beforeAll, afterAll, beforeEach, afterEach } from 'vitest'
import { vi } from 'vitest'

// Mock environment variables for testing
process.env.NODE_ENV = 'test'
process.env.GOVERNMENT_MODE = 'true'
process.env.COUNTY = 'Benton'
process.env.STATE = 'WA'
process.env.HARRIS_PACS_VERSION = '12.4.7'
process.env.PARCEL_COUNT = '89247'
process.env.TEST_DATABASE_URL = 'sqlite://memory'

// Global test configuration
beforeAll(async () => {
  // Initialize test database
  console.log('🏛️  Initializing Terrafusion OS Test Environment')
  console.log('📍 County: Benton, WA')
  console.log('🔗 Harris PACS: v12.4.7')
  console.log('📊 Parcels: 89,247')
  
  // Mock external services
  vi.mock('@/backend/services/HarrisPacsService', () => ({
    HarrisPacsService: {
      connect: vi.fn().mockResolvedValue(true),
      syncParcels: vi.fn().mockResolvedValue({ count: 89247 }),
      getParcelById: vi.fn().mockResolvedValue({
        id: 'TEST_PARCEL_001',
        address: '123 Test St, Richland, WA',
        owner: 'Test Owner',
        assessedValue: 250000
      })
    }
  }))
  
  // Mock AI services
  vi.mock('@/.ai/core/AIAgentManager', () => ({
    AIAgentManager: {
      initialize: vi.fn().mockResolvedValue(true),
      createAgent: vi.fn().mockResolvedValue({ id: 'test-agent' }),
      deployAgents: vi.fn().mockResolvedValue(['agent-1', 'agent-2'])
    }
  }))
  
  // Mock Claude-Flow integration
  vi.mock('@/.ai/claude-flow/core/ClaudeFlowIntegration', () => ({
    ClaudeFlowIntegration: {
      initialize: vi.fn().mockResolvedValue(true),
      createHiveMind: vi.fn().mockResolvedValue({ id: 'test-hive' }),
      executeWorkflow: vi.fn().mockResolvedValue({ success: true })
    }
  }))
})

afterAll(async () => {
  // Cleanup test environment
  console.log('🧹 Cleaning up test environment')
  vi.clearAllMocks()
})

beforeEach(() => {
  // Reset mocks before each test
  vi.clearAllMocks()
})

afterEach(() => {
  // Cleanup after each test
  vi.restoreAllMocks()
})

// Global test utilities
declare global {
  var testUtils: {
    createMockParcel: () => any
    createMockAgent: () => any
    createMockHiveMind: () => any
    waitForAsync: (ms: number) => Promise<void>
  }
}

globalThis.testUtils = {
  createMockParcel: () => ({
    id: `PARCEL_${Math.random().toString(36).substr(2, 9)}`,
    address: '123 Mock St, Richland, WA 99352',
    owner: 'Mock Owner',
    assessedValue: Math.floor(Math.random() * 500000) + 100000,
    county: 'Benton',
    state: 'WA'
  }),
  
  createMockAgent: () => ({
    id: `AGENT_${Math.random().toString(36).substr(2, 9)}`,
    type: 'revenue_hunter',
    status: 'idle',
    capabilities: ['property_assessment', 'revenue_discovery'],
    jurisdiction: 'Benton County, WA'
  }),
  
  createMockHiveMind: () => ({
    id: `HIVE_${Math.random().toString(36).substr(2, 9)}`,
    queen: 'claude-3.5-sonnet',
    workers: ['architect', 'coder', 'tester'],
    status: 'active',
    county: 'Benton'
  }),
  
  waitForAsync: (ms: number) => new Promise(resolve => setTimeout(resolve, ms))
}

// Custom matchers
expect.extend({
  toBeValidParcel(received) {
    const pass = received && 
                 typeof received.id === 'string' &&
                 typeof received.address === 'string' &&
                 typeof received.assessedValue === 'number' &&
                 received.assessedValue > 0
    
    return {
      message: () => `expected ${received} to be a valid parcel object`,
      pass
    }
  },
  
  toBeGovernmentCompliant(received) {
    const pass = received &&
                 received.county &&
                 received.state &&
                 received.compliance?.fisma === true
    
    return {
      message: () => `expected ${received} to be government compliant`,
      pass
    }
  }
})

// Extend expect interface
declare module 'vitest' {
  interface Assertion<T = any> {
    toBeValidParcel(): T
    toBeGovernmentCompliant(): T
  }
}
