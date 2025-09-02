#!/bin/bash
# backend-testing-infrastructure.sh - AI Swarm Agent: Backend Testing Infrastructure
# Squad Leader Agent #1 of 144 - Backend Testing Division

set -euo pipefail

echo "🤖 AI AGENT: Backend Testing Infrastructure Specialist"
echo "📋 Mission: Deploy comprehensive .NET testing infrastructure"

# Create backend testing project structure
mkdir -p backend/tests/{unit,integration,acceptance}
mkdir -p backend/tests/fixtures
mkdir -p backend/tests/mocks
mkdir -p backend/tests/coverage

# Create main test project for .NET Core
cat > backend/tests/TerraFusion.Tests.csproj << 'EOF'
<Project Sdk="Microsoft.NET.Sdk">

  <PropertyGroup>
    <TargetFramework>net8.0</TargetFramework>
    <ImplicitUsings>enable</ImplicitUsings>
    <Nullable>enable</Nullable>
    <IsPackable>false</IsPackable>
    <IsTestProject>true</IsTestProject>
  </PropertyGroup>

  <ItemGroup>
    <PackageReference Include="Microsoft.NET.Test.Sdk" Version="17.8.0" />
    <PackageReference Include="xunit" Version="2.6.1" />
    <PackageReference Include="xunit.runner.visualstudio" Version="2.4.5">
      <IncludeAssets>runtime; build; native; contentfiles; analyzers; buildtransitive</IncludeAssets>
      <PrivateAssets>all</PrivateAssets>
    </PackageReference>
    <PackageReference Include="coverlet.collector" Version="6.0.0">
      <IncludeAssets>runtime; build; native; contentfiles; analyzers; buildtransitive</IncludeAssets>
      <PrivateAssets>all</PrivateAssets>
    </PackageReference>
    <PackageReference Include="coverlet.msbuild" Version="6.0.0" />
    <PackageReference Include="Microsoft.AspNetCore.Mvc.Testing" Version="8.0.0" />
    <PackageReference Include="Microsoft.EntityFrameworkCore.InMemory" Version="8.0.0" />
    <PackageReference Include="Moq" Version="4.20.69" />
    <PackageReference Include="FluentAssertions" Version="6.12.0" />
    <PackageReference Include="AutoFixture" Version="4.18.0" />
    <PackageReference Include="AutoFixture.Xunit2" Version="4.18.0" />
    <PackageReference Include="Bogus" Version="34.0.2" />
    <PackageReference Include="Testcontainers.PostgreSql" Version="3.6.0" />
    <PackageReference Include="Microsoft.AspNetCore.SignalR.Client" Version="8.0.0" />
    <PackageReference Include="VerifyXunit" Version="22.11.4" />
  </ItemGroup>

  <ItemGroup>
    <ProjectReference Include="../TerraFusion.API/TerraFusion.API.csproj" />
    <ProjectReference Include="../TerraFusion.Core/TerraFusion.Core.csproj" />
    <ProjectReference Include="../TerraFusion.Data/TerraFusion.Data.csproj" />
    <ProjectReference Include="../TerraFusion.AI/TerraFusion.AI.csproj" />
  </ItemGroup>

  <ItemGroup>
    <Folder Include="Fixtures/" />
    <Folder Include="Mocks/" />
    <Folder Include="Unit/" />
    <Folder Include="Integration/" />
    <Folder Include="Acceptance/" />
  </ItemGroup>

</Project>
EOF

# Create test appsettings for isolated testing
cat > backend/tests/appsettings.Testing.json << 'EOF'
{
  "Logging": {
    "LogLevel": {
      "Default": "Warning",
      "Microsoft.AspNetCore": "Warning",
      "Microsoft.EntityFrameworkCore": "Warning"
    }
  },
  "ConnectionStrings": {
    "DefaultConnection": "Host=localhost;Port=5432;Database=terrafusion_test;Username=postgres;Password=postgres"
  },
  "Redis": {
    "ConnectionString": "localhost:6379"
  },
  "Authentication": {
    "JwtSettings": {
      "Secret": "test-secret-key-for-government-ai-system-32-chars",
      "Issuer": "TerraFusion.Test",
      "Audience": "TerraFusion.TestClients",
      "ExpirationMinutes": 60
    }
  },
  "AI": {
    "SwarmSize": 1008,
    "TestMode": true,
    "MockResponses": true
  },
  "Government": {
    "County": "Benton County",
    "State": "Washington", 
    "CountySeat": "Prosser",
    "ComplianceLevel": "FISMA-High"
  }
}
EOF

