using System.Security.Cryptography;

namespace TerraFusion.Core.Import;

public sealed record CountyCsvIntakeDeclaration
{
    public required string FileName { get; init; }

    public required string Format { get; init; }

    public required string MediaType { get; init; }
}

public sealed record CountyCsvContentEvidence(long ByteLength, string Sha256);

/// <summary>
/// Immutable in-memory evidence produced after an explicitly declared CSV artifact passes the
/// admission boundary and the bounded CSV parser.
/// </summary>
public sealed record CountyCsvIntakeReceipt(
    string ContractId,
    string FileName,
    string Format,
    string MediaType,
    CountyCsvContentEvidence Content,
    CountyCsvDocument Document);

public enum CountyCsvIntakeErrorCode
{
    InvalidDeclaration,
    UnsafeFileName,
    FormatMismatch,
    MediaTypeMismatch,
    ContainerSignatureMismatch,
}

public sealed class CountyCsvIntakeException : FormatException
{
    public CountyCsvIntakeException(CountyCsvIntakeErrorCode errorCode, string message)
        : base(message)
    {
        ErrorCode = errorCode;
    }

    public CountyCsvIntakeErrorCode ErrorCode { get; }
}

/// <summary>
/// Local-memory admission contract <c>wal.county-upload.csv-envelope.v1</c>. This boundary validates
/// an explicit CSV declaration, snapshots and hashes the supplied bytes, and delegates syntax to
/// <see cref="CountyCsvStreamParser"/>. It performs no authentication, county binding, persistence,
/// quarantine, promotion, rollback, API, or UI behavior.
/// </summary>
public sealed class CountyCsvIntakeEnvelope
{
    public const string ContractId = "wal.county-upload.csv-envelope.v1";

    private const string CanonicalFormat = "csv";
    private const string CanonicalMediaType = "text/csv";
    private const int MaximumFileNameCharacters = 255;

    private static readonly byte[][] ForbiddenSignatures =
    [
        [0x50, 0x4B, 0x03, 0x04], // ZIP and ZIP-based office/container formats
        [0x50, 0x4B, 0x05, 0x06],
        [0x50, 0x4B, 0x07, 0x08],
        [0xD0, 0xCF, 0x11, 0xE0], // OLE compound documents
        [0x1F, 0x8B],             // gzip
        [0x25, 0x50, 0x44, 0x46], // PDF
        [0xFF, 0xD8, 0xFF],       // JPEG
        [0x89, 0x50, 0x4E, 0x47], // PNG
        [0x53, 0x51, 0x4C, 0x69, 0x74, 0x65, 0x20, 0x66, 0x6F, 0x72, 0x6D, 0x61, 0x74, 0x20, 0x33, 0x00],
    ];

    private readonly CountyCsvStreamParser _parser;
    private readonly long _maxInputBytes;

    public CountyCsvIntakeEnvelope(CountyCsvParserOptions parserOptions)
    {
        _parser = new CountyCsvStreamParser(parserOptions);
        _maxInputBytes = parserOptions.MaxInputBytes;
    }

    public async Task<CountyCsvIntakeReceipt> AdmitAsync(
        CountyCsvIntakeDeclaration declaration,
        ReadOnlyMemory<byte> content,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(declaration);
        cancellationToken.ThrowIfCancellationRequested();

        var fileName = ValidateFileName(declaration.FileName);
        ValidateDeclarationValue(declaration.Format, nameof(declaration.Format));
        ValidateDeclarationValue(declaration.MediaType, nameof(declaration.MediaType));

        if (!string.Equals(declaration.Format, CanonicalFormat, StringComparison.Ordinal))
        {
            throw new CountyCsvIntakeException(
                CountyCsvIntakeErrorCode.FormatMismatch,
                "The declared format must be exactly csv.");
        }

        if (!string.Equals(declaration.MediaType, CanonicalMediaType, StringComparison.OrdinalIgnoreCase))
        {
            throw new CountyCsvIntakeException(
                CountyCsvIntakeErrorCode.MediaTypeMismatch,
                "The declared media type must be text/csv without parameters.");
        }

        if (content.Length > _maxInputBytes)
        {
            throw new CountyCsvParseException(
                CountyCsvErrorCode.InputTooLarge,
                $"CSV input exceeds the {_maxInputBytes}-byte limit.");
        }

        var snapshot = content.ToArray();
        cancellationToken.ThrowIfCancellationRequested();
        RejectForbiddenSignature(snapshot);

        var evidence = new CountyCsvContentEvidence(
            snapshot.LongLength,
            Convert.ToHexString(SHA256.HashData(snapshot)).ToLowerInvariant());

        await using var stream = new MemoryStream(snapshot, writable: false);
        var document = await _parser.ParseAsync(stream, cancellationToken).ConfigureAwait(false);
        if (document.InputBytes != evidence.ByteLength)
        {
            throw new InvalidOperationException("Parser byte evidence does not match the admitted snapshot.");
        }

        return new CountyCsvIntakeReceipt(
            ContractId,
            fileName,
            CanonicalFormat,
            CanonicalMediaType,
            evidence,
            document);
    }

    private static string ValidateFileName(string? value)
    {
        ValidateDeclarationValue(value, nameof(CountyCsvIntakeDeclaration.FileName));
        var fileName = value!;
        if (fileName.Length > MaximumFileNameCharacters
            || fileName != fileName.Trim()
            || fileName is "." or ".."
            || fileName.IndexOfAny(['/', '\\', ':']) >= 0
            || fileName.Any(char.IsControl))
        {
            throw new CountyCsvIntakeException(
                CountyCsvIntakeErrorCode.UnsafeFileName,
                "The declared file name must be a safe leaf name.");
        }

        if (!fileName.EndsWith(".csv", StringComparison.OrdinalIgnoreCase)
            || fileName.Length == ".csv".Length)
        {
            throw new CountyCsvIntakeException(
                CountyCsvIntakeErrorCode.FormatMismatch,
                "The declared file name must have a .csv extension and a non-empty stem.");
        }

        return fileName;
    }

    private static void ValidateDeclarationValue(string? value, string field)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            throw new CountyCsvIntakeException(
                CountyCsvIntakeErrorCode.InvalidDeclaration,
                $"{field} is required.");
        }
    }

    private static void RejectForbiddenSignature(ReadOnlySpan<byte> content)
    {
        var signatureView = content.StartsWith([0xEF, 0xBB, 0xBF])
            ? content[3..]
            : content;

        if (signatureView.StartsWith([0xFF, 0xFE]) || signatureView.StartsWith([0xFE, 0xFF]))
        {
            throw new CountyCsvIntakeException(
                CountyCsvIntakeErrorCode.ContainerSignatureMismatch,
                "The supplied bytes use a non-UTF-8 encoding signature.");
        }

        foreach (var signature in ForbiddenSignatures)
        {
            if (signatureView.StartsWith(signature))
            {
                throw new CountyCsvIntakeException(
                    CountyCsvIntakeErrorCode.ContainerSignatureMismatch,
                    "The supplied bytes have a binary container signature that contradicts CSV.");
            }
        }
    }
}
