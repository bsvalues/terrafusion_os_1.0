using System;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using SimpleWorkflow.Models;

namespace SimpleWorkflow.Activities
{
    public class ApprovalActivity : WorkflowActivity
    {
        public string ApproverEmail { get; set; }
        public TimeSpan Timeout { get; set; } = TimeSpan.FromDays(1);
        public bool IsApproved { get; private set; }

        public override async Task<bool> ExecuteAsync(WorkflowContext context)
        {
            try
            {
                context.Logger.LogInformation($"Waiting for approval from {ApproverEmail}");
                // In a real implementation, this would integrate with your notification system
                // and wait for a response
                await Task.Delay(100); // Simulating waiting for approval
                IsApproved = true; // Simulated approval
                return true;
            }
            catch (Exception ex)
            {
                context.Logger.LogError(ex, "Approval process failed");
                return false;
            }
        }
    }
}
