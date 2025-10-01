using Microsoft.AspNetCore.Mvc;
using System.Text.Json;
using System.Collections.Concurrent;

namespace TerraFusion.API.Controllers;

/// <summary>
/// TerraFusion Change Digest Controller
/// Converts GitHub webhooks and CI events into plain English summaries
/// Provides "what changed today" narratives for non-technical stakeholders
/// </summary>
[ApiController]
[Route("api/changes")]
public class ChangeDigestController : ControllerBase
{
    private readonly ILogger<ChangeDigestController> _logger;
    private static readonly ConcurrentQueue<ChangeEvent> _recentChanges = new();
    private static readonly int MaxStoredChanges = 100;

    public ChangeDigestController(ILogger<ChangeDigestController> logger)
    {
        _logger = logger;
    }

    /// <summary>
    /// Get today's change digest in plain English
    /// </summary>
    [HttpGet("digest")]
    public IActionResult GetChangeDigest([FromQuery] int hours = 24)
    {
        try
        {
            var cutoff = DateTimeOffset.UtcNow.AddHours(-hours);
            var recentEvents = _recentChanges
                .Where(e => e.Timestamp >= cutoff)
                .OrderByDescending(e => e.Timestamp)
                .Take(20)
                .ToList();

            var digest = new
            {
                summary = GenerateExecutiveSummary(recentEvents),
                bullets = GenerateBulletPoints(recentEvents),
                timeline = GenerateTimeline(recentEvents),
                impact = AnalyzeImpact(recentEvents),
                recommendations = GenerateRecommendations(recentEvents),
                metadata = new
                {
                    timeframe = $"Last {hours} hours",
                    totalEvents = recentEvents.Count,
                    lastUpdate = recentEvents.FirstOrDefault()?.Timestamp ?? DateTimeOffset.UtcNow
                }
            };

            return Ok(digest);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error generating change digest");
            return StatusCode(500, new { error = "Change digest temporarily unavailable" });
        }
    }

