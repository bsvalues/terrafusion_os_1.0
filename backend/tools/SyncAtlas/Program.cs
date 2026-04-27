using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using TerraFusion.Core.Entities.Sync.Profile;
using TerraFusion.Data;
using TerraFusion.Sync.Workbench.Atlas;
using TerraFusion.Sync.Workbench.Mapping;

namespace TerraFusion.Tools.SyncAtlas;

/// <summary>
/// CLI runner for the Database Atlas profiler (Slice B1.5).
///
/// Reads CLI args, opens the TerraFusion Postgres DbContext, then either
/// runs the structural / deep-profile pass via <see cref="AtlasProfiler"/>
/// (default mode) or generates a draft Mapping Workbook from the chosen
/// profile batch via <see cref="SyncMappingWorkbookDraftLoader"/> (Slice C4
/// mode, when <c>--generate-mapping-workbook</c> is set). Prints a
/// one-page summary either way. Exit codes:
///   0  — run completed successfully
///   1  — argument parse failure or missing required flags
///   2  — connection lookup, profile execution, or mapping load failed
///        (e.g. workbook in non-Draft state, no profile batch found)
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
            // Slice C4: explicit mode dispatch. Workbook mode never hits
            // the SQL Server profiler path, so a missing --connection-id
            // is fine in that branch.
            return args.GenerateMappingWorkbook
                ? await RunGenerateMappingWorkbookAsync(args, cts.Token)
                : await RunProfileAsync(args, cts.Token);
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

        // CliArgsParser guarantees ConnectionId is set before reaching the
        // profile branch (workbook mode is dispatched separately).
        var connectionId = args.ConnectionId
            ?? throw new InvalidOperationException("Profile mode reached without --connection-id; this is a parser invariant violation.");

        Console.WriteLine($"sync-atlas: profiling connection {connectionId} for county {args.CountyId}...");
        if (args.DeepProfile)
        {
            Console.WriteLine("sync-atlas: deep profile enabled — sample-based stats will run after the structural pass.");
        }
        var startedAt = DateTimeOffset.UtcNow;

        AtlasProfileResult result;
        try
        {
            result = await profiler.ProfileAsync(connectionId, args.CountyId, args.OperatorId, ct);
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
                    connectionId,
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

    /// <summary>
    /// Slice C4: Mapping Workbook draft generation. Resolves the seeding
    /// profile batch (explicit <c>--profile-batch-id</c> or
    /// <c>--latest-profile-batch</c>), constructs a
    /// <see cref="SyncMappingWorkbookDraftLoader"/>, calls its
    /// <c>CreateDraftAsync</c>, and prints a summary. Honors the loader's
    /// idempotency policy: re-running with the same workbook name on a
    /// Draft workbook is a no-op unless <c>--replace-existing-draft</c>
    /// is supplied; non-Draft workbooks throw and surface as exit 2.
    /// </summary>
    private static async Task<int> RunGenerateMappingWorkbookAsync(CliArgs args, CancellationToken ct)
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

        // Resolve the seeding batch.
        Guid profileBatchId;
        if (args.ProfileBatchId is Guid explicitBatchId)
        {
            // Validate that the explicit batch exists and belongs to the
            // requested county. Cross-county invocation is the kind of
            // operator slip-up worth refusing loudly.
            var owns = await db.SyncBatches
                .AnyAsync(b => b.Id == explicitBatchId && b.CountyId == args.CountyId, ct);
            if (!owns)
            {
                await Console.Error.WriteLineAsync(
                    $"sync-atlas: profile batch {explicitBatchId} not found for county {args.CountyId}.");
                return 2;
            }
            profileBatchId = explicitBatchId;
        }
        else
        {
            // --latest-profile-batch: pick the most recent successful
            // profile batch for the county. "Successful" = has at least
            // one SyncProfileTableStats row, mirroring the verify-SQL
            // probe used elsewhere.
            profileBatchId = await db.SyncBatches
                .Where(b => b.CountyId == args.CountyId
                         && b.Mode == "profile"
                         && db.Set<SyncProfileTableStats>().Any(s => s.SyncBatchId == b.Id))
                .OrderByDescending(b => b.StartedAtUtc)
                .Select(b => b.Id)
                .FirstOrDefaultAsync(ct);

            if (profileBatchId == Guid.Empty)
            {
                await Console.Error.WriteLineAsync(
                    $"sync-atlas: no successful profile batch found for county {args.CountyId}. " +
                    "Run a profile pass first, or pass --profile-batch-id explicitly.");
                return 2;
            }
        }

        var includeAllowlist = args.DeepProfileIncludeQualifiedNames.Count > 0
            ? new HashSet<string>(args.DeepProfileIncludeQualifiedNames, StringComparer.OrdinalIgnoreCase)
            : null;

        var loaderOptions = new SyncMappingWorkbookDraftOptions(
            WorkbookName:            args.WorkbookName!,
            ReplaceExistingDraft:    args.ReplaceExistingDraft,
            MaxCandidates:           args.MappingMaxCandidates,
            IncludeQualifiedColumns: includeAllowlist);

        var loader = new SyncMappingWorkbookDraftLoader(db);

        Console.WriteLine($"sync-atlas: generating Mapping Workbook draft for county {args.CountyId}...");
        Console.WriteLine($"sync-atlas:   profile batch:  {profileBatchId}");
        Console.WriteLine($"sync-atlas:   workbook name:  {args.WorkbookName}");
        if (args.ReplaceExistingDraft)
        {
            Console.WriteLine("sync-atlas:   replace mode:   on (existing Draft contents will be wiped)");
        }
        if (args.MappingMaxCandidates is int cap)
        {
            Console.WriteLine($"sync-atlas:   max candidates: {cap}");
        }

        SyncMappingWorkbookDraftResult result;
        try
        {
            result = await loader.CreateDraftAsync(args.CountyId, profileBatchId, loaderOptions, ct);
        }
        catch (InvalidOperationException ex)
        {
            // Loader rejected the call — typically a non-Draft workbook
            // collision. Surface the message verbatim and exit non-zero.
            await Console.Error.WriteLineAsync($"sync-atlas: {ex.Message}");
            return 2;
        }

        Console.WriteLine();
        Console.WriteLine("─────────────────────────────────────────────");
        Console.WriteLine($"  Mapping Workbook:    {(result.ReusedExistingDraft ? "reused existing draft" : "created/refreshed")}");
        Console.WriteLine($"  Workbook Id:         {result.WorkbookId}");
        Console.WriteLine($"  Profile Batch Id:    {profileBatchId}");
        Console.WriteLine($"  Columns Created:     {result.ColumnsCreated,7:N0}");
        Console.WriteLine($"  Code Values Created: {result.CodeValuesCreated,7:N0}");
        Console.WriteLine($"  Candidates Skipped:  {result.CandidatesSkipped,7:N0}");
        Console.WriteLine($"  Status:              Draft");
        Console.WriteLine("─────────────────────────────────────────────");

        return 0;
    }
}
