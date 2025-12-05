using TerraFusion.Core.Entities;
using TerraFusion.Core.Enums;

namespace TerraFusion.API.Services;

public static class FullModuleInitializationService
{
    public static List<Module> GetAllProductionModules()
    {
        var modules = new List<Module>();
        var createdAt = DateTime.UtcNow;
        
        modules.AddRange(GetTier1CoreModules(createdAt));
        modules.AddRange(GetTier2EssentialModules(createdAt));
        modules.AddRange(GetTier3ExtendedModules(createdAt));
        
        return modules;
    }
    
    private static List<Module> GetTier1CoreModules(DateTime createdAt)
    {
        return new List<Module>
        {
            new Module
            {
                Name = "government-edition",
                DisplayName = "Government Edition",
                Description = "Foundation government platform (4,236 items)",
                Version = "1.0.0",
                Status = ModuleStatus.Active,
                IsCore = true,
                Tier = ModuleTier.Tier1,
                Priority = 1,
                CreatedAt = createdAt,
                UpdatedAt = createdAt
            },
            new Module
            {
                Name = "government-edition-enhanced",
                DisplayName = "Government Edition Enhanced",
                Description = "Enhanced government features",
                Version = "1.0.0",
                Status = ModuleStatus.Active,
                IsCore = true,
                Tier = ModuleTier.Tier1,
                Priority = 2,
                CreatedAt = createdAt,
                UpdatedAt = createdAt
            },
            new Module
            {
                Name = "ai-swarm",
                DisplayName = "AI Swarm Orchestrator",
                Description = "1,008 agent orchestration system (8GB RAM)",
                Version = "1.0.0",
                Status = ModuleStatus.Active,
                IsCore = true,
                Tier = ModuleTier.Tier1,
                Priority = 3,
                CreatedAt = createdAt,
                UpdatedAt = createdAt
            },
            new Module
            {
                Name = "ai-command-brain",
                DisplayName = "AI Command Brain",
                Description = "AI command center (10,218 items - largest module)",
                Version = "1.0.0",
                Status = ModuleStatus.Active,
                IsCore = true,
                Tier = ModuleTier.Tier1,
                Priority = 4,
                CreatedAt = createdAt,
                UpdatedAt = createdAt
            },
            new Module
            {
                Name = "marketplace-champion",
                DisplayName = "Marketplace Champion",
                Description = "Core marketplace platform (255 items)",
                Version = "1.0.0",
                Status = ModuleStatus.Active,
                IsCore = true,
                Tier = ModuleTier.Tier1,
                Priority = 5,
                CreatedAt = createdAt,
                UpdatedAt = createdAt
            },
            new Module
            {
                Name = "costforge-ai-champion",
                DisplayName = "CostForge AI Champion",
                Description = "AI-powered cost analysis (3,875 items)",
                Version = "1.0.0",
                Status = ModuleStatus.Active,
                IsCore = true,
                Tier = ModuleTier.Tier1,
                Priority = 6,
                CreatedAt = createdAt,
                UpdatedAt = createdAt
            },
            new Module
            {
                Name = "TerraFusion_Record",
                DisplayName = "TerraFusion Record",
                Description = "Next.js records management (35 items)",
                Version = "1.0.0",
                Status = ModuleStatus.Active,
                IsCore = true,
                Tier = ModuleTier.Tier1,
                Priority = 7,
                CreatedAt = createdAt,
                UpdatedAt = createdAt
            },
            new Module
            {
                Name = "terra-agent-champion",
                DisplayName = "Terra Agent Champion",
                Description = "Agent coordination system",
                Version = "1.0.0",
                Status = ModuleStatus.Active,
                IsCore = true,
                Tier = ModuleTier.Tier1,
                Priority = 8,
                CreatedAt = createdAt,
                UpdatedAt = createdAt
            }
        };
    }
    
