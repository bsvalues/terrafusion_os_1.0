namespace DatabaseProjectpacs_oltp.Services.Tenant;

public interface ITenantService
{
    string GetCurrentTenant();
    void SetCurrentTenant(string tenantId);
    bool ValidateTenant(string tenantId);
} 