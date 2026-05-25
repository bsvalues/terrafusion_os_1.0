using TerraFusion.Modules.CurrentUse.Dto;
using TerraFusion.Modules.CurrentUse.Security;
using Xunit;

namespace TerraFusion.Modules.CurrentUse.Tests;

public sealed class CurrentUseAuthorizationServiceTests
{
    [Fact]
    public void Appraiser_Can_Run_Rollback()
    {
        var service = new CurrentUseAuthorizationService();

        var result = service.Authorize(
            new CurrentUseAuthorizationRequestDto(
                "appraiser",
                new[] { CurrentUseRoleCatalog.Appraiser },
                CurrentUsePermission.RunRollbackCalculation,
                Guid.NewGuid(),
                Guid.NewGuid()));

        Assert.True(result.Allowed);
    }

    [Fact]
    public void Appraiser_Cannot_Issue_Notice()
    {
        var service = new CurrentUseAuthorizationService();

        var result = service.Authorize(
            new CurrentUseAuthorizationRequestDto(
                "appraiser",
                new[] { CurrentUseRoleCatalog.Appraiser },
                CurrentUsePermission.IssueNotice,
                Guid.NewGuid(),
                Guid.NewGuid()));

        Assert.False(result.Allowed);
    }

    [Fact]
    public void Supervisor_Can_Issue_Notice()
    {
        var service = new CurrentUseAuthorizationService();

        var result = service.Authorize(
            new CurrentUseAuthorizationRequestDto(
                "supervisor",
                new[] { CurrentUseRoleCatalog.Supervisor },
                CurrentUsePermission.IssueNotice,
                Guid.NewGuid(),
                Guid.NewGuid()));

        Assert.True(result.Allowed);
    }
}
