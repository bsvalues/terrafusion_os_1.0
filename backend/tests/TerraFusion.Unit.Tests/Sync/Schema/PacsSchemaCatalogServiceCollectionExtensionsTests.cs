using System;
using FluentAssertions;
using Microsoft.Extensions.DependencyInjection;
using TerraFusion.Sync.Workbench.Schema;
using Xunit;

namespace TerraFusion.Unit.Tests.Sync.Schema;

/// <summary>
/// Slice C48-B unit tests for
/// <see cref="PacsSchemaCatalogServiceCollectionExtensions.AddPacsSchemaCatalog"/>.
/// Verifies singleton lifetime + idempotent resolution per HG3.
/// </summary>
public sealed class PacsSchemaCatalogServiceCollectionExtensionsTests
{
    [Fact]
    public void AddPacsSchemaCatalog_ResolvesAsSingleton()
    {
        var services = new ServiceCollection();
        var source = new InMemoryPacsSchemaSource(PacsSchemaCatalogTestFixture.BuildRepresentative());

        services.AddPacsSchemaCatalog(source);
        using var provider = services.BuildServiceProvider();

        var first = provider.GetRequiredService<IPacsSchemaCatalog>();
        var second = provider.GetRequiredService<IPacsSchemaCatalog>();

        first.Should().BeSameAs(second);
        first.Coverage.TableCount.Should().Be(3);
    }

    [Fact]
    public void AddPacsSchemaCatalog_NullServices_Throws()
    {
        IServiceCollection services = null!;
        var source = new InMemoryPacsSchemaSource(PacsSchemaCatalogTestFixture.BuildRepresentative());

        var act = () => services.AddPacsSchemaCatalog(source);

        act.Should().Throw<ArgumentNullException>();
    }

    [Fact]
    public void AddPacsSchemaCatalog_NullSource_Throws()
    {
        var services = new ServiceCollection();

        var act = () => services.AddPacsSchemaCatalog(null!);

        act.Should().Throw<ArgumentNullException>();
    }
}
