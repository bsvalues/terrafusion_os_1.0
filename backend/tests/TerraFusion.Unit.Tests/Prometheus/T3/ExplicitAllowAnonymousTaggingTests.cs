using System.Linq;
using System.Reflection;
using FluentAssertions;
using Microsoft.AspNetCore.Authorization;
using TerraFusion.API.Controllers;
using Xunit;

namespace TerraFusion.Unit.Tests.Prometheus.T3;

/// <summary>
/// PR-2 / Prometheus T3: the controllers that intentionally run anonymously
/// in the single-county-per-deployment doctrine must declare
/// <c>[AllowAnonymous]</c> explicitly. With the new global
/// <c>FallbackPolicy.RequireAuthenticatedUser()</c>, anything untagged
/// will challenge → 401, breaking the operator workflow.
///
/// <para>This is a surface-audit test, not a behavior test. It pins which
/// controllers are knowingly anonymous so a future addition can't quietly
/// remove the attribute and ship a regression.</para>
/// </summary>
[Trait("Category", "Security")]
[Trait("Component", "ControllerAuthSurface")]
[Trait("Slice", "Prometheus-T3")]
public sealed class ExplicitAllowAnonymousTaggingTests
{
    public static IEnumerable<object[]> ExplicitlyAnonymousControllers => new[]
    {
        new object[] { typeof(WorkbenchFController) },
        new object[] { typeof(WorkbenchGController) },
        new object[] { typeof(WorkbenchHController) },
        new object[] { typeof(FullCorpusController) },
        new object[] { typeof(DoctrineDrainController) },
        new object[] { typeof(DoctrinePolicyController) },
        new object[] { typeof(DoctrineStatusController) },
    };

    [Theory]
    [MemberData(nameof(ExplicitlyAnonymousControllers))]
    public void Controller_HasClassLevel_AllowAnonymous(Type controllerType)
    {
        var attr = controllerType.GetCustomAttribute<AllowAnonymousAttribute>(inherit: false);

        attr.Should().NotBeNull(
            $"{controllerType.Name} must declare [AllowAnonymous] at the class level. " +
            "With the global FallbackPolicy in place, untagged controllers will 401 " +
            "and break the operator-driven curl workflow.");
    }

    [Theory]
    [MemberData(nameof(ExplicitlyAnonymousControllers))]
    public void Controller_DoesNotAlsoDeclare_Authorize(Type controllerType)
    {
        var attr = controllerType.GetCustomAttribute<AuthorizeAttribute>(inherit: false);

        attr.Should().BeNull(
            $"{controllerType.Name} should not carry both [AllowAnonymous] and [Authorize] " +
            "at the class level — pick one. PR-2 chose AllowAnonymous to preserve the existing " +
            "operator workflow; a real auth posture is a future-PR concern.");
    }
}
