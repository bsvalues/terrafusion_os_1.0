using System.Text.Json;
using System.Text.Json.Nodes;
using Xunit;

namespace TerraFusion.Unit.SmokeTests;

/// <summary>
/// AmendmentLock v1.0.0 Spec Enforcement Tests
///
/// Purpose: Constitutional governance upgrade workflow.
/// Spec → tests → generated artifacts → migration → quorum signature → effective date.
/// These tests enforce the spec contract - they MUST pass before any implementation.
/// </summary>
public sealed class AmendmentLockTests
{
    private const string SchemaPath = "docs/spec-lock/locks/amendment/amendment.v1/generated/amendment.schema.json";
    private const string SpecPath = "docs/spec-lock/locks/amendment/amendment.v1/speclock.spec.json";
    private const string SpecLockPath = "docs/spec-lock/locks/amendment/amendment.v1/SPEC_LOCK_v1.0.0.md";
    private const string WorkflowPath = "docs/spec-lock/locks/amendment/amendment.v1/generated/amendment.workflow.json";

    private static readonly string RepoRoot = FindRepoRoot();

    private static string FindRepoRoot()
    {
        var dir = Directory.GetCurrentDirectory();
        while (dir != null)
        {
            // Look for docs/spec-lock folder which is at repo root
            if (Directory.Exists(Path.Combine(dir, "docs", "spec-lock", "locks")))
            {
                return dir;
            }
            dir = Directory.GetParent(dir)?.FullName;
        }
        // Fallback: assume we're 6 levels deep from repo root (backend/tests/TerraFusion.Unit.SmokeTests/bin/Debug/net8.0)
        return Path.GetFullPath(Path.Combine(Directory.GetCurrentDirectory(), "..", "..", "..", "..", "..", ".."));
    }

    [Fact]
    public void SpecLock_File_Exists()
    {
        var path = Path.Combine(RepoRoot, SpecLockPath);
        Assert.True(File.Exists(path), $"SPEC_LOCK file missing: {path}");
    }

    [Fact]
    public void SpecData_File_Exists()
    {
        var path = Path.Combine(RepoRoot, SpecPath);
        Assert.True(File.Exists(path), $"speclock.spec.json missing: {path}");
    }

    [Fact]
    public void GeneratedSchema_File_Exists()
    {
        var path = Path.Combine(RepoRoot, SchemaPath);
        Assert.True(File.Exists(path), $"Generated schema missing: {path}");
    }

    [Fact]
    public void GeneratedWorkflow_File_Exists()
    {
        var path = Path.Combine(RepoRoot, WorkflowPath);
        Assert.True(File.Exists(path), $"Generated workflow state machine missing: {path}");
    }

    [Fact]
    public void GeneratedSchema_Is_ValidJson()
    {
        var path = Path.Combine(RepoRoot, SchemaPath);
        if (!File.Exists(path)) return;

        var json = File.ReadAllText(path);
        var doc = JsonDocument.Parse(json);

        Assert.True(doc.RootElement.TryGetProperty("$schema", out _), "Missing $schema property");
        Assert.True(doc.RootElement.TryGetProperty("type", out _), "Missing type property");
        Assert.True(doc.RootElement.TryGetProperty("required", out _), "Missing required property");
    }

    [Fact]
    public void SpecData_Has_RequiredFields()
    {
        var path = Path.Combine(RepoRoot, SpecPath);
        if (!File.Exists(path)) return;

        var json = File.ReadAllText(path);
        var spec = JsonNode.Parse(json)!;

        Assert.NotNull(spec["lock_id"]);
        Assert.NotNull(spec["surface"]);
        Assert.NotNull(spec["version"]);
        Assert.NotNull(spec["lifecycle_states"]);
        Assert.NotNull(spec["review_gates"]);
        Assert.NotNull(spec["quorum_requirements"]);
        Assert.NotNull(spec["validation_rules"]);
    }

