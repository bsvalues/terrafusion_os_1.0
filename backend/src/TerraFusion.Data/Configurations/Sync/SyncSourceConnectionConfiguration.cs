using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TerraFusion.Core.Entities.Sync;

namespace TerraFusion.Data.Configurations.Sync;

public sealed class SyncSourceConnectionConfiguration : IEntityTypeConfiguration<SyncSourceConnection>
{
    public void Configure(EntityTypeBuilder<SyncSourceConnection> builder)
    {
        builder.ToTable("SyncSourceConnections");
        builder.HasKey(x => x.Id);

        builder.Property(x => x.Name).HasMaxLength(200).IsRequired();
        builder.Property(x => x.SourceSystem).HasMaxLength(64).IsRequired();
        builder.Property(x => x.ConnectionType).HasMaxLength(64).IsRequired();
        builder.Property(x => x.Server).HasMaxLength(256);
        builder.Property(x => x.Database).HasMaxLength(256);
        builder.Property(x => x.AuthMode).HasMaxLength(32).IsRequired();
        builder.Property(x => x.Username).HasMaxLength(256);
        builder.Property(x => x.AdditionalOptions).HasMaxLength(2048);
        builder.Property(x => x.LastConnectionErrorMessage).HasMaxLength(2048);
        builder.Property(x => x.Notes).HasMaxLength(2048);
        builder.Property(x => x.CreatedBy).HasMaxLength(200);
        builder.Property(x => x.UpdatedBy).HasMaxLength(200);

        // Operator can have only one connection per (county, name) — name is the disambiguator.
        builder.HasIndex(x => new { x.CountyId, x.Name }).IsUnique();
        builder.HasIndex(x => new { x.CountyId, x.SourceSystem });
        builder.HasIndex(x => new { x.CountyId, x.IsActive });

        builder.HasOne(x => x.County)
            .WithMany()
            .HasForeignKey(x => x.CountyId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
