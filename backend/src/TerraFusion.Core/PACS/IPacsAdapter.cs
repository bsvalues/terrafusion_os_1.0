// =============================================================================
// PACS Adapter Interface - pacscontract.v1 Boundary
// =============================================================================
// THE SINGLE AUTHORIZED BOUNDARY FOR ALL PACS DATABASE ACCESS
//
// This interface is governed by pacscontract.v1 SpecLock.
// See: docs/spec-lock/locks/pacscontract/pacscontract.v1/
//
// All TerraFusion code MUST access PACS through this interface.
// Direct SQL or HTTP calls to PACS outside this adapter are FORBIDDEN.
// =============================================================================

using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;

namespace TerraFusion.Core.PACS
{
    /// <summary>
    /// The SINGLE authorized boundary for all Harris PACS database access.
    /// Governed by pacscontract.v1 SpecLock.
    /// </summary>
    /// <remarks>
    /// <para><b>Contract Reference:</b> docs/spec-lock/locks/pacscontract/pacscontract.v1/</para>
    /// <para><b>Access Mode:</b> READ-ONLY by default. Writes require amendment.</para>
    /// <para><b>Error Behavior:</b> Fail-closed on missing views/procedures/connection failure.</para>
    /// </remarks>
    public interface IPacsAdapter
    {
        // ═══════════════════════════════════════════════════════════════
        // CONTRACT PROOF & HEALTH
        // ═══════════════════════════════════════════════════════════════

        /// <summary>
        /// Validates that PACS contract requirements are met.
        /// Checks: database connectivity, required views, required indexes, health check procedure.
        /// </summary>
        /// <returns>Contract proof with pass/fail status for each requirement.</returns>
        Task<PacsContractProof> ValidateContractAsync(CancellationToken cancellationToken = default);

        /// <summary>
        /// Gets the current connection status to PACS.
        /// </summary>
        Task<PacsConnectionStatus> GetConnectionStatusAsync(CancellationToken cancellationToken = default);

        // ═══════════════════════════════════════════════════════════════
        // PROPERTY QUERIES (via vw_TerraFusion_Property_Core)
        // ═══════════════════════════════════════════════════════════════

        /// <summary>
        /// Gets a property by its prop_id from vw_TerraFusion_Property_Core.
        /// </summary>
        Task<PacsPropertyCore?> GetPropertyByIdAsync(int propId, CancellationToken cancellationToken = default);

        /// <summary>
        /// Gets a property by its geo_id from vw_TerraFusion_Property_Core.
        /// </summary>
        Task<PacsPropertyCore?> GetPropertyByGeoIdAsync(string geoId, CancellationToken cancellationToken = default);

        /// <summary>
        /// Gets properties with pagination from vw_TerraFusion_Property_Core.
        /// </summary>
        Task<PacsPagedResult<PacsPropertyCore>> GetPropertiesAsync(
            int page = 1,
            int pageSize = 100,
            CancellationToken cancellationToken = default);

        // ═══════════════════════════════════════════════════════════════
        // OWNERSHIP QUERIES (via vw_TerraFusion_Property_Ownership)
        // ═══════════════════════════════════════════════════════════════

        /// <summary>
        /// Gets ownership information for a property from vw_TerraFusion_Property_Ownership.
        /// </summary>
        Task<PacsPropertyOwnership?> GetOwnershipAsync(int propId, CancellationToken cancellationToken = default);

        /// <summary>
        /// Gets ownership information for multiple properties in a single round-trip.
        /// </summary>
        Task<IReadOnlyList<PacsPropertyOwnership>> GetOwnershipByIdsAsync(
            IEnumerable<int> propIds,
            CancellationToken cancellationToken = default);

        // ═══════════════════════════════════════════════════════════════
        // ASSESSMENT QUERIES (via vw_TerraFusion_Assessment_History)
        // ═══════════════════════════════════════════════════════════════

