using System;
using System.Net;
using System.Net.Http.Json;
using FluentAssertions;
using Microsoft.Extensions.DependencyInjection;
using TerraFusion.API.Tests.Infrastructure;
using TerraFusion.Core.Services;
using Xunit;

namespace TerraFusion.API.Tests.Integration
{
    [Collection("Integration")]
    public class TokenRevocationFlowIntegrationTests : IClassFixture<ApiWebAppFactory>
    {
        private readonly ApiWebAppFactory _factory;

        public TokenRevocationFlowIntegrationTests(ApiWebAppFactory factory)
        {
            _factory = factory;
        }

        [Fact]
        [Trait("Category", "Phase4")]
        [Trait("Category", "Integration")]
        [Trait("Feature", "TokenRevocation")]
        public async Task RevokeEndpoint_RevokesToken_ForProtectedEndpoint()
        {
            var token = $"phase4-token-{Guid.NewGuid():N}";
            using var client = _factory.CreateClient();

            var revokeResponse = await client.PostAsJsonAsync("/api/auth/revoke", new
            {
                token,
                reason = "phase4-integration-revoke"
            });

            revokeResponse.StatusCode.Should().NotBe(
                HttpStatusCode.NotFound,
                "the revocation endpoint must exist to enforce persistent token revocation");
            revokeResponse.IsSuccessStatusCode.Should().BeTrue(
                $"expected /api/auth/revoke success but got {(int)revokeResponse.StatusCode} {revokeResponse.StatusCode}");

            using var scope = _factory.Services.CreateScope();
            var authService = scope.ServiceProvider.GetRequiredService<IAuthenticationService>();
            var isRevoked = await authService.IsTokenBlacklistedAsync(token);
            isRevoked.Should().BeTrue("successful revoke must persist blacklist state for token validation");
        }

        [Fact]
        [Trait("Category", "Phase4")]
        [Trait("Category", "Integration")]
        [Trait("Feature", "TokenRevocation")]
        public async Task RevokedToken_RemainsRejected_AfterHostRestart()
        {
            var token = $"phase4-token-{Guid.NewGuid():N}";

            using (var initialFactory = new ApiWebAppFactory())
            using (var initialClient = initialFactory.CreateClient())
            {
                var revokeResponse = await initialClient.PostAsJsonAsync("/api/auth/revoke", new
                {
                    token,
                    reason = "phase4-restart-simulation"
                });

                revokeResponse.StatusCode.Should().NotBe(
                    HttpStatusCode.NotFound,
                    "revocation route must exist prior to restart simulation");
                revokeResponse.IsSuccessStatusCode.Should().BeTrue(
                    $"expected /api/auth/revoke success before restart but got {(int)revokeResponse.StatusCode} {revokeResponse.StatusCode}");
            }

            using (var restartedFactory = new ApiWebAppFactory())
            {
                using var scope = restartedFactory.Services.CreateScope();
                var authService = scope.ServiceProvider.GetRequiredService<IAuthenticationService>();
                var isRevokedAfterRestart = await authService.IsTokenBlacklistedAsync(token);
                isRevokedAfterRestart.Should().BeTrue("revocation must survive host restart via durable persistence");
            }
        }
    }
}
