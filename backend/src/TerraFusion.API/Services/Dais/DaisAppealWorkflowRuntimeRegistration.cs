using System.Security.Cryptography;
using System.Text.Json;
using Microsoft.Extensions.Options;
using TerraFusion.API.Configuration;

namespace TerraFusion.API.Services.Dais;

/// <summary>
/// Registers the exact Dais-owned appeal-workflow validator for local Development use.
/// Configuration may select the mode and timeout, but cannot redirect the runtime away
/// from the code-pinned repository, artifact slot, module, schema, or provenance identity.
/// </summary>
public static class DaisAppealWorkflowRuntimeRegistration
{
    public static void AddDaisAppealWorkflowRuntime(
        this IServiceCollection services,
        IConfiguration configuration,
        IHostEnvironment environment)
    {
        ArgumentNullException.ThrowIfNull(services);
        ArgumentNullException.ThrowIfNull(configuration);
        ArgumentNullException.ThrowIfNull(environment);

        var options = configuration
            .GetSection(DaisAppealWorkflowOptions.SectionName)
            .Get<DaisAppealWorkflowOptions>() ?? new DaisAppealWorkflowOptions();

        if (!Enum.IsDefined(options.Mode))
        {
            throw new InvalidOperationException(
                $"Unsupported Dais appeal-workflow mode: {options.Mode}.");
        }
        if (options.TimeoutSeconds is < 1 or > 30)
        {
            throw new InvalidOperationException(
                "Dais appeal-workflow timeout must be between 1 and 30 seconds.");
        }

        if (options.Mode == DaisAppealWorkflowMode.Disabled)
        {
            services.AddSingleton<IOptions<DaisAppealWorkflowOptions>>(Options.Create(options));
            return;
        }

        if (!environment.IsDevelopment())
        {
            throw new InvalidOperationException(
                "Dais LocalExact selection is restricted to the Development environment.");
        }

        // Published Development images do not contain the sovereign source-tree markers,
        // Node, or the ignored OS-managed artifact slot. Persisted LocalExact selection is
        // effective only in a capable sovereign source checkout; published hosts downgrade.
        if (!DaisAppealWorkflowArtifactVerifier.TryResolveSovereignRoot(
                environment.ContentRootPath,
                out var sovereignRoot))
        {
            options.Mode = DaisAppealWorkflowMode.Disabled;
            services.AddSingleton<IOptions<DaisAppealWorkflowOptions>>(Options.Create(options));
            return;
        }

        AddLocalExactRuntime(
            services,
            options,
            new DaisAppealWorkflowArtifactVerifier(sovereignRoot),
            ResolveNodeExecutablePath());
    }

    internal static void AddLocalExactRuntime(
        IServiceCollection services,
        DaisAppealWorkflowOptions options,
        DaisAppealWorkflowArtifactVerifier verifier,
        string nodeExecutablePath)
    {
        ArgumentNullException.ThrowIfNull(services);
        ArgumentNullException.ThrowIfNull(options);
        ArgumentNullException.ThrowIfNull(verifier);

        var artifact = verifier.Verify();
        options.ModulePath = artifact.ModulePath;
        options.SchemaPath = artifact.SchemaPath;
        options.NodeExecutablePath = RequireCanonicalExecutable(nodeExecutablePath);

        services.AddSingleton<IOptions<DaisAppealWorkflowOptions>>(Options.Create(options));
        services.AddSingleton(verifier);
        services.AddSingleton(provider => new DaisAppealWorkflowProcessHost(
            provider.GetRequiredService<IOptions<DaisAppealWorkflowOptions>>()
                .Value.NodeExecutablePath,
            TimeSpan.FromSeconds(
                provider.GetRequiredService<IOptions<DaisAppealWorkflowOptions>>()
                    .Value.TimeoutSeconds)));
        services.AddSingleton<IDaisAppealWorkflowProcessHost>(provider =>
            new DaisAppealWorkflowVerifiedProcessHost(
                provider.GetRequiredService<DaisAppealWorkflowProcessHost>(),
                provider.GetRequiredService<DaisAppealWorkflowArtifactVerifier>()));
        services.AddScoped<IDaisAppealWorkflowConsumer, DaisAppealWorkflowConsumer>();
    }

