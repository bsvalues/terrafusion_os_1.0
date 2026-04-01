using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TerraFusion.Core.Entities;

namespace TerraFusion.Data.Configurations;

public sealed class NoticeConfiguration : IEntityTypeConfiguration<Notice>
{
    public void Configure(EntityTypeBuilder<Notice> builder)
    {
        builder.ToTable("Notices");
        builder.HasKey(e => e.Id);

        builder.Property(e => e.ParcelId).IsRequired().HasMaxLength(50);
        builder.Property(e => e.TemplateId).IsRequired().HasMaxLength(50);
        builder.Property(e => e.DeliveryMethod).IsRequired().HasMaxLength(30);
        builder.Property(e => e.Status).IsRequired().HasMaxLength(20);
        builder.Property(e => e.Fields).HasColumnType("text");
        builder.Property(e => e.RcwReference).HasMaxLength(20);
        builder.Property(e => e.FailureReason).HasColumnType("text");
        builder.Property(e => e.CreatedBy).HasMaxLength(200);
        builder.Property(e => e.UpdatedBy).HasMaxLength(200);
        builder.Property(e => e.CreatedAt).IsRequired();
        builder.Property(e => e.UpdatedAt).IsRequired();

        builder.HasOne(e => e.County)
            .WithMany()
            .HasForeignKey(e => e.CountyId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasIndex(e => new { e.CountyId, e.Id });
        builder.HasIndex(e => new { e.CountyId, e.ParcelId, e.CreatedAt });
        builder.HasIndex(e => new { e.CountyId, e.Status, e.CreatedAt });
        builder.HasIndex(e => new { e.CountyId, e.TemplateId });
    }
}
