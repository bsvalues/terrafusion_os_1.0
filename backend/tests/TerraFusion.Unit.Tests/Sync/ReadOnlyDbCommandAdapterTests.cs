using System;
using System.Collections;
using System.Collections.Generic;
using System.Data;
using System.Data.Common;
using System.Diagnostics.CodeAnalysis;
using System.Linq;
using System.Reflection;
using System.Threading;
using System.Threading.Tasks;
using FluentAssertions;
using TerraFusion.Core.Sync.Execution;
using TerraFusion.Core.Sync.Profiles;
using Xunit;

namespace TerraFusion.Unit.Tests.Sync;

public sealed class ReadOnlyDbCommandAdapterTests
{
    private static readonly DateTimeOffset ObservedAtUtc =
        new(2026, 8, 28, 5, 15, 0, TimeSpan.Zero);

    [Fact]
    public void Adapter_is_sealed_and_exposes_only_one_read_operation()
    {
        typeof(ReadOnlyDbCommandAdapter).IsSealed.Should().BeTrue();
        typeof(IReadOnlyCountySourceAdapter).IsAssignableFrom(typeof(ReadOnlyDbCommandAdapter))
            .Should().BeTrue();
        ReadOnlyDbCommandAdapter.ContractId.Should()
            .Be("wal.external-readonly.db-command-adapter.v1");

        var methods = typeof(ReadOnlyDbCommandAdapter).GetMethods(
            BindingFlags.Public | BindingFlags.Instance | BindingFlags.DeclaredOnly);
        methods.Should().ContainSingle();
        methods[0].Name.Should().Be(nameof(ReadOnlyDbCommandAdapter.ReadPageAsync));
        methods[0].GetParameters().Select(parameter => parameter.ParameterType).Should().Equal(
            typeof(ReadOnlySourceReadRequest),
            typeof(CancellationToken));
    }

    [Theory]
    [InlineData(0)]
    [InlineData(-1)]
    [InlineData(ReadOnlyCountySourceExecutor.MaximumFieldsPerRow + 1)]
    public void Constructor_rejects_non_positive_or_oversized_field_limits(int fieldLimit)
    {
        var act = () => CreateAdapter(new FakeDbCommand(CreateOrdinaryReader()), fieldLimit);

        act.Should().Throw<ArgumentOutOfRangeException>();
    }

    [Fact]
    public void Constructor_rejects_null_dependencies()
    {
        var nullCommand = () => new ReadOnlyDbCommandAdapter(
            null!,
            1,
            new FixedTimeProvider(ObservedAtUtc));
        var nullTimeProvider = () => new ReadOnlyDbCommandAdapter(
            new FakeDbCommand(CreateOrdinaryReader()),
            1,
            null!);

        nullCommand.Should().Throw<ArgumentNullException>();
        nullTimeProvider.Should().Throw<ArgumentNullException>();
    }

