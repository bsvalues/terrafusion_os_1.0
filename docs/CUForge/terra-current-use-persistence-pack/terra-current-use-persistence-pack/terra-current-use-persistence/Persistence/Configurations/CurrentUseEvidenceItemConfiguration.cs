using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TerraFusion.Modules.CurrentUse.Entities;

namespace TerraFusion.Modules.CurrentUse.Persistence.Configurations;

public sealed class CurrentUseEvidenceItemConfiguration : IEntityTypeConfiguration<CurrentUseEvidenceItem>
{
    public void Configure(EntityTypeBuilder<CurrentUseEvidenceItem> builder)
    {
        builder.ToTable("CurrentUseEvidenceItems");

        builder.HasKey(x => x.Id);

        builder.Property(x => x.EvidenceType).HasMaxLength(128).IsRequired();
        builder.Property(x => x.Status).HasMaxLength(64).IsRequired();
        builder.Property(x => x.ReviewedBy).HasMaxLength(256);
        builder.Property(x => x.Notes).HasMaxLength(2048);
        builder.Property(x => x.CreatedBy).HasMaxLength(256).IsRequired();
        builder.Property(x => x.UpdatedBy).HasMaxLength(256).IsRequired();

        builder.HasIndex(x => new { x.CountyId, x.ParcelId });
        builder.HasIndex(x => new { x.CountyId, x.EvidenceType, x.Status });
        builder.HasIndex(x => x.DocumentId);
    }
}
