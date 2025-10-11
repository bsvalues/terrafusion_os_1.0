# 🎯 TERRAFUSION MODULE SELECTION SYSTEM DESIGN
## Phase 1: Multi-Layer Configuration Architecture

**Date**: October 10, 2025  
**Status**: Design Complete → Ready for Implementation  
**Philosophy**: THE TERRAFUSION WAY - We do things right the first time

---

## 📊 DESIGN BASED ON AUDIT FINDINGS

**From Phase 0 Audit:**
- ✅ Tier structure already exists in modules/
- ✅ 189 modules already organized by tier
- ✅ 23 hot-swappable modules in src/ ready to move
- ⚠️ No terrafusion-backend found (need to create or locate)

**Tier Structure Confirmed:**
1. **ai-systems**: 23 modules (AI & Intelligence)
2. **government-core**: 27 modules (Core Government Operations)
3. **commercial**: 59 modules (Commercial & Marketplace)
4. **infrastructure**: 13 modules (Development & Testing)
5. **specialized**: 32 modules (Experimental & Specialized)

---

## 🏗️ MODULE SELECTION SYSTEM ARCHITECTURE

### Layer 1: Module Manifest (module.manifest.json)

**Location**: Each module's root directory  
**Purpose**: Declare module metadata, capabilities, dependencies, pricing

**Template**:
```json
{
  "$schema": "./schemas/module-manifest.schema.json",
  "moduleName": "terrafusion-dashboard",
  "moduleId": "tf-dashboard-core-v1",
  "version": "1.0.0",
  "tier": "government-core",
  "type": "hot-swappable-application",
  
  "metadata": {
    "displayName": "TerraFusion Dashboard",
    "description": "Main county operations dashboard with property assessment, tax collection, and GIS integration",
    "author": "TerraFusion Team",
    "license": "Proprietary",
    "homepage": "https://terrafusion.gov/modules/dashboard",
    "documentation": "./docs/README.md",
    "repository": "https://github.com/terrafusion/terrafusion-dashboard"
  },
  
  "capabilities": {
    "standalone": true,
    "integrated": true,
    "requiresBackend": true,
    "requiresAuth": true,
    "requiresDatabase": true,
    "requiresRedis": false,
    "requiresGIS": false,
    "hotReloadable": true
  },
  
  "dependencies": {
    "backend": {
      "required": true,
      "minVersion": "1.0.0"
    },
    "modules": [
      {
        "id": "terra-insight-v1",
        "minVersion": "1.0.0",
        "required": false
      },
      {
        "id": "terra-collections-v1",
        "minVersion": "1.0.0",
        "required": false
      }
    ],
    "services": [
      "authentication",
      "database",
      "api-gateway"
    ]
  },
  
  "deployment": {
    "port": 3001,
    "healthCheck": "/api/health",
    "readinessCheck": "/api/ready",
    "startCommand": "npm start",
    "devCommand": "npm run dev",
    "buildCommand": "npm run build",
    "testCommand": "npm test",
    "environmentVariables": [
      {
        "name": "DATABASE_URL",
        "required": true,
        "description": "PostgreSQL connection string"
      },
      {
        "name": "REDIS_URL",
        "required": false,
        "description": "Redis connection string for caching"
      }
    ]
  },
  
  "pricing": {
    "tier": "basic",
    "monthlyCost": 199,
    "setupFee": 500,
    "annualDiscount": 0.15,
    "countyPricing": {
      "small": 199,
      "medium": 349,
      "large": 599
    }
  },
  
  "features": [
    "Property Assessment Dashboard",
    "Tax Collection Overview",
    "GIS Integration",
    "Real-time Analytics",
    "Custom Reports"
  ],
  
  "screenshots": [
    "./screenshots/dashboard-overview.png",
    "./screenshots/property-details.png",
    "./screenshots/analytics.png"
  ],
  
  "compliance": [
    "WCAA Compliant",
    "RCW 84.40",
    "ADA Compliant",
    "WCAG 2.1 AA"
  ],
  
  "tags": [
    "dashboard",
    "government",
    "property-assessment",
    "core"
  ]
}
```

