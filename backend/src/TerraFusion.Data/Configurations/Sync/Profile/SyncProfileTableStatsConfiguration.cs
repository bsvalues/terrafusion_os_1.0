using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TerraFusion.Core.Entities.Sync.Profile;

namespace TerraFusion.Data.Configurations.Sync.Profile;

public sealed class SyncProfileTableStatsConfiguration : IEntityTypeConfiguration<SyncProfileTableStats>
{
    public void Configure(EntityTypeBuilder<SyncProfileTableStats> builder)
    {
        builder.ToTable("SyncProfileTableStats");
        builder.HasKey(x => x.Id);

        builder.Property(x => x.SourceSystem).HasMaxLength(64).IsRequired();
        builder.Property(x => x.SchemaName).HasMaxLength(128).IsRequired();
        builder.Property(x => x.TableName).HasMaxLength(256).IsRequired();
        builder.Property(x => x.SamplingMethod).HasMaxLength(64).IsRequired();
        builder.Property(x => x.CreatedBy).HasMaxLength(200);
        builder.Property(x => x.UpdatedBy).HasMaxLength(200);

        // Primary lookup: "all stats for this batch's tables".
        builder.HasIndex(x => new { x.SyncBatchId, x.SchemaName, x.TableName });
        // Secondary lookup: "find the latest stats for this physical table
        // across batches" (cross-batch trend / drift queries).
        builder.HasIndex(x => new { x.CountyId, x.SourceSystem, x.SchemaName, x.TableName });

        builder.HasOne(x => x.County)
            .WithMany()
            .HasForeignKey(x => x.CountyId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(x => x.SyncBatch)
            .WithMany()
            .HasForeignKey(x => x.SyncBatchId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
