namespace TerraFusion.Core.DTOs.Pilot;

public record ExplainResponse(
    string Explanation,
    ExplainSource[] Sources,
    double Confidence,
    string TraceId
);

public record ExplainSource(string Type, string Reference);