### Layer 2: County Configuration (county-config.yaml)

**Location**: `config/counties/[county-name].yaml`  
**Purpose**: County-specific module selections and configurations

**Template - Benton County Example**:
```yaml
# Benton County, Washington
# TerraFusion OS Configuration
# Updated: 2025-10-10

county:
  name: "Benton County"
  id: "benton-wa"
  state: "Washington"
  fips: "53005"
  population: 207000
  parcels: 89247
  
  contact:
    name: "Benton County Assessor's Office"
    email: "assessor@co.benton.wa.us"
    phone: "(509) 736-3087"
    website: "https://www.co.benton.wa.us/assessor"

deployment:
  environment: "production"
  region: "us-west-2"
  domain: "terrafusion.benton.wa.gov"
  cdn: true
  ssl: true
  
modules:
  # TIER 1: AI Systems
  ai-systems:
    enabled:
      - id: "ai-property-valuation-v1"
        version: "^1.0.0"
        config:
          trainingData: "benton-historical-2010-2024"
          modelType: "ensemble"
          updateFrequency: "monthly"
      
      - id: "ai-revenue-hunter-v1"
        version: "^1.0.0"
        config:
          anomalyDetection: true
          revenueOptimization: true
    
    disabled:
      - "ai-quantum-computing-v1"  # Not needed
      - "consciousness-evolution-v1"  # Experimental
  
  # TIER 2: Government Core
  government-core:
    enabled:
      - id: "terrafusion-dashboard-v1"
        version: "^1.0.0"
        config:
          branding: "Benton County Assessor"
          theme: "benton-blue"
          logo: "./assets/benton-county-seal.png"
          primaryColor: "#003DA5"
          secondaryColor: "#78BE21"
      
      - id: "terrafusion-gis-v1"
        version: "^1.0.0"
        config:
          arcgisIntegration: true
          bentonParcels: true
          layerUrl: "https://gis.benton.wa.gov/arcgis/rest/services"
          spatialReference: "EPSG:2927"  # Washington State Plane South
      
      - id: "terra-collections-v1"
        version: "^1.0.0"
        config:
          paymentGateway: "stripe"
          paymentMethods: ["credit-card", "echeck", "cash"]
          taxYear: 2025
          paymentPlanEnabled: true
      
      - id: "terra-levy-v1"
        version: "^1.0.0"
        config:
          levyRates: "./config/benton-levy-rates-2025.json"
          stateEqualizedValue: true
      
      - id: "terra-insight-v1"
        version: "^1.0.0"
        config:
          dashboards: ["property", "revenue", "compliance"]
          reporting: "advanced"
  
  # TIER 3: Commercial
  commercial:
    enabled:
      - id: "terrafusion-prime-view-v1"
        version: "^1.0.0"
        config:
          publicAccess: true
          propertySearch: true
    
    disabled:
      - "marketplace-v1"  # County hasn't purchased
      - "terrafusion-pro-plus-v1"  # Not needed
  
  # TIER 4: Infrastructure
  infrastructure:
    enabled:
      - id: "testing-suite-v1"
        version: "^1.0.0"
        config:
          environment: "staging"
  
  # TIER 5: Specialized
  specialized:
    enabled: []  # No specialized modules for Benton County
    disabled:
      - "quantum-computing-v1"
      - "biofield-integration-v1"
      - "dimensional-folding-v1"

backend:
  url: "https://api.terrafusion.benton.wa.gov"
  apiKey: "${BENTON_API_KEY}"
  version: "^1.0.0"
  
  database:
    type: "postgresql"
    host: "db.benton.wa.gov"
    port: 5432
    name: "terrafusion_benton"
    ssl: true
    poolSize: 20
  
  redis:
    enabled: true
    host: "redis.benton.wa.gov"
    port: 6379
    ttl: 3600

authentication:
  provider: "active-directory"
  sso: true
  mfa: true
  sessionTimeout: 28800  # 8 hours
  
  activeDirectory:
    domain: "BENTON"
    ldapUrl: "ldap://dc.co.benton.wa.us"
    baseDN: "DC=co,DC=benton,DC=wa,DC=us"

features:
  dataRetention: "7years"
  backup: "daily"
  monitoring: "enabled"
  analytics: "enabled"
  customBranding: true
  whiteLabel: false

integrations:
  harris-pacs:
    enabled: true
    version: "2024.1"
    syncFrequency: "nightly"
  
  arcgis:
    enabled: true
    organization: "benton-county"
    portal: "https://gis.benton.wa.gov/portal"
  
  washington-dor:
    enabled: true
    reporting: "quarterly"

support:
  tier: "enterprise"
  sla: "99.9%"
  responseTime: "4hours"
  maintenanceWindow: "Sunday 2AM-6AM PST"
```

