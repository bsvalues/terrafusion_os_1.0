using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TerraFusion.Core.Entities;

namespace TerraFusion.Data.Configurations;

public class PropertyWorkbenchFlagConfiguration : IEntityTypeConfiguration<PropertyWorkbenchFlag>
{
    public void Configure(EntityTypeBuilder<PropertyWorkbenchFlag> builder)
    {
        builder.ToTable("PropertyWorkbenchFlags");
        builder.HasKey(e => e.Id);
        builder.Property(e => e.ParcelId).IsRequired().HasMaxLength(50);
        builder.Property(e => e.Reason).IsRequired().HasMaxLength(500);
        builder.Property(e => e.Status).HasMaxLength(20);
        builder.Property(e => e.CreatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");
        builder.Property(e => e.UpdatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");

        builder.HasOne(e => e.CalibrationFinding)
            .WithMany()
            .HasForeignKey(e => e.CalibrationFindingId)
            .IsRequired(false)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasIndex(e => e.ParcelId).HasDatabaseName("IX_PropertyWorkbenchFlags_ParcelId");
    }
}
