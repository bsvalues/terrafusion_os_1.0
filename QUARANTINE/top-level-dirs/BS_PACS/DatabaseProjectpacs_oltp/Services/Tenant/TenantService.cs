namespace DatabaseProjectpacs_oltp.Services.Tenant;

public class TenantService : ITenantService
{
    private string _currentTenant;
    private readonly IConfiguration _configuration;

    public TenantService(IConfiguration configuration)
    {
        _configuration = configuration;
    }

    public string GetCurrentTenant()
    {
        return _currentTenant;
    }

    public void SetCurrentTenant(string tenantId)
    {
        _currentTenant = tenantId;
    }

    public bool ValidateTenant(string tenantId)
    {
        // Implement tenant validation logic
        // This could include checking against a list of valid tenants in configuration or database
        return !string.IsNullOrEmpty(tenantId);
    }
} 