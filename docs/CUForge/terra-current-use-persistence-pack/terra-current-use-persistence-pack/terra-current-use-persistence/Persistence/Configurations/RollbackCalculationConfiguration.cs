using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TerraFusion.Modules.CurrentUse.Entities;

namespace TerraFusion.Modules.CurrentUse.Persistence.Configurations;

public sealed class RollbackCalculationConfiguration : IEntityTypeConfiguration<RollbackCalculation>
{
    public void Configure(EntityTypeBuilder<RollbackCalculation> builder)
    {
        builder.ToTable("CurrentUseRollbackCalculations");

        builder.HasKey(x => x.Id);

        builder.Property(x => x.CalculationVersion).HasMaxLength(128).IsRequired();

        builder.Property(x => x.InputSnapshotJson).HasColumnType("nvarchar(max)").IsRequired();
        builder.Property(x => x.ResultSnapshotJson).HasColumnType("nvarchar(max)").IsRequired();

        builder.Property(x => x.AdditionalTaxSubtotal).HasPrecision(18, 2);
        builder.Property(x => x.InterestSubtotal).HasPrecision(18, 2);
        builder.Property(x => x.PenaltyAmount).HasPrecision(18, 2);
        builder.Property(x => x.TotalDue).HasPrecision(18, 2);

        builder.Property(x => x.PenaltySuppressionReason).HasMaxLength(128);
        builder.Property(x => x.StatutoryExceptionReason).HasMaxLength(128);
        builder.Property(x => x.CreatedBy).HasMaxLength(256).IsRequired();

        builder.HasIndex(x => new { x.CountyId, x.ParcelId });
        builder.HasIndex(x => x.ClassificationId);
        builder.HasIndex(x => x.RemovalId);
        builder.HasIndex(x => new { x.CountyId, x.CreatedAt });
    }
}
