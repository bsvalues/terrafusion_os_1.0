using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TerraFusion.Core.Entities.SyncBridge;

namespace TerraFusion.Data.Configurations.SyncBridge;

public sealed class WritebackJournalConfiguration : IEntityTypeConfiguration<WritebackJournal>
{
    public void Configure(EntityTypeBuilder<WritebackJournal> builder)
    {
        builder.ToTable("writeback_journal", schema: "sync_bridge");
        builder.HasKey(x => x.JournalId);

        builder.Property(x => x.TfEntityType).HasMaxLength(50).IsRequired();
        builder.Property(x => x.TfEntityId).IsRequired();
        builder.Property(x => x.TargetSystem).HasMaxLength(50).IsRequired();
        builder.Property(x => x.TargetTable).HasMaxLength(100).IsRequired();
        builder.Property(x => x.TargetKeyJson).IsRequired();
        builder.Property(x => x.FieldName).HasMaxLength(100).IsRequired();
        builder.Property(x => x.AuthorityId).IsRequired();
        builder.Property(x => x.Status).HasMaxLength(32).IsRequired();
        builder.Property(x => x.Operator).HasMaxLength(128).IsRequired();
        builder.Property(x => x.CreatedAt).IsRequired();

        builder.HasIndex(x => new { x.TargetSystem, x.Status });
        builder.HasIndex(x => x.LoadBatchId);
    }
}
