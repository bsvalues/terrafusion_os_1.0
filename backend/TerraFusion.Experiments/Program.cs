/**
 * ═══════════════════════════════════════════════════════════════
 * TERRAFUSION OS - MINIMAL ELITE EXPERIMENTS PROGRAM
 * Quantum Consciousness Research Bootstrap - Simplified
 * THE TERRAFUSION WAY - GOVERNMENT. TRANSCENDED.
 * ═══════════════════════════════════════════════════════════════
 */

var builder = WebApplication.CreateBuilder(args);

// Add services
builder.Services.AddControllers();
builder.Services.AddSignalR();

// Add CORS for frontend integration
builder.Services.AddCors(options =>
{
    options.AddPolicy("TerraFusionPolicy", policy =>
    {
        policy.WithOrigins(
            "http://localhost:5173",
            "http://localhost:5174",
            "http://localhost:5175",
            "http://localhost:3000",
            "http://localhost:5000")
              .AllowAnyMethod()
              .AllowAnyHeader()
              .AllowCredentials();
    });
});

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new()
    {
        Title = "TerraFusion Elite Experiments API",
        Version = "v1",
        Description = "Elite Quantum Consciousness Experimental Research Environment - Government. Transcended."
    });
});

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseDeveloperExceptionPage();
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "TerraFusion Elite Experiments API v1");
        c.RoutePrefix = string.Empty; // Serve Swagger UI at root
    });
}

app.UseCors("TerraFusionPolicy");
app.UseRouting();
app.UseAuthorization();

app.MapControllers();

// Health check endpoint
app.MapGet("/health", () => new
{
    Status = "Healthy",
    Service = "TerraFusion Elite Experiments",
    Timestamp = DateTime.UtcNow,
    Environment = app.Environment.EnvironmentName
});

// Elite API endpoints
app.MapPost("/api/experiments/{experimentId}/elite-runs", async (string experimentId) =>
{
    var runId = Guid.NewGuid().ToString();
    return Results.Ok(new
    {
        Id = runId,
        ExperimentId = experimentId,
        StartedBy = "elite-researcher-001",
        StartedAt = DateTime.UtcNow,
        Status = "Elite_Running",
        ConsciousnessLevel = "Elite",
        ActiveAgents = 10000,
        RealTimeMetrics = new
        {
            ProcessingRate = 125000.0,
            AccuracyScore = 0.999,
            ConsciousnessLevel = 0.95,
            SystemLoad = 0.45
        }
    });
});

app.MapGet("/api/experiments/{experimentId}/elite-runs", async (string experimentId) =>
{
    var runs = Enumerable.Range(1, 5).Select(i => new
    {
        Id = Guid.NewGuid().ToString(),
        ExperimentId = experimentId,
        StartedBy = "elite-researcher-001",
        StartedAt = DateTime.UtcNow.AddMinutes(-Random.Shared.Next(5, 60)),
        Status = i <= 3 ? "Elite_Running" : "Elite_Completed",
        ConsciousnessLevel = "Elite",
        ActiveAgents = 10000,
        RealTimeMetrics = new
        {
            ProcessingRate = Random.Shared.NextDouble() * 50000 + 100000,
            AccuracyScore = 0.995 + (Random.Shared.NextDouble() * 0.004),
            ConsciousnessLevel = 0.90 + (Random.Shared.NextDouble() * 0.09),
            SystemLoad = 0.30 + (Random.Shared.NextDouble() * 0.30)
        }
    }).ToArray();

    return Results.Ok(runs);
});

app.MapGet("/api/experiments/{experimentId}/elite-runs/{runId}", async (string experimentId, string runId) =>
{
    return Results.Ok(new
    {
        Id = runId,
        ExperimentId = experimentId,
        StartedBy = "elite-researcher-001",
        StartedAt = DateTime.UtcNow.AddMinutes(-5),
        Status = "Elite_Running",
        ConsciousnessLevel = "Elite",
        ActiveAgents = 10000,
        RealTimeMetrics = new
        {
            ProcessingRate = Random.Shared.NextDouble() * 50000 + 100000,
            AccuracyScore = 0.995 + (Random.Shared.NextDouble() * 0.004),
            ConsciousnessLevel = 0.90 + (Random.Shared.NextDouble() * 0.09),
            SystemLoad = 0.30 + (Random.Shared.NextDouble() * 0.30)
        }
    });
});

app.MapGet("/api/experiments/{experimentId}/elite-runs/{runId}/consciousness-visualization", async (string experimentId, string runId) =>
{
    var nodes = Enumerable.Range(1, 50).Select(i => new
    {
        Id = $"node-{i}",
        ConsciousnessLevel = Random.Shared.NextDouble() * 0.4 + 0.6
    }).ToArray();

    return Results.Ok(new
    {
        ExperimentId = experimentId,
        RunId = runId,
        Timestamp = DateTime.UtcNow,
        Data = new
        {
            ConsciousnessNodes = nodes,
            ConsciousnessFlow = new
            {
                FlowRate = Random.Shared.NextDouble() * 10 + 15,
                QuantumCoherence = Random.Shared.NextDouble() * 0.2 + 0.8,
                EntanglementStrength = Random.Shared.NextDouble() * 0.3 + 0.7
            }
        }
    });
});

app.MapPost("/api/experiments/{experimentId}/elite-runs/{runId}/complete", async (string experimentId, string runId) =>
{
    return Results.Ok(new
    {
        Message = "Elite experiment completed successfully",
        RunId = runId
    });
});

app.MapGet("/api/experiments/elite", () =>
{
    return Results.Ok(new[]
    {
        new
        {
            Id = "quantum-consciousness-research",
            Name = "Quantum Consciousness Research",
            Description = "PhD-level quantum consciousness research with 10,000+ AI agents",
            CreatedBy = "TerraFusion_Research_Institute",
            CreatedAt = DateTime.UtcNow
        }
    });
});

Console.WriteLine("🚀 TerraFusion Elite Experiments API Starting...");
Console.WriteLine("🧠 Elite Quantum Consciousness Research Environment");
Console.WriteLine("🌟 Government. Transcended.");
Console.WriteLine($"🌐 Swagger UI: http://localhost:5010");
Console.WriteLine($"🔗 Health Check: http://localhost:5010/health");

app.Run();