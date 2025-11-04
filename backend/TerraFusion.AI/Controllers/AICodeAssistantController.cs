/**
 * AICodeAssistantController - API Endpoints for AI Code Assistant
 *
 * Production-ready ASP.NET Core controller providing REST API endpoints
 * for AI-powered code completion, cell suggestions, and intelligent assistance.
 *
 * @author TerraFusion Elite Government OS Engineering Agent
 * @version 2.0.0 - Phase 2 Week 6 Day 1
 */

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using TerraFusion.AI.Services;
using Microsoft.Extensions.Logging;

namespace TerraFusion.AI.Controllers
{
    /// <summary>
    /// API controller for AI-powered code assistance features
    /// </summary>
    [ApiController]
    [Route("api/ai")]
    [Authorize]
    public class AICodeAssistantController : ControllerBase
    {
        private readonly IAICodeCompletionService _completionService;
        private readonly ILogger<AICodeAssistantController> _logger;

        public AICodeAssistantController(
            IAICodeCompletionService completionService,
            ILogger<AICodeAssistantController> logger)
        {
            _completionService = completionService;
            _logger = logger;
        }

        /// <summary>
        /// Get AI-powered code completions
        /// </summary>
        /// <param name="request">Completion request with code context</param>
        /// <param name="cancellationToken">Cancellation token</param>
        /// <returns>Completion suggestions</returns>
        [HttpPost("completions")]
        [ProducesResponseType(typeof(CompletionResult), 200)]
        [ProducesResponseType(400)]
        [ProducesResponseType(500)]
        public async Task<IActionResult> GetCompletions(
            [FromBody] CompletionRequest request,
            CancellationToken cancellationToken = default)
        {
            try
            {
                _logger.LogInformation("Completion request received for {Language} at position {Position}",
                    request.Language, request.CursorPosition);

                if (string.IsNullOrEmpty(request.Code))
                {
                    return BadRequest(new { error = "Code is required" });
                }

                if (string.IsNullOrEmpty(request.Language))
                {
                    return BadRequest(new { error = "Language is required" });
                }

                var result = await _completionService.GetCompletionsAsync(request, cancellationToken);

                _logger.LogInformation("Returned {Count} completions in {Time}ms",
                    result.Suggestions.Count, result.ProcessingTime.TotalMilliseconds);

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing completion request");
                return StatusCode(500, new { error = "Internal server error", message = ex.Message });
            }
        }

        /// <summary>
        /// Get contextual code suggestions based on notebook state
        /// </summary>
        /// <param name="request">Contextual suggestion request</param>
        /// <param name="cancellationToken">Cancellation token</param>
        /// <returns>Contextual suggestions</returns>
        [HttpPost("contextual-suggestions")]
        [ProducesResponseType(typeof(List<CompletionSuggestion>), 200)]
        [ProducesResponseType(400)]
        [ProducesResponseType(500)]
        public async Task<IActionResult> GetContextualSuggestions(
            [FromBody] ContextualSuggestionRequest request,
            CancellationToken cancellationToken = default)
        {
            try
            {
                _logger.LogInformation("Contextual suggestion request for {Language}", request.Language);

                if (string.IsNullOrEmpty(request.Code))
                {
                    return BadRequest(new { error = "Code is required" });
                }

                var suggestions = await _completionService.GetContextualSuggestionsAsync(
                    request.Code,
                    request.Language,
                    cancellationToken);

                _logger.LogInformation("Returned {Count} contextual suggestions", suggestions.Count);

                return Ok(suggestions);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error generating contextual suggestions");
                return StatusCode(500, new { error = "Internal server error", message = ex.Message });
            }
        }

        /// <summary>
        /// Get AI suggestion for next cell based on notebook history
        /// </summary>
        /// <param name="request">Cell suggestion request</param>
        /// <param name="cancellationToken">Cancellation token</param>
        /// <returns>Next cell suggestion</returns>
        [HttpPost("next-cell-suggestion")]
        [ProducesResponseType(typeof(CompletionSuggestion), 200)]
        [ProducesResponseType(204)]
        [ProducesResponseType(400)]
        [ProducesResponseType(500)]
        public async Task<IActionResult> GetNextCellSuggestion(
            [FromBody] NextCellRequest request,
            CancellationToken cancellationToken = default)
        {
            try
            {
                _logger.LogInformation("Next cell suggestion request for {Language} with {CellCount} previous cells",
                    request.Language, request.PreviousCells.Count);

                if (request.PreviousCells == null || request.PreviousCells.Count == 0)
                {
                    return NoContent();
                }

                var suggestion = await _completionService.GetNextCellSuggestionAsync(
                    request.PreviousCells,
                    request.Language,
                    cancellationToken);

                if (suggestion == null)
                {
                    return NoContent();
                }

                _logger.LogInformation("Returned next cell suggestion: {Suggestion}", suggestion.Text);

                return Ok(suggestion);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error generating next cell suggestion");
                return StatusCode(500, new { error = "Internal server error", message = ex.Message });
            }
        }

        /// <summary>
        /// Get full cell suggestions based on notebook context
        /// </summary>
        /// <param name="request">Cell suggestions request</param>
        /// <param name="cancellationToken">Cancellation token</param>
        /// <returns>List of cell suggestions</returns>
        [HttpPost("cell-suggestions")]
        [ProducesResponseType(typeof(List<CellSuggestionDto>), 200)]
        [ProducesResponseType(400)]
        [ProducesResponseType(500)]
        public async Task<IActionResult> GetCellSuggestions(
            [FromBody] CellSuggestionsRequest request,
            CancellationToken cancellationToken = default)
        {
            try
            {
                _logger.LogInformation("Cell suggestions request for {Language} with {CellCount} cells",
                    request.Language, request.Cells.Count);

                var suggestions = await GenerateCellSuggestionsAsync(request, cancellationToken);

                _logger.LogInformation("Returned {Count} cell suggestions", suggestions.Count);

                return Ok(suggestions);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error generating cell suggestions");
                return StatusCode(500, new { error = "Internal server error", message = ex.Message });
            }
        }

