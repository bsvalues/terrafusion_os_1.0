using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TerraFusion.Core.Entities;
using TerraFusion.Core.Entities.Import;

namespace TerraFusion.Data.Configurations.Import;

public sealed class CountyCsvUploadBatchConfiguration
    : IEntityTypeConfiguration<CountyCsvUploadBatch>
{
    public void Configure(EntityTypeBuilder<CountyCsvUploadBatch> builder)
    {
        builder.ToTable("CountyCsvUploadBatches");
        builder.HasKey(batch => batch.BatchId);

        builder.Property(batch => batch.ActorId).HasMaxLength(200).IsRequired();
        builder.Property(batch => batch.Dataset).HasMaxLength(16).IsRequired();
        builder.Property(batch => batch.SourceFileName).HasMaxLength(255).IsRequired();
        builder.Property(batch => batch.Format).HasMaxLength(16).IsRequired();
        builder.Property(batch => batch.MediaType).HasMaxLength(64).IsRequired();
        builder.Property(batch => batch.ContentSha256).HasMaxLength(64).IsFixedLength().IsRequired();
        builder.Property(batch => batch.IdempotencyKey).HasMaxLength(64).IsFixedLength().IsRequired();
        builder.Property(batch => batch.ApiAdmissionContractId).HasMaxLength(128).IsRequired();
        builder.Property(batch => batch.CountyContextContractId).HasMaxLength(128).IsRequired();
        builder.Property(batch => batch.CountyBoundIntakeContractId).HasMaxLength(128).IsRequired();
        builder.Property(batch => batch.EnvelopeContractId).HasMaxLength(128).IsRequired();
        builder.Property(batch => batch.ParserContractId).HasMaxLength(128).IsRequired();
        builder.Property(batch => batch.IdempotencyContractId).HasMaxLength(128).IsRequired();
        builder.Property(batch => batch.LedgerContractId).HasMaxLength(128).IsRequired();
        builder.Property(batch => batch.Status).HasMaxLength(16).IsRequired();

        builder.HasIndex(batch => batch.IdempotencyKey).IsUnique();
        builder.HasIndex(batch => new { batch.CountyId, batch.Dataset, batch.ReceivedAtUtc });

        builder.HasOne<County>()
            .WithMany()
            .HasForeignKey(batch => batch.CountyId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
