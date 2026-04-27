using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using TerraFusion.Data;
using TerraFusion.Sync.Workbench.Atlas;

namespace TerraFusion.Tools.SyncAtlas;

/// <summary>
/// CLI runner for the Database Atlas profiler (Slice B1.5).
///
/// Reads CLI args, opens the TerraFusion Postgres DbContext, looks up the
/// requested SyncSourceConnection, runs <see cref="AtlasProfiler"/>, and
/// prints a one-page summary. Exit codes:
///   0  — profile completed successfully
///   1  — argument parse failure or missing required flags
///   2  — connection lookup or profile execution failed (batch.Status='failed')
///   3  — operator cancelled (Ctrl+C)
///
/// Per locked decision (B1.0): no plaintext password handling. The TerraFusion DB
/// connection comes from the operator-supplied --db flag (or environment). Source
/// system credentials live on the SyncSourceConnection row (Windows Integrated by
/// default).
/// </summary>
internal static class Program
{
    public static async Task<int> Main(string[] argv)
    {
        var (args, error) = CliArgsParser.Parse(argv);

        if (error is not null)
        {
            await Console.Error.WriteLineAsync($"sync-atlas: {error}");
            await Console.Error.WriteLineAsync(CliArgsParser.UsageText);
            return 1;
        }

        if (args!.ShowHelp)
        {
            Console.WriteLine(CliArgsParser.UsageText);
            return 0;
        }

        // Cancellation: respect Ctrl+C without crashing mid-batch.
        using var cts = new CancellationTokenSource();
        Console.CancelKeyPress += (_, e) =>
        {
            e.Cancel = true;
            cts.Cancel();
        };

        try
        {
            return await RunProfileAsync(args, cts.Token);
        }
        catch (OperationCanceledException)
        {
            await Console.Error.WriteLineAsync("sync-atlas: cancelled by operator.");
            return 3;
        }
        catch (Exception ex)
        {
            await Console.Error.WriteLineAsync($"sync-atlas: unexpected error: {ex.Message}");
            await Console.Error.WriteLineAsync(ex.StackTrace);
            return 2;
        }
    }

