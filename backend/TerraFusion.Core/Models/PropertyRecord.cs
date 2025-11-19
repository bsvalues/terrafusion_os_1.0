namespace TerraFusion.Core.Models
{
    /// <summary>
    /// Standardized property record model
    /// DNA extracted from terra-sync-production bulletproof converter
    /// </summary>
    public class PropertyRecord
    {
        public required string ParcelId { get; set; }
        public required string OwnerName { get; set; }
        public required string PropertyAddress { get; set; }

        // Assessment values
        public decimal? AssessmentValue { get; set; }
        public decimal? LandValue { get; set; }
        public decimal? ImprovementValue { get; set; }

        // Tax information
        public string? ExemptionCode { get; set; }
        public decimal? ExemptionAmount { get; set; }
        public decimal? TaxAmount { get; set; }

        // Metadata
        public DateTime LastModified { get; set; }
        public required string SourceSystem { get; set; }
        public required string CountyCode { get; set; }

        // Geospatial (if available)
        public double? Latitude { get; set; }
        public double? Longitude { get; set; }
        public string? GeometryWKT { get; set; }

        // Additional property details
        public string? PropertyClass { get; set; }
        public string? PropertyUse { get; set; }
        public int? YearBuilt { get; set; }
        public int? SquareFeet { get; set; }
        public int? Bedrooms { get; set; }
        public int? Bathrooms { get; set; }

        // Data quality indicators
        public double DataQualityScore { get; set; } = 100.0;
        public List<string> ValidationWarnings { get; set; } = new();
        public bool RequiresManualReview { get; set; }

        // Sync metadata
        public DateTime SyncedAt { get; set; }
        public required string SyncJobId { get; set; }
        public int SyncVersion { get; set; }
    }
}
