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

public sealed class ReadOnlyDbConnectionSessionTests
{
    private static readonly DateTimeOffset ObservedAtUtc =
        new(2026, 8, 28, 12, 30, 0, TimeSpan.Zero);

    [Fact]
    public void Session_is_sealed_and_exposes_only_one_execution_operation()
    {
        typeof(ReadOnlyDbConnectionSession).IsSealed.Should().BeTrue();
        ReadOnlyDbConnectionSession.ContractId.Should()
            .Be("wal.external-readonly.db-connection-session.v1");

        var methods = typeof(ReadOnlyDbConnectionSession).GetMethods(
            BindingFlags.Public | BindingFlags.Instance | BindingFlags.DeclaredOnly);
        methods.Should().ContainSingle();
        methods[0].Name.Should().Be(nameof(ReadOnlyDbConnectionSession.ExecuteAsync));
        methods[0].ReturnType.Should().Be(typeof(Task<ReadOnlyCountySourceExecutionResult>));
        methods[0].GetParameters().Select(parameter => parameter.ParameterType).Should().Equal(
            typeof(ReadOnlySourceReadRequest),
            typeof(CancellationToken));
    }

    [Fact]
    public void Constructor_rejects_null_dependencies()
    {
        var profile = CreateProfile();
        var connection = CreateConnection(CreateOrdinaryReader());

        var nullConnection = () => new ReadOnlyDbConnectionSession(
            null!, profile, 1, 1, new FixedTimeProvider(ObservedAtUtc));
        var nullProfile = () => new ReadOnlyDbConnectionSession(
            connection, null!, 1, 1, new FixedTimeProvider(ObservedAtUtc));
        var nullTimeProvider = () => new ReadOnlyDbConnectionSession(
            connection, profile, 1, 1, null!);

        nullConnection.Should().Throw<ArgumentNullException>();
        nullProfile.Should().Throw<ArgumentNullException>();
        nullTimeProvider.Should().Throw<ArgumentNullException>();
    }

    [Theory]
    [InlineData(0, 1)]
    [InlineData(-1, 1)]
    [InlineData(ReadOnlySourceReadRequest.MaximumRows + 1, 1)]
    [InlineData(1, 0)]
    [InlineData(1, -1)]
    [InlineData(1, ReadOnlyCountySourceExecutor.MaximumFieldsPerRow + 1)]
    public void Constructor_rejects_invalid_bounds(int rowLimit, int fieldLimit)
    {
        var act = () => new ReadOnlyDbConnectionSession(
            CreateConnection(CreateOrdinaryReader()),
            CreateProfile(),
            rowLimit,
            fieldLimit,
            new FixedTimeProvider(ObservedAtUtc));

        act.Should().Throw<ArgumentOutOfRangeException>();
    }

    [Theory]
    [InlineData(ConnectionState.Closed)]
    [InlineData(ConnectionState.Broken)]
    [InlineData(ConnectionState.Connecting)]
    [InlineData(ConnectionState.Executing)]
    [InlineData(ConnectionState.Fetching)]
    public void Constructor_requires_an_exactly_open_connection(ConnectionState state)
    {
        var connection = CreateConnection(CreateOrdinaryReader());
        connection.StateValue = state;

        var act = () => CreateSession(connection, CreateProfile(), 1, 1);

        act.Should().Throw<InvalidOperationException>().WithMessage("*exactly open*");
        connection.CreateCommandCallCount.Should().Be(0);
    }

