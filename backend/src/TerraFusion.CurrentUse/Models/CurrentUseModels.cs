using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace TerraFusion.CurrentUse.Models;

/// <summary>
/// Current Use classification enrollment per RCW 84.33/84.34.
/// </summary>
public class Classification
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();
    public string ParcelId { get; set; } = string.Empty;
    public string ClassificationCode { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public DateOnly EnrollmentDate { get; set; }
    public string Status { get; set; } = "Active"; // Active, Removed, Pending
    public decimal? Acreage { get; set; }
    public decimal? CurrentMarketValue { get; set; }
    public decimal? CurrentUseValue { get; set; }
    public decimal? TaxSavings { get; set; }
    public string? CountyId { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
}

/// <summary>
/// Inflation rate for current use rollback interest per WAC 458-30-590.
/// Source: https://app.leg.wa.gov/wac/default.aspx?cite=458-30-590
/// Used in RCW 84.34.108(4) and RCW 84.33.140 additional tax calculations.
/// </summary>
public class InterestRate
{
    [Key]
    public int Year { get; set; }
    public decimal Rate { get; set; }
    public string Source { get; set; } = "WAC 458-30-590";
    public DateOnly EffectiveDate { get; set; }
}

/// <summary>
/// Removal from current use classification with rollback obligations.
/// </summary>
public class Removal
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();
    public string ParcelId { get; set; } = string.Empty;
    public string ClassificationCode { get; set; } = string.Empty;
    public string Reason { get; set; } = string.Empty;
    public DateOnly InitiatedDate { get; set; }
    public string Status { get; set; } = "Pending"; // Pending, Confirmed, Appealed
    public DateOnly? RemovalDate { get; set; }
    public decimal? RollbackAmount { get; set; }
    public decimal? InterestAmount { get; set; }
    public decimal? PenaltyAmount { get; set; }
    public decimal? TotalDue { get; set; }
    public string? PenaltyExceptionCode { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

/// <summary>
/// Audit log entry for current use operations.
/// </summary>
public class CurrentUseAuditEntry
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();
    public string ParcelId { get; set; } = string.Empty;
    public string Action { get; set; } = string.Empty;
    public string Details { get; set; } = string.Empty;
    public string PerformedBy { get; set; } = string.Empty;
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
    public string? PreviousHash { get; set; }
    public string Hash { get; set; } = string.Empty;
}

/// <summary>
/// Human workflow state for the CUForge case desk.
/// Program facts remain derived from Current Use records; this model stores only staff action state.
/// </summary>
public class CurrentUseCaseState
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid CaseId { get; set; }
    public string CaseStage { get; set; } = "MONITORING";
    public string AssignedAppraiser { get; set; } = "Ag Appraiser";
    public string ChiefReviewStatus { get; set; } = "NotRequired";
    public string NoticeApprovalStatus { get; set; } = "NotStarted";
    public string LocalCaseNotes { get; set; } = string.Empty;
    public DateOnly AgingBasisDate { get; set; } = DateOnly.FromDateTime(DateTime.UtcNow);
    public DateTime LastTouchedAt { get; set; } = DateTime.UtcNow;
}
