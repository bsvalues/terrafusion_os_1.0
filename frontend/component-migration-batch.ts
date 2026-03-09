/**
 * TerraFusion Component Migration Batch Script
 * 
 * This script performs systematic batch migration of legacy UI components
 * to @terrafusion/shared components across the entire codebase
 */

import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';

interface MigrationRule {
  pattern: RegExp;
  replacement: string;
  description: string;
}

// Migration rules for component imports
const IMPORT_MIGRATION_RULES: MigrationRule[] = [
  {
    pattern: /import\s*\{([^}]*CardContent[^}]*)\}\s*from\s*["']@\/components\/ui\/card["']/g,
    replacement: 'import { Card, CardHeader, CardBody, Badge } from "@terrafusion/shared"',
    description: 'Replace shadcn/ui card imports with @terrafusion/shared'
  },
  {
    pattern: /import\s*\{([^}]*Card[^}]*)\}\s*from\s*["']@\/components\/ui\/card["']/g,
    replacement: 'import { Card, CardHeader, CardBody, Badge } from "@terrafusion/shared"',
    description: 'Replace shadcn/ui card imports with @terrafusion/shared'
  },
  {
    pattern: /import\s*\{([^}]*Button[^}]*)\}\s*from\s*["']@\/components\/ui\/button["']/g,
    replacement: 'import { Button } from "@terrafusion/shared"',
    description: 'Replace shadcn/ui button imports with @terrafusion/shared'
  },
  {
    pattern: /import\s*\{([^}]*Badge[^}]*)\}\s*from\s*["']@\/components\/ui\/badge["']/g,
    replacement: 'import { Badge } from "@terrafusion/shared"',  
    description: 'Replace shadcn/ui badge imports with @terrafusion/shared'
  }
];

// Migration rules for component usage
const COMPONENT_MIGRATION_RULES: MigrationRule[] = [
  {
    pattern: /<CardContent([^>]*)>/g,
    replacement: '<CardBody$1>',
    description: 'Replace CardContent with CardBody'
  },
  {
    pattern: /<\/CardContent>/g,
    replacement: '</CardBody>',
    description: 'Replace closing CardContent with CardBody'
  },
  {
    pattern: /<CardTitle([^>]*)>/g,
    replacement: '<h3$1>',
    description: 'Replace CardTitle with h3'
  },
  {
    pattern: /<\/CardTitle>/g,
    replacement: '</h3>',
    description: 'Replace closing CardTitle with h3'
  },
  {
    pattern: /<CardDescription([^>]*)>/g,
    replacement: '<p$1>',
    description: 'Replace CardDescription with p'
  },
  {
    pattern: /<\/CardDescription>/g,
    replacement: '</p>',
    description: 'Replace closing CardDescription with p'
  }
];

// TerraFusion legacy component migration
const TERRA_COMPONENT_RULES: MigrationRule[] = [
  {
    pattern: /<TerraButton([^>]*)>/g,
    replacement: '<Button$1>',
    description: 'Replace TerraButton with Button'
  },
  {
    pattern: /<\/TerraButton>/g,
    replacement: '</Button>',
    description: 'Replace closing TerraButton'
  },
  {
    pattern: /<TerraCard([^>]*)>/g,
    replacement: '<Card$1>',
    description: 'Replace TerraCard with Card'
  },
  {
    pattern: /<\/TerraCard>/g,
    replacement: '</Card>',
    description: 'Replace closing TerraCard'
  },
  {
    pattern: /<TerraBadge([^>]*)>/g,
    replacement: '<Badge$1>',
    description: 'Replace TerraBadge with Badge'
  },
  {
    pattern: /<\/TerraBadge>/g,
    replacement: '</Badge>',
    description: 'Replace closing TerraBadge'
  }
];

class ComponentMigrationBatch {
  private processedFiles: Set<string> = new Set();
  private errors: Array<{file: string, error: string}> = [];
  private migrationCount: number = 0;