    [Fact]
    public async Task Protected_executor_composes_one_exact_bounded_reader_execution()
    {
        var profile = CreateProfile();
        var request = CreateRequest(
            profile,
            maxRows: 2,
            new Dictionary<string, object?>
            {
                ["zNull"] = null,
                ["countyId"] = profile.CountyId,
            });
        var reader = new FakeDbDataReader(
            new[] { "parcel_id", "market_value" },
            new[] { new object?[] { "P-100", 250_000m } });
        var connection = new FakeDbConnection();
        var command = new FakeDbCommand(reader, connection);
        command.Parameters.Add(new FakeDbParameter { ParameterName = "stale", Value = "stale" });
        var adapter = CreateAdapter(command, fieldLimit: 2);
        var executor = new ReadOnlyCountySourceExecutor(adapter, profile, 2, 2);

        var result = await executor.ExecuteAsync(request, CancellationToken.None);

        command.ExecuteReaderAsyncCallCount.Should().Be(1);
        command.LastCommandBehavior.Should()
            .Be(CommandBehavior.SingleResult | CommandBehavior.SequentialAccess);
        command.LastCancellationToken.Should().Be(CancellationToken.None);
        command.CommandType.Should().Be(CommandType.Text);
        command.CommandText.Should().Be(request.Command.Text);
        command.UpdatedRowSource.Should().Be(UpdateRowSource.None);
        command.Parameters.Cast<DbParameter>().Select(parameter => parameter.ParameterName)
            .Should().Equal("countyId", "zNull");
        command.Parameters["countyId"].Value.Should().Be(profile.CountyId);
        command.Parameters["countyId"].Direction.Should().Be(ParameterDirection.Input);
        command.Parameters["zNull"].Value.Should().BeSameAs(DBNull.Value);
        command.Parameters["zNull"].IsNullable.Should().BeTrue();
        command.CreateParameterCallCount.Should().Be(2);
        reader.ReadAsyncCallCount.Should().Be(2);
        reader.GetNameCallCount.Should().Be(2);
        reader.GetValueCallCount.Should().Be(2);
        reader.DisposeAsyncCallCount.Should().Be(1);
        reader.NextResultCallCount.Should().Be(0);
        command.ExecuteNonQueryCallCount.Should().Be(0);
        command.ExecuteScalarCallCount.Should().Be(0);
        command.PrepareCallCount.Should().Be(0);
        command.CancelCallCount.Should().Be(0);
        command.DisposeCallCount.Should().Be(0);
        connection.OpenCallCount.Should().Be(0);
        connection.CloseCallCount.Should().Be(0);
        connection.BeginTransactionCallCount.Should().Be(0);
        connection.CreateCommandCallCount.Should().Be(0);
        result.Rows.Should().ContainSingle();
        result.Rows[0]["parcel_id"].Should().Be("P-100");
        result.Rows[0]["market_value"].Should().Be(250_000m);
        result.Provenance.CountyId.Should().Be(profile.CountyId);
        result.NextCheckpoint.Should().BeNull();
        result.ObservedAtUtc.Should().Be(ObservedAtUtc);
    }

    [Fact]
    public async Task Row_overflow_stops_after_one_bounded_sentinel_read()
    {
        var profile = CreateProfile();
        var reader = new FakeDbDataReader(
            new[] { "parcel_id" },
            new[] { new object?[] { "P-1" } },
            alwaysReturnsRow: true);
        var command = new FakeDbCommand(reader);
        var executor = new ReadOnlyCountySourceExecutor(
            CreateAdapter(command, 1),
            profile,
            resultRowLimit: 2,
            resultFieldLimit: 1);

        var act = () => executor.ExecuteAsync(
            CreateRequest(profile, maxRows: 2),
            CancellationToken.None);

        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*more rows*");
        command.ExecuteReaderAsyncCallCount.Should().Be(1);
        reader.ReadAsyncCallCount.Should().Be(3);
        reader.GetValueCallCount.Should().Be(2);
        reader.DisposeAsyncCallCount.Should().Be(1);
    }

    [Theory]
    [InlineData(0)]
    [InlineData(3)]
    [InlineData(int.MaxValue)]
    public async Task Dishonest_or_out_of_bound_field_counts_fail_before_enumeration(int fieldCount)
    {
        var profile = CreateProfile();
        var reader = new FakeDbDataReader(
            new[] { "parcel_id", "market_value" },
            new[] { new object?[] { "P-1", 1m } },
            declaredFieldCount: fieldCount);
        var command = new FakeDbCommand(reader);
        var executor = new ReadOnlyCountySourceExecutor(
            CreateAdapter(command, fieldLimit: 2),
            profile,
            1,
            2);

        var act = () => executor.ExecuteAsync(
            CreateRequest(profile, maxRows: 1),
            CancellationToken.None);

        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*field count*");
        reader.GetNameCallCount.Should().Be(0);
        reader.ReadAsyncCallCount.Should().Be(0);
        reader.GetValueCallCount.Should().Be(0);
        reader.DisposeAsyncCallCount.Should().Be(1);
    }

    [Theory]
    [MemberData(nameof(InvalidFieldNames))]
    public async Task Blank_or_duplicate_field_names_fail_before_row_enumeration(string[] names)
    {
        var profile = CreateProfile();
        var reader = new FakeDbDataReader(names, new[] { new object?[names.Length] });
        var executor = new ReadOnlyCountySourceExecutor(
            CreateAdapter(new FakeDbCommand(reader), names.Length),
            profile,
            1,
            names.Length);

        var act = () => executor.ExecuteAsync(
            CreateRequest(profile, maxRows: 1),
            CancellationToken.None);

        await act.Should().ThrowAsync<InvalidOperationException>();
        reader.ReadAsyncCallCount.Should().Be(0);
        reader.GetValueCallCount.Should().Be(0);
        reader.DisposeAsyncCallCount.Should().Be(1);
    }