    /// <summary>
    /// GitHub webhook endpoint for receiving change notifications
    /// </summary>
    [HttpPost("webhooks/github")]
    public async Task<IActionResult> HandleGitHubWebhook()
    {
        try
        {
            using var reader = new StreamReader(Request.Body);
            var payload = await reader.ReadToEndAsync();
            
            if (string.IsNullOrEmpty(payload))
                return BadRequest("Empty payload");

            var eventType = Request.Headers["X-GitHub-Event"].FirstOrDefault() ?? "unknown";
            var changeEvents = ProcessGitHubPayload(payload, eventType);

            foreach (var changeEvent in changeEvents)
            {
                AddChangeEvent(changeEvent);
            }

            _logger.LogInformation("Processed GitHub webhook: {EventType}, generated {Count} change events", 
                eventType, changeEvents.Count);

            return Ok(new 
            { 
                processed = true, 
                eventType = eventType,
                eventsGenerated = changeEvents.Count,
                summary = changeEvents.FirstOrDefault()?.Summary ?? "GitHub event processed"
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error processing GitHub webhook");
            return StatusCode(500, new { error = "Webhook processing failed" });
        }
    }

    /// <summary>
    /// CI/CD webhook endpoint for build and deployment notifications
    /// </summary>
    [HttpPost("webhooks/ci")]
    public async Task<IActionResult> HandleCIWebhook()
    {
        try
        {
            using var reader = new StreamReader(Request.Body);
            var payload = await reader.ReadToEndAsync();
            
            var ciEvent = ProcessCIPayload(payload);
            if (ciEvent != null)
            {
                AddChangeEvent(ciEvent);
                _logger.LogInformation("Processed CI webhook: {Summary}", ciEvent.Summary);
            }

            return Ok(new { processed = true, summary = ciEvent?.Summary ?? "CI event processed" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error processing CI webhook");
            return StatusCode(500, new { error = "CI webhook processing failed" });
        }
    }

    /// <summary>
    /// Manual change log entry (for internal team updates)
    /// </summary>
    [HttpPost("log")]
    public IActionResult LogChange([FromBody] ManualChangeRequest request)
    {
        try
        {
            var changeEvent = new ChangeEvent
            {
                Type = "manual",
                Summary = request.Summary,
                Details = request.Details ?? string.Empty,
                Author = request.Author ?? "TerraFusion Team",
                Impact = request.Impact ?? "operational",
                Timestamp = DateTimeOffset.UtcNow,
                Category = request.Category ?? "update"
            };

            AddChangeEvent(changeEvent);

            return Ok(new { logged = true, summary = changeEvent.Summary });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error logging manual change");
            return BadRequest(new { error = "Failed to log change" });
        }
    }

    /// <summary>
    /// Get change statistics for executive dashboard
    /// </summary>
    [HttpGet("stats")]
    public IActionResult GetChangeStatistics([FromQuery] int days = 7)
    {
        try
        {
            var cutoff = DateTimeOffset.UtcNow.AddDays(-days);
            var events = _recentChanges.Where(e => e.Timestamp >= cutoff).ToList();

            var stats = new
            {
                totalChanges = events.Count,
                byType = events.GroupBy(e => e.Type).ToDictionary(g => g.Key, g => g.Count()),
                byImpact = events.GroupBy(e => e.Impact).ToDictionary(g => g.Key, g => g.Count()),
                byAuthor = events.GroupBy(e => e.Author).ToDictionary(g => g.Key, g => g.Count()),
                dailyActivity = GenerateDailyActivity(events, days),
                velocity = CalculateChangeVelocity(events)
            };

            return Ok(stats);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error generating change statistics");
            return StatusCode(500, new { error = "Statistics temporarily unavailable" });
        }
    }

    private List<ChangeEvent> ProcessGitHubPayload(string payload, string eventType)
    {
        var events = new List<ChangeEvent>();

        try
        {
            using var doc = JsonDocument.Parse(payload);
            var root = doc.RootElement;

            switch (eventType.ToLower())
            {
                case "push":
                    events.AddRange(ProcessPushEvent(root));
                    break;
                case "pull_request":
                    events.AddRange(ProcessPullRequestEvent(root));
                    break;
                case "issues":
                    events.AddRange(ProcessIssueEvent(root));
                    break;
                case "release":
                    events.AddRange(ProcessReleaseEvent(root));
                    break;
                default:
                    events.Add(ProcessGenericEvent(root, eventType));
                    break;
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Error parsing GitHub payload for event type: {EventType}", eventType);
            events.Add(new ChangeEvent
            {
                Type = "github",
                Summary = $"GitHub {eventType} event received (parsing error)",
                Details = "Event processed but details unavailable",
                Author = "GitHub",
                Impact = "minor",
                Timestamp = DateTimeOffset.UtcNow,
                Category = "system"
            });
        }

        return events;
    }

    private List<ChangeEvent> ProcessPushEvent(JsonElement root)
    {
        var events = new List<ChangeEvent>();

        if (root.TryGetProperty("commits", out var commits) && commits.ValueKind == JsonValueKind.Array)
        {
            var commitCount = commits.GetArrayLength();
            var author = root.TryGetProperty("pusher", out var pusher) && pusher.TryGetProperty("name", out var name) 
                ? name.GetString() ?? "Unknown"
                : "Unknown";

            var branch = "main";
            if (root.TryGetProperty("ref", out var refElement))
            {
                var refString = refElement.GetString() ?? "";
                branch = refString.Replace("refs/heads/", "");
            }

            // Summary event for the push
            events.Add(new ChangeEvent
            {
                Type = "code",
                Summary = $"📝 {author} pushed {commitCount} commit{(commitCount == 1 ? "" : "s")} to {branch}",
                Details = ExtractCommitSummaries(commits),
                Author = author,
                Impact = DetermineCommitImpact(commits),
                Timestamp = DateTimeOffset.UtcNow,
                Category = "development"
            });

            // Individual commit events for significant commits
            foreach (var commit in commits.EnumerateArray().Take(3)) // Limit to first 3 commits
            {
                if (commit.TryGetProperty("message", out var message))
                {
                    var commitMessage = message.GetString() ?? "";
                    if (IsSignificantCommit(commitMessage))
                    {
                        events.Add(new ChangeEvent
                        {
                            Type = "commit",
                            Summary = $"🔧 {TruncateMessage(commitMessage)}",
                            Details = commitMessage,
                            Author = author,
                            Impact = DetermineMessageImpact(commitMessage),
                            Timestamp = DateTimeOffset.UtcNow,
                            Category = "development"
                        });
                    }
                }
            }
        }

        return events;
    }

    private List<ChangeEvent> ProcessPullRequestEvent(JsonElement root)
    {
        var events = new List<ChangeEvent>();

        if (root.TryGetProperty("action", out var action) && 
            root.TryGetProperty("pull_request", out var pr))
        {
            var actionStr = action.GetString() ?? "";
            var title = pr.TryGetProperty("title", out var titleElement) ? titleElement.GetString() ?? "" : "";
            var author = pr.TryGetProperty("user", out var user) && user.TryGetProperty("login", out var login)
                ? login.GetString() ?? "Unknown"
                : "Unknown";

            var emoji = actionStr switch
            {
                "opened" => "🔄",
                "closed" => "✅",
                "merged" => "🎉",
                "reopened" => "🔄",
                _ => "📋"
            };

            var impact = actionStr switch
            {
                "merged" => "major",
                "opened" => "moderate",
                "closed" => "minor",
                _ => "minor"
            };

            events.Add(new ChangeEvent
            {
                Type = "pull_request",
                Summary = $"{emoji} Pull request {actionStr}: \"{TruncateMessage(title)}\" by {author}",
                Details = title,
                Author = author,
                Impact = impact,
                Timestamp = DateTimeOffset.UtcNow,
                Category = "development"
            });
        }

        return events;
    }

    private List<ChangeEvent> ProcessIssueEvent(JsonElement root)
    {
        var events = new List<ChangeEvent>();

        if (root.TryGetProperty("action", out var action) && 
            root.TryGetProperty("issue", out var issue))
        {
            var actionStr = action.GetString() ?? "";
            var title = issue.TryGetProperty("title", out var titleElement) ? titleElement.GetString() ?? "" : "";
            var author = issue.TryGetProperty("user", out var user) && user.TryGetProperty("login", out var login)
                ? login.GetString() ?? "Unknown"
                : "Unknown";

            if (actionStr is "opened" or "closed")
            {
                var emoji = actionStr == "opened" ? "🐛" : "✅";
                
                events.Add(new ChangeEvent
                {
                    Type = "issue",
                    Summary = $"{emoji} Issue {actionStr}: \"{TruncateMessage(title)}\" by {author}",
                    Details = title,
                    Author = author,
                    Impact = "minor",
                    Timestamp = DateTimeOffset.UtcNow,
                    Category = "support"
                });
            }
        }

        return events;
    }

    private List<ChangeEvent> ProcessReleaseEvent(JsonElement root)
    {
        var events = new List<ChangeEvent>();

        if (root.TryGetProperty("release", out var release))
        {
            var name = release.TryGetProperty("name", out var nameElement) ? nameElement.GetString() ?? "" : "";
            var tagName = release.TryGetProperty("tag_name", out var tagElement) ? tagElement.GetString() ?? "" : "";
            var author = release.TryGetProperty("author", out var authorElement) && authorElement.TryGetProperty("login", out var login)
                ? login.GetString() ?? "TerraFusion Team"
                : "TerraFusion Team";

            events.Add(new ChangeEvent
            {
                Type = "release",
                Summary = $"🚀 New release published: {tagName} - {name}",
                Details = $"Version {tagName} released by {author}",
                Author = author,
                Impact = "major",
                Timestamp = DateTimeOffset.UtcNow,
                Category = "release"
            });
        }

        return events;
    }

    private ChangeEvent ProcessGenericEvent(JsonElement root, string eventType)
    {
        return new ChangeEvent
        {
            Type = "github",
            Summary = $"📡 GitHub {eventType} event received",
            Details = $"GitHub triggered a {eventType} event",
            Author = "GitHub",
            Impact = "minor",
            Timestamp = DateTimeOffset.UtcNow,
            Category = "system"
        };
    }

    private ChangeEvent? ProcessCIPayload(string payload)
    {
        try
        {
            using var doc = JsonDocument.Parse(payload);
            var root = doc.RootElement;

            // Generic CI event processing
            var status = root.TryGetProperty("status", out var statusElement) ? statusElement.GetString() ?? "unknown" : "unknown";
            var jobName = root.TryGetProperty("job", out var jobElement) ? jobElement.GetString() ?? "CI Job" : "CI Job";
            var branch = root.TryGetProperty("branch", out var branchElement) ? branchElement.GetString() ?? "main" : "main";

            var emoji = status switch
            {
                "success" => "✅",
                "failure" => "❌",
                "running" => "⏳",
                _ => "🔧"
            };

            var impact = status switch
            {
                "failure" => "major",
                "success" => "moderate",
                _ => "minor"
            };

            return new ChangeEvent
            {
                Type = "ci",
                Summary = $"{emoji} {jobName} {status} on {branch}",
                Details = $"CI/CD pipeline result: {status}",
                Author = "CI/CD System",
                Impact = impact,
                Timestamp = DateTimeOffset.UtcNow,
                Category = "deployment"
            };
        }
        catch
        {
            return new ChangeEvent
            {
                Type = "ci",
                Summary = "🔧 CI/CD event received",
                Details = "Build or deployment pipeline event",
                Author = "CI/CD System",
                Impact = "minor",
                Timestamp = DateTimeOffset.UtcNow,
                Category = "deployment"
            };
        }
    }

    private void AddChangeEvent(ChangeEvent changeEvent)
    {
        _recentChanges.Enqueue(changeEvent);

        // Keep only the most recent changes
        while (_recentChanges.Count > MaxStoredChanges)
        {
            _recentChanges.TryDequeue(out _);
        }
    }

    private string GenerateExecutiveSummary(List<ChangeEvent> events)
    {
        if (!events.Any())
            return "No recent changes detected - system stable";

        var codeChanges = events.Count(e => e.Type is "code" or "commit");
        var releases = events.Count(e => e.Type == "release");
        var issues = events.Count(e => e.Type == "issue");
        var majorImpact = events.Count(e => e.Impact == "major");

        var summary = new List<string>();

        if (releases > 0)
            summary.Add($"{releases} new release{(releases == 1 ? "" : "s")}");
        if (codeChanges > 0)
            summary.Add($"{codeChanges} code update{(codeChanges == 1 ? "" : "s")}");
        if (issues > 0)
            summary.Add($"{issues} issue{(issues == 1 ? "" : "s")} addressed");

        var summaryText = summary.Any() ? string.Join(", ", summary) : "routine maintenance";
        var impactNote = majorImpact > 0 ? " (includes significant changes)" : "";

        return $"TerraFusion had {summaryText} in the last period{impactNote}";
    }

    private List<string> GenerateBulletPoints(List<ChangeEvent> events)
    {
        return events.Take(10).Select(e => e.Summary).ToList();
    }

    private List<object> GenerateTimeline(List<ChangeEvent> events)
    {
        return events.Take(15).Select(e => (object)new
        {
            time = e.Timestamp.ToString("HH:mm"),
            summary = e.Summary,
            author = e.Author,
            impact = e.Impact
        }).ToList();
    }

    private object AnalyzeImpact(List<ChangeEvent> events)
    {
        var total = events.Count;
        if (total == 0)
            return new { level = "none", description = "No changes" };

        var major = events.Count(e => e.Impact == "major");
        var moderate = events.Count(e => e.Impact == "moderate");

        var level = (major > 0) ? "high" : (moderate > total / 2) ? "medium" : "low";
        var description = level switch
        {
            "high" => "Significant changes that may affect operations",
            "medium" => "Moderate updates with some operational impact",
            "low" => "Routine changes with minimal impact",
            _ => "No impact"
        };

        return new { level, description, major, moderate, minor = total - major - moderate };
    }

    private List<string> GenerateRecommendations(List<ChangeEvent> events)
    {
        var recommendations = new List<string>();

        var failedBuilds = events.Count(e => e.Type == "ci" && e.Summary.Contains("failure"));
        var majorChanges = events.Count(e => e.Impact == "major");
        var recentActivity = events.Count(e => e.Timestamp > DateTimeOffset.UtcNow.AddHours(-2));

        if (failedBuilds > 0)
            recommendations.Add("🚨 Review failed builds - may affect system stability");
        else if (majorChanges > 2)
            recommendations.Add("⚠️ Monitor system closely due to significant changes");
        else if (recentActivity > 5)
            recommendations.Add("📊 High activity detected - monitor for stability");
        else
            recommendations.Add("✅ Changes appear routine - continue normal operations");

        return recommendations;
    }

    private Dictionary<string, int> GenerateDailyActivity(List<ChangeEvent> events, int days)
    {
        var activity = new Dictionary<string, int>();
        
        for (int i = 0; i < days; i++)
        {
            var date = DateTimeOffset.UtcNow.AddDays(-i).ToString("yyyy-MM-dd");
            var dayStart = DateTimeOffset.UtcNow.AddDays(-i).Date;
            var dayEnd = dayStart.AddDays(1);
            
            var count = events.Count(e => e.Timestamp >= dayStart && e.Timestamp < dayEnd);
            activity[date] = count;
        }

        return activity;
    }

    private object CalculateChangeVelocity(List<ChangeEvent> events)
    {
        var now = DateTimeOffset.UtcNow;
        var last24h = events.Count(e => e.Timestamp > now.AddHours(-24));
        var last7d = events.Count(e => e.Timestamp > now.AddDays(-7));
        
        return new
        {
            changesPerDay = Math.Round(last7d / 7.0, 1),
            changesLast24h = last24h,
            trend = last24h > (last7d / 7.0) ? "increasing" : "stable"
        };
    }

    private string ExtractCommitSummaries(JsonElement commits)
    {
        var messages = new List<string>();
        foreach (var commit in commits.EnumerateArray().Take(3))
        {
            if (commit.TryGetProperty("message", out var message))
            {
                var msg = message.GetString() ?? "";
                messages.Add(TruncateMessage(msg));
            }
        }
        return string.Join("; ", messages);
    }

    private string DetermineCommitImpact(JsonElement commits)
    {
        foreach (var commit in commits.EnumerateArray())
        {
            if (commit.TryGetProperty("message", out var message))
            {
                var msg = message.GetString()?.ToLower() ?? "";
                if (msg.Contains("breaking") || msg.Contains("major") || msg.Contains("release"))
                    return "major";
                if (msg.Contains("feature") || msg.Contains("add") || msg.Contains("update"))
                    return "moderate";
            }
        }
        return "minor";
    }

    private string DetermineMessageImpact(string message)
    {
        var lower = message.ToLower();
        if (lower.Contains("breaking") || lower.Contains("major") || lower.Contains("release"))
            return "major";
        if (lower.Contains("feature") || lower.Contains("add") || lower.Contains("update"))
            return "moderate";
        return "minor";
    }

    private bool IsSignificantCommit(string message)
    {
        var lower = message.ToLower();
        var significantKeywords = new[] { "feature", "fix", "breaking", "major", "release", "security", "performance" };
        return significantKeywords.Any(keyword => lower.Contains(keyword));
    }

    private string TruncateMessage(string message)
    {
        const int maxLength = 60;
        if (message.Length <= maxLength) return message;
        return message[..maxLength] + "...";
    }
}

/// <summary>
/// Represents a change event in the system
/// </summary>
public class ChangeEvent
{
    public string Type { get; set; } = "";
    public string Summary { get; set; } = "";
    public string Details { get; set; } = "";
    public string Author { get; set; } = "";
    public string Impact { get; set; } = ""; // minor, moderate, major
    public DateTimeOffset Timestamp { get; set; }
    public string Category { get; set; } = "";
}

/// <summary>
/// Request model for manual change logging
/// </summary>
public class ManualChangeRequest
{
    public string Summary { get; set; } = "";
    public string? Details { get; set; }
    public string? Author { get; set; }
    public string? Impact { get; set; }
    public string? Category { get; set; }
}