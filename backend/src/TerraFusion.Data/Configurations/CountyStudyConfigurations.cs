// backend/src/TerraFusion.Data/Configurations/CountyStudyConfigurations.cs
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TerraFusion.Core.Entities;

namespace TerraFusion.Data.Configurations;

public sealed class CountyStudySessionConfiguration : IEntityTypeConfiguration<CountyStudySession>
{
    public void Configure(EntityTypeBuilder<CountyStudySession> builder)
    {
        builder.HasKey(e => e.StudyId);
        builder.ToTable("CountyStudySessions");
        builder.Property(e => e.CountyName).HasMaxLength(100).HasDefaultValue(string.Empty);
        builder.Property(e => e.StudyType).IsRequired().HasConversion<string>().HasMaxLength(50);
        builder.Property(e => e.Status).IsRequired().HasConversion<string>().HasMaxLength(50);
        builder.Property(e => e.BaselineVersion).HasMaxLength(200);
        builder.Property(e => e.CreatedBy).IsRequired().HasMaxLength(450);
        builder.Property(e => e.UpdatedBy).IsRequired().HasMaxLength(450);
        builder.HasIndex(e => new { e.CountyId, e.TaxYear, e.Status })
               .HasDatabaseName("IX_CountyStudySessions_CountyYearStatus");
    }
}

public sealed class CountySegmentSetConfiguration : IEntityTypeConfiguration<CountySegmentSet>
{
    public void Configure(EntityTypeBuilder<CountySegmentSet> builder)
    {
        builder.HasKey(e => e.SegmentSetId);
        builder.ToTable("CountySegmentSets");
        builder.Property(e => e.Name).IsRequired().HasMaxLength(200);
        builder.Property(e => e.SourceType).IsRequired().HasConversion<string>().HasMaxLength(50);
        builder.Property(e => e.CreatedBy).IsRequired().HasMaxLength(450);
        builder.Property(e => e.UpdatedBy).IsRequired().HasMaxLength(450);
        builder.HasIndex(e => new { e.StudyId, e.IsBaseline })
               .HasDatabaseName("IX_CountySegmentSets_StudyBaseline");
    }
}

public sealed class CountySegmentConfiguration : IEntityTypeConfiguration<CountySegment>
{
    public void Configure(EntityTypeBuilder<CountySegment> builder)
    {
        builder.HasKey(e => e.SegmentId);
        builder.ToTable("CountySegments");
        builder.Property(e => e.Name).IsRequired().HasMaxLength(200);
        builder.Property(e => e.SegmentType).IsRequired().HasConversion<string>().HasMaxLength(50);
        builder.Property(e => e.GeographyRef).HasMaxLength(100);
        builder.Property(e => e.MedianRatio).HasColumnType("decimal(6,4)");
        builder.Property(e => e.CoefficientOfDispersion).HasColumnType("decimal(8,4)");
        builder.Property(e => e.PriceRelatedDifferential).HasColumnType("decimal(6,4)");
        builder.Property(e => e.StabilityScore).HasColumnType("decimal(5,2)");
        builder.Property(e => e.RiskScore).HasColumnType("decimal(5,2)");
        builder.Property(e => e.CreatedBy).IsRequired().HasMaxLength(450);
        builder.Property(e => e.UpdatedBy).IsRequired().HasMaxLength(450);
        builder.HasIndex(e => new { e.SegmentSetId, e.SegmentType })
               .HasDatabaseName("IX_CountySegments_SetType");
    }
}

public sealed class CountyCohortConfiguration : IEntityTypeConfiguration<CountyCohort>
{
    public void Configure(EntityTypeBuilder<CountyCohort> builder)
    {
        builder.HasKey(e => e.CohortId);
        builder.ToTable("CountyCohorts");
        builder.Property(e => e.Name).IsRequired().HasMaxLength(200);
        builder.Property(e => e.SelectionType).IsRequired().HasConversion<string>().HasMaxLength(50);
        builder.Property(e => e.Definition).IsRequired();
        builder.Property(e => e.CreatedBy).IsRequired().HasMaxLength(450);
        builder.Property(e => e.UpdatedBy).IsRequired().HasMaxLength(450);
        builder.HasIndex(e => e.StudyId).HasDatabaseName("IX_CountyCohorts_Study");
    }
}