    private static List<Module> GetTier2EssentialModules(DateTime createdAt)
    {
        return new List<Module>
        {
            new Module
            {
                Name = "terra-collections",
                DisplayName = "Terra Collections",
                Description = "Data collection system (225 items)",
                Version = "1.0.0",
                Status = ModuleStatus.Active,
                IsCore = false,
                Tier = ModuleTier.Tier2,
                Priority = 9,
                CreatedAt = createdAt,
                UpdatedAt = createdAt
            },
            new Module
            {
                Name = "terra-levy",
                DisplayName = "Terra Levy",
                Description = "Tax levy processing (32 items)",
                Version = "1.0.0",
                Status = ModuleStatus.Active,
                IsCore = false,
                Tier = ModuleTier.Tier2,
                Priority = 10,
                CreatedAt = createdAt,
                UpdatedAt = createdAt
            },
            new Module
            {
                Name = "terra-insight",
                DisplayName = "Terra Insight",
                Description = "Analytics & insights (275 items)",
                Version = "1.0.0",
                Status = ModuleStatus.Active,
                IsCore = false,
                Tier = ModuleTier.Tier2,
                Priority = 11,
                CreatedAt = createdAt,
                UpdatedAt = createdAt
            },
            new Module
            {
                Name = "unified-system",
                DisplayName = "Unified System",
                Description = "Module integration platform (12 items, system-critical)",
                Version = "1.0.0",
                Status = ModuleStatus.Active,
                IsCore = false,
                Tier = ModuleTier.Tier2,
                Priority = 12,
                CreatedAt = createdAt,
                UpdatedAt = createdAt
            },
            new Module
            {
                Name = "web-audit-tracker",
                DisplayName = "Web Audit Tracker",
                Description = "Audit tracking (28 items)",
                Version = "1.0.0",
                Status = ModuleStatus.Active,
                IsCore = false,
                Tier = ModuleTier.Tier2,
                Priority = 13,
                CreatedAt = createdAt,
                UpdatedAt = createdAt
            },
            new Module
            {
                Name = "terra-miner",
                DisplayName = "Terra Miner",
                Description = "Data mining operations (2,489 items - 2nd largest)",
                Version = "1.0.0",
                Status = ModuleStatus.Active,
                IsCore = false,
                Tier = ModuleTier.Tier2,
                Priority = 14,
                CreatedAt = createdAt,
                UpdatedAt = createdAt
            },
            new Module
            {
                Name = "gispro",
                DisplayName = "GIS Pro",
                Description = "GIS professional tools (28 items)",
                Version = "1.0.0",
                Status = ModuleStatus.Active,
                IsCore = false,
                Tier = ModuleTier.Tier2,
                Priority = 15,
                CreatedAt = createdAt,
                UpdatedAt = createdAt
            },
            new Module
            {
                Name = "TerraFusion_DevOps_Championship",
                DisplayName = "TerraFusion DevOps Championship",
                Description = "DevOps automation (25 items)",
                Version = "1.0.0",
                Status = ModuleStatus.Active,
                IsCore = false,
                Tier = ModuleTier.Tier2,
                Priority = 16,
                CreatedAt = createdAt,
                UpdatedAt = createdAt
            },
            new Module
            {
                Name = "terra-flow",
                DisplayName = "Terra Flow",
                Description = "Workflow management",
                Version = "1.0.0",
                Status = ModuleStatus.Active,
                IsCore = false,
                Tier = ModuleTier.Tier2,
                Priority = 17,
                CreatedAt = createdAt,
                UpdatedAt = createdAt
            },
            new Module
            {
                Name = "terra-flow-champion",
                DisplayName = "Terra Flow Champion",
                Description = "Enhanced workflow management",
                Version = "1.0.0",
                Status = ModuleStatus.Active,
                IsCore = false,
                Tier = ModuleTier.Tier2,
                Priority = 18,
                CreatedAt = createdAt,
                UpdatedAt = createdAt
            },
            new Module
            {
                Name = "terra-agent",
                DisplayName = "Terra Agent",
                Description = "Base agent system",
                Version = "1.0.0",
                Status = ModuleStatus.Active,
                IsCore = false,
                Tier = ModuleTier.Tier2,
                Priority = 19,
                CreatedAt = createdAt,
                UpdatedAt = createdAt
            },
            new Module
            {
                Name = "TerraFusion-PublicRecords",
                DisplayName = "TerraFusion Public Records",
                Description = "Public records access",
                Version = "1.0.0",
                Status = ModuleStatus.Active,
                IsCore = false,
                Tier = ModuleTier.Tier2,
                Priority = 20,
                CreatedAt = createdAt,
                UpdatedAt = createdAt
            }
        };
    }
    
