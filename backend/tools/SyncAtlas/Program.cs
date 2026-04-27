using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using TerraFusion.Core.Entities.Sync.Profile;
using TerraFusion.Data;
using TerraFusion.Sync.Workbench.Atlas;
using TerraFusion.Sync.Workbench.Mapping;
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
            // Slices C4 + C5 + C8-C + C9-B + C10-B: explicit six-way mode dispatch.
            // Workbook generate / export / qualify-sales / edit / lock modes
            // never hit the SQL Server profiler path, so a missing
            // --connection-id is fine in those branches.
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
}
