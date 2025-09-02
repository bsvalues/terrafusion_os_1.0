using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

// Add services
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

var app = builder.Build();

// Configure pipeline
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors("AllowAll");
app.MapControllers();

// Add a simple health check endpoint
app.MapGet("/health", () => new { status = "healthy", timestamp = DateTime.UtcNow });

// Module registry endpoint
app.MapGet("/api/modules", () => new[]
{
    new { id = "costforge-ai", name = "CostForge AI", status = "ready" },
    new { id = "terra-agent", name = "Terra Agent", status = "ready" },
    new { id = "terra-flow", name = "Terra Flow", status = "ready" },
    new { id = "terra-collections", name = "Terra Collections", status = "ready" },
    new { id = "terra-levy", name = "Terra Levy", status = "ready" },
    new { id = "terra-market", name = "Terra Market", status = "ready" },
    new { id = "terra-official", name = "Terra Official", status = "ready" },
    new { id = "terra-planning", name = "Terra Planning", status = "ready" },
    new { id = "terra-rfp", name = "Terra RFP Central", status = "ready" },
    new { id = "terra-transit", name = "Terra Transit", status = "ready" },
    new { id = "terra-whitman", name = "Terra Whitman", status = "ready" },
    new { id = "property-workbench", name = "Property Workbench", status = "ready" },
    new { id = "web-audit", name = "Web Audit Tracker", status = "ready" },
    new { id = "gispro", name = "GIS Pro", status = "ready" }
});

app.Run("http://localhost:5000");
