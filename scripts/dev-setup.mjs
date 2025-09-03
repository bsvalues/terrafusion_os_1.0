#!/usr/bin/env node

/**
 * TerraFusion OS 1.0 Development Environment Setup
 * Hot reload, automated formatting, and local DB seeding
 */

import { spawn, exec } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

console.log('🚀 TerraFusion OS 1.0 Development Setup');
console.log('🔧 Configuring hot reload, formatting, and database seeding...\n');

// Hot reload configuration for backend
const hotReloadConfig = {
  backend: {
    watch: ['backend/**/*.cs', 'backend/**/*.json'],
    ignore: ['**/bin/**', '**/obj/**', '**/node_modules/**'],
    command: 'dotnet watch run --project backend/TerraFusion.API/TerraFusion.API.csproj',
    env: {
      ASPNETCORE_ENVIRONMENT: 'Development',
      ASPNETCORE_URLS: 'https://localhost:5001;http://localhost:5000'
    }
  },
  frontend: {
    watch: ['frontend/**/*.tsx', 'frontend/**/*.ts', 'frontend/**/*.css'],
    ignore: ['**/node_modules/**', '**/dist/**', '**/build/**'],
    command: 'npm run dev',
    cwd: path.join(rootDir, 'frontend'),
    env: {
      NODE_ENV: 'development',
      FAST_REFRESH: 'true',
      GENERATE_SOURCEMAP: 'true'
    }
  }
};

// Database seeding configuration
const dbSeedConfig = {
  connectionString: process.env.CONNECTION_STRING || 'Server=localhost;Database=TerraFusionDev;Trusted_Connection=true;',
  seedFiles: [
    'data/counties/benton_county_properties.json',
    'data/cost-matrices/benton_cost_matrix.json',
    'intelligence/benton_analysis.json'
  ]
};

async function setupHotReload() {
  console.log('🔥 Setting up hot reload configuration...');
  
  // Create nodemon config for TypeScript files
  const nodemonConfig = {
    watch: ['backend/**/*.ts', 'frontend/**/*.tsx', 'modules/**/*.ts'],
    ext: 'ts,tsx,js,jsx,json',
    ignore: ['node_modules/**', 'dist/**', 'build/**', '**/bin/**', '**/obj/**'],
    exec: 'npm run build && npm run start:dev',
    env: {
      NODE_ENV: 'development',
      ASPNETCORE_ENVIRONMENT: 'Development'
    },
    delay: 1000,
    verbose: true
  };

  await fs.writeFile(
    path.join(rootDir, 'nodemon.json'),
    JSON.stringify(nodemonConfig, null, 2)
  );

  // Create Vite config for frontend hot reload
  const viteConfig = `
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    host: true,
    hmr: {
      overlay: true
    },
    proxy: {
      '/api': {
        target: 'https://localhost:5001',
        changeOrigin: true,
        secure: false
      },
      '/hubs': {
        target: 'https://localhost:5001',
        changeOrigin: true,
        secure: false,
        ws: true
      }
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './components'),
      '@services': path.resolve(__dirname, './src/services')
    }
  },
  build: {
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          ai: ['@anthropic-ai/sdk', 'openai']
        }
      }
    }
  }
});
`;

  await fs.writeFile(
    path.join(rootDir, 'frontend/vite.config.ts'),
    viteConfig
  );

  console.log('✅ Hot reload configuration completed');
}

async function setupFormattingTools() {
  console.log('📝 Setting up automated formatting tools...');

  // Create EditorConfig
  const editorConfig = `
root = true

[*]
charset = utf-8
end_of_line = lf
insert_final_newline = true
trim_trailing_whitespace = true
indent_style = space
indent_size = 2

[*.cs]
indent_size = 4

[*.{md,yml,yaml}]
trim_trailing_whitespace = false

[*.json]
indent_size = 2
`;

  await fs.writeFile(
    path.join(rootDir, '.editorconfig'),
    editorConfig
  );

  // Create format script
  const formatScript = `#!/usr/bin/env node

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

console.log('🎨 Running TerraFusion OS formatting...');

async function formatCode() {
  try {
    // Format TypeScript/JavaScript
    console.log('📝 Formatting TypeScript/JavaScript files...');
    await execAsync('npx prettier --write "**/*.{ts,tsx,js,jsx,json,md,yml,yaml}"');
    
    // Format C# files
    console.log('📝 Formatting C# files...');
    await execAsync('dotnet format backend/ --verbosity minimal');
    
    // Lint TypeScript files
    console.log('🔍 Linting TypeScript files...');
    await execAsync('npx eslint "**/*.{ts,tsx}" --fix');
    
    console.log('✅ Code formatting completed successfully');
  } catch (error) {
    console.error('❌ Formatting failed:', error.message);
    process.exit(1);
  }
}

formatCode();
`;

  await fs.writeFile(
    path.join(rootDir, 'scripts/format-code.mjs'),
    formatScript
  );

  console.log('✅ Formatting tools configuration completed');
}

