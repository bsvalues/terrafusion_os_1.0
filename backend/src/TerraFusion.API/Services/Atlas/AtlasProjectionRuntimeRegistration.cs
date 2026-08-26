using System.Security.Cryptography;
using System.Text.Json;
using Microsoft.Extensions.Options;
using TerraFusion.API.Configuration;

namespace TerraFusion.API.Services.Atlas;

/// <summary>
/// Registers the exact Atlas-owned projection artifact for local Development use.
/// Artifact location and provenance are code-pinned; configuration can select the
/// mode and timeout but cannot redirect the runtime to mutable source.
/// </summary>
public static class AtlasProjectionRuntimeRegistration
{
    public static void AddAtlasProjectionRuntime(
        this IServiceCollection services,
        IConfiguration configuration,
        IHostEnvironment environment)
    {
        ArgumentNullException.ThrowIfNull(services);
        ArgumentNullException.ThrowIfNull(configuration);
        ArgumentNullException.ThrowIfNull(environment);

        var options = configuration
            .GetSection(AtlasProjectionOptions.SectionName)
            .Get<AtlasProjectionOptions>() ?? new AtlasProjectionOptions();

        if (!Enum.IsDefined(options.Mode))
        {
            throw new InvalidOperationException($"Unsupported Atlas projection mode: {options.Mode}.");
        }
        if (options.TimeoutSeconds is < 1 or > 30)
        {
            throw new InvalidOperationException("Atlas projection timeout must be between 1 and 30 seconds.");
        }

        if (options.Mode == AtlasProjectionMode.Disabled)
        {
            services.AddSingleton<IOptions<AtlasProjectionOptions>>(Options.Create(options));
            return;
        }

        if (!environment.IsDevelopment())
        {
            throw new InvalidOperationException(
                "Atlas LocalExact selection is restricted to the Development environment.");
        }

        var sovereignRoot = AtlasProjectionArtifactVerifier.ResolveSovereignRoot(
            environment.ContentRootPath);
        AddLocalExactRuntime(
            services,
            options,
            new AtlasProjectionArtifactVerifier(sovereignRoot),
            ResolveNodeExecutablePath());
    }

    internal static void AddLocalExactRuntime(
        IServiceCollection services,
        AtlasProjectionOptions options,
        AtlasProjectionArtifactVerifier verifier,
        string nodeExecutablePath)
    {
        var artifact = verifier.Verify();
        options.ModulePath = artifact.ModulePath;
        options.NodeExecutablePath = RequireCanonicalExecutable(nodeExecutablePath);

        services.AddSingleton<IOptions<AtlasProjectionOptions>>(Options.Create(options));
        services.AddSingleton(verifier);
        services.AddSingleton(provider => new AtlasProjectionProcessHost(
            provider.GetRequiredService<IOptions<AtlasProjectionOptions>>().Value.NodeExecutablePath,
            TimeSpan.FromSeconds(
                provider.GetRequiredService<IOptions<AtlasProjectionOptions>>().Value.TimeoutSeconds)));
        services.AddSingleton<IAtlasProjectionProcessHost>(provider =>
            new AtlasProjectionVerifiedProcessHost(
                provider.GetRequiredService<AtlasProjectionProcessHost>(),
                provider.GetRequiredService<AtlasProjectionArtifactVerifier>()));
        services.AddScoped<IAtlasParcelIdentityResolver, AtlasParcelIdentityResolver>();
        services.AddScoped<IAtlasParcelCountyScopeVerifier, AtlasParcelCountyScopeVerifier>();
        services.AddScoped<AtlasProjectionConsumer>();
    }

    internal static string ResolveNodeExecutablePath(string? searchPath = null)
    {
        var path = searchPath ?? Environment.GetEnvironmentVariable("PATH");
        if (string.IsNullOrWhiteSpace(path))
        {
            throw new InvalidOperationException("PATH is unavailable; the exact Atlas runtime cannot resolve Node.");
        }

        var names = OperatingSystem.IsWindows()
            ? new[] { "node.exe" }
            : new[] { "node" };
        foreach (var entry in path.Split(Path.PathSeparator, StringSplitOptions.RemoveEmptyEntries))
        {
            var directory = entry.Trim().Trim('"');
            if (!Path.IsPathFullyQualified(directory))
            {
                continue;
            }

            foreach (var name in names)
            {
                var candidate = Path.GetFullPath(Path.Combine(directory, name));
                if (File.Exists(candidate))
                {
                    return RequireCanonicalExecutable(candidate);
                }
            }
        }

        throw new InvalidOperationException("A canonical Node executable was not found on PATH.");
    }

    private static string RequireCanonicalExecutable(string path)
    {
        if (string.IsNullOrWhiteSpace(path) || !Path.IsPathFullyQualified(path))
        {
            throw new InvalidOperationException("The Atlas Node executable path must be absolute.");
        }

        var canonical = Path.GetFullPath(path);
        if (!string.Equals(canonical, path, AtlasProjectionArtifactVerifier.PathComparison)
            || !File.Exists(canonical)
            || File.GetAttributes(canonical).HasFlag(FileAttributes.ReparsePoint))
        {
            throw new InvalidOperationException(
                "The Atlas Node executable must be an existing canonical non-link file.");
        }

        return canonical;
    }
}