public sealed class CountyScenarioConfiguration : IEntityTypeConfiguration<CountyScenario>
{
    public void Configure(EntityTypeBuilder<CountyScenario> builder)
    {
        builder.HasKey(e => e.ScenarioId);
        builder.ToTable("CountyScenarios");
        builder.Property(e => e.AdjustmentType).IsRequired().HasConversion<string>().HasMaxLength(50);
        builder.Property(e => e.Parameters).IsRequired();
        builder.Property(e => e.Rationale).IsRequired().HasMaxLength(1000);
        builder.Property(e => e.Status).IsRequired().HasConversion<string>().HasMaxLength(50);
        builder.Property(e => e.CreatedBy).IsRequired().HasMaxLength(450);
        builder.Property(e => e.UpdatedBy).IsRequired().HasMaxLength(450);
        builder.HasIndex(e => new { e.StudyId, e.Status }).HasDatabaseName("IX_CountyScenarios_StudyStatus");
        // Explicit one-to-one: CountyScenario <-> CountyAdjustmentSet (no ambiguity for EF)
        builder.HasOne(s => s.AdjustmentSet)
               .WithOne(a => a.Scenario)
               .HasForeignKey<CountyAdjustmentSet>(a => a.ScenarioId);
    }
}

public sealed class CountyAdjustmentSetConfiguration : IEntityTypeConfiguration<CountyAdjustmentSet>
{
    public void Configure(EntityTypeBuilder<CountyAdjustmentSet> builder)
    {
        builder.HasKey(e => e.AdjustmentSetId);
        builder.ToTable("CountyAdjustmentSets");
        builder.Property(e => e.EffectiveScope).IsRequired();
        builder.Property(e => e.ApprovalState).IsRequired().HasConversion<string>().HasMaxLength(50);
        builder.Property(e => e.ApprovedBy).HasMaxLength(500);
        builder.Property(e => e.RollbackToken).HasMaxLength(100);
        builder.Property(e => e.CreatedBy).IsRequired().HasMaxLength(450);
        builder.Property(e => e.UpdatedBy).IsRequired().HasMaxLength(450);
        builder.HasIndex(e => new { e.StudyId, e.ApprovalState })
               .HasDatabaseName("IX_CountyAdjustmentSets_StudyState");
        builder.HasIndex(e => e.ScenarioId).IsUnique()
               .HasDatabaseName("IX_CountyAdjustmentSets_ScenarioId");
    }
}

public sealed class CountyExceptionSetConfiguration : IEntityTypeConfiguration<CountyExceptionSet>
{
    public void Configure(EntityTypeBuilder<CountyExceptionSet> builder)
    {
        builder.HasKey(e => e.ExceptionSetId);
        builder.ToTable("CountyExceptionSets");
        builder.Property(e => e.ReasonCode).IsRequired().HasConversion<string>().HasMaxLength(50);
        builder.Property(e => e.ParcelIdsJson).IsRequired();
        builder.Property(e => e.Destination).IsRequired().HasConversion<string>().HasMaxLength(50);
        builder.Property(e => e.Status).IsRequired().HasConversion<string>().HasMaxLength(50);
        builder.Property(e => e.CreatedBy).IsRequired().HasMaxLength(450);
        builder.Property(e => e.UpdatedBy).IsRequired().HasMaxLength(450);
        builder.HasIndex(e => new { e.StudyId, e.Status }).HasDatabaseName("IX_CountyExceptionSets_StudyStatus");
    }
}

public sealed class CountySpatialArtifactConfiguration : IEntityTypeConfiguration<CountySpatialArtifact>
{
    public void Configure(EntityTypeBuilder<CountySpatialArtifact> builder)
    {
        builder.HasKey(e => e.ArtifactId);
        builder.ToTable("CountySpatialArtifacts");
        builder.Property(e => e.ArtifactType).IsRequired().HasConversion<string>().HasMaxLength(50);
        builder.Property(e => e.Status).IsRequired().HasConversion<string>().HasMaxLength(50);
        builder.Property(e => e.AtlasLayerId).HasMaxLength(200);
        builder.Property(e => e.PublishedBy).HasMaxLength(200);
        builder.Property(e => e.CreatedBy).IsRequired().HasMaxLength(450);
        builder.Property(e => e.UpdatedBy).IsRequired().HasMaxLength(450);
        builder.HasIndex(e => new { e.StudyId, e.Status }).HasDatabaseName("IX_CountySpatialArtifacts_StudyStatus");
    }
}
