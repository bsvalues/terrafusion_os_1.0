using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using TerraFusion.Modules.CurrentUse.Dto;

namespace TerraFusion.Modules.CurrentUse.Trace;

public static class CurrentUseTraceHasher
{
    public static string ComputeHash(AppendCurrentUseTraceEventDto input, string? previousHash, DateTimeOffset timestamp)
    {
        var canonical = JsonSerializer.Serialize(new
        {
            input.CountyId,
            input.ParcelId,
            input.ClassificationId,
            input.CorrelationId,
            Action = input.Action.ToString(),
            input.ActorId,
            input.ActorDisplayName,
            Timestamp = timestamp.ToUniversalTime().ToString("O"),
            input.CalculationVersion,
            DocumentIds = input.DocumentIds ?? Array.Empty<Guid>(),
            input.Summary,
            input.PayloadJson,
            PreviousHash = previousHash
        });

        var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(canonical));
        return Convert.ToHexString(bytes).ToLowerInvariant();
    }
}
