using Microsoft.AspNetCore.Http;

namespace DatabaseProjectpacs_oltp.Services.FileProcessing;

public interface IFileProcessingService
{
    Task<string> UploadFileAsync(IFormFile file, string containerName);
    Task<byte[]> DownloadFileAsync(string blobName, string containerName);
    Task DeleteFileAsync(string blobName, string containerName);
    Task ProcessFileAsync(string blobName, string containerName);
} 