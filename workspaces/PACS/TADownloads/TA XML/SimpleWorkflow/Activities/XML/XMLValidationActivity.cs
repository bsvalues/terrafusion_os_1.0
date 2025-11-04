using System;
using System.IO;
using System.Threading.Tasks;
using System.Xml;
using System.Xml.Schema;
using Microsoft.Extensions.Logging;
using SimpleWorkflow.Models;

namespace SimpleWorkflow.Activities.XML
{
    public class XMLValidationActivity : WorkflowActivity
    {
        public string XmlFilePath { get; set; }
        public string XsdSchemaPath { get; set; }
        public bool SaveValidationErrors { get; set; } = true;

        private readonly List<string> validationErrors = new();

        public override async Task<bool> ValidateAsync(WorkflowContext context)
        {
            if (string.IsNullOrEmpty(XmlFilePath))
            {
                context.Logger.LogError("XML file path is required");
                return false;
            }

            if (!File.Exists(XmlFilePath))
            {
                context.Logger.LogError($"XML file not found: {XmlFilePath}");
                return false;
            }

            if (!string.IsNullOrEmpty(XsdSchemaPath) && !File.Exists(XsdSchemaPath))
            {
                context.Logger.LogError($"XSD schema file not found: {XsdSchemaPath}");
                return false;
            }

            return true;
        }

        public override async Task<bool> ExecuteAsync(WorkflowContext context)
        {
            try
            {
                validationErrors.Clear();
                var settings = new XmlReaderSettings
                {
                    Async = true,
                    ValidationType = string.IsNullOrEmpty(XsdSchemaPath) 
                        ? ValidationType.None 
                        : ValidationType.Schema
                };

                if (!string.IsNullOrEmpty(XsdSchemaPath))
                {
                    settings.Schemas.Add(null, XsdSchemaPath);
                    settings.ValidationEventHandler += (sender, e) =>
                    {
                        var error = $"Line {e.Exception.LineNumber}, Position {e.Exception.LinePosition}: {e.Message}";
                        validationErrors.Add(error);
                        context.Logger.LogWarning(error);
                    };
                }

                using var reader = XmlReader.Create(XmlFilePath, settings);
                while (await reader.ReadAsync())
                {
                    // Just read through the document to trigger validation
                }

                if (validationErrors.Any())
                {
                    if (SaveValidationErrors)
                    {
                        context.SetVariable("XMLValidationErrors", validationErrors);
                    }
                    return false;
                }

                // Store the validated XML content in the context
                var xmlContent = await File.ReadAllTextAsync(XmlFilePath);
                context.SetVariable("ValidatedXMLContent", xmlContent);

                return true;
            }
            catch (Exception ex)
            {
                context.Logger.LogError(ex, "XML validation failed");
                return false;
            }
        }
    }
}
