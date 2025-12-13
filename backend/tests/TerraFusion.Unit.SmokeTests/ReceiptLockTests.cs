using System.Text.Json;
using System.Text.Json.Nodes;
using Xunit;

namespace TerraFusion.Unit.SmokeTests;

/// <summary>
/// ReceiptLock v1.0.0 Spec Enforcement Tests
///
/// Purpose: Citizen/auditor-verifiable receipts for government artifacts.
/// These tests enforce the spec contract - they MUST pass before any implementation.
/// </summary>
public sealed class ReceiptLockTests
{
    private const string SchemaPath = "docs/spec-lock/locks/receipt/receipt.v1/generated/receipt.schema.json";
    private const string SpecPath = "docs/spec-lock/locks/receipt/receipt.v1/speclock.spec.json";
    private const string SpecLockPath = "docs/spec-lock/locks/receipt/receipt.v1/SPEC_LOCK_v1.0.0.md";

    private static readonly string RepoRoot = FindRepoRoot();

    private static string FindRepoRoot()
    {
        var dir = Directory.GetCurrentDirectory();
        while (dir != null)
        {
            // Look for docs/spec-lock folder which is at repo root
            if (Directory.Exists(Path.Combine(dir, "docs", "spec-lock", "locks")))
            {
                return dir;
            }
            dir = Directory.GetParent(dir)?.FullName;
        }
        // Fallback: assume we're 6 levels deep from repo root (backend/tests/TerraFusion.Unit.SmokeTests/bin/Debug/net8.0)
        return Path.GetFullPath(Path.Combine(Directory.GetCurrentDirectory(), "..", "..", "..", "..", "..", ".."));
    }

    [Fact]
    public void SpecLock_File_Exists()
    {
        var path = Path.Combine(RepoRoot, SpecLockPath);
        Assert.True(File.Exists(path), $"SPEC_LOCK file missing: {path}");
    }

    [Fact]
    public void SpecData_File_Exists()
    {
        var path = Path.Combine(RepoRoot, SpecPath);
        Assert.True(File.Exists(path), $"speclock.spec.json missing: {path}");
    }

    [Fact]
    public void GeneratedSchema_File_Exists()
    {
        var path = Path.Combine(RepoRoot, SchemaPath);
        Assert.True(File.Exists(path), $"Generated schema missing: {path}");
    }

    [Fact]
    public void GeneratedSchema_Is_ValidJson()
    {
        var path = Path.Combine(RepoRoot, SchemaPath);
        if (!File.Exists(path)) return; // Skip if file doesn't exist (covered by other test)

        var json = File.ReadAllText(path);
        var doc = JsonDocument.Parse(json);

        // Verify it's a JSON Schema
        Assert.True(doc.RootElement.TryGetProperty("$schema", out _), "Missing $schema property");
        Assert.True(doc.RootElement.TryGetProperty("type", out _), "Missing type property");
        Assert.True(doc.RootElement.TryGetProperty("required", out _), "Missing required property");
    }

    [Fact]
    public void SpecData_Has_RequiredFields()
    {
        var path = Path.Combine(RepoRoot, SpecPath);
        if (!File.Exists(path)) return;

        var json = File.ReadAllText(path);
        var spec = JsonNode.Parse(json)!;

        Assert.NotNull(spec["lock_id"]);
        Assert.NotNull(spec["surface"]);
        Assert.NotNull(spec["version"]);
        Assert.NotNull(spec["artifact_types"]);
        Assert.NotNull(spec["signing_modes"]);
        Assert.NotNull(spec["generated_artifacts"]);
    }

