// =============================================================================
// PACS Adapter Boundary Tests - pacscontract.v1
// =============================================================================
// Tests that verify the PacsAdapter is the SINGLE boundary for PACS access.
// =============================================================================

using System.Reflection;
using System.Text.RegularExpressions;
using Xunit;

namespace TerraFusion.Unit.SmokeTests;

/// <summary>
/// Tests that verify the PACS adapter boundary is properly implemented.
/// </summary>
[Trait("Category", "SpecLock")]
[Trait("Surface", "pacscontract")]
[Trait("Phase", "PACS")]
public sealed class PacsAdapterBoundaryTests
{
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

    // ═══════════════════════════════════════════════════════════════
    // BOUNDARY FILES EXIST
    // ═══════════════════════════════════════════════════════════════

    [Fact]
    public void IPacsAdapter_InterfaceFile_Exists()
    {
        var path = Path.Combine(RepoRoot, "backend", "src", "TerraFusion.Core", "PACS", "IPacsAdapter.cs");
        Assert.True(File.Exists(path), $"IPacsAdapter.cs must exist at {path}");
    }

    [Fact]
    public void PacsSqlAdapter_ImplementationFile_Exists()
    {
        var path = Path.Combine(RepoRoot, "backend", "src", "TerraFusion.Core", "PACS", "PacsSqlAdapter.cs");
        Assert.True(File.Exists(path), $"PacsSqlAdapter.cs must exist at {path}");
    }

    [Fact]
    public void PacsServiceRegistration_File_Exists()
    {
        var path = Path.Combine(RepoRoot, "backend", "src", "TerraFusion.Core", "PACS", "PacsServiceRegistration.cs");
        Assert.True(File.Exists(path), $"PacsServiceRegistration.cs must exist at {path}");
    }

    // ═══════════════════════════════════════════════════════════════
    // INTERFACE DECLARES CONTRACT METHODS
    // ═══════════════════════════════════════════════════════════════

    [Fact]
    public void IPacsAdapter_File_DeclaresContractProof()
    {
        var path = Path.Combine(RepoRoot, "backend", "src", "TerraFusion.Core", "PACS", "IPacsAdapter.cs");
        var content = File.ReadAllText(path);

        Assert.Contains("ValidateContractAsync", content);
        Assert.Contains("PacsContractProof", content);
    }

    [Fact]
    public void IPacsAdapter_File_DeclaresPropertyQueries()
    {
        var path = Path.Combine(RepoRoot, "backend", "src", "TerraFusion.Core", "PACS", "IPacsAdapter.cs");
        var content = File.ReadAllText(path);

        Assert.Contains("GetPropertyByIdAsync", content);
        Assert.Contains("GetPropertyByGeoIdAsync", content);
        Assert.Contains("GetPropertiesAsync", content);
    }

    [Fact]
    public void IPacsAdapter_File_DeclaresOwnershipQuery()
    {
        var path = Path.Combine(RepoRoot, "backend", "src", "TerraFusion.Core", "PACS", "IPacsAdapter.cs");
        var content = File.ReadAllText(path);

        Assert.Contains("GetOwnershipAsync", content);
        Assert.Contains("PacsPropertyOwnership", content);
    }

    [Fact]
    public void IPacsAdapter_File_DeclaresAssessmentQueries()
    {
        var path = Path.Combine(RepoRoot, "backend", "src", "TerraFusion.Core", "PACS", "IPacsAdapter.cs");
        var content = File.ReadAllText(path);

        Assert.Contains("GetAssessmentHistoryAsync", content);
        Assert.Contains("GetCurrentAssessmentAsync", content);
        Assert.Contains("PacsAssessmentHistory", content);
    }

    // ═══════════════════════════════════════════════════════════════
    // ERROR CODES DEFINED
    // ═══════════════════════════════════════════════════════════════

    [Fact]
    public void PacsErrorCodes_ConnectionFailed_Defined()
    {
        var path = Path.Combine(RepoRoot, "backend", "src", "TerraFusion.Core", "PACS", "IPacsAdapter.cs");
        var content = File.ReadAllText(path);

        Assert.Contains("PACS_CONNECTION_FAILED", content);
    }

    [Fact]
    public void PacsErrorCodes_ViewMissing_Defined()
    {
        var path = Path.Combine(RepoRoot, "backend", "src", "TerraFusion.Core", "PACS", "IPacsAdapter.cs");
        var content = File.ReadAllText(path);

        Assert.Contains("PACS_VIEW_MISSING", content);
    }

    [Fact]
    public void PacsErrorCodes_PermissionDenied_Defined()
    {
        var path = Path.Combine(RepoRoot, "backend", "src", "TerraFusion.Core", "PACS", "IPacsAdapter.cs");
        var content = File.ReadAllText(path);

        Assert.Contains("PACS_PERMISSION_DENIED", content);
    }