        /// <summary>
        /// Gets assessment history for a property from vw_TerraFusion_Assessment_History.
        /// </summary>
        Task<IReadOnlyList<PacsAssessmentHistory>> GetAssessmentHistoryAsync(
            int propId,
            int? yearFrom = null,
            int? yearTo = null,
            CancellationToken cancellationToken = default);

        /// <summary>
        /// Gets the current year assessment for a property.
        /// </summary>
        Task<PacsAssessmentHistory?> GetCurrentAssessmentAsync(int propId, CancellationToken cancellationToken = default);

        // ═══════════════════════════════════════════════════════════════
        // COMPARABLE SALES QUERIES (via vw_TerraFusion_Comparable_Sales)
        // ═══════════════════════════════════════════════════════════════

        /// <summary>
        /// Gets comparable sales with pagination from vw_TerraFusion_Comparable_Sales.
        /// This is raw PACS sales truth to be converted by TerraFusionSync into operational comparable sales.
        /// </summary>
        Task<PacsPagedResult<PacsComparableSale>> GetComparableSalesAsync(
            int page = 1,
            int pageSize = 500,
            CancellationToken cancellationToken = default);

        /// <summary>
        /// Gets PACS-backed CAMA characteristics with pagination from vw_TerraFusion_Cama_Characteristics.
        /// This is raw PACS improvement/profile truth to be converted by TerraFusionSync into operational CAMA data.
        /// </summary>
        Task<PacsPagedResult<PacsCamaCharacteristic>> GetCamaCharacteristicsAsync(
            int page = 1,
            int pageSize = 500,
            CancellationToken cancellationToken = default);

        /// <summary>
        /// Gets PACS improvement-level cost matrices with pagination from vw_TerraFusion_Improvement_Cost_Matrices.
        /// This is raw PACS matrix truth to be converted by TerraFusionSync into operational CostMatrices.
        /// </summary>
        Task<PacsPagedResult<PacsImprovementCostMatrix>> GetImprovementCostMatricesAsync(
            int page = 1,
            int pageSize = 500,
            CancellationToken cancellationToken = default);

        // ═══════════════════════════════════════════════════════════════
        // BATCH OPERATIONS
        // ═══════════════════════════════════════════════════════════════

        /// <summary>
        /// Gets multiple properties by their prop_ids in a single round-trip.
        /// </summary>
        Task<IReadOnlyList<PacsPropertyCore>> GetPropertiesByIdsAsync(
            IEnumerable<int> propIds,
            CancellationToken cancellationToken = default);

        /// <summary>
        /// Gets properties that have changed since the specified timestamp.
        /// Uses the change tracking columns in the views.
        /// </summary>
        Task<IReadOnlyList<PacsPropertyCore>> GetChangedPropertiesAsync(
            DateTime since,
            int maxResults = 1000,
            CancellationToken cancellationToken = default);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // CONTRACT PROOF TYPES
    // ═══════════════════════════════════════════════════════════════════════

    /// <summary>
    /// Result of validating pacscontract.v1 requirements at runtime.
    /// </summary>
    public sealed record PacsContractProof
    {
        /// <summary>Overall contract validation passed.</summary>
        public bool IsValid { get; init; }

        /// <summary>Contract ID (e.g., "pacscontract.v1").</summary>
        public string ContractId { get; init; } = "pacscontract.v1";

        /// <summary>Timestamp of validation.</summary>
        public DateTime ValidatedAt { get; init; } = DateTime.UtcNow;

        /// <summary>Database connectivity check result.</summary>
        public PacsProofItem DatabaseConnection { get; init; } = new();

        /// <summary>Required views existence check.</summary>
        public PacsProofItem RequiredViews { get; init; } = new();

        /// <summary>Required indexes existence check (warning only).</summary>
        public PacsProofItem RequiredIndexes { get; init; } = new();

        /// <summary>Health check procedure existence.</summary>
        public PacsProofItem HealthCheckProcedure { get; init; } = new();

        /// <summary>Health check procedure execution result.</summary>
        public PacsProofItem HealthCheckExecution { get; init; } = new();