    [Fact]
    public async Task Session_composes_one_profile_bound_read_and_owns_only_the_created_command()
    {
        var profile = CreateProfile();
        var reader = new FakeDbDataReader(
            new[] { "parcel_id", "market_value" },
            new[] { new object?[] { "P-100", 250_000m } });
        var connection = CreateConnection(reader);
        var session = CreateSession(connection, profile, rowLimit: 2, fieldLimit: 2);
        var request = CreateRequest(profile, maxRows: 2);

        var result = await session.ExecuteAsync(request, CancellationToken.None);

        connection.CreateCommandCallCount.Should().Be(1);
        connection.LastCommand.Should().NotBeNull();
        var command = connection.LastCommand!;
        command.Connection.Should().BeSameAs(connection);
        command.CommandType.Should().Be(CommandType.Text);
        command.CommandText.Should().Be(request.Command.Text);
        command.UpdatedRowSource.Should().Be(UpdateRowSource.None);
        command.Parameters.Cast<DbParameter>().Select(parameter => parameter.ParameterName)
            .Should().Equal("countyId");
        command.CreateParameterCallCount.Should().Be(1);
        command.ExecuteReaderAsyncCallCount.Should().Be(1);
        command.LastCommandBehavior.Should()
            .Be(CommandBehavior.SingleResult | CommandBehavior.SequentialAccess);
        command.DisposeAsyncCallCount.Should().Be(1);
        command.DisposeCallCount.Should().Be(0);
        reader.DisposeAsyncCallCount.Should().Be(1);
        reader.ReadAsyncCallCount.Should().Be(2);
        connection.OpenCallCount.Should().Be(0);
        connection.CloseCallCount.Should().Be(0);
        connection.DisposeCallCount.Should().Be(0);
        connection.BeginTransactionCallCount.Should().Be(0);
        connection.ChangeDatabaseCallCount.Should().Be(0);
        connection.ConnectionStringGetCallCount.Should().Be(0);
        command.ExecuteNonQueryCallCount.Should().Be(0);
        command.ExecuteScalarCallCount.Should().Be(0);
        command.PrepareCallCount.Should().Be(0);
        command.CancelCallCount.Should().Be(0);
        reader.NextResultCallCount.Should().Be(0);
        result.Rows.Should().ContainSingle();
        result.Rows[0]["parcel_id"].Should().Be("P-100");
        result.Rows[0]["market_value"].Should().Be(250_000m);
        result.Provenance.CountyId.Should().Be(profile.CountyId);
        result.CommandText.Should().Be(request.Command.Text);
        result.ObservedAtUtc.Should().Be(ObservedAtUtc);
        result.NextCheckpoint.Should().BeNull();
    }

    [Fact]
    public async Task Pre_dispatch_failures_do_not_create_a_command_or_consume_the_session()
    {
        var profile = CreateProfile();
        var connection = CreateConnection(CreateOrdinaryReader());
        var session = CreateSession(connection, profile, rowLimit: 1, fieldLimit: 1);
        using var cancellationSource = new CancellationTokenSource();
        cancellationSource.Cancel();

        var cancelled = () => session.ExecuteAsync(
            CreateRequest(profile, 1), cancellationSource.Token);
        await cancelled.Should().ThrowAsync<OperationCanceledException>();

        connection.StateValue = ConnectionState.Closed;
        var closed = () => session.ExecuteAsync(CreateRequest(profile, 1), CancellationToken.None);
        await closed.Should().ThrowAsync<InvalidOperationException>().WithMessage("*exactly open*");
        connection.StateValue = ConnectionState.Open;

        var drifted = () => session.ExecuteAsync(
            CreateRequest(CreateProfile("different-source"), 1),
            CancellationToken.None);
        await drifted.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*configured provenance*");

        var aboveBound = () => session.ExecuteAsync(
            CreateRequest(profile, 2), CancellationToken.None);
        await aboveBound.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*row bound*");

        connection.CreateCommandCallCount.Should().Be(0);
        await session.ExecuteAsync(CreateRequest(profile, 1), CancellationToken.None);
        connection.CreateCommandCallCount.Should().Be(1);
    }

    [Fact]
    public async Task Cancellation_during_state_validation_does_not_dispatch_or_consume_the_session()
    {
        var profile = CreateProfile();
        var connection = CreateConnection(CreateOrdinaryReader());
        var session = CreateSession(connection, profile, rowLimit: 1, fieldLimit: 1);
        using var cancellationSource = new CancellationTokenSource();
        connection.StateObserved = cancellationSource.Cancel;

        var cancelled = () => session.ExecuteAsync(
            CreateRequest(profile, 1), cancellationSource.Token);

        await cancelled.Should().ThrowAsync<OperationCanceledException>();
        connection.CreateCommandCallCount.Should().Be(0);

        connection.StateObserved = null;
        await session.ExecuteAsync(CreateRequest(profile, 1), CancellationToken.None);
        connection.CreateCommandCallCount.Should().Be(1);
    }

