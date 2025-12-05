using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace TerraFusion.Data.Entities
{
    public class Experiment
    {
        [Key]
        public Guid Id { get; set; }

        [Required]
        [MaxLength(200)]
        public string Name { get; set; } = string.Empty;

        public string? Description { get; set; }

        [MaxLength(100)]
        public string DatasetId { get; set; } = string.Empty;

        [MaxLength(50)]
        public string DatasetVersion { get; set; } = string.Empty;

        [MaxLength(100)]
        public string ModelId { get; set; } = string.Empty;

        [MaxLength(50)]
        public string ModelVersion { get; set; } = string.Empty;

        // Store hyperparameters as JSON
        [Column(TypeName = "jsonb")]
        public string? HyperparamsJson { get; set; }

        // Store swarm config as JSON
        [Column(TypeName = "jsonb")]
        public string? SwarmConfigJson { get; set; }

        public long Seed { get; set; }

        [MaxLength(200)]
        public string Owner { get; set; } = string.Empty;

        public DateTime CreatedAt { get; set; }
    }
}
