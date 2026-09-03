using System.Buffers;
using System.Security.Cryptography;
using System.Text;

namespace TerraFusion.Core.Import;

/// <summary>
/// Explicit bounds and syntax policy for <see cref="CountyCsvStreamParser"/>.
/// Every value is required so upload callers cannot inherit an unreviewed limit or delimiter.
/// </summary>
public sealed record CountyCsvParserOptions
{
    public required char Delimiter { get; init; }

    public required long MaxInputBytes { get; init; }

    public required int MaxDataRows { get; init; }

    public required int MaxFieldsPerRow { get; init; }

    public required int MaxCharactersPerField { get; init; }
}

/// <summary>
/// A parsed CSV document. The first record is always represented by <see cref="Headers"/>;
/// <see cref="Rows"/> contains only data records. Headers, the outer row collection, and every
/// individual row are deeply read-only snapshots of the validated parser state.
/// </summary>
public sealed record CountyCsvDocument(
    IReadOnlyList<string> Headers,
    IReadOnlyList<IReadOnlyList<string>> Rows,
    long InputBytes,
    string ContentSha256);

public enum CountyCsvErrorCode
{
    InputTooLarge,
    InvalidUtf8,
    MissingHeader,
    EmptyHeader,
    DuplicateHeader,
    BlankRow,
    TooManyRows,
    TooManyFields,
    FieldTooLong,
    InconsistentFieldCount,
    MalformedCsv,
}

/// <summary>
/// Input-data failure from the governed CSV contract. Configuration errors are reported as
/// argument exceptions before parsing begins.
/// </summary>
public sealed class CountyCsvParseException : FormatException
{
    public CountyCsvParseException(CountyCsvErrorCode errorCode, string message)
        : base(message)
    {
        ErrorCode = errorCode;
    }

    public CountyCsvParseException(
        CountyCsvErrorCode errorCode,
        string message,
        Exception innerException)
        : base(message, innerException)
    {
        ErrorCode = errorCode;
    }

    public CountyCsvErrorCode ErrorCode { get; }
}

/// <summary>
/// Streaming, strict-UTF-8 CSV parser for contract <c>wal.county-upload.csv-parser.v1</c>.
/// This class performs syntax parsing only; it has no format detection, authentication,
/// persistence, mapping, promotion, or external-source behavior.
/// </summary>
public sealed class CountyCsvStreamParser
{
    public const string ContractId = "wal.county-upload.csv-parser.v1";

    private const int ByteBufferSize = 4096;
    private static readonly Encoding StrictUtf8 = new UTF8Encoding(
        encoderShouldEmitUTF8Identifier: false,
        throwOnInvalidBytes: true);

    private readonly CountyCsvParserOptions _options;

    public CountyCsvStreamParser(CountyCsvParserOptions options)
    {
        ArgumentNullException.ThrowIfNull(options);
        ValidateOptions(options);
        _options = options;
    }

    public async Task<CountyCsvDocument> ParseAsync(
        Stream input,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(input);
        if (!input.CanRead)
        {
            throw new ArgumentException("CSV input stream must be readable.", nameof(input));
        }

        cancellationToken.ThrowIfCancellationRequested();

        var byteBuffer = ArrayPool<byte>.Shared.Rent(ByteBufferSize);
        var charBuffer = ArrayPool<char>.Shared.Rent(StrictUtf8.GetMaxCharCount(ByteBufferSize));
        var decoder = StrictUtf8.GetDecoder();
        var state = new ParserState(_options);
        using var contentHash = IncrementalHash.CreateHash(HashAlgorithmName.SHA256);
        long inputBytes = 0;

        try
        {
            while (true)
            {
                var bytesRead = await input
                    .ReadAsync(byteBuffer.AsMemory(0, ByteBufferSize), cancellationToken)
                    .ConfigureAwait(false);
                if (bytesRead == 0)
                {
                    break;
                }

                inputBytes += bytesRead;
                if (inputBytes > _options.MaxInputBytes)
                {
                    throw new CountyCsvParseException(
                        CountyCsvErrorCode.InputTooLarge,
                        $"CSV input exceeds the {_options.MaxInputBytes}-byte limit.");
                }

                contentHash.AppendData(byteBuffer, 0, bytesRead);

                DecodeAndProcess(
                    decoder,
                    byteBuffer.AsSpan(0, bytesRead),
                    charBuffer,
                    flush: false,
                    state,
                    cancellationToken);
            }

            DecodeAndProcess(
                decoder,
                ReadOnlySpan<byte>.Empty,
                charBuffer,
                flush: true,
                state,
                cancellationToken);

            var contentSha256 = Convert
                .ToHexString(contentHash.GetHashAndReset())
                .ToLowerInvariant();
            return state.Complete(inputBytes, contentSha256);
        }
        catch (DecoderFallbackException exception)
        {
            throw new CountyCsvParseException(
                CountyCsvErrorCode.InvalidUtf8,
                "CSV input is not valid strict UTF-8.",
                exception);
        }
        finally
        {
            ArrayPool<byte>.Shared.Return(byteBuffer, clearArray: true);
            ArrayPool<char>.Shared.Return(charBuffer, clearArray: true);
        }
    }

