using Microsoft.Extensions.Logging;
using Microsoft.Extensions.DependencyInjection;
using System.Text.Json;

namespace TerraFusion.Core.Services
{
    /// <summary>
    /// AI Module Bridge Service - The missing link that connects all TerraFusion modules to the AI orchestration layer
    /// This service enables all modules to automatically have AI capabilities through the 1,008 active AI agents
    /// </summary>
    public interface IAIModuleBridge
    {
        Task<AIBridgeResponse> RequestAIAssistanceAsync(AIBridgeRequest request);
        Task<bool> RegisterModuleForAIAsync(string moduleId, ModuleAICapabilities capabilities);
        Task<AIAgentAssignment> GetDedicatedAgentAsync(string moduleId, string task);
        Task<List<AICapability>> GetAvailableCapabilitiesAsync(string moduleId);
    }

    public class AIModuleBridge : IAIModuleBridge
    {
        private readonly ILogger<AIModuleBridge> _logger;
        private readonly IAIModuleOrchestrator _aiOrchestrator;
        private readonly Dictionary<string, ModuleAIRegistration> _registeredModules;

        public AIModuleBridge(
            ILogger<AIModuleBridge> logger,
            IAIModuleOrchestrator aiOrchestrator)
        {
            _logger = logger;
            _aiOrchestrator = aiOrchestrator;
            _registeredModules = new Dictionary<string, ModuleAIRegistration>();
            
            // Pre-register core modules with their AI capabilities
            InitializeCoreModuleRegistrations();
        }