### Layer 3: Module Registry Service (Backend)

**Location**: `terrafusion-backend/src/services/ModuleRegistry.ts`  
**Purpose**: Manage module lifecycle, validation, installation

```typescript
// Module Registry Service
// Single source of truth for module management

import { Module, ModuleConfig, ModuleStatus } from './types';
import { Database } from '../database';
import { EventEmitter } from 'events';

export class ModuleRegistry extends EventEmitter {
  private db: Database;
  private loadedModules: Map<string, Module> = new Map();
  
  constructor(db: Database) {
    super();
    this.db = db;
  }
  
  /**
   * List all available modules
   */
  async listModules(filters?: {
    tier?: string;
    type?: string;
    tags?: string[];
    enabled?: boolean;
  }): Promise<Module[]> {
    let query = this.db.modules.findMany();
    
    if (filters) {
      if (filters.tier) {
        query = query.where({ tier: filters.tier });
      }
      if (filters.type) {
        query = query.where({ type: filters.type });
      }
      if (filters.tags) {
        query = query.where({
          tags: { hasEvery: filters.tags }
        });
      }
      if (filters.enabled !== undefined) {
        query = query.where({ enabled: filters.enabled });
      }
    }
    
    return await query;
  }
  
  /**
   * Get module details
   */
  async getModule(moduleId: string): Promise<Module | null> {
    // Check cache first
    if (this.loadedModules.has(moduleId)) {
      return this.loadedModules.get(moduleId)!;
    }
    
    // Load from database
    const module = await this.db.modules.findUnique({
      where: { id: moduleId },
      include: {
        dependencies: true,
        pricing: true,
        features: true
      }
    });
    
    if (module) {
      this.loadedModules.set(moduleId, module);
    }
    
    return module;
  }
  
  /**
   * Check module compatibility
   */
  async checkCompatibility(
    moduleId: string,
    countyId: string,
    installedModules: string[]
  ): Promise<CompatibilityReport> {
    const module = await this.getModule(moduleId);
    if (!module) {
      return {
        compatible: false,
        errors: ['Module not found']
      };
    }
    
    const report: CompatibilityReport = {
      compatible: true,
      warnings: [],
      errors: [],
      missingDependencies: [],
      conflicts: []
    };
    
    // Check dependencies
    for (const dep of module.dependencies) {
      if (dep.required && !installedModules.includes(dep.moduleId)) {
        report.compatible = false;
        report.missingDependencies.push({
          moduleId: dep.moduleId,
          minVersion: dep.minVersion,
          reason: 'Required dependency not installed'
        });
      }
    }
    
    // Check conflicts
    for (const installedId of installedModules) {
      const installed = await this.getModule(installedId);
      if (installed && installed.conflicts?.includes(moduleId)) {
        report.compatible = false;
        report.conflicts.push({
          moduleId: installedId,
          reason: `${installed.name} conflicts with ${module.name}`
        });
      }
    }
    
    return report;
  }
  
  /**
   * Enable module for county
   */
  async enableModule(
    countyId: string,
    moduleId: string,
    config: ModuleConfig
  ): Promise<InstallationResult> {
    const county = await this.db.counties.findUnique({
      where: { id: countyId },
      include: { enabledModules: true }
    });
    
    if (!county) {
      return {
        success: false,
        error: 'County not found'
      };
    }
    
    // Check compatibility
    const compatibility = await this.checkCompatibility(
      moduleId,
      countyId,
      county.enabledModules.map(m => m.moduleId)
    );
    
    if (!compatibility.compatible) {
      return {
        success: false,
        error: 'Module is not compatible',
        details: compatibility
      };
    }
    
    // Validate configuration
    const validation = await this.validateConfig(moduleId, config);
    if (!validation.valid) {
      return {
        success: false,
        error: 'Invalid configuration',
        validationErrors: validation.errors
      };
    }
    
    // Enable module
    await this.db.countyModules.create({
      data: {
        countyId,
        moduleId,
        config,
        status: 'enabled',
        enabledAt: new Date()
      }
    });
    
    // Emit event
    this.emit('module:enabled', {
      countyId,
      moduleId,
      config
    });
    
    return {
      success: true,
      moduleId,
      status: 'enabled'
    };
  }
  
  /**
   * Disable module for county
   */
  async disableModule(
    countyId: string,
    moduleId: string
  ): Promise<void> {
    await this.db.countyModules.updateMany({
      where: {
        countyId,
        moduleId
      },
      data: {
        status: 'disabled',
        disabledAt: new Date()
      }
    });
    
    this.emit('module:disabled', { countyId, moduleId });
  }
  
  /**
   * Get county's enabled modules
   */
  async getCountyModules(countyId: string): Promise<Module[]> {
    const countyModules = await this.db.countyModules.findMany({
      where: {
        countyId,
        status: 'enabled'
      },
      include: {
        module: true
      }
    });
    
    return countyModules.map(cm => cm.module);
  }
  
  /**
   * Validate module configuration
   */
  async validateConfig(
    moduleId: string,
    config: any
  ): Promise<ValidationResult> {
    const module = await this.getModule(moduleId);
    if (!module) {
      return {
        valid: false,
        errors: ['Module not found']
      };
    }
    
    // Load JSON schema for module config
    const schema = module.configSchema;
    if (!schema) {
      return { valid: true, errors: [] };
    }
    
    // Validate against schema
    const validator = new SchemaValidator(schema);
    return validator.validate(config);
  }
  
  /**
   * Get module status
   */
  async getModuleStatus(
    countyId: string,
    moduleId: string
  ): Promise<ModuleStatus> {
    const countyModule = await this.db.countyModules.findFirst({
      where: { countyId, moduleId }
    });
    
    if (!countyModule) {
      return {
        enabled: false,
        status: 'not-installed'
      };
    }
    
    // Check health
    const health = await this.checkModuleHealth(countyId, moduleId);
    
    return {
      enabled: countyModule.status === 'enabled',
      status: countyModule.status,
      health,
      enabledAt: countyModule.enabledAt,
      lastHealthCheck: new Date()
    };
  }
  
  /**
   * Check module health
   */
  private async checkModuleHealth(
    countyId: string,
    moduleId: string
  ): Promise<'healthy' | 'degraded' | 'unhealthy'> {
    const module = await this.getModule(moduleId);
    if (!module || !module.healthCheckUrl) {
      return 'healthy';  // No health check configured
    }
    
    try {
      const response = await fetch(module.healthCheckUrl, {
        timeout: 5000
      });
      
      if (response.status === 200) {
        return 'healthy';
      } else if (response.status < 500) {
        return 'degraded';
      } else {
        return 'unhealthy';
      }
    } catch (error) {
      return 'unhealthy';
    }
  }
}

// Types
interface CompatibilityReport {
  compatible: boolean;
  warnings: string[];
  errors: string[];
  missingDependencies: Array<{
    moduleId: string;
    minVersion: string;
    reason: string;
  }>;
  conflicts: Array<{
    moduleId: string;
    reason: string;
  }>;
}

interface InstallationResult {
  success: boolean;
  moduleId?: string;
  status?: string;
  error?: string;
  details?: any;
  validationErrors?: any[];
}

interface ValidationResult {
  valid: boolean;
  errors: string[];
}
```

---

## ✅ PHASE 1 COMPLETE

**Design Status**: ✅ COMPLETE  
**Next Step**: Implement module selection system  
**Ready For**: Phase 2 (Tier-Based Reorganization)

---

**THE TERRAFUSION WAY - Designed Right The First Time!** 🎯
