using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TerraFusion.Core.Entities;

namespace TerraFusion.Data.Configurations;

public sealed class CertificationStepConfiguration : IEntityTypeConfiguration<CertificationStep>
{
    public void Configure(EntityTypeBuilder<CertificationStep> builder)
    {
        builder.ToTable("CertificationSteps");
        builder.HasKey(e => e.Id);

        builder.Property(e => e.StepCode).IsRequired().HasMaxLength(50);
        builder.Property(e => e.Status).IsRequired().HasMaxLength(20);
        builder.Property(e => e.CompletedBy).HasMaxLength(200);
        builder.Property(e => e.Notes).HasColumnType("text");
        builder.Property(e => e.CreatedBy).HasMaxLength(200);
        builder.Property(e => e.UpdatedBy).HasMaxLength(200);
        builder.Property(e => e.CreatedAt).IsRequired();
        builder.Property(e => e.UpdatedAt).IsRequired();

        builder.HasOne(e => e.County)
            .WithMany()
            .HasForeignKey(e => e.CountyId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne<CertificationStep>()
            .WithMany()
            .HasForeignKey(e => e.DependsOnStepId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasIndex(e => new { e.CountyId, e.Id });
        builder.HasIndex(e => new { e.CountyId, e.TaxYear, e.StepCode }).IsUnique();
        builder.HasIndex(e => new { e.CountyId, e.TaxYear, e.Status });
    }
}
