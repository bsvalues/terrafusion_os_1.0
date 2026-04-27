using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TerraFusion.Core.Entities.Sync.Profile;

namespace TerraFusion.Data.Configurations.Sync.Profile;

public sealed class SyncProfileColumnStatsConfiguration : IEntityTypeConfiguration<SyncProfileColumnStats>
{
    public void Configure(EntityTypeBuilder<SyncProfileColumnStats> builder)
    {
        builder.ToTable("SyncProfileColumnStats");
        builder.HasKey(x => x.Id);

        builder.Property(x => x.SourceSystem).HasMaxLength(64).IsRequired();
        builder.Property(x => x.SchemaName).HasMaxLength(128).IsRequired();
        builder.Property(x => x.TableName).HasMaxLength(256).IsRequired();
        builder.Property(x => x.ColumnName).HasMaxLength(256).IsRequired();
        builder.Property(x => x.MinValue).HasMaxLength(2048);
        builder.Property(x => x.MaxValue).HasMaxLength(2048);
        // SampleValuesJson + TopValuesJson are unbounded text on Postgres /
        // nvarchar(max) on SQL Server fallback. Up to 100 sample/top entries
        // each, every value string-encoded — ~200 KB worst case per column,
        // but typical rows will be a fraction of that.
        builder.Property(x => x.CreatedBy).HasMaxLength(200);
        builder.Property(x => x.UpdatedBy).HasMaxLength(200);

        builder.Property(x => x.NullPct).HasPrecision(7, 4);

        // Primary lookup: "all column stats for this batch's columns".
        builder.HasIndex(x => new { x.SyncBatchId, x.SchemaName, x.TableName, x.ColumnName });
        // Secondary lookup: "find this column's stats history across batches".
        builder.HasIndex(x => new { x.CountyId, x.SourceSystem, x.TableName, x.ColumnName });

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
