using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TerraFusion.Core.Entities.SyncBridge;

namespace TerraFusion.Data.Configurations.SyncBridge;

public sealed class RollbackPackageConfiguration : IEntityTypeConfiguration<RollbackPackage>
{
    public void Configure(EntityTypeBuilder<RollbackPackage> builder)
    {
        builder.ToTable("rollback_package", schema: "sync_bridge");
        builder.HasKey(x => x.RollbackPackageId);

        builder.Property(x => x.LoadBatchId).IsRequired();
        builder.Property(x => x.PackagePayload).IsRequired();
        builder.Property(x => x.PackageSizeBytes).IsRequired();
        builder.Property(x => x.AppliedBy).HasMaxLength(128);
        builder.Property(x => x.Status).HasMaxLength(32).IsRequired();
        builder.Property(x => x.CreatedAt).IsRequired();

        builder.HasIndex(x => x.LoadBatchId).IsUnique();
        builder.HasIndex(x => new { x.Status, x.RestorableUntil });
    }
}
