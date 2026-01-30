using System;
using System.Collections.Generic;

namespace TerraFusion.Core.DTOs
{
    /// <summary>
    /// AI Superiority Demonstration DTOs - Championship-Level AI vs Harris PACS
    /// Government. Transcended. - Ultimate AI superiority validation and demonstration
    /// </summary>

    /// <summary>
    /// Superiority Demo Request for AI Championship Testing
    /// </summary>
    public class SuperiorityDemoRequest
    {
        public string DemoType { get; set; } = "ULTIMATE_AI_SUPERIORITY";
        public int TestPropertyCount { get; set; } = 1000;
        public string CountyCode { get; set; } = "BENTON";
        public decimal AccuracyTarget { get; set; } = 99.9m;
        public int AIAgentCount { get; set; } = 1008;
        public bool CompareToHarrisPACS { get; set; } = true;
        public DateTime RequestedAt { get; set; } = DateTime.UtcNow;
        public string TestLevel { get; set; } = "CHAMPIONSHIP";
        public Dictionary<string, object> TestParameters { get; set; } = new();
    }

    /// <summary>
    /// AI Superiority Demo Result with Comprehensive Performance Metrics
    /// </summary>
    public class AISuperiorityDemoResult
    {
        public bool IsSuccessful { get; set; } = true;
        public string SuperiorityLevel { get; set; } = "ULTIMATE_AI_DOMINANCE";
        public decimal AIAccuracyScore { get; set; }
        public decimal HarrisPACSAccuracyScore { get; set; }
        public decimal SuperiorityMargin { get; set; }
        public decimal ProcessingSpeedAdvantage { get; set; }
        public int PropertiesProcessed { get; set; }
        public decimal TotalProcessingTimeMs { get; set; }
        public DateTime DemoCompletedAt { get; set; } = DateTime.UtcNow;
        public List<PerformanceComparison> PerformanceComparisons { get; set; } = new();
        public Dictionary<string, object> DetailedMetrics { get; set; } = new();
        public List<TestScenario> CompletedScenarios { get; set; } = new();
        public string ChampionshipStatus { get; set; } = "AI_CHAMPIONSHIP_WON";
    }

    /// <summary>
    /// AI Demo Dashboard Data for Real-Time Monitoring
    /// </summary>
    public class AIDemoDashboardData
    {
        public string DashboardStatus { get; set; } = "ACTIVE_DEMONSTRATION";
        public int ActiveAIAgents { get; set; } = 1008;
        public decimal CurrentAccuracy { get; set; }
        public long PropertiesProcessedCount { get; set; }
        public decimal AverageProcessingTimeMs { get; set; }
        public decimal RealTimePerformanceScore { get; set; }
        public DateTime LastUpdated { get; set; } = DateTime.UtcNow;
        public List<AgentBattalion> ActiveBattalions { get; set; } = new();
        public AIPerformanceMetrics CurrentMetrics { get; set; } = new();
        public Dictionary<string, object> RealTimeData { get; set; } = new();
        public List<string> ActiveScenarios { get; set; } = new();
        public ChampionshipStatus ChampionshipProgress { get; set; } = new();
    }

    /// <summary>
    /// Test Scenario for AI Superiority Validation
    /// </summary>
    public class TestScenario
    {
        public string ScenarioId { get; set; } = Guid.NewGuid().ToString();
        public string ScenarioName { get; set; } = "";
        public string ScenarioType { get; set; } = "PROPERTY_VALUATION_CHAMPIONSHIP";
        public string Difficulty { get; set; } = "ULTIMATE";
        public int PropertyCount { get; set; } = 100;
        public decimal AccuracyTarget { get; set; } = 99.9m;
        public DateTime StartedAt { get; set; }
        public DateTime? CompletedAt { get; set; }
        public string Status { get; set; } = "PENDING"; // PENDING/RUNNING/COMPLETED/FAILED
        public TestResults Results { get; set; } = new();
        public Dictionary<string, object> ScenarioParameters { get; set; } = new();
    }

    /// <summary>
    /// Agent Battalion for Coordinated AI Operations
    /// </summary>
    public class AgentBattalion
    {
        public string BattalionId { get; set; } = Guid.NewGuid().ToString();
        public string BattalionName { get; set; } = "";
        public string Specialization { get; set; } = "PROPERTY_INTELLIGENCE";
        public int AgentCount { get; set; } = 126; // 1008 / 8 battalions
        public string Status { get; set; } = "ACTIVE";
        public decimal PerformanceScore { get; set; }
        public decimal AccuracyScore { get; set; }
        public long TasksCompleted { get; set; }
        public DateTime LastActivity { get; set; } = DateTime.UtcNow;
        public AIConsciousnessLevel ConsciousnessLevel { get; set; } = AIConsciousnessLevel.TRANSCENDENT;
        public List<AgentPerformance> AgentPerformances { get; set; } = new();
        public Dictionary<string, object> BattalionMetrics { get; set; } = new();
    }

