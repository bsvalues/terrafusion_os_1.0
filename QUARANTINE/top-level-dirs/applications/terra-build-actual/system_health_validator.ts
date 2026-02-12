#!/usr/bin/env node
/**
 * Terrafusion System Health Validator
 * Tesla-grade precision validation for all system components
 */

import axios from 'axios';
import chalk from 'chalk';

interface ValidationResult {
  endpoint: string;
  status: 'PASS' | 'FAIL' | 'WARNING';
  responseTime: number;
  details: string;
  dataQuality?: number;
}

class TerraFusionValidator {
  private baseUrl: string;
  private results: ValidationResult[] = [];

  constructor(baseUrl = 'http://localhost:3002') {
    this.baseUrl = baseUrl;
  }

  async validateAll(): Promise<void> {
    console.log(chalk.cyan('🚀 TERRAFUSION-AI SYSTEM VALIDATION INITIATED\n'));
    
    await this.validateHealthEndpoints();
    await this.validatePropertyAssessment();
    await this.validateMarketIntelligence();
    await this.validateGISIntegration();
    await this.validateGovernmentSync();
    await this.validateSecurityHeaders();
    
    this.generateReport();
  }

  private async validateHealthEndpoints(): Promise<void> {
    console.log(chalk.yellow('🔍 Validating Health Endpoints...'));
    
    const endpoints = [
      '/api/health',
      '/api/property/assess',
      '/api/market/intelligence',
      '/api/gis/spatial',
      '/api/integration/government'
    ];

    for (const endpoint of endpoints) {
      await this.testEndpoint(endpoint, 'GET');
    }
  }

  private async validatePropertyAssessment(): Promise<void> {
    console.log(chalk.yellow('🏠 Validating Property Assessment Engine...'));
    
    const testProperty = {
      address: "123 Test Street, Richland, WA 99352",
      propertyType: "residential",
      squareFootage: 2500,
      yearBuilt: 2010,
      bedrooms: 4,
      bathrooms: 2.5,
      lotSize: 8000,
      zoning: "R-1",
      condition: "good"
    };

    try {
      const startTime = Date.now();
      const response = await axios.post(`${this.baseUrl}/api/property/assess`, testProperty, {
        timeout: 10000,
        headers: { 'Content-Type': 'application/json' }
      });
      const responseTime = Date.now() - startTime;

      // Validate response structure
      const data = response.data;
      const isValidStructure = this.validateAssessmentStructure(data);
      
      if (isValidStructure && data.estimatedValue > 0 && data.confidence > 80) {
        this.results.push({
          endpoint: '/api/property/assess',
          status: 'PASS',
          responseTime,
          details: `Assessment: $${data.estimatedValue.toLocaleString()}, Confidence: ${data.confidence}%`,
          dataQuality: data.confidence
        });
      } else {
        this.results.push({
          endpoint: '/api/property/assess',
          status: 'WARNING',
          responseTime,
          details: 'Response structure incomplete or low confidence'
        });
      }
    } catch (error) {
      this.results.push({
        endpoint: '/api/property/assess',
        status: 'FAIL',
        responseTime: 0,
        details: `Error: ${error.message}`
      });
    }
  }

  private validateAssessmentStructure(data: any): boolean {
    const requiredFields = [
      'estimatedValue',
      'confidence',
      'methodology',
      'comparables',
      'marketFactors',
      'riskAssessment'
    ];
    
    return requiredFields.every(field => data.hasOwnProperty(field));
  }

  private async validateMarketIntelligence(): Promise<void> {
    console.log(chalk.yellow('📈 Validating Market Intelligence...'));
    
    try {
      const startTime = Date.now();
      const response = await axios.get(`${this.baseUrl}/api/market/intelligence?region=benton_county`);
      const responseTime = Date.now() - startTime;

      const data = response.data;
      
      if (data.medianPrice && data.trends && data.forecast) {
        this.results.push({
          endpoint: '/api/market/intelligence',
          status: 'PASS',
          responseTime,
          details: `Median: $${data.medianPrice.toLocaleString()}, Trend: ${data.trends.thirtyDay}`
        });
      } else {
        this.results.push({
          endpoint: '/api/market/intelligence',
          status: 'WARNING',
          responseTime,
          details: 'Incomplete market data structure'
        });
      }
    } catch (error) {
      this.results.push({
        endpoint: '/api/market/intelligence',
        status: 'FAIL',
        responseTime: 0,
        details: `Error: ${error.message}`
      });
    }
  }

  private async validateGISIntegration(): Promise<void> {
    console.log(chalk.yellow('🗺️ Validating GIS Spatial Analysis...'));
    
    const testCoordinates = {
      latitude: 46.2871,
      longitude: -119.2775,
      radius: 1000
    };

    try {
      const startTime = Date.now();
      const response = await axios.post(`${this.baseUrl}/api/gis/spatial`, testCoordinates);
      const responseTime = Date.now() - startTime;

      const data = response.data;
      
      if (data.nearbyProperties && data.zoning && data.demographics) {
        this.results.push({
          endpoint: '/api/gis/spatial',
          status: 'PASS',
          responseTime,
          details: `Found ${data.nearbyProperties.length} nearby properties`
        });
      } else {
        this.results.push({
          endpoint: '/api/gis/spatial',
          status: 'WARNING',
          responseTime,
          details: 'Incomplete GIS data structure'
        });
      }
    } catch (error) {
      this.results.push({
        endpoint: '/api/gis/spatial',
        status: 'FAIL',
        responseTime: 0,
        details: `Error: ${error.message}`
      });
    }
  }

