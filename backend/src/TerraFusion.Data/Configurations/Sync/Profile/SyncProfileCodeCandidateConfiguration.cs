using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TerraFusion.Core.Entities.Sync.Profile;

namespace TerraFusion.Data.Configurations.Sync.Profile;

public sealed class SyncProfileCodeCandidateConfiguration : IEntityTypeConfiguration<SyncProfileCodeCandidate>
{
    public void Configure(EntityTypeBuilder<SyncProfileCodeCandidate> builder)
    {
        builder.ToTable("SyncProfileCodeCandidates");
        builder.HasKey(x => x.Id);

        builder.Property(x => x.SourceSystem).HasMaxLength(64).IsRequired();
        builder.Property(x => x.SchemaName).HasMaxLength(128).IsRequired();
        builder.Property(x => x.TableName).HasMaxLength(256).IsRequired();
        builder.Property(x => x.ColumnName).HasMaxLength(256).IsRequired();
        builder.Property(x => x.Reason).HasMaxLength(128).IsRequired();
        // CandidateCodesJson is unbounded text — same shape as
        // SyncProfileColumnStats.TopValuesJson.
        builder.Property(x => x.CreatedBy).HasMaxLength(200);
        builder.Property(x => x.UpdatedBy).HasMaxLength(200);

        builder.Property(x => x.DistinctRatio).HasPrecision(7, 4);

        // Primary lookup: "all code candidates for this batch".
        builder.HasIndex(x => new { x.SyncBatchId, x.SchemaName, x.TableName, x.ColumnName });
        // Secondary lookup: "track candidates for this physical column over time".
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
