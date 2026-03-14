using Microsoft.EntityFrameworkCore;
using TerraFusion.Data;
using TerraFusion.Core.Entities;
using TerraFusion.Core.Enums;
using System.Data.Common;

namespace TerraFusion.API.Services;

public interface IDatabaseInitializationService
{
    System.Threading.Tasks.Task InitializeAsync();
    System.Threading.Tasks.Task<DatabaseStatus> GetStatusAsync();
    System.Threading.Tasks.Task<bool> SeedProductionModulesAsync();
}

public class DatabaseInitializationService : IDatabaseInitializationService
{
    private readonly IServiceScopeFactory _serviceScopeFactory;
    private readonly ILogger<DatabaseInitializationService> _logger;
    private bool _isInitialized = false;
    private bool _isInitializing = false;
    private string _lastError = string.Empty;

    public DatabaseInitializationService(
        IServiceScopeFactory serviceScopeFactory,
        ILogger<DatabaseInitializationService> logger)
    {
        _serviceScopeFactory = serviceScopeFactory;
        _logger = logger;
    }

    public async System.Threading.Tasks.Task InitializeAsync()
    {
        if (_isInitialized || _isInitializing)
        {
            _logger.LogInformation("Database already initialized or initializing");
            return;
        }

        _isInitializing = true;
        try
        {
            _logger.LogInformation("Starting database initialization...");
            
            using var scope = _serviceScopeFactory.CreateScope();
            var dbContext = scope.ServiceProvider.GetRequiredService<TerraFusionDbContext>();
            
            // Ensure database is created or apply migrations
            try
            {
                var created = await dbContext.Database.EnsureCreatedAsync();
                if (created)
                {
                    _logger.LogInformation("Database created successfully");
                }
                else
                {
                    // Database exists, check for pending migrations
                    if (dbContext.Database.GetPendingMigrations().Any())
                    {
                        _logger.LogInformation("Applying pending migrations...");
                        await dbContext.Database.MigrateAsync();
                    }
                    else
                    {
                        _logger.LogInformation("Database already exists and is up to date");
                    }
                }
            }
            catch (Exception dbEx)
            {
                _logger.LogWarning(dbEx, "Database creation/migration failed: {Error}. Using existing database structure.", dbEx.Message);
                // Continue with existing database structure
            }

            try
            {
                await EnsureOperationalTablesAsync(dbContext);
            }
            catch (Exception schemaEx)
            {
                _logger.LogWarning(schemaEx, "Operational table self-heal failed: {Error}", schemaEx.Message);
            }

            // DISABLED: TerraFusion OS doesn't use modules
            // await SeedProductionModulesInternalAsync(dbContext);

            _isInitialized = true;
            _lastError = string.Empty;
            _logger.LogInformation("Database initialization completed successfully");
        }
        catch (Exception ex)
        {
            _lastError = ex.Message;
            _logger.LogError(ex, "Database initialization failed: {Error}", ex.Message);
            throw;
        }
        finally
        {
            _isInitializing = false;
        }
    }

