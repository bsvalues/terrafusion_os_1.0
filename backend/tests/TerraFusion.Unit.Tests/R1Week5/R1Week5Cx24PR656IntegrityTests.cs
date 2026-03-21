using System.IO;
using System.Text.RegularExpressions;
using FluentAssertions;
using Xunit;

namespace TerraFusion.Unit.Tests.R1Week5;

// ─────────────────────────────────────────────────────────────────────────────
// CX-24: PR #656 Integrity — Phase 24 Gate
//
// Proves the three backend controllers delivered by PR #656 (ClerkController,
// TreasuryController, AuditController) meet the same county-isolation and RBAC
// standards established in Phase 21 (CP-14):
//
//   1. Class-level [Authorize] attribute
//   2. ResolveCountyIdAsync() pattern present
//   3. return Forbid() on null county resolution
//   4. AsNoTracking() on all read queries (no write-lock on SELECT)
//   5. Route attribute correct: api/clerk, api/treasury, api/audit
//
// Also proves the three frontend tabs have no placeholder/stub content.
//
// Filter: dotnet test --filter "FullyQualifiedName~R1Week5Cx24"
// ─────────────────────────────────────────────────────────────────────────────

[Trait("Category", "R1Week5")]
[Trait("Category", "CX24")]
[Trait("Category", "SourceInspection")]
public sealed class R1Week5Cx24PR656IntegrityTests
{
    // ── Source file paths ────────────────────────────────────────────────────

    // AppContext.BaseDirectory = .../backend/tests/TerraFusion.Unit.Tests/bin/Debug/net8.0/
    // 6 up-levels reaches terrafusion_os_1.0 (repo root)
    private static readonly string RepoRoot = Path.GetFullPath(
        Path.Combine(AppContext.BaseDirectory, "../../../../../../"));

    private static string ReadBackend(string rel) =>
        File.ReadAllText(Path.Combine(RepoRoot,
            "backend", "src", "TerraFusion.API", "Controllers", rel));

    private static string ReadFrontend(string rel) =>
        File.ReadAllText(Path.Combine(RepoRoot,
            "frontend", "apps", "os-shell", "src", rel));

    // ── Backend: ClerkController ─────────────────────────────────────────────

    [Fact]
    public void ClerkController_HasClassLevel_Authorize()
    {
        var src = ReadBackend("ClerkController.cs");
        src.Should().Contain("[Authorize]",
            "ClerkController must require authentication at class level");
    }

    [Fact]
    public void ClerkController_Implements_ResolveCountyIdAsync()
    {
        var src = ReadBackend("ClerkController.cs");
        src.Should().Contain("ResolveCountyIdAsync",
            "ClerkController must resolve county from JWT claim");
    }

    [Fact]
    public void ClerkController_Returns_ForbidOnNullCounty()
    {
        var src = ReadBackend("ClerkController.cs");
        src.Should().Contain("return Forbid()",
            "ClerkController must forbid access when county cannot be resolved");
    }

    [Fact]
    public void ClerkController_Routes_ToApiClerk()
    {
        var src = ReadBackend("ClerkController.cs");
        src.Should().Contain("api/clerk",
            "ClerkController must be routed at api/clerk");
    }

    [Fact]
    public void ClerkController_UsesAsNoTracking_ForReads()
    {
        var src = ReadBackend("ClerkController.cs");
        src.Should().Contain("AsNoTracking",
            "ClerkController read queries must use AsNoTracking");
    }

    // ── Backend: TreasuryController ──────────────────────────────────────────

    [Fact]
    public void TreasuryController_HasClassLevel_Authorize()
    {
        var src = ReadBackend("TreasuryController.cs");
        src.Should().Contain("[Authorize]",
            "TreasuryController must require authentication at class level");
    }

    [Fact]
    public void TreasuryController_Implements_ResolveCountyIdAsync()
    {
        var src = ReadBackend("TreasuryController.cs");
        src.Should().Contain("ResolveCountyIdAsync",
            "TreasuryController must resolve county from JWT claim");
    }

    [Fact]
    public void TreasuryController_Returns_ForbidOnNullCounty()
    {
        var src = ReadBackend("TreasuryController.cs");
        src.Should().Contain("return Forbid()",
            "TreasuryController must forbid access when county cannot be resolved");
    }

    [Fact]
    public void TreasuryController_Routes_ToApiTreasury()
    {
        var src = ReadBackend("TreasuryController.cs");
        src.Should().Contain("api/treasury",
            "TreasuryController must be routed at api/treasury");
    }

    [Fact]
    public void TreasuryController_UsesAsNoTracking_ForReads()
    {
        var src = ReadBackend("TreasuryController.cs");
        src.Should().Contain("AsNoTracking",
            "TreasuryController read queries must use AsNoTracking");
    }

    // ── Backend: AuditController ─────────────────────────────────────────────

