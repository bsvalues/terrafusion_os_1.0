// LEV-002 — Levy EF Core Entities
// Owner Suite: TerraDais (workflow/state management for assessment operations)

using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace TerraFusion.Core.Entities.Levy
{
    /// <summary>Tax district representing a taxing authority (city, county, school, fire, etc.).</summary>
    public class TaxDistrict
    {
        [Key] public int Id { get; set; }
        [Required, MaxLength(200)] public string Name { get; set; } = string.Empty;
        [Required, MaxLength(20)] public string Code { get; set; } = string.Empty;
        [Required, MaxLength(50)] public string DistrictType { get; set; } = string.Empty;
        public int CountyId { get; set; }
        public int Population { get; set; }
        [Column(TypeName = "decimal(18,2)")] public decimal AssessedValue { get; set; }
        public bool IsActive { get; set; } = true;

        // Navigation
        public ICollection<LevyRate> LevyRates { get; set; } = new List<LevyRate>();

        // Audit
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
        [MaxLength(100)] public string CreatedBy { get; set; } = string.Empty;
        [MaxLength(100)] public string UpdatedBy { get; set; } = string.Empty;
    }

    /// <summary>Tax code — a unique combination of overlapping districts applied to a parcel.</summary>
    public class TaxCode
    {
        [Key] public int Id { get; set; }
        [Required, MaxLength(20)] public string Code { get; set; } = string.Empty;
        [MaxLength(500)] public string Description { get; set; } = string.Empty;
        /// <summary>Comma-separated district IDs that compose this tax code.</summary>
        [MaxLength(500)] public string DistrictIds { get; set; } = string.Empty;
        public int CountyId { get; set; }

        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
        [MaxLength(100)] public string CreatedBy { get; set; } = string.Empty;
        [MaxLength(100)] public string UpdatedBy { get; set; } = string.Empty;
    }

    /// <summary>Levy rate for a district in a given tax year.</summary>
    public class LevyRate
    {
        [Key] public int Id { get; set; }
        public int DistrictId { get; set; }
        public int TaxYear { get; set; }
        [Column(TypeName = "decimal(12,6)")] public decimal RatePerThousand { get; set; }
        [Column(TypeName = "decimal(18,2)")] public decimal LevyAmount { get; set; }
        [Column(TypeName = "decimal(18,2)")] public decimal AssessedValue { get; set; }

        [ForeignKey(nameof(DistrictId))] public TaxDistrict? District { get; set; }

        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
        [MaxLength(100)] public string CreatedBy { get; set; } = string.Empty;
        [MaxLength(100)] public string UpdatedBy { get; set; } = string.Empty;
    }

    /// <summary>Log entry for levy data imports.</summary>
    public class ImportLog
    {
        [Key] public int Id { get; set; }
        [MaxLength(200)] public string FileName { get; set; } = string.Empty;
        public int RecordsProcessed { get; set; }
        public int RecordsFailed { get; set; }
        [MaxLength(20)] public string Status { get; set; } = "Pending";
        public DateTime ImportedAt { get; set; }
        [MaxLength(100)] public string ImportedBy { get; set; } = string.Empty;
    }

    /// <summary>Log entry for levy data exports.</summary>
    public class ExportLog
    {
        [Key] public int Id { get; set; }
        [MaxLength(50)] public string ExportType { get; set; } = string.Empty;
        public int RecordsExported { get; set; }
        [MaxLength(20)] public string Format { get; set; } = "CSV";
        public DateTime ExportedAt { get; set; }
        [MaxLength(100)] public string ExportedBy { get; set; } = string.Empty;
    }

    /// <summary>What-if levy scenario for rate modelling.</summary>
    public class LevyScenario
    {
        [Key] public int Id { get; set; }
        [Required, MaxLength(200)] public string Name { get; set; } = string.Empty;
        [MaxLength(1000)] public string Description { get; set; } = string.Empty;
        public int TaxYear { get; set; }
        public bool IsBaseline { get; set; }
        [MaxLength(20)] public string Status { get; set; } = "Draft";

        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
        [MaxLength(100)] public string CreatedBy { get; set; } = string.Empty;
        [MaxLength(100)] public string UpdatedBy { get; set; } = string.Empty;
    }

    /// <summary>Result of a statutory compliance check against WA limits.</summary>
    public class ComplianceCheck
    {
        [Key] public int Id { get; set; }
        public int DistrictId { get; set; }
        public int TaxYear { get; set; }
        public bool PassesAggregate590 { get; set; }
        public bool Passes1PercentCap { get; set; }
        public bool PassesConstitutionalLimit { get; set; }
        [MaxLength(2000)] public string Details { get; set; } = string.Empty;
        public DateTime CheckedAt { get; set; }
    }

    /// <summary>Data quality score for a district or import batch.</summary>
    public class DataQualityScore
    {
        [Key] public int Id { get; set; }
        [MaxLength(50)] public string EntityType { get; set; } = string.Empty;
        public int EntityId { get; set; }
        [Column(TypeName = "decimal(5,2)")] public decimal Score { get; set; }
        public int IssueCount { get; set; }
        [MaxLength(2000)] public string Issues { get; set; } = string.Empty;
        public DateTime ScoredAt { get; set; }
    }

    /// <summary>Configurable validation rule for levy data.</summary>
    public class ValidationRule
    {
        [Key] public int Id { get; set; }
        [Required, MaxLength(100)] public string RuleName { get; set; } = string.Empty;
        [MaxLength(500)] public string Description { get; set; } = string.Empty;
        [MaxLength(50)] public string Severity { get; set; } = "Warning";
        public bool IsActive { get; set; } = true;
        [MaxLength(500)] public string Expression { get; set; } = string.Empty;
    }

    /// <summary>Audit record for levy-specific operations.</summary>
    public class LevyAuditRecord
    {
        [Key] public int Id { get; set; }
        [MaxLength(100)] public string Action { get; set; } = string.Empty;
        [MaxLength(200)] public string EntityType { get; set; } = string.Empty;
        public int EntityId { get; set; }
        [MaxLength(2000)] public string OldValues { get; set; } = string.Empty;
        [MaxLength(2000)] public string NewValues { get; set; } = string.Empty;
        public DateTime PerformedAt { get; set; }
        [MaxLength(100)] public string PerformedBy { get; set; } = string.Empty;
    }
}
