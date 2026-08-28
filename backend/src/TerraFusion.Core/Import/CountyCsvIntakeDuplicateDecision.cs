using System.Globalization;
using System.Security.Cryptography;
using System.Text;
using TerraFusion.Core.Counties;

namespace TerraFusion.Core.Import;

public enum CountyCsvIntakeDuplicateDisposition
{
    FirstSeen,
    Duplicate,
    Denied,
}

public enum CountyCsvIntakeDuplicateDenialCode
{
    None,
    InvalidIdentity,
    NonCanonicalCounty,
    UnsupportedDataset,
    InvalidContentEvidence,
    IdempotencyKeyMismatch,
    KeyCollision,
    CapacityExceeded,
}

/// <summary>
/// Scalar outcome from one bounded local-memory duplicate decision. It is not a reservation,
/// persistence receipt, authorization grant, or assertion that predecessor evidence was issued.
/// </summary>
public sealed record CountyCsvIntakeDuplicateDecisionResult(
    string ContractId,
    CountyCsvIntakeDuplicateDisposition Disposition,
    CountyCsvIntakeDuplicateDenialCode DenialCode);

/// <summary>
/// Per-instance bounded local-memory contract <c>wal.county-upload.csv-duplicate-decision.v1</c>.
/// It revalidates the complete 002D identity value and linearizes only first-seen, duplicate,
/// collision, and capacity decisions behind one private in-process synchronization primitive.
/// </summary>
public sealed class CountyCsvIntakeDuplicateDecision
{
    public const string ContractId = "wal.county-upload.csv-duplicate-decision.v1";

    private const int MaximumCapacity = 4096;
    private readonly object _gate = new();
    private readonly Dictionary<string, IdentitySnapshot> _entries =
        new(StringComparer.Ordinal);
    private readonly int _capacity;

    public CountyCsvIntakeDuplicateDecision(int capacity)
    {
        if (capacity is <= 0 or > MaximumCapacity)
        {
            throw new ArgumentOutOfRangeException(
                nameof(capacity),
                $"Capacity must be between 1 and {MaximumCapacity}.");
        }

        _capacity = capacity;
    }

    public CountyCsvIntakeDuplicateDecisionResult Decide(
        CountyCsvIntakeIdempotencyIdentity? identity)
    {
        if (!TrySnapshot(identity, out var snapshot, out var denialCode))
        {
            return Denied(denialCode);
        }

        return DecideValidated(snapshot);
    }

    private CountyCsvIntakeDuplicateDecisionResult DecideValidated(IdentitySnapshot snapshot)
    {
        lock (_gate)
        {
            if (_entries.TryGetValue(snapshot.IdempotencyKey, out var existing))
            {
                return existing == snapshot
                    ? Accepted(CountyCsvIntakeDuplicateDisposition.Duplicate)
                    : Denied(CountyCsvIntakeDuplicateDenialCode.KeyCollision);
            }

            if (_entries.Count >= _capacity)
            {
                return Denied(CountyCsvIntakeDuplicateDenialCode.CapacityExceeded);
            }

            _entries.Add(snapshot.IdempotencyKey, snapshot);
            return Accepted(CountyCsvIntakeDuplicateDisposition.FirstSeen);
        }
    }

    private static bool TrySnapshot(
        CountyCsvIntakeIdempotencyIdentity? identity,
        out IdentitySnapshot snapshot,
        out CountyCsvIntakeDuplicateDenialCode denialCode)
    {
        snapshot = null!;
        denialCode = CountyCsvIntakeDuplicateDenialCode.InvalidIdentity;

        if (identity is null
            || !string.Equals(
                identity.ContractId,
                CountyCsvIntakeIdempotency.ContractId,
                StringComparison.Ordinal))
        {
            return false;
        }

        var canonicalCounty = WashingtonCountyRegistry.Counties
            .FirstOrDefault(county => county == identity.County);
        if (canonicalCounty is null)
        {
            denialCode = CountyCsvIntakeDuplicateDenialCode.NonCanonicalCounty;
            return false;
        }

        var datasetToken = identity.Dataset switch
        {
            CountyCsvDataset.Parcels => "parcels",
            CountyCsvDataset.Sales => "sales",
            _ => null,
        };
        if (datasetToken is null)
        {
            denialCode = CountyCsvIntakeDuplicateDenialCode.UnsupportedDataset;
            return false;
        }

        var content = identity.Content;
        if (content is null
            || !IsLowercaseSha256(content.Sha256)
            || content.ByteLength <= 0
            || content.ByteLength > int.MaxValue)
        {
            denialCode = CountyCsvIntakeDuplicateDenialCode.InvalidContentEvidence;
            return false;
        }

        var byteLength = content.ByteLength.ToString(CultureInfo.InvariantCulture);
        var preimage = string.Concat(
            CountyCsvIntakeIdempotency.ContractId,
            "\ncounty=", canonicalCounty.Key,
            "\ndataset=", datasetToken,
            "\nsha256=", content.Sha256,
            "\nbytes=", byteLength,
            "\n");
        var recomputedKey = Convert
            .ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(preimage)))
            .ToLowerInvariant();

        if (!IsLowercaseSha256(identity.IdempotencyKey)
            || !string.Equals(identity.IdempotencyKey, recomputedKey, StringComparison.Ordinal))
        {
            denialCode = CountyCsvIntakeDuplicateDenialCode.IdempotencyKeyMismatch;
            return false;
        }

        snapshot = new IdentitySnapshot(
            identity.IdempotencyKey,
            canonicalCounty,
            identity.Dataset,
            new CountyCsvContentEvidence(content.ByteLength, content.Sha256));
        denialCode = CountyCsvIntakeDuplicateDenialCode.None;
        return true;
    }

    private static bool IsLowercaseSha256(string? value) =>
        value is { Length: 64 }
        && value.All(character =>
            character is >= '0' and <= '9' or >= 'a' and <= 'f');

    private static CountyCsvIntakeDuplicateDecisionResult Accepted(
        CountyCsvIntakeDuplicateDisposition disposition) =>
        new(ContractId, disposition, CountyCsvIntakeDuplicateDenialCode.None);

    private static CountyCsvIntakeDuplicateDecisionResult Denied(
        CountyCsvIntakeDuplicateDenialCode denialCode) =>
        new(ContractId, CountyCsvIntakeDuplicateDisposition.Denied, denialCode);

    private sealed record IdentitySnapshot(
        string IdempotencyKey,
        WashingtonCountyIdentity County,
        CountyCsvDataset Dataset,
        CountyCsvContentEvidence Content);
}
