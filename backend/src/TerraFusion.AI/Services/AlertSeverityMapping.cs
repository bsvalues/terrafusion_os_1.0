using TerraFusion.Core.Entities;
using CoreSeverity = TerraFusion.Core.Entities.AlertSeverity;
using DtoSeverity = TerraFusion.AI.DTOs.AlertSeverity;

namespace TerraFusion.AI.Services
{
    /// <summary>
    /// Centralized mapping between differing AlertSeverity enums across layers
    /// </summary>
    public static class AlertSeverityMapping
    {
        public static CoreSeverity ToCoreSeverity(Services.AlertSeverity severity)
        {
            return severity switch
            {
                Services.AlertSeverity.Info => CoreSeverity.Info,
                Services.AlertSeverity.Success => CoreSeverity.Info, // map Success to Info in core
                Services.AlertSeverity.Warning => CoreSeverity.Warning,
                Services.AlertSeverity.Critical => CoreSeverity.Critical,
                _ => CoreSeverity.Info
            };
        }

        public static DtoSeverity ToDtoSeverity(Services.AlertSeverity severity)
        {
            return severity switch
            {
                Services.AlertSeverity.Info => DtoSeverity.Info,
                Services.AlertSeverity.Success => DtoSeverity.Info, // map Success to Info in DTOs
                Services.AlertSeverity.Warning => DtoSeverity.Warning,
                Services.AlertSeverity.Critical => DtoSeverity.Critical,
                _ => DtoSeverity.Info
            };
        }

        public static Services.AlertSeverity FromCoreToServices(CoreSeverity severity)
        {
            return severity switch
            {
                CoreSeverity.Info => Services.AlertSeverity.Info,
                CoreSeverity.Warning => Services.AlertSeverity.Warning,
                CoreSeverity.Critical => Services.AlertSeverity.Critical,
                // Note: Emergency doesn't exist in Core.Entities.AlertSeverity - map Critical as fallback
                _ => Services.AlertSeverity.Info
            };
        }

        public static DtoSeverity FromCoreToDto(CoreSeverity severity)
        {
            return severity switch
            {
                CoreSeverity.Info => DtoSeverity.Info,
                CoreSeverity.Warning => DtoSeverity.Warning,
                CoreSeverity.Critical => DtoSeverity.Critical,
                // Note: Emergency doesn't exist in Core.Entities.AlertSeverity - map Critical as fallback
                _ => DtoSeverity.Info
            };
        }
    }
}
