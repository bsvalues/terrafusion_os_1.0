using System;
using System.ComponentModel.DataAnnotations;
using TerraFusion.Core.Models;

namespace TerraFusion.Data.Entities;

public class PluginAuditEvent
{
    [Key]
    public Guid Id { get; set; }

    [Required]
    public Guid PluginId { get; set; }

    [Required]
    public required string Version { get; set; }

    [Required]
    public required string Action { get; set; } // e.g., "Submitted", "ValidationFailed", "Published", "Downloaded"

    [Required]
    public DateTime TimestampUtc { get; set; }

    public required string UserId { get; set; } // The user or system process performing the action

    public required string Details { get; set; } // Additional context, e.g., validation error message

    public required virtual Plugin Plugin { get; set; }
}
