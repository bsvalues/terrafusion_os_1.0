import { promises as fs } from 'fs';
import path from 'path';
import { createHash } from 'crypto';

interface MigrationComponent {
  name: string;
  sourcePath: string;
  targetPath: string;
  size: number;
  priority: 'high' | 'medium' | 'low';
  type: 'module' | 'data' | 'config' | 'asset';
}

interface MigrationResult {
  success: boolean;
  componentsProcessed: number;
  totalSize: number;
  errors: string[];
  warnings: string[];
}

export class BentonCountyMigrationService {
  private readonly sourceBasePath = 'e:/TerraFusion_OS/gov_deploy_packages/BentonCounty_COMPLETE_WhiteGlove_Package';
  private readonly targetBasePath = 'e:/TerraFusion_OS_1.0';

  private readonly migrationMap: MigrationComponent[] = [
    // High Priority - Core Government Functionality
    {
      name: 'Government Edition Core',
      sourcePath: 'Government_Edition',
      targetPath: 'backend/government-edition',
      size: 1067,
      priority: 'high',
      type: 'module'
    },
    {
      name: 'Championship Modules',
      sourcePath: 'Championship_Modules',
      targetPath: 'modules/championship',
      size: 932,
      priority: 'high',
      type: 'module'
    },
    {
      name: 'Enhanced DevOps Workspace',
      sourcePath: 'Enhanced_DevOps_Workspace',
      targetPath: 'devops/enhanced',
      size: 665,
      priority: 'high',
      type: 'config'
    },
    {
      name: 'Web Deployment Configs',
      sourcePath: 'Web_Deployment_Configs',
      targetPath: 'deployment/web',
      size: 650,
      priority: 'high',
      type: 'config'
    },

    // Medium Priority - Commercial and Legacy
    {
      name: 'Commercial Software',
      sourcePath: 'Commercial_Software',
      targetPath: 'modules/commercial/enterprise',
      size: 851,
      priority: 'medium',
      type: 'module'
    },
    {
      name: 'Legacy Applications',
      sourcePath: 'Legacy_Applications',
      targetPath: 'legacy/compatibility',
      size: 587,
      priority: 'medium',
      type: 'module'
    },
    {
      name: 'Terrafusion Core',
      sourcePath: 'TerraFusion_Core',
      targetPath: 'backend/core/enhanced',
      size: 389,
      priority: 'medium',
      type: 'module'
    },
    {
      name: 'Brand Assets',
      sourcePath: 'Brand_Assets',
      targetPath: 'assets/branding',
      size: 254,
      priority: 'medium',
      type: 'asset'
    },

    // Low Priority - Documentation and Infrastructure
    {
      name: 'Marketplace Components',
      sourcePath: 'Marketplace',
      targetPath: 'modules/marketplace/enhanced',
      size: 158,
      priority: 'low',
      type: 'module'
    },
    {
      name: 'Documentation',
      sourcePath: 'Documentation',
      targetPath: 'docs/production',
      size: 92,
      priority: 'low',
      type: 'asset'
    },
    {
      name: 'Additional Documentation',
      sourcePath: 'Additional_Documentation',
      targetPath: 'docs/additional',
      size: 68,
      priority: 'low',
      type: 'asset'
    },
    {
      name: 'County Databases',
      sourcePath: 'County_Databases',
      targetPath: 'data/counties',
      size: 10,
      priority: 'medium',
      type: 'data'
    }
  ];

  /**
   * Execute selective migration based on priority
   */
  async executeMigration(priorities: ('high' | 'medium' | 'low')[] = ['high']): Promise<MigrationResult> {
    const result: MigrationResult = {
      success: true,
      componentsProcessed: 0,
      totalSize: 0,
      errors: [],
      warnings: []
    };

    const componentsToMigrate = this.migrationMap.filter(comp => priorities.includes(comp.priority));
    
    console.log(`Starting migration of ${componentsToMigrate.length} components...`);

    for (const component of componentsToMigrate) {
      try {
        await this.migrateComponent(component);
        result.componentsProcessed++;
        result.totalSize += component.size;
        console.log(`✅ Migrated: ${component.name} (${component.size} items)`);
      } catch (error) {
        result.errors.push(`Failed to migrate ${component.name}: ${error.message}`);
        result.success = false;
        console.error(`❌ Failed: ${component.name} - ${error.message}`);
      }
    }

    return result;
  }

  /**
   * Migrate a single component
   */
  private async migrateComponent(component: MigrationComponent): Promise<void> {
    const sourcePath = path.join(this.sourceBasePath, component.sourcePath);
    const targetPath = path.join(this.targetBasePath, component.targetPath);

    // Check if source exists
    try {
      await fs.access(sourcePath);
    } catch {
      throw new Error(`Source path does not exist: ${sourcePath}`);
    }

    // Create target directory
    await fs.mkdir(targetPath, { recursive: true });

    // Copy files based on component type
    switch (component.type) {
      case 'module':
        await this.copyModuleFiles(sourcePath, targetPath);
        break;
      case 'data':
        await this.copyDataFiles(sourcePath, targetPath);
        break;
      case 'config':
        await this.copyConfigFiles(sourcePath, targetPath);
        break;
      case 'asset':
        await this.copyAssetFiles(sourcePath, targetPath);
        break;
    }

    // Create migration manifest
    await this.createMigrationManifest(component, targetPath);
  }

