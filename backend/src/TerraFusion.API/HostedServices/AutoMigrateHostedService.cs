using Microsoft.EntityFrameworkCore;
using System.Data;
using TerraFusion.Data;

namespace TerraFusion.API.HostedServices;

/// <summary>
/// SYNC-INFRA-1: Idempotent EF Core migration runner.
///
/// Applies any pending migrations on the <see cref="TerraFusionDbContext"/>
/// at backend startup, replacing the pre-SYNC-INFRA-1 workflow where the
/// operator had to remember to run
/// <c>dotnet ef database update --project TerraFusion.Data --startup-project TerraFusion.API</c>
/// before booting.
///
/// Behavior:
/// - Opt-out via <c>TF_SKIP_AUTO_MIGRATE=true</c> (configuration key, env var, or appsettings).
/// - No-op when there are no pending migrations.
/// - Non-fatal on failure: logs an error and lets the host continue, so the
///   operator can fix the DB and restart without losing the backend.
/// </summary>
public sealed class AutoMigrateHostedService : IHostedService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<AutoMigrateHostedService> _logger;

    public AutoMigrateHostedService(
        IServiceScopeFactory scopeFactory,
        ILogger<AutoMigrateHostedService> logger)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    public async Task StartAsync(CancellationToken ct)
    {
        try
        {
            using var scope = _scopeFactory.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<TerraFusionDbContext>();
            var pending = (await db.Database.GetPendingMigrationsAsync(ct)).ToList();
            if (pending.Count == 0)
            {
                _logger.LogInformation("AutoMigrate: no pending migrations");
                return;
            }
            _logger.LogInformation(
                "AutoMigrate: applying {Count} migrations: {List}",
                pending.Count,
                string.Join(",", pending));
            await db.Database.MigrateAsync(ct);
            _logger.LogInformation("AutoMigrate: complete");
        }
        catch (Exception ex)
        {
            // Non-fatal: log and continue. Operator can fix and restart.
            _logger.LogError(ex, "AutoMigrate failed; backend will continue but DB may be out of sync");
            await TryRepairSqliteDaisQueueSchemaAsync(ex, ct);
        }
    }

    public Task StopAsync(CancellationToken ct) => Task.CompletedTask;

    private async Task TryRepairSqliteDaisQueueSchemaAsync(Exception migrationError, CancellationToken ct)
    {
        try
        {
            using var scope = _scopeFactory.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<TerraFusionDbContext>();
            if (!db.Database.IsSqlite())
                return;

            var message = migrationError.ToString();
            if (!message.Contains("already exists", StringComparison.OrdinalIgnoreCase))
                return;

            if (!await TableExistsAsync(db, "Counties", ct))
            {
                _logger.LogWarning(
                    "AutoMigrate: SQLite DAIS QueueItems schema repair skipped because Counties table is missing");
                return;
            }

            if (await TableExistsAsync(db, "QueueItems", ct))
                return;

            foreach (var statement in SqliteQueueItemsSchemaStatements)
                await db.Database.ExecuteSqlRawAsync(statement, ct);

            _logger.LogWarning(
                "AutoMigrate: repaired SQLite DAIS QueueItems schema after migration-history drift");
        }
        catch (Exception repairError)
        {
            _logger.LogError(
                repairError,
                "AutoMigrate: SQLite DAIS QueueItems schema repair failed; queue endpoints may remain unavailable");
        }
    }

    private static async Task<bool> TableExistsAsync(TerraFusionDbContext db, string tableName, CancellationToken ct)
    {
        var connection = db.Database.GetDbConnection();
        var shouldClose = connection.State == ConnectionState.Closed;
        if (shouldClose)
            await connection.OpenAsync(ct);

        try
        {
            await using var command = connection.CreateCommand();
            command.CommandText = "SELECT COUNT(*) FROM sqlite_master WHERE type = 'table' AND name = $tableName;";
            var parameter = command.CreateParameter();
            parameter.ParameterName = "$tableName";
            parameter.Value = tableName;
            command.Parameters.Add(parameter);

            var result = await command.ExecuteScalarAsync(ct);
            return Convert.ToInt64(result) > 0;
        }
        finally
        {
            if (shouldClose)
                await connection.CloseAsync();
        }
    }

    private static readonly string[] SqliteQueueItemsSchemaStatements =
    [
        """
        CREATE TABLE IF NOT EXISTS "QueueItems" (
            "Id" TEXT NOT NULL CONSTRAINT "PK_QueueItems" PRIMARY KEY,
            "ParcelId" TEXT NOT NULL,
            "TaskType" TEXT NOT NULL,
            "Priority" TEXT NOT NULL,
            "Status" TEXT NOT NULL,
            "AssignedTo" TEXT NULL,
            "SlaHours" INTEGER NULL,
            "SlaDeadline" TEXT NULL,
            "StartedAt" TEXT NULL,
            "CompletedAt" TEXT NULL,
            "Notes" TEXT NULL,
            "CountyId" TEXT NOT NULL,
            "CreatedBy" TEXT NULL,
            "UpdatedBy" TEXT NULL,
            "CreatedAt" TEXT NOT NULL,
            "UpdatedAt" TEXT NOT NULL,
            CONSTRAINT "FK_QueueItems_Counties_CountyId" FOREIGN KEY ("CountyId") REFERENCES "Counties" ("Id") ON DELETE RESTRICT
        );
        """,
        """CREATE INDEX IF NOT EXISTS "IX_QueueItems_CountyId_Id" ON "QueueItems" ("CountyId", "Id");""",
        """CREATE INDEX IF NOT EXISTS "IX_QueueItems_CountyId_Status_CreatedAt" ON "QueueItems" ("CountyId", "Status", "CreatedAt");""",
        """CREATE INDEX IF NOT EXISTS "IX_QueueItems_CountyId_AssignedTo_Status" ON "QueueItems" ("CountyId", "AssignedTo", "Status");""",
        """CREATE INDEX IF NOT EXISTS "IX_QueueItems_CountyId_TaskType_Status" ON "QueueItems" ("CountyId", "TaskType", "Status");""",
    ];
}
