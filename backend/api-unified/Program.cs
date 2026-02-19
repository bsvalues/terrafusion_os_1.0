using Serilog;
using System.Net.Http.Headers;

Log.Logger = new LoggerConfiguration()
    .WriteTo.Console()
    .CreateLogger();

var builder = WebApplication.CreateBuilder(args);
builder.Host.UseSerilog();

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.AllowAnyOrigin().AllowAnyMethod().AllowAnyHeader();
    });
});
builder.Services.AddMemoryCache();

var app = builder.Build();

app.UseSwagger();
app.UseSwaggerUI();
app.UseCors();

var pilotBaseUrl = Environment.GetEnvironmentVariable("PILOT_BASE_URL") ?? "http://localhost:4317";
var pilotProxyHttpClient = new HttpClient();

app.MapMethods(
    "/pilot/{**catchAll}",
    new[] { "GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS" },
    async (HttpContext context, string? catchAll) =>
    {
        if (HttpMethods.IsOptions(context.Request.Method))
        {
            context.Response.StatusCode = StatusCodes.Status204NoContent;
            return;
        }

        var targetPath = string.IsNullOrWhiteSpace(catchAll) ? string.Empty : catchAll;
        var targetUri = new Uri($"{pilotBaseUrl.TrimEnd('/')}/pilot/{targetPath}{context.Request.QueryString}");

        using var proxyRequest = new HttpRequestMessage(new HttpMethod(context.Request.Method), targetUri);

        if (context.Request.ContentLength > 0 || context.Request.Headers.ContainsKey("Transfer-Encoding"))
        {
            proxyRequest.Content = new StreamContent(context.Request.Body);
            if (!string.IsNullOrWhiteSpace(context.Request.ContentType))
            {
                proxyRequest.Content.Headers.ContentType = MediaTypeHeaderValue.Parse(context.Request.ContentType);
            }
        }

        foreach (var header in context.Request.Headers)
        {
            if (string.Equals(header.Key, "Host", StringComparison.OrdinalIgnoreCase))
            {
                continue;
            }

            var values = header.Value.ToArray();
            if (!proxyRequest.Headers.TryAddWithoutValidation(header.Key, values))
            {
                proxyRequest.Content?.Headers.TryAddWithoutValidation(header.Key, values);
            }
        }

        using var proxyResponse = await pilotProxyHttpClient.SendAsync(
            proxyRequest,
            HttpCompletionOption.ResponseHeadersRead,
            context.RequestAborted
        );

        context.Response.StatusCode = (int)proxyResponse.StatusCode;

        foreach (var header in proxyResponse.Headers)
        {
            context.Response.Headers[header.Key] = header.Value.ToArray();
        }

        foreach (var header in proxyResponse.Content.Headers)
        {
            context.Response.Headers[header.Key] = header.Value.ToArray();
        }

        context.Response.Headers.Remove("transfer-encoding");
        await proxyResponse.Content.CopyToAsync(context.Response.Body);
    }
);

// API routes
app.MapGet("/health", () => new { status = "healthy", timestamp = DateTime.UtcNow });
app.MapGet("/api/status", () => new { 
    service = "TerraFusion API", 
    version = "1.0.0",
    uptime = TimeSpan.FromSeconds(Environment.TickCount64 / 1000).ToString()
});

app.MapGet("/api/counties", () => new[] {
    new { id = "benton", name = "Benton County", state = "WA" },
    new { id = "yakima", name = "Yakima County", state = "WA" },
    new { id = "franklin", name = "Franklin County", state = "WA" }
});

app.MapGet("/api/counties/{countyId}/properties", (string countyId) => new[] {
    new { id = Guid.NewGuid(), parcelNumber = "1-0001-001", address = "123 Main St", countyId },
    new { id = Guid.NewGuid(), parcelNumber = "1-0001-002", address = "456 Oak Ave", countyId }
});

app.MapControllers();

var port = Environment.GetEnvironmentVariable("ASPNETCORE_PORT") ?? "5001";
Log.Information("TerraFusion API starting on port {Port}", port);
app.Run($"http://localhost:{port}");
