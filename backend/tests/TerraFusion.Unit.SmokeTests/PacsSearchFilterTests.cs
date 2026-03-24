// =============================================================================
// Phase 33.1 — PACS geo_id Filter Correctness
// =============================================================================
// Contract: GET /api/pacs/properties?geo_id=<legacy_text> must
//   1. bind the value as an exact text string (no parse, no strip, no normalize)
//   2. route to GetPropertyByGeoIdAsync — which issues WHERE geo_id = @GeoId
//   3. return totalCount that reflects the filtered result (1 or 0), not 112,057
//
// geo_id is a legacy ProVal/Ascend text identifier.
//   - Do NOT parse as int.
//   - Do NOT strip leading zeroes.
//   - Do NOT apply "smart" parcel-number normalization.
//   - Bind as raw string to the legacy geo_id column.
//
// Bug baseline (7f0ed9b00): ?search= is applied as in-memory post-filter
//   on a paginated pull, so TotalCount is always the unfiltered 112K.
// =============================================================================

using System.IO;
using System.Text.RegularExpressions;
using Xunit;

namespace TerraFusion.Unit.SmokeTests;

/// <summary>
/// Contract tests for PACS geo_id filter correctness (Phase 33.1).
/// </summary>
[Trait("Category", "Phase33.1")]
[Trait("Surface", "PacsController")]
[Trait("Bug", "GeoIdFilterWiring")]
public sealed class PacsSearchFilterTests
{
    private static readonly string RepoRoot = FindRepoRoot();
    private static readonly string ControllerPath = Path.Combine(
        RepoRoot, "backend", "src", "TerraFusion.API", "Controllers", "PacsController.cs");

    private static string FindRepoRoot()
    {
        var dir = Directory.GetCurrentDirectory();
        while (dir != null)
        {
            if (Directory.Exists(Path.Combine(dir, "docs", "spec-lock", "locks")))
                return dir;
            dir = Directory.GetParent(dir)?.FullName;
        }
        return Path.GetFullPath(
            Path.Combine(Directory.GetCurrentDirectory(), "..", "..", "..", "..", "..", ".."));
    }

    private static string ControllerSource()
    {
        Assert.True(File.Exists(ControllerPath),
            $"PacsController.cs not found at {ControllerPath}");
        return File.ReadAllText(ControllerPath);
    }

    // ── Contract 1: dedicated geo_id query parameter ─────────────────────

    [Fact]
    public void Controller_ExposesGeoId_AsFirstClassQueryParameter()
    {
        // The endpoint must accept ?geo_id=<text> as a dedicated parameter,
        // not require callers to encode it inside a generic ?search= string.
        // This ensures the legacy text field is never coerced or normalized.
        var src = ControllerSource();
        var hasDedicatedParam =
            Regex.IsMatch(src, @"\[FromQuery\]\s+string\??\s+geoId\b") ||
            Regex.IsMatch(src, @"\[FromQuery\]\s+string\??\s+geo_id\b") ||
            Regex.IsMatch(src, @"FromQuery.*geo.?id", RegexOptions.IgnoreCase);
        Assert.True(hasDedicatedParam,
            "PacsController.GetProperties must expose ?geo_id= as a dedicated " +
            "[FromQuery] string parameter. " +
            "A geo_id is a legacy ProVal/Ascend text identifier — it must NOT be " +
            "routed through a generic ?search= parameter that may apply normalization.");
    }

    // ── Contract 2: routes to GetPropertyByGeoIdAsync ────────────────────

    [Fact]
    public void Controller_GeoIdParam_RoutesToAdapterLookup()
    {
        // When ?geo_id= is provided, the controller must call
        // GetPropertyByGeoIdAsync, which issues WHERE geo_id = @GeoId.
        // It must NOT call GetPropertiesAsync and filter in memory.
        var src = ControllerSource();
        Assert.True(
            src.Contains("GetPropertyByGeoIdAsync"),
            "PacsController.GetProperties must call GetPropertyByGeoIdAsync " +
            "when ?geo_id= is provided. " +
            "Routing through GetPropertiesAsync + in-memory filter returns " +
            "the wrong TotalCount (unfiltered 112,057).");
    }

    // ── Contract 3: TotalCount is filtered count, not raw adapter count ───

    [Fact]
    public void Controller_GeoIdResult_HasCorrectTotalCount()
    {
        // After routing to GetPropertyByGeoIdAsync, TotalCount must be
        // 1 (found) or 0 (not found) — not result.TotalCount from the
        // unfiltered paginated query.
        var src = ControllerSource();
        var hasFilteredCount =
            Regex.IsMatch(src, @"TotalCount\s*=\s*1\b") ||
            Regex.IsMatch(src, @"TotalCount\s*=\s*mapped\.Count\b") ||
            Regex.IsMatch(src, @"TotalCount\s*=\s*\(\s*\w+\s*(?:==|is)\s*null\s*\?\s*0\s*:\s*1\s*\)") ||
            Regex.IsMatch(src, @"TotalCount\s*=\s*items\.Count\b") ||
            // pattern: ternary on null check for single-item result
            Regex.IsMatch(src, @"prop\s*(?:is|==)\s*null.*TotalCount|TotalCount.*prop\s*(?:is|==)\s*null");
        Assert.True(hasFilteredCount,
            "When ?geo_id= is provided, TotalCount must reflect the filtered " +
            "result (0 or 1), not the raw adapter page TotalCount. " +
            "Fix: after GetPropertyByGeoIdAsync, set TotalCount = mapped.Count " +
            "or TotalCount = (prop is null ? 0 : 1).");
    }

    // ── Contract 4: no numeric coercion of geo_id ─────────────────────────

    [Fact]
    public void Controller_GeoId_IsNotParsedAsNumeric()
    {
        // geo_id must be bound as a raw string. The controller must not attempt
        // int.TryParse, long.TryParse, or numeric coercion on the geo_id value.
        // Leading zeroes and non-numeric geo_ids exist in Benton PACS data.
        var src = ControllerSource();

        // Find the geo_id handling section (between GetPropertyByGeoIdAsync and the else branch)
        // and assert no TryParse appears adjacent to geoId variable.
        var coercesNumeric =
            Regex.IsMatch(src, @"int\.TryParse\s*\(\s*geoId\b") ||
            Regex.IsMatch(src, @"long\.TryParse\s*\(\s*geoId\b") ||
            Regex.IsMatch(src, @"Convert\.ToInt\w*\s*\(\s*geoId\b") ||
            Regex.IsMatch(src, @"int\.Parse\s*\(\s*geoId\b");
        Assert.False(coercesNumeric,
            "PacsController must not parse geoId as numeric. " +
            "geo_id is a legacy text identifier — leading zeroes must be preserved. " +
            "Bind it directly as a string to GetPropertyByGeoIdAsync.");
    }
}
