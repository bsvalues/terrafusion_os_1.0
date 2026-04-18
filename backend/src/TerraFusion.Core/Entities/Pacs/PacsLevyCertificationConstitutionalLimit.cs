using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace TerraFusion.Core.Entities.Pacs;

[Table("pacs_levy_cert_const_limits")]
[Index(nameof(Year), nameof(TaxDistrictId), nameof(LevyCd), Name = "IX_PacsLevyCertConstLimits_YearDistrictCode", IsUnique = true)]
public class PacsLevyCertificationConstitutionalLimit
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();

    public int LevyCertRunId { get; set; }
    public int Year { get; set; }
    public int TaxDistrictId { get; set; }

    [MaxLength(20)]
    public string LevyCd { get; set; } = string.Empty;

    public bool Status { get; set; }

    [Column(TypeName = "numeric(14,10)")]
    public decimal? OriginalLevyRate { get; set; }

    [Column(TypeName = "numeric(14,10)")]
    public decimal? LevyReduction { get; set; }

    [Column(TypeName = "numeric(14,10)")]
    public decimal? FinalLevyRate { get; set; }

    [Column(TypeName = "numeric(14,10)")]
    public decimal? OriginalSeniorLevyRate { get; set; }

    [Column(TypeName = "numeric(14,10)")]
    public decimal? SeniorLevyReduction { get; set; }

    [Column(TypeName = "numeric(14,10)")]
    public decimal? FinalSeniorLevyRate { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