    private static void DecodeAndProcess(
        Decoder decoder,
        ReadOnlySpan<byte> bytes,
        char[] charBuffer,
        bool flush,
        ParserState state,
        CancellationToken cancellationToken)
    {
        do
        {
            decoder.Convert(
                bytes,
                charBuffer.AsSpan(),
                flush,
                out var bytesUsed,
                out var charsUsed,
                out var completed);

            for (var index = 0; index < charsUsed; index++)
            {
                cancellationToken.ThrowIfCancellationRequested();
                state.Process(charBuffer[index]);
            }

            bytes = bytes[bytesUsed..];
            if (completed)
            {
                break;
            }
        }
        while (!bytes.IsEmpty || flush);
    }

    private static void ValidateOptions(CountyCsvParserOptions options)
    {
        if (options.Delimiter is '\0' or '\r' or '\n' or '"' or '\uFEFF')
        {
            throw new ArgumentOutOfRangeException(
                nameof(options),
                "CSV delimiter must be explicit and cannot be NUL, CR, LF, a double quote, or the BOM character.");
        }

        if (options.MaxInputBytes <= 0)
        {
            throw new ArgumentOutOfRangeException(nameof(options), "MaxInputBytes must be positive.");
        }

        if (options.MaxDataRows <= 0)
        {
            throw new ArgumentOutOfRangeException(nameof(options), "MaxDataRows must be positive.");
        }

        if (options.MaxFieldsPerRow <= 0)
        {
            throw new ArgumentOutOfRangeException(
                nameof(options),
                "MaxFieldsPerRow must be positive.");
        }

        if (options.MaxCharactersPerField <= 0)
        {
            throw new ArgumentOutOfRangeException(
                nameof(options),
                "MaxCharactersPerField must be positive.");
        }
    }

    private enum FieldState
    {
        Start,
        Unquoted,
        Quoted,
        AfterClosingQuote,
    }

    private sealed class ParserState
    {
        private readonly CountyCsvParserOptions _options;
        private readonly StringBuilder _field = new();
        private readonly List<string> _record = [];
        private readonly List<IReadOnlyList<string>> _rows = [];

        private IReadOnlyList<string>? _headers;
        private FieldState _fieldState;
        private bool _firstDecodedCharacter = true;
        private bool _recordInProgress;
        private bool _recordHasContent;
        private bool _skipLineFeed;

        public ParserState(CountyCsvParserOptions options)
        {
            _options = options;
        }

        public void Process(char value)
        {
            if (_firstDecodedCharacter)
            {
                _firstDecodedCharacter = false;
                if (value == '\uFEFF')
                {
                    return;
                }
            }
            else if (value == '\uFEFF')
            {
                ThrowMalformed("UTF-8 BOM is permitted only at the beginning of the stream.");
            }

            if (_skipLineFeed)
            {
                _skipLineFeed = false;
                if (value == '\n')
                {
                    return;
                }
            }

            switch (_fieldState)
            {
                case FieldState.Start:
                    ProcessFieldStart(value);
                    break;
                case FieldState.Unquoted:
                    ProcessUnquoted(value);
                    break;
                case FieldState.Quoted:
                    ProcessQuoted(value);
                    break;
                case FieldState.AfterClosingQuote:
                    ProcessAfterClosingQuote(value);
                    break;
                default:
                    throw new InvalidOperationException("Unknown CSV parser state.");
            }
        }

        public CountyCsvDocument Complete(long inputBytes, string contentSha256)
        {
            if (_fieldState == FieldState.Quoted)
            {
                ThrowMalformed("CSV input ended inside a quoted field.");
            }

            if (_recordInProgress || _record.Count > 0 || _field.Length > 0)
            {
                AddField();
                AddRecord();
            }

            if (_headers is null)
            {
                throw new CountyCsvParseException(
                    CountyCsvErrorCode.MissingHeader,
                    "CSV input must contain a required header row.");
            }

            return new CountyCsvDocument(
                _headers,
                Array.AsReadOnly(_rows.ToArray()),
                inputBytes,
                contentSha256);
        }

