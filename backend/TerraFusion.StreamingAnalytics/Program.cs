/**
 * TerraFusion.StreamingAnalytics Microservice
 *
 * Real-time streaming analytics service for TerraFlow Quantum Command Center.
 * Provides SignalR hubs for:
 * - Real-time metric streaming
 * - Live data visualization
 * - Agent telemetry broadcasting
 *
 * Port: 3006 (HTTP), 3007 (HTTPS)
 *
 * @author TerraFusion Elite Government OS Engineering Agent
 * @version 1.0.0 - Phase 1 Foundation
 */

using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using Serilog;
using System.Text;
using TerraFusion.StreamingAnalytics.Hubs;
using TerraFusion.StreamingAnalytics.Services;

var builder = WebApplication.CreateBuilder(args);

// ========================================
// 1. SERILOG CONFIGURATION
// ========================================
Log.Logger = new LoggerConfiguration()
    .ReadFrom.Configuration(builder.Configuration)
    .Enrich.FromLogContext()
    .Enrich.WithMachineName()
    .Enrich.WithThreadId()
    .WriteTo.Console(outputTemplate: "[{Timestamp:HH:mm:ss} {Level:u3}] {SourceContext} - {Message:lj}{NewLine}{Exception}")
    .WriteTo.File("logs/streaming-analytics-.log", rollingInterval: RollingInterval.Day)
    .CreateLogger();

builder.Host.UseSerilog();

// ========================================
// 2. CORS CONFIGURATION
// ========================================
builder.Services.AddCors(options =>
{
    options.AddPolicy("TerraFusionCORS", policy =>
    {
        policy.WithOrigins(
                "http://localhost:3000",    // Frontend dev server
                "http://localhost:5173",    // Vite dev server
                "http://localhost:5000"     // TerraFusion.API
            )
            .AllowAnyMethod()
            .AllowAnyHeader()
            .AllowCredentials(); // Required for SignalR
    });
});

// ========================================
// 3. AUTHENTICATION (JWT)
// ========================================
var jwtSettings = builder.Configuration.GetSection("JwtSettings");
var secretKey = jwtSettings["SecretKey"] ?? throw new InvalidOperationException("JWT SecretKey not configured");

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = jwtSettings["Issuer"],
        ValidAudience = jwtSettings["Audience"],
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey))
    };

    // SignalR authentication
    options.Events = new JwtBearerEvents
    {
        OnMessageReceived = context =>
        {
            var accessToken = context.Request.Query["access_token"];
            var path = context.HttpContext.Request.Path;

            if (!string.IsNullOrEmpty(accessToken) && path.StartsWithSegments("/hubs"))
            {
                context.Token = accessToken;
            }

            return Task.CompletedTask;
        }
    };
});

builder.Services.AddAuthorization();

// ========================================
// 4. SIGNALR CONFIGURATION
// ========================================
builder.Services.AddSignalR(options =>
{
    options.EnableDetailedErrors = builder.Environment.IsDevelopment();
    options.MaximumReceiveMessageSize = 1024 * 1024; // 1 MB
    options.StreamBufferCapacity = 10;
    options.KeepAliveInterval = TimeSpan.FromSeconds(15);
    options.ClientTimeoutInterval = TimeSpan.FromSeconds(30);
})
.AddMessagePackProtocol(); // Efficient binary serialization

// ========================================
// 5. APPLICATION SERVICES
// ========================================
builder.Services.AddSingleton<IMetricStreamingService, MetricStreamingService>();
builder.Services.AddSingleton<IAgentTelemetryService, AgentTelemetryService>();
builder.Services.AddHostedService<MetricBroadcastService>();

// ========================================
// 6. API CONTROLLERS & SWAGGER
// ========================================
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "TerraFusion.StreamingAnalytics API",
        Version = "v1.0.0",
        Description = "Real-time streaming analytics service for TerraFlow Quantum Command Center",
        Contact = new OpenApiContact
        {
            Name = "TerraFusion Elite Engineering Team",
            Email = "engineering@terrafusionmarket.com"
        }
    });

    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = "JWT Authorization header using the Bearer scheme. Example: \"Authorization: Bearer {token}\"",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.ApiKey,
        Scheme = "Bearer"
    });

    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

// ========================================
// 7. HEALTH CHECKS
// ========================================
builder.Services.AddHealthChecks()
    .AddCheck<StreamingAnalyticsHealthCheck>("streaming-analytics");

// ========================================
// 8. BUILD APPLICATION
// ========================================
var app = builder.Build();

// ========================================
// 9. MIDDLEWARE PIPELINE
// ========================================

// Swagger (all environments for government transparency)
app.UseSwagger();
app.UseSwaggerUI(c =>
{
    c.SwaggerEndpoint("/swagger/v1/swagger.json", "TerraFusion.StreamingAnalytics v1");
    c.RoutePrefix = "swagger";
});

app.UseCors("TerraFusionCORS");

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();
app.MapHealthChecks("/health");

// SignalR Hubs
app.MapHub<StreamingHub>("/hubs/streaming");
app.MapHub<TelemetryHub>("/hubs/telemetry");

// ========================================
// 10. STARTUP
// ========================================
Log.Information("========================================");
Log.Information("TerraFusion.StreamingAnalytics v1.0.0");
Log.Information("Port: {Port}", builder.Configuration["Urls"] ?? "http://localhost:3006");
Log.Information("Environment: {Environment}", app.Environment.EnvironmentName);
Log.Information("SignalR Hubs: /hubs/streaming, /hubs/telemetry");
Log.Information("========================================");

try
{
    app.Run();
}
catch (Exception ex)
{
    Log.Fatal(ex, "Application terminated unexpectedly");
}
finally
{
    Log.CloseAndFlush();
}
