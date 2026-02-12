using System;
using System.IO;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using SimpleWorkflow.Models;

namespace SimpleWorkflow.Activities.FileProcessing
{
    public class FileBackupActivity : WorkflowActivity
    {
        public string SourcePath { get; set; }
        public string BackupDirectory { get; set; }
        public bool CreateTimestampedCopy { get; set; } = true;

        public override async Task<bool> ExecuteAsync(WorkflowContext context)
        {
            try
            {
                var sourceFile = new FileInfo(SourcePath);
                if (!sourceFile.Exists)
                {
                    context.Logger.LogError($"Source file not found: {SourcePath}");
                    return false;
                }

                // Create backup directory if it doesn't exist
                Directory.CreateDirectory(BackupDirectory);

                string backupPath;
                if (CreateTimestampedCopy)
                {
                    var timestamp = DateTime.Now.ToString("yyyyMMdd_HHmmss");
                    backupPath = Path.Combine(BackupDirectory, 
                        $"{Path.GetFileNameWithoutExtension(sourceFile.Name)}_{timestamp}{sourceFile.Extension}");
                }
                else
                {
                    backupPath = Path.Combine(BackupDirectory, sourceFile.Name);
                }

                await Task.Run(() => File.Copy(sourceFile.FullName, backupPath, true));
                
                context.SetVariable("BackupFilePath", backupPath);
                context.Logger.LogInformation($"File backed up to: {backupPath}");
                
                return true;
            }
            catch (Exception ex)
            {
                context.Logger.LogError(ex, "File backup failed");
                return false;
            }
        }
    }
}
