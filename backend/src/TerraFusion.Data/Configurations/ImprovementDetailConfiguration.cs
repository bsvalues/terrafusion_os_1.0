using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TerraFusion.Core.Entities;

namespace TerraFusion.Data.Configurations;

public sealed class ImprovementDetailConfiguration : IEntityTypeConfiguration<ImprovementDetail>
{
    public void Configure(EntityTypeBuilder<ImprovementDetail> builder)
    {
        builder.ToTable("ImprovementDetails");
        builder.HasKey(x => x.Id);

        builder.Property(x => x.SourceSystem).HasMaxLength(64).IsRequired();
        builder.Property(x => x.TypeCode).HasMaxLength(32).IsRequired();
        builder.Property(x => x.ClassCode).HasMaxLength(32);
        builder.Property(x => x.MethodCode).HasMaxLength(32);
        builder.Property(x => x.ConditionCode).HasMaxLength(32);
        builder.Property(x => x.ValueSource).HasMaxLength(8);
        builder.Property(x => x.AreaSqFt).HasPrecision(14, 2);
        builder.Property(x => x.Value).HasPrecision(14, 2);
        builder.Property(x => x.PhysicalPercent).HasPrecision(7, 4);
        builder.Property(x => x.FunctionalPercent).HasPrecision(7, 4);
        builder.Property(x => x.EconomicPercent).HasPrecision(7, 4);
        builder.Property(x => x.PercentComplete).HasPrecision(7, 4);
        builder.Property(x => x.DepreciationPercent).HasPrecision(7, 4);
        builder.Property(x => x.PayloadHash).HasMaxLength(128);
        builder.Property(x => x.CreatedBy).HasMaxLength(200);
        builder.Property(x => x.UpdatedBy).HasMaxLength(200);

        builder.HasIndex(x => new { x.CountyId, x.PropertyId, x.AssessmentYear, x.SupplementNumber });
        builder.HasIndex(x => new { x.CountyId, x.SourceSystem, x.SourceImprvId, x.SourceImprvDetId });
        builder.HasIndex(x => new { x.CountyId, x.TypeCode });

        builder.HasOne(x => x.County)
            .WithMany()
            .HasForeignKey(x => x.CountyId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(x => x.Property)
            .WithMany()
            .HasForeignKey(x => x.PropertyId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
