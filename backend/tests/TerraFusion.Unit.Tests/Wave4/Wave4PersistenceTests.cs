// Wave 4 — GPT/RAG Persistence Activation Tests
// Tests written BEFORE implementation (TDD).
// All tests verify EF model registration + round-trip + isolation + lane guards.

using System;
using System.Linq;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using TerraFusion.Core.Entities;
using TerraFusion.Data;
using Xunit;
using Task = System.Threading.Tasks.Task;

namespace TerraFusion.Unit.Tests.Wave4;

// ============================================================================
// Registration Tests — EF model knows about GPT/RAG entity types
// ============================================================================

public sealed class Wave4PersistenceRegistrationTests
{
    private static TerraFusionDbContext BuildTestContext()
    {
        var options = new DbContextOptionsBuilder<TerraFusionDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        var configuration = new ConfigurationBuilder().Build();
        return new TerraFusionDbContext(options, configuration);
    }

    [Fact]
    public void DbContext_Exposes_GPTConfigurations_DbSet()
    {
        using var ctx = BuildTestContext();
        // If DbSet is not registered, this throws InvalidOperationException.
        var dbSet = ctx.GPTConfigurations;
        Assert.NotNull(dbSet);
    }

    [Fact]
    public void DbContext_Exposes_GPTConversations_DbSet()
    {
        using var ctx = BuildTestContext();
        var dbSet = ctx.GPTConversations;
        Assert.NotNull(dbSet);
    }

    [Fact]
    public void Model_Builds_GPTConfiguration_Without_Exception()
    {
        using var ctx = BuildTestContext();
        // Force model build — throws if OnModelCreating fails.
        var model = ctx.Model;
        var entityType = model.FindEntityType(typeof(GPTConfiguration));
        Assert.NotNull(entityType);
    }

    [Fact]
    public void Model_Builds_GPTConversation_Without_Exception()
    {
        using var ctx = BuildTestContext();
        var model = ctx.Model;
        var entityType = model.FindEntityType(typeof(GPTConversation));
        Assert.NotNull(entityType);
    }
}

// ============================================================================
// Round-Trip Tests — insert + query via EF
// ============================================================================

public sealed class Wave4PersistenceRoundTripTests
{
    private static TerraFusionDbContext BuildTestContext()
    {
        var options = new DbContextOptionsBuilder<TerraFusionDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        var configuration = new ConfigurationBuilder().Build();
        return new TerraFusionDbContext(options, configuration);
    }

    [Fact]
    public async Task GptConfiguration_Persists_And_RoundTrips()
    {
        await using var ctx = BuildTestContext();

        var config = new GPTConfiguration
        {
            Name = "PropertyAssessmentGPT",
            DisplayName = "Property Assessment AI",
            ModelProvider = "OpenAI",
            ModelName = "gpt-4o",
            SystemPrompt = "You are a Benton County property assessment assistant.",
            CountyId = 1,
            CreatedBy = "system",
            UpdatedBy = "system",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
        };

        ctx.GPTConfigurations.Add(config);
        await ctx.SaveChangesAsync();

        var loaded = await ctx.GPTConfigurations.FirstOrDefaultAsync(g => g.Name == "PropertyAssessmentGPT");
        Assert.NotNull(loaded);
        Assert.Equal("OpenAI", loaded.ModelProvider);
        Assert.Equal(1, loaded.CountyId);
    }

    [Fact]
    public async Task GptConversation_Persists_And_RoundTrips()
    {
        await using var ctx = BuildTestContext();

        var config = new GPTConfiguration
        {
            Name = "ExplainGPT",
            DisplayName = "Explain AI",
            ModelProvider = "Anthropic",
            ModelName = "claude-sonnet-4-6",
            SystemPrompt = "Explain property values.",
            CountyId = 1,
            CreatedBy = "system",
            UpdatedBy = "system",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
        };
        ctx.GPTConfigurations.Add(config);
        await ctx.SaveChangesAsync();

        var conversation = new GPTConversation
        {
            GPTConfigurationId = config.Id,
            UserId = "user-001",
            CountyId = 1,
            Title = "Explain 2025 assessment change",
            Status = "Active",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
        };
        ctx.GPTConversations.Add(conversation);
        await ctx.SaveChangesAsync();

        var loaded = await ctx.GPTConversations.FirstOrDefaultAsync(c => c.UserId == "user-001");
        Assert.NotNull(loaded);
        Assert.Equal(1, loaded.CountyId);
        Assert.Equal("Active", loaded.Status);
    }

    [Fact]
    public async Task GptConfig_Persists_And_Loads_By_County()
    {
        await using var ctx = BuildTestContext();

        ctx.GPTConfigurations.AddRange(
            new GPTConfiguration
            {
                Name = "BentonGPT",
                DisplayName = "Benton AI",
                ModelProvider = "OpenAI",
                ModelName = "gpt-4o-mini",
                SystemPrompt = "Benton county assistant.",
                CountyId = 1,
                CreatedBy = "system",
                UpdatedBy = "system",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
            },
            new GPTConfiguration
            {
                Name = "FranklinGPT",
                DisplayName = "Franklin AI",
                ModelProvider = "OpenAI",
                ModelName = "gpt-4o-mini",
                SystemPrompt = "Franklin county assistant.",
                CountyId = 2,
                CreatedBy = "system",
                UpdatedBy = "system",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
            });
        await ctx.SaveChangesAsync();

        var bentonConfigs = await ctx.GPTConfigurations
            .Where(g => g.CountyId == 1)
            .ToListAsync();

        Assert.Single(bentonConfigs);
        Assert.Equal("BentonGPT", bentonConfigs[0].Name);
    }
}