    [Fact]
    public void Dispatch_claim_identity_blocks_foreign_release_and_stale_aba_finalization()
    {
        var session = CreateSession(
            CreateConnection(CreateOrdinaryReader()),
            CreateProfile(),
            rowLimit: 1,
            fieldLimit: 1);
        var sessionType = typeof(ReadOnlyDbConnectionSession);
        var claimType = sessionType.GetNestedType("DispatchClaim", BindingFlags.NonPublic)!;
        var claimConstructor = claimType.GetConstructor(
            BindingFlags.Instance | BindingFlags.Public | BindingFlags.NonPublic,
            binder: null,
            types: new[] { sessionType },
            modifiers: null)!;
        var ownerField = sessionType.GetField(
            "_executionOwner",
            BindingFlags.Instance | BindingFlags.NonPublic)!;
        var release = sessionType.GetMethod(
            "ReleaseClaimForCancellation",
            BindingFlags.Instance | BindingFlags.NonPublic)!;
        var finalize = sessionType.GetMethod(
            "TryFinalizeDispatch",
            BindingFlags.Instance | BindingFlags.NonPublic)!;
        var claimA = claimConstructor.Invoke(new object[] { session });
        var claimB = claimConstructor.Invoke(new object[] { session });

        ownerField.SetValue(session, claimA);
        release.Invoke(session, new[] { claimB });
        ownerField.GetValue(session).Should().BeSameAs(claimA);
        ((bool)finalize.Invoke(session, new[] { claimB })!).Should().BeFalse();
        ownerField.GetValue(session).Should().BeSameAs(claimA);

        release.Invoke(session, new[] { claimA });
        ownerField.GetValue(session).Should().BeNull();
        ownerField.SetValue(session, claimB);
        ((bool)finalize.Invoke(session, new[] { claimA })!).Should().BeFalse();
        ownerField.GetValue(session).Should().BeSameAs(claimB);
        ((bool)finalize.Invoke(session, new[] { claimB })!).Should().BeTrue();
        ownerField.GetValue(session).Should().NotBeSameAs(claimB);
    }

    [Fact]
    public async Task Session_is_single_use_after_success()
    {
        var profile = CreateProfile();
        var connection = CreateConnection(CreateOrdinaryReader());
        var session = CreateSession(connection, profile, 1, 1);
        var request = CreateRequest(profile, 1);

        await session.ExecuteAsync(request, CancellationToken.None);
        var second = () => session.ExecuteAsync(request, CancellationToken.None);

        await second.Should().ThrowAsync<InvalidOperationException>().WithMessage("*single-use*");
        connection.CreateCommandCallCount.Should().Be(1);
    }

    [Fact]
    public async Task Concurrent_call_fails_while_the_only_command_execution_is_in_flight()
    {
        var profile = CreateProfile();
        var connection = new FakeDbConnection(
            owner => new FakeDbCommand(CreateOrdinaryReader(), owner, holdExecution: true));
        var session = CreateSession(connection, profile, 1, 1);
        var request = CreateRequest(profile, 1);

        var first = session.ExecuteAsync(request, CancellationToken.None);
        connection.LastCommand.Should().NotBeNull();
        var command = connection.LastCommand!;
        await command.ExecutionEntered;
        var second = () => session.ExecuteAsync(request, CancellationToken.None);

        await second.Should().ThrowAsync<InvalidOperationException>().WithMessage("*single-use*");
        connection.CreateCommandCallCount.Should().Be(1);
        command.ReleaseExecution();
        await first;
        command.ExecuteReaderAsyncCallCount.Should().Be(1);
        command.DisposeAsyncCallCount.Should().Be(1);
    }

    [Fact]
    public async Task Command_creation_exception_propagates_without_retry_and_consumes_session()
    {
        var profile = CreateProfile();
        var expected = new DeliberateAdoException("create failed");
        var connection = new FakeDbConnection(_ => null, createException: expected);
        var session = CreateSession(connection, profile, 1, 1);
        var request = CreateRequest(profile, 1);

        var first = () => session.ExecuteAsync(request, CancellationToken.None);
        var assertion = await first.Should().ThrowAsync<DeliberateAdoException>();
        assertion.Which.Should().BeSameAs(expected);

        var second = () => session.ExecuteAsync(request, CancellationToken.None);
        await second.Should().ThrowAsync<InvalidOperationException>().WithMessage("*single-use*");
        connection.CreateCommandCallCount.Should().Be(1);
    }

