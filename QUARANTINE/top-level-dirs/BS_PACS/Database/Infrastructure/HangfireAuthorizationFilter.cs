using Hangfire.Dashboard;

namespace DatabaseProjectpacs_oltp.Infrastructure;

public class HangfireAuthorizationFilter : IDashboardAuthorizationFilter
{
    public bool Authorize(DashboardContext context)
    {
        var httpContext = context.GetHttpContext();

        // Only allow authenticated users to access the dashboard
        // You might want to add additional checks here (e.g., specific roles)
        return httpContext.User.Identity?.IsAuthenticated ?? false;
    }
}
