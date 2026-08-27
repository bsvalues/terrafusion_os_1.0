using System.Diagnostics;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using FluentAssertions;
using TerraFusion.API.Services.Dossier;
using Xunit;

namespace TerraFusion.Unit.Tests.Dossier;

public sealed class ExactDossierEvidenceRegistryReadHostFactAttribute : FactAttribute
{
    public ExactDossierEvidenceRegistryReadHostFactAttribute()
    {
        if (string.IsNullOrWhiteSpace(
                Environment.GetEnvironmentVariable("TERRAFUSION_DOSSIER_HOST_MODULE_PATH")) ||
            string.IsNullOrWhiteSpace(
                Environment.GetEnvironmentVariable("TERRAFUSION_DOSSIER_HOST_SCHEMA_PATH")))
        {
            Skip = "Exact Dossier host proof requires module and schema paths.";
        }
    }
}

public sealed class DossierEvidenceRegistryReadProcessHostTests
{
    private const string ExpectedModuleSha256 =
        "bb0427d6634412d86be92a2ef5f6f0bfcdf97ee054887a42d59c2a0bc0127a8b";
    private const string ExpectedSchemaSha256 =
        "f658bc2bda718f58bd0353e9635524d5dbd376be515b543da3442b0094e52270";
    private const string CountyId = "11111111-2222-3333-4444-555555555555";
    private const string ParcelId = "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee";

    [Theory]
    [InlineData("v20.20.2", "--experimental-permission")]
    [InlineData("v21.7.3", "--experimental-permission")]
    [InlineData("v22.12.0", "--experimental-permission")]
    [InlineData("v22.13.0", "--permission")]
    [InlineData("v23.4.0", "--experimental-permission")]
    [InlineData("v23.5.0", "--permission")]
    [InlineData("v24.19.0", "--permission")]
    public void PermissionFlagForVersion_SelectsSupportedFailClosedMode(
        string nodeVersion,
        string expected)
    {
        DossierEvidenceRegistryReadProcessHost.PermissionFlagForVersion(nodeVersion).Should().Be(expected);
    }

    [Theory]
    [InlineData("")]
    [InlineData("not-a-version")]
    [InlineData("v18.20.8")]
    public void PermissionFlagForVersion_RejectsUnsupportedRuntime(string nodeVersion)
    {
        var action = () => DossierEvidenceRegistryReadProcessHost.PermissionFlagForVersion(nodeVersion);

        action.Should().Throw<ArgumentException>()
            .WithMessage("*Node 20 or newer*");
    }

    [ExactDossierEvidenceRegistryReadHostFact]
    public async Task ExactModuleAndSchema_AcceptWithExactProvenanceAndIdentity()
    {
        using var scope = new TestScope();
        var result = await scope.Host.ValidateAsync(
            RequireExactModule(),
            ExpectedModuleSha256,
            RequireExactSchema(),
            ExpectedSchemaSha256,
            EmptyEvidenceExchange());

        result.Success.Should().BeTrue(result.ErrorMessage);
        result.Outcome.Should().Be(DossierEvidenceRegistryReadOutcome.Accepted);
        result.SourceModuleSha256.Should().Be(ExpectedModuleSha256);
        result.CopiedModuleSha256.Should().Be(ExpectedModuleSha256);
        result.SourceSchemaSha256.Should().Be(ExpectedSchemaSha256);
        result.CopiedSchemaSha256.Should().Be(ExpectedSchemaSha256);
        result.RequestCountyId.Should().Be(CountyId);
        result.ResultCountyId.Should().Be(CountyId);
        result.NormalizedExchangeJson.Should().Be(CanonicalEmptyEvidenceExchange());
        result.Violations.Should().BeEmpty();
        scope.AssertClean();
    }

    [ExactDossierEvidenceRegistryReadHostFact]
    public async Task ExactModuleAndSchema_RejectCountyMismatchWithTypedViolation()
    {
        using var scope = new TestScope();
        var exchange = EmptyEvidenceExchange().Replace(
            $"\"countyId\":\"{CountyId}\",\"parcelId\"",
            "\"countyId\":\"22222222-3333-4444-5555-666666666666\",\"parcelId\"",
            StringComparison.Ordinal);
        var result = await scope.Host.ValidateAsync(
            RequireExactModule(),
            ExpectedModuleSha256,
            RequireExactSchema(),
            ExpectedSchemaSha256,
            exchange);

        result.Success.Should().BeTrue(result.ErrorMessage);
        result.Outcome.Should().Be(DossierEvidenceRegistryReadOutcome.Rejected);
        result.NormalizedExchangeJson.Should().BeNull();
        result.Violations.Should().ContainSingle(violation =>
            violation.Class == "COUNTY_MISMATCH");
        scope.AssertClean();
    }