    [Fact]
    public async Task Null_command_fails_closed_and_consumes_session()
    {
        var profile = CreateProfile();
        var connection = new FakeDbConnection(_ => null);
        var session = CreateSession(connection, profile, 1, 1);
        var request = CreateRequest(profile, 1);

        var first = () => session.ExecuteAsync(request, CancellationToken.None);
        await first.Should().ThrowAsync<InvalidOperationException>().WithMessage("*no command*");

        var second = () => session.ExecuteAsync(request, CancellationToken.None);
        await second.Should().ThrowAsync<InvalidOperationException>().WithMessage("*single-use*");
        connection.CreateCommandCallCount.Should().Be(1);
    }

    [Fact]
    public async Task Command_bound_to_another_connection_is_disposed_and_never_executed()
    {
        var profile = CreateProfile();
        var otherConnection = CreateConnection(CreateOrdinaryReader());
        FakeDbCommand? wrongCommand = null;
        var connection = new FakeDbConnection(_ =>
        {
            wrongCommand = new FakeDbCommand(CreateOrdinaryReader(), otherConnection);
            return wrongCommand;
        });
        var session = CreateSession(connection, profile, 1, 1);

        var act = () => session.ExecuteAsync(
            CreateRequest(profile, 1), CancellationToken.None);

        await act.Should().ThrowAsync<InvalidOperationException>().WithMessage("*not bound*");
        wrongCommand.Should().NotBeNull();
        var rejectedCommand = wrongCommand!;
        rejectedCommand.ExecuteReaderAsyncCallCount.Should().Be(0);
        rejectedCommand.DisposeAsyncCallCount.Should().Be(1);
        connection.CreateCommandCallCount.Should().Be(1);
        connection.OpenCallCount.Should().Be(0);
        connection.CloseCallCount.Should().Be(0);
    }

    [Fact]
    public async Task Attached_transaction_fails_before_reader_execution_and_disposes_command()
    {
        var profile = CreateProfile();
        var connection = new FakeDbConnection(owner =>
        {
            var command = new FakeDbCommand(CreateOrdinaryReader(), owner);
            command.TransactionValue = new FakeDbTransaction(owner);
            return command;
        });
        var session = CreateSession(connection, profile, 1, 1);

        var act = () => session.ExecuteAsync(
            CreateRequest(profile, 1), CancellationToken.None);

        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*attached transaction*");
        var command = connection.LastCommand!;
        command.ExecuteReaderAsyncCallCount.Should().Be(0);
        command.DisposeAsyncCallCount.Should().Be(1);
        connection.BeginTransactionCallCount.Should().Be(0);
    }

    [Fact]
    public async Task Command_exception_propagates_and_command_is_disposed_without_retry()
    {
        var profile = CreateProfile();
        var expected = new DeliberateAdoException("execute failed");
        var connection = new FakeDbConnection(owner =>
            new FakeDbCommand(CreateOrdinaryReader(), owner, executeException: expected));
        var session = CreateSession(connection, profile, 1, 1);

        var act = () => session.ExecuteAsync(
            CreateRequest(profile, 1), CancellationToken.None);

        var assertion = await act.Should().ThrowAsync<DeliberateAdoException>();
        assertion.Which.Should().BeSameAs(expected);

        var second = () => session.ExecuteAsync(
            CreateRequest(profile, 1), CancellationToken.None);
        await second.Should().ThrowAsync<InvalidOperationException>().WithMessage("*single-use*");
        connection.CreateCommandCallCount.Should().Be(1);
        var command = connection.LastCommand!;
        command.ExecuteReaderAsyncCallCount.Should().Be(1);
        command.DisposeAsyncCallCount.Should().Be(1);
    }

    [Fact]
    public async Task Execution_cancellation_propagates_and_command_is_disposed_without_retry()
    {
        var profile = CreateProfile();
        using var cancellationSource = new CancellationTokenSource();
        var expected = new OperationCanceledException(cancellationSource.Token);
        var connection = new FakeDbConnection(owner =>
            new FakeDbCommand(CreateOrdinaryReader(), owner, executeException: expected));
        var session = CreateSession(connection, profile, 1, 1);

        var act = () => session.ExecuteAsync(
            CreateRequest(profile, 1), cancellationSource.Token);

        var assertion = await act.Should().ThrowAsync<OperationCanceledException>();
        assertion.Which.Should().BeSameAs(expected);
        connection.CreateCommandCallCount.Should().Be(1);
        var command = connection.LastCommand!;
        command.ExecuteReaderAsyncCallCount.Should().Be(1);
        command.LastCancellationToken.Should().Be(cancellationSource.Token);
        command.DisposeAsyncCallCount.Should().Be(1);
    }

