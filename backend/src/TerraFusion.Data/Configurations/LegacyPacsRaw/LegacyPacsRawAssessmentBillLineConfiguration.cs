using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TerraFusion.Core.Entities.LegacyPacsRaw;

namespace TerraFusion.Data.Configurations.LegacyPacsRaw;

/// <summary>REVENUE-SPINE Stage 2B: EF config for legacy_pacs_raw.assessment_bill_line.</summary>
public sealed class LegacyPacsRawAssessmentBillLineConfiguration
    : IEntityTypeConfiguration<LegacyPacsRawAssessmentBillLine>
{
    public void Configure(EntityTypeBuilder<LegacyPacsRawAssessmentBillLine> builder)
    {
        builder.ToTable("assessment_bill_line", schema: "legacy_pacs_raw");
        builder.HasKey(x => x.LandedRowId);
        builder.Property(x => x.BillId).IsRequired();
        builder.Property(x => x.PropId).IsRequired();
        builder.Property(x => x.TaxYr).IsRequired();
        builder.Property(x => x.SupNum).IsRequired();
        builder.Property(x => x.BillType).HasMaxLength(8);
        builder.Property(x => x.AgencyId).IsRequired();
        builder.Property(x => x.CurrentAmountDue).HasPrecision(18, 2);
        builder.Property(x => x.AmountPaid).HasPrecision(18, 2);
        builder.Property(x => x.LoadBatchId).IsRequired();
        builder.Property(x => x.SourceQueryHash).HasMaxLength(64).IsRequired();
        builder.Property(x => x.SourceRowHash).HasMaxLength(64).IsRequired();
        builder.Property(x => x.LandedAt).IsRequired();
        builder.HasIndex(x => new { x.PropId, x.TaxYr })
            .HasDatabaseName("ix_legacy_pacs_raw_assessment_bill_line_prop_year");
        builder.HasIndex(x => x.LoadBatchId)
            .HasDatabaseName("ix_legacy_pacs_raw_assessment_bill_line_loadbatch");
    }
}