    [Fact]
    public async Task ExactFunctions_AcceptAndNormalizeWithoutMutation()
    {
        using var scope = new TestScope();
        var module = scope.CreateModule(ExactModuleSource("return [];"));
        var schema = scope.CreateSchema("{}");

        var first = await scope.Host.ValidateAsync(
            module, Hash(module), schema, Hash(schema), EmptyEvidenceExchange());
        var second = await scope.Host.ValidateAsync(
            module, Hash(module), schema, Hash(schema), EmptyEvidenceExchange());

        first.Outcome.Should().Be(DossierEvidenceRegistryReadOutcome.Accepted);
        first.NormalizedExchangeJson.Should().Be(CanonicalEmptyEvidenceExchange());
        first.NormalizedExchangeJson.Should().Be(second.NormalizedExchangeJson);
        first.RequestCountyId.Should().Be(CountyId);
        first.ResultCountyId.Should().Be(CountyId);
        first.SourceModuleSha256.Should().Be(Hash(module));
        first.CopiedModuleSha256.Should().Be(Hash(module));
        first.SourceSchemaSha256.Should().Be(Hash(schema));
        first.CopiedSchemaSha256.Should().Be(Hash(schema));
        scope.AssertClean();
    }

    [Fact]
    public async Task TypedViolations_ReturnRejectedOutcome()
    {
        using var scope = new TestScope();
        var module = scope.CreateModule(ExactModuleSource(
            "return [{class:'INTEGRITY_INVALID',message:'integrity is invalid'}];"));
        var schema = scope.CreateSchema("{}");

        var result = await scope.Host.ValidateAsync(
            module, Hash(module), schema, Hash(schema), EmptyEvidenceExchange());

        result.Success.Should().BeTrue(result.ErrorMessage);
        result.Outcome.Should().Be(DossierEvidenceRegistryReadOutcome.Rejected);
        result.NormalizedExchangeJson.Should().BeNull();
        result.Violations.Should().Equal(
            new DossierEvidenceRegistryReadViolation(
                "INTEGRITY_INVALID",
                "integrity is invalid"));
        scope.AssertClean();
    }

    [Fact]
    public async Task MissingArtifacts_FailClosed()
    {
        using var scope = new TestScope();
        var module = scope.CreateModule(ExactModuleSource("return [];"));
        var schema = scope.CreateSchema("{}");

        var missingModule = await scope.Host.ValidateAsync(
            Path.Combine(scope.Root, "missing.mjs"),
            new string('0', 64),
            schema,
            Hash(schema),
            EmptyEvidenceExchange());
        var missingSchema = await scope.Host.ValidateAsync(
            module,
            Hash(module),
            Path.Combine(scope.Root, "missing.json"),
            new string('0', 64),
            EmptyEvidenceExchange());

        missingModule.Failure.Should().Be(DossierEvidenceRegistryReadFailure.ModuleNotFound);
        missingSchema.Failure.Should().Be(DossierEvidenceRegistryReadFailure.SchemaNotFound);
        scope.AssertClean();
    }

    [Fact]
    public async Task RelativeAndNonCanonicalPaths_FailClosed()
    {
        using var scope = new TestScope();
        var module = scope.CreateModule(ExactModuleSource("return [];"));
        var schema = scope.CreateSchema("{}");
        var relativeModule = await scope.Host.ValidateAsync(
            "module.mjs", Hash(module), schema, Hash(schema), EmptyEvidenceExchange());
        var nonCanonicalSchema = await scope.Host.ValidateAsync(
            module,
            Hash(module),
            Path.Combine(scope.Root, ".", Path.GetFileName(schema)),
            Hash(schema),
            EmptyEvidenceExchange());

        relativeModule.Failure.Should().Be(DossierEvidenceRegistryReadFailure.InvalidModulePath);
        nonCanonicalSchema.Failure.Should().Be(DossierEvidenceRegistryReadFailure.InvalidSchemaPath);
        scope.AssertClean();
    }

