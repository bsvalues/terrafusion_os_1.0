using System;
using System.Collections.Generic;
using System.Linq;
using System.Reflection;
using System.Threading;
using System.Threading.Tasks;
using FluentAssertions;
using TerraFusion.Core.Sync.Execution;
using TerraFusion.Core.Sync.Profiles;
using Xunit;

namespace TerraFusion.Unit.Tests.Sync;

public sealed class ReadOnlyCountySourceExecutorTests
{
    [Fact]
    public void Executor_is_sealed_and_exposes_only_one_execution_operation()
    {
        typeof(ReadOnlyCountySourceExecutor).IsSealed.Should().BeTrue();
        ReadOnlyCountySourceExecutor.ContractId.Should()
            .Be("wal.external-readonly.execution-envelope.v1");
        var methods = typeof(ReadOnlyCountySourceExecutor).GetMethods(
            BindingFlags.Public | BindingFlags.Instance | BindingFlags.DeclaredOnly);

        methods.Should().ContainSingle();
        methods[0].Name.Should().Be(nameof(ReadOnlyCountySourceExecutor.ExecuteAsync));
        methods[0].ReturnType.Should().Be<Task<ReadOnlyCountySourceExecutionResult>>();
        methods[0].GetParameters().Select(parameter => parameter.ParameterType).Should().Equal(
            typeof(ReadOnlySourceReadRequest),
            typeof(CancellationToken));
    }

    [Theory]
    [InlineData(0)]
    [InlineData(-1)]
    [InlineData(ReadOnlySourceReadRequest.MaximumRows + 1)]
    public void Constructor_rejects_non_positive_or_oversized_result_bounds(int resultRowLimit)
    {
        var act = () => new ReadOnlyCountySourceExecutor(
            new RecordingAdapter(),
            CreateProfile(),
            resultRowLimit);

        act.Should().Throw<ArgumentOutOfRangeException>();
    }

    [Fact]
    public async Task Execute_invokes_adapter_exactly_once_and_snapshots_provenance_and_page()
    {
        var profile = CreateProfile();
        var request = CreateRequest(profile, maxRows: 2);
        var row = new Dictionary<string, object?>
        {
            ["parcel_id"] = "P-100",
            ["market_value"] = 250_000m,
        };
        var rows = new List<IReadOnlyDictionary<string, object?>> { row };
        var observedAtUtc = new DateTimeOffset(2026, 8, 27, 12, 0, 0, TimeSpan.Zero);
        var adapter = new RecordingAdapter(
            new ReadOnlySourceReadPage(rows, "checkpoint-2", observedAtUtc));
        var executor = new ReadOnlyCountySourceExecutor(adapter, profile, resultRowLimit: 2);

        var result = await executor.ExecuteAsync(request, CancellationToken.None);

        adapter.InvocationCount.Should().Be(1);
        adapter.Requests.Should().ContainSingle().Which.Should().BeSameAs(request);
        adapter.CancellationTokens.Should().ContainSingle()
            .Which.Should().Be(CancellationToken.None);
        result.Provenance.CountyId.Should().Be(profile.CountyId);
        result.Provenance.CountyCode.Should().Be(profile.CountyCode);
        result.Provenance.SourceIdentity.Should().Be(profile.SourceIdentity);
        result.Provenance.SourceFamily.Should().Be(profile.SourceFamily);
        result.Provenance.ExtractionMethod.Should().Be(profile.ExtractionMethod);
        result.Provenance.SchemaVersion.Should().Be(profile.SchemaVersion);
        result.Provenance.MappingVersion.Should().Be(profile.MappingVersion);
        result.Provenance.CheckpointStrategy.Should().Be(profile.CheckpointStrategy);
        result.Provenance.FreshnessTarget.Should().Be(profile.FreshnessTarget);
        result.CommandText.Should().Be(request.Command.Text);
        result.RequestMaxRows.Should().Be(2);
        result.ResultRowLimit.Should().Be(2);
        result.RequestedCheckpoint.Should().Be("checkpoint-1");
        result.NextCheckpoint.Should().Be("checkpoint-2");
        result.ObservedAtUtc.Should().Be(observedAtUtc);
        result.Rows.Should().ContainSingle();
        result.Rows[0]["parcel_id"].Should().Be("P-100");

        row["parcel_id"] = "caller-mutated";
        row["late_column"] = true;
        rows.Clear();

        result.Rows.Should().ContainSingle();
        result.Rows[0]["parcel_id"].Should().Be("P-100");
        result.Rows[0].Should().NotContainKey("late_column");
        var mutateRow = () =>
            ((IDictionary<string, object?>)result.Rows[0])["parcel_id"] = "mutated";
        mutateRow.Should().Throw<NotSupportedException>();
        var mutateRows = () =>
            ((IList<IReadOnlyDictionary<string, object?>>)result.Rows).Clear();
        mutateRows.Should().Throw<NotSupportedException>();
    }

