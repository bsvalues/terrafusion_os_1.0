using FluentAssertions;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.FileProviders;
using Microsoft.Extensions.Hosting;
using TerraFusion.API.Services.Dossier;
using TerraFusion.Core.Services;
using Xunit;

namespace TerraFusion.Unit.Tests.Dossier;

public sealed class DossierMutationRuntimeRegistrationTests
{
    [Fact]
    public async Task Disabled_IsPersistentFailClosedSelection()
    {
        var services=new ServiceCollection();
        services.AddDossierMutationRuntime(Config("Disabled"),new Environment("Development"));
        using var provider=services.BuildServiceProvider();
        var port=provider.GetRequiredService<IDossierMutationDecisionPort>();
        var action=()=>port.DecideCreateNoteAsync(null!);
        await action.Should().ThrowAsync<DossierMutationUnavailableException>();
    }

    [Fact]
    public void Production_RefusesLocalExactBeforeArtifactResolution()
    {
        var action=()=>new ServiceCollection().AddDossierMutationRuntime(Config("LocalExact"),new Environment("Production"));
        action.Should().Throw<InvalidOperationException>().WithMessage("*restricted to Development*");
    }

    [Theory]
    [InlineData("Unknown")]
    [InlineData("99")]
    public void UnknownMode_FailsStartup(string mode)
    {
        var action=()=>new ServiceCollection().AddDossierMutationRuntime(Config(mode),new Environment("Development"));
        action.Should().Throw<InvalidOperationException>();
    }

    private static IConfiguration Config(string mode)=>new ConfigurationBuilder().AddInMemoryCollection(new Dictionary<string,string?> { ["DossierMutation:Mode"]=mode,["DossierMutation:TimeoutSeconds"]="30" }).Build();
    private sealed class Environment(string name):IHostEnvironment
    {
        public string EnvironmentName{get;set;}=name;
        public string ApplicationName{get;set;}="tests";
        public string ContentRootPath{get;set;}=Path.GetTempPath();
        public IFileProvider ContentRootFileProvider{get;set;}=new NullFileProvider();
    }
}