        /// <summary>List of any errors encountered.</summary>
        public IReadOnlyList<string> Errors { get; init; } = Array.Empty<string>();

        /// <summary>List of warnings (non-fatal issues).</summary>
        public IReadOnlyList<string> Warnings { get; init; } = Array.Empty<string>();
    }

    /// <summary>
    /// Individual proof item result.
    /// </summary>
    public sealed record PacsProofItem
    {
        /// <summary>Name of the check.</summary>
        public string Name { get; init; } = string.Empty;

        /// <summary>Whether the check passed.</summary>
        public bool Passed { get; init; }

        /// <summary>Severity: "error" = fail-closed, "warning" = continue.</summary>
        public string Severity { get; init; } = "error";

        /// <summary>Details about the check result.</summary>
        public string? Details { get; init; }
    }

    /// <summary>
    /// Current connection status to PACS database.
    /// </summary>
    public sealed record PacsConnectionStatus
    {
        /// <summary>Whether currently connected.</summary>
        public bool IsConnected { get; init; }

        /// <summary>Database name (should be "pacs_oltp").</summary>
        public string? DatabaseName { get; init; }

        /// <summary>Server name (masked for security).</summary>
        public string? ServerName { get; init; }

        /// <summary>Last successful connection time.</summary>
        public DateTime? LastConnectedAt { get; init; }

        /// <summary>Connection latency in milliseconds.</summary>
        public double? LatencyMs { get; init; }

        /// <summary>Error message if not connected.</summary>
        public string? ErrorMessage { get; init; }

        /// <summary>Error code from pacscontract.v1 if applicable.</summary>
        public string? ErrorCode { get; init; }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // VIEW PROJECTION TYPES (from pacscontract.v1 required columns)
    // ═══════════════════════════════════════════════════════════════════════

    /// <summary>
    /// Property data from vw_TerraFusion_Property_Core.
    /// Columns defined in pacscontract.v1.
    /// </summary>
    public sealed record PacsPropertyCore
    {
        /// <summary>Property ID (prop_id).</summary>
        public int PropId { get; init; }

        /// <summary>Geographic ID (geo_id).</summary>
        public string GeoId { get; init; } = string.Empty;

        /// <summary>Property type code (prop_type_cd).</summary>
        public string? PropTypeCd { get; init; }

        /// <summary>Situs address (situs_addr).</summary>
        public string? SitusAddr { get; init; }

        /// <summary>Situs city (situs_city).</summary>
        public string? SitusCity { get; init; }

        /// <summary>Situs zip (situs_zip).</summary>
        public string? SitusZip { get; init; }

        /// <summary>Legal description (legal_desc).</summary>
        public string? LegalDesc { get; init; }

        /// <summary>Assessed value (assessed_val).</summary>
        public decimal? AssessedVal { get; init; }

        /// <summary>Market value (market_val).</summary>
        public decimal? MarketVal { get; init; }

        /// <summary>Land value (land_val).</summary>
        public decimal? LandVal { get; init; }

        /// <summary>Improvement value (imprv_val).</summary>
        public decimal? ImprvVal { get; init; }

        /// <summary>Appraisal year (appr_year).</summary>
        public int? ApprYear { get; init; }

        /// <summary>Last modified timestamp.</summary>
        public DateTime? LastModified { get; init; }
    }

    /// <summary>
    /// Ownership data from vw_TerraFusion_Property_Ownership.
    /// Columns defined in pacscontract.v1.
    /// </summary>
    public sealed record PacsPropertyOwnership
    {
        /// <summary>Property ID (prop_id).</summary>
        public int PropId { get; init; }

        /// <summary>Owner name (owner_name).</summary>
        public string OwnerName { get; init; } = string.Empty;

        /// <summary>Mailing address line 1 (mail_addr_1).</summary>
        public string? MailAddr1 { get; init; }

        /// <summary>Mailing address line 2 (mail_addr_2).</summary>
        public string? MailAddr2 { get; init; }

        /// <summary>Mailing city (mail_city).</summary>
        public string? MailCity { get; init; }

