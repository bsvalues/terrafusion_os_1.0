/**
 * API Integration Tests
 * 
 * These tests verify the functionality of the backend API endpoints.
 */

import fetch from 'node-fetch';

const API_BASE_URL = 'http://localhost:5000/api';

describe('API Endpoints', () => {
  // Health check test
  test('Health endpoint returns healthy status', async () => {
    const response = await fetch(`${API_BASE_URL}/health`);
    const data = await response.json();
    
    expect(response.status).toBe(200);
    expect(data).toHaveProperty('status', 'healthy');
  });
  
  // Properties endpoints
  test('Properties endpoint returns array of properties', async () => {
    const response = await fetch(`${API_BASE_URL}/properties`);
    const data = await response.json();
    
    expect(response.status).toBe(200);
    expect(Array.isArray(data)).toBe(true);
    // Check if we have at least one property
    if (data.length > 0) {
      const property = data[0];
      expect(property).toHaveProperty('propertyId');
      expect(property).toHaveProperty('address');
      expect(property).toHaveProperty('propertyType');
    }
  });
  
  // AI Agent System
  test('Agent system status returns valid data', async () => {
    const response = await fetch(`${API_BASE_URL}/agents/status`);
    const data = await response.json();
    
    expect(response.status).toBe(200);
    expect(data).toHaveProperty('status');
    if (data.agents) {
      // Validate agent structure if agents are returned
      if (Array.isArray(data.agents) && data.agents.length > 0) {
        const agent = data.agents[0];
        expect(agent).toHaveProperty('name');
        expect(agent).toHaveProperty('status');
      } else if (typeof data.agents === 'object') {
        // Handle case where agents is an object with keys
        const agentNames = Object.keys(data.agents);
        if (agentNames.length > 0) {
          const agent = data.agents[agentNames[0]];
          expect(agent).toHaveProperty('status');
        }
      }
    }
  });
  
  // System activities
  test('System activities endpoint returns activities', async () => {
    const response = await fetch(`${API_BASE_URL}/system-activities`);
    const data = await response.json();
    
    expect(response.status).toBe(200);
    expect(Array.isArray(data)).toBe(true);
  });
});