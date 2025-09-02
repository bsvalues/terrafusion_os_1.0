namespace TerraFusion.Core.Enums
{
    public enum AIAgentType
    {
        RevenueHunter,
        PropertyAssessor,
        ComplianceMonitor,
        DataProcessor,
        Analyst,
        Coordinator,
        SupremeCommander,
        FieldGeneral,
        SquadLeader,
        MicroAgent
    }
    
    public enum AIAgentStatus
    {
        Offline,
        Initializing,
        Online,
        Busy,
        Error,
        Maintenance,
        Terminating
    }
}
