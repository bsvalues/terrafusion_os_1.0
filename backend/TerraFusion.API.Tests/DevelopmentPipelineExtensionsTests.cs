using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using TerraFusion.API.Extensions;
using TerraFusion.API.Services;
using Xunit;

namespace TerraFusion.API.Tests;

public sealed class DevelopmentPipelineExtensionsTests
{
    [Fact]
    public void AddDevelopmentPipeline_RegistersControllerServiceButDoesNotStartWorkerByDefault()
    {
        var services = new ServiceCollection();

        services.AddDevelopmentPipeline();

        Assert.Contains(services, descriptor => descriptor.ServiceType == typeof(DevelopmentPipelineService));
        Assert.DoesNotContain(services, descriptor => descriptor.ServiceType == typeof(IHostedService));
    }

    [Fact]
    public void AddDevelopmentPipeline_StartsWorkerOnlyWhenExplicitlyEnabled()
    {
        var services = new ServiceCollection();

        services.AddDevelopmentPipeline(enableBackgroundWorker: true);

        Assert.Contains(services, descriptor => descriptor.ServiceType == typeof(DevelopmentPipelineService));
        Assert.Contains(services, descriptor => descriptor.ServiceType == typeof(IHostedService));
    }
}
