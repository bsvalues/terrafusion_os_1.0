// TerraFusion.Operations/Program.cs
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using TerraFusion.Operations.Configuration;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new Microsoft.OpenApi.Models.OpenApiInfo
    {
        Title = "TerraFusion Elite Operational Excellence API",
        Version = "v1.0",
        Description = "Championship-level operational excellence framework for TerraFusion OS - Government. Transcended.",
        Contact = new Microsoft.OpenApi.Models.OpenApiContact
        {
            Name = "TerraFusion Government Technologies",
            Email = "elite-operations@terrafusionmarket.com"
        }
    });

    // Include XML comments
    var xmlFile = $"{System.Reflection.Assembly.GetExecutingAssembly().GetName().Name}.xml";
    var xmlPath = Path.Combine(AppContext.BaseDirectory, xmlFile);
    if (File.Exists(xmlPath))
    {
        c.IncludeXmlComments(xmlPath);
    }
});

// Configure JWT Authentication
var jwtSettings = builder.Configuration.GetSection("JWT");
var secretKey = Encoding.ASCII.GetBytes(jwtSettings["Secret"] ?? "TerraFusion-Default-Secret");

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.RequireHttpsMetadata = false;
    options.SaveToken = true;
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new SymmetricSecurityKey(secretKey),
        ValidateIssuer = true,
        ValidIssuer = jwtSettings["ValidIssuer"],
        ValidateAudience = true,
        ValidAudience = jwtSettings["ValidAudience"],
        ValidateLifetime = true,
        ClockSkew = TimeSpan.Zero
    };
});

// Add Elite Operational Excellence services
builder.Services.AddEliteOperationalExcellence(builder.Configuration);
builder.Services.AddEliteOperationalSecurity(builder.Configuration);
builder.Services.AddEliteOperationalHealthChecks(builder.Configuration);
builder.Services.AddEliteOperationalCaching(builder.Configuration);
builder.Services.AddEliteOperationalLogging(builder.Configuration);

// Configure CORS
builder.Services.AddCors(options =>
{
    var corsSettings = builder.Configuration.GetSection("Cors");
    options.AddDefaultPolicy(policy =>
    {
        var origins = corsSettings.GetSection("AllowedOrigins").Get<string[]>() ?? new[] { "*" };
        var methods = corsSettings.GetSection("AllowedMethods").Get<string[]>() ?? new[] { "*" };
        var headers = corsSettings.GetSection("AllowedHeaders").Get<string[]>() ?? new[] { "*" };

        if (origins.Contains("*"))
            policy.AllowAnyOrigin();
        else
            policy.WithOrigins(origins);

        if (methods.Contains("*"))
            policy.AllowAnyMethod();
        else
            policy.WithMethods(methods);

        if (headers.Contains("*"))
            policy.AllowAnyHeader();
        else
            policy.WithHeaders(headers);

        if (corsSettings.GetValue<bool>("AllowCredentials"))
            policy.AllowCredentials();
    });
});

// Add Application Insights if configured
var instrumentationKey = builder.Configuration["ApplicationInsights:InstrumentationKey"];
if (!string.IsNullOrEmpty(instrumentationKey))
{
    builder.Services.AddApplicationInsightsTelemetry(options =>
    {
        options.ConnectionString = $"InstrumentationKey={instrumentationKey}";
    });
}

var app = builder.Build();

// Configure the HTTP request pipeline
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "TerraFusion Elite Operational Excellence API v1.0");
        c.RoutePrefix = "swagger";
        c.DocumentTitle = "TerraFusion Elite Operational Excellence API";
        c.DefaultModelsExpandDepth(-1);
    });
}

app.UseHttpsRedirection();
app.UseCors();
app.UseAuthentication();
app.UseAuthorization();

// Map health checks
app.MapHealthChecks("/health");
app.MapHealthChecks("/health/ready");
app.MapHealthChecks("/health/live");

// Add custom health check endpoint with detailed information
app.MapGet("/health/detailed", async (IServiceProvider services) =>
{
    try
    {
        // Simulate async health check
        await Task.Delay(1);

        return Results.Ok(new
        {
            Status = "Healthy",
            Service = "TerraFusion Elite Operational Excellence",
            Version = "1.0.0-elite-operational",
            Environment = app.Environment.EnvironmentName,
            Timestamp = DateTime.UtcNow,
            Uptime = DateTime.UtcNow - System.Diagnostics.Process.GetCurrentProcess().StartTime,
            MachineName = Environment.MachineName,
            ProcessId = Environment.ProcessId,
            WorkingSet = Environment.WorkingSet,
            Message = "Government. Transcended. - Championship Level Operational Excellence"
        });
    }
    catch (Exception ex)
    {
        return Results.Problem(
            title: "Health Check Failed",
            detail: ex.Message,
            statusCode: 500
        );
    }
})
.WithName("DetailedHealthCheck")
.WithOpenApi();

// Add operational status endpoint
app.MapGet("/status", () =>
{
    return Results.Ok(new
    {
        Service = "TerraFusion Elite Operational Excellence",
        Status = "Operational",
        Classification = "Championship Level",
        Tagline = "Government. Transcended.",
        Version = "1.0.0-elite-operational",
        BuildNumber = "2024.12.13.001",
        Environment = app.Environment.EnvironmentName,
        Timestamp = DateTime.UtcNow,
        Framework = ".NET 8.0",
        OperationalExcellence = "Elite Level",
        Message = "Elite Operational Excellence Framework - Autonomous Self-Healing Government Technology"
    });
})
.WithName("OperationalStatus")
.WithOpenApi();

app.MapControllers();

// Log startup information
Console.WriteLine("🏛️ TerraFusion Elite Operational Excellence starting...");
Console.WriteLine("🏆 Championship Level Government Technology - Government. Transcended.");
Console.WriteLine("⚡ Elite Operational Excellence Framework initialized");
Console.WriteLine("🚀 Ready for autonomous self-healing operations");

try
{
    Console.WriteLine("🎯 TerraFusion Elite Operational Excellence started successfully");
    app.Run();
}
catch (Exception ex)
{
    Console.WriteLine($"💥 TerraFusion Elite Operational Excellence startup failed: {ex.Message}");
    throw;
}
