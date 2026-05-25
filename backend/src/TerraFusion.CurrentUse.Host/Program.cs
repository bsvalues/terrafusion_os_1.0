using TerraFusion.CurrentUse;

var builder = WebApplication.CreateBuilder(args);

// Override connection string to force InMemory
builder.Configuration["ConnectionStrings:CurrentUse"] = "InMemory";

// Add CurrentUse services (will use InMemory database due to connection string)
builder.Services.AddCurrentUseServices(builder.Configuration);
builder.Services.AddControllers()
    .AddApplicationPart(typeof(TerraFusion.CurrentUse.Controllers.CurrentUseController).Assembly);

// CORS for frontend dev server
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.AllowAnyOrigin().AllowAnyMethod().AllowAnyHeader();
    });
});

var app = builder.Build();

// Initialize database (creates InMemory DB and seeds data)
await app.Services.InitializeCurrentUseDatabaseAsync();

app.UseCors();
app.UseCurrentUseMiddleware();
app.MapControllers();

var currentUseUrl = builder.Configuration["urls"]
    ?? Environment.GetEnvironmentVariable("ASPNETCORE_URLS")
    ?? "http://0.0.0.0:5000";
app.Urls.Add(currentUseUrl);

Console.WriteLine($"CUForge API running on {currentUseUrl}");
Console.WriteLine("Endpoints:");
Console.WriteLine("  GET  /api/currentuse/classifications");
Console.WriteLine("  POST /api/currentuse/classifications");
Console.WriteLine("  POST /api/currentuse/rollback/calculate");
Console.WriteLine("  GET  /api/currentuse/interest-rates");
Console.WriteLine("  GET  /api/currentuse/interest/calculate?principal=&startYear=&endYear=");
Console.WriteLine("  GET  /api/currentuse/removals");
Console.WriteLine("  POST /api/currentuse/removals");
Console.WriteLine("  GET  /api/currentuse/penalty-exceptions?parcelId=");
Console.WriteLine("  GET  /api/currentuse/case-states");
Console.WriteLine("  GET  /api/currentuse/case-states/{caseId}");
Console.WriteLine("  PUT  /api/currentuse/case-states/{caseId}");

app.Run();
