using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TerraFusion.Core.Entities;

namespace TerraFusion.Data.Configurations;

public class MatrixVersionConfiguration : IEntityTypeConfiguration<MatrixVersion>
{
    public void Configure(EntityTypeBuilder<MatrixVersion> builder)
    {
        builder.ToTable("MatrixVersions");
        builder.HasKey(e => e.Id);

        builder.Property(e => e.Version).IsRequired().HasMaxLength(20);
        builder.Property(e => e.Status).IsRequired().HasMaxLength(20);
        builder.Property(e => e.VersionType).IsRequired().HasMaxLength(20);
        builder.Property(e => e.RateSnapshot).HasColumnType("text");
        builder.Property(e => e.SalesExclusionRules).HasColumnType("text");
        builder.Property(e => e.SignOffChain).HasColumnType("text");
        builder.Property(e => e.PrdBefore).HasPrecision(10, 6);
        builder.Property(e => e.PrdAfter).HasPrecision(10, 6);
        builder.Property(e => e.PrbBefore).HasPrecision(10, 6);
        builder.Property(e => e.PrbAfter).HasPrecision(10, 6);
        builder.Property(e => e.CodBefore).HasPrecision(10, 6);
        builder.Property(e => e.CodAfter).HasPrecision(10, 6);
        builder.Property(e => e.CountyAvImpact).HasPrecision(18, 2);

        builder.HasOne(e => e.CalibrationMemo)
            .WithMany()
            .HasForeignKey(e => e.CalibrationMemoId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasOne(e => e.ParentVersion)
            .WithMany()
            .HasForeignKey(e => e.ParentVersionId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasMany(e => e.EvidenceAges)
            .WithOne(e => e.MatrixVersion)
            .HasForeignKey(e => e.MatrixVersionId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(e => e.Findings)
            .WithOne(e => e.MatrixVersion)
            .HasForeignKey(e => e.MatrixVersionId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.Property(e => e.CreatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");
        builder.Property(e => e.UpdatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");

        builder.HasIndex(e => new { e.CountyId, e.Status })
            .HasDatabaseName("IX_MatrixVersions_CountyId_Status");
        builder.HasIndex(e => new { e.CountyId, e.Version }).IsUnique()
            .HasDatabaseName("IX_MatrixVersions_CountyId_Version_Unique");
    }
}
