using System.Reflection;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc;
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
    public void Health_Response_IncludesGitShaField_WhenEnvVarUnset()
    {
        var originalSha = Environment.GetEnvironmentVariable("TF_GIT_SHA");
        try
        {
            Environment.SetEnvironmentVariable("TF_GIT_SHA", null);

            var controller = new SimpleHealthController(
                NullLogger<SimpleHealthController>.Instance);

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
            gitShaValue.Should().Be(
                "unknown",
                "when TF_GIT_SHA is not set the field MUST fall back to the literal string \"unknown\" so clients can detect a non-tagged build");
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
                NullLogger<SimpleHealthController>.Instance);

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
            NullLogger<SimpleHealthController>.Instance);

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
}
