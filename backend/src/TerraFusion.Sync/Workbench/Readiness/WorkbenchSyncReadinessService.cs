using System;
using System.IO;
using System.Linq;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using TerraFusion.Abstractions.DTOs.Workbench;
using TerraFusion.Abstractions.Interfaces.Workbench;

namespace TerraFusion.Sync.Workbench.Readiness;

/// <summary>
/// Slice OPS-1-A: file-system-backed implementation of
/// <see cref="IWorkbenchSyncReadinessService"/>. Reads the four
/// SyncAtlas captured-artifact families plus the four committed
/// Benton baselines as fallback, sanitizes the contents, and
/// produces a <see cref="SyncReadinessDto"/>.
///
/// <para>The service knows the artifact-directory layout pinned by
/// the BENTON-SYNC-* track:</para>
/// <list type="bullet">
/// <item>schema-catalog health: <c>backend/artifacts/sync-atlas/benton-sync-3/&lt;RUN_ID&gt;/schema-catalog-health.stdout.txt</c></item>
/// <item>invariant artifact:    <c>backend/artifacts/sync-atlas/benton-sync-5/&lt;RUN_ID&gt;/invariant-report.json</c></item>
/// <item>preflight evidence:    <c>backend/artifacts/sync-atlas/benton-sync-6-c/&lt;RUN_ID&gt;/preflight-evidence.json</c></item>
/// <item>coverage report:       <c>backend/artifacts/sync-atlas/benton-sync-7-c/&lt;RUN_ID&gt;/coverage-report.json</c></item>
/// </list>
///
/// <para>The constructor takes the artifact root path so unit tests
/// can supply a temp directory rather than the production layout.</para>
/// </summary>
public sealed class WorkbenchSyncReadinessService : IWorkbenchSyncReadinessService
{
    private readonly string _artifactRoot;

    public WorkbenchSyncReadinessService(string artifactRoot)
    {
        if (string.IsNullOrWhiteSpace(artifactRoot))
            throw new ArgumentException("Artifact root must be non-empty.", nameof(artifactRoot));
        _artifactRoot = artifactRoot;
    }

    public async Task<SyncReadinessDto> BuildAsync(
        Guid countyId,
        Guid sourceConnectionId,
        Guid? workbookId,
        CancellationToken ct)
    {
        var dto = new SyncReadinessDto
        {
            CountyId = countyId,
            SourceConnectionId = sourceConnectionId,
            WorkbookId = workbookId,
            AssembledAtUtc = DateTime.UtcNow,
        };

        // Question 1 — reachability. The read service does not own
        // the connection probe (that requires secret env access);
        // panel renders UNKNOWN here. A future OPS-1-A-2 slice may
        // wire a probe through the refresh path.
        dto.Reachability = new SyncReadinessPanelDto
        {
            Status = SyncReadinessStatus.Unknown,
            Headline = "Reachability probe not run",
            Detail = "Click Refresh to probe the PACS connection.",
            Source = "pacs-connection-probe",
        };

        // Question 2 — schema catalog health.
        dto.CatalogHealth = await BuildCatalogHealthPanelAsync(ct).ConfigureAwait(false);

        // Question 3 — invariants.
        dto.Invariants = await BuildInvariantsPanelAsync(ct).ConfigureAwait(false);

        // Question 4 — preflights.
        dto.Preflights = await BuildPreflightsPanelAsync(countyId, sourceConnectionId, ct)
            .ConfigureAwait(false);

        // Question 5 — coverage.
        dto.Coverage = await BuildCoveragePanelAsync(countyId, sourceConnectionId, ct)
            .ConfigureAwait(false);

        // Question 6 — last successful proof per surface.
        dto.LastProof = new SyncReadinessLastProofDto
        {
            CatalogHealth     = dto.CatalogHealth.CapturedAtUtc?.ToString("O") ?? "never",
            InvariantArtifact = dto.Invariants.CapturedAtUtc?.ToString("O")    ?? "never",
            PreflightEvidence = dto.Preflights.CapturedAtUtc?.ToString("O")    ?? "never",
            CoverageReport    = dto.Coverage.CapturedAtUtc?.ToString("O")      ?? "never",
        };

        return dto;
    }

