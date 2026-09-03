using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TerraFusion.Core.Entities;
using TerraFusion.Core.Entities.Import;

namespace TerraFusion.Data.Configurations.Import;

public sealed class CountyCsvUploadPromotionConfiguration
    : IEntityTypeConfiguration<CountyCsvUploadPromotion>
{
    public void Configure(EntityTypeBuilder<CountyCsvUploadPromotion> builder)
    {
        builder.ToTable("CountyCsvUploadPromotions");
        builder.HasKey(promotion => promotion.BatchId);
        builder.Property(promotion => promotion.PromotedByActorId).HasMaxLength(200).IsRequired();
        builder.Property(promotion => promotion.ContractId).HasMaxLength(128).IsRequired();
        builder.Property(promotion => promotion.ComparableSaleIdsJson).HasColumnType("TEXT").IsRequired();
        builder.Property(promotion => promotion.LatestSaleDate).HasMaxLength(10).IsFixedLength().IsRequired();
        builder.HasIndex(promotion => new { promotion.CountyId, promotion.PromotedAtUtc });

        builder.HasOne<CountyCsvUploadBatch>()
            .WithOne()
            .HasForeignKey<CountyCsvUploadPromotion>(promotion => promotion.BatchId)
            .OnDelete(DeleteBehavior.Cascade);
        builder.HasOne<County>()
            .WithMany()
            .HasForeignKey(promotion => promotion.CountyId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
