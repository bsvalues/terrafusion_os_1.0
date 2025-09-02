namespace TerraFusion.Core.Enums
{
    /// <summary>
    /// Health status enumeration for modules and systems
    /// </summary>
    public enum HealthStatus
    {
        Unknown = 0,
        Healthy = 1,
        Warning = 2,
        Critical = 3,
        Offline = 4,
        Degraded = 5,
        Maintenance = 6
    }

    /// <summary>
    /// Agent status enumeration for AI agents
    /// </summary>
    public enum AgentStatus
    {
        Idle = 0,
        Active = 1,
        Busy = 2,
        Error = 3,
        Offline = 4,
        Initializing = 5,
        Terminating = 6,
        Suspended = 7
    }
}
