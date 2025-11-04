using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace TerraFusion.Data.Entities
{
    public class ExperimentRun
    {
        [Key]
        public Guid Id { get; set; }

        [Required]
        public Guid ExperimentId { get; set; }

        [Required]
        [MaxLength(100)]
        public string Status { get; set; } = "pending"; // pending | running | succeeded | failed | cancelled

        [Column(TypeName = "jsonb")]
        public string? ExecutionDetailsJson { get; set; }

        public DateTime CreatedAt { get; set; }

        public DateTime? StartedAt { get; set; }

        public DateTime? CompletedAt { get; set; }
    }
}
