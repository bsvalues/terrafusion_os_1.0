using System;
using System.Linq;
using System.Net;
using System.Text.Json;
using System.Threading.Tasks;
using TerraFusion.API.Contracts.Health;
using TerraFusion.API.Tests.Infrastructure;
using Xunit;

namespace TerraFusion.API.Tests.Integration
{
    [Collection("Integration")]
    public class HealthContractTests : IClassFixture<ApiWebAppFactory>
    {
        private readonly ApiWebAppFactory _factory;

        public HealthContractTests(ApiWebAppFactory factory)
        {
            _factory = factory;
        }

        [Fact]
        public async Task SystemHealth_Returns_Contract_Compliant_Payload()
        {
            using var client = _factory.CreateClient();

            var response = await client.GetAsync("/api/system/health");
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);

            var jsonString = await response.Content.ReadAsStringAsync();
            Assert.False(string.IsNullOrWhiteSpace(jsonString));

            var document = JsonDocument.Parse(jsonString);
            var root = document.RootElement;

            RequireString(root, "status", new[] { "Healthy", "Degraded", "Unhealthy" });
            RequireNumber(root, "moduleCount");
            RequireNumber(root, "healthyModules");
            RequireArray(root, "warnings");
            RequireObject(root, "systemComponents");

            RequireStringOrNull(root, "intentFilter");
            RequireNumberOrNull(root, "moduleCountActive");
            RequireNumberOrNull(root, "moduleCountTotal");
            RequireNumberOrNull(root, "moduleCountFilteredOut");

            var options = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
            var dto = JsonSerializer.Deserialize<SystemHealthResponse>(jsonString, options);
            Assert.NotNull(dto);

            if (TryGetNumber(root, "moduleCountActive", out var active) &&
                TryGetNumber(root, "moduleCountTotal", out var total))
            {
                Assert.True(active <= total, "moduleCountActive cannot exceed moduleCountTotal.");

                if (TryGetNumber(root, "moduleCountFilteredOut", out var filteredOut))
                {
                    Assert.Equal(total - active, filteredOut);
                }
            }
        }

        private static void RequireString(JsonElement root, string name, string[] allowed)
        {
            var value = RequireProperty(root, name);
            Assert.Equal(JsonValueKind.String, value.ValueKind);
            var text = value.GetString();
            Assert.False(string.IsNullOrWhiteSpace(text));
            Assert.Contains(text, allowed);
        }

        private static void RequireNumber(JsonElement root, string name)
        {
            var value = RequireProperty(root, name);
            Assert.Equal(JsonValueKind.Number, value.ValueKind);
            Assert.True(value.GetInt32() >= 0);
        }

        private static void RequireArray(JsonElement root, string name)
        {
            var value = RequireProperty(root, name);
            Assert.Equal(JsonValueKind.Array, value.ValueKind);
        }

        private static void RequireObject(JsonElement root, string name)
        {
            var value = RequireProperty(root, name);
            Assert.Equal(JsonValueKind.Object, value.ValueKind);
        }

        private static void RequireStringOrNull(JsonElement root, string name)
        {
            if (!root.TryGetProperty(name, out var value)) return;
            Assert.True(
                value.ValueKind == JsonValueKind.String || value.ValueKind == JsonValueKind.Null,
                $"{name} must be string or null.");
        }

        private static void RequireNumberOrNull(JsonElement root, string name)
        {
            if (!root.TryGetProperty(name, out var value)) return;
            Assert.True(
                value.ValueKind == JsonValueKind.Number || value.ValueKind == JsonValueKind.Null,
                $"{name} must be number or null.");
        }

        private static bool TryGetNumber(JsonElement root, string name, out int value)
        {
            value = 0;
            if (!root.TryGetProperty(name, out var element)) return false;
            if (element.ValueKind != JsonValueKind.Number) return false;
            return element.TryGetInt32(out value);
        }

        private static JsonElement RequireProperty(JsonElement root, string name)
        {
            Assert.True(root.TryGetProperty(name, out var value), $"Missing required field: {name}");
            return value;
        }
    }
}
