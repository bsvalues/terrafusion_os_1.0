using System;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using SimpleWorkflow.Models;

namespace SimpleWorkflow.Activities.Common
{
    public abstract class RetryableActivity : WorkflowActivity
    {
        public int MaxRetries { get; set; } = 3;
        public TimeSpan RetryDelay { get; set; } = TimeSpan.FromSeconds(5);
        public bool ExponentialBackoff { get; set; } = true;
        public HashSet<Type> RetryableExceptions { get; set; } = new()
        {
            typeof(TimeoutException),
            typeof(System.Net.Http.HttpRequestException),
            typeof(System.IO.IOException)
        };

        protected abstract Task<bool> ExecuteInternalAsync(WorkflowContext context);

        public override async Task<bool> ExecuteAsync(WorkflowContext context)
        {
            var attempt = 0;
            var delay = RetryDelay;

            while (true)
            {
                attempt++;
                try
                {
                    return await ExecuteInternalAsync(context);
                }
                catch (Exception ex)
                {
                    var shouldRetry = attempt < MaxRetries && 
                                    RetryableExceptions.Any(t => t.IsInstanceOfType(ex));

                    if (!shouldRetry)
                    {
                        context.Logger.LogError(ex, 
                            $"Activity failed after {attempt} attempts: {ex.Message}");
                        throw;
                    }

                    context.Logger.LogWarning(
                        $"Attempt {attempt} failed, retrying in {delay.TotalSeconds} seconds: {ex.Message}");

                    await Task.Delay(delay);

                    if (ExponentialBackoff)
                    {
                        delay = TimeSpan.FromMilliseconds(delay.TotalMilliseconds * 2);
                    }
                }
            }
        }
    }
}
