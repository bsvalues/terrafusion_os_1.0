namespace TerraFusion.API.Configuration;

public sealed class GptGroundedAnswerRuntimeOptions
{
    public const string SectionName = "GptGroundedAnswerRuntime";
    public const string ExpectedCommit = "afbcba88c7606e78d3705010b39bcb0527270134";
    public const string ExpectedRepository = "bsvalues/terrafusion-gpt";
    public const string ArtifactSlotRelativePath = ".terrafusion/runtime/gpt/grounded-answer";
    public const string Contract = "gpt.grounded-answer@1.0.0";
    public GptGroundedContextRuntimeMode Mode { get; set; } = GptGroundedContextRuntimeMode.Disabled;
    public int TimeoutSeconds { get; set; } = 30;

    // Includes every transitive runtime import and the reproducible approved specification.
    public static IReadOnlyList<GptGroundedAnswerArtifact> Artifacts { get; } = Array.AsReadOnly(new[]
    {
        new GptGroundedAnswerArtifact("src/grounded-answer/project-gpt-grounded-answer.mjs", 8570, "27e405d5dd494553c87fc5e676dbad6a80fcbe22162ea0bc2506184e25b78a5f"),
        new GptGroundedAnswerArtifact("src/grounded-context/project-gpt-grounded-context.mjs", 8578, "cd2c6111ab0843d321bea8da5eff77cee89eaa1c721d93489d1985c6820f1beb"),
        new GptGroundedAnswerArtifact("contract-compat/gpt.grounded-context.v1/gpt.grounded-context.v1.schema.json", 3555, "da9a923e2ef92f63a728edcb19d726a9a29ceb39203464dbe6ee426e94a69019"),
        new GptGroundedAnswerArtifact("operations/work-orders/EO-TF-GPT-GROUNDED-RUNTIME-001.md", 6700, "880f16bf0722732c46cf2d2dc9d4dbf8cdcb29dbb22cbc11a15700c91d38bd82"),
        new GptGroundedAnswerArtifact("canon/GPT_GROUNDED_ANSWER_EXECUTION_MANIFEST.json", 1197, "cd5c413b0141712dfa4011c48fe5f5eb14e927b0cbbbac15f4e017485c50d853"),
    });
}

public sealed record GptGroundedAnswerArtifact(string Path, int Length, string Sha256);
