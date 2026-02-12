using System;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using SimpleWorkflow.Models;

namespace SimpleWorkflow.Activities.Notifications
{
    public class SlackNotificationActivity : WorkflowActivity
    {
        public string WebhookUrl { get; set; }
        public string Channel { get; set; }
        public string Message { get; set; }
        public string Username { get; set; } = "Workflow Bot";
        public bool UseMarkdown { get; set; } = true;

        public override async Task<bool> ValidateAsync(WorkflowContext context)
        {
            if (string.IsNullOrEmpty(WebhookUrl))
            {
                context.Logger.LogError("Slack webhook URL is required");
                return false;
            }

            if (string.IsNullOrEmpty(Message))
            {
                context.Logger.LogError("Message is required");
                return false;
            }

            return true;
        }

        public override async Task<bool> ExecuteAsync(WorkflowContext context)
        {
            try
            {
                var payload = new
                {
                    channel = Channel,
                    username = Username,
                    text = Message,
                    mrkdwn = UseMarkdown
                };

                using var client = new HttpClient();
                var json = JsonSerializer.Serialize(payload);
                var content = new StringContent(json, Encoding.UTF8, "application/json");

                var response = await client.PostAsync(WebhookUrl, content);
                if (!response.IsSuccessStatusCode)
                {
                    var errorContent = await response.Content.ReadAsStringAsync();
                    context.Logger.LogError($"Failed to send Slack notification. Status: {response.StatusCode}, Error: {errorContent}");
                    return false;
                }

                context.Logger.LogInformation("Slack notification sent successfully");
                return true;
            }
            catch (Exception ex)
            {
                context.Logger.LogError(ex, "Failed to send Slack notification");
                return false;
            }
        }
    }
}