    public static IEnumerable<object[]> InvalidFieldNames()
    {
        yield return new object[] { new[] { " " } };
        yield return new object[] { new[] { "parcel_id", "parcel_id" } };
    }

    [Fact]
    public async Task Mutable_reader_values_fail_closed_inside_the_adapter()
    {
        var profile = CreateProfile();
        var reader = new FakeDbDataReader(
            new[] { "binary_value" },
            new[] { new object?[] { new byte[] { 1, 2, 3 } } });
        var executor = new ReadOnlyCountySourceExecutor(
            CreateAdapter(new FakeDbCommand(reader), 1),
            profile,
            1,
            1);

        var act = () => executor.ExecuteAsync(
            CreateRequest(profile, maxRows: 1),
            CancellationToken.None);

        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*not a supported immutable scalar*");
        reader.ReadAsyncCallCount.Should().Be(1);
        reader.GetValueCallCount.Should().Be(1);
        reader.DisposeAsyncCallCount.Should().Be(1);
    }

    [Fact]
    public async Task DbNull_is_projected_to_an_immutable_null_value()
    {
        var profile = CreateProfile();
        var reader = new FakeDbDataReader(
            new[] { "optional_value" },
            new[] { new object?[] { DBNull.Value } });
        var executor = new ReadOnlyCountySourceExecutor(
            CreateAdapter(new FakeDbCommand(reader), 1),
            profile,
            1,
            1);

        var result = await executor.ExecuteAsync(
            CreateRequest(profile, maxRows: 1),
            CancellationToken.None);

        result.Rows[0].Should().ContainKey("optional_value").WhoseValue.Should().BeNull();
    }

    [Fact]
    public async Task Maximum_parameter_value_count_is_projected_and_executes_once()
    {
        var profile = CreateProfile();
        var command = new FakeDbCommand(CreateOrdinaryReader());
        var adapter = CreateAdapter(command, 1);
        var executor = new ReadOnlyCountySourceExecutor(adapter, profile, 1, 1);
        var request = CreateRequest(
            profile,
            maxRows: 1,
            CreateParameters(ReadOnlyCountySourceExecutor.MaximumFieldsPerRow));

        await executor.ExecuteAsync(request, CancellationToken.None);

        command.CreateParameterCallCount.Should()
            .Be(ReadOnlyCountySourceExecutor.MaximumFieldsPerRow);
        command.ParameterAddCallCount.Should()
            .Be(ReadOnlyCountySourceExecutor.MaximumFieldsPerRow);
        command.Parameters.Count.Should().Be(ReadOnlyCountySourceExecutor.MaximumFieldsPerRow);
        command.ExecuteReaderAsyncCallCount.Should().Be(1);
    }

    [Fact]
    public async Task Oversized_parameter_value_count_fails_before_projection_or_execution_and_consumes_adapter()
    {
        var profile = CreateProfile();
        var command = new FakeDbCommand(CreateOrdinaryReader());
        var adapter = CreateAdapter(command, 1);
        var oversizedRequest = CreateRequest(
            profile,
            maxRows: 1,
            CreateParameters(ReadOnlyCountySourceExecutor.MaximumFieldsPerRow + 1));

        var oversized = () => adapter.ReadPageAsync(oversizedRequest, CancellationToken.None);

        await oversized.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage($"*{ReadOnlyCountySourceExecutor.MaximumFieldsPerRow}-parameter limit*");
        command.CreateParameterCallCount.Should().Be(0);
        command.ParameterAddCallCount.Should().Be(0);
        command.Parameters.Count.Should().Be(0);
        command.ExecuteReaderAsyncCallCount.Should().Be(0);

        var second = () => adapter.ReadPageAsync(
            CreateRequest(profile, maxRows: 1),
            CancellationToken.None);

        await second.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*single-use*");
        command.CreateParameterCallCount.Should().Be(0);
        command.ParameterAddCallCount.Should().Be(0);
        command.ExecuteReaderAsyncCallCount.Should().Be(0);
    }