    [Fact]
    public async Task UnsupportedArtifactTypes_FailClosed()
    {
        using var scope = new TestScope();
        var module = scope.CreateFile("module.js", ExactModuleSource("return [];"));
        var schema = scope.CreateFile("schema.txt", "{}");
        var moduleResult = await scope.Host.ValidateAsync(
            module, Hash(module), scope.CreateSchema("{}"), new string('0', 64), EmptyEvidenceExchange());
        var validModule = scope.CreateModule(ExactModuleSource("return [];"));
        var schemaResult = await scope.Host.ValidateAsync(
            validModule, Hash(validModule), schema, Hash(schema), EmptyEvidenceExchange());

        moduleResult.Failure.Should().Be(DossierEvidenceRegistryReadFailure.UnsupportedModuleType);
        schemaResult.Failure.Should().Be(DossierEvidenceRegistryReadFailure.UnsupportedSchemaType);
        scope.AssertClean();
    }

    [Fact]
    public async Task InvalidExpectedHashes_FailClosed()
    {
        using var scope = new TestScope();
        var module = scope.CreateModule(ExactModuleSource("return [];"));
        var schema = scope.CreateSchema("{}");
        var badModule = await scope.Host.ValidateAsync(
            module, "not-a-hash", schema, Hash(schema), EmptyEvidenceExchange());
        var badSchema = await scope.Host.ValidateAsync(
            module, Hash(module), schema, "not-a-hash", EmptyEvidenceExchange());

        badModule.Failure.Should().Be(DossierEvidenceRegistryReadFailure.InvalidExpectedHash);
        badSchema.Failure.Should().Be(DossierEvidenceRegistryReadFailure.InvalidExpectedHash);
        scope.AssertClean();
    }

    [Fact]
    public async Task SourceHashMismatches_FailBeforeCopyExecution()
    {
        using var scope = new TestScope();
        var module = scope.CreateModule(ExactModuleSource("return [];"));
        var schema = scope.CreateSchema("{}");
        var moduleResult = await scope.Host.ValidateAsync(
            module, new string('0', 64), schema, Hash(schema), EmptyEvidenceExchange());
        var schemaResult = await scope.Host.ValidateAsync(
            module, Hash(module), schema, new string('0', 64), EmptyEvidenceExchange());

        moduleResult.Failure.Should().Be(DossierEvidenceRegistryReadFailure.SourceModuleHashMismatch);
        schemaResult.Failure.Should().Be(DossierEvidenceRegistryReadFailure.SourceSchemaHashMismatch);
        scope.AssertClean();
    }

    [Fact]
    public async Task CopiedModuleHashMismatch_FailsBeforeProcessCreation()
    {
        using var scope = new TestScope(
            afterModuleCopy: (path, _) => File.AppendAllTextAsync(path, "\n// tampered\n"));
        var module = scope.CreateModule(ExactModuleSource("return [];"));
        var schema = scope.CreateSchema("{}");

        var result = await scope.Host.ValidateAsync(
            module, Hash(module), schema, Hash(schema), EmptyEvidenceExchange());

        result.Failure.Should().Be(DossierEvidenceRegistryReadFailure.CopiedModuleHashMismatch);
        scope.AssertClean();
    }

    [Fact]
    public async Task CopiedSchemaHashMismatch_FailsBeforeProcessCreation()
    {
        using var scope = new TestScope(
            afterSchemaCopy: (path, _) => File.AppendAllTextAsync(path, " "));
        var module = scope.CreateModule(ExactModuleSource("return [];"));
        var schema = scope.CreateSchema("{}");

        var result = await scope.Host.ValidateAsync(
            module, Hash(module), schema, Hash(schema), EmptyEvidenceExchange());

        result.Failure.Should().Be(DossierEvidenceRegistryReadFailure.CopiedSchemaHashMismatch);
        scope.AssertClean();
    }

    [Fact]
    public async Task MalformedAndDuplicateExchange_FailClosed()
    {
        using var scope = new TestScope();
        var module = scope.CreateModule(ExactModuleSource("return [];"));
        var schema = scope.CreateSchema("{}");
        var malformed = await scope.Host.ValidateAsync(
            module, Hash(module), schema, Hash(schema), "{not-json");
        var duplicate = await scope.Host.ValidateAsync(
            module,
            Hash(module),
            schema,
            Hash(schema),
            "{\"request\":{\"countyId\":\"a\",\"countyId\":\"b\"},\"result\":{\"countyId\":\"b\"}}");

        malformed.Failure.Should().Be(DossierEvidenceRegistryReadFailure.InvalidExchange);
        duplicate.Failure.Should().Be(DossierEvidenceRegistryReadFailure.InvalidExchange);
        scope.AssertClean();
    }