    [Fact]
    public async Task Execute_snapshots_request_parameters_independently_of_request_storage()
    {
        var profile = CreateProfile();
        var request = CreateRequest(profile, maxRows: 1);
        var adapter = new RecordingAdapter(EmptyPage());
        var executor = new ReadOnlyCountySourceExecutor(adapter, profile, resultRowLimit: 1);

        var result = await executor.ExecuteAsync(request, CancellationToken.None);

        result.Parameters.Should().ContainKey("countyId").WhoseValue.Should().Be(profile.CountyId);
        result.Parameters.Should().NotBeSameAs(request.Parameters);
        var mutateParameters = () =>
            ((IDictionary<string, object?>)result.Parameters)["countyId"] = Guid.NewGuid();
        mutateParameters.Should().Throw<NotSupportedException>();
    }

    [Fact]
    public async Task Execute_rejects_request_above_configured_bound_without_invoking_adapter()
    {
        var profile = CreateProfile();
        var adapter = new RecordingAdapter(EmptyPage());
        var executor = new ReadOnlyCountySourceExecutor(adapter, profile, resultRowLimit: 1);
        var request = CreateRequest(profile, maxRows: 2);

        var act = () => executor.ExecuteAsync(request, CancellationToken.None);

        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*exceeds*configured*row limit*");
        adapter.InvocationCount.Should().Be(0);
    }

    [Fact]
    public async Task Execute_rejects_profile_provenance_drift_without_invoking_adapter()
    {
        var configuredProfile = CreateProfile();
        var requestProfile = CreateProfile(sourceIdentity: "different-source");
        var adapter = new RecordingAdapter(EmptyPage());
        var executor = new ReadOnlyCountySourceExecutor(
            adapter,
            configuredProfile,
            resultRowLimit: 10);

        var act = () => executor.ExecuteAsync(
            CreateRequest(requestProfile, maxRows: 10),
            CancellationToken.None);

        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*profile*configured provenance*");
        adapter.InvocationCount.Should().Be(0);
    }

    [Fact]
    public async Task Execute_rejects_adapter_page_above_request_bound_after_one_invocation()
    {
        var profile = CreateProfile();
        var rows = Enumerable.Range(1, 3)
            .Select(number => (IReadOnlyDictionary<string, object?>)new Dictionary<string, object?>
            {
                ["parcel_id"] = $"P-{number}",
            })
            .ToArray();
        var adapter = new RecordingAdapter(
            new ReadOnlySourceReadPage(rows, null, DateTimeOffset.UtcNow));
        var executor = new ReadOnlyCountySourceExecutor(adapter, profile, resultRowLimit: 2);

        var act = () => executor.ExecuteAsync(
            CreateRequest(profile, maxRows: 2),
            CancellationToken.None);

        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*more rows*");
        adapter.InvocationCount.Should().Be(1);
    }

    [Fact]
    public async Task Execute_rejects_mutable_adapter_values_instead_of_leaking_references()
    {
        var profile = CreateProfile();
        var mutableValue = new byte[] { 1, 2, 3 };
        var adapter = new RecordingAdapter(
            new ReadOnlySourceReadPage(
                new[]
                {
                    (IReadOnlyDictionary<string, object?>)new Dictionary<string, object?>
                    {
                        ["binary_value"] = mutableValue,
                    },
                },
                null,
                DateTimeOffset.UtcNow));
        var executor = new ReadOnlyCountySourceExecutor(adapter, profile, resultRowLimit: 1);

        var act = () => executor.ExecuteAsync(
            CreateRequest(profile, maxRows: 1),
            CancellationToken.None);

        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*not a supported immutable scalar*");
        adapter.InvocationCount.Should().Be(1);
    }

    [Fact]
    public async Task Execute_rejects_a_null_adapter_page_after_one_invocation()
    {
        var profile = CreateProfile();
        var adapter = new RecordingAdapter((ReadOnlySourceReadPage)null!);
        var executor = new ReadOnlyCountySourceExecutor(adapter, profile, resultRowLimit: 1);

        var act = () => executor.ExecuteAsync(
            CreateRequest(profile, maxRows: 1),
            CancellationToken.None);

        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*no result page*");
        adapter.InvocationCount.Should().Be(1);
    }

    [Fact]
    public async Task Execute_rejects_null_row_storage_after_one_invocation()
    {
        var profile = CreateProfile();
        var adapter = new RecordingAdapter(
            new ReadOnlySourceReadPage(null!, null, DateTimeOffset.UtcNow));
        var executor = new ReadOnlyCountySourceExecutor(adapter, profile, resultRowLimit: 1);

        var act = () => executor.ExecuteAsync(
            CreateRequest(profile, maxRows: 1),
            CancellationToken.None);

        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*null row collection*");
        adapter.InvocationCount.Should().Be(1);
    }