  async migrateDirectory(directory: string): Promise<void> {
    console.debug(`🔍 Scanning directory: ${directory}`);
    
    const files = await glob(`${directory}/**/*.{tsx,ts,jsx,js}`, {
      ignore: ['**/node_modules/**', '**/dist/**', '**/.git/**']
    });

    console.debug(`📁 Found ${files.length} files to process`);

    for (const file of files) {
      await this.migrateFile(file);
    }

    this.printSummary();
  }

  private async migrateFile(filePath: string): Promise<void> {
    if (this.processedFiles.has(filePath)) {
      return;
    }

    try {
      const content = fs.readFileSync(filePath, 'utf8');
      let migratedContent = content;
      let hasChanges = false;

      // Apply import migrations
      for (const rule of IMPORT_MIGRATION_RULES) {
        const before = migratedContent;
        migratedContent = migratedContent.replace(rule.pattern, rule.replacement);
        if (before !== migratedContent) {
          hasChanges = true;
          console.debug(`✨ Applied: ${rule.description} in ${path.basename(filePath)}`);
        }
      }

      // Apply component usage migrations
      for (const rule of COMPONENT_MIGRATION_RULES) {
        const before = migratedContent;
        migratedContent = migratedContent.replace(rule.pattern, rule.replacement);
        if (before !== migratedContent) {
          hasChanges = true;
          console.debug(`✨ Applied: ${rule.description} in ${path.basename(filePath)}`);
        }
      }

      // Apply TerraFusion component migrations
      for (const rule of TERRA_COMPONENT_RULES) {
        const before = migratedContent;
        migratedContent = migratedContent.replace(rule.pattern, rule.replacement);
        if (before !== migratedContent) {
          hasChanges = true;
          console.debug(`✨ Applied: ${rule.description} in ${path.basename(filePath)}`);
        }
      }

      // Write changes if any were made
      if (hasChanges) {
        fs.writeFileSync(filePath, migratedContent);
        this.migrationCount++;
        console.debug(`✅ Migrated: ${path.basename(filePath)}`);
      }

      this.processedFiles.add(filePath);

    } catch (error) {
      this.errors.push({
        file: filePath,
        error: error instanceof Error ? error.message : String(error)
      });
      console.error(`❌ Error processing ${filePath}:`, error);
    }
  }

  private printSummary(): void {
    console.debug('\n🎯 MIGRATION SUMMARY');
    console.debug('===================');
    console.debug(`📊 Files processed: ${this.processedFiles.size}`);
    console.debug(`✅ Files migrated: ${this.migrationCount}`);
    console.debug(`❌ Errors: ${this.errors.length}`);
    
    if (this.errors.length > 0) {
      console.debug('\n⚠️  ERRORS:');
      this.errors.forEach(({file, error}) => {
        console.debug(`   ${path.basename(file)}: ${error}`);
      });
    }

    console.debug('\n🚀 Component migration batch complete!');
  }

  // Safe migration method that validates before applying changes
  async safeMigrate(directories: string[]): Promise<void> {
    console.debug('🛡️  Starting SAFE component migration...');
    console.debug('This will migrate frontend components to @terrafusion/shared');
    
    for (const dir of directories) {
      if (fs.existsSync(dir)) {
        await this.migrateDirectory(dir);
      } else {
        console.warn(`⚠️  Directory not found: ${dir}`);
      }
    }
  }
}

// Migration execution
async function main() {
  const migrator = new ComponentMigrationBatch();
  
  const targetDirectories = [
    'c:/Users/bsval/terrafusion_os_1.0/frontend/components-enhanced',
    'c:/Users/bsval/terrafusion_os_1.0/src/terrafusion-v0-demo/components'
  ];

  await migrator.safeMigrate(targetDirectories);
}

// Export for use as module
export { ComponentMigrationBatch, IMPORT_MIGRATION_RULES, COMPONENT_MIGRATION_RULES, TERRA_COMPONENT_RULES };

// Run directly if called as script
if (require.main === module) {
  main().catch(console.error);
}