    // ── Panel builders ───────────────────────────────────────────────

    private Task<SyncReadinessPanelDto> BuildCatalogHealthPanelAsync(CancellationToken ct)
    {
        var dir = Path.Combine(_artifactRoot, "benton-sync-3");
        var latest = FindLatestRunDir(dir);
        if (latest is null)
        {
            return Task.FromResult(UnknownPanel(
                "schema-catalog-health",
                "No catalog health capture available."));
        }

        var stdoutPath = Path.Combine(latest, "schema-catalog-health.stdout.txt");
        if (!File.Exists(stdoutPath))
        {
            return Task.FromResult(UnknownPanel(
                "schema-catalog-health",
                "Latest run missing schema-catalog-health.stdout.txt."));
        }

        var text = File.ReadAllText(stdoutPath);
        // Sanitize: never echo raw stdout into the DTO. Extract the
        // structured fields the OPS-1 policy specifies.
        var isClean = text.Contains("IsClean                       : true", StringComparison.Ordinal);
        var hasErrors = text.Contains("Errors                        : 0", StringComparison.Ordinal) == false
            && text.Contains("Errors", StringComparison.Ordinal);
        var warningsZero = text.Contains("Warnings                      : 0", StringComparison.Ordinal);

        var status = hasErrors ? SyncReadinessStatus.No
            : (isClean && warningsZero) ? SyncReadinessStatus.Yes
            : isClean ? SyncReadinessStatus.Warn
            : SyncReadinessStatus.Unknown;

        return Task.FromResult(new SyncReadinessPanelDto
        {
            Status = status,
            Headline = isClean ? "Schema catalog clean" : "Schema catalog needs review",
            Detail = ExtractCoverageLine(text),
            CapturedAtUtc = TryParseRunIdFromDir(latest),
            Source = "schema-catalog-health",
        });
    }

    private async Task<SyncReadinessPanelDto> BuildInvariantsPanelAsync(CancellationToken ct)
    {
        var dir = Path.Combine(_artifactRoot, "benton-sync-5");
        var latest = FindLatestRunDir(dir);
        if (latest is null)
        {
            return UnknownPanel(
                "invariant-artifact",
                "No invariant artifact capture available.");
        }

        var path = Path.Combine(latest, "invariant-report.json");
        if (!File.Exists(path))
        {
            return UnknownPanel(
                "invariant-artifact",
                "Latest run missing invariant-report.json.");
        }

        try
        {
            await using var fs = File.OpenRead(path);
            using var doc = await JsonDocument.ParseAsync(fs, cancellationToken: ct).ConfigureAwait(false);
            var root = doc.RootElement;
            var errors    = TryGetInt(root, "errorCount") ?? 0;
            var warnings  = TryGetInt(root, "warningCount") ?? 0;
            var isClean   = TryGetBool(root, "isClean") ?? false;

            var status = errors > 0 ? SyncReadinessStatus.No
                : warnings > 0 ? SyncReadinessStatus.Warn
                : isClean ? SyncReadinessStatus.Yes
                : SyncReadinessStatus.Unknown;

            return new SyncReadinessPanelDto
            {
                Status = status,
                Headline = $"{errors} errors, {warnings} warnings",
                Detail = isClean
                    ? "Invariant engine accepted the catalog build."
                    : "Invariant engine flagged the catalog build.",
                CapturedAtUtc = TryParseRunIdFromDir(latest),
                Source = "invariant-artifact",
            };
        }
        catch (JsonException)
        {
            return UnknownPanel(
                "invariant-artifact",
                "Latest invariant-report.json could not be parsed.");
        }
    }

