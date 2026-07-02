using System.Reflection;
using System.Threading;
using FluentAssertions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging.Abstractions;
using TerraFusion.API.Controllers;
using Xunit;

namespace TerraFusion.Unit.Tests.Controllers;

/// <summary>
/// Prometheus PR-9 / HIGH #32: asserts that the /health endpoint exposes an
/// immutable artifact identity (gitSha) so "what's running in prod" is
/// provable from an HTTP response instead of operator memory.
///
/// Build process: docker build --build-arg GIT_SHA=$(git rev-parse --short HEAD)
///   stamps TF_GIT_SHA into the image; SimpleHealthController.Get() reads it
///   and returns it as the gitSha field. Outside a container TF_GIT_SHA is
///   unset and the field returns "unknown" — but the field MUST exist either
///   way so the response shape is stable for the operator's curl check.
/// </summary>
[Trait("Component", "Health")]
[Trait("Category", "ReleaseHygiene")]
public sealed class SimpleHealthControllerGitShaTests
{
    [Fact]
    public void Health_Controller_AllowsAnonymousAccess_ForDeploymentHealthChecks()
    {
        typeof(SimpleHealthController)
            .GetCustomAttribute<AllowAnonymousAttribute>()
            .Should()
            .NotBeNull("Docker, edge proxy, and public release health probes must reach /health without an auth token");
    }

    [Fact]
    public void Health_Response_IncludesGitShaField_WhenEnvVarUnset()
    {
        var originalSha = Environment.GetEnvironmentVariable("TF_GIT_SHA");
        try
        {
            Environment.SetEnvironmentVariable("TF_GIT_SHA", null);

            var controller = new SimpleHealthController(
                NullLogger<SimpleHealthController>.Instance,
                StubLifetime.Instance);

            var actionResult = controller.Get();
            var ok = actionResult as OkObjectResult;
            ok.Should().NotBeNull("the controller returns 200 OK for /health");

            var payload = ok!.Value;
            payload.Should().NotBeNull();

            var gitShaProperty = payload!.GetType().GetProperty(
                "GitSha",
                BindingFlags.Public | BindingFlags.Instance);
            gitShaProperty.Should().NotBeNull(
                "PR-9 contract: /health response MUST carry a gitSha field even when the env var is unset");

            var gitShaValue = gitShaProperty!.GetValue(payload) as string;
            // WO-BACKEND-005: when TF_GIT_SHA is unset the field is now resolved
            // from the build-stamped assembly InformationalVersion (CI sets
            // SourceRevisionId from GITHUB_SHA → a real sha; a plain local build
            // with no stamp → "unknown"). Either way the field MUST be populated
            // and non-empty. Deterministic sha/"unknown" branch selection is
            // covered by ResolveGitSha_* below.
            gitShaValue.Should().NotBeNullOrWhiteSpace(
                "the /health gitSha field MUST always be populated — a build-stamped commit or the literal \"unknown\", never blank");
        }
        finally
        {
            Environment.SetEnvironmentVariable("TF_GIT_SHA", originalSha);
        }
    }

    [Fact]
    public void Health_Response_EchoesGitShaFromEnvironment_WhenSet()
    {
        const string fakeSha = "abc1234";
        var originalSha = Environment.GetEnvironmentVariable("TF_GIT_SHA");
        try
        {
            Environment.SetEnvironmentVariable("TF_GIT_SHA", fakeSha);

            var controller = new SimpleHealthController(
                NullLogger<SimpleHealthController>.Instance,
                StubLifetime.Instance);

            var actionResult = controller.Get();
            var ok = actionResult as OkObjectResult;
            ok.Should().NotBeNull();

            var payload = ok!.Value;
            var gitShaProperty = payload!.GetType().GetProperty(
                "GitSha",
                BindingFlags.Public | BindingFlags.Instance);
            gitShaProperty.Should().NotBeNull();

            var gitShaValue = gitShaProperty!.GetValue(payload) as string;
            gitShaValue.Should().Be(
                fakeSha,
                "the value of TF_GIT_SHA stamped at docker build time MUST flow through to the health response unchanged");
        }
        finally
        {
            Environment.SetEnvironmentVariable("TF_GIT_SHA", originalSha);
        }
    }

    [Fact]
    public void Health_Response_RetainsHealthyStatusContract()
    {
        var controller = new SimpleHealthController(
            NullLogger<SimpleHealthController>.Instance,
            StubLifetime.Instance);

        var actionResult = controller.Get();
        var ok = actionResult as OkObjectResult;
        ok.Should().NotBeNull();

        var payload = ok!.Value;
        var statusProperty = payload!.GetType().GetProperty(
            "Status",
            BindingFlags.Public | BindingFlags.Instance);
        statusProperty.Should().NotBeNull(
            "PR-9 is additive — the existing Status field MUST still be present");

        statusProperty!.GetValue(payload).Should().Be("Healthy");
    }

    // WO-BACKEND-005: deterministic coverage of the gitSha resolution priority
    // (env → build-stamped InformationalVersion "+<sha>" → "unknown"), without
    // depending on the ambient assembly version or process environment.
    [Theory]
    [InlineData("abc1234", null, "abc1234")]              // env wins when set
    [InlineData("abc1234", "1.0.0+def5678", "abc1234")]   // env wins over the build stamp
    [InlineData(null, "1.0.0+def5678", "def5678")]        // stamp used when env unset
    [InlineData("", "1.0.0+def5678", "def5678")]          // blank env → stamp
    [InlineData(null, "1.0.0", "unknown")]                // no stamp → unknown
    [InlineData(null, null, "unknown")]                   // nothing → unknown
    [InlineData("   ", "   ", "unknown")]                 // whitespace only → unknown
    public void ResolveGitSha_ResolvesInPriorityOrder(string? envSha, string? informationalVersion, string expected)
    {
        SimpleHealthController.ResolveGitSha(envSha, informationalVersion)
            .Should()
            .Be(expected);
    }

    /// <summary>
    /// Minimal stub for the readiness-gating dependency added in WO-BACKEND-004.
    /// These gitSha tests exercise Get() only, so the lifetime value is irrelevant.
    /// </summary>
    private sealed class StubLifetime : IHostApplicationLifetime
    {
        public static readonly StubLifetime Instance = new();
        public CancellationToken ApplicationStarted => CancellationToken.None;
        public CancellationToken ApplicationStopping => CancellationToken.None;
        public CancellationToken ApplicationStopped => CancellationToken.None;
        public void StopApplication() { }
    }
}
