using DatabaseProjectpacs_oltp.Services.Tenant;

namespace DatabaseProjectpacs_oltp.Middleware;

public class TenantMiddleware
{
    private readonly RequestDelegate _next;

    public TenantMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public async Task InvokeAsync(HttpContext context, ITenantService tenantService)
    {
        var tenantId = context.Request.Headers["X-Tenant-ID"].ToString();

        if (string.IsNullOrEmpty(tenantId))
        {
            context.Response.StatusCode = StatusCodes.Status400BadRequest;
            await context.Response.WriteAsync("Tenant ID is required");
            return;
        }

        if (!tenantService.ValidateTenant(tenantId))
        {
            context.Response.StatusCode = StatusCodes.Status403Forbidden;
            await context.Response.WriteAsync("Invalid Tenant ID");
            return;
        }

        tenantService.SetCurrentTenant(tenantId);
        await _next(context);
    }
} 