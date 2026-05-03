using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TerraFusion.Core.Entities.CanonicalTf;

namespace TerraFusion.Data.Configurations.CanonicalTf;

/// <summary>
/// Slice E2: EF configuration for <see cref="AttributeDefinition"/>.
/// Schema <c>canonical_tf</c>; table <c>attribute_definition</c>.
///
/// <para>Per Block-C contract v1.2
/// (<c>docs/pacs/block-c-contract-v1.2.md</c>):
///  - <c>(CountyId, IAttrId)</c> is the natural unique key
///    (sovereign-county isolation + closed-vocab uniqueness).
///  - <c>(CountyId, AttributeCode)</c> is also unique within a
///    county to prevent two i_attr_ids from collapsing onto the
///    same canonical handle.
///  - Every row carries <c>LoadBatchId</c> + <c>SourceQueryHash</c>
///    provenance.</para>
/// </summary>
public sealed class AttributeDefinitionConfiguration
    : IEntityTypeConfiguration<AttributeDefinition>
{
    public void Configure(EntityTypeBuilder<AttributeDefinition> builder)
    {
        builder.ToTable("attribute_definition", schema: "canonical_tf");

        builder.HasKey(x => x.AttributeDefinitionId);
        builder.Property(x => x.AttributeDefinitionId).IsRequired();
        builder.Property(x => x.CountyId).IsRequired();

        builder.Property(x => x.IAttrId).IsRequired();

        builder.Property(x => x.AttributeCode)
            .IsRequired()
            .HasMaxLength(20);
        builder.Property(x => x.AttributeName).HasMaxLength(200);

        builder.Property(x => x.DataType)
            .IsRequired()
            .HasMaxLength(20);
        builder.Property(x => x.ValueDomain).HasMaxLength(50);

        builder.Property(x => x.AppliesTo)
            .IsRequired()
            .HasMaxLength(20);

        builder.Property(x => x.IsActive)
            .IsRequired()
            .HasDefaultValue(true);

        // Provenance.
        builder.Property(x => x.LoadBatchId).IsRequired();
        builder.Property(x => x.SourceQueryHash)
            .IsRequired()
            .HasMaxLength(64);

        builder.Property(x => x.CreatedAt).IsRequired();
        builder.Property(x => x.UpdatedAt).IsRequired();

        // Sovereign-county isolated uniqueness on the PACS-side
        // natural key. Same i_attr_id can exist in different
        // counties with different meanings; never within one.
        builder.HasIndex(x => new { x.CountyId, x.IAttrId })
            .IsUnique()
            .HasDatabaseName("ux_attribute_definition_county_iattr");

        // Canonical-handle uniqueness within a county prevents two
        // i_attr_ids from collapsing onto the same AttributeCode.
        builder.HasIndex(x => new { x.CountyId, x.AttributeCode })
            .IsUnique()
            .HasDatabaseName("ux_attribute_definition_county_code");

        // Active-only lookup.
        builder.HasIndex(x => new { x.CountyId, x.IsActive })
            .HasDatabaseName("ix_attribute_definition_county_active");

        // AppliesTo scan (e.g. "all attributes for IMPROVEMENT in
        // county X").
        builder.HasIndex(x => new { x.CountyId, x.AppliesTo })
            .HasDatabaseName("ix_attribute_definition_county_applies");

        // Provenance lookups.
        builder.HasIndex(x => x.LoadBatchId)
            .HasDatabaseName("ix_attribute_definition_load_batch");
    }
}
