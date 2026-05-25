using System.Data;
using FluentValidation;
using Microsoft.AspNetCore.Builder;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Storage;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Diagnostics.HealthChecks;
using TerraFusion.CurrentUse.Data;
using TerraFusion.CurrentUse.Health;
using TerraFusion.CurrentUse.Middleware;
using TerraFusion.CurrentUse.Services;
using TerraFusion.CurrentUse.Validation;

namespace TerraFusion.CurrentUse;

public static class CurrentUseServiceExtensions
{
    /// <summary>
    /// Registers CurrentUse services, DbContext, validators, health checks, and controllers.
    /// Call from the host API's Program.cs or DI setup.
    /// </summary>
    public static IServiceCollection AddCurrentUseServices(this IServiceCollection services, IConfiguration configuration)
    {
        // Register DbContext — uses same connection string as the host or a dedicated one
        var currentUseConnectionString = configuration.GetConnectionString("CurrentUse");
        var hasDedicatedCurrentUseConnection = !string.IsNullOrWhiteSpace(currentUseConnectionString);
        var connectionString = currentUseConnectionString
            ?? configuration.GetConnectionString("DefaultConnection")
            ?? "Host=localhost;Database=terrafusion;Username=postgres;Password=postgres";

        var provider = configuration["CurrentUse:DatabaseProvider"]
            ?? (hasDedicatedCurrentUseConnection ? null : configuration["DatabaseProvider"]);
        var useSqlite =
            IsSqliteProvider(provider) ||
            IsSqliteConnectionString(connectionString);

        if (connectionString.Contains("InMemory", StringComparison.OrdinalIgnoreCase))
        {
            services.AddDbContext<CurrentUseDbContext>(options =>
                options.UseInMemoryDatabase("CurrentUse"));
        }
        else if (useSqlite)
        {
            services.AddDbContext<CurrentUseDbContext>(options =>
                options.UseSqlite(connectionString));
        }
        else
        {
            services.AddDbContext<CurrentUseDbContext>(options =>
                options.UseNpgsql(connectionString, npgsql =>
                    npgsql.MigrationsHistoryTable("__EFMigrationsHistory", "currentuse")));
        }

        // Register domain services
        services.AddScoped<IClassificationService, ClassificationService>();
        services.AddScoped<IRollbackCalculationService, RollbackCalculationService>();
        services.AddScoped<IInterestService, InterestService>();
        services.AddScoped<IRemovalService, RemovalService>();
        services.AddScoped<IPenaltyExceptionService, PenaltyExceptionService>();
        services.AddScoped<ICaseStateService, CaseStateService>();
        services.AddScoped<IAuditService, AuditService>();

        // Register FluentValidation validators
        services.AddScoped<IValidator<DTOs.RollbackCalculationRequest>, RollbackCalculationRequestValidator>();
        services.AddScoped<IValidator<DTOs.ClassificationCreateRequest>, ClassificationCreateRequestValidator>();
        services.AddScoped<IValidator<DTOs.RemovalInitiateRequest>, RemovalInitiateRequestValidator>();

        // Register health check
        services.AddHealthChecks()
            .AddCheck<CurrentUseHealthCheck>(
                "currentuse-database",
                HealthStatus.Degraded,
                tags: new[] { "currentuse", "database", "ready" });

        return services;
    }

    /// <summary>
    /// Adds CurrentUse exception handling middleware.
    /// Call in the middleware pipeline before MapControllers.
    /// </summary>
    public static IApplicationBuilder UseCurrentUseMiddleware(this IApplicationBuilder app)
    {
        app.UseMiddleware<CurrentUseExceptionMiddleware>();
        return app;
    }

    /// <summary>
    /// Ensures the CurrentUse database is created and seeded.
    /// Call during application startup.
    /// </summary>
    public static async Task InitializeCurrentUseDatabaseAsync(this IServiceProvider services)
    {
        using var scope = services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<CurrentUseDbContext>();

        if (db.Database.ProviderName == "Microsoft.EntityFrameworkCore.InMemory")
        {
            await db.Database.EnsureCreatedAsync();
        }
        else if (db.Database.ProviderName == "Microsoft.EntityFrameworkCore.Sqlite")
        {
            await EnsureSqliteCurrentUseTablesCreatedAsync(db);
        }
        else
        {
            await db.Database.MigrateAsync();
        }
    }

    private static bool IsSqliteProvider(string? provider)
    {
        return string.Equals(provider, "Sqlite", StringComparison.OrdinalIgnoreCase);
    }

    private static bool IsSqliteConnectionString(string connectionString)
    {
        return connectionString.Contains("Data Source=", StringComparison.OrdinalIgnoreCase);
    }

    private static async Task EnsureSqliteCurrentUseTablesCreatedAsync(CurrentUseDbContext db)
    {
        if (!await SqliteTableExistsAsync(db, "interest_rates"))
        {
            var creator = db.GetService<IRelationalDatabaseCreator>();
            await creator.CreateTablesAsync();
            return;
        }

        if (!await SqliteTableExistsAsync(db, "case_states"))
        {
            await db.Database.ExecuteSqlRawAsync("""
                CREATE TABLE IF NOT EXISTS "case_states" (
                    "Id" TEXT NOT NULL CONSTRAINT "PK_case_states" PRIMARY KEY,
                    "CaseId" TEXT NOT NULL,
                    "CaseStage" TEXT NOT NULL,
                    "AssignedAppraiser" TEXT NOT NULL,
                    "ChiefReviewStatus" TEXT NOT NULL,
                    "NoticeApprovalStatus" TEXT NOT NULL,
                    "LocalCaseNotes" TEXT NOT NULL,
                    "AgingBasisDate" TEXT NOT NULL,
                    "LastTouchedAt" TEXT NOT NULL
                );

                CREATE UNIQUE INDEX IF NOT EXISTS "IX_case_states_CaseId" ON "case_states" ("CaseId");
                CREATE INDEX IF NOT EXISTS "IX_case_states_AssignedAppraiser" ON "case_states" ("AssignedAppraiser");
                CREATE INDEX IF NOT EXISTS "IX_case_states_CaseStage" ON "case_states" ("CaseStage");
                CREATE INDEX IF NOT EXISTS "IX_case_states_LastTouchedAt" ON "case_states" ("LastTouchedAt");
                """);
        }
    }

    private static async Task<bool> SqliteTableExistsAsync(CurrentUseDbContext db, string tableName)
    {
        var connection = db.Database.GetDbConnection();
        var shouldClose = connection.State == ConnectionState.Closed;

        if (shouldClose)
        {
            await connection.OpenAsync();
        }

        try
        {
            await using var command = connection.CreateCommand();
            command.CommandText = "SELECT COUNT(*) FROM sqlite_master WHERE type = 'table' AND name = $tableName;";
            var parameter = command.CreateParameter();
            parameter.ParameterName = "$tableName";
            parameter.Value = tableName;
            command.Parameters.Add(parameter);

            var result = await command.ExecuteScalarAsync();
            return Convert.ToInt64(result) > 0;
        }
        finally
        {
            if (shouldClose)
            {
                await connection.CloseAsync();
            }
        }
    }
}