    [Fact]
    public async Task Adapter_is_single_use_after_success()
    {
        var profile = CreateProfile();
        var command = new FakeDbCommand(CreateOrdinaryReader());
        var adapter = CreateAdapter(command, 1);
        var request = CreateRequest(profile, maxRows: 1);

        await adapter.ReadPageAsync(request, CancellationToken.None);
        var second = () => adapter.ReadPageAsync(request, CancellationToken.None);

        await second.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*single-use*");
        command.ExecuteReaderAsyncCallCount.Should().Be(1);
    }

    [Fact]
    public async Task Concurrent_call_fails_while_the_single_execution_is_in_flight()
    {
        var profile = CreateProfile();
        var command = new FakeDbCommand(CreateOrdinaryReader(), holdExecution: true);
        var adapter = CreateAdapter(command, 1);
        var request = CreateRequest(profile, maxRows: 1);

        var first = adapter.ReadPageAsync(request, CancellationToken.None);
        await command.ExecutionEntered;
        var second = () => adapter.ReadPageAsync(request, CancellationToken.None);

        await second.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*single-use*");
        command.ReleaseExecution();
        await first;
        command.ExecuteReaderAsyncCallCount.Should().Be(1);
    }

    [Fact]
    public async Task Pre_dispatch_cancellation_does_not_execute_or_consume_the_adapter()
    {
        var profile = CreateProfile();
        var command = new FakeDbCommand(CreateOrdinaryReader());
        var adapter = CreateAdapter(command, 1);
        using var cancellationSource = new CancellationTokenSource();
        cancellationSource.Cancel();

        var cancelled = () => adapter.ReadPageAsync(
            CreateRequest(profile, maxRows: 1),
            cancellationSource.Token);

        await cancelled.Should().ThrowAsync<OperationCanceledException>();
        command.ExecuteReaderAsyncCallCount.Should().Be(0);

        await adapter.ReadPageAsync(CreateRequest(profile, maxRows: 1), CancellationToken.None);
        command.ExecuteReaderAsyncCallCount.Should().Be(1);
    }

    [Fact]
    public async Task Attached_transaction_fails_before_command_execution()
    {
        var profile = CreateProfile();
        var connection = new FakeDbConnection();
        var command = new FakeDbCommand(
            CreateOrdinaryReader(),
            connection,
            transaction: new FakeDbTransaction(connection));
        var adapter = CreateAdapter(command, 1);

        var act = () => adapter.ReadPageAsync(
            CreateRequest(profile, maxRows: 1),
            CancellationToken.None);

        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*attached transaction*");
        command.ExecuteReaderAsyncCallCount.Should().Be(0);
        connection.BeginTransactionCallCount.Should().Be(0);
    }

    [Fact]
    public async Task Command_exception_propagates_without_retry_or_translation()
    {
        var profile = CreateProfile();
        var expected = new DeliberateAdoException("execute failed");
        var command = new FakeDbCommand(CreateOrdinaryReader(), executeException: expected);
        var adapter = CreateAdapter(command, 1);

        var act = () => adapter.ReadPageAsync(
            CreateRequest(profile, maxRows: 1),
            CancellationToken.None);

        var assertion = await act.Should().ThrowAsync<DeliberateAdoException>();
        assertion.Which.Should().BeSameAs(expected);
        command.ExecuteReaderAsyncCallCount.Should().Be(1);
    }

    [Fact]
    public async Task Command_cancellation_propagates_without_retry_or_translation()
    {
        var profile = CreateProfile();
        using var cancellationSource = new CancellationTokenSource();
        var expected = new OperationCanceledException(cancellationSource.Token);
        var command = new FakeDbCommand(CreateOrdinaryReader(), executeException: expected);
        var adapter = CreateAdapter(command, 1);

        var act = () => adapter.ReadPageAsync(
            CreateRequest(profile, maxRows: 1),
            cancellationSource.Token);

        var assertion = await act.Should().ThrowAsync<OperationCanceledException>();
        assertion.Which.Should().BeSameAs(expected);
        command.ExecuteReaderAsyncCallCount.Should().Be(1);
        command.LastCancellationToken.Should().Be(cancellationSource.Token);
    }