    [Fact]
    public async Task OversizedInput_FailsClosed()
    {
        using var scope = new TestScope();
        var module = scope.CreateModule(ExactModuleSource("return [];"));
        var schema = scope.CreateSchema("{}");
        var oversized = "{\"request\":{\"countyId\":\"" + CountyId +
            "\"},\"result\":{\"countyId\":\"" + CountyId +
            "\",\"padding\":\"" + new string('x', DossierEvidenceRegistryReadProcessHost.MaximumInputBytes) +
            "\"}}";

        var result = await scope.Host.ValidateAsync(
            module, Hash(module), schema, Hash(schema), oversized);

        result.Failure.Should().Be(DossierEvidenceRegistryReadFailure.InputTooLarge);
        scope.AssertClean();
    }

    [Theory]
    [InlineData(
        "process.stdout.write('not-json'); return [];",
        DossierEvidenceRegistryReadFailure.InvalidOutput)]
    [InlineData(
        "return [{class:'SCHEMA'}];",
        DossierEvidenceRegistryReadFailure.InvalidOutput)]
    [InlineData(
        "return [{class:'SCHEMA',message:'invalid',extra:true}];",
        DossierEvidenceRegistryReadFailure.InvalidOutput)]
    [InlineData(
        "exchange.request.countyId='wrong'; return [];",
        DossierEvidenceRegistryReadFailure.IdentityMismatch)]
    public async Task InvalidOrIdentityChangingOutput_FailsClosed(
        string validationBody,
        DossierEvidenceRegistryReadFailure expectedFailure)
    {
        using var scope = new TestScope();
        var module = scope.CreateModule(ExactModuleSource(validationBody));
        var schema = scope.CreateSchema("{}");

        var result = await scope.Host.ValidateAsync(
            module, Hash(module), schema, Hash(schema), EmptyEvidenceExchange());

        result.Failure.Should().Be(expectedFailure);
        scope.AssertClean();
    }

    [Fact]
    public async Task MissingRequiredExactFunction_FailsClosed()
    {
        using var scope = new TestScope();
        var module = scope.CreateModule("export function validateDossierExchange(){return [];}");
        var schema = scope.CreateSchema("{}");

        var result = await scope.Host.ValidateAsync(
            module, Hash(module), schema, Hash(schema), EmptyEvidenceExchange());

        result.Failure.Should().Be(DossierEvidenceRegistryReadFailure.NonZeroExit);
        scope.AssertClean();
    }

    [Theory]
    [InlineData("import net from 'node:net'; export function validateDossierExchange(){net.connect(9,'127.0.0.1');return [];} export function normalizeJson(v){return JSON.stringify(v);}")]
    [InlineData("import dns from 'node:dns'; export async function validateDossierExchange(){await dns.promises.lookup('localhost');return [];} export function normalizeJson(v){return JSON.stringify(v);}")]
    public async Task NetworkAttempt_FailsClosed(string moduleSource)
    {
        using var scope = new TestScope();
        var module = scope.CreateModule(moduleSource);
        var schema = scope.CreateSchema("{}");

        var result = await scope.Host.ValidateAsync(
            module, Hash(module), schema, Hash(schema), EmptyEvidenceExchange());

        result.Failure.Should().Be(DossierEvidenceRegistryReadFailure.NonZeroExit);
        scope.AssertClean();
    }

    [Theory]
    [InlineData("import fs from 'node:fs'; export function validateDossierExchange(){fs.readFileSync(process.execPath);return [];} export function normalizeJson(v){return JSON.stringify(v);}")]
    [InlineData("import fs from 'node:fs'; export function validateDossierExchange(){fs.writeFileSync(new URL('./owned',import.meta.url),'x');return [];} export function normalizeJson(v){return JSON.stringify(v);}")]
    public async Task FilesystemEscapeOrWriteAttempt_FailsClosed(string moduleSource)
    {
        using var scope = new TestScope();
        var module = scope.CreateModule(moduleSource);
        var schema = scope.CreateSchema("{}");

        var result = await scope.Host.ValidateAsync(
            module, Hash(module), schema, Hash(schema), EmptyEvidenceExchange());

        result.Failure.Should().Be(DossierEvidenceRegistryReadFailure.NonZeroExit);
        scope.AssertClean();
    }

