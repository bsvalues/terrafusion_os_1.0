using System.Text;
using TerraFusion.Core.Import;
using Xunit;

namespace TerraFusion.Unit.Tests.Import;

public sealed class CountyCsvStreamParserTests
{
    [Fact]
    public async Task ParseAsync_ParsesQuotedDelimiterNewlineAndEscapedQuote()
    {
        const string csv = "parcel_id,owner,notes\r\n"
            + "1001,Jane,plain\r\n"
            + "1002,\"Doe, John\",\"line one\r\nline two with \"\"quote\"\"\"\r\n";

        var document = await ParseAsync(csv);

        Assert.Equal(new[] { "parcel_id", "owner", "notes" }, document.Headers);
        Assert.Equal(2, document.Rows.Count);
        Assert.Equal(new[] { "1001", "Jane", "plain" }, document.Rows[0]);
        Assert.Equal(
            new[] { "1002", "Doe, John", "line one\r\nline two with \"quote\"" },
            document.Rows[1]);
        Assert.Equal((long)Encoding.UTF8.GetByteCount(csv), document.InputBytes);
    }

    [Fact]
    public async Task ParseAsync_UsesTheExplicitDelimiter()
    {
        var document = await ParseAsync(
            "parcel_id;owner\n7;Ada",
            CreateOptions(delimiter: ';'));

        Assert.Equal(new[] { "parcel_id", "owner" }, document.Headers);
        Assert.Single(document.Rows);
        Assert.Equal(new[] { "7", "Ada" }, document.Rows[0]);
    }

    [Fact]
    public async Task ParseAsync_AcceptsInitialUtf8BomAndUnicode()
    {
        var bytes = new UTF8Encoding(encoderShouldEmitUTF8Identifier: true)
            .GetPreamble()
            .Concat(Encoding.UTF8.GetBytes("parcel_id,owner\n1,José"))
            .ToArray();

        var document = await ParseBytesAsync(bytes);

        Assert.Equal(new[] { "parcel_id", "owner" }, document.Headers);
        Assert.Equal(new[] { "1", "José" }, Assert.Single(document.Rows));
        Assert.Equal((long)bytes.Length, document.InputBytes);
    }

    [Fact]
    public async Task ParseAsync_PreservesStateAcrossOneByteReads()
    {
        var bytes = Encoding.UTF8.GetBytes("parcel_id,owner\n1,\"José \"\"Pepe\"\"\"");
        await using var stream = new ChunkedMemoryStream(bytes, maximumReadSize: 1);
        var parser = new CountyCsvStreamParser(CreateOptions());

        var document = await parser.ParseAsync(stream);

        Assert.Equal(new[] { "1", "José \"Pepe\"" }, Assert.Single(document.Rows));
    }

    [Fact]
    public async Task ParseAsync_PreservesSplitCrLfAndQuotedCrLfAcrossOneByteReads()
    {
        var bytes = Encoding.UTF8.GetBytes("parcel_id,notes\r\n1,\"line one\r\nline two\"\r\n");
        await using var stream = new ChunkedMemoryStream(bytes, maximumReadSize: 1);
        var parser = new CountyCsvStreamParser(CreateOptions());

        var document = await parser.ParseAsync(stream);

        Assert.Equal(new[] { "parcel_id", "notes" }, document.Headers);
        Assert.Equal(new[] { "1", "line one\r\nline two" }, Assert.Single(document.Rows));
    }

    [Fact]
    public async Task ParseAsync_PreservesTrailingEmptyFieldAtEndOfStream()
    {
        var document = await ParseAsync("a,b,c\n1,2,");

        Assert.Equal(new[] { "1", "2", "" }, Assert.Single(document.Rows));
    }

    [Fact]
    public async Task ParseAsync_AcceptsValuesExactlyAtEveryConfiguredLimit()
    {
        const string csv = "aa,bb\n12,34";
        var options = CreateOptions(
            maxInputBytes: Encoding.UTF8.GetByteCount(csv),
            maxDataRows: 1,
            maxFieldsPerRow: 2,
            maxCharactersPerField: 2);

        var document = await ParseAsync(csv, options);

        Assert.Equal(new[] { "aa", "bb" }, document.Headers);
        Assert.Equal(new[] { "12", "34" }, Assert.Single(document.Rows));
        Assert.Equal(options.MaxInputBytes, document.InputBytes);
    }

