using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TerraFusion.Core.Entities;
using TerraFusion.Core.Entities.Import;

namespace TerraFusion.Data.Configurations.Import;

public sealed class CountyCsvUploadRowStageConfiguration
    : IEntityTypeConfiguration<CountyCsvUploadRowStage>
{
    public void Configure(EntityTypeBuilder<CountyCsvUploadRowStage> builder)
    {
        builder.ToTable("CountyCsvUploadRowStages");
        builder.HasKey(stage => stage.BatchId);
        builder.Property(stage => stage.Dataset).HasMaxLength(16).IsRequired();
        builder.Property(stage => stage.ContractId).HasMaxLength(128).IsRequired();
        builder.Property(stage => stage.SchemaVersion).HasMaxLength(64).IsRequired();
        builder.Property(stage => stage.StagedRowsJson).HasColumnType("TEXT").IsRequired();
        builder.Property(stage => stage.QuarantinedRowsJson).HasColumnType("TEXT").IsRequired();
        builder.Property(stage => stage.ReasonCountsJson).HasColumnType("TEXT").IsRequired();
        builder.HasIndex(stage => new { stage.CountyId, stage.ValidatedAtUtc });

        builder.HasOne<CountyCsvUploadBatch>()
            .WithOne()
            .HasForeignKey<CountyCsvUploadRowStage>(stage => stage.BatchId)
            .OnDelete(DeleteBehavior.Cascade);
        builder.HasOne<County>()
            .WithMany()
            .HasForeignKey(stage => stage.CountyId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
