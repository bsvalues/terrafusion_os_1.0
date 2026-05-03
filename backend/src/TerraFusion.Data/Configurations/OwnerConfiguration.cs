using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TerraFusion.Core.Entities;

namespace TerraFusion.Data.Configurations;

public sealed class OwnerConfiguration : IEntityTypeConfiguration<Owner>
{
    public void Configure(EntityTypeBuilder<Owner> builder)
    {
        builder.ToTable("Owners");
        builder.HasKey(x => x.Id);

        builder.Property(x => x.SourceSystem).HasMaxLength(64).IsRequired();
        builder.Property(x => x.SourceOwnerId).HasMaxLength(128).IsRequired();
        builder.Property(x => x.RawName).HasMaxLength(500).IsRequired();
        builder.Property(x => x.NormalizedName).HasMaxLength(500).IsRequired();
        builder.Property(x => x.RawMailingAddress).HasMaxLength(1000);
        builder.Property(x => x.NormalizedMailingAddress).HasMaxLength(1000);
        builder.Property(x => x.CreatedBy).HasMaxLength(200);
        builder.Property(x => x.UpdatedBy).HasMaxLength(200);

        builder.HasIndex(x => new { x.CountyId, x.SourceSystem, x.SourceOwnerId }).IsUnique();
        builder.HasIndex(x => new { x.CountyId, x.NormalizedName });

        builder.HasOne(x => x.County)
            .WithMany()
            .HasForeignKey(x => x.CountyId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