        // ==================== PRIVATE METHODS ====================

        private async Task<List<CellSuggestionDto>> GenerateCellSuggestionsAsync(
            CellSuggestionsRequest request,
            CancellationToken cancellationToken)
        {
            await Task.CompletedTask; // Placeholder for async ML model

            var suggestions = new List<CellSuggestionDto>();

            // Analyze notebook state
            var hasImports = request.ImportedModules.Count > 0;
            var hasDataFrames = request.DataFrames.Count > 0;
            var lastCellType = DetermineLastCellType(request.Cells.LastOrDefault() ?? "");

            // Generate suggestions based on workflow stage
            if (!hasImports)
            {
                suggestions.Add(new CellSuggestionDto
                {
                    Id = Guid.NewGuid().ToString(),
                    Title = "Import Essential Libraries",
                    Description = "Import NumPy, Pandas, and Matplotlib for data analysis",
                    Code = "import numpy as np\nimport pandas as pd\nimport matplotlib.pyplot as plt\n\nprint(\"Libraries imported successfully!\")",
                    Language = request.Language,
                    Category = "import",
                    Confidence = 95,
                    Reasoning = "No libraries imported yet. These are essential for data science.",
                    Tags = new List<string> { "numpy", "pandas", "matplotlib" }
                });
            }

            if (hasImports && !hasDataFrames)
            {
                suggestions.Add(new CellSuggestionDto
                {
                    Id = Guid.NewGuid().ToString(),
                    Title = "Load Dataset",
                    Description = "Load data from a CSV file into a Pandas DataFrame",
                    Code = "# Load your dataset\ndf = pd.read_csv('data.csv')\nprint(f\"Loaded {len(df)} rows and {len(df.columns)} columns\")\ndf.head()",
                    Language = request.Language,
                    Category = "exploration",
                    Confidence = 90,
                    Reasoning = "Libraries imported but no data loaded yet.",
                    Dependencies = new List<string> { "pandas" },
                    Tags = new List<string> { "data-loading", "csv" }
                });
            }

            if (hasDataFrames && lastCellType == "data-load")
            {
                var dfName = request.DataFrames.First();

                suggestions.Add(new CellSuggestionDto
                {
                    Id = Guid.NewGuid().ToString(),
                    Title = "Explore Data Structure",
                    Description = "Get information about your dataset",
                    Code = $"# Explore the dataset\nprint(\"Dataset Info:\")\nprint(\"-\" * 50)\n{dfName}.info()\nprint(\"\\nStatistical Summary:\")\nprint(\"-\" * 50)\n{dfName}.describe()",
                    Language = request.Language,
                    Category = "exploration",
                    Confidence = 95,
                    Reasoning = "Data just loaded. Next step is typically to explore its structure.",
                    Tags = new List<string> { "exploration", "info", "describe" }
                });

                suggestions.Add(new CellSuggestionDto
                {
                    Id = Guid.NewGuid().ToString(),
                    Title = "Check for Missing Values",
                    Description = "Identify and visualize missing data",
                    Code = $"# Check for missing values\nmissing = {dfName}.isnull().sum()\nmissing_pct = 100 * {dfName}.isnull().sum() / len({dfName})\nmissing_data = pd.DataFrame({{'Missing': missing, 'Percent': missing_pct}})\nprint(missing_data[missing_data['Missing'] > 0].sort_values('Percent', ascending=False))",
                    Language = request.Language,
                    Category = "exploration",
                    Confidence = 85,
                    Reasoning = "Important to check data quality before analysis.",
                    Tags = new List<string> { "missing-values", "data-quality" }
                });
            }

            return suggestions.Take(5).ToList();
        }

        private string DetermineLastCellType(string cellCode)
        {
            if (cellCode.Contains("import")) return "import";
            if (cellCode.Contains("read_csv") || cellCode.Contains("read_excel")) return "data-load";
            if (cellCode.Contains(".info()") || cellCode.Contains(".describe()") || cellCode.Contains(".head()")) return "exploration";
            if (cellCode.Contains("plt.") || cellCode.Contains("plot") || cellCode.Contains("sns.")) return "visualization";
            if (cellCode.Contains("fillna") || cellCode.Contains("dropna") || cellCode.Contains("transform")) return "transformation";

            return "unknown";
        }
    }

    // ==================== REQUEST/RESPONSE MODELS ====================

    public class ContextualSuggestionRequest
    {
        public string Code { get; set; } = string.Empty;
        public string Language { get; set; } = "python";
    }

    public class NextCellRequest
    {
        public List<string> PreviousCells { get; set; } = new();
        public string Language { get; set; } = "python";
    }

    public class CellSuggestionsRequest
    {
        public List<string> Cells { get; set; } = new();
        public string Language { get; set; } = "python";
        public List<string> ImportedModules { get; set; } = new();
        public List<string> DefinedVariables { get; set; } = new();
        public List<string> DataFrames { get; set; } = new();
    }

    public class CellSuggestionDto
    {
        public string Id { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string Code { get; set; } = string.Empty;
        public string Language { get; set; } = "python";
        public string Category { get; set; } = "exploration";
        public int Confidence { get; set; }
        public string Reasoning { get; set; } = string.Empty;
        public List<string>? Dependencies { get; set; }
        public List<string>? Tags { get; set; }
    }
}
