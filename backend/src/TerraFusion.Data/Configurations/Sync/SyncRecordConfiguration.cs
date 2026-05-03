using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TerraFusion.Core.Entities.Sync;

namespace TerraFusion.Data.Configurations.Sync;

public sealed class SyncRecordConfiguration : IEntityTypeConfiguration<SyncRecord>
{
    public void Configure(EntityTypeBuilder<SyncRecord> builder)
    {
        builder.ToTable("SyncRecords");
        builder.HasKey(x => x.Id);

        builder.Property(x => x.SourceSystem).HasMaxLength(64).IsRequired();
        builder.Property(x => x.EntityType).HasMaxLength(64).IsRequired();
        builder.Property(x => x.SourceKey).HasMaxLength(256).IsRequired();
        builder.Property(x => x.Operation).HasMaxLength(32).IsRequired();
        builder.Property(x => x.PayloadHash).HasMaxLength(128).IsRequired();
        builder.Property(x => x.CreatedBy).HasMaxLength(200);
        builder.Property(x => x.UpdatedBy).HasMaxLength(200);

        builder.HasIndex(x => new { x.CountyId, x.SourceSystem, x.EntityType, x.SourceKey });
        builder.HasIndex(x => new { x.SyncBatchId, x.EntityType });

        builder.HasOne(x => x.County)
            .WithMany()
            .HasForeignKey(x => x.CountyId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(x => x.SyncBatch)
            .WithMany(x => x.Records)
            .HasForeignKey(x => x.SyncBatchId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
