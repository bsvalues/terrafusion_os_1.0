using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.FileProviders;
using Microsoft.Extensions.Hosting;
using Moq;
using TerraFusion.AI.Interfaces;
using TerraFusion.API.Services.Gpt;
using TerraFusion.Data;
using Xunit;

namespace TerraFusion.Unit.Tests.Gpt;

public sealed class GptGroundedAnswerRuntimeTests
{
    [Theory]
    [InlineData(true, true)]
    [InlineData(true, false)]
    [InlineData(false, true)]
    [InlineData(false, false)]
    public async Task CountyCapabilityDenialStopsGroundedSendBeforeDownstreamOrPersistence(
        bool useGuardrail, bool denyRag)
    {
        // Each real gate is exercised independently. A missing RequiresRag/RequiresEmbedding
        // flag permits entry into the answer pipeline and makes this controller assertion fail.
        const int county = 42;
        var countyEnum = (TerraFusion.AI.Models.CountyId)county;
        TerraFusion.AI.Models.CountyHelper.GetCountyInfo(countyEnum).IsConfigured.Should().BeTrue();
        var orchestration = new Mock<IGPTOrchestrationService>(MockBehavior.Strict);
        orchestration.Setup(value => value.GetConversationAsync(10)).ReturnsAsync(new TerraFusion.Core.Entities.GPTConversation
        { Id = 10, GPTConfigurationId = 1, UserId = "test-user", CountyId = county, Status = "Active" });
        var configurations = new Mock<IGPTConfigurationService>(MockBehavior.Strict);
        configurations.Setup(value => value.GetAvailableGPTsAsync("test-user", county, "User"))
            .ReturnsAsync([new TerraFusion.Core.Entities.GPTConfiguration
            { Id = 1, CountyId = county, Status = "Active", EnableRAG = true, RAGDatasetId = 7 }]);
        var policy = new TerraFusion.AI.Models.SystemGptPolicyDto
        {
            AllowGptSendMessage = true,
            AllowRagQueries = !denyRag,
            AllowEmbeddings = denyRag,
        };
        var policyService = new Mock<TerraFusion.AI.Services.ICountyPolicyService>(MockBehavior.Strict);
        policyService.Setup(value => value.GetPolicyAsync(countyEnum)).ReturnsAsync(policy);
        var metrics = new Mock<TerraFusion.AI.Services.ISystemGptMetricsService>(MockBehavior.Strict);
        metrics.Setup(value => value.GetSnapshot(TimeSpan.FromMinutes(15), 20))
            .Returns(new TerraFusion.AI.Models.SystemGptMetricsSnapshotDto());
        var guardrail = new TerraFusion.AI.Services.SystemGptGuardrailService(
            Microsoft.Extensions.Logging.Abstractions.NullLogger<TerraFusion.AI.Services.SystemGptGuardrailService>.Instance);
        var evaluator = new TerraFusion.AI.Services.SystemGptPolicyEvaluator(policyService.Object,
            Microsoft.Extensions.Logging.Abstractions.NullLogger<TerraFusion.AI.Services.SystemGptPolicyEvaluator>.Instance);
        var rag = new Mock<IRAGService>(MockBehavior.Strict);
        // The answer service is the sole downstream retrieval/embedding/generation/persistence
        // entry point. Strict verification forbids entering it, not just returning a denial later.
        var answer = new Mock<IGptGroundedAnswerService>(MockBehavior.Strict);
        var controller = new TerraFusion.API.Controllers.GPTController(configurations.Object, orchestration.Object,
            rag.Object, Microsoft.Extensions.Logging.Abstractions.NullLogger<TerraFusion.API.Controllers.GPTController>.Instance,
            metricsService: metrics.Object, policyService: policyService.Object,
            policyEvaluator: useGuardrail ? null : evaluator,
            guardrailService: useGuardrail ? guardrail : null, groundedAnswerService: answer.Object)
        {
            ControllerContext = new Microsoft.AspNetCore.Mvc.ControllerContext
            {
                HttpContext = new Microsoft.AspNetCore.Http.DefaultHttpContext
                {
                    User = new System.Security.Claims.ClaimsPrincipal(new System.Security.Claims.ClaimsIdentity(
                    [new(System.Security.Claims.ClaimTypes.NameIdentifier, "test-user"), new("CountyId", "42")], "Test")),
                },
            },
        };
        var result = await controller.SendMessage(10, new TerraFusion.API.Controllers.GPTController.SendMessageRequest
        { GPTConfigId = 1, Message = "Synthetic grounded question" });
        answer.VerifyNoOtherCalls();
        var denied = result.Result.Should().BeOfType<Microsoft.AspNetCore.Mvc.OkObjectResult>().Subject;
        var message = denied.Value.Should().BeOfType<TerraFusion.AI.Entities.GPTMessage>().Subject;
        message.Content.Should().Contain(useGuardrail ? "Request blocked by AI Guardrails" : "Request blocked by AI Policy");
        message.Content.Should().Contain(denyRag ? "RAG" : "Embedding");
        message.Id.Should().Be(0);
        message.Provider.Should().BeNull();
        message.ModelUsed.Should().BeNull();
        message.FunctionResult.Should().BeNull();
        rag.VerifyNoOtherCalls();
        orchestration.Verify(value => value.GetConversationAsync(10), Times.Once);
        orchestration.VerifyNoOtherCalls();
    }