    private async Task<SyncReadinessPanelDto> BuildPreflightsPanelAsync(
        Guid countyId,
        Guid sourceConnectionId,
        CancellationToken ct)
    {
        var dir = Path.Combine(_artifactRoot, "benton-sync-6-c");
        var latest = FindLatestRunDir(dir);
        if (latest is null)
        {
            return UnknownPanel(
                "preflight-evidence",
                "No preflight evidence capture available.");
        }

        var path = Path.Combine(latest, "preflight-evidence.json");
        if (!File.Exists(path))
        {
            return UnknownPanel(
                "preflight-evidence",
                "Latest run missing preflight-evidence.json.");
        }

        try
        {
            await using var fs = File.OpenRead(path);
            using var doc = await JsonDocument.ParseAsync(fs, cancellationToken: ct).ConfigureAwait(false);
            var root = doc.RootElement;

            // County-scope match check (defensive — captured artifact
            // already carries the envelope).
            if (TryGetGuid(root, "countyId") is { } artifactCounty
                && artifactCounty != countyId)
            {
                return UnknownPanel(
                    "preflight-evidence",
                    "Latest preflight-evidence.json belongs to a different county.");
            }

            var summary = root.TryGetProperty("summary", out var s) ? s : default;
            var fkFail   = TryGetInt(summary, "fkFailCount") ?? 0;
            var eraFail  = TryGetInt(summary, "eraFailCount") ?? 0;
            var piiFail  = TryGetInt(summary, "piiFailCount") ?? 0;
            var fkWarn   = TryGetInt(summary, "fkWarnCount") ?? 0;
            var eraWarn  = TryGetInt(summary, "eraWarnCount") ?? 0;
            var piiWarn  = TryGetInt(summary, "piiWarnCount") ?? 0;
            var calls    = TryGetInt(summary, "loaderCallCount") ?? 0;

            var totalFail = fkFail + eraFail + piiFail;
            var totalWarn = fkWarn + eraWarn + piiWarn;
            var status = totalFail > 0 ? SyncReadinessStatus.No
                : totalWarn > 0 ? SyncReadinessStatus.Warn
                : calls > 0 ? SyncReadinessStatus.Yes
                : SyncReadinessStatus.Unknown;

            return new SyncReadinessPanelDto
            {
                Status = status,
                Headline = $"{calls} loader call(s), {totalFail} fail, {totalWarn} warn",
                Detail = totalFail > 0
                    ? "FK/era/PII preflight failed — operator action required."
                    : totalWarn > 0
                        ? "FK/era/PII preflight emitted warnings (advisory)."
                        : "All preflights passed.",
                CapturedAtUtc = TryParseRunIdFromDir(latest),
                Source = "preflight-evidence",
            };
        }
        catch (JsonException)
        {
            return UnknownPanel(
                "preflight-evidence",
                "Latest preflight-evidence.json could not be parsed.");
        }
    }

    private async Task<SyncReadinessPanelDto> BuildCoveragePanelAsync(
        Guid countyId,
        Guid sourceConnectionId,
        CancellationToken ct)
    {
        var dir = Path.Combine(_artifactRoot, "benton-sync-7-c");
        var latest = FindLatestCoverageRun(dir);
        if (latest is null)
        {
            return UnknownPanel(
                "coverage-report",
                "No coverage report capture available.");
        }

        var path = Path.Combine(latest, "coverage-report.json");
        if (!File.Exists(path))
        {
            return UnknownPanel(
                "coverage-report",
                "Latest run missing coverage-report.json.");
        }

        try
        {
            await using var fs = File.OpenRead(path);
            using var doc = await JsonDocument.ParseAsync(fs, cancellationToken: ct).ConfigureAwait(false);
            var root = doc.RootElement;

            if (TryGetGuid(root, "countyId") is { } artifactCounty
                && artifactCounty != countyId)
            {
                return UnknownPanel(
                    "coverage-report",
                    "Latest coverage-report.json belongs to a different county.");
            }

            var forwardCount = root.TryGetProperty("forwardCoverageGap", out var fwd)
                ? TryGetInt(fwd, "count") ?? 0 : 0;
            var driftCount = root.TryGetProperty("decisionDrift", out var drift)
                ? TryGetInt(drift, "count") ?? 0 : 0;
            var backwardCount = root.TryGetProperty("backwardTraceabilityGap", out var bwd)
                ? TryGetInt(bwd, "count") ?? 0 : 0;
            var backwardConclusive = root.TryGetProperty("backwardTraceabilityGap", out var bwd2)
                && TryGetBool(bwd2, "isConclusive") == true;
            var isClean = root.TryGetProperty("verdict", out var v)
                && TryGetBool(v, "isClean") == true;

            var status = (forwardCount > 0 || driftCount > 0)
                ? SyncReadinessStatus.No
                : isClean
                    ? SyncReadinessStatus.Yes
                    : (!backwardConclusive && backwardCount == 0)
                        ? SyncReadinessStatus.Warn
                        : SyncReadinessStatus.Unknown;

            return new SyncReadinessPanelDto
            {
                Status = status,
                Headline = isClean
                    ? "Canonical landing in sync"
                    : $"Forward gap {forwardCount}, drift {driftCount}",
                Detail = $"Backward gap {backwardCount}{(backwardConclusive ? "" : " (inconclusive)")}",
                CapturedAtUtc = TryParseRunIdFromDir(latest),
                Source = "coverage-report",
            };
        }
        catch (JsonException)
        {
            return UnknownPanel(
                "coverage-report",
                "Latest coverage-report.json could not be parsed.");
        }
    }

