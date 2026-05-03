using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TerraFusion.Core.Entities.LegacyPacsRaw;

namespace TerraFusion.Data.Configurations.LegacyPacsRaw;

/// <summary>
/// Slice B1-A: EF configuration for
/// <see cref="LegacyPacsRawAccount"/>. Schema
/// <c>legacy_pacs_raw</c>; table <c>account</c>.
///
/// <para>Note: PACS enforces UNIQUE(<c>acct_id</c>) at the source.
/// The landing layer deliberately does NOT enforce that constraint
/// at the database level — duplicates must be VISIBLE so the
/// <c>account-acct-id-uniqueness</c> gate can FAIL the batch with
/// the actual duplicate count rather than crashing on insert.</para>
/// </summary>
public sealed class LegacyPacsRawAccountConfiguration
    : IEntityTypeConfiguration<LegacyPacsRawAccount>
{
    public void Configure(EntityTypeBuilder<LegacyPacsRawAccount> builder)
    {
        builder.ToTable("account", schema: "legacy_pacs_raw");

        builder.HasKey(x => x.LandedRowId);
        builder.Property(x => x.LandedRowId).IsRequired();

        builder.Property(x => x.AcctId).IsRequired();

        builder.Property(x => x.FileAsName).HasMaxLength(200);
        builder.Property(x => x.FirstName).HasMaxLength(100);
        builder.Property(x => x.LastName).HasMaxLength(100);

        builder.Property(x => x.DlNum).HasMaxLength(50);
        builder.Property(x => x.DlState).HasMaxLength(8);
        builder.Property(x => x.EmailAddr).HasMaxLength(255);

        builder.Property(x => x.WebSuppression).IsRequired();
        builder.Property(x => x.ConfidentialFlag).IsRequired();

        builder.Property(x => x.LoadBatchId).IsRequired();
        builder.Property(x => x.SourceQueryHash).HasMaxLength(64).IsRequired();
        builder.Property(x => x.SourceRowHash).HasMaxLength(64).IsRequired();
        builder.Property(x => x.LandedAt).IsRequired();

        // Read by acct_id — the source-side identity.
        builder.HasIndex(x => x.AcctId)
            .HasDatabaseName("ix_legacy_pacs_raw_account_acctid");

        // Re-runs / rollback by load batch.
        builder.HasIndex(x => x.LoadBatchId)
            .HasDatabaseName("ix_legacy_pacs_raw_account_loadbatch");

        // Confidentiality scans.
        builder.HasIndex(x => x.ConfidentialFlag)
            .HasDatabaseName("ix_legacy_pacs_raw_account_confidential");
        builder.HasIndex(x => x.WebSuppression)
            .HasDatabaseName("ix_legacy_pacs_raw_account_websupp");
    }
}
