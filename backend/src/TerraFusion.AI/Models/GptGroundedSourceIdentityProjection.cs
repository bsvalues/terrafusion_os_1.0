namespace TerraFusion.AI.Models;

/// <summary>
/// Explicit host-proven identity assertions for a grounded-context request.
/// </summary>
public sealed record GptGroundedSourceIdentityRequest(
    string CountyId,
    string DatasetKey,
    string TraceId);

/// <summary>
/// Explicit host-proven authorization assertion. This type does not perform authorization.
/// </summary>
public sealed record GptGroundedSourceAuthorization(
    string Authorization,
    string? DenialCode);

/// <summary>
/// Bounded, sanitized source assertion supplied by an authorized host.
/// </summary>
public sealed record GptGroundedSourceCandidate(
    string SourceId,
    string ChunkId,
    int ChunkIndex,
    string Excerpt,
    double Score,
    string? SourceTitle);

/// <summary>
/// Canonically validated and ordered identity result. This is not the public GPT contract DTO.
/// </summary>
public sealed record GptGroundedSourceIdentityResult(
    string CountyId,
    string DatasetKey,
    string TraceId,
    string Authorization,
    string Status,
    string? DenialCode,
    IReadOnlyList<GptGroundedSourceCandidate> Candidates);

/// <summary>
/// Pure, unwired validation and ordering boundary for explicit grounded-source assertions.
/// </summary>
public static class GptGroundedSourceIdentityProjection
{
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

  public static GptGroundedSourceIdentityResult Create(
      GptGroundedSourceIdentityRequest request,
      GptGroundedSourceAuthorization authorization,
      IReadOnlyList<GptGroundedSourceCandidate> candidates)
  {
    ArgumentNullException.ThrowIfNull(request);
    ArgumentNullException.ThrowIfNull(authorization);
    ArgumentNullException.ThrowIfNull(candidates);

    RequireCanonicalText(request.CountyId, nameof(request.CountyId));
    RequireCanonicalText(request.DatasetKey, nameof(request.DatasetKey));
    RequireCanonicalText(request.TraceId, nameof(request.TraceId));

    if (!string.Equals(authorization.Authorization, Allowed, StringComparison.Ordinal)
        && !string.Equals(authorization.Authorization, Denied, StringComparison.Ordinal))
    {
      throw new ArgumentException(
          "Authorization must be in the closed ALLOWED or DENIED vocabulary.",
          nameof(authorization));
    }

    if (string.Equals(authorization.Authorization, Denied, StringComparison.Ordinal))
    {
      if (authorization.DenialCode is null || !DenialCodes.Contains(authorization.DenialCode))
      {
        throw new ArgumentException(
            "Denied authorization requires one frozen denial code.",
            nameof(authorization));
      }

      if (candidates.Count != 0)
      {
        throw new ArgumentException(
            "Denied authorization cannot contain source candidates.",
            nameof(candidates));
      }

      return CreateResult(
          request,
          authorization,
          Denied,
          Array.Empty<GptGroundedSourceCandidate>());
    }

    if (authorization.DenialCode is not null)
    {
      throw new ArgumentException(
          "Allowed authorization cannot contain a denial code.",
          nameof(authorization));
    }

    var normalized = new List<GptGroundedSourceCandidate>(candidates.Count);
    var identities = new HashSet<(string SourceId, string ChunkId)>();
    foreach (var candidate in candidates)
    {
      if (candidate is null)
      {
        throw new ArgumentException(
            "Source candidates cannot contain null entries.",
            nameof(candidates));
      }

      ValidateCandidate(candidate);
      if (!identities.Add((candidate.SourceId, candidate.ChunkId)))
      {
        throw new ArgumentException(
            "Source and chunk identity pairs must be unique.",
            nameof(candidates));
      }

      normalized.Add(candidate);
    }

    normalized.Sort(CompareCandidates);
    var status = normalized.Count == 0 ? NoRelevantContext : Grounded;
    return CreateResult(request, authorization, status, normalized.ToArray());
  }

  private static GptGroundedSourceIdentityResult CreateResult(
      GptGroundedSourceIdentityRequest request,
      GptGroundedSourceAuthorization authorization,
      string status,
      GptGroundedSourceCandidate[] candidates) =>
      new(
          request.CountyId,
          request.DatasetKey,
          request.TraceId,
          authorization.Authorization,
          status,
          authorization.DenialCode,
          Array.AsReadOnly(candidates));

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

  private static int CompareCandidates(
      GptGroundedSourceCandidate left,
      GptGroundedSourceCandidate right)
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
