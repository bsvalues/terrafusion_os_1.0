using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace TerraFusion.Core.Entities.Pacs;

[Table("pacs_levy_cert_agg_limits")]
[Index(nameof(Year), nameof(TaxAreaId), Name = "IX_PacsLevyCertAggLimits_YearTaxArea", IsUnique = true)]
public class PacsLevyCertificationAggregateLimit
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();

    public int LevyCertRunId { get; set; }
    public int Year { get; set; }
    public int TaxAreaId { get; set; }

    [MaxLength(23)]
    public string? TaxAreaNumber { get; set; }

    [MaxLength(255)]
    public string? TaxAreaDescription { get; set; }

    public int Status { get; set; }

    [Column(TypeName = "numeric(14,10)")]
    public decimal? OriginalLevyRate { get; set; }

    [Column(TypeName = "numeric(14,10)")]
    public decimal? LevyReduction { get; set; }

    [Column(TypeName = "numeric(14,10)")]
    public decimal? FinalLevyRate { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
