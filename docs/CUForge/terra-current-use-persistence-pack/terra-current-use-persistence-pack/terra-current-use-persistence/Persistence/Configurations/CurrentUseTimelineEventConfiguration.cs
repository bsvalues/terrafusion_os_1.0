using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TerraFusion.Modules.CurrentUse.Entities;

namespace TerraFusion.Modules.CurrentUse.Persistence.Configurations;

public sealed class CurrentUseTimelineEventConfiguration : IEntityTypeConfiguration<CurrentUseTimelineEvent>
{
    public void Configure(EntityTypeBuilder<CurrentUseTimelineEvent> builder)
    {
        builder.ToTable("CurrentUseTimelineEvents");

        builder.HasKey(x => x.Id);

        builder.Property(x => x.EventType).HasMaxLength(128).IsRequired();
        builder.Property(x => x.ActorId).HasMaxLength(256).IsRequired();
        builder.Property(x => x.ActorDisplayName).HasMaxLength(256).IsRequired();
        builder.Property(x => x.Summary).HasMaxLength(2048).IsRequired();
        builder.Property(x => x.PayloadJson).HasColumnType("nvarchar(max)");

        builder.HasIndex(x => new { x.CountyId, x.ParcelId, x.EventDate });
        builder.HasIndex(x => x.ClassificationId);
        builder.HasIndex(x => x.CorrectionOfEventId);
    }
}
