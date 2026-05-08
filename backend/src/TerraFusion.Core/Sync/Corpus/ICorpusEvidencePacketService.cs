using System;
using System.Threading;
using System.Threading.Tasks;

namespace TerraFusion.Core.Sync.Corpus;

/// <summary>
/// SYNC-COMPLETE-2: builds an evidence ZIP for a completed corpus
/// run. Mirrors the SYNC-WORKBENCH-H pattern (HMAC-signed manifest +
/// CSV payloads + deterministic ZIP encoding) but at corpus scope:
/// the run row, six lane results, six reconciliation rows, and a
/// consolidated gate summary.
///
/// <para>Reads only — no mutations. Uses the same
/// <c>Workbench:Evidence:HmacKey</c> config the H slice uses.</para>
/// </summary>
public interface ICorpusEvidencePacketService
{
    Task<CorpusEvidencePacketResult> BuildAsync(
        Guid runId,
        CancellationToken cancellationToken);
}

public enum CorpusEvidencePacketOutcome
{
    Ok,
    NotFound,
    ConfigurationError,
}

public sealed record CorpusEvidencePacketResult(
    CorpusEvidencePacketOutcome Outcome,
    string? ErrorMessage,
    string? FileName,
    byte[]? ZipContent,
    string? SignatureHex);
