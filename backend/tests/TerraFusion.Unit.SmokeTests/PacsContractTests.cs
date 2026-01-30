// =============================================================================
// PACS Contract SpecLock Tests - pacscontract.v1
// =============================================================================
// Tests for TerraFusion PACS database contract enforcement.
// Validates views, indexes, procedures, and fail-closed semantics.
// =============================================================================

using System.Text.Json;
using System.Text.Json.Nodes;
using System.Text.RegularExpressions;
using Xunit;

namespace TerraFusion.Unit.SmokeTests;

/// <summary>
/// Tests for pacscontract.v1 SpecLock.
/// Ensures PACS database contract is properly defined and enforceable.
/// </summary>
[Trait("Category", "SpecLock")]
[Trait("Surface", "pacscontract")]
[Trait("Phase", "PACS")]
public sealed class PacsContractTests
{
  private const string SpecLockPath = "docs/spec-lock/locks/pacscontract/pacscontract.v1/SPEC_LOCK_v1.0.0.md";
  private const string SpecJsonPath = "docs/spec-lock/locks/pacscontract/pacscontract.v1/speclock.spec.json";
  private const string SchemaPath = "docs/spec-lock/locks/pacscontract/pacscontract.v1/generated/pacscontract.schema.json";
  private const string OpenapiPath = "docs/spec-lock/locks/pacscontract/pacscontract.v1/generated/pacscontract.openapi.yaml";

  private static readonly string RepoRoot = FindRepoRoot();

  private static string FindRepoRoot()
  {
    var dir = Directory.GetCurrentDirectory();
    while (dir != null)
    {
      if (Directory.Exists(Path.Combine(dir, "docs", "spec-lock", "locks")))
      {
        return dir;
      }
      dir = Directory.GetParent(dir)?.FullName;
    }
    return Path.GetFullPath(Path.Combine(Directory.GetCurrentDirectory(), "..", "..", "..", "..", "..", ".."));
  }

  private static JsonNode? LoadSpec()
  {
    var path = Path.Combine(RepoRoot, SpecJsonPath);
    if (!File.Exists(path)) return null;
    var json = File.ReadAllText(path);
    return JsonNode.Parse(json);
  }

  // ═══════════════════════════════════════════════════════════════
  // 1. SPECLOCK PARSES SUCCESSFULLY
  // ═══════════════════════════════════════════════════════════════

  [Fact]
  public void SpecLock_MdFile_Exists()
  {
    var path = Path.Combine(RepoRoot, SpecLockPath);
    Assert.True(File.Exists(path), $"SPEC_LOCK_v1.0.0.md must exist at {path}");
  }

  [Fact]
  public void SpecLock_JsonFile_Exists()
  {
    var path = Path.Combine(RepoRoot, SpecJsonPath);
    Assert.True(File.Exists(path), $"speclock.spec.json must exist at {path}");
  }

  [Fact]
  public void SpecLock_JsonFile_ParsesSuccessfully()
  {
    var spec = LoadSpec();
    Assert.NotNull(spec);
    Assert.Equal("pacscontract.v1", spec!["id"]?.GetValue<string>());
  }

  [Fact]
  public void SpecLock_Version_IsSemantic()
  {
    var spec = LoadSpec();
    Assert.NotNull(spec);

    var version = spec!["version"]?.GetValue<string>();
    Assert.NotNull(version);
    Assert.Matches(@"^\d+\.\d+\.\d+$", version);
  }

  // ═══════════════════════════════════════════════════════════════
  // 2. ALL DECLARED DATABASES DEFINED
  // ═══════════════════════════════════════════════════════════════

  [Fact]
  public void Databases_AllowedList_ContainsPacsOltp()
  {
    var spec = LoadSpec();
    Assert.NotNull(spec);

    var allowed = spec!["databases"]?["allowed"]?.AsArray();
    Assert.NotNull(allowed);

    var dbNames = allowed!.Select(x => x?["name"]?.GetValue<string>()).ToList();
    Assert.Contains("pacs_oltp", dbNames);
  }

  [Fact]
  public void Databases_ForbiddenList_ExcludesTrainingDb()
  {
    var spec = LoadSpec();
    Assert.NotNull(spec);

    var forbidden = spec!["databases"]?["forbidden"]?.AsArray();
    Assert.NotNull(forbidden);

    var dbNames = forbidden!.Select(x => x?.GetValue<string>()).ToList();
    Assert.Contains("PACS_Training", dbNames);
  }

