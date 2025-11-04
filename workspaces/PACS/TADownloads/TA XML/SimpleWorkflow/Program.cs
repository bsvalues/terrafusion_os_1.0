using System;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using SimpleWorkflow.Activities;
using SimpleWorkflow.Activities.FileProcessing;
using SimpleWorkflow.Activities.DataValidation;
using SimpleWorkflow.Activities.Notifications;
using SimpleWorkflow.Activities.Scheduling;
using SimpleWorkflow.Engine;

namespace SimpleWorkflow
{
    public class Program
    {
        public static async Task Main()
        {
            // Setup logging
            var loggerFactory = LoggerFactory.Create(builder =>
            {
                builder.AddConsole();
            });

            var engine = new WorkflowEngine(loggerFactory.CreateLogger<WorkflowEngine>());

            // Create a new workflow task for document processing
            var task = await engine.StartNewWorkflowAsync(
                "Document Processing Workflow",
                "Process and validate document with approvals"
            );

            // 1. Validate the input file
            task.Activities.Add(new FileValidationActivity
            {
                Name = "Validate Input Document",
                FilePath = "example.pdf",
                MaxFileSizeBytes = 5 * 1024 * 1024, // 5MB
                AllowedExtensions = new[] { ".pdf", ".docx" }
            });

            // 2. Create a backup
            task.Activities.Add(new FileBackupActivity
            {
                Name = "Backup Document",
                SourcePath = "example.pdf",
                BackupDirectory = "backups",
                CreateTimestampedCopy = true
            });

            // 3. Validate metadata
            var dataValidation = new DataValidationActivity
            {
                Name = "Validate Document Metadata",
                StopOnFirstFailure = true
            };
            
            dataValidation.ValidationRules.Add("DocumentTitle", new RequiredValidationRule());
            dataValidation.ValidationRules.Add("PageCount", new RangeValidationRule 
            { 
                MinValue = 1, 
                MaxValue = 100 
            });
            
            task.Activities.Add(dataValidation);

            // 4. Send for approval
            task.Activities.Add(new ApprovalActivity
            {
                Name = "Get Manager Approval",
                ApproverEmail = "manager@company.com",
                Timeout = TimeSpan.FromDays(2)
            });

            // 5. Add a delay before notification
            task.Activities.Add(new DelayActivity
            {
                Name = "Notification Delay",
                DelayDuration = TimeSpan.FromSeconds(5),
                CancelOnTimeout = true
            });

            // 6. Send Slack notification
            task.Activities.Add(new SlackNotificationActivity
            {
                Name = "Send Slack Notification",
                WebhookUrl = "https://hooks.slack.com/services/your/webhook/url",
                Channel = "#document-approvals",
                Message = "New document has been processed and approved!",
                UseMarkdown = true
            });

            // Execute the workflow
            var result = await engine.ExecuteTaskAsync(task.Id);
            Console.WriteLine($"Workflow completed with status: {result}");
        }
    }
}
