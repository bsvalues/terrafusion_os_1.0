using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using TerraFusion.Core.Entities.Sync;
using TerraFusion.Core.Entities.Sync.Profile;
using TerraFusion.Data;
using TerraFusion.Sync.Workbench.Atlas;
using TerraFusion.Sync.Workbench.Mapping;
using TerraFusion.Sync.Workbench.Pacs;
using TerraFusion.Sync.Workbench.Transforms.Sales;

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
            // Slices C4 + C5 + C8-C + C9-B + C10-B + C11-B + C14-B + C22-B:
            // explicit nine-way mode dispatch. Workbook generate /
            // export / qualify-sales / edit / lock / batch-edit /
            // review-progress modes never hit the SQL Server profiler
            // path; load-pacs-dictionary mode (C22-B) DOES hit PACS
            // and requires --connection-id.
            if (args.LoadPacsDictionary)
            {
                return await RunLoadPacsDictionaryAsync(args, cts.Token);
            }
            if (args.MappingReviewProgress)
            {
                return await RunMappingReviewProgressAsync(args, cts.Token);
            }
            if (args.BatchEditMappingWorkbook)
            {
                return await RunBatchEditMappingWorkbookAsync(args, cts.Token);
            }
            if (args.LockMappingWorkbook)
            {
                return await RunLockMappingWorkbookAsync(args, cts.Token);
            }
            if (args.EditMappingWorkbook)
            {
                return await RunEditMappingWorkbookAsync(args, cts.Token);
            }
            if (args.QualifySales)
            {
                return await RunQualifySalesAsync(args, cts.Token);
            }
            if (args.ExportMappingWorkbook)
            {
                return await RunExportMappingWorkbookAsync(args, cts.Token);
            }
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

    /// <summary>
    /// Slice C5: Mapping Workbook export. Reads the named workbook +
    /// its columns + code values and writes review-safe CSV/Markdown
    /// to the operator-supplied output directory. Read-only —
    /// workbook rows are never modified.
    /// </summary>
    private static async Task<int> RunExportMappingWorkbookAsync(CliArgs args, CancellationToken ct)
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

        // Parser invariant: ExportMappingWorkbook=true ⇒ both WorkbookId
        // and OutputDirectory are set. Defend with InvalidOperationException
        // so a future parser regression fails closed.
        var workbookId = args.WorkbookId
            ?? throw new InvalidOperationException("Export mode reached without --workbook-id; this is a parser invariant violation.");
        var outputDir = args.OutputDirectory
            ?? throw new InvalidOperationException("Export mode reached without --output-dir; this is a parser invariant violation.");

        var exporterOptions = new SyncMappingWorkbookExportOptions(
            OutputDirectory: outputDir,
            Format:          args.ExportFormat);

        var exporter = new SyncMappingWorkbookExporter(db);

        Console.WriteLine($"sync-atlas: exporting Mapping Workbook for county {args.CountyId}...");
        Console.WriteLine($"sync-atlas:   workbook id:  {workbookId}");
        Console.WriteLine($"sync-atlas:   output dir:   {outputDir}");
        Console.WriteLine($"sync-atlas:   format:       {args.ExportFormat}");

        SyncMappingWorkbookExportResult result;
        try
        {
            result = await exporter.ExportAsync(args.CountyId, workbookId, exporterOptions, ct);
        }
        catch (InvalidOperationException ex)
        {
            // Cross-county / not-found rejection.
            await Console.Error.WriteLineAsync($"sync-atlas: {ex.Message}");
            return 2;
        }

        Console.WriteLine();
        Console.WriteLine("─────────────────────────────────────────────");
        Console.WriteLine($"  Mapping Workbook:    exported");
        Console.WriteLine($"  Workbook Id:         {result.WorkbookId}");
        Console.WriteLine($"  Workbook Name:       {result.WorkbookName}");
        Console.WriteLine($"  Workbook Status:     {result.WorkbookStatus}");
        Console.WriteLine($"  Columns:             {result.Columns,7:N0}");
        Console.WriteLine($"  Code Values:         {result.CodeValues,7:N0}");
        Console.WriteLine("─────────────────────────────────────────────");
        Console.WriteLine("  Files written:");
        foreach (var file in result.FilesWritten)
        {
            Console.WriteLine($"    {file}");
        }
        Console.WriteLine("─────────────────────────────────────────────");

        return 0;
    }

    /// <summary>
    /// Slice C8-C: read-only sales qualification sample runner.
    /// Loads a Mapped workbook, reads up to <c>--max-sales</c> rows from
    /// PACS, qualifies each via the C8-B transform, and prints aggregate
    /// counts plus a per-row sample. NEVER mutates anything.
    /// </summary>
    private static async Task<int> RunQualifySalesAsync(CliArgs args, CancellationToken ct)
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

        // Parser invariants: QualifySales=true ⇒ WorkbookId,
        // SourceConnectionId, MaxSales all set. Defend so a future
        // parser regression fails closed.
        var workbookId = args.WorkbookId
            ?? throw new InvalidOperationException("Qualify-sales mode reached without --workbook-id; this is a parser invariant violation.");
        var sourceConnectionId = args.SourceConnectionId
            ?? throw new InvalidOperationException("Qualify-sales mode reached without --source-connection-id; this is a parser invariant violation.");
        var maxSales = args.MaxSales
            ?? throw new InvalidOperationException("Qualify-sales mode reached without --max-sales; this is a parser invariant violation.");

        // Same secret-resolver wiring as the structural / deep-profile
        // / export readers (B1.6.5). SQL Auth passwords come from the
        // operator's process environment; no plaintext on the entity.
        var secretResolver = new EnvironmentSecretResolver();
        var salesReader    = new SqlServerSalesRowReader(secretResolver);
        var readModel      = new SyncMappingWorkbookReadModel(db);
        var runner         = new SalesQualificationSampleRunner(db, readModel, salesReader);

        Console.WriteLine($"sync-atlas: qualifying sales sample for county {args.CountyId}...");
        Console.WriteLine($"sync-atlas:   workbook id:           {workbookId}");
        Console.WriteLine($"sync-atlas:   source connection id:  {sourceConnectionId}");
        Console.WriteLine($"sync-atlas:   max sales:             {maxSales}");

        SalesQualificationSampleResult result;
        try
        {
            result = await runner.RunAsync(args.CountyId, workbookId, sourceConnectionId, maxSales, ct);
        }
        catch (InvalidOperationException ex)
        {
            // Workbook-status guard, missing connection, cross-county
            // — all surface here. Verbatim message + exit 2.
            await Console.Error.WriteLineAsync($"sync-atlas: {ex.Message}");
            return 2;
        }

        Console.WriteLine();
        Console.WriteLine("─────────────────────────────────────────────");
        Console.WriteLine($"  Sales Qualification Sample");
        Console.WriteLine($"  Workbook Id:         {result.WorkbookId}");
        Console.WriteLine($"  Source Connection:   {result.SourceConnectionId}");
        Console.WriteLine($"  Rows Read:           {result.RowsRead,7:N0}");
        Console.WriteLine("─────────────────────────────────────────────");
        Console.WriteLine($"  Qualified:           {result.QualifiedCount,7:N0}");
        Console.WriteLine($"  Excluded:            {result.ExcludedCount,7:N0}");
        Console.WriteLine($"  Deferred:            {result.DeferredCount,7:N0}");
        Console.WriteLine($"  Unknown:             {result.UnknownCount,7:N0}");
        Console.WriteLine($"  MissingCode:         {result.MissingCodeCount,7:N0}");
        Console.WriteLine("─────────────────────────────────────────────");

        if (result.Sample.Count > 0)
        {
            Console.WriteLine("  Sample Decisions (first 20):");
            Console.WriteLine("    sale_id | wac_cd | sl_ratio_type_cd | status | excluded | canonical");
            var shown = 0;
            foreach (var entry in result.Sample)
            {
                if (shown++ >= 20) break;
                Console.WriteLine(
                    $"    {entry.SaleIdentifier ?? "—"} | " +
                    $"{entry.WacCode ?? "—"} | " +
                    $"{entry.SaleRatioTypeCode ?? "—"} | " +
                    $"{entry.Status} | " +
                    $"{(entry.IsExcludedFromComps ? "yes" : "no")} | " +
                    $"{entry.CanonicalValue ?? "—"}");
            }
            if (result.Sample.Count > 20)
            {
                Console.WriteLine($"    ... and {result.Sample.Count - 20} more.");
            }
            Console.WriteLine("─────────────────────────────────────────────");
        }

        return 0;
    }

    /// <summary>
    /// Slice C9-B: Mapping Workbook edit. Edits one column or code-value
    /// row per invocation while the workbook is Status='Draft'.
    /// Read-modify-write only — no PACS / canonical / Forge /
    /// TerraAtlas mutation.
    /// </summary>
    private static async Task<int> RunEditMappingWorkbookAsync(CliArgs args, CancellationToken ct)
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

        // Parser invariants: EditMappingWorkbook=true ⇒ WorkbookId, the
        // three EditSource* parts, AND at-least-one mutation are set.
        var workbookId = args.WorkbookId
            ?? throw new InvalidOperationException("Edit mode reached without --workbook-id; this is a parser invariant violation.");
        var sourceSchema = args.EditSourceSchema
            ?? throw new InvalidOperationException("Edit mode reached without --source schema; this is a parser invariant violation.");
        var sourceTable = args.EditSourceTable
            ?? throw new InvalidOperationException("Edit mode reached without --source table; this is a parser invariant violation.");
        var sourceColumn = args.EditSourceColumn
            ?? throw new InvalidOperationException("Edit mode reached without --source column; this is a parser invariant violation.");

        var request = new SyncMappingWorkbookEditRequest(
            SourceSchema:       sourceSchema,
            SourceTable:        sourceTable,
            SourceColumn:       sourceColumn,
            SourceValue:        args.EditSourceValue,
            CanonicalTarget:    args.EditCanonicalTarget,
            CanonicalValue:     args.EditCanonicalValue,
            CanonicalValueNull: args.EditCanonicalValueNull,
            ReviewStatus:       args.EditReviewStatus,
            IsExcluded:         args.EditIsExcluded,
            Notes:              args.EditNotes);

        var service = new SyncMappingWorkbookEditService(db);

        var sourceLabel = args.EditSourceValue is null
            ? $"{sourceSchema}.{sourceTable}.{sourceColumn}"
            : $"{sourceSchema}.{sourceTable}.{sourceColumn} / {args.EditSourceValue}";

        Console.WriteLine($"sync-atlas: editing mapping workbook {workbookId}...");
        Console.WriteLine($"sync-atlas:   target:    {sourceLabel}");
        Console.WriteLine($"sync-atlas:   operator:  {args.OperatorId}");

        SyncMappingWorkbookEditResult result;
        try
        {
            result = await service.EditAsync(args.CountyId, workbookId, request, ct);
        }
        catch (InvalidOperationException ex)
        {
            // Status guard / cross-county / source-not-found — verbatim message.
            await Console.Error.WriteLineAsync($"sync-atlas: {ex.Message}");
            return 2;
        }
        catch (ArgumentException ex)
        {
            // Service-side defense-in-depth (parser usually catches first).
            await Console.Error.WriteLineAsync($"sync-atlas: {ex.Message}");
            return 1;
        }

        Console.WriteLine();
        Console.WriteLine("─────────────────────────────────────────────");
        Console.WriteLine($"  Workbook Id:   {result.WorkbookId}");
        Console.WriteLine($"  Edited:        {result.Scope}");
        Console.WriteLine($"  Source:        {sourceSchema}.{sourceTable}.{sourceColumn}");
        if (args.EditSourceValue is not null)
        {
            Console.WriteLine($"  Source Value:  {args.EditSourceValue}");
        }
        Console.WriteLine($"  Changed:       {(result.Changed ? "yes" : "no (audit stamp only)")}");
        Console.WriteLine("─────────────────────────────────────────────");
        Console.WriteLine("  Pre-edit:");
        foreach (var kvp in result.Before)
        {
            Console.WriteLine($"    {kvp.Key,-18}{Render(kvp.Value)}");
        }
        Console.WriteLine("  Post-edit:");
        foreach (var kvp in result.After)
        {
            // Show "(unchanged)" suffix when post equals pre — saves the
            // operator from eyeballing identical strings on both panels.
            var pre = result.Before.TryGetValue(kvp.Key, out var p) ? p : null;
            var unchangedNote = string.Equals(kvp.Value, pre, StringComparison.Ordinal)
                ? "  (unchanged)"
                : string.Empty;
            Console.WriteLine($"    {kvp.Key,-18}{Render(kvp.Value)}{unchangedNote}");
        }
        Console.WriteLine("─────────────────────────────────────────────");

        return 0;

        static string Render(string? v) => v ?? "(null)";
    }

    /// <summary>
    /// Slice C10-B: Mapping Workbook lock. One-shot Draft→Mapped
    /// transition via <see cref="SyncMappingWorkbookLockService"/>.
    /// All four C10-A Hard Guards live in the C6 service:
    ///   1. Workbook must be Status='Draft'.
    ///   2. Workbook must belong to the supplied countyId.
    ///   3. Every column AND every code-value must be at a terminal
    ///      review status (Mapped / Excluded / Deferred).
    ///   4. There is no --unlock — lock is one-shot.
    /// CLI's job is to invoke, print a one-page summary, and translate
    /// service exceptions to exit 2.
    /// </summary>
    private static async Task<int> RunLockMappingWorkbookAsync(CliArgs args, CancellationToken ct)
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

        // Parser invariant: LockMappingWorkbook=true ⇒ WorkbookId set.
        var workbookId = args.WorkbookId
            ?? throw new InvalidOperationException("Lock mode reached without --workbook-id; this is a parser invariant violation.");

        var service = new SyncMappingWorkbookLockService(db);

        Console.WriteLine($"sync-atlas: locking mapping workbook {workbookId}...");
        Console.WriteLine($"sync-atlas:   operator:  {args.OperatorId}");

        SyncMappingWorkbookLockResult result;
        try
        {
            result = await service.LockAsync(args.CountyId, workbookId, ct);
        }
        catch (InvalidOperationException ex)
        {
            // Cross-county / not-found / non-Draft / non-terminal-rows —
            // verbatim message + exit 2. The C6 service's exception text
            // already names example non-terminal rows, which is the
            // operator-actionable receipt the C10-A policy promised.
            await Console.Error.WriteLineAsync($"sync-atlas: {ex.Message}");
            return 2;
        }
        catch (ArgumentException ex)
        {
            // Service-side defense-in-depth (parser usually catches first).
            await Console.Error.WriteLineAsync($"sync-atlas: {ex.Message}");
            return 1;
        }

        Console.WriteLine();
        Console.WriteLine("─────────────────────────────────────────────");
        Console.WriteLine($"  Mapping Workbook:        locked");
        Console.WriteLine($"  Workbook Id:             {result.WorkbookId}");
        Console.WriteLine($"  Status:                  {result.Status}");
        Console.WriteLine($"  Columns Validated:     {result.ColumnsValidated,7:N0}");
        Console.WriteLine($"  Code Values Validated: {result.CodeValuesValidated,7:N0}");
        Console.WriteLine("─────────────────────────────────────────────");

        return 0;
    }

    /// <summary>
    /// Slice C11-B: Mapping Workbook batch edit. Reads the operator-
    /// authored CSV, validates every row, then either prints the
    /// planned mutations (--dry-run) or applies them in a single
    /// transaction (--apply). All-or-nothing semantics: any validation
    /// error means zero rows mutate. The four C11-A Hard Guards live in
    /// the C11-B service:
    ///   1. Workbook must be Status='Draft'.
    ///   2. Workbook must belong to the supplied countyId.
    ///   3. Atomicity: validate-then-apply, single SaveChangesAsync.
    ///   4. No auto-exclusion of WAC codes — the CSV row's explicit
    ///      is_excluded=true is the only path.
    /// </summary>
    private static async Task<int> RunBatchEditMappingWorkbookAsync(CliArgs args, CancellationToken ct)
    {
        // Parser invariants: BatchEditMappingWorkbook=true ⇒ WorkbookId,
        // InputCsvPath, and exactly one of DryRun/Apply set.
        var workbookId = args.WorkbookId
            ?? throw new InvalidOperationException("Batch-edit mode reached without --workbook-id; this is a parser invariant violation.");
        var csvPath = args.InputCsvPath
            ?? throw new InvalidOperationException("Batch-edit mode reached without --input-csv; this is a parser invariant violation.");

        if (!File.Exists(csvPath))
        {
            await Console.Error.WriteLineAsync($"sync-atlas: input CSV not found: {csvPath}");
            return 2;
        }

        string csvText;
        try
        {
            csvText = await File.ReadAllTextAsync(csvPath, ct);
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            await Console.Error.WriteLineAsync($"sync-atlas: failed to read CSV {csvPath}: {ex.Message}");
            return 2;
        }

        var parseResult = BatchEditCsvParser.Parse(csvText);
        if (parseResult.HeaderError is not null)
        {
            await Console.Error.WriteLineAsync($"sync-atlas: {parseResult.HeaderError}");
            return 2;
        }

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

        var service = new SyncMappingWorkbookBatchEditService(db);
        var mode = args.BatchEditApply
            ? SyncMappingWorkbookBatchEditMode.Apply
            : SyncMappingWorkbookBatchEditMode.DryRun;

        Console.WriteLine($"sync-atlas: batch edit ({(mode == SyncMappingWorkbookBatchEditMode.Apply ? "APPLY" : "DRY-RUN")}) for workbook {workbookId}...");
        Console.WriteLine($"sync-atlas:   input csv:  {csvPath}");
        Console.WriteLine($"sync-atlas:   total rows: {parseResult.Rows.Count}");
        Console.WriteLine($"sync-atlas:   operator:   {args.OperatorId}");

        SyncMappingWorkbookBatchEditResult result;
        try
        {
            result = await service.ApplyAsync(args.CountyId, workbookId, parseResult.Rows, mode, ct);
        }
        catch (InvalidOperationException ex)
        {
            // Status guard / cross-county / concurrent-modification —
            // verbatim message + exit 2.
            await Console.Error.WriteLineAsync($"sync-atlas: {ex.Message}");
            return 2;
        }
        catch (ArgumentException ex)
        {
            // Service-side defense-in-depth (parser usually catches first).
            await Console.Error.WriteLineAsync($"sync-atlas: {ex.Message}");
            return 1;
        }

        if (result.Outcome == SyncMappingWorkbookBatchEditOutcome.ValidationFailed)
        {
            await Console.Error.WriteLineAsync(string.Empty);
            await Console.Error.WriteLineAsync($"sync-atlas: batch edit validation failed for workbook {workbookId}");
            await Console.Error.WriteLineAsync("─────────────────────────────────────────────");
            await Console.Error.WriteLineAsync($"  {"Line",4}  {"Scope",-10}  {"Source",-48}  Error");
            await Console.Error.WriteLineAsync("─────────────────────────────────────────────");
            foreach (var err in result.Errors)
            {
                var src = err.SourceLabel.Length > 48 ? err.SourceLabel[..45] + "..." : err.SourceLabel;
                await Console.Error.WriteLineAsync($"  {err.LineNumber,4}  {err.Scope,-10}  {src,-48}  {err.Message}");
            }
            await Console.Error.WriteLineAsync("─────────────────────────────────────────────");
            await Console.Error.WriteLineAsync($"  Validation errors: {result.Errors.Count}");
            await Console.Error.WriteLineAsync($"  Rows that would apply: 0");
            await Console.Error.WriteLineAsync("─────────────────────────────────────────────");
            return 2;
        }

        var outcomeLabel = result.Outcome == SyncMappingWorkbookBatchEditOutcome.Applied
            ? "applied"
            : "dry-run (no mutations applied)";
        var auditLine = result.Outcome == SyncMappingWorkbookBatchEditOutcome.Applied
            ? "1 (workbook UpdatedAt bumped once)"
            : "none (dry-run)";

        Console.WriteLine();
        Console.WriteLine("─────────────────────────────────────────────");
        Console.WriteLine($"  Mapping Workbook:  {result.WorkbookId}");
        Console.WriteLine($"  Mode:              {outcomeLabel}");
        Console.WriteLine($"  Rows Validated:    {result.RowsValidated,5:N0}");
        Console.WriteLine($"  Rows To Mutate:    {result.RowsToMutate,5:N0}");
        Console.WriteLine($"  Audit Stamp Bump:  {auditLine}");
        Console.WriteLine("─────────────────────────────────────────────");
        Console.WriteLine($"  Per-scope summary:");
        Console.WriteLine($"    column rows:     {result.ColumnRowCount,5:N0}");
        Console.WriteLine($"    code_value rows: {result.CodeValueRowCount,5:N0}");
        Console.WriteLine("─────────────────────────────────────────────");
        Console.WriteLine($"  Per-status summary:");
        Console.WriteLine($"    → Mapped:        {result.MappedCount,5:N0}");
        Console.WriteLine($"    → Excluded:      {result.ExcludedCount,5:N0}");
        Console.WriteLine($"    → Deferred:      {result.DeferredCount,5:N0}");
        Console.WriteLine($"    → InProgress:    {result.InProgressCount,5:N0}");
        Console.WriteLine($"    → NeedsReview:   {result.NeedsReviewCount,5:N0}");
        Console.WriteLine("─────────────────────────────────────────────");

        return 0;
    }

    /// <summary>
    /// Slice C14-B: read-only Mapping Workbook review progress
    /// dashboard. Never mutates anything. Prints six sections
    /// (workbook summary, status counts, lane breakdown, top
    /// blocking columns, sales review focus, lock readiness) to
    /// stdout in the same visual style as the rest of the
    /// SyncAtlas CLI.
    /// </summary>
    private static async Task<int> RunMappingReviewProgressAsync(CliArgs args, CancellationToken ct)
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

        // Parser invariant: MappingReviewProgress=true ⇒ WorkbookId set.
        var workbookId = args.WorkbookId
            ?? throw new InvalidOperationException("Progress mode reached without --workbook-id; this is a parser invariant violation.");

        var service = new SyncMappingWorkbookReviewProgressService(db);

        Console.WriteLine($"sync-atlas: Mapping Workbook review progress for county {args.CountyId}...");
        Console.WriteLine($"sync-atlas:   workbook id: {workbookId}");

        SyncMappingWorkbookReviewProgressReport report;
        try
        {
            report = await service.GetReportAsync(args.CountyId, workbookId, ct);
        }
        catch (InvalidOperationException ex)
        {
            await Console.Error.WriteLineAsync($"sync-atlas: {ex.Message}");
            return 2;
        }
        catch (ArgumentException ex)
        {
            await Console.Error.WriteLineAsync($"sync-atlas: {ex.Message}");
            return 1;
        }

        PrintReviewProgressReport(report);
        return 0;
    }

    private static void PrintReviewProgressReport(SyncMappingWorkbookReviewProgressReport r)
    {
        // Section 1: Workbook Summary
        var lockReadinessHeadline = r.LockReadiness.Status switch
        {
            SyncMappingReviewLockReadinessStatus.Ready =>
                "READY (run --lock-mapping-workbook to flip Status to Mapped)",
            SyncMappingReviewLockReadinessStatus.AlreadyLocked =>
                $"already {r.Status}",
            _ =>
                $"not ready ({r.LockReadiness.BlockingCodeValues:N0} code-values + " +
                $"{r.LockReadiness.BlockingColumns:N0} columns blocking)",
        };

        Console.WriteLine();
        Console.WriteLine("─────────────────────────────────────────────");
        Console.WriteLine("  Workbook Summary");
        Console.WriteLine("─────────────────────────────────────────────");
        Console.WriteLine($"  Workbook Id:        {r.WorkbookId}");
        Console.WriteLine($"  Name:               {r.WorkbookName}");
        Console.WriteLine($"  Status:             {r.Status}");
        Console.WriteLine($"  County Id:          {r.CountyId}");
        Console.WriteLine($"  Source Connection:  {r.SourceConnectionId}");
        Console.WriteLine($"  Profile Batch:      {r.ProfileBatchId}");
        Console.WriteLine($"  Created:            {r.CreatedAt:O}");
        Console.WriteLine($"  Updated:            {r.UpdatedAt:O}");
        Console.WriteLine($"  Created By:         {r.CreatedBy ?? "(none)"}");
        Console.WriteLine($"  Updated By:         {r.UpdatedBy ?? "(none)"}");
        Console.WriteLine($"  Columns:            {r.ColumnCount,7:N0}");
        Console.WriteLine($"  Code Values:        {r.CodeValueCount,7:N0}");
        Console.WriteLine($"  Lock Readiness:     {lockReadinessHeadline}");

        // Section 2: Review Status Counts
        Console.WriteLine();
        Console.WriteLine("─────────────────────────────────────────────");
        Console.WriteLine("  Review Status Counts");
        Console.WriteLine("─────────────────────────────────────────────");
        Console.WriteLine($"  {"Scope",-12} {"NeedsReview",11} {"InProgress",10} {"Mapped",6} {"Excluded",8} {"Deferred",8} {"Terminal",8} {"NonTerminal",11}");
        PrintStatusCountsRow("Columns",     r.ColumnStatusCounts);
        PrintStatusCountsRow("Code Values", r.CodeValueStatusCounts);

        // Section 3: Lane Breakdown
        Console.WriteLine();
        Console.WriteLine("─────────────────────────────────────────────");
        Console.WriteLine("  Lane Breakdown (sorted by % complete, ascending)");
        Console.WriteLine("─────────────────────────────────────────────");
        Console.WriteLine($"  {"Lane",-16} {"Columns",7} {"CodeValues",10} {"Terminal",8} {"NonTerminal",11} {"Percent",7}");
        foreach (var lane in r.LaneBreakdown)
        {
            var pct = lane.PercentComplete is null ? "n/a" : $"{lane.PercentComplete:0.0}%";
            Console.WriteLine(
                $"  {lane.Lane,-16} " +
                $"{lane.Columns,7:N0} {lane.CodeValues,10:N0} " +
                $"{lane.Terminal,8:N0} {lane.NonTerminal,11:N0} " +
                $"{pct,7}");
        }

        // Section 4: Top Blocking Columns
        Console.WriteLine();
        Console.WriteLine("─────────────────────────────────────────────");
        Console.WriteLine($"  Top Blocking Columns (top {SyncMappingWorkbookReviewProgressService.TopBlockingColumnsCap} by NonTerminal desc)");
        Console.WriteLine("─────────────────────────────────────────────");
        if (r.TopBlockingColumns.Count == 0)
        {
            Console.WriteLine("  (no blocking columns — every column is fully reviewed)");
        }
        else
        {
            Console.WriteLine($"  {"Source",-44} {"Lane",-14} {"NonTerminal",11} {"Terminal",8} {"Total",6}");
            foreach (var b in r.TopBlockingColumns)
            {
                var src = $"{b.SourceSchema}.{b.SourceTable}.{b.SourceColumn}";
                var truncated = src.Length > 44 ? src[..41] + "..." : src;
                Console.WriteLine(
                    $"  {truncated,-44} " +
                    $"{b.Lane,-14} " +
                    $"{b.NonTerminal,11:N0} {b.Terminal,8:N0} {b.Total,6:N0}");
            }
        }

        // Section 5: Sales Review Focus
        Console.WriteLine();
        Console.WriteLine("─────────────────────────────────────────────");
        Console.WriteLine("  Sales Review Focus (pinned)");
        Console.WriteLine("─────────────────────────────────────────────");
        if (r.SalesFocus.Count == 0)
        {
            Console.WriteLine("  (neither sale.wac_cd nor sale.sl_ratio_type_cd is in this workbook)");
        }
        else
        {
            Console.WriteLine($"  {"Source",-32} {"ColumnReviewStatus",-18} {"CodeValues",10} {"Terminal",8} {"NonTerminal",11} {"Percent",7}");
            foreach (var sf in r.SalesFocus)
            {
                var src = $"{sf.SourceSchema}.{sf.SourceTable}.{sf.SourceColumn}";
                var truncated = src.Length > 32 ? src[..29] + "..." : src;
                var pct = sf.PercentComplete is null ? "n/a" : $"{sf.PercentComplete:0.0}%";
                Console.WriteLine(
                    $"  {truncated,-32} " +
                    $"{sf.ColumnReviewStatus,-18} " +
                    $"{sf.CodeValues,10:N0} {sf.Terminal,8:N0} {sf.NonTerminal,11:N0} " +
                    $"{pct,7}");
            }
        }

        // Section 6: Lock Readiness
        Console.WriteLine();
        Console.WriteLine("─────────────────────────────────────────────");
        Console.WriteLine("  Lock Readiness");
        Console.WriteLine("─────────────────────────────────────────────");
        switch (r.LockReadiness.Status)
        {
            case SyncMappingReviewLockReadinessStatus.Ready:
                Console.WriteLine("  Status:               READY");
                Console.WriteLine("  Blocking Columns:                      0");
                Console.WriteLine("  Blocking Code Values:                  0");
                Console.WriteLine("  First Lockable When:  now — run --lock-mapping-workbook to flip Status to Mapped.");
                break;
            case SyncMappingReviewLockReadinessStatus.AlreadyLocked:
                Console.WriteLine($"  Status:               already {r.Status}");
                Console.WriteLine("  Blocking Columns:                      0");
                Console.WriteLine("  Blocking Code Values:                  0");
                Console.WriteLine("  First Lockable When:  workbook already past the Draft stage; lock cannot be re-run.");
                break;
            default:
                Console.WriteLine("  Status:               not ready");
                Console.WriteLine($"  Blocking Columns:     {r.LockReadiness.BlockingColumns,18:N0}  (NeedsReview / InProgress)");
                Console.WriteLine($"  Blocking Code Values: {r.LockReadiness.BlockingCodeValues,18:N0}  (NeedsReview / InProgress)");
                Console.WriteLine("  First Lockable When:  every column AND every code-value reaches a terminal status");
                Console.WriteLine("                        (Mapped / Excluded / Deferred).");
                break;
        }
        Console.WriteLine("─────────────────────────────────────────────");
    }

    private static void PrintStatusCountsRow(string label, SyncMappingReviewStatusCounts c)
    {
        Console.WriteLine(
            $"  {label,-12} " +
            $"{c.NeedsReview,11:N0} {c.InProgress,10:N0} " +
            $"{c.Mapped,6:N0} {c.Excluded,8:N0} {c.Deferred,8:N0} " +
            $"{c.Terminal,8:N0} {c.NonTerminal,11:N0}");
    }

    /// <summary>
    /// Slice C22-B: read-only PACS dictionary loader. Connects to PACS
    /// via the SyncSourceConnection identified by --connection-id,
    /// reads the named dictionary table (allowlist enforced parser-
    /// side), joins it against the workbook's Deferred property_use_cd
    /// code-values, and writes a proposed review CSV to the artifacts
    /// directory.
    ///
    /// <para>Per C22-A: never mutates PACS, never mutates the workbook.
    /// The proposed CSV is fed into --batch-edit-mapping-workbook by
    /// the operator in a separate slice (C22-C).</para>
    /// </summary>
    private static async Task<int> RunLoadPacsDictionaryAsync(CliArgs args, CancellationToken ct)
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

        // Parser invariants per CliArgs C22-B branch.
        var workbookId = args.WorkbookId
            ?? throw new InvalidOperationException(
                "Load-pacs-dictionary mode reached without --workbook-id; parser invariant violation.");
        var connectionId = args.ConnectionId
            ?? throw new InvalidOperationException(
                "Load-pacs-dictionary mode reached without --connection-id; parser invariant violation.");
        var tableName = args.PacsDictionaryTable
            ?? throw new InvalidOperationException(
                "Load-pacs-dictionary mode reached without --table; parser invariant violation.");

        // Look up the SyncSourceConnection (county-scoped). The PACS
        // connection string is built via the canonical secret-resolver
        // pipeline used by every other PACS-touching mode in SyncAtlas.
        var sourceConnection = await db.SyncSourceConnections
            .AsNoTracking()
            .FirstOrDefaultAsync(
                c => c.Id == connectionId && c.CountyId == args.CountyId,
                ct);
        if (sourceConnection is null)
        {
            await Console.Error.WriteLineAsync(
                $"sync-atlas: SyncSourceConnection {connectionId} not found for county {args.CountyId}.");
            return 2;
        }
        if (!string.Equals(sourceConnection.ConnectionType, "SqlServer", StringComparison.OrdinalIgnoreCase))
        {
            await Console.Error.WriteLineAsync(
                $"sync-atlas: SyncSourceConnection {connectionId} has ConnectionType " +
                $"'{sourceConnection.ConnectionType}', expected 'SqlServer'.");
            return 2;
        }

        var secretResolver = new EnvironmentSecretResolver();
        var pacsConnectionString = SqlServerMetadataReaderFactory.BuildConnectionString(
            sourceConnection, secretResolver);
        var pacsReader = new SqlPacsDictionaryReader(pacsConnectionString);

        // C22-B / C23-B: per-table target + column config. Each entry is
        // gated by a policy doc whose live-inspection step pinned the
        // workbook source triple, the dictionary column shape, and the
        // canonical-target vocabulary. Columns are NOT inferred — they
        // arrive from the policy gate and are reviewable in the diff.
        //
        // property_use defaults captured at C22-B-live inspection of
        // pacs_oltp (3 columns: property_use_cd / property_use_desc /
        // dor_use_code; no sys_flag, not year-keyed). imprv_det_class
        // defaults captured at C23-B-live inspection (TBD; if shape
        // differs, this branch is the canonical place to revise).
        var (target, columnConfig, sliceArtifactDir) = tableName.ToLowerInvariant() switch
        {
            "property_use" => (
                new DictionaryLoaderTargetConfig(
                    WorkbookSourceSchema: "dbo",
                    WorkbookSourceTable:  "property_val",
                    WorkbookSourceColumn: "property_use_cd",
                    PacsDictionarySchema: "dbo",
                    PacsDictionaryTable:  "property_use",
                    CanonicalTargetName:  "PropertyUse"),
                new DictionaryColumnConfig(
                    CodeColumn:           "property_use_cd",
                    DescriptionColumn:    "property_use_desc",
                    ActiveFlagColumn:     null,  // no sys_flag in this PACS instance
                    ActiveFlagPredicate:  null,
                    YearColumn:           null), // universe-wide, not year-keyed
                "c22-b"),
            "imprv_det_class" => (
                new DictionaryLoaderTargetConfig(
                    WorkbookSourceSchema: "dbo",
                    WorkbookSourceTable:  "imprv_detail",
                    WorkbookSourceColumn: "imprv_det_class_cd",
                    PacsDictionarySchema: "dbo",
                    PacsDictionaryTable:  "imprv_det_class",
                    CanonicalTargetName:  "ImprvDetailClass"),
                // Defaults captured at C23-B-live inspection of pacs_oltp:
                //   imprv_det_class_cd       char(10)    NOT NULL  (code)
                //   imprv_det_cls_desc       varchar(50) NULL      (description — note: NOT imprv_det_class_desc)
                //   sys_flag                 varchar(1)  NULL      (always 'F' in Benton — not a usable A/I active flag)
                //   is_permanent_crop_detail bit         NOT NULL
                //   rc_type                  char(1)     NULL
                // Findings: 27 rows; ALL sys_flag='F'; no usable active/
                // inactive distinction. Therefore the active-flag predicate
                // is intentionally NOT configured here (M4 cannot fire
                // against this PACS instance). Future PACS deployments
                // exposing genuine 'A'/'I' values must override per
                // C23-A's per-deployment column-config requirement.
                new DictionaryColumnConfig(
                    CodeColumn:           "imprv_det_class_cd",
                    DescriptionColumn:    "imprv_det_cls_desc",
                    ActiveFlagColumn:     null,
                    ActiveFlagPredicate:  null,
                    YearColumn:           null), // universe-wide, not year-keyed
                "c23-b"),
            "imprv_det_sub_class" => (
                new DictionaryLoaderTargetConfig(
                    WorkbookSourceSchema: "dbo",
                    WorkbookSourceTable:  "imprv_detail",
                    WorkbookSourceColumn: "imprv_det_sub_class_cd",
                    PacsDictionarySchema: "dbo",
                    PacsDictionaryTable:  "imprv_det_sub_class",
                    CanonicalTargetName:  "ImprvDetailSubClass"),
                // Defaults captured at C26-B-live inspection of pacs_oltp:
                //   imprv_det_sub_cls_cd     varchar(10) NOT NULL  (code — note 'sub_cls' not 'sub_class')
                //   imprv_det_sub_cls_desc   varchar(50) NULL      (description — same '_cls_' abbreviation)
                //   sys_flag                 varchar(1)  NULL      (lowercase 'f' in Benton — not usable A/I)
                //   is_permanent_crop_detail bit         NOT NULL
                //   rc_type                  char(1)     NULL
                // Findings: 2 rows ('*' → '*' self-ref, '+' → 'Plus Grade');
                // sys_flag all 'f' (lowercase!); no usable A/I distinction.
                // FIFTH wrong-assumption catch by the live-inspection gate:
                // PACS abbreviated 'class' to 'cls' on BOTH the code column
                // and the description column (unlike C23 which only
                // abbreviated the description). Note: workbook column
                // remains 'imprv_det_sub_class_cd' (not abbreviated)
                // because workbook columns mirror the PACS *table* column
                // they originate from (imprv_detail.imprv_det_sub_class_cd),
                // NOT the dictionary table's column.
                new DictionaryColumnConfig(
                    CodeColumn:           "imprv_det_sub_cls_cd",
                    DescriptionColumn:    "imprv_det_sub_cls_desc",
                    ActiveFlagColumn:     null,
                    ActiveFlagPredicate:  null,
                    YearColumn:           null), // universe-wide, not year-keyed
                "c26-b"),
            "imprv_det_meth" => (
                new DictionaryLoaderTargetConfig(
                    WorkbookSourceSchema: "dbo",
                    WorkbookSourceTable:  "imprv_detail",
                    WorkbookSourceColumn: "imprv_det_meth_cd",
                    PacsDictionarySchema: "dbo",
                    PacsDictionaryTable:  "imprv_det_meth",
                    CanonicalTargetName:  "ImprvDetailMethod"),
                // Defaults captured at C25-B-live inspection of pacs_oltp:
                //   imprv_det_meth_cd        char(5)     NOT NULL  (code)
                //   imprv_det_meth_dsc       varchar(50) NULL      (description — note: '_dsc' not '_desc')
                //   sys_flag                 char(1)     NULL      (always 'F' in Benton — same as imprv_det_class)
                //   is_permanent_crop_detail bit         NOT NULL
                //   rc_type                  char(1)     NULL
                // Findings: 12 rows; ALL sys_flag='F'; no usable A/I active flag.
                // Therefore active-flag predicate is null (M4 cannot fire) and
                // year filter is null. Fourth wrong-assumption catch by the
                // live-inspection gate: column is '_dsc' not '_desc'.
                new DictionaryColumnConfig(
                    CodeColumn:           "imprv_det_meth_cd",
                    DescriptionColumn:    "imprv_det_meth_dsc",
                    ActiveFlagColumn:     null,
                    ActiveFlagPredicate:  null,
                    YearColumn:           null), // universe-wide, not year-keyed
                "c25-b"),
            "land_soil" => (
                new DictionaryLoaderTargetConfig(
                    WorkbookSourceSchema: "dbo",
                    WorkbookSourceTable:  "land_detail",
                    WorkbookSourceColumn: "land_soil_code",
                    PacsDictionarySchema: "dbo",
                    PacsDictionaryTable:  "land_soil",
                    CanonicalTargetName:  "LandSoil"),
                // Defaults captured at C24-B-live inspection of pacs_oltp:
                //   szLandSoilCode  char(10)    NOT NULL  (code — Hungarian 'sz' prefix)
                //   szLandSoilDesc  varchar(64) NULL      (description)
                // Findings: 58 rows; only 2 columns; no sys_flag, no year
                // column, no per-acre value column (per C24-A: per-acre
                // valuation is the operator's authority via WSDOR / DOR
                // table, NOT the loader's). Therefore active-flag predicate
                // is null (M4 cannot fire) and year filter is null.
                // Several rows in Benton have NULL szLandSoilDesc (e.g.
                // BMDRP, RMDRP) — those will fall through M5 to the
                // "LandSoil:<code>" canonical fallback per the policy;
                // operator rephrases at C24-C against the WSDOR per-acre
                // table.
                new DictionaryColumnConfig(
                    CodeColumn:           "szLandSoilCode",
                    DescriptionColumn:    "szLandSoilDesc",
                    ActiveFlagColumn:     null,
                    ActiveFlagPredicate:  null,
                    YearColumn:           null), // universe-wide; WSDOR vintages live in per-acre table, not here
                "c24-b"),
            _ => throw new InvalidOperationException(
                $"No default column config for table '{tableName}'. " +
                "Loader currently allowlists 'property_use', 'imprv_det_class', 'land_soil', " +
                "'imprv_det_meth', and 'imprv_det_sub_class'."),
        };

        var loader = new DictionaryLoaderService(db, pacsReader);

        Console.WriteLine($"sync-atlas: load-pacs-dictionary for county {args.CountyId}...");
        Console.WriteLine($"sync-atlas:   workbook id:        {workbookId}");
        Console.WriteLine($"sync-atlas:   pacs connection:    {connectionId} ({sourceConnection.Server}/{sourceConnection.Database})");
        Console.WriteLine($"sync-atlas:   workbook source:    {target.WorkbookSourceSchema}.{target.WorkbookSourceTable}.{target.WorkbookSourceColumn}");
        Console.WriteLine($"sync-atlas:   dictionary table:   {target.PacsDictionarySchema}.{target.PacsDictionaryTable}");
        Console.WriteLine($"sync-atlas:   canonical target:   {target.CanonicalTargetName}");
        Console.WriteLine($"sync-atlas:   column config:      code={columnConfig.CodeColumn}, " +
                          $"desc={columnConfig.DescriptionColumn ?? "(none)"}, " +
                          $"active=({columnConfig.ActiveFlagPredicate ?? "(no active flag)"})");

        DictionaryLoaderResult result;
        try
        {
            result = await loader.ProposeReviewCsvAsync(
                args.CountyId, workbookId, target, columnConfig, ct);
        }
        catch (InvalidOperationException ex)
        {
            await Console.Error.WriteLineAsync($"sync-atlas: {ex.Message}");
            return 2;
        }
        catch (Exception ex)
        {
            await Console.Error.WriteLineAsync($"sync-atlas: PACS read failed: {ex.Message}");
            return 3;
        }

        // Write artifacts to backend/artifacts/sync-atlas/<slice>/<run-id>/
        // where <slice> is c22-b for property_use, c23-b for imprv_det_class.
        var runId = DateTime.UtcNow.ToString("yyyyMMddTHHmmssZ");
        var artifactDir = Path.Combine(
            "backend", "artifacts", "sync-atlas", sliceArtifactDir, runId);
        Directory.CreateDirectory(artifactDir);
        var csvPath = Path.Combine(artifactDir, $"{tableName}-proposed-review.csv");
        var reportPath = Path.Combine(artifactDir, $"{tableName}-mismatch-report.md");
        WriteProposedReviewCsv(csvPath, result);
        WriteMismatchReport(reportPath, result, tableName, sourceConnection);

        // Print the classification summary.
        Console.WriteLine();
        Console.WriteLine("─────────────────────────────────────────────");
        Console.WriteLine("  PACS Dictionary Loader (C22-B) — read-only");
        Console.WriteLine("─────────────────────────────────────────────");
        Console.WriteLine($"  Workbook Id:                    {result.WorkbookId}");
        Console.WriteLine($"  Workbook Deferred rows scanned: {result.WorkbookDeferredRows,5:N0}");
        Console.WriteLine($"  Dictionary rows read:           {result.DictionaryRowsRead,5:N0}");
        Console.WriteLine("─────────────────────────────────────────────");
        Console.WriteLine($"  M1 workbook code missing:       {result.M1WorkbookCodeMissingFromDictionary,5:N0} → Deferred");
        Console.WriteLine($"  M2 dictionary code unobserved:  {result.M2DictionaryCodeUnobservedInWorkbook,5:N0} (NOT in CSV)");
        Console.WriteLine($"  M3 duplicate dictionary code:   {result.M3DuplicateDictionaryCode,5:N0} → Deferred");
        Console.WriteLine($"  M4 inactive dictionary row:     {result.M4InactiveDictionaryRow,5:N0} → Deferred");
        Console.WriteLine($"  M5 clean match (proposed):      {result.M5CleanMatch,5:N0} → Mapped");
        Console.WriteLine("─────────────────────────────────────────────");
        Console.WriteLine($"  CSV row count:                  {result.ProposedRows.Count,5:N0}");
        Console.WriteLine();
        Console.WriteLine($"  Artifacts written:");
        Console.WriteLine($"    {csvPath}");
        Console.WriteLine($"    {reportPath}");
        Console.WriteLine();
        Console.WriteLine("  Note: this run did NOT mutate the workbook or PACS.");
        Console.WriteLine("  Operator reviews the proposed CSV and applies via");
        Console.WriteLine("  --batch-edit-mapping-workbook --apply (C22-C).");
        Console.WriteLine("─────────────────────────────────────────────");

        return 0;
    }

    /// <summary>
    /// Writes the proposed review CSV in the C11-A grammar with RFC 4180
    /// quoting (per C17-A2 / C19-B / C20-A precedent). The CSV is fed
    /// into <c>--batch-edit-mapping-workbook --apply</c> at C22-C.
    /// </summary>
    private static void WriteProposedReviewCsv(
        string path, DictionaryLoaderResult result)
    {
        using var w = new StreamWriter(path);
        w.WriteLine(
            "scope,source_schema,source_table,source_column,source_value," +
            "review_status,canonical_target,canonical_value,canonical_value_null," +
            "is_excluded,notes");

        foreach (var row in result.ProposedRows)
        {
            w.WriteLine(string.Join(",", new[]
            {
                CsvEscape(row.Scope),
                CsvEscape(row.SourceSchema),
                CsvEscape(row.SourceTable),
                CsvEscape(row.SourceColumn),
                CsvEscape(row.SourceValue),
                CsvEscape(row.ReviewStatus),
                CsvEscape(row.CanonicalTarget),
                CsvEscape(row.CanonicalValue),
                row.CanonicalValueNull?.ToString().ToLowerInvariant() ?? string.Empty,
                row.IsExcluded?.ToString().ToLowerInvariant() ?? string.Empty,
                CsvEscape(row.Notes),
            }));
        }
    }

    /// <summary>
    /// RFC 4180 quoting: wrap field in double-quotes if it contains a
    /// comma, double-quote, or newline; escape internal double-quotes
    /// by doubling them.
    /// </summary>
    private static string CsvEscape(string? value)
    {
        if (string.IsNullOrEmpty(value)) return string.Empty;
        var needsQuoting = value.Contains(',') || value.Contains('"') ||
                           value.Contains('\n') || value.Contains('\r');
        if (!needsQuoting) return value;
        return "\"" + value.Replace("\"", "\"\"") + "\"";
    }

    /// <summary>
    /// Writes a markdown-shaped mismatch report enumerating per-category
    /// counts + the first ~10 examples per category. Operator-readable
    /// pre-review of what the CSV proposes.
    /// </summary>
    private static void WriteMismatchReport(
        string path,
        DictionaryLoaderResult result,
        string tableName,
        SyncSourceConnection conn)
    {
        using var w = new StreamWriter(path);
        w.WriteLine($"# {tableName} dictionary loader — mismatch report");
        w.WriteLine();
        w.WriteLine($"Generated by SyncAtlas C22-B against:");
        w.WriteLine($"- workbook: `{result.WorkbookId}`");
        w.WriteLine($"- PACS:     `{conn.Server}/{conn.Database}` ({conn.Name})");
        w.WriteLine();
        w.WriteLine("## Counts");
        w.WriteLine();
        w.WriteLine("| Category | Count | CSV outcome |");
        w.WriteLine("|---|---:|---|");
        w.WriteLine($"| Workbook Deferred rows scanned | {result.WorkbookDeferredRows} | (input) |");
        w.WriteLine($"| Dictionary rows read | {result.DictionaryRowsRead} | (input) |");
        w.WriteLine($"| M1 workbook code missing from dictionary | {result.M1WorkbookCodeMissingFromDictionary} | Deferred |");
        w.WriteLine($"| M2 dictionary code unobserved in workbook | {result.M2DictionaryCodeUnobservedInWorkbook} | NOT in CSV |");
        w.WriteLine($"| M3 duplicate dictionary code | {result.M3DuplicateDictionaryCode} | Deferred |");
        w.WriteLine($"| M4 inactive dictionary row | {result.M4InactiveDictionaryRow} | Deferred |");
        w.WriteLine($"| **M5 clean match (proposed Mapped)** | **{result.M5CleanMatch}** | **Mapped** |");
        w.WriteLine($"| Total CSV rows | {result.ProposedRows.Count} | |");
        w.WriteLine();

        WriteCategorySection(w, "M1 — Workbook code missing from dictionary",
            result.ProposedRows.Where(r => r.Classification ==
                DictionaryRowClassification.WorkbookCodeMissingFromDictionary));
        WriteCategorySection(w, "M3 — Duplicate dictionary code (ambiguous)",
            result.ProposedRows.Where(r => r.Classification ==
                DictionaryRowClassification.DuplicateDictionaryCode));
        WriteCategorySection(w, "M4 — Inactive dictionary row",
            result.ProposedRows.Where(r => r.Classification ==
                DictionaryRowClassification.InactiveDictionaryRow));
        WriteCategorySection(w, "M5 — Clean match (proposed Mapped)",
            result.ProposedRows.Where(r => r.Classification ==
                DictionaryRowClassification.CleanMatch));
    }

    private static void WriteCategorySection(
        StreamWriter w, string heading, IEnumerable<ProposedReviewCsvRow> rows)
    {
        var list = rows.Take(50).ToList();
        if (list.Count == 0) return;
        w.WriteLine($"## {heading} (first {list.Count})");
        w.WriteLine();
        w.WriteLine("| SourceValue | Proposed canonical_value | Notes |");
        w.WriteLine("|---|---|---|");
        foreach (var r in list)
        {
            w.WriteLine($"| `{r.SourceValue.Trim()}` | {r.CanonicalValue ?? "(null)"} | {r.Notes.Replace("|", "\\|")} |");
        }
        w.WriteLine();
    }
}
