using System;
using System.Collections.Generic;
using System.IO;
using System.Text;
using System.Threading;
using System.Threading.Tasks;

namespace TerraFusion.Core.Documents;

/// <summary>
/// Metadata extracted from a PDF document.
/// </summary>
public class PdfMetadata
{
    public string Title { get; set; } = string.Empty;
    public string Author { get; set; } = string.Empty;
    public DateTime? CreatedDate { get; set; }
    public DateTime? ModifiedDate { get; set; }
    public long FileSizeBytes { get; set; }
}

/// <summary>
/// Extracted content from a PDF document.
/// </summary>
public class PdfDocument
{
    public string Text { get; set; } = string.Empty;
    public Dictionary<string, string> Fields { get; set; } = new();
    public PdfMetadata Metadata { get; set; } = new();
    public int PageCount { get; set; }
}

/// <summary>
/// PDF document connector for extracting text, fields, and metadata
/// from assessment PDF documents. Interface-based for testability.
/// </summary>
public interface IPdfConnector
{
    /// <summary>
    /// Extract full content (text, fields, metadata) from a PDF stream.
    /// </summary>
    Task<PdfDocument> ExtractAsync(Stream pdfStream, CancellationToken ct = default);

    /// <summary>
    /// Extract only metadata from a PDF stream (lightweight operation).
    /// </summary>
    Task<PdfMetadata> GetMetadataAsync(Stream pdfStream, CancellationToken ct = default);
}

/// <summary>
/// Stub implementation of PDF extraction.
/// Returns basic extracted data; real PDF parsing library integration
/// (e.g., PdfPig, iTextSharp) comes in a later phase.
/// </summary>
public class PdfConnector : IPdfConnector
{
    public async Task<PdfDocument> ExtractAsync(
        Stream pdfStream,
        CancellationToken ct = default)
    {
        ct.ThrowIfCancellationRequested();

        // Read stream to determine size
        using var ms = new MemoryStream();
        await pdfStream.CopyToAsync(ms, ct);
        var bytes = ms.ToArray();

        // Stub: attempt basic text extraction from raw bytes
        var rawText = ExtractRawText(bytes);

        return new PdfDocument
        {
            Text = rawText,
            Fields = new Dictionary<string, string>(),
            PageCount = EstimatePageCount(bytes),
            Metadata = new PdfMetadata
            {
                FileSizeBytes = bytes.Length,
                CreatedDate = DateTime.UtcNow,
            },
        };
    }

    public async Task<PdfMetadata> GetMetadataAsync(
        Stream pdfStream,
        CancellationToken ct = default)
    {
        ct.ThrowIfCancellationRequested();

        using var ms = new MemoryStream();
        await pdfStream.CopyToAsync(ms, ct);
        var bytes = ms.ToArray();

        return new PdfMetadata
        {
            FileSizeBytes = bytes.Length,
            CreatedDate = DateTime.UtcNow,
        };
    }

    /// <summary>
    /// Stub text extraction — scans for ASCII-printable sequences in PDF bytes.
    /// Real implementation will use a proper PDF library.
    /// </summary>
    private static string ExtractRawText(byte[] bytes)
    {
        // Very basic: look for text between BT/ET markers (PDF text objects)
        var text = Encoding.ASCII.GetString(bytes);
        var sb = new StringBuilder();

        // Extract any readable text sequences as a placeholder
        foreach (var ch in text)
        {
            if (char.IsLetterOrDigit(ch) || char.IsWhiteSpace(ch) || char.IsPunctuation(ch))
            {
                sb.Append(ch);
            }
        }

        var result = sb.ToString().Trim();
        return string.IsNullOrWhiteSpace(result)
            ? "[PDF text extraction requires a PDF parsing library]"
            : result;
    }

    /// <summary>
    /// Estimate page count by counting page object markers in PDF.
    /// </summary>
    private static int EstimatePageCount(byte[] bytes)
    {
        var text = Encoding.ASCII.GetString(bytes);
        var count = 0;
        var searchIdx = 0;

        while ((searchIdx = text.IndexOf("/Type /Page", searchIdx, StringComparison.Ordinal)) >= 0)
        {
            // Exclude /Type /Pages (the page tree node)
            if (searchIdx + 11 < text.Length && text[searchIdx + 11] != 's')
            {
                count++;
            }
            searchIdx += 11;
        }

        return count > 0 ? count : 1;
    }
}