    [Fact]
    public void SpecData_ArtifactTypes_Match_Schema()
    {
        var specPath = Path.Combine(RepoRoot, SpecPath);
        var schemaPath = Path.Combine(RepoRoot, SchemaPath);
        if (!File.Exists(specPath) || !File.Exists(schemaPath)) return;

        var spec = JsonNode.Parse(File.ReadAllText(specPath))!;
        var schema = JsonNode.Parse(File.ReadAllText(schemaPath))!;

        var specTypes = spec["artifact_types"]!.AsArray().Select(x => x!.GetValue<string>()).ToHashSet();
        var schemaTypes = schema["properties"]!["artifact"]!["properties"]!["type"]!["enum"]!
            .AsArray().Select(x => x!.GetValue<string>()).ToHashSet();

        Assert.True(specTypes.SetEquals(schemaTypes),
            $"Artifact types mismatch.\nSpec: {string.Join(", ", specTypes)}\nSchema: {string.Join(", ", schemaTypes)}");
    }

    [Fact]
    public void SpecData_SigningModes_Match_Schema()
    {
        var specPath = Path.Combine(RepoRoot, SpecPath);
        var schemaPath = Path.Combine(RepoRoot, SchemaPath);
        if (!File.Exists(specPath) || !File.Exists(schemaPath)) return;

        var spec = JsonNode.Parse(File.ReadAllText(specPath))!;
        var schema = JsonNode.Parse(File.ReadAllText(schemaPath))!;

        var specModes = spec["signing_modes"]!.AsArray().Select(x => x!.GetValue<string>()).ToHashSet();
        var schemaModes = schema["properties"]!["signing"]!["properties"]!["mode"]!["enum"]!
            .AsArray().Select(x => x!.GetValue<string>()).ToHashSet();

        Assert.True(specModes.SetEquals(schemaModes),
            $"Signing modes mismatch.\nSpec: {string.Join(", ", specModes)}\nSchema: {string.Join(", ", schemaModes)}");
    }

    [Fact]
    public void Deterministic_Serialization_Is_Stable()
    {
        // Canonical JSON: sorted keys produces stable hash
        var receipt = new SortedDictionary<string, object?>
        {
            ["artifact"] = new SortedDictionary<string, object?>
            {
                ["sha256"] = "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
                ["type"] = "report"
            },
            ["exp"] = "2026-01-01T00:00:00Z",
            ["issued_at"] = "2025-12-12T00:00:00Z",
            ["nbf"] = "2025-12-12T00:00:00Z",
            ["proof_url"] = "/ops/speclock/verify/receipt/r1",
            ["receipt_id"] = "r1",
            ["signing"] = new SortedDictionary<string, object?>
            {
                ["mode"] = "mythic_cosign",
                ["signature_sha256"] = "cc00000000000000000000000000000000000000000000000000000000000000"
            },
            ["speclock_manifest_sha256"] = "aa00000000000000000000000000000000000000000000000000000000000000"
        };

        var json1 = JsonSerializer.Serialize(receipt, new JsonSerializerOptions { WriteIndented = false });
        var json2 = JsonSerializer.Serialize(receipt, new JsonSerializerOptions { WriteIndented = false });

        Assert.Equal(json1, json2);
        Assert.Contains("\"receipt_id\":\"r1\"", json1);
        Assert.Contains("\"exp\":\"2026-01-01T00:00:00Z\"", json1);
    }

    [Fact]
    public void Schema_Sha256_Pattern_Enforces_Lowercase()
    {
        var schemaPath = Path.Combine(RepoRoot, SchemaPath);
        if (!File.Exists(schemaPath)) return;

        var schema = JsonNode.Parse(File.ReadAllText(schemaPath))!;
        var sha256Pattern = schema["properties"]!["speclock_manifest_sha256"]!["pattern"]!.GetValue<string>();

        // Pattern should only allow lowercase hex
        Assert.Equal("^[a-f0-9]{64}$", sha256Pattern);
    }

    [Fact]
    public void Schema_Timestamp_Pattern_Enforces_UTC()
    {
        var schemaPath = Path.Combine(RepoRoot, SchemaPath);
        if (!File.Exists(schemaPath)) return;

        var schema = JsonNode.Parse(File.ReadAllText(schemaPath))!;
        var nbfPattern = schema["properties"]!["nbf"]!["pattern"]!.GetValue<string>();

        // Pattern should enforce UTC 'Z' suffix
        Assert.Contains("Z$", nbfPattern);
    }
}
