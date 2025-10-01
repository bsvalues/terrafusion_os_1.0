using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.Hosting;

public class WebAppFactory : WebApplicationFactory<Program>
{
    protected override IHost CreateHost(IHostBuilder builder)
    {
        // Customize test services if needed
        return base.CreateHost(builder);
    }
}