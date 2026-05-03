using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TerraFusion.Core.Entities.Sync.Profile;

namespace TerraFusion.Data.Configurations.Sync.Profile;

public sealed class SyncProfileProcedureConfiguration : IEntityTypeConfiguration<SyncProfileProcedure>
{
    public void Configure(EntityTypeBuilder<SyncProfileProcedure> builder)
    {
        builder.ToTable("SyncProfileProcedures");
        builder.HasKey(x => x.Id);

        builder.Property(x => x.SourceSystem).HasMaxLength(64).IsRequired();
        builder.Property(x => x.SchemaName).HasMaxLength(128).IsRequired();
        builder.Property(x => x.ProcedureName).HasMaxLength(256).IsRequired();
        builder.Property(x => x.Definition).IsRequired();
        builder.Property(x => x.Notes).HasMaxLength(2048);
        builder.Property(x => x.CreatedBy).HasMaxLength(200);
        builder.Property(x => x.UpdatedBy).HasMaxLength(200);

        builder.HasIndex(x => new { x.SyncBatchId, x.SchemaName, x.ProcedureName });
        builder.HasIndex(x => new { x.CountyId, x.SourceSystem, x.ProcedureName });

        builder.HasOne(x => x.County)
            .WithMany()
            .HasForeignKey(x => x.CountyId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(x => x.SyncBatch)
            .WithMany()
            .HasForeignKey(x => x.SyncBatchId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
