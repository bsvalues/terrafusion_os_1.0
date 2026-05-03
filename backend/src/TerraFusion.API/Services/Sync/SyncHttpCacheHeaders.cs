using System;
using System.Globalization;
using System.Linq;
using System.Security.Cryptography;
using System.Text;
using Microsoft.AspNetCore.Http;

namespace TerraFusion.API.Services.Sync;

/// <summary>
/// Slice C45-B helpers for emitting the C45-A comps-API caching
/// headers and matching conditional-request headers.
///
/// <para>All methods are pure / static: no I/O, no DI, no
/// allocation beyond the bytes the SHA-256 + header strings need.
/// Each emission method writes directly to the supplied
/// <see cref="HttpResponse"/>; each match method reads directly
/// from the supplied <see cref="HttpRequest"/>.</para>
///
/// <para>Per C45-A:
/// <list type="bullet">
/// <item>ETags are <b>strong</b> (no <c>W/</c> prefix). The seed
///   is exact, so strong is defensible.</item>
/// <item>Cacheable responses always carry
///   <c>Cache-Control: private, max-age=&lt;sec&gt;</c>,
///   <c>ETag</c>, <c>Last-Modified</c>, and
///   <c>Vary: Authorization</c>.</item>
/// <item>304 responses carry the same Cache-Control + ETag +
///   Vary, but NO Last-Modified (the body is empty; client
///   already knows).</item>
/// <item>Errors / mutations carry <c>Cache-Control: no-store</c>
///   and NO ETag / Last-Modified.</item>
/// </list>
/// </para>
/// </summary>
public static class SyncHttpCacheHeaders
{
    /// <summary>
    /// Build a strong ETag from a scope prefix and an ordered
    /// list of seed parts. The seed is joined with <c>|</c> to
    /// avoid ambiguity between adjacent parts; <c>null</c> parts
    /// are coerced to empty strings.
    ///
    /// <para>Returned value is the full quoted ETag header value
    /// (e.g. <c>"comps:e:abcdef…"</c>) including the surrounding
    /// double quotes — ready to drop into
    /// <see cref="HttpResponse.Headers"/> verbatim.</para>
    /// </summary>
    public static string BuildStrongEtag(string scopePrefix, params string[] parts)
    {
        if (string.IsNullOrEmpty(scopePrefix))
        {
            throw new ArgumentException("scopePrefix is required.", nameof(scopePrefix));
        }
        ArgumentNullException.ThrowIfNull(parts);

        var seed = string.Join("|", parts.Select(p => p ?? string.Empty));
        var hash = Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(seed)))
            .ToLowerInvariant();

        return "\"" + scopePrefix + ":" + hash + "\"";
    }

    /// <summary>
    /// Apply the C45-A private cacheable headers to a 200
    /// response: <c>Cache-Control: private, max-age=N</c>,
    /// <c>ETag</c>, <c>Last-Modified</c> (RFC 1123), and
    /// <c>Vary: Authorization</c>.
    ///
    /// <para>Slice C45-E: when
    /// <paramref name="staleWhileRevalidate"/> is supplied (and
    /// positive), the directive is appended as
    /// <c>stale-while-revalidate=N</c> so clients can render
    /// cached data immediately while refetching in the
    /// background. <c>null</c> or zero/negative values omit the
    /// directive entirely (the C45-A pointer-endpoint policy
    /// wants no SWR — operators expect pointer changes to reflect
    /// immediately).</para>
    /// </summary>
    public static void ApplyPrivateCacheHeaders(
        HttpResponse response,
        TimeSpan maxAge,
        string etag,
        DateTimeOffset lastModifiedUtc,
        TimeSpan? staleWhileRevalidate = null)
    {
        ArgumentNullException.ThrowIfNull(response);
        if (string.IsNullOrEmpty(etag)) throw new ArgumentException("etag required", nameof(etag));
        if (maxAge < TimeSpan.Zero) throw new ArgumentOutOfRangeException(nameof(maxAge));

        response.Headers.CacheControl = BuildCacheControl(maxAge, staleWhileRevalidate);
        response.Headers.ETag         = etag;
        response.Headers.LastModified = lastModifiedUtc.UtcDateTime
            .ToString("R", CultureInfo.InvariantCulture);
        response.Headers.Vary         = "Authorization";
    }

    /// <summary>
    /// Apply C45-A 304 Not Modified headers: same Cache-Control
    /// + ETag + Vary as the matching 200, but NO Last-Modified.
    /// The caller is responsible for setting the response status
    /// code to 304 and returning an empty body.
    ///
    /// <para>Slice C45-E: <paramref name="staleWhileRevalidate"/>
    /// mirrors the matching 200's directive so the SWR window
    /// applies even when the conditional short-circuit fires.</para>
    /// </summary>
    public static void ApplyNotModifiedHeaders(
        HttpResponse response,
        TimeSpan maxAge,
        string etag,
        TimeSpan? staleWhileRevalidate = null)
    {
        ArgumentNullException.ThrowIfNull(response);
        if (string.IsNullOrEmpty(etag)) throw new ArgumentException("etag required", nameof(etag));

        response.Headers.CacheControl = BuildCacheControl(maxAge, staleWhileRevalidate);
        response.Headers.ETag         = etag;
        response.Headers.Vary         = "Authorization";
        response.Headers.Remove("Last-Modified");
    }

    /// <summary>
    /// Build the <c>Cache-Control</c> value for a private
    /// cacheable response. <c>private, max-age=N</c> is always
    /// emitted; <c>stale-while-revalidate=M</c> is appended only
    /// when supplied and positive (per Slice C45-E).
    /// </summary>
    private static string BuildCacheControl(TimeSpan maxAge, TimeSpan? staleWhileRevalidate)
    {
        var maxAgeSeconds = (int)maxAge.TotalSeconds;
        if (staleWhileRevalidate is { } swr && swr > TimeSpan.Zero)
        {
            var swrSeconds = (int)swr.TotalSeconds;
            return $"private, max-age={maxAgeSeconds.ToString(CultureInfo.InvariantCulture)}, stale-while-revalidate={swrSeconds.ToString(CultureInfo.InvariantCulture)}";
        }
        return $"private, max-age={maxAgeSeconds.ToString(CultureInfo.InvariantCulture)}";
    }

    /// <summary>
    /// Apply <c>Cache-Control: no-store</c> per C45-A Hard Guard
    /// 2 / 10. Removes any prior <c>ETag</c> and
    /// <c>Last-Modified</c> headers so error / mutation responses
    /// never leak resource freshness signals.
    /// </summary>
    public static void ApplyNoStore(HttpResponse response)
    {
        ArgumentNullException.ThrowIfNull(response);
        response.Headers.CacheControl = "no-store";
        response.Headers.Remove("ETag");
        response.Headers.Remove("Last-Modified");
    }

    /// <summary>
    /// Returns <c>true</c> when the request's
    /// <c>If-None-Match</c> header matches the supplied ETag.
    /// Matches the full quoted form verbatim and tolerates the
    /// HTTP-spec-permitted comma-separated list of values
    /// (taking any single match as a hit).
    /// </summary>
    public static bool MatchesIfNoneMatch(HttpRequest request, string etag)
    {
        ArgumentNullException.ThrowIfNull(request);
        if (string.IsNullOrEmpty(etag)) return false;

        if (!request.Headers.TryGetValue("If-None-Match", out var clientEtags))
        {
            return false;
        }
        // The client may send a comma-separated list of ETags; any
        // exact match is sufficient for a 304. We do not honor the
        // wildcard (*) form — the API does not implement
        // optimistic-concurrency semantics on these endpoints.
        foreach (var raw in clientEtags)
        {
            if (string.IsNullOrWhiteSpace(raw)) continue;
            foreach (var token in raw.Split(','))
            {
                var trimmed = token.Trim();
                if (trimmed.Length == 0) continue;
                if (string.Equals(trimmed, etag, StringComparison.Ordinal))
                {
                    return true;
                }
            }
        }
        return false;
    }

    /// <summary>
    /// Slice C45-C: returns <c>true</c> when the request's
    /// <c>If-Match</c> header indicates the operation should
    /// proceed against the supplied <paramref name="currentEtag"/>.
    ///
    /// <para>Three branches per RFC 9110 §13.1.1:
    /// <list type="bullet">
    /// <item>Header absent → <c>true</c> (no precondition).</item>
    /// <item>Header is <c>*</c> → <c>true</c> iff
    ///   <paramref name="currentEtag"/> is non-empty (i.e. a
    ///   resource exists). The active-workbook PUT uses this to
    ///   require "a pointer must already exist" — useful for
    ///   replace-only flows.</item>
    /// <item>Header is one or more quoted ETag values → <c>true</c>
    ///   iff any of them matches <paramref name="currentEtag"/>
    ///   exactly (strong comparison; <c>W/</c>-prefixed entries are
    ///   ignored).</item>
    /// </list>
    /// When <see cref="HasIfMatchHeader"/> is <c>true</c> and this
    /// returns <c>false</c>, the caller MUST surface
    /// <c>412 Precondition Failed</c>.
    /// </para>
    /// </summary>
    public static bool MatchesIfMatch(HttpRequest request, string? currentEtag)
    {
        ArgumentNullException.ThrowIfNull(request);

        if (!request.Headers.TryGetValue("If-Match", out var values) || values.Count == 0)
        {
            // No precondition supplied — the caller proceeds as
            // before. C45-C is opt-in.
            return true;
        }

        var raw = values[0];
        if (string.IsNullOrWhiteSpace(raw))
        {
            return true; // Treat empty header as absent.
        }

        var trimmedHeader = raw.Trim();
        if (trimmedHeader == "*")
        {
            // RFC 9110: "*" matches iff the resource exists.
            return !string.IsNullOrEmpty(currentEtag);
        }

        if (string.IsNullOrEmpty(currentEtag))
        {
            // Resource has no current ETag (e.g. no pointer) but
            // the client sent an explicit ETag list — there is
            // nothing for it to match.
            return false;
        }

        foreach (var token in trimmedHeader.Split(','))
        {
            var t = token.Trim();
            if (t.Length == 0) continue;
            // Strong comparison only — weak ETags are out of
            // scope for the comps API per the C45-A policy.
            if (t.StartsWith("W/", StringComparison.Ordinal)) continue;
            if (string.Equals(t, currentEtag, StringComparison.Ordinal))
            {
                return true;
            }
        }
        return false;
    }

    /// <summary>
    /// Slice C45-C: helper for the controller to detect whether
    /// the client supplied an <c>If-Match</c> precondition at all.
    /// Combined with <see cref="MatchesIfMatch"/>, the controller
    /// surfaces 412 only when the header WAS supplied AND the
    /// match check failed.
    /// </summary>
    public static bool HasIfMatchHeader(HttpRequest request)
    {
        ArgumentNullException.ThrowIfNull(request);
        if (!request.Headers.TryGetValue("If-Match", out var values) || values.Count == 0)
        {
            return false;
        }
        return !string.IsNullOrWhiteSpace(values[0]);
    }

    /// <summary>
    /// Returns <c>true</c> when the request's
    /// <c>If-Modified-Since</c> header is a parseable HTTP-date
    /// AND that date is at or after <paramref name="lastModifiedUtc"/>
    /// (truncated to one-second precision per RFC 1123).
    /// </summary>
    public static bool MatchesIfModifiedSince(HttpRequest request, DateTimeOffset lastModifiedUtc)
    {
        ArgumentNullException.ThrowIfNull(request);

        if (!request.Headers.TryGetValue("If-Modified-Since", out var values) ||
            values.Count == 0)
        {
            return false;
        }

        var raw = values[0];
        if (string.IsNullOrWhiteSpace(raw)) return false;

        if (!DateTimeOffset.TryParseExact(
                raw,
                "R",
                CultureInfo.InvariantCulture,
                DateTimeStyles.AssumeUniversal | DateTimeStyles.AdjustToUniversal,
                out var clientDate))
        {
            return false;
        }

        // Truncate to seconds; RFC 1123 has no sub-second precision
        // so we compare the truncated values.
        var serverSeconds = TruncateToSeconds(lastModifiedUtc);
        var clientSeconds = TruncateToSeconds(clientDate);
        return clientSeconds >= serverSeconds;
    }

    private static DateTimeOffset TruncateToSeconds(DateTimeOffset value)
        => new(value.Year, value.Month, value.Day,
               value.Hour, value.Minute, value.Second,
               value.Offset);
}
