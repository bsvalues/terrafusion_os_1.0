using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TerraFusion.Core.Entities.SyncBridge;

namespace TerraFusion.Data.Configurations.SyncBridge;

public sealed class SourceXrefConfiguration : IEntityTypeConfiguration<SourceXref>
{
    public void Configure(EntityTypeBuilder<SourceXref> builder)
    {
        builder.ToTable("source_xref", schema: "sync_bridge");
        builder.HasKey(x => x.XrefId);
        builder.Property(x => x.XrefId).ValueGeneratedOnAdd();

        builder.Property(x => x.TfEntityType).HasMaxLength(50).IsRequired();
        builder.Property(x => x.TfEntityId).IsRequired();
        builder.Property(x => x.SourceSystem).HasMaxLength(50).IsRequired();
        builder.Property(x => x.SourceDatabase).HasMaxLength(100);
        builder.Property(x => x.SourceTable).HasMaxLength(100);

        // SourceKeyJson: text in SQLite, jsonb in Postgres. EF Core
        // models as string; the migration emits the jsonb column type
        // explicitly for Postgres.
        builder.Property(x => x.SourceKeyJson).IsRequired();

        builder.Property(x => x.SourceQueryHash).HasMaxLength(128).IsRequired();
        builder.Property(x => x.LoadBatchId).IsRequired();

        builder.Property(x => x.FirstSeenAt).IsRequired();
        builder.Property(x => x.LastSeenAt).IsRequired();

        builder.Property(x => x.ConfidenceScore).HasPrecision(5, 2).IsRequired();
        builder.Property(x => x.IsActive).IsRequired();

        builder.HasIndex(x => new { x.TfEntityType, x.TfEntityId, x.SourceSystem }).IsUnique();
        builder.HasIndex(x => x.LoadBatchId);
        builder.HasIndex(x => new { x.SourceSystem, x.SourceTable });
    }
}
