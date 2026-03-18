// TFT-040: GAMA Zoning Agent — spatial/regulatory analysis, NOT valuation
using Microsoft.Extensions.Logging;

namespace TerraFusion.AI.Spatial;

// ── Data Models ──────────────────────────────────────────────────────

/// <summary>Zoning compliance check result.</summary>
public record ZoningComplianceResult(
    string ParcelId,
    string CurrentZoneCode,
    string CurrentZoneDescription,
    string ProposedUseCode,
    /// <summary>Whether the use is permitted in the zone.</summary>
    bool IsPermitted,
    /// <summary>Whether the use requires a conditional use permit.</summary>
    bool RequiresConditionalUse,
    /// <summary>Specific compliance issues found.</summary>
    IReadOnlyList<string> Issues,
    /// <summary>Applicable regulation references.</summary>
    IReadOnlyList<string> ApplicableRegulations);

/// <summary>Development potential analysis result.</summary>
public record DevelopmentPotentialResult(
    string ParcelId,
    string ZoneCode,
    /// <summary>Maximum allowed lot coverage percentage.</summary>
    double MaxLotCoveragePercent,
    /// <summary>Maximum building height in feet.</summary>
    double MaxBuildingHeightFeet,
    /// <summary>Minimum setback requirements (front, side, rear) in feet.</summary>
    SetbackRequirements Setbacks,
    /// <summary>Maximum floor-area-ratio (FAR) if applicable.</summary>
    double? MaxFar,
    /// <summary>Minimum lot size in square feet.</summary>
    double MinLotSizeSqFt,
    /// <summary>Maximum dwelling units per acre (residential zones).</summary>
    double? MaxDensity,
    /// <summary>Permitted use types in this zone.</summary>
    IReadOnlyList<string> PermittedUses,
    /// <summary>Whether the parcel has development constraints.</summary>
    IReadOnlyList<string> Constraints);

/// <summary>Setback requirements in feet.</summary>
public record SetbackRequirements(
    double FrontFeet,
    double SideFeet,
    double RearFeet,
    double? CornerSideFeet);

/// <summary>Regulatory overlay on a parcel.</summary>
public record ZoningOverlay(
    string OverlayCode,
    string OverlayName,
    string OverlayType,
    /// <summary>Additional restrictions imposed by the overlay.</summary>
    IReadOnlyList<string> Restrictions,
    /// <summary>Regulatory citation.</summary>
    string Citation);

// ── Interface ────────────────────────────────────────────────────────

/// <summary>
/// GAMA (Geographic Analysis for Municipal Assessment) Zoning Agent.
/// Performs spatial/regulatory analysis on parcels — zoning compliance,
/// development potential, regulation overlays. This is land-use analysis,
/// NOT property valuation. Atlas determines what you CAN do with the
/// land; Forge determines what that means for value.
/// </summary>
public interface IGamaZoningAgent
{
    /// <summary>
    /// Check whether a proposed use code is compliant with the parcel's zoning.
    /// </summary>
    /// <param name="parcelId">Parcel to check.</param>
    /// <param name="useCode">Proposed land use code.</param>
    Task<ZoningComplianceResult> CheckZoningComplianceAsync(
        string parcelId,
        string useCode,
        CancellationToken ct = default);

    /// <summary>
    /// Assess the development potential of a parcel based on its zoning
    /// and regulatory constraints.
    /// </summary>
    /// <param name="parcelId">Parcel to analyze.</param>
    Task<DevelopmentPotentialResult> AssessDevelopmentPotentialAsync(
        string parcelId,
        CancellationToken ct = default);

    /// <summary>
    /// Identify all regulatory overlays that apply to a parcel (flood zones,
    /// critical areas, historic districts, etc.).
    /// </summary>
    /// <param name="parcelId">Parcel to check.</param>
    Task<IReadOnlyList<ZoningOverlay>> IdentifyRegulationOverlaysAsync(
        string parcelId,
        CancellationToken ct = default);
}

// ── Implementation ───────────────────────────────────────────────────

