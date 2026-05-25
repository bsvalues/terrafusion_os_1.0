using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TerraFusion.Modules.CurrentUse.Entities;

namespace TerraFusion.Modules.CurrentUse.Persistence.Configurations;

public sealed class CurrentUseClassificationConfiguration : IEntityTypeConfiguration<CurrentUseClassification>
{
    public void Configure(EntityTypeBuilder<CurrentUseClassification> builder)
    {
        builder.ToTable("CurrentUseClassifications");

        builder.HasKey(x => x.Id);

        builder.Property(x => x.ClassificationType).HasConversion<string>().HasMaxLength(64).IsRequired();
        builder.Property(x => x.LifecycleState).HasConversion<string>().HasMaxLength(64).IsRequired();

        builder.Property(x => x.ClassifiedAcres).HasPrecision(18, 4);
        builder.Property(x => x.TotalParcelAcresSnapshot).HasPrecision(18, 4);
        builder.Property(x => x.HomesiteExcludedAcres).HasPrecision(18, 4);

        builder.Property(x => x.CurrentUseApplicationNumber).HasMaxLength(128);
        builder.Property(x => x.AgreementNumber).HasMaxLength(128);
        builder.Property(x => x.ContiguousGroupId).HasMaxLength(128);

        builder.Property(x => x.CreatedBy).HasMaxLength(256).IsRequired();
        builder.Property(x => x.UpdatedBy).HasMaxLength(256).IsRequired();

        builder.HasIndex(x => new { x.CountyId, x.ParcelId, x.Active });
        builder.HasIndex(x => new { x.CountyId, x.ClassificationType });
        builder.HasIndex(x => new { x.CountyId, x.LifecycleState });
    }
}