  [Fact]
  public void Databases_PacsOltp_IsRequired()
  {
    var spec = LoadSpec();
    Assert.NotNull(spec);

    var allowed = spec!["databases"]?["allowed"]?.AsArray();
    Assert.NotNull(allowed);

    var pacsOltp = allowed!.FirstOrDefault(x => x?["name"]?.GetValue<string>() == "pacs_oltp");
    Assert.NotNull(pacsOltp);
    Assert.True(pacsOltp!["required"]?.GetValue<bool>(), "pacs_oltp must be marked as required");
  }

  // ═══════════════════════════════════════════════════════════════
  // 3. ALL REQUIRED VIEWS DEFINED
  // ═══════════════════════════════════════════════════════════════

  [Fact]
  public void Views_PropertyCore_IsDeclared()
  {
    var views = GetRequiredViews("pacs_oltp");
    Assert.Contains("vw_TerraFusion_Property_Core", views);
  }

  [Fact]
  public void Views_PropertyOwnership_IsDeclared()
  {
    var views = GetRequiredViews("pacs_oltp");
    Assert.Contains("vw_TerraFusion_Property_Ownership", views);
  }

  [Fact]
  public void Views_AssessmentHistory_IsDeclared()
  {
    var views = GetRequiredViews("pacs_oltp");
    Assert.Contains("vw_TerraFusion_Assessment_History", views);
  }

  [Fact]
  public void Views_AtLeastThreeRequired()
  {
    var views = GetRequiredViews("pacs_oltp");
    Assert.True(views.Count >= 3, "At least 3 TerraFusion views must be declared");
  }

  private static List<string> GetRequiredViews(string database)
  {
    var spec = LoadSpec();
    if (spec == null) return new List<string>();

    var views = spec["required_objects"]?[database]?["views"]?.AsArray();
    if (views == null) return new List<string>();

    return views.Select(x => x?["name"]?.GetValue<string>() ?? "").ToList();
  }

  // ═══════════════════════════════════════════════════════════════
  // 4. REQUIRED COLUMNS PRESENT IN VIEWS
  // ═══════════════════════════════════════════════════════════════

  [Fact]
  public void View_PropertyCore_HasRequiredColumns()
  {
    var columns = GetRequiredColumns("pacs_oltp", "vw_TerraFusion_Property_Core");

    Assert.Contains("prop_id", columns);
    Assert.Contains("geo_id", columns);
    Assert.Contains("assessed_val", columns);
  }

  [Fact]
  public void View_PropertyOwnership_HasRequiredColumns()
  {
    var columns = GetRequiredColumns("pacs_oltp", "vw_TerraFusion_Property_Ownership");

    Assert.Contains("owner_name", columns);
    Assert.Contains("mail_addr_1", columns);
  }

  private static List<string> GetRequiredColumns(string database, string viewName)
  {
    var spec = LoadSpec();
    if (spec == null) return new List<string>();

    var views = spec["required_objects"]?[database]?["views"]?.AsArray();
    if (views == null) return new List<string>();

    var view = views.FirstOrDefault(x => x?["name"]?.GetValue<string>() == viewName);
    if (view == null) return new List<string>();

    var columns = view["required_columns"]?.AsArray();
    if (columns == null) return new List<string>();

    return columns.Select(x => x?.GetValue<string>() ?? "").ToList();
  }

  // ═══════════════════════════════════════════════════════════════
  // 5. ALL REQUIRED INDEXES DEFINED
  // ═══════════════════════════════════════════════════════════════

  [Fact]
  public void Indexes_GeoId_IsDeclared()
  {
    var indexes = GetRequiredIndexes("pacs_oltp");
    Assert.Contains("IX_TerraFusion_Property_GeoID", indexes);
  }

  [Fact]
  public void Indexes_PropertyValYear_IsDeclared()
  {
    var indexes = GetRequiredIndexes("pacs_oltp");
    Assert.Contains("IX_TerraFusion_PropertyVal_PropYear", indexes);
  }

  [Fact]
  public void Indexes_Situs_IsDeclared()
  {
    var indexes = GetRequiredIndexes("pacs_oltp");
    Assert.Contains("IX_TerraFusion_Situs_Property", indexes);
  }

  [Fact]
  public void Indexes_SeverityIsWarning()
  {
    var spec = LoadSpec();
    Assert.NotNull(spec);

    var indexes = spec!["required_objects"]?["pacs_oltp"]?["indexes"]?.AsArray();
    Assert.NotNull(indexes);

    foreach (var index in indexes!)
    {
      var severity = index?["severity"]?.GetValue<string>();
      Assert.Equal("warning", severity);
    }
  }