    private static async Task<int> RunProfileAsync(CliArgs args, CancellationToken ct)
    {
        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["ConnectionStrings:DefaultConnection"] = args.TerraFusionDbConnectionString
            })
            .AddEnvironmentVariables()
            .Build();

        var options = new DbContextOptionsBuilder<TerraFusionDbContext>()
            .UseNpgsql(args.TerraFusionDbConnectionString, npg =>
            {
                npg.MigrationsAssembly("TerraFusion.Data");
                npg.EnableRetryOnFailure(maxRetryCount: 3);
            })
            .Options;

        await using var db = new TerraFusionDbContext(options, configuration);

        // SQL Auth passwords resolve from the operator's process environment
        // (per Slice B1.6.5). Convention: SYNCATLAS_SECRET_<connection-id-no-dashes-upper>.
        // Windows Integrated connections never consult the resolver.
        var secretResolver = new EnvironmentSecretResolver();
        var profiler = new AtlasProfiler(db, new SqlServerMetadataReaderFactory(secretResolver));

        Console.WriteLine($"sync-atlas: profiling connection {args.ConnectionId} for county {args.CountyId}...");
        if (args.DeepProfile)
        {
            Console.WriteLine("sync-atlas: deep profile enabled — sample-based stats will run after the structural pass.");
        }
        var startedAt = DateTimeOffset.UtcNow;

        AtlasProfileResult result;
        try
        {
            result = await profiler.ProfileAsync(args.ConnectionId, args.CountyId, args.OperatorId, ct);
        }
        catch (InvalidOperationException ex)
        {
            // Pre-flight rejection (cross-county, inactive connection, missing).
            await Console.Error.WriteLineAsync($"sync-atlas: {ex.Message}");
            return 2;
        }

        // B2 deep-profile pass — opt-in via --deep-profile. Only runs when the
        // structural pass succeeded (otherwise there are no SyncProfileTable
        // rows to drive it). On failure here we DO NOT flip the SyncBatch
        // status — the structural batch is independently complete; the
        // orchestrator's per-table failures are surfaced in stdout.
        DeepProfileOrchestrationResult? deepResult = null;
        if (args.DeepProfile && result.Status == "completed")
        {
            try
            {
                var orchestrator = new DeepProfileOrchestrator(
                    db,
                    new SqlServerDeepProfileReaderFactory(secretResolver),
                    new DeepProfilePersistenceService(db));

                // B2.5A safety controls — wire the operator's --deep-profile-include
                // and --deep-profile-max-tables choices through to the orchestrator.
                // Both default to "no limit" (current behavior).
                var deepOptions = new DeepProfileOptions(
                    IncludeQualifiedNames: args.DeepProfileIncludeQualifiedNames.Count == 0
                        ? null
                        : args.DeepProfileIncludeQualifiedNames,
                    MaxTables: args.DeepProfileMaxTables);

                Console.WriteLine();
                Console.WriteLine("sync-atlas: starting deep profile pass...");
                if (deepOptions.IncludeQualifiedNames is { Count: > 0 } incl)
                {
                    Console.WriteLine(
                        $"sync-atlas:   include-filter ({incl.Count}): {string.Join(", ", incl)}");
                }
                if (deepOptions.MaxTables is int cap)
                {
                    Console.WriteLine($"sync-atlas:   max-tables cap: {cap}");
                }

                deepResult = await orchestrator.RunAsync(
                    result.BatchId,
                    args.CountyId,
                    args.ConnectionId,
                    args.OperatorId,
                    deepOptions,
                    ct);
            }
            catch (InvalidOperationException ex)
            {
                await Console.Error.WriteLineAsync($"sync-atlas: deep profile pre-flight failed: {ex.Message}");
                return 2;
            }
            catch (Exception ex) when (ex is not OperationCanceledException)
            {
                await Console.Error.WriteLineAsync($"sync-atlas: deep profile failed unexpectedly: {ex.Message}");
                return 2;
            }
        }
        else if (args.DeepProfile)
        {
            Console.WriteLine($"sync-atlas: deep profile skipped because structural pass status was '{result.Status}'.");
        }

        var elapsed = DateTimeOffset.UtcNow - startedAt;

        Console.WriteLine();
        Console.WriteLine("─────────────────────────────────────────────");
        Console.WriteLine($"  Batch:        {result.BatchId}");
        Console.WriteLine($"  Status:       {result.Status}");
        Console.WriteLine($"  Started:      {result.StartedAtUtc:O}");
        Console.WriteLine($"  Completed:    {result.CompletedAtUtc?.ToString("O") ?? "(in flight)"}");
        Console.WriteLine($"  Elapsed:      {elapsed}");
        Console.WriteLine("─────────────────────────────────────────────");
        Console.WriteLine($"  Tables:       {result.TableCount,7:N0}");
        Console.WriteLine($"  Columns:      {result.ColumnCount,7:N0}");
        Console.WriteLine($"  Views:        {result.ViewCount,7:N0}");
        Console.WriteLine($"  Procedures:   {result.ProcedureCount,7:N0}");
        Console.WriteLine($"  UDFs:         {result.UdfCount,7:N0}");
        Console.WriteLine($"  Triggers:     {result.TriggerCount,7:N0}");
        Console.WriteLine($"  Constraints:  {result.ConstraintCount,7:N0}");
        Console.WriteLine("─────────────────────────────────────────────");

        if (result.FailureMessage is not null)
        {
            Console.WriteLine($"  Failure:      {result.FailureMessage}");
            Console.WriteLine("─────────────────────────────────────────────");
        }

        if (deepResult is not null)
        {
            Console.WriteLine();
            Console.WriteLine("─────────────────────────────────────────────");
            Console.WriteLine("  Deep profile (B2)");
            Console.WriteLine("─────────────────────────────────────────────");
            Console.WriteLine($"  Tables attempted: {deepResult.TablesAttempted,5:N0}");
            Console.WriteLine($"  Tables profiled:  {deepResult.TablesProfiled,5:N0}");
            Console.WriteLine($"  Tables failed:    {deepResult.TablesFailed,5:N0}");
            Console.WriteLine($"  Tables skipped:   {deepResult.TablesSkipped,5:N0}");
            Console.WriteLine($"  Started:          {deepResult.StartedAtUtc:O}");
            Console.WriteLine($"  Completed:        {deepResult.CompletedAtUtc:O}");
            Console.WriteLine("─────────────────────────────────────────────");

            if (deepResult.Failures.Count > 0)
            {
                Console.WriteLine("  Per-table failures (first 10):");
                var shown = 0;
                foreach (var f in deepResult.Failures)
                {
                    Console.WriteLine($"    [{f.SchemaName}].[{f.TableName}] — {f.Reason}");
                    if (++shown >= 10) break;
                }
                if (deepResult.Failures.Count > 10)
                {
                    Console.WriteLine($"    ... and {deepResult.Failures.Count - 10} more.");
                }
                Console.WriteLine("─────────────────────────────────────────────");
            }
        }

        return result.Status switch
        {
            "completed" => 0,
            "failed" => 2,
            "cancelled" => 3,
            _ => 2
        };
    }
}