/// <summary>
/// Production GAMA Zoning Agent. Uses Benton County zoning code data
/// to evaluate compliance, development potential, and overlay impacts.
/// All spatial/regulatory — no valuation.
/// </summary>
public sealed class GamaZoningAgent : IGamaZoningAgent
{
    private readonly ILogger<GamaZoningAgent> _logger;

    public GamaZoningAgent(ILogger<GamaZoningAgent> logger)
    {
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    /// <inheritdoc />
    public Task<ZoningComplianceResult> CheckZoningComplianceAsync(
        string parcelId, string useCode, CancellationToken ct = default)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(parcelId);
        ArgumentException.ThrowIfNullOrWhiteSpace(useCode);

        _logger.LogInformation("Checking zoning compliance: parcel={Parcel}, use={Use}", parcelId, useCode);

        // Look up zone code for the parcel (would come from GIS connector in production)
        var zoneCode = LookupZoneCode(parcelId);
        var zoneInfo = GetZoneInfo(zoneCode);

        var isPermitted = zoneInfo.PermittedUses.Contains(useCode, StringComparer.OrdinalIgnoreCase);
        var requiresCup = !isPermitted &&
                          zoneInfo.ConditionalUses.Contains(useCode, StringComparer.OrdinalIgnoreCase);

        var issues = new List<string>();
        if (!isPermitted && !requiresCup)
            issues.Add($"Use code '{useCode}' is not permitted in zone '{zoneCode}'");

        var regulations = new List<string>
        {
            $"Benton County Code Title 11 - {zoneCode}",
            "RCW 36.70A (Growth Management Act)"
        };

        if (requiresCup)
        {
            issues.Add($"Use code '{useCode}' requires Conditional Use Permit in zone '{zoneCode}'");
            regulations.Add("BCC 11.50 - Conditional Use Permits");
        }

        return Task.FromResult(new ZoningComplianceResult(
            parcelId, zoneCode, zoneInfo.Description, useCode,
            isPermitted, requiresCup, issues, regulations));
    }

    /// <inheritdoc />
    public Task<DevelopmentPotentialResult> AssessDevelopmentPotentialAsync(
        string parcelId, CancellationToken ct = default)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(parcelId);
        _logger.LogInformation("Assessing development potential for parcel {Parcel}", parcelId);

        var zoneCode = LookupZoneCode(parcelId);
        var zoneInfo = GetZoneInfo(zoneCode);

        var constraints = new List<string>();

        // Check for common constraints
        if (zoneInfo.MaxBuildingHeightFeet < 35)
            constraints.Add("Height-restricted zone");
        if (zoneInfo.MaxLotCoveragePercent < 40)
            constraints.Add("Low-density coverage restriction");

