using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TerraFusion.Core.Entities.CanonicalTf;

namespace TerraFusion.Data.Configurations.CanonicalTf;

/// <summary>
/// Sync Bridge v1: EF configuration for
/// <see cref="TerraFusion.Core.Entities.CanonicalTf.TfParcel"/>.
/// Schema 'canonical_tf' on Postgres; flattened table name on
/// SQLite (which doesn't support schemas).
/// </summary>
public sealed class TfParcelConfiguration : IEntityTypeConfiguration<TfParcel>
{
    public void Configure(EntityTypeBuilder<TfParcel> builder)
    {
        builder.ToTable("tf_parcel", schema: "canonical_tf");

        builder.HasKey(x => x.TfParcelId);
        builder.Property(x => x.TfParcelId).IsRequired();
        builder.Property(x => x.CountyId).IsRequired();

        builder.Property(x => x.ParcelNumber).HasMaxLength(50);
        builder.Property(x => x.SitusAddress).HasMaxLength(255);
        builder.Property(x => x.LegalDescription); // text — unbounded

        builder.Property(x => x.ParcelStatus).HasMaxLength(50).IsRequired();
        builder.Property(x => x.PropertyType).HasMaxLength(20);

        builder.Property(x => x.CreatedAt).IsRequired();
        builder.Property(x => x.UpdatedAt).IsRequired();

        builder.HasIndex(x => new { x.CountyId, x.ParcelNumber });
        builder.HasIndex(x => new { x.CountyId, x.ParcelStatus });
    }
}
