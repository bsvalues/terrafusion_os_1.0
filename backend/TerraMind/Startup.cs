using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Microsoft.Extensions.DependencyInjection;
using System.Text.Json.Serialization;
using System.Text.RegularExpressions;

namespace TerraMind;

public static class Startup
{
    // Called by ModuleLoader via reflection
    public static void ConfigureServices(IServiceCollection services)
    {
        services.AddSingleton<IRouter, TerraMindRouter>();
        services.AddSingleton<IRAG, SimpleRag>();
        services.AddSingleton<IPolicyGuard, DefaultPolicyGuard>();
        services.AddSingleton<IToolRunner, McpToolRunner>();
    }

    public static void MapEndpoints(IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/terramind");

        group.MapGet("/status", (IRouter r) => Results.Ok(new {
            name = "TerraMind",
            models = r.ListModels(),
            policy = "policy-guard: enabled",
            rag = "scoped",
            quantum = "router-ready"
        }));

        group.MapGet("/models", (IRouter r) => Results.Ok(r.ListModels()));

        group.MapPost("/complete", async Task<IResult>
            (CompletionRequest req, IRouter router, IRAG rag, IPolicyGuard guard) =>
        {
            if (string.IsNullOrWhiteSpace(req.Prompt))
                return Results.BadRequest("prompt is required");

            var pre = guard.PreCheck(req);
            if (!pre.Allowed) return Results.BadRequest($"policy blocked: {pre.Reason}");

            var ctxDocs = req.UseRag ? await rag.RetrieveAsync(req.Prompt, req.Scope ?? "default") : [];

            var result = await router.CompleteAsync(req with { Context = ctxDocs });

            var post = guard.PostCheck(result);
            if (!post.Allowed) return Results.StatusCode(451);

            return Results.Ok(result);
        });

        group.MapPost("/tools/run", async (ToolCall req, IToolRunner tools) =>
        {
            var res = await tools.ExecuteAsync(req);
            return Results.Ok(res);
        });
    }
}

// ===== Contracts =====
public record CompletionRequest(
    string Prompt,
    string? Model = null,
    bool UseRag = true,
    string? Scope = null,
    Dictionary<string, object>? Params = null,
    List<ContextDoc>? Context = null);

public record ContextDoc(string Id, string Title, string Excerpt, string? Source=null, double Score=0.0);

public record CompletionResponse(
    string Model,
    string Output,
    List<ContextDoc> Context,
    Dictionary<string, object> Telemetry);

public record ToolCall(string Name, Dictionary<string, object>? Args, string? IdempotencyKey);

// ===== Abstractions =====
public interface IRAG { Task<List<ContextDoc>> RetrieveAsync(string query, string scope); }
public interface IPolicyGuard { (bool Allowed, string? Reason) PreCheck(CompletionRequest r); (bool Allowed, string? Reason) PostCheck(CompletionResponse r); }
public interface IToolRunner { Task<object> ExecuteAsync(ToolCall call); }
public interface IRouter
{
    Task<CompletionResponse> CompleteAsync(CompletionRequest req);
    string[] ListModels();
}

// ===== Minimal Implementations =====
file sealed class SimpleRag : IRAG
{
    public Task<List<ContextDoc>> RetrieveAsync(string query, string scope) =>
        Task.FromResult(new List<ContextDoc>()); // integrate county-scoped RAG here
}

file sealed class DefaultPolicyGuard : IPolicyGuard
{
    static readonly Regex SSN = new(@"\b\d{3}-\d{2}-\d{4}\b", RegexOptions.Compiled);

    public (bool Allowed, string? Reason) PreCheck(CompletionRequest r)
    {
        if (r.Prompt is { Length: > 20000 }) return (false, "prompt-too-long");
        return (true, null);
    }

    public (bool Allowed, string? Reason) PostCheck(CompletionResponse r)
    {
        if (SSN.IsMatch(r.Output)) return (false, "contains-ssn");
        return (true, null);
    }
}

file sealed class McpToolRunner : IToolRunner
{
    public Task<object> ExecuteAsync(ToolCall call) =>
        Task.FromResult<object>(new { ok = true, tool = call.Name });
}

file sealed class TerraMindRouter : IRouter
{
    private static readonly string[] _models = ["terramind-classic", "terramind-quantum"];
    public string[] ListModels() => _models;

    public Task<CompletionResponse> CompleteAsync(CompletionRequest req)
    {
        var chosen = req.Model ?? (req.Prompt.Length > 600 ? _models[1] : _models[0]);
        var output = $"[model:{chosen}] {req.Prompt} :: (demo output)";
        return Task.FromResult(new CompletionResponse(
            Model: chosen,
            Output: output,
            Context: req.Context ?? [],
            Telemetry: new() { ["latency_ms"] = 42, ["rag_docs"] = req.Context?.Count ?? 0 }
        ));
    }
}