async function setupDatabaseSeeding() {
  console.log('🗄️ Setting up local database seeding...');

  const seedScript = `
using Microsoft.EntityFrameworkCore;
using TerraFusion.Data;
using TerraFusion.Core.Entities;
using System.Text.Json;

namespace TerraFusion.API.Seeds;

public static class DatabaseSeeder
{
    public static async Task SeedDevelopmentData(TerraFusionContext context)
    {
        Console.WriteLine("🌱 Seeding TerraFusion OS development database...");

        // Ensure database is created
        await context.Database.EnsureCreatedAsync();

        // Seed Counties
        if (!await context.Counties.AnyAsync())
        {
            await SeedCounties(context);
        }

        // Seed Properties
        if (!await context.Properties.AnyAsync())
        {
            await SeedProperties(context);
        }

        // Seed Cost Matrices
        if (!await context.CostMatrices.AnyAsync())
        {
            await SeedCostMatrices(context);
        }

        // Seed AI Models
        if (!await context.AIModels.AnyAsync())
        {
            await SeedAIModels(context);
        }

        await context.SaveChangesAsync();
        Console.WriteLine("✅ Database seeding completed successfully");
    }

    private static async Task SeedCounties(TerraFusionContext context)
    {
        var counties = new[]
        {
            new County { Name = "Benton", State = "WA", Population = 206873, Area = 1703.38 },
            new County { Name = "Clark", State = "WA", Population = 503311, Area = 656.31 },
            new County { Name = "King", State = "WA", Population = 2269675, Area = 2307.58 }
        };

        await context.Counties.AddRangeAsync(counties);
        Console.WriteLine($"🏛️ Seeded {counties.Length} counties");
    }

    private static async Task SeedProperties(TerraFusionContext context)
    {
        try
        {
            var propertiesJson = await File.ReadAllTextAsync("data/counties/benton_county_properties.json");
            var propertiesData = JsonSerializer.Deserialize<dynamic[]>(propertiesJson);
            
            var properties = new List<Property>();
            foreach (var prop in propertiesData.Take(1000)) // Limit for development
            {
                properties.Add(new Property
                {
                    Address = prop.GetProperty("address")?.GetString() ?? "Unknown",
                    AssessedValue = prop.GetProperty("assessed_value")?.GetDecimal() ?? 0,
                    MarketValue = prop.GetProperty("market_value")?.GetDecimal() ?? 0,
                    PropertyType = prop.GetProperty("property_type")?.GetString() ?? "Residential",
                    YearBuilt = prop.GetProperty("year_built")?.GetInt32() ?? 1900,
                    CountyId = 1 // Benton County
                });
            }

            await context.Properties.AddRangeAsync(properties);
            Console.WriteLine($"🏠 Seeded {properties.Count} properties");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"⚠️ Could not seed properties: {ex.Message}");
        }
    }

    private static async Task SeedCostMatrices(TerraFusionContext context)
    {
        var costMatrices = new[]
        {
            new CostMatrix 
            { 
                CountyId = 1, 
                MatrixType = "PropertyTax", 
                BaseRate = 0.0123m, 
                Multiplier = 1.0m,
                EffectiveDate = DateTime.UtcNow.AddYears(-1)
            },
            new CostMatrix 
            { 
                CountyId = 1, 
                MatrixType = "BusinessLicense", 
                BaseRate = 50.0m, 
                Multiplier = 1.2m,
                EffectiveDate = DateTime.UtcNow.AddYears(-1)
            }
        };

        await context.CostMatrices.AddRangeAsync(costMatrices);
        Console.WriteLine($"💰 Seeded {costMatrices.Length} cost matrices");
    }

    private static async Task SeedAIModels(TerraFusionContext context)
    {
        var aiModels = new[]
        {
            new AIModel
            {
                Name = "Revenue Hunter Swarm",
                Type = AIModelType.SwarmIntelligence,
                Status = AIModelStatus.Active,
                Configuration = JsonSerializer.Serialize(new { agents = 1000, optimization = "revenue" }),
                CreatedAt = DateTime.UtcNow
            },
            new AIModel
            {
                Name = "Quantum Performance Engine",
                Type = AIModelType.QuantumEnhanced,
                Status = AIModelStatus.Active,
                Configuration = JsonSerializer.Serialize(new { quantum_bits = 50, speedup = "379000000x" }),
                CreatedAt = DateTime.UtcNow
            }
        };

        await context.AIModels.AddRangeAsync(aiModels);
        Console.WriteLine($"🧠 Seeded {aiModels.Length} AI models");
    }
}
`;

  await fs.mkdir(path.join(rootDir, 'backend/TerraFusion.API/Seeds'), { recursive: true });
  await fs.writeFile(
    path.join(rootDir, 'backend/TerraFusion.API/Seeds/DatabaseSeeder.cs'),
    seedScript
  );

  console.log('✅ Database seeding configuration completed');
}

