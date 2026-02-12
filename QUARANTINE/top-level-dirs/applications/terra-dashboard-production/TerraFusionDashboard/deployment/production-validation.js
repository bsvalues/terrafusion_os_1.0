#!/usr/bin/env node

/**
 * Terrafusion Production Validation Script
 * Comprehensive testing for Benton County deployment readiness
 */

import http from 'http';
import https from 'https';
import { performance } from 'perf_hooks';

class TerraFusionValidator {
  constructor(baseUrl = 'http://localhost:5000') {
    this.baseUrl = baseUrl;
    this.results = [];
    this.criticalFailures = 0;
  }

  async makeRequest(path, options = {}) {
    return new Promise((resolve, reject) => {
      const url = `${this.baseUrl}${path}`;
      const client = url.startsWith('https') ? https : http;
      
      const startTime = performance.now();
      const req = client.get(url, options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          const endTime = performance.now();
          const responseTime = endTime - startTime;
          
          try {
            const jsonData = data ? JSON.parse(data) : {};
            resolve({
              statusCode: res.statusCode,
              data: jsonData,
              responseTime,
              headers: res.headers
            });
          } catch (e) {
            resolve({
              statusCode: res.statusCode,
              data: data,
              responseTime,
              headers: res.headers
            });
          }
        });
      });
      