    // ── Helpers ──────────────────────────────────────────────────────

    private static SyncReadinessPanelDto UnknownPanel(string source, string detail) =>
        new()
        {
            Status = SyncReadinessStatus.Unknown,
            Headline = "No capture yet",
            Detail = detail,
            Source = source,
        };

    private static string? FindLatestRunDir(string parent)
    {
        if (!Directory.Exists(parent)) return null;
        return Directory.EnumerateDirectories(parent)
            .OrderByDescending(d => Path.GetFileName(d), StringComparer.Ordinal)
            .FirstOrDefault();
    }

    private static string? FindLatestCoverageRun(string parent)
    {
        // Coverage track has the OLTP run nested under <RUN_ID>/oltp-run/;
        // prefer that when present, fall back to the top-level dir.
        var top = FindLatestRunDir(parent);
        if (top is null) return null;
        var oltp = Path.Combine(top, "oltp-run");
        if (Directory.Exists(oltp) && File.Exists(Path.Combine(oltp, "coverage-report.json")))
            return oltp;
        return top;
    }

    private static DateTime? TryParseRunIdFromDir(string runDir)
    {
        var name = Path.GetFileName(runDir);
        // Run IDs are formatted "yyyyMMddTHHmmssZ".
        if (DateTime.TryParseExact(
            name,
            "yyyyMMddTHHmmssZ",
            System.Globalization.CultureInfo.InvariantCulture,
            System.Globalization.DateTimeStyles.AssumeUniversal | System.Globalization.DateTimeStyles.AdjustToUniversal,
            out var when))
            return when;
        return null;
    }

    private static int? TryGetInt(JsonElement root, string property)
    {
        if (root.ValueKind == JsonValueKind.Undefined) return null;
        if (!root.TryGetProperty(property, out var v)) return null;
        if (v.ValueKind == JsonValueKind.Number && v.TryGetInt32(out var n)) return n;
        return null;
    }

    private static bool? TryGetBool(JsonElement root, string property)
    {
        if (root.ValueKind == JsonValueKind.Undefined) return null;
        if (!root.TryGetProperty(property, out var v)) return null;
        if (v.ValueKind == JsonValueKind.True) return true;
        if (v.ValueKind == JsonValueKind.False) return false;
        return null;
    }

    private static Guid? TryGetGuid(JsonElement root, string property)
    {
        if (!root.TryGetProperty(property, out var v)) return null;
        if (v.ValueKind == JsonValueKind.String && Guid.TryParse(v.GetString(), out var g)) return g;
        return null;
    }

    private static string? ExtractCoverageLine(string text)
    {
        // Pulls "Coverage  : N tables, M columns, K dictionaries" if present.
        foreach (var line in text.Split('\n'))
        {
            var t = line.Trim();
            if (t.StartsWith("Coverage", StringComparison.Ordinal))
                return t;
        }
        return null;
    }
}
