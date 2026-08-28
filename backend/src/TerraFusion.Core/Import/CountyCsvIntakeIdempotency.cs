using System.Globalization;
using System.Security.Cryptography;
using System.Text;
using TerraFusion.Core.Counties;

namespace TerraFusion.Core.Import;

/// <summary>
/// Immutable identity evidence derived from the identity-bearing subset of one protected county
/// CSV receipt-shaped value. This value neither proves full predecessor validation nor records a
/// duplicate lookup, decision, reservation, or persistence state.
/// </summary>
public sealed record CountyCsvIntakeIdempotencyIdentity(
    string ContractId,
    string IdempotencyKey,
    WashingtonCountyIdentity County,
    CountyCsvDataset Dataset,
    CountyCsvContentEvidence Content);

public enum CountyCsvIntakeIdempotencyErrorCode
{
    InvalidReceipt,
    NonCanonicalCounty,
    UnsupportedDataset,
    InvalidBindingPosture,
    InvalidContentEvidence,
}

public sealed class CountyCsvIntakeIdempotencyException : InvalidOperationException
{
    public CountyCsvIntakeIdempotencyException(
        CountyCsvIntakeIdempotencyErrorCode errorCode,
        string message)
        : base(message)
    {
        ErrorCode = errorCode;
    }

    public CountyCsvIntakeIdempotencyErrorCode ErrorCode { get; }
}

/// <summary>
/// Pure local-memory contract <c>wal.county-upload.csv-idempotency.v1</c>. It validates only the
/// identity-bearing subset of a 002C receipt-shaped value and derives one domain-separated key
/// from its canonical county, closed dataset, protected lowercase SHA-256, and exact byte length.
/// It never reads bytes, fully revalidates the predecessor receipt, or decides whether a duplicate
/// exists.
/// </summary>
public static class CountyCsvIntakeIdempotency
{
    public const string ContractId = "wal.county-upload.csv-idempotency.v1";

    public static CountyCsvIntakeIdempotencyIdentity Create(
        CountyCsvCountyBoundIntakeReceipt? receipt)
    {
        if (receipt is null
            || receipt.Binding is null
            || receipt.IntakeReceipt is null
            || receipt.IntakeReceipt.Content is null
            || receipt.IntakeReceipt.Document is null
            || !string.Equals(
                receipt.ContractId,
                CountyCsvCountyBoundIntake.ContractId,
                StringComparison.Ordinal)
            || !string.Equals(
                receipt.IntakeReceipt.ContractId,
                CountyCsvIntakeEnvelope.ContractId,
                StringComparison.Ordinal))
        {
            throw new CountyCsvIntakeIdempotencyException(
                CountyCsvIntakeIdempotencyErrorCode.InvalidReceipt,
                "County CSV idempotency receipt is invalid.");
        }

        var canonicalCounty = WashingtonCountyRegistry.Counties
            .FirstOrDefault(county => county == receipt.Binding.County);
        if (canonicalCounty is null)
        {
            throw new CountyCsvIntakeIdempotencyException(
                CountyCsvIntakeIdempotencyErrorCode.NonCanonicalCounty,
                "County CSV idempotency county is not canonical.");
        }

        var datasetToken = receipt.Binding.Dataset switch
        {
            CountyCsvDataset.Parcels => "parcels",
            CountyCsvDataset.Sales => "sales",
            _ => throw new CountyCsvIntakeIdempotencyException(
                CountyCsvIntakeIdempotencyErrorCode.UnsupportedDataset,
                "County CSV idempotency dataset is unsupported."),
        };

        if (receipt.Binding.DataMode != CountyDataMode.CountyProvided
            || receipt.Binding.Exposure != CountyDataExposure.Protected
            || receipt.Binding.Action != CountyDataAction.Operate)
        {
            throw new CountyCsvIntakeIdempotencyException(
                CountyCsvIntakeIdempotencyErrorCode.InvalidBindingPosture,
                "County CSV idempotency binding posture is invalid.");
        }

        var content = receipt.IntakeReceipt.Content;
        if (!IsLowercaseSha256(content.Sha256)
            || content.ByteLength <= 0
            || content.ByteLength > int.MaxValue
            || content.ByteLength != receipt.IntakeReceipt.Document.InputBytes)
        {
            throw new CountyCsvIntakeIdempotencyException(
                CountyCsvIntakeIdempotencyErrorCode.InvalidContentEvidence,
                "County CSV idempotency content evidence is invalid.");
        }

        var byteLength = content.ByteLength.ToString(CultureInfo.InvariantCulture);
        var preimage = string.Concat(
            ContractId,
            "\ncounty=", canonicalCounty.Key,
            "\ndataset=", datasetToken,
            "\nsha256=", content.Sha256,
            "\nbytes=", byteLength,
            "\n");
        var idempotencyKey = Convert
            .ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(preimage)))
            .ToLowerInvariant();

        return new CountyCsvIntakeIdempotencyIdentity(
            ContractId,
            idempotencyKey,
            canonicalCounty,
            receipt.Binding.Dataset,
            new CountyCsvContentEvidence(content.ByteLength, content.Sha256));
    }

    private static bool IsLowercaseSha256(string? value) =>
        value is { Length: 64 }
        && value.All(character =>
            character is >= '0' and <= '9' or >= 'a' and <= 'f');
}
