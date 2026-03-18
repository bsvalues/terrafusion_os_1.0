// TFR-006: Maps PACS workflow states to TerraFusion workflow states
using System;
using System.Collections.Generic;
using System.Linq;

namespace TerraFusion.Core.Sync.Contracts
{
    /// <summary>
    /// Describes a single mapping from a PACS workflow code to a TerraFusion status.
    /// </summary>
    public class WorkflowMapping
    {
        /// <summary>Workflow code used in the PACS system.</summary>
        public string PacsCode { get; set; } = string.Empty;

        /// <summary>Corresponding status in TerraFusion.</summary>
        public string TerraStatus { get; set; } = string.Empty;

        /// <summary>Human-readable description of this workflow state.</summary>
        public string Description { get; set; } = string.Empty;

        /// <summary>Sort order in the assessment lifecycle.</summary>
        public int SortOrder { get; set; }

        /// <summary>Whether this state is terminal (no further transitions expected).</summary>
        public bool IsTerminal { get; set; }

        /// <summary>
        /// Initializes a new WorkflowMapping.
        /// </summary>
        public WorkflowMapping() { }

        /// <summary>
        /// Initializes a new WorkflowMapping with all properties.
        /// </summary>
        public WorkflowMapping(string pacsCode, string terraStatus, string description,
            int sortOrder, bool isTerminal = false)
        {
            PacsCode = pacsCode;
            TerraStatus = terraStatus;
            Description = description;
            SortOrder = sortOrder;
            IsTerminal = isTerminal;
        }
    }

    /// <summary>
    /// Maps PACS workflow states to TerraFusion workflow states.
    /// Covers the full assessment lifecycle:
    /// new -> in-review -> inspected -> valued -> certified -> appealed.
    /// </summary>
    public static class PacsWorkflowMappings
    {
        /// <summary>
        /// Assessment lifecycle state mappings from PACS codes to TerraFusion statuses.
        /// </summary>
        public static readonly Dictionary<string, WorkflowMapping> AssessmentLifecycle = new()
        {
            // New / intake states
            ["NEW"] = new("NEW", "new", "Property newly entered into the system.", 10),
            ["PEND"] = new("PEND", "new", "Property pending initial review.", 15),
            ["IMPORT"] = new("IMPORT", "new", "Property imported from external source.", 12),

            // Review states
            ["REVIEW"] = new("REVIEW", "in-review", "Property under assessor review.", 20),
            ["HOLD"] = new("HOLD", "in-review", "Property on hold pending information.", 22),
            ["DATA_CHK"] = new("DATA_CHK", "in-review", "Property data being verified.", 25),

            // Inspection states
            ["SCHED"] = new("SCHED", "inspected", "Inspection scheduled.", 30),
            ["INSP"] = new("INSP", "inspected", "Property inspected by field staff.", 35),
            ["REINSP"] = new("REINSP", "inspected", "Property re-inspection completed.", 37),

            // Valuation states
            ["VALUED"] = new("VALUED", "valued", "Property value established.", 40),
            ["REVAL"] = new("REVAL", "valued", "Property revaluation completed.", 42),
            ["ADJ"] = new("ADJ", "valued", "Property value adjusted.", 45),

            // Certification states
            ["CERT"] = new("CERT", "certified", "Assessment certified for tax roll.", 50),
            ["FINAL"] = new("FINAL", "certified", "Assessment finalized.", 55, isTerminal: true),
            ["ROLL"] = new("ROLL", "certified", "Property placed on tax roll.", 58, isTerminal: true),

            // Appeal states
            ["APPEAL"] = new("APPEAL", "appealed", "Assessment under appeal.", 60),
            ["BOE"] = new("BOE", "appealed", "Board of Equalization review.", 65),
            ["BTA"] = new("BTA", "appealed", "Board of Tax Appeals review.", 68),
            ["SETTLED"] = new("SETTLED", "appealed", "Appeal settled.", 70, isTerminal: true),

            // Special states
            ["EXEMPT"] = new("EXEMPT", "exempt", "Property exempt from assessment.", 80, isTerminal: true),
            ["DESTROY"] = new("DESTROY", "destroyed", "Property destroyed or demolished.", 85, isTerminal: true),
            ["MERGED"] = new("MERGED", "merged", "Property merged with another parcel.", 90, isTerminal: true),
            ["SPLIT"] = new("SPLIT", "split", "Property split into multiple parcels.", 92),
        };

        /// <summary>
        /// Valid TerraFusion status values in lifecycle order.
        /// </summary>
        public static readonly string[] TerraStatuses =
        {
            "new",
            "in-review",
            "inspected",
            "valued",
            "certified",
            "appealed",
            "exempt",
            "destroyed",
            "merged",
            "split",
        };

        /// <summary>
        /// Resolves a PACS workflow code to a TerraFusion status string.
        /// Returns null if the code is not mapped.
        /// </summary>
        /// <param name="pacsCode">The PACS workflow code.</param>
        /// <returns>The TerraFusion status or null.</returns>
        public static string? ResolveTerraStatus(string pacsCode)
        {
            if (string.IsNullOrWhiteSpace(pacsCode))
                return null;

            return AssessmentLifecycle.TryGetValue(pacsCode.Trim().ToUpperInvariant(), out var mapping)
                ? mapping.TerraStatus
                : null;
        }

        /// <summary>
        /// Returns all PACS codes that map to the given TerraFusion status.
        /// </summary>
        /// <param name="terraStatus">The TerraFusion status to look up.</param>
        /// <returns>List of PACS codes mapping to that status.</returns>
        public static IReadOnlyList<string> GetPacsCodesForStatus(string terraStatus)
        {
            return AssessmentLifecycle
                .Where(kv => string.Equals(kv.Value.TerraStatus, terraStatus, StringComparison.OrdinalIgnoreCase))
                .Select(kv => kv.Key)
                .ToList();
        }

        /// <summary>
        /// Checks whether a PACS code represents a terminal state.
        /// </summary>
        /// <param name="pacsCode">The PACS workflow code.</param>
        /// <returns>True if terminal, false if not mapped or non-terminal.</returns>
        public static bool IsTerminalState(string pacsCode)
        {
            if (string.IsNullOrWhiteSpace(pacsCode))
                return false;

            return AssessmentLifecycle.TryGetValue(pacsCode.Trim().ToUpperInvariant(), out var mapping)
                && mapping.IsTerminal;
        }

        /// <summary>
        /// Validates that a PACS code is a known workflow state.
        /// </summary>
        /// <param name="pacsCode">The PACS workflow code.</param>
        /// <returns>True if the code is mapped.</returns>
        public static bool IsKnownState(string pacsCode)
        {
            if (string.IsNullOrWhiteSpace(pacsCode))
                return false;

            return AssessmentLifecycle.ContainsKey(pacsCode.Trim().ToUpperInvariant());
        }
    }
}