    [Fact]
    public void AuditController_HasClassLevel_Authorize()
    {
        var src = ReadBackend("AuditController.cs");
        src.Should().Contain("[Authorize]",
            "AuditController must require authentication at class level");
    }

    [Fact]
    public void AuditController_Implements_ResolveCountyIdAsync()
    {
        var src = ReadBackend("AuditController.cs");
        src.Should().Contain("ResolveCountyIdAsync",
            "AuditController must resolve county from JWT claim");
    }

    [Fact]
    public void AuditController_Returns_ForbidOnNullCounty()
    {
        var src = ReadBackend("AuditController.cs");
        src.Should().Contain("return Forbid()",
            "AuditController must forbid access when county cannot be resolved");
    }

    [Fact]
    public void AuditController_Routes_ToApiAudit()
    {
        var src = ReadBackend("AuditController.cs");
        src.Should().Contain("api/audit",
            "AuditController must be routed at api/audit");
    }

    [Fact]
    public void AuditController_UsesAsNoTracking_ForReads()
    {
        var src = ReadBackend("AuditController.cs");
        src.Should().Contain("AsNoTracking",
            "AuditController read queries must use AsNoTracking");
    }

    // ── Frontend: PropertyClerk tab ──────────────────────────────────────────

    private static readonly string[] ForbiddenStubPhrases =
    [
        "Coming soon",
        "coming-soon",
        "Not implemented",
        "Under construction",
        "This tab is not yet available",
        "Tab under construction",
    ];

    [Fact]
    public void PropertyClerk_HasNoPlaceholderContent()
    {
        var src = ReadFrontend("pages/workbench/tabs/PropertyClerk.tsx");
        foreach (var phrase in ForbiddenStubPhrases)
            src.Should().NotContain(phrase,
                $"PropertyClerk.tsx must not contain stub phrase '{phrase}'");
    }

    [Fact]
    public void PropertyClerk_IsRegistered_InRouter()
    {
        var router = ReadFrontend("Router.tsx");
        router.Should().Contain("PropertyClerk",
            "Router.tsx must lazy-import PropertyClerk");
        router.Should().Contain("path='clerk'",
            "Router.tsx must register path='clerk' tab route");
    }

    // ── Frontend: PropertyTreasury tab ───────────────────────────────────────

    [Fact]
    public void PropertyTreasury_HasNoPlaceholderContent()
    {
        var src = ReadFrontend("pages/workbench/tabs/PropertyTreasury.tsx");
        foreach (var phrase in ForbiddenStubPhrases)
            src.Should().NotContain(phrase,
                $"PropertyTreasury.tsx must not contain stub phrase '{phrase}'");
    }

    [Fact]
    public void PropertyTreasury_IsRegistered_InRouter()
    {
        var router = ReadFrontend("Router.tsx");
        router.Should().Contain("PropertyTreasury",
            "Router.tsx must lazy-import PropertyTreasury");
        router.Should().Contain("path='treasury'",
            "Router.tsx must register path='treasury' tab route");
    }

    // ── Frontend: PropertyAudit tab ──────────────────────────────────────────

    [Fact]
    public void PropertyAudit_HasNoPlaceholderContent()
    {
        var src = ReadFrontend("pages/workbench/tabs/PropertyAudit.tsx");
        foreach (var phrase in ForbiddenStubPhrases)
            src.Should().NotContain(phrase,
                $"PropertyAudit.tsx must not contain stub phrase '{phrase}'");
    }

    [Fact]
    public void PropertyAudit_IsRegistered_InRouter()
    {
        var router = ReadFrontend("Router.tsx");
        router.Should().Contain("PropertyAudit",
            "Router.tsx must lazy-import PropertyAudit");
        router.Should().Contain("path='audit'",
            "Router.tsx must register path='audit' tab route");
    }

    // ── County-scoped queries appear multiple times per controller ─────────────
    // Counts occurrences of `countyId.Value` — each appearance is a county-
    // scoped DB filter. Controllers with 4-7 endpoints should have ≥ 3.

    [Fact]
    public void ClerkController_MultipleCountyScopedQueries()
    {
        var src = ReadBackend("ClerkController.cs");
        var count = Regex.Matches(src, @"countyId\.Value").Count;
        count.Should().BeGreaterOrEqualTo(3,
            "ClerkController must scope multiple DB queries by countyId.Value");
    }

    [Fact]
    public void TreasuryController_MultipleCountyScopedQueries()
    {
        var src = ReadBackend("TreasuryController.cs");
        var count = Regex.Matches(src, @"countyId\.Value").Count;
        count.Should().BeGreaterOrEqualTo(3,
            "TreasuryController must scope multiple DB queries by countyId.Value");
    }

    [Fact]
    public void AuditController_MultipleCountyScopedQueries()
    {
        var src = ReadBackend("AuditController.cs");
        var count = Regex.Matches(src, @"countyId\.Value").Count;
        count.Should().BeGreaterOrEqualTo(3,
            "AuditController must scope multiple DB queries by countyId.Value");
    }
}