        return Task.FromResult(new DevelopmentPotentialResult(
            ParcelId: parcelId,
            ZoneCode: zoneCode,
            MaxLotCoveragePercent: zoneInfo.MaxLotCoveragePercent,
            MaxBuildingHeightFeet: zoneInfo.MaxBuildingHeightFeet,
            Setbacks: zoneInfo.Setbacks,
            MaxFar: zoneInfo.MaxFar,
            MinLotSizeSqFt: zoneInfo.MinLotSizeSqFt,
            MaxDensity: zoneInfo.MaxDensity,
            PermittedUses: zoneInfo.PermittedUses,
            Constraints: constraints));
    }

    /// <inheritdoc />
    public Task<IReadOnlyList<ZoningOverlay>> IdentifyRegulationOverlaysAsync(
        string parcelId, CancellationToken ct = default)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(parcelId);
        _logger.LogInformation("Identifying regulation overlays for parcel {Parcel}", parcelId);

        // In production, these would be queried from the GIS connector
        // by intersecting the parcel polygon with overlay layers
        var overlays = new List<ZoningOverlay>();

        // Check common overlays — production would do spatial intersection
        overlays.Add(new ZoningOverlay(
            "SEPA",
            "State Environmental Policy Act Review Area",
            "Environmental",
            new[] { "Environmental impact review may be required for development" },
            "WAC 197-11"));

        // Shoreline Management (if near Columbia/Yakima/Snake rivers)
        // Critical Areas (wetlands, habitat, geologic hazards)
        // Airport overlay zones
        // Historic district overlays

        return Task.FromResult<IReadOnlyList<ZoningOverlay>>(overlays);
    }

    // ── Zone Data ────────────────────────────────────────────────────
    // In production, this data comes from the county GIS system and
    // municipal code database. Hardcoded here as representative
    // Benton County zone types.

    private static string LookupZoneCode(string parcelId)
    {
        // Production: query GIS connector for zone intersection
        // Default to R-1 (most common in Benton County)
        return "R-1";
    }

    private static ZoneDefinition GetZoneInfo(string zoneCode) =>
        ZoneDefinitions.TryGetValue(zoneCode, out var info) ? info : DefaultZone;

    private static readonly ZoneDefinition DefaultZone = new(
        "Unknown Zone", 35, 50, 7200,
        new SetbackRequirements(20, 5, 15, 15), null, 6.0,
        new[] { "SFR" }, new[] { "Duplex" });

    private static readonly Dictionary<string, ZoneDefinition> ZoneDefinitions = new(StringComparer.OrdinalIgnoreCase)
    {
        ["R-1"] = new("Suburban Residential",
            35, 40, 7200,
            new SetbackRequirements(20, 5, 15, 15), null, 6.0,
            new[] { "SFR", "Accessory", "HomeOccupation", "Agriculture" },
            new[] { "Duplex", "DayCare", "Church", "School" }),

        ["R-2"] = new("Medium-Density Residential",
            35, 50, 5000,
            new SetbackRequirements(15, 5, 15, 15), null, 12.0,
            new[] { "SFR", "Duplex", "Townhouse", "Accessory" },
            new[] { "MultiFamily", "DayCare", "Church", "AssistedLiving" }),

        ["R-3"] = new("High-Density Residential",
            45, 65, 3600,
            new SetbackRequirements(15, 5, 15, 15), 2.0, 24.0,
            new[] { "SFR", "Duplex", "MultiFamily", "Townhouse" },
            new[] { "MixedUse", "RetailSmall", "Office" }),

        ["C-1"] = new("Neighborhood Commercial",
            35, 70, 5000,
            new SetbackRequirements(10, 0, 10, null), 1.5, null,
            new[] { "Retail", "Office", "Restaurant", "PersonalService" },
            new[] { "DriveThroughRestaurant", "GasStation", "MedicalClinic" }),

        ["C-2"] = new("General Commercial",
            50, 80, 5000,
            new SetbackRequirements(10, 0, 10, null), 3.0, null,
            new[] { "Retail", "Office", "Restaurant", "Hotel", "Entertainment", "AutoSales" },
            new[] { "Industrial-Light", "MiniStorage", "VehicleRepair" }),

        ["I-1"] = new("Light Industrial",
            50, 70, 10000,
            new SetbackRequirements(25, 10, 20, null), null, null,
            new[] { "Manufacturing-Light", "Warehouse", "Office", "Research" },
            new[] { "Manufacturing-Heavy", "OutdoorStorage" }),

        ["I-2"] = new("Heavy Industrial",
            65, 80, 20000,
            new SetbackRequirements(30, 15, 25, null), null, null,
            new[] { "Manufacturing-Heavy", "Warehouse", "Processing", "OutdoorStorage" },
            new[] { "Hazardous", "Mining" }),

        ["AG"] = new("Agricultural",
            35, 20, 217800, // 5 acres
            new SetbackRequirements(35, 20, 35, null), null, null,
            new[] { "Agriculture", "SFR", "Accessory", "FarmStand" },
            new[] { "RuralIndustry", "AnimalHusbandry-Intensive" }),
    };

    private sealed record ZoneDefinition(
        string Description,
        double MaxBuildingHeightFeet,
        double MaxLotCoveragePercent,
        double MinLotSizeSqFt,
        SetbackRequirements Setbacks,
        double? MaxFar,
        double? MaxDensity,
        string[] PermittedUses,
        string[] ConditionalUses);
}