    [Fact]
    public void GroundedAnswerRegistrationNeverResolvesGlobalRemoteEmbeddingFactory()
    {
        var services = new ServiceCollection();
        var configuration = new ConfigurationBuilder().AddInMemoryCollection(new Dictionary<string, string?>
        {
            ["GptGroundedContextRuntime:Mode"] = "Disabled",
            ["GptLocalInference:Enabled"] = "false",
        }).Build();
        services.AddSingleton<IConfiguration>(configuration);
        services.AddSingleton<IHostEnvironment>(new Host());
        services.AddLogging();
        services.AddScoped<IGPTConfigurationService>(_ => new Mock<IGPTConfigurationService>(MockBehavior.Strict).Object);
        services.AddDbContext<TerraFusionDbContext>(options => options.UseInMemoryDatabase($"eo-gpt-di-{Guid.NewGuid():N}"));
        services.AddScoped<IRAGEmbeddingRepository>(_ => new Mock<IRAGEmbeddingRepository>(MockBehavior.Strict).Object);
        var remoteResolutions = 0;
        services.AddScoped<IEmbeddingService>(_ =>
        {
            remoteResolutions++;
            throw new InvalidOperationException("Remote provider factory must never be resolved by the real local path.");
        });
        services.AddGptGroundedContextRuntime(configuration, new Host());
        using var container = services.BuildServiceProvider();
        using var scope = container.CreateScope();
        scope.ServiceProvider.GetRequiredService<IGptGroundedAnswerService>().Should().NotBeNull();
        scope.ServiceProvider.GetRequiredService<IGPTOrchestrationService>().Should().NotBeNull();
        scope.ServiceProvider.GetRequiredKeyedService<IRAGService>("gpt-local-retrieval").Should().NotBeNull();
        ActivatorUtilities.CreateInstance<TerraFusion.API.Controllers.GPTController>(scope.ServiceProvider).Should().NotBeNull();
        remoteResolutions.Should().Be(0);
    }

    [Fact]
    public async Task MissingProtectedAnswerArtifactFailsClosedBeforeExecution()
    {
        var root = Path.Combine(Path.GetTempPath(), $"eo-gpt-no-artifact-{Guid.NewGuid():N}");
        var host = new GptGroundedAnswerProcessHost(root, "node", TimeSpan.FromSeconds(5));
        var result = await host.ValidateAsync("{}");
        result.Succeeded.Should().BeFalse();
        result.Accepted.Should().BeFalse();
        result.NormalizedExchangeJson.Should().BeNull();
        result.FailureCode.Should().Be("RUNTIME_UNAVAILABLE");
    }

    [Theory]
    [InlineData("foreign-user", "42")]
    [InlineData("test-user", "99")]
    public async Task ForeignHistoryAndTraceStopBeforeMessageRetrieval(string caller, string county)
    {
        var orchestration = new Mock<IGPTOrchestrationService>(MockBehavior.Strict);
        orchestration.Setup(value => value.GetConversationAsync(10)).ReturnsAsync(new TerraFusion.Core.Entities.GPTConversation
        { Id = 10, GPTConfigurationId = 1, UserId = "test-user", CountyId = 42, Status = "Active" });
        var configurations = new Mock<IGPTConfigurationService>(MockBehavior.Strict);
        var controller = new TerraFusion.API.Controllers.GPTController(configurations.Object, orchestration.Object,
            new Mock<IRAGService>(MockBehavior.Strict).Object,
            Microsoft.Extensions.Logging.Abstractions.NullLogger<TerraFusion.API.Controllers.GPTController>.Instance)
        {
            ControllerContext = new Microsoft.AspNetCore.Mvc.ControllerContext
            {
                HttpContext = new Microsoft.AspNetCore.Http.DefaultHttpContext
                {
                    User = new System.Security.Claims.ClaimsPrincipal(new System.Security.Claims.ClaimsIdentity(
                    [new(System.Security.Claims.ClaimTypes.NameIdentifier, caller), new("CountyId", county)], "Test")),
                },
            },
        };
        (await controller.GetConversationHistory(10)).Result.Should().BeOfType<Microsoft.AspNetCore.Mvc.NotFoundResult>();
        (await controller.GetConversationTrace(10)).Result.Should().BeAssignableTo<Microsoft.AspNetCore.Mvc.NotFoundObjectResult>();
        orchestration.Verify(value => value.GetConversationHistoryAsync(It.IsAny<int>(), It.IsAny<int>()), Times.Never);
        configurations.VerifyNoOtherCalls();
    }


