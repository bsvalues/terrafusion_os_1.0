using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using TerraFusion.Abstractions.Interfaces;
using TerraFusion.Abstractions.DTOs;

namespace TerraFusion.API.Services
{
    /// <summary>
    /// TIER 5+ AI Enhancement: 3-6-9-12 Cognitive Framework Service
    /// Implements universal cognitive patterns for optimal development workflow
    /// Supports Individual (3) → Team (6) → Platform (9) → Organization (12) phases
    /// </summary>
    public interface ICognitiveFrameworkService
    {
        Task<TaskClassificationResult> ClassifyTaskAsync(TaskAssessment assessment);
        Task<PhaseExecutionPlan> GeneratePhaseExecutionPlanAsync(int tier, string taskId);
        Task<ConfidenceGateResult> EvaluateConfidenceGateAsync(string taskId, int phase, double confidence);
        Task<List<CognitiveMetrics>> GetFrameworkMetricsAsync(DateTime startDate, DateTime endDate);
        Task<bool> ValidatePhaseCompletionAsync(string taskId, int phase, PhaseCompletionData data);
    }

    /// <summary>
    /// 3-6-9-12 Cognitive Framework Implementation
    /// "Never 3 of 6, Never 6 of 12" - Complete cognitive cycles only
    /// Mathematical foundation: 3=Foundation, 6=Evolution, 9=Mastery, 12=Transformation
    /// </summary>
    public class CognitiveFrameworkService : ICognitiveFrameworkService
    {
        private readonly ILogger<CognitiveFrameworkService> _logger;
        private readonly IAuditLogger _auditLogger;

        public CognitiveFrameworkService(
            ILogger<CognitiveFrameworkService> logger,
            IAuditLogger auditLogger)
        {
            _logger = logger ?? throw new ArgumentNullException(nameof(logger));
            _auditLogger = auditLogger ?? throw new ArgumentNullException(nameof(auditLogger));
        }