    [Fact]
    public async Task Reader_exception_propagates_and_reader_is_disposed_without_retry()
    {
        var profile = CreateProfile();
        var expected = new DeliberateAdoException("read failed");
        var reader = CreateOrdinaryReader();
        reader.ReadException = expected;
        var command = new FakeDbCommand(reader);
        var adapter = CreateAdapter(command, 1);

        var act = () => adapter.ReadPageAsync(
            CreateRequest(profile, maxRows: 1),
            CancellationToken.None);

        var assertion = await act.Should().ThrowAsync<DeliberateAdoException>();
        assertion.Which.Should().BeSameAs(expected);
        command.ExecuteReaderAsyncCallCount.Should().Be(1);
        reader.ReadAsyncCallCount.Should().Be(1);
        reader.DisposeAsyncCallCount.Should().Be(1);
    }

    [Fact]
    public async Task Reader_cancellation_propagates_and_reader_is_disposed_without_retry()
    {
        var profile = CreateProfile();
        using var cancellationSource = new CancellationTokenSource();
        var expected = new OperationCanceledException(cancellationSource.Token);
        var reader = CreateOrdinaryReader();
        reader.ReadException = expected;
        var command = new FakeDbCommand(reader);
        var adapter = CreateAdapter(command, 1);

        var act = () => adapter.ReadPageAsync(
            CreateRequest(profile, maxRows: 1),
            cancellationSource.Token);

        var assertion = await act.Should().ThrowAsync<OperationCanceledException>();
        assertion.Which.Should().BeSameAs(expected);
        command.ExecuteReaderAsyncCallCount.Should().Be(1);
        reader.ReadAsyncCallCount.Should().Be(1);
        reader.DisposeAsyncCallCount.Should().Be(1);
    }

    [Fact]
    public async Task Null_reader_fails_closed_after_the_single_command_execution()
    {
        var profile = CreateProfile();
        var command = new FakeDbCommand(null);
        var adapter = CreateAdapter(command, 1);

        var act = () => adapter.ReadPageAsync(
            CreateRequest(profile, maxRows: 1),
            CancellationToken.None);

        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*no data reader*");
        command.ExecuteReaderAsyncCallCount.Should().Be(1);
    }

    [Fact]
    public async Task Protected_executor_rejects_profile_drift_before_ado_execution()
    {
        var configuredProfile = CreateProfile();
        var requestProfile = CreateProfile("different-source");
        var command = new FakeDbCommand(CreateOrdinaryReader());
        var executor = new ReadOnlyCountySourceExecutor(
            CreateAdapter(command, 1),
            configuredProfile,
            1,
            1);

        var act = () => executor.ExecuteAsync(
            CreateRequest(requestProfile, maxRows: 1),
            CancellationToken.None);

        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*configured provenance*");
        command.ExecuteReaderAsyncCallCount.Should().Be(0);
    }

    private static ReadOnlyDbCommandAdapter CreateAdapter(
        FakeDbCommand command,
        int fieldLimit)
    {
        return new ReadOnlyDbCommandAdapter(
            command,
            fieldLimit,
            new FixedTimeProvider(ObservedAtUtc));
    }

