using System;
using System.Data;
using System.Threading.Tasks;
using System.Xml;
using Microsoft.Extensions.Logging;
using SimpleWorkflow.Models;

namespace SimpleWorkflow.Activities.ETL
{
    public class XMLToDataTableActivity : WorkflowActivity
    {
        public string XmlFilePath { get; set; }
        public string RootElementPath { get; set; }
        public string RowElementPath { get; set; }
        public Dictionary<string, string> ColumnMappings { get; set; } = new();
        public string OutputVariableName { get; set; } = "ExtractedData";

        public override async Task<bool> ValidateAsync(WorkflowContext context)
        {
            if (string.IsNullOrEmpty(XmlFilePath))
            {
                context.Logger.LogError("XML file path is required");
                return false;
            }

            if (string.IsNullOrEmpty(RowElementPath))
            {
                context.Logger.LogError("Row element path is required");
                return false;
            }

            return true;
        }

        public override async Task<bool> ExecuteAsync(WorkflowContext context)
        {
            try
            {
                var dataTable = new DataTable();
                var xmlDoc = new XmlDocument();
                await Task.Run(() => xmlDoc.Load(XmlFilePath));

                var nsManager = new XmlNamespaceManager(xmlDoc.NameTable);
                var rootNode = string.IsNullOrEmpty(RootElementPath) 
                    ? xmlDoc.DocumentElement 
                    : xmlDoc.SelectSingleNode(RootElementPath, nsManager);

                if (rootNode == null)
                {
                    context.Logger.LogError("Root element not found");
                    return false;
                }

                var rows = rootNode.SelectNodes(RowElementPath, nsManager);
                if (rows == null || rows.Count == 0)
                {
                    context.Logger.LogWarning("No data rows found in XML");
                    return false;
                }

                // Initialize columns from the first row
                var firstRow = rows[0];
                foreach (XmlNode child in firstRow.ChildNodes)
                {
                    if (child.NodeType == XmlNodeType.Element)
                    {
                        var columnName = ColumnMappings.TryGetValue(child.Name, out var mappedName) 
                            ? mappedName 
                            : child.Name;
                        dataTable.Columns.Add(columnName, typeof(string));
                    }
                }

                // Process all rows
                foreach (XmlNode row in rows)
                {
                    var dataRow = dataTable.NewRow();
                    foreach (XmlNode child in row.ChildNodes)
                    {
                        if (child.NodeType == XmlNodeType.Element)
                        {
                            var columnName = ColumnMappings.TryGetValue(child.Name, out var mappedName) 
                                ? mappedName 
                                : child.Name;
                            if (dataTable.Columns.Contains(columnName))
                            {
                                dataRow[columnName] = child.InnerText;
                            }
                        }
                    }
                    dataTable.Rows.Add(dataRow);
                }

                context.SetVariable(OutputVariableName, dataTable);
                context.Logger.LogInformation($"Extracted {dataTable.Rows.Count} rows from XML to DataTable");
                return true;
            }
            catch (Exception ex)
            {
                context.Logger.LogError(ex, "XML to DataTable conversion failed");
                return false;
            }
        }
    }
}
