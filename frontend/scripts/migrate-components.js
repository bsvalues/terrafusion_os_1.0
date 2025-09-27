#!/usr/bin/env node
/**
 * Component Migration Script - Legacy to Enterprise Architecture
 * 
 * Automatically refactors existing components to use the new
 * Service Mesh + Trust Fabric + Circuit Breaker architecture
 * 
 * @author TerraFusion Engineering Team
 * @version 1.0.0
 */

const fs = require('fs');
const path = require('path');

// Migration patterns to apply
const MIGRATION_PATTERNS = {
  // Replace hardcoded API imports
  oldApiImports: [
    /import\s+.*\s+from\s+['"`].*\/services\/api['"`]/g,
    /import\s+.*\s+from\s+['"`].*api\.ts['"`]/g,
    /import\s+axios\s+from\s+['"`]axios['"`]/g
  ],
  
  // Replace with secure API import
  newApiImport: "import { useSecureAPI } from '../contexts/InfrastructureContext';",
  
  // Find hardcoded API calls
  hardcodedAPICalls: [
    /api\.get\(/g,
    /api\.post\(/g,
    /api\.put\(/g,
    /api\.delete\(/g,
    /axios\.get\(/g,
    /axios\.post\(/g,
    /axios\.put\(/g,
    /axios\.delete\(/g,
    /fetch\s*\(\s*['"`][^'"`]*api[^'"`]*['"`]/g
  ],
  
  // Replace with secure API calls
  secureAPICalls: {
    'api.get(': 'secureAPI.get(\'terrafusion-backend\',',
    'api.post(': 'secureAPI.post(\'terrafusion-backend\',',
    'api.put(': 'secureAPI.put(\'terrafusion-backend\',',
    'api.delete(': 'secureAPI.delete(\'terrafusion-backend\',',
    'axios.get(': 'secureAPI.get(\'terrafusion-backend\',',
    'axios.post(': 'secureAPI.post(\'terrafusion-backend\',',
    'axios.put(': 'secureAPI.put(\'terrafusion-backend\',',
    'axios.delete(': 'secureAPI.delete(\'terrafusion-backend\','
  }
};

// Component files to migrate
const COMPONENT_PATTERNS = [
  'src/components/**/*.tsx',
  'src/components/**/*.ts',
  'src/pages/**/*.tsx',
  'src/pages/**/*.ts'
];

class ComponentMigrator {
  constructor() {
    this.migratedFiles = [];
    this.errors = [];
  }
  
  async migrateComponent(filePath) {
    try {
      console.log(`🔄 Migrating: ${filePath}`);
      
      const content = fs.readFileSync(filePath, 'utf8');
      let newContent = content;
      let hasChanges = false;
      
      // Step 1: Add secure API hook if needed
      if (this.needsSecureAPIHook(content)) {
        newContent = this.addSecureAPIHook(newContent);
        hasChanges = true;
      }
      
      // Step 2: Replace hardcoded API imports
      newContent = this.replaceAPIImports(newContent);
      if (newContent !== content) hasChanges = true;
      
      // Step 3: Replace API calls with secure versions
      const apiCallResult = this.replaceAPICalls(newContent);
      newContent = apiCallResult.content;
      if (apiCallResult.changed) hasChanges = true;
      
      // Step 4: Add error handling and loading states
      if (this.needsEnhancedErrorHandling(newContent)) {
        newContent = this.addEnhancedErrorHandling(newContent);
        hasChanges = true;
      }
      
      if (hasChanges) {
        // Create backup
        const backupPath = filePath + '.backup';
        fs.writeFileSync(backupPath, content);
        
        // Write migrated version
        fs.writeFileSync(filePath, newContent);
        
        this.migratedFiles.push({
          path: filePath,
          backup: backupPath,
          changes: this.analyzeChanges(content, newContent)
        });
        
        console.log(`✅ Migrated: ${filePath}`);
      } else {
        console.log(`⏭️ No changes needed: ${filePath}`);
      }
      
    } catch (error) {
      console.error(`❌ Failed to migrate ${filePath}:`, error);
      this.errors.push({ path: filePath, error: error.message });
    }
  }
  
  needsSecureAPIHook(content) {
    // Check if component makes API calls but doesn't use secure API
    const hasAPICalls = MIGRATION_PATTERNS.hardcodedAPICalls.some(pattern => 
      pattern.test(content)
    );
    const hasSecureAPI = content.includes('useSecureAPI');
    
    return hasAPICalls && !hasSecureAPI;
  }
  
  addSecureAPIHook(content) {
    // Add import if not present
    if (!content.includes('useSecureAPI')) {
      const importMatch = content.match(/import\s+React[^;]+;/);
      if (importMatch) {
        const importIndex = content.indexOf(importMatch[0]) + importMatch[0].length;
        content = content.slice(0, importIndex) + 
          '\n' + MIGRATION_PATTERNS.newApiImport + 
          content.slice(importIndex);
      }
    }
    
    // Add hook usage inside component
    const componentMatch = content.match(/const\s+\w+:\s*React\.FC.*=.*\(\)\s*=>\s*{/);
    if (componentMatch) {
      const hookIndex = content.indexOf('{', componentMatch.index) + 1;
      const hookLine = '\n  const secureAPI = useSecureAPI();\n';
      content = content.slice(0, hookIndex) + hookLine + content.slice(hookIndex);
    }
    
    return content;
  }
  
  replaceAPIImports(content) {
    let newContent = content;
    
    // Remove old API imports
    MIGRATION_PATTERNS.oldApiImports.forEach(pattern => {
      newContent = newContent.replace(pattern, '');
    });
    
    // Clean up empty lines
    newContent = newContent.replace(/\n\s*\n\s*\n/g, '\n\n');
    
    return newContent;
  }
  
  replaceAPICalls(content) {
    let newContent = content;
    let changed = false;
    
    // Replace simple API calls
    Object.entries(MIGRATION_PATTERNS.secureAPICalls).forEach(([old, replacement]) => {
      if (newContent.includes(old)) {
        newContent = newContent.replace(new RegExp(old.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), replacement);
        changed = true;
      }
    });
    
    // Handle more complex fetch calls
    const fetchPattern = /fetch\s*\(\s*['"`]([^'"`]*\/api\/[^'"`]*)['"`]/g;
    newContent = newContent.replace(fetchPattern, (match, url) => {
      changed = true;
      // Extract endpoint from full URL
      const endpoint = url.replace(/^.*\/api/, '/api');
      return `secureAPI.get('terrafusion-backend', '${endpoint}'`;
    });
    
    return { content: newContent, changed };
  }
  
  needsEnhancedErrorHandling(content) {
    // Check if component has API calls but basic error handling
    const hasAPICalls = content.includes('secureAPI.');
    const hasBasicErrorHandling = content.includes('catch') || content.includes('error');
    const hasEnhancedErrorHandling = content.includes('CircuitBreakerError') || 
                                   content.includes('AttestationError');
    
    return hasAPICalls && hasBasicErrorHandling && !hasEnhancedErrorHandling;
  }
  
  addEnhancedErrorHandling(content) {
    // Add error type imports
    if (!content.includes('CircuitBreakerError')) {
      const importMatch = content.match(/import.*from.*InfrastructureContext.*;/);
      if (importMatch) {
        const newImport = importMatch[0].replace(
          'InfrastructureContext\';',
          'InfrastructureContext\';\nimport { CircuitBreakerError, AttestationError } from \'../infrastructure/SecureAPIClient\';'
        );
        content = content.replace(importMatch[0], newImport);
      }
    }
    
    // Enhance catch blocks
    const catchPattern = /catch\s*\(\s*(\w+)[^}]*\{([^}]*)\}/g;
    content = content.replace(catchPattern, (match, errorVar, body) => {
      return `catch (${errorVar}: any) {
        if (${errorVar} instanceof CircuitBreakerError) {
          console.error('Service temporarily unavailable:', ${errorVar}.state);
          // Handle circuit breaker error
        } else if (${errorVar} instanceof AttestationError) {
          console.error('Security attestation failed:', ${errorVar}.message);
          // Handle attestation error
        } else {
          console.error('API call failed:', ${errorVar});
        }
        ${body}
      }`;
    });
    
    return content;
  }
  
  analyzeChanges(oldContent, newContent) {
    const changes = [];
    
    if (newContent.includes('useSecureAPI') && !oldContent.includes('useSecureAPI')) {
      changes.push('Added useSecureAPI hook');
    }
    
    if (newContent.includes('secureAPI.') && !oldContent.includes('secureAPI.')) {
      changes.push('Replaced hardcoded API calls with secure API');
    }
    
    if (newContent.includes('CircuitBreakerError') && !oldContent.includes('CircuitBreakerError')) {
      changes.push('Enhanced error handling');
    }
    
    return changes;
  }
  
  async migrateAll() {
    console.log('🚀 Starting TerraFusion Component Migration to Enterprise Architecture\\n');
    
    const glob = require('glob');
    const componentFiles = [];
    
    // Find all component files
    for (const pattern of COMPONENT_PATTERNS) {
      const files = glob.sync(pattern, { cwd: process.cwd() });
      componentFiles.push(...files);
    }
    
    console.log(`📁 Found ${componentFiles.length} component files to analyze\\n`);
    
    // Migrate each file
    for (const file of componentFiles) {
      await this.migrateComponent(file);
    }
    
    // Generate migration report
    this.generateReport();
  }
  
  generateReport() {
    console.log('\\n📊 Migration Report');
    console.log('===================');
    console.log(`✅ Successfully migrated: ${this.migratedFiles.length} files`);
    console.log(`❌ Failed migrations: ${this.errors.length} files\\n`);
    
    if (this.migratedFiles.length > 0) {
      console.log('🔄 Migrated Files:');
      this.migratedFiles.forEach(file => {
        console.log(`  • ${file.path}`);
        file.changes.forEach(change => {
          console.log(`    - ${change}`);
        });
      });
    }
    
    if (this.errors.length > 0) {
      console.log('\\n❌ Errors:');
      this.errors.forEach(error => {
        console.log(`  • ${error.path}: ${error.error}`);
      });
    }
    
    console.log('\\n🎯 Next Steps:');
    console.log('  1. Review migrated components for correctness');
    console.log('  2. Test each component with the new architecture');
    console.log('  3. Update component tests to mock secure API');
    console.log('  4. Add WebSocket integration where needed');
    console.log('  5. Implement telemetry and monitoring');
    
    console.log('\\n✨ Migration completed! Your frontend now uses enterprise architecture.');
  }
}

// CLI interface
if (require.main === module) {
  const migrator = new ComponentMigrator();
  
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    // Migrate all components
    migrator.migrateAll();
  } else {
    // Migrate specific files
    args.forEach(file => {
      migrator.migrateComponent(file);
    });
    migrator.generateReport();
  }
}

module.exports = ComponentMigrator;
