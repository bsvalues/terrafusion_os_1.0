/*
 * AICodeCompletionService - Intelligent Code Completion Engine
 *
 * Production-ready AI service providing context-aware code completion,
 * intelligent suggestions, and predictive text for Python and JavaScript.
 *
 * @author TerraFusion Elite Government OS Engineering Agent
 * @version 2.0.0 - Phase 2 Week 6 Day 1
 */

using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.RegularExpressions;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using TerraFusion.AI.Models;

namespace TerraFusion.AI.Services
{
    // ==================== MODELS ====================

    public class CompletionRequest
    {
        public string Language { get; set; } = "python";
        public string Code { get; set; } = string.Empty;
        public int CursorPosition { get; set; }
        public string CurrentLine { get; set; } = string.Empty;
        public List<string> ImportedModules { get; set; } = new();
        public List<string> DefinedVariables { get; set; } = new();
        public List<string> DefinedFunctions { get; set; } = new();
        public string CellContext { get; set; } = string.Empty;
    }

    public class CompletionSuggestion
    {
        public string Text { get; set; } = string.Empty;
        public string DisplayText { get; set; } = string.Empty;
        public string Type { get; set; } = "keyword"; // keyword, function, variable, module, method
        public string Description { get; set; } = string.Empty;
        public int Score { get; set; }
        public string InsertText { get; set; } = string.Empty;
        public int CursorOffset { get; set; } // Where to place cursor after insertion
        public bool RequiresImport { get; set; }
        public string ImportStatement { get; set; } = string.Empty;
    }

    public class CompletionResult
    {
        public List<CompletionSuggestion> Suggestions { get; set; } = new();
        public string Prefix { get; set; } = string.Empty;
        public int StartPosition { get; set; }
        public int EndPosition { get; set; }
        public TimeSpan ProcessingTime { get; set; }
        public string Language { get; set; } = string.Empty;
    }

    // ==================== SERVICE ====================

    public interface IAICodeCompletionService
    {
        Task<CompletionResult> GetCompletionsAsync(CompletionRequest request, CancellationToken cancellationToken = default);
        Task<List<CompletionSuggestion>> GetContextualSuggestionsAsync(string code, string language, CancellationToken cancellationToken = default);
        Task<CompletionSuggestion?> GetNextCellSuggestionAsync(List<string> previousCells, string language, CancellationToken cancellationToken = default);
    }

    public class AICodeCompletionService : IAICodeCompletionService
    {
        private readonly ILogger<AICodeCompletionService> _logger;

        // Python standard library and common packages
        private static readonly HashSet<string> PythonKeywords = new()
        {
            "False", "None", "True", "and", "as", "assert", "async", "await",
            "break", "class", "continue", "def", "del", "elif", "else", "except",
            "finally", "for", "from", "global", "if", "import", "in", "is",
            "lambda", "nonlocal", "not", "or", "pass", "raise", "return",
            "try", "while", "with", "yield"
        };

        private static readonly Dictionary<string, List<string>> PythonBuiltins = new()
        {
            ["print"] = new() { "print(*objects, sep=' ', end='\\n', file=sys.stdout)" },
            ["len"] = new() { "len(object)" },
            ["range"] = new() { "range(stop)", "range(start, stop)", "range(start, stop, step)" },
            ["list"] = new() { "list(iterable=())" },
            ["dict"] = new() { "dict(**kwargs)", "dict(mapping, **kwargs)" },
            ["str"] = new() { "str(object='')" },
            ["int"] = new() { "int(x, base=10)" },
            ["float"] = new() { "float(x=0.0)" },
            ["open"] = new() { "open(file, mode='r', encoding=None)" },
            ["enumerate"] = new() { "enumerate(iterable, start=0)" },
            ["zip"] = new() { "zip(*iterables)" },
            ["map"] = new() { "map(function, iterable, ...)" },
            ["filter"] = new() { "filter(function, iterable)" },
            ["sum"] = new() { "sum(iterable, start=0)" },
            ["max"] = new() { "max(iterable, *[, key, default])" },
            ["min"] = new() { "min(iterable, *[, key, default])" },
            ["sorted"] = new() { "sorted(iterable, *, key=None, reverse=False)" },
            ["type"] = new() { "type(object)" },
            ["isinstance"] = new() { "isinstance(object, classinfo)" }
        };