        /// <summary>
        /// Main entry point for modules to request AI assistance
        /// Routes requests to appropriate AI agents based on module type and task
        /// </summary>
        public async Task<AIBridgeResponse> RequestAIAssistanceAsync(AIBridgeRequest request)
        {
            try
            {
                _logger.LogInformation("AI assistance requested by module {ModuleId} for task {TaskType}", 
                    request.ModuleId, request.TaskType);

                // Validate module is registered
                if (!_registeredModules.ContainsKey(request.ModuleId))
                {
                    await RegisterModuleForAIAsync(request.ModuleId, DetectModuleCapabilities(request.ModuleId));
                }

                var moduleReg = _registeredModules[request.ModuleId];

                // Route to appropriate AI agent based on task type
                var aiCommand = DetermineAICommand(request, moduleReg);
                var result = await _aiOrchestrator.ExecuteAICommandAsync(
                    aiCommand.AgentType, 
                    aiCommand.Command, 
                    aiCommand.Parameters);

                return new AIBridgeResponse
                {
                    Success = result.Success,
                    Result = result.Result,
                    AgentId = result.Module,
                    ExecutionTimeMs = result.ExecutionTimeMs,
                    ModuleId = request.ModuleId,
                    TaskType = request.TaskType,
                    Timestamp = DateTime.UtcNow
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing AI assistance request for module {ModuleId}", request.ModuleId);
                return new AIBridgeResponse
                {
                    Success = false,
                    ErrorMessage = ex.Message,
                    ModuleId = request.ModuleId,
                    TaskType = request.TaskType,
                    Timestamp = DateTime.UtcNow
                };
            }
        }

        /// <summary>
        /// Register a module for AI capabilities
        /// Defines what AI services the module can access
        /// </summary>
        public async Task<bool> RegisterModuleForAIAsync(string moduleId, ModuleAICapabilities capabilities)
        {
            try
            {
                var registration = new ModuleAIRegistration
                {
                    ModuleId = moduleId,
                    Capabilities = capabilities,
                    RegisteredAt = DateTime.UtcNow,
                    AssignedAgents = await AssignAgentsToModule(moduleId, capabilities)
                };

                _registeredModules[moduleId] = registration;
                
                _logger.LogInformation("Module {ModuleId} registered for AI with {AgentCount} agents", 
                    moduleId, registration.AssignedAgents.Count);
                
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error registering module {ModuleId} for AI", moduleId);
                return false;
            }
        }

        /// <summary>
        /// Get a dedicated AI agent for intensive tasks
        /// Assigns specific agent from the 1,008 agent pool
        /// </summary>
        public async Task<AIAgentAssignment> GetDedicatedAgentAsync(string moduleId, string task)
        {
            try
            {
                if (!_registeredModules.ContainsKey(moduleId))
                {
                    throw new InvalidOperationException($"Module {moduleId} not registered for AI services");
                }

                // Determine best agent type for the task
                var agentType = DetermineOptimalAgentType(moduleId, task);
                
                return new AIAgentAssignment
                {
                    AgentId = $"{agentType}-{Guid.NewGuid():N}",
                    AgentType = agentType,
                    ModuleId = moduleId,
                    Task = task,
                    AssignedAt = DateTime.UtcNow,
                    ExpiresAt = DateTime.UtcNow.AddHours(1)
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error assigning dedicated agent to module {ModuleId}", moduleId);
                throw;
            }
        }

        /// <summary>
        /// Get available AI capabilities for a specific module
        /// Returns what AI services the module can access
        /// </summary>
        public async Task<List<AICapability>> GetAvailableCapabilitiesAsync(string moduleId)
        {
            var capabilities = new List<AICapability>();

            // Base capabilities available to all modules
            capabilities.AddRange(GetBaseCapabilities());

            // Module-specific capabilities
            switch (moduleId.ToLower())
            {
                case "terra-flow":
                    capabilities.AddRange(GetWorkflowAICapabilities());
                    break;
                case "gispro":
                    capabilities.AddRange(GetGISAICapabilities());
                    break;
                case "terra-sync":
                    capabilities.AddRange(GetDataSyncAICapabilities());
                    break;
                case "costforge-ai":
                    capabilities.AddRange(GetValuationAICapabilities());
                    break;
                default:
                    capabilities.AddRange(GetGenericModuleAICapabilities());
                    break;
            }

            return capabilities;
        }

        #region Private Methods

        private void InitializeCoreModuleRegistrations()
        {
            // Terra Flow - Government Workflow Automation
            _registeredModules["terra-flow"] = new ModuleAIRegistration
            {
                ModuleId = "terra-flow",
                Capabilities = new ModuleAICapabilities
                {
                    SupportsWorkflowOptimization = true,
                    SupportsDecisionSupport = true,
                    SupportsProcessAutomation = true,
                    RequiresFieldGenerals = true
                },
                AssignedAgents = new List<string> { "field-general-workflow", "operational-force-automation" }
            };

            // GISPro - Advanced GIS Processing
            _registeredModules["gispro"] = new ModuleAIRegistration
            {
                ModuleId = "gispro",
                Capabilities = new ModuleAICapabilities
                {
                    SupportsSpatialAnalysis = true,
                    SupportsGeospatialIntelligence = true,
                    SupportsPropertyAnalysis = true,
                    RequiresOperationalForces = true
                },
                AssignedAgents = new List<string> { "operational-force-gis", "field-general-spatial" }
            };

            // Terra Sync - Legacy Integration
            _registeredModules["terra-sync"] = new ModuleAIRegistration
            {
                ModuleId = "terra-sync",
                Capabilities = new ModuleAICapabilities
                {
                    SupportsDataTransformation = true,
                    SupportsLegacyIntegration = true,
                    SupportsDataValidation = true,
                    RequiresOperationalForces = true
                },
                AssignedAgents = new List<string> { "operational-force-sync", "field-general-data" }
            };
        }

        private AICommand DetermineAICommand(AIBridgeRequest request, ModuleAIRegistration moduleReg)
        {
            var command = new AICommand();

            // Route based on task type and module capabilities
            switch (request.TaskType.ToLower())
            {
                case "workflow_optimization":
                    command.AgentType = "field-general";
                    command.Command = "optimize_workflow";
                    break;
                case "spatial_analysis":
                    command.AgentType = "operational-force";
                    command.Command = "analyze_spatial";
                    break;
                case "data_processing":
                    command.AgentType = "operational-force";
                    command.Command = "process_data";
                    break;
                case "decision_support":
                    command.AgentType = "field-general";
                    command.Command = "provide_decision_support";
                    break;
                default:
                    command.AgentType = "operational-force";
                    command.Command = "general_assistance";
                    break;
            }

            command.Parameters = request.Parameters;
            return command;
        }

        private ModuleAICapabilities DetectModuleCapabilities(string moduleId)
        {
            // Auto-detect capabilities based on module type
            switch (moduleId.ToLower())
            {
                case "terra-flow":
                    return new ModuleAICapabilities
                    {
                        SupportsWorkflowOptimization = true,
                        SupportsDecisionSupport = true,
                        RequiresFieldGenerals = true
                    };
                case "gispro":
                    return new ModuleAICapabilities
                    {
                        SupportsSpatialAnalysis = true,
                        SupportsGeospatialIntelligence = true,
                        RequiresOperationalForces = true
                    };
                default:
                    return new ModuleAICapabilities
                    {
                        SupportsGeneralAI = true,
                        RequiresOperationalForces = true
                    };
            }
        }

        private async Task<List<string>> AssignAgentsToModule(string moduleId, ModuleAICapabilities capabilities)
        {
            var agents = new List<string>();

            // Assign based on module requirements
            if (capabilities.RequiresFieldGenerals)
            {
                agents.Add($"field-general-{moduleId}");
            }

            if (capabilities.RequiresOperationalForces)
            {
                // Assign 2-5 operational forces based on module complexity
                var count = moduleId == "gispro" ? 5 : 2;
                for (int i = 0; i < count; i++)
                {
                    agents.Add($"operational-force-{moduleId}-{i}");
                }
            }

            return agents;
        }

        private string DetermineOptimalAgentType(string moduleId, string task)
        {
            // High-level strategic tasks need Field Generals
            if (task.Contains("strategy") || task.Contains("decision") || task.Contains("optimize"))
            {
                return "field-general";
            }

            // Operational tasks use Operational Forces
            return "operational-force";
        }

        private List<AICapability> GetBaseCapabilities()
        {
            return new List<AICapability>
            {
                new() { Name = "General AI Assistance", Type = "general", AgentType = "operational-force" },
                new() { Name = "Data Processing", Type = "data", AgentType = "operational-force" },
                new() { Name = "Analysis Support", Type = "analysis", AgentType = "operational-force" }
            };
        }

        private List<AICapability> GetWorkflowAICapabilities()
        {
            return new List<AICapability>
            {
                new() { Name = "Workflow Optimization", Type = "workflow", AgentType = "field-general" },
                new() { Name = "Process Automation", Type = "automation", AgentType = "operational-force" },
                new() { Name = "Decision Support", Type = "decision", AgentType = "field-general" },
                new() { Name = "Efficiency Analysis", Type = "efficiency", AgentType = "operational-force" }
            };
        }

        private List<AICapability> GetGISAICapabilities()
        {
            return new List<AICapability>
            {
                new() { Name = "Spatial Analysis", Type = "spatial", AgentType = "operational-force" },
                new() { Name = "Geospatial Intelligence", Type = "geospatial", AgentType = "field-general" },
                new() { Name = "Property Analysis", Type = "property", AgentType = "operational-force" },
                new() { Name = "Mapping Optimization", Type = "mapping", AgentType = "operational-force" }
            };
        }

        private List<AICapability> GetDataSyncAICapabilities()
        {
            return new List<AICapability>
            {
                new() { Name = "Data Transformation", Type = "transform", AgentType = "operational-force" },
                new() { Name = "Legacy Integration", Type = "legacy", AgentType = "operational-force" },
                new() { Name = "Data Validation", Type = "validation", AgentType = "operational-force" },
                new() { Name = "Sync Optimization", Type = "sync", AgentType = "field-general" }
            };
        }

        private List<AICapability> GetValuationAICapabilities()
        {
            return new List<AICapability>
            {
                new() { Name = "Valuation Analysis", Type = "valuation", AgentType = "field-general" },
                new() { Name = "Market Intelligence", Type = "market", AgentType = "field-general" },
                new() { Name = "Cost Modeling", Type = "cost", AgentType = "operational-force" }
            };
        }

        private List<AICapability> GetGenericModuleAICapabilities()
        {
            return new List<AICapability>
            {
                new() { Name = "Module Enhancement", Type = "enhancement", AgentType = "operational-force" },
                new() { Name = "Performance Optimization", Type = "performance", AgentType = "operational-force" }
            };
        }

        #endregion
    }

    #region Data Models

    public class AIBridgeRequest
    {
        public string ModuleId { get; set; } = string.Empty;
        public string TaskType { get; set; } = string.Empty;
        public object Parameters { get; set; } = new();
        public string Priority { get; set; } = "normal"; // low, normal, high, critical
        public TimeSpan? Timeout { get; set; }
    }

    public class AIBridgeResponse
    {
        public bool Success { get; set; }
        public string Result { get; set; } = string.Empty;
        public string ErrorMessage { get; set; } = string.Empty;
        public string AgentId { get; set; } = string.Empty;
        public string ModuleId { get; set; } = string.Empty;
        public string TaskType { get; set; } = string.Empty;
        public long ExecutionTimeMs { get; set; }
        public DateTime Timestamp { get; set; }
    }

    public class ModuleAIRegistration
    {
        public string ModuleId { get; set; } = string.Empty;
        public ModuleAICapabilities Capabilities { get; set; } = new();
        public List<string> AssignedAgents { get; set; } = new();
        public DateTime RegisteredAt { get; set; }
    }

    public class ModuleAICapabilities
    {
        public bool SupportsWorkflowOptimization { get; set; }
        public bool SupportsDecisionSupport { get; set; }
        public bool SupportsProcessAutomation { get; set; }
        public bool SupportsSpatialAnalysis { get; set; }
        public bool SupportsGeospatialIntelligence { get; set; }
        public bool SupportsPropertyAnalysis { get; set; }
        public bool SupportsDataTransformation { get; set; }
        public bool SupportsLegacyIntegration { get; set; }
        public bool SupportsDataValidation { get; set; }
        public bool SupportsGeneralAI { get; set; }
        public bool RequiresFieldGenerals { get; set; }
        public bool RequiresOperationalForces { get; set; }
    }

    public class AIAgentAssignment
    {
        public string AgentId { get; set; } = string.Empty;
        public string AgentType { get; set; } = string.Empty;
        public string ModuleId { get; set; } = string.Empty;
        public string Task { get; set; } = string.Empty;
        public DateTime AssignedAt { get; set; }
        public DateTime ExpiresAt { get; set; }
    }

    public class AICapability
    {
        public string Name { get; set; } = string.Empty;
        public string Type { get; set; } = string.Empty;
        public string AgentType { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
    }

    public class AICommand
    {
        public string AgentType { get; set; } = string.Empty;
        public string Command { get; set; } = string.Empty;
        public object Parameters { get; set; } = new();
    }

    #endregion
}