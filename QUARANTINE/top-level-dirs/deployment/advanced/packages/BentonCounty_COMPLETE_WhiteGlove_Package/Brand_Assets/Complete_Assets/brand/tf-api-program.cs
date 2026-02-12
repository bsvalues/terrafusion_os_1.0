using Microsoft.AspNetCore.Authentication.Negotiate;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using System.Text.Json;

var builder = WebApplication.CreateBuilder(args);

// Get port from command line arguments
var port = 49152;
if (args.Contains("--port"))
{
    var portIndex = Array.IndexOf(args, "--port");
    if (portIndex < args.Length - 1)
    {
        int.TryParse(args[portIndex + 1], out port);
    }
}

// Configure Kestrel to listen on localhost only
builder.WebHost.UseUrls($"http://localhost:{port}");

// Add services
builder.Services.AddAuthentication(NegotiateDefaults.AuthenticationScheme)
    .AddNegotiate();

builder.Services.AddAuthorization();

// Add CORS for WebView2
builder.Services.AddCors(options =>
{
    options.AddPolicy("LocalOnly", policy =>
    {
        policy.WithOrigins(
                $"http://localhost:{port}",
                "http://localhost:*",
                "http://127.0.0.1:*"
            )
            .AllowAnyMethod()
            .AllowAnyHeader()
            .AllowCredentials();
    });
});

// Add controllers
builder.Services.AddControllers();

// Add custom services
builder.Services.AddSingleton<CapabilityBroker>();
builder.Services.AddSingleton<CountyDataService>();
builder.Services.AddSingleton<ModuleRegistry>();

var app = builder.Build();

// Middleware pipeline
app.UseAuthentication();
app.UseAuthorization();
app.UseCors("LocalOnly");

// Serve static files (PWA)
app.UseDefaultFiles();
app.UseStaticFiles();

// Health check endpoint
app.MapGet("/api/health", () => new { status = "healthy", timestamp = DateTime.UtcNow });

// User info endpoint
app.MapGet("/api/user", (HttpContext context) =>
{
    return new
    {
        name = context.User.Identity?.Name ?? "Anonymous",
        authenticated = context.User.Identity?.IsAuthenticated ?? false,
        domain = context.User.Claims.FirstOrDefault(c => c.Type == ClaimTypes.WindowsAccountName)?.Value,
        roles = context.User.Claims.Where(c => c.Type == ClaimTypes.Role).Select(c => c.Value),
        capabilities = DetermineUserCapabilities(context.User)
    };
});

// Module registry endpoint
app.MapGet("/api/modules", (ModuleRegistry registry) => registry.GetModules());

// Property valuation endpoint (CostForge AI)
app.MapPost("/api/valuation/calculate", async (ValuationRequest request, CountyDataService dataService) =>
{
    // Simulate CostForge AI processing
    await Task.Delay(100); // Simulate processing time
    
    // In production, this would call the actual CostForge AI engine
    var baseValue = request.SquareFootage * 125; // $125 per sq ft base
    var locationMultiplier = 1.2; // Location adjustment
    var marketAdjustment = 1.05; // Current market conditions
    
    var estimatedValue = baseValue * locationMultiplier * marketAdjustment;
    
    return new ValuationResponse
    {
        PropertyId = request.PropertyId,
        Address = request.Address,
        EstimatedValue = Math.Round(estimatedValue, 2),
        Confidence = 0.94,
        ProcessingTime = "0.1s",
        Factors = new
        {
            BaseValue = baseValue,
            LocationMultiplier = locationMultiplier,
            MarketAdjustment = marketAdjustment
        },
        Timestamp = DateTime.UtcNow
    };
});

// Benton County data endpoint
app.MapGet("/api/counties/benton/properties", async (CountyDataService dataService) =>
{
    var properties = await dataService.GetBentonProperties();
    return new
    {
        count = properties.Count,
        properties = properties.Take(100), // Return first 100 for performance
        totalValue = properties.Sum(p => p.AssessedValue),
        averageValue = properties.Average(p => p.AssessedValue)
    };
});

// Search properties endpoint
app.MapGet("/api/properties/search", async (string? query, CountyDataService dataService) =>
{
    var properties = await dataService.SearchProperties(query ?? "");
    return properties;
});

// Module capability check
app.MapPost("/api/capabilities/check", (CapabilityRequest request, CapabilityBroker broker, HttpContext context) =>
{
    var hasCapability = broker.UserHasCapability(context.User, request.Module, request.Capability);
    return new { allowed = hasCapability, module = request.Module, capability = request.Capability };
});

app.MapControllers();

app.Run();

