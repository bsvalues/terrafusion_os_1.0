using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TerraFusion.Core.Entities;

namespace TerraFusion.Data.Configurations;

public sealed class ExemptionConfiguration : IEntityTypeConfiguration<Exemption>
{
    public void Configure(EntityTypeBuilder<Exemption> builder)
    {
        builder.ToTable("Exemptions");
        builder.HasKey(e => e.Id);

        builder.Property(e => e.ParcelId).IsRequired().HasMaxLength(50);
        builder.Property(e => e.ProgramCode).IsRequired().HasMaxLength(30);
        builder.Property(e => e.Status).IsRequired().HasMaxLength(20);
        builder.Property(e => e.ApplicantName).HasMaxLength(200);
        builder.Property(e => e.ExemptionAmount).HasPrecision(18, 2);
        builder.Property(e => e.RcwReference).HasMaxLength(20);
        builder.Property(e => e.DenialReason).HasColumnType("text");
        builder.Property(e => e.Notes).HasColumnType("text");
        builder.Property(e => e.CreatedBy).HasMaxLength(200);
        builder.Property(e => e.UpdatedBy).HasMaxLength(200);
        builder.Property(e => e.CreatedAt).IsRequired();
        builder.Property(e => e.UpdatedAt).IsRequired();

        builder.HasOne(e => e.County)
            .WithMany()
            .HasForeignKey(e => e.CountyId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasIndex(e => new { e.CountyId, e.Id });
        builder.HasIndex(e => new { e.CountyId, e.ParcelId, e.ApplicationDate });
        builder.HasIndex(e => new { e.CountyId, e.ProgramCode, e.Status });
        builder.HasIndex(e => new { e.CountyId, e.Status });
    }
}
