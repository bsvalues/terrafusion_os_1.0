using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace TerraFusion.Data.Schemas.Validation;

/// <summary>
/// EF Core entity representing a validation rule applied to PILT payment records.
/// Rules are evaluated during payment intake to flag data quality issues
/// before payments are recorded or distributed.
/// Owner suite: TerraDais (workflow / state management).
/// </summary>
[Table("PiltValidationRules")]
public class PiltValidationRule
{
    /// <summary>Primary key.</summary>
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();

    /// <summary>Human-readable name for the validation rule (e.g. "PaymentAmountPositive").</summary>
    [Required]
    [StringLength(200)]
    public string RuleName { get; set; } = string.Empty;

    /// <summary>
    /// Expression or logic identifier that defines the rule.
    /// Can be a simple expression string, a rule-engine key, or a method reference.
    /// </summary>
    [Required]
    [StringLength(1000)]
    public string RuleExpression { get; set; } = string.Empty;

    /// <summary>
    /// Severity level when the rule is violated.
    /// Expected values: error, warning, info.
    /// </summary>
    [Required]
    [StringLength(20)]
    public string Severity { get; set; } = "error";

    /// <summary>Whether this rule is currently active and should be evaluated.</summary>
    public bool IsActive { get; set; } = true;

    /// <summary>Human-readable description of what the rule validates.</summary>
    [StringLength(2000)]
    public string? Description { get; set; }

    // ── Audit fields ─────────────────────────────────────────────────

    /// <summary>Timestamp when the rule was created (UTC).</summary>
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    /// <summary>Timestamp when the rule was last updated (UTC).</summary>
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
