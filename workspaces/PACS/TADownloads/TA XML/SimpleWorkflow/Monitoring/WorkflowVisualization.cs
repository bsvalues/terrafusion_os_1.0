using System;
using System.Linq;
using System.Text;
using System.Collections.Generic;
using System.Drawing;
using ScottPlot;
using ScottPlot.Statistics;

namespace SimpleWorkflow.Monitoring
{
    public class WorkflowVisualization
    {
        public static void GenerateActivityTimeline(WorkflowReport report, string outputPath)
        {
            var plt = new Plot(1200, 800);

            var activities = report.Activities.OrderBy(a => a.StartTime).ToList();
            var startTime = activities.Min(a => a.StartTime);

            // Create timeline data
            var positions = new double[activities.Count];
            var durations = new double[activities.Count];
            var labels = new string[activities.Count];
            var colors = new Color[activities.Count];

            for (int i = 0; i < activities.Count; i++)
            {
                var activity = activities[i];
                positions[i] = i;
                durations[i] = activity.Duration.TotalSeconds;
                labels[i] = activity.ActivityName;
                colors[i] = activity.Status == ActivityStatus.Completed ? 
                    Color.Green : Color.Red;
            }

            // Create horizontal bar plot
            plt.AddBarH(positions, durations, colors);
            plt.YTicks(positions, labels);
            
            plt.Title("Workflow Activity Timeline");
            plt.XLabel("Duration (seconds)");
            
            plt.SaveFig(outputPath);
        }

        public static void GeneratePerformanceDistribution(WorkflowReport report, string outputPath)
        {
            var plt = new Plot(1200, 800);

            var activityTypes = report.Activities
                .GroupBy(a => a.ActivityType)
                .OrderByDescending(g => g.Count())
                .ToList();

            var position = 0;
            foreach (var group in activityTypes)
            {
                var durations = group.Select(a => a.Duration.TotalSeconds).ToArray();
                var violin = plt.AddViolin(durations, position);
                violin.ShowBox = true;
                violin.ShowMedian = true;
                position++;
            }

            plt.XTicks(
                Enumerable.Range(0, activityTypes.Count).Select(i => (double)i).ToArray(),
                activityTypes.Select(g => g.Key).ToArray()
            );

            plt.Title("Activity Duration Distribution by Type");
            plt.YLabel("Duration (seconds)");
            plt.XLabel("Activity Type");
            
            plt.SaveFig(outputPath);
        }

        public static void GenerateErrorHeatmap(WorkflowReport report, string outputPath)
        {
            var plt = new Plot(1200, 800);

            var activityTypes = report.Activities
                .Select(a => a.ActivityType)
                .Distinct()
                .OrderBy(t => t)
                .ToList();

            var errorTypes = report.Activities
                .SelectMany(a => a.Errors)
                .Select(e => e.ErrorMessage)
                .Distinct()
                .OrderBy(e => e)
                .ToList();

            var heatmapData = new double[activityTypes.Count, errorTypes.Count];

            for (int i = 0; i < activityTypes.Count; i++)
            {
                for (int j = 0; j < errorTypes.Count; j++)
                {
                    heatmapData[i, j] = report.Activities
                        .Where(a => a.ActivityType == activityTypes[i])
                        .Sum(a => a.Errors.Count(e => e.ErrorMessage == errorTypes[j]));
                }
            }

            plt.AddHeatmap(heatmapData);
            
            plt.Title("Error Distribution Heatmap");
            plt.XTicks(
                Enumerable.Range(0, errorTypes.Count).Select(i => (double)i).ToArray(),
                errorTypes.ToArray()
            );
            plt.YTicks(
                Enumerable.Range(0, activityTypes.Count).Select(i => (double)i).ToArray(),
                activityTypes.ToArray()
            );
            
            plt.SaveFig(outputPath);
        }

        public static string GenerateTextReport(WorkflowReport report)
        {
            var sb = new StringBuilder();
            
            sb.AppendLine("=== Workflow Execution Report ===");
            sb.AppendLine($"Generated: {report.GeneratedAt:yyyy-MM-dd HH:mm:ss}");
            sb.AppendLine($"Total Duration: {report.TotalDuration:hh\\:mm\\:ss}");
            sb.AppendLine($"Activities: {report.Activities.Count} ({report.SuccessfulActivities} successful, {report.FailedActivities} failed)");
            
            sb.AppendLine("\nActivity Type Performance:");
            foreach (var duration in report.AverageDurationByType)
            {
                sb.AppendLine($"  {duration.Key}: {duration.Value:hh\\:mm\\:ss} (avg)");
            }

            if (report.Activities.Any(a => a.Errors.Any()))
            {
                sb.AppendLine("\nErrors by Activity:");
                foreach (var activity in report.Activities.Where(a => a.Errors.Any()))
                {
                    sb.AppendLine($"\n  {activity.ActivityName}:");
                    foreach (var error in activity.Errors)
                    {
                        sb.AppendLine($"    - {error.Timestamp:HH:mm:ss}: {error.ErrorMessage}");
                    }
                }
            }

            return sb.ToString();
        }
    }
}
