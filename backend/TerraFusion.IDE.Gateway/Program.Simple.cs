using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.Sqlite;
using Serilog;
using System.Diagnostics;

var builder = WebApplication.CreateBuilder(args);

// Configure Serilog
Log.Logger = new LoggerConfiguration()
    .WriteTo.Console()
    .WriteTo.File("logs/ide-gateway-.txt", rollingInterval: RollingInterval.Day)
    .CreateLogger();

builder.Host.UseSerilog();

// Add services
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new() { 
        Title = "TerraFusion IDE Gateway API", 
        Version = "1.0.0",
        Description = "Simple API Gateway for TerraFusion IDE - Database Access & IDE Features"
    });
});

// Configure CORS for IDE
builder.Services.AddCors(options =>
{
    options.AddPolicy("IDEPolicy", policy =>
    {
        policy.WithOrigins("http://localhost:5173", "http://localhost:5176", "http://localhost:3000")
              .AllowAnyMethod()
              .AllowAnyHeader()
              .AllowCredentials();
    });
});

var app = builder.Build();

// Configure middleware
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "TerraFusion IDE Gateway v1");
        c.RoutePrefix = "api-docs";
    });
}

app.UseCors("IDEPolicy");
app.MapControllers();

// Health check endpoint
app.MapGet("/health", () => new
{
    Status = "Healthy",
    Timestamp = DateTime.UtcNow,
    Version = "1.0.0",
    Service = "TerraFusion IDE Gateway"
});

// IDE status endpoint
app.MapGet("/api/ide/status", () => new
{
    IDE = "TerraFusion Ultimate IDE",
    Version = "1.0.0",
    Status = "Running",
    Capabilities = new[]
    {
        "SQLite Database Access (32 databases)",
        "Benton County Property Data (await DynamicPropertyService.GetPropertyCountAsync("benton") parcels)",
        "Code Execution & Compilation",
        "AI-Powered Development with 1,008 agents",
        "Government Compliance Tools"
    }
});

// Database list endpoint
app.MapGet("/api/databases", () =>
{
    var dbPath = Path.Combine(Directory.GetCurrentDirectory(), "..", "..", "databases");
    
    if (!Directory.Exists(dbPath))
    {
        return Results.Ok(new
        {
            Databases = new[]
            {
                new { Name = "benton_county_parcels", Type = "SQLite", Tables = 12, Records = await DynamicPropertyService.GetPropertyCountAsync("benton") },
                new { Name = "property_valuations", Type = "SQLite", Tables = 8, Records = await DynamicPropertyService.GetPropertyCountAsync(countyCode) },
                new { Name = "tax_levies", Type = "SQLite", Tables = 5, Records = 12000 }
            },
            Message = "Demo data - databases directory not found at: " + dbPath
        });
    }
    
    var databases = Directory.GetFiles(dbPath, "*.db")
        .Select(dbFile => new
        {
            Name = Path.GetFileNameWithoutExtension(dbFile),
            Type = "SQLite",
            Path = dbFile,
            SizeMB = new FileInfo(dbFile).Length / (1024.0 * 1024.0)
        })
        .ToArray();
    
    return Results.Ok(new { Databases = databases, Count = databases.Length });
});

// Database query endpoint
app.MapPost("/api/query", async ([FromBody] QueryRequest request) =>
{
    var stopwatch = Stopwatch.StartNew();
    
    try
    {
        var dbPath = Path.Combine(Directory.GetCurrentDirectory(), "..", "..", "databases", $"{request.DatabaseName}.db");
        
        if (!File.Exists(dbPath))
        {
            // Return demo data if database doesn't exist
            return Results.Ok(new QueryResult
            {
                Success = true,
                Rows = new List<Dictionary<string, object?>>
                {
                    new() { ["ParcelID"] = "P001", ["Address"] = "123 Main St", ["AssessedValue"] = 250000, ["LandValue"] = 75000 },
                    new() { ["ParcelID"] = "P002", ["Address"] = "456 Oak Ave", ["AssessedValue"] = 325000, ["LandValue"] = 95000 },
                    new() { ["ParcelID"] = "P003", ["Address"] = "789 Pine Rd", ["AssessedValue"] = 185000, ["LandValue"] = 55000 }
                },
                RowCount = 3,
                ExecutionTimeMs = stopwatch.ElapsedMilliseconds,
                Message = $"Demo data - database not found: {dbPath}"
            });
        }
        
        var connectionString = $"Data Source={dbPath};Mode=ReadOnly";
        using var connection = new SqliteConnection(connectionString);
        await connection.OpenAsync();
        
        using var command = connection.CreateCommand();
        command.CommandText = request.Query;
        command.CommandTimeout = 30;
        
        var rows = new List<Dictionary<string, object?>>();
        using var reader = await command.ExecuteReaderAsync();
        
        while (await reader.ReadAsync() && rows.Count < request.MaxRows)
        {
            var row = new Dictionary<string, object?>();
            for (int i = 0; i < reader.FieldCount; i++)
            {
                row[reader.GetName(i)] = reader.IsDBNull(i) ? null : reader.GetValue(i);
            }
            rows.Add(row);
        }
        
        stopwatch.Stop();
        
        return Results.Ok(new QueryResult
        {
            Success = true,
            Rows = rows,
            RowCount = rows.Count,
            ExecutionTimeMs = stopwatch.ElapsedMilliseconds
        });
    }
    catch (Exception ex)
    {
        stopwatch.Stop();
        Log.Error(ex, "Query execution failed");
        
        return Results.Ok(new QueryResult
        {
            Success = false,
            Rows = new List<Dictionary<string, object?>>(),
            RowCount = 0,
            ExecutionTimeMs = stopwatch.ElapsedMilliseconds,
            Error = ex.Message
        });
    }
});

Log.Information("🚀 TerraFusion IDE Gateway starting up...");
Log.Information("📊 Swagger UI available at: http://localhost:5000/api-docs");
Log.Information("💻 IDE Gateway running at: http://localhost:5000");

app.Run();

// Request/Response Models
public record QueryRequest(string DatabaseName, string Query, int MaxRows = 1000);

public record QueryResult
{
    public bool Success { get; init; }
    public List<Dictionary<string, object?>> Rows { get; init; } = new();
    public int RowCount { get; init; }
    public double ExecutionTimeMs { get; init; }
    public string? Error { get; init; }
    public string? Message { get; init; }
}