    [Fact]
    public void SpecData_HasAllLifecycleStates()
    {
        var path = Path.Combine(RepoRoot, SpecPath);
        if (!File.Exists(path)) return;

        var spec = JsonNode.Parse(File.ReadAllText(path))!;
        var states = spec["lifecycle_states"]!.AsArray().Select(x => x!.GetValue<string>()).ToHashSet();

        // Required lifecycle states per spec
        var requiredStates = new HashSet<string>
        {
            "proposed", "reviewed", "approved", "effective",
            "expired", "superseded", "rejected"
        };

        Assert.True(requiredStates.IsSubsetOf(states),
            $"Missing lifecycle states. Required: {string.Join(", ", requiredStates.Except(states))}");
    }

    [Fact]
    public void SpecData_HasAllReviewGates()
    {
        var path = Path.Combine(RepoRoot, SpecPath);
        if (!File.Exists(path)) return;

        var spec = JsonNode.Parse(File.ReadAllText(path))!;
        var gates = spec["review_gates"]!.AsArray()
            .Select(x => x!["gate"]!.GetValue<string>())
            .ToHashSet();

        // Required review gates per spec
        var requiredGates = new HashSet<string> { "builder", "breaker", "security" };

        Assert.True(requiredGates.IsSubsetOf(gates),
            $"Missing review gates. Required: {string.Join(", ", requiredGates.Except(gates))}");
    }

    [Fact]
    public void SpecData_QuorumRequirements_MinimumIsTwo()
    {
        var path = Path.Combine(RepoRoot, SpecPath);
        if (!File.Exists(path)) return;

        var spec = JsonNode.Parse(File.ReadAllText(path))!;
        var quorums = spec["quorum_requirements"]!.AsArray();

        foreach (var q in quorums)
        {
            var required = q!["required"]!.GetValue<int>();
            Assert.True(required >= 2, $"Quorum type '{q["type"]}' has required < 2: {required}");
        }
    }

    [Fact]
    public void Schema_AmendmentId_Pattern_Enforces_Format()
    {
        var schemaPath = Path.Combine(RepoRoot, SchemaPath);
        if (!File.Exists(schemaPath)) return;

        var schema = JsonNode.Parse(File.ReadAllText(schemaPath))!;
        var pattern = schema["properties"]!["amendment_id"]!["pattern"]!.GetValue<string>();

        // Should match TFAM-YYYY-NNN format
        Assert.Equal("^TFAM-\\d{4}-\\d{3}$", pattern);
    }

    [Fact]
    public void Schema_RequiredQuorum_HasMinimum()
    {
        var schemaPath = Path.Combine(RepoRoot, SchemaPath);
        if (!File.Exists(schemaPath)) return;

        var schema = JsonNode.Parse(File.ReadAllText(schemaPath))!;
        var minimum = schema["properties"]!["approvals"]!["properties"]!["required_quorum"]!["minimum"]!.GetValue<int>();

        Assert.True(minimum >= 2, "required_quorum minimum MUST be at least 2");
    }

    [Fact]
    public void Schema_Sha256_Pattern_Enforces_Lowercase()
    {
        var schemaPath = Path.Combine(RepoRoot, SchemaPath);
        if (!File.Exists(schemaPath)) return;

        var schema = JsonNode.Parse(File.ReadAllText(schemaPath))!;
        var pattern = schema["properties"]!["changeset"]!["properties"]!["spec_sha256"]!["pattern"]!.GetValue<string>();

        Assert.Equal("^[a-f0-9]{64}$", pattern);
    }

    [Fact]
    public void Schema_Timestamp_Pattern_Enforces_UTC()
    {
        var schemaPath = Path.Combine(RepoRoot, SchemaPath);
        if (!File.Exists(schemaPath)) return;

        var schema = JsonNode.Parse(File.ReadAllText(schemaPath))!;
        var pattern = schema["properties"]!["effective_nbf"]!["pattern"]!.GetValue<string>();

        // Pattern should enforce UTC 'Z' suffix
        Assert.Contains("Z$", pattern);
    }

