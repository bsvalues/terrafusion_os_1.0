using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TerraFusion.Core.Entities;

namespace TerraFusion.Data.Configurations;

public sealed class LandSegmentConfiguration : IEntityTypeConfiguration<LandSegment>
{
    public void Configure(EntityTypeBuilder<LandSegment> builder)
    {
        builder.ToTable("LandSegments");
        builder.HasKey(x => x.Id);

        builder.Property(x => x.SourceSystem).HasMaxLength(64).IsRequired();
        builder.Property(x => x.SourceLandSegmentId).HasMaxLength(128).IsRequired();
        builder.Property(x => x.LandTypeCode).HasMaxLength(64).IsRequired();
        builder.Property(x => x.Acreage).HasPrecision(14, 4);
        builder.Property(x => x.SizeSquareFeet).HasPrecision(14, 2);
        builder.Property(x => x.MarketValue).HasPrecision(14, 2);
        builder.Property(x => x.AssessedValue).HasPrecision(14, 2);
        builder.Property(x => x.PayloadHash).HasMaxLength(128);
        builder.Property(x => x.CreatedBy).HasMaxLength(200);
        builder.Property(x => x.UpdatedBy).HasMaxLength(200);

        builder.HasIndex(x => new { x.CountyId, x.PropertyId, x.AssessmentYear, x.SupplementNumber });
        builder.HasIndex(x => new { x.CountyId, x.SourceSystem, x.SourceLandSegmentId, x.AssessmentYear });

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