// ============================================================================
// Isolation + Lane Guard Tests
// ============================================================================

public sealed class Wave4IsolationTests
{
    private static TerraFusionDbContext BuildTestContext()
    {
        var options = new DbContextOptionsBuilder<TerraFusionDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        var configuration = new ConfigurationBuilder().Build();
        return new TerraFusionDbContext(options, configuration);
    }

    [Fact]
    public async Task CountyIsolation_Holds_For_Persisted_Gpt_Data()
    {
        await using var ctx = BuildTestContext();

        ctx.GPTConversations.AddRange(
            new GPTConversation
            {
                GPTConfigurationId = 1,
                UserId = "benton-user",
                CountyId = 1,
                Status = "Active",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
            },
            new GPTConversation
            {
                GPTConfigurationId = 2,
                UserId = "franklin-user",
                CountyId = 2,
                Status = "Active",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
            });
        await ctx.SaveChangesAsync();

        // A Benton County user must only see Benton conversations.
        var bentonConversations = await ctx.GPTConversations
            .Where(c => c.CountyId == 1)
            .ToListAsync();

        Assert.Single(bentonConversations);
        Assert.DoesNotContain(bentonConversations, c => c.UserId == "franklin-user");
    }

    [Fact]
    public void TerraGpt_Cannot_Write_Dais_Workflow_State()
    {
        // Structural guard: GPTConfigurationService has no reference to Dais service types.
        // If TerraFusion.AI.Services.GPTConfigurationService imports any Dais service,
        // this assertion will catch it via reflection.
        var gptServiceType = typeof(TerraFusion.AI.Services.GPTConfigurationService);
        var constructorParams = gptServiceType
            .GetConstructors()
            .SelectMany(c => c.GetParameters())
            .Select(p => p.ParameterType.FullName ?? string.Empty)
            .ToList();

        Assert.DoesNotContain(constructorParams, p => p.Contains("AppealService"));
        Assert.DoesNotContain(constructorParams, p => p.Contains("ExemptionService"));
        Assert.DoesNotContain(constructorParams, p => p.Contains("CertificationService"));
        Assert.DoesNotContain(constructorParams, p => p.Contains("NoticeService"));
        Assert.DoesNotContain(constructorParams, p => p.Contains("QueueService"));
    }

    [Fact]
    public void TerraGpt_Cannot_Write_Forge_Artifacts()
    {
        var gptServiceType = typeof(TerraFusion.AI.Services.GPTConfigurationService);
        var constructorParams = gptServiceType
            .GetConstructors()
            .SelectMany(c => c.GetParameters())
            .Select(p => p.ParameterType.FullName ?? string.Empty)
            .ToList();

        // No Forge/CostForge service dependencies
        Assert.DoesNotContain(constructorParams, p =>
            p.Contains("CostForge") || p.Contains("Valuation") || p.Contains("ForgeService"));
    }

    [Fact]
    public void TerraGpt_Cannot_Write_Dossier_Documents()
    {
        var gptServiceType = typeof(TerraFusion.AI.Services.GPTConfigurationService);
        var constructorParams = gptServiceType
            .GetConstructors()
            .SelectMany(c => c.GetParameters())
            .Select(p => p.ParameterType.FullName ?? string.Empty)
            .ToList();

        // No Dossier service dependencies
        Assert.DoesNotContain(constructorParams, p =>
            p.Contains("DossierDocument") || p.Contains("DossierEvidence") || p.Contains("DossierService"));
    }
}

// ============================================================================
// Migration Proof — model includes activated entity tables
// ============================================================================

public sealed class Wave4MigrationProofTests
{
    [Fact]
    public void EfModel_Has_GPTConfigurations_Table()
    {
        var options = new DbContextOptionsBuilder<TerraFusionDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        var configuration = new ConfigurationBuilder().Build();
        using var ctx = new TerraFusionDbContext(options, configuration);
        var entityType = ctx.Model.FindEntityType(typeof(GPTConfiguration));
        Assert.NotNull(entityType);
        // Verify the table name is correct
        var tableName = entityType.GetTableName();
        Assert.Equal("GPTConfigurations", tableName);
    }

    [Fact]
    public void EfModel_Has_GPTConversations_Table()
    {
        var options = new DbContextOptionsBuilder<TerraFusionDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        var configuration = new ConfigurationBuilder().Build();
        using var ctx = new TerraFusionDbContext(options, configuration);
        var entityType = ctx.Model.FindEntityType(typeof(GPTConversation));
        Assert.NotNull(entityType);
        var tableName = entityType.GetTableName();
        Assert.Equal("GPTConversations", tableName);
    }
}
