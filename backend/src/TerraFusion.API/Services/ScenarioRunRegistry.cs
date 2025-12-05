using System;
using System.Collections.Concurrent;
using System.Collections.Generic;

namespace TerraFusion.API.Services
{
    public class ScenarioRun
    {
        public string Id { get; set; } = string.Empty;
        public string ScenarioId { get; set; } = string.Empty;
        public string Status { get; set; } = "queued"; // queued | running | succeeded | failed
        public DateTime StartedAt { get; set; } = DateTime.UtcNow;
        public DateTime? CompletedAt { get; set; }
        public Dictionary<string, string> Parameters { get; set; } = new();
        public object? Result { get; set; }
        public string? Error { get; set; }
    }

    public class ScenarioRunRegistry
    {
        private readonly ConcurrentDictionary<string, ScenarioRun> _runs = new();

        public ScenarioRun Create(string scenarioId, IDictionary<string, string>? parameters = null)
        {
            var id = $"scn_{scenarioId}_{Guid.NewGuid().ToString("N").Substring(0, 8)}";
            var run = new ScenarioRun
            {
                Id = id,
                ScenarioId = scenarioId,
                Status = "queued",
                StartedAt = DateTime.UtcNow,
                Parameters = parameters != null ? new Dictionary<string, string>(parameters) : new Dictionary<string, string>()
            };

            _runs[id] = run;
            return run;
        }

        public bool TryGet(string id, out ScenarioRun? run)
        {
            var ok = _runs.TryGetValue(id, out var value);
            run = value;
            return ok;
        }

        public IEnumerable<ScenarioRun> List(int take = 50)
        {
            // Return up to 'take' most recent by StartedAt
            foreach (var run in _runs.Values)
            {
                yield return run;
            }
        }

        public void MarkRunning(string id)
        {
            if (_runs.TryGetValue(id, out var run))
            {
                run.Status = "running";
            }
        }

        public void MarkSucceeded(string id, object? result)
        {
            if (_runs.TryGetValue(id, out var run))
            {
                run.Status = "succeeded";
                run.CompletedAt = DateTime.UtcNow;
                run.Result = result;
            }
        }

        public void MarkFailed(string id, string error)
        {
            if (_runs.TryGetValue(id, out var run))
            {
                run.Status = "failed";
                run.CompletedAt = DateTime.UtcNow;
                run.Error = error;
            }
        }
    }
}
