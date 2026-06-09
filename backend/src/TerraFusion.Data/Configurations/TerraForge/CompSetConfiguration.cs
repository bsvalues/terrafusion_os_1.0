using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TerraFusion.Core.Entities.TerraForge;

namespace TerraFusion.Data.Configurations.TerraForge;

public sealed class CompSetConfiguration : IEntityTypeConfiguration<CompSet>
{
    public void Configure(EntityTypeBuilder<CompSet> builder)
    {
        builder.ToTable("CompSets");

        builder.HasKey(e => e.CompSetId);
        builder.Property(e => e.CountyId).IsRequired();
        builder.Property(e => e.Name).IsRequired().HasMaxLength(200);
        builder.Property(e => e.Mode).IsRequired().HasMaxLength(32);
        builder.Property(e => e.Status).IsRequired().HasMaxLength(32);
        builder.Property(e => e.OfficialStatus).IsRequired().HasMaxLength(32);
        builder.Property(e => e.SubjectParcelId).HasMaxLength(64);
        builder.Property(e => e.SourceSystem).IsRequired().HasMaxLength(100);
        builder.Property(e => e.FederationStatus).IsRequired().HasMaxLength(32);
        builder.Property(e => e.ProvenanceSource).IsRequired().HasMaxLength(100);
        builder.Property(e => e.ProvenanceRuntime).IsRequired().HasMaxLength(32);
        builder.Property(e => e.ProvenanceMutation).IsRequired().HasMaxLength(32);
        builder.Property(e => e.ProvenancePersistence).IsRequired().HasMaxLength(32);
        builder.Property(e => e.PromotionReason).HasMaxLength(500);
        builder.Property(e => e.PromotedFromMode).HasMaxLength(32);
        builder.Property(e => e.PromotedBy).HasMaxLength(200);
        builder.Property(e => e.CertifiedBy).HasMaxLength(200);
        builder.Property(e => e.CreatedAtUtc).IsRequired();
        builder.Property(e => e.UpdatedAtUtc).IsRequired();

        builder.HasIndex(e => new { e.CountyId, e.CompSetId })
            .HasDatabaseName("IX_CompSets_CountyId_CompSetId");
        builder.HasIndex(e => new { e.CountyId, e.Mode, e.Status })
            .HasDatabaseName("IX_CompSets_CountyId_Mode_Status");
        builder.HasIndex(e => new { e.CountyId, e.SourceCompSetId })
            .HasDatabaseName("IX_CompSets_CountyId_SourceCompSetId");

        builder.HasMany(e => e.Candidates)
            .WithOne(e => e.CompSet)
            .HasForeignKey(e => e.CompSetId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

public sealed class CompSetCandidateConfiguration : IEntityTypeConfiguration<CompSetCandidate>
{
    public void Configure(EntityTypeBuilder<CompSetCandidate> builder)
    {
        builder.ToTable("CompSetCandidates");

        builder.HasKey(e => e.CompSetCandidateId);
        builder.Property(e => e.CompSetId).IsRequired();
        builder.Property(e => e.CountyId).IsRequired();
        builder.Property(e => e.ParcelId).IsRequired().HasMaxLength(64);
        builder.Property(e => e.SalePrice).HasPrecision(18, 2);
        builder.Property(e => e.SaleDate).IsRequired();
        builder.Property(e => e.PricePerSqft).HasPrecision(18, 2);
        builder.Property(e => e.Qualification).IsRequired().HasMaxLength(64);
        builder.Property(e => e.Rank).IsRequired();
        builder.Property(e => e.IncludeReason).HasMaxLength(500);
        builder.Property(e => e.ProvenanceSource).IsRequired().HasMaxLength(100);
        builder.Property(e => e.ProvenanceRuntime).IsRequired().HasMaxLength(32);
        builder.Property(e => e.ProvenanceMutation).IsRequired().HasMaxLength(32);
        builder.Property(e => e.ProvenancePersistence).IsRequired().HasMaxLength(32);
        builder.Property(e => e.QualificationStatus).HasMaxLength(32);
        builder.Property(e => e.DiagnosisStatus).HasMaxLength(32);
        builder.Property(e => e.SupportSummary).HasMaxLength(1000);
        builder.Property(e => e.DiagnosedBy).HasMaxLength(200);
        builder.Property(e => e.DiagnosisVersion).HasMaxLength(32);

        builder.HasIndex(e => new { e.CountyId, e.CompSetId })
            .HasDatabaseName("IX_CompSetCandidates_CountyId_CompSetId");
        builder.HasIndex(e => new { e.CountyId, e.ParcelId })
            .HasDatabaseName("IX_CompSetCandidates_CountyId_ParcelId");
    }
}

public sealed class CompSetCandidateReviewConfiguration : IEntityTypeConfiguration<CompSetCandidateReview>
{
    public void Configure(EntityTypeBuilder<CompSetCandidateReview> builder)
    {
        builder.ToTable("CompSetCandidateReviews");

        builder.HasKey(e => e.CompSetCandidateReviewId);
        builder.Property(e => e.CompSetId).IsRequired();
        builder.Property(e => e.CompSetCandidateId).IsRequired();
        builder.Property(e => e.CountyId).IsRequired();
        builder.Property(e => e.ParcelId).IsRequired().HasMaxLength(64);
        builder.Property(e => e.Disposition).IsRequired().HasMaxLength(32);
        builder.Property(e => e.ReviewerNote).HasMaxLength(2000);
        builder.Property(e => e.QualificationOverride).HasMaxLength(32);
        builder.Property(e => e.OverrideReason).HasMaxLength(1000);
        builder.Property(e => e.ReviewedBy).IsRequired().HasMaxLength(200);
        builder.Property(e => e.ReviewedAtUtc).IsRequired();

        // One current review row per candidate (upsert).
        builder.HasIndex(e => new { e.CountyId, e.CompSetCandidateId })
            .IsUnique()
            .HasDatabaseName("IX_CompSetCandidateReviews_CountyId_CompSetCandidateId");
        builder.HasIndex(e => new { e.CountyId, e.CompSetId })
            .HasDatabaseName("IX_CompSetCandidateReviews_CountyId_CompSetId");
    }
}
