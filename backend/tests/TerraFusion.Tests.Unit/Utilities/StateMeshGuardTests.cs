using Xunit;
using TerraFusion.API.Utilities;

namespace TerraFusion.Tests.Unit.Utilities;

public class StateMeshGuardTests
{
    [Theory]
    [InlineData("{\"status\": \"healthy\"}")]
    [InlineData("{\"healthy\": true}")]
    [InlineData("{\"status\": \"HEALTHY\"}")] // Case insensitive check
    public void IsStateHealthy_ReturnsTrue_ForHealthyStates(string json)
    {
        // Act
        var result = StateMeshGuard.IsStateHealthy(json);

        // Assert
        Assert.True(result, $"Expected valid health for JSON: {json}");
    }

    [Theory]
    [InlineData("")]
    [InlineData(null)]
    [InlineData("   ")]
    public void IsStateHealthy_ReturnsFalse_ForEmptyInput(string? json)
    {
        // Act
        var result = StateMeshGuard.IsStateHealthy(json);

        // Assert
        Assert.False(result, "Expected invalid health for empty/null input");
    }

    [Theory]
    [InlineData("not json")]
    [InlineData("{ broken_json: ")]
    public void IsStateHealthy_ReturnsFalse_ForMalformedJson(string json)
    {
        // Act
        var result = StateMeshGuard.IsStateHealthy(json);

        // Assert
        Assert.False(result, $"Expected invalid health for malformed JSON: {json}");
    }

    [Theory]
    [InlineData("{\"status\": \"degraded\"}")]
    [InlineData("{\"healthy\": false}")]
    [InlineData("{\"random\": \"value\"}")]
    [InlineData("{}")]
    public void IsStateHealthy_ReturnsFalse_ForUnhealthyStates(string json)
    {
        // Act
        var result = StateMeshGuard.IsStateHealthy(json);

        // Assert
        Assert.False(result, $"Expected invalid health for unhealthy state: {json}");
    }

    [Fact]
    public void ValidateAuthorityState_DoesNotThrow_ForValidConfig()
    {
        var json = @"{
            ""mesh"": { ""type"": ""federated_quorum"" },
            ""counties"": [
                { ""name"": ""Benton"", ""status"": ""active"" }
            ]
        }";

        StateMeshGuard.ValidateAuthorityState(json);
    }

    [Fact]
    public void ValidateAuthorityState_Throws_ForInvalidMeshType()
    {
        var json = @"{
            ""mesh"": { ""type"": ""invalid"" },
            ""counties"": [ { ""status"": ""active"" } ]
        }";

        var ex = Assert.Throws<InvalidOperationException>(() => StateMeshGuard.ValidateAuthorityState(json));
        Assert.Contains("federated_quorum", ex.Message);
    }

    [Fact]
    public void ValidateAuthorityState_Throws_ForNoCounties()
    {
        var json = @"{
            ""mesh"": { ""type"": ""federated_quorum"" },
            ""counties"": []
        }";

        var ex = Assert.Throws<InvalidOperationException>(() => StateMeshGuard.ValidateAuthorityState(json));
        Assert.Contains("No counties", ex.Message);
    }

    [Fact]
    public void ValidateAuthorityState_Throws_ForNoActiveCounties()
    {
        var json = @"{
            ""mesh"": { ""type"": ""federated_quorum"" },
            ""counties"": [
                { ""name"": ""Benton"", ""status"": ""inactive"" }
            ]
        }";

        var ex = Assert.Throws<InvalidOperationException>(() => StateMeshGuard.ValidateAuthorityState(json));
        Assert.Contains("No active counties", ex.Message);
    }
}
