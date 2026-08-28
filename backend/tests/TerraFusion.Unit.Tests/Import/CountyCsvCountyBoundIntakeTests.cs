using System.Buffers;
using System.Security.Cryptography;
using System.Text;
using TerraFusion.Core.Counties;
using TerraFusion.Core.Import;
using Xunit;

namespace TerraFusion.Unit.Tests.Import;

public sealed class CountyCsvCountyBoundIntakeTests
{
    private static readonly WashingtonCountyIdentity Benton = Resolve("Benton");
    private static readonly WashingtonCountyIdentity Franklin = Resolve("Franklin");

    [Theory]
    [InlineData(CountyCsvDataset.Parcels)]
    [InlineData(CountyCsvDataset.Sales)]
    public async Task AdmitAsync_BindsExactCanonicalCountyDatasetPostureAndProtectedReceipt(
        CountyCsvDataset dataset)
    {
        var source = Encoding.UTF8.GetBytes("parcel_id,owner\r\n1,Ada\r\n");
        var valueEqualCounty = Benton with { };

        var receipt = await CreateSut().AdmitAsync(
            Request(valueEqualCounty, Benton, dataset, Declaration(), source));

        Assert.Equal(CountyCsvCountyBoundIntake.ContractId, receipt.ContractId);
        Assert.Same(Benton, receipt.Binding.County);
        Assert.Equal(dataset, receipt.Binding.Dataset);
        Assert.Equal(CountyDataMode.CountyProvided, receipt.Binding.DataMode);
        Assert.Equal(CountyDataExposure.Protected, receipt.Binding.Exposure);
        Assert.Equal(CountyDataAction.Operate, receipt.Binding.Action);
        Assert.Equal(CountyCsvIntakeEnvelope.ContractId, receipt.IntakeReceipt.ContractId);
        Assert.Equal(source.LongLength, receipt.IntakeReceipt.Content.ByteLength);
        Assert.Equal(
            Convert.ToHexString(SHA256.HashData(source)).ToLowerInvariant(),
            receipt.IntakeReceipt.Content.Sha256);
        Assert.Equal(new[] { "parcel_id", "owner" }, receipt.IntakeReceipt.Document.Headers);
        Assert.Equal(new[] { "1", "Ada" }, Assert.Single(receipt.IntakeReceipt.Document.Rows));
    }

    [Fact]
    public async Task AdmitAsync_DeniesInvalidAuthorityBeforeDeclarationOrContentAccess()
    {
        var cases = new Func<ReadOnlyMemory<byte>, CountyCsvCountyBoundIntakeRequest?>[]
        {
            _ => null,
            content => Request(null, Benton, CountyCsvDataset.Parcels, null!, content),
            content => Request(
                Benton with { FipsCode = "53099" },
                Benton,
                CountyCsvDataset.Parcels,
                null!,
                content),
            content => Request(Benton, null, CountyCsvDataset.Parcels, null!, content),
            content => Request(
                Benton,
                Benton with { Name = "Benton County" },
                CountyCsvDataset.Parcels,
                null!,
                content),
            content => Request(Benton, Franklin, CountyCsvDataset.Parcels, null!, content),
            content => Request(
                Benton,
                Franklin,
                (CountyCsvDataset)int.MaxValue,
                null!,
                content),
        };

        foreach (var createRequest in cases)
        {
            using var memory = new CountingMemoryManager(Encoding.UTF8.GetBytes("not,csv"));
            var content = memory.Memory;
            var accessesBeforeAdmission = memory.SpanAccessCount;

            var exception = await Assert.ThrowsAsync<CountyCsvCountyBoundIntakeException>(
                () => CreateSut().AdmitAsync(createRequest(content)));

            Assert.Equal(CountyCsvCountyBoundIntakeErrorCode.AuthorityDenied, exception.ErrorCode);
            Assert.Equal("County CSV intake authority is denied.", exception.Message);
            Assert.Equal(accessesBeforeAdmission, memory.SpanAccessCount);
        }
    }

    [Theory]
    [InlineData(CountyCsvDataset.Unspecified)]
    [InlineData((CountyCsvDataset)(-1))]
    [InlineData((CountyCsvDataset)int.MaxValue)]
    public async Task AdmitAsync_DeniesUnsupportedDatasetBeforeDeclarationOrContentAccess(
        CountyCsvDataset dataset)
    {
        using var memory = new CountingMemoryManager(Encoding.UTF8.GetBytes("not,csv"));
        var content = memory.Memory;
        var accessesBeforeAdmission = memory.SpanAccessCount;

        var exception = await Assert.ThrowsAsync<CountyCsvCountyBoundIntakeException>(
            () => CreateSut().AdmitAsync(Request(Benton, Benton, dataset, null!, content)));

        Assert.Equal(CountyCsvCountyBoundIntakeErrorCode.UnsupportedDataset, exception.ErrorCode);
        Assert.Equal(accessesBeforeAdmission, memory.SpanAccessCount);
    }

