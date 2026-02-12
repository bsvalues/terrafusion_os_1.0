using System;
using System.Threading.Tasks;

namespace SimpleWorkflow.Models
{
    public abstract class WorkflowActivity
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        public string Name { get; set; }
        public ActivityStatus Status { get; set; }
        public abstract Task<bool> ExecuteAsync(WorkflowContext context);
        public virtual Task<bool> ValidateAsync(WorkflowContext context) => Task.FromResult(true);
    }

    public enum ActivityStatus
    {
        Pending,
        Running,
        Completed,
        Failed
    }
}