    // ═══════════════════════════════════════════════════════════════
    // IMPLEMENTATION USES CONTRACT VIEWS
    // ═══════════════════════════════════════════════════════════════

    [Fact]
    public void PacsSqlAdapter_Uses_PropertyCoreView()
    {
        var path = Path.Combine(RepoRoot, "backend", "src", "TerraFusion.Core", "PACS", "PacsSqlAdapter.cs");
        var content = File.ReadAllText(path);

        Assert.Contains("vw_TerraFusion_Property_Core", content);
    }

    [Fact]
    public void PacsSqlAdapter_Uses_PropertyOwnershipView()
    {
        var path = Path.Combine(RepoRoot, "backend", "src", "TerraFusion.Core", "PACS", "PacsSqlAdapter.cs");
        var content = File.ReadAllText(path);

        Assert.Contains("vw_TerraFusion_Property_Ownership", content);
    }

    [Fact]
    public void PacsSqlAdapter_Uses_AssessmentHistoryView()
    {
        var path = Path.Combine(RepoRoot, "backend", "src", "TerraFusion.Core", "PACS", "PacsSqlAdapter.cs");
        var content = File.ReadAllText(path);

        Assert.Contains("vw_TerraFusion_Assessment_History", content);
    }

    [Fact]
    public void PacsSqlAdapter_ComparableSalesExtraction_DoesNotRequireBaseSaleTable()
    {
        var path = Path.Combine(RepoRoot, "backend", "src", "TerraFusion.Core", "PACS", "PacsSqlAdapter.cs");
        var content = File.ReadAllText(path);

        var rawSaleReference = new Regex(
            @"\b(?:FROM|JOIN)(?:\s|/\*[\s\S]*?\*/|--[^\r\n]*(?:\r?\n|$))+(?:(?:\[[^\]]+\]|""[^""]+""|[A-Za-z_][A-Za-z0-9_$#@]*)\s*\.\s*)*(?:\.\s*)?(?:\[sale\]|""sale""|sale)(?![\w])",
            RegexOptions.IgnoreCase | RegexOptions.CultureInvariant);

        foreach (var forbiddenSql in new[]
        {
            "FROM sale",
            "FROM [dbo].[sale]",
            "FROM [pacs]..[sale]",
            "FROM [server].[pacs]..[sale]",
            "FROM \"dbo\".\"sale\"",
            "FROM /* contract bypass */ [dbo].[sale]",
            "JOIN\r\n[dbo].[sale]",
        })
        {
            Assert.Matches(rawSaleReference, forbiddenSql);
        }

        Assert.DoesNotMatch(rawSaleReference, content);
        Assert.Contains("DboObject(ViewComparableSales)", content, StringComparison.Ordinal);
    }

    [Fact]
    public void PacsSqlAdapter_ContractObjectsAreBoundToDboSchema()
    {
        var path = Path.Combine(RepoRoot, "backend", "src", "TerraFusion.Core", "PACS", "PacsSqlAdapter.cs");
        var content = File.ReadAllText(path);

        var viewCatalogChecks = Regex.Matches(
            content,
            "SELECT COUNT\\(\\*\\) FROM sys\\.views WHERE name = @ViewName AND schema_id = SCHEMA_ID\\(N'dbo'\\)",
            RegexOptions.CultureInvariant);
        var procedureCatalogChecks = Regex.Matches(
            content,
            "SELECT COUNT\\(\\*\\) FROM sys\\.procedures WHERE name = @ProcName AND schema_id = SCHEMA_ID\\(N'dbo'\\)",
            RegexOptions.CultureInvariant);

        Assert.True(viewCatalogChecks.Count == 3, "Every PACS view catalog check must bind to dbo.");
        Assert.Single(procedureCatalogChecks);
        Assert.Equal(
            viewCatalogChecks.Count,
            Regex.Matches(content, "SELECT COUNT\\(\\*\\) FROM sys\\.views", RegexOptions.CultureInvariant).Count);
        Assert.Equal(
            procedureCatalogChecks.Count,
            Regex.Matches(content, "SELECT COUNT\\(\\*\\) FROM sys\\.procedures", RegexOptions.CultureInvariant).Count);
        Assert.Contains("DboObject(ProcHealthCheck)", content, StringComparison.Ordinal);
        Assert.DoesNotMatch(
            new Regex(
                @"\{View(?:PropertyCore|PropertyOwnership|AssessmentHistory|ComparableSales|CamaCharacteristics|ImprovementCostMatrices)\}",
                RegexOptions.CultureInvariant),
            content);
        foreach (var view in new[]
        {
            "ViewPropertyCore",
            "ViewPropertyOwnership",
            "ViewAssessmentHistory",
            "ViewComparableSales",
            "ViewCamaCharacteristics",
            "ViewImprovementCostMatrices",
        })
        {
            Assert.Contains($"DboObject({view})", content, StringComparison.Ordinal);
        }
    }