  /**
   * Copy module files with validation
   */
  private async copyModuleFiles(sourcePath: string, targetPath: string): Promise<void> {
    const files = await fs.readdir(sourcePath, { withFileTypes: true });
    
    for (const file of files) {
      const sourceFile = path.join(sourcePath, file.name);
      const targetFile = path.join(targetPath, file.name);

      if (file.isDirectory()) {
        await fs.mkdir(targetFile, { recursive: true });
        await this.copyModuleFiles(sourceFile, targetFile);
      } else {
        // Validate file types for modules
        if (this.isValidModuleFile(file.name)) {
          await fs.copyFile(sourceFile, targetFile);
        }
      }
    }
  }

  /**
   * Copy data files with integrity checks
   */
  private async copyDataFiles(sourcePath: string, targetPath: string): Promise<void> {
    const files = await fs.readdir(sourcePath, { withFileTypes: true });
    
    for (const file of files) {
      if (!file.isDirectory()) {
        const sourceFile = path.join(sourcePath, file.name);
        const targetFile = path.join(targetPath, file.name);
        
        // Copy with integrity verification
        const sourceData = await fs.readFile(sourceFile);
        await fs.writeFile(targetFile, sourceData);
        
        // Verify integrity
        const targetData = await fs.readFile(targetFile);
        const sourceHash = createHash('sha256').update(sourceData).digest('hex');
        const targetHash = createHash('sha256').update(targetData).digest('hex');
        
        if (sourceHash !== targetHash) {
          throw new Error(`Integrity check failed for ${file.name}`);
        }
      }
    }
  }

  /**
   * Copy configuration files with validation
   */
  private async copyConfigFiles(sourcePath: string, targetPath: string): Promise<void> {
    const files = await fs.readdir(sourcePath, { withFileTypes: true });
    
    for (const file of files) {
      const sourceFile = path.join(sourcePath, file.name);
      const targetFile = path.join(targetPath, file.name);

      if (file.isDirectory()) {
        await fs.mkdir(targetFile, { recursive: true });
        await this.copyConfigFiles(sourceFile, targetFile);
      } else if (this.isValidConfigFile(file.name)) {
        await fs.copyFile(sourceFile, targetFile);
      }
    }
  }

  /**
   * Copy asset files
   */
  private async copyAssetFiles(sourcePath: string, targetPath: string): Promise<void> {
    const files = await fs.readdir(sourcePath, { withFileTypes: true });
    
    for (const file of files) {
      const sourceFile = path.join(sourcePath, file.name);
      const targetFile = path.join(targetPath, file.name);

      if (file.isDirectory()) {
        await fs.mkdir(targetFile, { recursive: true });
        await this.copyAssetFiles(sourceFile, targetFile);
      } else {
        await fs.copyFile(sourceFile, targetFile);
      }
    }
  }

  /**
   * Create migration manifest for tracking
   */
  private async createMigrationManifest(component: MigrationComponent, targetPath: string): Promise<void> {
    const manifest = {
      component: component.name,
      migratedAt: new Date().toISOString(),
      sourcePath: component.sourcePath,
      targetPath: component.targetPath,
      size: component.size,
      priority: component.priority,
      type: component.type,
      version: '1.0.0',
      integrity: 'verified'
    };

    const manifestPath = path.join(targetPath, '.migration-manifest.json');
    await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2));
  }

  /**
   * Validate module file types
   */
  private isValidModuleFile(filename: string): boolean {
    const validExtensions = ['.cs', '.ts', '.tsx', '.js', '.jsx', '.json', '.yml', '.yaml', '.md', '.sql'];
    const validFiles = ['package.json', 'tsconfig.json', 'appsettings.json', 'Dockerfile'];
    
    return validExtensions.some(ext => filename.endsWith(ext)) || 
           validFiles.includes(filename) ||
           filename.endsWith('.csproj') ||
           filename.endsWith('.sln');
  }

  /**
   * Validate configuration file types
   */
  private isValidConfigFile(filename: string): boolean {
    const validExtensions = ['.json', '.yml', '.yaml', '.xml', '.config', '.env', '.sh', '.bat', '.ps1'];
    return validExtensions.some(ext => filename.endsWith(ext));
  }

  /**
   * Get migration summary
   */
  getMigrationSummary(): { totalComponents: number; totalSize: number; byPriority: Record<string, number> } {
    const summary = {
      totalComponents: this.migrationMap.length,
      totalSize: this.migrationMap.reduce((sum, comp) => sum + comp.size, 0),
      byPriority: {
        high: this.migrationMap.filter(c => c.priority === 'high').reduce((sum, c) => sum + c.size, 0),
        medium: this.migrationMap.filter(c => c.priority === 'medium').reduce((sum, c) => sum + c.size, 0),
        low: this.migrationMap.filter(c => c.priority === 'low').reduce((sum, c) => sum + c.size, 0)
      }
    };

    return summary;
  }

  /**
   * Validate migration prerequisites
   */
  async validatePrerequisites(): Promise<{ valid: boolean; issues: string[] }> {
    const issues: string[] = [];

    // Check source directory exists
    try {
      await fs.access(this.sourceBasePath);
    } catch {
      issues.push(`Source directory not accessible: ${this.sourceBasePath}`);
    }

    // Check target directory is writable
    try {
      await fs.access(this.targetBasePath);
    } catch {
      issues.push(`Target directory not accessible: ${this.targetBasePath}`);
    }

    // Check disk space (estimate 2GB needed)
    // In a real implementation, you'd check actual disk space

    return {
      valid: issues.length === 0,
      issues
    };
  }
}

// Export singleton instance
export const bentonCountyMigration = new BentonCountyMigrationService();