    [Fact]
    public async Task Reader_failure_disposes_reader_and_command_without_retry()
    {
        var profile = CreateProfile();
        var expected = new DeliberateAdoException("read failed");
        var reader = CreateOrdinaryReader();
        reader.ReadException = expected;
        var connection = CreateConnection(reader);
        var session = CreateSession(connection, profile, 1, 1);

        var act = () => session.ExecuteAsync(
            CreateRequest(profile, 1), CancellationToken.None);

        var assertion = await act.Should().ThrowAsync<DeliberateAdoException>();
        assertion.Which.Should().BeSameAs(expected);
        connection.CreateCommandCallCount.Should().Be(1);
        var command = connection.LastCommand!;
        command.ExecuteReaderAsyncCallCount.Should().Be(1);
        reader.ReadAsyncCallCount.Should().Be(1);
        reader.DisposeAsyncCallCount.Should().Be(1);
        command.DisposeAsyncCallCount.Should().Be(1);
    }

    [Fact]
    public async Task Row_overflow_stops_after_one_sentinel_and_disposes_owned_resources()
    {
        var profile = CreateProfile();
        var reader = new FakeDbDataReader(
            new[] { "parcel_id" },
            new[] { new object?[] { "P-1" } },
            alwaysReturnsRow: true);
        var connection = CreateConnection(reader);
        var session = CreateSession(connection, profile, rowLimit: 2, fieldLimit: 1);

        var act = () => session.ExecuteAsync(
            CreateRequest(profile, 2), CancellationToken.None);

        await act.Should().ThrowAsync<InvalidOperationException>().WithMessage("*more rows*");
        reader.ReadAsyncCallCount.Should().Be(3);
        reader.GetValueCallCount.Should().Be(2);
        reader.DisposeAsyncCallCount.Should().Be(1);
        var command = connection.LastCommand!;
        command.DisposeAsyncCallCount.Should().Be(1);
        connection.CreateCommandCallCount.Should().Be(1);
    }

    private static ReadOnlyDbConnectionSession CreateSession(
        FakeDbConnection connection,
        ReadOnlyCountySourceProfile profile,
        int rowLimit,
        int fieldLimit)
    {
        return new ReadOnlyDbConnectionSession(
            connection,
            profile,
            rowLimit,
            fieldLimit,
            new FixedTimeProvider(ObservedAtUtc));
    }

    private static FakeDbConnection CreateConnection(FakeDbDataReader reader)
    {
        return new FakeDbConnection(owner => new FakeDbCommand(reader, owner));
    }

    private static ReadOnlyCountySourceProfile CreateProfile(
        string sourceIdentity = "fake-ado-open-session")
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

    private sealed class FakeDbConnection : DbConnection
    {
        private readonly Exception? _createException;
        private readonly Func<FakeDbConnection, FakeDbCommand?> _factory;
        private string _connectionString = "fake-only";

        public FakeDbConnection(
            Func<FakeDbConnection, FakeDbCommand?> factory,
            Exception? createException = null)
        {
            _factory = factory;
            _createException = createException;
        }

        [AllowNull]
        public override string ConnectionString
        {
            get
            {
                ConnectionStringGetCallCount++;
                return _connectionString;
            }
            set => _connectionString = value ?? string.Empty;
        }

        public override string Database => "fake";

        public override string DataSource => "fake";

        public override string ServerVersion => "fake";

        public override ConnectionState State
        {
            get
            {
                StateObserved?.Invoke();
                return StateValue;
            }
        }

        public ConnectionState StateValue { get; set; } = ConnectionState.Open;

        public Action? StateObserved { get; set; }

        public int BeginTransactionCallCount { get; private set; }

        public int ChangeDatabaseCallCount { get; private set; }

        public int CloseCallCount { get; private set; }

        public int ConnectionStringGetCallCount { get; private set; }

