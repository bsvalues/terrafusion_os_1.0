using System;
using System.Data;
using System.Threading.Tasks;
using Microsoft.Data.SqlClient;
using Microsoft.Extensions.Logging;
using SimpleWorkflow.Models;

namespace SimpleWorkflow.Activities.Database
{
    public class DatabaseBulkCopyActivity : WorkflowActivity
    {
        public string ConnectionString { get; set; }
        public string DestinationTableName { get; set; }
        public DataTable SourceData { get; set; }
        public int BatchSize { get; set; } = 1000;
        public int BulkCopyTimeout { get; set; } = 600;
        public bool KeepIdentity { get; set; } = false;
        public Dictionary<string, string> ColumnMappings { get; set; } = new();

        public override async Task<bool> ValidateAsync(WorkflowContext context)
        {
            if (string.IsNullOrEmpty(ConnectionString))
            {
                context.Logger.LogError("Connection string is required");
                return false;
            }

            if (string.IsNullOrEmpty(DestinationTableName))
            {
                context.Logger.LogError("Destination table name is required");
                return false;
            }

            if (SourceData == null || SourceData.Rows.Count == 0)
            {
                context.Logger.LogError("Source data is required and must not be empty");
                return false;
            }

            return true;
        }

        public override async Task<bool> ExecuteAsync(WorkflowContext context)
        {
            try
            {
                using var connection = new SqlConnection(ConnectionString);
                await connection.OpenAsync();

                using var bulkCopy = new SqlBulkCopy(connection)
                {
                    DestinationTableName = DestinationTableName,
                    BatchSize = BatchSize,
                    BulkCopyTimeout = BulkCopyTimeout,
                    KeepIdentity = KeepIdentity
                };

                // Set up column mappings
                if (ColumnMappings.Any())
                {
                    foreach (var mapping in ColumnMappings)
                    {
                        bulkCopy.ColumnMappings.Add(mapping.Key, mapping.Value);
                    }
                }
                else
                {
                    // Auto-map columns by name
                    foreach (DataColumn column in SourceData.Columns)
                    {
                        bulkCopy.ColumnMappings.Add(column.ColumnName, column.ColumnName);
                    }
                }

                // Set up progress notification
                var totalRows = SourceData.Rows.Count;
                bulkCopy.NotifyAfter = BatchSize;
                bulkCopy.SqlRowsCopied += (sender, e) =>
                {
                    var progress = (int)((e.RowsCopied * 100) / totalRows);
                    context.Logger.LogInformation($"Bulk copy progress: {progress}% ({e.RowsCopied}/{totalRows} rows)");
                };

                await bulkCopy.WriteToServerAsync(SourceData);
                context.Logger.LogInformation($"Bulk copy completed. {totalRows} rows copied to {DestinationTableName}");

                return true;
            }
            catch (Exception ex)
            {
                context.Logger.LogError(ex, "Bulk copy operation failed");
                return false;
            }
        }
    }
}
