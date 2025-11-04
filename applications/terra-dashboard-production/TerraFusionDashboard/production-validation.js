#!/usr/bin/env node

/**
 * Terrafusion Production Validation Script
 * Comprehensive testing for production deployment readiness
 */

import axios from 'axios';
import fs from 'fs';
import { performance } from 'perf_hooks';

class ProductionValidator {
  constructor(baseUrl = 'http://localhost:5000') {
    this.baseUrl = baseUrl;
    this.results = {
      passed: 0,
      failed: 0,
      warnings: 0,
      tests: []
    };
  }

  async runTest(name, testFn, critical = false) {
    console.log(`\n🔍 Testing: ${name}`);
    const start = performance.now();
    
    try {
      const result = await testFn();
      const duration = Math.round(performance.now() - start);
      
      if (result.success) {
        console.log(`✅ PASS: ${name} (${duration}ms)`);
        this.results.passed++;
      } else {
        console.log(`${critical ? '❌' : '⚠️'} ${critical ? 'FAIL' : 'WARN'}: ${name} - ${result.message} (${duration}ms)`);
        if (critical) {
          this.results.failed++;
        } else {
          this.results.warnings++;
        }
      }
      
      this.results.tests.push({
        name,
        success: result.success,
        critical,
        duration,
        message: result.message || '',
        data: result.data || {}
      });
      
    } catch (error) {
      const duration = Math.round(performance.now() - start);
      console.log(`❌ ERROR: ${name} - ${error.message} (${duration}ms)`);
      this.results.failed++;
      
      this.results.tests.push({
        name,
        success: false,
        critical,
        duration,
        message: error.message,
        error: true
      });
    }
  }

  async testHealthEndpoint() {
    const response = await axios.get(`${this.baseUrl}/api/system/health`);
    return {
      success: response.status === 200,
      message: `Health endpoint returned ${response.status}`,
      data: response.data
    };
  }

  async testPropertyData() {
    const response = await axios.get(`${this.baseUrl}/api/properties`);
    const hasData = response.data && response.data.length > 0;
    const hasValidFields = hasData && response.data[0].parcelId && response.data[0].address;
    
    return {
      success: hasData && hasValidFields,
      message: hasData ? 
        (hasValidFields ? `${response.data.length} properties loaded with valid fields` : 'Properties missing required fields') :
        'No property data available',
      data: { count: response.data?.length || 0 }
    };
  }

  async testAgentRegistry() {
    const response = await axios.get(`${this.baseUrl}/api/agents`);
    const hasAgents = response.data && response.data.length > 0;
    const hasRequiredAgents = hasAgents && 
      response.data.some(a => a.name.includes('NarratorAI')) &&
      response.data.some(a => a.name.includes('CostAnalyzer'));
    
    return {
      success: hasRequiredAgents,
      message: hasAgents ? 
        `${response.data.length} agents registered${hasRequiredAgents ? ' including required agents' : ' but missing required agents'}` :
        'No agents registered',
      data: { agentCount: response.data?.length || 0 }
    };
  }

  async testDashboardStats() {
    const response = await axios.get(`${this.baseUrl}/api/dashboard/stats`);
    const hasStats = response.data && typeof response.data.totalProperties === 'number';
    
    return {
      success: hasStats && response.data.totalProperties > 0,
      message: hasStats ? 
        `Dashboard stats available: ${response.data.totalProperties} properties` :
        'Dashboard stats unavailable',
      data: response.data
    };
  }

  async testSecurityHeaders() {
    const response = await axios.get(`${this.baseUrl}/api/system/health`);
    const headers = response.headers;
    
    const requiredHeaders = [
      'x-content-type-options',
      'x-frame-options',
      'x-xss-protection',
      'referrer-policy'
    ];
    
    const missingHeaders = requiredHeaders.filter(header => !headers[header]);
    
    return {
      success: missingHeaders.length === 0,
      message: missingHeaders.length === 0 ? 
        'All security headers present' : 
        `Missing headers: ${missingHeaders.join(', ')}`,
      data: { missingHeaders, presentHeaders: requiredHeaders.filter(h => headers[h]) }
    };
  }

  async runAllTests() {
    console.log('🚀 Starting Terrafusion Production Validation\n');
    console.log(`Base URL: ${this.baseUrl}\n`);
    
    // Critical tests (must pass for production)
    await this.runTest('Health Endpoint', () => this.testHealthEndpoint(), true);
    await this.runTest('Property Data Availability', () => this.testPropertyData(), true);
    await this.runTest('Agent Registry', () => this.testAgentRegistry(), true);
    await this.runTest('Dashboard Statistics', () => this.testDashboardStats(), true);
    await this.runTest('Security Headers', () => this.testSecurityHeaders(), false);
    
    this.printSummary();
    return this.results;
  }

  printSummary() {
    console.log('\n' + '='.repeat(60));
    console.log('📊 VALIDATION SUMMARY');
    console.log('='.repeat(60));
    
    console.log(`✅ Passed: ${this.results.passed}`);
    console.log(`❌ Failed: ${this.results.failed}`);
    console.log(`⚠️  Warnings: ${this.results.warnings}`);
    
    const totalTests = this.results.passed + this.results.failed + this.results.warnings;
    const successRate = Math.round((this.results.passed / totalTests) * 100);
    
    console.log(`\n📈 Success Rate: ${successRate}%`);
    
    if (this.results.failed === 0) {
      console.log('\n🎉 PRODUCTION READY! All critical tests passed.');
    } else {
      console.log('\n🚨 NOT PRODUCTION READY! Critical issues must be resolved.');
    }
    
    console.log('\n' + '='.repeat(60));
  }
}

// Run validation if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const validator = new ProductionValidator(process.argv[2]);
  
  validator.runAllTests()
    .then(results => {
      process.exit(results.failed === 0 ? 0 : 1);
    })
    .catch(error => {
      console.error('❌ Validation failed:', error.message);
      process.exit(1);
    });
}

export default ProductionValidator;