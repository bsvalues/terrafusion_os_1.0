using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TerraFusion.Core.Entities.LegacyPacsRaw;

namespace TerraFusion.Data.Configurations.LegacyPacsRaw;

/// <summary>
/// Slice B1-C: EF configuration for
/// <see cref="LegacyPacsRawWashPropOwnerVal"/>. Schema
/// <c>legacy_pacs_raw</c>; table <c>wash_prop_owner_val</c>.
///
/// <para>Note: PACS enforces UNIQUE(<c>year, sup_num, prop_id,
/// owner_id</c>). The landing layer deliberately does NOT enforce
/// that constraint at the database level so the
/// <c>wash-prop-owner-val-key-uniqueness</c> gate can FAIL the
/// batch with the actual duplicate count rather than crashing on
/// insert.</para>
/// </summary>
public sealed class LegacyPacsRawWashPropOwnerValConfiguration
    : IEntityTypeConfiguration<LegacyPacsRawWashPropOwnerVal>
{
    public void Configure(EntityTypeBuilder<LegacyPacsRawWashPropOwnerVal> builder)
    {
        builder.ToTable("wash_prop_owner_val", schema: "legacy_pacs_raw");

        builder.HasKey(x => x.LandedRowId);
        builder.Property(x => x.LandedRowId).IsRequired();

        builder.Property(x => x.PropValYr).IsRequired();
        builder.Property(x => x.SupNum).IsRequired();
        builder.Property(x => x.PropId).IsRequired();
        builder.Property(x => x.OwnerId).IsRequired();

        // WSDOR value fields — currency precision (18, 2).
        builder.Property(x => x.AssessedVal).HasPrecision(18, 2);
        builder.Property(x => x.MarketVal).HasPrecision(18, 2);
        builder.Property(x => x.AppraisedVal).HasPrecision(18, 2);
        builder.Property(x => x.TaxableClassified).HasPrecision(18, 2);
        builder.Property(x => x.TaxableNonClassified).HasPrecision(18, 2);
        builder.Property(x => x.LandTaxableClassified).HasPrecision(18, 2);
        builder.Property(x => x.LandTaxableNonClassified).HasPrecision(18, 2);
        builder.Property(x => x.ImprvTaxableClassified).HasPrecision(18, 2);
        builder.Property(x => x.ImprvTaxableNonClassified).HasPrecision(18, 2);
        builder.Property(x => x.StateValueClassified).HasPrecision(18, 2);
        builder.Property(x => x.StateValueNonClassified).HasPrecision(18, 2);

        builder.Property(x => x.BoeStatus).HasMaxLength(8);
        builder.Property(x => x.DisasterProrationPct).HasPrecision(7, 4);
        builder.Property(x => x.SnrFrzImprvHs).HasPrecision(18, 2);
        builder.Property(x => x.SnrFrzLandHs).HasPrecision(18, 2);

        builder.Property(x => x.LoadBatchId).IsRequired();
        builder.Property(x => x.SourceQueryHash).HasMaxLength(64).IsRequired();
        builder.Property(x => x.SourceRowHash).HasMaxLength(64).IsRequired();
        builder.Property(x => x.LandedAt).IsRequired();

        // Read by the 4-key composite.
        builder.HasIndex(x => new { x.PropId, x.PropValYr, x.SupNum, x.OwnerId })
            .HasDatabaseName("ix_legacy_pacs_raw_wpov_4key");

        // Re-runs / rollback.
        builder.HasIndex(x => x.LoadBatchId)
            .HasDatabaseName("ix_legacy_pacs_raw_wpov_loadbatch");

        // BOE status scans (audit surface).
        builder.HasIndex(x => x.BoeStatus)
            .HasDatabaseName("ix_legacy_pacs_raw_wpov_boe_status");
    }
}