    internal static string ResolveNodeExecutablePath(string? searchPath = null)
    {
        var path = searchPath ?? Environment.GetEnvironmentVariable("PATH");
        if (string.IsNullOrWhiteSpace(path))
        {
            throw new InvalidOperationException(
                "PATH is unavailable; the exact Dais runtime cannot resolve Node.");
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
            throw new InvalidOperationException("The Dais Node executable path must be absolute.");
        }

        var canonical = Path.GetFullPath(path);
        if (!string.Equals(canonical, path, DaisAppealWorkflowArtifactVerifier.PathComparison)
            || !File.Exists(canonical)
            || File.GetAttributes(canonical).HasFlag(FileAttributes.ReparsePoint))
        {
            throw new InvalidOperationException(
                "The Dais Node executable must be an existing canonical non-link file.");
        }

        return canonical;
    }
}

internal sealed class DaisAppealWorkflowVerifiedProcessHost(
    DaisAppealWorkflowProcessHost inner,
    DaisAppealWorkflowArtifactVerifier verifier) : IDaisAppealWorkflowProcessHost
{
    public async Task<DaisAppealWorkflowProcessResult> ValidateAsync(
        string modulePath,
        string expectedModuleSha256,
        string schemaPath,
        string expectedSchemaSha256,
        string appealWorkflowExchangeJson,
        CancellationToken cancellationToken = default)
    {
        DaisAppealWorkflowVerifiedArtifact artifact;
        try
        {
            artifact = verifier.Verify();
        }
        catch (DaisAppealWorkflowArtifactException exception)
        {
            return IdentityFailure(exception.Message);
        }

        if (!string.Equals(
                modulePath,
                artifact.ModulePath,
                DaisAppealWorkflowArtifactVerifier.PathComparison)
            || !string.Equals(
                schemaPath,
                artifact.SchemaPath,
                DaisAppealWorkflowArtifactVerifier.PathComparison)
            || !string.Equals(
                expectedModuleSha256,
                DaisAppealWorkflowOptions.ExpectedModuleSha256,
                StringComparison.Ordinal)
            || !string.Equals(
                expectedSchemaSha256,
                DaisAppealWorkflowOptions.ExpectedSchemaSha256,
                StringComparison.Ordinal))
        {
            return IdentityFailure(
                "Dais invocation did not request the verified canonical artifact identity.");
        }

        return await inner.ValidateAsync(
                artifact.ModulePath,
                DaisAppealWorkflowOptions.ExpectedModuleSha256,
                artifact.SchemaPath,
                DaisAppealWorkflowOptions.ExpectedSchemaSha256,
                appealWorkflowExchangeJson,
                cancellationToken)
            .ConfigureAwait(false);
    }

    private static DaisAppealWorkflowProcessResult IdentityFailure(string message) => new(
        DaisAppealWorkflowOutcome.Failed,
        DaisAppealWorkflowFailure.RuntimeIdentityMismatch,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        message);
}

internal sealed class DaisAppealWorkflowArtifactVerifier
{
    internal static readonly StringComparison PathComparison = OperatingSystem.IsWindows()
        ? StringComparison.OrdinalIgnoreCase
        : StringComparison.Ordinal;

    private static readonly IReadOnlySet<string> ManifestFields = new HashSet<string>(
        StringComparer.Ordinal)
    {
        "schemaVersion",
        "artifactType",
        "contract",
        "repository",
        "sourceBranch",
        "commit",
        "modulePath",
        "moduleFilename",
        "moduleLength",
        "moduleSha256",
        "schemaPath",
        "schemaFilename",
        "schemaLength",
        "schemaSha256",
        "sourceManifestPath",
        "sourceManifestSha256",
        "contractSourceSha",
        "sourceDtoSha256",
        "transport",
    };

    private readonly string _sovereignRoot;
    private readonly string _artifactSlot;
    private readonly DaisAppealWorkflowArtifactExpectation _expected;

    public DaisAppealWorkflowArtifactVerifier(string sovereignRoot)
        : this(sovereignRoot, DaisAppealWorkflowArtifactExpectation.Canonical)
    {
    }

    internal DaisAppealWorkflowArtifactVerifier(
        string sovereignRoot,
        DaisAppealWorkflowArtifactExpectation expected)
    {
        if (string.IsNullOrWhiteSpace(sovereignRoot)
            || !Path.IsPathFullyQualified(sovereignRoot))
        {
            throw new ArgumentException("Sovereign root must be absolute.", nameof(sovereignRoot));
        }

        var canonicalRoot = Path.GetFullPath(sovereignRoot);
        if (!string.Equals(canonicalRoot, sovereignRoot, PathComparison))
        {
            throw new ArgumentException(
                "Sovereign root must already be canonical.",
                nameof(sovereignRoot));
        }

        _sovereignRoot = canonicalRoot;
        _artifactSlot = Path.GetFullPath(Path.Combine(
            canonicalRoot,
            expected.ArtifactSlotRelativePath.Replace(
                '/',
                Path.DirectorySeparatorChar)));
        _expected = expected;
    }

