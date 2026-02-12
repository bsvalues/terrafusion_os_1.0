using System;
using System.Data;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using SimpleWorkflow.Models;

namespace SimpleWorkflow.Activities.ETL
{
    public class DataCleansingActivity : WorkflowActivity
    {
        public string InputVariableName { get; set; }
        public string OutputVariableName { get; set; }
        public bool TrimStrings { get; set; } = true;
        public bool RemoveSpecialCharacters { get; set; } = true;
        public bool StandardizeDates { get; set; } = true;
        public string DateFormat { get; set; } = "yyyy-MM-dd";
        public Dictionary<string, string> ValueMappings { get; set; } = new();
        public HashSet<string> ColumnsToClean { get; set; } = new();

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

                var cleanedData = sourceData.Copy();
                var columnsToProcess = ColumnsToClean.Any() 
                    ? ColumnsToClean 
                    : sourceData.Columns.Cast<DataColumn>().Select(c => c.ColumnName).ToHashSet();

                foreach (DataRow row in cleanedData.Rows)
                {
                    foreach (var columnName in columnsToProcess)
                    {
                        if (!cleanedData.Columns.Contains(columnName)) continue;

                        var value = row[columnName];
                        if (value == DBNull.Value) continue;

                        if (value is string strValue)
                        {
                            if (TrimStrings)
                            {
                                strValue = strValue.Trim();
                            }

                            if (RemoveSpecialCharacters)
                            {
                                strValue = Regex.Replace(strValue, @"[^\w\s-]", "");
                            }

                            if (ValueMappings.ContainsKey(strValue))
                            {
                                strValue = ValueMappings[strValue];
                            }

                            row[columnName] = strValue;
                        }
                        else if (StandardizeDates && value is DateTime dateValue)
                        {
                            row[columnName] = dateValue.ToString(DateFormat);
                        }
                    }
                }

                context.SetVariable(OutputVariableName ?? InputVariableName, cleanedData);
                context.Logger.LogInformation($"Data cleansing completed. Processed {cleanedData.Rows.Count} rows.");
                return true;
            }
            catch (Exception ex)
            {
                context.Logger.LogError(ex, "Data cleansing failed");
                return false;
            }
        }
    }
}
