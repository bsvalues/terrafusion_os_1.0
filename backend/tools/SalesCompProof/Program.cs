using System.Text;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using TerraFusion.Data;
using TerraFusion.Sync.Workbench.Atlas;
using TerraFusion.Sync.Workbench.Comps.Sales;
using TerraFusion.Sync.Workbench.Mapping;
using TerraFusion.Sync.Workbench.Transforms.Sales;

namespace TerraFusion.Tools.SalesCompProof;

/// <summary>
/// Slice C37-C — live-PACS variant of the C37-B fixture proof.
///
/// <para>Drives the full C32 → C36 → C37 chain against (a) a real
/// county-scoped <see cref="SyncSourceConnection"/> (PACS via SQL
/// Server) and (b) a real Mapped <c>SyncMappingWorkbook</c>. Emits
/// the same evidence-pair shape (JSON + Markdown) as the fixture
/// proof, written to <c>os-platform/core/pilot/evidence/</c>.</para>
///
/// <para>Designed for the operator's locked Benton workbook
/// <c>a767c8a2-5b8a-4846-af8b-c3496601e924</c>, but works with any
/// Mapped workbook. The operator passes:</para>
/// <list type="bullet">
/// <item><c>--db</c>: TerraFusion Postgres connection string.</item>
/// <item><c>--county-id</c>: sovereign county scope.</item>
/// <item><c>--workbook-id</c>: a Mapped workbook in that county.</item>
/// <item><c>--source-connection-id</c>: an active
///   <c>SyncSourceConnection</c> in that county pointing at PACS.</item>
/// <item><c>--max-sales</c>: TOP-N bound for the read; recommend
///   500-2000 for a first run.</item>
/// <item><c>--operator</c>: audit-stamp identifier (defaults to
///   <c>"c37c-live-proof"</c>).</item>
/// </list>
///
/// <para>Read-only against PACS. The runner only writes to
/// TerraFusion's <c>CanonicalSaleQualifications</c> table (idempotent
/// per (CountyId, ChgOfOwnerId) per C35-A) and emits evidence files
/// to disk. Workbook is never mutated; PACS is never mutated.</para>
///
/// <para>Exit codes:
/// <list type="bullet">
/// <item><c>0</c> — proof completed; reconciliation rule passed;
///   evidence pair written.</item>
/// <item><c>1</c> — argument parse failure or missing required flags.</item>
/// <item><c>2</c> — runtime failure (workbook not Mapped, source
///   connection inactive / cross-county, PACS unreachable, EF
///   error). Verbatim error message goes to stderr.</item>
/// <item><c>3</c> — operator cancelled (Ctrl+C).</item>
/// <item><c>4</c> — reconciliation rule failed (counts don't sum or
///   comp pool size != Qualified). Evidence still written so the
///   discrepancy can be audited.</item>
/// </list>
/// </para>
/// </summary>
internal static class Program
{
    public static async Task<int> Main(string[] argv)
    {
        var (args, error) = CliArgs.Parse(argv);
        if (error is not null)
        {
            await Console.Error.WriteLineAsync($"sales-comp-proof: {error}");
            await Console.Error.WriteLineAsync(CliArgs.UsageText);
            return 1;
        }
        if (args!.ShowHelp)
        {
            Console.WriteLine(CliArgs.UsageText);
            return 0;
        }

        using var cts = new CancellationTokenSource();
        Console.CancelKeyPress += (_, e) => { e.Cancel = true; cts.Cancel(); };

        try
        {
            return await RunAsync(args, cts.Token);
        }
        catch (OperationCanceledException)
        {
            await Console.Error.WriteLineAsync("sales-comp-proof: cancelled by operator.");
            return 3;
        }
        catch (InvalidOperationException ex)
        {
            await Console.Error.WriteLineAsync($"sales-comp-proof: {ex.Message}");
            return 2;
        }
        catch (Exception ex)
        {
            await Console.Error.WriteLineAsync($"sales-comp-proof: unexpected: {ex.GetType().Name}: {ex.Message}");
            return 2;
        }
    }

