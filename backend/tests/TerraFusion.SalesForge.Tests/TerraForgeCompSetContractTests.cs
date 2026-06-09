using FluentAssertions;
using Xunit;

namespace TerraFusion.SalesForge.Tests;

/// <summary>
/// Source contract for promoting CompsForge session baskets into governed comp sets.
/// Keeps draft persistence inside TerraForge without crossing into workflow/evidence/GIS lanes.
/// </summary>
public class TerraForgeCompSetContractTests
{
    private static readonly string ControllerSource;
    private static readonly string DbContextSource;
    private static readonly string CompSetEntitySource;
    private static readonly string CompSetConfigurationSource;
    private static readonly string DatabaseInitializationSource;

    static TerraForgeCompSetContractTests()
    {
        var testDir = AppDomain.CurrentDomain.BaseDirectory;
        var backendRoot = Path.GetFullPath(Path.Combine(testDir, "..", "..", "..", "..", ".."));
        var controllerPath = Path.Combine(backendRoot, "src", "TerraFusion.API", "Controllers", "TerraForgeController.cs");
        var dbContextPath = Path.Combine(backendRoot, "src", "TerraFusion.Data", "TerraFusionDbContext.cs");
        var entityPath = Path.Combine(backendRoot, "src", "TerraFusion.Core", "Entities", "TerraForge", "CompSet.cs");
        var configurationPath = Path.Combine(backendRoot, "src", "TerraFusion.Data", "Configurations", "TerraForge", "CompSetConfiguration.cs");
        var databaseInitializationPath = Path.Combine(backendRoot, "src", "TerraFusion.API", "Services", "DatabaseInitializationService.cs");
        ControllerSource = File.ReadAllText(controllerPath);
        DbContextSource = File.Exists(dbContextPath) ? File.ReadAllText(dbContextPath) : string.Empty;
        CompSetEntitySource = File.Exists(entityPath) ? File.ReadAllText(entityPath) : string.Empty;
        CompSetConfigurationSource = File.Exists(configurationPath) ? File.ReadAllText(configurationPath) : string.Empty;
        DatabaseInitializationSource = File.Exists(databaseInitializationPath) ? File.ReadAllText(databaseInitializationPath) : string.Empty;
    }

    [Fact]
    public void Controller_HasDraftCompSetCreateAndReadPersistenceEndpoints()
    {
        ControllerSource.Should().Contain("[HttpPost(\"comps/sets\")]");
        ControllerSource.Should().Contain("[HttpGet(\"comps/sets/{compSetId}\")]");

        var contractSource = CompSetContractSource();
        contractSource.Should().Contain("await _db.CompSets.AddAsync");
        contractSource.Should().Contain("await _db.SaveChangesAsync");
        contractSource.Should().Contain("CreatedAtAction(nameof(GetCompSet)");
        contractSource.Should().Contain("CompSetId == parsedCompSetId");
        contractSource.Should().Contain("x.CountyId == scopedCountyId");
        contractSource.Should().Contain("CreateCompSet");
        contractSource.Should().Contain("GetCompSet");
    }

    [Fact]
    public void CompSetContract_DeclaresDraftMarketSearchAndSubjectDefenseShapes()
    {
        ControllerSource.Should().Contain("CompSetCreateRequestDto");
        ControllerSource.Should().Contain("CompSetContractResponseDto");
        ControllerSource.Should().Contain("CompSetDto");
        ControllerSource.Should().Contain("CompSetCandidateDto");
        ControllerSource.Should().Contain("CompSetProvenanceDto");

        var contractSource = CompSetContractSource();
        contractSource.Should().Contain("mode = \"market_search\"");
        contractSource.Should().Contain("mode = \"subject_defense\"");
        contractSource.Should().Contain("status = \"draft\"");
        contractSource.Should().Contain("officialStatus = \"not_official\"");
    }