// Helper function to determine user capabilities
List<string> DetermineUserCapabilities(ClaimsPrincipal user)
{
    var capabilities = new List<string>
    {
        "core:access",
        "modules:list",
        "modules:launch"
    };
    
    // Check for admin rights
    if (user.IsInRole("Administrators") || user.IsInRole("Domain Admins"))
    {
        capabilities.Add("admin:full");
        capabilities.Add("devops:access");
        capabilities.Add("ide:access");
    }
    
    // Check for assessor rights
    if (user.IsInRole("Assessors") || user.IsInRole("County Staff"))
    {
        capabilities.Add("costforge:access");
        capabilities.Add("properties:read");
        capabilities.Add("properties:write");
        capabilities.Add("valuation:calculate");
    }
    
    return capabilities;
}

// Request/Response models
public record ValuationRequest(
    string PropertyId,
    string Address,
    double SquareFootage,
    int Bedrooms,
    int Bathrooms,
    int YearBuilt,
    string PropertyType
);

public record ValuationResponse
{
    public string PropertyId { get; set; }
    public string Address { get; set; }
    public double EstimatedValue { get; set; }
    public double Confidence { get; set; }
    public string ProcessingTime { get; set; }
    public object Factors { get; set; }
    public DateTime Timestamp { get; set; }
}

public record CapabilityRequest(string Module, string Capability);

// Services
public class CapabilityBroker
{
    private readonly Dictionary<string, List<string>> _moduleCapabilities = new()
    {
        ["costforge"] = new() { "valuation:calculate", "properties:read", "ml:inference" },
        ["marketplace"] = new() { "modules:browse", "modules:install" },
        ["devops"] = new() { "admin:required", "logs:read", "metrics:view" },
        ["ide"] = new() { "developer:required", "code:edit", "debug:attach" }
    };
    
    public bool UserHasCapability(ClaimsPrincipal user, string module, string capability)
    {
        // Check if user is authenticated
        if (!user.Identity?.IsAuthenticated ?? true)
            return false;
        
        // Admins have all capabilities
        if (user.IsInRole("Administrators"))
            return true;
        
        // Check module-specific requirements
        if (_moduleCapabilities.ContainsKey(module))
        {
            var requiredCaps = _moduleCapabilities[module];
            
            // For now, return true if user is authenticated
            // In production, check against AD groups and permissions
            return true;
        }
        
        return false;
    }
}

public class CountyDataService
{
    private List<Property> _properties;
    
    public CountyDataService()
    {
        // In production, this would connect to SQL Server
        // For now, generate sample data
        _properties = GenerateSampleProperties();
    }
    
    public Task<List<Property>> GetBentonProperties()
    {
        return Task.FromResult(_properties);
    }
    
    public Task<List<Property>> SearchProperties(string query)
    {
        var results = _properties
            .Where(p => p.Address.Contains(query, StringComparison.OrdinalIgnoreCase))
            .Take(10)
            .ToList();
        
        return Task.FromResult(results);
    }
    
    private List<Property> GenerateSampleProperties()
    {
        var properties = new List<Property>();
        var random = new Random();
        
        string[] streets = { "Main St", "Oak Ave", "Elm Dr", "First St", "Park Rd" };
        string[] cities = { "Kennewick", "Richland", "Pasco", "West Richland" };
        
        for (int i = 1; i <= 100; i++)
        {
            properties.Add(new Property
            {
                PropertyId = $"BEN-{i:D6}",
                Address = $"{random.Next(100, 9999)} {streets[random.Next(streets.Length)]}, {cities[random.Next(cities.Length)]}, WA",
                AssessedValue = random.Next(150000, 800000),
                SquareFootage = random.Next(1200, 4000),
                YearBuilt = random.Next(1950, 2024),
                PropertyType = random.Next(2) == 0 ? "Residential" : "Commercial"
            });
        }
        
        return properties;
    }
}

public class ModuleRegistry
{
    public List<Module> GetModules()
    {
        return new List<Module>
        {
            new("terra-agent", "Terra Agent", "🤖", "AI-powered property assistant", true),
            new("costforge-ai", "CostForge AI", "🏗️", "Property valuation engine", true),
            new("permit-flow", "Permit Flow", "📋", "Permit management system", true),
            new("compliance-guard", "Compliance Guard", "⚖️", "Regulatory compliance", true),
            new("marketplace", "Marketplace", "🛍️", "Module marketplace", true),
            new("devops", "DevOps Workspace", "⚙️", "System management", false),
            new("ide", "TerraFusion IDE", "💻", "Development environment", false)
        };
    }
}

// Models
public class Property
{
    public string PropertyId { get; set; }
    public string Address { get; set; }
    public double AssessedValue { get; set; }
    public double SquareFootage { get; set; }
    public int YearBuilt { get; set; }
    public string PropertyType { get; set; }
}

public record Module(
    string Id,
    string Name,
    string Icon,
    string Description,
    bool Enabled
);