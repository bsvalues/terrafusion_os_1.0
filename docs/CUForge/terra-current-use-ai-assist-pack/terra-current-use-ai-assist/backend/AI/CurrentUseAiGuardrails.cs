namespace TerraFusion.Modules.CurrentUse.AI;

public static class CurrentUseAiGuardrails
{
    public static readonly string Disclaimer =
        "AI-assisted review support only. Final classification, removal, penalty, and tax determinations must be made by authorized county staff.";

    public static readonly IReadOnlySet<string> ForbiddenActions = new HashSet<string>
    {
        "APPROVE_CLASSIFICATION",
        "DENY_CLASSIFICATION",
        "FINALIZE_REMOVAL",
        "OVERRIDE_ROLLBACK_CALCULATION",
        "WAIVE_PENALTY",
        "DETERMINE_STATUTORY_EXCEPTION",
        "ISSUE_FINAL_NOTICE_WITHOUT_HUMAN_REVIEW"
    };

    public static void AssertAllowed(string action)
    {
        if (ForbiddenActions.Contains(action))
        {
            throw new InvalidOperationException($"Current Use AI action is forbidden: {action}");
        }
    }
}
