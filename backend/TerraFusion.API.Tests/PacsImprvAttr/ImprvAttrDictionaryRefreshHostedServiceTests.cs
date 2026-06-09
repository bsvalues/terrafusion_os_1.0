// SYNC-DOCTRINE-4-IMPL-V9 — regression tests for V8 hosted service.
//
// V8 claims "non-fatal on PACS unreachability". V9 enforces that
// claim with tests so a future change to the catch block can't
// silently regress the behavior:
//   - Missing PacsConnection config → log + skip, no throw, dictionary unchanged.
//   - Bad PacsConnection (unreachable) → log warning + skip, no throw,
//     dictionary unchanged.
//   - StartAsync MUST NOT propagate exceptions to the host (would
//     prevent backend startup).

using System.Threading;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging.Abstractions;
using TerraFusion.Core.Sync.PacsImprvAttr;
using TerraFusion.Data.Services.PacsImprvAttr;
using Xunit;

namespace TerraFusion.API.Tests.PacsImprvAttr;

public class ImprvAttrDictionaryRefreshHostedServiceTests
{
    private static (ImprvAttrDictionaryRefreshHostedService svc,
                    RefreshableImprvAttrDictionary dict)
        Build(string? pacsConnectionString)
    {
        var settings = new Dictionary<string, string?>();
        if (pacsConnectionString != null)
            settings["ConnectionStrings:PacsConnection"] = pacsConnectionString;
        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(settings)
            .Build();

        var services = new ServiceCollection();
        services.AddSingleton<IConfiguration>(config);
        var sp = services.BuildServiceProvider();

        var dict = new RefreshableImprvAttrDictionary();
        var svc = new ImprvAttrDictionaryRefreshHostedService(
            sp.GetRequiredService<IServiceScopeFactory>(),
            config,
            dict,
            NullLogger<ImprvAttrDictionaryRefreshHostedService>.Instance);
        return (svc, dict);
    }

    [Fact]
    public async Task StartAsync_with_missing_PacsConnection_does_not_throw_and_leaves_dictionary_empty()
    {
        var (svc, dict) = Build(pacsConnectionString: null);

        // MUST NOT throw — would block backend startup.
        await svc.StartAsync(CancellationToken.None);

        Assert.Equal(0, dict.Count);
    }

    [Fact]
    public async Task StartAsync_with_unreachable_PacsConnection_does_not_throw_and_leaves_dictionary_empty()
    {
        // Connection string that's syntactically valid but points
        // at a server that won't respond (loopback, port that
        // nothing is listening on).
        var unreachable = "Server=127.0.0.1,1;Database=nope;User Id=test;Password=test;Encrypt=False;Connect Timeout=2;";
        var (svc, dict) = Build(pacsConnectionString: unreachable);

        // MUST NOT throw — the V8 contract is "non-fatal on PACS
        // unreachability" so a dev environment without VPN can still
        // boot the backend.
        await svc.StartAsync(CancellationToken.None);

        Assert.Equal(0, dict.Count);
    }

    [Fact]
    public async Task StopAsync_is_a_no_op_and_returns_quickly()
    {
        var (svc, _) = Build(pacsConnectionString: null);
        // Trivial assertion — StopAsync should complete synchronously.
        var task = svc.StopAsync(CancellationToken.None);
        Assert.True(task.IsCompletedSuccessfully);
        await task;  // observe any exception if it ever throws.
    }
}
