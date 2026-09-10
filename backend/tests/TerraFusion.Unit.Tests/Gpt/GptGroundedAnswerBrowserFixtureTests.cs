using System.Buffers.Binary;
using System.Diagnostics;
using System.Runtime.InteropServices;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using System.Text.Json.Nodes;
using System.Text.RegularExpressions;
using Microsoft.AspNetCore.Builder;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Metadata;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Configuration.UserSecrets;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Options;
using Microsoft.Win32.SafeHandles;
using TerraFusion.AI.Data;
using TerraFusion.AI.Entities;
using TerraFusion.API.Configuration;
using TerraFusion.API.Services.Gpt;
using TerraFusion.Data;
using Xunit;
using Xunit.Abstractions;
using CoreEntities = TerraFusion.Core.Entities;
using Task = System.Threading.Tasks.Task;

namespace TerraFusion.Unit.Tests.Gpt;

/// <summary>Fresh synthetic prerequisites only. No model-answer seed or provider lifecycle.</summary>
[Collection("GPT real browser fixture")]
public sealed class GptGroundedAnswerBrowserFixtureTests : IDisposable
{
    private readonly ITestOutputHelper output;
    public GptGroundedAnswerBrowserFixtureTests(ITestOutputHelper output) => this.output = output;
    private readonly Action<ModelBuilder, string?>? originalModelHook = TerraFusionDbContext.OnModelCreatingExtensions;
    public void Dispose() => TerraFusionDbContext.OnModelCreatingExtensions = originalModelHook;
    private const string Source = "Synthetic EO reference parcel SYNTHETIC-GPT-001 requires an inspection every 17 months. This is a synthetic test instruction, not county policy.";
    private static readonly string[] Tables = ["Counties", "GPTConfigurations", "GPTConversations", "GPTMessages",
        "RAGDatasets", "RAGDocuments", "RAGEmbeddings", "GPTAudit", "GPTUsageMetrics", "GPTMarketplaceInstalls", "AuditLogs"];
    private static readonly string[] PrerequisiteAuditTypes = ["County_Added", "County_Added",
        "GPTConfiguration_Added", "GPTConfiguration_Added", "GPTConfiguration_Added",
        "RAGDataset_Added", "RAGDataset_Added", "RAGDataset_Added", "RAGDocument_Added", "RAGEmbedding_Added"];

    [Theory]
    [InlineData("relative/gpt.db")]
    [InlineData("C:/gpt.db")]
    [InlineData("C:/Users/bsval/tf-suite-eo-001/os-gpt/.tmp/gpt-grounded-answer-browser/run-ABC/gpt.db")]
    public void FixtureRefusesNonOwnedDatabaseBeforeAnyProviderOrWrite(string path) =>
        Assert.Throws<InvalidOperationException>(() => GuardDatabase(path));

    [Fact]
    public void FixtureRefusesMissingAdmissionBeforeAnyProviderOrWrite() =>
        Assert.Throws<InvalidOperationException>(() => Admission(new Dictionary<string, string?>()));

    [Theory]
    [InlineData("CREATE TABLE \"GPTMessages\" (\"Id\" INTEGER);", "GPTMessages,RAGEmbeddings")]
    [InlineData("CREATE TABLE \"GPTMessages\" (\"Id\" INTEGER); CREATE TABLE \"GPTMessages\" (\"Id\" INTEGER);", "GPTMessages")]
    public void FixtureRefusesMissingOrDuplicateActualSchema(string script, string required) =>
        Assert.Throws<InvalidOperationException>(() => SelectSchema(script, required.Split(',')));

    [Fact]
    public void FixtureRetainsEveryRequiredIndexAndDoesNotFlattenUnrelatedTables()
    {
        const string script = "CREATE TABLE \"Keep\" (\"Id\" INTEGER); CREATE TABLE \"Other\" (\"Id\" INTEGER); " +
            "CREATE UNIQUE INDEX \"UniqueKeep\" ON \"Keep\" (\"Id\"); CREATE INDEX \"LookupKeep\" ON \"Keep\" (\"Id\"); " +
            "CREATE INDEX \"OtherIndex\" ON \"Other\" (\"Id\");";
        var selected = SelectSchema(script, ["Keep"]);
        Assert.Equal(3, selected.Length);
        Assert.Contains("CREATE UNIQUE INDEX \"UniqueKeep\" ON \"Keep\" (\"Id\");", selected);
        Assert.Contains("CREATE INDEX \"LookupKeep\" ON \"Keep\" (\"Id\");", selected);
        Assert.DoesNotContain(selected, statement => statement.Contains("Other"));
    }

    [Fact]
    public void ExistingSqliteModelMustGenerateRealGptPrerequisitesWithoutConverterOverride()
    {
        // Metadata-only characterization. Unsupported actual mapping is a real failing prerequisite,
        // never a reason to use a fixture-only converter or a fake vector/in-memory database.
        using var db = Db(":memory:");
        Assert.NotEmpty(SelectSchema(db.Database.GenerateCreateScript(), Tables));
    }

    [Fact]
    public void ExistingDatabaseCannotBeReplacedByFixtureBootstrap()
    {
        var path = Path.Combine(Root(), ".tmp", "gpt-grounded-answer-browser", "run-" + Guid.NewGuid().ToString("N"), "gpt.db");
        Directory.CreateDirectory(Path.GetDirectoryName(path)!);
        using (File.Open(path, FileMode.CreateNew, FileAccess.Write, FileShare.None)) { }
        Assert.Throws<InvalidOperationException>(() => RefuseExistingDatabase(path));
        Assert.True(File.Exists(path));
        Assert.Equal(0, new FileInfo(path).Length); // Retain this owned zero-byte guard fixture.
    }

    [Fact]
    public async Task RealPrerequisiteSavePreservesAutomaticAuditsWithoutAnyGptSuccess()
    {
        var path = Path.Combine(Root(), ".tmp", "gpt-grounded-answer-browser", "run-" + Guid.NewGuid().ToString("N"), "gpt.db");
        await using var db = Db(GuardDatabase(path));
        var statements = SelectSchema(db.Database.GenerateCreateScript(), Tables);
        Directory.CreateDirectory(Path.GetDirectoryName(path)!);
        using (File.Open(path, FileMode.CreateNew, FileAccess.Write, FileShare.None)) { }
        foreach (var statement in statements) await db.Database.ExecuteSqlRawAsync(statement);
        db.Counties.Add(new CoreEntities.County { Id = Guid.NewGuid(), Name = "Benton", State = "WA", FipsCode = "53005" });
        await db.SaveChangesAsync();
        var audit = Assert.Single(await db.AuditLogs.AsNoTracking().ToListAsync());
        Assert.Equal("County_Added", audit.Type); Assert.Equal("EntityFramework", audit.Source);
        Assert.Equal("System", audit.UserId); Assert.Equal("{}", audit.Data);
        Assert.Null(audit.CorrelationId); Assert.NotEqual(Guid.Empty, audit.Id);
        Assert.Empty(await db.GPTConversations.ToListAsync()); Assert.Empty(await db.Set<GPTMessage>().ToListAsync());
        Assert.Empty(await db.Set<GPTAudit>().ToListAsync()); Assert.Empty(await db.Set<GPTUsageMetric>().ToListAsync());
        // No provider/vector call, and no removal of this real prerequisite audit or owned DB.
    }

