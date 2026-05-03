using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TerraFusion.Core.Entities.SyncBridge;

namespace TerraFusion.Data.Configurations.SyncBridge;

public sealed class LoadBatchConfiguration : IEntityTypeConfiguration<LoadBatch>
{
    public void Configure(EntityTypeBuilder<LoadBatch> builder)
    {
        builder.ToTable("load_batch", schema: "sync_bridge");
        builder.HasKey(x => x.LoadBatchId);

        builder.Property(x => x.SourceFamily).HasMaxLength(64).IsRequired();
        builder.Property(x => x.SourceSystem).HasMaxLength(128).IsRequired();
        builder.Property(x => x.SourceFileOrDatabase).HasMaxLength(256).IsRequired();
        builder.Property(x => x.SourceQueryName).HasMaxLength(256);
        builder.Property(x => x.SourceQueryHash).HasMaxLength(64).IsRequired();
        builder.Property(x => x.RestoreSource).HasMaxLength(256);
        builder.Property(x => x.Operator).HasMaxLength(128).IsRequired();

        builder.Property(x => x.StartedAt).IsRequired();
        builder.Property(x => x.Status).HasMaxLength(32).IsRequired();
        builder.Property(x => x.ProofGateReportPath).HasMaxLength(512);
        builder.Property(x => x.CreatedAt).IsRequired();

        builder.HasIndex(x => new { x.SourceFamily, x.StartedAt });
        builder.HasIndex(x => x.Status);
    }
}
