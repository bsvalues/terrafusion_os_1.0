using System;
using System.Linq;
using System.Reflection;
using FluentAssertions;
using Microsoft.AspNetCore.Authorization;
using TerraFusion.API.Controllers;
using Xunit;

namespace TerraFusion.Unit.Tests.Security;

// WO-BACKEND-SEC-DEBUG-001 (SW-10): CanonicalDebugController exposes destructive
// DB-mutation endpoints (sync/drain/populate/truncate). It must never be
// anonymous and must require an admin role wherever it is mapped. These
// reflection guards lock that posture so a future edit cannot silently
// re-open anonymous access.
[Trait("Category", "Security")]
public sealed class CanonicalDebugControllerHardeningTests
{
    private static readonly Type Controller = typeof(CanonicalDebugController);

    [Fact]
    public void Class_RequiresAdminAuthorization()
    {
        var authorize = Controller.GetCustomAttribute<AuthorizeAttribute>(inherit: false);
        authorize.Should().NotBeNull("the debug controller must carry [Authorize]");
        authorize!.Roles.Should().NotBeNullOrWhiteSpace("destructive debug endpoints must be role-gated");

        var roles = authorize.Roles!
            .Split(',', StringSplitOptions.TrimEntries | StringSplitOptions.RemoveEmptyEntries);
        roles.Should().Contain("Administrator");
        roles.Should().Contain("SystemAdmin");
    }

    [Fact]
    public void Class_IsNotAnonymous()
    {
        Controller.GetCustomAttribute<AllowAnonymousAttribute>(inherit: false)
            .Should().BeNull("the debug controller must not be [AllowAnonymous]");
    }

    [Fact]
    public void NoActionMethod_ReopensAnonymousAccess()
    {
        var anonymousActions = Controller
            .GetMethods(BindingFlags.Public | BindingFlags.Instance | BindingFlags.DeclaredOnly)
            .Where(m => m.GetCustomAttribute<AllowAnonymousAttribute>(inherit: false) != null)
            .Select(m => m.Name)
            .ToArray();

        anonymousActions.Should().BeEmpty(
            "no debug action may re-open anonymous access; found: {0}",
            string.Join(", ", anonymousActions));
    }
}