    [Fact]
    public async Task ParseAsync_ReturnsDeeplyReadOnlyValidatedOutput()
    {
        var document = await ParseAsync("parcel_id,owner\n1,Ada");
        var headers = Assert.IsAssignableFrom<IList<string>>(document.Headers);
        var rows = Assert.IsAssignableFrom<IList<IReadOnlyList<string>>>(document.Rows);
        var firstRow = Assert.IsAssignableFrom<IList<string>>(document.Rows[0]);

        Assert.Throws<NotSupportedException>(() => headers[0] = "tampered_header");
        Assert.Throws<NotSupportedException>(
            () => rows[0] = Array.AsReadOnly(new[] { "tampered", "row" }));
        Assert.Throws<NotSupportedException>(() => firstRow[0] = "tampered_value");

        Assert.Equal(new[] { "parcel_id", "owner" }, document.Headers);
        Assert.Equal(new[] { "1", "Ada" }, Assert.Single(document.Rows));
    }

    [Fact]
    public async Task ParseAsync_RejectsInvalidUtf8()
    {
        var bytes = Encoding.UTF8.GetBytes("parcel_id\n").Concat(new byte[] { 0xC3, 0x28 }).ToArray();

        await AssertErrorAsync(bytes, CountyCsvErrorCode.InvalidUtf8);
    }

    [Fact]
    public async Task ParseAsync_RejectsTruncatedMultibyteUtf8AtEndOfStream()
    {
        var bytes = Encoding.UTF8.GetBytes("parcel_id\n")
            .Concat(new byte[] { 0xC3 })
            .ToArray();

        await AssertErrorAsync(bytes, CountyCsvErrorCode.InvalidUtf8);
    }

    [Fact]
    public async Task ParseAsync_RejectsInputOverByteLimit()
    {
        var bytes = Encoding.UTF8.GetBytes("parcel_id\n123");
        var options = CreateOptions(maxInputBytes: bytes.Length - 1);

        await AssertErrorAsync(bytes, CountyCsvErrorCode.InputTooLarge, options);
    }

    [Fact]
    public async Task ParseAsync_RejectsRowsOverLimit()
    {
        await AssertErrorAsync(
            "parcel_id\n1\n2",
            CountyCsvErrorCode.TooManyRows,
            CreateOptions(maxDataRows: 1));
    }

    [Fact]
    public async Task ParseAsync_RejectsFieldsOverLimit()
    {
        await AssertErrorAsync(
            "a,b,c",
            CountyCsvErrorCode.TooManyFields,
            CreateOptions(maxFieldsPerRow: 2));
    }

    [Fact]
    public async Task ParseAsync_RejectsFieldsOverCharacterLimit()
    {
        await AssertErrorAsync(
            "parcel_id\n12345",
            CountyCsvErrorCode.FieldTooLong,
            CreateOptions(maxCharactersPerField: 4));
    }

    [Fact]
    public async Task ParseAsync_RequiresAHeader()
    {
        await AssertErrorAsync(Array.Empty<byte>(), CountyCsvErrorCode.MissingHeader);
    }

    [Theory]
    [InlineData(",owner", CountyCsvErrorCode.EmptyHeader)]
    [InlineData("parcel_id, PARCEL_ID ", CountyCsvErrorCode.DuplicateHeader)]
    public async Task ParseAsync_RejectsInvalidHeaders(string csv, CountyCsvErrorCode errorCode)
    {
        await AssertErrorAsync(csv, errorCode);
    }

    [Fact]
    public async Task ParseAsync_RejectsInconsistentRecordWidth()
    {
        await AssertErrorAsync(
            "parcel_id,owner\n1",
            CountyCsvErrorCode.InconsistentFieldCount);
    }

    [Fact]
    public async Task ParseAsync_RejectsBlankPhysicalDataRowEvenForSingleColumnCsv()
    {
        await AssertErrorAsync(
            "parcel_id\n\n1",
            CountyCsvErrorCode.BlankRow);
    }

    [Theory]
    [InlineData("parcel_id\na\"b")]
    [InlineData("parcel_id\n\"closed\"tail")]
    [InlineData("parcel_id\n\"unterminated")]
    [InlineData("parcel_id\n\uFEFFnot-at-start")]
    public async Task ParseAsync_RejectsMalformedCsv(string csv)
    {
        await AssertErrorAsync(csv, CountyCsvErrorCode.MalformedCsv);
    }

    [Fact]
    public async Task ParseAsync_ObservesCancellationWhileReading()
    {
        await using var stream = new BlockingReadStream();
        using var cancellation = new CancellationTokenSource(TimeSpan.FromSeconds(2));
        var parser = new CountyCsvStreamParser(CreateOptions());

        await Assert.ThrowsAnyAsync<OperationCanceledException>(
            () => parser.ParseAsync(stream, cancellation.Token));
    }

