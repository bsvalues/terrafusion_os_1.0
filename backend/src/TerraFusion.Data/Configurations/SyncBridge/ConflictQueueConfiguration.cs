using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TerraFusion.Core.Entities.SyncBridge;

namespace TerraFusion.Data.Configurations.SyncBridge;

public sealed class ConflictQueueConfiguration : IEntityTypeConfiguration<ConflictQueue>
{
    public void Configure(EntityTypeBuilder<ConflictQueue> builder)
    {
        builder.ToTable("conflict_queue", schema: "sync_bridge");
        builder.HasKey(x => x.ConflictId);

        builder.Property(x => x.LoadBatchId).IsRequired();
        builder.Property(x => x.TfEntityType).HasMaxLength(50).IsRequired();
        builder.Property(x => x.TfEntityId).IsRequired();
        builder.Property(x => x.FieldName).HasMaxLength(100).IsRequired();
        builder.Property(x => x.DomainName).HasMaxLength(50).IsRequired();
        builder.Property(x => x.ConflictStrategy).HasMaxLength(50).IsRequired();
        builder.Property(x => x.ResolutionStatus).HasMaxLength(32).IsRequired();
        builder.Property(x => x.ResolvedBy).HasMaxLength(128);
        builder.Property(x => x.CreatedAt).IsRequired();

        builder.HasIndex(x => new { x.ResolutionStatus, x.CreatedAt });
        builder.HasIndex(x => x.LoadBatchId);
    }
}