        /// <summary>
        /// Classifies task complexity using 3-6-9-12 framework
        /// TIER 1 (3): Individual component work
        /// TIER 2 (6): Team feature development
        /// TIER 3 (9): Platform/system architecture
        /// TIER 4 (12): Organizational transformation
        /// </summary>
        public async Task<TaskClassificationResult> ClassifyTaskAsync(TaskAssessment assessment)
        {
            try
            {
                _logger.LogInformation("Classifying task using 3-6-9-12 cognitive framework: {TaskTitle}", assessment.TaskTitle);

                // FIRST: Check for organizational transformation requirement
                if (assessment.BehaviorChangeRequired && assessment.OrganizationalScope >= 100)
                {
                    _logger.LogInformation("TIER 4 (12-Phase) Transformation detected: {People} people, organizational behavior change", assessment.OrganizationalScope);

                    return new TaskClassificationResult
                    {
                        Tier = 4,
                        Phases = 12,
                        TimeEstimate = "3-12 months",
                        Category = TaskCategory.Transformation,
                        ConfidenceTarget = 0.97m,
                        CognitiveLoad = CognitiveLoad.Enterprise,
                        PhaseStructure = GetTransformationPhases(),
                        ConfidenceGates = new[] { 6, 7 }, // Critical gates at Phase 6 and 7
                        Justification = "Organizational behavior change across 100+ people requires full transformation framework"
                    };
                }

                // Single team behavior change - use TIER 3 with change management
                if (assessment.BehaviorChangeRequired && assessment.OrganizationalScope <= 10)
                {
                    _logger.LogInformation("TIER 3 (9-Phase) with change management: small team behavior change");

                    return new TaskClassificationResult
                    {
                        Tier = 3,
                        Phases = 9,
                        TimeEstimate = "1-4 weeks",
                        Category = TaskCategory.TechnicalWithChange,
                        ConfidenceTarget = 0.97m,
                        CognitiveLoad = CognitiveLoad.High,
                        PhaseStructure = GetComplexPhases(),
                        ConfidenceGates = new[] { 5 }, // Critical gate at Phase 5
                        Justification = "Platform work with team behavior change requires 9-phase structure"
                    };
                }

                // Technical execution classification (3-6-9)
                var complexityScore = GetComplexityScore(assessment.SolutionClarity);
                var stakeholderScore = GetStakeholderScore(assessment.StakeholderCount);
                var systemScore = GetSystemScore(assessment.SystemsInvolved);
                var unknownScore = assessment.UnknownFactors;

                var totalScore = complexityScore + stakeholderScore + systemScore + unknownScore;

                _logger.LogInformation("Technical complexity scores - Complexity: {C}, Stakeholders: {S}, Systems: {Sys}, Unknowns: {U}, Total: {T}",
                    complexityScore, stakeholderScore, systemScore, unknownScore, totalScore);

                // TIER 1: Simple (3-Phase)
                if (totalScore <= 5)
                {
                    return new TaskClassificationResult
                    {
                        Tier = 1,
                        Phases = 3,
                        TimeEstimate = "Hours to 1 day",
                        Category = TaskCategory.Technical,
                        ConfidenceTarget = 0.97m,
                        CognitiveLoad = CognitiveLoad.Low,
                        PhaseStructure = GetSimplePhases(),
                        ConfidenceGates = new[] { 1 }, // Gate after understand phase
                        Justification = $"Simple technical task (score {totalScore}/5) requires 3-phase execution"
                    };
                }

                // TIER 2: Moderate (6-Phase)
                if (totalScore <= 9)
                {
                    return new TaskClassificationResult
                    {
                        Tier = 2,
                        Phases = 6,
                        TimeEstimate = "2-5 days",
                        Category = TaskCategory.Technical,
                        ConfidenceTarget = 0.97m,
                        CognitiveLoad = CognitiveLoad.Medium,
                        PhaseStructure = GetModeratePhases(),
                        ConfidenceGates = new[] { 3 }, // Critical gate at design phase
                        Justification = $"Moderate technical task (score {totalScore}/9) requires 6-phase execution"
                    };
                }

                // TIER 3: Complex (9-Phase)
                return new TaskClassificationResult
                {
                    Tier = 3,
                    Phases = 9,
                    TimeEstimate = "1-4 weeks",
                    Category = TaskCategory.Technical,
                    ConfidenceTarget = 0.97m,
                    CognitiveLoad = CognitiveLoad.High,
                    PhaseStructure = GetComplexPhases(),
                    ConfidenceGates = new[] { 5 }, // Critical gate at detailed planning
                    Justification = $"Complex technical task (score {totalScore}) requires 9-phase execution"
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error classifying task: {TaskTitle}", assessment.TaskTitle);
                throw;
            }
        }

        /// <summary>
        /// Generates phase-specific execution plan with cognitive optimization
        /// Includes working memory protection (≤7 items per phase)
        /// Confidence gates prevent premature progression
        /// </summary>
        public async Task<PhaseExecutionPlan> GeneratePhaseExecutionPlanAsync(int tier, string taskId)
        {
            try
            {
                _logger.LogInformation("Generating phase execution plan for TIER {Tier} task: {TaskId}", tier, taskId);

                var plan = new PhaseExecutionPlan
                {
                    TaskId = taskId,
                    Tier = tier,
                    Phases = GetPhasesForTier(tier),
                    CreatedAt = DateTime.UtcNow,
                    CognitiveOptimizations = GetCognitiveOptimizations(tier)
                };

                await _auditLogger.LogSystemEventAsync("PhaseExecutionPlanGenerated", $"Generated TIER {tier} execution plan for task {taskId} with {plan.Phases.Count} phases");

                return plan;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error generating phase execution plan for task: {TaskId}", taskId);
                throw;
            }
        }

        /// <summary>
        /// Evaluates confidence gates to prevent "Never 3 of 6" violations
        /// Gates prevent progression without adequate confidence
        /// Critical phases (Design, Pilot) require 97% confidence
        /// </summary>
        public async Task<ConfidenceGateResult> EvaluateConfidenceGateAsync(string taskId, int phase, double confidence)
        {
            try
            {
                _logger.LogInformation("Evaluating confidence gate for task {TaskId}, Phase {Phase}: {Confidence}%",
                    taskId, phase, confidence * 100);

                var requiredConfidence = GetRequiredConfidenceForPhase(phase);
                var isPassing = confidence >= requiredConfidence;

                var result = new ConfidenceGateResult
                {
                    TaskId = taskId,
                    Phase = phase,
                    ActualConfidence = (decimal)confidence,
                    RequiredConfidence = (decimal)requiredConfidence,
                    IsPassing = isPassing,
                    EvaluatedAt = DateTime.UtcNow
                };

                if (!isPassing)
                {
                    result.Recommendations = GenerateConfidenceImprovementRecommendations(phase, confidence, requiredConfidence);
                    _logger.LogWarning("Confidence gate FAILED for task {TaskId}, Phase {Phase}. Required: {Required}%, Actual: {Actual}%",
                        taskId, phase, requiredConfidence * 100, confidence * 100);
                }
                else
                {
                    _logger.LogInformation("Confidence gate PASSED for task {TaskId}, Phase {Phase}", taskId, phase);
                }

                await _auditLogger.LogSystemEventAsync("ConfidenceGateEvaluated", $"Confidence gate for task {taskId} phase {phase}: {(isPassing ? "PASSED" : "FAILED")} ({confidence * 100:F1}%)");

                return result;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error evaluating confidence gate for task {TaskId}, phase {Phase}", taskId, phase);
                throw;
            }
        }

        /// <summary>
        /// Retrieves framework effectiveness metrics
        /// Tracks completion rates, cognitive load, confidence accuracy
        /// Enables continuous framework improvement
        /// </summary>
        public async Task<List<CognitiveMetrics>> GetFrameworkMetricsAsync(DateTime startDate, DateTime endDate)
        {
            try
            {
                _logger.LogInformation("Retrieving cognitive framework metrics from {StartDate} to {EndDate}", startDate, endDate);

                // This would typically query a database of framework usage data
                // For now, return structured metrics that would be collected
                var metrics = new List<CognitiveMetrics>
                {
                    new CognitiveMetrics
                    {
                        MetricName = "TaskCompletionRate",
                        Value = 0.95m, // 95% of tasks complete all phases
                        Target = 0.95m,
                        Period = "Weekly",
                        IsHealthy = true
                    },
                    new CognitiveMetrics
                    {
                        MetricName = "CognitiveOverloadIncidents",
                        Value = 0.08m, // 8% cognitive overload rate
                        Target = 0.10m, // Target <10%
                        Period = "Monthly",
                        IsHealthy = true
                    },
                    new CognitiveMetrics
                    {
                        MetricName = "ConfidenceGateAccuracy",
                        Value = 0.87m, // 87% confidence gate accuracy
                        Target = 0.85m, // Target >85%
                        Period = "Monthly",
                        IsHealthy = true
                    },
                    new CognitiveMetrics
                    {
                        MetricName = "TierClassificationAccuracy",
                        Value = 0.92m, // 92% accurate tier classification
                        Target = 0.90m, // Target >90%
                        Period = "Monthly",
                        IsHealthy = true
                    }
                };

                await _auditLogger.LogSystemEventAsync("MetricsRetrieved", $"Retrieved {metrics.Count} cognitive framework metrics from {startDate:yyyy-MM-dd} to {endDate:yyyy-MM-dd}");

                return metrics;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving cognitive framework metrics");
                throw;
            }
        }

        /// <summary>
        /// Validates phase completion against cognitive framework standards
        /// Ensures completeness before allowing progression
        /// Prevents "half-completed cycles" anti-pattern
        /// </summary>
        public async Task<bool> ValidatePhaseCompletionAsync(string taskId, int phase, PhaseCompletionData data)
        {
            try
            {
                _logger.LogInformation("Validating phase completion for task {TaskId}, Phase {Phase}", taskId, phase);

                // Validate deliverables are present
                if (data.Deliverables == null || data.Deliverables.Count == 0)
                {
                    _logger.LogWarning("Phase completion validation failed: No deliverables provided for task {TaskId}, Phase {Phase}", taskId, phase);
                    return false;
                }

                // Validate confidence meets threshold
                var requiredConfidence = GetRequiredConfidenceForPhase(phase);
                if (data.ConfidenceLevel < (decimal)requiredConfidence)
                {
                    _logger.LogWarning("Phase completion validation failed: Confidence {Actual}% below required {Required}% for task {TaskId}, Phase {Phase}",
                        data.ConfidenceLevel * 100, requiredConfidence * 100, taskId, phase);
                    return false;
                }

                // Validate all checklist items completed
                if (data.ChecklistItems != null && data.ChecklistItems.Any(item => !item.IsCompleted))
                {
                    var incompleteCount = data.ChecklistItems.Count(item => !item.IsCompleted);
                    _logger.LogWarning("Phase completion validation failed: {Count} checklist items incomplete for task {TaskId}, Phase {Phase}",
                        incompleteCount, taskId, phase);
                    return false;
                }

                await _auditLogger.LogSystemEventAsync("PhaseCompletionValidated", $"Phase {phase} completion validated for task {taskId}: confidence {data.ConfidenceLevel * 100:F1}%, {data.Deliverables?.Count ?? 0} deliverables");

                _logger.LogInformation("Phase completion validation PASSED for task {TaskId}, Phase {Phase}", taskId, phase);
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error validating phase completion for task {TaskId}, phase {Phase}", taskId, phase);
                throw;
            }
        }

        #region Private Helper Methods

        private int GetComplexityScore(SolutionClarity clarity)
        {
            return clarity switch
            {
                SolutionClarity.KnownSolution => 1,
                SolutionClarity.DesignRequired => 2,
                SolutionClarity.ArchitectureChange => 3,
                _ => 2
            };
        }

        private int GetStakeholderScore(int stakeholderCount)
        {
            return stakeholderCount switch
            {
                <= 3 => 1,
                <= 6 => 2,
                _ => 3
            };
        }

        private int GetSystemScore(int systemsInvolved)
        {
            return systemsInvolved switch
            {
                <= 1 => 1,
                <= 3 => 2,
                _ => 3
            };
        }

        private List<Phase> GetSimplePhases()
        {
            return new List<Phase>
            {
                new Phase { Number = 1, Name = "UNDERSTAND", Description = "Define problem, success criteria, assess risk", TimeAllocation = 0.33m },
                new Phase { Number = 2, Name = "EXECUTE", Description = "Make change, test change, verify outcome", TimeAllocation = 0.50m },
                new Phase { Number = 3, Name = "CLOSE", Description = "Deploy/merge, update docs, communicate completion", TimeAllocation = 0.17m }
            };
        }

        private List<Phase> GetModeratePhases()
        {
            return new List<Phase>
            {
                new Phase { Number = 1, Name = "CLARIFY", Description = "Understand request, establish shared vision", TimeAllocation = 0.15m },
                new Phase { Number = 2, Name = "RESEARCH", Description = "Gather information for informed decisions", TimeAllocation = 0.15m },
                new Phase { Number = 3, Name = "DESIGN", Description = "Create detailed implementation plan", TimeAllocation = 0.25m },
                new Phase { Number = 4, Name = "BUILD", Description = "Implement according to design", TimeAllocation = 0.25m },
                new Phase { Number = 5, Name = "VERIFY", Description = "Comprehensive testing and validation", TimeAllocation = 0.15m },
                new Phase { Number = 6, Name = "OPERATE", Description = "Deploy and establish operational excellence", TimeAllocation = 0.05m }
            };
        }

        private List<Phase> GetComplexPhases()
        {
            return new List<Phase>
            {
                new Phase { Number = 1, Name = "DISCOVERY", Description = "Explore problem space and constraints", TimeAllocation = 0.10m },
                new Phase { Number = 2, Name = "LANDSCAPE", Description = "Map existing systems and stakeholders", TimeAllocation = 0.10m },
                new Phase { Number = 3, Name = "STRATEGIC_DESIGN", Description = "High-level architecture and approach", TimeAllocation = 0.15m },
                new Phase { Number = 4, Name = "THREAT_MODELING", Description = "Risk assessment and mitigation", TimeAllocation = 0.10m },
                new Phase { Number = 5, Name = "DETAILED_PLANNING", Description = "Comprehensive implementation plan", TimeAllocation = 0.15m },
                new Phase { Number = 6, Name = "ITERATIVE_BUILD", Description = "Phased implementation and testing", TimeAllocation = 0.20m },
                new Phase { Number = 7, Name = "STAGED_ROLLOUT", Description = "Gradual deployment and validation", TimeAllocation = 0.10m },
                new Phase { Number = 8, Name = "OPTIMIZATION", Description = "Performance tuning and refinement", TimeAllocation = 0.05m },
                new Phase { Number = 9, Name = "INSTITUTIONALIZATION", Description = "Knowledge transfer and governance", TimeAllocation = 0.05m }
            };
        }

        private List<Phase> GetTransformationPhases()
        {
            return new List<Phase>
            {
                // TRIAD 1: UNDERSTAND THE SYSTEM
                new Phase { Number = 1, Name = "ASSESS_CURRENT", Description = "Assess current state - people, processes, technology", TimeAllocation = 0.08m },
                new Phase { Number = 2, Name = "ENVISION_FUTURE", Description = "Envision future state and success metrics", TimeAllocation = 0.08m },
                new Phase { Number = 3, Name = "MAP_JOURNEY", Description = "Map transformation journey and roadmap", TimeAllocation = 0.09m },

                // TRIAD 2: BUILD THE FOUNDATION
                new Phase { Number = 4, Name = "SECURE_LEADERSHIP", Description = "Secure leadership and resources", TimeAllocation = 0.08m },
                new Phase { Number = 5, Name = "ARCHITECT_SOLUTION", Description = "Architect technical solution", TimeAllocation = 0.12m },
                new Phase { Number = 6, Name = "DESIGN_CHANGE", Description = "Design change management program", TimeAllocation = 0.10m },

                // TRIAD 3: EXECUTE THE TRANSFORMATION
                new Phase { Number = 7, Name = "PILOT_VALIDATE", Description = "Pilot and validate approach", TimeAllocation = 0.12m },
                new Phase { Number = 8, Name = "SCALE_STABILIZE", Description = "Scale rollout and stabilize", TimeAllocation = 0.20m },
                new Phase { Number = 9, Name = "OPTIMIZE_EMBED", Description = "Optimize and embed processes", TimeAllocation = 0.08m },

                // TRIAD 4: INSTITUTIONALIZE CHANGE
                new Phase { Number = 10, Name = "TRANSFER_OWNERSHIP", Description = "Transfer ownership to business", TimeAllocation = 0.02m },
                new Phase { Number = 11, Name = "MEASURE_SUSTAIN", Description = "Measure impact and sustain change", TimeAllocation = 0.02m },
                new Phase { Number = 12, Name = "EVOLVE_INNOVATE", Description = "Establish evolution and innovation", TimeAllocation = 0.01m }
            };
        }

        private List<Phase> GetPhasesForTier(int tier)
        {
            return tier switch
            {
                1 => GetSimplePhases(),
                2 => GetModeratePhases(),
                3 => GetComplexPhases(),
                4 => GetTransformationPhases(),
                _ => throw new ArgumentException($"Invalid tier: {tier}")
            };
        }

        private double GetRequiredConfidenceForPhase(int phase)
        {
            // Standard confidence requirements by phase number
            return phase switch
            {
                1 => 0.80, // Initial understanding
                2 => 0.85, // Research complete
                3 => 0.97, // Design gate (critical)
                4 => 0.90, // Build progress
                5 => 0.95, // Verification
                6 => 0.97, // Final gate (critical)
                7 => 0.97, // Pilot gate (critical)
                8 => 0.95, // Scaling
                9 => 0.97, // Optimization
                10 => 1.00, // Transfer
                11 => 1.00, // Measurement
                12 => 1.00, // Evolution
                _ => 0.90 // Default
            };
        }

        private List<string> GenerateConfidenceImprovementRecommendations(int phase, double actual, double required)
        {
            var recommendations = new List<string>();
            var gap = required - actual;

            if (gap > 0.15) // Large confidence gap
            {
                recommendations.Add("Consider returning to previous phase for additional research");
                recommendations.Add("Engage subject matter experts for guidance");
                recommendations.Add("Break down unknowns into smaller, researchable components");
            }
            else if (gap > 0.05) // Moderate confidence gap
            {
                recommendations.Add("Conduct additional analysis on uncertain areas");
                recommendations.Add("Create proof-of-concept to validate approach");
                recommendations.Add("Review similar past projects for lessons learned");
            }
            else // Small confidence gap
            {
                recommendations.Add("Document assumptions and create mitigation plans");
                recommendations.Add("Schedule review session with stakeholders");
                recommendations.Add("Consider time-boxed spike to address specific concerns");
            }

            return recommendations;
        }

        private List<CognitiveOptimization> GetCognitiveOptimizations(int tier)
        {
            var optimizations = new List<CognitiveOptimization>
            {
                new CognitiveOptimization
                {
                    Type = "WorkingMemoryProtection",
                    Description = "Limit checklist items to ≤7 per phase (Miller's Law)",
                    Implementation = "Chunk complex phases into sub-phases with clear boundaries"
                },
                new CognitiveOptimization
                {
                    Type = "ProgressiveDisclosure",
                    Description = "Show only current phase details to reduce cognitive load",
                    Implementation = "Hide future phase details until current phase is complete"
                },
                new CognitiveOptimization
                {
                    Type = "CompletionPsychology",
                    Description = "Clear phase boundaries trigger completion dopamine",
                    Implementation = "Explicit phase completion ceremonies and celebrations"
                }
            };

            if (tier >= 3)
            {
                optimizations.Add(new CognitiveOptimization
                {
                    Type = "ParallelProcessing",
                    Description = "Allow parallel workstreams while maintaining phase discipline",
                    Implementation = "Multiple teams can work on different phases simultaneously"
                });
            }

            if (tier == 4)
            {
                optimizations.Add(new CognitiveOptimization
                {
                    Type = "QuarterlyCadence",
                    Description = "Organize 12 phases into 4 quarterly triads",
                    Implementation = "Q1: Understand, Q2: Foundation, Q3: Execute, Q4: Institutionalize"
                });
            }

            return optimizations;
        }

        #endregion
    }

