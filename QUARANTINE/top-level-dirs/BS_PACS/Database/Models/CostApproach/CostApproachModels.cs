using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace PACSIntegration.Models.CostApproach
{
    public class CostFactor
    {
        [Key]
        public int FactorID { get; set; }
        
        [Required]
        [StringLength(100)]
        public string BuildingType { get; set; }
        
        [Column(TypeName = "decimal(10,2)")]
        public decimal CostPerSqFt { get; set; }
        
        [Column(TypeName = "decimal(10,2)")]
        public decimal MaterialCostFactor { get; set; }
        
        [Column(TypeName = "decimal(10,2)")]
        public decimal LaborCostFactor { get; set; }
        
        public DateTime EffectiveDate { get; set; }
        
        public int TenantID { get; set; }
        
        [ForeignKey("TenantID")]
        public virtual Tenant Tenant { get; set; }
    }

    public class DepreciationRate
    {
        [Key]
        public int RateID { get; set; }
        
        [Required]
        [StringLength(100)]
        public string BuildingType { get; set; }
        
        public int Age { get; set; }
        
        [Column(TypeName = "decimal(5,2)")]
        public decimal DepreciationPercentage { get; set; }
        
        public DateTime EffectiveDate { get; set; }
        
        public int TenantID { get; set; }
        
        [ForeignKey("TenantID")]
        public virtual Tenant Tenant { get; set; }
    }

    public class LandValue
    {
        [Key]
        public int LandID { get; set; }
        
        [Required]
        [StringLength(255)]
        public string Location { get; set; }
        
        [Column(TypeName = "decimal(10,2)")]
        public decimal ValuePerAcre { get; set; }
        
        [Column(TypeName = "decimal(10,2)")]
        public decimal AdjustmentFactor { get; set; }
        
        public DateTime EffectiveDate { get; set; }
        
        public int TenantID { get; set; }
        
        [ForeignKey("TenantID")]
        public virtual Tenant Tenant { get; set; }
    }

    public class RegionalAdjustment
    {
        [Key]
        public int AdjustmentID { get; set; }
        
        [Required]
        [StringLength(100)]
        public string Region { get; set; }
        
        [Column(TypeName = "decimal(5,2)")]
        public decimal CostMultiplier { get; set; }
        
        [Column(TypeName = "decimal(5,2)")]
        public decimal LaborMultiplier { get; set; }
        
        public DateTime EffectiveDate { get; set; }
        
        public int TenantID { get; set; }
        
        [ForeignKey("TenantID")]
        public virtual Tenant Tenant { get; set; }
    }

    public class ValuationHistory
    {
        [Key]
        public int ValuationID { get; set; }
        
        public int PropertyID { get; set; }
        
        [Column(TypeName = "decimal(12,2)")]
        public decimal ReplacementCostNew { get; set; }
        
        [Column(TypeName = "decimal(12,2)")]
        public decimal Depreciation { get; set; }
        
        [Column(TypeName = "decimal(12,2)")]
        public decimal LandValue { get; set; }
        
        [Column(TypeName = "decimal(12,2)")]
        public decimal TotalValue { get; set; }
        
        public DateTime ValuationDate { get; set; }
        
        public int TenantID { get; set; }
        
        [ForeignKey("TenantID")]
        public virtual Tenant Tenant { get; set; }
        
        [ForeignKey("PropertyID")]
        public virtual Property Property { get; set; }
    }
}