internal sealed class AtlasProjectionVerifiedProcessHost(
    AtlasProjectionProcessHost inner,
    AtlasProjectionArtifactVerifier verifier) : IAtlasProjectionProcessHost
{
    public async Task<AtlasProjectionProcessResult> ProjectAsync(
        string modulePath,
        string expectedModuleSha256,
        string spatialReadExchangeJson,
        CancellationToken cancellationToken = default)
    {
        AtlasProjectionVerifiedArtifact artifact;
        try
        {
            artifact = verifier.Verify();
        }
        catch (AtlasProjectionArtifactException exception)
        {
            return IdentityFailure(exception.Message);
        }

        if (!string.Equals(modulePath, artifact.ModulePath, AtlasProjectionArtifactVerifier.PathComparison)
            || !string.Equals(
                expectedModuleSha256,
                AtlasProjectionOptions.ExpectedModuleSha256,
                StringComparison.Ordinal))
        {
            return IdentityFailure(
                "Atlas invocation did not request the verified canonical artifact identity.");
        }

        return await inner.ProjectAsync(
                artifact.ModulePath,
                AtlasProjectionOptions.ExpectedModuleSha256,
                spatialReadExchangeJson,
                cancellationToken)
            .ConfigureAwait(false);
    }

    private static AtlasProjectionProcessResult IdentityFailure(string message) => new(
        AtlasProjectionOutcome.Failed,
        AtlasProjectionFailure.RuntimeIdentityMismatch,
        null,
        null,
        null,
        null,
        null,
        null,
        message);
}

internal sealed class AtlasProjectionArtifactVerifier
{
    internal static readonly StringComparison PathComparison = OperatingSystem.IsWindows()
        ? StringComparison.OrdinalIgnoreCase
        : StringComparison.Ordinal;

    private static readonly IReadOnlySet<string> ManifestFields = new HashSet<string>(
        StringComparer.Ordinal)
    {
        "schemaVersion",
        "artifactType",
        "repository",
        "commit",
        "modulePath",
        "moduleFilename",
        "moduleSha256",
        "transport",
    };

    private readonly string _artifactSlot;
    private readonly AtlasProjectionArtifactExpectation _expected;

    public AtlasProjectionArtifactVerifier(string sovereignRoot)
        : this(sovereignRoot, AtlasProjectionArtifactExpectation.Canonical)
    {
    }

    internal AtlasProjectionArtifactVerifier(
        string sovereignRoot,
        AtlasProjectionArtifactExpectation expected)
    {
        if (string.IsNullOrWhiteSpace(sovereignRoot) || !Path.IsPathFullyQualified(sovereignRoot))
        {
            throw new ArgumentException("Sovereign root must be absolute.", nameof(sovereignRoot));
        }

        var canonicalRoot = Path.GetFullPath(sovereignRoot);
        if (!string.Equals(canonicalRoot, sovereignRoot, PathComparison))
        {
            throw new ArgumentException("Sovereign root must already be canonical.", nameof(sovereignRoot));
        }

        _artifactSlot = Path.GetFullPath(Path.Combine(
            canonicalRoot,
            AtlasProjectionOptions.ArtifactSlotRelativePath.Replace('/', Path.DirectorySeparatorChar)));
        _expected = expected;
    }

    public AtlasProjectionVerifiedArtifact Verify()
    {
        try
        {
            RequirePlainDirectory(_artifactSlot, "Atlas artifact slot");
            var entries = Directory.EnumerateFileSystemEntries(_artifactSlot)
                .Select(Path.GetFileName)
                .OrderBy(name => name, StringComparer.Ordinal)
                .ToArray();
            var expectedEntries = new[] { "manifest.json", _expected.ModuleFilename }
                .OrderBy(name => name, StringComparer.Ordinal)
                .ToArray();
            if (!entries.SequenceEqual(expectedEntries, StringComparer.Ordinal))
            {
                throw Fail("Atlas artifact slot must contain exactly the module and manifest.");
            }

            var modulePath = Path.GetFullPath(Path.Combine(_artifactSlot, _expected.ModuleFilename));
            var manifestPath = Path.GetFullPath(Path.Combine(_artifactSlot, "manifest.json"));
            RequirePlainFile(modulePath, "Atlas projection module");
            RequirePlainFile(manifestPath, "Atlas provenance manifest");
            VerifyManifest(manifestPath);

            var moduleInfo = new FileInfo(modulePath);
            if (moduleInfo.Length != _expected.ModuleLength)
            {
                throw Fail(
                    $"Atlas module length mismatch: expected {_expected.ModuleLength}, found {moduleInfo.Length}.");
            }

            using var stream = File.OpenRead(modulePath);
            var measuredHash = Convert.ToHexString(SHA256.HashData(stream)).ToLowerInvariant();
            if (!string.Equals(measuredHash, _expected.ModuleSha256, StringComparison.Ordinal))
            {
                throw Fail(
                    $"Atlas module hash mismatch: expected {_expected.ModuleSha256}, found {measuredHash}.");
            }

            return new AtlasProjectionVerifiedArtifact(
                modulePath,
                manifestPath,
                _expected.Repository,
                _expected.Commit,
                measuredHash,
                moduleInfo.Length);
        }
        catch (AtlasProjectionArtifactException)
        {
            throw;
        }
        catch (Exception exception) when (
            exception is IOException or UnauthorizedAccessException or JsonException)
        {
            throw Fail($"Atlas artifact verification failed closed: {exception.Message}", exception);
        }
    }

