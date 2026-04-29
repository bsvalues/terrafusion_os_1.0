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

    // ============================================================================
    // C48-C — AddLivePacsSchemaCatalog argument-validation tests.  The live
    // overload's happy-path requires a real SQL Server connection, which is not
    // available in this test environment; that integration test is deferred to
    // C48-D.
    // ============================================================================

    [Fact]
    public void AddLivePacsSchemaCatalog_NullServices_Throws()
    {
        IServiceCollection services = null!;
        var options = LivePacsSchemaSourceOptions.ForBentonHarrisPacs("benton-pacs");

        var act = () => services.AddLivePacsSchemaCatalog("Server=.;", options);

        act.Should().Throw<ArgumentNullException>();
    }

    [Fact]
    public void AddLivePacsSchemaCatalog_EmptyConnectionString_Throws()
    {
        var services = new ServiceCollection();
        var options = LivePacsSchemaSourceOptions.ForBentonHarrisPacs("benton-pacs");

        var act = () => services.AddLivePacsSchemaCatalog("", options);

        act.Should().Throw<ArgumentException>();
    }

    [Fact]
    public void AddLivePacsSchemaCatalog_NullOptions_Throws()
    {
        var services = new ServiceCollection();

        var act = () => services.AddLivePacsSchemaCatalog("Server=.;", null!);

        act.Should().Throw<ArgumentNullException>();
    }
}