        private void ProcessFieldStart(char value)
        {
            _recordInProgress = true;

            if (value == _options.Delimiter)
            {
                _recordHasContent = true;
                AddField();
                return;
            }

            if (value == '"')
            {
                _recordHasContent = true;
                _fieldState = FieldState.Quoted;
                return;
            }

            if (IsRecordSeparator(value))
            {
                AddField();
                AddRecord();
                CompleteRecordSeparator(value);
                return;
            }

            _recordHasContent = true;
            Append(value);
            _fieldState = FieldState.Unquoted;
        }

        private void ProcessUnquoted(char value)
        {
            if (value == _options.Delimiter)
            {
                AddField();
                _fieldState = FieldState.Start;
                return;
            }

            if (value == '"')
            {
                ThrowMalformed("Double quote is not permitted inside an unquoted field.");
            }

            if (IsRecordSeparator(value))
            {
                AddField();
                AddRecord();
                CompleteRecordSeparator(value);
                return;
            }

            Append(value);
        }

        private void ProcessQuoted(char value)
        {
            if (value == '"')
            {
                _fieldState = FieldState.AfterClosingQuote;
                return;
            }

            Append(value);
        }

        private void ProcessAfterClosingQuote(char value)
        {
            if (value == '"')
            {
                Append('"');
                _fieldState = FieldState.Quoted;
                return;
            }

            if (value == _options.Delimiter)
            {
                AddField();
                _fieldState = FieldState.Start;
                return;
            }

            if (IsRecordSeparator(value))
            {
                AddField();
                AddRecord();
                CompleteRecordSeparator(value);
                return;
            }

            ThrowMalformed("Only a delimiter or record separator may follow a closing quote.");
        }

        private void Append(char value)
        {
            if ((char.IsControl(value) && value is not '\t' and not '\r' and not '\n')
                || value == '\uFFFE'
                || value == '\uFFFF')
            {
                ThrowMalformed("CSV input contains a forbidden control or noncharacter value.");
            }

            if (_field.Length >= _options.MaxCharactersPerField)
            {
                throw new CountyCsvParseException(
                    CountyCsvErrorCode.FieldTooLong,
                    $"CSV field exceeds the {_options.MaxCharactersPerField}-character limit.");
            }

            _field.Append(value);
        }

        private void AddField()
        {
            if (_record.Count >= _options.MaxFieldsPerRow)
            {
                throw new CountyCsvParseException(
                    CountyCsvErrorCode.TooManyFields,
                    $"CSV record exceeds the {_options.MaxFieldsPerRow}-field limit.");
            }

            _record.Add(_field.ToString());
            _field.Clear();
        }

        private void AddRecord()
        {
            var completedRecord = _record.ToArray();
            var recordHasContent = _recordHasContent;
            _record.Clear();
            _recordInProgress = false;
            _recordHasContent = false;
            _fieldState = FieldState.Start;

            if (_headers is null)
            {
                ValidateHeaders(completedRecord);
                _headers = Array.AsReadOnly(completedRecord);
                return;
            }

            if (!recordHasContent)
            {
                throw new CountyCsvParseException(
                    CountyCsvErrorCode.BlankRow,
                    "CSV data cannot contain a blank physical record.");
            }

            if (completedRecord.Length != _headers.Count)
            {
                throw new CountyCsvParseException(
                    CountyCsvErrorCode.InconsistentFieldCount,
                    $"CSV data record has {completedRecord.Length} fields; expected {_headers.Count}.");
            }

            if (_rows.Count >= _options.MaxDataRows)
            {
                throw new CountyCsvParseException(
                    CountyCsvErrorCode.TooManyRows,
                    $"CSV input exceeds the {_options.MaxDataRows}-data-row limit.");
            }

            _rows.Add(Array.AsReadOnly(completedRecord));
        }

        private static void ValidateHeaders(IReadOnlyList<string> headers)
        {
            var seen = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
            foreach (var header in headers)
            {
                var normalized = header.Trim();
                if (normalized.Length == 0)
                {
                    throw new CountyCsvParseException(
                        CountyCsvErrorCode.EmptyHeader,
                        "CSV header names must be non-empty.");
                }

                if (!seen.Add(normalized))
                {
                    throw new CountyCsvParseException(
                        CountyCsvErrorCode.DuplicateHeader,
                        "CSV header names must be unique (case-insensitive).");
                }
            }
        }

        private void CompleteRecordSeparator(char value)
        {
            _skipLineFeed = value == '\r';
        }

        private static bool IsRecordSeparator(char value) => value is '\r' or '\n';

        private static void ThrowMalformed(string message)
        {
            throw new CountyCsvParseException(CountyCsvErrorCode.MalformedCsv, message);
        }
    }
}