    internal static string ResolveSovereignRoot(string contentRoot)
    {
        if (string.IsNullOrWhiteSpace(contentRoot) || !Path.IsPathFullyQualified(contentRoot))
        {
            throw new InvalidOperationException("Atlas runtime content root must be absolute.");
        }

        var current = new DirectoryInfo(Path.GetFullPath(contentRoot));
        while (current is not null)
        {
            if (File.Exists(Path.Combine(current.FullName, "PATH_CANON_REGISTER.md"))
                && File.Exists(Path.Combine(
                    current.FullName,
                    "backend",
                    "src",
                    "TerraFusion.API",
                    "TerraFusion.API.csproj")))
            {
                return current.FullName;
            }

            current = current.Parent;
        }

        throw new InvalidOperationException(
            $"Unable to resolve the sovereign repository root from '{contentRoot}'.");
    }

    private void VerifyManifest(string manifestPath)
    {
        using var document = JsonDocument.Parse(File.ReadAllBytes(manifestPath));
        var root = document.RootElement;
        if (root.ValueKind != JsonValueKind.Object)
        {
            throw Fail("Atlas provenance manifest must be an object.");
        }

        var properties = root.EnumerateObject().ToArray();
        var distinct = properties.Select(property => property.Name)
            .Distinct(StringComparer.Ordinal)
            .ToArray();
        if (properties.Length != ManifestFields.Count
            || distinct.Length != ManifestFields.Count
            || distinct.Any(field => !ManifestFields.Contains(field)))
        {
            throw Fail("Atlas provenance manifest fields did not match the exact schema.");
        }

        if (!root.GetProperty("schemaVersion").TryGetInt32(out var schemaVersion)
            || schemaVersion != 1)
        {
            throw Fail("Atlas provenance manifest schemaVersion must be 1.");
        }

        RequireManifestString(root, "artifactType", _expected.ArtifactType);
        RequireManifestString(root, "repository", _expected.Repository);
        RequireManifestString(root, "commit", _expected.Commit);
        RequireManifestString(root, "modulePath", _expected.ModuleSourcePath);
        RequireManifestString(root, "moduleFilename", _expected.ModuleFilename);
        RequireManifestString(root, "moduleSha256", _expected.ModuleSha256);
        RequireManifestString(root, "transport", _expected.Transport);
    }

    private static void RequireManifestString(JsonElement root, string name, string expected)
    {
        var value = root.GetProperty(name);
        if (value.ValueKind != JsonValueKind.String
            || !string.Equals(value.GetString(), expected, StringComparison.Ordinal))
        {
            throw Fail($"Atlas provenance manifest {name} did not match the canonical identity.");
        }
    }

    private static void RequirePlainDirectory(string path, string label)
    {
        if (!Directory.Exists(path)
            || File.GetAttributes(path).HasFlag(FileAttributes.ReparsePoint))
        {
            throw Fail($"{label} must be an existing non-link directory: {path}");
        }
    }

    private static void RequirePlainFile(string path, string label)
    {
        if (!File.Exists(path)
            || File.GetAttributes(path).HasFlag(FileAttributes.ReparsePoint))
        {
            throw Fail($"{label} must be an existing non-link file: {path}");
        }
    }

    private static AtlasProjectionArtifactException Fail(string message, Exception? inner = null) =>
        new(message, inner);
}

internal sealed record AtlasProjectionArtifactExpectation(
    string ArtifactType,
    string Repository,
    string Commit,
    string ModuleSourcePath,
    string ModuleFilename,
    string ModuleSha256,
    long ModuleLength,
    string Transport)
{
    internal static AtlasProjectionArtifactExpectation Canonical { get; } = new(
        AtlasProjectionOptions.ExpectedArtifactType,
        AtlasProjectionOptions.ExpectedRepository,
        AtlasProjectionOptions.ExpectedCommit,
        AtlasProjectionOptions.ExpectedModulePath,
        AtlasProjectionOptions.ExpectedModuleFilename,
        AtlasProjectionOptions.ExpectedModuleSha256,
        AtlasProjectionOptions.ExpectedModuleLength,
        AtlasProjectionOptions.ExpectedTransport);
}

internal sealed record AtlasProjectionVerifiedArtifact(
    string ModulePath,
    string ManifestPath,
    string Repository,
    string Commit,
    string ModuleSha256,
    long ModuleLength);

internal sealed class AtlasProjectionArtifactException : Exception
{
    public AtlasProjectionArtifactException(string message, Exception? innerException = null)
        : base(message, innerException)
    {
    }
}
