using System;
using System.Data;
using System.Data.Common;
using System.Threading;
using System.Threading.Tasks;
using TerraFusion.Core.Sync.Profiles;

namespace TerraFusion.Core.Sync.Execution;

/// <summary>
/// Single-use composition over one caller-owned, already-open fake <see cref="DbConnection"/>.
/// The session creates and owns exactly one command but never opens, closes, disposes, discovers,
/// or reconfigures the supplied connection. This contract is not authorized for live use.
/// </summary>
public sealed class ReadOnlyDbConnectionSession
{
    public const string ContractId = "wal.external-readonly.db-connection-session.v1";

    private static readonly object ExecutionDispatched = new();

    private readonly DbConnection _connection;
    private readonly int _resultFieldLimit;
    private readonly ReadOnlyCountySourceProfile _profile;
    private readonly ReadOnlyCountySourceExecutionProvenance _provenance;
    private readonly int _resultRowLimit;
    private readonly TimeProvider _timeProvider;
    private object? _executionOwner;

    public ReadOnlyDbConnectionSession(
        DbConnection connection,
        ReadOnlyCountySourceProfile profile,
        int resultRowLimit,
        int resultFieldLimit,
        TimeProvider timeProvider)
    {
        ArgumentNullException.ThrowIfNull(connection);
        ArgumentNullException.ThrowIfNull(profile);
        ArgumentNullException.ThrowIfNull(timeProvider);

        if (resultRowLimit is < 1 or > ReadOnlySourceReadRequest.MaximumRows)
        {
            throw new ArgumentOutOfRangeException(
                nameof(resultRowLimit),
                $"Result row limit must be between 1 and {ReadOnlySourceReadRequest.MaximumRows} rows.");
        }

        if (resultFieldLimit is < 1 or > ReadOnlyCountySourceExecutor.MaximumFieldsPerRow)
        {
            throw new ArgumentOutOfRangeException(
                nameof(resultFieldLimit),
                $"Result field limit must be between 1 and {ReadOnlyCountySourceExecutor.MaximumFieldsPerRow} fields per row.");
        }

        RequireExactlyOpen(connection);

        _connection = connection;
        _profile = profile;
        _provenance = ReadOnlyCountySourceExecutionProvenance.From(profile);
        _resultRowLimit = resultRowLimit;
        _resultFieldLimit = resultFieldLimit;
        _timeProvider = timeProvider;
    }

    /// <summary>
    /// Creates, executes through, and disposes one command. Pre-dispatch cancellation, connection
    /// state drift, profile drift, and request-bound failure do not consume the session. A
    /// cancellation callback and the final dispatch transition compete on the same atomic state;
    /// once dispatch wins that transition, every outcome consumes it and no retry is available.
    /// </summary>
    public async Task<ReadOnlyCountySourceExecutionResult> ExecuteAsync(
        ReadOnlySourceReadRequest request,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(request);
        cancellationToken.ThrowIfCancellationRequested();
        RequireExactlyOpen(_connection);

        if (!_provenance.Matches(request.Profile))
        {
            throw new InvalidOperationException(
                "The request source profile does not match the session's configured provenance.");
        }

        if (request.MaxRows > _resultRowLimit)
        {
            throw new InvalidOperationException(
                "The request row bound exceeds the session's configured result row limit.");
        }

        var claim = new DispatchClaim(this);
        if (Interlocked.CompareExchange(ref _executionOwner, claim, null) is not null)
        {
            throw new InvalidOperationException("The supplied connection session is single-use.");
        }

        CancellationTokenRegistration cancellationRegistration;
        try
        {
            cancellationRegistration = cancellationToken.UnsafeRegister(
                static state =>
                {
                    var ownedClaim = (DispatchClaim)state!;
                    ownedClaim.Session.ReleaseClaimForCancellation(ownedClaim);
                },
                claim);
        }
        catch
        {
            ReleaseClaimForCancellation(claim);
            throw;
        }

        using (cancellationRegistration)
        {
            if (cancellationToken.IsCancellationRequested)
            {
                ReleaseClaimForCancellation(claim);
                cancellationToken.ThrowIfCancellationRequested();
            }

            if (!TryFinalizeDispatch(claim))
            {
                cancellationToken.ThrowIfCancellationRequested();
                throw new InvalidOperationException("The dispatch claim could not be finalized.");
            }
        }

        var command = _connection.CreateCommand();
        if (command is null)
        {
            throw new InvalidOperationException("The supplied connection returned no command.");
        }

        await using var ownedCommand = command;

        if (!ReferenceEquals(command.Connection, _connection))
        {
            throw new InvalidOperationException(
                "The created command is not bound to the supplied connection.");
        }

        var adapter = new ReadOnlyDbCommandAdapter(
            command,
            _resultFieldLimit,
            _timeProvider);
        var executor = new ReadOnlyCountySourceExecutor(
            adapter,
            _profile,
            _resultRowLimit,
            _resultFieldLimit);

        return await executor
            .ExecuteAsync(request, cancellationToken)
            .ConfigureAwait(false);
    }

    private static void RequireExactlyOpen(DbConnection connection)
    {
        if (connection.State != ConnectionState.Open)
        {
            throw new InvalidOperationException(
                "The supplied connection must already be exactly open before session execution.");
        }
    }

    private void ReleaseClaimForCancellation(DispatchClaim claim)
    {
        Interlocked.CompareExchange(
            ref _executionOwner,
            null,
            claim);
    }

    private bool TryFinalizeDispatch(DispatchClaim claim)
    {
        return ReferenceEquals(
            Interlocked.CompareExchange(
                ref _executionOwner,
                ExecutionDispatched,
                claim),
            claim);
    }

    private sealed class DispatchClaim
    {
        public DispatchClaim(ReadOnlyDbConnectionSession session)
        {
            Session = session;
        }

        public ReadOnlyDbConnectionSession Session { get; }
    }
}
