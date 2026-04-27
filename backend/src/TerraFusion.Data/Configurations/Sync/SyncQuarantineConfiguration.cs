using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TerraFusion.Core.Entities.Sync;

namespace TerraFusion.Data.Configurations.Sync;

public sealed class SyncQuarantineConfiguration : IEntityTypeConfiguration<SyncQuarantine>
{
    public void Configure(EntityTypeBuilder<SyncQuarantine> builder)
    {
        builder.ToTable("SyncQuarantine");
        builder.HasKey(x => x.Id);

        builder.Property(x => x.SourceSystem).HasMaxLength(64).IsRequired();
        builder.Property(x => x.EntityType).HasMaxLength(64).IsRequired();
        builder.Property(x => x.SourceKey).HasMaxLength(256);
        builder.Property(x => x.Reason).HasMaxLength(2048).IsRequired();
        builder.Property(x => x.PayloadHash).HasMaxLength(128).IsRequired();
        builder.Property(x => x.PayloadJson).IsRequired();
        builder.Property(x => x.CreatedBy).HasMaxLength(200);
        builder.Property(x => x.UpdatedBy).HasMaxLength(200);

        builder.HasIndex(x => new { x.CountyId, x.SourceSystem, x.EntityType });
        builder.HasIndex(x => x.SyncBatchId);

        builder.HasOne(x => x.County)
            .WithMany()
            .HasForeignKey(x => x.CountyId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(x => x.SyncBatch)
            .WithMany(x => x.QuarantineItems)
            .HasForeignKey(x => x.SyncBatchId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
