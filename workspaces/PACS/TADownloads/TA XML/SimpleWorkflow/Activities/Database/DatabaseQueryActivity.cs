using System;
using System.Data;
using System.Data.Common;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using SimpleWorkflow.Models;
using Dapper;

namespace SimpleWorkflow.Activities.Database
{
    public class DatabaseQueryActivity : WorkflowActivity
    {
        public string ConnectionString { get; set; }
        public string ProviderName { get; set; } = "System.Data.SqlClient";
        public string Query { get; set; }
        public object Parameters { get; set; }
        public bool StoreResults { get; set; } = true;
        public string ResultVariableName { get; set; } = "QueryResults";
        public CommandType CommandType { get; set; } = CommandType.Text;
        public int CommandTimeout { get; set; } = 30;

        public override async Task<bool> ValidateAsync(WorkflowContext context)
        {
            if (string.IsNullOrEmpty(ConnectionString))
            {
                context.Logger.LogError("Connection string is required");
                return false;
            }

            if (string.IsNullOrEmpty(Query))
            {
                context.Logger.LogError("Query is required");
                return false;
            }

            return true;
        }

        public override async Task<bool> ExecuteAsync(WorkflowContext context)
        {
            try
            {
                var factory = DbProviderFactories.GetFactory(ProviderName);
                using var connection = factory.CreateConnection();
                connection.ConnectionString = ConnectionString;

                await connection.OpenAsync();

                var commandDefinition = new CommandDefinition(
                    Query,
                    Parameters,
                    commandTimeout: CommandTimeout,
                    commandType: CommandType
                );

                if (StoreResults)
                {
                    // Query multiple result sets if needed
                    using var multi = await connection.QueryMultipleAsync(commandDefinition);
                    var results = new List<dynamic>();
                    
                    while (!multi.IsConsumed)
                    {
                        var result = await multi.ReadAsync();
                        results.Add(result);
                    }

                    context.SetVariable(ResultVariableName, results);
                    context.Logger.LogInformation($"Query executed successfully. {results.Count} result sets stored in {ResultVariableName}");
                }
                else
                {
                    // Execute non-query
                    var rowsAffected = await connection.ExecuteAsync(commandDefinition);
                    context.Logger.LogInformation($"Query executed successfully. {rowsAffected} rows affected.");
                }

                return true;
            }
            catch (Exception ex)
            {
                context.Logger.LogError(ex, "Database query failed");
                return false;
            }
        }
    }
}
