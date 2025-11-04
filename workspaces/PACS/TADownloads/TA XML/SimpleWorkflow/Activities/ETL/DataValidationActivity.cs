using System;
using System.Data;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using SimpleWorkflow.Models;

namespace SimpleWorkflow.Activities.ETL
{
    public class DataValidationActivity : WorkflowActivity
    {
        public string InputVariableName { get; set; }
        public Dictionary<string, Func<object, bool>> ValidationRules { get; set; } = new();
        public Dictionary<string, string> ErrorMessages { get; set; } = new();
        public bool StopOnFirstError { get; set; } = false;
        public string ErrorLogVariableName { get; set; } = "ValidationErrors";

        public override async Task<bool> ExecuteAsync(WorkflowContext context)
        {
            try
            {
                var sourceData = context.GetVariable<DataTable>(InputVariableName);
                if (sourceData == null)
                {
                    context.Logger.LogError($"Source data not found in variable: {InputVariableName}");
                    return false;
                }

                var errors = new List<ValidationError>();
                var rowIndex = 0;

                foreach (DataRow row in sourceData.Rows)
                {
                    rowIndex++;
                    foreach (var rule in ValidationRules)
                    {
                        var columnName = rule.Key;
                        if (!sourceData.Columns.Contains(columnName)) continue;

                        var value = row[columnName];
                        if (!rule.Value(value))
                        {
                            var error = new ValidationError
                            {
                                RowIndex = rowIndex,
                                ColumnName = columnName,
                                Value = value?.ToString(),
                                ErrorMessage = ErrorMessages.TryGetValue(columnName, out var message)
                                    ? message
                                    : $"Validation failed for {columnName}"
                            };

                            errors.Add(error);
                            context.Logger.LogWarning($"Row {rowIndex}: {error.ErrorMessage}");

                            if (StopOnFirstError)
                            {
                                context.SetVariable(ErrorLogVariableName, errors);
                                return false;
                            }
                        }
                    }
                }

                context.SetVariable(ErrorLogVariableName, errors);
                var isValid = !errors.Any();
                
                if (isValid)
                {
                    context.Logger.LogInformation("Data validation completed successfully");
                }
                else
                {
                    context.Logger.LogWarning($"Data validation completed with {errors.Count} errors");
                }

                return isValid;
            }
            catch (Exception ex)
            {
                context.Logger.LogError(ex, "Data validation failed");
                return false;
            }
        }
    }

    public class ValidationError
    {
        public int RowIndex { get; set; }
        public string ColumnName { get; set; }
        public string Value { get; set; }
        public string ErrorMessage { get; set; }
    }
}
