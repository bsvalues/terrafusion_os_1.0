using TerraFusion.Modules.CurrentUse.Dto;

namespace TerraFusion.Modules.CurrentUse.Tenancy;

public interface ICurrentUseTenantService
{
    Task<IReadOnlyList<CurrentUseCountyTenantDto>> GetTenantsAsync(
        CancellationToken cancellationToken);

    Task<CurrentUseCountyTenantDto> CreateTenantAsync(
        CreateCurrentUseCountyTenantDto request,
        CancellationToken cancellationToken);

    Task<CurrentUseCountyTenantDto?> GetTenantAsync(
        Guid countyId,
        CancellationToken cancellationToken);
}

public sealed class CurrentUseTenantService : ICurrentUseTenantService
{
    private static readonly List<CurrentUseCountyTenantDto> Tenants =
    [
        new CurrentUseCountyTenantDto(
            Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
            "Benton County",
            "WA",
            CurrentUseTenantStatus.Active,
            "2025.09.01",
            "terrafusion-default",
            false,
            false,
            true,
            false,
            false,
            DateTimeOffset.UtcNow,
            "system")
    ];

    public Task<IReadOnlyList<CurrentUseCountyTenantDto>> GetTenantsAsync(
        CancellationToken cancellationToken)
    {
        return Task.FromResult((IReadOnlyList<CurrentUseCountyTenantDto>)Tenants.ToArray());
    }

    public Task<CurrentUseCountyTenantDto> CreateTenantAsync(
        CreateCurrentUseCountyTenantDto request,
        CancellationToken cancellationToken)
    {
        var tenant = new CurrentUseCountyTenantDto(
            request.CountyId,
            request.CountyName,
            request.StateCode,
            CurrentUseTenantStatus.Onboarding,
            request.PolicyVersion,
            request.Theme,
            false,
            false,
            false,
            false,
            false,
            DateTimeOffset.UtcNow,
            request.CreatedBy);

        Tenants.Add(tenant);

        return Task.FromResult(tenant);
    }

    public Task<CurrentUseCountyTenantDto?> GetTenantAsync(
        Guid countyId,
        CancellationToken cancellationToken)
    {
        return Task.FromResult(
            Tenants.FirstOrDefault(x => x.CountyId == countyId));
    }
}