    [Fact]
    public async Task ParseAsync_RejectsForbiddenControlBytesWithoutClaimingFormatDetection()
    {
        // A ZIP signature contains bytes forbidden by strict CSV syntax. This is not
        // file-type detection; the governed upload envelope must gate formats itself.
        byte[] zipSignature = [0x50, 0x4B, 0x03, 0x04, 0x14, 0x00];

        await AssertErrorAsync(zipSignature, CountyCsvErrorCode.MalformedCsv);
    }

    [Theory]
    [InlineData('\0')]
    [InlineData('\r')]
    [InlineData('\n')]
    [InlineData('"')]
    public void Constructor_RejectsAmbiguousDelimiterPolicy(char delimiter)
    {
        var options = CreateOptions(delimiter: delimiter);

        Assert.Throws<ArgumentOutOfRangeException>(() => new CountyCsvStreamParser(options));
    }

    [Fact]
    public void ContractId_IsReservedVersion()
    {
        Assert.Equal("wal.county-upload.csv-parser.v1", CountyCsvStreamParser.ContractId);
    }

    private static CountyCsvParserOptions CreateOptions(
        char delimiter = ',',
        long maxInputBytes = 1024,
        int maxDataRows = 10,
        int maxFieldsPerRow = 10,
        int maxCharactersPerField = 100) =>
        new()
        {
            Delimiter = delimiter,
            MaxInputBytes = maxInputBytes,
            MaxDataRows = maxDataRows,
            MaxFieldsPerRow = maxFieldsPerRow,
            MaxCharactersPerField = maxCharactersPerField,
        };

    private static async Task<CountyCsvDocument> ParseAsync(
        string csv,
        CountyCsvParserOptions? options = null)
    {
        return await ParseBytesAsync(Encoding.UTF8.GetBytes(csv), options);
    }

    private static async Task<CountyCsvDocument> ParseBytesAsync(
        byte[] bytes,
        CountyCsvParserOptions? options = null)
    {
        await using var stream = new MemoryStream(bytes, writable: false);
        var parser = new CountyCsvStreamParser(options ?? CreateOptions());
        return await parser.ParseAsync(stream);
    }

    private static async Task AssertErrorAsync(
        string csv,
        CountyCsvErrorCode errorCode,
        CountyCsvParserOptions? options = null)
    {
        await AssertErrorAsync(Encoding.UTF8.GetBytes(csv), errorCode, options);
    }

    private static async Task AssertErrorAsync(
        byte[] bytes,
        CountyCsvErrorCode errorCode,
        CountyCsvParserOptions? options = null)
    {
        var exception = await Assert.ThrowsAsync<CountyCsvParseException>(
            () => ParseBytesAsync(bytes, options));

        Assert.Equal(errorCode, exception.ErrorCode);
    }

    private sealed class BlockingReadStream : Stream
    {
        public override bool CanRead => true;

        public override bool CanSeek => false;

        public override bool CanWrite => false;

        public override long Length => throw new NotSupportedException();

        public override long Position
        {
            get => throw new NotSupportedException();
            set => throw new NotSupportedException();
        }

        public override void Flush() => throw new NotSupportedException();

        public override int Read(byte[] buffer, int offset, int count) =>
            throw new NotSupportedException();

        public override ValueTask<int> ReadAsync(
            Memory<byte> buffer,
            CancellationToken cancellationToken = default) =>
            new(WaitForCancellationAsync(cancellationToken));

        public override long Seek(long offset, SeekOrigin origin) =>
            throw new NotSupportedException();

        public override void SetLength(long value) => throw new NotSupportedException();

        public override void Write(byte[] buffer, int offset, int count) =>
            throw new NotSupportedException();

        private static async Task<int> WaitForCancellationAsync(CancellationToken cancellationToken)
        {
            await Task.Delay(Timeout.InfiniteTimeSpan, cancellationToken);
            return 0;
        }
    }

    private sealed class ChunkedMemoryStream : MemoryStream
    {
        private readonly int _maximumReadSize;

        public ChunkedMemoryStream(byte[] bytes, int maximumReadSize)
            : base(bytes, writable: false)
        {
            _maximumReadSize = maximumReadSize;
        }

        public override ValueTask<int> ReadAsync(
            Memory<byte> buffer,
            CancellationToken cancellationToken = default) =>
            base.ReadAsync(buffer[..Math.Min(buffer.Length, _maximumReadSize)], cancellationToken);
    }
}
