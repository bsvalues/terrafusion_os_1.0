using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TerraFusion.Core.Entities;

namespace TerraFusion.Data.Configurations;

public sealed class AppealConfiguration : IEntityTypeConfiguration<Appeal>
{
    public void Configure(EntityTypeBuilder<Appeal> builder)
    {
        builder.ToTable("Appeals");
        builder.HasKey(e => e.Id);

        builder.Property(e => e.ParcelId).IsRequired().HasMaxLength(50);
        builder.Property(e => e.AppealGround).IsRequired().HasMaxLength(30);
        builder.Property(e => e.Status).IsRequired().HasMaxLength(20);
        builder.Property(e => e.PetitionerName).HasMaxLength(200);
        builder.Property(e => e.CurrentValue).HasPrecision(18, 2);
        builder.Property(e => e.RequestedValue).HasPrecision(18, 2);
        builder.Property(e => e.DecidedValue).HasPrecision(18, 2);
        builder.Property(e => e.DecisionNotes).HasColumnType("text");
        builder.Property(e => e.CreatedBy).HasMaxLength(200);
        builder.Property(e => e.UpdatedBy).HasMaxLength(200);
        builder.Property(e => e.CreatedAt).IsRequired();
        builder.Property(e => e.UpdatedAt).IsRequired();

        builder.HasOne(e => e.County)
            .WithMany()
            .HasForeignKey(e => e.CountyId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasIndex(e => new { e.CountyId, e.Id });
        builder.HasIndex(e => new { e.CountyId, e.ParcelId, e.FiledDate });
        builder.HasIndex(e => new { e.CountyId, e.TaxYear, e.FiledDate });
        builder.HasIndex(e => new { e.CountyId, e.Status });
    }
}
