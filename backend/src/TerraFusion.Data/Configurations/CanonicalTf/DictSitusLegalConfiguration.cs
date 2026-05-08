using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TerraFusion.Core.Entities.CanonicalTf;

namespace TerraFusion.Data.Configurations.CanonicalTf;

/// <summary>
/// Slice E1 (Phase 2 closure): EF configuration for
/// <see cref="DictSitusLegal"/>. Schema <c>canonical_tf</c>;
/// table <c>dict_situs_legal</c>.
///
/// <para>Mirrors <see cref="DictNeighborhoodConfiguration"/>
/// exactly. <c>(CountyId, SitusLegalCd)</c> is the natural
/// unique key.</para>
/// </summary>
public sealed class DictSitusLegalConfiguration
    : IEntityTypeConfiguration<DictSitusLegal>
{
    public void Configure(EntityTypeBuilder<DictSitusLegal> builder)
    {
        builder.ToTable("dict_situs_legal", schema: "canonical_tf");

        builder.HasKey(x => x.DictSitusLegalId);
        builder.Property(x => x.DictSitusLegalId).IsRequired();
        builder.Property(x => x.CountyId).IsRequired();

        builder.Property(x => x.SitusLegalCd)
            .IsRequired()
            .HasMaxLength(10);
        builder.Property(x => x.Description).HasMaxLength(1000);

        builder.Property(x => x.IsActive)
            .IsRequired()
            .HasDefaultValue(true);

        builder.Property(x => x.LoadBatchId).IsRequired();
        builder.Property(x => x.SourceQueryHash)
            .IsRequired()
            .HasMaxLength(64);

        builder.Property(x => x.CreatedAt).IsRequired();
        builder.Property(x => x.UpdatedAt).IsRequired();

        builder.HasIndex(x => new { x.CountyId, x.SitusLegalCd })
            .IsUnique()
            .HasDatabaseName("ux_dict_situs_legal_county_code");

        builder.HasIndex(x => new { x.CountyId, x.SitusLegalCd, x.IsActive })
            .HasDatabaseName("ix_dict_situs_legal_county_code_active");

        builder.HasIndex(x => x.LoadBatchId)
            .HasDatabaseName("ix_dict_situs_legal_load_batch");
    }
}
