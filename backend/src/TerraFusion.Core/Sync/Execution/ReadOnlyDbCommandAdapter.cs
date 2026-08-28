using System;
using System.Collections.Generic;
using System.Collections.ObjectModel;
using System.Data;
using System.Data.Common;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using TerraFusion.Core.Sync.Profiles;

namespace TerraFusion.Core.Sync.Execution;

/// <summary>
/// Single-use adapter over one caller-owned, already-created fake <see cref="DbCommand"/>.
/// This contract never discovers, creates, opens, closes, or disposes a connection and is not
/// authorized for a live command or database.
/// </summary>
public sealed class ReadOnlyDbCommandAdapter : IReadOnlyCountySourceAdapter
{
    public const string ContractId = "wal.external-readonly.db-command-adapter.v1";

    private const int MaximumParameterValues = ReadOnlyCountySourceExecutor.MaximumFieldsPerRow;
    private readonly DbCommand _command;
    private readonly int _maximumFieldsPerRow;
    private readonly TimeProvider _timeProvider;
    private int _executionStarted;

    public ReadOnlyDbCommandAdapter(
        DbCommand command,
        int maximumFieldsPerRow,
        TimeProvider timeProvider)
    {
        ArgumentNullException.ThrowIfNull(command);
        ArgumentNullException.ThrowIfNull(timeProvider);

        if (maximumFieldsPerRow is < 1 or > ReadOnlyCountySourceExecutor.MaximumFieldsPerRow)
        {
            throw new ArgumentOutOfRangeException(
                nameof(maximumFieldsPerRow),
                $"Field limit must be between 1 and {ReadOnlyCountySourceExecutor.MaximumFieldsPerRow}.");
        }

        _command = command;
        _maximumFieldsPerRow = maximumFieldsPerRow;
        _timeProvider = timeProvider;
    }

    /// <summary>
    /// Projects one guarded request onto the supplied command and executes only its reader path.
    /// The adapter is consumed once dispatch begins, including when command or reader execution
    /// fails or is cancelled; no retry or fallback is available.
    /// </summary>
    public async Task<ReadOnlySourceReadPage> ReadPageAsync(
        ReadOnlySourceReadRequest request,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(request);
        cancellationToken.ThrowIfCancellationRequested();

        if (_command.Transaction is not null)
        {
            throw new InvalidOperationException(
                "A command with an attached transaction is not admitted by this read-only contract.");
        }

        if (Interlocked.CompareExchange(ref _executionStarted, 1, 0) != 0)
        {
            throw new InvalidOperationException("The supplied command adapter is single-use.");
        }

        if (request.Parameters.Count > MaximumParameterValues)
        {
            throw new InvalidOperationException(
                $"The request parameter collection exceeds the {MaximumParameterValues}-parameter limit.");
        }

        ProjectRequest(request);

        var reader = await _command
            .ExecuteReaderAsync(
                CommandBehavior.SingleResult | CommandBehavior.SequentialAccess,
                cancellationToken)
            .ConfigureAwait(false);

        if (reader is null)
        {
            throw new InvalidOperationException("The supplied command returned no data reader.");
        }

        await using (reader.ConfigureAwait(false))
        {
            var rows = await ReadBoundedRowsAsync(reader, request.MaxRows, cancellationToken)
                .ConfigureAwait(false);

            return new ReadOnlySourceReadPage(
                rows,
                NextCheckpoint: null,
                _timeProvider.GetUtcNow());
        }
    }

    private void ProjectRequest(ReadOnlySourceReadRequest request)
    {
        _command.CommandType = CommandType.Text;
        _command.CommandText = request.Command.Text;
        _command.UpdatedRowSource = UpdateRowSource.None;
        _command.Parameters.Clear();

        foreach (var pair in request.Parameters.OrderBy(pair => pair.Key, StringComparer.Ordinal))
        {
            if (string.IsNullOrWhiteSpace(pair.Key))
            {
                throw new InvalidOperationException("A command parameter name must not be blank.");
            }

            var parameter = _command.CreateParameter();
            if (parameter is null)
            {
                throw new InvalidOperationException("The supplied command returned no parameter.");
            }

            parameter.ParameterName = pair.Key;
            parameter.Direction = ParameterDirection.Input;
            parameter.IsNullable = pair.Value is null;
            parameter.Value = pair.Value ?? DBNull.Value;
            _command.Parameters.Add(parameter);
        }
    }

    private async Task<IReadOnlyList<IReadOnlyDictionary<string, object?>>> ReadBoundedRowsAsync(
        DbDataReader reader,
        int maximumRows,
        CancellationToken cancellationToken)
    {
        var fieldCount = reader.FieldCount;
        if (fieldCount is < 1 || fieldCount > _maximumFieldsPerRow)
        {
            throw new InvalidOperationException(
                $"Reader field count must be between 1 and {_maximumFieldsPerRow}.");
        }

        var fieldNames = SnapshotFieldNames(reader, fieldCount);
        var rows = new List<IReadOnlyDictionary<string, object?>>();

        while (await reader.ReadAsync(cancellationToken).ConfigureAwait(false))
        {
            if (rows.Count >= maximumRows)
            {
                throw new InvalidOperationException(
                    "The data reader returned more rows than the guarded request allows.");
            }

            var row = new Dictionary<string, object?>(fieldCount, StringComparer.Ordinal);
            for (var fieldIndex = 0; fieldIndex < fieldCount; fieldIndex++)
            {
                var value = reader.GetValue(fieldIndex);
                if (ReferenceEquals(value, DBNull.Value))
                {
                    value = null;
                }

                if (!IsImmutableScalar(value))
                {
                    throw new InvalidOperationException(
                        $"Reader field '{fieldNames[fieldIndex]}' is not a supported immutable scalar.");
                }

                row.Add(fieldNames[fieldIndex], value);
            }

            rows.Add(new ReadOnlyDictionary<string, object?>(row));
        }

        return rows.AsReadOnly();
    }

    private static string[] SnapshotFieldNames(DbDataReader reader, int fieldCount)
    {
        var names = new string[fieldCount];
        var uniqueNames = new HashSet<string>(StringComparer.Ordinal);

        for (var fieldIndex = 0; fieldIndex < fieldCount; fieldIndex++)
        {
            var name = reader.GetName(fieldIndex);
            if (string.IsNullOrWhiteSpace(name))
            {
                throw new InvalidOperationException("Reader field names must not be blank.");
            }

            if (!uniqueNames.Add(name))
            {
                throw new InvalidOperationException(
                    $"Reader field name '{name}' is duplicated under ordinal comparison.");
            }

            names[fieldIndex] = name;
        }

        return names;
    }

    private static bool IsImmutableScalar(object? value)
    {
        if (value is null || value.GetType().IsEnum)
        {
            return true;
        }

        return value is string
            or bool
            or byte
            or sbyte
            or short
            or ushort
            or int
            or uint
            or long
            or ulong
            or float
            or double
            or decimal
            or char
            or Guid
            or DateTime
            or DateTimeOffset
            or TimeSpan
            or DateOnly
            or TimeOnly;
    }
}
