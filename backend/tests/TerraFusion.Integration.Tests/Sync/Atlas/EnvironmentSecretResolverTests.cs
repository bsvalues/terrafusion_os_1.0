using FluentAssertions;
using TerraFusion.Sync.Workbench.Atlas;
using Xunit;

namespace TerraFusion.Integration.Tests.Sync.Atlas;

/// <summary>
/// Tests for <see cref="EnvironmentSecretResolver"/> — pure env-var lookup, no I/O.
/// Each test uses a unique random env var name so concurrent test runs don't collide.
/// </summary>
public class EnvironmentSecretResolverTests
{
    [Fact]
    public void ResolveRequired_ReturnsValue_WhenEnvironmentVariableExists()
    {
        var name = $"SYNCATLAS_TEST_{Guid.NewGuid():N}";
        Environment.SetEnvironmentVariable(name, "secret-value");
        try
        {
            var resolver = new EnvironmentSecretResolver();
            var value = resolver.ResolveRequired(name);
            value.Should().Be("secret-value");
        }
        finally
        {
            Environment.SetEnvironmentVariable(name, null);
        }
    }

    [Fact]
    public void ResolveRequired_Throws_WhenEnvironmentVariableMissing()
    {
        var name = $"SYNCATLAS_TEST_{Guid.NewGuid():N}";
        var resolver = new EnvironmentSecretResolver();

        Action act = () => resolver.ResolveRequired(name);

        act.Should().Throw<InvalidOperationException>()
            .WithMessage($"*'{name}'*");
    }

    [Fact]
    public void ResolveRequired_Throws_WhenEnvironmentVariableIsEmpty()
    {
        var name = $"SYNCATLAS_TEST_{Guid.NewGuid():N}";
        Environment.SetEnvironmentVariable(name, "");
        try
        {
            var resolver = new EnvironmentSecretResolver();
            Action act = () => resolver.ResolveRequired(name);
            act.Should().Throw<InvalidOperationException>()
                .WithMessage($"*'{name}'*");
        }
        finally
        {
            Environment.SetEnvironmentVariable(name, null);
        }
    }

    [Theory]
    [InlineData("")]
    [InlineData(" ")]
    [InlineData("   ")]
    public void ResolveRequired_Throws_WhenSecretNameIsBlank(string blank)
    {
        var resolver = new EnvironmentSecretResolver();
        Action act = () => resolver.ResolveRequired(blank);
        act.Should().Throw<InvalidOperationException>()
            .WithMessage("*Secret name is required*");
    }

    [Fact]
    public void SyncAtlasSecretNames_ForSqlAuthPassword_FormatsConvention()
    {
        var id = Guid.Parse("aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee");
        var name = SyncAtlasSecretNames.ForSqlAuthPassword(id);
        name.Should().Be("SYNCATLAS_SECRET_AAAAAAAABBBBCCCCDDDDEEEEEEEEEEEE");
    }
}