    #region DTOs and Enums

    public class TaskAssessment
    {
        public string TaskTitle { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public SolutionClarity SolutionClarity { get; set; }
        public int StakeholderCount { get; set; }
        public int SystemsInvolved { get; set; }
        public int UnknownFactors { get; set; }
        public bool BehaviorChangeRequired { get; set; }
        public int OrganizationalScope { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }

    public class TaskClassificationResult
    {
        public int Tier { get; set; }
        public int Phases { get; set; }
        public string TimeEstimate { get; set; } = string.Empty;
        public TaskCategory Category { get; set; }
        public decimal ConfidenceTarget { get; set; }
        public CognitiveLoad CognitiveLoad { get; set; }
        public List<Phase> PhaseStructure { get; set; } = new();
        public int[] ConfidenceGates { get; set; } = Array.Empty<int>();
        public string Justification { get; set; } = string.Empty;
    }

    public class PhaseExecutionPlan
    {
        public string TaskId { get; set; } = string.Empty;
        public int Tier { get; set; }
        public List<Phase> Phases { get; set; } = new();
        public List<CognitiveOptimization> CognitiveOptimizations { get; set; } = new();
        public DateTime CreatedAt { get; set; }
    }

    public class Phase
    {
        public int Number { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public decimal TimeAllocation { get; set; }
        public List<string> ChecklistItems { get; set; } = new();
        public List<string> Deliverables { get; set; } = new();
    }

    public class ConfidenceGateResult
    {
        public string TaskId { get; set; } = string.Empty;
        public int Phase { get; set; }
        public decimal ActualConfidence { get; set; }
        public decimal RequiredConfidence { get; set; }
        public bool IsPassing { get; set; }
        public List<string> Recommendations { get; set; } = new();
        public DateTime EvaluatedAt { get; set; }
    }

    public class CognitiveMetrics
    {
        public string MetricName { get; set; } = string.Empty;
        public decimal Value { get; set; }
        public decimal Target { get; set; }
        public string Period { get; set; } = string.Empty;
        public bool IsHealthy { get; set; }
    }

    public class PhaseCompletionData
    {
        public decimal ConfidenceLevel { get; set; }
        public List<string> Deliverables { get; set; } = new();
        public List<ChecklistItem> ChecklistItems { get; set; } = new();
        public string Notes { get; set; } = string.Empty;
    }

    public class ChecklistItem
    {
        public string Description { get; set; } = string.Empty;
        public bool IsCompleted { get; set; }
        public DateTime? CompletedAt { get; set; }
    }

    public class CognitiveOptimization
    {
        public string Type { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string Implementation { get; set; } = string.Empty;
    }

    public enum SolutionClarity
    {
        KnownSolution = 1,
        DesignRequired = 2,
        ArchitectureChange = 3
    }

    public enum TaskCategory
    {
        Technical,
        TechnicalWithChange,
        Transformation
    }

    public enum CognitiveLoad
    {
        Low,
        Medium,
        High,
        Enterprise
    }

    #endregion
}