    [Fact]
    public async Task Execute_propagates_the_adapter_exception_without_retry_or_translation()
    {
        var profile = CreateProfile();
        var expected = new DeliberateAdapterException("adapter failure");
        var adapter = new RecordingAdapter(expected);
        var executor = new ReadOnlyCountySourceExecutor(adapter, profile, resultRowLimit: 1);

        var act = () => executor.ExecuteAsync(
            CreateRequest(profile, maxRows: 1),
            CancellationToken.None);

        var assertion = await act.Should().ThrowAsync<DeliberateAdapterException>();
        assertion.Which.Should().BeSameAs(expected);
        adapter.InvocationCount.Should().Be(1);
    }

    [Fact]
    public async Task Execute_propagates_pre_dispatch_cancellation_without_invoking_adapter()
    {
        var profile = CreateProfile();
        var adapter = new RecordingAdapter(EmptyPage());
        var executor = new ReadOnlyCountySourceExecutor(adapter, profile, resultRowLimit: 1);
        using var cancellationSource = new CancellationTokenSource();
        cancellationSource.Cancel();

        var act = () => executor.ExecuteAsync(
            CreateRequest(profile, maxRows: 1),
            cancellationSource.Token);

        await act.Should().ThrowAsync<OperationCanceledException>();
        adapter.InvocationCount.Should().Be(0);
    }

    [Fact]
    public async Task Execute_propagates_adapter_cancellation_after_one_invocation()
    {
        var profile = CreateProfile();
        using var cancellationSource = new CancellationTokenSource();
        var expected = new OperationCanceledException(cancellationSource.Token);
        var adapter = new RecordingAdapter(expected);
        var executor = new ReadOnlyCountySourceExecutor(adapter, profile, resultRowLimit: 1);

        var act = () => executor.ExecuteAsync(
            CreateRequest(profile, maxRows: 1),
            cancellationSource.Token);

        var assertion = await act.Should().ThrowAsync<OperationCanceledException>();
        assertion.Which.Should().BeSameAs(expected);
        adapter.InvocationCount.Should().Be(1);
    }

    private static ReadOnlyCountySourceProfile CreateProfile(
        string sourceIdentity = "mock-harris-export")
    {
        return new ReadOnlyCountySourceProfile(
            Guid.Parse("46527c69-70f5-480e-8792-a81b2d28762f"),
            "WA-005",
            sourceIdentity,
            "sql-family",
            "bounded-select",
            "schema-v1",
            "mapping-v1",
            "watermark-v1",
            TimeSpan.FromHours(24));
    }

    private static ReadOnlySourceReadRequest CreateRequest(
        ReadOnlyCountySourceProfile profile,
        int maxRows)
    {
        return new ReadOnlySourceReadRequest(
            profile,
            ReadOnlySourceCommand.RequireRead(
                "SELECT parcel_id FROM parcels WHERE county_id = @countyId"),
            new Dictionary<string, object?> { ["countyId"] = profile.CountyId },
            maxRows,
            checkpoint: "checkpoint-1");
    }

    private static ReadOnlySourceReadPage EmptyPage()
    {
        return new ReadOnlySourceReadPage(
            Array.Empty<IReadOnlyDictionary<string, object?>>(),
            null,
            DateTimeOffset.UtcNow);
    }

    private sealed class RecordingAdapter : IReadOnlyCountySourceAdapter
    {
        private readonly ReadOnlySourceReadPage? _page;
        private readonly Exception? _exception;

        public RecordingAdapter()
            : this(EmptyPage())
        {
        }

        public RecordingAdapter(ReadOnlySourceReadPage page)
        {
            _page = page;
        }

        public RecordingAdapter(Exception exception)
        {
            _exception = exception;
        }

        public int InvocationCount { get; private set; }

        public List<ReadOnlySourceReadRequest> Requests { get; } = new();

        public List<CancellationToken> CancellationTokens { get; } = new();

        public Task<ReadOnlySourceReadPage> ReadPageAsync(
            ReadOnlySourceReadRequest request,
            CancellationToken cancellationToken = default)
        {
            InvocationCount++;
            Requests.Add(request);
            CancellationTokens.Add(cancellationToken);

            if (_exception is not null)
            {
                return Task.FromException<ReadOnlySourceReadPage>(_exception);
            }

            return Task.FromResult(_page!);
        }
    }

    private sealed class DeliberateAdapterException : Exception
    {
        public DeliberateAdapterException(string message)
            : base(message)
        {
        }
    }
}
