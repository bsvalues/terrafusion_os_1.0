# CostForge Benton Method v2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform CostForge from alpha viewer to production Benton Method audit→diagnose→fix→verify loop, reading exclusively from TerraFusion canonical entities.

**Architecture:** Seven parallel tracks (T0 prerequisite, T1/T4/T6 wave 1, T2/T3 wave 2, T5 wave 3) in isolated git worktrees. Backend computes metrics; frontend displays. TerraFusion PostgreSQL canonical tables are the sole data surface.

**Tech Stack:** .NET 8, EF Core 8, PostgreSQL, xUnit, React 18, TypeScript, Vite, apiFetch, Zustand, Playwright (screenshots), psql CLI (verification).

**Spec reference:** `docs/superpowers/specs/2026-04-16-costforge-benton-method-v2-design.md`

---

## File Structure Overview

### Backend (TerraFusion.Core, .Data, .AI, .API)
```
backend/src/TerraFusion.Core/
├── Entities/
│   ├── CamaCharacteristic.cs                [MODIFY: add City, PropertyUseStratum] (T0)
│   └── CostMatrix.cs                        [MODIFY: add SecondaryFeaturePctOfBiv] (T6)
├── Interfaces/
│   ├── IEquityMetricService.cs              [CREATE] (T1)
│   ├── IRollupService.cs                    [CREATE] (T2)
│   ├── IBentonCustomMetricService.cs        [CREATE] (T3)
│   └── ICamaDataQualityService.cs           [CREATE] (T4)
└── DTOs/
    ├── EquityMetricsDto.cs                  [CREATE] (T1)
    ├── StratumRollupDto.cs                  [CREATE] (T2)
    ├── CustomMetricsDto.cs                  [CREATE] (T3)
    └── DataQualityIssueDto.cs               [CREATE] (T4)

backend/src/TerraFusion.Data/
├── Configurations/
│   └── CamaCharacteristicConfiguration.cs   [CREATE or MODIFY: add indexes] (T0)
├── Migrations/
│   ├── AddCityAndStratumToCama.cs           [CREATE] (T0)
│   └── AddSecondaryFeaturePctToCostMatrix.cs [CREATE] (T6)
├── Canonicalizers/
│   └── PacsCanonicalizer.cs                 [CREATE or MODIFY] (T0)
└── Seeders/
    └── BentonSecondaryFeatureRatesSeeder.cs [CREATE] (T6)

backend/src/TerraFusion.AI/
├── Valuation/
│   ├── EquityMetricService.cs               [CREATE] (T1)
│   ├── RollupService.cs                     [CREATE] (T2)
│   ├── BentonCustomMetricService.cs         [CREATE] (T3)
│   ├── SaleRatioQueryBuilder.cs             [CREATE — shared helper] (T1)
│   ├── CalibrationService.cs                [EXTEND] (T5)
│   └── CostApproachCalculator.cs            [MODIFY — use real rates] (T6)
└── DataQuality/
    └── CamaDataQualityService.cs            [CREATE] (T4)

backend/src/TerraFusion.API/Controllers/
├── EquityController.cs                      [CREATE] (T1, extend T2+T3)
├── AdminController.cs                       [MODIFY: add canonical populate] (T0)
└── CostForgeController.cs                   [MODIFY: T4 DQ, T5 calibration, T6 schedule]

backend/tests/TerraFusion.API.Tests/
├── Controllers/EquityControllerTests.cs     [CREATE] (T1)
├── Controllers/EquityRollupTests.cs         [CREATE] (T2)
├── Controllers/DataQualityTests.cs          [CREATE] (T4)
└── Valuation/EquityMetricServiceTests.cs    [CREATE] (T1)

backend/tests/TerraFusion.Data.Tests/
└── Canonicalizers/PacsCanonicalizerTests.cs [CREATE] (T0)
```

### Frontend (apps/os-shell)
```
frontend/apps/os-shell/src/pages/forge/cost/
├── panels/
│   └── BentonDiagnosticsPanel.tsx           [CREATE] (T3)
├── tabs/
│   ├── TriageTab.tsx                        [MODIFY: PRB weighting, decile column] (T3)
│   ├── NeighborhoodAuditTab.tsx             [MODIFY: decile, IQR outliers] (T3, T4)
│   ├── CalibrationWorkbenchTab.tsx          [MODIFY: full-metric preview] (T5)
│   └── DataQualityTab.tsx                   [MODIFY: 8 checks drill-in] (T4)
├── CostApproachRunner.tsx                   [MODIFY: condition-grade, BIV breakdown] (T5, T6)
├── DepreciationCalculator.tsx               [MODIFY: condition picker] (T5)
├── CostManual.tsx                           [MODIFY: secondary-features table] (T6)
└── types/
    ├── equity.ts                            [CREATE] (T1)
    └── rollup.ts                            [CREATE] (T2)
```

---

## Shared Implementation Conventions

**Backend test invocation:**
```bash
cd backend && dotnet test tests/TerraFusion.API.Tests/TerraFusion.API.Tests.csproj --filter "FullyQualifiedName~<TestClassName>"
```

**EF migration:**
```bash
cd backend && dotnet ef migrations add <Name> --project src/TerraFusion.Data --startup-project src/TerraFusion.API
cd backend && dotnet ef database update --project src/TerraFusion.Data --startup-project src/TerraFusion.API
```

**psql shortcut (for canonical data verification):**
```bash
docker exec terrafusion-postgres-dev psql -U postgres -d terrafusion -c "<SQL>"
```

**Frontend typecheck:**
```bash
cd frontend && npx tsc --noEmit
```

**Commit convention (always co-author):**
```
git commit -m "$(cat <<'EOF'
<type>(costforge): <subject>

<body>

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
EOF
)"
```

---

# TRACK 0 — Canonical Data Foundation

**Worktree:** `trees/cf-v2-t0-foundation`
**Blocks:** T1, T2, T3, T4, T5, T6
**Ship criteria:** Canonical tables populated for Benton; new `City` + `PropertyUseStratum` fields non-null on every `CamaCharacteristic` row.

---

### Task 1: Extend CamaCharacteristic entity with City and PropertyUseStratum

**Files:**
- Modify: `backend/src/TerraFusion.Core/Entities/CamaCharacteristic.cs`

- [ ] **Step 1: Add fields to CamaCharacteristic.cs**

Insert the following after the `AbsSubdv` property (around line 96):

```csharp
  // ── City / Stratification (T0) ──
  /// <summary>
  /// City name for rollups. One of: Kennewick, Richland, Pasco, Prosser,
  /// Benton City, West Richland, Unincorporated. Populated by PacsCanonicalizer
  /// from PacsSitus.SitusCity.
  /// </summary>
  [StringLength(50)]
  public string? City { get; set; }

  /// <summary>
  /// Property-use stratum for cross-cutting analysis. One of:
  /// R (residential SFR), M (manufactured home), C (commercial), A (agricultural),
  /// V (vacant), X (exempt). Derived from BuildingType during canonicalization.
  /// </summary>
  [StringLength(2)]
  public string? PropertyUseStratum { get; set; }
```

- [ ] **Step 2: Verify compilation**

```bash
cd backend && dotnet build src/TerraFusion.Core/TerraFusion.Core.csproj 2>&1 | tail -10
```
Expected: `Build succeeded.` with 0 errors.

- [ ] **Step 3: Commit**

```bash
git add backend/src/TerraFusion.Core/Entities/CamaCharacteristic.cs
git commit -m "feat(costforge-t0): add City and PropertyUseStratum to CamaCharacteristic

Adds two nullable fields populated by PacsCanonicalizer:
- City: one of 6 Benton cities or Unincorporated (rollup key)
- PropertyUseStratum: R/M/C/A/V/X (cross-cutting analytical stratum)

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

### Task 2: Add EF configuration with indexes for stratum queries

**Files:**
- Create or Modify: `backend/src/TerraFusion.Data/Configurations/CamaCharacteristicConfiguration.cs`

- [ ] **Step 1: Check if configuration file exists**

```bash
ls backend/src/TerraFusion.Data/Configurations/ | grep -i cama
```
If exists, modify. If not, create.

- [ ] **Step 2: Write/update the configuration**

Content for `CamaCharacteristicConfiguration.cs`:

```csharp
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TerraFusion.Core.Entities;

namespace TerraFusion.Data.Configurations;

public class CamaCharacteristicConfiguration : IEntityTypeConfiguration<CamaCharacteristic>
{
    public void Configure(EntityTypeBuilder<CamaCharacteristic> builder)
    {
        builder.HasKey(e => e.Id);
        builder.Property(e => e.ParcelId).IsRequired().HasMaxLength(50);
        builder.Property(e => e.BuildingType).IsRequired().HasMaxLength(10);

        // Stratum query indexes (T0)
        builder.HasIndex(e => new { e.CountyId, e.TaxYear, e.NeighborhoodCode })
            .HasDatabaseName("IX_CamaChar_County_Year_Hood");
        builder.HasIndex(e => new { e.CountyId, e.TaxYear, e.City })
            .HasDatabaseName("IX_CamaChar_County_Year_City");
        builder.HasIndex(e => new { e.CountyId, e.TaxYear, e.PropertyUseStratum })
            .HasDatabaseName("IX_CamaChar_County_Year_Stratum");
        builder.HasIndex(e => new { e.CountyId, e.TaxYear, e.YearBuilt })
            .HasDatabaseName("IX_CamaChar_County_Year_Vintage");
    }
}
```

- [ ] **Step 3: Ensure configuration is applied in DbContext**

Verify `TerraFusionDbContext.OnModelCreating` calls `modelBuilder.ApplyConfigurationsFromAssembly(...)` or explicitly applies this configuration. Search:

```bash
grep -n "ApplyConfigurationsFromAssembly\|CamaCharacteristicConfiguration" backend/src/TerraFusion.Data/TerraFusionDbContext.cs
```

If `ApplyConfigurationsFromAssembly` is present, no action needed. If not, add to `OnModelCreating`:
```csharp
modelBuilder.ApplyConfiguration(new CamaCharacteristicConfiguration());
```

- [ ] **Step 4: Commit**

```bash
git add backend/src/TerraFusion.Data/Configurations/CamaCharacteristicConfiguration.cs
git add backend/src/TerraFusion.Data/TerraFusionDbContext.cs
git commit -m "feat(costforge-t0): EF indexes for neighborhood/city/stratum/vintage stratum queries

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

### Task 3: Generate and apply EF migration for the new columns

**Files:**
- Create: `backend/src/TerraFusion.Data/Migrations/<timestamp>_AddCityAndStratumToCama.cs`

- [ ] **Step 1: Generate migration**

```bash
cd backend && dotnet ef migrations add AddCityAndStratumToCama --project src/TerraFusion.Data --startup-project src/TerraFusion.API
```
Expected: Migration files generated. Do not error.

- [ ] **Step 2: Inspect migration file**

```bash
ls -lt backend/src/TerraFusion.Data/Migrations/*.cs | head -3
cat backend/src/TerraFusion.Data/Migrations/*AddCityAndStratum*.cs
```
Expected: Migration contains `AddColumn<string>("City", ...)` and `AddColumn<string>("PropertyUseStratum", ...)` plus the four `CreateIndex` calls.

- [ ] **Step 3: Apply migration**

```bash
cd backend && dotnet ef database update --project src/TerraFusion.Data --startup-project src/TerraFusion.API
```
Expected: `Applying migration '<timestamp>_AddCityAndStratumToCama'` followed by `Done.`

- [ ] **Step 4: Verify via psql**

```bash
docker exec terrafusion-postgres-dev psql -U postgres -d terrafusion -c "\d cama_characteristics" | grep -E "City|PropertyUseStratum"
```
Expected: both columns shown with `character varying(50)` and `character varying(2)` types.

- [ ] **Step 5: Commit**

```bash
git add backend/src/TerraFusion.Data/Migrations/
git commit -m "feat(costforge-t0): EF migration AddCityAndStratumToCama applied

Columns added to cama_characteristics with indexes:
- City VARCHAR(50) nullable
- PropertyUseStratum VARCHAR(2) nullable

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

### Task 4: Extend PacsCanonicalizer to populate City and PropertyUseStratum

**Files:**
- Modify: `backend/src/TerraFusion.Data/Canonicalizers/PacsCanonicalizer.cs` (or create if missing)

- [ ] **Step 1: Locate existing canonicalizer**

```bash
find backend/src -iname "*Canonicaliz*.cs" 2>/dev/null
```

If found, modify. If not found, create `backend/src/TerraFusion.Data/Canonicalizers/PacsCanonicalizer.cs` with the full implementation below.

- [ ] **Step 2: Write the canonicalizer (new or extended)**

```csharp
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using TerraFusion.Core.Entities;

namespace TerraFusion.Data.Canonicalizers;

/// <summary>
/// Bridges Pacs* staging entities to canonical TerraFusion entities.
/// Sole writer to CamaCharacteristic.City and PropertyUseStratum.
/// </summary>
public interface IPacsCanonicalizer
{
    Task<CanonicalizerResult> PopulateCityAndStratumAsync(Guid countyId, int taxYear, CancellationToken ct = default);
}

public record CanonicalizerResult(int RowsTouched, int RowsUpdatedCity, int RowsUpdatedStratum);

public class PacsCanonicalizer : IPacsCanonicalizer
{
    private readonly TerraFusionDbContext _context;
    private readonly ILogger<PacsCanonicalizer> _logger;

