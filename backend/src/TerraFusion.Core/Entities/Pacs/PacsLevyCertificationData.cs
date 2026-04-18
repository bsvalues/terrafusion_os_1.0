using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace TerraFusion.Core.Entities.Pacs;

[Table("pacs_levy_cert_data")]
[Index(nameof(Year), nameof(TaxDistrictId), nameof(LevyCd), Name = "IX_PacsLevyCertData_YearDistrictCode", IsUnique = true)]
public class PacsLevyCertificationData
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();

    public int LevyCertRunId { get; set; }
    public int Year { get; set; }
    public int TaxDistrictId { get; set; }

    [MaxLength(200)]
    public string? TaxDistrictName { get; set; }

    [MaxLength(20)]
    public string LevyCd { get; set; } = string.Empty;

    [MaxLength(200)]
    public string? LevyDescription { get; set; }

    [MaxLength(20)]
    public string? LevyTypeCd { get; set; }

    [MaxLength(50)]
    public string? LevyTypeDescription { get; set; }

    public bool Voted { get; set; }

    [Column(TypeName = "numeric(18,2)")]
    public decimal? TimberAssessedFull { get; set; }

    [Column(TypeName = "numeric(18,2)")]
    public decimal? TimberAssessedHalf { get; set; }

    [Column(TypeName = "numeric(18,2)")]
    public decimal? TimberAssessedRoll { get; set; }

    [Column(TypeName = "numeric(18,2)")]
    public decimal? BudgetAmount { get; set; }

    [Column(TypeName = "numeric(18,2)")]
    public decimal? TaxBase { get; set; }

    [Column(TypeName = "numeric(14,10)")]
    public decimal? LevyRate { get; set; }

    public int? OutstandingItemCount { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