        private static readonly Dictionary<string, List<string>> CommonModules = new()
        {
            ["numpy"] = new() { "array", "zeros", "ones", "arange", "linspace", "reshape", "mean", "std", "sum" },
            ["pandas"] = new() { "DataFrame", "Series", "read_csv", "read_excel", "merge", "concat", "groupby" },
            ["matplotlib.pyplot"] = new() { "plot", "scatter", "bar", "hist", "xlabel", "ylabel", "title", "legend", "show", "figure" },
            ["os"] = new() { "path", "getcwd", "listdir", "mkdir", "remove", "rename", "environ" },
            ["sys"] = new() { "argv", "path", "exit", "version", "platform" },
            ["json"] = new() { "loads", "dumps", "load", "dump" },
            ["datetime"] = new() { "datetime", "date", "time", "timedelta", "now", "strptime", "strftime" },
            ["re"] = new() { "match", "search", "findall", "sub", "compile", "split" },
            ["math"] = new() { "sqrt", "pow", "exp", "log", "sin", "cos", "tan", "pi", "e" },
            ["random"] = new() { "random", "randint", "choice", "shuffle", "sample", "seed" }
        };

        private static readonly Dictionary<string, string> CommonPatterns = new()
        {
            ["for_loop"] = "for item in iterable:\n    ",
            ["for_range"] = "for i in range(n):\n    ",
            ["for_enumerate"] = "for index, item in enumerate(iterable):\n    ",
            ["if_statement"] = "if condition:\n    ",
            ["if_else"] = "if condition:\n    \nelse:\n    ",
            ["try_except"] = "try:\n    \nexcept Exception as e:\n    ",
            ["function_def"] = "def function_name(parameters):\n    ",
            ["class_def"] = "class ClassName:\n    def __init__(self):\n        ",
            ["with_open"] = "with open('filename', 'r') as f:\n    content = f.read()",
            ["list_comprehension"] = "[item for item in iterable if condition]",
            ["dict_comprehension"] = "{key: value for key, value in iterable}",
            ["lambda"] = "lambda x: x"
        };

        // JavaScript keywords and common patterns
        private static readonly HashSet<string> JavaScriptKeywords = new()
        {
            "async", "await", "break", "case", "catch", "class", "const", "continue",
            "debugger", "default", "delete", "do", "else", "export", "extends",
            "finally", "for", "function", "if", "import", "in", "instanceof",
            "let", "new", "return", "static", "super", "switch", "this",
            "throw", "try", "typeof", "var", "void", "while", "with", "yield"
        };

        public AICodeCompletionService(ILogger<AICodeCompletionService> logger)
        {
            _logger = logger;
        }

        // ==================== PUBLIC METHODS ====================

        public async Task<CompletionResult> GetCompletionsAsync(
            CompletionRequest request,
            CancellationToken cancellationToken = default)
        {
            var startTime = DateTime.UtcNow;

            try
            {
                _logger.LogInformation("Processing completion request for {Language} at position {Position}",
                    request.Language, request.CursorPosition);

                var result = new CompletionResult
                {
                    Language = request.Language
                };

                // Extract the prefix (word being typed)
                var prefix = ExtractPrefix(request.Code, request.CursorPosition);
                result.Prefix = prefix;
                result.StartPosition = request.CursorPosition - prefix.Length;
                result.EndPosition = request.CursorPosition;

                // Get suggestions based on language
                var suggestions = request.Language.ToLower() switch
                {
                    "python" => await GetPythonCompletionsAsync(request, prefix, cancellationToken),
                    "javascript" => await GetJavaScriptCompletionsAsync(request, prefix, cancellationToken),
                    _ => new List<CompletionSuggestion>()
                };

                // Sort by score (descending)
                result.Suggestions = suggestions
                    .OrderByDescending(s => s.Score)
                    .Take(20) // Limit to top 20 suggestions
                    .ToList();

                result.ProcessingTime = DateTime.UtcNow - startTime;

                _logger.LogInformation("Generated {Count} completions in {Time}ms",
                    result.Suggestions.Count, result.ProcessingTime.TotalMilliseconds);

                return result;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error generating code completions");
                return new CompletionResult
                {
                    Language = request.Language,
                    ProcessingTime = DateTime.UtcNow - startTime
                };
            }
        }

