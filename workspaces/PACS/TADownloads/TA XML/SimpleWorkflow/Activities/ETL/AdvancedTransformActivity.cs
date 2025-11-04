using System;
using System.Data;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using SimpleWorkflow.Models;
using System.Text.RegularExpressions;

namespace SimpleWorkflow.Activities.ETL
{
    public class AdvancedTransformActivity : WorkflowActivity
    {
        public string InputVariableName { get; set; }
        public string OutputVariableName { get; set; }
        public List<IDataTransformation> Transformations { get; set; } = new();

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

                var transformedData = sourceData.Copy();

                foreach (var transformation in Transformations)
                {
                    transformation.Transform(transformedData, context.Logger);
                }

                context.SetVariable(OutputVariableName ?? InputVariableName, transformedData);
                return true;
            }
            catch (Exception ex)
            {
                context.Logger.LogError(ex, "Data transformation failed");
                return false;
            }
        }
    }

    public interface IDataTransformation
    {
        void Transform(DataTable data, ILogger logger);
    }

    public class RegexReplaceTransformation : IDataTransformation
    {
        public string ColumnName { get; set; }
        public string Pattern { get; set; }
        public string Replacement { get; set; }

        public void Transform(DataTable data, ILogger logger)
        {
            if (!data.Columns.Contains(ColumnName)) return;

            var regex = new Regex(Pattern);
            foreach (DataRow row in data.Rows)
            {
                var value = row[ColumnName]?.ToString();
                if (!string.IsNullOrEmpty(value))
                {
                    row[ColumnName] = regex.Replace(value, Replacement);
                }
            }
        }
    }

    public class CaseTransformation : IDataTransformation
    {
        public string ColumnName { get; set; }
        public CaseType CaseType { get; set; }

        public void Transform(DataTable data, ILogger logger)
        {
            if (!data.Columns.Contains(ColumnName)) return;

            foreach (DataRow row in data.Rows)
            {
                var value = row[ColumnName]?.ToString();
                if (!string.IsNullOrEmpty(value))
                {
                    row[ColumnName] = CaseType switch
                    {
                        CaseType.Upper => value.ToUpper(),
                        CaseType.Lower => value.ToLower(),
                        CaseType.Title => System.Globalization.CultureInfo.CurrentCulture.TextInfo.ToTitleCase(value.ToLower()),
                        _ => value
                    };
                }
            }
        }
    }

    public class CalculatedColumnTransformation : IDataTransformation
    {
        public string NewColumnName { get; set; }
        public Type DataType { get; set; }
        public Func<DataRow, object> CalculationExpression { get; set; }

        public void Transform(DataTable data, ILogger logger)
        {
            if (!data.Columns.Contains(NewColumnName))
            {
                data.Columns.Add(NewColumnName, DataType);
            }

            foreach (DataRow row in data.Rows)
            {
                try
                {
                    row[NewColumnName] = CalculationExpression(row);
                }
                catch (Exception ex)
                {
                    logger.LogWarning(ex, $"Calculation failed for row: {row.ItemArray[0]}");
                    row[NewColumnName] = DBNull.Value;
                }
            }
        }
    }

    public class LookupTransformation : IDataTransformation
    {
        public string SourceColumn { get; set; }
        public string TargetColumn { get; set; }
        public Dictionary<string, string> LookupValues { get; set; }
        public string DefaultValue { get; set; }

        public void Transform(DataTable data, ILogger logger)
        {
            if (!data.Columns.Contains(SourceColumn)) return;

            if (!data.Columns.Contains(TargetColumn))
            {
                data.Columns.Add(TargetColumn, typeof(string));
            }

            foreach (DataRow row in data.Rows)
            {
                var sourceValue = row[SourceColumn]?.ToString();
                row[TargetColumn] = LookupValues.TryGetValue(sourceValue ?? "", out var targetValue)
                    ? targetValue
                    : DefaultValue;
            }
        }
    }

    public enum CaseType
    {
        Upper,
        Lower,
        Title
    }
}
