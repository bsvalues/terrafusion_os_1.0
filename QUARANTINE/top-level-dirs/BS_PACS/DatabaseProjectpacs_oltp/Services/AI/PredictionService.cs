using Microsoft.ML;
using Microsoft.ML.Data;
using Microsoft.Extensions.Logging;
using System.Collections.Concurrent;

namespace PACSIntegration.Services.AI
{
    public class PredictionService : IPredictionService
    {
        private readonly DatabaseContext _context;
        private readonly ILogger<PredictionService> _logger;
        private readonly MLContext _mlContext;
        private readonly ConcurrentDictionary<string, ITransformer> _models;

        public PredictionService(
            DatabaseContext context,
            ILogger<PredictionService> logger)
        {
            _context = context;
            _logger = logger;
            _mlContext = new MLContext(seed: 1);
            _models = new ConcurrentDictionary<string, ITransformer>();
        }

        public async Task<ImportPrediction> PredictImportDurationAsync(ImportPredictionRequest request)
        {
            try
            {
                var model = await GetOrTrainModel("import_duration");
                
                var predictionEngine = _mlContext.Model.CreatePredictionEngine<ImportData, ImportDurationPrediction>(model);
                
                var prediction = predictionEngine.Predict(new ImportData
                {
                    FileSizeBytes = request.FileSizeBytes,
                    FileType = request.FileType,
                    RecordCount = request.EstimatedRecordCount,
                    TimeOfDay = DateTime.UtcNow.Hour
                });

                return new ImportPrediction
                {
                    EstimatedDurationSeconds = prediction.DurationSeconds,
                    Confidence = prediction.Confidence,
                    PotentialBottlenecks = await PredictBottlenecks(request)
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error predicting import duration");
                throw;
            }
        }

        public async Task<PermitPrediction> PredictPermitApprovalTimeAsync(PermitPredictionRequest request)
        {
            try
            {
                var model = await GetOrTrainModel("permit_approval");
                
                var predictionEngine = _mlContext.Model.CreatePredictionEngine<PermitData, PermitApprovalPrediction>(model);
                
                var prediction = predictionEngine.Predict(new PermitData
                {
                    PropertyValue = request.PropertyValue,
                    PermitType = request.PermitType,
                    SeasonalFactor = GetSeasonalFactor(),
                    HistoricalApprovalRate = await GetHistoricalApprovalRate(request.TenantId)
                });

                return new PermitPrediction
                {
                    EstimatedApprovalDays = prediction.ApprovalDays,
                    Confidence = prediction.Confidence,
                    RecommendedActions = GetRecommendedActions(prediction)
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error predicting permit approval time");
                throw;
            }
        }

        private async Task<ITransformer> GetOrTrainModel(string modelType)
        {
            if (_models.TryGetValue(modelType, out var existingModel))
                return existingModel;

            var model = modelType switch
            {
                "import_duration" => await TrainImportDurationModel(),
                "permit_approval" => await TrainPermitApprovalModel(),
                _ => throw new ArgumentException($"Unknown model type: {modelType}")
            };

            _models.TryAdd(modelType, model);
            return model;
        }

        private async Task<ITransformer> TrainImportDurationModel()
        {
            // Get historical import data
            var trainingData = await _context.ImportLogs
                .Select(log => new ImportData
                {
                    FileSizeBytes = log.FileSizeBytes,
                    FileType = log.FileType,
                    RecordCount = log.TotalRows,
                    TimeOfDay = log.ImportedAt.Hour,
                    DurationSeconds = log.ProcessingTimeMs / 1000
                })
                .ToListAsync();

            // Create training pipeline
            var pipeline = _mlContext.Transforms.Concatenate("Features",
                    new[] { "FileSizeBytes", "RecordCount", "TimeOfDay" })
                .Append(_mlContext.Transforms.Categorical.OneHotEncoding("FileTypeEncoded", "FileType"))
                .Append(_mlContext.Transforms.Concatenate("Features",
                    new[] { "Features", "FileTypeEncoded" }))
                .Append(_mlContext.Regression.Trainers.FastForest(
                    numberOfTrees: 100,
                    numberOfLeaves: 20,
                    minimumExampleCountPerLeaf: 10));

            // Train model
            var trainingDataView = _mlContext.Data.LoadFromEnumerable(trainingData);
            return pipeline.Fit(trainingDataView);
        }

        private async Task<ITransformer> TrainPermitApprovalModel()
        {
            // Get historical permit data
            var trainingData = await _context.BuildingPermits
                .Where(p => p.CompletedAt.HasValue)
                .Select(permit => new PermitData
                {
                    PropertyValue = permit.EstimatedValue,
                    PermitType = permit.Type,
                    SeasonalFactor = permit.IssueDate.Month,
                    HistoricalApprovalRate = 0.85f, // Default value, should be calculated
                    ApprovalDays = (float)(permit.CompletedAt.Value - permit.CreatedAt).TotalDays
                })
                .ToListAsync();

            // Create training pipeline
            var pipeline = _mlContext.Transforms.Concatenate("Features",
                    new[] { "PropertyValue", "SeasonalFactor", "HistoricalApprovalRate" })
                .Append(_mlContext.Transforms.Categorical.OneHotEncoding("PermitTypeEncoded", "PermitType"))
                .Append(_mlContext.Transforms.Concatenate("Features",
                    new[] { "Features", "PermitTypeEncoded" }))
                .Append(_mlContext.Regression.Trainers.FastForest(
                    numberOfTrees: 100,
                    numberOfLeaves: 20,
                    minimumExampleCountPerLeaf: 10));

            // Train model
            var trainingDataView = _mlContext.Data.LoadFromEnumerable(trainingData);
            return pipeline.Fit(trainingDataView);
        }

        private async Task<List<string>> PredictBottlenecks(ImportPredictionRequest request)
        {
            var bottlenecks = new List<string>();

            // Check file size
            if (request.FileSizeBytes > 100 * 1024 * 1024) // 100MB
                bottlenecks.Add("Large file size may slow down processing");

            // Check concurrent jobs
            var activeJobs = await _context.JobStatuses
                .CountAsync(j => j.Status == "Running");
            if (activeJobs > 5)
                bottlenecks.Add("High number of concurrent jobs may cause delays");

            // Check system resources
            var systemLoad = await GetSystemLoad();
            if (systemLoad > 0.8)
                bottlenecks.Add("High system load may impact performance");

            return bottlenecks;
        }

        private async Task<float> GetHistoricalApprovalRate(int tenantId)
        {
            var permits = await _context.BuildingPermits
                .Where(p => p.TenantID == tenantId && p.CompletedAt.HasValue)
                .ToListAsync();

            if (!permits.Any())
                return 0.85f; // Default rate

            return (float)permits.Count(p => p.Status == "Approved") / permits.Count;
        }

        private float GetSeasonalFactor()
        {
            // Simple seasonal factor based on month
            return DateTime.UtcNow.Month switch
            {
                12 or 1 or 2 => 0.7f,  // Winter
                3 or 4 or 5 => 1.0f,   // Spring
                6 or 7 or 8 => 1.2f,   // Summer
                _ => 0.9f              // Fall
            };
        }

        private async Task<double> GetSystemLoad()
        {
            // Mock implementation - should be replaced with actual system metrics
            var activeJobs = await _context.JobStatuses
                .CountAsync(j => j.Status == "Running");
            return Math.Min(activeJobs / 10.0, 1.0);
        }

        private List<string> GetRecommendedActions(PermitApprovalPrediction prediction)
        {
            var actions = new List<string>();

            if (prediction.ApprovalDays > 30)
            {
                actions.Add("Consider expedited processing");
                actions.Add("Ensure all required documentation is submitted");
            }

            if (prediction.Confidence < 0.7)
            {
                actions.Add("Additional review may be needed");
                actions.Add("Historical data may be insufficient");
            }

            return actions;
        }
    }

    public class ImportData
    {
        public long FileSizeBytes { get; set; }
        public string FileType { get; set; }
        public int RecordCount { get; set; }
        public int TimeOfDay { get; set; }
        public float DurationSeconds { get; set; }
    }

    public class ImportDurationPrediction
    {
        [ColumnName("Score")]
        public float DurationSeconds { get; set; }
        
        public float Confidence { get; set; }
    }

    public class PermitData
    {
        public decimal PropertyValue { get; set; }
        public string PermitType { get; set; }
        public int SeasonalFactor { get; set; }
        public float HistoricalApprovalRate { get; set; }
        public float ApprovalDays { get; set; }
    }

    public class PermitApprovalPrediction
    {
        [ColumnName("Score")]
        public float ApprovalDays { get; set; }
        
        public float Confidence { get; set; }
    }
}
