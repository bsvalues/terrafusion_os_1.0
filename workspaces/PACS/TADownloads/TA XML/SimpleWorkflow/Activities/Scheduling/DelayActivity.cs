using System;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using SimpleWorkflow.Models;

namespace SimpleWorkflow.Activities.Scheduling
{
    public class DelayActivity : WorkflowActivity
    {
        public TimeSpan DelayDuration { get; set; }
        public bool CancelOnTimeout { get; set; } = false;

        public override async Task<bool> ValidateAsync(WorkflowContext context)
        {
            if (DelayDuration <= TimeSpan.Zero)
            {
                context.Logger.LogError("Delay duration must be positive");
                return false;
            }

            return true;
        }

        public override async Task<bool> ExecuteAsync(WorkflowContext context)
        {
            try
            {
                context.Logger.LogInformation($"Starting delay for {DelayDuration.TotalSeconds} seconds");
                
                using var cts = new System.Threading.CancellationTokenSource();
                cts.CancelAfter(DelayDuration);

                try
                {
                    await Task.Delay(DelayDuration, cts.Token);
                    context.Logger.LogInformation("Delay completed successfully");
                    return true;
                }
                catch (TaskCanceledException)
                {
                    if (CancelOnTimeout)
                    {
                        context.Logger.LogWarning("Delay was cancelled due to timeout");
                        return false;
                    }
                    return true;
                }
            }
            catch (Exception ex)
            {
                context.Logger.LogError(ex, "Delay activity failed");
                return false;
            }
        }
    }
}