    [Fact]
    public void PacsSqlAdapter_ReadOnlyRoleChecksFailClosedWhenIndeterminate()
    {
        var path = Path.Combine(RepoRoot, "backend", "src", "TerraFusion.Core", "PACS", "PacsSqlAdapter.cs");
        var content = File.ReadAllText(path);

        foreach (var role in new[]
        {
            "IS_SRVROLEMEMBER('sysadmin')",
            "IS_SRVROLEMEMBER('securityadmin')",
            "IS_MEMBER('db_owner')",
            "IS_MEMBER('db_datawriter')",
            "IS_MEMBER('db_securityadmin')",
            "IS_MEMBER('db_ddladmin')",
            "IS_MEMBER('db_accessadmin')",
        })
        {
            Assert.Contains($"COALESCE({role}, 1) = 1", content, StringComparison.Ordinal);
        }
    }

    [Fact]
    public void PacsSqlAdapter_AssessmentHistoryUsesValidatedPrimaryConnection()
    {
        var path = Path.Combine(RepoRoot, "backend", "src", "TerraFusion.Core", "PACS", "PacsSqlAdapter.cs");
        var content = File.ReadAllText(path);
        var start = content.IndexOf("GetAssessmentHistoryAsync(", StringComparison.Ordinal);
        var end = content.IndexOf("GetCurrentAssessmentAsync(", start, StringComparison.Ordinal);
        Assert.True(start >= 0 && end > start);
        var method = content[start..end];

        Assert.Contains("CreatePrimaryConnection()", method, StringComparison.Ordinal);
        Assert.DoesNotContain("CreateSalesConnection()", method, StringComparison.Ordinal);
    }

    [Fact]
    public void PacsSqlAdapter_Uses_HealthCheckProcedure()
    {
        var path = Path.Combine(RepoRoot, "backend", "src", "TerraFusion.Core", "PACS", "PacsSqlAdapter.cs");
        var content = File.ReadAllText(path);

        Assert.Contains("sp_TerraFusion_HealthCheck", content);
    }

    // ═══════════════════════════════════════════════════════════════
    // DEPRECATED SERVICE HAS OBSOLETE ATTRIBUTE
    // ═══════════════════════════════════════════════════════════════

    [Fact]
    public void HarrisPACSIntegrationService_IsMarkedObsolete()
    {
        var path = Path.Combine(RepoRoot, "backend", "src", "TerraFusion.Core", "Services", "HarrisPACSIntegrationService.cs");
        var content = File.ReadAllText(path);

        Assert.Contains("[Obsolete", content);
        Assert.Contains("IPacsAdapter", content);
        Assert.Contains("DEPRECATED", content);
    }

    // ═══════════════════════════════════════════════════════════════
    // DI REGISTRATION PRESENT
    // ═══════════════════════════════════════════════════════════════

    [Fact]
    public void PacsServiceRegistration_HasAddPacsAdapter()
    {
        var path = Path.Combine(RepoRoot, "backend", "src", "TerraFusion.Core", "PACS", "PacsServiceRegistration.cs");
        var content = File.ReadAllText(path);

        Assert.Contains("AddPacsAdapter", content);
        Assert.Contains("IPacsAdapter", content);
        Assert.Contains("PacsSqlAdapter", content);
    }

    [Fact]
    public void PacsServiceRegistration_RegistersAsSingleton()
    {
        var path = Path.Combine(RepoRoot, "backend", "src", "TerraFusion.Core", "PACS", "PacsServiceRegistration.cs");
        var content = File.ReadAllText(path);

        Assert.Contains("Singleton", content);
    }

    // ═══════════════════════════════════════════════════════════════
    // FAIL-CLOSED SEMANTICS
    // ═══════════════════════════════════════════════════════════════

    [Fact]
    public void PacsSqlAdapter_ImplementsFailClosed()
    {
        var path = Path.Combine(RepoRoot, "backend", "src", "TerraFusion.Core", "PACS", "PacsSqlAdapter.cs");
        var content = File.ReadAllText(path);

        // Must validate contract before queries
        Assert.Contains("EnsureContractValidAsync", content);

        // Must throw exception on contract violation
        Assert.Contains("PacsContractViolationException", content);
    }

    [Fact]
    public void IPacsAdapter_DefinesContractViolationException()
    {
        var path = Path.Combine(RepoRoot, "backend", "src", "TerraFusion.Core", "PACS", "IPacsAdapter.cs");
        var content = File.ReadAllText(path);

        Assert.Contains("PacsContractViolationException", content);
        Assert.Contains("fail_closed", content);
    }
}
