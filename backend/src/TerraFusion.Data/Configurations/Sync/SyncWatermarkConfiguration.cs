using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TerraFusion.Core.Entities.Sync;

namespace TerraFusion.Data.Configurations.Sync;

public sealed class SyncWatermarkConfiguration : IEntityTypeConfiguration<SyncWatermark>
{
    public void Configure(EntityTypeBuilder<SyncWatermark> builder)
    {
        builder.ToTable("SyncWatermarks");
        builder.HasKey(x => x.Id);

        builder.Property(x => x.SourceSystem).HasMaxLength(64).IsRequired();
        builder.Property(x => x.EntityType).HasMaxLength(64).IsRequired();
        builder.Property(x => x.LastSourceToken).HasMaxLength(512);
        builder.Property(x => x.CreatedBy).HasMaxLength(200);
        builder.Property(x => x.UpdatedBy).HasMaxLength(200);

        builder.HasIndex(x => new { x.CountyId, x.SourceSystem, x.EntityType })
            .IsUnique();

        builder.HasOne(x => x.County)
            .WithMany()
            .HasForeignKey(x => x.CountyId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