# Create global test setup and configuration
cat > backend/tests/TestSetup.cs << 'EOF'
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using TerraFusion.API;
using TerraFusion.Data;
using Testcontainers.PostgreSql;
using Xunit;

namespace TerraFusion.Tests;

/// <summary>
/// Global test setup for TerraFusion OS Backend Testing
/// AI Swarm Integration: Government-Grade Testing Infrastructure
/// Benton County, Washington - County Seat: Prosser
/// </summary>
public class TestSetup : WebApplicationFactory<Program>, IAsyncLifetime
{
    private readonly PostgreSqlContainer _dbContainer = new PostgreSqlBuilder()
        .WithDatabase("terrafusion_test")
        .WithUsername("postgres")
        .WithPassword("postgres")
        .WithCleanUp(true)
        .Build();

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Testing");
        
        builder.ConfigureServices(services =>
        {
            // Remove the real database context
            var descriptor = services.SingleOrDefault(
                d => d.ServiceType == typeof(DbContextOptions<TerraFusionDbContext>));
            if (descriptor != null)
                services.Remove(descriptor);

            // Add test database context using the container
            services.AddDbContext<TerraFusionDbContext>(options =>
            {
                options.UseNpgsql(_dbContainer.GetConnectionString());
            });

            // Mock AI Swarm for testing
            services.AddScoped<IAISwarmCoordinator, MockAISwarmCoordinator>();
            
            // Mock external services
            services.AddScoped<IPropertyValuationService, MockPropertyValuationService>();
            
            // Configure logging for tests
            services.AddLogging(logging =>
            {
                logging.ClearProviders();
                logging.AddConsole();
                logging.SetMinimumLevel(LogLevel.Warning);
            });
        });
    }

    public async Task InitializeAsync()
    {
        await _dbContainer.StartAsync();
        
        // Ensure database is created and migrated
        using var scope = Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<TerraFusionDbContext>();
        await dbContext.Database.EnsureCreatedAsync();
        
        // Seed test data for Benton County, WA
        await SeedTestData(dbContext);
    }

    public async Task DisposeAsync()
    {
        await _dbContainer.DisposeAsync();
    }

    private static async Task SeedTestData(TerraFusionDbContext context)
    {
        // Seed Benton County, Washington test data
        if (!await context.Counties.AnyAsync())
        {
            context.Counties.Add(new County
            {
                Id = Guid.NewGuid(),
                Name = "Benton County",
                State = "Washington",
                CountySeat = "Prosser", // NOT Richland!
                EstablishedYear = 1905,
                Population = 206873,
                SquareMiles = 1700.6m,
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            });
            
            await context.SaveChangesAsync();
        }
    }
}

/// <summary>
/// Base test class for all TerraFusion backend tests
/// Provides common test infrastructure and Benton County context
/// </summary>
public abstract class TerraFusionTestBase : IClassFixture<TestSetup>
{
    protected readonly TestSetup Factory;
    protected readonly HttpClient Client;
    protected readonly IServiceScope Scope;

    protected TerraFusionTestBase(TestSetup factory)
    {
        Factory = factory;
        Client = factory.CreateClient();
        Scope = factory.Services.CreateScope();
    }

    protected TerraFusionDbContext GetDbContext() =>
        Scope.ServiceProvider.GetRequiredService<TerraFusionDbContext>();

    /// <summary>
    /// Validates that test data uses correct Benton County, WA information
    /// Critical: County Seat is Prosser, NOT Richland
    /// </summary>
    protected static void ValidateBentonCountyData(dynamic countyData)
    {
        Assert.Equal("Benton County", countyData.Name);
        Assert.Equal("Washington", countyData.State);
        Assert.Equal("Prosser", countyData.CountySeat); // Explicit validation
        Assert.NotEqual("Richland", countyData.CountySeat); // Prevent regression
    }
}
EOF

echo "✅ Backend Testing Infrastructure deployed by AI Agent"
echo "🎯 .NET 8.0 test project created with government-grade testing stack"
echo "📍 Benton County, Washington data validation included"
echo "🐘 PostgreSQL test container integration ready"
echo "🤖 AI Swarm mocking infrastructure configured"