    // Source-first expectations for the separately scheduled negative-profile run.
    // These test the guards/bootstrap, not a provider, model, or a fabricated output.
    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("real-provider")]
    public void NegativeProfileRequiresExplicitSelection(string? profile)
    {
        var env = NegativeEnvironment();
        env["GPT_EO_PROFILE"] = profile;
        Assert.Throws<InvalidOperationException>(() => GuardNegativeProfile(env));
    }

    [Theory]
    [InlineData("GPT_EO_ADMISSION")]
    [InlineData("GPT_EO_ENDPOINT")]
    [InlineData("GPT_EO_ADMITTED_MODEL")]
    [InlineData("GPT_EO_EMBEDDING_MODEL")]
    [InlineData("GPT_EO_EMBEDDING_DIMENSIONS")]
    [InlineData("GptLocalInference__Enabled")]
    [InlineData("GptLocalInference__Endpoint")]
    [InlineData("GptLocalInference__Model")]
    [InlineData("GptLocalInference__EmbeddingModel")]
    [InlineData("gptlocalinference:embeddingdimensions")]
    public void NegativeProfileRefusesEveryProviderInputEvenWhenEmpty(string key)
    {
        var env = NegativeEnvironment();
        env[key] = "";
        Assert.Throws<InvalidOperationException>(() => GuardNegativeProfile(env));
    }

    [Fact]
    public void NegativeProfileDoesNotSatisfyPositiveAdmission() =>
        Assert.Throws<InvalidOperationException>(() => Admission(NegativeEnvironment()));

    [Fact]
    public async Task NegativeProfileRefusesMissingRuntimeBeforeCreatingDatabase()
    {
        var path = Path.Combine(Root(), ".tmp", "gpt-grounded-answer-browser", "run-" + Guid.NewGuid().ToString("N"), "gpt.db");
        var env = NegativeEnvironment();
        env.Remove("GPT_EO_RUNTIME");
        await Assert.ThrowsAsync<InvalidOperationException>(() => SeedNegative(path, env));
        Assert.False(Directory.Exists(Path.GetDirectoryName(path)));
    }

    [Fact]
    public async Task NegativeProfileRealSeedRetainsSixAuditsWithoutDocumentsVectorsOrOutputs()
    {
        var path = Path.Combine(Root(), ".tmp", "gpt-grounded-answer-browser", "run-" + Guid.NewGuid().ToString("N"), "gpt.db");
        await SeedNegative(path, NegativeEnvironment());
        await using (var db = Db(path, readOnly: true))
        {
            // Bind the persisted metadata expectation to the real, unmodified EF mapping.
            var dataset = db.GetService<IDesignTimeModel>().Model.FindEntityType(typeof(RAGDataset));
            Assert.NotNull(dataset);
            var dimension = dataset.FindProperty(nameof(RAGDataset.VectorDimension));
            Assert.NotNull(dimension);
            Assert.Equal(typeof(int), dimension.ClrType);
            Assert.Equal(0, Assert.IsType<int>(dimension.Sentinel));
            Assert.Equal(1536, Assert.IsType<int>(dimension.GetDefaultValue()));
            Assert.Equal(ValueGenerated.OnAdd, dimension.ValueGenerated);
        }
        var state = await ReadNegativeState(path);
        Assert.Equal(6, state["prerequisiteAuditCount"]!.GetValue<int>());
        Assert.Equal(6, state["actualAuditCount"]!.GetValue<int>());
        Assert.Empty(state["conversations"]!.AsArray());
        Assert.Equal(0, state["documentCount"]!.GetValue<int>());
        Assert.Equal(0, state["vectorCount"]!.GetValue<int>());
        Assert.Empty(state["messageIds"]!.AsArray());
        Assert.Empty(state["serviceAuditIds"]!.AsArray());
        Assert.Equal(0, state["usageCount"]!.GetValue<int>());
    }

    [Fact]
    public async Task NegativeProfileCannotReseedOrOverwriteExistingDatabase()
    {
        var path = Path.Combine(Root(), ".tmp", "gpt-grounded-answer-browser", "run-" + Guid.NewGuid().ToString("N"), "gpt.db");
        await SeedNegative(path, NegativeEnvironment());
        var original = await File.ReadAllBytesAsync(path);
        await Assert.ThrowsAsync<InvalidOperationException>(() => SeedNegative(path, NegativeEnvironment()));
        Assert.Equal(original, await File.ReadAllBytesAsync(path));
        Assert.Equal(6, (await ReadNegativeState(path))["actualAuditCount"]!.GetValue<int>());
    }

    [Fact]
    public void SyntheticSettingsRequireOriginalApprovalBeforeAnyContent()
    {
        const string approved = "5178b1aa7e76126ddfa8dcf5056817966c82c9a3c3fa1170519a451235a1eeaf";
        const string empty = "ca3d163bab055381827226140568f3bef7eaac187cebd76878e0b63e9e442356";
        RequireSyntheticSettingsApproval(approved, empty);
        foreach (var changed in new[] { "", new string('a', 64), "95d9551c5eb03ff06b164a071bde15354abeaa278256fc86a87092baa4ebb918" })
            Assert.Throws<InvalidOperationException>(() => RequireSyntheticSettingsApproval(changed, empty));
        Assert.Throws<InvalidOperationException>(() => RequireSyntheticSettingsApproval(approved,
            "d96fbaf306011e7bc1d2b5ce20ca4fb1097ec701b4129817faee3fe31af3b407"));
    }

    [Fact]
    public void SyntheticSettingsMatchReviewedUtf8InventoryWithoutCredentials()
    {
        Assert.Equal(944, Encoding.UTF8.GetByteCount(NegativeSettingsJson));
        Assert.Equal("5178b1aa7e76126ddfa8dcf5056817966c82c9a3c3fa1170519a451235a1eeaf", TextHash(NegativeSettingsJson));
        Assert.Equal("{}\n", NegativeDevelopmentJson);
        Assert.Equal("410b47a2bd22be05b10a43fb0d47c45017b826de555b598c4dfbf1c16b16fa9d", TextHash(NegativeLocalJson));
        var input = JsonNode.Parse(NegativeSettingsJson)!.AsObject();
        Assert.Equal(new[] { "JwtSettings", "Logging", "AuditLogging", "AtlasProjection", "DaisAppealWorkflow",
            "DossierEvidenceRegistryRead", "DaisAppealMutation", "DossierMutation", "GptGroundedContextRuntime",
            "GptGroundedAnswerRuntime" }, input.Select(pair => pair.Key).ToArray());
        Assert.Null(input["JwtSettings"]!["SecretKey"]);
        Assert.Null(input["ConnectionStrings"]); Assert.Null(input["Workbench"]);
    }

    [Fact]
    public void SyntheticStartupCapturesRealRootAndLocalExactIntentWithoutResolvingProviders()
    {
        var root = NoStartContent(NegativeLocalJson, synthetic: true);
        var database = DatabaseFromContent(root);
        var key = new string('a', 128); // No-start test only, never the actual launch signer.
        using var config = NegativeConfiguration(root, NegativeArguments(database), SyntheticStartupValues(database, key));
        var captured = CaptureSyntheticStartup(config, root, database, key);
        Assert.Equal(Root(), captured["sovereignRoot"]!.GetValue<string>());
        Assert.Equal("TerraFusion.API", captured["issuer"]!.GetValue<string>());
        Assert.Equal("TerraFusion.Client", captured["audience"]!.GetValue<string>());
        Assert.True(captured["auditLogToDatabase"]!.GetValue<bool>());
        Assert.True(captured["registrationIntentOnly"]!.GetValue<bool>());
        Assert.False(File.Exists(database));
    }

    [Fact]
    public void SyntheticStartupRefusesLateIdentityDatabaseAndAuditChanges()
    {
        var key = new string('a', 128);
        foreach (var (section, name, value) in new[] {
            ("JwtSettings", "Issuer", "wrong"), ("JwtSettings", "Audience", "wrong"),
            ("JwtSettings", "ExpirationMinutes", "1"), ("JwtSettings", "SecretKey", new string('b', 128)),
            ("ConnectionStrings", "DefaultConnection", "Data Source=foreign.db"),
            ("ConnectionStrings", "LevyDatabase", "Data Source=foreign.db"),
            ("AuditLogging", "Enabled", "false"), ("AuditLogging", "LogToDatabase", "false"),
            ("AuditLogging", "LogToFile", "false") })
        {
            var late = JsonNode.Parse(NegativeLocalJson)!.AsObject();
            late[section] = new JsonObject { [name] = value };
            var root = NoStartContent(late.ToJsonString(), synthetic: true);
            var database = DatabaseFromContent(root);
            using var config = NegativeConfiguration(root, NegativeArguments(database), SyntheticStartupValues(database, key));
            Assert.Throws<InvalidOperationException>(() => CaptureSyntheticStartup(config, root, database, key));
            Assert.False(File.Exists(database));
        }
    }

    [Theory]
    [InlineData("AtlasProjection")]
    [InlineData("DaisAppealWorkflow")]
    [InlineData("DossierEvidenceRegistryRead")]
    [InlineData("DaisAppealMutation")]
    [InlineData("DossierMutation")]
    [InlineData("GptGroundedContextRuntime")]
    [InlineData("GptGroundedAnswerRuntime")]
    public void SyntheticStartupRefusesLateRuntimeDowngradeOrTimeoutDrift(string section)
    {
        foreach (var (name, value) in new[] { ("Mode", "Disabled"), ("TimeoutSeconds", "29") })
        {
            var late = JsonNode.Parse(NegativeLocalJson)!.AsObject();
            late[section] = new JsonObject { [name] = value };
            var root = NoStartContent(late.ToJsonString(), synthetic: true);
            var database = DatabaseFromContent(root);
            var key = new string('a', 128);
            using var config = NegativeConfiguration(root, NegativeArguments(database), SyntheticStartupValues(database, key));
            Assert.Throws<InvalidOperationException>(() => CaptureSyntheticStartup(config, root, database, key));
        }
    }

    // Descriptor-only tests of the exact Program seam: never run its entrypoint, build a
    // provider/host, invoke descriptor factories, or resolve telemetry/exporter instances.
    private static void RegisterProgramTelemetry(IServiceCollection services, IConfiguration configuration)
    {
        var method = typeof(GptLocalInferenceOptions).Assembly.GetType("Program", throwOnError: true)!
            .GetMethod("ConfigureStartupOpenTelemetry", System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Static);
        Assert.NotNull(method);
        try { method.Invoke(null, [services, configuration]); }
        catch (System.Reflection.TargetInvocationException error) when (error.InnerException is not null)
        { System.Runtime.ExceptionServices.ExceptionDispatchInfo.Capture(error.InnerException).Throw(); }
    }

    [Theory]
    [InlineData(null)]
    [InlineData("true")]
    public void ProgramTelemetryDefaultAndTrueRetainTracingMetricsAndHostedDescriptors(string? enabled)
    {
        using var configuration = (ConfigurationRoot)new ConfigurationBuilder().AddInMemoryCollection(new Dictionary<string, string?> {
            ["OpenTelemetry:Enabled"] = enabled }).Build();
        var services = new ServiceCollection();
        RegisterProgramTelemetry(services, configuration);
        foreach (var type in new[] { "OpenTelemetry.Trace.TracerProvider", "OpenTelemetry.Metrics.MeterProvider" })
        {
            var descriptor = Assert.Single(services.Where(item => item.ServiceType.FullName == type));
            Assert.Equal(ServiceLifetime.Singleton, descriptor.Lifetime);
            Assert.NotNull(descriptor.ImplementationFactory);
        }
        var hosted = Assert.Single(services.Where(item => item.ServiceType == typeof(IHostedService)
            && item.ImplementationType?.FullName == "OpenTelemetry.Extensions.Hosting.Implementation.TelemetryHostedService"));
        Assert.Equal(ServiceLifetime.Singleton, hosted.Lifetime);
    }

    [Fact]
    public void ProgramTelemetryFalseLeavesExactSentinelDescriptorsUntouchedEvenWithUnusableEndpoint()
    {
        using var configuration = (ConfigurationRoot)new ConfigurationBuilder().AddInMemoryCollection(new Dictionary<string, string?> {
            ["OpenTelemetry:Enabled"] = "false", ["OTEL_EXPORTER_OTLP_ENDPOINT"] = ":not-a-uri" }).Build();
        var services = new ServiceCollection();
        services.AddSingleton(new object());
        services.AddTransient<IDisposable>(_ => throw new InvalidOperationException("Sentinel factory must not execute."));
        var before = services.ToArray();
        RegisterProgramTelemetry(services, configuration);
        Assert.Equal(before.Length, services.Count);
        for (var i = 0; i < before.Length; i++) Assert.Same(before[i], services[i]);
    }

    [Fact]
    public void ProgramTelemetryMalformedBooleanRefusesBeforeAnyRegistration()
    {
        using var configuration = (ConfigurationRoot)new ConfigurationBuilder().AddInMemoryCollection(new Dictionary<string, string?> {
            ["OpenTelemetry:Enabled"] = "not-a-boolean" }).Build();
        var services = new ServiceCollection();
        Assert.Throws<InvalidOperationException>(() => RegisterProgramTelemetry(services, configuration));
        Assert.Empty(services);
    }

    [Fact]
    public void LateTelemetryTrueOverridesFalseArgumentButCannotAuthorizeNegativeLaunch()
    {
        var root = NoStartContent("{\"OpenTelemetry\":{\"Enabled\":true}}");
        var database = DatabaseFromContent(root);
        using var configuration = NegativeConfiguration(root, NegativeArguments(database));
        Assert.True(configuration.GetValue<bool>("OpenTelemetry:Enabled"));
        Assert.Throws<InvalidOperationException>(() => RequireNegativeCapture(configuration, CaptureLocalOptions(configuration, root), database));
    }

    [Theory]
    [InlineData("api-content")]
    [InlineData("other/api-content")]
    [InlineData("runtime/other")]
    public void ContentInverseRefusesOldOrAlternateGeometryBeforeCreatingAnything(string suffix)
    {
        var run = Path.Combine(Root(), ".tmp/gpt-grounded-answer-browser", "run-" + Guid.NewGuid().ToString("N"));
        Assert.Throws<InvalidOperationException>(() => DatabaseFromContent(Path.Combine(run, suffix)));
        Assert.False(Directory.Exists(run));
    }

    [Fact]
    public void NestedContentKeepsActualRegistryAndPlatformDerivationInsideItsRun()
    {
        var root = NoStartContent(NegativeLocalJson);
        var database = DatabaseFromContent(root);
        var run = Path.GetDirectoryName(database)!;
        Assert.Equal(Path.Combine(run, "runtime", "api-content"), root);
        Assert.Equal(Path.Combine(run, "service-registry.json"), Path.GetFullPath(Path.Combine(root, "..", "..", "service-registry.json")));
        RequireRegistryBeforeLaunch(run, null);
        Assert.False(File.Exists(Path.Combine(run, "platform.json")));
    }

    [Theory]
    [InlineData("service-registry.json")]
    [InlineData("platform.json")]
    public void FirstLaunchRefusesPreexistingRegistryOrPlatformWithoutOverwritingIt(string name)
    {
        var run = Path.GetDirectoryName(DatabaseFromContent(NoStartContent(NegativeLocalJson)))!;
        var path = Path.Combine(run, name);
        File.WriteAllText(path, "guard-fixture-only");
        Assert.Throws<InvalidOperationException>(() => RequireRegistryBeforeLaunch(run, null));
        Assert.Equal("guard-fixture-only", File.ReadAllText(path));
    }

    [Fact]
    public void RegistryOutputRefusesDirectoryOrMalformedBytesRatherThanInventingRegistration()
    {
        var run = Path.GetDirectoryName(DatabaseFromContent(NoStartContent(NegativeLocalJson)))!;
        var path = Path.Combine(run, "service-registry.json");
        Directory.CreateDirectory(path);
        Assert.Throws<InvalidOperationException>(() => ReadRegistryOutput(run, 1, 5193));
        var otherRun = Path.GetDirectoryName(DatabaseFromContent(NoStartContent(NegativeLocalJson)))!;
        File.WriteAllText(Path.Combine(otherRun, "service-registry.json"), "{}");
        Assert.Throws<InvalidOperationException>(() => ReadRegistryOutput(otherRun, 1, 5193));
        Assert.Equal("{}", File.ReadAllText(Path.Combine(otherRun, "service-registry.json")));
    }

    [Fact]
    public void ContentInverseRefusesReplacedRuntimeAncestor()
    {
        var database = GuardDatabase(Path.Combine(Root(), ".tmp/gpt-grounded-answer-browser", "run-" + Guid.NewGuid().ToString("N"), "gpt.db"));
        var run = Path.GetDirectoryName(database)!;
        Directory.CreateDirectory(run);
        var runtime = Path.Combine(run, "runtime");
        File.WriteAllText(runtime, "owned-ancestor-refusal-fixture");
        Assert.Throws<InvalidOperationException>(() => DatabaseFromContent(ContentFromDatabase(database)));
        Assert.Equal("owned-ancestor-refusal-fixture", File.ReadAllText(runtime));
    }

    [Fact]
    public void SameRunRestartRefusesMissingOrChangedRetainedOutput()
    {
        var run = Path.GetDirectoryName(DatabaseFromContent(NoStartContent(NegativeLocalJson)))!;
        // Counterexample only: no product registration or live receipt is fabricated.
        var previous = new JsonObject { ["path"] = Path.Combine(run, "service-registry.json"),
            ["sha256"] = new string('a', 64), ["apiPid"] = 1, ["port"] = 5193 };
        Assert.Throws<InvalidOperationException>(() => RequireRegistryBeforeLaunch(run, previous));
        File.WriteAllText(Path.Combine(run, "service-registry.json"), "{}");
        Assert.Throws<InvalidOperationException>(() => RequireRegistryBeforeLaunch(run, previous));
        Assert.Equal("{}", File.ReadAllText(Path.Combine(run, "service-registry.json")));
    }

    [Theory]
    [InlineData("sha256")]
    [InlineData("creationUtcTicks")]
    public void SameRunRegistryIdentityComparisonRefusesByteOrFileReplacement(string field)
    {
        // Pure comparison inputs only, not a seeded registry or claimed product receipt.
        var expected = new JsonObject { ["sha256"] = new string('a', 64), ["creationUtcTicks"] = "1" };
        var measured = expected.DeepClone().AsObject();
        RequireRegistryIdentity(expected, measured);
        measured[field] = "different";
        Assert.Throws<InvalidOperationException>(() => RequireRegistryIdentity(expected, measured));
    }

    // Source-first custody regressions. Real configuration providers and registration,
    // no WebApplication/host start, default user-secrets load, provider resolution or HTTP.
    [Fact]
    public void LateJsonActuallyOverridesDisabledCommandLineAndNegativeGuardRefusesIt()
    {
        var root = NoStartContent("{\"GptLocalInference\":{\"Enabled\":true,\"Model\":\"unadmitted-test-input\"}}");
        using var config = NegativeConfiguration(root, NegativeArguments(DatabaseFromContent(root)));
        var captured = CaptureLocalOptions(config, root);
        Assert.True(captured.Enabled); // Configuration-order counterexample; NOT a model call.
        Assert.Equal("unadmitted-test-input", captured.Model);
        Assert.Throws<InvalidOperationException>(() => RequireNegativeCapture(config, captured,
            DatabaseFromContent(root)));
    }

    [Fact]
    public void LeasedLateJsonActuallyCapturesDisabledBlankModelsZeroDimensionsAndOwnedDatabaseOrRefusesNonWindows()
    {
        if (AssertLeasePlatformRefusal()) return;
        var root = NoStartContent(NegativeLocalJson);
        var database = DatabaseFromContent(root);
        using var lease = ContentLease.Acquire(root, ContentHashes(root));
        using var config = NegativeConfiguration(root, NegativeArguments(database));
        var captured = CaptureLocalOptions(config, root);
        RequireNegativeCapture(config, captured, database);
        Assert.False(captured.Enabled); Assert.Equal("", captured.Endpoint); Assert.Equal("", captured.Model);
        Assert.Equal("", captured.EmbeddingModel); Assert.Equal(0, captured.EmbeddingDimensions);
        Assert.Equal("Data Source=" + database, config.GetConnectionString("DefaultConnection"));
        Assert.Equal("SQLite", config["DatabaseProvider"]);
        Assert.False(config.GetValue<bool>("OpenTelemetry:Enabled", true));
        lease.RequireHeld();
    }

    [Fact]
    public void LateJsonDatabaseRedirectionIsRefusedWithoutOpeningAnyDatabase()
    {
        var root = NoStartContent("{\"ConnectionStrings\":{\"DefaultConnection\":\"unadmitted-test-input\"}}");
        var database = DatabaseFromContent(root);
        using var config = NegativeConfiguration(root, NegativeArguments(database));
        Assert.Throws<InvalidOperationException>(() => RequireNegativeCapture(config, CaptureLocalOptions(config, root), database));
        Assert.False(File.Exists(database));
    }

    [Fact]
    public void LeaseRefusesPreexistingWriterBeforeAnyLaunchOrRefusesNonWindows()
    {
        if (AssertLeasePlatformRefusal()) return;
        var root = NoStartContent(NegativeLocalJson);
        var hashes = ContentHashes(root);
        using var writer = File.Open(Path.Combine(root, "appsettings.json"), FileMode.Open, FileAccess.Write, FileShare.Read);
        Assert.Throws<IOException>(() => ContentLease.Acquire(root, hashes));
    }

    [Fact]
    public void LeaseRefusesChangedBytesAgainstOriginalHashesOrRefusesNonWindows()
    {
        if (AssertLeasePlatformRefusal()) return;
        var root = NoStartContent(NegativeLocalJson);
        var hashes = ContentHashes(root);
        File.WriteAllText(Path.Combine(root, "appsettings.Development.local.json"), "{}");
        Assert.Throws<InvalidOperationException>(() => ContentLease.Acquire(root, hashes));
    }

    [Fact]
    public void WindowsLeaseDeniesWriteDeleteReplacementAndRootRenameWhileHeldOrRefusesNonWindows()
    {
        if (AssertLeasePlatformRefusal()) return;
        var root = NoStartContent(NegativeLocalJson);
        using var lease = ContentLease.Acquire(root, ContentHashes(root));
        var path = Path.Combine(root, "appsettings.Development.local.json");
        Assert.Throws<IOException>(() => { using var writer = File.Open(path, FileMode.Open, FileAccess.Write, FileShare.ReadWrite); });
        Assert.Throws<IOException>(() => File.Delete(path));
        Assert.Throws<IOException>(() => File.Move(path, path + ".moved"));
        Assert.Throws<IOException>(() => Directory.Move(root, root + "-moved"));
        var runtime = Path.GetDirectoryName(root)!;
        var run = Path.GetDirectoryName(DatabaseFromContent(root))!;
        Assert.Throws<IOException>(() => Directory.Move(runtime, runtime + "-moved"));
        Assert.Throws<IOException>(() => Directory.Move(run, run + "-moved"));
        Assert.Equal(NegativeLocalJson, File.ReadAllText(path));
    }

    [Fact]
    public void ReleasedLeaseCannotAuthorizeLaunchOrRefusesNonWindows()
    {
        if (AssertLeasePlatformRefusal()) return;
        var root = NoStartContent(NegativeLocalJson);
        var lease = ContentLease.Acquire(root, ContentHashes(root));
        lease.Dispose();
        Assert.Throws<InvalidOperationException>(lease.RequireHeld);
    }

    [Fact]
    public void UnexpectedContentFileIsRefusedBeforeAnyLaunchOrRefusesNonWindows()
    {
        if (AssertLeasePlatformRefusal()) return;
        var root = NoStartContent(NegativeLocalJson);
        var hashes = ContentHashes(root);
        File.WriteAllText(Path.Combine(root, "unapproved.json"), "{}");
        Assert.Throws<InvalidOperationException>(() => ContentLease.Acquire(root, hashes));
    }

    [Fact]
    public void NegativeContentCannotEscapeTheOwnedRunOrRefusesNonWindows()
    {
        if (AssertLeasePlatformRefusal()) return;
        Assert.Throws<InvalidOperationException>(() => ContentLease.Acquire(Path.Combine(Root(), "backend", "src", "TerraFusion.API"), new Dictionary<string, string>()));
    }

    [Fact]
    public void OwnedJobStopWaitsForItsNonApiChildBeforeCustodyCanBeReleasedOrRefusesNonWindows()
    {
        if (AssertJobPlatformRefusal()) return;
        using var job = new NativeJob();
        using var child = NonApiJobChild(job);
        job.StopAndWait();
        Assert.True(child.WaitForExit(10000));
    }

    [Fact]
    public void ClosingLeaseJobHandleTerminatesItsNonApiChildOrRefusesNonWindows()
    {
        if (AssertJobPlatformRefusal()) return;
        var job = new NativeJob();
        using var child = NonApiJobChild(job);
        job.Dispose(); // The same kernel close operation used if the lease-holder process dies.
        Assert.True(child.WaitForExit(10000));
    }

    private static Process NonApiJobChild(NativeJob job) => job.Start(
        "C:/Windows/System32/WindowsPowerShell/v1.0/powershell.exe",
        ["-NoProfile", "-NonInteractive", "-Command", "Start-Sleep -Seconds 30"],
        new Dictionary<string, string> { ["SystemRoot"] = "C:/Windows", ["WINDIR"] = "C:/Windows" }, Root());

    private bool AssertLeasePlatformRefusal()
    {
        if (OperatingSystem.IsWindows()) return false;
        var run = Path.Combine(Root(), ".tmp/gpt-grounded-answer-browser", "run-" + Guid.NewGuid().ToString("N"));
        Assert.False(Directory.Exists(run));
        // Exercise the real first boundary: no NoStartContent, hashing, file setup or native call.
        Assert.Throws<PlatformNotSupportedException>(() => ContentLease.Acquire(Path.Combine(run, "runtime", "api-content"), new Dictionary<string, string>()));
        Assert.False(Directory.Exists(run));
        output.WriteLine("PLATFORM_REFUSAL_ONLY: ContentLease rejected this OS before setup; Windows custody NOT_RUN.");
        return true;
    }

    private bool AssertJobPlatformRefusal()
    {
        if (OperatingSystem.IsWindows()) return false;
        Assert.Throws<PlatformNotSupportedException>(() => new NativeJob());
        output.WriteLine("PLATFORM_REFUSAL_ONLY: NativeJob rejected this OS before native job/process creation; Windows custody NOT_RUN.");
        return true;
    }

    [GptBrowserFixtureFact]
    public async Task PrepareOrVerifyOwnedBrowserDatabase()
    {
        var profile = Environment.GetEnvironmentVariable("GPT_EO_PROFILE");
        if (profile is not null and not "real-provider")
            throw new InvalidOperationException("Positive fixture cannot run a negative-only profile.");
        var path = GuardDatabase(Environment.GetEnvironmentVariable("GPT_EO_DATABASE_PATH") ?? "");
        var mode = Environment.GetEnvironmentVariable("GPT_EO_FIXTURE_MODE");
        if (mode == "seed") await Seed(path);
        else if (mode is "snapshot" or "verify") await Verify(path, mode == "verify");
        else throw new InvalidOperationException("Explicit seed, snapshot or verify mode required.");
    }

    [GptBrowserFixtureFact]
    public async Task PrepareOrVerifyNegativeOnlyBrowserDatabase()
    {
        var env = Environment.GetEnvironmentVariables().Cast<System.Collections.DictionaryEntry>()
            .ToDictionary(entry => (string)entry.Key, entry => entry.Value?.ToString());
        GuardNegativeProfile(env);
        var path = GuardDatabase(Environment.GetEnvironmentVariable("GPT_EO_DATABASE_PATH") ?? "");
        var mode = Environment.GetEnvironmentVariable("GPT_EO_FIXTURE_MODE");
        if (mode == "seed") await SeedNegative(path, env);
        else if (mode == "configuration") await VerifyOwnedConfigurationInChild(path);
        else if (mode == "launch") await LaunchNegativeApi(path, env);
        else if (mode is "snapshot" or "verify")
        {
            var phase = Environment.GetEnvironmentVariable("GPT_EO_FIXTURE_PHASE") ?? "";
            if (!Regex.IsMatch(phase, "^[a-z][a-z0-9-]{0,39}$"))
                throw new InvalidOperationException("Bounded unique negative phase required.");
            var state = await ReadNegativeState(path);
            if (mode == "verify")
            {
                var expectedPath = Path.Combine(Path.GetDirectoryName(path)!, "observed-negative-conversations.json");
                RefuseReparse(expectedPath);
                var expected = JsonNode.Parse(await File.ReadAllTextAsync(expectedPath))!.AsArray();
                Assert.NotEmpty(expected);
                Assert.True(JsonNode.DeepEquals(expected, state["conversations"]), "Actual API-created conversation custody differs.");
            }
            state["negativeMatrixVerified"] = mode == "verify";
            state["realProviderAcceptance"] = "NOT_RUN";
            await WriteNew(Path.Combine(Path.GetDirectoryName(path)!, "snapshot-" + phase + ".json"), state);
        }
        else throw new InvalidOperationException("Explicit negative seed, snapshot or verify mode required.");
    }

    private static Dictionary<string, string?> NegativeEnvironment() => new()
    {
        ["GPT_EO_PROFILE"] = "negative-only", ["GPT_EO_RUNTIME"] = "owned", ["GPT_EO_PROVIDER_POLICY"] = "forbidden",
    };

    private static void GuardNegativeProfile(IReadOnlyDictionary<string, string?> env)
    {
        string? Value(string key) => env.TryGetValue(key, out var value) ? value : null;
        if (Value("GPT_EO_PROFILE") != "negative-only" || Value("GPT_EO_RUNTIME") != "owned"
            || Value("GPT_EO_PROVIDER_POLICY") != "forbidden")
            throw new InvalidOperationException("Explicit owned negative-only fixture with provider invocation forbidden required.");
        foreach (var (key, value) in env)
        {
            var normalized = key.Replace("__", ":", StringComparison.Ordinal).ToLowerInvariant();
            if (value is not null && (normalized.StartsWith("gptlocalinference:", StringComparison.Ordinal)
                || new[] { "gpt_eo_admission", "gpt_eo_endpoint", "gpt_eo_admitted_model", "gpt_eo_embedding_model", "gpt_eo_embedding_dimensions" }.Contains(normalized)))
                throw new InvalidOperationException("Negative-only fixture refuses provider admission/configuration inputs.");
        }
    }

    private const string NegativeLocalJson = "{\"GptLocalInference\":{\"Enabled\":false,\"Endpoint\":\"\",\"Model\":\"\",\"EmbeddingModel\":\"\",\"EmbeddingDimensions\":0},\"OpenTelemetry\":{\"Enabled\":false}}\n";
    // Same independently reviewed 944 UTF-8 bytes as the TS harness; never canonical input.
    // This profile intentionally enables DB audit logging unlike canonical Development.
    private static readonly string NegativeSettingsJson = JsonSerializer.Serialize(new {
        JwtSettings = new { Issuer = "TerraFusion.API", Audience = "TerraFusion.Client", ExpirationMinutes = 120 },
        Logging = new { LogLevel = new Dictionary<string, string> {
            ["Default"] = "Warning", ["TerraFusion.API.Services.AuditLogger"] = "Information" } },
        AuditLogging = new { Enabled = true, LogToDatabase = true, LogToFile = true },
        AtlasProjection = new { Mode = "LocalExact", TimeoutSeconds = 30 },
        DaisAppealWorkflow = new { Mode = "LocalExact", TimeoutSeconds = 30 },
        DossierEvidenceRegistryRead = new { Mode = "LocalExact", TimeoutSeconds = 30 },
        DaisAppealMutation = new { Mode = "LocalExact", TimeoutSeconds = 30 },
        DossierMutation = new { Mode = "LocalExact", TimeoutSeconds = 30 },
        GptGroundedContextRuntime = new { Mode = "LocalExact", TimeoutSeconds = 30 },
        GptGroundedAnswerRuntime = new { Mode = "LocalExact", TimeoutSeconds = 30 },
    }, new JsonSerializerOptions { WriteIndented = true }).Replace("\r\n", "\n", StringComparison.Ordinal) + "\n";
    private const string NegativeDevelopmentJson = "{}\n";

    private static void RequireSyntheticSettingsApproval(string settings, string development)
    {
        if (!Regex.IsMatch(settings, "^[a-f0-9]{64}$") || !Regex.IsMatch(development, "^[a-f0-9]{64}$")
            || settings != TextHash(NegativeSettingsJson) || development != TextHash(NegativeDevelopmentJson))
            throw new InvalidOperationException("Original external approval of both synthetic JSON inputs required.");
    }

    private static readonly string[] ContentFiles = ["TerraFusion.API.dll", "appsettings.json",
        "appsettings.Development.json", "appsettings.Development.local.json"];

    private static string NoStartContent(string lateJson, bool synthetic = false)
    {
        var database = GuardDatabase(Path.Combine(Root(), ".tmp", "gpt-grounded-answer-browser", "run-" + Guid.NewGuid().ToString("N"), "gpt.db"));
        var root = ContentFromDatabase(database);
        Directory.CreateDirectory(root);
        // The no-start test marker is the real referenced API assembly, not a substitute executable.
        File.Copy(typeof(GptLocalInferenceOptions).Assembly.Location, Path.Combine(root, ContentFiles[0]), overwrite: false);
        foreach (var (name, text) in new[] { (ContentFiles[1], synthetic ? NegativeSettingsJson : "{}"),
            (ContentFiles[2], synthetic ? NegativeDevelopmentJson : "{}"), (ContentFiles[3], lateJson) })
        {
            using var file = new FileStream(Path.Combine(root, name), FileMode.CreateNew, FileAccess.Write, FileShare.None);
            file.Write(Encoding.UTF8.GetBytes(text));
        }
        return root;
    }

    private static Dictionary<string, string> ContentHashes(string root) =>
        ContentFiles.ToDictionary(name => name, name => Hash(File.ReadAllBytes(Path.Combine(root, name))));

    private static string ContentFromDatabase(string database) =>
        Path.Combine(Path.GetDirectoryName(GuardDatabase(database))!, "runtime", "api-content");

    private static string DatabaseFromContent(string root)
    {
        if (!Path.IsPathFullyQualified(root) || root.Split(['/', '\\']).Any(part => part is "." or ".."))
            throw new InvalidOperationException("Absolute non-traversing negative content required.");
        var full = Path.GetFullPath(root);
        var run = Directory.GetParent(full)?.Parent?.FullName
            ?? throw new InvalidOperationException("Nested negative content required.");
        var database = GuardDatabase(Path.Combine(run, "gpt.db"));
        if (full != ContentFromDatabase(database)) throw new InvalidOperationException("Exact run/runtime/api-content required.");
        RefuseReparse(full);
        for (var current = full; current != null; current = Path.GetDirectoryName(current))
            if (File.Exists(current)) throw new InvalidOperationException("Negative content ancestors must be directories.");
        return database;
    }

    private static string[] NegativeArguments(string database) => [
        "--OpenTelemetry:Enabled=false",
        "--GptLocalInference:Enabled=false", "--GptLocalInference:Endpoint=", "--GptLocalInference:Model=",
        "--GptLocalInference:EmbeddingModel=", "--GptLocalInference:EmbeddingDimensions=0",
        "--DatabaseProvider=SQLite", "--ConnectionStrings:DefaultConnection=Data Source=" + database];

    private static ConfigurationRoot NegativeConfiguration(string root, string[] args,
        IEnumerable<KeyValuePair<string, string?>>? childEnvironment = null) => (ConfigurationRoot)new ConfigurationBuilder()
        .SetBasePath(root).AddJsonFile("appsettings.json", optional: false)
        .AddJsonFile("appsettings.Development.json", optional: false)
        // Only the explicit child dictionary; never load ambient environment/user secrets here.
        .AddInMemoryCollection(childEnvironment ?? [])
        .AddCommandLine(args)
        // Match Program's late provider ordering AND reload policy. This is no-start binding proof,
        // not execution of Program or evidence that the actual API has accepted anything.
        .AddJsonFile("appsettings.Development.local.json", optional: false, reloadOnChange: true).Build();

    private static GptLocalInferenceOptions CaptureLocalOptions(IConfiguration configuration, string root)
    {
        var services = new ServiceCollection();
        services.AddGptGroundedContextRuntime(configuration, new Microsoft.Extensions.Hosting.Internal.HostingEnvironment {
            EnvironmentName = Environments.Development, ContentRootPath = root });
        using var provider = services.BuildServiceProvider();
        // Only resolve the actual captured options; no client/provider/process-host is resolved.
        return provider.GetRequiredService<IOptions<GptLocalInferenceOptions>>().Value;
    }

    private static void RequireNegativeCapture(IConfiguration configuration, GptLocalInferenceOptions options, string database)
    {
        if (options.Enabled || options.Endpoint != "" || options.Model != "" || options.EmbeddingModel != ""
            || options.EmbeddingDimensions != 0 || configuration.GetValue<bool?>("OpenTelemetry:Enabled") != false
            || configuration["DatabaseProvider"] != "SQLite"
            || configuration.GetConnectionString("DefaultConnection") != "Data Source=" + database)
            throw new InvalidOperationException("Effective negative provider/database configuration refused before API creation.");
    }

    private static Dictionary<string, string?> SyntheticStartupValues(string database, string key) => new() {
        ["DatabaseProvider"] = "SQLite", ["ConnectionStrings:DefaultConnection"] = "Data Source=" + database,
        ["ConnectionStrings:LevyDatabase"] = "Data Source=" + Path.Combine(Path.GetDirectoryName(database)!, "levy.db"),
        ["JwtSettings:SecretKey"] = key };

    private static JsonObject CaptureSyntheticStartup(IConfiguration configuration, string root, string database, string signingKey)
    {
        if (DatabaseFromContent(root) != database
            || !Regex.IsMatch(signingKey, "^[a-f0-9]{128}$")
            || configuration["JwtSettings:SecretKey"] != signingKey
            || configuration["JwtSettings:Issuer"] != "TerraFusion.API"
            || configuration["JwtSettings:Audience"] != "TerraFusion.Client"
            || configuration.GetValue<int?>("JwtSettings:ExpirationMinutes") != 120
            || configuration.GetConnectionString("LevyDatabase") != "Data Source=" + Path.Combine(Path.GetDirectoryName(database)!, "levy.db")
            || configuration.GetValue<bool?>("AuditLogging:Enabled") != true
            || configuration.GetValue<bool?>("AuditLogging:LogToDatabase") != true
            || configuration.GetValue<bool?>("AuditLogging:LogToFile") != true
            || configuration["Logging:LogLevel:Default"] != "Warning"
            || configuration["Logging:LogLevel:TerraFusion.API.Services.AuditLogger"] != "Information")
            throw new InvalidOperationException("Effective synthetic auth/database/audit profile refused.");
        var runtimeSelections = new JsonObject();
        foreach (var name in new[] { "AtlasProjection", "DaisAppealWorkflow", "DossierEvidenceRegistryRead",
            "DaisAppealMutation", "DossierMutation", "GptGroundedContextRuntime", "GptGroundedAnswerRuntime" })
        {
            var section = configuration.GetSection(name);
            if (section["Mode"] != "LocalExact" || section.GetValue<int?>("TimeoutSeconds") != 30)
                throw new InvalidOperationException("Effective synthetic runtime selection refused: " + name);
            runtimeSelections[name] = new JsonObject { ["mode"] = section["Mode"], ["timeoutSeconds"] = section.GetValue<int>("TimeoutSeconds") };
        }
        // Actual source resolver and registration, never fake markers, factory resolution,
        // provider/HTTP/embedding/RAG calls or process-host Validate/Execute.
        if (!GptGroundedContextRuntimeRegistration.TryResolveSovereignRoot(root, out var sovereignRoot)
            || sovereignRoot != Root())
            throw new InvalidOperationException("Synthetic content must resolve the original GPT checkout.");
        var services = new ServiceCollection();
        services.AddGptGroundedContextRuntime(configuration, new Microsoft.Extensions.Hosting.Internal.HostingEnvironment {
            EnvironmentName = Environments.Development, ContentRootPath = root });
        var local = (IOptions<GptLocalInferenceOptions>)services.Single(value => value.ServiceType == typeof(IOptions<GptLocalInferenceOptions>)).ImplementationInstance!;
        var context = (IOptions<GptGroundedContextRuntimeOptions>)services.Single(value => value.ServiceType == typeof(IOptions<GptGroundedContextRuntimeOptions>)).ImplementationInstance!;
        var answer = (IOptions<GptGroundedAnswerRuntimeOptions>)services.Single(value => value.ServiceType == typeof(IOptions<GptGroundedAnswerRuntimeOptions>)).ImplementationInstance!;
        RequireNegativeCapture(configuration, local.Value, database);
        if (context.Value.Mode != GptGroundedContextRuntimeMode.LocalExact || context.Value.TimeoutSeconds != 30
            || answer.Value.Mode != GptGroundedContextRuntimeMode.LocalExact || answer.Value.TimeoutSeconds != 30
            || context.Value.ModulePath != Path.Combine(sovereignRoot,
                GptGroundedContextRuntimeOptions.ArtifactSlotRelativePath.Replace('/', Path.DirectorySeparatorChar),
                GptGroundedContextRuntimeOptions.ExpectedModuleFilename))
            throw new InvalidOperationException("Actual GPT LocalExact registration intent differs.");
        return new JsonObject {
            ["sovereignRoot"] = sovereignRoot, ["issuer"] = configuration["JwtSettings:Issuer"],
            ["audience"] = configuration["JwtSettings:Audience"], ["expirationMinutes"] = configuration.GetValue<int>("JwtSettings:ExpirationMinutes"),
            ["defaultConnection"] = configuration.GetConnectionString("DefaultConnection"),
            ["levyConnection"] = configuration.GetConnectionString("LevyDatabase"),
            ["auditEnabled"] = configuration.GetValue<bool>("AuditLogging:Enabled"),
            ["auditLogToDatabase"] = configuration.GetValue<bool>("AuditLogging:LogToDatabase"),
            ["auditLogToFile"] = configuration.GetValue<bool>("AuditLogging:LogToFile"),
            ["runtimes"] = runtimeSelections, ["registrationIntentOnly"] = true };
    }

    // Run-local Windows custody, not a watcher or a claim that hashes prevent races. Files are
    // hashed AFTER read/no-write/no-delete handles are acquired and remain open through child exit.
    private sealed class ContentLease : IDisposable
    {
        private readonly List<IDisposable> handles = [];
        private bool held;
        public static ContentLease Acquire(string root, IReadOnlyDictionary<string, string> expected)
        {
            if (!OperatingSystem.IsWindows()) throw new PlatformNotSupportedException("Windows custody proof required.");
            var database = DatabaseFromContent(root);
            if (!expected.Keys.Order().SequenceEqual(ContentFiles.Order()))
                throw new InvalidOperationException("Exact owned negative content inventory required.");
            var lease = new ContentLease();
            try
            {
                // Prevent ancestor replacement/rename, not arbitrary child insertion.
                foreach (var directory in new[] { Path.GetDirectoryName(database)!, Path.GetDirectoryName(root)!, root })
                {
                    RefuseReparse(directory);
                    var handle = NativeJob.CreateFileW(directory, 0, 3, IntPtr.Zero, 3, 0x02200000, IntPtr.Zero);
                    if (handle.IsInvalid) { handle.Dispose(); throw new IOException("Owned directory custody refused."); }
                    lease.handles.Add(handle);
                    RefuseReparse(directory);
                }
                if (!Directory.GetFileSystemEntries(root).Select(Path.GetFileName).Order().SequenceEqual(ContentFiles.Order()))
                    throw new InvalidOperationException("Unexpected negative content inventory.");
                foreach (var name in ContentFiles)
                {
                    lease.HoldFile(Path.Combine(root, name), expected[name]);
                }
                lease.held = true;
                return lease;
            }
            catch { lease.Dispose(); throw; }
        }
        public void HoldFile(string path, string expected)
        {
            RefuseReparse(path);
            if (!Regex.IsMatch(expected, "^[a-f0-9]{64}$")) throw new InvalidOperationException("Original content hash required.");
            var file = new FileStream(path, FileMode.Open, FileAccess.Read, FileShare.Read);
            handles.Add(file);
            RefuseReparse(path);
            if (Convert.ToHexString(SHA256.HashData(file)).ToLowerInvariant() != expected)
                throw new InvalidOperationException("Leased negative launch bytes differ from original admission.");
        }
        public void HoldSecret(string path)
        {
            RequireHeld();
            var run = Directory.GetParent(Path.GetDirectoryName(path)!)!.Parent!.Parent!.Parent!.FullName;
            GuardDatabase(Path.Combine(run, "gpt.db"));
            if (path != OwnedSecretPath(run)) throw new InvalidOperationException("Only the exact owned empty secret input is admitted.");
            foreach (var directory in new[] { Path.Combine(run, "appdata"), Path.Combine(run, "appdata", "Microsoft"),
                Path.Combine(run, "appdata", "Microsoft", "UserSecrets"), Path.GetDirectoryName(path)! })
            {
                RefuseReparse(directory);
                var handle = NativeJob.CreateFileW(directory, 0, 3, IntPtr.Zero, 3, 0x02200000, IntPtr.Zero);
                if (handle.IsInvalid) { handle.Dispose(); throw new IOException("Owned empty-secret directory custody refused."); }
                handles.Add(handle);
                RefuseReparse(directory);
            }
            HoldFile(path, TextHash("{}\n"));
        }
        public void RequireHeld()
        {
            if (!held) throw new InvalidOperationException("Negative content lease has exited; API launch refused.");
        }
        public void Dispose()
        {
            held = false;
            foreach (var handle in handles.AsEnumerable().Reverse()) handle.Dispose();
            handles.Clear();
        }
    }

    // Mutable product output is never leased as a configuration input, seeded or repaired here.
    private static JsonObject ReadRegistryOutput(string run, int apiPid, int port)
    {
        GuardDatabase(Path.Combine(run, "gpt.db"));
        var path = Path.Combine(run, "service-registry.json");
        var platform = Path.Combine(run, "platform.json");
        RefuseReparse(path); RefuseReparse(platform);
        if (File.Exists(platform) || Directory.Exists(platform) || !File.Exists(path) || Directory.Exists(path))
            throw new InvalidOperationException("Only the actual regular owned registry output with no platform input is admitted.");
        using var file = new FileStream(path, FileMode.Open, FileAccess.Read, FileShare.Read);
        if (file.Length is <= 0 or > 65536) throw new InvalidOperationException("Bounded registry output required.");
        var bytes = new byte[checked((int)file.Length)];
        file.ReadExactly(bytes);
        var info = new FileInfo(path);
        RefuseReparse(path);
        var node = JsonNode.Parse(bytes);
        if (apiPid <= 0 || port is not 5193 and not 5194 and not 5195
            || node?["Services"] is not JsonObject services || services.Count != 1
            || services["backend"] is not JsonObject backend
            || backend["Name"]?.GetValue<string>() != "backend" || backend["Pid"]?.GetValue<int>() != apiPid
            || backend["Port"]?.GetValue<int>() != port || backend["Status"]?.GetValue<string>() != "running"
            || backend["Url"]?.GetValue<string>() != "http://localhost:" + port)
            throw new InvalidOperationException("Actual backend registration PID/port/output differs from the owned API.");
        return new JsonObject { ["path"] = path, ["sha256"] = Hash(bytes), ["length"] = bytes.Length,
            ["creationUtcTicks"] = info.CreationTimeUtc.Ticks.ToString(System.Globalization.CultureInfo.InvariantCulture),
            ["apiPid"] = apiPid, ["port"] = port };
    }

    private static void RequireRegistryBeforeLaunch(string run, JsonObject? previous)
    {
        GuardDatabase(Path.Combine(run, "gpt.db"));
        var registry = Path.Combine(run, "service-registry.json");
        var platform = Path.Combine(run, "platform.json");
        RefuseReparse(registry); RefuseReparse(platform);
        if (File.Exists(platform) || Directory.Exists(platform)) throw new InvalidOperationException("Owned platform input must remain absent.");
        if (previous is null)
        {
            if (File.Exists(registry) || Directory.Exists(registry)) throw new InvalidOperationException("First launch registry must be absent.");
            return;
        }
        var actual = ReadRegistryOutput(run, previous["apiPid"]!.GetValue<int>(), previous["port"]!.GetValue<int>());
        RequireRegistryIdentity(previous, actual);
    }

    private static void RequireRegistryIdentity(JsonObject previous, JsonObject actual)
    {
        if (!JsonNode.DeepEquals(previous, actual)) throw new InvalidOperationException("Retained same-run registry identity drift refused.");
    }

    private static async Task LaunchNegativeApi(string database, IReadOnlyDictionary<string, string?> env)
    {
        GuardNegativeProfile(env);
        string Need(string key) => env.TryGetValue(key, out var value) && !string.IsNullOrWhiteSpace(value)
            ? value : throw new InvalidOperationException("Required owned launch field missing: " + key);
        var run = Path.GetDirectoryName(database)!;
        var root = ContentFromDatabase(database);
        var phase = Need("GPT_EO_FIXTURE_PHASE");
        if (!Regex.IsMatch(phase, "^lease-[a-f0-9]{32}$")) throw new InvalidOperationException("Unique lease phase required.");
        var port = Need("GPT_EO_API_PORT");
        if (port is not "5193" and not "5194" and not "5195") throw new InvalidOperationException("Owned negative API port required.");
        var key = Need("GPT_EO_SIGNING_KEY");
        if (!Regex.IsMatch(key, "^[a-f0-9]{128}$")) throw new InvalidOperationException("Ephemeral actual-issuer key required.");
        var apiPath = Path.Combine(Root(), "backend/src/TerraFusion.API/bin/Release/net8.0/TerraFusion.API.dll");
        var expected = new Dictionary<string, string> {
            [ContentFiles[0]] = Need("GPT_EO_API_SHA256"), [ContentFiles[1]] = Need("GPT_EO_APPROVED_SETTINGS_SHA256"),
            [ContentFiles[2]] = Need("GPT_EO_APPROVED_DEVELOPMENT_SETTINGS_SHA256"), [ContentFiles[3]] = TextHash(NegativeLocalJson) };
        RequireSyntheticSettingsApproval(expected[ContentFiles[1]], expected[ContentFiles[2]]);
        var sourceCommit = Need("GPT_EO_EXPECTED_OS_COMMIT");
        var fixtureHash = Need("GPT_EO_FIXTURE_SHA256");
        if (!Regex.IsMatch(sourceCommit, "^[a-f0-9]{40}$") || !Regex.IsMatch(fixtureHash, "^[a-f0-9]{64}$"))
            throw new InvalidOperationException("Original source/fixture identity required.");
        using var lease = ContentLease.Acquire(root, expected);
        lease.HoldFile(typeof(GptGroundedAnswerBrowserFixtureTests).Assembly.Location, fixtureHash);
        JsonObject? previousRegistry = null;
        if (env.TryGetValue("GPT_EO_PREVIOUS_LEASE_PHASE", out var previousPhase) && previousPhase is not null)
        {
            if (!Regex.IsMatch(previousPhase, "^lease-[a-f0-9]{32}$") || previousPhase == phase)
                throw new InvalidOperationException("Exact prior same-run lease phase required.");
            var priorPath = Path.Combine(run, previousPhase + "-exit.json");
            RefuseReparse(priorPath);
            if (!File.Exists(priorPath) || new FileInfo(priorPath).Length is <= 0 or > 65536)
                throw new InvalidOperationException("Bounded regular prior lease receipt required.");
            var prior = JsonNode.Parse(await File.ReadAllTextAsync(priorPath))!;
            if (prior["allJobProcessesExited"]?.GetValue<bool>() != true || prior["jobExitedBeforeLeaseRelease"]?.GetValue<bool>() != true
                || prior["registry"] is not JsonObject registry || prior["apiPid"]?.GetValue<int>() != registry["apiPid"]?.GetValue<int>())
                throw new InvalidOperationException("Previous owned job/registry closure required before restart.");
            previousRegistry = registry;
        }
        RequireRegistryBeforeLaunch(run, previousRegistry);
        var secretPath = RequireOwnedFrameworkSecretPath(run); // BEFORE any host configuration load.
        lease.HoldSecret(secretPath);
        lease.HoldFile(apiPath, expected[ContentFiles[0]]);
        var stop = Path.Combine(run, phase + "-stop.json");
        var ready = Path.Combine(run, phase + "-ready.json");
        var exited = Path.Combine(run, phase + "-exit.json");
        if (new[] { stop, ready, exited }.Any(File.Exists)) throw new InvalidOperationException("Prior lease evidence refused.");
        // Parent identity is admitted before launch; disappearance aborts the owned job, not a shared process.
        using var parent = Process.GetProcessById(int.Parse(Need("GPT_EO_PARENT_PID")));
        var parentStart = parent.StartTime.ToUniversalTime().Ticks;
        var ownerPath = Path.Combine(run, phase + "-owner.json");
        var ownerDeadline = DateTime.UtcNow.AddSeconds(10);
        while (!File.Exists(ownerPath))
        {
            if (parent.HasExited || DateTime.UtcNow > ownerDeadline) throw new InvalidOperationException("Owned wrapper identity missing before API launch.");
            await Task.Delay(50);
        }
        RefuseReparse(ownerPath);
        var owner = JsonNode.Parse(await File.ReadAllTextAsync(ownerPath))!;
        if (owner["harnessPid"]!.GetValue<int>() != parent.Id) throw new InvalidOperationException("Owned harness identity differs.");
        using var wrapper = Process.GetProcessById(owner["wrapperPid"]!.GetValue<int>());
        var wrapperStart = wrapper.StartTime.ToUniversalTime().Ticks;
        await WriteNew(Path.Combine(run, phase + "-parent.json"), new JsonObject {
            ["pid"] = parent.Id, ["startUtcTicks"] = parentStart, ["wrapperPid"] = wrapper.Id,
            ["wrapperStartUtcTicks"] = wrapperStart, ["leasePid"] = Environment.ProcessId });
        var child = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
        foreach (var name in new[] { "SystemRoot", "WINDIR", "ComSpec", "PATHEXT", "USERPROFILE", "DOTNET_ROOT", "Path", "TEMP", "TMP", "APPDATA" })
            if (env.TryGetValue(name, out var value) && value is not null) child[name] = value;
        foreach (var (name, value) in new Dictionary<string, string> {
            ["ASPNETCORE_ENVIRONMENT"] = "Development", ["DOTNET_ENVIRONMENT"] = "Development",
            ["ASPNETCORE_PREVENTHOSTINGSTARTUP"] = "true",
            ["ASPNETCORE_URLS"] = "http://127.0.0.1:" + port, ["TERRAFUSION_API_CONTENT_ROOT"] = root,
            ["DatabaseProvider"] = "SQLite", ["ConnectionStrings__DefaultConnection"] = "Data Source=" + database,
            ["ConnectionStrings__LevyDatabase"] = "Data Source=" + Path.Combine(run, "levy.db"),
            ["TF_SKIP_DEV_SEEDERS"] = "1", ["TF_SKIP_DOCTRINE_SEEDERS"] = "1", ["TF_SKIP_AUTO_MIGRATE"] = "true",
            ["TF_DISABLE_DEV_PIPELINE"] = "1", ["HarrisPACS__BackgroundSync__Enabled"] = "false",
            ["TF_ENABLE_HARRIS_PACS_BACKGROUND_SYNC"] = "false", ["LegacyArcGisSync__Enabled"] = "false",
            ["TF_ENABLE_LEGACY_ARCGIS_SYNC"] = "false", ["TERRAFUSION_UI_DIST_PATH"] = Path.Combine(Root(), "native-shell/ui/dist"),
            ["GptGroundedContextRuntime__Mode"] = "LocalExact", ["GptGroundedAnswerRuntime__Mode"] = "LocalExact",
            ["OpenTelemetry__Enabled"] = "false",
            ["GptLocalInference__Enabled"] = "false", ["GptLocalInference__Endpoint"] = "",
            ["GptLocalInference__Model"] = "", ["GptLocalInference__EmbeddingModel"] = "", ["GptLocalInference__EmbeddingDimensions"] = "0",
            ["DefaultCounty__Id"] = port == "5194" ? "99" : "42", ["DefaultCounty__Code"] = "benton",
            ["JwtSettings__SecretKey"] = key, ["Logging__LogLevel__Default"] = "Warning" }) child[name] = value;
        var args = NegativeArguments(database);
        // Actual framework builder no-start proof in this already-isolated fixture child.
        // API child receives the same APPDATA and exact leased files, then its own fixed env/CLI.
        var childConfiguration = child.Select(pair => new KeyValuePair<string, string?>(pair.Key.Replace("__", ":", StringComparison.Ordinal), pair.Value)).ToArray();
        var telemetryEnabled = VerifyActualBuilder(root, database, args, childConfiguration, key);
        JsonObject startupCapture;
        using (var configuration = NegativeConfiguration(root, args,
            childConfiguration))
            startupCapture = CaptureSyntheticStartup(configuration, root, database, key);
        lease.RequireHeld();
        if (parent.HasExited || wrapper.HasExited || File.Exists(stop) || parent.StartTime.ToUniversalTime().Ticks != parentStart
            || wrapper.StartTime.ToUniversalTime().Ticks != wrapperStart) throw new InvalidOperationException("Owned parent/lease exited before API launch.");
        // Atomic job membership at CreateProcess: there is no started-but-not-yet-assigned API interval.
        // No job handle is inherited. The kernel terminates only this job's children on lease-holder death.
        using var job = new NativeJob();
        // Existing TF_SKIP_* environment flags suppress seeders; every CLI item is an explicit key=value.
        RequireRegistryBeforeLaunch(run, previousRegistry);
        using var process = job.Start(DotnetExecutable(), [apiPath, .. args], child, root);
        try
        {
            await WriteNew(ready, new JsonObject { ["apiPid"] = process.Id, ["apiStartUtcTicks"] = process.StartTime.ToUniversalTime().Ticks,
                ["leasePid"] = Environment.ProcessId, ["port"] = port, ["root"] = root, ["hashes"] = Json(expected),
                ["resolvedSecretPath"] = secretPath, ["emptySecretSha256"] = TextHash("{}\n"),
                ["frameworkAssembly"] = typeof(PathHelper).Assembly.FullName,
                ["sourceCommit"] = sourceCommit, ["fixtureSha256"] = fixtureHash, ["startup"] = startupCapture,
                ["openTelemetryEnabled"] = telemetryEnabled,
                ["enabled"] = false, ["endpoint"] = "", ["model"] = "", ["embeddingModel"] = "", ["dimensions"] = 0,
                ["database"] = database, ["realProviderAcceptance"] = "NOT_RUN" });
            var deadline = DateTime.UtcNow.AddMinutes(30);
            while (!File.Exists(stop))
            {
                lease.RequireHeld();
                if (process.HasExited || parent.HasExited || wrapper.HasExited || DateTime.UtcNow > deadline)
                    throw new InvalidOperationException("Owned negative API/parent/lease lifetime ended unexpectedly.");
                await Task.Delay(100);
            }
            RefuseReparse(stop);
        }
        finally
        {
            // Kill only this run's job. Keep content leases until all job processes have exited.
            job.StopAndWait();
        }
        await WriteNew(exited, new JsonObject { ["apiPid"] = process.Id, ["apiExitCode"] = process.ExitCode,
            ["allJobProcessesExited"] = true, ["jobExitedBeforeLeaseRelease"] = true,
            ["registry"] = ReadRegistryOutput(run, process.Id, int.Parse(port)) });
    }

    [Fact]
    public void ActualFrameworkSecretResolutionRefusesUnownedPathWithoutReadingIt()
    {
        var run = Path.Combine(Root(), ".tmp/gpt-grounded-answer-browser", "run-" + Guid.NewGuid().ToString("N"));
        Assert.Throws<InvalidOperationException>(() => RequireOwnedFrameworkSecretPath(run));
    }

    [Fact]
    public async Task ActualChildAppDataResolutionAndBuilderCaptureUseOnlyOwnedEmptySecretsOrRefusesNonWindows()
    {
        if (!OperatingSystem.IsWindows())
        {
            var refusedRun = Path.Combine(Root(), ".tmp/gpt-grounded-answer-browser", "run-" + Guid.NewGuid().ToString("N"));
            Assert.False(Directory.Exists(refusedRun));
            await Assert.ThrowsAsync<PlatformNotSupportedException>(() => VerifyOwnedConfigurationInChild(Path.Combine(refusedRun, "gpt.db")));
            Assert.False(Directory.Exists(refusedRun));
            output.WriteLine("PLATFORM_REFUSAL_ONLY: no-start configuration entry rejected this OS before setup/spawn/load; Windows APPDATA custody NOT_RUN.");
            return;
        }
        var root = NoStartContent(NegativeLocalJson);
        var run = Path.GetDirectoryName(DatabaseFromContent(root))!;
        var secret = OwnedSecretPath(run);
        Directory.CreateDirectory(Path.GetDirectoryName(secret)!);
        using (var file = new FileStream(secret, FileMode.CreateNew, FileAccess.Write, FileShare.None)) file.Write(Encoding.UTF8.GetBytes("{}\n"));
        var trx = Path.Combine(run, "configuration.trx");
        var start = new ProcessStartInfo(DotnetExecutable()) {
            WorkingDirectory = Root(), UseShellExecute = false, CreateNoWindow = true,
            RedirectStandardOutput = true, RedirectStandardError = true };
        foreach (var arg in new[] { "vstest", typeof(GptGroundedAnswerBrowserFixtureTests).Assembly.Location,
            "/TestCaseFilter:FullyQualifiedName=TerraFusion.Unit.Tests.Gpt.GptGroundedAnswerBrowserFixtureTests.PrepareOrVerifyNegativeOnlyBrowserDatabase",
            "/Logger:trx;LogFileName=configuration.trx", "/ResultsDirectory:" + run }) start.ArgumentList.Add(arg);
        start.Environment.Clear();
        foreach (var key in new[] { "SystemRoot", "WINDIR", "ComSpec", "PATHEXT", "USERPROFILE", "DOTNET_ROOT", "Path" })
            if (Environment.GetEnvironmentVariable(key) is { } value) start.Environment[key] = value;
        foreach (var (key, value) in NegativeEnvironment()) start.Environment[key] = value;
        start.Environment["APPDATA"] = Path.Combine(run, "appdata");
        start.Environment["TEMP"] = run; start.Environment["TMP"] = run;
        start.Environment["GPT_EO_DATABASE_PATH"] = Path.Combine(run, "gpt.db");
        start.Environment["GPT_EO_FIXTURE_MODE"] = "configuration";
        start.Environment["ASPNETCORE_PREVENTHOSTINGSTARTUP"] = "true";
        var stdoutPath = Path.Combine(run, "configuration.stdout.log");
        var stderrPath = Path.Combine(run, "configuration.stderr.log");
        RefuseReparse(stdoutPath); RefuseReparse(stderrPath);
        // Create both before spawn. Never overwrite a prior log or print environment/credentials.
        // This child receives no signing key/token and only the owned empty secret input.
        await using var stdoutLog = new FileStream(stdoutPath, FileMode.CreateNew, FileAccess.Write, FileShare.Read, 4096, useAsync: true);
        await using var stderrLog = new FileStream(stderrPath, FileMode.CreateNew, FileAccess.Write, FileShare.Read, 4096, useAsync: true);
        output.WriteLine("Owned no-start raw diagnostics: stdout={0}; stderr={1}", stdoutPath, stderrPath);
        using var child = Process.Start(start) ?? throw new InvalidOperationException("Owned no-start fixture failed to launch.");
        using var capture = new CancellationTokenSource();
        // Start both pumps before waiting for exit: preserve raw bytes without pipe deadlock.
        var stdout = child.StandardOutput.BaseStream.CopyToAsync(stdoutLog, capture.Token);
        var stderr = child.StandardError.BaseStream.CopyToAsync(stderrLog, capture.Token);
        var drains = Task.WhenAll(stdout, stderr);
        Exception? failure = null;
        try
        {
            using var timeout = new CancellationTokenSource(TimeSpan.FromSeconds(60));
            await child.WaitForExitAsync(timeout.Token);
            await drains.WaitAsync(TimeSpan.FromSeconds(15));
            Assert.Equal(0, child.ExitCode);
            var counters = System.Xml.Linq.XDocument.Load(trx).Descendants().Single(node => node.Name.LocalName == "Counters");
            foreach (var (key, value) in new[] { ("total", "1"), ("executed", "1"), ("passed", "1"), ("failed", "0"), ("notExecuted", "0") })
                Assert.Equal(value, counters.Attribute(key)?.Value);
            var receipt = JsonNode.Parse(await File.ReadAllTextAsync(Path.Combine(run, "configuration-proof.json")))!;
            Assert.Equal(secret, receipt["resolvedSecretPath"]!.GetValue<string>());
            Assert.False(receipt["enabled"]!.GetValue<bool>());
            Assert.False(receipt["openTelemetryEnabled"]!.GetValue<bool>());
            Assert.Equal(root, receipt["root"]!.GetValue<string>());
            Assert.Equal(0, receipt["dimensions"]!.GetValue<int>());
            Assert.False(File.Exists(Path.Combine(run, "gpt.db")));
        }
        catch (Exception error) { failure = error; }
        finally
        {
            try
            {
                if (!child.HasExited)
                {
                    child.Kill(entireProcessTree: true); // Only the child created above and its descendants.
                    using var cleanup = new CancellationTokenSource(TimeSpan.FromSeconds(15));
                    await child.WaitForExitAsync(cleanup.Token);
                }
            }
            catch (Exception error) { failure = failure is null ? error : new AggregateException(failure, error); }
            try { await drains.WaitAsync(TimeSpan.FromSeconds(15)); }
            catch (Exception error)
            {
                failure = failure is null ? error : new AggregateException(failure, error);
                capture.Cancel();
                child.StandardOutput.Dispose(); child.StandardError.Dispose();
                // Observe cancellation/faults; partial raw files remain even if a pipe cannot finish.
                try { await drains.WaitAsync(TimeSpan.FromSeconds(5)); }
                catch (Exception drainError) { output.WriteLine("Owned diagnostic drain ended: {0}", drainError.GetType().Name); }
            }
            finally
            {
                await stdoutLog.FlushAsync(); await stderrLog.FlushAsync();
                output.WriteLine("Owned no-start exit={0}; failure={1}; stdoutBytes={2}; stderrBytes={3}",
                    child.HasExited ? child.ExitCode.ToString() : "UNCONFIRMED", failure?.GetType().Name ?? "none", stdoutLog.Length, stderrLog.Length);
                foreach (var path in new[] { stdoutPath, stderrPath })
                {
                    using var bytes = new FileStream(path, FileMode.Open, FileAccess.Read, FileShare.ReadWrite);
                    output.WriteLine("Retained diagnostic {0} SHA256={1}", path, Convert.ToHexString(SHA256.HashData(bytes)).ToLowerInvariant());
                }
            }
        }
        if (failure is not null) System.Runtime.ExceptionServices.ExceptionDispatchInfo.Capture(failure).Throw();
        Assert.True(stdoutLog.Length > 0, "Actual nested test-runner stdout must be retained, not discarded.");
    }

    private const string SecretId = "terrafusion-api-secrets";
    private static string OwnedSecretPath(string run) => Path.Combine(run, "appdata", "Microsoft", "UserSecrets", SecretId, "secrets.json");
    private static string RequireOwnedFrameworkSecretPath(string run)
    {
        GuardDatabase(Path.Combine(run, "gpt.db"));
        var declared = typeof(GptLocalInferenceOptions).Assembly.GetCustomAttributesData()
            .Single(attribute => attribute.AttributeType == typeof(UserSecretsIdAttribute)).ConstructorArguments.Single().Value as string;
        if (declared != SecretId) throw new InvalidOperationException("Actual API secret input identity changed.");
        // Installed framework path computation only: no File.Exists/read of the returned (possibly live) path.
        var resolved = PathHelper.GetSecretsPathFromSecretsId(declared);
        var expected = OwnedSecretPath(run);
        if (!string.Equals(Path.GetFullPath(resolved), expected, StringComparison.OrdinalIgnoreCase)
            || Environment.GetEnvironmentVariable("APPDATA") != Path.Combine(run, "appdata"))
            throw new InvalidOperationException("Installed framework secret path is not the exact owned input; configuration loading refused.");
        RefuseReparse(expected);
        return expected;
    }

    private static bool VerifyActualBuilder(string root, string database, string[] args,
        IEnumerable<KeyValuePair<string, string?>>? explicitChild = null, string? signingKey = null)
    {
        if (DatabaseFromContent(root) != GuardDatabase(database)) throw new InvalidOperationException("Builder content/database geometry differs.");
        var secret = RequireOwnedFrameworkSecretPath(Path.GetDirectoryName(database)!);
        var builder = WebApplication.CreateBuilder(new WebApplicationOptions { Args = args,
            ApplicationName = typeof(GptLocalInferenceOptions).Assembly.GetName().Name,
            ContentRootPath = root, EnvironmentName = Environments.Development });
        using var configuration = builder.Configuration;
        // Model the exact API child's allowlisted environment before its CLI and late JSON.
        // This fixture process has different launch variables; this is no-start input proof,
        // not an assertion that the separate API has started or consumed those inputs.
        if (explicitChild is not null) configuration.AddInMemoryCollection(explicitChild).AddCommandLine(args);
        configuration.SetBasePath(root).AddJsonFile("appsettings.Development.local.json", optional: true, reloadOnChange: true);
        // Verify the actual installed default secret provider's resolved physical input after load,
        // but only AFTER PathHelper was proved owned and its bytes were leased before CreateBuilder.
        var secretSources = configuration.Sources.OfType<Microsoft.Extensions.Configuration.Json.JsonConfigurationSource>()
            .Where(source => source.Path == "secrets.json").ToArray();
        var source = Assert.Single(secretSources);
        Assert.Equal(secret, source.FileProvider!.GetFileInfo(source.Path!).PhysicalPath, ignoreCase: true);
        RequireNegativeCapture(configuration, CaptureLocalOptions(configuration, root), database);
        if (signingKey is not null) CaptureSyntheticStartup(configuration, root, database, signingKey);
        // Deliberately no builder.Build(), app.Start(), client/provider/host resolution, or model call.
        return configuration.GetValue<bool>("OpenTelemetry:Enabled");
    }

    private static async Task VerifyOwnedConfigurationInChild(string database)
    {
        if (!OperatingSystem.IsWindows()) throw new PlatformNotSupportedException("Windows no-start configuration custody required.");
        var run = Path.GetDirectoryName(database)!;
        var root = ContentFromDatabase(database);
        var secret = RequireOwnedFrameworkSecretPath(run);
        using var lease = ContentLease.Acquire(root, ContentHashes(root)); // No-start fixture inputs, not admission hashes.
        lease.HoldSecret(secret);
        var telemetryEnabled = VerifyActualBuilder(root, database, NegativeArguments(database));
        await WriteNew(Path.Combine(run, "configuration-proof.json"), new JsonObject {
            ["resolvedSecretPath"] = secret, ["frameworkAssembly"] = typeof(PathHelper).Assembly.FullName,
            ["frameworkSha256"] = Hash(File.ReadAllBytes(typeof(PathHelper).Assembly.Location)),
            ["root"] = root, ["openTelemetryEnabled"] = telemetryEnabled,
            ["enabled"] = false, ["endpoint"] = "", ["model"] = "", ["embeddingModel"] = "", ["dimensions"] = 0,
            ["database"] = database, ["hostStarted"] = false, ["realProviderAcceptance"] = "NOT_RUN" });
    }

    // One per-launch Windows job, no named/global object, service, ACL change or shared-process control.
    // JOB_LIST assigns membership atomically at process creation; close-on-lease-death kills its tree.
    private sealed class NativeJob : IDisposable
    {
        private readonly SafeFileHandle job;
        public NativeJob()
        {
            if (!OperatingSystem.IsWindows()) throw new PlatformNotSupportedException("Windows owned job required.");
            job = CreateJobObjectW(IntPtr.Zero, null);
            if (job.IsInvalid) throw new IOException("Owned job creation refused.");
            var limits = new ExtendedLimits { Basic = new BasicLimits { Flags = 0x2000 } }; // KILL_ON_JOB_CLOSE
            if (!SetInformationJobObject(job, 9, ref limits, (uint)Marshal.SizeOf<ExtendedLimits>()))
            { job.Dispose(); throw new IOException("Owned kill-on-close job setup refused."); }
        }

        public Process Start(string executable, string[] args, Dictionary<string, string> environment, string cwd)
        {
            static string Quote(string value)
            {
                // This fixed launch accepts no embedded quotes/control bytes and no trailing slash.
                if (value.Contains('"') || value.Any(char.IsControl) || value.EndsWith('\\'))
                    throw new InvalidOperationException("Unsafe owned launch argument.");
                return "\"" + value + "\"";
            }
            foreach (var (name, value) in environment)
                if (name.Contains('=') || name.Contains('\0') || value.Contains('\0'))
                    throw new InvalidOperationException("Unsafe owned environment field.");
            var environmentBlock = Marshal.StringToHGlobalUni(string.Join('\0', environment.OrderBy(pair => pair.Key, StringComparer.OrdinalIgnoreCase)
                .Select(pair => pair.Key + "=" + pair.Value)) + "\0\0");
            nuint length = 0;
            InitializeProcThreadAttributeList(IntPtr.Zero, 1, 0, ref length);
            var attributes = Marshal.AllocHGlobal(checked((int)length));
            var jobValue = Marshal.AllocHGlobal(IntPtr.Size);
            var initialized = false;
            try
            {
                if (!InitializeProcThreadAttributeList(attributes, 1, 0, ref length))
                    throw new IOException("Owned process attributes refused.");
                initialized = true;
                Marshal.WriteIntPtr(jobValue, job.DangerousGetHandle());
                if (!UpdateProcThreadAttribute(attributes, 0, (nuint)0x2000D, jobValue, (nuint)IntPtr.Size, IntPtr.Zero, IntPtr.Zero))
                    throw new IOException("Atomic owned job membership unavailable; API not created.");
                var startup = new StartupInfoEx { Startup = new StartupInfo { Size = Marshal.SizeOf<StartupInfoEx>() }, Attributes = attributes };
                var command = new StringBuilder(string.Join(' ', new[] { executable }.Concat(args).Select(Quote)));
                // EXTENDED_STARTUPINFO_PRESENT | CREATE_UNICODE_ENVIRONMENT | CREATE_NO_WINDOW.
                if (!CreateProcessW(executable, command, IntPtr.Zero, IntPtr.Zero, false, 0x08080400,
                    environmentBlock, cwd, ref startup, out var info))
                    throw new IOException("Owned API process creation refused.");
                using var processHandle = new SafeFileHandle(info.Process, ownsHandle: true);
                using var threadHandle = new SafeFileHandle(info.Thread, ownsHandle: true);
                return Process.GetProcessById(checked((int)info.ProcessId));
            }
            finally
            {
                if (initialized) DeleteProcThreadAttributeList(attributes);
                Marshal.FreeHGlobal(attributes); Marshal.FreeHGlobal(jobValue); Marshal.FreeHGlobal(environmentBlock);
            }
        }

        public void StopAndWait()
        {
            if (!TerminateJobObject(job, 1)) throw new IOException("Owned job termination failed.");
            var deadline = DateTime.UtcNow.AddSeconds(15);
            while (true)
            {
                if (!QueryInformationJobObject(job, 1, out var accounting, (uint)Marshal.SizeOf<Accounting>(), IntPtr.Zero))
                    throw new IOException("Owned job exit cannot be verified.");
                if (accounting.ActiveProcesses == 0) return;
                // A failure is not a successful receipt. Closing the job still kills its entire tree.
                if (DateTime.UtcNow > deadline) throw new IOException("Owned job exit timed out; kernel kill-on-close remains armed.");
                Thread.Sleep(25);
            }
        }
        public void Dispose() => job.Dispose();

        [StructLayout(LayoutKind.Sequential)]
        private struct BasicLimits { public long ProcessTime, JobTime; public uint Flags; public nuint MinWorkingSet, MaxWorkingSet; public uint ActiveProcessLimit; public nuint Affinity; public uint Priority, Scheduling; }
        [StructLayout(LayoutKind.Sequential)]
        private struct IoCounters { public ulong ReadOperations, WriteOperations, OtherOperations, ReadBytes, WriteBytes, OtherBytes; }
        [StructLayout(LayoutKind.Sequential)]
        private struct ExtendedLimits { public BasicLimits Basic; public IoCounters Io; public nuint ProcessMemory, JobMemory, PeakProcessMemory, PeakJobMemory; }
        [StructLayout(LayoutKind.Sequential)]
        private struct Accounting { public long UserTime, KernelTime, PeriodUserTime, PeriodKernelTime; public uint PageFaults, TotalProcesses, ActiveProcesses, TerminatedProcesses; }
        [StructLayout(LayoutKind.Sequential, CharSet = CharSet.Unicode)]
        private struct StartupInfo { public int Size; public IntPtr Reserved, Desktop, Title; public uint X, Y, XSize, YSize, XChars, YChars, Fill, Flags; public ushort Show, ReservedSize; public IntPtr ReservedBytes, Input, Output, Error; }
        [StructLayout(LayoutKind.Sequential)]
        private struct StartupInfoEx { public StartupInfo Startup; public IntPtr Attributes; }
        [StructLayout(LayoutKind.Sequential)]
        private struct ProcessInfo { public IntPtr Process, Thread; public uint ProcessId, ThreadId; }
        [DllImport("kernel32.dll", CharSet = CharSet.Unicode, SetLastError = true)]
        internal static extern SafeFileHandle CreateFileW(string name, uint access, uint share, IntPtr security, uint disposition, uint flags, IntPtr template);
        [DllImport("kernel32.dll", CharSet = CharSet.Unicode, SetLastError = true)]
        private static extern SafeFileHandle CreateJobObjectW(IntPtr security, string? name);
        [DllImport("kernel32.dll", SetLastError = true)]
        [return: MarshalAs(UnmanagedType.Bool)] private static extern bool SetInformationJobObject(SafeFileHandle job, int kind, ref ExtendedLimits value, uint size);
        [DllImport("kernel32.dll", SetLastError = true)]
        [return: MarshalAs(UnmanagedType.Bool)] private static extern bool QueryInformationJobObject(SafeFileHandle job, int kind, out Accounting value, uint size, IntPtr returned);
        [DllImport("kernel32.dll", SetLastError = true)]
        [return: MarshalAs(UnmanagedType.Bool)] private static extern bool TerminateJobObject(SafeFileHandle job, uint exitCode);
        [DllImport("kernel32.dll", SetLastError = true)]
        [return: MarshalAs(UnmanagedType.Bool)] private static extern bool InitializeProcThreadAttributeList(IntPtr list, int count, uint flags, ref nuint size);
        [DllImport("kernel32.dll", SetLastError = true)]
        [return: MarshalAs(UnmanagedType.Bool)] private static extern bool UpdateProcThreadAttribute(IntPtr list, uint flags, nuint attribute, IntPtr value, nuint size, IntPtr previous, IntPtr returned);
        [DllImport("kernel32.dll")] private static extern void DeleteProcThreadAttributeList(IntPtr list);
        [DllImport("kernel32.dll", CharSet = CharSet.Unicode, SetLastError = true)]
        [return: MarshalAs(UnmanagedType.Bool)] private static extern bool CreateProcessW(string application, StringBuilder command, IntPtr processSecurity,
            IntPtr threadSecurity, [MarshalAs(UnmanagedType.Bool)] bool inherit, uint flags, IntPtr environment, string directory,
            ref StartupInfoEx startup, out ProcessInfo process);
    }

    private static async Task SeedNegative(string path, IReadOnlyDictionary<string, string?> env)
    {
        GuardNegativeProfile(env); // Before any filesystem change; no provider object or call on this path.
        path = GuardDatabase(path);
        RefuseExistingDatabase(path);
        await using var db = Db(path);
        var statements = SelectSchema(db.Database.GenerateCreateScript(), Tables);
        Directory.CreateDirectory(Path.GetDirectoryName(path)!);
        using (File.Open(path, FileMode.CreateNew, FileAccess.Write, FileShare.None)) { }
        foreach (var statement in statements) await db.Database.ExecuteSqlRawAsync(statement);
        var now = DateTime.UtcNow;
        db.Counties.AddRange(new CoreEntities.County { Id = Guid.Parse("11111111-1111-4111-8111-111111111111"), Name = "Benton", State = "WA", FipsCode = "53005" },
            new CoreEntities.County { Id = Guid.Parse("99999999-9999-4999-8999-999999999999"), Name = "Franklin", State = "WA", FipsCode = "53021" });
        foreach (var (offset, county) in new[] { (1, 42), (3, 99) })
        {
            db.Set<RAGDataset>().Add(new RAGDataset { Id = 7200 + offset, Name = "Synthetic unconfigured GPT dataset " + offset,
                CountyId = county, EmbeddingProvider = "", EmbeddingModel = "",
                Status = "Active", DocumentCount = 0, TotalChunks = 0, CreatedAt = now, UpdatedAt = now,
                CreatedBy = "synthetic-negative-fixture", UpdatedBy = "synthetic-negative-fixture" });
            db.GPTConfigurations.Add(new CoreEntities.GPTConfiguration { Id = 7100 + offset,
                Name = "SyntheticUnconfiguredGpt" + offset, DisplayName = "Synthetic unconfigured GPT " + offset,
                Description = "Negative-only local acceptance: no admitted provider or sources.", SystemPrompt = "No provider is admitted.",
                CountyId = county, ModelProvider = "", ModelName = "", EnableRAG = true, RAGDatasetId = 7200 + offset,
                RAGTopK = 1, RAGScoreThreshold = 0.1m, Status = "Active", CreatedAt = now, UpdatedAt = now,
                CreatedBy = "synthetic-negative-fixture", UpdatedBy = "synthetic-negative-fixture" });
        }
        await db.SaveChangesAsync(); // Real prerequisite audits, no documents/vectors/outputs are seeded.
        db.ChangeTracker.Clear();
        var audits = await db.AuditLogs.AsNoTracking().OrderBy(row => row.Id).ToListAsync();
        Assert.Equal(new[] { "County_Added", "County_Added", "GPTConfiguration_Added", "GPTConfiguration_Added", "RAGDataset_Added", "RAGDataset_Added" },
            audits.Select(row => row.Type).Order().ToArray());
        Assert.All(audits, audit => { Assert.Equal("EntityFramework", audit.Source); Assert.Equal("System", audit.UserId);
            Assert.Equal("{}", audit.Data); Assert.Null(audit.CorrelationId); Assert.NotEqual(Guid.Empty, audit.Id); });
        Assert.Equal(6, audits.Select(row => row.Id).Distinct().Count());
        Assert.Empty(await db.GPTConversations.AsNoTracking().ToListAsync());
        await WriteNew(Path.Combine(Path.GetDirectoryName(path)!, "fixture-receipt.json"), new JsonObject {
            ["profile"] = "negative-only", ["providerPolicy"] = "forbidden", ["realProviderAcceptance"] = "NOT_RUN",
            ["primaryConfigId"] = 7101, ["foreignConfigId"] = 7103, ["primaryDatasetId"] = 7201, ["foreignDatasetId"] = 7203,
            ["prerequisiteAuditBaseline"] = Json(audits), ["prerequisiteAuditCount"] = 6 });
        await ReadNegativeState(path); // New read-only DbContext; actual EF mapping, never a converter substitute.
    }

    private static async Task<JsonObject> ReadNegativeState(string path)
    {
        path = GuardDatabase(path);
        var receiptPath = Path.Combine(Path.GetDirectoryName(path)!, "fixture-receipt.json");
        RefuseReparse(receiptPath);
        var receipt = JsonNode.Parse(await File.ReadAllTextAsync(receiptPath))!.AsObject();
        Assert.Equal("negative-only", receipt["profile"]!.GetValue<string>());
        Assert.Equal("forbidden", receipt["providerPolicy"]!.GetValue<string>());
        Assert.Equal(6, receipt["prerequisiteAuditCount"]!.GetValue<int>());
        await using var db = Db(path, readOnly: true);
        var datasets = await db.Set<RAGDataset>().AsNoTracking().OrderBy(row => row.Id).ToListAsync();
        Assert.Equal(new[] { 7201, 7203 }, datasets.Select(row => row.Id).ToArray());
        Assert.Equal(new int?[] { 42, 99 }, datasets.Select(row => row.CountyId).ToArray());
        // Canonical dataset metadata is not provider admission or evidence of any actual vector.
        Assert.All(datasets, row => { Assert.Equal("", row.EmbeddingProvider); Assert.Equal("", row.EmbeddingModel);
            Assert.Equal(1536, row.VectorDimension); Assert.Equal(0, row.DocumentCount); Assert.Equal(0, row.TotalChunks); Assert.Equal("Active", row.Status); });
        var configs = await db.GPTConfigurations.AsNoTracking().OrderBy(row => row.Id).ToListAsync();
        Assert.Equal(new[] { 7101, 7103 }, configs.Select(row => row.Id).ToArray());
        Assert.Equal(new int?[] { 42, 99 }, configs.Select(row => row.CountyId).ToArray());
        Assert.Equal(new int?[] { 7201, 7203 }, configs.Select(row => row.RAGDatasetId).ToArray());
        Assert.All(configs, row => { Assert.Equal("", row.ModelProvider); Assert.Equal("", row.ModelName); Assert.True(row.EnableRAG);
            Assert.Equal("Active", row.Status); Assert.Equal(0, row.TotalMessages); Assert.Equal(0, row.TotalTokensUsed); Assert.Equal(0m, row.TotalCost); });
        Assert.Equal(0, await db.Set<RAGDocument>().CountAsync());
        Assert.Equal(0, await db.Set<RAGEmbedding>().CountAsync());
        Assert.Equal(0, await db.Set<GPTMessage>().CountAsync());
        Assert.Equal(0, await db.Set<GPTAudit>().CountAsync());
        Assert.Equal(0, await db.Set<GPTUsageMetric>().CountAsync());
        var audits = await db.AuditLogs.AsNoTracking().ToListAsync();
        var baseline = receipt["prerequisiteAuditBaseline"]!.AsArray();
        Assert.Equal(6, baseline.Count);
        foreach (var original in baseline)
        {
            var row = Assert.Single(audits.Where(row => row.Id.ToString("D") == original!["Id"]!.GetValue<string>()));
            Assert.True(JsonNode.DeepEquals(original, Json(row)), "Negative prerequisite audit changed or disappeared.");
        }
        var conversations = await db.GPTConversations.AsNoTracking().OrderBy(row => row.Id).ToListAsync();
        Assert.All(conversations, row => { Assert.Equal("dev-user-001", row.UserId); Assert.Equal("Active", row.Status);
            Assert.Equal(row.CountyId == 42 ? 7101 : 7103, row.GPTConfigurationId);
            Assert.Contains(row.CountyId, new[] { 42, 99 }); Assert.Equal(0, row.TotalMessages); });
        return new JsonObject {
            ["profile"] = "negative-only", ["realProviderAcceptance"] = "NOT_RUN",
            ["conversations"] = Json(conversations.Select(row => new { id = row.Id, configId = row.GPTConfigurationId, countyId = row.CountyId, userId = row.UserId })),
            ["messageIds"] = new JsonArray(), ["serviceAuditIds"] = new JsonArray(), ["usageCount"] = 0,
            ["documentCount"] = 0, ["vectorCount"] = 0, ["prerequisiteAuditCount"] = 6, ["actualAuditCount"] = audits.Count };
    }

    private static string DotnetExecutable()
    {
        if (Environment.GetEnvironmentVariable("TERRAFUSION_TEST_DOTNET_EXE") is { Length: > 0 } configured
            && File.Exists(configured))
            return Path.GetFullPath(configured);

        if (Environment.ProcessPath is { Length: > 0 } processPath
            && string.Equals(Path.GetFileName(processPath), "dotnet.exe", StringComparison.OrdinalIgnoreCase)
            && File.Exists(processPath))
            return processPath;

        if (Environment.GetEnvironmentVariable("DOTNET_ROOT") is { Length: > 0 } dotnetRoot)
        {
            var candidate = Path.Combine(dotnetRoot, "dotnet.exe");
            if (File.Exists(candidate)) return candidate;
        }

        var programFiles = Environment.GetFolderPath(Environment.SpecialFolder.ProgramFiles);
        if (!string.IsNullOrWhiteSpace(programFiles))
        {
            var candidate = Path.Combine(programFiles, "dotnet", "dotnet.exe");
            if (File.Exists(candidate)) return candidate;
        }

        throw new InvalidOperationException("Owned dotnet executable not found; set TERRAFUSION_TEST_DOTNET_EXE to the portable SDK path.");
    }

    private static string Root()
    {
        for (var current = new DirectoryInfo(AppContext.BaseDirectory); current != null; current = current.Parent)
            if (File.Exists(Path.Combine(current.FullName, "backend/src/TerraFusion.API/TerraFusion.API.csproj")))
                return current.FullName;
        throw new InvalidOperationException("Owned GPT checkout not found.");
    }

    private static string GuardDatabase(string path)
    {
        if (!Path.IsPathFullyQualified(path) || path.Split(['/', '\\']).Any(part => part is "." or ".."))
            throw new InvalidOperationException("Absolute non-traversing GPT database required.");
        var full = Path.GetFullPath(path);
        var directory = new DirectoryInfo(Path.GetDirectoryName(full)!);
        if (Path.GetFileName(full) != "gpt.db" || !Regex.IsMatch(directory.Name, "^run-[a-f0-9]{32}$") ||
            !string.Equals(directory.Parent?.FullName, Path.Combine(Root(), ".tmp", "gpt-grounded-answer-browser"),
                OperatingSystem.IsWindows() ? StringComparison.OrdinalIgnoreCase : StringComparison.Ordinal))
            throw new InvalidOperationException("Only the owned GPT run-UUID/gpt.db is admitted.");
        RefuseReparse(full);
        return full;
    }

    private static void RefuseReparse(string path)
    {
        for (var current = path; current != null; current = Path.GetDirectoryName(current))
        {
            FileAttributes attributes;
            try { attributes = File.GetAttributes(current); }
            catch (FileNotFoundException) { continue; }
            catch (DirectoryNotFoundException) { continue; }
            if (attributes.HasFlag(FileAttributes.ReparsePoint)) throw new InvalidOperationException("Reparse fixture paths refused.");
        }
    }

    private static TerraFusionDbContext Db(string path, bool readOnly = false)
    {
        TerraFusionDbContext.OnModelCreatingExtensions = GptAiEntityConfigurations.Apply;
        return new(new DbContextOptionsBuilder<TerraFusionDbContext>()
            .UseSqlite($"Data Source={path};Mode={(readOnly ? "ReadOnly" : "ReadWrite")};Pooling=False").Options,
            new ConfigurationBuilder().Build());
    }

    private static string[] SelectSchema(string script, string[] required)
    {
        var tables = Regex.Matches(script, "CREATE TABLE \"([^\"]+)\"[\\s\\S]*?;").Cast<Match>()
            .Where(match => required.Contains(match.Groups[1].Value, StringComparer.Ordinal)).ToArray();
        if (tables.Length != required.Length || tables.Select(match => match.Groups[1].Value).Distinct(StringComparer.Ordinal).Count() != required.Length ||
            !required.All(name => tables.Any(match => match.Groups[1].Value == name)))
            throw new InvalidOperationException("Missing or duplicate actual EF prerequisite table.");
        var statements = tables.Select(match => match.Value).ToList();
        var indexes = new HashSet<string>(StringComparer.Ordinal);
        foreach (Match index in Regex.Matches(script, "CREATE (?:UNIQUE )?INDEX [^;]+;"))
        {
            var target = Regex.Match(index.Value, "\\bON \"([^\"]+)\"");
            if (!target.Success) throw new InvalidOperationException("Unrecognized generated EF index target.");
            if (!required.Contains(target.Groups[1].Value, StringComparer.Ordinal)) continue;
            if (!indexes.Add(index.Value)) throw new InvalidOperationException("Duplicate required EF index.");
            statements.Add(index.Value);
        }
        return statements.ToArray();
    }

    private static GptLocalInferenceOptions Admission(IReadOnlyDictionary<string, string?> env)
    {
        string Need(string key) => env.TryGetValue(key, out var value) && !string.IsNullOrWhiteSpace(value)
            ? value : throw new InvalidOperationException("Explicit admitted field required: " + key);
        if (Need("GPT_EO_ADMISSION") != "admitted" || Need("GPT_EO_RUNTIME") != "owned")
            throw new InvalidOperationException("Actual embedding admission remains required.");
        var endpoint = new Uri(Need("GPT_EO_ENDPOINT"), UriKind.Absolute);
        if (endpoint.Scheme != "http" || endpoint.Host != "127.0.0.1" || endpoint.Port <= 0 ||
            endpoint.UserInfo.Length != 0 || endpoint.Query.Length != 0 || endpoint.Fragment.Length != 0 || endpoint.AbsolutePath != "/" ||
            new[] { 5193, 5194, 5195, 5196 }.Contains(endpoint.Port))
            throw new InvalidOperationException("Separately admitted loopback embedding endpoint required.");
        if (!int.TryParse(Need("GPT_EO_EMBEDDING_DIMENSIONS"), out var dimension) || dimension is < 1 or > 16384)
            throw new InvalidOperationException("Explicit admitted embedding dimension required.");
        var model = Need("GPT_EO_ADMITTED_MODEL");
        var embedding = Need("GPT_EO_EMBEDDING_MODEL");
        if (new[] { model, embedding }.Any(value => value.Length > 100 || value.Trim() != value || value.Any(char.IsControl)))
            throw new InvalidOperationException("Invalid admitted model identifier.");
        return new() { Enabled = true, Endpoint = endpoint.AbsoluteUri, Model = model,
            EmbeddingModel = embedding, EmbeddingDimensions = dimension, TimeoutSeconds = 120 };
    }

    private static string Hash(byte[] bytes) => Convert.ToHexString(SHA256.HashData(bytes)).ToLowerInvariant();
    private static string TextHash(string value) => Hash(Encoding.UTF8.GetBytes(value));
    private static string VectorHash(float[] values)
    {
        var bytes = new byte[values.Length * 4];
        for (var i = 0; i < values.Length; i++) BinaryPrimitives.WriteSingleLittleEndian(bytes.AsSpan(i * 4, 4), values[i]);
        return Hash(bytes);
    }
    private static JsonNode Json<T>(T value) => JsonSerializer.SerializeToNode(value)!;
    private static async Task WriteNew(string path, JsonNode value)
    {
        RefuseReparse(path);
        await using var output = new FileStream(path, FileMode.CreateNew, FileAccess.Write, FileShare.None);
        await JsonSerializer.SerializeAsync(output, value);
    }

    private static async Task Seed(string path)
    {
        var keys = new[] { "GPT_EO_ADMISSION", "GPT_EO_RUNTIME", "GPT_EO_ENDPOINT", "GPT_EO_ADMITTED_MODEL", "GPT_EO_EMBEDDING_MODEL", "GPT_EO_EMBEDDING_DIMENSIONS" };
        var options = Admission(keys.ToDictionary(key => key, Environment.GetEnvironmentVariable));
        RefuseExistingDatabase(path);
        await using var db = Db(path);
        var statements = SelectSchema(db.Database.GenerateCreateScript(), Tables); // Before network and before creating a DB.
        Directory.CreateDirectory(Path.GetDirectoryName(path)!);
        using (File.Open(path, FileMode.CreateNew, FileAccess.Write, FileShare.None)) { }
        foreach (var statement in statements) await db.Database.ExecuteSqlRawAsync(statement);
        using var transport = new HttpClientHandler { UseProxy = false, AllowAutoRedirect = false, UseCookies = false };
        using var http = new HttpClient(transport) { Timeout = TimeSpan.FromSeconds(125) };
        var provider = new GptLocalInferenceProvider(http, Options.Create(options),
            new Microsoft.Extensions.Hosting.Internal.HostingEnvironment { EnvironmentName = Environments.Development });
        // This one explicitly admitted synthetic fixture operation is not product ingestion/reindexing.
        // The strict adapter checks actual returned model, finite vector and exact declared dimension.
        var vector = await provider.GenerateProviderEmbeddingAsync(Source, options.EmbeddingModel);
        if (vector.Length != options.EmbeddingDimensions || vector.Any(value => !float.IsFinite(value)) || !vector.Any(value => value != 0))
            throw new InvalidOperationException("Actual synthetic source embedding is incompatible.");
        var now = DateTime.UtcNow;
        db.Counties.AddRange(new CoreEntities.County { Id = Guid.Parse("11111111-1111-4111-8111-111111111111"), Name = "Benton", State = "WA", FipsCode = "53005" },
            new CoreEntities.County { Id = Guid.Parse("99999999-9999-4999-8999-999999999999"), Name = "Franklin", State = "WA", FipsCode = "53021" });
        for (var i = 1; i <= 3; i++)
        {
            db.Set<RAGDataset>().Add(new RAGDataset { Id = 7200 + i, Name = "Synthetic GPT fixture " + i,
                CountyId = i == 3 ? 99 : 42, EmbeddingProvider = "ollama", EmbeddingModel = options.EmbeddingModel,
                VectorDimension = options.EmbeddingDimensions, Status = "Active", DocumentCount = i == 1 ? 1 : 0,
                TotalChunks = i == 1 ? 1 : 0, CreatedAt = now, UpdatedAt = now, CreatedBy = "synthetic-fixture", UpdatedBy = "synthetic-fixture" });
            db.GPTConfigurations.Add(new CoreEntities.GPTConfiguration { Id = 7100 + i, Name = "SyntheticGpt" + i,
                DisplayName = "Synthetic GPT " + i, Description = "Isolated EO acceptance only", SystemPrompt = "Use only supplied synthetic reference sources.",
                CountyId = i == 3 ? 99 : 42, ModelProvider = "ollama", ModelName = options.Model,
                EnableRAG = true, RAGDatasetId = 7200 + i, RAGTopK = 1, RAGScoreThreshold = 0.1m,
                Status = "Active", CreatedAt = now, UpdatedAt = now, CreatedBy = "synthetic-fixture", UpdatedBy = "synthetic-fixture" });
        }
        db.Set<RAGDocument>().Add(new RAGDocument { Id = 7301, DatasetId = 7201, Title = "Synthetic inspection reference", Content = Source,
            DocumentType = "synthetic", ChunkCount = 1, CreatedAt = now, UpdatedAt = now });
        db.Set<RAGEmbedding>().Add(new RAGEmbedding { Id = 7401, DatasetId = 7201, DocumentId = 7301, ChunkIndex = 0,
            ChunkText = Source, Embedding = vector, StartPosition = 0, EndPosition = Source.Length, CreatedAt = now });
        await db.SaveChangesAsync(); // Preserve real automatic EntityFramework prerequisite audit rows.
        db.ChangeTracker.Clear();
        Assert.Equal(VectorHash(vector), VectorHash((await db.Set<RAGEmbedding>().SingleAsync()).Embedding));
        Assert.Empty(await db.GPTConversations.ToListAsync());
        Assert.Empty(await db.Set<GPTMessage>().ToListAsync());
        Assert.Empty(await db.Set<GPTUsageMetric>().ToListAsync());
        Assert.Empty(await db.Set<GPTAudit>().ToListAsync());
        var audits = await db.AuditLogs.AsNoTracking().OrderBy(row => row.Id).ToListAsync();
        Assert.Equal(PrerequisiteAuditTypes.Order().ToArray(), audits.Select(row => row.Type).Order().ToArray());
        Assert.All(audits, audit => { Assert.Equal("EntityFramework", audit.Source); Assert.Equal("System", audit.UserId);
            Assert.Equal("{}", audit.Data); Assert.Null(audit.CorrelationId); Assert.NotEqual(Guid.Empty, audit.Id); });
        await WriteNew(Path.Combine(Path.GetDirectoryName(path)!, "fixture-receipt.json"), new JsonObject {
            ["sourceText"] = Source, ["expectedAnswerFragment"] = "17", ["sourceSha256"] = TextHash(Source),
            ["vectorSha256"] = VectorHash(vector), ["provider"] = "ollama", ["model"] = options.Model,
            ["embeddingModel"] = options.EmbeddingModel, ["dimensions"] = options.EmbeddingDimensions,
            ["prerequisiteAuditBaseline"] = Json(audits), ["prerequisiteAuditCount"] = audits.Count,
            ["groundedConfigId"] = 7101, ["emptyConfigId"] = 7102, ["foreignConfigId"] = 7103 });
    }

    private static void RefuseExistingDatabase(string path)
    {
        if (File.Exists(path)) throw new InvalidOperationException("Existing fixture DB will never be overwritten/reseeded.");
    }

    private static async Task Verify(string path, bool final)
    {
        var directory = Path.GetDirectoryName(path)!;
        var phase = Environment.GetEnvironmentVariable("GPT_EO_FIXTURE_PHASE") ?? "";
        if (!Regex.IsMatch(phase, "^[a-z][a-z0-9-]{0,39}$")) throw new InvalidOperationException("Bounded unique fixture phase required.");
        var receiptPath = Path.Combine(directory, "fixture-receipt.json");
        RefuseReparse(receiptPath);
        var receipt = JsonNode.Parse(await File.ReadAllTextAsync(receiptPath))!.AsObject();
        await using var db = Db(path, readOnly: true);
        var storedVector = await db.Set<RAGEmbedding>().AsNoTracking().SingleAsync();
        Assert.Equal(7401, storedVector.Id); Assert.Equal(7201, storedVector.DatasetId); Assert.Equal(7301, storedVector.DocumentId);
        Assert.Equal(Source, storedVector.ChunkText);
        Assert.Equal(Source, (await db.Set<RAGDocument>().AsNoTracking().SingleAsync()).Content);
        Assert.Equal(receipt["sourceSha256"]!.GetValue<string>(), TextHash(Source));
        Assert.Equal(receipt["vectorSha256"]!.GetValue<string>(), VectorHash(storedVector.Embedding));
        Assert.Equal(receipt["dimensions"]!.GetValue<int>(), storedVector.Embedding.Length);
        Assert.All(await db.Set<RAGDataset>().AsNoTracking().ToListAsync(), dataset => {
            Assert.Equal("ollama", dataset.EmbeddingProvider); Assert.Equal(receipt["embeddingModel"]!.GetValue<string>(), dataset.EmbeddingModel);
            Assert.Equal(storedVector.Embedding.Length, dataset.VectorDimension); });
        var audits = await db.AuditLogs.AsNoTracking().ToListAsync();
        foreach (var original in receipt["prerequisiteAuditBaseline"]!.AsArray())
        {
            var row = Assert.Single(audits.Where(row => row.Id.ToString("D") == original!["Id"]!.GetValue<string>()));
            Assert.True(JsonNode.DeepEquals(original, Json(row)), "Prerequisite audit row changed or disappeared.");
        }
        Assert.Equal(PrerequisiteAuditTypes.Length, receipt["prerequisiteAuditCount"]!.GetValue<int>());
        var messages = await db.Set<GPTMessage>().AsNoTracking().OrderBy(row => row.Id).ToListAsync();
        var serviceAudits = await db.Set<GPTAudit>().AsNoTracking().OrderBy(row => row.Id).ToListAsync();
        var conversations = await db.GPTConversations.AsNoTracking().OrderBy(row => row.Id).ToListAsync();
        Assert.Empty(await db.Set<GPTUsageMetric>().ToListAsync()); // Unknown usage is never fabricated.
        if (final)
        {
            var expectedPath = Path.Combine(directory, "observed-messages.json");
            RefuseReparse(expectedPath);
            var observed = JsonNode.Parse(await File.ReadAllTextAsync(expectedPath))!.AsArray();
            Assert.NotEmpty(observed);
            Assert.Equal(observed.Count * 2, messages.Count);
            Assert.Equal(observed.Count, serviceAudits.Count);
            Assert.Equal(observed.Count, messages.Count(row => row.Role == "assistant"));
            foreach (var expected in observed)
            {
                var message = Assert.Single(messages.Where(row => row.Id == expected!["id"]!.GetValue<int>()));
                Assert.Equal(expected!["conversationId"]!.GetValue<int>(), message.ConversationId);
                var exchange = JsonNode.Parse(message.FunctionResult!)!;
                Assert.True(JsonNode.DeepEquals(expected["exchange"], exchange));
                Assert.Equal("gpt.grounded-answer@1.0.0", message.FunctionName);
                var provenance = JsonNode.Parse(message.FunctionArgs!)!;
                Assert.Equal(GptGroundedAnswerRuntimeOptions.ExpectedCommit, provenance["sourceCommit"]!.GetValue<string>());
                Assert.Equal(GptGroundedAnswerRuntimeOptions.Artifacts[0].Sha256, provenance["moduleSha256"]!.GetValue<string>());
                Assert.Equal(GptGroundedAnswerRuntimeOptions.Artifacts[3].Sha256, provenance["specificationSha256"]!.GetValue<string>());
                var conversation = Assert.Single(conversations.Where(row => row.Id == message.ConversationId));
                Assert.Equal(42, conversation.CountyId); Assert.Equal("dev-user-001", conversation.UserId);
                var serviceAudit = Assert.Single(serviceAudits.Where(row => row.MessageId == message.Id));
                Assert.Equal(conversation.Id, serviceAudit.ConversationId); Assert.Equal(42, serviceAudit.CountyId);
                Assert.Equal("dev-user-001", serviceAudit.UserId);
                var result = exchange["result"]!;
                if (result["status"]!.GetValue<string>() == "ANSWERED")
                {
                    Assert.Equal(receipt["model"]!.GetValue<string>(), message.ModelUsed);
                    Assert.Equal("ollama", message.Provider); Assert.Contains("17", message.Content);
                    Assert.Equal(message.Provider, serviceAudit.LLMProvider); Assert.Equal(message.ModelUsed, serviceAudit.LLMModel);
                    Assert.NotEmpty(result["citations"]!.AsArray());
                    foreach (var citation in result["citations"]!.AsArray())
                        Assert.Contains(exchange["context"]!["result"]!["citations"]!.AsArray(), source =>
                            source!["sourceId"]!.GetValue<string>() == citation!["sourceId"]!.GetValue<string>() &&
                            source["chunkId"]!.GetValue<string>() == citation["chunkId"]!.GetValue<string>());
                }
                else { Assert.True(string.IsNullOrEmpty(message.Content)); Assert.Null(message.ModelUsed); Assert.Null(message.Provider); }
            }
        }
        await WriteNew(Path.Combine(directory, "snapshot-" + phase + ".json"), new JsonObject {
            ["messageIds"] = Json(messages.Select(row => row.Id)), ["serviceAuditIds"] = Json(serviceAudits.Select(row => row.Id)),
            ["conversationIds"] = Json(conversations.Select(row => row.Id)), ["usageCount"] = 0,
            ["answeredIds"] = Json(messages.Where(row => row.FinishReason == "ANSWERED").Select(row => row.Id)),
            ["vectorSha256"] = VectorHash(storedVector.Embedding), ["prerequisiteAuditCount"] = PrerequisiteAuditTypes.Length,
            ["actualAuditCount"] = audits.Count, ["finalVerified"] = final });
    }

    private sealed class GptBrowserFixtureFactAttribute : FactAttribute
    {
        public GptBrowserFixtureFactAttribute()
        {
            if (string.IsNullOrWhiteSpace(Environment.GetEnvironmentVariable("GPT_EO_DATABASE_PATH")))
                Skip = "Requires the explicit owned GPT browser fixture. Actual harness requires one executed case, no skip.";
        }
    }
}

[CollectionDefinition("GPT real browser fixture", DisableParallelization = true)]
public sealed class GptRealBrowserFixtureCollection { }
