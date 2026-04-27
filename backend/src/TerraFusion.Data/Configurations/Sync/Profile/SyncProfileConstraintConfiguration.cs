using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TerraFusion.Core.Entities.Sync.Profile;

namespace TerraFusion.Data.Configurations.Sync.Profile;

public sealed class SyncProfileConstraintConfiguration : IEntityTypeConfiguration<SyncProfileConstraint>
{
    public void Configure(EntityTypeBuilder<SyncProfileConstraint> builder)
    {
        builder.ToTable("SyncProfileConstraints");
        builder.HasKey(x => x.Id);

        builder.Property(x => x.SourceSystem).HasMaxLength(64).IsRequired();
        builder.Property(x => x.SchemaName).HasMaxLength(128).IsRequired();
        builder.Property(x => x.TableName).HasMaxLength(256).IsRequired();
        builder.Property(x => x.ConstraintName).HasMaxLength(256).IsRequired();
        builder.Property(x => x.ConstraintType).HasMaxLength(32).IsRequired();
        builder.Property(x => x.Definition).HasMaxLength(4000);
        builder.Property(x => x.ReferencedTable).HasMaxLength(256);
        builder.Property(x => x.ReferencedColumns).HasMaxLength(1024);
        builder.Property(x => x.Notes).HasMaxLength(2048);
        builder.Property(x => x.CreatedBy).HasMaxLength(200);
        builder.Property(x => x.UpdatedBy).HasMaxLength(200);

        builder.HasIndex(x => new { x.SyncBatchId, x.TableName, x.ConstraintType });
        builder.HasIndex(x => new { x.CountyId, x.SourceSystem, x.TableName });

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
