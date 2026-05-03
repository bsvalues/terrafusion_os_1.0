using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TerraFusion.Core.Entities;

namespace TerraFusion.Data.Configurations;

public class RevalAreaEvidenceAgeConfiguration : IEntityTypeConfiguration<RevalAreaEvidenceAge>
{
    public void Configure(EntityTypeBuilder<RevalAreaEvidenceAge> builder)
    {
        builder.ToTable("RevalAreaEvidenceAges");
        builder.HasKey(e => e.Id);
        builder.Property(e => e.RevalArea).IsRequired().HasMaxLength(50);
        builder.Property(e => e.Factor).IsRequired().HasMaxLength(100);
        builder.Property(e => e.MedianRatio).HasPrecision(10, 6);
        builder.Property(e => e.EvidenceStatus).IsRequired().HasMaxLength(20);
        builder.Property(e => e.CreatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");
        builder.Property(e => e.UpdatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");

        builder.HasIndex(e => new { e.MatrixVersionId, e.RevalArea })
            .HasDatabaseName("IX_RevalAreaEvidenceAges_MatrixVersionId_RevalArea");
    }
}