    [Fact]
    public async Task Timeout_KillsProcessTreeAndCleansInvocation()
    {
        using var scope = new TestScope(timeout: TimeSpan.FromMilliseconds(300));
        var module = scope.CreateModule(ExactModuleSource(
            "await new Promise(resolve=>setTimeout(resolve,60000)); return [];",
            asyncValidation: true));
        var schema = scope.CreateSchema("{}");

        var result = await scope.Host.ValidateAsync(
            module, Hash(module), schema, Hash(schema), EmptyEvidenceExchange());

        result.Failure.Should().Be(DossierEvidenceRegistryReadFailure.Timeout);
        scope.AssertClean();
    }

    [Fact]
    public async Task Cancellation_KillsProcessTreeAndCleansInvocation()
    {
        using var scope = new TestScope(timeout: TimeSpan.FromSeconds(10));
        var module = scope.CreateModule(ExactModuleSource(
            "await new Promise(resolve=>setTimeout(resolve,60000)); return [];",
            asyncValidation: true));
        var schema = scope.CreateSchema("{}");
        using var cancellation = new CancellationTokenSource(TimeSpan.FromMilliseconds(300));

        var result = await scope.Host.ValidateAsync(
            module,
            Hash(module),
            schema,
            Hash(schema),
            EmptyEvidenceExchange(),
            cancellation.Token);

        result.Failure.Should().Be(DossierEvidenceRegistryReadFailure.Cancelled);
        scope.AssertClean();
    }

    [Fact]
    public async Task PersistentCleanupFailure_ReturnsStructuredCleanupFailure()
    {
        var cleanupAttempts = 0;
        using var scope = new TestScope(
            cleanupFailureFactory: (_, attempt) =>
            {
                cleanupAttempts = attempt;
                return new IOException("synthetic persistent cleanup refusal");
            });
        var module = scope.CreateModule(ExactModuleSource("return [];"));
        var schema = scope.CreateSchema("{}");

        var result = await scope.Host.ValidateAsync(
            module, Hash(module), schema, Hash(schema), EmptyEvidenceExchange());

        result.Failure.Should().Be(DossierEvidenceRegistryReadFailure.CleanupFailed);
        result.ErrorMessage.Should().Contain("cleanup failed");
        cleanupAttempts.Should().Be(5);
        Directory.EnumerateDirectories(
                Path.Combine(scope.Root, "terrafusion-dossier-evidence-registry-read-host"))
            .Should().ContainSingle("the failed invocation must remain observable for cleanup recovery");
    }

    [Theory]
    [InlineData("length")]
    [InlineData("hash")]
    public async Task NodeExecutableChangedAfterConstruction_FailsBeforeProcessStart(string mutation)
    {
        using var scope = new TestScope(bindCopiedNodeExecutable: true);
        var module = scope.CreateModule(ExactModuleSource("return [];"));
        var schema = scope.CreateSchema("{}");
        scope.MutateBoundNodeExecutable(mutation);

        var result = await scope.Host.ValidateAsync(
            module, Hash(module), schema, Hash(schema), EmptyEvidenceExchange());

        result.Failure.Should().Be(DossierEvidenceRegistryReadFailure.RuntimeIdentityMismatch);
        result.ErrorMessage.Should().Contain("bound Node executable identity changed");
        scope.AssertClean();
    }

    [Fact]
    public async Task OversizedStdout_FailsClosedAndCleansInvocation()
    {
        using var scope = new TestScope();
        var module = scope.CreateModule(ExactModuleSource(
            "process.stdout.write('x'.repeat(1048577)); return [];"));
        var schema = scope.CreateSchema("{}");

        var result = await scope.Host.ValidateAsync(
            module, Hash(module), schema, Hash(schema), EmptyEvidenceExchange());

        result.Failure.Should().Be(DossierEvidenceRegistryReadFailure.StandardOutputTooLarge);
        scope.AssertClean();
    }

