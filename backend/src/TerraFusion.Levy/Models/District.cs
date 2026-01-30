using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace TerraFusion.Levy.Models
{
    /// <summary>
    /// Represents a taxing district (jurisdiction) within a county
    /// Examples: School District, Fire District, Port District, City
    /// </summary>
    [Table("Districts")]
    public class District
    {
        [Key]
        public Guid Id { get; set; }

        /// <summary>
        /// County isolation
        /// </summary>
        [Required]
        [MaxLength(100)]
        public string CountyId { get; set; } = string.Empty;

        /// <summary>
        /// District code (e.g., "SD-001" for School District 001)
        /// </summary>
        [Required]
        [MaxLength(50)]
        public string DistrictCode { get; set; } = string.Empty;

        [Required]
        [MaxLength(200)]
        public string Name { get; set; } = string.Empty;

        [MaxLength(2000)]
        public string? Description { get; set; }

        /// <summary>
        /// Type: School, Fire, Port, City, County, etc.
        /// </summary>
        [Required]
        [MaxLength(100)]
        public string DistrictType { get; set; } = string.Empty;

        /// <summary>
        /// Geographic boundaries (GeoJSON polygon)
        /// </summary>
        [Column(TypeName = "jsonb")]
        public string? Boundaries { get; set; }

        /// <summary>
        /// Total assessed value within district
        /// </summary>
        [Column(TypeName = "decimal(18,2)")]
        public decimal TotalAssessedValue { get; set; }

        /// <summary>
        /// Number of parcels in district
        /// </summary>
        public int ParcelCount { get; set; }

        /// <summary>
        /// Is this district active?
        /// </summary>
        public bool IsActive { get; set; } = true;

        /// <summary>
        /// Navigation: Levies this district participates in
        /// </summary>
        public ICollection<LevyMeasure> LevyMeasures { get; set; } = new List<LevyMeasure>();

        /// <summary>
        /// Navigation: Parcels within this district
        /// </summary>
        public ICollection<DistrictParcel> DistrictParcels { get; set; } = new List<DistrictParcel>();

        #region Audit Fields

        [Required]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime? UpdatedAt { get; set; }

        [Required]
        [MaxLength(200)]
        public string CreatedBy { get; set; } = "System";

        [MaxLength(200)]
        public string? UpdatedBy { get; set; }

        #endregion

        #region Metadata

        [Column(TypeName = "jsonb")]
        public string? Metadata { get; set; }

        #endregion
    }
}