  private static List<string> GetRequiredIndexes(string database)
  {
    var spec = LoadSpec();
    if (spec == null) return new List<string>();

    var indexes = spec["required_objects"]?[database]?["indexes"]?.AsArray();
    if (indexes == null) return new List<string>();

    return indexes.Select(x => x?["name"]?.GetValue<string>() ?? "").ToList();
  }

  // ═══════════════════════════════════════════════════════════════
  // 6. CONNECTION PROPERTIES ENFORCED
  // ═══════════════════════════════════════════════════════════════

  [Fact]
  public void Connection_EncryptionIsRequired()
  {
    var spec = LoadSpec();
    Assert.NotNull(spec);

    var encryption = spec!["connection"]?["encryption"]?.GetValue<string>();
    Assert.Equal("required", encryption);
  }

  [Fact]
  public void Connection_TimeoutIsReasonable()
  {
    var spec = LoadSpec();
    Assert.NotNull(spec);

    var timeout = spec!["connection"]?["timeout_seconds"]?.GetValue<int>();
    Assert.NotNull(timeout);
    Assert.InRange(timeout!.Value, 10, 60);
  }

  [Fact]
  public void Connection_ApplicationNameSet()
  {
    var spec = LoadSpec();
    Assert.NotNull(spec);

    var appName = spec!["connection"]?["application_name"]?.GetValue<string>();
    Assert.Equal("TerraFusion-OS", appName);
  }

  // ═══════════════════════════════════════════════════════════════
  // 7. READ-ONLY INVARIANT ASSERTED
  // ═══════════════════════════════════════════════════════════════

  [Fact]
  public void AccessMode_DefaultIsReadOnly()
  {
    var spec = LoadSpec();
    Assert.NotNull(spec);

    var defaultMode = spec!["access_mode"]?["default"]?.GetValue<string>();
    Assert.Equal("read_only", defaultMode);
  }

  [Fact]
  public void AccessMode_WritesRequireAmendment()
  {
    var spec = LoadSpec();
    Assert.NotNull(spec);

    var writesRequire = spec!["access_mode"]?["writes_require"]?.GetValue<string>();
    Assert.Equal("amendment", writesRequire);
  }

  [Fact]
  public void Permissions_DbDatawriterForbidden()
  {
    var spec = LoadSpec();
    Assert.NotNull(spec);

    var forbidden = spec!["permissions"]?["forbidden"]?.AsArray();
    Assert.NotNull(forbidden);

    var forbiddenPerms = forbidden!.Select(x => x?.GetValue<string>()).ToList();
    Assert.Contains("db_datawriter", forbiddenPerms);
  }

  [Fact]
  public void Permissions_SysadminForbidden()
  {
    var spec = LoadSpec();
    Assert.NotNull(spec);

    var forbidden = spec!["permissions"]?["forbidden"]?.AsArray();
    Assert.NotNull(forbidden);

    var forbiddenPerms = forbidden!.Select(x => x?.GetValue<string>()).ToList();
    Assert.Contains("sysadmin", forbiddenPerms);
  }

  // ═══════════════════════════════════════════════════════════════
  // 8. UNEXPECTED OBJECT NOT REFERENCED
  // ═══════════════════════════════════════════════════════════════

  [Fact]
  public void Contract_OnlyTerraFusionViews()
  {
    var views = GetRequiredViews("pacs_oltp");

    foreach (var view in views)
    {
      Assert.StartsWith("vw_TerraFusion_", view);
    }
  }