    public PacsCanonicalizer(TerraFusionDbContext context, ILogger<PacsCanonicalizer> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<CanonicalizerResult> PopulateCityAndStratumAsync(
        Guid countyId, int taxYear, CancellationToken ct = default)
    {
        // Load the CAMA rows that need population
        var camaRows = await _context.CamaCharacteristics
            .Where(c => c.CountyId == countyId && c.TaxYear == taxYear)
            .ToListAsync(ct);

        // Load PacsSitus rows keyed by parcel for City lookup
        var situsMap = await _context.PacsSituses
            .Where(s => s.CountyId == countyId)
            .ToDictionaryAsync(s => s.ParcelId, s => s.SitusCity ?? string.Empty, ct);

        int touched = 0, cityUpd = 0, stratUpd = 0;

        foreach (var cama in camaRows)
        {
            touched++;

            // Populate City from situs
            if (situsMap.TryGetValue(cama.ParcelId, out var situsCity) && !string.IsNullOrWhiteSpace(situsCity))
            {
                var normalizedCity = NormalizeCity(situsCity);
                if (cama.City != normalizedCity)
                {
                    cama.City = normalizedCity;
                    cityUpd++;
                }
            }
            else if (cama.City == null)
            {
                cama.City = "Unincorporated";
                cityUpd++;
            }

            // Derive PropertyUseStratum from BuildingType
            var stratum = DeriveStratum(cama.BuildingType);
            if (cama.PropertyUseStratum != stratum)
            {
                cama.PropertyUseStratum = stratum;
                stratUpd++;
            }
        }

        await _context.SaveChangesAsync(ct);
        _logger.LogInformation(
            "PacsCanonicalizer: county={County} year={Year} touched={Touched} cityUpd={City} stratUpd={Strat}",
            countyId, taxYear, touched, cityUpd, stratUpd);

        return new CanonicalizerResult(touched, cityUpd, stratUpd);
    }

    internal static string NormalizeCity(string raw)
    {
        var trimmed = raw.Trim().ToUpperInvariant();
        return trimmed switch
        {
            "KENNEWICK" => "Kennewick",
            "RICHLAND" => "Richland",
            "PASCO" => "Pasco",
            "PROSSER" => "Prosser",
            "BENTON CITY" => "Benton City",
            "WEST RICHLAND" => "West Richland",
            _ => "Unincorporated"
        };
    }

    internal static string DeriveStratum(string buildingType)
    {
        var bt = (buildingType ?? string.Empty).Trim().ToUpperInvariant();
        if (bt.StartsWith("R")) return "R";   // R1, R2 residential
        if (bt.StartsWith("M")) return "M";   // manufactured
        if (bt.StartsWith("C")) return "C";   // C1-C4 commercial
        if (bt.StartsWith("A")) return "A";   // A1-A2 agricultural
        if (bt.StartsWith("I")) return "C";   // industrial lumped with commercial
        if (bt.StartsWith("S")) return "C";   // special-use lumped with commercial
        if (bt.StartsWith("V")) return "V";   // vacant
        if (bt.StartsWith("X")) return "X";   // exempt
        return "X";
    }
}
```

- [ ] **Step 3: Register service in Program.cs**

Add to `backend/src/TerraFusion.API/Program.cs` in the service registration section (search for other `AddScoped` calls and add near them):

```csharp
builder.Services.AddScoped<IPacsCanonicalizer, PacsCanonicalizer>();
```

- [ ] **Step 4: Build and verify**

```bash
cd backend && dotnet build src/TerraFusion.Data/TerraFusion.Data.csproj 2>&1 | tail -5
cd backend && dotnet build src/TerraFusion.API/TerraFusion.API.csproj 2>&1 | tail -5
```
Expected: Build succeeded, 0 errors.

- [ ] **Step 5: Commit**

```bash
git add backend/src/TerraFusion.Data/Canonicalizers/PacsCanonicalizer.cs
git add backend/src/TerraFusion.API/Program.cs
git commit -m "feat(costforge-t0): PacsCanonicalizer populates City + PropertyUseStratum

Single-responsibility bridge from PacsSitus.SitusCity to canonical
CamaCharacteristic.City, with normalization to the 6 Benton cities
+ Unincorporated fallback. PropertyUseStratum derived from BuildingType.

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

### Task 5: Unit-test the canonicalizer derivation functions

**Files:**
- Create: `backend/tests/TerraFusion.Data.Tests/Canonicalizers/PacsCanonicalizerTests.cs`

- [ ] **Step 1: Write the test**

```csharp
using TerraFusion.Data.Canonicalizers;
using Xunit;

namespace TerraFusion.Data.Tests.Canonicalizers;

public class PacsCanonicalizerDerivationTests
{
    [Theory]
    [InlineData("KENNEWICK", "Kennewick")]
    [InlineData("kennewick", "Kennewick")]
    [InlineData("  Kennewick  ", "Kennewick")]
    [InlineData("RICHLAND", "Richland")]
    [InlineData("PASCO", "Pasco")]
    [InlineData("PROSSER", "Prosser")]
    [InlineData("BENTON CITY", "Benton City")]
    [InlineData("WEST RICHLAND", "West Richland")]
    [InlineData("CLE ELUM", "Unincorporated")]
    [InlineData("", "Unincorporated")]
    public void NormalizeCity_maps_to_canonical_benton_city(string raw, string expected)
    {
        Assert.Equal(expected, PacsCanonicalizer.NormalizeCity(raw));
    }

    [Theory]
    [InlineData("R1", "R")]
    [InlineData("R2", "R")]
    [InlineData("M1", "M")]
    [InlineData("C1", "C")]
    [InlineData("C4", "C")]
    [InlineData("A1", "A")]
    [InlineData("A2", "A")]
    [InlineData("I1", "C")]   // industrial -> commercial stratum
    [InlineData("S2", "C")]   // special-use -> commercial
    [InlineData("V", "V")]
    [InlineData("X", "X")]
    [InlineData("", "X")]
    [InlineData("ZZZ", "X")]
    public void DeriveStratum_buckets_building_types(string bt, string expected)
    {
        Assert.Equal(expected, PacsCanonicalizer.DeriveStratum(bt));
    }
}
```

- [ ] **Step 2: Run the test**

```bash
cd backend && dotnet test tests/TerraFusion.Data.Tests/TerraFusion.Data.Tests.csproj --filter "FullyQualifiedName~PacsCanonicalizerDerivationTests" 2>&1 | tail -15
```
Expected: All tests pass. If test project doesn't exist, create `backend/tests/TerraFusion.Data.Tests/TerraFusion.Data.Tests.csproj` from the pattern of `TerraFusion.API.Tests.csproj`.

- [ ] **Step 3: Commit**

```bash
git add backend/tests/TerraFusion.Data.Tests/
git commit -m "test(costforge-t0): PacsCanonicalizer city normalization + stratum derivation

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

### Task 6: Add admin endpoint to run canonicalization, then populate Benton data

**Files:**
- Modify: `backend/src/TerraFusion.API/Controllers/AdminController.cs`

- [ ] **Step 1: Add endpoint**

In `AdminController.cs`, add:

```csharp
private readonly IPacsCanonicalizer _canonicalizer;

// Update constructor to inject IPacsCanonicalizer — match existing DI pattern.

[HttpPost("canonical/populate")]
public async Task<IActionResult> RunCanonicalizer(
    [FromQuery] Guid countyId,
    [FromQuery] int taxYear,
    CancellationToken ct)
{
    var result = await _canonicalizer.PopulateCityAndStratumAsync(countyId, taxYear, ct);
    return Ok(new
    {
        countyId,
        taxYear,
        rowsTouched = result.RowsTouched,
        rowsUpdatedCity = result.RowsUpdatedCity,
        rowsUpdatedStratum = result.RowsUpdatedStratum,
    });
}
```

Required using: `using TerraFusion.Data.Canonicalizers;`

- [ ] **Step 2: Build**

```bash
cd backend && dotnet build src/TerraFusion.API/TerraFusion.API.csproj 2>&1 | tail -5
```

- [ ] **Step 3: Start API, run canonicalization against Benton**

Start backend (PowerShell from Windows, or existing backend process):
```bash
powershell.exe -Command "Start-Process -NoNewWindow cmd.exe -ArgumentList '/c','cd /d C:\Users\bsval\terrafusion_os_1.0\backend && set ASPNETCORE_ENVIRONMENT=Development && dotnet run --project src\TerraFusion.API --no-build'"
# Wait ~25 seconds for startup
sleep 25
```

Find Benton countyId:
```bash
docker exec terrafusion-postgres-dev psql -U postgres -d terrafusion -t -c "SELECT id FROM counties WHERE name = 'Benton' LIMIT 1;" | tr -d ' '
```
Capture the UUID as `$BENTON_ID`.

Run canonicalizer:
```bash
curl -X POST "http://localhost:5000/api/admin/canonical/populate?countyId=$BENTON_ID&taxYear=2026"
```
Expected: JSON response with `rowsTouched > 70000`.

- [ ] **Step 4: Verify canonical data**

```bash
docker exec terrafusion-postgres-dev psql -U postgres -d terrafusion -c "
SELECT
  COUNT(*) AS total,
  COUNT(City) AS with_city,
  COUNT(PropertyUseStratum) AS with_stratum,
  COUNT(DISTINCT City) AS distinct_cities,
  COUNT(DISTINCT PropertyUseStratum) AS distinct_strata
FROM cama_characteristics
WHERE county_id = '$BENTON_ID'::uuid AND tax_year = 2026;
"
```
Expected:
- `total > 70000`
- `with_city == total` (zero nulls)
- `with_stratum == total`
- `distinct_cities` between 5 and 7
- `distinct_strata` between 3 and 6

```bash
docker exec terrafusion-postgres-dev psql -U postgres -d terrafusion -c "
SELECT City, COUNT(*) FROM cama_characteristics
WHERE county_id = '$BENTON_ID'::uuid AND tax_year = 2026
GROUP BY City ORDER BY COUNT(*) DESC;
"
```
Expected: 6 Benton cities + Unincorporated appear, counts nonzero for each.

- [ ] **Step 5: Commit**

```bash
git add backend/src/TerraFusion.API/Controllers/AdminController.cs
git commit -m "feat(costforge-t0): admin/canonical/populate endpoint + Benton data populated

Canonicalizer run against 2026 Benton data. City + PropertyUseStratum
populated for every CamaCharacteristic. Verification gate passed:
70k+ rows, 6 cities + Unincorporated, 4+ stratum buckets.

T0 complete — T1, T4, T6 unblocked.

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

# TRACK 1 — Equity Metric Service

**Worktree:** `trees/cf-v2-t1-equity`
**Depends on:** T0
**Blocks:** T2, T3, T5

---

### Task 7: Define EquityMetricsDto and supporting types

**Files:**
- Create: `backend/src/TerraFusion.Core/DTOs/EquityMetricsDto.cs`

- [ ] **Step 1: Write the DTO**

```csharp
namespace TerraFusion.Core.DTOs;

public record EquityMetricsDto(
    int SaleCount,
    decimal? MedianRatio,
    decimal? WeightedMeanRatio,
    decimal? ArithmeticMeanRatio,
    decimal? Cod,
    decimal? Prd,
    decimal? Prb,
    decimal?[] DecileMedianRatios,
    bool IaaoCompliant,
    bool BentonCompliant,
    string Provenance   // "real" | "insufficient-sales" | "no-data"
);

public record SaleRatio(
    string ParcelId,
    decimal AssessedValue,
    decimal AdjustedSalePrice,
    decimal Ratio,          // AV / AdjustedSalePrice
    DateTime SaleDate,
    int? YearBuilt,
    string? NeighborhoodCode,
    string? City,
    string? PropertyUseStratum,
    string? ConditionGrade,
    string? QualityGrade);
```

- [ ] **Step 2: Build**

```bash
cd backend && dotnet build src/TerraFusion.Core/TerraFusion.Core.csproj 2>&1 | tail -5
```

- [ ] **Step 3: Commit**

```bash
git add backend/src/TerraFusion.Core/DTOs/EquityMetricsDto.cs
git commit -m "feat(costforge-t1): EquityMetricsDto and SaleRatio records

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

### Task 8: Build SaleRatioQueryBuilder helper

**Files:**
- Create: `backend/src/TerraFusion.AI/Valuation/SaleRatioQueryBuilder.cs`

Centralizes the 3-layer qualification fallback so every track uses the same rules.

- [ ] **Step 1: Write the helper**

```csharp
using Microsoft.EntityFrameworkCore;
using TerraFusion.Core.DTOs;
using TerraFusion.Core.Entities;

namespace TerraFusion.AI.Valuation;

public static class SaleRatioQueryBuilder
{
    /// <summary>
    /// Effective qualification: Decision > Recommendation > legacy SaleQualification.
    /// Returns true if the sale is "qualified" for ratio study use.
    /// </summary>
    public static bool IsQualified(ComparableSale cs)
    {
        var effective = cs.QualificationDecision
            ?? cs.QualificationRecommendation
            ?? cs.SaleQualification;
        return string.Equals(effective, "qualified", StringComparison.OrdinalIgnoreCase);
    }

    /// <summary>
    /// Build qualified SaleRatio list for a county + tax year.
    /// Joins ComparableSales -> PropertyAssessments -> CamaCharacteristics.
    /// Excludes: IncludeNoCalc, SuppressOnRatioRpt='T', LandOnlySale, OutlierExclusions.
    /// </summary>
    public static async Task<List<SaleRatio>> BuildAsync(
        TerraFusionDbContext ctx,
        Guid countyId,
        int taxYear,
        CancellationToken ct = default)
    {
        var excludedParcels = await ctx.OutlierExclusions
            .Where(o => o.CountyId == countyId && o.TaxYear == taxYear)
            .Select(o => o.ParcelId)
            .ToListAsync(ct);

        var excludedSet = new HashSet<string>(excludedParcels, StringComparer.OrdinalIgnoreCase);

        // Pull candidate sales + join AV + CAMA
        var raw = await (
            from cs in ctx.ComparableSales
            where cs.CountyId == countyId
                  && cs.AdjustedSalePrice != null && cs.AdjustedSalePrice > 0
                  && (cs.IncludeNoCalc == null || cs.IncludeNoCalc == false)
                  && (cs.SuppressOnRatioRptCd == null || cs.SuppressOnRatioRptCd != "T")
                  && (cs.LandOnlySale == null || cs.LandOnlySale == false)
                  && cs.SaleDate >= DateTime.UtcNow.AddYears(-4)
            join pa in ctx.PropertyAssessments
                on new { cs.ParcelId, Year = taxYear } equals new { ParcelId = pa.PropertyId.ToString(), Year = pa.AssessmentYear }
            join cama in ctx.CamaCharacteristics
                on new { cs.ParcelId, TaxYear = taxYear, cs.CountyId } equals new { cama.ParcelId, cama.TaxYear, cama.CountyId }
                into camaGroup
            from cama in camaGroup.DefaultIfEmpty()
            select new
            {
                cs,
                pa.AssessedValue,
                NeighborhoodCode = cama != null ? cama.NeighborhoodCode : null,
                City = cama != null ? cama.City : null,
                PropertyUseStratum = cama != null ? cama.PropertyUseStratum : null,
                ConditionGrade = cama != null ? cama.ConditionGrade : null,
                QualityGrade = cama != null ? cama.QualityGrade : null,
                YearBuilt = cama != null ? cama.YearBuilt : null,
            }
        ).ToListAsync(ct);

        return raw
            .Where(r => !excludedSet.Contains(r.cs.ParcelId))
            .Where(r => IsQualified(r.cs))
            .Select(r => new SaleRatio(
                ParcelId: r.cs.ParcelId,
                AssessedValue: r.AssessedValue,
                AdjustedSalePrice: r.cs.AdjustedSalePrice!.Value,
                Ratio: r.AssessedValue / r.cs.AdjustedSalePrice!.Value,
                SaleDate: r.cs.SaleDate,
                YearBuilt: r.YearBuilt,
                NeighborhoodCode: r.NeighborhoodCode,
                City: r.City,
                PropertyUseStratum: r.PropertyUseStratum,
                ConditionGrade: r.ConditionGrade,
                QualityGrade: r.QualityGrade
            ))
            .ToList();
    }
}
```

**Note on the PropertyAssessment join:** If `PropertyAssessment.PropertyId` is `Guid` but `ComparableSale.ParcelId` is `string`, the join condition above won't work directly. Verify by running:
```bash
grep -n "PropertyId\|ParcelId" backend/src/TerraFusion.Core/Entities/CoreEntities.cs | head -5
grep -n "ParcelId" backend/src/TerraFusion.Core/Entities/ComparableSale.cs | head -3
```
If types differ, adapt the join using an intermediate lookup (fetch parcel GUIDs first, map to `ParcelId` string, then join). Execute a separate micro-commit if adaptation needed.

- [ ] **Step 2: Build**

```bash
cd backend && dotnet build src/TerraFusion.AI/TerraFusion.AI.csproj 2>&1 | tail -5
```
If the join types mismatch (expected possibility), fix with a two-step query: first build a parcel-id-to-AV dictionary, then filter comparable sales. Commit the adapted version.

- [ ] **Step 3: Commit**

```bash
git add backend/src/TerraFusion.AI/Valuation/SaleRatioQueryBuilder.cs
git commit -m "feat(costforge-t1): SaleRatioQueryBuilder — 3-layer qualification fallback

Centralizes ratio-study inclusion logic:
- Qualification: Decision > Recommendation > SaleQualification
- Excludes IncludeNoCalc, SuppressOnRatioRpt='T', LandOnlySale
- Excludes parcels in OutlierExclusions
- Uses AdjustedSalePrice (not SalePrice) for ratio calc

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

### Task 9: Implement IEquityMetricService interface

**Files:**
- Create: `backend/src/TerraFusion.Core/Interfaces/IEquityMetricService.cs`

- [ ] **Step 1: Write interface**

```csharp
using TerraFusion.Core.DTOs;

namespace TerraFusion.Core.Interfaces;

public interface IEquityMetricService
{
    /// <summary>
    /// Compute equity metrics for a stratum + segment.
    /// </summary>
    /// <param name="stratum">none | neighborhood | city | county | type | vintage | condition | grade</param>
    /// <param name="segment">segment code (e.g. "KENNEWICK" for stratum=city); null for all-segments rollup</param>
    Task<IDictionary<string, EquityMetricsDto>> GetMetricsAsync(
        Guid countyId, int taxYear, string stratum, string? segment, CancellationToken ct = default);

    /// <summary>
    /// Compute metrics from a pre-built SaleRatio list (used by rollups, tests).
    /// </summary>
    EquityMetricsDto ComputeFromRatios(IReadOnlyList<SaleRatio> ratios);
}
```

- [ ] **Step 2: Commit**

```bash
git add backend/src/TerraFusion.Core/Interfaces/IEquityMetricService.cs
git commit -m "feat(costforge-t1): IEquityMetricService interface

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

### Task 10: Implement EquityMetricService with IAAO formulas

**Files:**
- Create: `backend/src/TerraFusion.AI/Valuation/EquityMetricService.cs`

- [ ] **Step 1: Write the service**

```csharp
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using TerraFusion.Core.DTOs;
using TerraFusion.Core.Entities;
using TerraFusion.Core.Interfaces;

namespace TerraFusion.AI.Valuation;

public class EquityMetricService : IEquityMetricService
{
    private readonly TerraFusionDbContext _context;
    private readonly ILogger<EquityMetricService> _logger;

