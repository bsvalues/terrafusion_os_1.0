using TerraFusion.Abstractions.DTOs;
using TerraFusion.AI.Models;

namespace TerraFusion.API.Adapters;

/// <summary>
/// Pure, unwired mapping from an already-validated grounded source identity result
/// to the frozen gpt.grounded-context@1.0.0 result contract.
/// </summary>
public static class GptGroundedContextAdapter
{
    private const string SchemaVersion = "1.0.0";
    private const string Allowed = "ALLOWED";
    private const string Denied = "DENIED";
    private const string Grounded = "GROUNDED";
    private const string NoRelevantContext = "NO_RELEVANT_CONTEXT";
    private const int MaximumExcerptLength = 500;
    private const int MaximumSourceTitleLength = 200;

    private static readonly IReadOnlySet<string> DenialCodes = new HashSet<string>(
        StringComparer.Ordinal)
    {
        "COUNTY_CONTEXT_MISSING",
        "COUNTY_MISMATCH",
        "DATASET_NOT_ALLOWED",
        "QUERY_REJECTED",
        "SOURCE_NOT_AUTHORIZED",
    };

    public static GptGroundedContextResult Map(GptGroundedSourceIdentityResult source)
    {
        ArgumentNullException.ThrowIfNull(source);
        ArgumentNullException.ThrowIfNull(source.Candidates);

        RequireCanonicalText(source.CountyId, nameof(source.CountyId));
        RequireCanonicalText(source.DatasetKey, nameof(source.DatasetKey));
        RequireCanonicalText(source.TraceId, nameof(source.TraceId));
        ValidateState(source);

        var citations = new List<GptGroundedCitation>(source.Candidates.Count);
        var identities = new HashSet<(string SourceId, string ChunkId)>();
        GptGroundedCitation? previous = null;

        foreach (var candidate in source.Candidates)
        {
            if (candidate is null)
            {
                throw new ArgumentException(
                    "Source candidates cannot contain null entries.",
                    nameof(source));
            }

            ValidateCandidate(candidate);
            if (!identities.Add((candidate.SourceId, candidate.ChunkId)))
            {
                throw new ArgumentException(
                    "Source and chunk identity pairs must be unique.",
                    nameof(source));
            }

            var citation = new GptGroundedCitation
            {
                SourceId = candidate.SourceId,
                ChunkId = candidate.ChunkId,
                ChunkIndex = candidate.ChunkIndex,
                Excerpt = candidate.Excerpt,
                Score = ConvertScore(candidate.Score),
                SourceTitle = candidate.SourceTitle,
            };

            if (previous is not null && CompareCitations(previous, citation) > 0)
            {
                throw new ArgumentException(
                    "Source candidates must remain in canonical order after score conversion.",
                    nameof(source));
            }

            citations.Add(citation);
            previous = citation;
        }

        return new GptGroundedContextResult
        {
            SchemaVersion = SchemaVersion,
            CountyId = source.CountyId,
            DatasetKey = source.DatasetKey,
            TraceId = source.TraceId,
            Status = source.Status,
            DenialCode = source.DenialCode,
            Citations = citations.AsReadOnly(),
        };
    }

    private static void ValidateState(GptGroundedSourceIdentityResult source)
    {
        if (string.Equals(source.Authorization, Denied, StringComparison.Ordinal))
        {
            if (!string.Equals(source.Status, Denied, StringComparison.Ordinal)
                || source.DenialCode is null
                || !DenialCodes.Contains(source.DenialCode)
                || source.Candidates.Count != 0)
            {
                throw new ArgumentException(
                    "Denied results require DENIED status, one frozen denial code, and no candidates.",
                    nameof(source));
            }

            return;
        }

        if (!string.Equals(source.Authorization, Allowed, StringComparison.Ordinal)
            || source.DenialCode is not null)
        {
            throw new ArgumentException(
                "Non-denied results require ALLOWED authorization and no denial code.",
                nameof(source));
        }

        var validGrounded = string.Equals(source.Status, Grounded, StringComparison.Ordinal)
            && source.Candidates.Count > 0;
        var validEmpty = string.Equals(
                source.Status,
                NoRelevantContext,
                StringComparison.Ordinal)
            && source.Candidates.Count == 0;

        if (!validGrounded && !validEmpty)
        {
            throw new ArgumentException(
                "Allowed results require GROUNDED with candidates or NO_RELEVANT_CONTEXT without candidates.",
                nameof(source));
        }
    }

    private static void ValidateCandidate(GptGroundedSourceCandidate candidate)
    {
        RequireCanonicalText(candidate.SourceId, nameof(candidate.SourceId));
        RequireCanonicalText(candidate.ChunkId, nameof(candidate.ChunkId));
        RequireBoundedText(candidate.Excerpt, MaximumExcerptLength, nameof(candidate.Excerpt));

        if (candidate.SourceTitle is not null)
        {
            RequireBoundedText(
                candidate.SourceTitle,
                MaximumSourceTitleLength,
                nameof(candidate.SourceTitle));
        }

        if (candidate.ChunkIndex < 0)
        {
            throw new ArgumentOutOfRangeException(
                nameof(candidate.ChunkIndex),
                candidate.ChunkIndex,
                "ChunkIndex cannot be negative.");
        }

        if (!double.IsFinite(candidate.Score) || candidate.Score < 0 || candidate.Score > 1)
        {
            throw new ArgumentOutOfRangeException(
                nameof(candidate.Score),
                candidate.Score,
                "Score must be finite and between zero and one.");
        }
    }

    private static decimal ConvertScore(double score)
    {
        try
        {
            var converted = checked((decimal)score);
            if (converted < 0 || converted > 1)
            {
                throw new OverflowException();
            }

            return converted;
        }
        catch (OverflowException exception)
        {
            throw new ArgumentException(
                "Score cannot be represented by the frozen decimal contract.",
                nameof(score),
                exception);
        }
    }

    private static void RequireCanonicalText(string value, string fieldName)
    {
        if (string.IsNullOrWhiteSpace(value)
            || !string.Equals(value, value.Trim(), StringComparison.Ordinal)
            || value.Any(char.IsControl))
        {
            throw new ArgumentException(
                $"{fieldName} must be a non-empty canonical value without surrounding whitespace or control characters.",
                fieldName);
        }
    }

    private static void RequireBoundedText(string value, int maximumLength, string fieldName)
    {
        RequireCanonicalText(value, fieldName);
        if (value.Length > maximumLength)
        {
            throw new ArgumentException(
                $"{fieldName} cannot exceed {maximumLength} characters.",
                fieldName);
        }
    }

    private static int CompareCitations(
        GptGroundedCitation left,
        GptGroundedCitation right)
    {
        var score = right.Score.CompareTo(left.Score);
        if (score != 0)
        {
            return score;
        }

        var source = StringComparer.Ordinal.Compare(left.SourceId, right.SourceId);
        if (source != 0)
        {
            return source;
        }

        var chunkIndex = left.ChunkIndex.CompareTo(right.ChunkIndex);
        return chunkIndex != 0
            ? chunkIndex
            : StringComparer.Ordinal.Compare(left.ChunkId, right.ChunkId);
    }
}
