using System.ComponentModel.DataAnnotations;

namespace PACSIntegration.Models.FileProcessing
{
    public class FileProcessingResult
    {
        public string FileName { get; set; }
        public int TotalRows { get; set; }
        public int SuccessRows { get; set; }
        public int ErrorRows { get; set; }
        public long FileSizeBytes { get; set; }
        public string FileType { get; set; }
        public DateTime ProcessedAt { get; set; } = DateTime.UtcNow;
        public List<ProcessingError> Errors { get; set; } = new List<ProcessingError>();
    }

    public class ProcessingError
    {
        public int Row { get; set; }
        public string Column { get; set; }
        public string Message { get; set; }
        public string RawValue { get; set; }
    }

    public class ImportConfiguration
    {
        public string DateFormat { get; set; } = "yyyy-MM-dd";
        public bool SkipHeaderRow { get; set; } = true;
        public bool ValidateOnly { get; set; } = false;
        public int BatchSize { get; set; } = 1000;
        public Dictionary<string, string> ColumnMappings { get; set; } = new Dictionary<string, string>();
    }

    public class BuildingPermitImport
    {
        [Required]
        public string PermitNumber { get; set; }
        
        [Required]
        public int PropertyID { get; set; }
        
        [Required]
        public DateTime IssueDate { get; set; }
        
        [Required]
        public DateTime ExpirationDate { get; set; }
        
        public string Status { get; set; } = "Pending";
        
        public string Description { get; set; }
        
        [Range(0, double.MaxValue)]
        public decimal EstimatedValue { get; set; }
    }
}
