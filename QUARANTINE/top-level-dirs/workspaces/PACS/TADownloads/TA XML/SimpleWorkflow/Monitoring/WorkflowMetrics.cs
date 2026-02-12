using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using SimpleWorkflow.Models;

namespace SimpleWorkflow.Monitoring
{
    public class WorkflowMetrics
    {
        private readonly ConcurrentDictionary<string, ActivityMetric> _metrics = new();

        public void RecordActivityStart(WorkflowActivity activity)
        {
            var metric = GetOrCreateMetric(activity);
            metric.StartTime = DateTime.UtcNow;
            metric.Status = ActivityStatus.Running;
        }

        public void RecordActivityEnd(WorkflowActivity activity, bool success)
        {
            var metric = GetOrCreateMetric(activity);
            metric.EndTime = DateTime.UtcNow;
            metric.Status = success ? ActivityStatus.Completed : ActivityStatus.Failed;
            metric.Duration = metric.EndTime - metric.StartTime;
        }

        public void RecordDataMetric(WorkflowActivity activity, string metricName, long value)
        {
            var metric = GetOrCreateMetric(activity);
            metric.DataMetrics[metricName] = value;
        }

        public void RecordError(WorkflowActivity activity, Exception error)
        {
            var metric = GetOrCreateMetric(activity);
            metric.Errors.Add(new ActivityError
            {
                Timestamp = DateTime.UtcNow,
                ErrorMessage = error.Message,
                StackTrace = error.StackTrace
            });
        }

        public WorkflowReport GenerateReport()
        {
            var report = new WorkflowReport
            {
                GeneratedAt = DateTime.UtcNow,
                Activities = new List<ActivityMetric>(_metrics.Values)
            };

            report.CalculateStatistics();
            return report;
        }

        private ActivityMetric GetOrCreateMetric(WorkflowActivity activity)
        {
            return _metrics.GetOrAdd(activity.Id.ToString(), _ => new ActivityMetric
            {
                ActivityId = activity.Id,
                ActivityName = activity.Name,
                ActivityType = activity.GetType().Name
            });
        }
    }

    public class ActivityMetric
    {
        public Guid ActivityId { get; set; }
        public string ActivityName { get; set; }
        public string ActivityType { get; set; }
        public DateTime StartTime { get; set; }
        public DateTime EndTime { get; set; }
        public TimeSpan Duration { get; set; }
        public ActivityStatus Status { get; set; }
        public Dictionary<string, long> DataMetrics { get; set; } = new();
        public List<ActivityError> Errors { get; set; } = new();
    }

    public class ActivityError
    {
        public DateTime Timestamp { get; set; }
        public string ErrorMessage { get; set; }
        public string StackTrace { get; set; }
    }

    public class WorkflowReport
    {
        public DateTime GeneratedAt { get; set; }
        public List<ActivityMetric> Activities { get; set; }
        public TimeSpan TotalDuration { get; set; }
        public int SuccessfulActivities { get; set; }
        public int FailedActivities { get; set; }
        public Dictionary<string, TimeSpan> AverageDurationByType { get; set; }

        public void CalculateStatistics()
        {
            if (Activities == null || !Activities.Any()) return;

            TotalDuration = Activities.Max(a => a.EndTime) - Activities.Min(a => a.StartTime);
            SuccessfulActivities = Activities.Count(a => a.Status == ActivityStatus.Completed);
            FailedActivities = Activities.Count(a => a.Status == ActivityStatus.Failed);

            AverageDurationByType = Activities
                .GroupBy(a => a.ActivityType)
                .ToDictionary(
                    g => g.Key,
                    g => TimeSpan.FromTicks((long)g.Average(a => a.Duration.Ticks))
                );
        }
    }
}