    private static async Task<int> RunAsync(CliArgs args, CancellationToken ct)
    {
        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["ConnectionStrings:DefaultConnection"] = args.TerraFusionDbConnectionString,
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

        // Same secret-resolver wiring as B1.6.5 / C8-C — SQL Auth
        // passwords come from the operator's process environment;
        // never plaintext on the entity.
        var secretResolver = new EnvironmentSecretResolver();
        var salesReader    = new SqlServerSalesRowReader(secretResolver);
        var readModel      = new SyncMappingWorkbookReadModel(db);
        var writer         = new CanonicalSalesQualificationWriter(db);
        var runner         = new SalesQualificationCanonicalRunner(db, readModel, salesReader, writer);
        var compReader     = new SalesCompEligibilityReader(db);

        Console.WriteLine($"sales-comp-proof: live PACS proof against workbook {args.WorkbookId}");
        Console.WriteLine($"sales-comp-proof:   county id:             {args.CountyId}");
        Console.WriteLine($"sales-comp-proof:   workbook id:           {args.WorkbookId}");
        Console.WriteLine($"sales-comp-proof:   source connection id:  {args.SourceConnectionId}");
        Console.WriteLine($"sales-comp-proof:   max sales:             {args.MaxSales}");
        Console.WriteLine($"sales-comp-proof:   operator:              {args.OperatorId}");

        // ── 1. C36 write-side run against live PACS. The runner's
        //      LoadMappedAsync gate fails closed on a Draft workbook
        //      before any PACS read or canonical write.
        Console.WriteLine("sales-comp-proof: running C36 canonical-write transform...");
        var runResult = await runner.RunAsync(
            args.CountyId, args.WorkbookId, args.SourceConnectionId,
            args.MaxSales, args.OperatorId, ct);

        // ── 2. C37 comp-eligibility filter, pinned to the workbook
        //      under proof.
        Console.WriteLine("sales-comp-proof: querying C37 comp-eligibility filter...");
        var compPool = await compReader.ReadAsync(
            args.CountyId, sourceWorkbookId: args.WorkbookId, ct);

        // ── 3. Reconciliation rule (C37-A).
        var bucketsSum = runResult.QualifiedCount + runResult.ExcludedCount +
                         runResult.InconclusiveCount + runResult.SkippedNoIdentifierCount;
        var sumOk      = runResult.RowsRead == bucketsSum;
        var poolOk     = compPool.Count == runResult.QualifiedCount;
        var reconcileOk = sumOk && poolOk;

        // ── 4. Evidence pair.
        var evidenceDir = LocateEvidenceDir();
        Directory.CreateDirectory(evidenceDir);
        var stamp = DateTime.UtcNow.ToString("yyyyMMddTHHmmssZ");
        var jsonPath   = Path.Combine(evidenceDir, $"c37-comp-eligibility-live-proof.{stamp}.json");
        var mdPath     = Path.Combine(evidenceDir, $"c37-comp-eligibility-live-proof.{stamp}.md");
        var latestJson = Path.Combine(evidenceDir, "c37-comp-eligibility-live-proof.latest.json");
        var latestMd   = Path.Combine(evidenceDir, "c37-comp-eligibility-live-proof.latest.md");

        // Sample top excluded / inconclusive entries by wac_cd to
        // surface the WacCd-bug containment in the evidence (without
        // emitting the full N entries which can be large at live
        // scale).
        const int SampleCap = 25;
        var excludedSample = runResult.Entries
            .Where(e => e.TransformStatus == SalesQualificationDecisionStatus.Excluded)
            .Take(SampleCap)
            .Select(e => new { e.ChgOfOwnerId, e.WacCode, e.SaleRatioTypeCode, status = e.TransformStatus.ToString(), e.Persisted })
            .ToArray();
        var inconclusiveSample = runResult.Entries
            .Where(e => e.TransformStatus is SalesQualificationDecisionStatus.Deferred
                                          or SalesQualificationDecisionStatus.Unknown
                                          or SalesQualificationDecisionStatus.MissingCode)
            .Take(SampleCap)
            .Select(e => new { e.ChgOfOwnerId, e.WacCode, e.SaleRatioTypeCode, status = e.TransformStatus.ToString(), e.Persisted })
            .ToArray();
        var compSample = compPool
            .Take(SampleCap)
            .Select(s => new { s.ChgOfOwnerId, s.WacCdSourceValue, s.WacCdCanonicalValue, s.SlRatioTypeCdSourceValue, s.SlRatioTypeCdCanonicalValue, s.SaleDate, s.SalePrice })
            .ToArray();

        // Top-N WacCd value frequencies in the excluded / inconclusive
        // buckets — gives the operator a quick read on which codes are
        // driving exclusions on this workbook.
        var excludedByWac = runResult.Entries
            .Where(e => e.TransformStatus == SalesQualificationDecisionStatus.Excluded)
            .GroupBy(e => e.WacCode ?? "<null>")
            .Select(g => new { wacCd = g.Key, count = g.Count() })
            .OrderByDescending(x => x.count)
            .Take(10)
            .ToArray();
        var inconclusiveByWac = runResult.Entries
            .Where(e => e.TransformStatus is SalesQualificationDecisionStatus.Deferred
                                          or SalesQualificationDecisionStatus.Unknown
                                          or SalesQualificationDecisionStatus.MissingCode)
            .GroupBy(e => e.WacCode ?? "<null>")
            .Select(g => new { wacCd = g.Key, count = g.Count() })
            .OrderByDescending(x => x.count)
            .Take(10)
            .ToArray();

        var payload = new
        {
            slice = "C37-C",
            kind = "live-pacs-proof",
            generatedAtUtc = stamp,
            countyId = args.CountyId,
            sourceWorkbookId = args.WorkbookId,
            sourceConnectionId = args.SourceConnectionId,
            maxSales = args.MaxSales,
            operatorId = args.OperatorId,
            run = new
            {
                rowsRead = runResult.RowsRead,
                qualified = runResult.QualifiedCount,
                excluded = runResult.ExcludedCount,
                inconclusive = runResult.InconclusiveCount,
                skippedNoIdentifier = runResult.SkippedNoIdentifierCount,
                rowsPersisted = runResult.RowsPersisted,
            },
            compPool = new
            {
                size = compPool.Count,
                samplePinned = compSample,
            },
            reconciliation = new
            {
                rowsReadEqualsSumOfBuckets = sumOk,
                compPoolEqualsQualified = poolOk,
                pass = reconcileOk,
            },
            wacCdContainment = new
            {
                excludedTopWacCodes = excludedByWac,
                inconclusiveTopWacCodes = inconclusiveByWac,
                excludedSample = excludedSample,
                inconclusiveSample = inconclusiveSample,
            },
        };

        var jsonOpts = new JsonSerializerOptions
        {
            WriteIndented = true,
            Encoder = System.Text.Encodings.Web.JavaScriptEncoder.UnsafeRelaxedJsonEscaping,
        };
        var jsonText = JsonSerializer.Serialize(payload, jsonOpts);
        await File.WriteAllTextAsync(jsonPath, jsonText, ct);
        await File.WriteAllTextAsync(latestJson, jsonText, ct);

        var md = new StringBuilder();
        md.AppendLine("# C37-C Live-PACS Comp-Eligibility Proof");
        md.AppendLine();
        md.AppendLine($"- **Generated (UTC):** {stamp}");
        md.AppendLine($"- **County:** `{args.CountyId}`");
        md.AppendLine($"- **Source workbook:** `{args.WorkbookId}`");
        md.AppendLine($"- **Source connection:** `{args.SourceConnectionId}`");
        md.AppendLine($"- **Max sales (TOP-N):** {args.MaxSales:N0}");
        md.AppendLine($"- **Operator stamp:** `{args.OperatorId}`");
        md.AppendLine();
        md.AppendLine("## C36 run counts");
        md.AppendLine();
        md.AppendLine($"- Rows read:           {runResult.RowsRead,8:N0}");
        md.AppendLine($"- Qualified:           {runResult.QualifiedCount,8:N0}");
        md.AppendLine($"- Excluded:            {runResult.ExcludedCount,8:N0}");
        md.AppendLine($"- Inconclusive:        {runResult.InconclusiveCount,8:N0}");
        md.AppendLine($"- SkippedNoIdentifier: {runResult.SkippedNoIdentifierCount,8:N0}");
        md.AppendLine($"- Rows persisted:      {runResult.RowsPersisted,8:N0}");
        md.AppendLine();
        md.AppendLine("## C37 comp pool (workbook-pinned)");
        md.AppendLine();
        md.AppendLine($"- Comp pool size: **{compPool.Count:N0}**");
        md.AppendLine();
        md.AppendLine("## Reconciliation (C37-A rule)");
        md.AppendLine();
        md.AppendLine($"- `RowsRead = Qualified + Excluded + Inconclusive + SkippedNoIdentifier`");
        md.AppendLine($"  → `{runResult.RowsRead} = {runResult.QualifiedCount} + {runResult.ExcludedCount} + {runResult.InconclusiveCount} + {runResult.SkippedNoIdentifierCount}` → **{(sumOk ? "PASS" : "FAIL")}**");
        md.AppendLine($"- `CompPoolSize = Qualified` → `{compPool.Count} = {runResult.QualifiedCount}` → **{(poolOk ? "PASS" : "FAIL")}**");
        md.AppendLine();
        md.AppendLine("## WacCd-bug containment");
        md.AppendLine();
        md.AppendLine("### Top wac_cd values driving exclusions");
        md.AppendLine();
        if (excludedByWac.Length == 0)
        {
            md.AppendLine("_(none)_");
        }
        else
        {
            md.AppendLine("| wac_cd | excluded count |");
            md.AppendLine("|--------|----------------|");
            foreach (var x in excludedByWac)
            {
                md.AppendLine($"| `{x.wacCd}` | {x.count:N0} |");
            }
        }
        md.AppendLine();
        md.AppendLine("### Top wac_cd values driving inconclusives");
        md.AppendLine();
        if (inconclusiveByWac.Length == 0)
        {
            md.AppendLine("_(none)_");
        }
        else
        {
            md.AppendLine("| wac_cd | inconclusive count |");
            md.AppendLine("|--------|--------------------|");
            foreach (var x in inconclusiveByWac)
            {
                md.AppendLine($"| `{x.wacCd}` | {x.count:N0} |");
            }
        }
        md.AppendLine();
        md.AppendLine($"All Excluded / Inconclusive rows have `In comp pool = no` by C37 filter construction. " +
                      $"Only the {runResult.QualifiedCount:N0} Qualified rows entered the comp pool. " +
                      $"**WacCd-bug containment: enforced mechanically against live PACS.**");

        var mdText = md.ToString();
        await File.WriteAllTextAsync(mdPath, mdText, ct);
        await File.WriteAllTextAsync(latestMd, mdText, ct);

        // ── Console summary.
        Console.WriteLine();
        Console.WriteLine("─────────────────────────────────────────────");
        Console.WriteLine("  C37-C Live-PACS Comp-Eligibility Proof");
        Console.WriteLine($"  Workbook:            {args.WorkbookId}");
        Console.WriteLine($"  Rows read:           {runResult.RowsRead,7:N0}");
        Console.WriteLine($"  Qualified:           {runResult.QualifiedCount,7:N0}");
        Console.WriteLine($"  Excluded:            {runResult.ExcludedCount,7:N0}");
        Console.WriteLine($"  Inconclusive:        {runResult.InconclusiveCount,7:N0}");
        Console.WriteLine($"  SkippedNoIdentifier: {runResult.SkippedNoIdentifierCount,7:N0}");
        Console.WriteLine($"  Comp pool size:      {compPool.Count,7:N0}");
        Console.WriteLine($"  Reconciliation:      {(reconcileOk ? "PASS" : "FAIL")}");
        Console.WriteLine("─────────────────────────────────────────────");
        Console.WriteLine($"  Evidence: {jsonPath}");
        Console.WriteLine($"            {mdPath}");
        Console.WriteLine();

        if (!reconcileOk)
        {
            await Console.Error.WriteLineAsync(
                $"sales-comp-proof: reconciliation FAILED. " +
                $"sumOk={sumOk}, poolOk={poolOk}. Evidence written for audit.");
            return 4;
        }

        return 0;
    }

    /// <summary>
    /// Resolve the canonical evidence directory. Walks up from the
    /// process working directory then the binary directory, looking
    /// for <c>os-platform/core/pilot/evidence</c>. Falls back to a
    /// process-temp directory when run outside the repo.
    /// </summary>
    private static string LocateEvidenceDir()
    {
        foreach (var start in new[] { Environment.CurrentDirectory, AppContext.BaseDirectory })
        {
            var dir = new DirectoryInfo(start);
            for (var i = 0; i < 12 && dir is not null; i++, dir = dir.Parent)
            {
                var candidate = Path.Combine(dir.FullName, "os-platform", "core", "pilot", "evidence");
                if (Directory.Exists(candidate))
                {
                    return candidate;
                }
            }
        }
        return Path.Combine(Path.GetTempPath(), "c37-evidence");
    }
}
