using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using SimpleWorkflow.Models;

namespace SimpleWorkflow.Activities.DataValidation
{
    public class DataValidationActivity : WorkflowActivity
    {
        public Dictionary<string, ValidationRule> ValidationRules { get; set; } = new();
        public bool StopOnFirstFailure { get; set; } = false;

        public override async Task<bool> ExecuteAsync(WorkflowContext context)
        {
            try
            {
                var validationErrors = new List<string>();

                foreach (var rule in ValidationRules)
                {
                    var value = context.GetVariable<object>(rule.Key);
                    var validationResult = await rule.Value.ValidateAsync(value);

                    if (!validationResult.IsValid)
                    {
                        validationErrors.Add($"Validation failed for {rule.Key}: {validationResult.ErrorMessage}");
                        if (StopOnFirstFailure)
                        {
                            break;
                        }
                    }
                }

                if (validationErrors.Any())
                {
                    foreach (var error in validationErrors)
                    {
                        context.Logger.LogError(error);
                    }
                    context.SetVariable("ValidationErrors", validationErrors);
                    return false;
                }

                return true;
            }
            catch (Exception ex)
            {
                context.Logger.LogError(ex, "Data validation failed");
                return false;
            }
        }
    }

    public class ValidationResult
    {
        public bool IsValid { get; set; }
        public string ErrorMessage { get; set; }
    }

    public abstract class ValidationRule
    {
        public abstract Task<ValidationResult> ValidateAsync(object value);
    }

    public class RequiredValidationRule : ValidationRule
    {
        public override Task<ValidationResult> ValidateAsync(object value)
        {
            var isValid = value != null && !string.IsNullOrWhiteSpace(value.ToString());
            return Task.FromResult(new ValidationResult
            {
                IsValid = isValid,
                ErrorMessage = isValid ? null : "Value is required"
            });
        }
    }

    public class RangeValidationRule : ValidationRule
    {
        public double MinValue { get; set; }
        public double MaxValue { get; set; }

        public override Task<ValidationResult> ValidateAsync(object value)
        {
            if (value == null)
            {
                return Task.FromResult(new ValidationResult
                {
                    IsValid = false,
                    ErrorMessage = "Value is null"
                });
            }

            if (!double.TryParse(value.ToString(), out double numericValue))
            {
                return Task.FromResult(new ValidationResult
                {
                    IsValid = false,
                    ErrorMessage = "Value is not a number"
                });
            }

            var isValid = numericValue >= MinValue && numericValue <= MaxValue;
            return Task.FromResult(new ValidationResult
            {
                IsValid = isValid,
                ErrorMessage = isValid ? null : $"Value must be between {MinValue} and {MaxValue}"
            });
        }
    }
}