    [Fact]
    public async Task OversizedStderr_FailsClosedAndCleansInvocation()
    {
        using var scope = new TestScope();
        var module = scope.CreateModule(ExactModuleSource(
            "process.stderr.write('x'.repeat(65537)); return [];"));
        var schema = scope.CreateSchema("{}");

        var result = await scope.Host.ValidateAsync(
            module, Hash(module), schema, Hash(schema), EmptyEvidenceExchange());

        result.Failure.Should().Be(DossierEvidenceRegistryReadFailure.StandardErrorTooLarge);
        scope.AssertClean();
    }

    private static string RequireExactModule() =>
        Path.GetFullPath(Environment.GetEnvironmentVariable("TERRAFUSION_DOSSIER_HOST_MODULE_PATH")!);

    private static string RequireExactSchema() =>
        Path.GetFullPath(Environment.GetEnvironmentVariable("TERRAFUSION_DOSSIER_HOST_SCHEMA_PATH")!);

    private static string EmptyEvidenceExchange() => JsonSerializer.Serialize(new
    {
        request = new
        {
            schemaVersion = "1.0.0",
            countyId = CountyId,
            parcelId = ParcelId,
            limit = 25,
            offset = 0,
            traceId = "trace-dossier-host-test",
        },
        result = new
        {
            schemaVersion = "1.0.0",
            countyId = CountyId,
            parcelId = ParcelId,
            results = Array.Empty<object>(),
            total = 0,
            hasMore = false,
            limit = 25,
            offset = 0,
            traceId = "trace-dossier-host-test",
        },
    });

    private static string CanonicalEmptyEvidenceExchange() =>
        "{\"request\":{\"countyId\":\"" + CountyId +
        "\",\"limit\":25,\"offset\":0,\"parcelId\":\"" + ParcelId +
        "\",\"schemaVersion\":\"1.0.0\",\"traceId\":\"trace-dossier-host-test\"},\"result\":{\"countyId\":\"" +
        CountyId +
        "\",\"hasMore\":false,\"limit\":25,\"offset\":0,\"parcelId\":\"" + ParcelId +
        "\",\"results\":[],\"schemaVersion\":\"1.0.0\",\"total\":0,\"traceId\":\"trace-dossier-host-test\"}}";

    private static string ExactModuleSource(string validationBody, bool asyncValidation = false) => $$"""
        export {{(asyncValidation ? "async " : string.Empty)}}function validateDossierExchange(schema, exchange) {
          {{validationBody}}
        }
        function sortJson(value) {
          if (Array.isArray(value)) return value.map(sortJson);
          if (value !== null && typeof value === 'object') {
            return Object.fromEntries(Object.keys(value).sort().map(key => [key, sortJson(value[key])]));
          }
          return value;
        }
        export function normalizeJson(value) { return JSON.stringify(sortJson(value)); }
        """;

    private static string Hash(string path)
    {
        using var stream = File.OpenRead(path);
        return Convert.ToHexString(SHA256.HashData(stream)).ToLowerInvariant();
    }

    private sealed class TestScope : IDisposable
    {
        public TestScope(
            TimeSpan? timeout = null,
            Func<string, CancellationToken, Task>? afterModuleCopy = null,
            Func<string, CancellationToken, Task>? afterSchemaCopy = null,
            Func<string, int, Exception?>? cleanupFailureFactory = null,
            bool bindCopiedNodeExecutable = false)
        {
            Root = Path.Combine(Path.GetTempPath(), "tf-dossier-host-tests", Guid.NewGuid().ToString("N"));
            Directory.CreateDirectory(Root);
            SourceNodeExecutablePath = FindNodeExecutable();
            BoundNodeExecutablePath = bindCopiedNodeExecutable
                ? CopyNodeExecutable(SourceNodeExecutablePath)
                : SourceNodeExecutablePath;
            Host = new DossierEvidenceRegistryReadProcessHost(
                BoundNodeExecutablePath,
                timeout,
                Root,
                afterModuleCopy,
                afterSchemaCopy,
                cleanupFailureFactory);
        }

        public string Root { get; }

        public string SourceNodeExecutablePath { get; }

        public string BoundNodeExecutablePath { get; }

        public DossierEvidenceRegistryReadProcessHost Host { get; }