    [Fact]
    public void Schema_ValidationSteps_MinItems()
    {
        var schemaPath = Path.Combine(RepoRoot, SchemaPath);
        if (!File.Exists(schemaPath)) return;

        var schema = JsonNode.Parse(File.ReadAllText(schemaPath))!;
        var minItems = schema["properties"]!["rollout"]!["properties"]!["validation_steps"]!["minItems"]!.GetValue<int>();

        Assert.True(minItems >= 1, "validation_steps MUST have at least 1 item");
    }

    [Fact]
    public void GeneratedWorkflow_Has_InitialState()
    {
        var path = Path.Combine(RepoRoot, WorkflowPath);
        if (!File.Exists(path)) return;

        var workflow = JsonNode.Parse(File.ReadAllText(path))!;

        // The workflow is a JSON Schema - check properties.initial_state.const
        var initialState = workflow["properties"]?["initial_state"]?["const"];
        Assert.NotNull(initialState);
        Assert.Equal("proposed", initialState!.GetValue<string>());
    }

    [Fact]
    public void GeneratedWorkflow_Has_FinalStates()
    {
        var path = Path.Combine(RepoRoot, WorkflowPath);
        if (!File.Exists(path)) return;

        var workflow = JsonNode.Parse(File.ReadAllText(path))!;

        // The workflow is a JSON Schema - check properties.states.properties
        var states = workflow["properties"]?["states"]?["properties"]?.AsObject();
        if (states == null) return;

        // These states should be defined in the schema
        var expectedFinalStates = new[] { "effective", "expired", "rejected", "superseded" };

        foreach (var finalState in expectedFinalStates)
        {
            Assert.True(states.ContainsKey(finalState),
                $"Final state '{finalState}' should be defined in workflow schema");
        }
    }

