using System;
using System.IO;
using System.Threading.Tasks;
using System.Xml;
using System.Xml.Xsl;
using Microsoft.Extensions.Logging;
using SimpleWorkflow.Models;

namespace SimpleWorkflow.Activities.XML
{
    public class XMLTransformActivity : WorkflowActivity
    {
        public string InputXmlPath { get; set; }
        public string XsltPath { get; set; }
        public string OutputPath { get; set; }
        public Dictionary<string, string> Parameters { get; set; } = new();

        public override async Task<bool> ValidateAsync(WorkflowContext context)
        {
            if (string.IsNullOrEmpty(InputXmlPath) || !File.Exists(InputXmlPath))
            {
                context.Logger.LogError($"Input XML file not found: {InputXmlPath}");
                return false;
            }

            if (string.IsNullOrEmpty(XsltPath) || !File.Exists(XsltPath))
            {
                context.Logger.LogError($"XSLT file not found: {XsltPath}");
                return false;
            }

            if (string.IsNullOrEmpty(OutputPath))
            {
                context.Logger.LogError("Output path is required");
                return false;
            }

            return true;
        }

        public override async Task<bool> ExecuteAsync(WorkflowContext context)
        {
            try
            {
                // Create output directory if it doesn't exist
                var outputDir = Path.GetDirectoryName(OutputPath);
                if (!string.IsNullOrEmpty(outputDir))
                {
                    Directory.CreateDirectory(outputDir);
                }

                var xslt = new XslCompiledTransform();
                xslt.Load(XsltPath);

                var xsltSettings = new XsltSettings
                {
                    EnableScript = false // For security
                };

                var xmlSettings = new XmlReaderSettings
                {
                    Async = true,
                    DtdProcessing = DtdProcessing.Prohibit // For security
                };

                var xsltArguments = new XsltArgumentList();
                foreach (var param in Parameters)
                {
                    xsltArguments.AddParam(param.Key, "", param.Value);
                }

                using var inputReader = XmlReader.Create(InputXmlPath, xmlSettings);
                using var outputWriter = XmlWriter.Create(OutputPath, new XmlWriterSettings
                {
                    Indent = true,
                    Async = true
                });

                xslt.Transform(inputReader, xsltArguments, outputWriter);

                context.SetVariable("TransformedXMLPath", OutputPath);
                context.Logger.LogInformation($"XML transformed successfully to: {OutputPath}");

                return true;
            }
            catch (Exception ex)
            {
                context.Logger.LogError(ex, "XML transformation failed");
                return false;
            }
        }
    }
}
