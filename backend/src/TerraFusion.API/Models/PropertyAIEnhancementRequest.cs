using TerraFusion.API.Models.PACS;

namespace TerraFusion.API.Models
{
    public class PropertyAIEnhancementRequest
    {
        public string SessionId { get; set; } = string.Empty;
        public string ParcelId { get; set; } = string.Empty;
        public HarrisPACSAssessment BaselineAssessment { get; set; } = new HarrisPACSAssessment();
        public EnhancementTargets EnhancementTargets { get; set; } = new EnhancementTargets();
        public PACS.ConsciousnessLevel ConsciousnessLevel { get; set; } = PACS.ConsciousnessLevel.Enhanced;
        public AIAnalysisDepth AIAnalysisDepth { get; set; } = AIAnalysisDepth.Standard;
    }
}
