using Microsoft.Extensions.Logging.Abstractions;
using Moq;
using TerraFusion.AI.Services;
using TerraFusion.Core.Interfaces;
using Xunit;

namespace TerraFusion.API.Tests.Phase9B;

/// <summary>
/// Routing matrix tests — verify that MuseRouter dispatches to the correct
/// lane IMuseLlmClient based on MuseTaskType, and that the fallback chain
/// (exact key → "*" default → empty string) is respected.
/// </summary>
public class MuseRouterTests
{
    // ── helpers ──────────────────────────────────────────────────────────────

    private static Mock<IMuseLlmClient> LaneMock(string tag)
    {
        var m = new Mock<IMuseLlmClient>();
        m.Setup(c => c.CompleteAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<CancellationToken>()))
         .ReturnsAsync($"[{tag}]");
        return m;
    }

    private static MuseRouter BuildRouter(IReadOnlyDictionary<string, IMuseLlmClient> lanes)
        => new(NullLogger<MuseRouter>.Instance, lanes);

    // ── dispatch tests ───────────────────────────────────────────────────────

    [Fact]
    public async Task DevAssist_Query_Routes_To_Dev_Lane()
    {
        var devLane   = LaneMock("dev");
        var reasoning = LaneMock("reasoning");
        var lanes = new Dictionary<string, IMuseLlmClient>(StringComparer.OrdinalIgnoreCase)
        {
            ["DevAssist"] = devLane.Object,
            ["Reasoning"] = reasoning.Object,
        };

        var router = BuildRouter(lanes);
        var result = await router.CompleteAsync(MuseTaskType.DevAssist, "sys", "query");

        Assert.Equal("[dev]", result);
        devLane.Verify(c => c.CompleteAsync("sys", "query", default), Times.Once);
        reasoning.Verify(c => c.CompleteAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task Reasoning_Query_Routes_To_Reasoning_Lane()
    {
        var devLane   = LaneMock("dev");
        var reasoning = LaneMock("reasoning");
        var lanes = new Dictionary<string, IMuseLlmClient>(StringComparer.OrdinalIgnoreCase)
        {
            ["DevAssist"] = devLane.Object,
            ["Reasoning"] = reasoning.Object,
        };

        var router = BuildRouter(lanes);
        var result = await router.CompleteAsync(MuseTaskType.Reasoning, "sys", "query");

        Assert.Equal("[reasoning]", result);
        reasoning.Verify(c => c.CompleteAsync("sys", "query", default), Times.Once);
        devLane.Verify(c => c.CompleteAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task Document_Query_Routes_To_Document_Lane()
    {
        var docLane = LaneMock("document");
        var lanes = new Dictionary<string, IMuseLlmClient>(StringComparer.OrdinalIgnoreCase)
        {
            ["Document"] = docLane.Object,
        };

        var router = BuildRouter(lanes);
        var result = await router.CompleteAsync(MuseTaskType.Document, "sys", "query");

        Assert.Equal("[document]", result);
    }

    [Fact]
    public async Task AgentTools_Query_Routes_To_AgentTools_Lane()
    {
        var agentLane = LaneMock("agent");
        var lanes = new Dictionary<string, IMuseLlmClient>(StringComparer.OrdinalIgnoreCase)
        {
            ["AgentTools"] = agentLane.Object,
        };

        var router = BuildRouter(lanes);
        var result = await router.CompleteAsync(MuseTaskType.AgentTools, "sys", "query");

        Assert.Equal("[agent]", result);
    }

    // ── fallback chain tests ─────────────────────────────────────────────────

    [Fact]
    public async Task No_Specific_Lane_Falls_Back_To_Default_Star_Lane()
    {
        // Only a "*" default lane registered — all task types must use it.
        var defaultLane = LaneMock("default");
        var lanes = new Dictionary<string, IMuseLlmClient>(StringComparer.OrdinalIgnoreCase)
        {
            [MuseRouter.DefaultKey] = defaultLane.Object,
        };

        var router = BuildRouter(lanes);

        foreach (var taskType in Enum.GetValues<MuseTaskType>())
        {
            var result = await router.CompleteAsync(taskType, "sys", "q");
            Assert.Equal("[default]", result);
        }
    }

    [Fact]
    public async Task Exact_Lane_Wins_Over_Default_Star_Lane()
    {
        var devLane     = LaneMock("dev");
        var defaultLane = LaneMock("default");
        var lanes = new Dictionary<string, IMuseLlmClient>(StringComparer.OrdinalIgnoreCase)
        {
            ["DevAssist"]           = devLane.Object,
            [MuseRouter.DefaultKey] = defaultLane.Object,
        };

        var router = BuildRouter(lanes);

        // DevAssist should use the exact lane, not the default
        Assert.Equal("[dev]", await router.CompleteAsync(MuseTaskType.DevAssist, "s", "q"));

        // Other task types without an exact lane should fall to default
        Assert.Equal("[default]", await router.CompleteAsync(MuseTaskType.Reasoning, "s", "q"));
        Assert.Equal("[default]", await router.CompleteAsync(MuseTaskType.Document, "s", "q"));
        Assert.Equal("[default]", await router.CompleteAsync(MuseTaskType.AgentTools, "s", "q"));
    }

    [Fact]
    public async Task No_Lane_At_All_Returns_Empty_String()
    {
        var router = BuildRouter(new Dictionary<string, IMuseLlmClient>());

        foreach (var taskType in Enum.GetValues<MuseTaskType>())
        {
            var result = await router.CompleteAsync(taskType, "sys", "query");
            Assert.Equal(string.Empty, result);
        }
    }

    [Fact]
    public async Task Lane_Key_Lookup_Is_Case_Insensitive()
    {
        var devLane = LaneMock("dev");
        var lanes = new Dictionary<string, IMuseLlmClient>(StringComparer.OrdinalIgnoreCase)
        {
            // registered with mixed case
            ["devassist"] = devLane.Object,
        };

        var router = BuildRouter(lanes);
        // TaskType.ToString() returns "DevAssist" — must still hit the lane
        var result = await router.CompleteAsync(MuseTaskType.DevAssist, "s", "q");
        Assert.Equal("[dev]", result);
    }
}
