/**
 * ═══════════════════════════════════════════════════════════════
 * TERRAFUSION OS - SHARED DATA TRANSFER OBJECTS
 * References canonical DTOs from TerraFusion.Abstractions
 * ═══════════════════════════════════════════════════════════════
 */

using TerraFusion.Abstractions.DTOs.Responses;
using TerraFusion.Abstractions.DTOs.Shared;

namespace TerraFusion.API.Models;

// All shared DTOs now use canonical implementations from TerraFusion.Abstractions
// This ensures Single Source of Truth for type definitions across all services

// Performance metrics available via canonical types:
// - QuantumPerformanceMetricsDto (from TerraFusion.Abstractions.DTOs.Responses)
// - CostForgePerformanceMetricsDto (from TerraFusion.Abstractions.DTOs.Responses)
// - ElitePerformanceMetrics (from TerraFusion.Abstractions.DTOs.Shared)
// - SyncResult (from TerraFusion.Abstractions.DTOs.Shared)
// - OptimizationRecommendation (from TerraFusion.Abstractions.DTOs.Shared)
// - ComplianceViolation (from TerraFusion.Abstractions.DTOs.Shared)
