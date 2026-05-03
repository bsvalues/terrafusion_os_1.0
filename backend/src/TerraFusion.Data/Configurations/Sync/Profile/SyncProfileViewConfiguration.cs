using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TerraFusion.Core.Entities.Sync.Profile;

namespace TerraFusion.Data.Configurations.Sync.Profile;

public sealed class SyncProfileViewConfiguration : IEntityTypeConfiguration<SyncProfileView>
{
    public void Configure(EntityTypeBuilder<SyncProfileView> builder)
    {
        builder.ToTable("SyncProfileViews");
        builder.HasKey(x => x.Id);

        builder.Property(x => x.SourceSystem).HasMaxLength(64).IsRequired();
        builder.Property(x => x.SchemaName).HasMaxLength(128).IsRequired();
        builder.Property(x => x.ViewName).HasMaxLength(256).IsRequired();
        builder.Property(x => x.Definition).IsRequired();
        builder.Property(x => x.Notes).HasMaxLength(2048);
        builder.Property(x => x.CreatedBy).HasMaxLength(200);
        builder.Property(x => x.UpdatedBy).HasMaxLength(200);

        builder.HasIndex(x => new { x.SyncBatchId, x.SchemaName, x.ViewName });
        builder.HasIndex(x => new { x.CountyId, x.SourceSystem, x.ViewName });

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