    public DaisAppealWorkflowVerifiedArtifact Verify()
    {
        try
        {
            RequirePlainDirectoryChain(_sovereignRoot, _artifactSlot);
            var entries = Directory.EnumerateFileSystemEntries(_artifactSlot)
                .Select(Path.GetFileName)
                .OrderBy(name => name, StringComparer.Ordinal)
                .ToArray();
            var expectedEntries = new[]
                {
                    "manifest.json",
                    _expected.ModuleFilename,
                    _expected.SchemaFilename,
                }
                .OrderBy(name => name, StringComparer.Ordinal)
                .ToArray();
            if (!entries.SequenceEqual(expectedEntries, StringComparer.Ordinal))
            {
                throw Fail(
                    "Dais artifact slot must contain exactly the module, schema, and manifest.");
            }

            var modulePath = Path.GetFullPath(Path.Combine(
                _artifactSlot,
                _expected.ModuleFilename));
            var schemaPath = Path.GetFullPath(Path.Combine(
                _artifactSlot,
                _expected.SchemaFilename));
            var manifestPath = Path.GetFullPath(Path.Combine(_artifactSlot, "manifest.json"));
            RequirePlainFile(modulePath, "Dais appeal-workflow module");
            RequirePlainFile(schemaPath, "Dais appeal-workflow schema");
            RequirePlainFile(manifestPath, "Dais provenance manifest");
            var manifestIdentity = VerifyFileIdentity(
                manifestPath,
                "Dais published manifest",
                _expected.PublishedManifestLength,
                _expected.PublishedManifestSha256);
            VerifyManifest(manifestPath);

            var moduleIdentity = VerifyFileIdentity(
                modulePath,
                "Dais module",
                _expected.ModuleLength,
                _expected.ModuleSha256);
            var schemaIdentity = VerifyFileIdentity(
                schemaPath,
                "Dais schema",
                _expected.SchemaLength,
                _expected.SchemaSha256);

            return new DaisAppealWorkflowVerifiedArtifact(
                modulePath,
                schemaPath,
                manifestPath,
                _expected.Repository,
                _expected.Commit,
                manifestIdentity.Hash,
                manifestIdentity.Length,
                moduleIdentity.Hash,
                moduleIdentity.Length,
                schemaIdentity.Hash,
                schemaIdentity.Length);
        }
        catch (DaisAppealWorkflowArtifactException)
        {
            throw;
        }
        catch (Exception exception) when (
            exception is IOException or UnauthorizedAccessException or JsonException)
        {
            throw Fail(
                $"Dais artifact verification failed closed: {exception.Message}",
                exception);
        }
    }

    internal static string ResolveSovereignRoot(string contentRoot)
    {
        if (TryResolveSovereignRoot(contentRoot, out var sovereignRoot))
        {
            return sovereignRoot;
        }

        throw new InvalidOperationException(
            $"Unable to resolve the sovereign repository root from '{contentRoot}'.");
    }

    internal static bool TryResolveSovereignRoot(string contentRoot, out string sovereignRoot)
    {
        sovereignRoot = string.Empty;
        if (string.IsNullOrWhiteSpace(contentRoot) || !Path.IsPathFullyQualified(contentRoot))
        {
            return false;
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
                sovereignRoot = current.FullName;
                return true;
            }

            current = current.Parent;
        }