    private static List<Module> GetTier3ExtendedModules(DateTime createdAt)
    {
        return new List<Module>
        {
            new Module
            {
                Name = "commercial-suite",
                DisplayName = "Commercial Suite",
                Description = "Commercial features (3,742 items - 3rd largest)",
                Version = "1.0.0",
                Status = ModuleStatus.Active,
                IsCore = false,
                Tier = ModuleTier.Tier3,
                Priority = 21,
                CreatedAt = createdAt,
                UpdatedAt = createdAt
            },
            new Module
            {
                Name = "commercial",
                DisplayName = "Commercial",
                Description = "Base commercial tools",
                Version = "1.0.0",
                Status = ModuleStatus.Active,
                IsCore = false,
                Tier = ModuleTier.Tier3,
                Priority = 22,
                CreatedAt = createdAt,
                UpdatedAt = createdAt
            },
            new Module
            {
                Name = "property-workbench",
                DisplayName = "Property Workbench",
                Description = "Property analysis tools",
                Version = "1.0.0",
                Status = ModuleStatus.Active,
                IsCore = false,
                Tier = ModuleTier.Tier3,
                Priority = 23,
                CreatedAt = createdAt,
                UpdatedAt = createdAt
            },
            new Module
            {
                Name = "costforge-ai-desktop",
                DisplayName = "CostForge AI Desktop",
                Description = "Desktop cost analysis",
                Version = "1.0.0",
                Status = ModuleStatus.Active,
                IsCore = false,
                Tier = ModuleTier.Tier3,
                Priority = 24,
                CreatedAt = createdAt,
                UpdatedAt = createdAt
            },
            new Module
            {
                Name = "costforge-ai-enhanced",
                DisplayName = "CostForge AI Enhanced",
                Description = "Enhanced AI costing",
                Version = "1.0.0",
                Status = ModuleStatus.Active,
                IsCore = false,
                Tier = ModuleTier.Tier3,
                Priority = 25,
                CreatedAt = createdAt,
                UpdatedAt = createdAt
            },
            new Module
            {
                Name = "shock-and-awe",
                DisplayName = "Shock and Awe",
                Description = "Demo & presentation system (8 items)",
                Version = "1.0.0",
                Status = ModuleStatus.Active,
                IsCore = false,
                Tier = ModuleTier.Tier3,
                Priority = 26,
                CreatedAt = createdAt,
                UpdatedAt = createdAt
            },
            new Module
            {
                Name = "terra-fusion-dashboard",
                DisplayName = "Terra Fusion Dashboard",
                Description = "Unified dashboard",
                Version = "1.0.0",
                Status = ModuleStatus.Active,
                IsCore = false,
                Tier = ModuleTier.Tier3,
                Priority = 27,
                CreatedAt = createdAt,
                UpdatedAt = createdAt
            },
            new Module
            {
                Name = "terra-fusion-assessor",
                DisplayName = "Terra Fusion Assessor",
                Description = "Assessment tools",
                Version = "1.0.0",
                Status = ModuleStatus.Active,
                IsCore = false,
                Tier = ModuleTier.Tier3,
                Priority = 28,
                CreatedAt = createdAt,
                UpdatedAt = createdAt
            },
            new Module
            {
                Name = "terra-fusion-sync",
                DisplayName = "Terra Fusion Sync",
                Description = "Data synchronization hub for legacy systems",
                Version = "1.0.0",
                Status = ModuleStatus.Active,
                IsCore = false,
                Tier = ModuleTier.Tier3,
                Priority = 29,
                CreatedAt = createdAt,
                UpdatedAt = createdAt
            },
            new Module
            {
                Name = "development",
                DisplayName = "Development",
                Description = "Development tools",
                Version = "1.0.0",
                Status = ModuleStatus.Active,
                IsCore = false,
                Tier = ModuleTier.Tier3,
                Priority = 30,
                CreatedAt = createdAt,
                UpdatedAt = createdAt
            },
            new Module
            {
                Name = "testing-suite",
                DisplayName = "Testing Suite",
                Description = "Test automation (716 tests)",
                Version = "1.0.0",
                Status = ModuleStatus.Active,
                IsCore = false,
                Tier = ModuleTier.Tier3,
                Priority = 31,
                CreatedAt = createdAt,
                UpdatedAt = createdAt
            },
            new Module
            {
                Name = "ai-advanced",
                DisplayName = "AI Advanced",
                Description = "Advanced AI capabilities",
                Version = "1.0.0",
                Status = ModuleStatus.Active,
                IsCore = false,
                Tier = ModuleTier.Tier3,
                Priority = 32,
                CreatedAt = createdAt,
                UpdatedAt = createdAt
            }
        };
    }
}
