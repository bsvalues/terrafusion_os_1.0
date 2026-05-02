using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TerraFusion.Core.Entities.SyncBridge;

namespace TerraFusion.Data.Configurations.SyncBridge;

public sealed class DiffLedgerConfiguration : IEntityTypeConfiguration<DiffLedger>
{
    public void Configure(EntityTypeBuilder<DiffLedger> builder)
    {
        builder.ToTable("diff_ledger", schema: "sync_bridge");
        builder.HasKey(x => x.DiffId);
        builder.Property(x => x.DiffId).ValueGeneratedOnAdd();

        builder.Property(x => x.LoadBatchId).IsRequired();
        builder.Property(x => x.TfEntityType).HasMaxLength(50).IsRequired();
        builder.Property(x => x.TfEntityId).IsRequired();
        builder.Property(x => x.FieldName).HasMaxLength(100).IsRequired();
        builder.Property(x => x.DiffKind).HasMaxLength(32).IsRequired();
        builder.Property(x => x.CreatedAt).IsRequired();

        builder.HasIndex(x => x.LoadBatchId);
        builder.HasIndex(x => new { x.TfEntityType, x.TfEntityId, x.FieldName });
    }
}
