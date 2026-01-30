namespace TerraFusion.Core.DTOs
{
    public class AIAnalyticsDataDto
    {
        public int ModelsLoaded { get; set; }
        public int DatasetsProcessed { get; set; }
        public double InferenceAccuracy { get; set; }
        public List<ModelPerformanceDto> ModelPerformance { get; set; } = new List<ModelPerformanceDto>();
    }

    public class ModelPerformanceDto
    {
        public string ModelName { get; set; } = string.Empty;
        public double Accuracy { get; set; }
        public double Precision { get; set; }
        public double Recall { get; set; }
    }
}
