/**
 * Terrafusion OS - Jest Setup for Legacy Tests
 * Government. Transcended.
 */

// Mock environment variables
process.env.NODE_ENV = 'test'
process.env.GOVERNMENT_MODE = 'true'
process.env.COUNTY = 'Benton'
process.env.STATE = 'WA'
process.env.HARRIS_PACS_VERSION = '12.4.7'
process.env.PARCEL_COUNT = '89247'

// Global test utilities
global.testUtils = {
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
  
  waitForAsync: (ms) => new Promise(resolve => setTimeout(resolve, ms))
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

// Console setup for government branding
console.log('🏛️  Terrafusion OS Test Environment')
console.log('📍 County: Benton, WA')
console.log('🔗 Harris PACS: v12.4.7')
console.log('📊 Parcels: 89,247')
console.log('🎯 Government. Transcended.');
