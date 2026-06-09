using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TerraFusion.Core.Entities.CanonicalTf;

namespace TerraFusion.Data.Configurations.CanonicalTf;

/// <summary>REVENUE-SPINE Stage 2B: EF config for canonical_tf.tf_assessment_agency.</summary>
public sealed class TfAssessmentAgencyConfiguration : IEntityTypeConfiguration<TfAssessmentAgency>
{
    public void Configure(EntityTypeBuilder<TfAssessmentAgency> builder)
    {
        builder.ToTable("tf_assessment_agency", schema: "canonical_tf");
        builder.HasKey(x => x.TfAssessmentAgencyId);
        builder.Property(x => x.CountyId).IsRequired();
        builder.Property(x => x.AgencyId).IsRequired();
        builder.Property(x => x.AssessmentCd).HasMaxLength(64);
        builder.Property(x => x.AssessmentTypeCd).HasMaxLength(64);
        builder.Property(x => x.AssessmentDescription).HasMaxLength(128);
        builder.Property(x => x.LoadBatchId).IsRequired();
        builder.Property(x => x.SourceQueryHash).HasMaxLength(64);
        builder.HasIndex(x => new { x.CountyId, x.AgencyId })
            .IsUnique().HasDatabaseName("ux_tf_assessment_agency_key");
    }
}