        public async Task<List<CompletionSuggestion>> GetContextualSuggestionsAsync(
            string code,
            string language,
            CancellationToken cancellationToken = default)
        {
            await Task.CompletedTask; // Async for future ML model integration

            var suggestions = new List<CompletionSuggestion>();

            if (language.ToLower() == "python")
            {
                // Suggest imports if none exist
                if (!code.Contains("import"))
                {
                    suggestions.Add(new CompletionSuggestion
                    {
                        Text = "import numpy as np",
                        DisplayText = "Import NumPy",
                        Type = "module",
                        Description = "Import NumPy for numerical computing",
                        Score = 90,
                        InsertText = "import numpy as np\n"
                    });

                    suggestions.Add(new CompletionSuggestion
                    {
                        Text = "import pandas as pd",
                        DisplayText = "Import Pandas",
                        Type = "module",
                        Description = "Import Pandas for data analysis",
                        Score = 85,
                        InsertText = "import pandas as pd\n"
                    });
                }

                // Suggest data visualization if data processing code exists
                if (code.Contains("DataFrame") || code.Contains("pd.read"))
                {
                    suggestions.Add(new CompletionSuggestion
                    {
                        Text = "import matplotlib.pyplot as plt",
                        DisplayText = "Import Matplotlib",
                        Type = "module",
                        Description = "Add data visualization capabilities",
                        Score = 80,
                        InsertText = "import matplotlib.pyplot as plt\n"
                    });
                }
            }

            return suggestions;
        }

        public async Task<CompletionSuggestion?> GetNextCellSuggestionAsync(
            List<string> previousCells,
            string language,
            CancellationToken cancellationToken = default)
        {
            await Task.CompletedTask;

            if (previousCells.Count == 0) return null;

            var lastCell = previousCells.Last();

            if (language.ToLower() == "python")
            {
                // If last cell imported data, suggest exploration
                if (lastCell.Contains("read_csv") || lastCell.Contains("read_excel"))
                {
                    return new CompletionSuggestion
                    {
                        Text = "df.head()",
                        DisplayText = "Explore Data",
                        Type = "method",
                        Description = "View the first few rows of your data",
                        Score = 95,
                        InsertText = "# Explore the data\ndf.head()"
                    };
                }

                // If last cell showed data head, suggest info or describe
                if (lastCell.Contains(".head()"))
                {
                    return new CompletionSuggestion
                    {
                        Text = "df.info()",
                        DisplayText = "Data Info",
                        Type = "method",
                        Description = "Get information about your data",
                        Score = 90,
                        InsertText = "# Check data information\ndf.info()\ndf.describe()"
                    };
                }

                // If data exploration done, suggest visualization
                if (lastCell.Contains(".describe()") || lastCell.Contains(".info()"))
                {
                    return new CompletionSuggestion
                    {
                        Text = "plt.plot",
                        DisplayText = "Visualize Data",
                        Type = "function",
                        Description = "Create a visualization of your data",
                        Score = 85,
                        InsertText = "# Visualize the data\nplt.figure(figsize=(10, 6))\nplt.plot(df['column'])\nplt.xlabel('X Label')\nplt.ylabel('Y Label')\nplt.title('Title')\nplt.show()"
                    };
                }
            }

            return null;
        }

        // ==================== PRIVATE METHODS ====================