    [Fact]
    public async Task AdmitAsync_UsesOneProtectedEnvelopeSnapshotWithoutRetry()
    {
        using var memory = new CountingMemoryManager(
            Encoding.UTF8.GetBytes("parcel_id,owner\n1,Ada"));
        var content = memory.Memory;
        var accessesBeforeAdmission = memory.SpanAccessCount;

        var receipt = await CreateSut().AdmitAsync(
            Request(Benton, Benton, CountyCsvDataset.Parcels, Declaration(), content));

        Assert.Equal(accessesBeforeAdmission + 1, memory.SpanAccessCount);
        Assert.Equal(new[] { "1", "Ada" }, Assert.Single(receipt.IntakeReceipt.Document.Rows));
    }

    [Fact]
    public async Task AdmitAsync_DoesNotInferDatasetFromFileNameOrHeaders()
    {
        var receipt = await CreateSut().AdmitAsync(
            Request(
                Benton,
                Benton,
                CountyCsvDataset.Sales,
                new CountyCsvIntakeDeclaration
                {
                    FileName = "parcels.csv",
                    Format = "csv",
                    MediaType = "text/csv",
                },
                Encoding.UTF8.GetBytes("parcel_id\n1")));

        Assert.Equal(CountyCsvDataset.Sales, receipt.Binding.Dataset);
    }

    [Fact]
    public async Task AdmitAsync_PropagatesProtectedDeclarationFailureWithoutReplacement()
    {
        var exception = await Assert.ThrowsAsync<CountyCsvIntakeException>(
            () => CreateSut().AdmitAsync(
                Request(
                    Benton,
                    Benton,
                    CountyCsvDataset.Parcels,
                    new CountyCsvIntakeDeclaration
                    {
                        FileName = "parcels.txt",
                        Format = "csv",
                        MediaType = "text/csv",
                    },
                    Encoding.UTF8.GetBytes("parcel_id\n1"))));

        Assert.Equal(CountyCsvIntakeErrorCode.FormatMismatch, exception.ErrorCode);
    }

    [Fact]
    public async Task AdmitAsync_PropagatesProtectedByteAndRowBoundsWithoutRetry()
    {
        var byteException = await Assert.ThrowsAsync<CountyCsvParseException>(
            () => CreateSut(maxInputBytes: 8).AdmitAsync(
                Request(
                    Benton,
                    Benton,
                    CountyCsvDataset.Parcels,
                    Declaration(),
                    new byte[9])));
        Assert.Equal(CountyCsvErrorCode.InputTooLarge, byteException.ErrorCode);

        var rowException = await Assert.ThrowsAsync<CountyCsvParseException>(
            () => CreateSut(maxDataRows: 1).AdmitAsync(
                Request(
                    Benton,
                    Benton,
                    CountyCsvDataset.Parcels,
                    Declaration(),
                    Encoding.UTF8.GetBytes("parcel_id\n1\n2"))));
        Assert.Equal(CountyCsvErrorCode.TooManyRows, rowException.ErrorCode);
    }

    [Fact]
    public async Task AdmitAsync_PropagatesForbiddenSignatureWithoutRetry()
    {
        using var memory = new CountingMemoryManager(Encoding.ASCII.GetBytes("%PDF-1.7"));
        var content = memory.Memory;
        var accessesBeforeAdmission = memory.SpanAccessCount;

        var exception = await Assert.ThrowsAsync<CountyCsvIntakeException>(
            () => CreateSut().AdmitAsync(
                Request(
                    Benton,
                    Benton,
                    CountyCsvDataset.Parcels,
                    Declaration(),
                    content)));

        Assert.Equal(
            CountyCsvIntakeErrorCode.ContainerSignatureMismatch,
            exception.ErrorCode);
        Assert.Equal(accessesBeforeAdmission + 1, memory.SpanAccessCount);
    }

    [Fact]
    public async Task AdmitAsync_PropagatesFieldCountBoundWithoutRetry()
    {
        using var memory = new CountingMemoryManager(
            Encoding.UTF8.GetBytes("parcel_id,owner\n1,Ada"));
        var content = memory.Memory;
        var accessesBeforeAdmission = memory.SpanAccessCount;

        var exception = await Assert.ThrowsAsync<CountyCsvParseException>(
            () => CreateSut(maxFieldsPerRow: 1).AdmitAsync(
                Request(
                    Benton,
                    Benton,
                    CountyCsvDataset.Parcels,
                    Declaration(),
                    content)));

        Assert.Equal(CountyCsvErrorCode.TooManyFields, exception.ErrorCode);
        Assert.Equal(accessesBeforeAdmission + 1, memory.SpanAccessCount);
    }

    [Fact]
    public async Task AdmitAsync_PropagatesFieldCharacterBoundWithoutRetry()
    {
        using var memory = new CountingMemoryManager(Encoding.UTF8.GetBytes("id\n1234"));
        var content = memory.Memory;
        var accessesBeforeAdmission = memory.SpanAccessCount;

        var exception = await Assert.ThrowsAsync<CountyCsvParseException>(
            () => CreateSut(maxCharactersPerField: 3).AdmitAsync(
                Request(
                    Benton,
                    Benton,
                    CountyCsvDataset.Parcels,
                    Declaration(),
                    content)));

        Assert.Equal(CountyCsvErrorCode.FieldTooLong, exception.ErrorCode);
        Assert.Equal(accessesBeforeAdmission + 1, memory.SpanAccessCount);
    }

