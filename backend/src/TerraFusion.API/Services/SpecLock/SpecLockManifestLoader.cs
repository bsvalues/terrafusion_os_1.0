// =============================================================================
// SpecLock Manifest Loader (MACHINE MODE)
// =============================================================================
// Loads and parses the SpecLock manifest from disk.
// Single source of truth for runtime artifact verification.
// =============================================================================

using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using Microsoft.Extensions.FileProviders;

namespace TerraFusion.API.Services.SpecLock;

/// <summary>
/// Service interface for loading SpecLock manifest.
/// </summary>
public interface ISpecLockManifestLoader
{
    /// <summary>
    /// Load manifest from disk.
    /// </summary>
    /// <returns>Tuple of parsed manifest and raw JSON string.</returns>
    Task<(SpecLockManifest Manifest, string RawJson)> LoadAsync(CancellationToken ct = default);
}

/// <summary>
/// Default implementation that reads from PhysicalFileProvider.
/// </summary>
public sealed class SpecLockManifestLoader : ISpecLockManifestLoader
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web)
    {
        PropertyNameCaseInsensitive = true
    };

    private readonly IFileProvider _files;
    private readonly string _manifestPath;

    public SpecLockManifestLoader(IFileProvider files, IConfiguration cfg)
    {
        _files = files;
        _manifestPath = cfg["TF_SPECLOCK_MANIFEST_PATH"] ?? "artifacts/speclock/manifest.json";
    }

    public async Task<(SpecLockManifest Manifest, string RawJson)> LoadAsync(CancellationToken ct = default)
    {
        var file = _files.GetFileInfo(_manifestPath);
        if (!file.Exists)
        {
            throw new FileNotFoundException(
                $"SpecLock manifest missing at '{_manifestPath}'. " +
                "Run: python scripts/speclock-manifest.py");
        }

        await using var stream = file.CreateReadStream();
        using var reader = new StreamReader(stream, Encoding.UTF8, detectEncodingFromByteOrderMarks: true);
        var raw = await reader.ReadToEndAsync(ct);

        var manifest = JsonSerializer.Deserialize<SpecLockManifest>(raw, JsonOptions)
                      ?? throw new InvalidOperationException("SpecLock manifest JSON invalid/unparseable.");

        return (manifest, raw);
    }

    /// <summary>
    /// Compute SHA256 hex string from stream.
    /// </summary>
    public static string Sha256Hex(Stream s)
    {
        using var sha = SHA256.Create();
        var hash = sha.ComputeHash(s);
        return Convert.ToHexString(hash).ToLowerInvariant();
    }
}