        public int CreateCommandCallCount { get; private set; }

        public int DisposeCallCount { get; private set; }

        public int OpenCallCount { get; private set; }

        public FakeDbCommand? LastCommand { get; private set; }

        public override void ChangeDatabase(string databaseName)
        {
            ChangeDatabaseCallCount++;
            throw new InvalidOperationException("ChangeDatabase is forbidden in this fake.");
        }

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
            if (_createException is not null)
            {
                throw _createException;
            }

            LastCommand = _factory(this);
            return LastCommand!;
        }

        protected override void Dispose(bool disposing)
        {
            DisposeCallCount++;
            base.Dispose(disposing);
        }
    }

    private sealed class FakeDbCommand : DbCommand
    {
        private readonly Exception? _executeException;
        private readonly TaskCompletionSource<DbDataReader>? _heldReader;
        private readonly FakeDbParameterCollection _parameters = new();
        private readonly DbDataReader _reader;
        private readonly TaskCompletionSource<bool> _executionEntered =
            new(TaskCreationOptions.RunContinuationsAsynchronously);

        public FakeDbCommand(
            DbDataReader reader,
            DbConnection connection,
            Exception? executeException = null,
            bool holdExecution = false)
        {
            _reader = reader;
            DbConnectionValue = connection;
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
            get => DbConnectionValue;
            set => throw new NotSupportedException();
        }

        protected override DbParameterCollection DbParameterCollection => _parameters;

        protected override DbTransaction? DbTransaction
        {
            get => TransactionValue;
            set => throw new NotSupportedException();
        }

        public DbConnection? DbConnectionValue { get; }

        public DbTransaction? TransactionValue { get; set; }

        public int CancelCallCount { get; private set; }

        public int CreateParameterCallCount { get; private set; }

        public int DisposeAsyncCallCount { get; private set; }

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

        public override ValueTask DisposeAsync()
        {
            DisposeAsyncCallCount++;
            return ValueTask.CompletedTask;
        }

        public void ReleaseExecution()
        {
            _heldReader!.SetResult(_reader);
        }

        protected override DbParameter CreateDbParameter()
        {
            CreateParameterCallCount++;
            return new FakeDbParameter();
        }

        protected override DbDataReader ExecuteDbDataReader(CommandBehavior behavior) =>
            throw new InvalidOperationException("Synchronous reader execution is forbidden.");

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

            return _heldReader?.Task ?? Task.FromResult(_reader);
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

        public override int Count => _parameters.Count;

        public override object SyncRoot => ((ICollection)_parameters).SyncRoot;

        public override int Add(object value)
        {
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
        private readonly string[] _names;
        private readonly object?[][] _rows;
        private int _rowIndex = -1;

        public FakeDbDataReader(
            string[] names,
            object?[][] rows,
            bool alwaysReturnsRow = false)
        {
            _names = names;
            _rows = rows;
            _alwaysReturnsRow = alwaysReturnsRow;
        }

        public Exception? ReadException { get; set; }

        public int DisposeAsyncCallCount { get; private set; }

        public int GetValueCallCount { get; private set; }

        public int NextResultCallCount { get; private set; }

        public int ReadAsyncCallCount { get; private set; }

        public override int Depth => 0;

        public override int FieldCount => _names.Length;

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

        public override string GetName(int ordinal) => _names[ordinal];

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

        public override bool IsDBNull(int ordinal) =>
            ReferenceEquals(GetValue(ordinal), DBNull.Value);

        public override bool NextResult()
        {
            NextResultCallCount++;
            return false;
        }

        public override bool Read() =>
            throw new InvalidOperationException("Use ReadAsync.");

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

    private sealed class FakeDbTransaction : DbTransaction
    {
        private readonly DbConnection _connection;

        public FakeDbTransaction(DbConnection connection)
        {
            _connection = connection;
        }

        public override IsolationLevel IsolationLevel => IsolationLevel.ReadCommitted;

        protected override DbConnection DbConnection => _connection;

        public override void Commit() =>
            throw new InvalidOperationException("Commit is forbidden.");

        public override void Rollback() =>
            throw new InvalidOperationException("Rollback is forbidden.");
    }

    private sealed class DeliberateAdoException : Exception
    {
        public DeliberateAdoException(string message)
            : base(message)
        {
        }
    }
}
