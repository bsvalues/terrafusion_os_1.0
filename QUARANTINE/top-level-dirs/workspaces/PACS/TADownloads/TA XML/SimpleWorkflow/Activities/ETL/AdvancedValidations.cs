using System;
using System.Data;
using System.Linq;
using System.Text.RegularExpressions;
using Microsoft.Extensions.Logging;

namespace SimpleWorkflow.Activities.ETL
{
    public class CrossColumnValidation : IDataValidation
    {
        public string[] Columns { get; set; }
        public Func<object[], bool> ValidationRule { get; set; }
        public string ErrorMessage { get; set; }

        public ValidationResult Validate(DataRow row, ILogger logger)
        {
            try
            {
                var values = Columns.Select(c => row[c]).ToArray();
                if (!ValidationRule(values))
                {
                    return new ValidationResult
                    {
                        IsValid = false,
                        ErrorMessage = ErrorMessage,
                        AffectedColumns = Columns
                    };
                }
                return ValidationResult.Success;
            }
            catch (Exception ex)
            {
                logger.LogError(ex, $"Cross-column validation failed: {ErrorMessage}");
                return new ValidationResult
                {
                    IsValid = false,
                    ErrorMessage = $"Validation error: {ex.Message}",
                    AffectedColumns = Columns
                };
            }
        }
    }

    public class BusinessRuleValidation : IDataValidation
    {
        public string Column { get; set; }
        public Func<DataRow, bool> BusinessRule { get; set; }
        public string ErrorMessage { get; set; }

        public ValidationResult Validate(DataRow row, ILogger logger)
        {
            try
            {
                if (!BusinessRule(row))
                {
                    return new ValidationResult
                    {
                        IsValid = false,
                        ErrorMessage = ErrorMessage,
                        AffectedColumns = new[] { Column }
                    };
                }
                return ValidationResult.Success;
            }
            catch (Exception ex)
            {
                logger.LogError(ex, $"Business rule validation failed: {ErrorMessage}");
                return new ValidationResult
                {
                    IsValid = false,
                    ErrorMessage = $"Validation error: {ex.Message}",
                    AffectedColumns = new[] { Column }
                };
            }
        }
    }

    public class DataTypeValidation : IDataValidation
    {
        public string Column { get; set; }
        public Type ExpectedType { get; set; }
        public bool AllowNull { get; set; }
        public string Format { get; set; }

        public ValidationResult Validate(DataRow row, ILogger logger)
        {
            try
            {
                var value = row[Column];
                
                if (value == DBNull.Value || value == null)
                {
                    return AllowNull ? 
                        ValidationResult.Success : 
                        new ValidationResult
                        {
                            IsValid = false,
                            ErrorMessage = $"Column {Column} cannot be null",
                            AffectedColumns = new[] { Column }
                        };
                }

                if (ExpectedType == typeof(DateTime) && !string.IsNullOrEmpty(Format))
                {
                    if (!DateTime.TryParseExact(value.ToString(), Format, null, 
                        System.Globalization.DateTimeStyles.None, out _))
                    {
                        return new ValidationResult
                        {
                            IsValid = false,
                            ErrorMessage = $"Invalid date format in {Column}. Expected format: {Format}",
                            AffectedColumns = new[] { Column }
                        };
                    }
                }
                else if (!Convert.ChangeType(value, ExpectedType).Equals(value))
                {
                    return new ValidationResult
                    {
                        IsValid = false,
                        ErrorMessage = $"Invalid data type in {Column}. Expected {ExpectedType.Name}",
                        AffectedColumns = new[] { Column }
                    };
                }

                return ValidationResult.Success;
            }
            catch (Exception ex)
            {
                logger.LogError(ex, $"Data type validation failed for column {Column}");
                return new ValidationResult
                {
                    IsValid = false,
                    ErrorMessage = $"Validation error: {ex.Message}",
                    AffectedColumns = new[] { Column }
                };
            }
        }
    }

    public class RangeValidation : IDataValidation
    {
        public string Column { get; set; }
        public object MinValue { get; set; }
        public object MaxValue { get; set; }
        public bool InclusiveMin { get; set; } = true;
        public bool InclusiveMax { get; set; } = true;

        public ValidationResult Validate(DataRow row, ILogger logger)
        {
            try
            {
                var value = row[Column];
                if (value == DBNull.Value || value == null)
                {
                    return ValidationResult.Success;
                }

                var comparable = value as IComparable;
                var minComparable = MinValue as IComparable;
                var maxComparable = MaxValue as IComparable;

                if (comparable == null || minComparable == null || maxComparable == null)
                {
                    throw new InvalidOperationException("Values must implement IComparable");
                }

                var minCheck = InclusiveMin ? 
                    comparable.CompareTo(minComparable) >= 0 : 
                    comparable.CompareTo(minComparable) > 0;

                var maxCheck = InclusiveMax ? 
                    comparable.CompareTo(maxComparable) <= 0 : 
                    comparable.CompareTo(maxComparable) < 0;

                if (!minCheck || !maxCheck)
                {
                    return new ValidationResult
                    {
                        IsValid = false,
                        ErrorMessage = $"Value in {Column} must be between {MinValue} and {MaxValue}",
                        AffectedColumns = new[] { Column }
                    };
                }

                return ValidationResult.Success;
            }
            catch (Exception ex)
            {
                logger.LogError(ex, $"Range validation failed for column {Column}");
                return new ValidationResult
                {
                    IsValid = false,
                    ErrorMessage = $"Validation error: {ex.Message}",
                    AffectedColumns = new[] { Column }
                };
            }
        }
    }

    public interface IDataValidation
    {
        ValidationResult Validate(DataRow row, ILogger logger);
    }

    public class ValidationResult
    {
        public bool IsValid { get; set; }
        public string ErrorMessage { get; set; }
        public string[] AffectedColumns { get; set; }

        public static ValidationResult Success => new() { IsValid = true };
    }
}
