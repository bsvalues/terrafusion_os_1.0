using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TerraFusion.Modules.CurrentUse.Entities;

namespace TerraFusion.Modules.CurrentUse.Persistence.Configurations;

public sealed class CurrentUseRemovalConfiguration : IEntityTypeConfiguration<CurrentUseRemoval>
{
    public void Configure(EntityTypeBuilder<CurrentUseRemoval> builder)
    {
        builder.ToTable("CurrentUseRemovals");

        builder.HasKey(x => x.Id);

        builder.Property(x => x.RemovalType).HasConversion<string>().HasMaxLength(64).IsRequired();
        builder.Property(x => x.Status).HasMaxLength(64).IsRequired();
        builder.Property(x => x.RemovalReason).HasMaxLength(2048).IsRequired();

        builder.Property(x => x.CreatedBy).HasMaxLength(256).IsRequired();
        builder.Property(x => x.UpdatedBy).HasMaxLength(256).IsRequired();

        builder.HasIndex(x => new { x.CountyId, x.ParcelId });
        builder.HasIndex(x => new { x.CountyId, x.Status });
        builder.HasIndex(x => x.ClassificationId);
        builder.HasIndex(x => x.RollbackCalculationId);
    }
}