        return false;
    }

    private static (string Hash, long Length) VerifyFileIdentity(
        string path,
        string label,
        long expectedLength,
        string expectedHash)
    {
        var info = new FileInfo(path);
        if (info.Length != expectedLength)
        {
            throw Fail(
                $"{label} length mismatch: expected {expectedLength}, found {info.Length}.");
        }

        using var stream = File.OpenRead(path);
        var measuredHash = Convert.ToHexString(SHA256.HashData(stream)).ToLowerInvariant();
        if (!string.Equals(measuredHash, expectedHash, StringComparison.Ordinal))
        {
            throw Fail(
                $"{label} hash mismatch: expected {expectedHash}, found {measuredHash}.");
        }

        return (measuredHash, info.Length);
    }

    private void VerifyManifest(string manifestPath)
    {
        using var document = JsonDocument.Parse(File.ReadAllBytes(manifestPath));
        var root = document.RootElement;
        if (root.ValueKind != JsonValueKind.Object)
        {
            throw Fail("Dais provenance manifest must be an object.");
        }

        var properties = root.EnumerateObject().ToArray();
        var distinct = properties.Select(property => property.Name)
            .Distinct(StringComparer.Ordinal)
            .ToArray();
        var expectedFields = new HashSet<string>(ManifestFields, StringComparer.Ordinal);
        if (_expected.ModuleGitBlob is not null)
        {
            expectedFields.UnionWith(
                [
                    "moduleGitBlob",
                    "schemaGitBlob",
                    "sourceManifestLength",
                    "sourceManifestGitBlob",
                    "contractReviewedHeadSha",
                ]);
        }
        if (properties.Length != expectedFields.Count
            || distinct.Length != expectedFields.Count
            || distinct.Any(field => !expectedFields.Contains(field)))
        {
            throw Fail("Dais provenance manifest fields did not match the exact schema.");
        }

        RequireManifestInteger(root, "schemaVersion", 1);
        RequireManifestString(root, "artifactType", _expected.ArtifactType);
        RequireManifestString(root, "contract", _expected.Contract);
        RequireManifestString(root, "repository", _expected.Repository);
        RequireManifestString(root, "sourceBranch", _expected.SourceBranch);
        RequireManifestString(root, "commit", _expected.Commit);
        RequireManifestString(root, "modulePath", _expected.ModuleSourcePath);
        RequireManifestString(root, "moduleFilename", _expected.ModuleFilename);
        RequireManifestInteger(root, "moduleLength", _expected.ModuleLength);
        RequireManifestString(root, "moduleSha256", _expected.ModuleSha256);
        RequireManifestString(root, "schemaPath", _expected.SchemaSourcePath);
        RequireManifestString(root, "schemaFilename", _expected.SchemaFilename);
        RequireManifestInteger(root, "schemaLength", _expected.SchemaLength);
        RequireManifestString(root, "schemaSha256", _expected.SchemaSha256);
        RequireManifestString(root, "sourceManifestPath", _expected.SourceManifestPath);
        RequireManifestString(root, "sourceManifestSha256", _expected.SourceManifestSha256);
        RequireManifestString(root, "contractSourceSha", _expected.ContractSourceSha);
        RequireManifestString(root, "sourceDtoSha256", _expected.SourceDtoSha256);
        RequireManifestString(root, "transport", _expected.Transport);
        if (_expected.ModuleGitBlob is not null)
        {
            RequireManifestString(root, "moduleGitBlob", _expected.ModuleGitBlob);
            RequireManifestString(root, "schemaGitBlob", _expected.SchemaGitBlob!);
            RequireManifestInteger(
                root,
                "sourceManifestLength",
                _expected.SourceManifestLength!.Value);
            RequireManifestString(
                root,
                "sourceManifestGitBlob",
                _expected.SourceManifestGitBlob!);
            RequireManifestString(
                root,
                "contractReviewedHeadSha",
                _expected.ContractReviewedHeadSha!);
        }
    }

    private static void RequireManifestString(JsonElement root, string name, string expected)
    {
        var value = root.GetProperty(name);
        if (value.ValueKind != JsonValueKind.String
            || !string.Equals(value.GetString(), expected, StringComparison.Ordinal))
        {
            throw Fail(
                $"Dais provenance manifest {name} did not match the canonical identity.");
        }
    }

    private static void RequireManifestInteger(JsonElement root, string name, long expected)
    {
        var value = root.GetProperty(name);
        if (value.ValueKind != JsonValueKind.Number
            || !value.TryGetInt64(out var actual)
            || actual != expected
            || !string.Equals(
                value.GetRawText(),
                expected.ToString(System.Globalization.CultureInfo.InvariantCulture),
                StringComparison.Ordinal))
        {
            throw Fail(
                $"Dais provenance manifest {name} did not match the canonical integer identity.");
        }
    }

    private static void RequirePlainDirectory(string path, string label)
    {
        var info = new DirectoryInfo(path);
        if (!info.Exists || IsLink(info))
        {
            throw Fail($"{label} must be an existing non-link directory: {path}");
        }
    }

    private static void RequirePlainDirectoryChain(string root, string directory)
    {
        var relative = Path.GetRelativePath(root, directory);
        if (Path.IsPathRooted(relative)
            || string.Equals(relative, "..", StringComparison.Ordinal)
            || relative.StartsWith(
                $"..{Path.DirectorySeparatorChar}",
                StringComparison.Ordinal))
        {
            throw Fail($"Dais artifact slot escaped the sovereign root: {directory}");
        }

        var current = root;
        RequirePlainDirectory(current, "Dais sovereign root");
        if (string.Equals(relative, ".", StringComparison.Ordinal))
        {
            return;
        }

        foreach (var component in relative.Split(
                     new[] { Path.DirectorySeparatorChar, Path.AltDirectorySeparatorChar },
                     StringSplitOptions.RemoveEmptyEntries))
        {
            current = Path.Combine(current, component);
            RequirePlainDirectory(current, "Dais artifact path component");
        }
    }

    private static void RequirePlainFile(string path, string label)
    {
        var info = new FileInfo(path);
        if (!info.Exists || IsLink(info))
        {
            throw Fail($"{label} must be an existing non-link file: {path}");
        }
    }

    private static bool IsLink(FileSystemInfo info) =>
        info.Attributes.HasFlag(FileAttributes.ReparsePoint)
        || info.LinkTarget is not null;

    private static DaisAppealWorkflowArtifactException Fail(
        string message,
        Exception? inner = null) => new(message, inner);
}