  private async validateGovernmentSync(): Promise<void> {
    console.log(chalk.yellow('🏛️ Validating Government Data Sync...'));
    
    try {
      const startTime = Date.now();
      const response = await axios.get(`${this.baseUrl}/api/integration/government/status`);
      const responseTime = Date.now() - startTime;

      const data = response.data;
      
      this.results.push({
        endpoint: '/api/integration/government',
        status: data.connected ? 'PASS' : 'WARNING',
        responseTime,
        details: `PACS: ${data.pacs?.status || 'Unknown'}, CIAPS: ${data.ciaps?.status || 'Unknown'}`
      });
    } catch (error) {
      this.results.push({
        endpoint: '/api/integration/government',
        status: 'FAIL',
        responseTime: 0,
        details: `Error: ${error.message}`
      });
    }
  }

  private async validateSecurityHeaders(): Promise<void> {
    console.log(chalk.yellow('🛡️ Validating Security Headers...'));
    
    try {
      const response = await axios.get(`${this.baseUrl}/api/health`);
      const headers = response.headers;
      
      const securityHeaders = [
        'x-content-type-options',
        'x-frame-options',
        'x-xss-protection'
      ];

      const presentHeaders = securityHeaders.filter(header => headers[header]);
      
      this.results.push({
        endpoint: 'Security Headers',
        status: presentHeaders.length >= 2 ? 'PASS' : 'WARNING',
        responseTime: 0,
        details: `${presentHeaders.length}/${securityHeaders.length} security headers present`
      });
    } catch (error) {
      this.results.push({
        endpoint: 'Security Headers',
        status: 'FAIL',
        responseTime: 0,
        details: 'Unable to validate security headers'
      });
    }
  }

  private async testEndpoint(endpoint: string, method: 'GET' | 'POST' = 'GET'): Promise<void> {
    try {
      const startTime = Date.now();
      const response = await axios({
        method,
        url: `${this.baseUrl}${endpoint}`,
        timeout: 5000
      });
      const responseTime = Date.now() - startTime;

      this.results.push({
        endpoint,
        status: response.status === 200 ? 'PASS' : 'WARNING',
        responseTime,
        details: `HTTP ${response.status}`
      });
    } catch (error) {
      this.results.push({
        endpoint,
        status: 'FAIL',
        responseTime: 0,
        details: `Error: ${error.message}`
      });
    }
  }

  private generateReport(): void {
    console.log(chalk.cyan('\n📊 TERRAFUSION SYSTEM VALIDATION REPORT\n'));
    console.log('=' .repeat(80));
    
    const passed = this.results.filter(r => r.status === 'PASS').length;
    const warnings = this.results.filter(r => r.status === 'WARNING').length;
    const failed = this.results.filter(r => r.status === 'FAIL').length;
    
    console.log(chalk.green(`✅ PASSED: ${passed}`));
    console.log(chalk.yellow(`⚠️  WARNINGS: ${warnings}`));
    console.log(chalk.red(`❌ FAILED: ${failed}`));
    console.log('=' .repeat(80));
    
    this.results.forEach(result => {
      const statusColor = result.status === 'PASS' ? chalk.green : 
                         result.status === 'WARNING' ? chalk.yellow : chalk.red;
      
      const statusIcon = result.status === 'PASS' ? '✅' : 
                        result.status === 'WARNING' ? '⚠️' : '❌';
      
      console.log(`${statusIcon} ${statusColor(result.status.padEnd(8))} ${result.endpoint.padEnd(30)} ${result.responseTime}ms`);
      console.log(`   ${chalk.gray(result.details)}`);
      
      if (result.dataQuality) {
        console.log(`   ${chalk.blue(`Data Quality: ${result.dataQuality}%`)}`);
      }
      console.log();
    });
    
    // Performance Analysis
    const avgResponseTime = this.results.reduce((sum, r) => sum + r.responseTime, 0) / this.results.length;
    console.log(chalk.cyan('⚡ PERFORMANCE ANALYSIS:'));
    console.log(`Average Response Time: ${avgResponseTime.toFixed(2)}ms`);
    
    if (avgResponseTime < 100) {
      console.log(chalk.green('🚀 TESLA-GRADE PERFORMANCE ACHIEVED!'));
    } else if (avgResponseTime < 500) {
      console.log(chalk.yellow('⚡ Performance is good, room for optimization'));
    } else {
      console.log(chalk.red('🐌 Performance needs immediate attention'));
    }
    
    // Overall System Health
    const healthScore = (passed / this.results.length) * 100;
    console.log(chalk.cyan(`\n🎯 OVERALL SYSTEM HEALTH: ${healthScore.toFixed(1)}%`));
    
    if (healthScore >= 90) {
      console.log(chalk.green('🏆 SYSTEM READY FOR COUNTY DEPLOYMENT!'));
    } else if (healthScore >= 80) {
      console.log(chalk.yellow('✋ System needs minor improvements before deployment'));
    } else {
      console.log(chalk.red('🚨 Critical issues require immediate attention'));
    }
  }
}

// Main execution
const validator = new TerraFusionValidator();
validator.validateAll().catch(console.error);