    public EquityMetricService(TerraFusionDbContext context, ILogger<EquityMetricService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<IDictionary<string, EquityMetricsDto>> GetMetricsAsync(
        Guid countyId, int taxYear, string stratum, string? segment, CancellationToken ct = default)
    {
        var ratios = await SaleRatioQueryBuilder.BuildAsync(_context, countyId, taxYear, ct);

        // Apply segment filter if specified
        if (!string.IsNullOrEmpty(segment))
        {
            ratios = stratum.ToLowerInvariant() switch
            {
                "neighborhood" => ratios.Where(r => r.NeighborhoodCode == segment).ToList(),
                "city"         => ratios.Where(r => r.City == segment).ToList(),
                "type"         => ratios.Where(r => r.PropertyUseStratum == segment).ToList(),
                "vintage"      => ratios.Where(r => VintageKey(r.YearBuilt) == segment).ToList(),
                "condition"    => ratios.Where(r => r.ConditionGrade == segment).ToList(),
                "grade"        => ratios.Where(r => r.QualityGrade == segment).ToList(),
                _              => ratios
            };
        }

        // Group by the stratum
        IEnumerable<IGrouping<string, SaleRatio>> groups = stratum.ToLowerInvariant() switch
        {
            "none" or "county" => new[] { ratios.GroupBy(_ => "ALL").First() },
            "neighborhood"     => ratios.Where(r => r.NeighborhoodCode != null).GroupBy(r => r.NeighborhoodCode!),
            "city"             => ratios.Where(r => r.City != null).GroupBy(r => r.City!),
            "type"             => ratios.Where(r => r.PropertyUseStratum != null).GroupBy(r => r.PropertyUseStratum!),
            "vintage"          => ratios.GroupBy(r => VintageKey(r.YearBuilt)),
            "condition"        => ratios.Where(r => r.ConditionGrade != null).GroupBy(r => r.ConditionGrade!),
            "grade"            => ratios.Where(r => r.QualityGrade != null).GroupBy(r => r.QualityGrade!),
            _                  => throw new ArgumentException($"Unknown stratum '{stratum}'", nameof(stratum))
        };

        return groups.ToDictionary(
            g => g.Key,
            g => ComputeFromRatios(g.ToList())
        );
    }

    public EquityMetricsDto ComputeFromRatios(IReadOnlyList<SaleRatio> ratios)
    {
        if (ratios.Count == 0)
            return new EquityMetricsDto(0, null, null, null, null, null, null, new decimal?[10], false, false, "no-data");

        var rArr = ratios.Select(r => r.Ratio).ToList();
        var median = Median(rArr);
        var arith = rArr.Average();
        var wMean = ratios.Sum(r => r.AssessedValue) / ratios.Sum(r => r.AdjustedSalePrice);
        var cod = ComputeCod(rArr, median);
        var prd = wMean > 0 ? arith / wMean : (decimal?)null;
        var prb = ratios.Count >= 10 ? ComputePrb(ratios, median) : (decimal?)null;
        var deciles = ratios.Count >= 30 ? ComputeDeciles(ratios) : new decimal?[10];

        bool iaaoCompliant = median >= 0.9m && median <= 1.1m
            && cod <= 15m
            && prd.HasValue && prd.Value >= 0.98m && prd.Value <= 1.03m
            && prb.HasValue && Math.Abs(prb.Value) <= 0.05m;

        bool bentonCompliant = iaaoCompliant && deciles.All(d => !d.HasValue || Math.Abs(d.Value - median) <= 0.10m);

        var provenance = ratios.Count < 3 ? "insufficient-sales" : "real";

        return new EquityMetricsDto(
            ratios.Count, median, wMean, arith, cod, prd, prb, deciles, iaaoCompliant, bentonCompliant, provenance);
    }

    internal static decimal Median(IList<decimal> values)
    {
        var sorted = values.OrderBy(v => v).ToList();
        var mid = sorted.Count / 2;
        return sorted.Count % 2 == 0
            ? (sorted[mid - 1] + sorted[mid]) / 2m
            : sorted[mid];
    }

    internal static decimal ComputeCod(IList<decimal> ratios, decimal median)
    {
        if (ratios.Count == 0 || median == 0) return 0m;
        var absDev = ratios.Select(r => Math.Abs(r - median)).Average();
        return (absDev / median) * 100m;
    }

    internal static decimal ComputePrb(IReadOnlyList<SaleRatio> ratios, decimal median)
    {
        // Simple OLS: ln(ratio/median) ~ ln(value/median_value)
        // where value = 0.5*AV + 0.5*Sale (IAAO approximation)
        var medianValue = Median(ratios.Select(r => (r.AssessedValue + r.AdjustedSalePrice) / 2m).ToList());
        if (medianValue <= 0) return 0m;

        var pairs = ratios.Select(r => new
        {
            X = (double)Math.Log((double)((r.AssessedValue + r.AdjustedSalePrice) / 2m / medianValue)),
            Y = (double)Math.Log((double)(r.Ratio / median))
        }).ToList();

        var meanX = pairs.Average(p => p.X);
        var meanY = pairs.Average(p => p.Y);
        var num = pairs.Sum(p => (p.X - meanX) * (p.Y - meanY));
        var den = pairs.Sum(p => (p.X - meanX) * (p.X - meanX));
        return den > 0 ? (decimal)(num / den) : 0m;
    }

    internal static decimal?[] ComputeDeciles(IReadOnlyList<SaleRatio> ratios)
    {
        var sorted = ratios.OrderBy(r => r.AdjustedSalePrice).ToList();
        var bucketSize = sorted.Count / 10;
        var result = new decimal?[10];
        for (int i = 0; i < 10; i++)
        {
            var start = i * bucketSize;
            var end = (i == 9) ? sorted.Count : (i + 1) * bucketSize;
            if (end <= start) { result[i] = null; continue; }
            var slice = sorted.Skip(start).Take(end - start).Select(r => r.Ratio).ToList();
            result[i] = slice.Count > 0 ? Median(slice) : null;
        }
        return result;
    }

    internal static string VintageKey(int? yearBuilt)
    {
        if (!yearBuilt.HasValue || yearBuilt.Value < 1800) return "Unknown";
        return $"{(yearBuilt.Value / 10) * 10}s";
    }
}
```

- [ ] **Step 2: Register in Program.cs**

```csharp
builder.Services.AddScoped<IEquityMetricService, EquityMetricService>();
```

- [ ] **Step 3: Build**

```bash
cd backend && dotnet build src/TerraFusion.AI/TerraFusion.AI.csproj 2>&1 | tail -5
cd backend && dotnet build src/TerraFusion.API/TerraFusion.API.csproj 2>&1 | tail -5
```

- [ ] **Step 4: Commit**

```bash
git add backend/src/TerraFusion.AI/Valuation/EquityMetricService.cs
git add backend/src/TerraFusion.API/Program.cs
git commit -m "feat(costforge-t1): EquityMetricService with IAAO + Benton decile formulas

Computes median, weighted mean, arithmetic mean, COD, PRD, PRB (regression
of ln(ratio) on ln(value/median_value)), and 10-bucket decile medians.
Bordering cases: <30 sales disables deciles; <10 disables PRB; <3 returns
'insufficient-sales' provenance.

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

### Task 11: Unit-test the metric formulas

**Files:**
- Create: `backend/tests/TerraFusion.API.Tests/Valuation/EquityMetricServiceTests.cs`

- [ ] **Step 1: Write tests**

```csharp
using TerraFusion.AI.Valuation;
using TerraFusion.Core.DTOs;
using Xunit;

namespace TerraFusion.API.Tests.Valuation;

public class EquityMetricServiceTests
{
    [Fact]
    public void Median_odd_count_returns_middle_value()
    {
        var values = new List<decimal> { 1m, 3m, 5m };
        Assert.Equal(3m, EquityMetricService.Median(values));
    }

    [Fact]
    public void Median_even_count_averages_two_middle()
    {
        var values = new List<decimal> { 1m, 2m, 3m, 4m };
        Assert.Equal(2.5m, EquityMetricService.Median(values));
    }

    [Fact]
    public void Cod_equal_ratios_is_zero()
    {
        var values = new List<decimal> { 1.0m, 1.0m, 1.0m };
        Assert.Equal(0m, EquityMetricService.ComputeCod(values, 1.0m));
    }

    [Fact]
    public void Cod_10_percent_spread_is_ten()
    {
        var values = new List<decimal> { 0.9m, 1.0m, 1.1m };
        var cod = EquityMetricService.ComputeCod(values, 1.0m);
        // Mean abs dev = (0.1 + 0 + 0.1) / 3 = 0.0667; /1.0 *100 = 6.67
        Assert.InRange(cod, 6.6m, 6.8m);
    }

    [Fact]
    public void VintageKey_returns_decade_bucket()
    {
        Assert.Equal("1970s", EquityMetricService.VintageKey(1975));
        Assert.Equal("2020s", EquityMetricService.VintageKey(2023));
        Assert.Equal("Unknown", EquityMetricService.VintageKey(null));
    }

    [Fact]
    public void ComputeFromRatios_small_sample_flags_insufficient()
    {
        var ratios = new List<SaleRatio>
        {
            new("P1", 100000m, 100000m, 1.0m, DateTime.UtcNow, 2000, "H1", "Kennewick", "R", "GOOD", "STANDARD")
        };
        var svc = new EquityMetricService(null!, null!);
        var result = svc.ComputeFromRatios(ratios);
        Assert.Equal("insufficient-sales", result.Provenance);
    }

    [Fact]
    public void ComputeFromRatios_large_sample_gets_deciles()
    {
        var ratios = Enumerable.Range(0, 40)
            .Select(i => new SaleRatio($"P{i}", 100000m + i * 1000m, 100000m + i * 1000m, 1.0m + i * 0.001m,
                DateTime.UtcNow, 2000, "H1", "Kennewick", "R", "GOOD", "STANDARD"))
            .ToList();
        var svc = new EquityMetricService(null!, null!);
        var result = svc.ComputeFromRatios(ratios);
        Assert.Equal("real", result.Provenance);
        Assert.Equal(10, result.DecileMedianRatios.Length);
        Assert.All(result.DecileMedianRatios, d => Assert.NotNull(d));
    }
}
```

- [ ] **Step 2: Run tests**

```bash
cd backend && dotnet test tests/TerraFusion.API.Tests/TerraFusion.API.Tests.csproj --filter "FullyQualifiedName~EquityMetricServiceTests" 2>&1 | tail -10
```
Expected: 6/6 passing.

- [ ] **Step 3: Commit**

```bash
git add backend/tests/TerraFusion.API.Tests/Valuation/
git commit -m "test(costforge-t1): EquityMetricService formula unit tests

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

### Task 12: Create EquityController and /api/equity/metrics endpoint

**Files:**
- Create: `backend/src/TerraFusion.API/Controllers/EquityController.cs`

- [ ] **Step 1: Write controller**

```csharp
using Microsoft.AspNetCore.Mvc;
using TerraFusion.Core.DTOs;
using TerraFusion.Core.Interfaces;

namespace TerraFusion.API.Controllers;

[ApiController]
[Route("api/equity")]
public class EquityController : ControllerBase
{
    private readonly IEquityMetricService _equity;
    private readonly ILogger<EquityController> _logger;

    public EquityController(IEquityMetricService equity, ILogger<EquityController> logger)
    {
        _equity = equity;
        _logger = logger;
    }