    [Fact]
    public async Task ExactProtectedSnapshotsExecuteCanonicalAnswerAndContext()
    {
        using var fixture = new ProtectedFixture();
        var host = new GptGroundedAnswerProcessHost(fixture.Root, Node(), TimeSpan.FromSeconds(30));
        var answer = await host.ValidateAsync(Exchange);
        answer.Succeeded.Should().BeTrue();
        answer.Accepted.Should().BeTrue();
        System.Text.Json.Nodes.JsonNode.Parse(answer.NormalizedExchangeJson!)!["result"]!["answer"]!.GetValue<string>()
            .Should().Be("Synthetic supported answer");
        var context = System.Text.Json.Nodes.JsonNode.Parse(Exchange)!["context"]!.ToJsonString();
        var preflight = await ((IGptGroundedContextProcessHost)host).ValidateAsync(context);
        preflight.Succeeded.Should().BeTrue();
        preflight.Accepted.Should().BeTrue();
    }

    [Theory]
    [InlineData(0)]
    [InlineData(1)]
    [InlineData(2)]
    [InlineData(3)]
    [InlineData(4)]
    public async Task TamperingAnyProtectedDependencyOrSpecificationFailsClosed(int artifact)
    {
        using var fixture = new ProtectedFixture();
        var identity = TerraFusion.API.Configuration.GptGroundedAnswerRuntimeOptions.Artifacts[artifact];
        var path = Path.Combine(fixture.Slot, identity.Path);
        var bytes = File.ReadAllBytes(path);
        bytes[0] ^= 1;
        File.WriteAllBytes(path, bytes);
        var host = new GptGroundedAnswerProcessHost(fixture.Root, Node(), TimeSpan.FromSeconds(30));
        var result = await host.ValidateAsync(Exchange);
        result.Succeeded.Should().BeFalse();
        result.NormalizedExchangeJson.Should().BeNull();
        result.FailureCode.Should().Be("RUNTIME_UNAVAILABLE");
    }

    [Fact]
    public async Task WrongProtectedCommitReceiptCannotAuthorizeExecution()
    {
        using var fixture = new ProtectedFixture();
        File.WriteAllText(Path.Combine(fixture.Slot, "adoption.json"), "{}");
        var host = new GptGroundedAnswerProcessHost(fixture.Root, Node(), TimeSpan.FromSeconds(30));
        (await host.ValidateAsync(Exchange)).Succeeded.Should().BeFalse();
    }

    [Fact]
    public async Task ExactProtectedModuleRejectsForeignCitationWithoutPersistableContent()
    {
        using var fixture = new ProtectedFixture();
        var exchange = System.Text.Json.Nodes.JsonNode.Parse(Exchange)!;
        exchange["result"]!["citations"]![0]!["chunkId"] = "rag-chunk:foreign";
        var host = new GptGroundedAnswerProcessHost(fixture.Root, Node(), TimeSpan.FromSeconds(30));
        var result = await host.ValidateAsync(exchange.ToJsonString());
        result.Succeeded.Should().BeTrue();
        result.Accepted.Should().BeFalse();
        result.NormalizedExchangeJson.Should().BeNull();
        result.FailureCode.Should().Be("ANSWER_REJECTED");
    }

    private static string Node()
    {
        var names = OperatingSystem.IsWindows() ? new[] { "node.exe" } : new[] { "node" };
        foreach (var directory in (Environment.GetEnvironmentVariable("PATH") ?? "").Split(Path.PathSeparator))
            foreach (var name in names)
            {
                var path = Path.Combine(directory, name);
                if (Path.IsPathFullyQualified(path) && File.Exists(path)) return path;
            }
        throw new InvalidOperationException("Exact snapshot tests require the existing Node runtime on the child PATH.");
    }

