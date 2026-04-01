using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TerraFusion.Core.Entities;

namespace TerraFusion.Data.Configurations;

public sealed class QueueItemConfiguration : IEntityTypeConfiguration<QueueItem>
{
    public void Configure(EntityTypeBuilder<QueueItem> builder)
    {
        builder.ToTable("QueueItems");
        builder.HasKey(e => e.Id);

        builder.Property(e => e.ParcelId).IsRequired().HasMaxLength(50);
        builder.Property(e => e.TaskType).IsRequired().HasMaxLength(50);
        builder.Property(e => e.Priority).IsRequired().HasMaxLength(20);
        builder.Property(e => e.Status).IsRequired().HasMaxLength(20);
        builder.Property(e => e.AssignedTo).HasMaxLength(200);
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
        builder.HasIndex(e => new { e.CountyId, e.Status, e.CreatedAt });
        builder.HasIndex(e => new { e.CountyId, e.AssignedTo, e.Status });
        builder.HasIndex(e => new { e.CountyId, e.TaskType, e.Status });
    }
}
