using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TerraFusion.Core.Entities.CanonicalTf;

namespace TerraFusion.Data.Configurations.CanonicalTf;

/// <summary>
/// Slice B3: EF configuration for
/// <see cref="TfOwner"/>. Schema <c>canonical_tf</c>; table <c>tf_owner</c>.
/// </summary>
public sealed class TfOwnerConfiguration : IEntityTypeConfiguration<TfOwner>
{
    public void Configure(EntityTypeBuilder<TfOwner> builder)
    {
        builder.ToTable("tf_owner", schema: "canonical_tf");

        builder.HasKey(x => x.TfOwnerId);
        builder.Property(x => x.TfOwnerId).IsRequired();
        builder.Property(x => x.CountyId).IsRequired();
        builder.Property(x => x.AcctId).IsRequired();

        builder.Property(x => x.DisplayName).HasMaxLength(200).IsRequired();
        builder.Property(x => x.FirstName).HasMaxLength(100);
        builder.Property(x => x.LastName).HasMaxLength(100);
        builder.Property(x => x.TypeOfOwner).HasMaxLength(8);

        builder.Property(x => x.PromotionLoadBatchId).IsRequired();
        builder.Property(x => x.CreatedAt).IsRequired();
        builder.Property(x => x.UpdatedAt).IsRequired();

        // County-isolated reads.
        builder.HasIndex(x => x.CountyId)
            .HasDatabaseName("ix_tf_owner_county");

        // Operator-recognition lookup by acct_id.
        builder.HasIndex(x => x.AcctId)
            .HasDatabaseName("ix_tf_owner_acctid");

        // Idempotency-key path: re-projecting a truth batch
        // identifies prior canonical rows by the promotion batch id.
        builder.HasIndex(x => x.PromotionLoadBatchId)
            .HasDatabaseName("ix_tf_owner_promotion_batch");

        // Confidentiality scans (audit surface).
        builder.HasIndex(x => x.ConfidentialFlag)
            .HasDatabaseName("ix_tf_owner_confidential");

        // G2 (v1.11): conversion-era marker.
        builder.Property(x => x.ConversionEra).HasMaxLength(20);
        builder.HasIndex(x => x.ConversionEra)
            .HasDatabaseName("ix_tf_owner_conversion_era");
    }
}
