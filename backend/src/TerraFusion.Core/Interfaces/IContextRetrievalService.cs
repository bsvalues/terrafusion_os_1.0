using TerraFusion.Core.DTOs.Pilot;

namespace TerraFusion.Core.Interfaces;

/// <summary>
/// Read-only surface contract resolver.
/// Maps (activeFile, activeSuite, activeTab) to the governing contract document.
/// Uses a static lookup — no IO, no LLM.
/// </summary>
public interface ISurfaceContractService
{
    /// <summary>
    /// Resolves the contract that governs the current surface.
    /// Resolution order: activeFile match → activeSuite match → activeTab match → null.
    /// Returns null when no contract is registered for the current context.
    /// </summary>
    SurfaceContract? Resolve(
        string? activeFile,
        string? activeSuite,
        string? activeTab);
}