    [Fact]
    public void CompSetContract_KeepsSubjectParcelOptionalAndRequiresSourceProvenance()
    {
        ControllerSource.Should().Contain("public string? subjectParcelId { get; init; }");

        var contractSource = CompSetContractSource();
        contractSource.Should().Contain("SubjectParcelId = string.IsNullOrWhiteSpace(request.subjectParcelId) ? null : request.subjectParcelId.Trim()");
        contractSource.Should().Contain("countyId");
        contractSource.Should().Contain("Benton comps-pool");
        contractSource.Should().Contain("federationStatus = CoalesceCompSetValue(request.source.federationStatus, \"not_connected\")");
        contractSource.Should().Contain("federationStatus = compSet.FederationStatus");
        contractSource.Should().Contain("ProvenanceRuntime = \"county_scoped\"");
        contractSource.Should().Contain("runtime = compSet.ProvenanceRuntime");
        contractSource.Should().Contain("persistence = \"persisted\"");
    }

    [Fact]
    public void CompSetPersistence_AddsCountyIsolatedEntitiesAndConfiguration()
    {
        ControllerSource.Should().Contain("countyToken.Equals(\"benton\", StringComparison.OrdinalIgnoreCase)");
        ControllerSource.Should().Contain("TerraFusion.API.Seeds.DatabaseSeeder.BentonCountyId.ToString(\"D\")");

        CompSetEntitySource.Should().Contain("public sealed class CompSet");
        CompSetEntitySource.Should().Contain("public sealed class CompSetCandidate");
        CompSetEntitySource.Should().Contain("public Guid CountyId { get; set; }");
        CompSetEntitySource.Should().Contain("public string Mode { get; set; } = \"market_search\";");
        CompSetEntitySource.Should().Contain("public string Status { get; set; } = \"draft\";");
        CompSetEntitySource.Should().Contain("public string OfficialStatus { get; set; } = \"not_official\";");
        CompSetEntitySource.Should().Contain("public string? SubjectParcelId { get; set; }");
        CompSetEntitySource.Should().Contain("public ICollection<CompSetCandidate> Candidates { get; set; }");

        DbContextSource.Should().Contain("DbSet<CompSet> CompSets");
        DbContextSource.Should().Contain("DbSet<CompSetCandidate> CompSetCandidates");
        DbContextSource.Should().Contain("new CompSetConfiguration()");
        DbContextSource.Should().Contain("new CompSetCandidateConfiguration()");

        CompSetConfigurationSource.Should().Contain("ToTable(\"CompSets\")");
        CompSetConfigurationSource.Should().Contain("ToTable(\"CompSetCandidates\")");
        CompSetConfigurationSource.Should().Contain("HasIndex(e => new { e.CountyId, e.CompSetId })");
        CompSetConfigurationSource.Should().Contain("OnDelete(DeleteBehavior.Cascade)");

        DatabaseInitializationSource.Should().Contain("EnsurePostgresCompSetTablesAsync");
        DatabaseInitializationSource.Should().Contain("CREATE TABLE IF NOT EXISTS \"CompSets\"");
        DatabaseInitializationSource.Should().Contain("CREATE TABLE IF NOT EXISTS \"CompSetCandidates\"");
    }

    [Fact]
    public void CompSetPersistence_DoesNotWriteDaisDossierAtlasOrOfficialStatus()
    {
        var contractSource = CompSetContractSource();

        contractSource.Should().NotContain("Dais");
        contractSource.Should().NotContain("Dossier");
        contractSource.Should().NotContain("Atlas");
        contractSource.Should().NotContain("_db.Workflows");
        contractSource.Should().NotContain("_db.Dossier");
        contractSource.Should().NotContain("_db.Sync");
        contractSource.Should().NotContain("_db.CountySpatialArtifacts");
        contractSource.Should().NotContain("officialStatus = \"official\"");
        contractSource.Should().NotContain("status = \"defended\"");
    }

    private static string CompSetContractSource()
    {
        const string startMarker = "    // ── CompsForge Comp Sets";
        var start = ControllerSource.IndexOf(startMarker, StringComparison.Ordinal);
        start.Should().BeGreaterThanOrEqualTo(0, "the CompsForge comp set contract section must exist");

        const string endMarker = "    // ── OLS Regression";
        var end = ControllerSource.IndexOf(endMarker, start, StringComparison.Ordinal);
        end.Should().BeGreaterThan(start, "the comp set contract should be defined before OLS Regression");

        return ControllerSource[start..end];
    }
}
