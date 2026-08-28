using System.Security.Cryptography;
using System.Text;
using TerraFusion.Core.Import;
using Xunit;

namespace TerraFusion.Unit.Tests.Import;

public sealed class CountyCsvIntakeEnvelopeTests
{
    [Fact]
    public async Task AdmitAsync_ProducesCanonicalExactByteEvidenceAndParsedSnapshot()
    {
        const string csv = "parcel_id,owner\r\n1,Ada\r\n";
        var bytes = Encoding.UTF8.GetBytes(csv);
        var envelope = CreateEnvelope();

        var receipt = await envelope.AdmitAsync(Declaration(), bytes);

        Assert.Equal(CountyCsvIntakeEnvelope.ContractId, receipt.ContractId);
        Assert.Equal("parcels.csv", receipt.FileName);
        Assert.Equal("csv", receipt.Format);
        Assert.Equal("text/csv", receipt.MediaType);
        Assert.Equal(bytes.LongLength, receipt.Content.ByteLength);
        Assert.Equal(
            Convert.ToHexString(SHA256.HashData(bytes)).ToLowerInvariant(),
            receipt.Content.Sha256);
        Assert.Equal(new[] { "parcel_id", "owner" }, receipt.Document.Headers);
        Assert.Equal(new[] { "1", "Ada" }, Assert.Single(receipt.Document.Rows));
        Assert.Equal(bytes.LongLength, receipt.Document.InputBytes);
    }

    [Fact]
    public async Task AdmitAsync_SnapshotsInputAndReturnsDeeplyReadOnlyParserState()
    {
        var bytes = Encoding.UTF8.GetBytes("parcel_id,owner\n1,Ada");
        var expectedHash = Convert.ToHexString(SHA256.HashData(bytes)).ToLowerInvariant();
        var receipt = await CreateEnvelope().AdmitAsync(Declaration(), bytes);

        Array.Fill<byte>(bytes, 0x58);
        var headers = Assert.IsAssignableFrom<IList<string>>(receipt.Document.Headers);
        var rows = Assert.IsAssignableFrom<IList<IReadOnlyList<string>>>(receipt.Document.Rows);
        var firstRow = Assert.IsAssignableFrom<IList<string>>(receipt.Document.Rows[0]);

        Assert.Throws<NotSupportedException>(() => headers[0] = "tampered");
        Assert.Throws<NotSupportedException>(
            () => rows[0] = Array.AsReadOnly(new[] { "tampered", "row" }));
        Assert.Throws<NotSupportedException>(() => firstRow[0] = "tampered");
        Assert.Equal(expectedHash, receipt.Content.Sha256);
        Assert.Equal(new[] { "parcel_id", "owner" }, receipt.Document.Headers);
        Assert.Equal(new[] { "1", "Ada" }, Assert.Single(receipt.Document.Rows));
    }

    [Theory]
    [InlineData("parcels.txt", "csv", "text/csv", CountyCsvIntakeErrorCode.FormatMismatch)]
    [InlineData(".csv", "csv", "text/csv", CountyCsvIntakeErrorCode.FormatMismatch)]
    [InlineData("parcels.csv", "CSV", "text/csv", CountyCsvIntakeErrorCode.FormatMismatch)]
    [InlineData("parcels.csv", "csv", "application/csv", CountyCsvIntakeErrorCode.MediaTypeMismatch)]
    [InlineData("parcels.csv", "csv", "text/csv; charset=utf-8", CountyCsvIntakeErrorCode.MediaTypeMismatch)]
    [InlineData("../parcels.csv", "csv", "text/csv", CountyCsvIntakeErrorCode.UnsafeFileName)]
    [InlineData("folder\\parcels.csv", "csv", "text/csv", CountyCsvIntakeErrorCode.UnsafeFileName)]
    [InlineData("C:parcels.csv", "csv", "text/csv", CountyCsvIntakeErrorCode.UnsafeFileName)]
    [InlineData(" parcels.csv", "csv", "text/csv", CountyCsvIntakeErrorCode.UnsafeFileName)]
    public async Task AdmitAsync_RequiresExactSafeCsvDeclaration(
        string fileName,
        string format,
        string mediaType,
        CountyCsvIntakeErrorCode expected)
    {
        var declaration = new CountyCsvIntakeDeclaration
        {
            FileName = fileName,
            Format = format,
            MediaType = mediaType,
        };

        var exception = await Assert.ThrowsAsync<CountyCsvIntakeException>(
            () => CreateEnvelope().AdmitAsync(
                declaration,
                Encoding.UTF8.GetBytes("parcel_id\n1")));

        Assert.Equal(expected, exception.ErrorCode);
    }