async function createDevelopmentScripts() {
  console.log('📜 Creating development scripts...');

  // Package.json scripts update
  const packageJsonPath = path.join(rootDir, 'package.json');
  let packageJson = {};
  
  try {
    const packageContent = await fs.readFile(packageJsonPath, 'utf8');
    packageJson = JSON.parse(packageContent);
  } catch (error) {
    console.log('Creating new package.json...');
  }

  packageJson.scripts = {
    ...packageJson.scripts,
    "dev": "concurrently \"npm run dev:backend\" \"npm run dev:frontend\"",
    "dev:backend": "dotnet watch run --project backend/TerraFusion.API/TerraFusion.API.csproj",
    "dev:frontend": "cd frontend && npm run dev",
    "dev:setup": "node scripts/dev-setup.mjs",
    "format": "node scripts/format-code.mjs",
    "format:check": "prettier --check \"**/*.{ts,tsx,js,jsx,json,md,yml,yaml}\"",
    "lint": "eslint \"**/*.{ts,tsx}\" --fix",
    "lint:check": "eslint \"**/*.{ts,tsx}\"",
    "type-check": "tsc --noEmit",
    "test:critical": "npm run test:unit && npm run test:integration",
    "test:unit": "jest --testPathPattern=unit",
    "test:integration": "jest --testPathPattern=integration",
    "validate:ai-models": "node scripts/validate-ai-models.mjs",
    "db:seed": "dotnet run --project backend/TerraFusion.API -- --seed",
    "db:reset": "dotnet ef database drop --project backend/TerraFusion.Data && npm run db:seed"
  };

  packageJson.devDependencies = {
    ...packageJson.devDependencies,
    "@typescript-eslint/eslint-plugin": "^6.0.0",
    "@typescript-eslint/parser": "^6.0.0",
    "@vitejs/plugin-react": "^4.0.0",
    "concurrently": "^8.2.0",
    "eslint": "^8.45.0",
    "eslint-config-prettier": "^8.8.0",
    "eslint-plugin-import": "^2.27.5",
    "eslint-plugin-security": "^1.7.1",
    "husky": "^8.0.3",
    "jest": "^29.6.0",
    "lint-staged": "^13.2.3",
    "nodemon": "^3.0.1",
    "prettier": "^3.0.0",
    "typescript": "^5.1.0",
    "vite": "^4.4.0"
  };

  await fs.writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2));

  console.log('✅ Development scripts created');
}

async function main() {
  try {
    await setupHotReload();
    await setupFormattingTools();
    await setupDatabaseSeeding();
    await createDevelopmentScripts();

    console.log('\n🎉 TerraFusion OS 1.0 Development Environment Setup Complete!');
    console.log('\n📋 Next Steps:');
    console.log('1. Run: npm install (install new dependencies)');
    console.log('2. Run: npm run db:seed (seed development database)');
    console.log('3. Run: npm run dev (start hot reload development)');
    console.log('4. Run: npm run format (format all code)');
    console.log('\n🚀 Happy coding with TerraFusion OS 1.0!');
  } catch (error) {
    console.error('❌ Setup failed:', error);
    process.exit(1);
  }
}

main();
