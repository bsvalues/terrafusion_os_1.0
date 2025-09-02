namespace TerraFusion.Abstractions.DTOs;

public sealed class ModelTrainingStatusDto
{
    public string TrainingId { get; set; } = "";
    public string ModelName { get; set; } = "";
    public string Status { get; set; } = "Pending";
    public int CurrentEpoch { get; set; }
    public int TotalEpochs { get; set; }
    public double CurrentLoss { get; set; }
    public double BestLoss { get; set; }
    public DateTime StartedAt { get; set; }
    public DateTime? CompletedAt { get; set; }
    public string? ErrorMessage { get; set; }
}
