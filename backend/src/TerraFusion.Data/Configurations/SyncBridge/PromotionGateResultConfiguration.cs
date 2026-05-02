using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TerraFusion.Core.Entities.SyncBridge;

namespace TerraFusion.Data.Configurations.SyncBridge;

public sealed class PromotionGateResultConfiguration : IEntityTypeConfiguration<PromotionGateResult>
{
    public void Configure(EntityTypeBuilder<PromotionGateResult> builder)
    {
        builder.ToTable("promotion_gate_result", schema: "sync_bridge");
        builder.HasKey(x => x.GateResultId);
        builder.Property(x => x.GateResultId).ValueGeneratedOnAdd();

        builder.Property(x => x.LoadBatchId).IsRequired();
        builder.Property(x => x.GateName).HasMaxLength(100).IsRequired();
        builder.Property(x => x.GateStage).HasMaxLength(50).IsRequired();
        builder.Property(x => x.Status).HasMaxLength(32).IsRequired();
        builder.Property(x => x.ExecutedAt).IsRequired();

        builder.HasIndex(x => new { x.LoadBatchId, x.GateStage });
        builder.HasIndex(x => new { x.Status, x.ExecutedAt });
    }
}
