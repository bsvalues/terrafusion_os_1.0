using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TerraFusion.Core.Entities;

namespace TerraFusion.Data.Configurations;

public class CalibrationFindingConfiguration : IEntityTypeConfiguration<CalibrationFinding>
{
    public void Configure(EntityTypeBuilder<CalibrationFinding> builder)
    {
        builder.ToTable("CalibrationFindings");
        builder.HasKey(e => e.Id);
        builder.Property(e => e.Classification).IsRequired().HasMaxLength(50);
        builder.Property(e => e.BuildingType).IsRequired().HasMaxLength(100);
        builder.Property(e => e.RevalArea).HasMaxLength(50);
        builder.Property(e => e.PrdValue).HasPrecision(10, 6);
        builder.Property(e => e.PrbValue).HasPrecision(10, 6);
        builder.Property(e => e.CodValue).HasPrecision(10, 6);
        builder.Property(e => e.ConfidenceLevel).HasPrecision(5, 4);
        builder.Property(e => e.ProposedAdjustmentPct).HasPrecision(8, 4);
        builder.Property(e => e.ProposedRateNew).HasPrecision(18, 4);
        builder.Property(e => e.EstimatedAvImpact).HasPrecision(18, 2);
        builder.Property(e => e.OutlierParcelIds).HasColumnType("text");
        builder.Property(e => e.ResolutionStatus).HasMaxLength(20);
        builder.Property(e => e.CreatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");
        builder.Property(e => e.UpdatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");

        builder.HasIndex(e => new { e.MatrixVersionId, e.Classification })
            .HasDatabaseName("IX_CalibrationFindings_VersionId_Classification");
    }
}
