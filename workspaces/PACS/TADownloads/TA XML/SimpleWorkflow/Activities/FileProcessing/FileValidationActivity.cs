using System;
using System.IO;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using SimpleWorkflow.Models;

namespace SimpleWorkflow.Activities.FileProcessing
{
    public class FileValidationActivity : WorkflowActivity
    {
        public string FilePath { get; set; }
        public long MaxFileSizeBytes { get; set; } = 10 * 1024 * 1024; // 10MB default
        public string[] AllowedExtensions { get; set; } = { ".pdf", ".doc", ".docx", ".txt" };

        public override async Task<bool> ValidateAsync(WorkflowContext context)
        {
            if (string.IsNullOrEmpty(FilePath))
            {
                context.Logger.LogError("FilePath is required");
                return false;
            }

            return true;
        }

        public override async Task<bool> ExecuteAsync(WorkflowContext context)
        {
            try
            {
                if (!File.Exists(FilePath))
                {
                    context.Logger.LogError($"File not found: {FilePath}");
                    return false;
                }

                var fileInfo = new FileInfo(FilePath);
                var extension = fileInfo.Extension.ToLower();

                // Check file size
                if (fileInfo.Length > MaxFileSizeBytes)
                {
                    context.Logger.LogError($"File size ({fileInfo.Length} bytes) exceeds maximum allowed size ({MaxFileSizeBytes} bytes)");
                    return false;
                }

                // Check file extension
                if (!Array.Exists(AllowedExtensions, ext => ext.ToLower() == extension))
                {
                    context.Logger.LogError($"File extension {extension} is not allowed. Allowed extensions: {string.Join(", ", AllowedExtensions)}");
                    return false;
                }

                context.SetVariable("ValidatedFilePath", FilePath);
                context.SetVariable("FileSize", fileInfo.Length);
                context.SetVariable("FileExtension", extension);

                return true;
            }
            catch (Exception ex)
            {
                context.Logger.LogError(ex, "File validation failed");
                return false;
            }
        }
    }
}
