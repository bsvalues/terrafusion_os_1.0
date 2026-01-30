using Serilog;

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
