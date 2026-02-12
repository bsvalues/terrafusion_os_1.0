using System.Collections.Generic;
using Microsoft.Extensions.Logging;

namespace SimpleWorkflow.Models
{
    public class WorkflowContext
    {
        public WorkflowTask CurrentTask { get; set; }
        public Dictionary<string, object> Variables { get; set; } = new Dictionary<string, object>();
        public ILogger Logger { get; set; }
        
        public T GetVariable<T>(string name)
        {
            if (Variables.TryGetValue(name, out var value))
            {
                return (T)value;
            }
            return default;
        }

        public void SetVariable(string name, object value)
        {
            Variables[name] = value;
        }
    }
}