        private async Task<List<CompletionSuggestion>> GetPythonCompletionsAsync(
            CompletionRequest request,
            string prefix,
            CancellationToken cancellationToken)
        {
            await Task.CompletedTask;

            var suggestions = new List<CompletionSuggestion>();

            // Check for module member access (e.g., "np.ar" -> "np.array")
            if (prefix.Contains('.'))
            {
                var parts = prefix.Split('.');
                var moduleName = parts[0];
                var memberPrefix = parts.Length > 1 ? parts[1] : "";

                // Check imported modules
                var fullModuleName = request.ImportedModules
                    .FirstOrDefault(m => m.EndsWith($" as {moduleName}") || m.EndsWith($" {moduleName}"));

                if (fullModuleName != null)
                {
                    var actualModule = fullModuleName.Split(' ').First().Replace("import", "").Trim();

                    if (CommonModules.TryGetValue(actualModule, out var members))
                    {
                        foreach (var member in members)
                        {
                            if (string.IsNullOrEmpty(memberPrefix) || member.StartsWith(memberPrefix, StringComparison.OrdinalIgnoreCase))
                            {
                                suggestions.Add(new CompletionSuggestion
                                {
                                    Text = member,
                                    DisplayText = $"{moduleName}.{member}",
                                    Type = "method",
                                    Description = $"{actualModule} member",
                                    Score = 90,
                                    InsertText = member
                                });
                            }
                        }
                    }
                }

                return suggestions;
            }

            // Python keywords
            foreach (var keyword in PythonKeywords)
            {
                if (keyword.StartsWith(prefix, StringComparison.OrdinalIgnoreCase))
                {
                    suggestions.Add(new CompletionSuggestion
                    {
                        Text = keyword,
                        DisplayText = keyword,
                        Type = "keyword",
                        Description = "Python keyword",
                        Score = 70,
                        InsertText = keyword
                    });
                }
            }

            // Python built-in functions
            foreach (var (name, signatures) in PythonBuiltins)
            {
                if (name.StartsWith(prefix, StringComparison.OrdinalIgnoreCase))
                {
                    suggestions.Add(new CompletionSuggestion
                    {
                        Text = name,
                        DisplayText = $"{name}()",
                        Type = "function",
                        Description = signatures.First(),
                        Score = 85,
                        InsertText = $"{name}()",
                        CursorOffset = -1 // Place cursor inside parentheses
                    });
                }
            }

            // User-defined variables
            foreach (var variable in request.DefinedVariables)
            {
                if (variable.StartsWith(prefix, StringComparison.OrdinalIgnoreCase))
                {
                    suggestions.Add(new CompletionSuggestion
                    {
                        Text = variable,
                        DisplayText = variable,
                        Type = "variable",
                        Description = "User-defined variable",
                        Score = 95, // Prioritize user variables
                        InsertText = variable
                    });
                }
            }

            // User-defined functions
            foreach (var function in request.DefinedFunctions)
            {
                if (function.StartsWith(prefix, StringComparison.OrdinalIgnoreCase))
                {
                    suggestions.Add(new CompletionSuggestion
                    {
                        Text = function,
                        DisplayText = $"{function}()",
                        Type = "function",
                        Description = "User-defined function",
                        Score = 95,
                        InsertText = $"{function}()",
                        CursorOffset = -1
                    });
                }
            }

            // Common patterns based on current context
            if (request.CurrentLine.TrimStart().StartsWith("for") && string.IsNullOrEmpty(prefix))
            {
                suggestions.Add(new CompletionSuggestion
                {
                    Text = "for loop",
                    DisplayText = "for item in iterable:",
                    Type = "snippet",
                    Description = "For loop pattern",
                    Score = 80,
                    InsertText = CommonPatterns["for_loop"]
                });
            }

            return suggestions;
        }

        private async Task<List<CompletionSuggestion>> GetJavaScriptCompletionsAsync(
            CompletionRequest request,
            string prefix,
            CancellationToken cancellationToken)
        {
            await Task.CompletedTask;

            var suggestions = new List<CompletionSuggestion>();

            // JavaScript keywords
            foreach (var keyword in JavaScriptKeywords)
            {
                if (keyword.StartsWith(prefix, StringComparison.OrdinalIgnoreCase))
                {
                    suggestions.Add(new CompletionSuggestion
                    {
                        Text = keyword,
                        DisplayText = keyword,
                        Type = "keyword",
                        Description = "JavaScript keyword",
                        Score = 70,
                        InsertText = keyword
                    });
                }
            }

            // Common JavaScript methods
            var commonMethods = new[] { "console.log", "forEach", "map", "filter", "reduce", "find", "includes" };
            foreach (var method in commonMethods)
            {
                if (method.StartsWith(prefix, StringComparison.OrdinalIgnoreCase))
                {
                    suggestions.Add(new CompletionSuggestion
                    {
                        Text = method,
                        DisplayText = method,
                        Type = "method",
                        Description = "JavaScript method",
                        Score = 80,
                        InsertText = method
                    });
                }
            }

            return suggestions;
        }

        private string ExtractPrefix(string code, int cursorPosition)
        {
            if (string.IsNullOrEmpty(code) || cursorPosition == 0)
                return string.Empty;

            var position = Math.Min(cursorPosition, code.Length);
            var start = position;

            // Move backward to find the start of the current word
            while (start > 0)
            {
                var ch = code[start - 1];
                if (!char.IsLetterOrDigit(ch) && ch != '_' && ch != '.')
                    break;
                start--;
            }

            return code.Substring(start, position - start);
        }
    }
}
