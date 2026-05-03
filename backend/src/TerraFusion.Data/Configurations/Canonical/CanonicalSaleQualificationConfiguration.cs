using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TerraFusion.Core.Entities.Canonical;

namespace TerraFusion.Data.Configurations.Canonical;

/// <summary>
/// Slice C35-B: EF configuration for the FIRST canonical landing
/// table in TerraFusion (<see cref="CanonicalSaleQualification"/>).
/// See <c>docs/sync/canonical-sales-qualification-landing-schema-policy.md</c>
/// (C35-A) for the full contract.
///
/// <para>Conventions match the existing Sync configurations:
/// <list type="bullet">
/// <item>Bracket-quoted PascalCase table name.</item>
/// <item>Composite primary key on <c>(CountyId, ChgOfOwnerId)</c> per
///   D0-D's PACS canonical sale identity.</item>
/// <item>Soft references to <c>SyncMappingWorkbooks</c> (Guid +
///   timestamp); no hard FK because workbooks may be Archived /
///   replaced over time but historical decision rows stay valid.</item>
/// <item>Enums stored as <c>int</c> for forward-compat - extending
///   the vocabulary later doesn't require a string-rename
///   migration.</item>
/// <item>Two indices:
///   <list type="bullet">
///   <item><c>(SourceWorkbookId, ComputedDecision)</c> - "all
///     Qualified sales for this workbook," primary consumer query.</item>
///   <item><c>(CountyId, ComputedDecision)</c> - county-wide rollups
///     bypassing workbook scope.</item>
///   </list>
/// </item>
/// </list>
/// </para>
/// </summary>
public sealed class CanonicalSaleQualificationConfiguration
    : IEntityTypeConfiguration<CanonicalSaleQualification>
{
    public void Configure(EntityTypeBuilder<CanonicalSaleQualification> builder)
    {
        builder.ToTable("CanonicalSaleQualifications");

        // Primary key: (CountyId, ChgOfOwnerId) per D0-D.
        builder.HasKey(x => new { x.CountyId, x.ChgOfOwnerId });

        // Decision enums stored as int for forward-compat.
        builder.Property(x => x.ComputedDecision).HasConversion<int>().IsRequired();
        builder.Property(x => x.WacCdAxisDecision).HasConversion<int>().IsRequired();
        builder.Property(x => x.SlRatioTypeCdAxisDecision).HasConversion<int>().IsRequired();

        // Per-axis source/canonical strings - bounded for index efficiency.
        builder.Property(x => x.WacCdSourceValue).HasMaxLength(64);
        builder.Property(x => x.WacCdCanonicalValue).HasMaxLength(256);
        builder.Property(x => x.SlRatioTypeCdSourceValue).HasMaxLength(64);
        builder.Property(x => x.SlRatioTypeCdCanonicalValue).HasMaxLength(256);

        // Workbook provenance - soft references, no FK constraint.
        builder.Property(x => x.SourceWorkbookId).IsRequired();
        builder.Property(x => x.SourceWorkbookLockedAt).IsRequired();

        // PACS sale snapshot (optional).
        builder.Property(x => x.SalePrice).HasPrecision(14, 2);

        // Audit fields.
        builder.Property(x => x.CreatedBy).HasMaxLength(200);
        builder.Property(x => x.UpdatedBy).HasMaxLength(200);

        // Primary consumer index: per-workbook decision rollups.
        builder.HasIndex(x => new { x.SourceWorkbookId, x.ComputedDecision })
               .HasDatabaseName("IX_CanonSaleQual_Workbook_Decision");

        // Secondary consumer index: county-wide decision rollups.
        builder.HasIndex(x => new { x.CountyId, x.ComputedDecision })
               .HasDatabaseName("IX_CanonSaleQual_County_Decision");
    }
}