    public async System.Threading.Tasks.Task<DatabaseStatus> GetStatusAsync()
    {
        try
        {
            using var scope = _serviceScopeFactory.CreateScope();
            var dbContext = scope.ServiceProvider.GetRequiredService<TerraFusionDbContext>();

            var canConnect = await dbContext.Database.CanConnectAsync();
            var moduleCount = 0;
            
            if (canConnect)
            {
                try
                {
                    moduleCount = await dbContext.Modules.CountAsync();
                }
                catch (Exception ex)
                {
                    _logger.LogWarning("Could not count modules: {Error}", ex.Message);
                }
            }

            return new DatabaseStatus
            {
                IsConnected = canConnect,
                IsInitialized = _isInitialized,
                IsInitializing = _isInitializing,
                ModuleCount = moduleCount,
                DatabaseProvider = dbContext.Database.ProviderName ?? "Unknown",
                LastError = _lastError,
                LastChecked = DateTime.UtcNow
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error checking database status");
            return new DatabaseStatus
            {
                IsConnected = false,
                IsInitialized = false,
                IsInitializing = _isInitializing,
                LastError = ex.Message,
                LastChecked = DateTime.UtcNow
            };
        }
    }

    public async Task<bool> SeedProductionModulesAsync()
    {
        try
        {
            using var scope = _serviceScopeFactory.CreateScope();
            var dbContext = scope.ServiceProvider.GetRequiredService<TerraFusionDbContext>();
            await SeedProductionModulesInternalAsync(dbContext);
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to seed production modules");
            return false;
        }
    }

    private async System.Threading.Tasks.Task SeedProductionModulesInternalAsync(TerraFusionDbContext dbContext)
    {
        try
        {
            // Check if modules already exist
            var existingModules = await dbContext.Modules.CountAsync();
            
            // Get all 32 modules from the comprehensive list
            var allModules = GetProductionModules();
            var targetModuleCount = allModules.Count;
            
            if (existingModules >= targetModuleCount)
            {
                _logger.LogInformation("All {Count} production modules already seeded", existingModules);
                return;
            }

            _logger.LogInformation("Seeding {Count} production modules (currently have {Existing})...", 
                targetModuleCount, existingModules);
            
            foreach (var module in allModules)
            {
                var existingModule = await dbContext.Modules
                    .FirstOrDefaultAsync(m => m.Name == module.Name);
                    
                if (existingModule == null)
                {
                    dbContext.Modules.Add(module);
                }
            }

            await dbContext.SaveChangesAsync();
            
            var finalCount = await dbContext.Modules.CountAsync();
            _logger.LogInformation("Production modules seeded successfully. Total: {Count}", finalCount);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error seeding production modules");
            throw;
        }
    }

    private List<Module> GetProductionModules()
    {
        // Use the comprehensive module list with all 32 modules
        return FullModuleInitializationService.GetAllProductionModules();
        
        // Original 15 modules kept for reference:
        /*
        return new List<Module>
        {
            new Module
            {
                Name = "assessor-dashboard",
                DisplayName = "Assessor Dashboard",
                Description = "Main assessment and property management interface",
                Version = "1.0.0",
                Status = ModuleStatus.Active,
                IsCore = true,
                Tier = ModuleTier.Tier1,
                Priority = 1,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            },
            new Module
            {
                Name = "property-search",
                DisplayName = "Property Search & Analysis",
                Description = "Advanced property search with AI-powered analytics",
                Version = "1.0.0",
                Status = ModuleStatus.Active,
                IsCore = true,
                Tier = ModuleTier.Tier1,
                Priority = 2,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            },
            new Module
            {
                Name = "revenue-hunter",
                DisplayName = "Revenue Hunter AI",
                Description = "AI-powered revenue optimization and discovery",
                Version = "1.0.0",
                Status = ModuleStatus.Active,
                IsCore = false,
                Tier = ModuleTier.Tier2,
                Priority = 10,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            },
            new Module
            {
                Name = "mapping-gis",
                DisplayName = "GIS Mapping Suite",
                Description = "Interactive mapping and geographic analysis tools",
                Version = "1.0.0",
                Status = ModuleStatus.Active,
                IsCore = true,
                Tier = ModuleTier.Tier1,
                Priority = 3,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            },
            new Module
            {
                Name = "appeals-workflow",
                DisplayName = "Appeals Workflow Manager",
                Description = "Streamlined property assessment appeals processing",
                Version = "1.0.0",
                Status = ModuleStatus.Active,
                IsCore = true,
                Tier = ModuleTier.Tier1,
                Priority = 4,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            },
            new Module
            {
                Name = "reporting-suite",
                DisplayName = "Government Reporting Suite",
                Description = "Comprehensive reporting and analytics platform",
                Version = "1.0.0",
                Status = ModuleStatus.Active,
                IsCore = true,
                Tier = ModuleTier.Tier1,
                Priority = 5,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            },
            new Module
            {
                Name = "compliance-monitor",
                DisplayName = "Compliance Monitor",
                Description = "FISMA and government compliance monitoring",
                Version = "1.0.0",
                Status = ModuleStatus.Active,
                IsCore = true,
                Tier = ModuleTier.Tier1,
                Priority = 6,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            },
            new Module
            {
                Name = "tax-calculator",
                DisplayName = "Advanced Tax Calculator",
                Description = "Complex tax calculations and projections",
                Version = "1.0.0",
                Status = ModuleStatus.Active,
                IsCore = true,
                Tier = ModuleTier.Tier1,
                Priority = 7,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            },
            new Module
            {
                Name = "document-manager",
                DisplayName = "Document Management System",
                Description = "Secure document storage and workflow management",
                Version = "1.0.0",
                Status = ModuleStatus.Active,
                IsCore = true,
                Tier = ModuleTier.Tier1,
                Priority = 8,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            },
            new Module
            {
                Name = "public-portal",
                DisplayName = "Citizen Portal",
                Description = "Public-facing property information and services",
                Version = "1.0.0",
                Status = ModuleStatus.Active,
                IsCore = false,
                Tier = ModuleTier.Tier2,
                Priority = 20,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            },
            new Module
            {
                Name = "audit-trail",
                DisplayName = "Audit Trail Manager",
                Description = "Complete audit logging and compliance tracking",
                Version = "1.0.0",
                Status = ModuleStatus.Active,
                IsCore = true,
                Tier = ModuleTier.Tier1,
                Priority = 9,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            },
            new Module
            {
                Name = "notification-center",
                DisplayName = "Notification Center",
                Description = "Centralized notification and alert management",
                Version = "1.0.0",
                Status = ModuleStatus.Active,
                IsCore = false,
                Tier = ModuleTier.Tier2,
                Priority = 21,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            },
            new Module
            {
                Name = "batch-processing",
                DisplayName = "Batch Processing Engine",
                Description = "Large-scale data processing and import tools",
                Version = "1.0.0",
                Status = ModuleStatus.Active,
                IsCore = false,
                Tier = ModuleTier.Tier2,
                Priority = 22,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            },
            new Module
            {
                Name = "ai-insights",
                DisplayName = "AI Insights Dashboard",
                Description = "ML-powered insights and predictions for assessments",
                Version = "1.0.0",
                Status = ModuleStatus.Active,
                IsCore = false,
                Tier = ModuleTier.Tier2,
                Priority = 23,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            },
            new Module
            {
                Name = "integration-hub",
                DisplayName = "Integration Hub",
                Description = "Third-party system integrations and API management",
                Version = "1.0.0",
                Status = ModuleStatus.Active,
                IsCore = false,
                Tier = ModuleTier.Tier2,
                Priority = 24,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            }
        };
        */
    }

    private async System.Threading.Tasks.Task EnsureOperationalTablesAsync(TerraFusionDbContext dbContext)
    {
        var provider = dbContext.Database.ProviderName ?? string.Empty;
        if (!provider.Contains("Sqlite", StringComparison.OrdinalIgnoreCase))
        {
            return;
        }

        await using var connection = dbContext.Database.GetDbConnection();
        if (connection.State != System.Data.ConnectionState.Open)
        {
            await connection.OpenAsync();
        }

        var existingTables = await LoadExistingTableNamesAsync(connection);

        var requiredStatements = new Dictionary<string, string[]>
        {
            ["ComparableSales"] = new[]
            {
                """
                CREATE TABLE IF NOT EXISTS "ComparableSales" (
                    "Id" TEXT NOT NULL CONSTRAINT "PK_ComparableSales" PRIMARY KEY,
                    "ParcelId" TEXT NOT NULL,
                    "SaleDate" TEXT NOT NULL,
                    "SalePrice" TEXT NOT NULL,
                    "PropertyType" TEXT NOT NULL,
                    "Address" TEXT NULL,
                    "Neighborhood" TEXT NULL,
                    "GrossLivingArea" TEXT NULL,
                    "LotSizeSqft" TEXT NULL,
                    "YearBuilt" INTEGER NULL,
                    "Bedrooms" INTEGER NULL,
                    "Bathrooms" INTEGER NULL,
                    "Condition" TEXT NULL,
                    "QualityGrade" TEXT NULL,
                    "SaleQualification" TEXT NOT NULL,
                    "IsVerified" INTEGER NOT NULL,
                    "VerificationSource" TEXT NULL,
                    "CountyId" TEXT NOT NULL,
                    "IngestedBy" TEXT NOT NULL,
                    "IngestedAt" TEXT NOT NULL
                );
                """,
                """CREATE INDEX IF NOT EXISTS "IX_ComparableSales_CountyId_PropertyType_SaleDate" ON "ComparableSales" ("CountyId", "PropertyType", "SaleDate");""",
                """CREATE INDEX IF NOT EXISTS "IX_ComparableSales_CountyId_Neighborhood" ON "ComparableSales" ("CountyId", "Neighborhood");""",
                """CREATE INDEX IF NOT EXISTS "IX_ComparableSales_CountyId_ParcelId" ON "ComparableSales" ("CountyId", "ParcelId");"""
            },
            ["CamaCharacteristics"] = new[]
            {
                """
                CREATE TABLE IF NOT EXISTS "CamaCharacteristics" (
                    "Id" TEXT NOT NULL CONSTRAINT "PK_CamaCharacteristics" PRIMARY KEY,
                    "ParcelId" TEXT NOT NULL,
                    "TaxYear" INTEGER NOT NULL,
                    "BuildingType" TEXT NOT NULL,
                    "BuildingTypeDescription" TEXT NULL,
                    "Region" TEXT NULL,
                    "SquareFeet" TEXT NOT NULL,
                    "Stories" TEXT NULL,
                    "BasementSqft" TEXT NULL,
                    "GarageSqft" TEXT NULL,
                    "QualityGrade" TEXT NULL,
                    "ConditionGrade" TEXT NULL,
                    "ComplexityGrade" TEXT NULL,
                    "ExteriorWall" TEXT NULL,
                    "RoofType" TEXT NULL,
                    "Foundation" TEXT NULL,
                    "HvacType" TEXT NULL,
                    "InteriorFinish" TEXT NULL,
                    "YearBuilt" INTEGER NULL,
                    "EffectiveAge" INTEGER NULL,
                    "EconomicLife" INTEGER NULL,
                    "LandAreaSqft" TEXT NULL,
                    "LandZone" TEXT NULL,
                    "LandAdjustmentFactor" TEXT NULL,
                    "Bedrooms" INTEGER NULL,
                    "Bathrooms" INTEGER NULL,
                    "Fireplaces" INTEGER NULL,
                    "HasPool" INTEGER NULL,
                    "FunctionalObsolescence" TEXT NULL,
                    "ExternalObsolescence" TEXT NULL,
                    "CountyId" TEXT NOT NULL,
                    "UpdatedBy" TEXT NOT NULL,
                    "UpdatedAt" TEXT NOT NULL
                );
                """,
                """CREATE UNIQUE INDEX IF NOT EXISTS "IX_CamaCharacteristics_CountyId_ParcelId_TaxYear" ON "CamaCharacteristics" ("CountyId", "ParcelId", "TaxYear");"""
            },
            ["CostMatrices"] = new[]
            {
                """
                CREATE TABLE IF NOT EXISTS "CostMatrices" (
                    "Id" INTEGER NOT NULL CONSTRAINT "PK_CostMatrices" PRIMARY KEY AUTOINCREMENT,
                    "CountyId" TEXT NOT NULL,
                    "MatrixType" TEXT NOT NULL,
                    "BaseRate" TEXT NOT NULL,
                    "Multiplier" TEXT NOT NULL,
                    "Region" TEXT NOT NULL,
                    "BuildingType" TEXT NOT NULL,
                    "BuildingTypeDescription" TEXT NOT NULL,
                    "BaseCost" TEXT NOT NULL,
                    "MatrixYear" INTEGER NOT NULL,
                    "SourceMatrixId" INTEGER NOT NULL,
                    "MatrixDescription" TEXT NOT NULL,
                    "DataPoints" INTEGER NOT NULL,
                    "MinCost" TEXT NOT NULL,
                    "MaxCost" TEXT NOT NULL,
                    "County" TEXT NOT NULL,
                    "State" TEXT NOT NULL,
                    "AdjustmentFactors" TEXT NOT NULL,
                    "CostPerSqFt" TEXT NOT NULL,
                    "AdjustmentFactor" TEXT NOT NULL,
                    "Grade" TEXT NULL,
                    "Condition" TEXT NULL,
                    "YearBuilt" INTEGER NULL,
                    "DepreciationRate" TEXT NULL,
                    "CreatedAt" TEXT NOT NULL,
                    "UpdatedAt" TEXT NOT NULL,
                    "EffectiveDate" TEXT NULL
                );
                """,
                """CREATE INDEX IF NOT EXISTS "IX_CostMatrices_CountyId_BuildingType_Region_MatrixYear" ON "CostMatrices" ("CountyId", "BuildingType", "Region", "MatrixYear");"""
            },
            ["EtlSyncJobs"] = new[]
            {
                """
                CREATE TABLE IF NOT EXISTS "EtlSyncJobs" (
                    "Id" INTEGER NOT NULL CONSTRAINT "PK_EtlSyncJobs" PRIMARY KEY AUTOINCREMENT,
                    "CountyId" TEXT NOT NULL,
                    "SourceSystem" TEXT NOT NULL,
                    "EntityType" TEXT NOT NULL,
                    "Direction" TEXT NOT NULL,
                    "Status" TEXT NOT NULL,
                    "TotalRecords" INTEGER NOT NULL,
                    "ProcessedRecords" INTEGER NOT NULL,
                    "FailedRecords" INTEGER NOT NULL,
                    "SkippedRecords" INTEGER NOT NULL,
                    "DurationMs" INTEGER NOT NULL,
                    "RecordsPerSecond" REAL NOT NULL,
                    "Errors" TEXT NULL,
                    "Details" TEXT NULL,
                    "Watermark" TEXT NULL,
                    "CreatedBy" TEXT NOT NULL,
                    "StartedAt" TEXT NOT NULL,
                    "CompletedAt" TEXT NULL
                );
                """
            }
        };

        foreach (var (tableName, statements) in requiredStatements)
        {
            if (existingTables.Contains(tableName))
            {
                continue;
            }

            _logger.LogInformation("Creating missing SQLite operational table {TableName}", tableName);
            foreach (var statement in statements)
            {
                await dbContext.Database.ExecuteSqlRawAsync(statement);
            }
        }
    }

    private static async System.Threading.Tasks.Task<HashSet<string>> LoadExistingTableNamesAsync(DbConnection connection)
    {
        var tables = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        await using var command = connection.CreateCommand();
        command.CommandText = "SELECT name FROM sqlite_master WHERE type = 'table'";

        await using var reader = await command.ExecuteReaderAsync();
        while (await reader.ReadAsync())
        {
            if (!reader.IsDBNull(0))
            {
                tables.Add(reader.GetString(0));
            }
        }

        return tables;
    }
}

public class DatabaseStatus
{
    public bool IsConnected { get; set; }
    public bool IsInitialized { get; set; }
    public bool IsInitializing { get; set; }
    public int ModuleCount { get; set; }
    public string DatabaseProvider { get; set; } = string.Empty;
    public string LastError { get; set; } = string.Empty;
    public DateTime LastChecked { get; set; }
}