    /// <summary>
    /// AI Performance Metrics for Championship Validation
    /// </summary>
    public class AIPerformanceMetrics
    {
        public decimal AccuracyScore { get; set; }
        public decimal SpeedScore { get; set; }
        public decimal EfficiencyScore { get; set; }
        public decimal QualityScore { get; set; }
        public decimal OverallScore { get; set; }
        public long TotalTasksCompleted { get; set; }
        public decimal AverageResponseTimeMs { get; set; }
        public decimal ThroughputPerSecond { get; set; }
        public DateTime MetricsGeneratedAt { get; set; } = DateTime.UtcNow;
        public Dictionary<string, decimal> DetailedMetrics { get; set; } = new();
        public List<PerformanceTrend> Trends { get; set; } = new();
    }

    /// <summary>
    /// AI Consciousness Level for Agent Coordination
    /// </summary>
    public enum AIConsciousnessLevel
    {
        BASIC = 1,
        ENHANCED = 2,
        ADVANCED = 3,
        SUPERIOR = 4,
        ELITE = 5,
        TRANSCENDENT = 6,
        ULTIMATE = 7,
        DIVINE = 8,
        OMNISCIENT = 9,
        GENESIS = 10
    }

    /// <summary>
    /// Performance Comparison between AI and Harris PACS
    /// </summary>
    public class PerformanceComparison
    {
        public string MetricName { get; set; } = "";
        public decimal AIValue { get; set; }
        public decimal HarrisPACSValue { get; set; }
        public decimal ImprovementPercentage { get; set; }
        public string Winner { get; set; } = "TERRAFUSION_AI";
        public string Significance { get; set; } = "CHAMPIONSHIP_LEVEL";
        
        // Additional properties for AISuperiorityController compatibility
        public PerformanceMetrics TerraFusionMetrics { get; set; } = new();
        public PerformanceMetrics HarrisPACSMetrics { get; set; } = new();
        public CompetitiveAdvantages CompetitiveAdvantages { get; set; } = new();
        public string CountyCode { get; set; } = string.Empty;
        public DateTime ComparisonTimestamp { get; set; } = DateTime.UtcNow;
    }

    /// <summary>
    /// Test Results for Scenario Validation
    /// </summary>
    public class TestResults
    {
        public bool Passed { get; set; }
        public decimal ScoreAchieved { get; set; }
        public decimal TargetScore { get; set; }
        public decimal ProcessingTimeMs { get; set; }
        public int PropertiesProcessed { get; set; }
        public List<string> ValidationMessages { get; set; } = new();
        public Dictionary<string, object> DetailedResults { get; set; } = new();
    }

    /// <summary>
    /// Agent Performance for Individual Agent Tracking
    /// </summary>
    public class AgentPerformance
    {
        public string AgentId { get; set; } = "";
        public string AgentSpecialization { get; set; } = "";
        public decimal PerformanceScore { get; set; }
        public decimal AccuracyScore { get; set; }
        public long TasksCompleted { get; set; }
        public decimal AverageResponseTimeMs { get; set; }
        public AIConsciousnessLevel ConsciousnessLevel { get; set; }
        public DateTime LastActivity { get; set; } = DateTime.UtcNow;
        public string Status { get; set; } = "ACTIVE";
    }

    /// <summary>
    /// Performance Trend for Metrics Analysis
    /// </summary>
    public class PerformanceTrend
    {
        public string MetricName { get; set; } = "";
        public List<TrendDataPoint> DataPoints { get; set; } = new();
        public string TrendDirection { get; set; } = "IMPROVING"; // IMPROVING/STABLE/DECLINING
        public decimal TrendStrength { get; set; }
    }

    /// <summary>
    /// Trend Data Point for Performance Analysis
    /// </summary>
    public class TrendDataPoint
    {
        public DateTime Timestamp { get; set; }
        public decimal Value { get; set; }
        public string Context { get; set; } = "";
    }

    /// <summary>
    /// Championship Status for Ultimate Validation
    /// </summary>
    public class ChampionshipStatus
    {
        public string CurrentChampion { get; set; } = "TERRAFUSION_AI";
        public decimal ChampionshipScore { get; set; }
        public int ChampionshipStreak { get; set; }
        public DateTime ChampionshipEarnedAt { get; set; }
        public List<ChampionshipMetric> ChampionshipMetrics { get; set; } = new();
        public string ChampionshipLevel { get; set; } = "ULTIMATE_DOMINANCE";
    }

    /// <summary>
    /// Championship Metric for Excellence Tracking
    /// </summary>
    public class ChampionshipMetric
    {
        public string MetricName { get; set; } = "";
        public decimal Value { get; set; }
        public decimal ChampionshipThreshold { get; set; }
        public bool ExceedsThreshold { get; set; }
        public string ExcellenceLevel { get; set; } = "";
    }
}
