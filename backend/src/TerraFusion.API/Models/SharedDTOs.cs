/*
 * ═══════════════════════════════════════════════════════════════
 * TERRAFUSION OS - SHARED DATA TRANSFER OBJECTS
 * References canonical DTOs from TerraFusion.Abstractions
 * ═══════════════════════════════════════════════════════════════
 */

using TerraFusion.Abstractions.DTOs.Responses;
using TerraFusion.Abstractions.DTOs.Shared;

namespace TerraFusion.API.Models;

// All shared DTOs now use canonical implementations from TerraFusion.Abstractions.DTOs.Responses
// This ensures Single Source of Truth for type definitions across all services
//
// Canonical types (from TerraFusion.Abstractions.DTOs.Responses):
// - SyncResult, OptimizationRecommendation, ComplianceViolation, ElitePerformanceMetrics
// Shared types (from TerraFusion.Abstractions.DTOs.Shared):
// - ElitePerformanceMetrics, PerformanceDataPoint
