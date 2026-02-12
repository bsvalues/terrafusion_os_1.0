using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

public class TenantService : ITenantService
{
    private readonly DatabaseContext _context;
    private readonly ILogger<TenantService> _logger;

    public TenantService(DatabaseContext context, ILogger<TenantService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<TenantDto> CreateTenantAsync(CreateTenantRequest request)
    {
        try
        {
            var tenant = new Tenant
            {
                TenantName = request.TenantName,
                ApiKey = Guid.NewGuid().ToString("N"),
                Status = TenantStatus.Active,
                CreatedAt = DateTime.UtcNow
            };

            _context.Tenants.Add(tenant);
            await _context.SaveChangesAsync();

            // Create default admin user for tenant
            var adminUser = new User
            {
                TenantID = tenant.TenantID,
                Email = request.AdminEmail,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.AdminPassword),
                Role = "Admin",
                Status = UserStatus.Active,
                CreatedAt = DateTime.UtcNow
            };

            _context.Users.Add(adminUser);
            await _context.SaveChangesAsync();

            return new TenantDto
            {
                TenantID = tenant.TenantID,
                TenantName = tenant.TenantName,
                ApiKey = tenant.ApiKey,
                Status = tenant.Status
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating tenant {TenantName}", request.TenantName);
            throw;
        }
    }

    public async Task<TenantDto> GetTenantAsync(int tenantId)
    {
        var tenant = await _context.Tenants
            .AsNoTracking()
            .FirstOrDefaultAsync(t => t.TenantID == tenantId);

        if (tenant == null)
            throw new NotFoundException($"Tenant {tenantId} not found");

        return new TenantDto
        {
            TenantID = tenant.TenantID,
            TenantName = tenant.TenantName,
            ApiKey = tenant.ApiKey,
            Status = tenant.Status
        };
    }

    public async Task UpdateTenantStatusAsync(int tenantId, TenantStatus status)
    {
        var tenant = await _context.Tenants
            .FirstOrDefaultAsync(t => t.TenantID == tenantId);

        if (tenant == null)
            throw new NotFoundException($"Tenant {tenantId} not found");

        tenant.Status = status;
        tenant.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
    }

    public async Task<TenantUsageStats> GetTenantUsageStatsAsync(int tenantId)
    {
        var stats = new TenantUsageStats
        {
            TotalProperties = await _context.Properties.CountAsync(p => p.TenantID == tenantId),
            TotalPermits = await _context.BuildingPermits.CountAsync(p => p.TenantID == tenantId),
            TotalUsers = await _context.Users.CountAsync(u => u.TenantID == tenantId),
            StorageUsedBytes = await _context.ImportLogs
                .Where(l => l.TenantID == tenantId)
                .SumAsync(l => l.FileSizeBytes)
        };

        return stats;
    }
}
