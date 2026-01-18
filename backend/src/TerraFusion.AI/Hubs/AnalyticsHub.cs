/**
 * AnalyticsHub - Real-Time Analytics Updates
 *
 * SignalR hub for streaming analysis results, live data updates,
 * and real-time visualization refreshes.
 *
 * @author TerraFusion Elite Government OS Engineering Agent
 * @version 2.0.0 - Phase 2 Week 5 Day 1
 */

using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Logging;
using System.Collections.Concurrent;

namespace TerraFusion.AI.Hubs;

/// <summary>
/// SignalR hub for real-time analytics updates
/// </summary>
public class AnalyticsHub : Hub
{
    private readonly ILogger<AnalyticsHub> _logger;

    // Track active analysis subscriptions
    private static readonly ConcurrentDictionary<int, HashSet<string>> _analysisSubscriptions = new();

    // Track data stream subscriptions
    private static readonly ConcurrentDictionary<string, HashSet<string>> _dataStreamSubscriptions = new();

    public AnalyticsHub(ILogger<AnalyticsHub> logger)
    {
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    #region Analysis Execution Streaming

    /// <summary>
    /// Subscribe to analysis execution updates
    /// </summary>
    public async Task SubscribeToAnalysis(int analysisId, int userId, int countyId)
    {
        var groupName = $"analysis_{analysisId}";
        await Groups.AddToGroupAsync(Context.ConnectionId, groupName);

        _analysisSubscriptions.AddOrUpdate(
            analysisId,
            new HashSet<string> { Context.ConnectionId },
            (_, subscribers) =>
            {
                subscribers.Add(Context.ConnectionId);
                return subscribers;
            });

        _logger.LogInformation("Connection {ConnectionId} subscribed to analysis {AnalysisId}",
            Context.ConnectionId, analysisId);

        await Clients.Caller.SendAsync("SubscriptionConfirmed", new
        {
            AnalysisId = analysisId,
            SubscribedAt = DateTime.UtcNow
        });
    }

    /// <summary>
    /// Unsubscribe from analysis execution updates
    /// </summary>
    public async Task UnsubscribeFromAnalysis(int analysisId)
    {
        var groupName = $"analysis_{analysisId}";
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, groupName);

        if (_analysisSubscriptions.TryGetValue(analysisId, out var subscribers))
        {
            subscribers.Remove(Context.ConnectionId);
            if (subscribers.Count == 0)
            {
                _analysisSubscriptions.TryRemove(analysisId, out _);
            }
        }

        _logger.LogInformation("Connection {ConnectionId} unsubscribed from analysis {AnalysisId}",
            Context.ConnectionId, analysisId);
    }

    /// <summary>
    /// Start analysis execution (broadcasts to subscribers)
    /// </summary>
    public async Task StartAnalysis(int analysisId, string analysisType)
    {
        _logger.LogInformation("Starting analysis {AnalysisId} of type {AnalysisType}", analysisId, analysisType);

        await Clients.Group($"analysis_{analysisId}").SendAsync("AnalysisStarted", new
        {
            AnalysisId = analysisId,
            AnalysisType = analysisType,
            StartedAt = DateTime.UtcNow,
            Status = "running"
        });
    }

    /// <summary>
    /// Stream analysis progress updates
    /// </summary>
    public async Task StreamAnalysisProgress(int analysisId, double progress, string currentStep)
    {
        await Clients.Group($"analysis_{analysisId}").SendAsync("AnalysisProgress", new
        {
            AnalysisId = analysisId,
            Progress = progress, // 0.0 to 1.0
            CurrentStep = currentStep,
            UpdatedAt = DateTime.UtcNow
        });
    }

    /// <summary>
    /// Complete analysis execution
    /// </summary>
    public async Task CompleteAnalysis(int analysisId, object result)
    {
        _logger.LogInformation("Analysis {AnalysisId} completed", analysisId);

        await Clients.Group($"analysis_{analysisId}").SendAsync("AnalysisCompleted", new
        {
            AnalysisId = analysisId,
            Result = result,
            CompletedAt = DateTime.UtcNow,
            Status = "completed"
        });
    }

    /// <summary>
    /// Broadcast analysis failure
    /// </summary>
    public async Task AnalysisFailed(int analysisId, string errorMessage, string? errorDetails = null)
    {
        _logger.LogError("Analysis {AnalysisId} failed: {ErrorMessage}", analysisId, errorMessage);

        await Clients.Group($"analysis_{analysisId}").SendAsync("AnalysisFailed", new
        {
            AnalysisId = analysisId,
            ErrorMessage = errorMessage,
            ErrorDetails = errorDetails,
            FailedAt = DateTime.UtcNow,
            Status = "failed"
        });
    }