    [Theory]
    [MemberData(nameof(ForbiddenBinaryInputs))]
    public async Task AdmitAsync_RejectsKnownBinaryAndNonUtf8Signatures(byte[] bytes)
    {
        var exception = await Assert.ThrowsAsync<CountyCsvIntakeException>(
            () => CreateEnvelope().AdmitAsync(Declaration(), bytes));

        Assert.Equal(CountyCsvIntakeErrorCode.ContainerSignatureMismatch, exception.ErrorCode);
    }

    [Fact]
    public async Task AdmitAsync_AllowsInitialUtf8Bom()
    {
        var bytes = new UTF8Encoding(encoderShouldEmitUTF8Identifier: true)
            .GetPreamble()
            .Concat(Encoding.UTF8.GetBytes("parcel_id\n1"))
            .ToArray();

        var receipt = await CreateEnvelope().AdmitAsync(Declaration(), bytes);

        Assert.Equal(new[] { "parcel_id" }, receipt.Document.Headers);
        Assert.Equal(new[] { "1" }, Assert.Single(receipt.Document.Rows));
        Assert.Equal(bytes.LongLength, receipt.Content.ByteLength);
    }

    [Fact]
    public async Task AdmitAsync_DoesNotAllowUtf8BomToMaskForbiddenSignature()
    {
        var bytes = new UTF8Encoding(encoderShouldEmitUTF8Identifier: true)
            .GetPreamble()
            .Concat(Encoding.ASCII.GetBytes("%PDF-1.7"))
            .ToArray();

        var exception = await Assert.ThrowsAsync<CountyCsvIntakeException>(
            () => CreateEnvelope().AdmitAsync(Declaration(), bytes));

        Assert.Equal(CountyCsvIntakeErrorCode.ContainerSignatureMismatch, exception.ErrorCode);
    }

    [Fact]
    public async Task AdmitAsync_RejectsParserLimitBeforeSnapshottingCandidate()
    {
        var exception = await Assert.ThrowsAsync<CountyCsvParseException>(
            () => CreateEnvelope(maxInputBytes: 8).AdmitAsync(
                Declaration(),
                new byte[9]));

        Assert.Equal(CountyCsvErrorCode.InputTooLarge, exception.ErrorCode);
    }

    [Fact]
    public async Task AdmitAsync_PropagatesBoundedParserFailureWithoutReplacingIt()
    {
        var exception = await Assert.ThrowsAsync<CountyCsvParseException>(
            () => CreateEnvelope(maxDataRows: 1).AdmitAsync(
                Declaration(),
                Encoding.UTF8.GetBytes("parcel_id\n1\n2")));

        Assert.Equal(CountyCsvErrorCode.TooManyRows, exception.ErrorCode);
    }

    [Fact]
    public async Task AdmitAsync_ObservesPreCancelledTokenBeforeAdmission()
    {
        using var cancellation = new CancellationTokenSource();
        await cancellation.CancelAsync();

        await Assert.ThrowsAnyAsync<OperationCanceledException>(
            () => CreateEnvelope().AdmitAsync(
                Declaration(),
                Encoding.UTF8.GetBytes("parcel_id\n1"),
                cancellation.Token));
    }

    [Fact]
    public void ContractId_IsReservedVersion()
    {
        Assert.Equal("wal.county-upload.csv-envelope.v1", CountyCsvIntakeEnvelope.ContractId);
    }

    public static TheoryData<byte[]> ForbiddenBinaryInputs =>
        new()
        {
            new byte[] { 0x50, 0x4B, 0x03, 0x04, 0x14, 0x00 },
            new byte[] { 0xD0, 0xCF, 0x11, 0xE0, 0x00 },
            new byte[] { 0x1F, 0x8B, 0x08 },
            Encoding.ASCII.GetBytes("%PDF-1.7"),
            Encoding.ASCII.GetBytes("SQLite format 3\0"),
            new byte[] { 0xFF, 0xFE, 0x70, 0x00 },
            new byte[] { 0xFE, 0xFF, 0x00, 0x70 },
        };

    private static CountyCsvIntakeEnvelope CreateEnvelope(
        int maxDataRows = 10,
        long maxInputBytes = 4096) =>
        new(
            new CountyCsvParserOptions
            {
                Delimiter = ',',
                MaxInputBytes = maxInputBytes,
                MaxDataRows = maxDataRows,
                MaxFieldsPerRow = 20,
                MaxCharactersPerField = 256,
            });

    private static CountyCsvIntakeDeclaration Declaration() =>
        new()
        {
            FileName = "parcels.csv",
            Format = "csv",
            MediaType = "text/csv",
        };
}
