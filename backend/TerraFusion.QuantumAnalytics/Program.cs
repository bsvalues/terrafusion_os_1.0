using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Serilog;
using System.Text;
using TerraFusion.QuantumAnalytics.Services;

namespace TerraFusion.QuantumAnalytics;

public class Program
{
    public static void Main(string[] args)
    {
        // Configure Serilog
        Log.Logger = new LoggerConfiguration()
            .WriteTo.Console()
            .CreateLogger();

        try
        {
            Log.Information("🚀 Starting TerraFusion.QuantumAnalytics (Port 3005)");

            var builder = WebApplication.CreateBuilder(args);

            // Add Serilog
            builder.Host.UseSerilog();

            // Add services to the container
            ConfigureServices(builder.Services, builder.Configuration);

            var app = builder.Build();

            // Configure the HTTP request pipeline
            ConfigurePipeline(app);

            Log.Information("✅ TerraFusion.QuantumAnalytics initialized successfully");

            app.Run();
        }
        catch (Exception ex)
        {
            Log.Fatal(ex, "❌ Application terminated unexpectedly");
        }
        finally
        {
            Log.CloseAndFlush();
        }
    }

    private static void ConfigureServices(IServiceCollection services, IConfiguration configuration)
    {
        // Add controllers
        services.AddControllers();

        // Add API documentation
        services.AddEndpointsApiExplorer();
        services.AddSwaggerGen(options =>
        {
            options.SwaggerDoc("v2", new Microsoft.OpenApi.Models.OpenApiInfo
            {
                Title = "TerraFusion Quantum Analytics API",
                Version = "v2.0",
                Description = "PhD-level statistical analysis and computational services",
                Contact = new Microsoft.OpenApi.Models.OpenApiContact
                {
                    Name = "TerraFusion Elite Engineering Team",
                    Email = "engineering@terrafusion.gov"
                }
            });

            // Add JWT authentication to Swagger
            options.AddSecurityDefinition("Bearer", new Microsoft.OpenApi.Models.OpenApiSecurityScheme
            {
                Description = "JWT Authorization header using the Bearer scheme. Example: \"Bearer {token}\"",
                Name = "Authorization",
                In = Microsoft.OpenApi.Models.ParameterLocation.Header,
                Type = Microsoft.OpenApi.Models.SecuritySchemeType.ApiKey,
                Scheme = "Bearer"
            });

            options.AddSecurityRequirement(new Microsoft.OpenApi.Models.OpenApiSecurityRequirement
            {
                {
                    new Microsoft.OpenApi.Models.OpenApiSecurityScheme
                    {
                        Reference = new Microsoft.OpenApi.Models.OpenApiReference
                        {
                            Type = Microsoft.OpenApi.Models.ReferenceType.SecurityScheme,
                            Id = "Bearer"
                        }
                    },
                    Array.Empty<string>()
                }
            });
        });

        // Add CORS for frontend (port 3000)
        services.AddCors(options =>
        {
            options.AddPolicy("TerraFusionCORS", policy =>
            {
                policy.WithOrigins(
                    "http://localhost:3000",
                    "https://localhost:3000",
                    "http://localhost:5173",
                    "https://localhost:5173"
                )
                .AllowAnyMethod()
                .AllowAnyHeader()
                .AllowCredentials();
            });
        });

        // Add JWT Authentication
        var jwtSecret = configuration["JwtSettings:SecretKey"] ?? "TerraFusion_Elite_Secret_Key_Change_In_Production_FISMA_HIGH_2025";
        var jwtIssuer = configuration["JwtSettings:Issuer"] ?? "TerraFusion.QuantumAnalytics";
        var jwtAudience = configuration["JwtSettings:Audience"] ?? "TerraFusion.Frontend";

        services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
            .AddJwtBearer(options =>
            {
                options.TokenValidationParameters = new TokenValidationParameters
                {
                    ValidateIssuer = true,
                    ValidateAudience = true,
                    ValidateLifetime = true,
                    ValidateIssuerSigningKey = true,
                    ValidIssuer = jwtIssuer,
                    ValidAudience = jwtAudience,
                    IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret))
                };
            });

        services.AddAuthorization();

        // Add Health Checks
        services.AddHealthChecks()
            .AddCheck<QuantumAnalyticsHealthCheck>("quantum-analytics");

        // Register application services
        services.AddScoped<IQuantumAnalyticsService, QuantumAnalyticsService>();
        services.AddScoped<IStatisticalTestingService, StatisticalTestingService>();
        services.AddScoped<ICausalInferenceService, CausalInferenceService>();
        services.AddScoped<IBayesianAnalysisService, BayesianAnalysisService>();
        services.AddScoped<ITimeSeriesService, TimeSeriesService>();
        services.AddScoped<ICorrelationAnalysisService, CorrelationAnalysisService>();

        // Add memory cache for expensive computations
        services.AddMemoryCache();

        // Add HTTP client for external services
        services.AddHttpClient();

        Log.Information("✅ Services configured for QuantumAnalytics");
    }

    private static void ConfigurePipeline(WebApplication app)
    {
        // Configure the HTTP request pipeline
        if (app.Environment.IsDevelopment())
        {
            app.UseSwagger();
            app.UseSwaggerUI(options =>
            {
                options.SwaggerEndpoint("/swagger/v2/swagger.json", "TerraFusion Quantum Analytics API v2");
                options.RoutePrefix = string.Empty; // Serve Swagger UI at root
            });
        }

        // Enable CORS
        app.UseCors("TerraFusionCORS");

        // Enable HTTPS redirection
        app.UseHttpsRedirection();

        // Enable authentication and authorization
        app.UseAuthentication();
        app.UseAuthorization();

        // Map controllers
        app.MapControllers();

        // Map health check endpoint
        app.MapHealthChecks("/health");

        // Root endpoint
        app.MapGet("/", () => new
        {
            Service = "TerraFusion.QuantumAnalytics",
            Version = "2.0.0",
            Status = "Operational",
            Port = 3005,
            Capabilities = new[]
            {
                "Statistical Hypothesis Testing (t-test, ANOVA, chi-square, Mann-Whitney, Kruskal-Wallis)",
                "Causal Inference (Propensity Score Matching, Instrumental Variables, Difference-in-Differences, Regression Discontinuity)",
                "Bayesian Analysis (MCMC Sampling, Posterior Distributions, Credible Intervals)",
                "Time-Series Forecasting (ARIMA, ETS, Prophet, LSTM)",
                "Correlation Analysis (Pearson, Spearman, Kendall, Mutual Information)",
                "Publication-Ready Output (LaTeX, APA Format)"
            },
            Documentation = "/swagger"
        })
        .WithName("GetServiceInfo")
        .WithOpenApi();

        Log.Information("✅ HTTP pipeline configured");
    }
}