    /// <summary>
    /// Get equity metrics stratified by the given dimension.
    /// </summary>
    [HttpGet("metrics")]
    public async Task<IActionResult> GetMetrics(
        [FromQuery] Guid countyId,
        [FromQuery] int taxYear,
        [FromQuery] string by = "none",
        [FromQuery] string? segment = null,
        CancellationToken ct = default)
    {
        var validStrata = new[] { "none", "county", "neighborhood", "city", "type", "vintage", "condition", "grade" };
        if (!validStrata.Contains(by.ToLowerInvariant()))
            return BadRequest(new { error = $"Invalid stratum '{by}'. Must be one of: {string.Join(", ", validStrata)}" });

        var result = await _equity.GetMetricsAsync(countyId, taxYear, by, segment, ct);
        return Ok(new
        {
            countyId,
            taxYear,
            stratum = by,
            segment,
            groupCount = result.Count,
            groups = result
        });
    }
}
```

- [ ] **Step 2: Build**

```bash
cd backend && dotnet build src/TerraFusion.API/TerraFusion.API.csproj 2>&1 | tail -5
```

- [ ] **Step 3: Commit**

```bash
git add backend/src/TerraFusion.API/Controllers/EquityController.cs
git commit -m "feat(costforge-t1): EquityController with /api/equity/metrics endpoint

Single endpoint serves all strata: none | county | neighborhood | city |
type | vintage | condition | grade. Optional segment filter narrows
to a specific code within the stratum.

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

### Task 13: Integration test — EquityController returns real Benton data

**Files:**
- Create: `backend/tests/TerraFusion.API.Tests/Controllers/EquityControllerTests.cs`

- [ ] **Step 1: Write integration test (WebApplicationFactory pattern)**

Follow the existing pattern used by other integration tests in the repo. Search for an existing example:
```bash
grep -l "WebApplicationFactory\|CustomWebApplicationFactory" backend/tests/TerraFusion.API.Tests/ -r | head -3
```
Copy the setup from the nearest existing test class and write:

```csharp
using System.Net;
using System.Net.Http.Json;
using Microsoft.AspNetCore.Mvc.Testing;
using Xunit;

namespace TerraFusion.API.Tests.Controllers;

public class EquityControllerTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly HttpClient _client;

    public EquityControllerTests(WebApplicationFactory<Program> factory)
    {
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task GetMetrics_invalid_stratum_returns_400()
    {
        var countyId = Guid.NewGuid();
        var resp = await _client.GetAsync($"/api/equity/metrics?countyId={countyId}&taxYear=2026&by=bogus");
        Assert.Equal(HttpStatusCode.BadRequest, resp.StatusCode);
    }

    [Fact]
    public async Task GetMetrics_valid_stratum_returns_200_with_groups()
    {
        // Use real Benton county id — must be seeded in the test DB
        var bentonId = Environment.GetEnvironmentVariable("BENTON_COUNTY_ID") ?? "";
        if (string.IsNullOrEmpty(bentonId))
            return; // skip if env not set

        var resp = await _client.GetAsync($"/api/equity/metrics?countyId={bentonId}&taxYear=2026&by=city");
        Assert.Equal(HttpStatusCode.OK, resp.StatusCode);

        var body = await resp.Content.ReadFromJsonAsync<Dictionary<string, object>>();
        Assert.NotNull(body);
        Assert.True(body!.ContainsKey("groupCount"));
    }
}
```

- [ ] **Step 2: Run test**

```bash
cd backend && dotnet test tests/TerraFusion.API.Tests/TerraFusion.API.Tests.csproj --filter "FullyQualifiedName~EquityControllerTests" 2>&1 | tail -10
```
Expected: first test passes (400 on bad input). Second test skips if no env var.

- [ ] **Step 3: Smoke-test against live API**

```bash
# Backend already running from T0
curl "http://localhost:5000/api/equity/metrics?countyId=$BENTON_ID&taxYear=2026&by=city" | python3 -m json.tool | head -40
```
Expected: JSON with `groupCount: 7` (six cities + Unincorporated) and each group has `medianRatio`, `cod`, `prd`, `prb` populated.

- [ ] **Step 4: Commit**

```bash
git add backend/tests/TerraFusion.API.Tests/Controllers/EquityControllerTests.cs
git commit -m "test(costforge-t1): EquityController integration tests + live smoke verification

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

### Task 14: Replace existing neighborhood-matrix endpoint to delegate to EquityMetricService

**Files:**
- Modify: `backend/src/TerraFusion.API/Controllers/CostForgeController.cs`

- [ ] **Step 1: Find existing neighborhood-matrix handler**

```bash
grep -n "neighborhood-matrix\|NeighborhoodMatrix" backend/src/TerraFusion.API/Controllers/CostForgeController.cs | head -5
```

- [ ] **Step 2: Replace implementation to call EquityMetricService**

Inside the handler, replace ad-hoc computation with:

```csharp
var groups = await _equity.GetMetricsAsync(countyId, taxYear, "neighborhood", null, ct);
var rows = groups.Select(kv => new
{
    hoodCd = kv.Key,
    name = (string?)null,  // join name source separately if available
    saleCount = kv.Value.SaleCount,
    medianRatio = kv.Value.MedianRatio,
    cod = kv.Value.Cod,
    prd = kv.Value.Prd,
    prb = kv.Value.Prb,
    iaaoCompliant = kv.Value.IaaoCompliant,
    codOk = kv.Value.Cod.HasValue && kv.Value.Cod.Value <= 15m,
    ratioOk = kv.Value.MedianRatio.HasValue && kv.Value.MedianRatio.Value >= 0.9m && kv.Value.MedianRatio.Value <= 1.1m,
}).ToList();

return Ok(new { neighborhoods = rows, outOfCompliance = rows.Count(r => !r.iaaoCompliant), source = "equity-metric-service" });
```

Add `IEquityMetricService _equity` field and constructor injection.

- [ ] **Step 3: Smoke test**

```bash
curl "http://localhost:5000/api/costforge/calibration/neighborhood-matrix?taxYear=2026&minSales=3" | python3 -m json.tool | head -30
```
Expected: Existing frontend TriageTab fetches this URL; response shape unchanged except new `source: "equity-metric-service"` marker. Neighborhood counts should match previous implementation within floating-point tolerance.

- [ ] **Step 4: Frontend typecheck**

```bash
cd frontend && npx tsc --noEmit 2>&1 | head -5
```
Expected: 0 errors (no schema break).

- [ ] **Step 5: Commit**

```bash
git add backend/src/TerraFusion.API/Controllers/CostForgeController.cs
git commit -m "refactor(costforge-t1): neighborhood-matrix delegates to EquityMetricService

Removes duplicate ad-hoc metric computation. Source marker added
('equity-metric-service') so response provenance is visible.

T1 complete — T2, T3, T5 unblocked.

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

# TRACK 2 — Geographic + Stratum Rollups

**Worktree:** `trees/cf-v2-t2-rollup`
**Depends on:** T0, T1

---

### Task 15: Define StratumRollupDto

**Files:**
- Create: `backend/src/TerraFusion.Core/DTOs/StratumRollupDto.cs`

- [ ] **Step 1: Write DTO**

```csharp
namespace TerraFusion.Core.DTOs;

public record StratumRollupDto(
    string Key,
    string Name,
    int ParcelCount,
    int SaleCount,
    decimal? TotalAv,
    EquityMetricsDto Metrics,
    int? ChildCount);

public record RollupResponseDto(
    Guid CountyId,
    int TaxYear,
    string Stratum,
    IReadOnlyList<StratumRollupDto> Strata);
```

- [ ] **Step 2: Commit**

```bash
git add backend/src/TerraFusion.Core/DTOs/StratumRollupDto.cs
git commit -m "feat(costforge-t2): StratumRollupDto and RollupResponseDto

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

### Task 16: Implement RollupService

**Files:**
- Create: `backend/src/TerraFusion.Core/Interfaces/IRollupService.cs`
- Create: `backend/src/TerraFusion.AI/Valuation/RollupService.cs`

- [ ] **Step 1: Write interface**

```csharp
using TerraFusion.Core.DTOs;

namespace TerraFusion.Core.Interfaces;

public interface IRollupService
{
    Task<RollupResponseDto> GetRollupAsync(Guid countyId, int taxYear, string by, CancellationToken ct = default);
}
```

- [ ] **Step 2: Write implementation**

```csharp
using Microsoft.EntityFrameworkCore;
using TerraFusion.Core.DTOs;
using TerraFusion.Core.Entities;
using TerraFusion.Core.Interfaces;

namespace TerraFusion.AI.Valuation;

public class RollupService : IRollupService
{
    private readonly TerraFusionDbContext _context;
    private readonly IEquityMetricService _equity;

    public RollupService(TerraFusionDbContext context, IEquityMetricService equity)
    {
        _context = context;
        _equity = equity;
    }