internal sealed record DaisAppealWorkflowArtifactExpectation(
    string ArtifactType,
    string Contract,
    string Repository,
    string SourceBranch,
    string Commit,
    string ModuleSourcePath,
    string ModuleFilename,
    string ModuleSha256,
    long ModuleLength,
    string SchemaSourcePath,
    string SchemaFilename,
    string SchemaSha256,
    long SchemaLength,
    string SourceManifestPath,
    string SourceManifestSha256,
    string PublishedManifestSha256,
    long PublishedManifestLength,
    string ContractSourceSha,
    string SourceDtoSha256,
    string Transport,
    string ArtifactSlotRelativePath,
    string? ModuleGitBlob = null,
    string? SchemaGitBlob = null,
    long? SourceManifestLength = null,
    string? SourceManifestGitBlob = null,
    string? ContractReviewedHeadSha = null)
{
    internal static DaisAppealWorkflowArtifactExpectation Canonical { get; } = new(
        DaisAppealWorkflowOptions.ExpectedArtifactType,
        DaisAppealWorkflowOptions.ExpectedContract,
        DaisAppealWorkflowOptions.ExpectedRepository,
        DaisAppealWorkflowOptions.ExpectedSourceBranch,
        DaisAppealWorkflowOptions.ExpectedCommit,
        DaisAppealWorkflowOptions.ExpectedModulePath,
        DaisAppealWorkflowOptions.ExpectedModuleFilename,
        DaisAppealWorkflowOptions.ExpectedModuleSha256,
        DaisAppealWorkflowOptions.ExpectedModuleLength,
        DaisAppealWorkflowOptions.ExpectedSchemaPath,
        DaisAppealWorkflowOptions.ExpectedSchemaFilename,
        DaisAppealWorkflowOptions.ExpectedSchemaSha256,
        DaisAppealWorkflowOptions.ExpectedSchemaLength,
        DaisAppealWorkflowOptions.ExpectedSourceManifestPath,
        DaisAppealWorkflowOptions.ExpectedSourceManifestSha256,
        DaisAppealWorkflowOptions.ExpectedPublishedManifestSha256,
        DaisAppealWorkflowOptions.ExpectedPublishedManifestLength,
        DaisAppealWorkflowOptions.ExpectedContractSourceSha,
        DaisAppealWorkflowOptions.ExpectedSourceDtoSha256,
        DaisAppealWorkflowOptions.ExpectedTransport,
        DaisAppealWorkflowOptions.ArtifactSlotRelativePath);
}

internal sealed record DaisAppealWorkflowVerifiedArtifact(
    string ModulePath,
    string SchemaPath,
    string ManifestPath,
    string Repository,
    string Commit,
    string ManifestSha256,
    long ManifestLength,
    string ModuleSha256,
    long ModuleLength,
    string SchemaSha256,
    long SchemaLength);

internal sealed class DaisAppealWorkflowArtifactException : Exception
{
    public DaisAppealWorkflowArtifactException(
        string message,
        Exception? innerException = null)
        : base(message, innerException)
    {
    }
}
