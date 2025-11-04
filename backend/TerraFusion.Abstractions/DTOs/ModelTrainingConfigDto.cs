namespace TerraFusion.Abstractions.DTOs;

public class ModelTrainingConfigDto
{
    public string ModelName { get; set; } = "";
    public string TargetVersion { get; set; } = "v1";
    public int? MaxEpochs { get; set; }
    public int Epochs { get; set; }
    public int? BatchSize { get; set; }
    public int TrainingDataSize { get; set; }
    public double? LearningRate { get; set; }
    public bool UseGpu { get; set; } = false;
    public int? CrossValidationFolds { get; set; }
    public Dictionary<string, string> Hyperparameters { get; set; } = new();
    public DateOnly? TrainStart { get; set; }
    public DateOnly? TrainEnd { get; set; }
}
