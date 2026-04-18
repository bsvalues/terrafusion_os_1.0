using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace TerraFusion.Core.Entities.Pacs;

[Table("pacs_levy_cert_highest_lawful")]
[Index(nameof(Year), nameof(TaxDistrictId), nameof(LevyCd), nameof(LevyYear), Name = "IX_PacsLevyCertHighestLawful_YearDistrictCodeLevyYear", IsUnique = true)]
public class PacsLevyCertificationHighestLawful
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();

    public int LevyCertRunId { get; set; }
    public int Year { get; set; }
    public int TaxDistrictId { get; set; }

    [MaxLength(20)]
    public string LevyCd { get; set; } = string.Empty;

    public int LevyYear { get; set; }

    [Column(TypeName = "numeric(18,2)")]
    public decimal HighestLawfulLevy { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
