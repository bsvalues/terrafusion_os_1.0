using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace TerraFusion.Levy.Models
{
    /// <summary>
    /// Junction table linking Districts to Parcels
    /// Allows parcels to belong to multiple districts (overlay districts)
    /// </summary>
    [Table("DistrictParcels")]
    public class DistrictParcel
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
        /// Foreign key to District
        /// </summary>
        [Required]
        public Guid DistrictId { get; set; }

        /// <summary>
        /// Navigation property to District
        /// </summary>
        [ForeignKey(nameof(DistrictId))]
        public District District { get; set; } = null!;

        /// <summary>
        /// Parcel number (from property assessment system)
        /// </summary>
        [Required]
        [MaxLength(50)]
        public string ParcelNumber { get; set; } = string.Empty;

        /// <summary>
        /// Assessed value for this parcel
        /// </summary>
        [Column(TypeName = "decimal(18,2)")]
        public decimal AssessedValue { get; set; }

        /// <summary>
        /// Is this parcel active in the district?
        /// </summary>
        public bool IsActive { get; set; } = true;

        /// <summary>
        /// Date parcel was added to district
        /// </summary>
        public DateTime AddedDate { get; set; } = DateTime.UtcNow;

        /// <summary>
        /// Date parcel was removed from district (if applicable)
        /// </summary>
        public DateTime? RemovedDate { get; set; }

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
    }
}
