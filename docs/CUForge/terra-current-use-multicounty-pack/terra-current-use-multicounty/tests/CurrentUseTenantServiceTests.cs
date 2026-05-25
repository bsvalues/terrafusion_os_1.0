using TerraFusion.Modules.CurrentUse.Dto;
using TerraFusion.Modules.CurrentUse.Tenancy;
using Xunit;

namespace TerraFusion.Modules.CurrentUse.Tests;

public sealed class CurrentUseTenantServiceTests
{
    [Fact]
    public async Task Create_Tenant_Starts_In_Onboarding()
    {
        var service = new CurrentUseTenantService();

        var tenant = await service.CreateTenantAsync(
            new CreateCurrentUseCountyTenantDto(
                Guid.NewGuid(),
                "Test County",
                "WA",
                "2025.09.01",
                "default",
                "unit.test"),
            CancellationToken.None);

        Assert.Equal(CurrentUseTenantStatus.Onboarding, tenant.Status);
    }

    [Fact]
    public async Task Existing_Tenants_Return()
    {
        var service = new CurrentUseTenantService();

        var tenants = await service.GetTenantsAsync(CancellationToken.None);

        Assert.NotEmpty(tenants);
    }
}