    private static ReadOnlyCountySourceProfile CreateProfile(
        string sourceIdentity = "fake-ado-source")
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
        int maxRows,
        IReadOnlyDictionary<string, object?>? parameters = null)
    {
        return new ReadOnlySourceReadRequest(
            profile,
            ReadOnlySourceCommand.RequireRead(
                "SELECT parcel_id FROM parcels WHERE county_id = @countyId"),
            parameters ?? new Dictionary<string, object?> { ["countyId"] = profile.CountyId },
            maxRows,
            checkpoint: "checkpoint-1");
    }

    private static IReadOnlyDictionary<string, object?> CreateParameters(int count)
    {
        return Enumerable.Range(0, count).ToDictionary(
            index => $"parameter{index:D3}",
            index => (object?)index,
            StringComparer.Ordinal);
    }

    private static FakeDbDataReader CreateOrdinaryReader()
    {
        return new FakeDbDataReader(
            new[] { "parcel_id" },
            new[] { new object?[] { "P-1" } });
    }

    private sealed class FixedTimeProvider : TimeProvider
    {
        private readonly DateTimeOffset _value;

        public FixedTimeProvider(DateTimeOffset value)
        {
            _value = value;
        }

        public override DateTimeOffset GetUtcNow() => _value;
    }

    private sealed class FakeDbCommand : DbCommand
    {
        private readonly FakeDbConnection? _connection;
        private readonly Exception? _executeException;
        private readonly TaskCompletionSource<DbDataReader>? _heldReader;
        private readonly FakeDbParameterCollection _parameters = new();
        private readonly DbDataReader? _reader;
        private readonly DbTransaction? _transaction;
        private readonly TaskCompletionSource<bool> _executionEntered =
            new(TaskCreationOptions.RunContinuationsAsynchronously);

        public FakeDbCommand(
            DbDataReader? reader,
            FakeDbConnection? connection = null,
            DbTransaction? transaction = null,
            Exception? executeException = null,
            bool holdExecution = false)
        {
            _reader = reader;
            _connection = connection;
            _transaction = transaction;
            _executeException = executeException;
            if (holdExecution)
            {
                _heldReader = new TaskCompletionSource<DbDataReader>(
                    TaskCreationOptions.RunContinuationsAsynchronously);
            }
        }

        [AllowNull]
        public override string CommandText { get; set; } = string.Empty;

        public override int CommandTimeout { get; set; }

        public override CommandType CommandType { get; set; }

        public override bool DesignTimeVisible { get; set; }

        public override UpdateRowSource UpdatedRowSource { get; set; }

        protected override DbConnection? DbConnection
        {
            get => _connection;
            set => throw new NotSupportedException();
        }

        protected override DbParameterCollection DbParameterCollection => _parameters;

        protected override DbTransaction? DbTransaction
        {
            get => _transaction;
            set => throw new NotSupportedException();
        }

        public int CancelCallCount { get; private set; }

        public int CreateParameterCallCount { get; private set; }

        public int ParameterAddCallCount => _parameters.AddCallCount;

        public int DisposeCallCount { get; private set; }

        public int ExecuteNonQueryCallCount { get; private set; }

        public int ExecuteReaderAsyncCallCount { get; private set; }

        public int ExecuteScalarCallCount { get; private set; }

        public int PrepareCallCount { get; private set; }

        public CommandBehavior LastCommandBehavior { get; private set; }

        public CancellationToken LastCancellationToken { get; private set; }

        public Task ExecutionEntered => _executionEntered.Task;

        public override void Cancel()
        {
            CancelCallCount++;
            throw new InvalidOperationException("Cancel is forbidden in this fake.");
        }

        public override int ExecuteNonQuery()
        {
            ExecuteNonQueryCallCount++;
            throw new InvalidOperationException("Nonquery is forbidden in this fake.");
        }

        public override object? ExecuteScalar()
        {
            ExecuteScalarCallCount++;
            throw new InvalidOperationException("Scalar is forbidden in this fake.");
        }

        public override void Prepare()
        {
            PrepareCallCount++;
            throw new InvalidOperationException("Prepare is forbidden in this fake.");
        }

        public void ReleaseExecution()
        {
            _heldReader!.SetResult(_reader!);
        }

        protected override DbParameter CreateDbParameter()
        {
            CreateParameterCallCount++;
            return new FakeDbParameter();
        }

        protected override DbDataReader ExecuteDbDataReader(CommandBehavior behavior)
        {
            throw new InvalidOperationException("Synchronous reader execution is forbidden.");
        }

        protected override Task<DbDataReader> ExecuteDbDataReaderAsync(
            CommandBehavior behavior,
            CancellationToken cancellationToken)
        {
            ExecuteReaderAsyncCallCount++;
            LastCommandBehavior = behavior;
            LastCancellationToken = cancellationToken;
            _executionEntered.TrySetResult(true);

            if (_executeException is not null)
            {
                return Task.FromException<DbDataReader>(_executeException);
            }

            return _heldReader?.Task ?? Task.FromResult(_reader!);
        }

        protected override void Dispose(bool disposing)
        {
            DisposeCallCount++;
            base.Dispose(disposing);
        }
    }

    private sealed class FakeDbParameter : DbParameter
    {
        public override DbType DbType { get; set; }

        public override ParameterDirection Direction { get; set; }

        public override bool IsNullable { get; set; }

        [AllowNull]
        public override string ParameterName { get; set; } = string.Empty;

        [AllowNull]
        public override string SourceColumn { get; set; } = string.Empty;

        public override DataRowVersion SourceVersion { get; set; }

        public override object? Value { get; set; }

        public override bool SourceColumnNullMapping { get; set; }

        public override int Size { get; set; }

        public override void ResetDbType()
        {
        }
    }

    private sealed class FakeDbParameterCollection : DbParameterCollection
    {
        private readonly List<DbParameter> _parameters = new();

        public int AddCallCount { get; private set; }

        public override int Count => _parameters.Count;

        public override object SyncRoot => ((ICollection)_parameters).SyncRoot;

        public override int Add(object value)
        {
            AddCallCount++;
            _parameters.Add((DbParameter)value);
            return _parameters.Count - 1;
        }

        public override void AddRange(Array values)
        {
            foreach (var value in values)
            {
                Add(value!);
            }
        }

        public override void Clear() => _parameters.Clear();

        public override bool Contains(object value) => _parameters.Contains((DbParameter)value);

        public override bool Contains(string value) => IndexOf(value) >= 0;

        public override void CopyTo(Array array, int index) =>
            ((ICollection)_parameters).CopyTo(array, index);

        public override IEnumerator GetEnumerator() => _parameters.GetEnumerator();

        public override int IndexOf(object value) => _parameters.IndexOf((DbParameter)value);

        public override int IndexOf(string parameterName) => _parameters.FindIndex(parameter =>
            string.Equals(parameter.ParameterName, parameterName, StringComparison.Ordinal));

        public override void Insert(int index, object value) =>
            _parameters.Insert(index, (DbParameter)value);

        public override void Remove(object value) => _parameters.Remove((DbParameter)value);

        public override void RemoveAt(int index) => _parameters.RemoveAt(index);

        public override void RemoveAt(string parameterName)
        {
            var index = IndexOf(parameterName);
            if (index >= 0)
            {
                RemoveAt(index);
            }
        }

        protected override DbParameter GetParameter(int index) => _parameters[index];

        protected override DbParameter GetParameter(string parameterName) =>
            _parameters[IndexOf(parameterName)];

        protected override void SetParameter(int index, DbParameter value) =>
            _parameters[index] = value;

        protected override void SetParameter(string parameterName, DbParameter value)
        {
            var index = IndexOf(parameterName);
            if (index < 0)
            {
                _parameters.Add(value);
            }
            else
            {
                _parameters[index] = value;
            }
        }
    }

    private sealed class FakeDbDataReader : DbDataReader
    {
        private readonly bool _alwaysReturnsRow;
        private readonly int _declaredFieldCount;
        private readonly string[] _names;
        private readonly object?[][] _rows;
        private int _rowIndex = -1;

        public FakeDbDataReader(
            string[] names,
            object?[][] rows,
            bool alwaysReturnsRow = false,
            int? declaredFieldCount = null)
        {
            _names = names;
            _rows = rows;
            _alwaysReturnsRow = alwaysReturnsRow;
            _declaredFieldCount = declaredFieldCount ?? names.Length;
        }

        public Exception? ReadException { get; set; }

        public int DisposeAsyncCallCount { get; private set; }

        public int GetNameCallCount { get; private set; }

        public int GetValueCallCount { get; private set; }

        public int NextResultCallCount { get; private set; }

        public int ReadAsyncCallCount { get; private set; }

        public override int Depth => 0;

        public override int FieldCount => _declaredFieldCount;

        public override bool HasRows => _rows.Length > 0 || _alwaysReturnsRow;

        public override bool IsClosed => false;

        public override int RecordsAffected => -1;

        public override object this[int ordinal] => GetValue(ordinal)!;

        public override object this[string name] => GetValue(GetOrdinal(name))!;

        public override ValueTask DisposeAsync()
        {
            DisposeAsyncCallCount++;
            return ValueTask.CompletedTask;
        }

        public override bool GetBoolean(int ordinal) => (bool)GetValue(ordinal);

        public override byte GetByte(int ordinal) => (byte)GetValue(ordinal);

        public override long GetBytes(
            int ordinal,
            long dataOffset,
            byte[]? buffer,
            int bufferOffset,
            int length) => throw new NotSupportedException();

        public override char GetChar(int ordinal) => (char)GetValue(ordinal);

        public override long GetChars(
            int ordinal,
            long dataOffset,
            char[]? buffer,
            int bufferOffset,
            int length) => throw new NotSupportedException();

        public override string GetDataTypeName(int ordinal) => GetFieldType(ordinal).Name;

        public override DateTime GetDateTime(int ordinal) => (DateTime)GetValue(ordinal);

        public override decimal GetDecimal(int ordinal) => (decimal)GetValue(ordinal);

        public override double GetDouble(int ordinal) => (double)GetValue(ordinal);

        public override Type GetFieldType(int ordinal) =>
            GetValue(ordinal)?.GetType() ?? typeof(DBNull);

        public override float GetFloat(int ordinal) => (float)GetValue(ordinal);

        public override Guid GetGuid(int ordinal) => (Guid)GetValue(ordinal);

        public override short GetInt16(int ordinal) => (short)GetValue(ordinal);

        public override int GetInt32(int ordinal) => (int)GetValue(ordinal);

        public override long GetInt64(int ordinal) => (long)GetValue(ordinal);

        public override string GetName(int ordinal)
        {
            GetNameCallCount++;
            return _names[ordinal];
        }

        public override int GetOrdinal(string name) => Array.IndexOf(_names, name);

        public override string GetString(int ordinal) => (string)GetValue(ordinal);

        public override object GetValue(int ordinal)
        {
            GetValueCallCount++;
            var rowIndex = _alwaysReturnsRow ? 0 : _rowIndex;
            return _rows[rowIndex][ordinal]!;
        }

        public override int GetValues(object[] values)
        {
            var count = Math.Min(values.Length, FieldCount);
            for (var index = 0; index < count; index++)
            {
                values[index] = GetValue(index);
            }

            return count;
        }

        public override bool IsDBNull(int ordinal) => ReferenceEquals(GetValue(ordinal), DBNull.Value);

        public override bool NextResult()
        {
            NextResultCallCount++;
            return false;
        }

        public override bool Read() => throw new InvalidOperationException("Use ReadAsync.");

        public override Task<bool> ReadAsync(CancellationToken cancellationToken)
        {
            ReadAsyncCallCount++;
            if (ReadException is not null)
            {
                return Task.FromException<bool>(ReadException);
            }

            _rowIndex++;
            return Task.FromResult(_alwaysReturnsRow || _rowIndex < _rows.Length);
        }

        public override IEnumerator GetEnumerator() => _rows.GetEnumerator();
    }

    private sealed class FakeDbConnection : DbConnection
    {
        [AllowNull]
        public override string ConnectionString { get; set; } = "fake-only";

        public override string Database => "fake";

        public override string DataSource => "fake";

        public override string ServerVersion => "fake";

        public override ConnectionState State => ConnectionState.Closed;

        public int BeginTransactionCallCount { get; private set; }

        public int CloseCallCount { get; private set; }

        public int CreateCommandCallCount { get; private set; }

        public int OpenCallCount { get; private set; }

        public override void ChangeDatabase(string databaseName) =>
            throw new InvalidOperationException("ChangeDatabase is forbidden.");

        public override void Close()
        {
            CloseCallCount++;
            throw new InvalidOperationException("Close is forbidden in this fake.");
        }

        public override void Open()
        {
            OpenCallCount++;
            throw new InvalidOperationException("Open is forbidden in this fake.");
        }

        protected override DbTransaction BeginDbTransaction(IsolationLevel isolationLevel)
        {
            BeginTransactionCallCount++;
            throw new InvalidOperationException("Transactions are forbidden in this fake.");
        }

        protected override DbCommand CreateDbCommand()
        {
            CreateCommandCallCount++;
            throw new InvalidOperationException("Command creation is forbidden in this fake.");
        }
    }

    private sealed class FakeDbTransaction : DbTransaction
    {
        private readonly DbConnection _connection;

        public FakeDbTransaction(DbConnection connection)
        {
            _connection = connection;
        }

        public override IsolationLevel IsolationLevel => IsolationLevel.ReadCommitted;

        protected override DbConnection DbConnection => _connection;

        public override void Commit() => throw new InvalidOperationException("Commit is forbidden.");

        public override void Rollback() => throw new InvalidOperationException("Rollback is forbidden.");
    }

    private sealed class DeliberateAdoException : Exception
    {
        public DeliberateAdoException(string message)
            : base(message)
        {
        }
    }
}