        /// <summary>Mailing state (mail_state).</summary>
        public string? MailState { get; init; }

        /// <summary>Mailing zip (mail_zip).</summary>
        public string? MailZip { get; init; }

        /// <summary>Ownership percentage (pct_ownership).</summary>
        public decimal? PctOwnership { get; init; }

        /// <summary>Deed date (deed_date).</summary>
        public DateTime? DeedDate { get; init; }
    }

    /// <summary>
    /// Assessment history from vw_TerraFusion_Assessment_History.
    /// Columns defined in pacscontract.v1.
    /// </summary>
    public sealed record PacsAssessmentHistory
    {
        /// <summary>Property ID (prop_id).</summary>
        public int PropId { get; init; }

        /// <summary>Tax year (prop_val_yr).</summary>
        public int PropValYr { get; init; }

        /// <summary>Assessed value (assessed_val).</summary>
        public decimal? AssessedVal { get; init; }

        /// <summary>Market value (market_val).</summary>
        public decimal? MarketVal { get; init; }

        /// <summary>Land value (land_val).</summary>
        public decimal? LandVal { get; init; }

        /// <summary>Improvement value (imprv_val).</summary>
        public decimal? ImprvVal { get; init; }

        /// <summary>Appraised by (appraised_by).</summary>
        public string? AppraisedBy { get; init; }

        /// <summary>Appraisal date (appraisal_dt).</summary>
        public DateTime? AppraisalDt { get; init; }
    }

    /// <summary>
    /// Raw PACS sale/change-of-owner data projected for TerraFusionSync conversion.
    /// </summary>
    public sealed record PacsComparableSale
    {
        public int PropId { get; init; }
        public string GeoId { get; init; } = string.Empty;
        public DateTime SaleDate { get; init; }
        public decimal SalePrice { get; init; }
        public string? PropTypeCd { get; init; }
        public string? SitusAddr { get; init; }
        public string? Neighborhood { get; init; }
        public string? SaleRatioTypeCd { get; init; }
        public string? DeedTypeCd { get; init; }
        public string? Consideration { get; init; }
        public DateTime? LastModified { get; init; }
    }

    /// <summary>
    /// Raw PACS improvement/profile data projected for TerraFusionSync conversion into operational CAMA.
    /// </summary>
    public sealed record PacsCamaCharacteristic
    {
        public int PropId { get; init; }
        public string GeoId { get; init; } = string.Empty;
        public int TaxYear { get; init; }
        public string? BuildingType { get; init; }
        public string? BuildingTypeDescription { get; init; }
        public string? Region { get; init; }
        public decimal? SquareFeet { get; init; }
        public decimal? Stories { get; init; }
        public decimal? BasementSqft { get; init; }
        public decimal? GarageSqft { get; init; }
        public string? QualityGrade { get; init; }
        public string? ConditionGrade { get; init; }
        public string? ComplexityGrade { get; init; }
        public string? ExteriorWall { get; init; }
        public string? RoofType { get; init; }
        public string? Foundation { get; init; }
        public string? HvacType { get; init; }
        public string? InteriorFinish { get; init; }
        public int? YearBuilt { get; init; }
        public int? EffectiveAge { get; init; }
        public int? EconomicLife { get; init; }
        public decimal? LandAreaSqft { get; init; }
        public string? LandZone { get; init; }
        public decimal? LandAdjustmentFactor { get; init; }
        public int? Bedrooms { get; init; }
        public int? Bathrooms { get; init; }
        public int? Fireplaces { get; init; }
        public bool? HasPool { get; init; }
        public decimal? FunctionalObsolescence { get; init; }
        public decimal? ExternalObsolescence { get; init; }
        public string? Neighborhood { get; init; }
        public string? PropertyTypeCd { get; init; }
        public DateTime? LastModified { get; init; }
    }