      req.on('error', reject);
      req.setTimeout(10000, () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });
    });
  }

  async runTest(name, testFn, critical = false) {
    const startTime = performance.now();
    
    try {
      console.log(`🧪 Testing: ${name}`);
      const result = await testFn();
      const duration = performance.now() - startTime;
      
      this.results.push({
        name,
        status: 'PASS',
        duration: Math.round(duration),
        critical,
        details: result
      });
      
      console.log(`✅ PASS: ${name} (${Math.round(duration)}ms)`);
      return result;
    } catch (error) {
      const duration = performance.now() - startTime;
      
      this.results.push({
        name,
        status: 'FAIL',
        duration: Math.round(duration),
        critical,
        error: error.message,
        details: null
      });
      
      if (critical) {
        this.criticalFailures++;
        console.log(`❌ CRITICAL FAIL: ${name} - ${error.message}`);
      } else {
        console.log(`⚠️  FAIL: ${name} - ${error.message}`);
      }
      
      return null;
    }
  }

  async testSystemHealth() {
    const response = await this.makeRequest('/api/system/health');
    
    if (response.statusCode !== 200) {
      throw new Error(`Health check failed with status ${response.statusCode}`);
    }
    
    if (!Array.isArray(response.data) || response.data.length === 0) {
      throw new Error('No agents found in health check response');
    }
    
    const activeAgents = response.data.filter(agent => agent.status === 'active');
    if (activeAgents.length < 4) {
      throw new Error(`Only ${activeAgents.length} agents active, expected at least 4`);
    }
    
    return {
      totalAgents: response.data.length,
      activeAgents: activeAgents.length,
      responseTime: response.responseTime
    };
  }

  async testDatabaseConnectivity() {
    const response = await this.makeRequest('/api/properties?limit=1');
    
    if (response.statusCode !== 200) {
      throw new Error(`Properties endpoint failed with status ${response.statusCode}`);
    }
    
    if (!Array.isArray(response.data)) {
      throw new Error('Properties endpoint did not return array');
    }
    
    return {
      propertiesAccessible: true,
      responseTime: response.responseTime,
      sampleCount: response.data.length
    };
  }

  async testPropertyData() {
    const response = await this.makeRequest('/api/dashboard/stats');
    
    if (response.statusCode !== 200) {
      throw new Error(`Dashboard stats failed with status ${response.statusCode}`);
    }
    
    const stats = response.data;
    if (!stats.totalProperties || stats.totalProperties < 1000) {
      throw new Error(`Insufficient property data: ${stats.totalProperties} properties`);
    }
    
    if (!stats.totalAssessedValue || stats.totalAssessedValue <= 0) {
      throw new Error('No assessed value data found');
    }
    
    return {
      totalProperties: stats.totalProperties,
      totalAssessedValue: stats.totalAssessedValue,
      activeAgents: stats.activeAgents,
      responseTime: response.responseTime
    };
  }

  async testAgentRegistry() {
    const response = await this.makeRequest('/api/agents');
    
    if (response.statusCode !== 200) {
      throw new Error(`Agents endpoint failed with status ${response.statusCode}`);
    }
    
    const agents = response.data;
    const requiredAgents = ['NarratorAI', 'ExemptionSeer', 'SalesValidator', 'CostAnalyzer'];
    const foundAgents = agents.map(a => a.name);
    
    for (const required of requiredAgents) {
      const found = foundAgents.some(name => name.includes(required));
      if (!found) {
        throw new Error(`Required agent ${required} not found`);
      }
    }
    
    return {
      totalAgents: agents.length,
      requiredAgentsFound: requiredAgents.length,
      responseTime: response.responseTime
    };
  }

  async testCountyConfiguration() {
    const response = await this.makeRequest('/api/counties');
    
    if (response.statusCode !== 200) {
      throw new Error(`Counties endpoint failed with status ${response.statusCode}`);
    }
    
    const counties = response.data;
    const bentonCounty = counties.find(c => c.id === 'benton');
    
    if (!bentonCounty) {
      throw new Error('Benton County configuration not found');
    }
    
    if (bentonCounty.state !== 'WA') {
      throw new Error(`Benton County state incorrect: ${bentonCounty.state}`);
    }
    
    return {
      countiesConfigured: counties.length,
      bentonCountyFound: true,
      responseTime: response.responseTime
    };
  }

  async testPerformanceMetrics() {
    const endpoints = [
      '/api/system/health',
      '/api/properties?limit=10',
      '/api/dashboard/stats',
      '/api/agents'
    ];
    
    const results = [];
    
    for (const endpoint of endpoints) {
      const response = await this.makeRequest(endpoint);
      results.push({
        endpoint,
        responseTime: response.responseTime,
        statusCode: response.statusCode
      });
    }
    
    const avgResponseTime = results.reduce((acc, r) => acc + r.responseTime, 0) / results.length;
    const slowEndpoints = results.filter(r => r.responseTime > 1000);
    
    if (avgResponseTime > 500) {
      throw new Error(`Average response time too high: ${Math.round(avgResponseTime)}ms`);
    }
    
    if (slowEndpoints.length > 0) {
      console.warn(`⚠️ Slow endpoints detected: ${slowEndpoints.map(e => e.endpoint).join(', ')}`);
    }
    
    return {
      averageResponseTime: Math.round(avgResponseTime),
      endpointsTested: endpoints.length,
      slowEndpoints: slowEndpoints.length
    };
  }

  async testSecurityHeaders() {
    const response = await this.makeRequest('/api/system/health');
    const headers = response.headers;
    
    const securityHeaders = {
      'x-frame-options': 'X-Frame-Options',
      'x-content-type-options': 'X-Content-Type-Options',
      'x-xss-protection': 'X-XSS-Protection'
    };
    
    const missingHeaders = [];
    for (const [header, displayName] of Object.entries(securityHeaders)) {
      if (!headers[header]) {
        missingHeaders.push(displayName);
      }
    }
    
    if (missingHeaders.length > 0) {
      console.warn(`⚠️ Missing security headers: ${missingHeaders.join(', ')}`);
    }
    
    return {
      securityHeadersPresent: Object.keys(securityHeaders).length - missingHeaders.length,
      missingHeaders: missingHeaders.length
    };
  }

  async runAllTests() {
    console.log('🏛️ Terrafusion Production Validation Suite');
    console.log('==========================================');
    console.log(`Target: ${this.baseUrl}`);
    console.log('');
    
    // Critical tests (deployment fails if these fail)
    await this.runTest('System Health Check', () => this.testSystemHealth(), true);
    await this.runTest('Database Connectivity', () => this.testDatabaseConnectivity(), true);
    await this.runTest('Property Data Validation', () => this.testPropertyData(), true);
    await this.runTest('Agent Registry Validation', () => this.testAgentRegistry(), true);
    await this.runTest('County Configuration', () => this.testCountyConfiguration(), true);
    
    // Performance and security tests (warnings only)
    await this.runTest('Performance Metrics', () => this.testPerformanceMetrics(), false);
    await this.runTest('Security Headers', () => this.testSecurityHeaders(), false);
    
    this.printSummary();
    
    if (this.criticalFailures > 0) {
      process.exit(1);
    }
  }

  printSummary() {
    console.log('');
    console.log('📊 Validation Summary');
    console.log('====================');
    
    const passed = this.results.filter(r => r.status === 'PASS').length;
    const failed = this.results.filter(r => r.status === 'FAIL').length;
    const totalTime = this.results.reduce((acc, r) => acc + r.duration, 0);
    
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`⚡ Total time: ${totalTime}ms`);
    console.log(`🔥 Critical failures: ${this.criticalFailures}`);
    
    if (this.criticalFailures === 0) {
      console.log('');
      console.log('🎉 Terrafusion Platform is PRODUCTION READY!');
      console.log('✅ All critical systems operational');
      console.log('🏛️ Ready for Benton County Washington deployment');
    } else {
      console.log('');
      console.log('❌ DEPLOYMENT BLOCKED - Critical failures detected');
      console.log('🔧 Please resolve issues before proceeding to production');
    }
    
    console.log('');
    console.log('📋 Detailed Results:');
    this.results.forEach(result => {
      const status = result.status === 'PASS' ? '✅' : '❌';
      const critical = result.critical ? '[CRITICAL]' : '';
      console.log(`  ${status} ${result.name} ${critical} - ${result.duration}ms`);
      if (result.error) {
        console.log(`      Error: ${result.error}`);
      }
    });
  }
}

// Execute validation if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const baseUrl = process.argv[2] || 'http://localhost:5000';
  const validator = new TerraFusionValidator(baseUrl);
  
  validator.runAllTests().catch(error => {
    console.error('Validation suite failed:', error);
    process.exit(1);
  });
}

export default TerraFusionValidator;