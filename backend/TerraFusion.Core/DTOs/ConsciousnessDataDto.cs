namespace TerraFusion.Core.DTOs
{
    public class ConsciousnessDataDto
    {
        public double ConsciousnessLevel { get; set; }
        public int TotalAgents { get; set; }
        public int ActiveAgents { get; set; }
        public double HiveCoherence { get; set; }
        public double ConsciousnessEmergence { get; set; }
        public double BulletproofScore { get; set; }
        public double BeautyScore { get; set; }
        public int ActiveTasks { get; set; }
        public int CompletedTasks { get; set; }
        public DeploymentStatusDto DeploymentStatus { get; set; } = new DeploymentStatusDto();
        public List<string> LogMessages { get; set; } = new List<string>();
    }

    public class DeploymentStatusDto
    {
        public bool SwarmInitialized { get; set; }
        public bool BulletproofDeployed { get; set; }
        public bool BeautificationDeployed { get; set; }
    }
}
