using System;

namespace TerraFusion.Core.Entities.SyncBridge;

/// <summary>
/// Sync Bridge v1: per-batch gate execution results. Each row is
/// one gate's verdict for one load batch.
///
/// <para>Gate naming convention: <c>R-1</c>..<c>R-5</c> for
/// Source→raw_pacs, <c>T-1</c>..<c>T-10</c> for raw_pacs→truth_pacs,
/// <c>C-1</c>..<c>C-4</c> for truth_pacs→canonical_tf,
/// <c>P-1</c>..<c>P-4</c> for canonical_tf→product, plus
/// <c>ARCH-*</c> for v1 schema-integrity gates.</para>
/// </summary>
public sealed class PromotionGateResult
{
    public long GateResultId { get; set; }

    public Guid LoadBatchId { get; set; }
    public string GateName { get; set; } = string.Empty;

    /// <summary>'SOURCE_TO_RAW' | 'RAW_TO_TRUTH' | 'TRUTH_TO_CANONICAL' | 'CANONICAL_TO_PRODUCT' | 'ARCH'.</summary>
    public string GateStage { get; set; } = string.Empty;

    /// <summary>'PASS' | 'FAIL' | 'WARN' | 'SKIP'.</summary>
    public string Status { get; set; } = string.Empty;

    public string? Expected { get; set; }
    public string? Actual { get; set; }
    public string? Detail { get; set; }

    public DateTime ExecutedAt { get; set; } = DateTime.UtcNow;
}