  [Fact]
  public void Contract_NoDirectTableAccess()
  {
    var views = GetRequiredViews("pacs_oltp");

    // Raw PACS tables should NOT be listed as required views
    var rawTables = new[] { "property", "property_val", "owner", "situs" };

    foreach (var table in rawTables)
    {
      Assert.DoesNotContain(table, views);
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // 9. SPECLOCK REGISTERED IN INDEX
  // ═══════════════════════════════════════════════════════════════

  [Fact]
  public void Index_ContainsPacsContract()
  {
    var indexJsonPath = Path.Combine(RepoRoot, "docs", "spec-lock", "INDEX.json");

    if (File.Exists(indexJsonPath))
    {
      var json = File.ReadAllText(indexJsonPath);
      var index = JsonNode.Parse(json);
      Assert.NotNull(index);

      var locks = index!["locks"]?.AsArray();
      Assert.NotNull(locks);

      var hasLock = locks!.Any(x => x?["id"]?.GetValue<string>() == "pacscontract.v1");
      Assert.True(hasLock, "pacscontract.v1 must be registered in INDEX.json");
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // 10. FAILURE MESSAGES ARE EXPLICIT
  // ═══════════════════════════════════════════════════════════════

  [Fact]
  public void ErrorCodes_ViewMissingDefined()
  {
    var spec = LoadSpec();
    Assert.NotNull(spec);

    var errorCodes = spec!["error_codes"];
    Assert.NotNull(errorCodes);
    Assert.NotNull(errorCodes!["PACS_VIEW_MISSING"]);

    var behavior = errorCodes["PACS_VIEW_MISSING"]?["behavior"]?.GetValue<string>();
    Assert.Equal("fail_closed", behavior);
  }

  [Fact]
  public void ErrorCodes_ConnectionFailedDefined()
  {
    var spec = LoadSpec();
    Assert.NotNull(spec);

    var errorCodes = spec!["error_codes"];
    Assert.NotNull(errorCodes);
    Assert.NotNull(errorCodes!["PACS_CONNECTION_FAILED"]);

    var behavior = errorCodes["PACS_CONNECTION_FAILED"]?["behavior"]?.GetValue<string>();
    Assert.Equal("fail_closed", behavior);
  }

  [Fact]
  public void ErrorCodes_IndexMissingIsWarning()
  {
    var spec = LoadSpec();
    Assert.NotNull(spec);

    var errorCodes = spec!["error_codes"];
    Assert.NotNull(errorCodes);
    Assert.NotNull(errorCodes!["PACS_INDEX_MISSING"]);

    var behavior = errorCodes["PACS_INDEX_MISSING"]?["behavior"]?.GetValue<string>();
    Assert.Equal("continue", behavior);
  }

  [Fact]
  public void ErrorCodes_PermissionDeniedFailsClosed()
  {
    var spec = LoadSpec();
    Assert.NotNull(spec);

    var errorCodes = spec!["error_codes"];
    Assert.NotNull(errorCodes);
    Assert.NotNull(errorCodes!["PACS_PERMISSION_DENIED"]);

    var behavior = errorCodes["PACS_PERMISSION_DENIED"]?["behavior"]?.GetValue<string>();
    Assert.Equal("fail_closed", behavior);
  }

  // ═══════════════════════════════════════════════════════════════
  // GENERATED ARTIFACTS
  // ═══════════════════════════════════════════════════════════════

  [Fact]
  public void Generated_SchemaJsonExists()
  {
    var path = Path.Combine(RepoRoot, SchemaPath);
    Assert.True(File.Exists(path), $"pacscontract.schema.json must exist at {path}");
  }

  [Fact]
  public void Generated_OpenapiYamlExists()
  {
    var path = Path.Combine(RepoRoot, OpenapiPath);
    Assert.True(File.Exists(path), $"pacscontract.openapi.yaml must exist at {path}");
  }

  [Fact]
  public void Generated_SchemaIsValidJson()
  {
    var path = Path.Combine(RepoRoot, SchemaPath);
    if (!File.Exists(path)) return;

    var json = File.ReadAllText(path);
    var doc = JsonNode.Parse(json);

    Assert.NotNull(doc);
    Assert.NotNull(doc!["$schema"]);
  }

  // ═══════════════════════════════════════════════════════════════
  // HEALTH CHECK PROCEDURE
  // ═══════════════════════════════════════════════════════════════

  [Fact]
  public void Procedures_HealthCheckDeclared()
  {
    var spec = LoadSpec();
    Assert.NotNull(spec);

    var procedures = spec!["required_objects"]?["pacs_oltp"]?["procedures"]?.AsArray();
    Assert.NotNull(procedures);

    var procNames = procedures!.Select(x => x?["name"]?.GetValue<string>()).ToList();
    Assert.Contains("sp_TerraFusion_HealthCheck", procNames);
  }

  [Fact]
  public void Procedures_HealthCheckSeverityIsError()
  {
    var spec = LoadSpec();
    Assert.NotNull(spec);

    var procedures = spec!["required_objects"]?["pacs_oltp"]?["procedures"]?.AsArray();
    Assert.NotNull(procedures);

    var healthCheck = procedures!.FirstOrDefault(x => x?["name"]?.GetValue<string>() == "sp_TerraFusion_HealthCheck");
    Assert.NotNull(healthCheck);

    var severity = healthCheck!["severity"]?.GetValue<string>();
    Assert.Equal("error", severity);
  }
}
