#!/usr/bin/env node

/**
 * Terrafusion Environment Validation Script
 * Validates environment configuration and API connectivity
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load main environment
dotenv.config();

// Load secrets if available
const secretsPath = path.join(__dirname, '..', 'secrets', '.env.secrets');
if (fs.existsSync(secretsPath)) {
  dotenv.config({ path: secretsPath });
}

class EnvironmentValidator {
  constructor() {
    this.results = {
      core: [],
      optional: [],
      security: [],
      external: []
    };
  }

  async validate() {
    console.log('🔍 Terrafusion Environment Validation\n');
    
    await this.validateCore();
    await this.validateSecurity();
    await this.validateOptionalServices();
    await this.validateExternalServices();
    
    this.printResults();
  }

  async validateCore() {
    console.log('📋 Core Configuration');
    
    this.check('core', 'NODE_ENV', process.env.NODE_ENV, true);
    this.check('core', 'DATABASE_URL', process.env.DATABASE_URL, true);
    this.check('core', 'PORT', process.env.PORT || '5000', false);
    
    // Test database connection
    try {
      const { Pool } = require('pg');
      if (process.env.DATABASE_URL) {
        const pool = new Pool({ connectionString: process.env.DATABASE_URL });
        await pool.query('SELECT 1');
        await pool.end();
        this.results.core.push({ name: 'Database Connection', status: '✓', message: 'Connected successfully' });
      }
    } catch (error) {
      this.results.core.push({ name: 'Database Connection', status: '✗', message: `Failed: ${error.message}` });
    }
    
    console.log('');
  }

  async validateSecurity() {
    console.log('🔒 Security Configuration');
    
    this.check('security', 'SESSION_SECRET', process.env.SESSION_SECRET, true);
    
    if (process.env.NODE_ENV === 'production') {
      this.check('security', 'JWT_SECRET', process.env.JWT_SECRET, true);
      this.check('security', 'ENCRYPTION_KEY', process.env.ENCRYPTION_KEY, true);
    }
    
    console.log('');
  }

  async validateOptionalServices() {
    console.log('🔧 Optional Services');
    
    this.check('optional', 'OPENAI_API_KEY', process.env.OPENAI_API_KEY, false);
    this.check('optional', 'GOOGLE_MAPS_API_KEY', process.env.GOOGLE_MAPS_API_KEY, false);
    this.check('optional', 'MAPBOX_ACCESS_TOKEN', process.env.MAPBOX_ACCESS_TOKEN, false);
    
    console.log('');
  }

  async validateExternalServices() {
    console.log('🌐 External Service Connectivity');
    
    // Test OpenAI if key is available
    if (process.env.OPENAI_API_KEY) {
      try {
        const response = await fetch('https://api.openai.com/v1/models', {
          headers: {
            'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (response.ok) {
          this.results.external.push({ name: 'OpenAI API', status: '✓', message: 'Connected successfully' });
        } else {
          this.results.external.push({ name: 'OpenAI API', status: '✗', message: `HTTP ${response.status}` });
        }
      } catch (error) {
        this.results.external.push({ name: 'OpenAI API', status: '✗', message: `Connection failed: ${error.message}` });
      }
    }
    
    console.log('');
  }

  check(category, name, value, required) {
    const status = value ? '✓' : (required ? '✗' : '○');
    const message = value ? 
      (value.length > 20 ? `${value.substring(0, 20)}...` : value) : 
      (required ? 'Missing (required)' : 'Not configured (optional)');
    
    this.results[category].push({ name, status, message });
  }

  printResults() {
    console.log('📊 Validation Summary\n');
    
    Object.entries(this.results).forEach(([category, items]) => {
      if (items.length === 0) return;
      
      const categoryName = category.charAt(0).toUpperCase() + category.slice(1);
      console.log(`${categoryName}:`);
      
      items.forEach(item => {
        console.log(`  ${item.status} ${item.name}: ${item.message}`);
      });
      
      console.log('');
    });
    
    // Count results
    const allItems = Object.values(this.results).flat();
    const passed = allItems.filter(item => item.status === '✓').length;
    const failed = allItems.filter(item => item.status === '✗').length;
    const optional = allItems.filter(item => item.status === '○').length;
    
    console.log(`Total: ${passed} passed, ${failed} failed, ${optional} optional\n`);
    
    if (failed > 0) {
      console.log('❌ Environment validation failed. Please fix the issues above.');
      process.exit(1);
    } else {
      console.log('✅ Environment validation passed. System ready for deployment.');
      process.exit(0);
    }
  }
}

// Run validation
const validator = new EnvironmentValidator();
validator.validate().catch(console.error);