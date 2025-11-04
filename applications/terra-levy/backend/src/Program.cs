using Microsoft.EntityFrameworkCore;
using TerraLevy.Elite.Backend.Services;
using TerraFusion.Data;
using TerraFusion.AI.Services;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Database configuration
builder.Services.AddDbContext<TerraFusionDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

// TerraLevy Elite services
builder.Services.AddScoped<IQuantumAnalyticsService, QuantumAnalyticsService>();
builder.Services.AddScoped<IEliteDataService, EliteDataService>();
builder.Services.AddScoped<IPhDLevelComputingService, PhDLevelComputingService>();

// AI coordination services
builder.Services.AddScoped<IAgentCoordinationService, AgentCoordinationService>();

// Government compliance
builder.Services.AddAuthentication("Bearer")
    .AddJwtBearer("Bearer", options =>
    {
        options.Authority = builder.Configuration["TerraFusion:Authority"];
        options.TokenValidationParameters.ValidateAudience = false;
    });

builder.Services.AddAuthorization();

var app = builder.Build();

// Configure the HTTP request pipeline
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "TerraLevy Elite API v1");
        c.DocumentTitle = "TerraLevy Elite - PhD-Level Quantum AI API";
    });
}

app.UseHttpsRedirection();
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

// Health check endpoint
app.MapGet("/health", () => new
{
    Status = "Quantum Operational",
    Service = "TerraLevy Elite Backend",
    Level = "PhD-Level Quantum AI",
    Performance = "Championship-Level",
    Motto = "Government. Transcended."
});

app.Run();