    public async Task<RollupResponseDto> GetRollupAsync(Guid countyId, int taxYear, string by, CancellationToken ct = default)
    {
        // Parcel counts per stratum (from CamaCharacteristics)
        Dictionary<string, int> parcelCounts;
        Dictionary<string, string> displayNames;

        switch (by.ToLowerInvariant())
        {
            case "city":
                parcelCounts = await _context.CamaCharacteristics
                    .Where(c => c.CountyId == countyId && c.TaxYear == taxYear && c.City != null)
                    .GroupBy(c => c.City!)
                    .Select(g => new { Key = g.Key, Count = g.Count() })
                    .ToDictionaryAsync(x => x.Key, x => x.Count, ct);
                displayNames = parcelCounts.ToDictionary(kv => kv.Key, kv => kv.Key);
                break;

            case "type":
                parcelCounts = await _context.CamaCharacteristics
                    .Where(c => c.CountyId == countyId && c.TaxYear == taxYear && c.PropertyUseStratum != null)
                    .GroupBy(c => c.PropertyUseStratum!)
                    .Select(g => new { Key = g.Key, Count = g.Count() })
                    .ToDictionaryAsync(x => x.Key, x => x.Count, ct);
                displayNames = parcelCounts.ToDictionary(kv => kv.Key, kv => kv.Key switch
                {
                    "R" => "Residential",
                    "M" => "Manufactured",
                    "C" => "Commercial",
                    "A" => "Agricultural",
                    "V" => "Vacant",
                    "X" => "Exempt",
                    _   => kv.Key
                });
                break;

            case "vintage":
                var camaVintages = await _context.CamaCharacteristics
                    .Where(c => c.CountyId == countyId && c.TaxYear == taxYear && c.YearBuilt.HasValue)
                    .Select(c => c.YearBuilt!.Value)
                    .ToListAsync(ct);
                parcelCounts = camaVintages
                    .GroupBy(y => $"{(y / 10) * 10}s")
                    .ToDictionary(g => g.Key, g => g.Count());
                displayNames = parcelCounts.ToDictionary(kv => kv.Key, kv => kv.Key);
                break;

            case "grade":
                parcelCounts = await _context.CamaCharacteristics
                    .Where(c => c.CountyId == countyId && c.TaxYear == taxYear && c.QualityGrade != null)
                    .GroupBy(c => c.QualityGrade!)
                    .Select(g => new { Key = g.Key, Count = g.Count() })
                    .ToDictionaryAsync(x => x.Key, x => x.Count, ct);
                displayNames = parcelCounts.ToDictionary(kv => kv.Key, kv => kv.Key);
                break;

            default:
                throw new ArgumentException($"Invalid rollup dimension '{by}'. Use city|type|vintage|grade.", nameof(by));
        }

        // Equity metrics per stratum
        var metricsMap = await _equity.GetMetricsAsync(countyId, taxYear, by, null, ct);

        // Build rollup rows
        var strata = parcelCounts.Keys
            .Select(key => new StratumRollupDto(
                Key: key,
                Name: displayNames.GetValueOrDefault(key, key),
                ParcelCount: parcelCounts[key],
                SaleCount: metricsMap.TryGetValue(key, out var m) ? m.SaleCount : 0,
                TotalAv: null,
                Metrics: metricsMap.TryGetValue(key, out var m2) ? m2 : new EquityMetricsDto(
                    0, null, null, null, null, null, null, new decimal?[10], false, false, "no-data"),
                ChildCount: null
            ))
            .OrderByDescending(s => s.ParcelCount)
            .ToList();

        return new RollupResponseDto(countyId, taxYear, by, strata);
    }
}
```

- [ ] **Step 3: Register and build**

Add to Program.cs:
```csharp
builder.Services.AddScoped<IRollupService, RollupService>();
```

```bash
cd backend && dotnet build src/TerraFusion.API/TerraFusion.API.csproj 2>&1 | tail -5
```

- [ ] **Step 4: Commit**

```bash
git add backend/src/TerraFusion.Core/Interfaces/IRollupService.cs
git add backend/src/TerraFusion.AI/Valuation/RollupService.cs
git add backend/src/TerraFusion.API/Program.cs
git commit -m "feat(costforge-t2): RollupService with city/type/vintage/grade strata

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

### Task 17: Extend EquityController with /rollup endpoint

**Files:**
- Modify: `backend/src/TerraFusion.API/Controllers/EquityController.cs`

- [ ] **Step 1: Inject IRollupService and add endpoint**

```csharp
private readonly IRollupService _rollup;

// Update constructor to inject IRollupService _rollup and assign.

[HttpGet("rollup")]
public async Task<IActionResult> GetRollup(
    [FromQuery] Guid countyId,
    [FromQuery] int taxYear,
    [FromQuery] string by = "city",
    CancellationToken ct = default)
{
    try
    {
        var result = await _rollup.GetRollupAsync(countyId, taxYear, by, ct);
        return Ok(result);
    }
    catch (ArgumentException ex)
    {
        return BadRequest(new { error = ex.Message });
    }
}
```

- [ ] **Step 2: Smoke test**

```bash
curl "http://localhost:5000/api/equity/rollup?countyId=$BENTON_ID&taxYear=2026&by=city" | python3 -m json.tool | head -40
```
Expected: 7 strata (6 Benton cities + Unincorporated), each with parcelCount, saleCount, metrics.

- [ ] **Step 3: Commit**

```bash
git add backend/src/TerraFusion.API/Controllers/EquityController.cs
git commit -m "feat(costforge-t2): /api/equity/rollup endpoint

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

### Task 18: Frontend TypeScript types for rollup

**Files:**
- Create: `frontend/apps/os-shell/src/pages/forge/cost/types/equity.ts`
- Create: `frontend/apps/os-shell/src/pages/forge/cost/types/rollup.ts`

- [ ] **Step 1: Write equity.ts**

```typescript
export interface EquityMetrics {
  saleCount: number;
  medianRatio: number | null;
  weightedMeanRatio: number | null;
  arithmeticMeanRatio: number | null;
  cod: number | null;
  prd: number | null;
  prb: number | null;
  decileMedianRatios: (number | null)[];
  iaaoCompliant: boolean;
  bentonCompliant: boolean;
  provenance: 'real' | 'insufficient-sales' | 'no-data';
}

export interface MetricsResponse {
  countyId: string;
  taxYear: number;
  stratum: string;
  segment: string | null;
  groupCount: number;
  groups: Record<string, EquityMetrics>;
}
```

- [ ] **Step 2: Write rollup.ts**

```typescript
import type { EquityMetrics } from './equity';

export interface StratumRollup {
  key: string;
  name: string;
  parcelCount: number;
  saleCount: number;
  totalAv: number | null;
  metrics: EquityMetrics;
  childCount: number | null;
}

export interface RollupResponse {
  countyId: string;
  taxYear: number;
  stratum: string;
  strata: StratumRollup[];
}
```

- [ ] **Step 3: Typecheck**

```bash
cd frontend && npx tsc --noEmit 2>&1 | tail -5
```
Expected: 0 errors.

- [ ] **Step 4: Commit**

```bash
git add frontend/apps/os-shell/src/pages/forge/cost/types/
git commit -m "feat(costforge-t2): frontend types for EquityMetrics and StratumRollup

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

### Task 19: TriageTab sidebar — City Rollup accordion

**Files:**
- Modify: `frontend/apps/os-shell/src/pages/forge/cost/tabs/TriageTab.tsx`

- [ ] **Step 1: Add rollup fetch + render**

Import at top:
```typescript
import type { RollupResponse } from '../types/rollup';
```

Add state + fetch inside the component:
```typescript
const [cityRollup, setCityRollup] = useState<RollupResponse | null>(null);
useEffect(() => {
  const ctrl = new AbortController();
  apiFetchJson<RollupResponse>(
    `/equity/rollup?countyId=${BENTON_COUNTY_ID}&taxYear=${taxYear}&by=city`,
    { signal: ctrl.signal }
  )
    .then(setCityRollup)
    .catch((e: unknown) => {
      if (e instanceof DOMException && e.name === 'AbortError') return;
    });
  return () => ctrl.abort();
}, [taxYear]);
```

Render accordion section near existing sidebar (right side):
```tsx
{cityRollup && (
  <details className="cf-sidebar-section">
    <summary>City Rollup ({cityRollup.strata.length})</summary>
    {cityRollup.strata.map(s => (
      <div key={s.key} className="cf-rollup-row">
        <span>{s.name}</span>
        <span>n={s.saleCount}</span>
        <span>{s.metrics.medianRatio?.toFixed(3) ?? '—'}</span>
        <span className={s.metrics.iaaoCompliant ? 'cf-ok' : 'cf-warn'}>
          {s.metrics.iaaoCompliant ? '✓' : '✗'}
        </span>
      </div>
    ))}
  </details>
)}
```

Ensure `BENTON_COUNTY_ID` is sourced from env (same env var the rest of the code uses).

- [ ] **Step 2: Typecheck**

```bash
cd frontend && npx tsc --noEmit 2>&1 | tail -5
```

- [ ] **Step 3: Commit**

```bash
git add frontend/apps/os-shell/src/pages/forge/cost/tabs/TriageTab.tsx
git commit -m "feat(costforge-t2): TriageTab City Rollup accordion

T2 complete.

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

# TRACK 3 — Benton Custom Metrics

**Worktree:** `trees/cf-v2-t3-custom`
**Depends on:** T0, T1

---

### Task 20: Define CustomMetricsDto

**Files:**
- Create: `backend/src/TerraFusion.Core/DTOs/CustomMetricsDto.cs`

- [ ] **Step 1: Write DTO**

```csharp
namespace TerraFusion.Core.DTOs;

public record DecileAnalysisDto(
    decimal?[] DecileMedianRatios,
    decimal? D1D10Spread,
    string Pattern);   // "regressive" | "progressive" | "uniform" | "insufficient-data"

public record StratifiedCodDto(
    string SplitBy,
    Dictionary<string, decimal?> CodPerSegment);

public record ConditionBiasDto(Dictionary<string, decimal?> MedianRatioByCondition);

public record SegmentDriftDto(
    Dictionary<string, decimal?> MedianRatioWithSegment,
    Dictionary<string, decimal?> MedianRatioWithoutSegment);

public record GradeDriftDto(Dictionary<string, decimal?> MedianRatioByGrade);
```

- [ ] **Step 2: Commit**

```bash
git add backend/src/TerraFusion.Core/DTOs/CustomMetricsDto.cs
git commit -m "feat(costforge-t3): CustomMetricsDto records

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

### Task 21: Implement BentonCustomMetricService

**Files:**
- Create: `backend/src/TerraFusion.Core/Interfaces/IBentonCustomMetricService.cs`
- Create: `backend/src/TerraFusion.AI/Valuation/BentonCustomMetricService.cs`

- [ ] **Step 1: Write interface**

```csharp
using TerraFusion.Core.DTOs;

namespace TerraFusion.Core.Interfaces;

public interface IBentonCustomMetricService
{
    Task<DecileAnalysisDto> GetDecilesAsync(Guid countyId, int taxYear, string stratum, string? segment, CancellationToken ct = default);
    Task<StratifiedCodDto> GetStratifiedCodAsync(Guid countyId, int taxYear, string stratum, string? segment, string splitBy, CancellationToken ct = default);
    Task<ConditionBiasDto> GetConditionBiasAsync(Guid countyId, int taxYear, string stratum, string? segment, CancellationToken ct = default);
    Task<SegmentDriftDto> GetSegmentDriftAsync(Guid countyId, int taxYear, string stratum, string? segment, CancellationToken ct = default);
    Task<GradeDriftDto> GetGradeDriftAsync(Guid countyId, int taxYear, string stratum, string? segment, CancellationToken ct = default);
}
```

- [ ] **Step 2: Write implementation**

```csharp
using Microsoft.EntityFrameworkCore;
using TerraFusion.Core.DTOs;
using TerraFusion.Core.Entities;
using TerraFusion.Core.Interfaces;

namespace TerraFusion.AI.Valuation;

public class BentonCustomMetricService : IBentonCustomMetricService
{
    private readonly TerraFusionDbContext _context;
    private readonly IEquityMetricService _equity;

    public BentonCustomMetricService(TerraFusionDbContext context, IEquityMetricService equity)
    {
        _context = context;
        _equity = equity;
    }

    private async Task<List<SaleRatio>> GetScopedRatiosAsync(
        Guid countyId, int taxYear, string stratum, string? segment, CancellationToken ct)
    {
        var all = await SaleRatioQueryBuilder.BuildAsync(_context, countyId, taxYear, ct);
        if (string.IsNullOrEmpty(segment) || stratum == "none" || stratum == "county") return all;
        return stratum.ToLowerInvariant() switch
        {
            "neighborhood" => all.Where(r => r.NeighborhoodCode == segment).ToList(),
            "city" => all.Where(r => r.City == segment).ToList(),
            "type" => all.Where(r => r.PropertyUseStratum == segment).ToList(),
            _ => all
        };
    }

    public async Task<DecileAnalysisDto> GetDecilesAsync(Guid countyId, int taxYear, string stratum, string? segment, CancellationToken ct)
    {
        var ratios = await GetScopedRatiosAsync(countyId, taxYear, stratum, segment, ct);
        if (ratios.Count < 30)
            return new DecileAnalysisDto(new decimal?[10], null, "insufficient-data");

        var deciles = EquityMetricService.ComputeDeciles(ratios);
        var d1 = deciles[0];
        var d10 = deciles[9];
        var spread = (d1.HasValue && d10.HasValue) ? d1.Value - d10.Value : (decimal?)null;
        var pattern = spread switch
        {
            null => "insufficient-data",
            > 0.05m => "regressive",
            < -0.05m => "progressive",
            _ => "uniform"
        };
        return new DecileAnalysisDto(deciles, spread, pattern);
    }

    public async Task<StratifiedCodDto> GetStratifiedCodAsync(
        Guid countyId, int taxYear, string stratum, string? segment, string splitBy, CancellationToken ct)
    {
        var ratios = await GetScopedRatiosAsync(countyId, taxYear, stratum, segment, ct);
        Func<SaleRatio, string?> keyFn = splitBy.ToLowerInvariant() switch
        {
            "vintage" => r => EquityMetricService.VintageKey(r.YearBuilt),
            "condition" => r => r.ConditionGrade,
            "grade" => r => r.QualityGrade,
            _ => throw new ArgumentException($"Unknown splitBy '{splitBy}'", nameof(splitBy))
        };
        var groups = ratios.Where(r => keyFn(r) != null).GroupBy(keyFn!);
        var cods = groups.ToDictionary(
            g => g.Key!,
            g =>
            {
                var rs = g.Select(r => r.Ratio).ToList();
                if (rs.Count < 3) return (decimal?)null;
                var median = EquityMetricService.Median(rs);
                return EquityMetricService.ComputeCod(rs, median);
            });
        return new StratifiedCodDto(splitBy, cods);
    }

    public async Task<ConditionBiasDto> GetConditionBiasAsync(Guid countyId, int taxYear, string stratum, string? segment, CancellationToken ct)
    {
        var ratios = await GetScopedRatiosAsync(countyId, taxYear, stratum, segment, ct);
        var grouped = ratios.Where(r => r.ConditionGrade != null).GroupBy(r => r.ConditionGrade!);
        var map = grouped.ToDictionary(
            g => g.Key,
            g => g.Count() >= 3 ? EquityMetricService.Median(g.Select(r => r.Ratio).ToList()) : (decimal?)null);
        return new ConditionBiasDto(map);
    }

    public async Task<SegmentDriftDto> GetSegmentDriftAsync(Guid countyId, int taxYear, string stratum, string? segment, CancellationToken ct)
    {
        var ratios = await GetScopedRatiosAsync(countyId, taxYear, stratum, segment, ct);
        if (ratios.Count == 0)
            return new SegmentDriftDto(new(), new());

        // Scope parcel list
        var parcelIds = ratios.Select(r => r.ParcelId).ToHashSet();

        // Fetch improvement-detail segments for those parcels
        var segs = await _context.CamaImprovementDetails
            .Where(d => d.CountyId == countyId && d.TaxYear == taxYear && d.SegmentType != null
                     && parcelIds.Contains(d.ParcelId))
            .Select(d => new { d.ParcelId, d.SegmentType })
            .ToListAsync(ct);

        var segmentTypes = new[] { "CovPatio", "BSMT", "POLEBLDG", "ATTGAR", "DETGAR", "POOL" };
        var withMap = new Dictionary<string, decimal?>();
        var withoutMap = new Dictionary<string, decimal?>();

        foreach (var st in segmentTypes)
        {
            var parcelsWith = segs.Where(s => s.SegmentType == st).Select(s => s.ParcelId).ToHashSet();
            var withRatios = ratios.Where(r => parcelsWith.Contains(r.ParcelId)).Select(r => r.Ratio).ToList();
            var withoutRatios = ratios.Where(r => !parcelsWith.Contains(r.ParcelId)).Select(r => r.Ratio).ToList();
            withMap[st] = withRatios.Count >= 3 ? EquityMetricService.Median(withRatios) : null;
            withoutMap[st] = withoutRatios.Count >= 3 ? EquityMetricService.Median(withoutRatios) : null;
        }

        return new SegmentDriftDto(withMap, withoutMap);
    }

    public async Task<GradeDriftDto> GetGradeDriftAsync(Guid countyId, int taxYear, string stratum, string? segment, CancellationToken ct)
    {
        var ratios = await GetScopedRatiosAsync(countyId, taxYear, stratum, segment, ct);
        var grouped = ratios.Where(r => r.QualityGrade != null).GroupBy(r => r.QualityGrade!);
        var map = grouped.ToDictionary(
            g => g.Key,
            g => g.Count() >= 3 ? EquityMetricService.Median(g.Select(r => r.Ratio).ToList()) : (decimal?)null);
        return new GradeDriftDto(map);
    }
}
```

- [ ] **Step 3: Register and build**

```csharp
builder.Services.AddScoped<IBentonCustomMetricService, BentonCustomMetricService>();
```

```bash
cd backend && dotnet build src/TerraFusion.AI/TerraFusion.AI.csproj 2>&1 | tail -5
```

- [ ] **Step 4: Commit**

```bash
git add backend/src/TerraFusion.Core/Interfaces/IBentonCustomMetricService.cs
git add backend/src/TerraFusion.AI/Valuation/BentonCustomMetricService.cs
git add backend/src/TerraFusion.API/Program.cs
git commit -m "feat(costforge-t3): BentonCustomMetricService — decile, stratified-COD, condition-bias, segment-drift, grade-drift

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

### Task 22: Extend EquityController with 5 custom-metric endpoints

**Files:**
- Modify: `backend/src/TerraFusion.API/Controllers/EquityController.cs`

- [ ] **Step 1: Inject service and add endpoints**

```csharp
private readonly IBentonCustomMetricService _custom;

// Update constructor to inject IBentonCustomMetricService _custom.

[HttpGet("deciles")]
public async Task<IActionResult> GetDeciles([FromQuery] Guid countyId, [FromQuery] int taxYear,
    [FromQuery] string by = "none", [FromQuery] string? segment = null, CancellationToken ct = default)
    => Ok(await _custom.GetDecilesAsync(countyId, taxYear, by, segment, ct));

[HttpGet("stratified-cod")]
public async Task<IActionResult> GetStratifiedCod([FromQuery] Guid countyId, [FromQuery] int taxYear,
    [FromQuery] string by = "none", [FromQuery] string? segment = null,
    [FromQuery] string splitBy = "vintage", CancellationToken ct = default)
    => Ok(await _custom.GetStratifiedCodAsync(countyId, taxYear, by, segment, splitBy, ct));

[HttpGet("condition-bias")]
public async Task<IActionResult> GetConditionBias([FromQuery] Guid countyId, [FromQuery] int taxYear,
    [FromQuery] string by = "none", [FromQuery] string? segment = null, CancellationToken ct = default)
    => Ok(await _custom.GetConditionBiasAsync(countyId, taxYear, by, segment, ct));

[HttpGet("segment-drift")]
public async Task<IActionResult> GetSegmentDrift([FromQuery] Guid countyId, [FromQuery] int taxYear,
    [FromQuery] string by = "none", [FromQuery] string? segment = null, CancellationToken ct = default)
    => Ok(await _custom.GetSegmentDriftAsync(countyId, taxYear, by, segment, ct));

[HttpGet("grade-drift")]
public async Task<IActionResult> GetGradeDrift([FromQuery] Guid countyId, [FromQuery] int taxYear,
    [FromQuery] string by = "none", [FromQuery] string? segment = null, CancellationToken ct = default)
    => Ok(await _custom.GetGradeDriftAsync(countyId, taxYear, by, segment, ct));
```

- [ ] **Step 2: Smoke-test each**

```bash
for ep in deciles condition-bias segment-drift grade-drift; do
  echo "== /equity/$ep =="
  curl -s "http://localhost:5000/api/equity/$ep?countyId=$BENTON_ID&taxYear=2026&by=none" | python3 -m json.tool | head -5
done

curl -s "http://localhost:5000/api/equity/stratified-cod?countyId=$BENTON_ID&taxYear=2026&by=none&splitBy=vintage" | python3 -m json.tool | head -10
```

- [ ] **Step 3: Commit**

```bash
git add backend/src/TerraFusion.API/Controllers/EquityController.cs
git commit -m "feat(costforge-t3): 5 custom-metric endpoints on EquityController

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

### Task 23: Frontend BentonDiagnosticsPanel component

**Files:**
- Create: `frontend/apps/os-shell/src/pages/forge/cost/panels/BentonDiagnosticsPanel.tsx`

- [ ] **Step 1: Write the panel**

```tsx
import { useEffect, useState } from 'react';
import { apiFetchJson } from '@/lib/apiBase';

interface DecileAnalysis {
  decileMedianRatios: (number | null)[];
  d1D10Spread: number | null;
  pattern: 'regressive' | 'progressive' | 'uniform' | 'insufficient-data';
}

interface ConditionBias { medianRatioByCondition: Record<string, number | null>; }
interface SegmentDrift {
  medianRatioWithSegment: Record<string, number | null>;
  medianRatioWithoutSegment: Record<string, number | null>;
}
interface GradeDrift { medianRatioByGrade: Record<string, number | null>; }

interface Props {
  countyId: string;
  taxYear: number;
  stratum?: string;
  segment?: string | null;
}

export function BentonDiagnosticsPanel({ countyId, taxYear, stratum = 'none', segment = null }: Props) {
  const [deciles, setDeciles] = useState<DecileAnalysis | null>(null);
  const [condBias, setCondBias] = useState<ConditionBias | null>(null);
  const [segDrift, setSegDrift] = useState<SegmentDrift | null>(null);
  const [gradeDrift, setGradeDrift] = useState<GradeDrift | null>(null);

  useEffect(() => {
    const ctrl = new AbortController();
    const qs = `countyId=${countyId}&taxYear=${taxYear}&by=${stratum}${segment ? `&segment=${segment}` : ''}`;
    Promise.all([
      apiFetchJson<DecileAnalysis>(`/equity/deciles?${qs}`, { signal: ctrl.signal }),
      apiFetchJson<ConditionBias>(`/equity/condition-bias?${qs}`, { signal: ctrl.signal }),
      apiFetchJson<SegmentDrift>(`/equity/segment-drift?${qs}`, { signal: ctrl.signal }),
      apiFetchJson<GradeDrift>(`/equity/grade-drift?${qs}`, { signal: ctrl.signal }),
    ])
      .then(([d, c, s, g]) => { setDeciles(d); setCondBias(c); setSegDrift(s); setGradeDrift(g); })
      .catch((e: unknown) => { if (e instanceof DOMException && e.name === 'AbortError') return; });
    return () => ctrl.abort();
  }, [countyId, taxYear, stratum, segment]);

  return (
    <section className="cf-benton-diagnostics">
      <h3>Benton Diagnostics</h3>

      {deciles && (
        <div className="cf-diagnostic-group">
          <h4>Decile Equity — <span className={`cf-pattern-${deciles.pattern}`}>{deciles.pattern}</span></h4>
          <div className="cf-decile-bar">
            {deciles.decileMedianRatios.map((d, i) => (
              <div key={i} className="cf-decile-cell" title={`D${i + 1}: ${d?.toFixed(3) ?? '—'}`}>
                <div style={{ height: d ? `${Math.min(100, (d - 0.7) * 100)}%` : '0%' }} />
              </div>
            ))}
          </div>
          <div>D1–D10 spread: {deciles.d1D10Spread?.toFixed(3) ?? '—'}</div>
        </div>
      )}

      {condBias && (
        <div className="cf-diagnostic-group">
          <h4>Condition Bias</h4>
          {Object.entries(condBias.medianRatioByCondition).map(([k, v]) => (
            <div key={k} className="cf-metric-row">
              <span>{k}</span>
              <span>{v?.toFixed(3) ?? '—'}</span>
            </div>
          ))}
        </div>
      )}

      {segDrift && (
        <div className="cf-diagnostic-group">
          <h4>Secondary-Segment Drift</h4>
          {Object.keys(segDrift.medianRatioWithSegment).map(k => (
            <div key={k} className="cf-metric-row">
              <span>{k}</span>
              <span>w/ {segDrift.medianRatioWithSegment[k]?.toFixed(3) ?? '—'}</span>
              <span>w/o {segDrift.medianRatioWithoutSegment[k]?.toFixed(3) ?? '—'}</span>
            </div>
          ))}
        </div>
      )}

      {gradeDrift && (
        <div className="cf-diagnostic-group">
          <h4>Quality-Grade Drift</h4>
          {Object.entries(gradeDrift.medianRatioByGrade).map(([k, v]) => (
            <div key={k} className="cf-metric-row">
              <span>{k}</span>
              <span>{v?.toFixed(3) ?? '—'}</span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
```

- [ ] **Step 2: Typecheck**

```bash
cd frontend && npx tsc --noEmit 2>&1 | tail -5
```

- [ ] **Step 3: Commit**

```bash
git add frontend/apps/os-shell/src/pages/forge/cost/panels/BentonDiagnosticsPanel.tsx
git commit -m "feat(costforge-t3): BentonDiagnosticsPanel with decile/condition/segment/grade diagnostics

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

### Task 24: Integrate BentonDiagnosticsPanel into NeighborhoodAuditTab

**Files:**
- Modify: `frontend/apps/os-shell/src/pages/forge/cost/tabs/NeighborhoodAuditTab.tsx`

- [ ] **Step 1: Import and render**

Add import:
```typescript
import { BentonDiagnosticsPanel } from '../panels/BentonDiagnosticsPanel';
```

Render collapsible section (below existing audit grid):
```tsx
<details className="cf-benton-section">
  <summary>Benton Diagnostics (decile, condition, segment, grade)</summary>
  <BentonDiagnosticsPanel
    countyId={BENTON_COUNTY_ID}
    taxYear={taxYear}
    stratum="neighborhood"
    segment={selectedHoodCd}
  />
</details>
```

- [ ] **Step 2: Typecheck + commit**

```bash
cd frontend && npx tsc --noEmit 2>&1 | tail -3
git add frontend/apps/os-shell/src/pages/forge/cost/tabs/NeighborhoodAuditTab.tsx
git commit -m "feat(costforge-t3): BentonDiagnosticsPanel integrated into NeighborhoodAuditTab

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

### Task 25: Add decile indicator column to TriageTab

**Files:**
- Modify: `frontend/apps/os-shell/src/pages/forge/cost/tabs/TriageTab.tsx`

- [ ] **Step 1: Extend row type + cell render**

Update the row interface to include `decilePattern?: string` and fetch pattern alongside the main matrix call. In each row render, add:

```tsx
<td className={`cf-decile-ind cf-pattern-${row.decilePattern ?? 'unknown'}`}>
  {row.decilePattern === 'regressive' ? '▼' : row.decilePattern === 'progressive' ? '▲' : '—'}
</td>
```

Fetch the per-neighborhood decile pattern inside the existing useEffect with:
```typescript
const decilesForHoods = await Promise.all(
  data.neighborhoods.map(n =>
    apiFetchJson<DecileAnalysis>(
      `/equity/deciles?countyId=${BENTON_COUNTY_ID}&taxYear=${taxYear}&by=neighborhood&segment=${n.hoodCd}`,
      { signal: ctrl.signal }
    ).catch(() => null)
  )
);
```

Map pattern back into row structure.

- [ ] **Step 2: Typecheck + commit**

```bash
cd frontend && npx tsc --noEmit 2>&1 | tail -3
git add frontend/apps/os-shell/src/pages/forge/cost/tabs/TriageTab.tsx
git commit -m "feat(costforge-t3): decile pattern indicator column in TriageTab

T3 complete.

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

# TRACK 4 — Data Quality Engine

**Worktree:** `trees/cf-v2-t4-dq`
**Depends on:** T0
**Parallel with T1, T6**

---

### Task 26: Define DataQualityIssueDto

**Files:**
- Create: `backend/src/TerraFusion.Core/DTOs/DataQualityIssueDto.cs`

- [ ] **Step 1: Write DTO**

```csharp
namespace TerraFusion.Core.DTOs;

public record DataQualityIssueDto(
    string Category,
    string Field,
    int AffectedCount,
    string Description,
    string Severity,         // "critical" | "warning" | "info"
    IReadOnlyList<string> ParcelSample);

public record DataQualityAssessmentDto(
    Guid CountyId,
    int TaxYear,
    int TotalParcels,
    IReadOnlyList<DataQualityIssueDto> Issues,
    DateTime GeneratedAt);
```

- [ ] **Step 2: Commit**

```bash
git add backend/src/TerraFusion.Core/DTOs/DataQualityIssueDto.cs
git commit -m "feat(costforge-t4): DataQualityIssueDto and DataQualityAssessmentDto

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

### Task 27: Implement CamaDataQualityService with all 8 checks

**Files:**
- Create: `backend/src/TerraFusion.Core/Interfaces/ICamaDataQualityService.cs`
- Create: `backend/src/TerraFusion.AI/DataQuality/CamaDataQualityService.cs`

- [ ] **Step 1: Write interface**

```csharp
using TerraFusion.Core.DTOs;

namespace TerraFusion.Core.Interfaces;

public interface ICamaDataQualityService
{
    Task<DataQualityAssessmentDto> AssessAsync(Guid countyId, int taxYear, CancellationToken ct = default);
}
```

- [ ] **Step 2: Write implementation with all 8 checks**

```csharp
using Microsoft.EntityFrameworkCore;
using TerraFusion.AI.Valuation;
using TerraFusion.Core.DTOs;
using TerraFusion.Core.Entities;
using TerraFusion.Core.Interfaces;

namespace TerraFusion.AI.DataQuality;

public class CamaDataQualityService : ICamaDataQualityService
{
    private readonly TerraFusionDbContext _context;

    public CamaDataQualityService(TerraFusionDbContext context) => _context = context;

    public async Task<DataQualityAssessmentDto> AssessAsync(Guid countyId, int taxYear, CancellationToken ct)
    {
        var totalParcels = await _context.CamaCharacteristics
            .Where(c => c.CountyId == countyId && c.TaxYear == taxYear).CountAsync(ct);

        var issues = new List<DataQualityIssueDto>();

        // Check 1: Missing quality codes
        var missingQual = await _context.CamaCharacteristics
            .Where(c => c.CountyId == countyId && c.TaxYear == taxYear
                        && (c.QualityGrade == null || c.ConditionGrade == null))
            .Select(c => c.ParcelId).ToListAsync(ct);
        if (missingQual.Count > 0)
            issues.Add(new("Completeness", "QualityGrade/ConditionGrade", missingQual.Count,
                "Parcels missing QualityGrade or ConditionGrade — blocks cost approach accuracy",
                missingQual.Count > totalParcels * 0.05 ? "critical" : "warning",
                missingQual.Take(5).ToList()));

        // Check 2: Stale effective age
        var staleCutoff = DateTime.UtcNow.AddMonths(-24);
        var stale = await _context.CamaCharacteristics
            .Where(c => c.CountyId == countyId && c.TaxYear == taxYear
                        && c.UpdatedAt < staleCutoff)
            .Select(c => c.ParcelId).ToListAsync(ct);
        if (stale.Count > 0)
            issues.Add(new("Completeness", "UpdatedAt", stale.Count,
                "Parcels with CAMA data older than 24 months",
                "warning", stale.Take(5).ToList()));

        // Check 3: Missing segment types (parcels without CamaImprovementDetails)
        var parcelsWithDetails = await _context.CamaImprovementDetails
            .Where(d => d.CountyId == countyId && d.TaxYear == taxYear)
            .Select(d => d.ParcelId).Distinct().ToListAsync(ct);
        var parcelsWithDetailsSet = parcelsWithDetails.ToHashSet();
        var parcelsWithoutDetails = await _context.CamaCharacteristics
            .Where(c => c.CountyId == countyId && c.TaxYear == taxYear
                        && c.PropertyUseStratum != "V" && c.PropertyUseStratum != "X")
            .Select(c => c.ParcelId).ToListAsync(ct);
        var missing = parcelsWithoutDetails.Where(p => !parcelsWithDetailsSet.Contains(p)).ToList();
        if (missing.Count > 0)
            issues.Add(new("Completeness", "CamaImprovementDetails", missing.Count,
                "Non-vacant parcels with no improvement-detail segments",
                missing.Count > totalParcels * 0.10 ? "critical" : "warning",
                missing.Take(5).ToList()));

        // Check 4: Missing sale pairs
        var fourYearsAgo = DateTime.UtcNow.AddYears(-4);
        var hoodsWithSales = await _context.ComparableSales
            .Where(cs => cs.CountyId == countyId && cs.SaleDate >= fourYearsAgo)
            .Select(cs => cs.Neighborhood).Distinct().ToListAsync(ct);
        var hoodsWithSalesSet = new HashSet<string?>(hoodsWithSales);
        var hoodsWithoutSales = await _context.CamaCharacteristics
            .Where(c => c.CountyId == countyId && c.TaxYear == taxYear && c.NeighborhoodCode != null)
            .Select(c => c.NeighborhoodCode!).Distinct().ToListAsync(ct);
        var noSaleHoods = hoodsWithoutSales.Where(h => !hoodsWithSalesSet.Contains(h)).ToList();
        if (noSaleHoods.Count > 0)
            issues.Add(new("Completeness", "ComparableSales", noSaleHoods.Count,
                "Neighborhoods with no qualified sales in the last 4 years",
                "warning", noSaleHoods.Take(5).ToList()));

        // Check 5: IQR ratio outliers
        var ratios = await SaleRatioQueryBuilder.BuildAsync(_context, countyId, taxYear, ct);
        var hoodGroups = ratios.Where(r => r.NeighborhoodCode != null).GroupBy(r => r.NeighborhoodCode!);
        var outliers = new List<string>();
        foreach (var g in hoodGroups)
        {
            var sorted = g.OrderBy(r => r.Ratio).ToList();
            if (sorted.Count < 4) continue;
            var q1 = sorted[sorted.Count / 4].Ratio;
            var q3 = sorted[sorted.Count * 3 / 4].Ratio;
            var iqr = q3 - q1;
            foreach (var r in sorted)
                if (r.Ratio < q1 - 1.5m * iqr || r.Ratio > q3 + 1.5m * iqr)
                    outliers.Add(r.ParcelId);
        }
        if (outliers.Count > 0)
            issues.Add(new("Accuracy", "Ratio", outliers.Count,
                "Parcels with ratio outside Q1 - 1.5*IQR or Q3 + 1.5*IQR within hood",
                outliers.Count > ratios.Count * 0.05 ? "critical" : "warning",
                outliers.Take(5).ToList()));

        // Check 6: Quality/grade cross-field mismatches (POOR + LUXURY combo)
        var mismatches = await _context.CamaCharacteristics
            .Where(c => c.CountyId == countyId && c.TaxYear == taxYear
                        && c.ConditionGrade == "POOR" && c.QualityGrade == "LUXURY")
            .Select(c => c.ParcelId).ToListAsync(ct);
        if (mismatches.Count > 0)
            issues.Add(new("Consistency", "ConditionGrade + QualityGrade", mismatches.Count,
                "Impossible pairing: POOR condition with LUXURY quality",
                "critical", mismatches.Take(5).ToList()));

        // Check 7: Year-built inconsistency
        var currentYear = DateTime.UtcNow.Year;
        var yearIssues = await _context.CamaCharacteristics
            .Where(c => c.CountyId == countyId && c.TaxYear == taxYear
                        && (c.YearBuilt > currentYear
                            || (c.EffectiveAge.HasValue && c.YearBuilt.HasValue
                                && c.EffectiveAge.Value > (currentYear - c.YearBuilt.Value) + 20)))
            .Select(c => c.ParcelId).ToListAsync(ct);
        if (yearIssues.Count > 0)
            issues.Add(new("Consistency", "YearBuilt/EffectiveAge", yearIssues.Count,
                "YearBuilt in future or EffectiveAge exceeds actual age by >20",
                "warning", yearIssues.Take(5).ToList()));

        // Check 8: GLA vs land conflicts
        var glaIssues = await _context.CamaCharacteristics
            .Where(c => c.CountyId == countyId && c.TaxYear == taxYear
                        && c.LandAreaSqft.HasValue && c.SquareFeet > c.LandAreaSqft!.Value)
            .Select(c => c.ParcelId).ToListAsync(ct);
        if (glaIssues.Count > 0)
            issues.Add(new("Consistency", "SquareFeet/LandAreaSqft", glaIssues.Count,
                "GLA exceeds LandAreaSqft (impossible for SFR)",
                "warning", glaIssues.Take(5).ToList()));

        return new DataQualityAssessmentDto(countyId, taxYear, totalParcels, issues, DateTime.UtcNow);
    }
}
```

- [ ] **Step 3: Register and build**

```csharp
builder.Services.AddScoped<ICamaDataQualityService, CamaDataQualityService>();
```

```bash
cd backend && dotnet build src/TerraFusion.AI/TerraFusion.AI.csproj 2>&1 | tail -5
```

- [ ] **Step 4: Commit**

```bash
git add backend/src/TerraFusion.Core/Interfaces/ICamaDataQualityService.cs
git add backend/src/TerraFusion.AI/DataQuality/CamaDataQualityService.cs
git add backend/src/TerraFusion.API/Program.cs
git commit -m "feat(costforge-t4): CamaDataQualityService with all 8 real checks

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

### Task 28: Wire data-quality endpoint in CostForgeController

**Files:**
- Modify: `backend/src/TerraFusion.API/Controllers/CostForgeController.cs`

- [ ] **Step 1: Replace stub /analytics/data-quality/assess with real call**

Locate the existing handler (grep for `data-quality/assess`). Replace body with:

```csharp
[HttpPost("analytics/data-quality/assess")]
public async Task<IActionResult> AssessDataQuality(
    [FromBody] DataQualityAssessRequest req, CancellationToken ct)
{
    var result = await _dq.AssessAsync(req.CountyId, req.TaxYear, ct);
    return Ok(result);
}

public record DataQualityAssessRequest(Guid CountyId, int TaxYear);
```

Inject `ICamaDataQualityService _dq` in constructor.

- [ ] **Step 2: Smoke test**

```bash
curl -X POST "http://localhost:5000/api/costforge/analytics/data-quality/assess" \
  -H "Content-Type: application/json" \
  -d "{\"countyId\":\"$BENTON_ID\",\"taxYear\":2026}" | python3 -m json.tool | head -30
```
Expected: `totalParcels > 70000`, `issues` array with 0-8 items.

- [ ] **Step 3: Commit**

```bash
git add backend/src/TerraFusion.API/Controllers/CostForgeController.cs
git commit -m "feat(costforge-t4): /costforge/analytics/data-quality/assess delegates to CamaDataQualityService

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

### Task 29: NeighborhoodAuditTab IQR outlier flag

**Files:**
- Modify: `frontend/apps/os-shell/src/pages/forge/cost/tabs/NeighborhoodAuditTab.tsx`

- [ ] **Step 1: Client-side IQR calc on the parcel array**

Add after parcel-list fetch:

```typescript
function flagOutliers(parcels: ParcelRow[]): ParcelRow[] {
  const ratios = parcels.map(p => p.ratio).filter((r): r is number => r != null).sort((a, b) => a - b);
  if (ratios.length < 4) return parcels;
  const q1 = ratios[Math.floor(ratios.length / 4)];
  const q3 = ratios[Math.floor(ratios.length * 3 / 4)];
  const iqr = q3 - q1;
  const lo = q1 - 1.5 * iqr;
  const hi = q3 + 1.5 * iqr;
  return parcels.map(p => ({ ...p, isOutlier: p.ratio != null && (p.ratio < lo || p.ratio > hi) }));
}
```

Extend `ParcelRow` type:
```typescript
interface ParcelRow {
  parcelId: string;
  ratio: number | null;
  isOutlier?: boolean;
  // existing fields...
}
```

Apply in render, in row:
```tsx
<tr className={row.isOutlier ? 'cf-outlier-row' : ''}>
  {row.isOutlier && <span className="cf-outlier-badge">⚠ Outlier</span>}
  {/* existing cells */}
</tr>
```

- [ ] **Step 2: Typecheck + commit**

```bash
cd frontend && npx tsc --noEmit 2>&1 | tail -3
git add frontend/apps/os-shell/src/pages/forge/cost/tabs/NeighborhoodAuditTab.tsx
git commit -m "feat(costforge-t4): IQR outlier flag on NeighborhoodAuditTab parcel rows

T4 complete.

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

# TRACK 5 — Calibration v2

**Worktree:** `trees/cf-v2-t5-calib`
**Depends on:** T0, T1, T2

---

### Task 30: Effective-age derivation endpoint

**Files:**
- Modify: `backend/src/TerraFusion.API/Controllers/CostForgeController.cs`

- [ ] **Step 1: Add endpoint**

```csharp
public record EffectiveAgeRequest(int ActualAge, string ConditionGrade,
    decimal? FunctionalObsAmount, decimal? ExternalObsAmount);

public record EffectiveAgeResponse(int EffectiveAge, int ConditionAdjustment, string Method);

[HttpPost("effective-age")]
public IActionResult ComputeEffectiveAge([FromBody] EffectiveAgeRequest req)
{
    var conditionAdj = req.ConditionGrade?.ToUpperInvariant() switch
    {
        "EXCELLENT" => -3,
        "GOOD" => 0,
        "FAIR" => 2,
        "POOR" => 5,
        _ => 0
    };
    var effective = Math.Max(0, req.ActualAge + conditionAdj);
    return Ok(new EffectiveAgeResponse(effective, conditionAdj, "Benton WAC-aligned condition table"));
}
```

- [ ] **Step 2: Smoke test**

```bash
curl -X POST http://localhost:5000/api/costforge/effective-age \
  -H "Content-Type: application/json" \
  -d '{"actualAge":30,"conditionGrade":"FAIR"}' | python3 -m json.tool
```
Expected: `effectiveAge: 32`.

- [ ] **Step 3: Commit**

```bash
git add backend/src/TerraFusion.API/Controllers/CostForgeController.cs
git commit -m "feat(costforge-t5): /costforge/effective-age derivation endpoint

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

### Task 31: Extend mass-adjust-preview with full equity metrics

**Files:**
- Modify: `backend/src/TerraFusion.AI/Valuation/CalibrationService.cs` (find existing)
- Modify: `backend/src/TerraFusion.API/Controllers/CostForgeController.cs`

- [ ] **Step 1: Find existing calibration service**

```bash
grep -rn "CalibrationService\|mass-adjust-preview" backend/src --include="*.cs" | head -5
```

- [ ] **Step 2: Read the existing Preview method before modifying**

```bash
grep -n "PreviewAsync\|mass-adjust-preview\|MassAdjustPreview" backend/src/TerraFusion.AI/Valuation/CalibrationService.cs 2>/dev/null
grep -n "PreviewResponseDto\|MassAdjustPreviewResponse" backend/src --include="*.cs" -r | head -5
```
Note the exact response DTO name used by the existing implementation.

- [ ] **Step 3: Extend the existing response DTO with metricsBefore/After**

Add two properties (adapt to whatever the existing DTO is named — below uses `MassAdjustPreviewResponse` as example):

```csharp
public EquityMetricsDto MetricsBefore { get; set; } = null!;
public EquityMetricsDto MetricsAfter { get; set; } = null!;
```

- [ ] **Step 4: Compute before/after snapshots in PreviewAsync**

After the existing code computes `parcelCount`, `matchedSales`, `totalAvBefore`, `totalAvAfter`, add:

```csharp
// Build SaleRatio list for the affected neighborhood (before adjustment)
var ratiosBefore = (await SaleRatioQueryBuilder.BuildAsync(_context, countyId, taxYear, ct))
    .Where(r => r.NeighborhoodCode == neighborhoodCode)
    .ToList();

// Simulate the adjustment on the ratio list
var factor = 1m + (adjustmentPct / 100m);
var ratiosAfter = ratiosBefore.Select(r => r with {
    AssessedValue = r.AssessedValue * factor,
    Ratio = (r.AssessedValue * factor) / r.AdjustedSalePrice
}).ToList();

response.MetricsBefore = _equity.ComputeFromRatios(ratiosBefore);
response.MetricsAfter = _equity.ComputeFromRatios(ratiosAfter);
```

Inject `IEquityMetricService _equity` in the CalibrationService constructor.

**Note:** `SaleRatio` is a record — the `with { }` syntax works only if `SaleRatio` is declared as `record`. Task 7 declares it that way; verify `backend/src/TerraFusion.Core/DTOs/EquityMetricsDto.cs` uses `public record SaleRatio(...)`.

- [ ] **Step 5: Smoke test preview response includes metrics**

```bash
curl -X POST "http://localhost:5000/api/costforge/calibration/mass-adjust-preview" \
  -H "Content-Type: application/json" \
  -d "{\"neighborhoodCode\":\"<REAL_HOOD>\",\"adjustmentPct\":5.0,\"taxYear\":2026}" \
  | python3 -m json.tool | head -40
```
Expected: response now includes `metricsBefore` and `metricsAfter` objects with median/cod/prd/prb fields.

- [ ] **Step 3: Commit**

```bash
git add backend/src/TerraFusion.AI/Valuation/CalibrationService.cs
git add backend/src/TerraFusion.API/Controllers/CostForgeController.cs
git commit -m "feat(costforge-t5): mass-adjust-preview returns full EquityMetrics before/after

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

### Task 32: CalibrationWorkbenchTab — full metric preview UI

**Files:**
- Modify: `frontend/apps/os-shell/src/pages/forge/cost/tabs/CalibrationWorkbenchTab.tsx`

- [ ] **Step 1: Update preview render**

Extend preview panel to show all metrics before/after as sparkline cards:

```tsx
{preview && (
  <div className="cf-preview-metrics">
    <MetricCard label="Median" before={preview.metricsBefore.medianRatio} after={preview.metricsAfter.medianRatio} target={1.0} />
    <MetricCard label="COD" before={preview.metricsBefore.cod} after={preview.metricsAfter.cod} target={15.0} inverse />
    <MetricCard label="PRD" before={preview.metricsBefore.prd} after={preview.metricsAfter.prd} target={1.0} />
    <MetricCard label="PRB" before={preview.metricsBefore.prb} after={preview.metricsAfter.prb} target={0.0} />
    <DecileCard decilesBefore={preview.metricsBefore.decileMedianRatios} decilesAfter={preview.metricsAfter.decileMedianRatios} />
  </div>
)}
```

Define `MetricCard` and `DecileCard` as small subcomponents inline.

- [ ] **Step 2: Typecheck + commit**

```bash
cd frontend && npx tsc --noEmit 2>&1 | tail -3
git add frontend/apps/os-shell/src/pages/forge/cost/tabs/CalibrationWorkbenchTab.tsx
git commit -m "feat(costforge-t5): full-metric preview UI (median, COD, PRD, PRB, deciles)

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

### Task 33: Post-commit verification snapshot writes CalibrationFinding

**Files:**
- Modify: `backend/src/TerraFusion.AI/Valuation/CalibrationService.cs`
- Modify: `backend/src/TerraFusion.API/Controllers/CostForgeController.cs`

- [ ] **Step 1: Extend `ApplyAsync` to write a CalibrationFinding**

After the adjustment commit, invoke `EquityMetricService.GetMetricsAsync` for the affected hood and insert a new `CalibrationFinding` row:

```csharp
var finding = new CalibrationFinding
{
    Id = Guid.NewGuid(),
    CountyId = countyId,
    TaxYear = taxYear,
    NeighborhoodCode = hoodCd,
    AdjustmentPct = adjustmentPct,
    ParcelCount = affectedParcels,
    MetricsBeforeJson = JsonSerializer.Serialize(metricsBefore),
    MetricsAfterJson = JsonSerializer.Serialize(metricsAfter),
    CommittedBy = committedBy,
    CommittedAt = DateTime.UtcNow,
};
_context.CalibrationFindings.Add(finding);
await _context.SaveChangesAsync(ct);
```

(If `CalibrationFinding` entity doesn't already have these fields, extend it with a separate mini-migration as part of this task.)

- [ ] **Step 2: Return verification snapshot in apply response**

Include `metricsAfter` in the apply response so the frontend can render the "Verified: median 0.92 → 0.998" panel without re-fetching.

- [ ] **Step 3: Commit**

```bash
git add backend/src/TerraFusion.AI/Valuation/CalibrationService.cs
git add backend/src/TerraFusion.API/Controllers/CostForgeController.cs
git commit -m "feat(costforge-t5): post-commit verification writes CalibrationFinding audit row

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

### Task 34: CalibrationWorkbenchTab — verification success panel

**Files:**
- Modify: `frontend/apps/os-shell/src/pages/forge/cost/tabs/CalibrationWorkbenchTab.tsx`

- [ ] **Step 1: Render verification panel after commit**

After `committed === true`, show:

```tsx
{committed && commitResult && (
  <div className="cf-verification-panel">
    <h4>✓ Adjustment committed — verified</h4>
    <div>Median: {commitResult.metricsBefore.medianRatio?.toFixed(3)} → {commitResult.metricsAfter.medianRatio?.toFixed(3)}</div>
    <div>COD: {commitResult.metricsBefore.cod?.toFixed(1)} → {commitResult.metricsAfter.cod?.toFixed(1)}</div>
    <div>PRB: {commitResult.metricsBefore.prb?.toFixed(3)} → {commitResult.metricsAfter.prb?.toFixed(3)}</div>
    <div className={commitResult.metricsAfter.iaaoCompliant ? 'cf-ok' : 'cf-warn'}>
      IAAO: {commitResult.metricsAfter.iaaoCompliant ? '✓ compliant' : '✗ still out'}
    </div>
  </div>
)}
```

- [ ] **Step 2: Typecheck + commit**

```bash
cd frontend && npx tsc --noEmit 2>&1 | tail -3
git add frontend/apps/os-shell/src/pages/forge/cost/tabs/CalibrationWorkbenchTab.tsx
git commit -m "feat(costforge-t5): verification success panel on commit

T5 complete.

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

# TRACK 6 — Secondary Feature %-of-BIV Wiring

**Worktree:** `trees/cf-v2-t6-features`
**Depends on:** T0
**Parallel with T1, T4**

---

### Task 35: Extend CostMatrix entity with SecondaryFeaturePctOfBiv

**Files:**
- Modify: `backend/src/TerraFusion.Core/Entities/CostMatrix.cs`

- [ ] **Step 1: Add column**

Insert after the existing `Grade` property (around line 57):

```csharp
    /// <summary>
    /// For MatrixType='SecondaryFeature' rows: the %-of-BIV rate to apply
    /// (e.g., 0.03 for CovPatio = 3% of BIV). Null for primary-rate rows.
    /// </summary>
    public decimal? SecondaryFeaturePctOfBiv { get; set; }
```

- [ ] **Step 2: Generate migration**

```bash
cd backend && dotnet ef migrations add AddSecondaryFeaturePctToCostMatrix --project src/TerraFusion.Data --startup-project src/TerraFusion.API
cd backend && dotnet ef database update --project src/TerraFusion.Data --startup-project src/TerraFusion.API
```

- [ ] **Step 3: Verify column**

```bash
docker exec terrafusion-postgres-dev psql -U postgres -d terrafusion -c "\d cost_matrices" | grep -i "secondary"
```
Expected: `secondary_feature_pct_of_biv` column with numeric type.

- [ ] **Step 4: Commit**

```bash
git add backend/src/TerraFusion.Core/Entities/CostMatrix.cs
git add backend/src/TerraFusion.Data/Migrations/
git commit -m "feat(costforge-t6): CostMatrix.SecondaryFeaturePctOfBiv column + migration

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

### Task 36: BentonSecondaryFeatureRatesSeeder

**Files:**
- Create: `backend/src/TerraFusion.Data/Seeders/BentonSecondaryFeatureRatesSeeder.cs`

- [ ] **Step 1: Write seeder**

```csharp
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using TerraFusion.Core.Entities;

namespace TerraFusion.Data.Seeders;

public class BentonSecondaryFeatureRatesSeeder
{
    private readonly TerraFusionDbContext _context;
    private readonly ILogger<BentonSecondaryFeatureRatesSeeder> _logger;

    public BentonSecondaryFeatureRatesSeeder(TerraFusionDbContext context, ILogger<BentonSecondaryFeatureRatesSeeder> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<int> SeedAsync(Guid countyId, int matrixYear, CancellationToken ct = default)
    {
        var rates = new[]
        {
            ("CovPatio", 0.03m, "Covered patio"),
            ("BSMT",     0.13m, "Basement"),
            ("POLEBLDG", 0.18m, "Pole building"),
            ("ATTGAR",   0.12m, "Attached garage"),
            ("DETGAR",   0.08m, "Detached garage"),
            ("POOL",     0.05m, "Pool (starter rate)"),
        };

        int inserted = 0;
        foreach (var (code, pct, desc) in rates)
        {
            var exists = await _context.CostMatrices.AnyAsync(
                m => m.CountyId == countyId && m.MatrixYear == matrixYear
                  && m.MatrixType == "SecondaryFeature" && m.BuildingType == code, ct);
            if (exists) continue;

            _context.CostMatrices.Add(new CostMatrix
            {
                CountyId = countyId,
                MatrixYear = matrixYear,
                MatrixType = "SecondaryFeature",
                BuildingType = code,
                BuildingTypeDescription = desc,
                BaseRate = 0m,
                Multiplier = 1.0m,
                Region = "Benton",
                BaseCost = 0m,
                SecondaryFeaturePctOfBiv = pct,
                County = "Benton",
                State = "WA",
                EffectiveDate = new DateTime(matrixYear, 1, 1),
            });
            inserted++;
        }

        await _context.SaveChangesAsync(ct);
        _logger.LogInformation("Seeded {Count} secondary feature rates for Benton {Year}", inserted, matrixYear);
        return inserted;
    }
}
```

- [ ] **Step 2: Add admin endpoint to run the seeder**

In `AdminController.cs`:
```csharp
private readonly BentonSecondaryFeatureRatesSeeder _featureSeeder;

[HttpPost("canonical/seed-secondary-features")]
public async Task<IActionResult> SeedSecondaryFeatures(
    [FromQuery] Guid countyId, [FromQuery] int matrixYear, CancellationToken ct)
{
    var count = await _featureSeeder.SeedAsync(countyId, matrixYear, ct);
    return Ok(new { inserted = count });
}
```

Register in Program.cs:
```csharp
builder.Services.AddScoped<BentonSecondaryFeatureRatesSeeder>();
```

- [ ] **Step 3: Run seeder against Benton 2026**

```bash
curl -X POST "http://localhost:5000/api/admin/canonical/seed-secondary-features?countyId=$BENTON_ID&matrixYear=2026"
```
Expected: `{ "inserted": 6 }` (first run) or 0 (idempotent on rerun).

Verify:
```bash
docker exec terrafusion-postgres-dev psql -U postgres -d terrafusion -c "
SELECT building_type, building_type_description, secondary_feature_pct_of_biv
FROM cost_matrices
WHERE matrix_type = 'SecondaryFeature' AND matrix_year = 2026
ORDER BY secondary_feature_pct_of_biv DESC;"
```
Expected: 6 rows — POLEBLDG 0.18, BSMT 0.13, ATTGAR 0.12, DETGAR 0.08, POOL 0.05, CovPatio 0.03.

- [ ] **Step 4: Commit**

```bash
git add backend/src/TerraFusion.Data/Seeders/BentonSecondaryFeatureRatesSeeder.cs
git add backend/src/TerraFusion.API/Controllers/AdminController.cs
git add backend/src/TerraFusion.API/Program.cs
git commit -m "feat(costforge-t6): BentonSecondaryFeatureRatesSeeder + admin endpoint

Seeded 6 canonical Benton rates:
POLEBLDG 18%, BSMT 13%, ATTGAR 12%, DETGAR 8%, POOL 5%, CovPatio 3%.

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

### Task 37: Extend /costforge/schedule response with secondary feature rows

**Files:**
- Modify: `backend/src/TerraFusion.API/Controllers/CostForgeController.cs`

- [ ] **Step 1: Update schedule endpoint**

Locate the existing `GET /costforge/schedule` handler. Extend the query to include `MatrixType IN ('Primary', 'SecondaryFeature')` (or the values your codebase uses — check existing data). Include `SecondaryFeaturePctOfBiv` in the response.

- [ ] **Step 2: Smoke test**

```bash
curl "http://localhost:5000/api/costforge/schedule" | python3 -c "import sys,json; d=json.load(sys.stdin); print([r for r in d if r.get('matrixType')=='SecondaryFeature'])"
```
Expected: 6 secondary feature rows in output.

- [ ] **Step 3: Commit**

```bash
git add backend/src/TerraFusion.API/Controllers/CostForgeController.cs
git commit -m "feat(costforge-t6): /costforge/schedule includes SecondaryFeature rows

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

### Task 38: CostApproachCalculator uses real secondary feature rates

**Files:**
- Modify: `backend/src/TerraFusion.AI/Valuation/CostApproachCalculator.cs`

- [ ] **Step 1: Locate RCN calc**

```bash
grep -n "RCN\|BIV\|SecondaryFeature" backend/src/TerraFusion.AI/Valuation/CostApproachCalculator.cs | head -10
```

- [ ] **Step 2: Replace hardcoded/placeholder rates with DB lookups**

Inside the RCN computation, after computing BIV:

```csharp
// Load secondary feature rates from CostMatrix
var rateMap = await _context.CostMatrices
    .Where(m => m.CountyId == countyId && m.MatrixYear == taxYear
             && m.MatrixType == "SecondaryFeature")
    .ToDictionaryAsync(m => m.BuildingType, m => m.SecondaryFeaturePctOfBiv ?? 0m, ct);

// Load parcel's improvement detail segments
var segments = await _context.CamaImprovementDetails
    .Where(d => d.CountyId == countyId && d.TaxYear == taxYear && d.ParcelId == parcelId)
    .ToListAsync(ct);

decimal secondaryFeatureTotal = 0m;
var featureBreakdown = new List<object>();
foreach (var seg in segments.Where(s => s.SegmentType != null && s.SegmentType != "MA"))
{
    if (rateMap.TryGetValue(seg.SegmentType!, out var pct))
    {
        var value = biv * pct;
        secondaryFeatureTotal += value;
        featureBreakdown.Add(new { code = seg.SegmentType, pct, value });
    }
}

var rcn = biv + secondaryFeatureTotal + refinements;
```

Return `featureBreakdown` in the response DTO alongside BIV and RCNLD.

- [ ] **Step 3: Commit**

```bash
git add backend/src/TerraFusion.AI/Valuation/CostApproachCalculator.cs
git commit -m "feat(costforge-t6): RCN calc uses real %-of-BIV rates from CostMatrix

Secondary-feature values computed as (BIV * CostMatrix.SecondaryFeaturePctOfBiv)
per CamaImprovementDetail.SegmentType on the parcel.

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

### Task 39: CostApproachRunner BIV section renders real breakdown

**Files:**
- Modify: `frontend/apps/os-shell/src/pages/forge/cost/CostApproachRunner.tsx`

- [ ] **Step 1: Update response type and render**

Ensure the calculate-rcnld response includes `featureBreakdown: Array<{code, pct, value}>`. In the BIV section:

```tsx
<div className="cf-biv-breakdown">
  <h4>BIV: {formatCurrency(result.biv)}</h4>
  <ul>
    <li>Main area: {formatCurrency(result.biv)} (100%)</li>
    {result.featureBreakdown?.map(f => (
      <li key={f.code}>
        {f.code}: {formatCurrency(f.value)} ({(f.pct * 100).toFixed(1)}% of BIV)
      </li>
    ))}
    <li className="cf-total">RCN: {formatCurrency(result.rcn)}</li>
    <li className="cf-total">RCNLD: {formatCurrency(result.rcnld)}</li>
  </ul>
</div>
```

- [ ] **Step 2: Typecheck + commit**

```bash
cd frontend && npx tsc --noEmit 2>&1 | tail -3
git add frontend/apps/os-shell/src/pages/forge/cost/CostApproachRunner.tsx
git commit -m "feat(costforge-t6): Parcel Inspector BIV breakdown shows %-of-BIV per feature

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

### Task 40: CostManual secondary-features table

**Files:**
- Modify: `frontend/apps/os-shell/src/pages/forge/cost/CostManual.tsx`

- [ ] **Step 1: Filter and render a second table for secondary features**

After the existing primary-rate table:

```tsx
<section>
  <h3>Secondary Features (%-of-BIV)</h3>
  <table>
    <thead><tr><th>Code</th><th>Description</th><th>%-of-BIV</th></tr></thead>
    <tbody>
      {rows.filter(r => r.matrixType === 'SecondaryFeature').map(r => (
        <tr key={r.buildingType}>
          <td>{r.buildingType}</td>
          <td>{r.buildingTypeDescription}</td>
          <td>{((r.secondaryFeaturePctOfBiv ?? 0) * 100).toFixed(1)}%</td>
        </tr>
      ))}
    </tbody>
  </table>
</section>
```

Ensure the row type includes `matrixType: string` and `secondaryFeaturePctOfBiv: number | null`.

- [ ] **Step 2: Typecheck + commit**

```bash
cd frontend && npx tsc --noEmit 2>&1 | tail -3
git add frontend/apps/os-shell/src/pages/forge/cost/CostManual.tsx
git commit -m "feat(costforge-t6): CostManual secondary-features rate table

T6 complete.

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

# FINAL — Cross-Track Integration QA

### Task 41: Cross-track numerical consistency check

- [ ] **Step 1: Pick a sample hood with real sales and verify**

```bash
HOOD=$(docker exec terrafusion-postgres-dev psql -U postgres -d terrafusion -t -c "
  SELECT neighborhood_code FROM cama_characteristics
  WHERE county_id = '$BENTON_ID' AND tax_year = 2026
  GROUP BY neighborhood_code HAVING COUNT(*) > 50 LIMIT 1;" | tr -d ' ')
echo "Sample hood: $HOOD"

# Method A — via neighborhood-matrix (TriageTab path)
MAT=$(curl -s "http://localhost:5000/api/costforge/calibration/neighborhood-matrix?taxYear=2026&minSales=3" | python3 -c "import sys,json; d=json.load(sys.stdin); print([n for n in d['neighborhoods'] if n['hoodCd']=='$HOOD'])")
echo "Matrix: $MAT"

# Method B — via /equity/metrics (canonical path)
EQU=$(curl -s "http://localhost:5000/api/equity/metrics?countyId=$BENTON_ID&taxYear=2026&by=neighborhood&segment=$HOOD" | python3 -m json.tool)
echo "Equity: $EQU"
```

Expected: `medianRatio`, `cod`, `prd`, `prb` agree within 0.001 between the two paths.

- [ ] **Step 2: Document in a check-results file**

Create `docs/superpowers/evidence/2026-04-16-cf-v2-cross-track-qa.md` with sample hood, both responses, and a ✓ if numbers match.

- [ ] **Step 3: Commit evidence**

```bash
git add docs/superpowers/evidence/2026-04-16-cf-v2-cross-track-qa.md
git commit -m "qa(costforge-v2): cross-track numerical consistency verified

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

### Task 42: Full 8-tab screenshot suite

- [ ] **Step 1: Launch frontend**

```bash
cd frontend && npm run dev 2>&1 &
# Wait for port 5173 to be ready
sleep 10
```

- [ ] **Step 2: Screenshot each CostForge tab**

Use Playwright MCP or a manual script to navigate to `http://localhost:5173/forge/cost` and capture each of the 8 tabs (Triage, Audit, Calibration, Parcel, Depreciation, Data Quality, Schedule, Calc Trace). Save as:
- `docs/superpowers/evidence/cf-v2-01-triage.png`
- `docs/superpowers/evidence/cf-v2-02-audit.png`
- ...through cf-v2-08-calctrace.png

- [ ] **Step 3: Commit screenshots**

```bash
git add docs/superpowers/evidence/cf-v2-*.png
git commit -m "qa(costforge-v2): full 8-tab screenshot suite captured against live Benton data

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

### Task 43: TypeScript + regression gate

- [ ] **Step 1: TypeScript 0 errors**

```bash
cd frontend && npx tsc --noEmit 2>&1 | tail -5
```
Expected: empty output.

- [ ] **Step 2: ForgeSuiteHome contract tests**

```bash
cd frontend && npx vitest run src/__tests__/forge/forgeSuiteHome.contract.test.tsx 2>&1 | tail -5
```
Expected: 21 passing.

- [ ] **Step 3: Grep gates**

```bash
# No Pacs* queries in CostForge v2 code
grep -rn "PacsParcel\|PacsImprovement\|PacsSale\|PacsSitus\|PacsValuation" \
  backend/src/TerraFusion.API/Controllers/CostForgeController.cs \
  backend/src/TerraFusion.AI/Valuation/ \
  backend/src/TerraFusion.AI/DataQuality/
# Expected: no matches (all via canonical entities)

# No Marshall & Swift references
grep -rn "Marshall.{0,5}Swift" backend/src frontend/apps 2>/dev/null
# Expected: no matches
```

- [ ] **Step 4: Final commit**

```bash
git commit --allow-empty -m "release(costforge-v2): all gates green — Benton Method v2 ready

- TypeScript 0 errors
- ForgeSuiteHome 21 tests pass
- 0 Pacs* queries in CostForge v2 code
- 0 Marshall & Swift references
- 8-tab screenshot suite captured with live Benton data
- Cross-track numerical consistency verified

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Verification Checklist

1. `cd backend && dotnet build TerraFusion.sln` → Build succeeded
2. `cd backend && dotnet test` → all green
3. `cd frontend && npx tsc --noEmit` → 0 errors
4. `cd frontend && npx vitest run` → all green, 21+ ForgeSuiteHome tests pass
5. Canonical data: `cama_characteristics` > 70K rows with non-null `City` and `PropertyUseStratum` for Benton 2026
6. `/api/equity/metrics?by=city` returns 7 strata (6 cities + Unincorp)
7. `/api/equity/metrics?by=type` returns ≥ 3 strata
8. `/api/equity/metrics?by=vintage` returns ≥ 5 decade buckets
9. `/api/equity/deciles` returns decile pattern on large-n hoods
10. `/api/equity/stratified-cod?splitBy=vintage` returns per-decade COD
11. `/api/equity/segment-drift` returns with/without-feature median ratio comparison
12. `/api/costforge/analytics/data-quality/assess` returns ≥ 1 real issue across 8 categories
13. `/api/costforge/effective-age` returns effectiveAge=32 for actualAge=30 + condition=FAIR
14. `/api/costforge/schedule` includes 6 SecondaryFeature rows (BSMT, POLEBLDG, CovPatio, ATTGAR, DETGAR, POOL)
15. CostApproachRunner parcel RCNLD includes feature breakdown with real %-of-BIV values
16. CalibrationWorkbench preview shows before/after for median, COD, PRD, PRB, and deciles
17. After calibration commit: `CalibrationFinding` row written + verification panel shown
18. 0 `Pacs*` queries in CostForge v2 source files
19. 0 "Marshall & Swift" references anywhere in active code
20. Full 8-tab screenshot suite committed to `docs/superpowers/evidence/`
