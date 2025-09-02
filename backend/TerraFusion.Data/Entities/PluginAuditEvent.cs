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
    public string Version { get; set; }

    [Required]
    public string Action { get; set; } // e.g., "Submitted", "ValidationFailed", "Published", "Downloaded"

    [Required]
    public DateTime TimestampUtc { get; set; }

    public string UserId { get; set; } // The user or system process performing the action

    public string Details { get; set; } // Additional context, e.g., validation error message

    public virtual Plugin Plugin { get; set; }
}
