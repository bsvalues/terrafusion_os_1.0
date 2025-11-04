using System;
using System.Collections.Generic;

namespace SimpleWorkflow.Models
{
    public class WorkflowTask
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        public string Name { get; set; }
        public string Description { get; set; }
        public TaskStatus Status { get; set; }
        public DateTime CreatedDate { get; set; } = DateTime.UtcNow;
        public DateTime? CompletedDate { get; set; }
        public List<WorkflowActivity> Activities { get; set; } = new List<WorkflowActivity>();
        public Dictionary<string, object> Variables { get; set; } = new Dictionary<string, object>();
    }

    public enum TaskStatus
    {
        Created,
        InProgress,
        Completed,
        Failed,
        Cancelled
    }
}