    /// <summary>
    /// Raw PACS improvement-matrix data projected for TerraFusionSync conversion into operational CostMatrices.
    /// </summary>
    public sealed record PacsImprovementCostMatrix
    {
        public int SourceMatrixId { get; init; }
        public int MatrixYear { get; init; }
        public string? MatrixType { get; init; }
        public decimal? BaseRate { get; init; }
        public decimal? Multiplier { get; init; }
        public string? Region { get; init; }
        public string? BuildingType { get; init; }
        public string? BuildingTypeDescription { get; init; }
        public decimal? BaseCost { get; init; }
        public string? MatrixDescription { get; init; }
        public int DataPoints { get; init; }
        public decimal? MinCost { get; init; }
        public decimal? MaxCost { get; init; }
        public string? Grade { get; init; }
        public string? Condition { get; init; }
        public int? YearBuilt { get; init; }
        public decimal? DepreciationRate { get; init; }
        public string? Axis1 { get; init; }
        public string? Axis2 { get; init; }
        public decimal? AdjustmentFactorRaw { get; init; }
        public string? MatrixLabel { get; init; }
    }

    /// <summary>
    /// Paged result wrapper.
    /// </summary>
    public sealed record PacsPagedResult<T>
    {
        /// <summary>Items on this page.</summary>
        public IReadOnlyList<T> Items { get; init; } = Array.Empty<T>();

        /// <summary>Current page number (1-based).</summary>
        public int Page { get; init; } = 1;

        /// <summary>Page size.</summary>
        public int PageSize { get; init; } = 100;

        /// <summary>Total number of items across all pages.</summary>
        public int TotalCount { get; init; }

        /// <summary>Total number of pages.</summary>
        public int TotalPages => (int)Math.Ceiling((double)TotalCount / PageSize);

        /// <summary>Whether there are more pages.</summary>
        public bool HasMore => Page < TotalPages;
    }

    // ═══════════════════════════════════════════════════════════════════════
    // ERROR CODES (from pacscontract.v1)
    // ═══════════════════════════════════════════════════════════════════════

    /// <summary>
    /// Error codes defined in pacscontract.v1.
    /// </summary>
    public static class PacsErrorCodes
    {
        /// <summary>Cannot connect to PACS database. Behavior: fail_closed.</summary>
        public const string ConnectionFailed = "PACS_CONNECTION_FAILED";

        /// <summary>Required view missing. Behavior: fail_closed.</summary>
        public const string ViewMissing = "PACS_VIEW_MISSING";

        /// <summary>Required index missing. Behavior: continue (warning).</summary>
        public const string IndexMissing = "PACS_INDEX_MISSING";

        /// <summary>Required procedure missing. Behavior: fail_closed.</summary>
        public const string ProcedureMissing = "PACS_PROCEDURE_MISSING";

        /// <summary>Permission denied. Behavior: fail_closed.</summary>
        public const string PermissionDenied = "PACS_PERMISSION_DENIED";

        /// <summary>Query timeout. Behavior: fail_closed.</summary>
        public const string Timeout = "PACS_TIMEOUT";

        /// <summary>Health check failed. Behavior: fail_closed.</summary>
        public const string HealthCheckFailed = "PACS_HEALTH_CHECK_FAILED";
    }

    /// <summary>
    /// Exception thrown when PACS contract is violated.
    /// </summary>
    public class PacsContractViolationException : Exception
    {
        /// <summary>The error code from PacsErrorCodes.</summary>
        public string ErrorCode { get; }

        /// <summary>The behavior: "fail_closed" or "continue".</summary>
        public string Behavior { get; }

        public PacsContractViolationException(string errorCode, string message)
            : base(message)
        {
            ErrorCode = errorCode;
            Behavior = GetBehavior(errorCode);
        }

        public PacsContractViolationException(string errorCode, string message, Exception inner)
            : base(message, inner)
        {
            ErrorCode = errorCode;
            Behavior = GetBehavior(errorCode);
        }

        private static string GetBehavior(string errorCode) => errorCode switch
        {
            PacsErrorCodes.IndexMissing => "continue",
            _ => "fail_closed"
        };
    }
}