    [Fact]
    public async Task AdmitAsync_ObservesPreCancelledTokenBeforeAuthorityOrContentAccess()
    {
        using var memory = new CountingMemoryManager(Encoding.UTF8.GetBytes("parcel_id\n1"));
        var content = memory.Memory;
        var accessesBeforeAdmission = memory.SpanAccessCount;
        using var cancellation = new CancellationTokenSource();
        await cancellation.CancelAsync();

        await Assert.ThrowsAnyAsync<OperationCanceledException>(
            () => CreateSut().AdmitAsync(
                Request(Benton, Franklin, CountyCsvDataset.Parcels, null!, content),
                cancellation.Token));

        Assert.Equal(accessesBeforeAdmission, memory.SpanAccessCount);
    }

    [Fact]
    public async Task AdmitAsync_SnapshotsCallerBytesAndPreservesDeepReadOnlyDocument()
    {
        var source = Encoding.UTF8.GetBytes("parcel_id,owner\n1,Ada");
        var expectedHash = Convert.ToHexString(SHA256.HashData(source)).ToLowerInvariant();

        var receipt = await CreateSut().AdmitAsync(
            Request(Benton, Benton, CountyCsvDataset.Parcels, Declaration(), source));
        Array.Fill<byte>(source, 0x58);

        var headers = Assert.IsAssignableFrom<IList<string>>(receipt.IntakeReceipt.Document.Headers);
        var rows = Assert.IsAssignableFrom<IList<IReadOnlyList<string>>>(
            receipt.IntakeReceipt.Document.Rows);
        var firstRow = Assert.IsAssignableFrom<IList<string>>(
            receipt.IntakeReceipt.Document.Rows[0]);

        Assert.Throws<NotSupportedException>(() => headers[0] = "tampered");
        Assert.Throws<NotSupportedException>(
            () => rows[0] = Array.AsReadOnly(new[] { "tampered", "row" }));
        Assert.Throws<NotSupportedException>(() => firstRow[0] = "tampered");
        Assert.Equal(expectedHash, receipt.IntakeReceipt.Content.Sha256);
        Assert.Same(Benton, receipt.Binding.County);
        Assert.Equal(CountyCsvDataset.Parcels, receipt.Binding.Dataset);
        Assert.Equal(new[] { "1", "Ada" }, Assert.Single(receipt.IntakeReceipt.Document.Rows));
    }

    [Fact]
    public void ContractSurface_IsExactAndHasNoInjectableEnvelopeBypass()
    {
        Assert.Equal(
            "wal.county-upload.csv-county-bound-intake.v1",
            CountyCsvCountyBoundIntake.ContractId);

        var constructor = Assert.Single(typeof(CountyCsvCountyBoundIntake).GetConstructors());
        Assert.Equal(
            new[] { typeof(CountyCsvParserOptions) },
            constructor.GetParameters().Select(parameter => parameter.ParameterType));

        var envelopeField = Assert.Single(
            typeof(CountyCsvCountyBoundIntake)
                .GetFields(System.Reflection.BindingFlags.Instance | System.Reflection.BindingFlags.NonPublic));
        Assert.Equal(typeof(CountyCsvIntakeEnvelope), envelopeField.FieldType);
    }

    private static CountyCsvCountyBoundIntake CreateSut(
        int maxDataRows = 10,
        long maxInputBytes = 4096,
        int maxFieldsPerRow = 20,
        int maxCharactersPerField = 256) =>
        new(
            new CountyCsvParserOptions
            {
                Delimiter = ',',
                MaxInputBytes = maxInputBytes,
                MaxDataRows = maxDataRows,
                MaxFieldsPerRow = maxFieldsPerRow,
                MaxCharactersPerField = maxCharactersPerField,
            });

    private static CountyCsvCountyBoundIntakeRequest Request(
        WashingtonCountyIdentity? resourceCounty,
        WashingtonCountyIdentity? authorityCounty,
        CountyCsvDataset dataset,
        CountyCsvIntakeDeclaration declaration,
        ReadOnlyMemory<byte> content) =>
        new(resourceCounty, authorityCounty, dataset, declaration, content);

    private static CountyCsvIntakeDeclaration Declaration() =>
        new()
        {
            FileName = "parcels.csv",
            Format = "csv",
            MediaType = "text/csv",
        };

    private static WashingtonCountyIdentity Resolve(string value)
    {
        Assert.True(WashingtonCountyRegistry.TryResolve(value, out var county));
        return county;
    }

    private sealed class CountingMemoryManager(byte[] bytes) : MemoryManager<byte>
    {
        public int SpanAccessCount { get; private set; }

        public override Span<byte> GetSpan()
        {
            SpanAccessCount++;
            return bytes;
        }

        public override MemoryHandle Pin(int elementIndex = 0) =>
            throw new NotSupportedException("Pinning is not required by the in-memory intake contract.");

        public override void Unpin()
        {
        }

        protected override void Dispose(bool disposing)
        {
        }
    }
}