        public void MutateBoundNodeExecutable(string mutation)
        {
            if (string.Equals(
                    BoundNodeExecutablePath,
                    SourceNodeExecutablePath,
                    StringComparison.OrdinalIgnoreCase))
            {
                throw new InvalidOperationException("A copied Node executable is required for mutation.");
            }

            if (mutation == "length")
            {
                using var stream = new FileStream(
                    BoundNodeExecutablePath,
                    FileMode.Append,
                    FileAccess.Write,
                    FileShare.Read);
                stream.WriteByte(0);
                return;
            }

            using (var stream = new FileStream(
                       BoundNodeExecutablePath,
                       FileMode.Open,
                       FileAccess.ReadWrite,
                       FileShare.Read))
            {
                var original = stream.ReadByte();
                original.Should().BeGreaterThanOrEqualTo(0);
                stream.Position = 0;
                stream.WriteByte((byte)(original ^ 0xff));
            }
        }

        public string CreateModule(string source) =>
            CreateFile($"module-{Guid.NewGuid():N}.mjs", source);

        public string CreateSchema(string source) =>
            CreateFile($"schema-{Guid.NewGuid():N}.json", source);

        public string CreateFile(string filename, string source)
        {
            var path = Path.Combine(Root, filename);
            File.WriteAllText(path, source, new UTF8Encoding(false));
            return path;
        }

        public void AssertClean()
        {
            var invocationRoot = Path.Combine(Root, "terrafusion-dossier-evidence-registry-read-host");
            (!Directory.Exists(invocationRoot) || !Directory.EnumerateFileSystemEntries(invocationRoot).Any())
                .Should().BeTrue("every invocation must remove its owned directory");
        }

        public void Dispose()
        {
            for (var attempt = 1; attempt <= 5 && Directory.Exists(Root); attempt++)
            {
                try
                {
                    Directory.Delete(Root, recursive: true);
                }
                catch (IOException) when (attempt < 5)
                {
                    Thread.Sleep(50 * attempt);
                }
                catch (UnauthorizedAccessException) when (attempt < 5)
                {
                    Thread.Sleep(50 * attempt);
                }
            }
        }

        private static string FindNodeExecutable()
        {
            var configured = Environment.GetEnvironmentVariable("TERRAFUSION_DOSSIER_NODE_PATH");
            if (!string.IsNullOrWhiteSpace(configured))
            {
                return Path.GetFullPath(configured);
            }

            var command = OperatingSystem.IsWindows() ? "where.exe" : "/usr/bin/which";
            var argument = OperatingSystem.IsWindows() ? "node.exe" : "node";
            var startInfo = new ProcessStartInfo(command, argument)
            {
                RedirectStandardOutput = true,
                RedirectStandardError = true,
                UseShellExecute = false,
                CreateNoWindow = true,
            };
            Process? process;
            try
            {
                process = Process.Start(startInfo);
            }
            catch (System.ComponentModel.Win32Exception ex)
            {
                throw new InvalidOperationException("Unable to locate the Node executable.", ex);
            }
            using var ownedProcess = process
                ?? throw new InvalidOperationException("Unable to locate the Node executable.");
            var first = ownedProcess.StandardOutput.ReadLine();
            ownedProcess.WaitForExit();
            if (ownedProcess.ExitCode != 0 || string.IsNullOrWhiteSpace(first))
            {
                throw new InvalidOperationException("The Node executable is unavailable.");
            }

            var locator = Path.GetFullPath(first);
            var resolveInfo = new ProcessStartInfo(locator, "-p process.execPath")
            {
                RedirectStandardOutput = true,
                RedirectStandardError = true,
                UseShellExecute = false,
                CreateNoWindow = true,
            };
            using var resolveProcess = Process.Start(resolveInfo)
                ?? throw new InvalidOperationException("Unable to resolve the real Node executable.");
            var resolved = resolveProcess.StandardOutput.ReadLine();
            resolveProcess.WaitForExit();
            if (resolveProcess.ExitCode != 0 || string.IsNullOrWhiteSpace(resolved))
            {
                throw new InvalidOperationException("Unable to resolve the real Node executable.");
            }

            return Path.GetFullPath(resolved);
        }

        private string CopyNodeExecutable(string source)
        {
            var extension = Path.GetExtension(source);
            var destination = Path.Combine(Root, $"bound-node{extension}");
            File.Copy(source, destination, overwrite: false);
            if (!OperatingSystem.IsWindows())
            {
                File.SetUnixFileMode(destination, File.GetUnixFileMode(source));
            }
            return destination;
        }
    }
}