    #endregion

    #region Live Data Streaming

    /// <summary>
    /// Subscribe to live data stream
    /// </summary>
    public async Task SubscribeToDataStream(string dataSource, int userId, int countyId)
    {
        var groupName = $"datastream_{dataSource}";
        await Groups.AddToGroupAsync(Context.ConnectionId, groupName);

        _dataStreamSubscriptions.AddOrUpdate(
            dataSource,
            new HashSet<string> { Context.ConnectionId },
            (_, subscribers) =>
            {
                subscribers.Add(Context.ConnectionId);
                return subscribers;
            });

        _logger.LogInformation("Connection {ConnectionId} subscribed to data stream {DataSource}",
            Context.ConnectionId, dataSource);

        await Clients.Caller.SendAsync("DataStreamSubscribed", new
        {
            DataSource = dataSource,
            SubscribedAt = DateTime.UtcNow
        });
    }

    /// <summary>
    /// Unsubscribe from live data stream
    /// </summary>
    public async Task UnsubscribeFromDataStream(string dataSource)
    {
        var groupName = $"datastream_{dataSource}";
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, groupName);

        if (_dataStreamSubscriptions.TryGetValue(dataSource, out var subscribers))
        {
            subscribers.Remove(Context.ConnectionId);
            if (subscribers.Count == 0)
            {
                _dataStreamSubscriptions.TryRemove(dataSource, out _);
            }
        }

