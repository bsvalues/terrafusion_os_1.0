using System;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using SimpleWorkflow.Models;

namespace SimpleWorkflow.Activities
{
    public class SendEmailActivity : WorkflowActivity
    {
        public string To { get; set; }
        public string Subject { get; set; }
        public string Body { get; set; }

        public override async Task<bool> ExecuteAsync(WorkflowContext context)
        {
            try
            {
                context.Logger.LogInformation($"Sending email to {To}");
                // Implement actual email sending logic here
                await Task.Delay(100); // Simulating email send
                return true;
            }
            catch (Exception ex)
            {
                context.Logger.LogError(ex, "Failed to send email");
                return false;
            }
        }
    }
}
