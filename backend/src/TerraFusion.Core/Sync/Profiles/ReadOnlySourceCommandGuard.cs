using System;
using System.Globalization;
using System.Linq;
using System.Text.RegularExpressions;

namespace TerraFusion.Core.Sync.Profiles;

/// <summary>
/// Conservative syntax gate for later SQL-family read-only adapters.
/// This is defense in depth, not a SQL parser and not evidence of live source-side no-DML.
/// </summary>
public static partial class ReadOnlySourceCommandGuard
{
    /// <summary>
    /// Validates one unambiguous <c>SELECT</c> statement and returns the guarded command value.
    /// The gate intentionally rejects syntax it cannot classify safely.
    /// </summary>
    public static ReadOnlySourceCommand RequireRead(string commandText)
    {
        if (string.IsNullOrWhiteSpace(commandText))
        {
            throw Rejected("Command must not be blank.", nameof(commandText));
        }

        if (commandText.Any(IsObfuscatingCharacter))
        {
            throw Rejected("Control and Unicode format characters are not allowed.", nameof(commandText));
        }

        var candidate = commandText.Trim();
        if (candidate.Contains(';'))
        {
            throw Rejected("Statement separators are not allowed.", nameof(commandText));
        }

        if (CommentToken().IsMatch(candidate))
        {
            throw Rejected("Comments are not allowed.", nameof(commandText));
        }

        if (!SelectPrefix().IsMatch(candidate))
        {
            throw Rejected("Only an explicit SELECT command is allowed.", nameof(commandText));
        }

        if (SelectToken().Matches(candidate).Count != 1)
        {
            throw Rejected("Exactly one SELECT operation is allowed.", nameof(commandText));
        }

        if (ForbiddenOperation().IsMatch(candidate) || SelectInto().IsMatch(candidate))
        {
            throw Rejected("The command contains a write, execution, or ambiguous operation.", nameof(commandText));
        }

        return new ReadOnlySourceCommand(candidate);
    }

    private static bool IsObfuscatingCharacter(char value)
    {
        return char.IsControl(value) || char.GetUnicodeCategory(value) == UnicodeCategory.Format;
    }

    private static ArgumentException Rejected(string message, string parameterName)
    {
        return new ArgumentException(message, parameterName);
    }

    [GeneratedRegex(@"(?:--|/\*|\*/|#)", RegexOptions.CultureInvariant)]
    private static partial Regex CommentToken();

    [GeneratedRegex(@"\ASELECT\b", RegexOptions.IgnoreCase | RegexOptions.CultureInvariant)]
    private static partial Regex SelectPrefix();

    [GeneratedRegex(@"\bSELECT\b", RegexOptions.IgnoreCase | RegexOptions.CultureInvariant)]
    private static partial Regex SelectToken();

    [GeneratedRegex(
        @"\b(?:INSERT|UPDATE|DELETE|MERGE|UPSERT|REPLACE|TRUNCATE|CREATE|ALTER|DROP|GRANT|REVOKE|DENY|EXEC|EXECUTE|CALL|COPY|BULK|BACKUP|RESTORE|ATTACH|DETACH|PRAGMA|VACUUM|ANALYZE|BEGIN|COMMIT|ROLLBACK|SAVEPOINT|SET|USE|LOCK|GO|DECLARE|PRINT|RAISERROR|THROW|WAITFOR|DBCC|SHUTDOWN|KILL|RECONFIGURE)\b",
        RegexOptions.IgnoreCase | RegexOptions.CultureInvariant)]
    private static partial Regex ForbiddenOperation();

    [GeneratedRegex(@"\bINTO\b|\bFOR\s+UPDATE\b|\bNEXT\s+VALUE\b", RegexOptions.IgnoreCase | RegexOptions.CultureInvariant)]
    private static partial Regex SelectInto();
}
