using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TerraFusion.Core.Entities;

namespace TerraFusion.Data.Configurations;

public sealed class OwnershipEventConfiguration : IEntityTypeConfiguration<OwnershipEvent>
{
    public void Configure(EntityTypeBuilder<OwnershipEvent> builder)
    {
        builder.ToTable("OwnershipEvents");
        builder.HasKey(x => x.Id);

        builder.Property(x => x.SourceSystem).HasMaxLength(64).IsRequired();
        builder.Property(x => x.SourceOwnerId).HasMaxLength(128);
        builder.Property(x => x.SourceChangeOfOwnerId).HasMaxLength(128);
        builder.Property(x => x.CreatedBy).HasMaxLength(200);
        builder.Property(x => x.UpdatedBy).HasMaxLength(200);

        builder.HasIndex(x => new { x.CountyId, x.PropertyId, x.EffectiveFrom });
        builder.HasIndex(x => new { x.CountyId, x.OwnerId });
        builder.HasIndex(x => new { x.CountyId, x.PropertyId, x.EffectiveThrough });

        builder.HasOne(x => x.County)
            .WithMany()
            .HasForeignKey(x => x.CountyId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(x => x.Owner)
            .WithMany()
            .HasForeignKey(x => x.OwnerId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(x => x.Property)
            .WithMany()
            .HasForeignKey(x => x.PropertyId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