    [Fact]
    public void Deterministic_AmendmentId_Format()
    {
        // TFAM-YYYY-NNN format
        var validIds = new[] { "TFAM-2025-001", "TFAM-2025-123", "TFAM-2030-999" };
        var invalidIds = new[] { "TFAM-25-001", "TFAM-2025-1", "tfam-2025-001", "TFAM-2025-1234" };

        var pattern = new System.Text.RegularExpressions.Regex("^TFAM-\\d{4}-\\d{3}$");

        foreach (var id in validIds)
        {
            Assert.True(pattern.IsMatch(id), $"'{id}' should be valid");
        }

        foreach (var id in invalidIds)
        {
            Assert.False(pattern.IsMatch(id), $"'{id}' should be invalid");
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // BREAKER ATTACK TESTS - Amendment adversarial enforcement
    // ═══════════════════════════════════════════════════════════════

    [Fact]
    public void Breaker_QuorumBelowMinimum_MustBeRejected()
    {
        var schemaPath = Path.Combine(RepoRoot, SchemaPath);
        if (!File.Exists(schemaPath)) return;

        var schema = JsonNode.Parse(File.ReadAllText(schemaPath))!;
        var minQuorum = schema["properties"]!["approvals"]!["properties"]!["required_quorum"]!["minimum"]!.GetValue<int>();

        // ATTACK: Single signer should be rejected
        Assert.True(minQuorum >= 2, "BREACH: Quorum minimum must be >= 2 to prevent single-actor takeover");
    }

    [Fact]
    public void Breaker_SkipWorkflowState_MustBeBlocked()
    {
        var specPath = Path.Combine(RepoRoot, SpecPath);
        if (!File.Exists(specPath)) return;

        var spec = JsonNode.Parse(File.ReadAllText(specPath))!;
        var lifecycleStates = spec["lifecycle_states"]!.AsArray()
            .Select(x => x!.GetValue<string>()).ToList();

        // ATTACK: Cannot skip from proposed directly to effective
        var proposedIdx = lifecycleStates.IndexOf("proposed");
        var reviewedIdx = lifecycleStates.IndexOf("reviewed");
        var approvedIdx = lifecycleStates.IndexOf("approved");
        var effectiveIdx = lifecycleStates.IndexOf("effective");

        Assert.True(proposedIdx < reviewedIdx, "proposed must come before reviewed");
        Assert.True(reviewedIdx < approvedIdx, "reviewed must come before approved");
        Assert.True(approvedIdx < effectiveIdx, "approved must come before effective");
    }

    [Fact]
    public void Breaker_InvalidTargetLock_MustBeBlocked()
    {
        var specPath = Path.Combine(RepoRoot, SpecPath);
        if (!File.Exists(specPath)) return;

        var spec = JsonNode.Parse(File.ReadAllText(specPath))!;
        var validationRules = spec["validation_rules"]!.AsArray();

        // ATTACK: Amendment targeting non-existent lock must fail
        var hasTargetLockRule = validationRules.Any(r =>
            r!["id"]?.GetValue<string>() == "target_lock_exists");

        Assert.True(hasTargetLockRule, "BREACH: Must validate target_lock_id exists");
    }

    [Fact]
    public void Breaker_NbfInPast_MustBeBlocked()
    {
        var specPath = Path.Combine(RepoRoot, SpecPath);
        if (!File.Exists(specPath)) return;

        var spec = JsonNode.Parse(File.ReadAllText(specPath))!;
        var validationRules = spec["validation_rules"]!.AsArray();

        // ATTACK: Amendment with nbf in the past at proposal time must fail
        var hasNbfFutureRule = validationRules.Any(r =>
            r!["id"]?.GetValue<string>() == "nbf_in_future");

        Assert.True(hasNbfFutureRule, "BREACH: Must validate nbf is in the future at proposal time");
    }

    [Fact]
    public void Breaker_ExpBeforeNbf_MustBeBlocked()
    {
        var specPath = Path.Combine(RepoRoot, SpecPath);
        if (!File.Exists(specPath)) return;

        var spec = JsonNode.Parse(File.ReadAllText(specPath))!;
        var validationRules = spec["validation_rules"]!.AsArray();

        // ATTACK: exp < nbf is an invalid time window
        var hasExpAfterNbfRule = validationRules.Any(r =>
            r!["id"]?.GetValue<string>() == "exp_after_nbf");

        Assert.True(hasExpAfterNbfRule, "BREACH: Must validate exp > nbf");
    }

    [Fact]
    public void Breaker_InsufficientSigners_MustBeBlocked()
    {
        var specPath = Path.Combine(RepoRoot, SpecPath);
        if (!File.Exists(specPath)) return;

        var spec = JsonNode.Parse(File.ReadAllText(specPath))!;
        var validationRules = spec["validation_rules"]!.AsArray();

        // ATTACK: Must verify signers count matches required_quorum
        var hasSignersMatchRule = validationRules.Any(r =>
            r!["id"]?.GetValue<string>() == "signers_match_quorum");

        Assert.True(hasSignersMatchRule, "BREACH: Must validate signers count matches required_quorum");
    }

    [Fact]
    public void Breaker_ReviewGates_AllRequired()
    {
        var specPath = Path.Combine(RepoRoot, SpecPath);
        if (!File.Exists(specPath)) return;

        var spec = JsonNode.Parse(File.ReadAllText(specPath))!;
        var reviewGates = spec["review_gates"]!.AsArray()
            .Select(g => g!["gate"]!.GetValue<string>()).ToHashSet();

        // ATTACK: All three review gates must be required
        var requiredGates = new[] { "builder", "breaker", "security" };
        foreach (var gate in requiredGates)
        {
            Assert.Contains(gate, reviewGates);
        }
    }

    [Fact]
    public void Breaker_CriticalAmendment_RequiresHighQuorum()
    {
        var specPath = Path.Combine(RepoRoot, SpecPath);
        if (!File.Exists(specPath)) return;

        var spec = JsonNode.Parse(File.ReadAllText(specPath))!;
        var quorumReqs = spec["quorum_requirements"]!.AsArray();

        var criticalQuorum = quorumReqs.FirstOrDefault(q =>
            q!["type"]!.GetValue<string>() == "critical");

        Assert.NotNull(criticalQuorum);
        var required = criticalQuorum!["required"]!.GetValue<int>();

        // ATTACK: Critical/security amendments need high quorum
        Assert.True(required >= 5, "BREACH: Critical amendments must require >= 5 signers");
    }
}