    private sealed class ProtectedFixture : IDisposable
    {
        public string Root { get; }
        public string Slot { get; }
        public ProtectedFixture()
        {
            var directory = new DirectoryInfo(AppContext.BaseDirectory);
            while (directory is not null && !File.Exists(Path.Combine(directory.FullName, "PATH_CANON_REGISTER.md")))
                directory = directory.Parent;
            if (directory is null) throw new InvalidOperationException("Owned repository root unavailable.");
            Root = Path.Combine(directory.FullName, ".tmp", "gpt-answer-fixtures", Guid.NewGuid().ToString("N"));
            Slot = Path.Combine(Root, TerraFusion.API.Configuration.GptGroundedAnswerRuntimeOptions.ArtifactSlotRelativePath);
            using var compressed = new MemoryStream(Convert.FromBase64String(ProtectedBlobs));
            using var gzip = new System.IO.Compression.GZipStream(compressed, System.IO.Compression.CompressionMode.Decompress);
            var blobs = System.Text.Json.JsonSerializer.Deserialize<Dictionary<string, string>>(gzip)!;
            foreach (var artifact in TerraFusion.API.Configuration.GptGroundedAnswerRuntimeOptions.Artifacts)
            {
                var path = Path.Combine(Slot, artifact.Path);
                Directory.CreateDirectory(Path.GetDirectoryName(path)!);
                var bytes = Convert.FromBase64String(blobs[artifact.Path]);
                bytes.Length.Should().Be(artifact.Length);
                Convert.ToHexString(System.Security.Cryptography.SHA256.HashData(bytes)).ToLowerInvariant().Should().Be(artifact.Sha256);
                File.WriteAllBytes(path, bytes);
            }
            File.WriteAllText(Path.Combine(Slot, "adoption.json"), System.Text.Json.JsonSerializer.Serialize(new
            {
                sourceCommit = TerraFusion.API.Configuration.GptGroundedAnswerRuntimeOptions.ExpectedCommit,
                repository = TerraFusion.API.Configuration.GptGroundedAnswerRuntimeOptions.ExpectedRepository,
                contract = TerraFusion.API.Configuration.GptGroundedAnswerRuntimeOptions.Contract,
                specificationSha256 = TerraFusion.API.Configuration.GptGroundedAnswerRuntimeOptions.Artifacts[3].Sha256,
            }));
        }
        public void Dispose()
        {
            // Only this uniquely-created fixture directory; never the actual artifact slot.
            if (Directory.Exists(Root)) Directory.Delete(Root, recursive: true);
        }
    }

    private const string Exchange = """
        {"context":{"request":{"schemaVersion":"1.0.0","countyId":"42","datasetKey":"rag-dataset:7","queryText":"Synthetic question","topK":2,"scoreThreshold":0.7,"traceId":"trace-proof"},"result":{"schemaVersion":"1.0.0","countyId":"42","datasetKey":"rag-dataset:7","traceId":"trace-proof","status":"GROUNDED","citations":[{"sourceId":"rag-document:11","chunkId":"rag-chunk:29","chunkIndex":0,"excerpt":"Admitted synthetic excerpt","score":0.9}]}},"result":{"schemaVersion":"1.0.0","countyId":"42","datasetKey":"rag-dataset:7","traceId":"trace-proof","status":"ANSWERED","answer":"Synthetic supported answer","provider":"ollama","model":"fixture-only-not-provider-proof","citations":[{"sourceId":"rag-document:11","chunkId":"rag-chunk:29"}]}}
        """;

    // Reproducible test data, NOT a production module or provider proof: gzip of a JSON map
    // path -> base64(bytes), read with git show from protected afbcba88c7606e78d3705010b39bcb0527270134.
    // Includes all five pinned artifacts; each decoded byte array is independently hash/length checked.
    // Embedding fixture bytes here avoids adding a new contract mirror or mutable runtime dependency.
    private const string ProtectedBlobs = "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";


    private sealed class Host : IHostEnvironment
    {
        public string EnvironmentName { get; set; } = "Development";
        public string ApplicationName { get; set; } = "GPT tests";
        public string ContentRootPath { get; set; } = Path.GetTempPath();
        public IFileProvider ContentRootFileProvider { get; set; } = new NullFileProvider();
    }
}