        _logger.LogInformation("Connection {ConnectionId} unsubscribed from data stream {DataSource}",
            Context.ConnectionId, dataSource);
    }

    /// <summary>
    /// Broadcast data update to stream subscribers
    /// </summary>
    public async Task BroadcastDataUpdate(string dataSource, object data, string updateType = "append")
    {
        await Clients.Group($"datastream_{dataSource}").SendAsync("DataStreamUpdate", new
        {
            DataSource = dataSource,
            Data = data,
            UpdateType = updateType, // append, replace, update, delete
            Timestamp = DateTime.UtcNow
        });
    }

    /// <summary>
    /// Broadcast batch data update
    /// </summary>
    public async Task BroadcastBatchDataUpdate(string dataSource, IEnumerable<object> dataPoints)
    {
        await Clients.Group($"datastream_{dataSource}").SendAsync("DataStreamBatchUpdate", new
        {
            DataSource = dataSource,
            DataPoints = dataPoints,
            Count = dataPoints.Count(),
            Timestamp = DateTime.UtcNow
        });
    }

    #endregion

    #region Visualization Updates

    /// <summary>
    /// Subscribe to visualization updates
    /// </summary>
    public async Task SubscribeToVisualization(int visualizationId, int userId, int countyId)
    {
        var groupName = $"visualization_{visualizationId}";
        await Groups.AddToGroupAsync(Context.ConnectionId, groupName);

        _logger.LogInformation("Connection {ConnectionId} subscribed to visualization {VisualizationId}",
            Context.ConnectionId, visualizationId);

        await Clients.Caller.SendAsync("VisualizationSubscribed", new
        {
            VisualizationId = visualizationId,
            SubscribedAt = DateTime.UtcNow
        });
    }

    /// <summary>
    /// Unsubscribe from visualization updates
    /// </summary>
    public async Task UnsubscribeFromVisualization(int visualizationId)
    {
        var groupName = $"visualization_{visualizationId}";
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, groupName);

        _logger.LogInformation("Connection {ConnectionId} unsubscribed from visualization {VisualizationId}",
            Context.ConnectionId, visualizationId);
    }

    /// <summary>
    /// Update visualization data
    /// </summary>
    public async Task UpdateVisualization(int visualizationId, object data)
    {
        await Clients.Group($"visualization_{visualizationId}").SendAsync("VisualizationUpdated", new
        {
            VisualizationId = visualizationId,
            Data = data,
            UpdatedAt = DateTime.UtcNow
        });
    }

    /// <summary>
    /// Refresh visualization (force complete redraw)
    /// </summary>
    public async Task RefreshVisualization(int visualizationId)
    {
        await Clients.Group($"visualization_{visualizationId}").SendAsync("VisualizationRefresh", new
        {
            VisualizationId = visualizationId,
            RefreshedAt = DateTime.UtcNow
        });
    }

    /// <summary>
    /// Broadcast visualization interaction (zoom, pan, selection)
    /// </summary>
    public async Task BroadcastVisualizationInteraction(
        int visualizationId,
        string interactionType,
        object interactionData)
    {
        await Clients.OthersInGroup($"visualization_{visualizationId}").SendAsync("VisualizationInteraction", new
        {
            VisualizationId = visualizationId,
            InteractionType = interactionType, // zoom, pan, select, highlight
            InteractionData = interactionData,
            PerformedBy = Context.ConnectionId,
            Timestamp = DateTime.UtcNow
        });
    }

    #endregion

    #region Statistical Results Streaming

    /// <summary>
    /// Stream statistical test results as they're calculated
    /// </summary>
    public async Task StreamStatisticalResults(int analysisId, string testType, object partialResults)
    {
        await Clients.Group($"analysis_{analysisId}").SendAsync("StatisticalResultsUpdate", new
        {
            AnalysisId = analysisId,
            TestType = testType,
            PartialResults = partialResults,
            Timestamp = DateTime.UtcNow
        });
    }

    /// <summary>
    /// Broadcast significance alert (when p-value crosses threshold)
    /// </summary>
    public async Task BroadcastSignificanceAlert(int analysisId, double pValue, double threshold)
    {
        _logger.LogInformation("Significance alert for analysis {AnalysisId}: p={PValue} (threshold={Threshold})",
            analysisId, pValue, threshold);

        await Clients.Group($"analysis_{analysisId}").SendAsync("SignificanceAlert", new
        {
            AnalysisId = analysisId,
            PValue = pValue,
            Threshold = threshold,
            IsSignificant = pValue <= threshold,
            Timestamp = DateTime.UtcNow
        });
    }

    #endregion

    #region Model Training Updates

    /// <summary>
    /// Stream ML model training progress
    /// </summary>
    public async Task StreamTrainingProgress(
        string modelId,
        int epoch,
        int totalEpochs,
        double loss,
        double? accuracy = null)
    {
        await Clients.Group($"training_{modelId}").SendAsync("TrainingProgress", new
        {
            ModelId = modelId,
            Epoch = epoch,
            TotalEpochs = totalEpochs,
            Progress = (double)epoch / totalEpochs,
            Loss = loss,
            Accuracy = accuracy,
            Timestamp = DateTime.UtcNow
        });
    }

    /// <summary>
    /// Broadcast model training completion
    /// </summary>
    public async Task BroadcastTrainingCompleted(string modelId, object metrics)
    {
        _logger.LogInformation("Model {ModelId} training completed", modelId);

        await Clients.Group($"training_{modelId}").SendAsync("TrainingCompleted", new
        {
            ModelId = modelId,
            Metrics = metrics,
            CompletedAt = DateTime.UtcNow
        });
    }

    #endregion

    #region Connection Management

    /// <summary>
    /// Handle disconnection cleanup
    /// </summary>
    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        // Clean up analysis subscriptions
        var analysesToClean = _analysisSubscriptions
            .Where(kvp => kvp.Value.Contains(Context.ConnectionId))
            .Select(kvp => kvp.Key)
            .ToList();

        foreach (var analysisId in analysesToClean)
        {
            if (_analysisSubscriptions.TryGetValue(analysisId, out var subscribers))
            {
                subscribers.Remove(Context.ConnectionId);
                if (subscribers.Count == 0)
                {
                    _analysisSubscriptions.TryRemove(analysisId, out _);
                }
            }
        }

        // Clean up data stream subscriptions
        var streamsToClean = _dataStreamSubscriptions
            .Where(kvp => kvp.Value.Contains(Context.ConnectionId))
            .Select(kvp => kvp.Key)
            .ToList();

        foreach (var dataSource in streamsToClean)
        {
            if (_dataStreamSubscriptions.TryGetValue(dataSource, out var subscribers))
            {
                subscribers.Remove(Context.ConnectionId);
                if (subscribers.Count == 0)
                {
                    _dataStreamSubscriptions.TryRemove(dataSource, out _);
                }
            }
        }

        _logger.LogInformation("Connection {ConnectionId} disconnected from AnalyticsHub", Context.ConnectionId);

        await base.OnDisconnectedAsync(exception);
    }

    #endregion

    #region Helper Methods

    /// <summary>
    /// Get subscriber count for analysis
    /// </summary>
    public Task<int> GetAnalysisSubscriberCount(int analysisId)
    {
        var count = _analysisSubscriptions.TryGetValue(analysisId, out var subscribers)
            ? subscribers.Count
            : 0;

        return Task.FromResult(count);
    }

    /// <summary>
    /// Get subscriber count for data stream
    /// </summary>
    public Task<int> GetDataStreamSubscriberCount(string dataSource)
    {
        var count = _dataStreamSubscriptions.TryGetValue(dataSource, out var subscribers)
            ? subscribers.Count
            : 0;

        return Task.FromResult(count);
    }

    #endregion
}
